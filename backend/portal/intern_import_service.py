import csv
import io
import re
from datetime import datetime, date, timedelta
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.utils import timezone
from .models import (
    User, UserRole, InternDepartment, InternshipProgram,
    ImportHistory, InternStatusChoices
)

MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_IMPORT_EXTENSIONS = {'csv', 'xlsx', 'xls'}

VALID_STATUSES = {
    'applied': 'Applied',
    'selected': 'Selected',
    'onboarding': 'Onboarding',
    'active': 'Active',
    'completed': 'Completed',
    'terminated': 'Terminated',
}

SYSTEM_FIELDS = [
    {'key': 'full_name', 'label': 'Full Name', 'required': True},
    {'key': 'email', 'label': 'Email Address', 'required': True},
    {'key': 'phone', 'label': 'Phone Number', 'required': True},
    {'key': 'gender', 'label': 'Gender', 'required': False},
    {'key': 'college', 'label': 'College / University', 'required': False},
    {'key': 'course', 'label': 'Course / Degree', 'required': False},
    {'key': 'department', 'label': 'Department', 'required': False},
    {'key': 'internship_role', 'label': 'Internship Role', 'required': False},
    {'key': 'start_date', 'label': 'Internship Start Date', 'required': False},
    {'key': 'end_date', 'label': 'Internship End Date', 'required': False},
    {'key': 'assigned_mentor', 'label': 'Assigned Mentor', 'required': False},
    {'key': 'hr_contact', 'label': 'HR Contact', 'required': False},
    {'key': 'status', 'label': 'Status', 'required': False},
    {'key': 'address', 'label': 'Address', 'required': False},
]

COLUMN_ALIASES = {
    'full_name': [
        'full_name', 'fullname', 'full name', 'name', 'intern name',
        'student name', 'candidate name', 'candidate', 'intern', 'first_name'
    ],
    'email': [
        'email', 'email address', 'email_address', 'e-mail', 'mail',
        'intern email', 'student email', 'candidate email'
    ],
    'phone': [
        'phone', 'phone number', 'phone_number', 'mobile', 'mobile number',
        'contact', 'contact number', 'telephone', 'cell'
    ],
    'gender': ['gender', 'sex'],
    'college': [
        'college', 'university', 'college / university', 'institution',
        'institute', 'school', 'campus'
    ],
    'course': [
        'course', 'degree', 'course / degree', 'qualification',
        'education', 'education_qualification', 'major', 'program', 'branch'
    ],
    'department': [
        'department', 'dept', 'department_name', 'division', 'domain', 'stream', 'team'
    ],
    'internship_role': [
        'internship_role', 'internship role', 'role', 'position', 'designation',
        'job title', 'title', 'track'
    ],
    'start_date': [
        'start_date', 'start date', 'startdate', 'joining date',
        'internship start date', 'from date', 'begin date'
    ],
    'end_date': [
        'end_date', 'end date', 'enddate', 'completion date',
        'internship end date', 'to date', 'finish date'
    ],
    'assigned_mentor': [
        'assigned_mentor', 'assigned mentor', 'mentor', 'mentor name',
        'mentor_name', 'mentor email', 'team lead', 'supervisor'
    ],
    'hr_contact': [
        'hr_contact', 'hr contact', 'hr', 'hr manager', 'recruiter'
    ],
    'status': [
        'status', 'intern_status', 'internship status', 'current status', 'stage'
    ],
    'address': [
        'address', 'location', 'city', 'residential address', 'street'
    ],
}

EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')


