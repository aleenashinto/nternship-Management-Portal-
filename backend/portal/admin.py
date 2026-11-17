from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Project, ProjectAssignment, ExtensionRequest,
    PresentationSchedule, Certificate, Notification
)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Internship System Roles & Details', {
            'fields': (
                'role', 'phone', 'phone2', 'address', 'education_qualification',
                'source', 'work_start_time', 'work_end_time',
                'assigned_mentor', 'is_active_intern'
            ),
        }),
    )
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'assigned_mentor', 'is_active_intern']
    list_filter = ['role', 'is_active_intern', 'is_staff', 'is_superuser']
    search_fields = ['username', 'email', 'first_name', 'last_name']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_by', 'data_source_type', 'created_at']
    list_filter = ['data_source_type', 'created_at']
    search_fields = ['title', 'instructions', 'created_by__username']


@admin.register(ProjectAssignment)
class ProjectAssignmentAdmin(admin.ModelAdmin):
    list_display = ['project', 'intern', 'mentor', 'assigned_date', 'due_date', 'status', 'score']
    list_filter = ['status', 'assigned_date', 'due_date']
    search_fields = ['project__title', 'intern__username', 'mentor__username']


@admin.register(ExtensionRequest)
class ExtensionRequestAdmin(admin.ModelAdmin):
    list_display = ['assignment', 'intern', 'requested_date', 'status', 'created_at']
    list_filter = ['status', 'requested_date']
    search_fields = ['assignment__project__title', 'intern__username', 'reason']


@admin.register(PresentationSchedule)
class PresentationScheduleAdmin(admin.ModelAdmin):
    list_display = ['project', 'intern', 'mentor', 'presentation_date', 'presentation_time', 'status']
    list_filter = ['status', 'presentation_date']
    search_fields = ['project__title', 'intern__username', 'mentor__username']


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['intern', 'status', 'certificate_number', 'approved_by', 'approval_date']
    list_filter = ['status', 'approval_date']
    search_fields = ['intern__username', 'certificate_number']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'title', 'notification_type', 'is_read', 'created_at']
    list_filter = ['is_read', 'notification_type', 'created_at']
    search_fields = ['recipient__username', 'title', 'message']
