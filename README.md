# Internship Management Portal

A full-stack, enterprise-grade **Internship Management Portal** built with a **Python Django REST Framework** backend and a **React (Vite + Tailwind CSS)** frontend.

The system features robust role-based access control (RBAC), multi-role dashboards, end-to-end project assignment workflows, automated email & in-portal notifications, and vector PDF completion certificate generation.

---

## 🏛️ System Architecture

```
intern/
├── backend/                  # Python Django Backend
│   ├── internship_backend/   # Project settings, URLs, WSGI
│   ├── portal/               # Core application
│   │   ├── models.py         # User, Project, ProjectAssignment, ExtensionRequest, PresentationSchedule, Certificate, Notification
│   │   ├── serializers.py    # DRF Serializers with field validations
│   │   ├── views.py          # ViewSets & APIViews for HR, Mentor, Intern, and Admin
│   │   ├── services.py       # ReportLab PDF Generator & Automated Email Notification service
│   │   ├── urls.py           # REST API endpoints & JWT Auth routing
│   │   └── management/       # `seed_data` management command
│   ├── media/                # Uploaded datasets, PDF guidelines, and generated certificates
│   └── manage.py
├── frontend/                 # React (Vite + Tailwind CSS v4 + Lucide)
│   ├── src/
│   │   ├── api/client.js     # Axios client with JWT interceptor & auto-token refresh
│   │   ├── context/          # AuthContext for role-based authentication
│   │   ├── components/       # Navbar, Sidebar, Modal, NotificationDropdown, ProtectedRoute
│   │   └── pages/            # Role-specific modules
│   │       ├── Login.jsx
│   │       ├── hr/           # HRDashboard, MentorsList, InternsList, CertificatesList
│   │       ├── mentor/       # MentorDashboard, MentorProjects, MentorInterns, MentorAssignments, MentorExtensions, MentorPresentations
│   │       └── intern/       # InternDashboard, InternProjects, InternPresentations, InternCertificate
│   ├── package.json
│   └── vite.config.js        # API & Media reverse-proxy configuration
└── README.md
```

---

## 👥 User Roles & Key Features

### 1. HR Manager Module
- **KPI Dashboard**: Displays Total Mentors, Total Interns, Active Interns, Interns without Assigned Mentors, Total Projects Assigned, Completed Projects, Pending Projects, Overdue Projects, and Pending Certificate Approvals.
- **Dedicated Certification Section**: Dedicated queue directly on the HR dashboard displaying certificate requests awaiting review.
- **Create Mentor Accounts**: Form capturing Username, Initial Password, Name, Email, Phone, Work Starting Time, Work Ending Time, and automatically calculated assigned intern count.
- **Register Interns**: Form capturing Name, Phone 1, Phone 2 (Optional), Email, Residential Address, Educational Qualification, Source (Direct, Campus Drive, Referral, Other), and optional initial mentor assignment.
- **Assign / Reassign Mentors**: Assign or reassign interns between mentors; the system automatically recalculates the mentor's assigned intern count.
- **Certificate Approval**: HR can approve or reject certificate requests with detailed feedback. Approving issues an official, cryptographically verified PDF completion certificate.

### 2. Mentor (Team Lead) Module
- **Mentor-Scoped Dashboard**: KPIs restricted strictly to interns assigned to the authenticated mentor (Assigned Interns, Active Interns, Projects Assigned, Completed, Pending, Overdue, Awaiting Evaluation, Upcoming Presentations).
- **Project Template Repository**: Create and edit reusable project guidelines. Supports multi-selection of tools (`Excel`, `SQL`, `Power BI`, `Tableau`, `Python`, `Other`), text instructions, PDF guideline uploads, and flexible data sources (File upload, API endpoint, or Database connection string).
- **View Interns & Individual Profiles**: Mentors can view only their assigned interns. Clicking an intern displays their full personal details, educational qualifications, project submission status, scores, completion history, and presentation schedules.
- **Assign Projects**: Assign projects to specific interns with custom assigned and due dates. Separate progress records are maintained per intern.
- **Review Extension Requests**: Review deadline extension requests submitted by interns with reasons. If approved, specify the revised due date, which automatically updates the project assignment deadline.
- **Schedule Presentations**: Schedule project demo sessions with intern selection, project, date, time, and Google Meet URL. Supports rescheduling and cancellation.
- **Project Evaluation**: Review submitted project files and notes, assign a score (0 to 100), and mark as completed or request revision.