def ensure_default_departments_and_programs():
    default_depts = [
        ('Data Analytics', 'DATA', 'Business Intelligence, SQL, Python, and Statistical Modeling', 'David Miller'),
        ('Software Engineering', 'SWE', 'Full-Stack Web, API Architecture, and Microservices', 'David Miller'),
        ('Artificial Intelligence & ML', 'AIML', 'Deep Learning, NLP, Predictive Modeling, and MLOps', 'David Miller'),
        ('Cloud & DevOps', 'CLOUD', 'Cloud Infrastructure, CI/CD Pipelines, and Kubernetes', 'Sarah Connor'),
        ('Product & UI/UX Design', 'DESIGN', 'User Research, Design Systems, and Interactive Prototyping', 'Sarah Connor'),
        ('Cybersecurity', 'SEC', 'Application Security, IAM Governance, and Threat Analysis', 'System Administrator'),
    ]
    dept_map = {}
    for name, code, desc, head in default_depts:
        obj, _ = InternDepartment.objects.get_or_create(
            name=name,
            defaults={'code': code, 'description': desc, 'head_of_department': head, 'is_active': True}
        )
        if not obj.code:
            obj.code = code
            obj.save(update_fields=['code'])
        dept_map[code] = obj

    default_programs = [
        ('Data Analytics Internship Program', 'PROG-DA', 'DATA', 12, 'Comprehensive data analytics and BI cohort', ['Python', 'SQL', 'Power BI', 'Tableau', 'Excel']),
        ('Full-Stack Software Engineering Cohort', 'PROG-SWE', 'SWE', 12, 'Production web application engineering', ['React', 'Next.js', 'Python', 'Django', 'PostgreSQL']),
        ('Applied AI & Machine Learning Track', 'PROG-AI', 'AIML', 16, 'Predictive modeling and generative AI engineering', ['Python', 'Scikit-Learn', 'PyTorch', 'SQL']),
        ('Cloud Infrastructure & DevOps Bootcamp', 'PROG-CLD', 'CLOUD', 8, 'Containerization and cloud deployment automation', ['Docker', 'GitHub Actions', 'Linux', 'PostgreSQL']),
    ]
    for title, code, dept_code, weeks, desc, skills in default_programs:
        dept_obj = dept_map.get(dept_code)
        InternshipProgram.objects.get_or_create(
            title=title,
            defaults={
                'code': code,
                'department': dept_obj.name if dept_obj else 'Data Analytics',
                'department_ref': dept_obj,
                'duration_weeks': weeks,
                'description': desc,
                'skills_covered': skills,
                'is_active': True,
            }
        )


def sanitize_spreadsheet_cell(val):
    """Prevent CSV/Excel formula injection on exported or re-downloaded files."""
    if val is None:
        return ''
    s = str(val)
    if not s:
        return ''
    if s[0] in ('=', '@', '\t', '\r'):
        return f"'{s}"
    if s[0] in ('+', '-') and not re.match(r'^[\+\-]?[\d\s\(\)\-\.]+$', s):
        return f"'{s}"
    return s


def auto_detect_column_mapping(headers):
    """Automatically map uploaded column headers to system fields."""
    mapping = {}
    normalized_headers = {h: re.sub(r'[\s_\-/]+', ' ', str(h).strip().lower()) for h in headers}

    for sys_field, aliases in COLUMN_ALIASES.items():
        norm_aliases = [re.sub(r'[\s_\-/]+', ' ', a.lower()) for a in aliases]
        matched_header = ''
        # Exact normalized match first
        for orig_h, norm_h in normalized_headers.items():
            if norm_h in norm_aliases:
                matched_header = orig_h
                break
        # Substring fallback if no exact match
        if not matched_header:
            for orig_h, norm_h in normalized_headers.items():
                if any(alias in norm_h for alias in norm_aliases if len(alias) > 3):
                    matched_header = orig_h
                    break
        mapping[sys_field] = matched_header
    return mapping


