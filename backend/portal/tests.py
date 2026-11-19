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

        # Intern cannot access HR or Mentor endpoints
        self.client.force_authenticate(user=self.intern)
        self.assertEqual(self.client.get("/api/hr/dashboard/").status_code, 403)
        self.assertEqual(self.client.get("/api/mentor/dashboard/").status_code, 403)
        self.assertEqual(self.client.get("/api/intern/profile/").status_code, 200)

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

        # Mentor evaluates assignment as completed
        ev_res = self.client.post(
            f"/api/mentor/assignments/{assignment_id}/evaluate/",
            {"score": 96, "evaluation_notes": "Excellent forecasting model", "mark_completed": True},
            format="json",
        )
        self.assertEqual(ev_res.status_code, 200)
        self.assertEqual(ProjectAssignment.objects.get(id=assignment_id).status, ProjectAssignmentStatus.COMPLETED)

        # Intern requests certificate -> HR approves -> ReportLab PDF generated
        self.client.force_authenticate(user=self.intern)
        c_res = self.client.post("/api/intern/certificate/")
        self.assertEqual(c_res.status_code, 201)
        cert_id = c_res.data["id"]

        self.client.force_authenticate(user=self.hr)
        app_res = self.client.post(f"/api/hr/certificates/{cert_id}/approve/")
        self.assertEqual(app_res.status_code, 200)
        cert = Certificate.objects.get(id=cert_id)
        self.assertEqual(cert.status, "APPROVED")
        self.assertIsNotNone(cert.certificate_number)
        self.assertTrue(bool(cert.certificate_file))
