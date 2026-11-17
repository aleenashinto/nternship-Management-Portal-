// Comprehensive Client-Side Demo Mock Data Engine
// Allows the deployed Vercel frontend to run with full interactivity even when deployed purely as a static SPA.

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
    username: 'intern_emma',
    email: 'emma.watson@example.com',
    first_name: 'Emma',
    last_name: 'Watson',
    full_name: 'Emma Watson',
    role: 'INTERN',
    phone: '+1 (555) 567-8901',
    address: '12 Ocean Drive, Cambridge, MA',
    education_qualification: 'M.S. in Data Analytics',
    source: 'Campus Drive',
    assigned_mentor: 3,
    assigned_mentor_name: 'David Miller',
    is_active_intern: true,
  },
  intern_john: {
    id: 5,
    username: 'intern_john',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    full_name: 'John Doe',
    role: 'INTERN',
    phone: '+1 (555) 456-7890',
    phone2: '+1 (555) 456-7891',
    address: '742 Evergreen Terrace, Springfield',
    education_qualification: 'B.S. in Computer Science',
    source: 'Direct',
    assigned_mentor: 3,
    assigned_mentor_name: 'David Miller',
    is_active_intern: true,
  },
  intern_alex: {
    id: 6,
    username: 'intern_alex',
    email: 'alex.smith@example.com',
    first_name: 'Alex',
    last_name: 'Smith',
    full_name: 'Alex Smith',
    role: 'INTERN',
    phone: '+1 (555) 678-9012',
    address: '89 Silicon Blvd, San Jose, CA',
    education_qualification: 'B.Tech in Information Technology',
    source: 'Referral',
    assigned_mentor: null,
    assigned_mentor_name: null,
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
  const val = localStorage.getItem(`portal_mock_${key}`);
  if (!val) {
    localStorage.setItem(`portal_mock_${key}`, JSON.stringify(defaultVal));
    return defaultVal;
  }
  return JSON.parse(val);
};

const setStore = (key, val) => {
  localStorage.setItem(`portal_mock_${key}`, JSON.stringify(val));
};

