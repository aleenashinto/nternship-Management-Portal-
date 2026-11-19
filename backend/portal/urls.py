from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    CurrentUserProfileView,
    HRDashboardView, HRMentorViewSet, HRInternViewSet, HRCertificatesViewSet,
    MentorDashboardView, MentorProjectsViewSet, MentorInternsView,
    MentorAssignmentsViewSet, MentorExtensionRequestsViewSet, MentorPresentationsViewSet,
    InternProfileView, InternAssignmentsViewSet, InternExtensionViewSet,
    InternPresentationsView, InternCertificateView,
    NotificationViewSet, DeadlineReminderCheckView
)
from .openapi import OpenAPISchemaView, SwaggerDocsView

router = DefaultRouter()
# HR ViewSets
router.register(r'hr/mentors', HRMentorViewSet, basename='hr-mentors')
router.register(r'hr/interns', HRInternViewSet, basename='hr-interns')
router.register(r'hr/certificates', HRCertificatesViewSet, basename='hr-certificates')

# Mentor ViewSets
router.register(r'mentor/projects', MentorProjectsViewSet, basename='mentor-projects')
router.register(r'mentor/assignments', MentorAssignmentsViewSet, basename='mentor-assignments')
router.register(r'mentor/extensions', MentorExtensionRequestsViewSet, basename='mentor-extensions')
router.register(r'mentor/presentations', MentorPresentationsViewSet, basename='mentor-presentations')

# Intern ViewSets
router.register(r'intern/assignments', InternAssignmentsViewSet, basename='intern-assignments')
router.register(r'intern/extensions', InternExtensionViewSet, basename='intern-extensions')

# Notification ViewSet
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    # Swagger / OpenAPI Documentation
    path('schema/', OpenAPISchemaView.as_view(), name='openapi-schema'),
    path('docs/', SwaggerDocsView.as_view(), name='swagger-docs'),

    # Auth endpoints
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserProfileView.as_view(), name='current_user'),

    # HR Views
    path('hr/dashboard/', HRDashboardView.as_view(), name='hr-dashboard'),

    # Mentor Views
    path('mentor/dashboard/', MentorDashboardView.as_view(), name='mentor-dashboard'),
    path('mentor/interns/', MentorInternsView.as_view(), name='mentor-interns-list'),
    path('mentor/interns/<int:pk>/', MentorInternsView.as_view(), name='mentor-intern-detail'),

    # Intern Views
    path('intern/profile/', InternProfileView.as_view(), name='intern-profile'),
    path('intern/presentations/', InternPresentationsView.as_view(), name='intern-presentations'),
    path('intern/certificate/', InternCertificateView.as_view(), name='intern-certificate'),

    # Reminders
    path('reminders/check/', DeadlineReminderCheckView.as_view(), name='deadline-reminders-check'),

    # Router endpoints
    path('', include(router.urls)),
]
