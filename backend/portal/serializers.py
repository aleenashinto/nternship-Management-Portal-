from rest_framework import serializers
from .models import (
    User, UserRole, Project, ProjectAssignment,
    ExtensionRequest, PresentationSchedule, Certificate, Notification,
    WebsiteBranding, WebsiteTheme
)

class UserSerializer(serializers.ModelSerializer):
    assigned_intern_count = serializers.ReadOnlyField()
    assigned_mentor_name = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'password', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'phone2', 'address', 'education_qualification',
            'source', 'work_start_time', 'work_end_time',
            'assigned_mentor', 'assigned_mentor_name', 'assigned_intern_count',
            'is_active_intern', 'date_joined'
        ]
        read_only_fields = ['id', 'role', 'date_joined']

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save(update_fields=['password'])
        return user

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.username

    def get_assigned_mentor_name(self, obj):
        if obj.assigned_mentor:
            name = f"{obj.assigned_mentor.first_name} {obj.assigned_mentor.last_name}".strip()
            return name if name else obj.assigned_mentor.username
        return None


class MentorCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'password', 'first_name', 'last_name',
            'email', 'phone', 'work_start_time', 'work_end_time'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        mentor = User(
            role=UserRole.MENTOR,
            **validated_data
        )
        mentor.set_password(password)
        mentor.save()
        return mentor


class InternCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'password', 'first_name', 'last_name',
            'email', 'phone', 'phone2', 'address', 'education_qualification',
            'source', 'assigned_mentor'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            # default temporary password
            password = 'InternPassword@123'
        intern = User(
            role=UserRole.INTERN,
            is_active_intern=True,
            **validated_data
        )
        intern.set_password(password)
        intern.save()
        return intern


class ProjectSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    active_assignments_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'tools_used', 'instructions', 'instruction_pdf',
            'data_source_type', 'data_source_description', 'data_source_file',
            'created_by', 'created_by_name', 'active_assignments_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username

    def get_active_assignments_count(self, obj):
        return obj.assignments.count()


class ProjectAssignmentSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    project_details = ProjectSerializer(source='project', read_only=True)
    intern_name = serializers.SerializerMethodField()
    intern_email = serializers.EmailField(source='intern.email', read_only=True)
    mentor_name = serializers.SerializerMethodField()

    class Meta:
        model = ProjectAssignment
        fields = [
            'id', 'project', 'project_title', 'project_details',
            'intern', 'intern_name', 'intern_email',
            'mentor', 'mentor_name',
            'assigned_date', 'due_date', 'status',
            'submission_file', 'submission_notes', 'submitted_at',
            'score', 'evaluation_notes', 'evaluated_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'mentor', 'submitted_at', 'evaluated_at',
            'created_at', 'updated_at'
        ]

    def get_intern_name(self, obj):
        return obj.intern.get_full_name() or obj.intern.username

    def get_mentor_name(self, obj):
        return obj.mentor.get_full_name() or obj.mentor.username


class ExtensionRequestSerializer(serializers.ModelSerializer):
    intern_name = serializers.SerializerMethodField()
    project_title = serializers.CharField(source='assignment.project.title', read_only=True)
    current_due_date = serializers.DateField(source='assignment.due_date', read_only=True)

    class Meta:
        model = ExtensionRequest
        fields = [
            'id', 'assignment', 'project_title', 'current_due_date',
            'intern', 'intern_name', 'reason', 'requested_date',
            'status', 'mentor_notes', 'created_at', 'reviewed_at'
        ]
        read_only_fields = ['id', 'intern', 'status', 'mentor_notes', 'created_at', 'reviewed_at']

    def get_intern_name(self, obj):
        return obj.intern.get_full_name() or obj.intern.username


class PresentationScheduleSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    intern_name = serializers.SerializerMethodField()
    mentor_name = serializers.SerializerMethodField()

    class Meta:
        model = PresentationSchedule
        fields = [
            'id', 'project', 'project_title', 'assignment',
            'intern', 'intern_name', 'mentor', 'mentor_name',
            'presentation_date', 'presentation_time', 'google_meet_link',
            'status', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'mentor', 'created_at', 'updated_at']

    def get_intern_name(self, obj):
        return obj.intern.get_full_name() or obj.intern.username

    def get_mentor_name(self, obj):
        return obj.mentor.get_full_name() or obj.mentor.username


class CertificateSerializer(serializers.ModelSerializer):
    intern_name = serializers.SerializerMethodField()
    intern_email = serializers.EmailField(source='intern.email', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    completed_projects_count = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            'id', 'intern', 'intern_name', 'intern_email',
            'status', 'certificate_number', 'certificate_file',
            'rejection_reason', 'approved_by', 'approved_by_name',
            'completed_projects_count', 'request_date', 'approval_date'
        ]
        read_only_fields = [
            'id', 'intern', 'certificate_number', 'certificate_file',
            'approved_by', 'request_date', 'approval_date'
        ]

    def get_intern_name(self, obj):
        return obj.intern.get_full_name() or obj.intern.username

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name() or obj.approved_by.username
        return None

    def get_completed_projects_count(self, obj):
        return obj.intern.project_assignments.filter(status='COMPLETED').count()


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 'link', 'created_at']
        read_only_fields = ['id', 'created_at']


class WebsiteBrandingSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteBranding
        fields = [
            'id', 'site_name', 'primary_logo', 'dark_logo',
            'light_logo', 'mobile_logo', 'favicon', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class WebsiteThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteTheme
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