def parse_uploaded_table_file(file_obj, filename=''):
    """Parse CSV, XLSX, or XLS file into (headers, rows_as_dicts, file_type)."""
    name = (filename or getattr(file_obj, 'name', '') or 'upload.csv').strip()
    ext = name.rsplit('.', 1)[-1].lower() if '.' in name else 'csv'
    if ext not in ALLOWED_IMPORT_EXTENSIONS:
        raise ValueError(f"Unsupported file format '.{ext}'. Only .csv, .xlsx, and .xls files are allowed.")

    raw_bytes = file_obj.read()
    if len(raw_bytes) == 0:
        raise ValueError("The uploaded file is empty.")
    if len(raw_bytes) > MAX_IMPORT_FILE_SIZE:
        raise ValueError("File exceeds maximum allowed size of 10 MB.")

    if ext == 'xlsx' or (ext == 'xls' and raw_bytes[:2] == b'PK'):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(raw_bytes), data_only=True)
            sheet = wb.active
            all_rows = list(sheet.iter_rows(values_only=True))
            if not all_rows:
                raise ValueError("The Excel workbook contains no rows.")
            headers = [str(h).strip() if h is not None else f"Column_{i+1}" for i, h in enumerate(all_rows[0])]
            rows = []
            for r in all_rows[1:]:
                if not r or all(cell is None or str(cell).strip() == '' for cell in r):
                    continue
                row_dict = {}
                for idx, h in enumerate(headers):
                    val = r[idx] if idx < len(r) else ''
                    if isinstance(val, (datetime, date)):
                        val = val.strftime('%Y-%m-%d')
                    row_dict[h] = '' if val is None else str(val).strip()
                rows.append(row_dict)
            return headers, rows, ext.upper()
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError(f"Invalid or corrupted Excel (.{ext}) file: {str(exc)}")

    # Handle .csv or text/XML-based .xls
    try:
        text = raw_bytes.decode('utf-8-sig')
    except UnicodeDecodeError:
        try:
            text = raw_bytes.decode('latin-1')
        except Exception:
            raise ValueError("Unable to decode file content. Please upload a valid UTF-8 CSV or Excel file.")

    if '\x00' in text:
        raise ValueError("Malformed binary file content detected.")

    stripped = text.strip()
    if not stripped:
        raise ValueError("The uploaded file contains no data.")

    # Detect delimiter (comma, semicolon, or tab for .xls/.tsv)
    lines = [ln for ln in stripped.splitlines() if ln.strip()]
    if not lines:
        raise ValueError("The uploaded file contains no lines.")

    first_line = lines[0]
    delimiter = ','
    if '\t' in first_line and first_line.count('\t') >= first_line.count(','):
        delimiter = '\t'
    elif ';' in first_line and first_line.count(';') > first_line.count(','):
        delimiter = ';'

    reader = csv.reader(io.StringIO(stripped), delimiter=delimiter)
    all_rows = list(reader)
    if not all_rows:
        raise ValueError("No rows detected in file.")

    headers = [str(h).strip() or f"Column_{i+1}" for i, h in enumerate(all_rows[0])]
    rows = []
    for r in all_rows[1:]:
        if not r or all(str(cell).strip() == '' for cell in r):
            continue
        row_dict = {}
        for idx, h in enumerate(headers):
            row_dict[h] = str(r[idx]).strip() if idx < len(r) and r[idx] is not None else ''
        rows.append(row_dict)

    return headers, rows, ext.upper()


def parse_flexible_date(val_str):
    """Parse flexible date string into YYYY-MM-DD date object or raise ValueError."""
    if not val_str:
        return None
    if isinstance(val_str, date) and not isinstance(val_str, datetime):
        return val_str
    if isinstance(val_str, datetime):
        return val_str.date()

    s = str(val_str).strip()
    if not s:
        return None

    # Handle ISO timestamp with T
    if 'T' in s:
        s = s.split('T')[0]

    # Excel serial date number (e.g., 45658)
    if re.match(r'^\d{5}(\.\d+)?$', s):
        serial = int(float(s))
        if 30000 <= serial <= 60000:
            return date(1899, 12, 30) + timedelta(days=serial)

    formats = [
        '%Y-%m-%d',
        '%d/%m/%Y',
        '%m/%d/%Y',
        '%d-%m-%Y',
        '%Y/%m/%d',
        '%d %b %Y',
        '%d %B %Y',
        '%b %d, %Y',
    ]
    for fmt in formats:
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Invalid date format '{val_str}'. Expected YYYY-MM-DD or DD/MM/YYYY.")


def validate_phone(phone_str):
    s = str(phone_str or '').strip()
    if not s:
        return False, "Phone number is required."
    digits = re.sub(r'\D', '', s)
    if len(digits) < 7 or len(digits) > 15:
        return False, f"Invalid phone number '{s}' (must contain 7–15 digits)."
    if not re.match(r'^[\+\d\s\-\(\)\.]+$', s):
        return False, f"Phone number '{s}' contains invalid characters."
    return True, s


