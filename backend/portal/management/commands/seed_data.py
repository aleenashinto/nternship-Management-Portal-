from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, time
from portal.models import (
    User, UserRole, Project, ProjectAssignment, ProjectAssignmentStatus,
    PresentationSchedule, Certificate, Notification
)

class Command(BaseCommand):
    help = 'Populates the database with realistic demo data across all 4 user roles.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding data...")

        # 1. Admin
        admin, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@portal.example.com',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': UserRole.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin.set_password('admin123')
        admin.save()

        # 2. HR Manager
        hr, _ = User.objects.get_or_create(
            username='hr_manager',
            defaults={
                'email': 'hr@portal.example.com',
                'first_name': 'Sarah',
                'last_name': 'Connor',
                'role': UserRole.HR,
                'phone': '+1 (555) 234-5678',
            }
        )
        hr.set_password('hr123')
        hr.save()

        # 3. Mentor
        mentor, _ = User.objects.get_or_create(
            username='lead_mentor',
            defaults={
                'email': 'mentor@portal.example.com',
                'first_name': 'David',
                'last_name': 'Miller',
                'role': UserRole.MENTOR,
                'phone': '+1 (555) 345-6789',
                'work_start_time': time(9, 0),
                'work_end_time': time(17, 30),
            }
        )
        mentor.set_password('mentor123')
        mentor.save()

        # 4. Interns
        intern1, _ = User.objects.get_or_create(
            username='intern_john',
            defaults={
                'email': 'john.doe@example.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'role': UserRole.INTERN,
                'phone': '+1 (555) 456-7890',
                'phone2': '+1 (555) 456-7891',
                'address': '742 Evergreen Terrace, Springfield',
                'education_qualification': 'B.S. in Computer Science (Senior Year)',
                'source': 'Direct',
                'assigned_mentor': mentor,
                'is_active_intern': True,
            }
        )
        intern1.set_password('intern123')
        intern1.assigned_mentor = mentor
        intern1.save()

        intern2, _ = User.objects.get_or_create(
            username='intern_emma',
            defaults={
                'email': 'emma.watson@example.com',
                'first_name': 'Emma',
                'last_name': 'Watson',
                'role': UserRole.INTERN,
                'phone': '+1 (555) 567-8901',
                'address': '12 Ocean Drive, Cambridge, MA',
                'education_qualification': 'M.S. in Data Analytics',
                'source': 'Campus Drive',
                'assigned_mentor': mentor,
                'is_active_intern': True,
            }
        )
        intern2.set_password('intern123')
        intern2.assigned_mentor = mentor
        intern2.save()

        intern3, _ = User.objects.get_or_create(
            username='intern_alex',
            defaults={
                'email': 'alex.smith@example.com',
                'first_name': 'Alex',
                'last_name': 'Smith',
                'role': UserRole.INTERN,
                'phone': '+1 (555) 678-9012',
                'address': '89 Silicon Blvd, San Jose, CA',
                'education_qualification': 'B.Tech in Information Technology',
                'source': 'Referral',
                'assigned_mentor': None,  # Intern without mentor
                'is_active_intern': True,
            }
        )
        intern3.set_password('intern123')
        intern3.save()

        # 5. Projects
        p1, _ = Project.objects.get_or_create(
            title="E-Commerce Customer Churn Prediction & Retention Analytics",
            defaults={
                'created_by': mentor,
                'tools_used': ['Python', 'SQL', 'Tableau', 'Excel'],
                'instructions': """1. Clean and preprocess customer transaction history.
2. Build a churn prediction classification model (e.g., Logistic Regression or Random Forest).
3. Identify top churn factors (inactivity, return frequency, support tickets).
4. Build an interactive retention dashboard with actionable cohort recommendations.""",
                'data_source_type': 'DATABASE',
                'data_source_description': 'PostgreSQL read replica: db.internship.local:5432/analytics_ecommerce (Table: customer_logs)',
            }
        )

        p2, _ = Project.objects.get_or_create(
            title="Financial Portfolio Risk & Monte Carlo Stress Testing",
            defaults={
                'created_by': mentor,
                'tools_used': ['Excel', 'Python', 'Power BI'],
                'instructions': """1. Fetch historical daily closing prices for S&P 500 tech equities.
2. Calculate annualized volatility, Sharpe ratio, and Value at Risk (VaR 95% & 99%).
3. Implement 10,000 iterations of Monte Carlo simulation.
4. Prepare executive summary presentation for risk committee review.""",
                'data_source_type': 'API',
                'data_source_description': 'Yahoo Finance API / AlphaVantage endpoints with standard daily interval.',
            }
        )

        today = timezone.now().date()

        # 6. Assignments
        # Emma: Completed project 2 with 94.50 score
        a_emma_completed, _ = ProjectAssignment.objects.get_or_create(
            project=p2,
            intern=intern2,
            defaults={
                'mentor': mentor,
                'assigned_date': today - timedelta(days=20),
                'due_date': today - timedelta(days=5),
                'status': ProjectAssignmentStatus.COMPLETED,
                'score': 94.50,
                'evaluation_notes': 'Exceptional modeling logic and crisp presentation of simulation percentiles.',
                'evaluated_at': timezone.now() - timedelta(days=4),
                'submitted_at': timezone.now() - timedelta(days=6),
                'submission_notes': 'Completed Jupyter notebook and executive slides attached.',
            }
        )

        # Emma: Submitted project 1 awaiting evaluation
        a_emma_submitted, _ = ProjectAssignment.objects.get_or_create(
            project=p1,
            intern=intern2,
            defaults={
                'mentor': mentor,
                'assigned_date': today - timedelta(days=14),
                'due_date': today + timedelta(days=2),
                'status': ProjectAssignmentStatus.SUBMITTED,
                'submitted_at': timezone.now() - timedelta(hours=6),
                'submission_notes': 'Model achieves 89% AUC-ROC. Tableau workbook packaged.',
            }
        )

        # John: In Progress project 1
        a_john_progress, _ = ProjectAssignment.objects.get_or_create(
            project=p1,
            intern=intern1,
            defaults={
                'mentor': mentor,
                'assigned_date': today - timedelta(days=7),
                'due_date': today + timedelta(days=4),
                'status': ProjectAssignmentStatus.IN_PROGRESS,
            }
        )

        # 7. Presentation Schedule
        PresentationSchedule.objects.get_or_create(
            project=p1,
            intern=intern2,
            defaults={
                'mentor': mentor,
                'assignment': a_emma_submitted,
                'presentation_date': today + timedelta(days=1),
                'presentation_time': time(14, 0),
                'google_meet_link': 'https://meet.google.com/abc-intern-demo',
                'status': 'SCHEDULED',
                'notes': 'Final walkthrough of customer churn dashboard and findings.',
            }
        )

        # 8. Certificate Request awaiting HR approval
        Certificate.objects.get_or_create(
            intern=intern2,
            status='PENDING',
            defaults={
                'request_date': timezone.now() - timedelta(hours=2),
            }
        )

        # 9. In-Portal Notifications
        Notification.objects.get_or_create(
            recipient=intern2,
            title="Project Evaluation Completed",
            defaults={
                'message': "Your mentor evaluated 'Financial Portfolio Risk & Monte Carlo Stress Testing'. Score: 94.5/100.",
                'notification_type': 'EVALUATION',
                'link': '/intern/projects',
                'is_read': False,
            }
        )

        Notification.objects.get_or_create(
            recipient=hr,
            title="New Certificate Request",
            defaults={
                'message': "Emma Watson has completed internship milestones and requested certificate approval.",
                'notification_type': 'CERTIFICATE_STATUS',
                'link': '/hr/certificates',
                'is_read': False,
            }
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully!"))
        self.stdout.write(self.style.SUCCESS("Users created:"))
        self.stdout.write("  Admin:      admin / admin123")
        self.stdout.write("  HR Manager: hr_manager / hr123")
        self.stdout.write("  Mentor:     lead_mentor / mentor123")
        self.stdout.write("  Intern 1:   intern_john / intern123")
        self.stdout.write("  Intern 2:   intern_emma / intern123")
        self.stdout.write("  Intern 3:   intern_alex / intern123 (No mentor)")
