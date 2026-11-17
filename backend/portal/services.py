import os
import uuid
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import Notification
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from io import BytesIO
from django.core.files.base import ContentFile

def send_notification_and_email(recipient, title, message, notification_type='GENERAL', link=''):
    """
    Creates an in-portal notification record and triggers an automated email notification.
    """
    notification = Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link
    )

    if recipient.email:
        try:
            subject = f"[Internship Portal] {title}"
            email_body = f"""Hello {recipient.get_full_name() or recipient.username},

{message}

Access the portal: http://localhost:5173{link if link else ''}

Best regards,
Internship Management Team
"""
            send_mail(
                subject=subject,
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient.email],
                fail_silently=True
            )
        except Exception as e:
            print(f"Error sending email: {e}")

    return notification


def generate_certificate_pdf(certificate):
    """
    Generates a beautifully styled Completion Certificate PDF using ReportLab
    and attaches it to the Certificate model instance.
    """
    intern = certificate.intern
    cert_number = certificate.certificate_number or f"CERT-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    certificate.certificate_number = cert_number

    buffer = BytesIO()
    # Landscape Letter format
    p = canvas.Canvas(buffer, pagesize=landscape(letter))
    width, height = landscape(letter)

    # Background frame & double border
    p.setStrokeColor(colors.HexColor('#1E3A8A'))  # Deep Blue
    p.setLineWidth(6)
    p.rect(20, 20, width - 40, height - 40)

    p.setStrokeColor(colors.HexColor('#D97706'))  # Gold accent
    p.setLineWidth(2)
    p.rect(26, 26, width - 52, height - 52)

    # Header / Org
    p.setFont("Helvetica-Bold", 18)
    p.setFillColor(colors.HexColor('#1E3A8A'))
    p.drawCentredString(width / 2.0, height - 70, "INTERNSHIP MANAGEMENT PORTAL")

    p.setFont("Helvetica", 11)
    p.setFillColor(colors.HexColor('#6B7280'))
    p.drawCentredString(width / 2.0, height - 90, "ACCREDITATION & TALENT EXCELLENCE PROGRAM")

    # Title
    p.setFont("Helvetica-Bold", 34)
    p.setFillColor(colors.HexColor('#111827'))
    p.drawCentredString(width / 2.0, height - 145, "CERTIFICATE OF COMPLETION")

    p.setFont("Helvetica-Oblique", 13)
    p.setFillColor(colors.HexColor('#4B5563'))
    p.drawCentredString(width / 2.0, height - 175, "This is proudly presented to")

    # Recipient Name
    intern_name = intern.get_full_name() or intern.username
    p.setFont("Helvetica-Bold", 28)
    p.setFillColor(colors.HexColor('#1E40AF'))
    p.drawCentredString(width / 2.0, height - 215, intern_name.upper())

    # Line under name
    p.setStrokeColor(colors.HexColor('#93C5FD'))
    p.setLineWidth(1.5)
    name_width = min(400, max(260, len(intern_name) * 16))
    p.line((width - name_width) / 2.0, height - 225, (width + name_width) / 2.0, height - 225)

    # Narrative
    p.setFont("Helvetica", 13)
    p.setFillColor(colors.HexColor('#374151'))
    desc1 = "for successfully fulfilling all requirements, project assignments, evaluations,"
    desc2 = "and professional milestones during the Internship Program."
    p.drawCentredString(width / 2.0, height - 265, desc1)
    p.drawCentredString(width / 2.0, height - 285, desc2)

    # Key details
    mentor_name = intern.assigned_mentor.get_full_name() if intern.assigned_mentor else "Assigned Mentor"
    completed_projects_count = intern.project_assignments.filter(status='COMPLETED').count()

    p.setFont("Helvetica-Bold", 11)
    p.setFillColor(colors.HexColor('#1F2937'))
    p.drawString(60, 150, f"Completed Projects: {completed_projects_count}")
    p.drawString(60, 130, f"Educational Background: {intern.education_qualification or 'N/A'}")
    p.drawString(60, 110, f"Certificate ID: {cert_number}")

    # Signatures
    # Left: Mentor
    p.setStrokeColor(colors.HexColor('#4B5563'))
    p.setLineWidth(1)
    p.line(width - 450, 95, width - 290, 95)
    p.setFont("Helvetica-Bold", 10)
    p.setFillColor(colors.HexColor('#1F2937'))
    p.drawCentredString(width - 370, 80, mentor_name)
    p.setFont("Helvetica", 9)
    p.setFillColor(colors.HexColor('#6B7280'))
    p.drawCentredString(width - 370, 68, "Lead Mentor / Evaluator")

    # Right: HR Manager
    hr_approver = certificate.approved_by.get_full_name() if certificate.approved_by else "HR Management"
    p.line(width - 240, 95, width - 80, 95)
    p.setFont("Helvetica-Bold", 10)
    p.setFillColor(colors.HexColor('#1F2937'))
    p.drawCentredString(width - 160, 80, hr_approver)
    p.setFont("Helvetica", 9)
    p.setFillColor(colors.HexColor('#6B7280'))
    p.drawCentredString(width - 160, 68, "HR Department Approval")

    # Date
    issue_date = timezone.now().strftime("%B %d, %Y")
    p.setFont("Helvetica-Oblique", 9)
    p.setFillColor(colors.HexColor('#9CA3AF'))
    p.drawString(60, 50, f"Issued on: {issue_date} • Officially verified by Internship Portal")

    p.showPage()
    p.save()

    buffer.seek(0)
    file_name = f"Certificate_{cert_number}.pdf"
    certificate.certificate_file.save(file_name, ContentFile(buffer.getvalue()), save=False)
    certificate.save()
    return certificate
