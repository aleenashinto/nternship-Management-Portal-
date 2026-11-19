# PHASE 20: PRODUCTION DEPLOYMENT, SECURITY & BACKUP GUIDE

This document covers production deployment, environment configuration, database migrations, background workers, SSL/domain setup, and backup & recovery procedures for the **Beat Internship Management Portal**.

---

## 1. Production Architecture Options

### Option A: Vercel (Live Cloud Deployment) + Managed PostgreSQL (Neon / Supabase)
- **Live URL**: **https://internship-management-portal-liart.vercel.app/**
- **GitHub Repository**: **https://github.com/aleenashinto/nternship-Management-Portal-** (`main` branch auto-deploys on push)
- **Scheduled Jobs**: Configured in `portal/vercel.json` (`"crons": [{ "path": "/api/cron/reminders", "schedule": "0 9 * * *" }]`) to trigger the daily 09:00 AM deadline reminder and overdue sweep.

### Option B: Docker Compose Full-Stack Production (`docker/docker-compose.production.yml`)
Runs PostgreSQL 16, Redis 7, Mailhog (or external SMTP), and the portal application container with persistent volumes for database storage (`pgdata`) and private file/certificate storage (`portal_storage`).

```bash
docker compose -f docker/docker-compose.production.yml up -d --build
```

### Option C: Dedicated Linux VM / Render / Railway (Django REST + Celery + Next.js)
1. **PostgreSQL & Redis**: Provision managed PostgreSQL 16 and Redis 7 instances.
2. **Django Backend (`backend/`)**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python manage.py migrate --noinput
   python manage.py collectstatic --noinput
   gunicorn internship_backend.wsgi:application --bind 0.0.0.0:8000 --workers 4
   ```
3. **Celery Worker & Celery Beat Scheduler**:
   ```bash
   celery -A internship_backend worker -l info
   celery -A internship_backend beat -l info
   ```
4. **Next.js Portal (`portal/`)**:
   ```bash
   cd portal
   npm ci
   npx prisma migrate deploy
   npm run build
   npm start
   ```

---

## 2. Production Environment Variables Checklist

### `portal/.env` (Next.js + Prisma Stack)
| Variable | Required | Production Requirement |
|----------|----------|------------------------|
| `DATABASE_URL` | Yes | `postgresql://<user>:<pass>@<host>:5432/<db>?sslmode=require` |
| `SESSION_SECRET` | Yes | Random 32+ character secret (`openssl rand -base64 32`) |
| `APP_URL` | Yes | `https://your-production-domain.com` (enables `Secure` cookie flag) |
| `STORAGE_DIR` | Yes | Persistent private directory outside `public/` (e.g., `/var/lib/portal/storage`) |
| `MAX_UPLOAD_MB` | No | `10` (default 10 MB upload cap) |
| `ALLOWED_UPLOAD_EXT` | No | `pdf,csv,xlsx,xls,pbix,twbx,py,ipynb,sql,zip,txt,png,jpg` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Yes | Production SMTP relay (SendGrid, SES, Postmark, or corporate SMTP) |
| `MAIL_FROM` | Yes | `Beat Internship Portal <no-reply@yourdomain.com>` |
| `CRON_SECRET` | Yes | High-entropy token verified via `x-cron-secret` or `Authorization: Bearer` |

### `backend/.env` (Django REST + Celery Stack)
| Variable | Required | Production Requirement |
|----------|----------|------------------------|
| `SECRET_KEY` | Yes | High-entropy 50+ character Django secret key |
| `DEBUG` | Yes | `False` |
| `ALLOWED_HOSTS` | Yes | Comma-separated domain list (e.g., `api.yourdomain.com`) |
| `DB_ENGINE` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | Yes | PostgreSQL connection parameters |
| `CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND` | Yes | `redis://<redis-host>:6379/0` |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` | Yes | Production SMTP credentials |

---

## 3. Initial Admin Bootstrap & Database Migrations

```bash
# Next.js + Prisma stack
cd portal
npx prisma migrate deploy
npm run db:seed

# Django stack
cd backend
python manage.py migrate --noinput
python manage.py seed_data
```

 Immediately after initial login in production, sign in as `admin@beat.local` and update the password via `/change-password`.

---

## 4. Backup, Recovery & Monitoring Strategy

### PostgreSQL Database Backups
- **Daily Automated Dump**:
  ```bash
  pg_dump --format=custom --no-owner --file="backup_$(date +%Y%m%d_%H%M).dump" "$DATABASE_URL"
  ```
- **Point-in-Time Restore**:
  ```bash
  pg_restore --clean --no-owner --dbname="$DATABASE_URL" backup_YYYYMMDD_HHMM.dump
  ```

### Private File & Certificate Storage Backups
- Sync `STORAGE_DIR` (`portal/storage/` and `backend/media/`) daily to encrypted object storage (AWS S3 / GCS) with versioning enabled.

### Health & Audit Monitoring
- Inspect `/admin/logs` (`ActivityLog`) for all authentication events, role changes, submissions, evaluations, and certificate issuances.
- Inspect `EmailLog` in PostgreSQL for any `FAILED` SMTP deliveries.