export const handleMockRequest = async (url, method = 'get', data = null) => {
  const cleanUrl = url.replace(/^\/api/, '').replace(/\/$/, '');
  const activeUser = JSON.parse(localStorage.getItem('portal_user') || 'null');

  // 1. Auth Login
  if (cleanUrl === '/auth/login' && method.toLowerCase() === 'post') {
    const { username, password } = data || {};
    const u = INITIAL_USERS[username];
    if (u) {
      // Any password accepted for demo ease, or check standard
      return {
        access: `mock_jwt_access_${username}`,
        refresh: `mock_jwt_refresh_${username}`,
        user: u,
      };
    }
    // Also allow any generic username
    if (username) {
      const genericUser = {
        id: 99,
        username,
        email: `${username}@portal.example.com`,
        full_name: username.toUpperCase(),
        role: username.includes('hr') ? 'HR' : username.includes('mentor') ? 'MENTOR' : 'INTERN',
        is_active_intern: true,
      };
      return {
        access: `mock_jwt_access_${username}`,
        refresh: `mock_jwt_refresh_${username}`,
        user: genericUser,
      };
    }
    throw { response: { status: 400, data: { detail: 'Invalid username or password.' } } };
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
    const mentors = Object.values(INITIAL_USERS).filter(u => u.role === 'MENTOR');
    const interns = Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN');
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

  // 4. HR Mentors
  if (cleanUrl === '/hr/mentors') {
    if (method.toLowerCase() === 'post') {
      const current = getStore('mentors', Object.values(INITIAL_USERS).filter(u => u.role === 'MENTOR'));
      const newM = {
        id: Date.now(),
        ...data,
        full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username,
        role: 'MENTOR',
        assigned_intern_count: 0,
      };
      current.push(newM);
      setStore('mentors', current);
      return newM;
    }
    return getStore('mentors', Object.values(INITIAL_USERS).filter(u => u.role === 'MENTOR'));
  }

  // 5. HR Interns
  if (cleanUrl === '/hr/interns') {
    if (method.toLowerCase() === 'post') {
      const current = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
      const newI = {
        id: Date.now(),
        ...data,
        full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username,
        role: 'INTERN',
        is_active_intern: true,
      };
      current.push(newI);
      setStore('interns', current);
      return newI;
    }
    return getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
  }

  // 6. Assign Mentor
  if (cleanUrl.match(/\/hr\/interns\/\d+\/assign-mentor/)) {
    const internId = parseInt(cleanUrl.split('/')[3]);
    const current = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
    const target = current.find(i => i.id === internId);
    if (target) {
      target.assigned_mentor = data.mentor_id;
      const mentors = getStore('mentors', Object.values(INITIAL_USERS).filter(u => u.role === 'MENTOR'));
      const m = mentors.find(m => m.id === data.mentor_id);
      target.assigned_mentor_name = m ? m.full_name : null;
      setStore('interns', current);
      return target;
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
      target.certificate_file = '#'; // In-browser generated trigger
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
      target.rejection_reason = data?.reason || 'Requirements not yet met';
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
        title: data?.title || 'New Project',
        tools_used: typeof data?.tools_used === 'string' ? JSON.parse(data.tools_used) : (data?.tools_used || ['Python']),
        instructions: data?.instructions || '',
        data_source_type: data?.data_source_type || 'DATABASE',
        data_source_description: data?.data_source_description || '',
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

  // 10. Mentor Interns
  if (cleanUrl === '/mentor/interns') {
    return [INITIAL_USERS.intern_emma, INITIAL_USERS.intern_john];
  }

  if (cleanUrl.match(/\/mentor\/interns\/\d+/)) {
    const internId = parseInt(cleanUrl.split('/')[3]);
    const intern = Object.values(INITIAL_USERS).find(i => i.id === internId) || INITIAL_USERS.intern_emma;
    const assignments = getStore('assignments', INITIAL_ASSIGNMENTS).filter(a => a.intern === internId);
    const presentations = getStore('presentations', INITIAL_PRESENTATIONS).filter(p => p.intern === internId);
    return { intern, assignments, presentations };
  }

  // 11. Mentor Assignments
  if (cleanUrl === '/mentor/assignments' || cleanUrl === '/intern/assignments') {
    if (method.toLowerCase() === 'post') {
      const current = getStore('assignments', INITIAL_ASSIGNMENTS);
      const projs = getStore('projects', INITIAL_PROJECTS);
      const proj = projs.find(p => p.id === parseInt(data?.project)) || projs[0];
      const intern = Object.values(INITIAL_USERS).find(i => i.id === parseInt(data?.intern)) || INITIAL_USERS.intern_john;

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
        assigned_date: data?.assigned_date || new Date().toISOString().split('T')[0],
        due_date: data?.due_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
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
      target.score = data?.score;
      target.evaluation_notes = data?.evaluation_notes;
      target.status = data?.mark_completed ? 'COMPLETED' : data?.request_revision ? 'REVISION_REQUIRED' : 'UNDER_REVIEW';
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
      target.submission_notes = data?.get ? data.get('submission_notes') : (data?.submission_notes || 'Submitted deliverable');
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
        assignment: data?.assignment,
        project_title: 'Assigned Project',
        current_due_date: new Date().toISOString().split('T')[0],
        intern: activeUser?.id || 5,
        intern_name: activeUser?.full_name || 'John Doe',
        reason: data?.reason,
        requested_date: data?.requested_date,
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
      target.status = data?.status;
      target.mentor_notes = data?.mentor_notes;
      setStore('extensions', current);
      return target;
    }
  }

  // 13. Presentations
  if (cleanUrl === '/mentor/presentations' || cleanUrl === '/intern/presentations') {
    if (method.toLowerCase() === 'post') {
      const current = getStore('presentations', INITIAL_PRESENTATIONS);
      const projs = getStore('projects', INITIAL_PROJECTS);
      const proj = projs.find(p => p.id === parseInt(data?.project)) || projs[0];
      const intern = Object.values(INITIAL_USERS).find(i => i.id === parseInt(data?.intern)) || INITIAL_USERS.intern_emma;

      const newP = {
        id: Date.now(),
        project: proj.id,
        project_title: proj.title,
        intern: intern.id,
        intern_name: intern.full_name,
        mentor: activeUser?.id || 3,
        mentor_name: activeUser?.full_name || 'David Miller',
        presentation_date: data?.presentation_date,
        presentation_time: data?.presentation_time,
        google_meet_link: data?.google_meet_link || 'https://meet.google.com/new',
        status: 'SCHEDULED',
        notes: data?.notes || '',
      };
      current.unshift(newP);
      setStore('presentations', current);
      return newP;
    }
    return getStore('presentations', INITIAL_PRESENTATIONS);
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
  if (cleanUrl === '/notifications') {
    return getStore('notifications', INITIAL_NOTIFICATIONS);
  }
  if (cleanUrl === '/notifications/mark-all-read') {
    const notifs = getStore('notifications', INITIAL_NOTIFICATIONS);
    notifs.forEach(n => (n.is_read = true));
    setStore('notifications', notifs);
    return { status: 'all marked as read' };
  }

  return { status: 'ok' };
};
