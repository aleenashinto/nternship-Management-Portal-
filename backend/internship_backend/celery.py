"""
Celery + Redis configuration for internship_backend.
Schedules the daily 09:00 AM deadline reminder task and overdue assignment sweep.
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "internship_backend.settings")

app = Celery("internship_backend")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "daily-0900-deadline-reminders": {
        "task": "portal.tasks.send_daily_deadline_reminders",
        "schedule": crontab(hour=9, minute=0),
    },
}
