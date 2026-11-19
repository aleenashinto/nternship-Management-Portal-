from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from django.db.models import Count, Q, Avg
from django.shortcuts import get_object_or_404
from datetime import timedelta

from .models import (
    User, UserRole, Project, ProjectAssignment, ProjectAssignmentStatus,
    ExtensionRequest, PresentationSchedule, Certificate, Notification
)
from .serializers import (
    UserSerializer, MentorCreateSerializer, InternCreateSerializer,
    ProjectSerializer, ProjectAssignmentSerializer, ExtensionRequestSerializer,
    PresentationScheduleSerializer, CertificateSerializer, NotificationSerializer
)
from .services import send_notification_and_email, generate_certificate_pdf


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
        return User.objects.filter(role=UserRole.INTERN).select_related('assigned_mentor').order_by('-id')

    def create(self, request, *args, **kwargs):
        serializer = InternCreateSerializer(data=request.data)
        if serializer.is_valid():
            intern = serializer.save()
            
            # Send automated welcome notification & email
            send_notification_and_email(
                recipient=intern,
                title="Welcome to the Internship Portal!",
                message=(
                    f"Congratulations! Your internship account has been registered. "
                    f"Username: {intern.username}. You can now log in and track your projects."
                ),
                notification_type='REGISTRATION',
                link='/login'
            )
            return Response(UserSerializer(intern).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
