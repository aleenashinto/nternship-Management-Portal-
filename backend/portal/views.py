from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from django.db.models import Count, Q, Avg
from django.shortcuts import get_object_or_404
from datetime import timedelta

from django.http import HttpResponse
from .models import (
    User, UserRole, Project, ProjectAssignment, ProjectAssignmentStatus,
    ExtensionRequest, PresentationSchedule, Certificate, Notification,
    WebsiteBranding, WebsiteTheme, InternDepartment, InternshipProgram,
    ImportHistory, InternStatusChoices
)
from .serializers import (
    UserSerializer, MentorCreateSerializer, InternCreateSerializer,
    ProjectSerializer, ProjectAssignmentSerializer, ExtensionRequestSerializer,
    PresentationScheduleSerializer, CertificateSerializer, NotificationSerializer,
    WebsiteBrandingSerializer, WebsiteThemeSerializer,
    InternDepartmentSerializer, InternshipProgramSerializer, ImportHistorySerializer
)
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.cache import cache
from .services import send_notification_and_email, generate_certificate_pdf
from .intern_import_service import (
    SYSTEM_FIELDS, ensure_default_departments_and_programs,
    auto_detect_column_mapping, parse_uploaded_table_file,
    validate_import_rows, execute_import_confirm, sanitize_spreadsheet_cell,
    generate_unique_intern_username, generate_temporary_password
)


# --- Custom Permissions ---

