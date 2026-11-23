import * as XLSX from 'xlsx';

export const SYSTEM_FIELDS = [
  { key: 'full_name', label: 'Full Name', required: true },
  { key: 'email', label: 'Email Address', required: true },
  { key: 'phone', label: 'Phone Number', required: false },
  { key: 'course', label: 'Course Name', required: true },
  { key: 'course_code', label: 'Course Code', required: true },
  { key: 'batch', label: 'Batch', required: false },
  { key: 'start_date', label: 'Joining / Start Date', required: false },
  { key: 'end_date', label: 'Internship End Date', required: false },
  { key: 'duration', label: 'Internship Duration', required: false },
  { key: 'department', label: 'Department', required: false },
  { key: 'internship_role', label: 'Internship Role', required: false },
  { key: 'college', label: 'College / University', required: false },
  { key: 'assigned_mentor', label: 'Assigned Mentor', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'address', label: 'Address', required: false },
];

export const INTERN_STATUS_OPTIONS = [
  'Active',
  'Inactive',
  'Applied',
  'Selected',
  'Onboarding',
  'Completed',
  'Terminated',
];

const COLUMN_ALIASES = {
  full_name: [
    'full_name', 'fullname', 'full name', 'name', 'intern name',
    'student name', 'candidate name', 'candidate', 'intern', 'first_name'
  ],
  email: [
    'email', 'email address', 'email_address', 'e-mail', 'mail',
    'intern email', 'student email', 'candidate email'
  ],
  phone: [
    'phone', 'phone number', 'phone_number', 'mobile', 'mobile number',
    'contact', 'contact number', 'telephone', 'cell'
  ],
  course: [
    'course', 'course name', 'course_name', 'coursename', 'degree',
    'course / degree', 'qualification', 'education', 'education_qualification',
    'major', 'program', 'branch'
  ],
  course_code: [
    'course_code', 'course code', 'coursecode', 'code', 'program code', 'track code'
  ],
  batch: [
    'batch', 'batch name', 'batch_code', 'cohort', 'intake', 'session'
  ],
  gender: ['gender', 'sex'],
  college: [
    'college', 'university', 'college / university', 'institution',
    'institute', 'school', 'campus'
  ],
  department: [
    'department', 'dept', 'department_name', 'division', 'domain', 'stream', 'team'
  ],
  internship_role: [
    'internship_role', 'internship role', 'role', 'position', 'designation',
    'job title', 'title', 'track'
  ],
  start_date: [
    'start_date', 'start date', 'startdate', 'joining date', 'joining_date',
    'joiningdate', 'internship start date', 'from date', 'begin date'
  ],
  end_date: [
    'end_date', 'end date', 'enddate', 'completion date',
    'internship end date', 'to date', 'finish date'
  ],
  duration: [
    'duration', 'internship_duration', 'internship duration', 'period', 'tenure'
  ],
  assigned_mentor: [
    'assigned_mentor', 'assigned mentor', 'mentor', 'mentor name',
    'mentor_name', 'mentor email', 'team lead', 'supervisor'
  ],
  hr_contact: [
    'hr_contact', 'hr contact', 'hr', 'hr manager', 'recruiter'
  ],
  status: [
    'status', 'intern_status', 'internship status', 'current status', 'stage'
  ],
  address: [
    'address', 'location', 'city', 'residential address', 'street'
  ],
};

export function generateInternBaseUsername(fullName) {
  const raw = String(fullName || '').trim().toLowerCase();
  const cleaned = raw.replace(/[^a-z0-9\s]/g, '');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 'intern.user';
  return tokens.join('.');
}

export function generateUniqueInternUsername(fullName, existingUsernames = []) {
  const base = generateInternBaseUsername(fullName);
  const takenSet =
    existingUsernames instanceof Set
      ? existingUsernames
      : new Set(
          (Array.isArray(existingUsernames) ? existingUsernames : [])
            .map((u) => String(u || '').trim().toLowerCase())
            .filter(Boolean)
        );

  if (!takenSet.has(base)) {
    takenSet.add(base);
    return base;
  }

  let seq = 1;
  while (true) {
    const candidate = `${base}${seq}`;
    if (!takenSet.has(candidate)) {
      takenSet.add(candidate);
      return candidate;
    }
    seq += 1;
  }
}

