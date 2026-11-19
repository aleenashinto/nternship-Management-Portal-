"""
Celery background tasks for deadline reminders and overdue sweeps.
"""
try:
    from celery import shared_task
except ImportError:
    def shared_task(*args, **kwargs):
        def decorator(fn):
            return fn
        return decorator

from django.utils import timezone
from datetime import timedelta
from .models import ProjectAssignment, ProjectAssignmentStatus
from .services import send_notification_and_email


@shared_task(name="portal.tasks.send_daily_deadline_reminders")
def send_daily_deadline_reminders():
    today = timezone.now().date()
    tomorrow = today + timedelta(days=1)

    # 1. Mark past-due active assignments OVERDUE
    ProjectAssignment.objects.filter(due_date__lt=today).exclude(
        status__in=[
            ProjectAssignmentStatus.COMPLETED,
            ProjectAssignmentStatus.SUBMITTED,
            ProjectAssignmentStatus.UNDER_REVIEW,
        ]
    ).update(status=ProjectAssignmentStatus.OVERDUE)

    # 2. Send 09:00 AM reminder for assignments due tomorrow (using current approved due_date)
    due_tomorrow = ProjectAssignment.objects.filter(
        due_date=tomorrow,
        status__in=[
            ProjectAssignmentStatus.ASSIGNED,
            ProjectAssignmentStatus.IN_PROGRESS,
            ProjectAssignmentStatus.REVISION_REQUIRED,
        ],
    ).select_related("intern", "project")

    sent = 0
    for assignment in due_tomorrow:
        send_notification_and_email(
            recipient=assignment.intern,
            title=f"Reminder: '{assignment.project.title}' is due tomorrow ({tomorrow})",
            message=(
                f"Hello {assignment.intern},\n"
                f"This is an automated 09:00 AM reminder that your project '{assignment.project.title}' "
                f"is due tomorrow ({tomorrow})."
            ),
            notification_type="DEADLINE_REMINDER",
            link="/intern/projects",
        )
        sent += 1

    return {"checked": due_tomorrow.count(), "sent": sent, "due_date": str(tomorrow)}
