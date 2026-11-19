"""
Celery + Redis configuration for internship_backend.
Schedules the daily 09:00 AM deadline reminder task and overdue assignment sweep.
Gracefully degrades if celery is not installed in the current Python environment.
"""
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "internship_backend.settings")

try:
    from celery import Celery
    from celery.schedules import crontab

    app = Celery("internship_backend")
    app.config_from_object("django.conf:settings", namespace="CELERY")
    app.autodiscover_tasks()

    app.conf.beat_schedule = {
        "daily-0900-deadline-reminders": {
            "task": "portal.tasks.send_daily_deadline_reminders",
            "schedule": crontab(hour=9, minute=0),
        },
    }
except ImportError:
    app = None

