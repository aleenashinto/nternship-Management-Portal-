// Comprehensive Client-Side Demo Mock Data Engine
// Allows the deployed Vercel frontend to run with full interactivity even when deployed purely as a static SPA.
import {
  SYSTEM_FIELDS,
  autoDetectColumnMapping,
  validateInternRows,
  calculateDuration,
  sanitizeSpreadsheetCell,
} from '../utils/internSpreadsheet';

const INITIAL_USERS = {
  admin: {
    id: 1,
    username: 'admin',
    email: 'admin@portal.example.com',
    first_name: 'System',
    last_name: 'Administrator',
    full_name: 'System Administrator',
    role: 'ADMIN',
    phone: '+1 (555) 000-0000',
    is_active_intern: true,
  },
  hr_manager: {
    id: 2,
    username: 'hr_manager',
    email: 'hr@portal.example.com',
    first_name: 'Sarah',
    last_name: 'Connor',
    full_name: 'Sarah Connor',
    role: 'HR',
    phone: '+1 (555) 234-5678',
    is_active_intern: true,
  },
  lead_mentor: {
    id: 3,
    username: 'lead_mentor',
    email: 'mentor@portal.example.com',
    first_name: 'David',
    last_name: 'Miller',
    full_name: 'David Miller',
    role: 'MENTOR',
    phone: '+1 (555) 345-6789',
    work_start_time: '09:00',
    work_end_time: '17:30',
    assigned_intern_count: 2,
    is_active_intern: true,
  },
  intern_emma: {
    id: 4,
    intern_code: 'INT-2026-0001',
    username: 'intern_emma',
    email: 'emma.watson@example.com',
    first_name: 'Emma',
    last_name: 'Watson',
    full_name: 'Emma Watson',
    role: 'INTERN',
    phone: '+1 (555) 567-8901',
    gender: 'Female',
    college: 'Harvard University',
    course: 'M.S. in Data Analytics',
    department: 'Data Analytics',
    department_name: 'Data Analytics',
    internship_role: 'Data Analytics Intern',
    start_date: '2026-06-01',
    end_date: '2026-08-31',
    internship_duration: '13 weeks (91 days)',
    address: '12 Ocean Drive, Cambridge, MA',
    education_qualification: 'M.S. in Data Analytics',
    source: 'Campus Drive',
    assigned_mentor: 3,
    assigned_mentor_name: 'David Miller',
    hr_contact: 2,
    hr_contact_name: 'Sarah Connor',
    status: 'Active',
    intern_status: 'Active',
    is_active_intern: true,
  },
  intern_john: {
    id: 5,
    intern_code: 'INT-2026-0002',
    username: 'intern_john',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    full_name: 'John Doe',
    role: 'INTERN',
    phone: '+1 (555) 456-7890',
    phone2: '+1 (555) 456-7891',
    gender: 'Male',
    college: 'Stanford University',
    course: 'B.S. in Computer Science',
    department: 'Software Engineering',
    department_name: 'Software Engineering',
    internship_role: 'Full-Stack Developer Intern',
    start_date: '2026-06-15',
    end_date: '2026-09-15',
    internship_duration: '13 weeks (92 days)',
    address: '742 Evergreen Terrace, Springfield',
    education_qualification: 'B.S. in Computer Science',
    source: 'Direct',
    assigned_mentor: 3,
    assigned_mentor_name: 'David Miller',
    hr_contact: 2,
    hr_contact_name: 'Sarah Connor',
    status: 'Active',
    intern_status: 'Active',
    is_active_intern: true,
  },
  intern_alex: {
    id: 6,
    intern_code: 'INT-2026-0003',
    username: 'intern_alex',
    email: 'alex.smith@example.com',
    first_name: 'Alex',
    last_name: 'Smith',
    full_name: 'Alex Smith',
    role: 'INTERN',
    phone: '+1 (555) 678-9012',
    gender: 'Male',
    college: 'UC Berkeley',
    course: 'B.Tech in Information Technology',
    department: 'Artificial Intelligence & ML',
    department_name: 'Artificial Intelligence & ML',
    internship_role: 'AI & ML Intern',
    start_date: '2026-07-01',
    end_date: '2026-09-30',
    internship_duration: '13 weeks (91 days)',
    address: '89 Silicon Blvd, San Jose, CA',
    education_qualification: 'B.Tech in Information Technology',
    source: 'Referral',
    assigned_mentor: null,
    assigned_mentor_name: null,
    hr_contact: 2,
    hr_contact_name: 'Sarah Connor',
    status: 'Onboarding',
    intern_status: 'Onboarding',
    is_active_intern: true,
  },
};