def validate_import_rows(raw_rows, column_mapping=None):
    """
    Validate mapped rows against business rules and database state.
    Returns structured validation summary + row-by-row details.
    """
    ensure_default_departments_and_programs()

    if not raw_rows:
        return {
            'total_records': 0,
            'valid_count': 0,
            'invalid_count': 0,
            'duplicate_count': 0,
            'in_file_duplicate_count': 0,
            'db_duplicate_count': 0,
            'missing_required_count': 0,
            'rows': [],
        }

    # Auto-detect mapping if not provided
    sample_headers = list(raw_rows[0].keys())
    mapping = column_mapping or auto_detect_column_mapping(sample_headers)

    # Pre-fetch departments, mentors, HR contacts, and existing intern emails
    departments = list(InternDepartment.objects.all())
    dept_lookup = {}
    for d in departments:
        dept_lookup[d.name.lower()] = d
        dept_lookup[d.code.lower()] = d

    mentors = list(User.objects.filter(role=UserRole.MENTOR))
    mentor_lookup = {}
    for m in mentors:
        full = f"{m.first_name} {m.last_name}".strip().lower()
        if full:
            mentor_lookup[full] = m
        mentor_lookup[m.username.lower()] = m
        if m.email:
            mentor_lookup[m.email.lower()] = m
        mentor_lookup[str(m.id)] = m

    hr_users = list(User.objects.filter(role__in=[UserRole.HR, UserRole.ADMIN]))
    hr_lookup = {}
    for h in hr_users:
        full = f"{h.first_name} {h.last_name}".strip().lower()
        if full:
            hr_lookup[full] = h
        hr_lookup[h.username.lower()] = h
        if h.email:
            hr_lookup[h.email.lower()] = h
        hr_lookup[str(h.id)] = h

    existing_emails = {
        e.lower(): uid
        for e, uid in User.objects.exclude(email='').values_list('email', 'id')
    }

    seen_emails_in_file = {}
    validated_rows = []
    valid_count = 0
    invalid_count = 0
    in_file_dup_count = 0
    db_dup_count = 0
    missing_req_count = 0

    for idx, raw in enumerate(raw_rows):
        row_num = idx + 1

        def get_val(sys_key):
            mapped_col = mapping.get(sys_key)
            if mapped_col and mapped_col in raw:
                return str(raw.get(mapped_col) or '').strip()
            # Also check direct key if already normalized
            if sys_key in raw:
                return str(raw.get(sys_key) or '').strip()
            return ''

        full_name = get_val('full_name')
        email = get_val('email')
        phone = get_val('phone')
        gender = get_val('gender')
        college = get_val('college')
        course = get_val('course')
        department_raw = get_val('department')
        internship_role = get_val('internship_role') or 'Data Analytics Intern'
        start_date_raw = get_val('start_date')
        end_date_raw = get_val('end_date')
        mentor_raw = get_val('assigned_mentor')
        hr_raw = get_val('hr_contact')
        status_raw = get_val('status') or 'Active'
        address = get_val('address')

        cell_errors = {}
        error_reasons = []
        has_missing_required = False
        is_in_file_duplicate = False
        is_db_duplicate = False

        # 1. Required fields
        if not full_name:
            cell_errors['full_name'] = 'Full Name is required.'
            error_reasons.append('Missing Full Name')
            has_missing_required = True

        if not email:
            cell_errors['email'] = 'Email Address is required.'
            error_reasons.append('Missing Email Address')
            has_missing_required = True
        elif not EMAIL_REGEX.match(email):
            cell_errors['email'] = f"Invalid email format '{email}'."
            error_reasons.append(f"Invalid email format ({email})")

        if not phone:
            cell_errors['phone'] = 'Phone Number is required.'
            error_reasons.append('Missing Phone Number')
            has_missing_required = True
        else:
            ok_phone, phone_msg = validate_phone(phone)
            if not ok_phone:
                cell_errors['phone'] = phone_msg
                error_reasons.append(phone_msg)

        # 2. Duplicate checks
        email_lower = email.lower()
        if email_lower and 'email' not in cell_errors:
            if email_lower in seen_emails_in_file:
                is_in_file_duplicate = True
                first_row = seen_emails_in_file[email_lower]
                cell_errors['email'] = f"Duplicate email in uploaded file (first seen on row #{first_row})."
                error_reasons.append(f"Duplicate in file (Row #{first_row})")
            else:
                seen_emails_in_file[email_lower] = row_num

            if email_lower in existing_emails:
                is_db_duplicate = True

        # 3. Dates validation
        parsed_start = None
        parsed_end = None
        if start_date_raw:
            try:
                parsed_start = parse_flexible_date(start_date_raw)
            except ValueError as e:
                cell_errors['start_date'] = str(e)
                error_reasons.append(str(e))
        if end_date_raw:
            try:
                parsed_end = parse_flexible_date(end_date_raw)
            except ValueError as e:
                cell_errors['end_date'] = str(e)
                error_reasons.append(str(e))

        if parsed_start and parsed_end and parsed_start > parsed_end:
            msg = f"Start date ({parsed_start}) must not be after end date ({parsed_end})."
            cell_errors['start_date'] = msg
            cell_errors['end_date'] = msg
            error_reasons.append(msg)

        # 4. Department validation
        resolved_dept_id = None
        resolved_dept_name = department_raw
        if department_raw:
            dept_obj = dept_lookup.get(department_raw.lower())
            if dept_obj:
                resolved_dept_id = dept_obj.id
                resolved_dept_name = dept_obj.name
            else:
                # Check common partial match
                partial = next((d for d in departments if department_raw.lower() in d.name.lower()), None)
                if partial:
                    resolved_dept_id = partial.id
                    resolved_dept_name = partial.name
                else:
                    valid_names = ', '.join(d.name for d in departments)
                    cell_errors['department'] = f"Unrecognized department '{department_raw}'. Valid: {valid_names}."
                    error_reasons.append(f"Invalid department ({department_raw})")

        # 5. Mentor validation
        resolved_mentor_id = None
        resolved_mentor_name = ''
        if mentor_raw:
            m_obj = mentor_lookup.get(mentor_raw.lower())
            if m_obj:
                resolved_mentor_id = m_obj.id
                resolved_mentor_name = f"{m_obj.first_name} {m_obj.last_name}".strip() or m_obj.username
            else:
                partial_m = next(
                    (m for m in mentors if mentor_raw.lower() in (f"{m.first_name} {m.last_name}".lower())),
                    None
                )
                if partial_m:
                    resolved_mentor_id = partial_m.id
                    resolved_mentor_name = f"{partial_m.first_name} {partial_m.last_name}".strip() or partial_m.username
                else:
                    cell_errors['assigned_mentor'] = f"Mentor '{mentor_raw}' not found."
                    error_reasons.append(f"Invalid mentor ({mentor_raw})")

        # 6. HR Contact resolution
        resolved_hr_id = None
        if hr_raw:
            h_obj = hr_lookup.get(hr_raw.lower())
            if h_obj:
                resolved_hr_id = h_obj.id

        # 7. Status validation
        normalized_status = VALID_STATUSES.get(status_raw.lower())
        if not normalized_status:
            cell_errors['status'] = f"Invalid status '{status_raw}'. Allowed: Applied, Selected, Onboarding, Active, Completed, Terminated."
            error_reasons.append(f"Invalid status ({status_raw})")
            normalized_status = 'Active'

        if has_missing_required:
            missing_req_count += 1
        if is_in_file_duplicate:
            in_file_dup_count += 1
        if is_db_duplicate:
            db_dup_count += 1

        is_valid = len(cell_errors) == 0
        if is_valid and not is_db_duplicate:
            valid_count += 1
        elif not is_valid:
            invalid_count += 1

        row_status = 'VALID'
        if not is_valid:
            row_status = 'INVALID'
        elif is_db_duplicate:
            row_status = 'DUPLICATE_EXISTING'

        validated_rows.append({
            'row_number': row_num,
            'full_name': full_name,
            'email': email,
            'phone': phone,
            'gender': gender,
            'college': college,
            'course': course,
            'department': resolved_dept_name,
            'department_id': resolved_dept_id,
            'internship_role': internship_role,
            'start_date': parsed_start.isoformat() if parsed_start else start_date_raw,
            'end_date': parsed_end.isoformat() if parsed_end else end_date_raw,
            'assigned_mentor': resolved_mentor_name or mentor_raw,
            'mentor_id': resolved_mentor_id,
            'hr_contact_id': resolved_hr_id,
            'status': normalized_status,
            'address': address,
            'row_status': row_status,
            'is_valid': is_valid,
            'is_in_file_duplicate': is_in_file_duplicate,
            'is_db_duplicate': is_db_duplicate,
            'has_missing_required': has_missing_required,
            'cell_errors': cell_errors,
            'error_reasons': error_reasons,
        })

    return {
        'total_records': len(raw_rows),
        'valid_count': valid_count,
        'invalid_count': invalid_count,
        'duplicate_count': in_file_dup_count + db_dup_count,
        'in_file_duplicate_count': in_file_dup_count,
        'db_duplicate_count': db_dup_count,
        'missing_required_count': missing_req_count,
        'column_mapping': mapping,
        'rows': validated_rows,
    }


