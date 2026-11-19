# PHASE 1: REQUIREMENTS SPECIFICATION (FRD v1)

## 1. System Purpose & Core Design Principles

The **Internship Management Portal** is an enterprise SaaS web application that manages the end-to-end internship lifecycle across four roles (**Admin**, **HR Manager**, **Mentor (Team Lead)**, and **Intern**) and eleven functional modules.

### Core Invariants (Non-Negotiable Business Rules)
1. **Projects vs. Project Assignments (`BR-01`)**: `Project` (reusable template created by a Mentor) and `ProjectAssignment` (an instance assigned to one Intern with its own `assignedDate`, `dueDate`, `status`, `score`, submissions, evaluations, and extensions) are distinct database entities.
2. **Project Completion vs. Internship Completion (`BR-02`)**: Completing one or all assigned projects **never** automatically marks the overall `Internship` completed. Only the assigned Mentor (or Admin) can explicitly mark an overall internship completed.
3. **Append-Only Historical Records (`BR-03`)**: Nothing is overwritten. `Submission` versions (`v1, v2, ...`), `Evaluation` records, `CorrectionRequest` records, `ExtensionRequest` records, and dated `MentorNote` records are stored as immutable historical rows.
4. **Unified Idempotent Event Dispatcher (`BR-04`)**: In-portal `Notification` rows and automated `EmailLog` deliveries originate from the same domain event (`eventId`) and are deduplicated per `(eventId, recipient)`.
5. **Controlled Certificate Workflow (`BR-05`)**: When a Mentor marks an internship completed, the system automatically creates **one** `CertificateRequest` (enforced by a unique constraint on `internshipId`) and notifies HR. The PDF certificate and unique certificate number are generated **only after HR approval** using the Admin-configurable `CertificateTemplate`.
6. **Comprehensive Audit Trail (`BR-06`)**: Every user account action, mentor allocation, project create/edit, assignment, extension request/decision, submission/resubmission, evaluation/correction, presentation schedule change, mentor note, internship completion, and certificate decision is recorded in `ActivityLog` with user, action, entity, timestamp, and metadata.

---

## 2. User Roles & Permission Matrix

| Capability / Module | Admin | HR Manager | Mentor (Team Lead) | Intern |
|---------------------|-------|------------|--------------------|--------|
| Create/Edit/Activate/Deactivate HR & Mentor accounts | Yes | Read/Manage Mentors | No | No |
| Cross-Mentor Access Grants (`MentorAccessGrant`) | Full CRUD | No | Read own grants | No |
| Configure Certificate PDF Template (`CertificateTemplate`) | Full CRUD | Read | No | No |
| Register Intern (auto-creates User + Welcome Email) | View all | Full CRUD | View own interns | View self |
| Assign / Reassign Mentor to Intern (no upper cap) | Yes | Yes | No | No |
| Create / Edit Reusable Projects & Upload Project Files | All | View | Own projects CRUD | View assigned |
| Assign Project to Intern (independent dates) | All | View | Own interns | View own |
| Upload Versioned Project Submissions (`v1, v2, ...`) | View | View | View & download | Own assignments |
| Evaluate Submission (`0-100`, Complete or Request Correction) | Yes | View | Own interns | Read-only view |
| Request Deadline Extension / Approve & Revise Due Date | Decide | View | Decide (own interns) | Request (own) |
| Schedule / Reschedule / Cancel Presentations (Google Meet) | All | View | Own interns | View own schedule |
| Add Immutable Dated Mentor Notes (`MentorNote`) | View | View | Add & view (own interns) | Read own notes |
| Mark Overall Internship Completed (triggers `CertificateRequest`) | Yes | No | Yes (own interns) | No |
| Approve / Reject Certificate Request (generates PDF on approval) | Yes | Yes | No | Download own approved PDF |
| View Activity & Audit Logs (`ActivityLog`) | Full filterable view | No | No | No |

---

## 3. All 11 Functional Modules & Notification Triggers

1. **Module 1 – Authentication & User Management**: JWT/session authentication, password hashing, forced password change on first login (`mustChangePassword`), account activation/deactivation, rate limiting, role guards.
2. **Module 2 – HR Management**: Intern registration (name, primary phone, optional secondary phone, email, address, qualification, source `DIRECT|OTHER`), automatic login creation (`username = email`), welcome email, mentor allocation/reassignment, dedicated certification approval section.
3. **Module 3 – Mentor Management**: Scoped mentor dashboard, assigned interns list, full individual intern profile, immutable dated mentor notes, explicit overall internship completion.
4. **Module 4 – Intern Management**: Personal profile, assigned mentor info, project vs. overall internship completion status, extension tracking, mentor remarks, certificate download.
5. **Module 5 – Project Management**: Reusable projects with title, multi-select tools (`Excel`, `SQL`, `Power BI`, `Tableau`, `Python`, `Other`), instructions, data source (file upload or text/API/DB description), instruction PDF upload.
6. **Module 6 – Project Assignment Management**: Assign project to intern with `assignedDate` and `dueDate`, 8 statuses (`ASSIGNED`, `IN_PROGRESS`, `SUBMITTED`, `UNDER_REVIEW`, `REVISION_REQUIRED`, `RESUBMITTED`, `COMPLETED`, `OVERDUE`), extension workflow updating active `dueDate`, automatic overdue transition.
7. **Module 7 – Project Submission & Evaluation**: Private file upload, versioned submissions, mentor score (`0..100`), feedback, completion or correction request loop.
8. **Module 8 – Presentation Scheduling**: Schedule with intern, project, date, time, Google Meet link, reschedule, cancel, double-booking prevention.
9. **Module 9 – Certificate Management**: Unique `CertificateRequest` on internship completion, HR approval/rejection with reason, PDF generation from `CertificateTemplate`, email delivery, authorised download.
10. **Module 10 – Notification & Email Management**: In-portal notification centre + automated emails for all 12 domain triggers + daily 09:00 AM deadline reminder job using the current approved `dueDate`.
11. **Module 11 – Dashboard & Reporting**: Real-time KPI cards and Recharts visualizations for Admin, HR Manager (including mentor-wise intern distribution), Mentor (including intern-wise project progress), and Intern.

---

## 4. Documented Clarifications & Resolved Ambiguities

- **Mentor Management by HR vs. Admin**: The FRD states Admin manages HR and Mentor accounts, while HR allocates mentors and manages the HR portal. To support both strict FRD governance and practical HR operations requested by stakeholders, Admin has full HR/Mentor CRUD at `/admin/users` and HR can also manage mentors at `/hr/mentors`.
- **Deadline Reminder Timezone**: Daily reminders run at `09:00 AM` server time and evaluate assignments due the next calendar day using the **current approved `dueDate`** (after any approved extension), keyed by `due-reminder:{assignmentId}:{YYYY-MM-DD}` for strict idempotency.