const INITIAL_PROJECTS = [
  {
    id: 1,
    title: 'E-Commerce Customer Churn Prediction & Retention Analytics',
    tools_used: ['Python', 'SQL', 'Tableau', 'Excel'],
    instructions: `1. Clean and preprocess customer transaction history.
2. Build a churn prediction classification model (e.g. Random Forest / XGBoost).
3. Identify top churn factors (inactivity, return frequency, support tickets).
4. Build an interactive retention dashboard with actionable cohort recommendations.`,
    data_source_type: 'DATABASE',
    data_source_description: 'PostgreSQL replica: db.internship.local:5432/analytics_ecommerce (Table: customer_logs)',
    created_by: 3,
    created_by_name: 'David Miller',
    active_assignments_count: 2,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 2,
    title: 'Financial Portfolio Risk & Monte Carlo Stress Testing',
    tools_used: ['Excel', 'Python', 'Power BI'],
    instructions: `1. Fetch historical daily closing prices for S&P 500 tech equities.
2. Calculate annualized volatility, Sharpe ratio, and Value at Risk (VaR 95% & 99%).
3. Implement 10,000 iterations of Monte Carlo simulation.
4. Prepare executive summary presentation for risk committee review.`,
    data_source_type: 'API',
    data_source_description: 'Yahoo Finance API / AlphaVantage endpoints with standard daily interval.',
    created_by: 3,
    created_by_name: 'David Miller',
    active_assignments_count: 1,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

const INITIAL_ASSIGNMENTS = [
  {
    id: 101,
    project: 2,
    project_title: 'Financial Portfolio Risk & Monte Carlo Stress Testing',
    project_details: INITIAL_PROJECTS[1],
    intern: 4,
    intern_name: 'Emma Watson',
    intern_email: 'emma.watson@example.com',
    mentor: 3,
    mentor_name: 'David Miller',
    assigned_date: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
    due_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    status: 'COMPLETED',
    score: 94.5,
    evaluation_notes: 'Exceptional modeling logic and crisp presentation of simulation percentiles.',
    evaluated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    submission_notes: 'Completed Jupyter notebook and executive slides attached.',
    submitted_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 102,
    project: 1,
    project_title: 'E-Commerce Customer Churn Prediction & Retention Analytics',
    project_details: INITIAL_PROJECTS[0],
    intern: 4,
    intern_name: 'Emma Watson',
    intern_email: 'emma.watson@example.com',
    mentor: 3,
    mentor_name: 'David Miller',
    assigned_date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    status: 'SUBMITTED',
    score: null,
    evaluation_notes: '',
    submission_notes: 'Model achieves 89% AUC-ROC. Tableau workbook packaged.',
    submitted_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 103,
    project: 1,
    project_title: 'E-Commerce Customer Churn Prediction & Retention Analytics',
    project_details: INITIAL_PROJECTS[0],
    intern: 5,
    intern_name: 'John Doe',
    intern_email: 'john.doe@example.com',
    mentor: 3,
    mentor_name: 'David Miller',
    assigned_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    status: 'IN_PROGRESS',
    score: null,
    evaluation_notes: '',
    submission_notes: '',
    submitted_at: null,
  },
];

const INITIAL_PRESENTATIONS = [
  {
    id: 1,
    project: 1,
    project_title: 'E-Commerce Customer Churn Prediction & Retention Analytics',
    intern: 4,
    intern_name: 'Emma Watson',
    mentor: 3,
    mentor_name: 'David Miller',
    presentation_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    presentation_time: '14:00',
    google_meet_link: 'https://meet.google.com/abc-intern-demo',
    status: 'SCHEDULED',
    notes: 'Final walkthrough of customer churn dashboard and findings.',
  },
];

const INITIAL_CERTIFICATES = [
  {
    id: 1,
    intern: 4,
    intern_name: 'Emma Watson',
    intern_email: 'emma.watson@example.com',
    status: 'PENDING',
    certificate_number: null,
    certificate_file: null,
    rejection_reason: '',
    approved_by: null,
    approved_by_name: null,
    completed_projects_count: 1,
    request_date: new Date(Date.now() - 2 * 3600000).toISOString(),
    approval_date: null,
  },
];

const INITIAL_EXTENSIONS = [
  {
    id: 1,
    assignment: 103,
    project_title: 'E-Commerce Customer Churn Prediction & Retention Analytics',
    current_due_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    intern: 5,
    intern_name: 'John Doe',
    reason: 'Mid-term academic examinations require 3 additional days for model evaluation.',
    requested_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'PENDING',
    mentor_notes: '',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Project Evaluation Completed',
    message: "Your mentor evaluated 'Financial Portfolio Risk & Monte Carlo Stress Testing'. Score: 94.5/100.",
    notification_type: 'EVALUATION',
    link: '/intern/projects',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Certificate Request Submitted',
    message: 'Emma Watson has completed internship milestones and requested certificate approval.',
    notification_type: 'CERTIFICATE_STATUS',
    link: '/hr/certificates',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
];

// Helper to get or set local store
const getStore = (key, defaultVal) => {
  try {
    const val = localStorage.getItem(`portal_mock_${key}`);
    if (!val) {
      localStorage.setItem(`portal_mock_${key}`, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(val);
  } catch {
    return defaultVal;
  }
};

const setStore = (key, val) => {
  try {
    localStorage.setItem(`portal_mock_${key}`, JSON.stringify(val));
  } catch (e) {
    console.error(e);
  }
};

export const handleMockRequest = async (url, method = 'get', data = null) => {
  // 1. Clean URL
  let cleanUrl = url || '';
  try {
    if (cleanUrl.startsWith('http')) {
      cleanUrl = new URL(cleanUrl).pathname;
    }
  } catch {}
  cleanUrl = cleanUrl.split('?')[0]; // strip query string
  cleanUrl = cleanUrl.replace(/^\/api/, '').replace(/\/$/, '');

  // 2. Parse data safely whether it is JSON String, FormData, or Object
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = {};
    }
  } else if (data && typeof data === 'object' && typeof data.entries === 'function') {
    // FormData
    parsedData = {};
    for (let [k, v] of data.entries()) {
      parsedData[k] = v;
    }
  } else if (!parsedData) {
    parsedData = {};
  }

  const activeUser = JSON.parse(localStorage.getItem('portal_user') || 'null');

  // 1. Auth Login
  if (cleanUrl === '/auth/login' && method.toLowerCase() === 'post') {
    const rawUser = parsedData?.username || '';
    const trimmedUser = rawUser.trim().toLowerCase();

    // Check predefined users first (also accept @beat.local seeded usernames)
    const beatAlias = {
      'admin@beat.local': 'admin',
      'hr@beat.local': 'hr_manager',
      'mentor1@beat.local': 'lead_mentor',
      'mentor2@beat.local': 'lead_mentor',
      'intern1@beat.local': 'intern_emma',
      'intern2@beat.local': 'intern_john',
      'intern3@beat.local': 'intern_alex',
    };
    const u = INITIAL_USERS[beatAlias[trimmedUser] || trimmedUser];
    if (u) {
      localStorage.setItem('portal_user', JSON.stringify(u));
      return {
        access: `mock_jwt_access_${trimmedUser}`,
        refresh: `mock_jwt_refresh_${trimmedUser}`,
        user: u,
      };
    }

    // Dynamic role deduction so any username can test any role:
    let role = 'HR';
    if (trimmedUser.includes('mentor') || trimmedUser.includes('lead')) role = 'MENTOR';
    else if (trimmedUser.includes('intern') || trimmedUser.includes('student') || trimmedUser.includes('emma') || trimmedUser.includes('john')) role = 'INTERN';
    else if (trimmedUser.includes('admin')) role = 'ADMIN';

    const fallbackUser = {
      id: Date.now(),
      username: rawUser || 'demo_user',
      email: `${trimmedUser || 'user'}@portal.example.com`,
      first_name: rawUser || 'Demo',
      last_name: 'User',
      full_name: (rawUser || 'Demo User').toUpperCase(),
      role: role,
      is_active_intern: true,
      assigned_mentor_name: role === 'INTERN' ? 'David Miller' : null,
      assigned_mentor: role === 'INTERN' ? 3 : null,
    };

    localStorage.setItem('portal_user', JSON.stringify(fallbackUser));
    return {
      access: `mock_jwt_access_${trimmedUser}`,
      refresh: `mock_jwt_refresh_${trimmedUser}`,
      user: fallbackUser,
    };
  }

  // 2. Auth Me
  if (cleanUrl === '/auth/me') {
    if (activeUser) return activeUser;
    return INITIAL_USERS.hr_manager;
  }

  // 3. HR Dashboard
  if (cleanUrl === '/hr/dashboard') {
    const certs = getStore('certificates', INITIAL_CERTIFICATES);
    const pendingCerts = certs.filter(c => c.status === 'PENDING');
    const mentors = getStore('mentors', Object.values(INITIAL_USERS).filter(u => u.role === 'MENTOR'));
    const interns = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
    const assignments = getStore('assignments', INITIAL_ASSIGNMENTS);

    return {
      kpis: {
        total_mentors: mentors.length,
        total_interns: interns.length,
        active_interns: interns.filter(i => i.is_active_intern).length,
        interns_without_mentors: interns.filter(i => !i.assigned_mentor).length,
        total_projects_assigned: assignments.length,
        completed_projects: assignments.filter(a => a.status === 'COMPLETED').length,
        pending_projects: assignments.filter(a => ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED'].includes(a.status)).length,
        overdue_projects: assignments.filter(a => a.status === 'OVERDUE').length,
        pending_certificate_approvals: pendingCerts.length,
      },
      pending_certificates: pendingCerts,
    };
  }

  // 4. HR Mentors (Add, View, Update, Delete)
  if (cleanUrl === '/hr/mentors') {
    const current = getStore('mentors', Object.values(INITIAL_USERS).filter(u => u.role === 'MENTOR'));
    if (method.toLowerCase() === 'post') {
      const newM = {
        id: Date.now(),
        ...parsedData,
        full_name: `${parsedData.first_name || ''} ${parsedData.last_name || ''}`.trim() || parsedData.username,
        role: 'MENTOR',
        assigned_intern_count: 0,
      };
      current.push(newM);
      setStore('mentors', current);
      return newM;
    }
    return current;
  }

  if (cleanUrl.match(/\/hr\/mentors\/\d+/)) {
    const mentorId = parseInt(cleanUrl.split('/')[3]);
    const current = getStore('mentors', Object.values(INITIAL_USERS).filter(u => u.role === 'MENTOR'));
    if (method.toLowerCase() === 'get') {
      return current.find(m => m.id === mentorId) || current[0];
    }
    if (method.toLowerCase() === 'put' || method.toLowerCase() === 'patch') {
      const target = current.find(m => m.id === mentorId);
      if (target) {
        Object.assign(target, parsedData);
        target.full_name = `${target.first_name || ''} ${target.last_name || ''}`.trim() || target.username;
        setStore('mentors', current);
        // Update assigned_mentor_name on any interns linked to this mentor
        const interns = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
        interns.forEach(i => {
          if (i.assigned_mentor === mentorId) i.assigned_mentor_name = target.full_name;
        });
        setStore('interns', interns);
      }
      return target || { status: 'updated' };
    }
    if (method.toLowerCase() === 'delete') {
      const filtered = current.filter(m => m.id !== mentorId);
      setStore('mentors', filtered);
      // Unassign interns that belonged to the deleted mentor
      const interns = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
      interns.forEach(i => {
        if (i.assigned_mentor === mentorId) {
          i.assigned_mentor = null;
          i.assigned_mentor_name = null;
        }
      });
      setStore('interns', interns);
      return { status: 'deleted' };
    }
  }

  // 5. HR Interns (Add, View, Edit, Delete, Change Status)
  if (cleanUrl === '/hr/interns') {
    const current = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
    if (method.toLowerCase() === 'post') {
      const mentors = getStore('mentors', Object.values(INITIAL_USERS).filter(u => u.role === 'MENTOR'));
      const mId = parsedData.assigned_mentor || parsedData.mentor_id ? parseInt(parsedData.assigned_mentor || parsedData.mentor_id) : null;
      const mObj = mentors.find(m => m.id === mId);
      const rawFull = (parsedData.full_name || `${parsedData.first_name || ''} ${parsedData.last_name || ''}`).trim();
      const parts = rawFull.split(' ');
      const firstName = parsedData.first_name || parts[0] || 'Intern';
      const lastName = parsedData.last_name || parts.slice(1).join(' ') || '';
      const nextNum = current.length + 1;
      const statusVal = parsedData.status || parsedData.intern_status || 'Active';
      const courseVal = parsedData.course || parsedData.education_qualification || '';
      const deptVal = parsedData.department_name || parsedData.department || 'Data Analytics';
      const durationVal = parsedData.internship_duration || calculateDuration(parsedData.start_date, parsedData.end_date);
      const newI = {
        id: Date.now(),
        intern_code: parsedData.intern_code || `INT-2026-${String(nextNum).padStart(4, '0')}`,
        username: parsedData.username || (parsedData.email ? parsedData.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') : `intern_${nextNum}`),
        ...parsedData,
        first_name: firstName,
        last_name: lastName,
        full_name: rawFull || parsedData.username || `Intern ${nextNum}`,
        course: courseVal,
        education_qualification: courseVal,
        department: deptVal,
        department_name: deptVal,
        internship_role: parsedData.internship_role || 'Data Analytics Intern',
        internship_duration: durationVal,
        assigned_mentor: mId,
        assigned_mentor_name: mObj ? (mObj.full_name || mObj.username) : null,
        hr_contact: parsedData.hr_contact || 2,
        hr_contact_name: parsedData.hr_contact_name || 'Sarah Connor',
        status: statusVal,
        intern_status: statusVal,
        role: 'INTERN',
        is_active_intern: !['Terminated', 'Completed'].includes(statusVal),
        created_at: new Date().toISOString(),
      };
      current.unshift(newI);
      setStore('interns', current);
      return newI;
    }
    return current;
  }

  // 5b. Change Intern Status
  if (cleanUrl.match(/\/hr\/interns\/\d+\/change-status/)) {
    const internId = parseInt(cleanUrl.split('/')[3]);
    const current = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
    const target = current.find(i => i.id === internId);
    if (target) {
      target.status = parsedData.status || 'Active';
      target.intern_status = target.status;
      target.is_active_intern = !['Terminated', 'Completed'].includes(target.status);
      setStore('interns', current);
      return target;
    }
  }

  // 6. Assign Mentor
  if (cleanUrl.match(/\/hr\/interns\/\d+\/assign-mentor/)) {
    const internId = parseInt(cleanUrl.split('/')[3]);
    const current = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
    const target = current.find(i => i.id === internId);
    if (target) {
      target.assigned_mentor = parsedData.mentor_id;
      const mentors = getStore('mentors', Object.values(INITIAL_USERS).filter(u => u.role === 'MENTOR'));
      const m = mentors.find(m => m.id === parsedData.mentor_id);
      target.assigned_mentor_name = m ? (m.full_name || m.username) : null;
      setStore('interns', current);
      return target;
    }
  }

  // 6b. View, Edit (PATCH/PUT), Delete individual Intern
  if (cleanUrl.match(/^\/hr\/interns\/\d+$/)) {
    const internId = parseInt(cleanUrl.split('/')[3]);
    const current = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
    if (method.toLowerCase() === 'get') {
      return current.find(i => i.id === internId) || current[0];
    }
    if (method.toLowerCase() === 'patch' || method.toLowerCase() === 'put') {
      const target = current.find(i => i.id === internId);
      if (target) {
        const mentors = getStore('mentors', Object.values(INITIAL_USERS).filter(u => u.role === 'MENTOR'));
        Object.assign(target, parsedData);
        if (parsedData.full_name && !parsedData.first_name) {
          const pts = parsedData.full_name.trim().split(' ');
          target.first_name = pts[0] || '';
          target.last_name = pts.slice(1).join(' ') || '';
        }
        target.full_name = target.full_name || `${target.first_name || ''} ${target.last_name || ''}`.trim() || target.username;
        if (parsedData.course) target.education_qualification = parsedData.course;
        if (parsedData.department) target.department_name = parsedData.department;
        if (parsedData.status) target.intern_status = parsedData.status;
        if (parsedData.start_date || parsedData.end_date) {
          target.internship_duration = calculateDuration(target.start_date, target.end_date) || target.internship_duration;
        }
        if ('assigned_mentor' in parsedData) {
          const mId = parsedData.assigned_mentor ? parseInt(parsedData.assigned_mentor) : null;
          target.assigned_mentor = mId;
          const mObj = mentors.find(m => m.id === mId);
          target.assigned_mentor_name = mObj ? (mObj.full_name || mObj.username) : null;
        }
        setStore('interns', current);
      }
      return target || { status: 'updated' };
    }
    if (method.toLowerCase() === 'delete') {
      const filtered = current.filter(i => i.id !== internId);
      setStore('interns', filtered);
      // Clean up related assignments in demo store
      const assignments = getStore('assignments', INITIAL_ASSIGNMENTS).filter(a => a.intern !== internId);
      setStore('assignments', assignments);
      return { status: 'deleted' };
    }
  }

  // 7. Certificates
  if (cleanUrl === '/hr/certificates' || cleanUrl === '/intern/certificate') {
    if (method.toLowerCase() === 'post') {
      const certs = getStore('certificates', INITIAL_CERTIFICATES);
      const newC = {
        id: Date.now(),
        intern: activeUser?.id || 4,
        intern_name: activeUser?.full_name || 'Emma Watson',
        intern_email: activeUser?.email || 'emma.watson@example.com',
        status: 'PENDING',
        completed_projects_count: 2,
        request_date: new Date().toISOString(),
      };
      certs.unshift(newC);
      setStore('certificates', certs);
      return newC;
    }
    return getStore('certificates', INITIAL_CERTIFICATES);
  }

  // Certificate approve / reject
  if (cleanUrl.match(/\/hr\/certificates\/\d+\/approve/)) {
    const certId = parseInt(cleanUrl.split('/')[3]);
    const certs = getStore('certificates', INITIAL_CERTIFICATES);
    const target = certs.find(c => c.id === certId);
    if (target) {
      target.status = 'APPROVED';
      target.approved_by_name = activeUser?.full_name || 'Sarah Connor';
      target.approval_date = new Date().toISOString();
      target.certificate_number = `CERT-VERCEL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      target.certificate_file = '#';
      setStore('certificates', certs);
      return target;
    }
  }

  if (cleanUrl.match(/\/hr\/certificates\/\d+\/reject/)) {
    const certId = parseInt(cleanUrl.split('/')[3]);
    const certs = getStore('certificates', INITIAL_CERTIFICATES);
    const target = certs.find(c => c.id === certId);
    if (target) {
      target.status = 'REJECTED';
      target.rejection_reason = parsedData?.reason || 'Requirements not yet met';
      setStore('certificates', certs);
      return target;
    }
  }

  // 8. Mentor Dashboard
  if (cleanUrl === '/mentor/dashboard') {
    const assignments = getStore('assignments', INITIAL_ASSIGNMENTS);
    return {
      kpis: {
        total_assigned_interns: 2,
        active_interns: 2,
        total_projects_assigned: assignments.length,
        completed_projects: assignments.filter(a => a.status === 'COMPLETED').length,
        pending_projects: assignments.filter(a => ['ASSIGNED', 'IN_PROGRESS'].includes(a.status)).length,
        overdue_projects: assignments.filter(a => a.status === 'OVERDUE').length,
        projects_awaiting_evaluation: assignments.filter(a => a.status === 'SUBMITTED').length,
        upcoming_presentations: 1,
      },
    };
  }

  // 9. Mentor Projects
  if (cleanUrl === '/mentor/projects') {
    if (method.toLowerCase() === 'post') {
      const projs = getStore('projects', INITIAL_PROJECTS);
      const newP = {
        id: Date.now(),
        title: parsedData?.title || 'New Project',
        tools_used: typeof parsedData?.tools_used === 'string' ? JSON.parse(parsedData.tools_used) : (parsedData?.tools_used || ['Python']),
        instructions: parsedData?.instructions || '',
        data_source_type: parsedData?.data_source_type || 'DATABASE',
        data_source_description: parsedData?.data_source_description || '',
        created_by: activeUser?.id || 3,
        created_by_name: activeUser?.full_name || 'David Miller',
        active_assignments_count: 0,
        created_at: new Date().toISOString(),
      };
      projs.unshift(newP);
      setStore('projects', projs);
      return newP;
    }
    return getStore('projects', INITIAL_PROJECTS);
  }

  if (cleanUrl.match(/\/mentor\/projects\/\d+/)) {
    const projId = parseInt(cleanUrl.split('/')[3]);
    const projs = getStore('projects', INITIAL_PROJECTS);
    if (method.toLowerCase() === 'patch' || method.toLowerCase() === 'put') {
      const target = projs.find(p => p.id === projId);
      if (target) {
        Object.assign(target, parsedData);
        if (typeof parsedData?.tools_used === 'string') {
          try { target.tools_used = JSON.parse(parsedData.tools_used); } catch {}
        }
        setStore('projects', projs);
      }
      return target || { status: 'updated' };
    }
    if (method.toLowerCase() === 'delete') {
      const filtered = projs.filter(p => p.id !== projId);
      setStore('projects', filtered);
      return { status: 'deleted' };
    }
  }

  // 10. Mentor Interns
  if (cleanUrl === '/mentor/interns') {
    const allInterns = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
    if (activeUser?.role === 'ADMIN') return allInterns;
    const mentorId = activeUser?.id || 3;
    const assigned = allInterns.filter(i => Number(i.assigned_mentor) === Number(mentorId));
    return assigned.length > 0 ? assigned : allInterns.filter(i => i.assigned_mentor);
  }

  if (cleanUrl.match(/\/mentor\/interns\/\d+\/notes/)) {
    const internId = parseInt(cleanUrl.split('/')[3]);
    const notes = getStore('mentor_notes', [
      {
        id: 1,
        intern: 4,
        mentor_name: 'David Miller',
        content: 'Strong SQL cohort query modeling and clear executive presentation.',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
    if (method.toLowerCase() === 'post') {
      const n = {
        id: Date.now(),
        intern: internId,
        mentor_name: activeUser?.full_name || 'David Miller',
        content: parsedData.content,
        created_at: new Date().toISOString(),
      };
      notes.unshift(n);
      setStore('mentor_notes', notes);
      return n;
    }
    return notes.filter(n => n.intern === internId);
  }

  if (cleanUrl.match(/\/mentor\/interns\/\d+\/complete-internship/)) {
    const internId = parseInt(cleanUrl.split('/')[3]);
    const allInterns = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
    const intern = allInterns.find(i => i.id === internId) || INITIAL_USERS.intern_emma;
    intern.internship_completed = true;
    setStore('interns', allInterns);

    const certs = getStore('certificates', INITIAL_CERTIFICATES);
    const existing = certs.find(c => c.intern === internId && ['PENDING', 'APPROVED'].includes(c.status));
    if (!existing) {
      const assignments = getStore('assignments', INITIAL_ASSIGNMENTS).filter(a => a.intern === internId && a.status === 'COMPLETED');
      certs.unshift({
        id: Date.now(),
        intern: internId,
        intern_name: intern.full_name || intern.username,
        intern_email: intern.email,
        status: 'PENDING',
        completed_projects_count: assignments.length || 1,
        request_date: new Date().toISOString(),
      });
      setStore('certificates', certs);
    }
    return { status: 'internship_completed', certificate_requested: true };
  }

  if (cleanUrl.match(/\/mentor\/interns\/\d+/)) {
    const internId = parseInt(cleanUrl.split('/')[3]);
    const allInterns = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
    const intern = allInterns.find(i => i.id === internId) || Object.values(INITIAL_USERS).find(i => i.id === internId) || INITIAL_USERS.intern_emma;
    const assignments = getStore('assignments', INITIAL_ASSIGNMENTS).filter(a => a.intern === internId);
    const presentations = getStore('presentations', INITIAL_PRESENTATIONS).filter(p => p.intern === internId);
    const notes = getStore('mentor_notes', [
      {
        id: 1,
        intern: 4,
        mentor_name: 'David Miller',
        content: 'Strong SQL cohort query modeling and clear executive presentation.',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]).filter(n => n.intern === internId);
    const certs = getStore('certificates', INITIAL_CERTIFICATES).filter(c => c.intern === internId);
    return { intern, assignments, presentations, notes, certificate: certs[0] || null };
  }

  // 11. Mentor Assignments
  if (cleanUrl === '/mentor/assignments' || cleanUrl === '/intern/assignments') {
    if (method.toLowerCase() === 'post') {
      const current = getStore('assignments', INITIAL_ASSIGNMENTS);
      const projs = getStore('projects', INITIAL_PROJECTS);
      const proj = projs.find(p => p.id === parseInt(parsedData?.project)) || projs[0];
      const intern = Object.values(INITIAL_USERS).find(i => i.id === parseInt(parsedData?.intern)) || INITIAL_USERS.intern_john;

      const newA = {
        id: Date.now(),
        project: proj.id,
        project_title: proj.title,
        project_details: proj,
        intern: intern.id,
        intern_name: intern.full_name,
        intern_email: intern.email,
        mentor: activeUser?.id || 3,
        mentor_name: activeUser?.full_name || 'David Miller',
        assigned_date: parsedData?.assigned_date || new Date().toISOString().split('T')[0],
        due_date: parsedData?.due_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: 'ASSIGNED',
        score: null,
        evaluation_notes: '',
        submission_notes: '',
      };
      current.unshift(newA);
      setStore('assignments', current);
      return newA;
    }
    return getStore('assignments', INITIAL_ASSIGNMENTS);
  }

  // Evaluate assignment
  if (cleanUrl.match(/\/mentor\/assignments\/\d+\/evaluate/)) {
    const aId = parseInt(cleanUrl.split('/')[3]);
    const current = getStore('assignments', INITIAL_ASSIGNMENTS);
    const target = current.find(a => a.id === aId);
    if (target) {
      target.score = parsedData?.score;
      target.evaluation_notes = parsedData?.evaluation_notes;
      target.status = parsedData?.mark_completed ? 'COMPLETED' : parsedData?.request_revision ? 'REVISION_REQUIRED' : 'UNDER_REVIEW';
      target.evaluated_at = new Date().toISOString();
      setStore('assignments', current);
      return target;
    }
  }

  // Intern submit
  if (cleanUrl.match(/\/intern\/assignments\/\d+\/submit/)) {
    const aId = parseInt(cleanUrl.split('/')[3]);
    const current = getStore('assignments', INITIAL_ASSIGNMENTS);
    const target = current.find(a => a.id === aId);
    if (target) {
      target.status = 'SUBMITTED';
      target.submission_notes = parsedData?.submission_notes || 'Submitted deliverable';
      target.submitted_at = new Date().toISOString();
      setStore('assignments', current);
      return target;
    }
  }

  // 12. Extensions
  if (cleanUrl === '/mentor/extensions' || cleanUrl === '/intern/extensions') {
    if (method.toLowerCase() === 'post') {
      const current = getStore('extensions', INITIAL_EXTENSIONS);
      const newE = {
        id: Date.now(),
        assignment: parsedData?.assignment,
        project_title: 'Assigned Project',
        current_due_date: new Date().toISOString().split('T')[0],
        intern: activeUser?.id || 5,
        intern_name: activeUser?.full_name || 'John Doe',
        reason: parsedData?.reason,
        requested_date: parsedData?.requested_date,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      };
      current.unshift(newE);
      setStore('extensions', current);
      return newE;
    }
    return getStore('extensions', INITIAL_EXTENSIONS);
  }

  if (cleanUrl.match(/\/mentor\/extensions\/\d+\/respond/)) {
    const extId = parseInt(cleanUrl.split('/')[3]);
    const current = getStore('extensions', INITIAL_EXTENSIONS);
    const target = current.find(e => e.id === extId);
    if (target) {
      target.status = parsedData?.status;
      target.mentor_notes = parsedData?.mentor_notes;
      setStore('extensions', current);
      return target;
    }
  }

  // 13. Presentations
  if (cleanUrl === '/mentor/presentations' || cleanUrl === '/intern/presentations') {
    if (method.toLowerCase() === 'post') {
      const current = getStore('presentations', INITIAL_PRESENTATIONS);
      const projs = getStore('projects', INITIAL_PROJECTS);
      const proj = projs.find(p => p.id === parseInt(parsedData?.project)) || projs[0];
      const intern = Object.values(INITIAL_USERS).find(i => i.id === parseInt(parsedData?.intern)) || INITIAL_USERS.intern_emma;

      const newP = {
        id: Date.now(),
        project: proj.id,
        project_title: proj.title,
        intern: intern.id,
        intern_name: intern.full_name,
        mentor: activeUser?.id || 3,
        mentor_name: activeUser?.full_name || 'David Miller',
        presentation_date: parsedData?.presentation_date,
        presentation_time: parsedData?.presentation_time,
        google_meet_link: parsedData?.google_meet_link || 'https://meet.google.com/new',
        status: 'SCHEDULED',
        notes: parsedData?.notes || '',
      };
      current.unshift(newP);
      setStore('presentations', current);
      return newP;
    }
    return getStore('presentations', INITIAL_PRESENTATIONS);
  }

  if (cleanUrl.match(/\/mentor\/presentations\/\d+/)) {
    const presId = parseInt(cleanUrl.split('/')[3]);
    const current = getStore('presentations', INITIAL_PRESENTATIONS);
    if (method.toLowerCase() === 'patch' || method.toLowerCase() === 'put') {
      const target = current.find(p => p.id === presId);
      if (target) {
        Object.assign(target, parsedData);
        if (parsedData?.project) {
          const projs = getStore('projects', INITIAL_PROJECTS);
          const proj = projs.find(pr => pr.id === parseInt(parsedData.project));
          if (proj) target.project_title = proj.title;
        }
        if (parsedData?.intern) {
          const allInterns = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
          const intr = allInterns.find(i => i.id === parseInt(parsedData.intern));
          if (intr) target.intern_name = intr.full_name || intr.username;
        }
        setStore('presentations', current);
      }
      return target || { status: 'updated' };
    }
  }

  // 14. Intern Profile
  if (cleanUrl === '/intern/profile') {
    const intern = activeUser || INITIAL_USERS.intern_emma;
    const assignments = getStore('assignments', INITIAL_ASSIGNMENTS).filter(a => a.intern === intern.id);
    const presentations = getStore('presentations', INITIAL_PRESENTATIONS).filter(p => p.intern === intern.id);
    const certs = getStore('certificates', INITIAL_CERTIFICATES).filter(c => c.intern === intern.id);

    return {
      user: intern,
      summary: {
        total_assigned: assignments.length,
        completed: assignments.filter(a => a.status === 'COMPLETED').length,
        in_progress: assignments.filter(a => ['ASSIGNED', 'IN_PROGRESS'].includes(a.status)).length,
        submitted: assignments.filter(a => a.status === 'SUBMITTED').length,
        average_score: 94.5,
        completion_percentage: 100,
      },
      assignments,
      presentations,
      certificate: certs[0] || null,
    };
  }

  // 15. Notifications
  if (cleanUrl === '/notifications' || cleanUrl === '/notifications/') {
    return getStore('notifications', INITIAL_NOTIFICATIONS);
  }
  if (cleanUrl === '/notifications/mark-all-read' || cleanUrl === '/notifications/mark-all-read/') {
    const notifs = getStore('notifications', INITIAL_NOTIFICATIONS);
    notifs.forEach(n => (n.is_read = true));
    setStore('notifications', notifs);
    return { status: 'all marked as read' };
  }
  // Mark individual notification as read
  if (cleanUrl.match(/\/notifications\/\d+\/mark-read/)) {
    const notifId = parseInt(cleanUrl.split('/')[2]);
    const notifs = getStore('notifications', INITIAL_NOTIFICATIONS);
    const target = notifs.find(n => n.id === notifId);
    if (target) { target.is_read = true; setStore('notifications', notifs); }
    return { status: 'marked as read' };
  }

  // 16. Admin Dashboard
  if (cleanUrl === '/admin/dashboard') {
    const mentors = getStore('mentors', Object.values(INITIAL_USERS).filter(u => u.role === 'MENTOR'));
    const interns = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
    const projects = getStore('projects', INITIAL_PROJECTS);
    const assignments = getStore('assignments', INITIAL_ASSIGNMENTS);
    const certs = getStore('certificates', INITIAL_CERTIFICATES);

    return {
      kpis: {
        total_hr: 1,
        total_mentors: mentors.length,
        total_interns: interns.length,
        active_internships: interns.filter(i => i.is_active_intern).length,
        completed_internships: certs.filter(c => c.status === 'APPROVED').length + 1,
        total_projects: projects.length,
        total_assignments: assignments.length,
        completed_assignments: assignments.filter(a => a.status === 'COMPLETED').length,
        pending_certificates: certs.filter(c => c.status === 'PENDING').length,
        avg_score: 94.5,
      },
      status_breakdown: [
        { name: 'Completed', value: assignments.filter(a => a.status === 'COMPLETED').length },
        { name: 'Submitted / Review', value: assignments.filter(a => ['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED'].includes(a.status)).length },
        { name: 'In Progress / Assigned', value: assignments.filter(a => ['ASSIGNED', 'IN_PROGRESS'].includes(a.status)).length },
        { name: 'Revision Required', value: assignments.filter(a => a.status === 'REVISION_REQUIRED').length },
        { name: 'Overdue', value: assignments.filter(a => a.status === 'OVERDUE').length },
      ],
    };
  }

  // 17. Admin Staff (HR & Mentors)
  if (cleanUrl === '/admin/staff') {
    const defaultStaff = [
      INITIAL_USERS.hr_manager,
      INITIAL_USERS.lead_mentor,
      {
        id: 302,
        username: 'noah_mentor',
        email: 'noah.mentor@portal.example.com',
        first_name: 'Noah',
        last_name: 'Mentor',
        full_name: 'Noah Mentor',
        role: 'MENTOR',
        phone: '+91 90000 00002',
        work_start_time: '10:00',
        work_end_time: '18:30',
        assigned_intern_count: 1,
        is_active: true,
      },
    ];
    if (method.toLowerCase() === 'post') {
      const staff = getStore('admin_staff', defaultStaff);
      const newStaff = {
        id: Date.now(),
        ...parsedData,
        username: parsedData.email,
        full_name: parsedData.name,
        assigned_intern_count: 0,
        is_active: true,
      };
      staff.unshift(newStaff);
      setStore('admin_staff', staff);
      const logs = getStore('activity_logs', []);
      logs.unshift({
        id: Date.now(),
        actor: activeUser?.username || 'admin',
        role: 'ADMIN',
        action: 'USER_CREATED',
        entity: `User (${parsedData.role})`,
        metadata: parsedData.email,
        created_at: new Date().toISOString(),
      });
      setStore('activity_logs', logs);
      return { ...newStaff, temp_password: `Beat#${Math.random().toString(36).slice(2, 8)}A1` };
    }
    if (method.toLowerCase() === 'patch') {
      const staff = getStore('admin_staff', defaultStaff);
      const target = staff.find(s => s.id === parsedData.id);
      if (target) {
        Object.assign(target, parsedData);
        if (parsedData.name) target.full_name = parsedData.name;
        setStore('admin_staff', staff);
      }
      return target || { status: 'updated' };
    }
    return getStore('admin_staff', defaultStaff);
  }

  // 18. Admin Cross-Mentor Access Grants
  if (cleanUrl === '/admin/grants') {
    const defaultGrants = [
      {
        id: 1,
        owner_id: 3,
        owner_name: 'David Miller (mentor@portal.example.com)',
        grantee_id: 302,
        grantee_name: 'Noah Mentor (noah.mentor@portal.example.com)',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    if (method.toLowerCase() === 'post') {
      const grants = getStore('admin_grants', defaultGrants);
      const g = {
        id: Date.now(),
        owner_id: parsedData.owner_id,
        owner_name: parsedData.owner_name,
        grantee_id: parsedData.grantee_id,
        grantee_name: parsedData.grantee_name,
        created_at: new Date().toISOString(),
      };
      grants.unshift(g);
      setStore('admin_grants', grants);
      return g;
    }
    if (method.toLowerCase() === 'delete') {
      const grants = getStore('admin_grants', defaultGrants).filter(g => g.id !== parsedData.id);
      setStore('admin_grants', grants);
      return { status: 'revoked' };
    }
    return getStore('admin_grants', defaultGrants);
  }

  // 19. Admin Certificate Template
  if (cleanUrl === '/admin/template') {
    const defaultTpl = {
      organisation: 'Beat Education',
      programTitle: 'Data Analytics Internship Program',
      bodyText: 'has successfully completed the internship program',
      signatoryName: 'Authorised Signatory',
      signatoryTitle: 'Program Director',
      accentColor: '#4B3A9B',
    };
    if (method.toLowerCase() === 'put' || method.toLowerCase() === 'post') {
      setStore('cert_template', parsedData);
      return parsedData;
    }
    return getStore('cert_template', defaultTpl);
  }

  // 20. Admin Activity Logs
  if (cleanUrl === '/admin/logs') {
    const defaultLogs = [
      { id: 1, actor: 'admin', role: 'ADMIN', action: 'DATABASE_SEEDED', entity: 'System', metadata: '5 interns, 2 mentors, 2 projects', created_at: new Date(Date.now() - 7200000).toISOString() },
      { id: 2, actor: 'hr_manager', role: 'HR', action: 'INTERN_REGISTERED', entity: 'InternProfile #4', metadata: 'emma.watson@example.com', created_at: new Date(Date.now() - 5400000).toISOString() },
      { id: 3, actor: 'hr_manager', role: 'HR', action: 'MENTOR_ASSIGNED', entity: 'InternProfile #4', metadata: 'Assigned to David Miller', created_at: new Date(Date.now() - 5000000).toISOString() },
      { id: 4, actor: 'lead_mentor', role: 'MENTOR', action: 'PROJECT_ASSIGNED', entity: 'ProjectAssignment #101', metadata: 'Financial Portfolio Risk & Monte Carlo Stress Testing', created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: 5, actor: 'intern_emma', role: 'INTERN', action: 'PROJECT_SUBMITTED', entity: 'Submission v1', metadata: 'Assignment #101', created_at: new Date(Date.now() - 2400000).toISOString() },
      { id: 6, actor: 'lead_mentor', role: 'MENTOR', action: 'ASSIGNMENT_EVALUATED_COMPLETED', entity: 'Evaluation #1', metadata: 'Score: 94.5/100', created_at: new Date(Date.now() - 1800000).toISOString() },
      { id: 7, actor: 'lead_mentor', role: 'MENTOR', action: 'INTERNSHIP_COMPLETED', entity: 'Internship #1', metadata: 'CertificateRequest generated (PENDING)', created_at: new Date(Date.now() - 1200000).toISOString() },
    ];
    return getStore('activity_logs', defaultLogs);
  }

  // 21. Website Branding & Dynamic Theme Customization
  const DEFAULT_BRANDING = {
    id: 1,
    site_name: 'Beat Internship Portal',
    primary_logo: '/beat-logo.png',
    dark_logo: '/beat-logo.png',
    light_logo: '/beat-logo.png',
    mobile_logo: '/beat-logo.png',
    favicon: '/beat-logo.png',
    updated_by: 'admin',
    updated_at: new Date().toISOString(),
  };

  const DEFAULT_THEME = {
    id: 1,
    theme_name: 'Default Professional',
    primary_color: '#2563EB',
    secondary_color: '#4F46E5',
    accent_color: '#F59E0B',
    background_color: '#F8FAFC',
    surface_color: '#FFFFFF',
    text_color: '#0F172A',
    secondary_text_color: '#475569',
    border_color: '#E2E8F0',
    sidebar_color: '#FFFFFF',
    header_color: '#FFFFFF',
    button_color: '#2563EB',
    link_color: '#2563EB',
    font_family: 'Sora',
    heading_font: 'Sora',
    body_font: 'Sora',
    base_font_size: '16px',
    heading_weight: '700',
    body_weight: '400',
    border_radius: '16px',
    button_radius: '12px',
    input_radius: '12px',
    container_spacing: '24px',
    button_style: 'solid',
    shadow_intensity: 'medium',
    sidebar_width: '256px',
    color_mode: 'light',
    is_active: true,
    is_draft: false,
    updated_by: 'admin',
    updated_at: new Date().toISOString(),
  };

  if (cleanUrl === '/public/website-config') {
    return {
      branding: getStore('website_branding', DEFAULT_BRANDING),
      theme: getStore('website_theme_published', DEFAULT_THEME),
    };
  }

  if (cleanUrl === '/admin/branding') {
    const current = getStore('website_branding', DEFAULT_BRANDING);
    if (method.toLowerCase() === 'put' || method.toLowerCase() === 'post') {
      const updated = { ...current, ...parsedData, updated_at: new Date().toISOString() };
      setStore('website_branding', updated);
      const logs = getStore('activity_logs', []);
      logs.unshift({
        id: Date.now(),
        actor: 'admin',
        role: 'ADMIN',
        action: 'WEBSITE_BRANDING_UPDATED',
        entity: 'WebsiteBranding #1',
        metadata: `Updated site branding (${updated.site_name})`,
        created_at: new Date().toISOString(),
      });
      setStore('activity_logs', logs);
      return updated;
    }
    return current;
  }

  if (cleanUrl === '/admin/branding/upload' && method.toLowerCase() === 'post') {
    const current = getStore('website_branding', DEFAULT_BRANDING);
    const variant = parsedData.variant || 'primary_logo';
    const dataUrl = parsedData.data_url || parsedData.url || '/beat-logo.png';
    if (typeof dataUrl === 'string' && (dataUrl.toLowerCase().includes('<script') || dataUrl.toLowerCase().includes('javascript:'))) {
      throw { response: { status: 400, data: { error: 'SVG files containing scripts are prohibited for security reasons.' } } };
    }
    const updated = { ...current, [variant]: dataUrl, updated_at: new Date().toISOString() };
    if (parsedData.site_name) updated.site_name = parsedData.site_name;
    setStore('website_branding', updated);
    const logs = getStore('activity_logs', []);
    logs.unshift({
      id: Date.now(),
      actor: 'admin',
      role: 'ADMIN',
      action: 'WEBSITE_LOGO_UPLOADED',
      entity: `WebsiteBranding (${variant})`,
      metadata: parsedData.filename || variant,
      created_at: new Date().toISOString(),
    });
    setStore('activity_logs', logs);
    return { status: 'uploaded', variant, url: dataUrl, branding: updated };
  }

  if (cleanUrl === '/admin/branding/logo' && method.toLowerCase() === 'delete') {
    const current = getStore('website_branding', DEFAULT_BRANDING);
    const variant = parsedData.variant || 'all';
    let updated;
    if (variant === 'all') {
      updated = { ...DEFAULT_BRANDING, site_name: current.site_name, updated_at: new Date().toISOString() };
    } else {
      updated = { ...current, [variant]: '/beat-logo.png', updated_at: new Date().toISOString() };
    }
    setStore('website_branding', updated);
    return { status: 'reset', branding: updated };
  }

  if (cleanUrl === '/admin/theme') {
    const published = getStore('website_theme_published', DEFAULT_THEME);
    const draft = getStore('website_theme_draft', null);
    if (method.toLowerCase() === 'put') {
      const updated = { ...published, ...parsedData, is_active: true, is_draft: false, updated_at: new Date().toISOString() };
      setStore('website_theme_published', updated);
      return updated;
    }
    return { published, draft };
  }

  if (cleanUrl === '/admin/theme/draft' && method.toLowerCase() === 'post') {
    const published = getStore('website_theme_published', DEFAULT_THEME);
    const currentDraft = getStore('website_theme_draft', published);
    const updatedDraft = { ...currentDraft, ...parsedData, is_draft: true, is_active: false, updated_at: new Date().toISOString() };
    setStore('website_theme_draft', updatedDraft);
    const logs = getStore('activity_logs', []);
    logs.unshift({
      id: Date.now(),
      actor: 'admin',
      role: 'ADMIN',
      action: 'WEBSITE_THEME_DRAFT_SAVED',
      entity: 'WebsiteTheme (Draft)',
      metadata: updatedDraft.theme_name,
      created_at: new Date().toISOString(),
    });
    setStore('activity_logs', logs);
    return { status: 'draft_saved', draft: updatedDraft };
  }

  if (cleanUrl === '/admin/theme/publish' && method.toLowerCase() === 'post') {
    const published = getStore('website_theme_published', DEFAULT_THEME);
    const draft = getStore('website_theme_draft', null);
    const base = Object.keys(parsedData || {}).length > 0 ? { ...published, ...parsedData } : (draft || published);
    const nextPublished = { ...base, is_active: true, is_draft: false, updated_at: new Date().toISOString() };
    setStore('website_theme_published', nextPublished);
    localStorage.removeItem('beat_mock_v2_website_theme_draft');
    const logs = getStore('activity_logs', []);
    logs.unshift({
      id: Date.now(),
      actor: 'admin',
      role: 'ADMIN',
      action: 'WEBSITE_THEME_PUBLISHED',
      entity: 'WebsiteTheme (Published)',
      metadata: `${nextPublished.theme_name} (${nextPublished.primary_color})`,
      created_at: new Date().toISOString(),
    });
    setStore('activity_logs', logs);
    return { status: 'published', theme: nextPublished };
  }

  if (cleanUrl === '/admin/theme/reset' && method.toLowerCase() === 'post') {
    const resetTheme = { ...DEFAULT_THEME, updated_at: new Date().toISOString() };
    setStore('website_theme_published', resetTheme);
    localStorage.removeItem('beat_mock_v2_website_theme_draft');
    const logs = getStore('activity_logs', []);
    logs.unshift({
      id: Date.now(),
      actor: 'admin',
      role: 'ADMIN',
      action: 'WEBSITE_THEME_RESET',
      entity: 'WebsiteTheme #1',
      metadata: 'Reset to Default Professional',
      created_at: new Date().toISOString(),
    });
    setStore('activity_logs', logs);
    return { status: 'reset', theme: resetTheme };
  }

  // 22. HR Intern Departments, Programs & Bulk CSV/Excel Import & History
  const DEFAULT_DEPARTMENTS = [
    { id: 1, name: 'Data Analytics', code: 'DATA', description: 'Business Intelligence, SQL, Python, and Statistical Modeling', head_of_department: 'David Miller', is_active: true, intern_count: 2 },
    { id: 2, name: 'Software Engineering', code: 'SWE', description: 'Full-Stack Web, API Architecture, and Microservices', head_of_department: 'David Miller', is_active: true, intern_count: 1 },
    { id: 3, name: 'Artificial Intelligence & ML', code: 'AIML', description: 'Deep Learning, NLP, Predictive Modeling, and MLOps', head_of_department: 'David Miller', is_active: true, intern_count: 1 },
    { id: 4, name: 'Cloud & DevOps', code: 'CLOUD', description: 'Cloud Infrastructure, CI/CD Pipelines, and Kubernetes', head_of_department: 'Sarah Connor', is_active: true, intern_count: 0 },
    { id: 5, name: 'Product & UI/UX Design', code: 'DESIGN', description: 'User Research, Design Systems, and Interactive Prototyping', head_of_department: 'Sarah Connor', is_active: true, intern_count: 0 },
    { id: 6, name: 'Cybersecurity', code: 'SEC', description: 'Application Security, IAM Governance, and Threat Analysis', head_of_department: 'System Administrator', is_active: true, intern_count: 0 },
  ];

  const DEFAULT_PROGRAMS = [
    { id: 1, title: 'Data Analytics Internship Program', code: 'PROG-DA', department: 'Data Analytics', department_name: 'Data Analytics', duration_weeks: 12, description: 'Comprehensive data analytics and BI cohort', skills_covered: ['Python', 'SQL', 'Power BI', 'Tableau', 'Excel'], is_active: true },
    { id: 2, title: 'Full-Stack Software Engineering Cohort', code: 'PROG-SWE', department: 'Software Engineering', department_name: 'Software Engineering', duration_weeks: 12, description: 'Production web application engineering', skills_covered: ['React', 'Next.js', 'Python', 'Django', 'PostgreSQL'], is_active: true },
    { id: 3, title: 'Applied AI & Machine Learning Track', code: 'PROG-AI', department: 'Artificial Intelligence & ML', department_name: 'Artificial Intelligence & ML', duration_weeks: 16, description: 'Predictive modeling and generative AI engineering', skills_covered: ['Python', 'Scikit-Learn', 'PyTorch', 'SQL'], is_active: true },
    { id: 4, title: 'Cloud Infrastructure & DevOps Bootcamp', code: 'PROG-CLD', department: 'Cloud & DevOps', department_name: 'Cloud & DevOps', duration_weeks: 8, description: 'Containerization and cloud deployment automation', skills_covered: ['Docker', 'GitHub Actions', 'Linux', 'PostgreSQL'], is_active: true },
  ];

  const DEFAULT_IMPORT_HISTORY = [
    {
      id: 101,
      file_name: 'summer_cohort_2026_batch1.xlsx',
      file_type: 'XLSX',
      total_records: 15,
      successful_records: 14,
      failed_records: 1,
      skipped_records: 0,
      updated_records: 0,
      import_status: 'PARTIAL',
      imported_by_name: 'Sarah Connor',
      imported_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      error_details: [
        {
          row_number: 9,
          full_name: 'Vikram Singh',
          email: 'vikram.invalid-email',
          phone: '+91 9822011223',
          department: 'Data Analytics',
          internship_role: 'Data Analyst Intern',
          error_reason: 'Invalid email format (vikram.invalid-email)',
        },
      ],
    },
  ];

  if (cleanUrl === '/hr/departments') {
    const depts = getStore('hr_departments', DEFAULT_DEPARTMENTS);
    const interns = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
    if (method.toLowerCase() === 'post') {
      const newD = {
        id: Date.now(),
        name: parsedData.name,
        code: (parsedData.code || parsedData.name.slice(0, 4)).toUpperCase(),
        description: parsedData.description || '',
        head_of_department: parsedData.head_of_department || 'David Miller',
        is_active: parsedData.is_active !== false,
        created_at: new Date().toISOString(),
      };
      depts.push(newD);
      setStore('hr_departments', depts);
      return newD;
    }
    return depts.map(d => ({
      ...d,
      intern_count: interns.filter(i => (i.department_name || i.department || '').toLowerCase() === d.name.toLowerCase()).length,
    }));
  }

  if (cleanUrl.match(/^\/hr\/departments\/\d+$/)) {
    const dId = parseInt(cleanUrl.split('/')[3]);
    const depts = getStore('hr_departments', DEFAULT_DEPARTMENTS);
    if (method.toLowerCase() === 'patch' || method.toLowerCase() === 'put') {
      const target = depts.find(d => d.id === dId);
      if (target) {
        Object.assign(target, parsedData);
        setStore('hr_departments', depts);
      }
      return target || { status: 'updated' };
    }
    if (method.toLowerCase() === 'delete') {
      setStore('hr_departments', depts.filter(d => d.id !== dId));
      return { status: 'deleted' };
    }
  }

  if (cleanUrl === '/hr/programs') {
    const progs = getStore('hr_programs', DEFAULT_PROGRAMS);
    if (method.toLowerCase() === 'post') {
      const newP = {
        id: Date.now(),
        title: parsedData.title,
        code: (parsedData.code || `PROG-${Date.now().toString().slice(-3)}`).toUpperCase(),
        department: parsedData.department || 'Data Analytics',
        department_name: parsedData.department || 'Data Analytics',
        duration_weeks: parseInt(parsedData.duration_weeks) || 12,
        description: parsedData.description || '',
        skills_covered: Array.isArray(parsedData.skills_covered)
          ? parsedData.skills_covered
          : String(parsedData.skills_covered || 'Python, SQL').split(',').map(s => s.trim()).filter(Boolean),
        is_active: parsedData.is_active !== false,
        created_at: new Date().toISOString(),
      };
      progs.push(newP);
      setStore('hr_programs', progs);
      return newP;
    }
    return progs;
  }

  if (cleanUrl.match(/^\/hr\/programs\/\d+$/)) {
    const pId = parseInt(cleanUrl.split('/')[3]);
    const progs = getStore('hr_programs', DEFAULT_PROGRAMS);
    if (method.toLowerCase() === 'patch' || method.toLowerCase() === 'put') {
      const target = progs.find(p => p.id === pId);
      if (target) {
        Object.assign(target, parsedData);
        setStore('hr_programs', progs);
      }
      return target || { status: 'updated' };
    }
    if (method.toLowerCase() === 'delete') {
      setStore('hr_programs', progs.filter(p => p.id !== pId));
      return { status: 'deleted' };
    }
  }

  if (cleanUrl === '/hr/interns/import/preview' && method.toLowerCase() === 'post') {
    const rows = parsedData.rows || [];
    const headers = parsedData.headers || (rows[0] ? Object.keys(rows[0]) : []);
    const depts = getStore('hr_departments', DEFAULT_DEPARTMENTS);
    const mentors = getStore('mentors', Object.values(INITIAL_USERS).filter(u => u.role === 'MENTOR'));
    const existingInterns = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
    const mapping = autoDetectColumnMapping(headers);
    const validation = validateInternRows(rows, mapping, depts, mentors, existingInterns);
    return {
      file_name: parsedData.file_name || 'interns_import.csv',
      file_type: parsedData.file_type || 'CSV',
      headers,
      system_fields: SYSTEM_FIELDS,
      column_mapping: mapping,
      total_records: rows.length,
      raw_rows: rows,
      validation,
    };
  }

  if (cleanUrl === '/hr/interns/import/validate' && method.toLowerCase() === 'post') {
    const rows = parsedData.rows || [];
    const mapping = parsedData.column_mapping || null;
    const depts = getStore('hr_departments', DEFAULT_DEPARTMENTS);
    const mentors = getStore('mentors', Object.values(INITIAL_USERS).filter(u => u.role === 'MENTOR'));
    const existingInterns = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
    return validateInternRows(rows, mapping, depts, mentors, existingInterns);
  }

  if (cleanUrl === '/hr/interns/import/confirm' && method.toLowerCase() === 'post') {
    const rows = parsedData.rows || [];
    const mapping = parsedData.column_mapping || null;
    const fileName = parsedData.file_name || 'interns_import.csv';
    const fileType = parsedData.file_type || 'CSV';
    const skipInvalid = parsedData.skip_invalid !== false;
    const duplicateAction = parsedData.duplicate_action || 'skip';
    const confirmUpdate = Boolean(parsedData.confirm_update_existing);

    const depts = getStore('hr_departments', DEFAULT_DEPARTMENTS);
    const mentors = getStore('mentors', Object.values(INITIAL_USERS).filter(u => u.role === 'MENTOR'));
    const existingInterns = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
    const validation = validateInternRows(rows, mapping, depts, mentors, existingInterns);
    const histories = getStore('hr_import_history', DEFAULT_IMPORT_HISTORY);

    if (!skipInvalid && validation.invalid_count > 0) {
      const failedReport = validation.rows
        .filter(r => !r.is_valid)
        .map(r => ({
          row_number: r.row_number,
          full_name: sanitizeSpreadsheetCell(r.full_name),
          email: sanitizeSpreadsheetCell(r.email),
          phone: sanitizeSpreadsheetCell(r.phone),
          department: sanitizeSpreadsheetCell(r.department),
          error_reason: r.error_reasons.join('; ') || 'Validation failed',
        }));
      const histEntry = {
        id: Date.now(),
        file_name: fileName,
        file_type: fileType,
        total_records: validation.total_records,
        successful_records: 0,
        failed_records: validation.invalid_count,
        skipped_records: validation.total_records - validation.invalid_count,
        updated_records: 0,
        import_status: 'FAILED',
        imported_by_name: activeUser?.full_name || 'Sarah Connor',
        imported_at: new Date().toISOString(),
        error_details: failedReport,
      };
      histories.unshift(histEntry);
      setStore('hr_import_history', histories);
      throw {
        response: {
          status: 400,
          data: {
            status: 'aborted',
            detail: 'Import aborted because skip_invalid is false and invalid records were found. No records were modified.',
            ...histEntry,
            failed_rows: failedReport,
          },
        },
      };
    }

    let successful = 0;
    let failed = 0;
    let skipped = 0;
    let updated = 0;
    const failedRows = [];

    validation.rows.forEach((r) => {
      if (!r.is_valid) {
        failed += 1;
        failedRows.push({
          row_number: r.row_number,
          full_name: sanitizeSpreadsheetCell(r.full_name),
          email: sanitizeSpreadsheetCell(r.email),
          phone: sanitizeSpreadsheetCell(r.phone),
          college: sanitizeSpreadsheetCell(r.college),
          course: sanitizeSpreadsheetCell(r.course),
          department: sanitizeSpreadsheetCell(r.department),
          internship_role: sanitizeSpreadsheetCell(r.internship_role),
          start_date: sanitizeSpreadsheetCell(r.start_date),
          end_date: sanitizeSpreadsheetCell(r.end_date),
          assigned_mentor: sanitizeSpreadsheetCell(r.assigned_mentor),
          status: sanitizeSpreadsheetCell(r.status),
          error_reason: r.error_reasons.join('; ') || 'Validation error',
        });
        return;
      }

      const emailLower = r.email.toLowerCase();
      const existing = existingInterns.find(i => (i.email || '').toLowerCase() === emailLower);
      const pts = r.full_name.trim().split(' ');

      if (existing) {
        if (duplicateAction === 'update' && confirmUpdate) {
          existing.first_name = pts[0] || existing.first_name;
          existing.last_name = pts.slice(1).join(' ') || existing.last_name;
          existing.full_name = r.full_name;
          existing.phone = r.phone || existing.phone;
          if (r.gender) existing.gender = r.gender;
          if (r.college) existing.college = r.college;
          if (r.course) {
            existing.course = r.course;
            existing.education_qualification = r.course;
          }
          if (r.department) {
            existing.department = r.department;
            existing.department_name = r.department;
          }
          if (r.internship_role) existing.internship_role = r.internship_role;
          if (r.start_date) existing.start_date = r.start_date;
          if (r.end_date) existing.end_date = r.end_date;
          existing.internship_duration = calculateDuration(existing.start_date, existing.end_date) || existing.internship_duration;
          if (r.mentor_id) {
            existing.assigned_mentor = r.mentor_id;
            existing.assigned_mentor_name = r.assigned_mentor;
          }
          if (r.status) {
            existing.status = r.status;
            existing.intern_status = r.status;
          }
          if (r.address) existing.address = r.address;
          updated += 1;
        } else {
          skipped += 1;
        }
        return;
      }

      const nextCodeNum = existingInterns.length + 1;
      existingInterns.unshift({
        id: Date.now() + Math.floor(Math.random() * 10000),
        intern_code: `INT-2026-${String(nextCodeNum).padStart(4, '0')}`,
        username: emailLower.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') + '_' + nextCodeNum,
        first_name: pts[0] || 'Intern',
        last_name: pts.slice(1).join(' ') || '',
        full_name: r.full_name,
        email: r.email,
        phone: r.phone,
        gender: r.gender || '',
        college: r.college || '',
        course: r.course || '',
        education_qualification: r.course || '',
        department: r.department || 'Data Analytics',
        department_name: r.department || 'Data Analytics',
        internship_role: r.internship_role || 'Data Analytics Intern',
        start_date: r.start_date || '',
        end_date: r.end_date || '',
        internship_duration: calculateDuration(r.start_date, r.end_date),
        assigned_mentor: r.mentor_id || null,
        assigned_mentor_name: r.mentor_id ? r.assigned_mentor : null,
        hr_contact: 2,
        hr_contact_name: activeUser?.full_name || 'Sarah Connor',
        status: r.status || 'Active',
        intern_status: r.status || 'Active',
        address: r.address || '',
        source: 'Bulk Import',
        role: 'INTERN',
        is_active_intern: !['Terminated', 'Completed'].includes(r.status),
        created_at: new Date().toISOString(),
      });
      successful += 1;
    });

    setStore('interns', existingInterns);

    const importStatus =
      failed > 0 && (successful > 0 || updated > 0)
        ? 'PARTIAL'
        : failed > 0 && successful === 0 && updated === 0
        ? 'FAILED'
        : 'COMPLETED';

    const histRecord = {
      id: Date.now(),
      file_name: fileName,
      file_type: fileType,
      total_records: validation.total_records,
      successful_records: successful,
      failed_records: failed,
      skipped_records: skipped,
      updated_records: updated,
      import_status: importStatus,
      imported_by_name: activeUser?.full_name || 'Sarah Connor',
      imported_at: new Date().toISOString(),
      error_details: failedRows,
    };
    histories.unshift(histRecord);
    setStore('hr_import_history', histories);

    return {
      status: 'completed',
      history_id: histRecord.id,
      ...histRecord,
      failed_rows: failedRows,
    };
  }

  if (cleanUrl === '/hr/interns/import/history') {
    return getStore('hr_import_history', DEFAULT_IMPORT_HISTORY);
  }

  return { status: 'ok' };
};
