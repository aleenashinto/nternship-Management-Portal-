from rest_framework import serializers
from django.utils import timezone
import re
from .models import (
    User, UserRole, Project, ProjectAssignment,
    ExtensionRequest, PresentationSchedule, Certificate, Notification,
    WebsiteBranding, WebsiteTheme, InternDepartment, InternshipProgram,
    ImportHistory, InternStatusChoices
)


class InternDepartmentSerializer(serializers.ModelSerializer):
    intern_count = serializers.SerializerMethodField()

    class Meta:
        model = InternDepartment
        fields = ['id', 'name', 'code', 'description', 'head_of_department', 'is_active', 'intern_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_intern_count(self, obj):
        return User.objects.filter(role=UserRole.INTERN).filter(
            models_q_dept(obj)
        ).count()


def models_q_dept(dept_obj):
    from django.db.models import Q
    return Q(department_ref=dept_obj) | Q(department__iexact=dept_obj.name)


class InternshipProgramSerializer(serializers.ModelSerializer):
    department_name = serializers.SerializerMethodField()

    class Meta:
        model = InternshipProgram
        fields = [
            'id', 'title', 'code', 'department', 'department_ref', 'department_name',
            'duration_weeks', 'description', 'skills_covered', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_department_name(self, obj):
        if obj.department_ref:
            return obj.department_ref.name
        return obj.department or 'Data Analytics'


class ImportHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportHistory
        fields = [
            'id', 'file_name', 'file_type', 'total_records', 'successful_records',
            'failed_records', 'skipped_records', 'updated_records', 'import_status',
            'error_details', 'imported_by', 'imported_by_name', 'imported_at'
        ]
        read_only_fields = ['id', 'imported_at']


class UserSerializer(serializers.ModelSerializer):
    assigned_intern_count = serializers.ReadOnlyField()
    assigned_mentor_name = serializers.SerializerMethodField()
    hr_contact_name = serializers.SerializerMethodField()
    full_name = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(source='intern_status', required=False)
    department_id = serializers.PrimaryKeyRelatedField(
        source='department_ref', queryset=InternDepartment.objects.all(),
        required=False, allow_null=True
    )
    department_name = serializers.SerializerMethodField()
    mentor_id = serializers.PrimaryKeyRelatedField(
        source='assigned_mentor', queryset=User.objects.filter(role=UserRole.MENTOR),
        required=False, allow_null=True
    )
    hr_contact_id = serializers.PrimaryKeyRelatedField(
        source='hr_contact', queryset=User.objects.filter(role__in=[UserRole.HR, UserRole.ADMIN]),
        required=False, allow_null=True
    )
    created_at = serializers.DateTimeField(source='date_joined', read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'intern_code', 'username', 'password', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'phone2', 'gender', 'college', 'course',
            'department', 'department_id', 'department_name',
            'program', 'program_name', 'internship_role',
            'start_date', 'end_date', 'duration', 'internship_duration',
            'address', 'education_qualification',
            'source', 'work_start_time', 'work_end_time',
            'assigned_mentor', 'mentor_id', 'assigned_mentor_name', 'assigned_intern_count',
            'hr_contact', 'hr_contact_id', 'hr_contact_name',
            'status', 'intern_status', 'profile_photo',
            'is_active_intern', 'created_by', 'date_joined', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'role', 'date_joined', 'created_at', 'updated_at']

    def get_department_name(self, obj):
        if obj.department_ref:
            return obj.department_ref.name
        return obj.department or 'Data Analytics'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        name = f"{instance.first_name} {instance.last_name}".strip()
        data['full_name'] = name if name else instance.username
        data['status'] = instance.intern_status or 'Active'
        if instance.department_ref and not data.get('department'):
            data['department'] = instance.department_ref.name
        if not data.get('intern_code') and instance.role == UserRole.INTERN:
            data['intern_code'] = f"INT-{timezone.now().year}-{instance.id:04d}"
        return data

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        full_name = validated_data.pop('full_name', None)
        if full_name and not validated_data.get('first_name'):
            parts = full_name.strip().split(' ', 1)
            validated_data['first_name'] = parts[0]
            validated_data['last_name'] = parts[1] if len(parts) > 1 else ''
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save(update_fields=['password'])
        return user

    def get_assigned_mentor_name(self, obj):
        if obj.assigned_mentor:
            name = f"{obj.assigned_mentor.first_name} {obj.assigned_mentor.last_name}".strip()
            return name if name else obj.assigned_mentor.username
        return None

    def get_hr_contact_name(self, obj):
        if obj.hr_contact:
            name = f"{obj.hr_contact.first_name} {obj.hr_contact.last_name}".strip()
            return name if name else obj.hr_contact.username
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
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    full_name = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(source='intern_status', required=False, default='Active')
    department_id = serializers.PrimaryKeyRelatedField(
        source='department_ref', queryset=InternDepartment.objects.all(),
        required=False, allow_null=True
    )
    department_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    mentor_id = serializers.PrimaryKeyRelatedField(
        source='assigned_mentor', queryset=User.objects.filter(role=UserRole.MENTOR),
        required=False, allow_null=True
    )
    hr_contact_id = serializers.PrimaryKeyRelatedField(
        source='hr_contact', queryset=User.objects.filter(role__in=[UserRole.HR, UserRole.ADMIN]),
        required=False, allow_null=True
    )

    class Meta:
        model = User
        fields = [
            'id', 'intern_code', 'username', 'password', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'phone2', 'gender', 'college', 'course',
            'department', 'department_id', 'department_name',
            'program', 'program_name', 'internship_role',
            'start_date', 'end_date', 'duration', 'internship_duration',
            'address', 'education_qualification', 'source',
            'assigned_mentor', 'mentor_id', 'hr_contact', 'hr_contact_id',
            'status', 'intern_status', 'profile_photo'
        ]

    def validate(self, attrs):
        full_name = attrs.pop('full_name', '').strip()
        dept_name = attrs.pop('department_name', '').strip()
        if dept_name and not attrs.get('department'):
            attrs['department'] = dept_name
        if full_name and not attrs.get('first_name'):
            parts = full_name.split(' ', 1)
            attrs['first_name'] = parts[0]
            attrs['last_name'] = parts[1] if len(parts) > 1 else ''

        email = (attrs.get('email') or '').strip()
        username = (attrs.get('username') or '').strip()
        if not username:
            base = re.sub(r'[^a-zA-Z0-9_]', '_', (email.split('@')[0] if email else full_name or 'intern').lower())
            base = re.sub(r'_+', '_', base).strip('_') or 'intern'
            candidate = base
            suffix = 1
            while User.objects.filter(username__iexact=candidate).exists():
                suffix += 1
                candidate = f"{base}_{suffix}"
            attrs['username'] = candidate

        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({'end_date': 'Internship start date must not be after end date.'})

        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
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
