"""
WSGI config for internship_backend project.
Automatically ensures database migrations and demo seed data exist on serverless cold starts.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'internship_backend.settings')

application = get_wsgi_application()

# Auto-initialize & seed database if empty (e.g. on Vercel / Render cold start)
try:
    from django.core.management import call_command
    from portal.models import User
    call_command('migrate', interactive=False, verbosity=0)
    if not User.objects.exists():
        call_command('seed_data', verbosity=0)
except Exception as exc:
    print(f"[WSGI Startup Init Notice]: {exc}")

app = application