class IsHR(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [UserRole.HR, UserRole.ADMIN]

class IsMentor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [UserRole.MENTOR, UserRole.ADMIN]

class IsIntern(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [UserRole.INTERN, UserRole.ADMIN]

class IsAdminUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.ADMIN


# --- Authentication, Login Rate-Limiting & First-Login Password Change ---

class PortalLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    MAX_ATTEMPTS = 5
    LOCKOUT_SECONDS = 300  # 5 minutes

    def post(self, request):
        username_raw = (request.data.get('username') or '').strip()
        password_raw = request.data.get('password') or ''

        if not username_raw or not password_raw:
            return Response(
                {'detail': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ip_addr = request.META.get('REMOTE_ADDR') or 'local'
        cache_key = f"login_attempts:{ip_addr}:{username_raw.lower()}"
        attempts = cache.get(cache_key, 0)
        if attempts >= self.MAX_ATTEMPTS:
            return Response(
                {'detail': 'Too many failed login attempts. Please wait 5 minutes before trying again.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        user = (
            User.objects.filter(username__iexact=username_raw).first()
            or User.objects.filter(email__iexact=username_raw).first()
        )

        if not user or not user.check_password(password_raw):
            cache.set(cache_key, attempts + 1, self.LOCKOUT_SECONDS)
            return Response(
                {'detail': 'Invalid username or password. Please try again.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check account status
        if not user.is_active or (
            user.role == UserRole.INTERN and user.intern_status in ['Inactive', 'Terminated']
        ):
            return Response(
                {'detail': 'Your intern account is currently inactive. Please contact HR.'},
                status=status.HTTP_403_FORBIDDEN
            )

        cache.delete(cache_key)
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_data,
            'must_change_password': bool(user.must_change_password),
            'mustChangePassword': bool(user.must_change_password),
        })


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password') or request.data.get('currentPassword') or ''
        new_password = request.data.get('new_password') or request.data.get('newPassword') or ''
        confirm_password = request.data.get('confirm_password') or request.data.get('confirmPassword') or new_password

        if current_password and not user.check_password(current_password):
            return Response(
                {'detail': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not new_password or len(new_password) < 8:
            return Response(
                {'detail': 'New password must be at least 8 characters long.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {'detail': 'New password and confirmation password do not match.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.check_password(new_password):
            return Response(
                {'detail': 'New password must be different from your temporary initial password.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        temp_pattern = generate_temporary_password(full_name, user.course_code or 'INT01')
        if new_password.lower() == temp_pattern.lower():
            return Response(
                {'detail': 'For security, your permanent password cannot be your name combined with your course code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.must_change_password = False
        user.save(update_fields=['password', 'must_change_password'])

        return Response({
            'status': 'password_changed',
            'must_change_password': False,
            'mustChangePassword': False,
            'user': UserSerializer(user).data,
        })


# --- Current User Profile ---

class CurrentUserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- HR Module ---

class HRDashboardView(APIView):
    permission_classes = [IsHR]

    def get(self, request):
        today = timezone.now().date()
        
        # Auto-update overdue assignments
        ProjectAssignment.objects.filter(
            due_date__lt=today
        ).exclude(
            status__in=[
                ProjectAssignmentStatus.COMPLETED,
                ProjectAssignmentStatus.SUBMITTED,
                ProjectAssignmentStatus.UNDER_REVIEW
            ]
        ).update(status=ProjectAssignmentStatus.OVERDUE)

        total_mentors = User.objects.filter(role=UserRole.MENTOR).count()
        total_interns = User.objects.filter(role=UserRole.INTERN).count()
        active_interns = User.objects.filter(role=UserRole.INTERN, is_active_intern=True).count()
        interns_without_mentor = User.objects.filter(role=UserRole.INTERN, assigned_mentor__isnull=True).count()

        total_assignments = ProjectAssignment.objects.count()
        completed_projects = ProjectAssignment.objects.filter(status=ProjectAssignmentStatus.COMPLETED).count()
        pending_projects = ProjectAssignment.objects.filter(
            status__in=[ProjectAssignmentStatus.ASSIGNED, ProjectAssignmentStatus.IN_PROGRESS, ProjectAssignmentStatus.UNDER_REVIEW]
        ).count()
        overdue_projects = ProjectAssignment.objects.filter(status=ProjectAssignmentStatus.OVERDUE).count()

        pending_certificates = Certificate.objects.filter(status='PENDING').count()
        recent_pending_certs = Certificate.objects.filter(status='PENDING').order_by('-request_date')[:10]
        cert_serializer = CertificateSerializer(recent_pending_certs, many=True)

        return Response({
            'kpis': {
                'total_mentors': total_mentors,
                'total_interns': total_interns,
                'active_interns': active_interns,
                'interns_without_mentors': interns_without_mentor,
                'total_projects_assigned': total_assignments,
                'completed_projects': completed_projects,
                'pending_projects': pending_projects,
                'overdue_projects': overdue_projects,
                'pending_certificate_approvals': pending_certificates,
            },
            'pending_certificates': cert_serializer.data
        })


class HRMentorViewSet(viewsets.ModelViewSet):
    permission_classes = [IsHR]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(role=UserRole.MENTOR).order_by('-id')

    def create(self, request, *args, **kwargs):
        serializer = MentorCreateSerializer(data=request.data)
        if serializer.is_valid():
            mentor = serializer.save()
            return Response(UserSerializer(mentor).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HRInternViewSet(viewsets.ModelViewSet):
    permission_classes = [IsHR]
    serializer_class = UserSerializer

    def get_queryset(self):
        ensure_default_departments_and_programs()
        qs = User.objects.filter(role=UserRole.INTERN).select_related(
            'assigned_mentor', 'department_ref', 'program', 'hr_contact'
        ).order_by('-id')
        search = (self.request.query_params.get('search') or '').strip()
        dept = (self.request.query_params.get('department') or '').strip()
        course_param = (self.request.query_params.get('course') or '').strip()
        batch_param = (self.request.query_params.get('batch') or '').strip()
        status_param = (self.request.query_params.get('status') or '').strip()
        start_after = (self.request.query_params.get('start_date') or '').strip()
        end_before = (self.request.query_params.get('end_date') or '').strip()

        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(intern_code__icontains=search)
                | Q(college__icontains=search)
                | Q(course__icontains=search)
                | Q(course_name__icontains=search)
                | Q(course_code__icontains=search)
                | Q(batch__icontains=search)
                | Q(internship_role__icontains=search)
            )
        if dept:
            if dept.isdigit():
                qs = qs.filter(department_ref_id=int(dept))
            else:
                qs = qs.filter(Q(department_ref__name__iexact=dept) | Q(department__iexact=dept))
        if course_param:
            qs = qs.filter(
                Q(course__icontains=course_param)
                | Q(course_name__icontains=course_param)
                | Q(course_code__iexact=course_param)
            )
        if batch_param:
            qs = qs.filter(batch__icontains=batch_param)
        if status_param:
            qs = qs.filter(intern_status__iexact=status_param)
        if start_after:
            qs = qs.filter(start_date__gte=start_after)
        if end_before:
            qs = qs.filter(end_date__lte=end_before)
        return qs

    def create(self, request, *args, **kwargs):
        ensure_default_departments_and_programs()
        serializer = InternCreateSerializer(data=request.data)
        if serializer.is_valid():
            intern = serializer.save(created_by=request.user)
            if not intern.hr_contact:
                intern.hr_contact = request.user
                intern.save(update_fields=['hr_contact'])

            # Send automated welcome notification & email (without logging raw password in DB logs)
            send_notification_and_email(
                recipient=intern,
                title="Welcome to the Internship Portal!",
                message=(
                    f"Congratulations! Your internship account has been registered. "
                    f"Username: {intern.username}. Please change your temporary password on first login."
                ),
                notification_type='REGISTRATION',
                link='/login'
            )
            data = UserSerializer(intern).data
            temp_pwd = getattr(intern, '_generated_temporary_password', '')
            data['generated_credentials'] = {
                'username': intern.username,
                'temporary_password': temp_pwd,
                'must_change_password': intern.must_change_password,
            }
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='preview-credentials')
    def preview_credentials(self, request):
        full_name = (
            request.data.get('full_name')
            or request.data.get('fullName')
            or f"{request.data.get('first_name', '')} {request.data.get('last_name', '')}"
        ).strip()
        course_name = (
            request.data.get('course_name')
            or request.data.get('courseName')
            or request.data.get('course')
            or ''
        ).strip()
        course_code = (
            request.data.get('course_code')
            or request.data.get('courseCode')
            or 'INT01'
        ).strip()

        if not full_name:
            return Response({'detail': 'Full Name is required to preview credentials.'}, status=status.HTTP_400_BAD_REQUEST)

        username = generate_unique_intern_username(full_name)
        temporary_password = generate_temporary_password(full_name, course_code)
        return Response({
            'full_name': full_name,
            'course_name': course_name,
            'course_code': course_code,
            'username': username,
            'temporary_password': temporary_password,
            'must_change_password': True,
        })

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        intern = self.get_object()
        full_name = f"{intern.first_name} {intern.last_name}".strip() or intern.username
        course_code = (
            request.data.get('course_code')
            or intern.course_code
            or 'INT01'
        ).strip()
        temp_password = generate_temporary_password(full_name, course_code)
        intern.set_password(temp_password)
        intern.must_change_password = True
        intern.save(update_fields=['password', 'must_change_password'])

        return Response({
            'status': 'password_reset',
            'username': intern.username,
            'temporary_password': temp_password,
            'must_change_password': True,
            'user': UserSerializer(intern).data,
        })

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        intern = self.get_object()
        requested = (request.data.get('status') or '').strip()
        if requested.lower() in ('active', 'inactive'):
            next_status = 'Active' if requested.lower() == 'active' else 'Inactive'
        else:
            next_status = 'Inactive' if intern.intern_status == 'Active' else 'Active'
        intern.intern_status = next_status
        intern.is_active_intern = next_status == 'Active'
        intern.save()
        return Response(UserSerializer(intern).data)

    @action(detail=True, methods=['post'], url_path='change-status')
    def change_status(self, request, pk=None):
        intern = self.get_object()
        new_status = (request.data.get('status') or '').strip()
        valid_map = {c[0].lower(): c[0] for c in InternStatusChoices.choices}
        if new_status.lower() not in valid_map:
            return Response(
                {'detail': f"Invalid status '{new_status}'. Choose from: {', '.join(valid_map.values())}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        intern.intern_status = valid_map[new_status.lower()]
        intern.save()
        return Response(UserSerializer(intern).data)

    @action(detail=True, methods=['post'], url_path='assign-mentor')
    def assign_mentor(self, request, pk=None):
        intern = self.get_object()
        mentor_id = request.data.get('mentor_id')
        
        if mentor_id:
            mentor = get_object_or_404(User, id=mentor_id, role=UserRole.MENTOR)
            intern.assigned_mentor = mentor
            intern.save(update_fields=['assigned_mentor'])
            
            send_notification_and_email(
                recipient=intern,
                title="Mentor Assigned",
                message=f"You have been assigned to mentor {mentor.get_full_name() or mentor.username}.",
                notification_type='GENERAL',
                link='/profile'
            )
            send_notification_and_email(
                recipient=mentor,
                title="New Intern Assigned",
                message=f"Intern {intern.get_full_name() or intern.username} has been assigned to you.",
                notification_type='GENERAL',
                link='/mentor/interns'
            )
        else:
            intern.assigned_mentor = None
            intern.save(update_fields=['assigned_mentor'])

        return Response(UserSerializer(intern).data)


class HRCertificatesViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsHR]
    serializer_class = CertificateSerializer

    def get_queryset(self):
        status_filter = self.request.query_params.get('status')
        queryset = Certificate.objects.all().select_related('intern', 'approved_by')
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())
        return queryset

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        cert = self.get_object()
        if cert.status == 'APPROVED':
            return Response({'detail': 'Certificate already approved.'}, status=status.HTTP_400_BAD_REQUEST)

        cert.status = 'APPROVED'
        cert.approved_by = request.user
        cert.approval_date = timezone.now()
        generate_certificate_pdf(cert)

        # Automated Email & In-Portal Notification
        send_notification_and_email(
            recipient=cert.intern,
            title="Internship Completion Certificate Approved!",
            message=(
                f"Congratulations {cert.intern.get_full_name() or cert.intern.username}! "
                f"Your internship certificate #{cert.certificate_number} has been officially approved "
                f"by HR. You can now download your verified PDF certificate from the portal."
            ),
            notification_type='CERTIFICATE_STATUS',
            link='/intern/certificate'
        )

        return Response(CertificateSerializer(cert).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        cert = self.get_object()
        reason = request.data.get('reason', 'Requirements not fulfilled.')
        cert.status = 'REJECTED'
        cert.rejection_reason = reason
        cert.approved_by = request.user
        cert.approval_date = timezone.now()
        cert.save()

        send_notification_and_email(
            recipient=cert.intern,
            title="Certificate Request Update",
            message=f"Your certificate request was not approved. Reason: {reason}",
            notification_type='CERTIFICATE_STATUS',
            link='/intern/certificate'
        )

        return Response(CertificateSerializer(cert).data)


# --- Mentor Module ---

class MentorDashboardView(APIView):
    permission_classes = [IsMentor]

    def get(self, request):
        mentor = request.user
        assigned_interns_qs = mentor.assigned_interns.all()
        total_assigned_interns = assigned_interns_qs.count()
        active_interns = assigned_interns_qs.filter(is_active_intern=True).count()

        assignments_qs = ProjectAssignment.objects.filter(mentor=mentor)
        total_projects_assigned = assignments_qs.count()
        completed_projects = assignments_qs.filter(status=ProjectAssignmentStatus.COMPLETED).count()
        pending_projects = assignments_qs.filter(
            status__in=[ProjectAssignmentStatus.ASSIGNED, ProjectAssignmentStatus.IN_PROGRESS, ProjectAssignmentStatus.UNDER_REVIEW]
        ).count()
        overdue_projects = assignments_qs.filter(status=ProjectAssignmentStatus.OVERDUE).count()
        awaiting_eval = assignments_qs.filter(status=ProjectAssignmentStatus.SUBMITTED).count()

        upcoming_presentations = PresentationSchedule.objects.filter(
            mentor=mentor,
            presentation_date__gte=timezone.now().date(),
            status__in=['SCHEDULED', 'RESCHEDULED']
        ).count()

        return Response({
            'kpis': {
                'total_assigned_interns': total_assigned_interns,
                'active_interns': active_interns,
                'total_projects_assigned': total_projects_assigned,
                'completed_projects': completed_projects,
                'pending_projects': pending_projects,
                'overdue_projects': overdue_projects,
                'projects_awaiting_evaluation': awaiting_eval,
                'upcoming_presentations': upcoming_presentations,
            }
        })


class MentorProjectsViewSet(viewsets.ModelViewSet):
    permission_classes = [IsMentor]
    serializer_class = ProjectSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        if self.request.user.role == UserRole.ADMIN:
            return Project.objects.all().order_by('-created_at')
        return Project.objects.filter(created_by=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MentorInternsView(APIView):
    permission_classes = [IsMentor]

    def get(self, request, pk=None):
        mentor = request.user
        if pk:
            # View individual intern profile
            intern = get_object_or_404(User, id=pk, role=UserRole.INTERN)
            if request.user.role != UserRole.ADMIN and intern.assigned_mentor_id != mentor.id:
                return Response({'detail': 'Access denied to this intern profile.'}, status=status.HTTP_403_FORBIDDEN)
            
            assignments = ProjectAssignment.objects.filter(intern=intern).select_related('project')
            presentations = PresentationSchedule.objects.filter(intern=intern).select_related('project')
            certificate = Certificate.objects.filter(intern=intern).order_by('-request_date').first()
            
            return Response({
                'intern': UserSerializer(intern).data,
                'assignments': ProjectAssignmentSerializer(assignments, many=True).data,
                'presentations': PresentationScheduleSerializer(presentations, many=True).data,
                'certificate': CertificateSerializer(certificate).data if certificate else None,
            })
        else:
            # List all assigned interns
            if request.user.role == UserRole.ADMIN:
                interns = User.objects.filter(role=UserRole.INTERN)
            else:
                interns = mentor.assigned_interns.all()
            return Response(UserSerializer(interns, many=True).data)

    def post(self, request, pk=None):
        """Mentor explicitly marks overall internship completed and triggers a unique CertificateRequest for HR."""
        intern = get_object_or_404(User, id=pk, role=UserRole.INTERN)
        if request.user.role != UserRole.ADMIN and intern.assigned_mentor_id != request.user.id:
            return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        existing = Certificate.objects.filter(intern=intern, status__in=['PENDING', 'APPROVED']).first()
        if existing:
            return Response(
                {'detail': f'Certificate request already {existing.status.lower()}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cert = Certificate.objects.create(intern=intern, status='PENDING')
        for hr in User.objects.filter(role__in=[UserRole.HR, UserRole.ADMIN]):
            send_notification_and_email(
                recipient=hr,
                title=f"Internship Completed & Certificate Pending: {intern.get_full_name() or intern.username}",
                message=f"Mentor {request.user.get_full_name() or request.user.username} marked {intern.get_full_name() or intern.username}'s internship completed.",
                notification_type='CERTIFICATE_STATUS',
                link='/hr/certificates'
            )
        return Response(CertificateSerializer(cert).data, status=status.HTTP_201_CREATED)


class MentorAssignmentsViewSet(viewsets.ModelViewSet):
    permission_classes = [IsMentor]
    serializer_class = ProjectAssignmentSerializer

    def get_queryset(self):
        mentor = self.request.user
        if mentor.role == UserRole.ADMIN:
            return ProjectAssignment.objects.all().select_related('project', 'intern', 'mentor')
        return ProjectAssignment.objects.filter(mentor=mentor).select_related('project', 'intern', 'mentor')

    def create(self, request, *args, **kwargs):
        project_id = request.data.get('project')
        intern_id = request.data.get('intern')
        due_date = request.data.get('due_date')
        assigned_date = request.data.get('assigned_date', timezone.now().date())

        project = get_object_or_404(Project, id=project_id)
        intern = get_object_or_404(User, id=intern_id, role=UserRole.INTERN)
        if request.user.role != UserRole.ADMIN and intern.assigned_mentor_id != request.user.id:
            return Response(
                {'detail': 'Mentors may assign projects only to their own assigned interns.'},
                status=status.HTTP_403_FORBIDDEN
            )

        assignment = ProjectAssignment.objects.create(
            project=project,
            intern=intern,
            mentor=request.user,
            assigned_date=assigned_date,
            due_date=due_date,
            status=ProjectAssignmentStatus.ASSIGNED
        )

        # Automated Email & Notification for new project assignment
        send_notification_and_email(
            recipient=intern,
            title=f"New Project Assigned: {project.title}",
            message=(
                f"You have been assigned a new project '{project.title}'. "
                f"Assigned Date: {assigned_date}. Due Date: {due_date}. "
                f"Check project guidelines and datasets in the portal."
            ),
            notification_type='PROJECT_ASSIGNED',
            link='/intern/projects'
        )

        return Response(ProjectAssignmentSerializer(assignment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def evaluate(self, request, pk=None):
        assignment = self.get_object()
        score = request.data.get('score')
        notes = request.data.get('evaluation_notes', '')
        mark_completed = request.data.get('mark_completed', False)
        request_revision = request.data.get('request_revision', False)

        if score is not None:
            try:
                numeric_score = float(score)
            except (TypeError, ValueError):
                return Response({'detail': 'Score must be a valid number between 0 and 100.'}, status=status.HTTP_400_BAD_REQUEST)
            if numeric_score < 0 or numeric_score > 100:
                return Response({'detail': 'Score must be between 0 and 100.'}, status=status.HTTP_400_BAD_REQUEST)
            assignment.score = numeric_score
        assignment.evaluation_notes = notes
        assignment.evaluated_at = timezone.now()

        if mark_completed:
            assignment.status = ProjectAssignmentStatus.COMPLETED
        elif request_revision:
            assignment.status = ProjectAssignmentStatus.REVISION_REQUIRED
        else:
            assignment.status = ProjectAssignmentStatus.UNDER_REVIEW

        assignment.save()

        # Notify Intern
        send_notification_and_email(
            recipient=assignment.intern,
            title=f"Project Evaluation: {assignment.project.title}",
            message=(
                f"Your mentor evaluated '{assignment.project.title}'. "
                f"Status: {assignment.get_status_display()}. "
                f"Score: {assignment.score if assignment.score is not None else 'N/A'}/100. "
                f"Feedback: {notes or 'No remarks provided.'}"
            ),
            notification_type='GENERAL',
            link='/intern/projects'
        )

        return Response(ProjectAssignmentSerializer(assignment).data)


class MentorExtensionRequestsViewSet(viewsets.ModelViewSet):
    permission_classes = [IsMentor]
    serializer_class = ExtensionRequestSerializer

    def get_queryset(self):
        mentor = self.request.user
        if mentor.role == UserRole.ADMIN:
            return ExtensionRequest.objects.all().select_related('assignment', 'intern')
        return ExtensionRequest.objects.filter(assignment__mentor=mentor).select_related('assignment', 'intern')

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        ext_req = self.get_object()
        action_type = request.data.get('status')  # 'APPROVED' or 'REJECTED'
        mentor_notes = request.data.get('mentor_notes', '')
        revised_due_date = request.data.get('revised_due_date') or ext_req.requested_date

        if action_type == 'APPROVED':
            ext_req.status = ExtensionRequest.RequestStatus.APPROVED
            ext_req.assignment.due_date = revised_due_date
            if ext_req.assignment.status == ProjectAssignmentStatus.OVERDUE:
                ext_req.assignment.status = ProjectAssignmentStatus.IN_PROGRESS
            ext_req.assignment.save(update_fields=['due_date', 'status'])
        else:
            ext_req.status = ExtensionRequest.RequestStatus.REJECTED

        ext_req.mentor_notes = mentor_notes
        ext_req.reviewed_at = timezone.now()
        ext_req.save()

        send_notification_and_email(
            recipient=ext_req.intern,
            title=f"Extension Request {ext_req.get_status_display()}",
            message=(
                f"Your due date extension request for '{ext_req.assignment.project.title}' "
                f"has been {ext_req.get_status_display().lower()}. "
                f"{'New Due Date: ' + str(ext_req.assignment.due_date) if ext_req.status == 'APPROVED' else ''} "
                f"Notes: {mentor_notes}"
            ),
            notification_type='GENERAL',
            link='/intern/projects'
        )

        return Response(ExtensionRequestSerializer(ext_req).data)


class MentorPresentationsViewSet(viewsets.ModelViewSet):
    permission_classes = [IsMentor]
    serializer_class = PresentationScheduleSerializer

    def get_queryset(self):
        mentor = self.request.user
        if mentor.role == UserRole.ADMIN:
            return PresentationSchedule.objects.all().select_related('project', 'intern', 'mentor')
        return PresentationSchedule.objects.filter(mentor=mentor).select_related('project', 'intern', 'mentor')

    def perform_create(self, serializer):
        pres = serializer.save(mentor=self.request.user)
        send_notification_and_email(
            recipient=pres.intern,
            title=f"Presentation Scheduled: {pres.project.title}",
            message=(
                f"A presentation for '{pres.project.title}' has been scheduled for "
                f"{pres.presentation_date} at {pres.presentation_time}. "
                f"Google Meet Link: {pres.google_meet_link}"
            ),
            notification_type='GENERAL',
            link='/intern/presentations'
        )

    def perform_update(self, serializer):
        pres = serializer.save()
        send_notification_and_email(
            recipient=pres.intern,
            title=f"Presentation Schedule Updated: {pres.project.title}",
            message=(
                f"Your presentation for '{pres.project.title}' status is now '{pres.get_status_display()}'. "
                f"Date: {pres.presentation_date} at {pres.presentation_time}. "
                f"Link: {pres.google_meet_link}"
            ),
            notification_type='GENERAL',
            link='/intern/presentations'
        )


# --- Intern Module ---

class InternProfileView(APIView):
    permission_classes = [IsIntern]

    def get(self, request):
        intern = request.user
        assignments = ProjectAssignment.objects.filter(intern=intern).select_related('project', 'mentor')
        presentations = PresentationSchedule.objects.filter(intern=intern).select_related('project', 'mentor')
        certificate = Certificate.objects.filter(intern=intern).order_by('-request_date').first()

        completed_count = assignments.filter(status=ProjectAssignmentStatus.COMPLETED).count()
        total_assigned = assignments.count()
        avg_score = assignments.filter(score__isnull=False).aggregate(Avg('score'))['score__avg']

        return Response({
            'user': UserSerializer(intern).data,
            'summary': {
                'total_assigned': total_assigned,
                'completed': completed_count,
                'in_progress': assignments.filter(status__in=[ProjectAssignmentStatus.ASSIGNED, ProjectAssignmentStatus.IN_PROGRESS]).count(),
                'submitted': assignments.filter(status=ProjectAssignmentStatus.SUBMITTED).count(),
                'average_score': round(avg_score, 1) if avg_score else None,
                'completion_percentage': round((completed_count / total_assigned * 100), 1) if total_assigned > 0 else 0
            },
            'assignments': ProjectAssignmentSerializer(assignments, many=True).data,
            'presentations': PresentationScheduleSerializer(presentations, many=True).data,
            'certificate': CertificateSerializer(certificate).data if certificate else None
        })


class InternAssignmentsViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsIntern]
    serializer_class = ProjectAssignmentSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        intern = self.request.user
        # Auto-evaluate overdue
        assignments = ProjectAssignment.objects.filter(intern=intern).select_related('project', 'mentor')
        for a in assignments:
            a.update_overdue_status()
        return assignments

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def submit(self, request, pk=None):
        assignment = self.get_object()
        file_obj = request.FILES.get('submission_file')
        notes = request.data.get('submission_notes', '')

        if not file_obj and not notes:
            return Response({'detail': 'Please provide submission file or notes.'}, status=status.HTTP_400_BAD_REQUEST)

        if file_obj:
            assignment.submission_file = file_obj
        assignment.submission_notes = notes
        is_resubmission = assignment.status == ProjectAssignmentStatus.REVISION_REQUIRED or assignment.submitted_at is not None
        assignment.submitted_at = timezone.now()
        assignment.status = ProjectAssignmentStatus.RESUBMITTED if is_resubmission else ProjectAssignmentStatus.SUBMITTED
        assignment.save()

        # Notify Mentor
        send_notification_and_email(
            recipient=assignment.mentor,
            title=f"Project Submitted by {assignment.intern.get_full_name() or assignment.intern.username}",
            message=f"Intern submitted project '{assignment.project.title}' for review.",
            notification_type='GENERAL',
            link='/mentor/assignments'
        )

        return Response(ProjectAssignmentSerializer(assignment).data)


class InternExtensionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsIntern]
    serializer_class = ExtensionRequestSerializer

    def get_queryset(self):
        return ExtensionRequest.objects.filter(intern=self.request.user).select_related('assignment')

    def create(self, request, *args, **kwargs):
        assignment_id = request.data.get('assignment')
        reason = request.data.get('reason')
        requested_date = request.data.get('requested_date')

        assignment = get_object_or_404(ProjectAssignment, id=assignment_id, intern=request.user)

        ext = ExtensionRequest.objects.create(
            assignment=assignment,
            intern=request.user,
            reason=reason,
            requested_date=requested_date,
            status=ExtensionRequest.RequestStatus.PENDING
        )

        send_notification_and_email(
            recipient=assignment.mentor,
            title=f"Extension Requested for {assignment.project.title}",
            message=(
                f"Intern {request.user.get_full_name() or request.user.username} requested a deadline extension "
                f"to {requested_date}. Reason: {reason}"
            ),
            notification_type='GENERAL',
            link='/mentor/extensions'
        )

        return Response(ExtensionRequestSerializer(ext).data, status=status.HTTP_201_CREATED)


class InternPresentationsView(APIView):
    permission_classes = [IsIntern]

    def get(self, request):
        presentations = PresentationSchedule.objects.filter(intern=request.user).select_related('project', 'mentor')
        return Response(PresentationScheduleSerializer(presentations, many=True).data)


class InternCertificateView(APIView):
    permission_classes = [IsIntern]

    def get(self, request):
        certs = Certificate.objects.filter(intern=request.user).order_by('-request_date')
        return Response(CertificateSerializer(certs, many=True).data)

    def post(self, request):
        intern = request.user
        
        # Check if already has a pending or approved certificate
        existing = Certificate.objects.filter(intern=intern, status__in=['PENDING', 'APPROVED']).first()
        if existing:
            return Response(
                {'detail': f'You already have a {existing.status.lower()} certificate request.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cert = Certificate.objects.create(
            intern=intern,
            status='PENDING'
        )

        # Notify HR
        hr_users = User.objects.filter(role__in=[UserRole.HR, UserRole.ADMIN])
        for hr in hr_users:
            send_notification_and_email(
                recipient=hr,
                title=f"New Certificate Approval Request: {intern.get_full_name() or intern.username}",
                message=f"Intern {intern.get_full_name() or intern.username} has completed requirements and submitted a certificate request.",
                notification_type='CERTIFICATE_STATUS',
                link='/hr/certificates'
            )

        return Response(CertificateSerializer(cert).data, status=status.HTTP_201_CREATED)


# --- Common Notifications Module ---

class NotificationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})


# --- Automated Deadline Check View (Can be invoked manually or scheduled) ---

class DeadlineReminderCheckView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        tomorrow = timezone.now().date() + timedelta(days=1)
        due_tomorrow_assignments = ProjectAssignment.objects.filter(
            due_date=tomorrow
        ).exclude(
            status__in=[ProjectAssignmentStatus.COMPLETED, ProjectAssignmentStatus.SUBMITTED]
        )

        notified_count = 0
        for assignment in due_tomorrow_assignments:
            send_notification_and_email(
                recipient=assignment.intern,
                title=f"Reminder: '{assignment.project.title}' is due tomorrow!",
                message=(
                    f"Heads up! Your project '{assignment.project.title}' is due on {assignment.due_date}. "
                    f"Please submit your work on time or request an extension if required."
                ),
                notification_type='DEADLINE_REMINDER',
                link='/intern/projects'
            )
            notified_count += 1

        return Response({'status': 'ok', 'reminders_sent': notified_count})


# --- Admin Website Branding & Dynamic Theme Customization Module ---

def get_or_create_branding():
    obj, _ = WebsiteBranding.objects.get_or_create(id=1)
    return obj


def get_or_create_published_theme():
    obj = WebsiteTheme.objects.filter(is_active=True, is_draft=False).first()
    if not obj:
        obj = WebsiteTheme.objects.create(is_active=True, is_draft=False)
    return obj


class PublicWebsiteConfigView(APIView):
    """Public endpoint returning only published branding and active published theme."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        branding = get_or_create_branding()
        theme = get_or_create_published_theme()
        return Response({
            'branding': WebsiteBrandingSerializer(branding).data,
            'theme': WebsiteThemeSerializer(theme).data,
        })


class AdminBrandingView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        return Response(WebsiteBrandingSerializer(get_or_create_branding()).data)

    def put(self, request):
        branding = get_or_create_branding()
        serializer = WebsiteBrandingSerializer(branding, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminBrandingUploadView(APIView):
    permission_classes = [IsAdminUserRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    ALLOWED_EXT = {'png', 'jpg', 'jpeg', 'svg', 'webp', 'ico'}
    MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

    def post(self, request):
        variant = request.data.get('variant', 'primary_logo')
        valid_variants = {'primary_logo', 'dark_logo', 'light_logo', 'mobile_logo', 'favicon'}
        if variant not in valid_variants:
            return Response({'detail': 'Invalid logo variant.'}, status=status.HTTP_400_BAD_REQUEST)

        file_obj = request.FILES.get('file')
        data_url = request.data.get('data_url') or request.data.get('file_url') or request.data.get('url')

        branding = get_or_create_branding()

        if file_obj:
            ext = file_obj.name.rsplit('.', 1)[-1].lower() if '.' in file_obj.name else ''
            if ext not in self.ALLOWED_EXT:
                return Response(
                    {'error': f'Unsupported file format .{ext}. Allowed: PNG, JPG, JPEG, SVG, WebP.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if file_obj.size > self.MAX_SIZE_BYTES:
                return Response({'error': 'File exceeds 5 MB limit.'}, status=status.HTTP_400_BAD_REQUEST)

            raw_head = file_obj.read(4096)
            file_obj.seek(0)
            if ext == 'svg':
                text_sample = raw_head.decode('utf-8', errors='ignore').lower()
                if '<script' in text_sample or 'onload=' in text_sample or 'javascript:' in text_sample:
                    return Response({'error': 'Unsafe SVG script content rejected.'}, status=status.HTTP_400_BAD_REQUEST)

            from django.core.files.storage import default_storage
            import uuid
            saved_path = default_storage.save(f"branding/{variant}_{uuid.uuid4().hex[:8]}.{ext}", file_obj)
            setattr(branding, variant, f"/media/{saved_path}")
        elif data_url:
            lower_url = str(data_url).lower()
            if '<script' in lower_url or 'javascript:' in lower_url or 'onload=' in lower_url:
                return Response({'error': 'Unsafe SVG rejected.'}, status=status.HTTP_400_BAD_REQUEST)
            if not any(t in lower_url for t in ['image/png', 'image/jpeg', 'image/jpg', 'image/svg', 'image/webp', '.png', '.svg', '.jpg', '.webp']):
                return Response({'error': 'Unsupported image format.'}, status=status.HTTP_400_BAD_REQUEST)
            setattr(branding, variant, data_url)
        else:
            return Response({'error': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if request.data.get('site_name'):
            branding.site_name = request.data.get('site_name')
        branding.updated_by = request.user
        branding.save()
        serialized = WebsiteBrandingSerializer(branding).data
        return Response({
            'status': 'uploaded',
            'variant': variant,
            'url': getattr(branding, variant),
            'branding': serialized,
            **serialized,
        })


class AdminBrandingLogoDeleteView(APIView):
    permission_classes = [IsAdminUserRole]

    def delete(self, request):
        variant = request.data.get('variant') or request.query_params.get('variant') or 'all'
        branding = get_or_create_branding()
        valid_variants = {'primary_logo', 'dark_logo', 'light_logo', 'mobile_logo', 'favicon'}
        if variant == 'all':
            for v in valid_variants:
                setattr(branding, v, '/beat-logo.png')
            branding.site_name = 'Beat Internship Portal'
        elif variant in valid_variants:
            setattr(branding, variant, '/beat-logo.png')
        else:
            return Response({'error': 'Invalid logo variant.'}, status=status.HTTP_400_BAD_REQUEST)
        branding.updated_by = request.user
        branding.save()
        serialized = WebsiteBrandingSerializer(branding).data
        return Response({'status': 'reset', 'branding': serialized, **serialized})


class AdminThemeView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        published = get_or_create_published_theme()
        draft = WebsiteTheme.objects.filter(is_draft=True).order_by('-updated_at').first()
        return Response({
            'published': WebsiteThemeSerializer(published).data,
            'draft': WebsiteThemeSerializer(draft).data if draft else None,
        })

    def put(self, request):
        published = get_or_create_published_theme()
        serializer = WebsiteThemeSerializer(published, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(is_active=True, is_draft=False)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminThemeDraftView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request):
        draft = WebsiteTheme.objects.filter(is_draft=True).order_by('-updated_at').first()
        if not draft:
            draft = WebsiteTheme(is_draft=True, is_active=False)
        serializer = WebsiteThemeSerializer(draft, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(is_draft=True, is_active=False)
            return Response({'status': 'draft_saved', 'draft': serializer.data, **serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminThemePublishView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request):
        published = get_or_create_published_theme()
        payload = request.data
        if not payload:
            draft = WebsiteTheme.objects.filter(is_draft=True).order_by('-updated_at').first()
            if draft:
                payload = WebsiteThemeSerializer(draft).data
        serializer = WebsiteThemeSerializer(published, data=payload, partial=True)
        if serializer.is_valid():
            serializer.save(is_active=True, is_draft=False)
            WebsiteTheme.objects.filter(is_draft=True).delete()
            return Response({'status': 'published', 'theme': serializer.data, **serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminThemeResetView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request):
        WebsiteTheme.objects.all().delete()
        published = get_or_create_published_theme()
        serialized = WebsiteThemeSerializer(published).data
        return Response({'status': 'reset', 'theme': serialized, **serialized})


# --- HR Intern Departments, Programs, Bulk CSV/Excel Import & Export ---

class HRDepartmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsHR]
    serializer_class = InternDepartmentSerializer

    def get_queryset(self):
        ensure_default_departments_and_programs()
        return InternDepartment.objects.all().order_by('name')


class HRProgramViewSet(viewsets.ModelViewSet):
    permission_classes = [IsHR]
    serializer_class = InternshipProgramSerializer

    def get_queryset(self):
        ensure_default_departments_and_programs()
        return InternshipProgram.objects.select_related('department_ref').all().order_by('title')


class HRInternImportPreviewView(APIView):
    permission_classes = [IsHR]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        ensure_default_departments_and_programs()
        file_obj = request.FILES.get('file')
        if file_obj:
            try:
                headers, rows, file_type = parse_uploaded_table_file(file_obj, file_obj.name)
            except ValueError as e:
                return Response({'detail': str(e), 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            file_name = file_obj.name
        else:
            rows = request.data.get('rows') or []
            if not isinstance(rows, list) or len(rows) == 0:
                return Response(
                    {'detail': 'Please upload a valid CSV or Excel file or provide rows.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            headers = request.data.get('headers') or list(rows[0].keys())
            file_name = request.data.get('file_name', 'interns_import.csv')
            file_type = request.data.get('file_type', 'CSV')

        detected_mapping = auto_detect_column_mapping(headers)
        validation = validate_import_rows(rows, column_mapping=detected_mapping)

        return Response({
            'file_name': file_name,
            'file_type': file_type,
            'headers': headers,
            'system_fields': SYSTEM_FIELDS,
            'column_mapping': detected_mapping,
            'total_records': len(rows),
            'raw_rows': rows,
            'validation': validation,
        })


class HRInternImportValidateView(APIView):
    permission_classes = [IsHR]

    def post(self, request):
        rows = request.data.get('rows') or []
        column_mapping = request.data.get('column_mapping') or {}
        if not isinstance(rows, list):
            return Response({'detail': 'Invalid rows payload.'}, status=status.HTTP_400_BAD_REQUEST)
        validation = validate_import_rows(rows, column_mapping=column_mapping)
        return Response(validation)


class HRInternImportConfirmView(APIView):
    permission_classes = [IsHR]

    def post(self, request):
        rows = request.data.get('rows') or []
        column_mapping = request.data.get('column_mapping') or None
        file_name = request.data.get('file_name') or 'interns_import.csv'
        file_type = request.data.get('file_type') or 'CSV'
        skip_invalid = bool(request.data.get('skip_invalid', True))
        duplicate_action = request.data.get('duplicate_action') or 'skip'
        confirm_update_existing = bool(request.data.get('confirm_update_existing', False))

        if not isinstance(rows, list) or len(rows) == 0:
            return Response({'detail': 'No records provided to import.'}, status=status.HTTP_400_BAD_REQUEST)

        if duplicate_action == 'update' and not confirm_update_existing:
            return Response(
                {'detail': 'Explicit confirmation (confirm_update_existing=true) is required to update existing intern records.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = execute_import_confirm(
            raw_rows=rows,
            column_mapping=column_mapping,
            file_name=file_name,
            file_type=file_type,
            skip_invalid=skip_invalid,
            duplicate_action=duplicate_action,
            confirm_update_existing=confirm_update_existing,
            imported_by=request.user,
        )
        if result.get('status') == 'aborted':
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)


class HRInternImportHistoryView(APIView):
    permission_classes = [IsHR]

    def get(self, request):
        histories = ImportHistory.objects.all().order_by('-imported_at')[:100]
        return Response(ImportHistorySerializer(histories, many=True).data)


class HRInternExportView(APIView):
    permission_classes = [IsHR]

    def perform_content_negotiation(self, request, force=False):
        return (self.get_renderers()[0], '*/*')

    def get(self, request):
        ensure_default_departments_and_programs()
        export_format = (request.query_params.get('format') or request.query_params.get('export_format') or 'csv').lower()
        interns = User.objects.filter(role=UserRole.INTERN).select_related(
            'assigned_mentor', 'department_ref', 'hr_contact'
        ).order_by('id')

        dept = (request.query_params.get('department') or '').strip()
        status_param = (request.query_params.get('status') or '').strip()
        if dept:
            interns = interns.filter(Q(department_ref__name__iexact=dept) | Q(department__iexact=dept))
        if status_param:
            interns = interns.filter(intern_status__iexact=status_param)

        headers = [
            'Intern ID', 'Full Name', 'Email', 'Phone', 'Gender',
            'College / University', 'Course / Degree', 'Department',
            'Internship Role', 'Start Date', 'End Date', 'Duration',
            'Assigned Mentor', 'Status', 'Address'
        ]

        rows_data = []
        for idx, i in enumerate(interns, start=1):
            code = i.intern_code or f"INT-{timezone.now().year}-{i.id:04d}"
            full_name = f"{i.first_name} {i.last_name}".strip() or i.username
            dept_name = i.department_ref.name if i.department_ref else (i.department or 'Data Analytics')
            mentor_name = (
                f"{i.assigned_mentor.first_name} {i.assigned_mentor.last_name}".strip() or i.assigned_mentor.username
            ) if i.assigned_mentor else 'Unassigned'

            rows_data.append([
                sanitize_spreadsheet_cell(code),
                sanitize_spreadsheet_cell(full_name),
                sanitize_spreadsheet_cell(i.email),
                sanitize_spreadsheet_cell(i.phone),
                sanitize_spreadsheet_cell(i.gender),
                sanitize_spreadsheet_cell(i.college),
                sanitize_spreadsheet_cell(i.course or i.education_qualification),
                sanitize_spreadsheet_cell(dept_name),
                sanitize_spreadsheet_cell(i.internship_role or 'Data Analytics Intern'),
                sanitize_spreadsheet_cell(i.start_date.isoformat() if i.start_date else ''),
                sanitize_spreadsheet_cell(i.end_date.isoformat() if i.end_date else ''),
                sanitize_spreadsheet_cell(i.internship_duration),
                sanitize_spreadsheet_cell(mentor_name),
                sanitize_spreadsheet_cell(i.intern_status or 'Active'),
                sanitize_spreadsheet_cell(i.address),
            ])

        if export_format in ('xlsx', 'excel'):
            import io as _io
            import openpyxl
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = 'Interns'
            ws.append(headers)
            for row in rows_data:
                ws.append(row)
            buf = _io.BytesIO()
            wb.save(buf)
            buf.seek(0)
            response = HttpResponse(
                buf.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="interns_export.xlsx"'
            return response

        import csv as _csv
        import io as _io
        str_buf = _io.StringIO()
        writer = _csv.writer(str_buf)
        writer.writerow(headers)
        for row in rows_data:
            writer.writerow(row)
        response = HttpResponse(str_buf.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="interns_export.csv"'
        return response

