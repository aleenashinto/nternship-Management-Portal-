# PHASE 1 & 5: API DOCUMENTATION

All API endpoints enforce JWT/session authentication, CSRF verification on mutating verbs, role-based access control (`requireRole` / `requireExactRole`), and Zod payload validation.

---

## 1. Authentication (`/api/auth/*`)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/api/auth/login` | Public (rate-limited) | Authenticates `username`/`email` + `password`, sets `httpOnly` JWT cookie + CSRF cookie, logs `LOGIN` |
| `POST` | `/api/auth/logout` | Authenticated | Clears session & CSRF cookies, logs `LOGOUT` |
| `GET` | `/api/auth/me` | Authenticated | Returns active `Actor` (`userId`, `role`, `username`, `mustChangePassword`, `mentorId`, `internId`) |
| `POST` | `/api/auth/change-password` | Authenticated | Validates `currentPassword` and `newPassword` (10+ chars, upper, lower, digit), clears `mustChangePassword` |

---

## 2. Admin Staff, Grants, Template & Audit Logs

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/api/users` | `ADMIN` | Lists HR Managers and Mentors with derived `assignedInterns` counts |
| `POST` | `/api/users` | `ADMIN` | Creates `HR` or `MENTOR` account (rejects `INTERN` role) with random initial password |
| `PATCH` | `/api/users/[id]` | `ADMIN` | Updates HR/Mentor name, email, phone, and shift hours |
| `POST` | `/api/users/[id]/status` | `ADMIN` | Activates or deactivates an HR/Mentor account (`isActive`) |
| `POST` | `/api/users/[id]/reset-password` | `ADMIN` | Resets staff password and forces password change on next login |
| `GET/POST/DELETE` | `/api/grants` | `ADMIN` | Lists, creates, or revokes directional cross-mentor access grants (`MentorAccessGrant`) |
| `GET/PUT` | `/api/settings/certificate-template` | `ADMIN` | Reads or updates the PDF `CertificateTemplate` |
| `GET` | `/api/logs` | `ADMIN` | Lists and filters `ActivityLog` records by action, entity type, or actor |

---

## 3. HR Intern & Mentor Management

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/api/hr/mentors` | `HR`, `ADMIN` | Lists mentors with shift timings and assigned interns |
| `POST` | `/api/hr/mentors` | `HR`, `ADMIN` | Creates a new Mentor account |
| `PATCH/DELETE` | `/api/hr/mentors/[id]` | `HR`, `ADMIN` | Updates or deletes a Mentor account (unassigning linked interns safely) |
| `GET` | `/api/interns` | Scoped (`ADMIN`, `HR`, `MENTOR`, `INTERN`) | Lists interns scoped by role (`internScope`) |
| `POST` | `/api/interns` | `HR` only | Registers intern, auto-creates `User` (`username = email`, `mustChangePassword = true`) & `ONGOING` `Internship`, dispatches welcome email |
| `GET/PATCH/DELETE` | `/api/interns/[id]` | Scoped / `HR` | Retrieves full intern profile, updates intern details, or deletes intern |
| `POST` | `/api/interns/[id]/assign-mentor` | `HR`, `ADMIN` | Assigns or reassigns mentor (`mentorId` or `null`) |

---

## 4. Projects, Assignments, Submissions, Evaluations & Extensions

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET/POST` | `/api/projects` | Scoped / `MENTOR` | Lists reusable project templates or creates a new project template |
| `PATCH` | `/api/projects/[id]` | Creator `MENTOR`, `ADMIN` | Updates a reusable project template (mentors edit only their own) |
| `POST` | `/api/projects/[id]/files` | Creator `MENTOR`, `ADMIN` | Uploads validated dataset file (`PROJECT_DATA`) or PDF (`PROJECT_INSTRUCTIONS`, `.pdf` enforced) |
| `GET/POST` | `/api/assignments` | Scoped / `MENTOR` | Lists assignments (auto-refreshing `OVERDUE` status) or assigns a project to an intern |
| `POST` | `/api/assignments/[id]/submissions` | Assigned `INTERN` | Uploads a new append-only submission version (`v1, v2, ...`) with private files |
| `POST` | `/api/assignments/[id]/evaluate` | Assigned `MENTOR`, `ADMIN` | Scores submission (`0..100`) and marks `COMPLETED` or `REVISION_REQUIRED` (creating `CorrectionRequest`) |
| `GET/POST` | `/api/extensions` | Scoped / `INTERN` | Lists extension requests or submits a new deadline extension request |
| `POST` | `/api/extensions/[id]/decide` | Assigned `MENTOR`, `ADMIN` | Approves (updating `ProjectAssignment.dueDate`) or rejects an extension request |

---

## 5. Presentations, Notes, Internship Completion, Certificates, Files & Cron

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET/POST` | `/api/presentations` | Scoped / `MENTOR` | Lists presentations or schedules a new presentation (with double-booking prevention) |
| `PATCH` | `/api/presentations/[id]` | Assigned `MENTOR`, `ADMIN` | Reschedules, completes, or cancels a presentation and notifies intern |
| `POST` | `/api/notes` | Assigned `MENTOR` | Appends an immutable dated `MentorNote` to an intern profile |
| `POST` | `/api/internships/[id]/complete` | Assigned `MENTOR`, `ADMIN` | Marks overall internship completed and creates unique `CertificateRequest` (`PENDING`), notifying HR |
| `GET` | `/api/certificates` | Scoped | Lists certificate requests and issued certificates |
| `POST` | `/api/certificates/requests/[id]/decide` | `HR`, `ADMIN` | Approves (generating PDF via `pdf-lib` & emailing intern) or rejects with reason |
| `GET` | `/api/certificates/[id]/download` | Owner `INTERN`, `MENTOR`, `HR`, `ADMIN` | Streams authorised PDF certificate |
| `GET` | `/api/files/[id]` | Authorised owner/mentor/HR/Admin | Streams private stored file (`StoredFile`) |
| `GET/POST` | `/api/notifications`, `/api/notifications/[id]/read`, `/api/notifications/read-all` | Authenticated | Lists user's notifications and marks one or all read |
| `GET/POST` | `/api/cron/reminders` | `CRON_SECRET` header or `ADMIN` | Runs daily 09:00 AM deadline reminders (using current approved `dueDate`) & overdue sweep |
