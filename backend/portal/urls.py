from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    PortalLoginView, ChangePasswordView, CurrentUserProfileView,
    HRDashboardView, HRMentorViewSet, HRInternViewSet, HRCertificatesViewSet,
    HRDepartmentViewSet, HRProgramViewSet,
    HRInternImportPreviewView, HRInternImportValidateView,
    HRInternImportConfirmView, HRInternImportHistoryView, HRInternExportView,
    MentorDashboardView, MentorProjectsViewSet, MentorInternsView,
    MentorAssignmentsViewSet, MentorExtensionRequestsViewSet, MentorPresentationsViewSet,
    InternProfileView, InternAssignmentsViewSet, InternExtensionViewSet,
    InternPresentationsView, InternCertificateView,
    NotificationViewSet, DeadlineReminderCheckView,
    PublicWebsiteConfigView, AdminBrandingView, AdminBrandingUploadView,
    AdminBrandingLogoDeleteView, AdminThemeView, AdminThemeDraftView,
    AdminThemePublishView, AdminThemeResetView
)
from .openapi import OpenAPISchemaView, SwaggerDocsView

router = DefaultRouter()
# HR ViewSets
router.register(r'hr/mentors', HRMentorViewSet, basename='hr-mentors')
router.register(r'hr/interns', HRInternViewSet, basename='hr-interns')
router.register(r'hr/certificates', HRCertificatesViewSet, basename='hr-certificates')
router.register(r'hr/departments', HRDepartmentViewSet, basename='hr-departments')
router.register(r'hr/programs', HRProgramViewSet, basename='hr-programs')

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
    path('auth/login/', PortalLoginView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserProfileView.as_view(), name='current_user'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),

    # HR Views
    path('hr/dashboard/', HRDashboardView.as_view(), name='hr-dashboard'),
    path('hr/interns/import/preview/', HRInternImportPreviewView.as_view(), name='hr-interns-import-preview'),
    path('hr/interns/import/validate/', HRInternImportValidateView.as_view(), name='hr-interns-import-validate'),
    path('hr/interns/import/confirm/', HRInternImportConfirmView.as_view(), name='hr-interns-import-confirm'),
    path('hr/interns/import/history/', HRInternImportHistoryView.as_view(), name='hr-interns-import-history'),
    path('hr/interns/export/', HRInternExportView.as_view(), name='hr-interns-export'),

    # Mentor Views
    path('mentor/dashboard/', MentorDashboardView.as_view(), name='mentor-dashboard'),
    path('mentor/interns/', MentorInternsView.as_view(), name='mentor-interns-list'),
    path('mentor/interns/<int:pk>/', MentorInternsView.as_view(), name='mentor-intern-detail'),
    path('mentor/interns/<int:pk>/complete-internship/', MentorInternsView.as_view(), name='mentor-complete-internship'),

    # Intern Views
    path('intern/profile/', InternProfileView.as_view(), name='intern-profile'),
    path('intern/presentations/', InternPresentationsView.as_view(), name='intern-presentations'),
    path('intern/certificate/', InternCertificateView.as_view(), name='intern-certificate'),

    # Reminders
    path('reminders/check/', DeadlineReminderCheckView.as_view(), name='deadline-reminders-check'),

    # Public Website Config & Admin Branding / Theme Customization
    path('public/website-config/', PublicWebsiteConfigView.as_view(), name='public-website-config'),
    path('admin/branding/', AdminBrandingView.as_view(), name='admin-branding'),
    path('admin/branding/upload/', AdminBrandingUploadView.as_view(), name='admin-branding-upload'),
    path('admin/branding/logo/', AdminBrandingLogoDeleteView.as_view(), name='admin-branding-logo-delete'),
    path('admin/theme/', AdminThemeView.as_view(), name='admin-theme'),
    path('admin/theme/draft/', AdminThemeDraftView.as_view(), name='admin-theme-draft'),
    path('admin/theme/publish/', AdminThemePublishView.as_view(), name='admin-theme-publish'),
    path('admin/theme/reset/', AdminThemeResetView.as_view(), name='admin-theme-reset'),

    # Router endpoints
    path('', include(router.urls)),
]
