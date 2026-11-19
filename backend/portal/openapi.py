from django.http import JsonResponse, HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

OPENAPI_SPEC = {
    "openapi": "3.0.3",
    "info": {
        "title": "Beat Internship Management Portal API",
        "version": "1.0.0",
        "description": "Production Role-Based Internship Lifecycle API (Admin, HR Manager, Mentor, Intern)",
    },
    "paths": {
        "/api/auth/login/": {"post": {"summary": "Obtain JWT access & refresh tokens", "tags": ["Auth"]}},
        "/api/auth/refresh/": {"post": {"summary": "Refresh JWT access token", "tags": ["Auth"]}},
        "/api/auth/me/": {"get": {"summary": "Current authenticated user profile", "tags": ["Auth"]}},
        "/api/hr/dashboard/": {"get": {"summary": "HR Manager KPIs & pending certificate approvals", "tags": ["HR"]}},
        "/api/hr/mentors/": {
            "get": {"summary": "List mentors with shift hours & assigned intern counts", "tags": ["HR"]},
            "post": {"summary": "Create mentor account", "tags": ["HR"]},
        },
        "/api/hr/mentors/{id}/": {
            "get": {"summary": "View mentor profile", "tags": ["HR"]},
            "patch": {"summary": "Update mentor account", "tags": ["HR"]},
            "delete": {"summary": "Delete mentor account", "tags": ["HR"]},
        },
        "/api/hr/interns/": {
            "get": {"summary": "List registered interns", "tags": ["HR"]},
            "post": {"summary": "Register new intern (auto-creates login & sends welcome email)", "tags": ["HR"]},
        },
        "/api/hr/interns/{id}/": {
            "get": {"summary": "View intern profile", "tags": ["HR"]},
            "patch": {"summary": "Update intern profile", "tags": ["HR"]},
            "delete": {"summary": "Delete intern profile", "tags": ["HR"]},
        },
        "/api/hr/interns/{id}/assign-mentor/": {"post": {"summary": "Assign or reassign mentor", "tags": ["HR"]}},
        "/api/hr/certificates/": {"get": {"summary": "List certificate approval requests", "tags": ["Certificates"]}},
        "/api/hr/certificates/{id}/approve/": {"post": {"summary": "Approve request & generate PDF certificate", "tags": ["Certificates"]}},
        "/api/hr/certificates/{id}/reject/": {"post": {"summary": "Reject certificate request with reason", "tags": ["Certificates"]}},
        "/api/mentor/dashboard/": {"get": {"summary": "Mentor KPIs scoped to own interns", "tags": ["Mentor"]}},
        "/api/mentor/projects/": {
            "get": {"summary": "List reusable project templates", "tags": ["Projects"]},
            "post": {"summary": "Create reusable project template", "tags": ["Projects"]},
        },
        "/api/mentor/assignments/": {
            "get": {"summary": "List project assignments", "tags": ["Assignments"]},
            "post": {"summary": "Assign project to intern", "tags": ["Assignments"]},
        },
        "/api/mentor/assignments/{id}/evaluate/": {"post": {"summary": "Score submission (0-100) & mark Completed or Revision Required", "tags": ["Assignments"]}},
        "/api/mentor/extensions/": {"get": {"summary": "List deadline extension requests", "tags": ["Extensions"]}},
        "/api/mentor/extensions/{id}/respond/": {"post": {"summary": "Approve (revise due date) or reject extension", "tags": ["Extensions"]}},
        "/api/mentor/presentations/": {
            "get": {"summary": "List scheduled presentations", "tags": ["Presentations"]},
            "post": {"summary": "Schedule presentation with Google Meet link", "tags": ["Presentations"]},
        },
        "/api/intern/profile/": {"get": {"summary": "Intern profile, summary stats, assignments, presentations & certificate", "tags": ["Intern"]}},
        "/api/intern/assignments/{id}/submit/": {"post": {"summary": "Upload project submission deliverable", "tags": ["Intern"]}},
        "/api/notifications/": {"get": {"summary": "List in-portal notifications", "tags": ["Notifications"]}},
        "/api/reminders/check/": {"post": {"summary": "Trigger 09:00 AM daily deadline reminders & overdue sweep", "tags": ["Scheduler"]}},
    },
}


class OpenAPISchemaView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return JsonResponse(OPENAPI_SPEC)


class SwaggerDocsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        html = """<!DOCTYPE html>
<html>
<head>
  <title>Beat Internship Portal - Swagger API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({ url: '/api/schema/', dom_id: '#swagger-ui' });
    };
  </script>
</body>
</html>"""
        return HttpResponse(html, content_type="text/html")
