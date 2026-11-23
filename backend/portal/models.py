from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid

class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', 'Admin'
    HR = 'HR', 'HR Manager'
    MENTOR = 'MENTOR', 'Mentor (Team Lead)'
    INTERN = 'INTERN', 'Intern'


class InternStatusChoices(models.TextChoices):
    APPLIED = 'Applied', 'Applied'
    SELECTED = 'Selected', 'Selected'
    ONBOARDING = 'Onboarding', 'Onboarding'
    ACTIVE = 'Active', 'Active'
    COMPLETED = 'Completed', 'Completed'
    TERMINATED = 'Terminated', 'Terminated'


class InternDepartment(models.Model):
    name = models.CharField(max_length=120, unique=True, default='')
    code = models.CharField(max_length=30, blank=True, default='')
    description = models.TextField(blank=True, default='')
    head_of_department = models.CharField(max_length=120, blank=True, default='')
    head_mentor = models.ForeignKey(
        'User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='headed_departments'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class InternshipProgram(models.Model):
    title = models.CharField(max_length=180, unique=True, default='')
    code = models.CharField(max_length=40, blank=True, default='')
    department = models.CharField(max_length=120, default='Data Analytics')
    department_ref = models.ForeignKey(
        InternDepartment,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='programs'
    )
    duration_weeks = models.PositiveIntegerField(default=12)
    description = models.TextField(blank=True, default='')
    skills_covered = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return f"{self.title} ({self.duration_weeks} weeks)"


class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.INTERN,
        help_text="Role determining access privileges"
    )
    intern_code = models.CharField(max_length=40, blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')
    phone2 = models.CharField(max_length=30, blank=True, default='')
    gender = models.CharField(max_length=30, blank=True, default='')
    college = models.CharField(max_length=255, blank=True, default='')
    course = models.CharField(max_length=255, blank=True, default='')
    department = models.CharField(max_length=120, blank=True, default='Data Analytics')
    department_ref = models.ForeignKey(
        InternDepartment,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='interns'
    )
    program = models.ForeignKey(
        InternshipProgram,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='interns'
    )
    program_name = models.CharField(max_length=150, blank=True, default='')
    internship_role = models.CharField(max_length=150, blank=True, default='Data Analytics Intern')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    duration = models.CharField(max_length=80, blank=True, default='')
    internship_duration = models.CharField(max_length=100, blank=True, default='')
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
    hr_contact = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='hr_managed_interns'
    )
    intern_status = models.CharField(
        max_length=30,
        choices=InternStatusChoices.choices,
        default=InternStatusChoices.ACTIVE
    )
    profile_photo = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_user_records'
    )
    updated_at = models.DateTimeField(auto_now=True, null=True)
    is_active_intern = models.BooleanField(default=True)

    @property
    def department_name(self):
        if self.department_ref:
            return self.department_ref.name
        return self.department

    @department_name.setter
    def department_name(self, val):
        if val:
            self.department = val

    def save(self, *args, **kwargs):
        if self.course and not self.education_qualification:
            self.education_qualification = self.course
        elif self.education_qualification and not self.course:
            self.course = self.education_qualification
        if self.department_ref and not self.department:
            self.department = self.department_ref.name
        if self.program and not self.program_name:
            self.program_name = self.program.title
        if self.duration and not self.internship_duration:
            self.internship_duration = self.duration
        elif self.internship_duration and not self.duration:
            self.duration = self.internship_duration
        if self.start_date and self.end_date and not self.internship_duration:
            try:
                days = (self.end_date - self.start_date).days
                if days >= 0:
                    weeks = max(1, round(days / 7))
                    calc = f"{weeks} weeks ({days} days)"
                    self.internship_duration = calc
                    self.duration = calc
            except Exception:
                pass
        if self.intern_status in ['Terminated', 'Completed']:
            self.is_active_intern = False
        elif self.intern_status in ['Active', 'Onboarding', 'Selected', 'Applied']:
            self.is_active_intern = True
        super().save(*args, **kwargs)
        if self.role == UserRole.INTERN and not self.intern_code:
            code = f"INT-{timezone.now().year}-{self.id:04d}"
            self.intern_code = code
            User.objects.filter(pk=self.pk).update(intern_code=code)

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


class WebsiteBranding(models.Model):
    site_name = models.CharField(max_length=120, default='Beat Internship Portal')
    primary_logo = models.TextField(blank=True, default='/beat-logo.png')
    dark_logo = models.TextField(blank=True, default='/beat-logo.png')
    light_logo = models.TextField(blank=True, default='/beat-logo.png')
    mobile_logo = models.TextField(blank=True, default='/beat-logo.png')
    favicon = models.TextField(blank=True, default='/beat-logo.png')
    updated_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Branding: {self.site_name}"


class WebsiteTheme(models.Model):
    theme_name = models.CharField(max_length=100, default='Default Professional')
    primary_color = models.CharField(max_length=20, default='#2563EB')
    secondary_color = models.CharField(max_length=20, default='#4F46E5')
    accent_color = models.CharField(max_length=20, default='#F59E0B')
    background_color = models.CharField(max_length=20, default='#F8FAFC')
    surface_color = models.CharField(max_length=20, default='#FFFFFF')
    text_color = models.CharField(max_length=20, default='#0F172A')
    secondary_text_color = models.CharField(max_length=20, default='#475569')
    border_color = models.CharField(max_length=20, default='#E2E8F0')
    header_color = models.CharField(max_length=20, default='#FFFFFF')
    sidebar_color = models.CharField(max_length=20, default='#FFFFFF')
    button_color = models.CharField(max_length=20, default='#2563EB')
    link_color = models.CharField(max_length=20, default='#2563EB')
    font_family = models.CharField(max_length=100, default='Sora')
    heading_font = models.CharField(max_length=100, default='Sora')
    body_font = models.CharField(max_length=100, default='Sora')
    base_font_size = models.CharField(max_length=20, default='16px')
    heading_weight = models.CharField(max_length=20, default='700')
    body_weight = models.CharField(max_length=20, default='400')
    border_radius = models.CharField(max_length=20, default='16px')
    button_radius = models.CharField(max_length=20, default='12px')
    input_radius = models.CharField(max_length=20, default='12px')
    container_spacing = models.CharField(max_length=20, default='24px')
    button_style = models.CharField(max_length=30, default='solid')
    shadow_intensity = models.CharField(max_length=30, default='medium')
    sidebar_width = models.CharField(max_length=20, default='256px')
    color_mode = models.CharField(max_length=20, default='light')  # light | dark | system
    is_active = models.BooleanField(default=True)
    is_draft = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Theme: {self.theme_name} ({'Draft' if self.is_draft else 'Published'})"


class ImportHistory(models.Model):
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, default='CSV')
    total_records = models.PositiveIntegerField(default=0)
    successful_records = models.PositiveIntegerField(default=0)
    failed_records = models.PositiveIntegerField(default=0)
    skipped_records = models.PositiveIntegerField(default=0)
    updated_records = models.PositiveIntegerField(default=0)
    import_status = models.CharField(max_length=30, default='COMPLETED')
    error_details = models.JSONField(default=list, blank=True)
    imported_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='import_histories'
    )
    imported_by_name = models.CharField(max_length=150, blank=True, default='')
    imported_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'import_history'
        ordering = ['-imported_at']

    def __str__(self):
        return f"{self.file_name} ({self.successful_records}/{self.total_records}) at {self.imported_at}"