export function generateTemporaryPassword(fullName, courseCode) {
  const rawName = String(fullName || '').trim();
  const words = rawName
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean);
  const formattedWords = words.map((w) => {
    if (w === w.toLowerCase() || w === w.toUpperCase()) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
  const namePart = formattedWords.join('') || 'Intern';
  const codePart = String(courseCode || '').trim().replace(/[^a-zA-Z0-9]/g, '') || 'INT01';
  return `${namePart}${codePart}`;
}

export function hashCredentialSync(plainText) {
  // Deterministic non-reversible salted hash for client-side demo store so plain passwords are never persisted
  const str = `beat_portal_salt_v2::${String(plainText || '')}`;
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `pbkdf2_sha256$260000$${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}

export function sanitizeSpreadsheetCell(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (!s) return '';
  if (['=', '@', '\t', '\r'].includes(s[0])) {
    return `'${s}`;
  }
  if ((s[0] === '+' || s[0] === '-') && !/^[\+\-]?[\d\s\(\)\-\.]+$/.test(s)) {
    return `'${s}`;
  }
  return s;
}

export function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return '';
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '';
  const diffDays = Math.round((e.getTime() - s.getTime()) / 86400000);
  if (diffDays < 0) return 'Invalid range (Start > End)';
  const weeks = Math.max(1, Math.round(diffDays / 7));
  return `${weeks} weeks (${diffDays} days)`;
}

export function autoDetectColumnMapping(headers = []) {
  const mapping = {};
  const normalize = (str) => String(str || '').trim().toLowerCase().replace(/[\s_\-\/]+/g, ' ');
  const normHeaders = headers.map((h) => ({ orig: h, norm: normalize(h) }));

  Object.entries(COLUMN_ALIASES).forEach(([sysKey, aliases]) => {
    const normAliases = aliases.map(normalize);
    let matched = '';
    for (const h of normHeaders) {
      if (normAliases.includes(h.norm)) {
        matched = h.orig;
        break;
      }
    }
    if (!matched) {
      for (const h of normHeaders) {
        if (normAliases.some((a) => a.length > 3 && h.norm.includes(a))) {
          matched = h.orig;
          break;
        }
      }
    }
    mapping[sysKey] = matched;
  });

  return mapping;
}

export function parseFlexibleDateStr(val) {
  if (!val) return { valid: true, iso: '' };
  const s = String(val).trim();
  if (!s) return { valid: true, iso: '' };

  // Excel serial date
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const serial = Math.floor(Number(s));
    if (serial >= 30000 && serial <= 60000) {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      epoch.setUTCDate(epoch.getUTCDate() + serial);
      return { valid: true, iso: epoch.toISOString().split('T')[0] };
    }
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = s.match(/^(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch.map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d) {
      return {
        valid: true,
        iso: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      };
    }
    return { valid: false, iso: s, error: `Invalid calendar date '${s}'.` };
  }

  // DD/MM/YYYY or DD-MM-YYYY or MM/DD/YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})$/);
  if (dmyMatch) {
    let [, p1, p2, y] = dmyMatch.map(Number);
    let d = p1;
    let m = p2;
    if (p1 <= 12 && p2 > 12) {
      m = p1;
      d = p2;
    }
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d) {
      return {
        valid: true,
        iso: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      };
    }
    return { valid: false, iso: s, error: `Invalid date '${s}'.` };
  }

  return { valid: false, iso: s, error: `Invalid date format '${s}'. Use YYYY-MM-DD or DD/MM/YYYY.` };
}

