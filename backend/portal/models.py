from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid

class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', 'Admin'
    HR = 'HR', 'HR Manager'
    MENTOR = 'MENTOR', 'Mentor (Team Lead)'
    INTERN = 'INTERN', 'Intern'

class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.INTERN,
        help_text="Role determining access privileges"
    )
    phone = models.CharField(max_length=20, blank=True, default='')
    phone2 = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField(blank=True, default='')
    education_qualification = models.CharField(max_length=255, blank=True, default='')
    source = models.CharField(max_length=100, blank=True, default='Direct')
    work_start_time = models.TimeField(null=True, blank=True)
    work_end_time = models.TimeField(null=True, blank=True)
    assigned_mentor = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_interns',
        limit_choices_to={'role': UserRole.MENTOR}
    )
    is_active_intern = models.BooleanField(default=True)

    @property
    def assigned_intern_count(self):
        if self.role == UserRole.MENTOR:
            return self.assigned_interns.count()
        return 0

    def __str__(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.username


class Project(models.Model):
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_projects',
        limit_choices_to={'role': UserRole.MENTOR}
    )
    title = models.CharField(max_length=255)
    tools_used = models.JSONField(
        default=list,
        help_text="List of tools, e.g. Excel, SQL, Power BI, Tableau, Python, Other"
    )
    instructions = models.TextField(help_text="Project description and guidelines")
    instruction_pdf = models.FileField(
        upload_to='project_instructions/',
        null=True,
        blank=True,
        help_text="Optional instruction PDF document"
    )
    data_source_type = models.CharField(
        max_length=50,
        default='FILE',
        choices=[
            ('FILE', 'File Upload / Dataset'),
            ('TEXT', 'Text Description'),
            ('API', 'API Endpoint'),
            ('DATABASE', 'Database / SQL Query'),
        ]
    )
    data_source_description = models.TextField(
        blank=True,
        default='',
        help_text="Text descriptions, API URLs, or database connection info"
    )
    data_source_file = models.FileField(
        upload_to='project_datasets/',
        null=True,
        blank=True,
        help_text="Dataset or supporting data file"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class ProjectAssignmentStatus(models.TextChoices):
    ASSIGNED = 'ASSIGNED', 'Assigned'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    SUBMITTED = 'SUBMITTED', 'Submitted'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    REVISION_REQUIRED = 'REVISION_REQUIRED', 'Revision Required'
    RESUBMITTED = 'RESUBMITTED', 'Resubmitted'
    COMPLETED = 'COMPLETED', 'Completed'
    OVERDUE = 'OVERDUE', 'Overdue'


class ProjectAssignment(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    intern = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='project_assignments',
        limit_choices_to={'role': UserRole.INTERN}
    )
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentor_assignments',
        limit_choices_to={'role': UserRole.MENTOR}
    )
    assigned_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    status = models.CharField(
        max_length=30,
        choices=ProjectAssignmentStatus.choices,
        default=ProjectAssignmentStatus.ASSIGNED
    )
    submission_file = models.FileField(
        upload_to='project_submissions/',
        null=True,
        blank=True
    )
    submission_notes = models.TextField(blank=True, default='')
    submitted_at = models.DateTimeField(null=True, blank=True)
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Score out of 100"
    )
    evaluation_notes = models.TextField(blank=True, default='')
    evaluated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-assigned_date', '-id']

    def update_overdue_status(self):
        if self.status not in [
            ProjectAssignmentStatus.COMPLETED,
            ProjectAssignmentStatus.SUBMITTED,
            ProjectAssignmentStatus.UNDER_REVIEW
        ]:
            if self.due_date < timezone.now().date():
                if self.status != ProjectAssignmentStatus.OVERDUE:
                    self.status = ProjectAssignmentStatus.OVERDUE
                    self.save(update_fields=['status', 'updated_at'])

    def __str__(self):
        return f"{self.project.title} -> {self.intern.username} ({self.status})"


class ExtensionRequest(models.Model):
    class RequestStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    assignment = models.ForeignKey(
        ProjectAssignment,
        on_delete=models.CASCADE,
        related_name='extension_requests'
    )
    intern = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='extension_requests'
    )
    reason = models.TextField()
    requested_date = models.DateField()
    status = models.CharField(
        max_length=25,
        choices=RequestStatus.choices,
        default=RequestStatus.PENDING
    )
    mentor_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Extension for {self.assignment} -> {self.status}"


class PresentationSchedule(models.Model):
    class PresentationStatus(models.TextChoices):
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        RESCHEDULED = 'RESCHEDULED', 'Rescheduled'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='presentations'
    )
    assignment = models.ForeignKey(
        ProjectAssignment,
        on_delete=models.CASCADE,
        related_name='presentations',
        null=True,
        blank=True
    )
    intern = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='presentations',
        limit_choices_to={'role': UserRole.INTERN}
    )
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mentor_presentations',
        limit_choices_to={'role': UserRole.MENTOR}
    )
    presentation_date = models.DateField()
    presentation_time = models.TimeField()
    google_meet_link = models.URLField(max_length=500)
    status = models.CharField(
        max_length=20,
        choices=PresentationStatus.choices,
        default=PresentationStatus.SCHEDULED
    )
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['presentation_date', 'presentation_time']

    def __str__(self):
        return f"{self.project.title} - {self.intern.username} @ {self.presentation_date} {self.presentation_time}"


class Certificate(models.Model):
    class CertStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Approval'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    intern = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    status = models.CharField(
        max_length=20,
        choices=CertStatus.choices,
        default=CertStatus.PENDING
    )
    certificate_number = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True
    )
    certificate_file = models.FileField(
        upload_to='certificates/',
        null=True,
        blank=True
    )
    rejection_reason = models.TextField(blank=True, default='')
    approved_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_certificates'
    )
    request_date = models.DateTimeField(auto_now_add=True)
    approval_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-request_date']

    def __str__(self):
        return f"Certificate {self.certificate_number or 'PENDING'} for {self.intern.username}"


class Notification(models.Model):
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, default='GENERAL')
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{'READ' if self.is_read else 'UNREAD'}] {self.recipient.username}: {self.title}"
