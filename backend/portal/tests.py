from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from datetime import timedelta
from .models import (
    User, UserRole, Project, ProjectAssignment, ProjectAssignmentStatus,
    ExtensionRequest, PresentationSchedule, Certificate, Notification
)
from .tasks import send_daily_deadline_reminders


class InternshipPortalEndToEndTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            username="admin_test", email="admin@test.local", password="password123", role=UserRole.ADMIN
        )
        self.hr = User.objects.create_user(
            username="hr_test", email="hr@test.local", password="password123", role=UserRole.HR
        )
        self.mentor = User.objects.create_user(
            username="mentor_test",
            email="mentor@test.local",
            password="password123",
            role=UserRole.MENTOR,
            first_name="David",
            last_name="Mentor",
            phone="+1 555-0100",
        )
        self.intern = User.objects.create_user(
            username="intern_test",
            email="intern@test.local",
            password="password123",
            role=UserRole.INTERN,
            first_name="Emma",
            last_name="Intern",
            assigned_mentor=self.mentor,
        )

    def test_openapi_schema_and_swagger_docs_endpoints(self):
        res_schema = self.client.get("/api/schema/")
        self.assertEqual(res_schema.status_code, 200)
        self.assertEqual(res_schema.json()["openapi"], "3.0.3")

        res_docs = self.client.get("/api/docs/")
        self.assertEqual(res_docs.status_code, 200)

    def test_rbac_enforcement_across_roles(self):
        # Unauthenticated request rejected
        self.assertEqual(self.client.get("/api/hr/dashboard/").status_code, 401)

        # Intern cannot access HR or Mentor endpoints, nor escalate own role via PATCH /api/auth/me/
        self.client.force_authenticate(user=self.intern)
        self.assertEqual(self.client.get("/api/hr/dashboard/").status_code, 403)
        self.assertEqual(self.client.get("/api/mentor/dashboard/").status_code, 403)
        self.assertEqual(self.client.get("/api/intern/profile/").status_code, 200)
        me_patch = self.client.patch("/api/auth/me/", {"role": "ADMIN"}, format="json")
        self.assertEqual(me_patch.status_code, 200)
        self.intern.refresh_from_db()
        self.assertEqual(self.intern.role, UserRole.INTERN)

        # Mentor cannot assign a project to an intern belonging to another mentor
        other_mentor = User.objects.create_user(
            username="other_mentor", email="other@test.local", password="password123", role=UserRole.MENTOR
        )
        proj = Project.objects.create(created_by=other_mentor, title="P", instructions="I")
        self.client.force_authenticate(user=other_mentor)
        cross_assign = self.client.post(
            "/api/mentor/assignments/",
            {"project": proj.id, "intern": self.intern.id, "due_date": str(timezone.now().date())},
            format="json",
        )
        self.assertEqual(cross_assign.status_code, 403)

    def test_hr_mentor_and_intern_full_crud(self):
        self.client.force_authenticate(user=self.hr)

        # 1. HR Creates a new Mentor
        m_res = self.client.post(
            "/api/hr/mentors/",
            {
                "username": "new_mentor",
                "password": "password123",
                "first_name": "Noah",
                "last_name": "Lead",
                "email": "noah@test.local",
                "phone": "9998887776",
            },
            format="json",
        )
        self.assertEqual(m_res.status_code, 201)
        new_mentor_id = m_res.data["id"]

        # 2. HR Updates Mentor
        u_res = self.client.patch(
            f"/api/hr/mentors/{new_mentor_id}/",
            {"phone": "1112223334"},
            format="json",
        )
        self.assertEqual(u_res.status_code, 200)
        self.assertEqual(u_res.data["phone"], "1112223334")

        # 3. HR Registers a new Intern
        i_res = self.client.post(
            "/api/hr/interns/",
            {
                "username": "new_intern",
                "first_name": "Aarav",
                "last_name": "Sharma",
                "email": "aarav@test.local",
                "phone": "9876543210",
                "address": "Kochi",
                "education_qualification": "B.Tech",
                "source": "Direct",
                "assigned_mentor": new_mentor_id,
            },
            format="json",
        )
        self.assertEqual(i_res.status_code, 201)
        new_intern_id = i_res.data["id"]
        self.assertEqual(User.objects.get(id=new_mentor_id).assigned_intern_count, 1)

        # 4. HR Updates Intern
        iu_res = self.client.patch(
            f"/api/hr/interns/{new_intern_id}/",
            {"education_qualification": "M.Tech Data Science"},
            format="json",
        )
        self.assertEqual(iu_res.status_code, 200)
        self.assertEqual(iu_res.data["education_qualification"], "M.Tech Data Science")

        # 5. HR Deletes Intern and Mentor
        self.assertEqual(self.client.delete(f"/api/hr/interns/{new_intern_id}/").status_code, 204)
        self.assertEqual(self.client.delete(f"/api/hr/mentors/{new_mentor_id}/").status_code, 204)

    def test_project_lifecycle_reminders_and_certificate_pdf_generation(self):
        # Mentor creates project and assigns to intern due tomorrow
        self.client.force_authenticate(user=self.mentor)
        p_res = self.client.post(
            "/api/mentor/projects/",
            {
                "title": "Sales Forecasting",
                "tools_used": ["Python", "SQL"],
                "instructions": "Forecast Q4 sales",
                "data_source_type": "DATABASE",
                "data_source_description": "postgres://db/sales",
            },
            format="json",
        )
        self.assertEqual(p_res.status_code, 201)
        project_id = p_res.data["id"]

        tomorrow = timezone.now().date() + timedelta(days=1)
        a_res = self.client.post(
            "/api/mentor/assignments/",
            {
                "project": project_id,
                "intern": self.intern.id,
                "assigned_date": str(timezone.now().date()),
                "due_date": str(tomorrow),
            },
            format="json",
        )
        self.assertEqual(a_res.status_code, 201)
        assignment_id = a_res.data["id"]

        # Daily 09:00 AM reminder task finds assignment due tomorrow and notifies intern
        reminder_stats = send_daily_deadline_reminders()
        self.assertEqual(reminder_stats["sent"], 1)
        self.assertTrue(
            Notification.objects.filter(recipient=self.intern, notification_type="DEADLINE_REMINDER").exists()
        )

        # Score out of bounds (-1 or 105) is rejected with 400
        bad_ev = self.client.post(
            f"/api/mentor/assignments/{assignment_id}/evaluate/",
            {"score": 105, "evaluation_notes": "Invalid score"},
            format="json",
        )
        self.assertEqual(bad_ev.status_code, 400)

        # Mentor evaluates assignment as completed
        ev_res = self.client.post(
            f"/api/mentor/assignments/{assignment_id}/evaluate/",
            {"score": 96, "evaluation_notes": "Excellent forecasting model", "mark_completed": True},
            format="json",
        )
        self.assertEqual(ev_res.status_code, 200)
        self.assertEqual(ProjectAssignment.objects.get(id=assignment_id).status, ProjectAssignmentStatus.COMPLETED)

        # Mentor marks overall internship completed -> triggers unique PENDING certificate request for HR
        comp_res = self.client.post(f"/api/mentor/interns/{self.intern.id}/complete-internship/")
        self.assertEqual(comp_res.status_code, 201)
        cert_id = comp_res.data["id"]

        # Duplicate completion call is rejected (prevents duplicate certificate requests)
        dup_res = self.client.post(f"/api/mentor/interns/{self.intern.id}/complete-internship/")
        self.assertEqual(dup_res.status_code, 400)

        self.client.force_authenticate(user=self.hr)
        app_res = self.client.post(f"/api/hr/certificates/{cert_id}/approve/")
        self.assertEqual(app_res.status_code, 200)
        cert = Certificate.objects.get(id=cert_id)
        self.assertEqual(cert.status, "APPROVED")
        self.assertIsNotNone(cert.certificate_number)
        self.assertTrue(bool(cert.certificate_file))

    def test_website_branding_and_theme_lifecycle(self):
        # 1. Public config endpoint accessible without authentication
        pub_res = self.client.get("/api/public/website-config/")
        self.assertEqual(pub_res.status_code, 200)
        self.assertEqual(pub_res.data["branding"]["site_name"], "Beat Internship Portal")
        self.assertEqual(pub_res.data["theme"]["theme_name"], "Default Professional")
        self.assertEqual(pub_res.data["theme"]["primary_color"], "#2563EB")

        # 2. Non-admin users (HR, Mentor, Intern) cannot access admin branding/theme APIs
        self.client.force_authenticate(user=self.hr)
        self.assertEqual(self.client.get("/api/admin/branding/").status_code, 403)
        self.assertEqual(self.client.get("/api/admin/theme/").status_code, 403)

        # 3. Admin saves a draft theme -> must NOT affect public website config
        self.client.force_authenticate(user=self.admin)
        draft_res = self.client.post(
            "/api/admin/theme/draft/",
            {
                "theme_name": "Royal Purple",
                "primary_color": "#7C3AED",
                "secondary_color": "#6D28D9",
                "font_family": "Poppins",
            },
            format="json",
        )
        self.assertEqual(draft_res.status_code, 200)
        self.assertEqual(draft_res.data["draft"]["primary_color"], "#7C3AED")

        pub_after_draft = self.client.get("/api/public/website-config/")
        self.assertEqual(pub_after_draft.data["theme"]["primary_color"], "#2563EB")

        # 4. Admin publishes the theme -> public website config updates immediately
        publish_res = self.client.post(
            "/api/admin/theme/publish/",
            {
                "theme_name": "Royal Purple",
                "primary_color": "#7C3AED",
                "secondary_color": "#6D28D9",
                "font_family": "Poppins",
            },
            format="json",
        )
        self.assertEqual(publish_res.status_code, 200)
        pub_after_publish = self.client.get("/api/public/website-config/")
        self.assertEqual(pub_after_publish.data["theme"]["primary_color"], "#7C3AED")
        self.assertEqual(pub_after_publish.data["theme"]["font_family"], "Poppins")

        # 5. Admin attempts unsafe SVG upload containing <script> -> rejected with 400
        unsafe_res = self.client.post(
            "/api/admin/branding/upload/",
            {
                "variant": "primary_logo",
                "data_url": "data:image/svg+xml,<svg><script>alert(1)</script></svg>",
            },
            format="json",
        )
        self.assertEqual(unsafe_res.status_code, 400)

        # 6. Admin updates valid logo & site name
        valid_res = self.client.post(
            "/api/admin/branding/upload/",
            {
                "variant": "primary_logo",
                "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            },
            format="json",
        )
        self.assertEqual(valid_res.status_code, 200)
        self.assertTrue(valid_res.data["branding"]["primary_logo"].startswith("data:image/png;base64,"))

        # 7. Admin resets logo and theme to default
        reset_logo = self.client.delete("/api/admin/branding/logo/", {"variant": "all"}, format="json")
        self.assertEqual(reset_logo.status_code, 200)
        self.assertEqual(reset_logo.data["branding"]["primary_logo"], "/beat-logo.png")

        reset_theme = self.client.post("/api/admin/theme/reset/")
        self.assertEqual(reset_theme.status_code, 200)
        self.assertEqual(reset_theme.data["theme"]["primary_color"], "#2563EB")

    def test_hr_intern_management_and_csv_excel_bulk_import_suite(self):
        import io
        import openpyxl
        from django.core.files.uploadedfile import SimpleUploadedFile

        # 14. Verify HR permissions (Intern and Mentor cannot access HR import/export endpoints)
        self.client.force_authenticate(user=self.intern)
        self.assertEqual(self.client.get("/api/hr/interns/import/history/").status_code, 403)
        self.assertEqual(self.client.get("/api/hr/interns/export/").status_code, 403)

        self.client.force_authenticate(user=self.hr)

        # 1. Add one intern manually with all new fields
        manual_res = self.client.post(
            "/api/hr/interns/",
            {
                "full_name": "Priya Nair",
                "email": "priya.nair@test.local",
                "phone": "+91 9876543210",
                "gender": "Female",
                "college": "IIT Madras",
                "course": "B.Tech Data Science",
                "department": "Data Analytics",
                "internship_role": "Data Analytics Intern",
                "start_date": "2026-06-01",
                "end_date": "2026-08-24",
                "assigned_mentor": self.mentor.id,
                "hr_contact": self.hr.id,
                "status": "Active",
                "address": "Chennai, TN",
            },
            format="json",
        )
        self.assertEqual(manual_res.status_code, 201)
        self.assertTrue(manual_res.data["intern_code"].startswith("INT-"))
        self.assertIn("12 weeks", manual_res.data["internship_duration"])
        self.assertEqual(manual_res.data["status"], "Active")

        # Change Status action
        status_res = self.client.post(
            f"/api/hr/interns/{manual_res.data['id']}/change-status/",
            {"status": "Onboarding"},
            format="json",
        )
        self.assertEqual(status_res.status_code, 200)
        self.assertEqual(status_res.data["status"], "Onboarding")

        # 2. Import 10 interns through CSV
        csv_lines = [
            "Full Name,Email,Phone,Gender,College,Course,Department,Internship Role,Start Date,End Date,Assigned Mentor,Status,Address"
        ]
        for idx in range(1, 11):
            csv_lines.append(
                f"CSV Intern {idx},csv_intern_{idx}@test.local,+1 555-01{idx:02d},Male,MIT,M.S. Analytics,Data Analytics,Data Analyst Intern,2026-07-01,2026-09-30,David Mentor,Active,Boston MA"
            )
        csv_file = SimpleUploadedFile(
            "ten_interns.csv",
            "\n".join(csv_lines).encode("utf-8"),
            content_type="text/csv",
        )
        prev_csv = self.client.post("/api/hr/interns/import/preview/", {"file": csv_file}, format="multipart")
        self.assertEqual(prev_csv.status_code, 200)
        self.assertEqual(prev_csv.data["total_records"], 10)
        self.assertEqual(prev_csv.data["validation"]["valid_count"], 10)

        conf_csv = self.client.post(
            "/api/hr/interns/import/confirm/",
            {
                "rows": prev_csv.data["raw_rows"],
                "column_mapping": prev_csv.data["column_mapping"],
                "file_name": "ten_interns.csv",
                "file_type": "CSV",
                "skip_invalid": True,
                "duplicate_action": "skip",
            },
            format="json",
        )
        self.assertEqual(conf_csv.status_code, 200)
        self.assertEqual(conf_csv.data["successful_records"], 10)

        # 3. Import 100 interns through Excel (.xlsx)
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append([
            "Full Name", "Email", "Phone", "College", "Course",
            "Department", "Internship Role", "Start Date", "End Date",
            "Assigned Mentor", "Status"
        ])
        for idx in range(1, 101):
            ws.append([
                f"Excel Intern {idx}",
                f"excel_intern_{idx}@test.local",
                f"+1 555-80{idx:03d}",
                "Stanford University",
                "B.S. Computer Science",
                "Software Engineering",
                "SWE Intern",
                "2026-06-15",
                "2026-09-15",
                "David Mentor",
                "Selected",
            ])
        xlsx_buf = io.BytesIO()
        wb.save(xlsx_buf)
        xlsx_buf.seek(0)
        xlsx_file = SimpleUploadedFile(
            "hundred_interns.xlsx",
            xlsx_buf.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        prev_xlsx = self.client.post("/api/hr/interns/import/preview/", {"file": xlsx_file}, format="multipart")
        self.assertEqual(prev_xlsx.status_code, 200)
        self.assertEqual(prev_xlsx.data["total_records"], 100)
        self.assertEqual(prev_xlsx.data["validation"]["valid_count"], 100)

        conf_xlsx = self.client.post(
            "/api/hr/interns/import/confirm/",
            {
                "rows": prev_xlsx.data["raw_rows"],
                "column_mapping": prev_xlsx.data["column_mapping"],
                "file_name": "hundred_interns.xlsx",
                "file_type": "XLSX",
                "skip_invalid": True,
                "duplicate_action": "skip",
            },
            format="json",
        )
        self.assertEqual(conf_xlsx.status_code, 200)
        self.assertEqual(conf_xlsx.data["successful_records"], 100)

        # 4, 5, 6, 7, 8, 9, 11, 15. Test different column headings, missing fields, duplicate emails,
        # invalid email format, incorrect date format, start > end date, transactional abort, and skip_invalid
        mixed_rows = [
            # Row 1: Valid with custom column headings
            {
                "Candidate Name": "Custom Header Intern",
                "Candidate Email": "custom.header@test.local",
                "Mobile Number": "+1 555-9001",
                "University": "UC Berkeley",
                "Degree": "M.S. AI",
                "Domain": "Artificial Intelligence & ML",
                "Track": "ML Intern",
                "Joining Date": "2026-07-01",
                "Completion Date": "2026-10-01",
                "Team Lead": "David Mentor",
                "Current Status": "Onboarding",
            },
            # Row 2: Missing required fields (missing email and phone)
            {
                "Candidate Name": "Missing Fields User",
                "Candidate Email": "",
                "Mobile Number": "",
                "Domain": "Data Analytics",
            },
            # Row 3: In-file duplicate email (same as Row 1)
            {
                "Candidate Name": "Duplicate In File",
                "Candidate Email": "custom.header@test.local",
                "Mobile Number": "+1 555-9002",
                "Domain": "Data Analytics",
            },
            # Row 4: Invalid email address
            {
                "Candidate Name": "Bad Email User",
                "Candidate Email": "not-an-email-address",
                "Mobile Number": "+1 555-9003",
                "Domain": "Data Analytics",
            },
            # Row 5: Incorrect date format and start > end date
            {
                "Candidate Name": "Bad Date User",
                "Candidate Email": "baddate@test.local",
                "Mobile Number": "+1 555-9004",
                "Domain": "Data Analytics",
                "Joining Date": "2026-12-01",
                "Completion Date": "2026-06-01",
            },
            # Row 6: Existing DB duplicate (priya.nair@test.local)
            {
                "Candidate Name": "Priya Nair Updated",
                "Candidate Email": "priya.nair@test.local",
                "Mobile Number": "+91 9876500000",
                "University": "IIT Bombay",
                "Degree": "M.Tech AI",
                "Domain": "Artificial Intelligence & ML",
                "Current Status": "Active",
            },
        ]

        val_res = self.client.post(
            "/api/hr/interns/import/validate/",
            {"rows": mixed_rows},
            format="json",
        )
        self.assertEqual(val_res.status_code, 200)
        self.assertEqual(val_res.data["total_records"], 6)
        self.assertEqual(val_res.data["valid_count"], 1)
        self.assertEqual(val_res.data["invalid_count"], 4)
        self.assertEqual(val_res.data["in_file_duplicate_count"], 1)
        self.assertEqual(val_res.data["db_duplicate_count"], 1)
        self.assertEqual(val_res.data["missing_required_count"], 1)

        # 15. Verify failed import with skip_invalid=False does NOT create partial records
        count_before_abort = User.objects.filter(role=UserRole.INTERN).count()
        abort_res = self.client.post(
            "/api/hr/interns/import/confirm/",
            {
                "rows": mixed_rows,
                "file_name": "mixed_abort.csv",
                "file_type": "CSV",
                "skip_invalid": False,
                "duplicate_action": "skip",
            },
            format="json",
        )
        self.assertEqual(abort_res.status_code, 400)
        self.assertEqual(User.objects.filter(role=UserRole.INTERN).count(), count_before_abort)

        # 9 & 11. Import with skip_invalid=True and duplicate_action='skip' -> imports 1 valid, skips 1 DB dup, fails 4 with error report
        skip_res = self.client.post(
            "/api/hr/interns/import/confirm/",
            {
                "rows": mixed_rows,
                "file_name": "mixed_skip.csv",
                "file_type": "CSV",
                "skip_invalid": True,
                "duplicate_action": "skip",
            },
            format="json",
        )
        self.assertEqual(skip_res.status_code, 200)
        self.assertEqual(skip_res.data["successful_records"], 1)
        self.assertEqual(skip_res.data["skipped_records"], 1)
        self.assertEqual(skip_res.data["failed_records"], 4)
        self.assertEqual(len(skip_res.data["failed_rows"]), 4)
        self.assertTrue(all("error_reason" in r for r in skip_res.data["failed_rows"]))

        # 10. Update existing records requires explicit confirmation
        unconfirmed_update = self.client.post(
            "/api/hr/interns/import/confirm/",
            {
                "rows": [mixed_rows[5]],
                "file_name": "update_priya.csv",
                "file_type": "CSV",
                "skip_invalid": True,
                "duplicate_action": "update",
                "confirm_update_existing": False,
            },
            format="json",
        )
        self.assertEqual(unconfirmed_update.status_code, 400)

        confirmed_update = self.client.post(
            "/api/hr/interns/import/confirm/",
            {
                "rows": [mixed_rows[5]],
                "file_name": "update_priya.csv",
                "file_type": "CSV",
                "skip_invalid": True,
                "duplicate_action": "update",
                "confirm_update_existing": True,
            },
            format="json",
        )
        self.assertEqual(confirmed_update.status_code, 200)
        self.assertEqual(confirmed_update.data["updated_records"], 1)
        priya_db = User.objects.get(email="priya.nair@test.local")
        self.assertEqual(priya_db.college, "IIT Bombay")

        # 12. View import history
        hist_res = self.client.get("/api/hr/interns/import/history/")
        self.assertEqual(hist_res.status_code, 200)
        self.assertGreaterEqual(len(hist_res.data), 4)

        # 13. Export intern records (CSV & XLSX)
        exp_csv = self.client.get("/api/hr/interns/export/?format=csv")
        self.assertEqual(exp_csv.status_code, 200)
        self.assertIn("text/csv", exp_csv["Content-Type"])
        self.assertIn("Priya Nair Updated", exp_csv.content.decode("utf-8"))

        exp_xlsx = self.client.get("/api/hr/interns/export/?format=xlsx")
        self.assertEqual(exp_xlsx.status_code, 200)
        self.assertIn("spreadsheetml.sheet", exp_xlsx["Content-Type"])