export function parseSpreadsheetFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected.'));
      return;
    }
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      reject(new Error(`Unsupported file format (.${ext}). Please upload a .csv, .xlsx, or .xls file.`));
      return;
    }
    if (file.size === 0) {
      reject(new Error('The selected file is empty.'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('File size exceeds the 10 MB limit.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('No worksheet found in the uploaded file.'));
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
        const nonEmptyRows = matrix.filter(
          (row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== '')
        );
        if (nonEmptyRows.length < 1) {
          reject(new Error('The uploaded file contains no headers or data rows.'));
          return;
        }
        const headers = nonEmptyRows[0].map((h, i) => String(h || '').trim() || `Column_${i + 1}`);
        const rows = nonEmptyRows.slice(1).map((r) => {
          const obj = {};
          headers.forEach((h, idx) => {
            const val = r[idx];
            if (val instanceof Date && !Number.isNaN(val.getTime())) {
              obj[h] = val.toISOString().split('T')[0];
            } else {
              obj[h] = val === undefined || val === null ? '' : String(val).trim();
            }
          });
          return obj;
        });

        resolve({
          fileName: file.name,
          fileType: ext.toUpperCase(),
          headers,
          rows,
        });
      } catch (err) {
        reject(new Error(`Failed to parse spreadsheet: ${err.message || 'Corrupted file'}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the uploaded file.'));
    reader.readAsArrayBuffer(file);
  });
}

export function validateInternRows(
  rawRows = [],
  columnMapping = null,
  departments = [],
  mentors = [],
  existingInterns = []
) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return {
      total_records: 0,
      valid_count: 0,
      invalid_count: 0,
      duplicate_count: 0,
      in_file_duplicate_count: 0,
      db_duplicate_count: 0,
      missing_required_count: 0,
      column_mapping: columnMapping || {},
      rows: [],
    };
  }

  const sampleHeaders = Object.keys(rawRows[0] || {});
  const mapping = columnMapping || autoDetectColumnMapping(sampleHeaders);

  const deptNames = departments.map((d) => ({
    id: d.id,
    name: d.name,
    code: (d.code || '').toLowerCase(),
    lower: (d.name || '').toLowerCase(),
  }));

  const mentorList = mentors.map((m) => ({
    id: m.id,
    name: m.full_name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.username,
    username: (m.username || '').toLowerCase(),
    email: (m.email || '').toLowerCase(),
  }));

  const existingEmailSet = new Set(
    existingInterns.map((i) => String(i.email || '').trim().toLowerCase()).filter(Boolean)
  );
  const takenUsernamesSet = new Set(
    existingInterns.map((i) => String(i.username || '').trim().toLowerCase()).filter(Boolean)
  );
  const seenEmailsInFile = new Map();

  let validCount = 0;
  let invalidCount = 0;
  let inFileDupCount = 0;
  let dbDupCount = 0;
  let missingReqCount = 0;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const rows = rawRows.map((raw, idx) => {
    const rowNumber = idx + 1;
    const getVal = (sysKey) => {
      const col = mapping[sysKey];
      if (col && raw[col] !== undefined) return String(raw[col] ?? '').trim();
      if (raw[sysKey] !== undefined) return String(raw[sysKey] ?? '').trim();
      return '';
    };

    const full_name = getVal('full_name');
    const email = getVal('email');
    const phone = getVal('phone');
    const gender = getVal('gender');
    const college = getVal('college');
    const course = getVal('course') || getVal('course_name');
    const course_code = getVal('course_code');
    const batch = getVal('batch');
    const departmentRaw = getVal('department');
    const internship_role = getVal('internship_role') || 'Data Analytics Intern';
    const startDateRaw = getVal('start_date') || getVal('joining_date');
    const endDateRaw = getVal('end_date');
    const durationRaw = getVal('duration');
    const mentorRaw = getVal('assigned_mentor');
    const hrRaw = getVal('hr_contact');
    const statusRaw = getVal('status') || 'Active';
    const address = getVal('address');

    const cell_errors = {};
    const error_reasons = [];
    let has_missing_required = false;
    let is_in_file_duplicate = false;
    let is_db_duplicate = false;

    if (!full_name) {
      cell_errors.full_name = 'Full Name is required.';
      error_reasons.push('Missing Full Name');
      has_missing_required = true;
    }

    if (!email) {
      cell_errors.email = 'Email Address is required.';
      error_reasons.push('Missing Email Address');
      has_missing_required = true;
    } else if (!emailRegex.test(email)) {
      cell_errors.email = `Invalid email format '${email}'.`;
      error_reasons.push(`Invalid email format (${email})`);
    }

    if ((mapping.course_code || raw.course_code !== undefined) && !course_code) {
      cell_errors.course_code = 'Course Code is required.';
      error_reasons.push('Missing Course Code');
      has_missing_required = true;
    }

    if (mapping.course && (mapping.course_code || raw.course_code !== undefined) && !course) {
      cell_errors.course = 'Course Name is required.';
      error_reasons.push('Missing Course Name');
      has_missing_required = true;
    }

    if (!phone && !course_code) {
      cell_errors.phone = 'Phone Number is required.';
      error_reasons.push('Missing Phone Number');
      has_missing_required = true;
    } else if (phone) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15 || !/^[\+\d\s\-\(\)\.]+$/.test(phone)) {
        cell_errors.phone = `Invalid phone number '${phone}' (7–15 digits required).`;
        error_reasons.push(`Invalid phone (${phone})`);
      }
    }

    const emailLower = email.toLowerCase();
    if (emailLower && !cell_errors.email) {
      if (seenEmailsInFile.has(emailLower)) {
        is_in_file_duplicate = true;
        const firstRow = seenEmailsInFile.get(emailLower);
        cell_errors.email = `Duplicate email in uploaded file (first seen on row #${firstRow}).`;
        error_reasons.push(`Duplicate in file (Row #${firstRow})`);
      } else {
        seenEmailsInFile.set(emailLower, rowNumber);
      }
      if (existingEmailSet.has(emailLower)) {
        is_db_duplicate = true;
      }
    }

    const startParsed = parseFlexibleDateStr(startDateRaw);
    const endParsed = parseFlexibleDateStr(endDateRaw);
    if (!startParsed.valid) {
      cell_errors.start_date = startParsed.error;
      error_reasons.push(startParsed.error);
    }
    if (!endParsed.valid) {
      cell_errors.end_date = endParsed.error;
      error_reasons.push(endParsed.error);
    }
    if (startParsed.valid && endParsed.valid && startParsed.iso && endParsed.iso) {
      if (startParsed.iso > endParsed.iso) {
        const msg = `Start date (${startParsed.iso}) must not be after end date (${endParsed.iso}).`;
        cell_errors.start_date = msg;
        cell_errors.end_date = msg;
        error_reasons.push(msg);
      }
    }

    let resolvedDeptName = departmentRaw || 'Data Analytics';
    let resolvedDeptId = null;
    if (departmentRaw && deptNames.length > 0) {
      const dLower = departmentRaw.toLowerCase();
      const exact = deptNames.find(
        (d) => d.lower === dLower || d.code === dLower || d.lower.includes(dLower)
      );
      if (exact) {
        resolvedDeptName = exact.name;
        resolvedDeptId = exact.id;
      } else {
        cell_errors.department = `Unrecognized department '${departmentRaw}'.`;
        error_reasons.push(`Invalid department (${departmentRaw})`);
      }
    }

    let resolvedMentorId = null;
    let resolvedMentorName = mentorRaw;
    if (mentorRaw && mentorList.length > 0) {
      const mLower = mentorRaw.toLowerCase();
      const found = mentorList.find(
        (m) =>
          m.name.toLowerCase() === mLower ||
          m.username === mLower ||
          m.email === mLower ||
          String(m.id) === mLower ||
          m.name.toLowerCase().includes(mLower)
      );
      if (found) {
        resolvedMentorId = found.id;
        resolvedMentorName = found.name;
      } else {
        cell_errors.assigned_mentor = `Mentor '${mentorRaw}' not found.`;
        error_reasons.push(`Invalid mentor (${mentorRaw})`);
      }
    }

    const matchedStatus = INTERN_STATUS_OPTIONS.find(
      (s) => s.toLowerCase() === statusRaw.toLowerCase()
    );
    let normalizedStatus = matchedStatus || 'Active';
    if (!matchedStatus) {
      cell_errors.status = `Invalid status '${statusRaw}'. Allowed: ${INTERN_STATUS_OPTIONS.join(', ')}.`;
      error_reasons.push(`Invalid status (${statusRaw})`);
    }

    if (has_missing_required) missingReqCount += 1;
    if (is_in_file_duplicate) inFileDupCount += 1;
    if (is_db_duplicate) dbDupCount += 1;

    const is_valid = Object.keys(cell_errors).length === 0;
    if (is_valid && !is_db_duplicate) {
      validCount += 1;
    } else if (!is_valid) {
      invalidCount += 1;
    }

    let row_status = 'VALID';
    if (!is_valid) row_status = 'INVALID';
    else if (is_db_duplicate) row_status = 'DUPLICATE_EXISTING';

    const effectiveCourseCode =
      course_code ||
      (course
        ? course
            .split(/\s+/)
            .map((w) => w[0]?.toUpperCase() || '')
            .join('')
            .slice(0, 4) + '01'
        : 'INT01');

    const generated_username = generateUniqueInternUsername(
      full_name || email.split('@')[0] || 'intern',
      takenUsernamesSet
    );
    const temporary_password = generateTemporaryPassword(
      full_name || 'Intern',
      effectiveCourseCode
    );

    return {
      row_number: rowNumber,
      full_name,
      username: generated_username,
      generated_username,
      temporary_password,
      email,
      phone,
      gender,
      college,
      course,
      course_name: course,
      course_code: course_code || effectiveCourseCode,
      batch,
      department: resolvedDeptName,
      department_id: resolvedDeptId,
      internship_role,
      start_date: startParsed.iso || startDateRaw,
      joining_date: startParsed.iso || startDateRaw,
      end_date: endParsed.iso || endDateRaw,
      duration: durationRaw || calculateDuration(startParsed.iso || startDateRaw, endParsed.iso || endDateRaw),
      assigned_mentor: resolvedMentorName,
      mentor_id: resolvedMentorId,
      hr_contact: hrRaw,
      status: normalizedStatus,
      address,
      row_status,
      is_valid,
      is_in_file_duplicate,
      is_db_duplicate,
      has_missing_required,
      cell_errors,
      error_reasons,
    };
  });

  return {
    total_records: rawRows.length,
    valid_count: validCount,
    invalid_count: invalidCount,
    duplicate_count: inFileDupCount + dbDupCount,
    in_file_duplicate_count: inFileDupCount,
    db_duplicate_count: dbDupCount,
    missing_required_count: missingReqCount,
    column_mapping: mapping,
    rows,
  };
}

export function downloadSampleTemplate(format = 'csv') {
  const headers = [
    'Full Name',
    'Email',
    'Phone',
    'Course Name',
    'Course Code',
    'Batch',
    'Joining Date',
    'Internship Duration',
    'Department',
    'Assigned Mentor',
    'Status',
  ];
  const sampleRows = [
    [
      'Aleena Mathew',
      'aleena.mathew@university.edu',
      '+91 9847123450',
      'Python Full Stack Development',
      'PYFS01',
      'Batch 2026-A',
      '2026-06-01',
      '12 weeks',
      'Software Engineering',
      'David Miller',
      'Active',
    ],
    [
      'Anjali Thomas',
      'anjali.thomas@university.edu',
      '+91 9847123451',
      'Digital Marketing & Analytics',
      'DM01',
      'Batch 2026-A',
      '2026-06-01',
      '12 weeks',
      'Data Analytics',
      'David Miller',
      'Active',
    ],
    [
      'Rohan Verma',
      'rohan.verma@university.edu',
      '+91 9811122334',
      'Data Analytics & BI',
      'DA01',
      'Batch 2026-B',
      '2026-07-01',
      '12 weeks',
      'Data Analytics',
      'David Miller',
      'Active',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Intern_Import_Template');

  if (format === 'xlsx') {
    XLSX.writeFile(wb, 'intern_import_template.xlsx');
  } else {
    XLSX.writeFile(wb, 'intern_import_template.csv', { bookType: 'csv' });
  }
}

export function downloadFailedRecords(failedRows = [], format = 'csv') {
  if (!Array.isArray(failedRows) || failedRows.length === 0) return;

  const headers = [
    'Row #',
    'Full Name',
    'Email',
    'Phone',
    'College',
    'Course',
    'Department',
    'Internship Role',
    'Start Date',
    'End Date',
    'Assigned Mentor',
    'Status',
    'Error Reason',
  ];

  const dataRows = failedRows.map((r) => [
    r.row_number || '',
    sanitizeSpreadsheetCell(r.full_name),
    sanitizeSpreadsheetCell(r.email),
    sanitizeSpreadsheetCell(r.phone),
    sanitizeSpreadsheetCell(r.college),
    sanitizeSpreadsheetCell(r.course),
    sanitizeSpreadsheetCell(r.department),
    sanitizeSpreadsheetCell(r.internship_role),
    sanitizeSpreadsheetCell(r.start_date),
    sanitizeSpreadsheetCell(r.end_date),
    sanitizeSpreadsheetCell(r.assigned_mentor),
    sanitizeSpreadsheetCell(r.status),
    sanitizeSpreadsheetCell(
      r.error_reason || (Array.isArray(r.error_reasons) ? r.error_reasons.join('; ') : 'Validation error')
    ),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Failed_Intern_Records');

  if (format === 'xlsx') {
    XLSX.writeFile(wb, `failed_intern_imports_${Date.now()}.xlsx`);
  } else {
    XLSX.writeFile(wb, `failed_intern_imports_${Date.now()}.csv`, { bookType: 'csv' });
  }
}

export function exportInternRecords(interns = [], format = 'csv') {
  const headers = [
    'Intern ID',
    'Full Name',
    'Email',
    'Phone',
    'Gender',
    'College / University',
    'Course / Degree',
    'Department',
    'Internship Role',
    'Start Date',
    'End Date',
    'Duration',
    'Assigned Mentor',
    'Status',
    'Address',
  ];

  const rows = interns.map((i, idx) => [
    sanitizeSpreadsheetCell(i.intern_code || `INT-2026-${String(i.id || idx + 1).padStart(4, '0')}`),
    sanitizeSpreadsheetCell(i.full_name || `${i.first_name || ''} ${i.last_name || ''}`.trim() || i.username),
    sanitizeSpreadsheetCell(i.email),
    sanitizeSpreadsheetCell(i.phone),
    sanitizeSpreadsheetCell(i.gender || ''),
    sanitizeSpreadsheetCell(i.college || ''),
    sanitizeSpreadsheetCell(i.course || i.education_qualification || ''),
    sanitizeSpreadsheetCell(i.department_name || i.department || 'Data Analytics'),
    sanitizeSpreadsheetCell(i.internship_role || 'Data Analytics Intern'),
    sanitizeSpreadsheetCell(i.start_date || ''),
    sanitizeSpreadsheetCell(i.end_date || ''),
    sanitizeSpreadsheetCell(i.internship_duration || calculateDuration(i.start_date, i.end_date)),
    sanitizeSpreadsheetCell(i.assigned_mentor_name || 'Unassigned'),
    sanitizeSpreadsheetCell(i.status || i.intern_status || 'Active'),
    sanitizeSpreadsheetCell(i.address || ''),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Interns_Directory');

  if (format === 'xlsx') {
    XLSX.writeFile(wb, `interns_directory_${new Date().toISOString().split('T')[0]}.xlsx`);
  } else {
    XLSX.writeFile(wb, `interns_directory_${new Date().toISOString().split('T')[0]}.csv`, { bookType: 'csv' });
  }
}
