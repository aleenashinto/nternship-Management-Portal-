web: cd backend && python manage.py migrate --noinput && python manage.py seed_data && gunicorn internship_backend.wsgi:application --bind 0.0.0.0:$PORT
