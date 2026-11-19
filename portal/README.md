# Beat Internship Management Portal

A production-grade, role-based web application managing the full internship lifecycle: intern registration, mentor allocation, reusable projects, versioned project submissions & evaluations, presentation scheduling, internship completion, and automated PDF certificate issuance with unified in-portal and email notifications plus full activity audit logging.

---

## 1. Tech Stack

- **Framework**: Next.js (App Router) + TypeScript, Tailwind CSS (Beat `#4B3A9B` indigo-purple theme & Sora font)
- **Database & ORM**: PostgreSQL + Prisma ORM with migrations
- **Authentication & Security**:
  - `bcryptjs` password hashing
  - Signed JWT (`jose`) stored in `httpOnly`, `SameSite=Lax` cookies
  - Double-submit CSRF cookie + `x-csrf-token` header + Origin verification on all mutating routes
  - Sliding-window login rate limiting (5 failed attempts / 15 min per IP + username)
  - Multi-layer RBAC enforced in `src/proxy.ts`, server layouts, API handlers (`requireRole` / `requireExactRole`), and service-level Prisma query scopes (`internScope` / `visibleMentorIds`)
- **Validation**: Zod schemas on every API input
- **File Storage**: Private local directory (`STORAGE_DIR`, outside `public/`) abstracted behind `StorageBackend` in `src/lib/storage/index.ts`. Every download is authorised by role and ownership via `GET /api/files/[id]` and `GET /api/certificates/[id]/download`.
- **PDF Certificate Generation**: `pdf-lib` using the Admin-configurable `CertificateTemplate` entity
- **Email & Notifications**: Unified idempotent event dispatcher (`src/lib/events/dispatcher.ts`) writing `Notification` + sending via `nodemailer` (`EmailLog`) with unique constraints `(eventId, recipientId)` and `(eventId, recipient)`
- **Scheduler**: `node-cron` daily at 09:00 AM (`src/instrumentation.ts`) + `POST /api/cron/reminders`

---

## 2. Quick Start

### Option A: Local Development (Embedded PostgreSQL — no Docker required)

```bash
cd portal
cp .env.example .env
npm install

# 1. Start the local PostgreSQL instance (port 5433)
npm run db:start

# 2. In a second terminal, apply Prisma migrations and seed demo data
npx prisma migrate deploy
npm run db:seed

# 3. Start the application
npm run dev
```

Open **http://localhost:3000**.

### Option B: Docker Compose (App + PostgreSQL + Mailhog)

```bash
cd portal
docker compose up --build
```

- **Portal UI**: http://localhost:3000
- **Mailhog Web UI** (inspect all sent emails): http://localhost:8025

---

## 3. Environment Variables (`.env.example`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5433/portal?schema=public` |
| `SESSION_SECRET` | 32+ char secret for signing session JWTs | `change-me-to-a-long-random-string-at-least-32-chars` |
| `APP_URL` | Base URL for email links & cookie security | `http://localhost:3000` |
| `STORAGE_DIR` | Private file & certificate storage path | `./storage` |
| `MAX_UPLOAD_MB` | Maximum upload file size in MB | `10` |
| `ALLOWED_UPLOAD_EXT` | Comma-separated allowed file extensions | `pdf,csv,xlsx,xls,pbix,twbx,py,ipynb,sql,zip,txt,png,jpg` |
| `SMTP_HOST` / `SMTP_PORT` | SMTP server (Mailhog in dev) | `localhost` / `1025` |
| `CRON_SECRET` | Secret header (`x-cron-secret`) for triggering `/api/cron/reminders` | `change-me-cron-secret` |

---

## 4. Seeded Demo Credentials

All seeded accounts share the password: **`Passw0rd!Demo`**

| Role | Username / Email | Notes |
|------|------------------|-------|
| **Admin** | `admin@beat.local` | Manages HR & Mentor accounts, certificate template, cross-mentor grants, activity logs |
| **HR Manager** | `hr@beat.local` | Registers interns, assigns/reassigns mentors, approves/rejects certificates |
| **Mentor 1** | `mentor1@beat.local` | Maya Mentor — assigned 3 interns (Aarav, Diya, Rohan) |
| **Mentor 2** | `mentor2@beat.local` | Noah Mentor — assigned 2 interns (Sneha, Karthik) |
| **Intern 1** | `intern1@beat.local` | Aarav Sharma — completed project (95/100), scheduled presentation, completed internship with **PENDING** certificate request |
| **Intern 2** | `intern2@beat.local` | Diya Nair — assignments in `REVISION_REQUIRED` and `RESUBMITTED` |
| **Intern 3** | `intern3@beat.local` | Rohan Verma — `OVERDUE` assignment with a **PENDING** extension request + `IN_PROGRESS` assignment |
| **Intern 4** | `intern4@beat.local` | Sneha Patel — assignment `UNDER_REVIEW` |
| **Intern 5** | `intern5@beat.local` | Karthik Menon — assignment `ASSIGNED` |

---

## 5. Running Automated Tests & Cron Reminders

```bash
# Run the full Vitest suite against an isolated portal_test PostgreSQL database
npm test

# Trigger the 9:00 AM daily deadline reminder job manually in development
curl -X POST http://localhost:3000/api/cron/reminders \
  -H "x-cron-secret: change-me-cron-secret"
```

---

## 6. End-to-End Lifecycle Walkthrough

1. **Register Intern (`HR Manager`)**: Sign in as `hr@beat.local` → **Interns** → **+ Register Intern**. Submitting creates the `User` (`username = email`, random password, `mustChangePassword = true`), `InternProfile`, and `ONGOING` `Internship`, and dispatches the welcome email + notification.
2. **Assign Mentor (`HR Manager`)**: Click **Assign / Reassign Mentor** on the intern row to allocate `Maya Mentor`. The mentor's assigned-intern count updates automatically.
3. **Create & Assign Project (`Mentor`)**: Sign in as `mentor1@beat.local` → **Projects** → create a reusable project template with tools, instructions, and files → **Assignments** → **+ Assign Project** with an independent assigned date and due date.
4. **Submit Deliverable (`Intern`)**: Sign in as the intern (changing temporary password on first login) → **My projects** → **Upload Submission**. Version `v1` is recorded with timestamp and private files.
5. **Request Corrections (`Mentor`)**: In **Assignments**, click **Evaluate** on `v1`, score it, and select **Request Corrections** with instructions. The intern is notified via portal and email.
6. **Resubmit (`Intern`)**: The intern uploads a resubmission. Version `v2` is created (`RESUBMITTED`) while `v1` remains permanently intact.
7. **Approve Project (`Mentor`)**: The mentor evaluates `v2` and selects **Mark Completed** (`94/100`). Note that completing the project does **not** complete the overall internship.
8. **Mark Internship Completed (`Mentor`)**: The mentor opens **My interns → Open Full Profile**, adds an immutable dated mentor note, and clicks **Mark Internship Completed**. This records the completion date and creates **one** `CertificateRequest` (protected by a unique database constraint), notifying HR.
9. **Approve Certificate & Download PDF (`HR Manager` & `Intern`)**: HR opens **Dashboard** (or **Certificates**) and clicks **Approve & Issue PDF**. `pdf-lib` generates the certificate from the Admin-configurable template, emails it to the intern, and unlocks download at `/intern/certificate`.