### 3. Intern Module
- **Profile & Progress Overview**: View personal details, educational qualification, assigned mentor, assignment progress bar, and average score.
- **Assigned Projects**: Access guidelines, download datasets and PDF instruction documents, track deadlines and real-time statuses (`Assigned`, `In Progress`, `Submitted`, `Under Review`, `Revision Required`, `Completed`, `Overdue`).
- **Submit Project Files**: Upload completed deliverables (`.zip`, `.py`, `.pbix`, `.pdf`, etc.) along with submission notes; records exact submission timestamps.
- **Request Submission Extension**: Submit deadline extension requests with a valid reason and target date. Track whether the request is `Pending`, `Approved`, or `Rejected`.
- **View Presentation Schedule**: View upcoming and completed presentation times with one-click Google Meet join links.
- **Download Official Certificate**: Request certificate upon completing project requirements, and download the official completion PDF once approved by HR.

### 4. Common Notification Module
- **In-Portal Notifications**: Bell notification dropdown for all roles with unread badges, timestamping, direct action navigation, and "Mark all read" capabilities.
- **Automated Email Notifications**: Automatically dispatches notification emails for:
  1. New intern registration (welcome email with credentials)
  2. New project assignment (details & deadline)
  3. One day before project due date (deadline reminder)
  4. Certificate approval / rejection (with certificate access details)

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

---

### Step 1: Run the Backend (Django)

Open a terminal in `c:\intern\backend`:

```powershell
cd c:\intern\backend

# 1. Run migrations (already generated)
py manage.py migrate

# 2. Populate demo accounts and data
py manage.py seed_data

# 3. Start Django development server on port 8000
py manage.py runserver 127.0.0.1:8000
```

The Django REST API will run at `http://127.0.0.1:8000/api/` and the Django Admin panel at `http://127.0.0.1:8000/admin/`.

---

### Step 2: Run the Frontend (React + Vite)

Open a second terminal in `c:\intern\frontend`:

```powershell
cd c:\intern\frontend

# Start Vite dev server on port 5173
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 🔑 Pre-Seeded Demo Accounts

The login page features convenient **One-Click Demo Login** buttons, or you can enter the credentials manually:

| Role | Username | Password | Purpose / Notes |
| :--- | :--- | :--- | :--- |
| **HR Manager** | `hr_manager` | `hr123` | Full HR KPI dashboard, mentor allocation, intern registry, certificate approvals |
| **Mentor (Team Lead)** | `lead_mentor` | `mentor123` | Scoped mentor dashboard, create projects, assign projects, evaluations, extensions |
| **Intern (Emma)** | `intern_emma` | `intern123` | Completed project with 94.5 score; pending certificate request awaiting HR review |
| **Intern (John)** | `intern_john` | `intern123` | Active intern with in-progress project assignment |
| **Intern (Alex)** | `intern_alex` | `intern123` | Intern without assigned mentor (tests HR unassigned KPI & allocation) |
| **Administrator** | `admin` | `admin123` | Unrestricted superuser access to all modules and Django admin |

---

## 📄 Certificate Generation Architecture

When an HR Manager approves an intern's certificate, the backend triggers `generate_certificate_pdf` using `reportlab`:
- Generates a 300 DPI high-resolution landscape certificate.
- Applies an official deep blue and gold border with security watermark.
- Incorporates the intern's verified name, completed projects count, educational qualification, and unique certificate ID (e.g. `CERT-20261116-XXXXXX`).
- Places lead mentor and HR approval signature blocks.
- Stores the PDF under `backend/media/certificates/` and links it for instant download.

---

## 📡 REST API Reference Summary

- `POST /api/auth/login/` - JWT access & refresh token authentication
- `GET /api/auth/me/` - Authenticated user profile
- `GET /api/hr/dashboard/` - HR KPIs and pending certification queue
- `GET|POST /api/hr/mentors/` - List and create mentor accounts
- `GET|POST /api/hr/interns/` - List and register intern profiles
- `POST /api/hr/interns/<id>/assign-mentor/` - Assign or reassign mentor
- `GET /api/hr/certificates/` - Certificate requests history
- `POST /api/hr/certificates/<id>/approve/` - Approve and generate PDF certificate
- `POST /api/hr/certificates/<id>/reject/` - Reject certificate request
- `GET /api/mentor/dashboard/` - Mentor-scoped KPI metrics
- `GET|POST|PATCH /api/mentor/projects/` - Create and edit project templates
- `GET /api/mentor/interns/` - List assigned interns
- `GET /api/mentor/interns/<id>/` - Individual intern profile and submission history
- `POST /api/mentor/assignments/` - Assign project to intern
- `POST /api/mentor/assignments/<id>/evaluate/` - Evaluate submission & assign score
- `POST /api/mentor/extensions/<id>/respond/` - Approve/reject extension request
- `GET|POST|PATCH /api/mentor/presentations/` - Schedule & reschedule presentations
- `GET /api/intern/profile/` - Intern profile, stats, and milestones
- `POST /api/intern/assignments/<id>/submit/` - Upload completed project files
- `POST /api/intern/extensions/` - Request deadline extension
- `POST /api/intern/certificate/` - Submit certificate approval request
- `GET /api/notifications/` - In-portal notifications with unread counter
- `POST /api/reminders/check/` - Trigger deadline reminders (1 day before due date)