def execute_import_confirm(
    raw_rows,
    column_mapping=None,
    file_name='interns_import.csv',
    file_type='CSV',
    skip_invalid=True,
    duplicate_action='skip',
    confirm_update_existing=False,
    imported_by=None,
):
    """
    Validate and import records in batches inside a database transaction.
    Never silently overwrites existing intern records.
    """
    validation = validate_import_rows(raw_rows, column_mapping=column_mapping)
    validated_rows = validation['rows']

    if not skip_invalid and validation['invalid_count'] > 0:
        # Abort transaction cleanly without partial records
        failed_report = [
            {
                'row_number': r['row_number'],
                'full_name': r['full_name'],
                'email': r['email'],
                'phone': r['phone'],
                'department': r['department'],
                'error_reason': '; '.join(r['error_reasons']) or 'Validation failed',
            }
            for r in validated_rows if not r['is_valid']
        ]
        history = ImportHistory.objects.create(
            file_name=file_name,
            file_type=file_type,
            total_records=len(validated_rows),
            successful_records=0,
            failed_records=validation['invalid_count'],
            skipped_records=len(validated_rows) - validation['invalid_count'],
            updated_records=0,
            import_status='FAILED',
            error_details=failed_report[:200],
            imported_by=imported_by if getattr(imported_by, 'is_authenticated', False) else None,
            imported_by_name=(imported_by.get_full_name() or imported_by.username) if getattr(imported_by, 'is_authenticated', False) else 'HR Manager',
        )
        return {
            'status': 'aborted',
            'detail': 'Import aborted because skip_invalid=False and invalid records were found. No records were written.',
            'history_id': history.id,
            'total_records': len(validated_rows),
            'successful_records': 0,
            'failed_records': validation['invalid_count'],
            'skipped_records': len(validated_rows) - validation['invalid_count'],
            'updated_records': 0,
            'failed_rows': failed_report,
        }

    successful_count = 0
    failed_count = 0
    skipped_count = 0
    updated_count = 0
    failed_rows_report = []

    BATCH_SIZE = 50
    default_hashed_password = make_password('InternPassword@123')
    with transaction.atomic():
        for start_idx in range(0, len(validated_rows), BATCH_SIZE):
            batch = validated_rows[start_idx:start_idx + BATCH_SIZE]
            for r in batch:
                if not r['is_valid']:
                    failed_count += 1
                    failed_rows_report.append({
                        'row_number': r['row_number'],
                        'full_name': sanitize_spreadsheet_cell(r['full_name']),
                        'email': sanitize_spreadsheet_cell(r['email']),
                        'phone': sanitize_spreadsheet_cell(r['phone']),
                        'college': sanitize_spreadsheet_cell(r['college']),
                        'course': sanitize_spreadsheet_cell(r['course']),
                        'department': sanitize_spreadsheet_cell(r['department']),
                        'internship_role': sanitize_spreadsheet_cell(r['internship_role']),
                        'start_date': sanitize_spreadsheet_cell(r['start_date']),
                        'end_date': sanitize_spreadsheet_cell(r['end_date']),
                        'assigned_mentor': sanitize_spreadsheet_cell(r['assigned_mentor']),
                        'status': sanitize_spreadsheet_cell(r['status']),
                        'error_reason': '; '.join(r['error_reasons']) or 'Invalid record',
                    })
                    continue

                email_lower = r['email'].lower()
                existing_user = User.objects.filter(email__iexact=email_lower).first()

                parts = r['full_name'].strip().split(' ', 1)
                first_name = parts[0]
                last_name = parts[1] if len(parts) > 1 else ''
                start_dt = parse_flexible_date(r['start_date']) if r['start_date'] else None
                end_dt = parse_flexible_date(r['end_date']) if r['end_date'] else None

                if existing_user:
                    if duplicate_action == 'update' and confirm_update_existing:
                        existing_user.first_name = first_name
                        existing_user.last_name = last_name
                        existing_user.phone = r['phone']
                        if r['gender']:
                            existing_user.gender = r['gender']
                        if r['college']:
                            existing_user.college = r['college']
                        if r['course']:
                            existing_user.course = r['course']
                            existing_user.education_qualification = r['course']
                        if r['department_id']:
                            existing_user.department_ref_id = r['department_id']
                            existing_user.department = r['department']
                        elif r['department']:
                            existing_user.department = r['department']
                        if r['internship_role']:
                            existing_user.internship_role = r['internship_role']
                        if start_dt:
                            existing_user.start_date = start_dt
                        if end_dt:
                            existing_user.end_date = end_dt
                        if r['mentor_id']:
                            existing_user.assigned_mentor_id = r['mentor_id']
                        if r['hr_contact_id']:
                            existing_user.hr_contact_id = r['hr_contact_id']
                        if r['status']:
                            existing_user.intern_status = r['status']
                        if r['address']:
                            existing_user.address = r['address']
                        existing_user.save()
                        updated_count += 1
                    else:
                        skipped_count += 1
                    continue

                # Generate unique username
                base = re.sub(r'[^a-zA-Z0-9_]', '_', email_lower.split('@')[0])
                base = re.sub(r'_+', '_', base).strip('_') or 'intern'
                candidate = base
                suffix = 1
                while User.objects.filter(username__iexact=candidate).exists():
                    suffix += 1
                    candidate = f"{base}_{suffix}"

                new_intern = User(
                    username=candidate,
                    email=r['email'],
                    first_name=first_name,
                    last_name=last_name,
                    role=UserRole.INTERN,
                    phone=r['phone'],
                    gender=r['gender'],
                    college=r['college'],
                    course=r['course'],
                    education_qualification=r['course'],
                    department_ref_id=r['department_id'],
                    department=r['department'] or 'Data Analytics',
                    internship_role=r['internship_role'] or 'Data Analytics Intern',
                    start_date=start_dt,
                    end_date=end_dt,
                    assigned_mentor_id=r['mentor_id'],
                    hr_contact_id=r['hr_contact_id'] or (imported_by.id if getattr(imported_by, 'is_authenticated', False) else None),
                    intern_status=r['status'] or InternStatusChoices.ACTIVE,
                    address=r['address'],
                    source='Bulk Import',
                    created_by=imported_by if getattr(imported_by, 'is_authenticated', False) else None,
                    password=default_hashed_password,
                )
                new_intern.save()
                successful_count += 1

    import_status = 'COMPLETED'
    if failed_count > 0 and (successful_count > 0 or updated_count > 0):
        import_status = 'PARTIAL'
    elif failed_count > 0 and successful_count == 0 and updated_count == 0:
        import_status = 'FAILED'

    history = ImportHistory.objects.create(
        file_name=file_name,
        file_type=file_type,
        total_records=len(validated_rows),
        successful_records=successful_count,
        failed_records=failed_count,
        skipped_records=skipped_count,
        updated_records=updated_count,
        import_status=import_status,
        error_details=failed_rows_report[:250],
        imported_by=imported_by if getattr(imported_by, 'is_authenticated', False) else None,
        imported_by_name=(imported_by.get_full_name() or imported_by.username) if getattr(imported_by, 'is_authenticated', False) else 'HR Manager',
    )

    return {
        'status': 'completed',
        'history_id': history.id,
        'file_name': file_name,
        'file_type': file_type,
        'total_records': len(validated_rows),
        'successful_records': successful_count,
        'failed_records': failed_count,
        'skipped_records': skipped_count,
        'updated_records': updated_count,
        'import_status': import_status,
        'failed_rows': failed_rows_report,
    }
