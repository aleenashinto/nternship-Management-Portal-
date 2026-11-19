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

  // 5. HR Interns (Add, View, Edit, Delete)
  if (cleanUrl === '/hr/interns') {
    const current = getStore('interns', Object.values(INITIAL_USERS).filter(u => u.role === 'INTERN'));
    if (method.toLowerCase() === 'post') {
      const mentors = getStore('mentors', Object.values(INITIAL_USERS).filter(u => u.role === 'MENTOR'));
      const mId = parsedData.assigned_mentor ? parseInt(parsedData.assigned_mentor) : null;
      const mObj = mentors.find(m => m.id === mId);
      const newI = {
        id: Date.now(),
        ...parsedData,
        assigned_mentor: mId,
        assigned_mentor_name: mObj ? (mObj.full_name || mObj.username) : null,
        full_name: `${parsedData.first_name || ''} ${parsedData.last_name || ''}`.trim() || parsedData.username,
        role: 'INTERN',
        is_active_intern: true,
      };
      current.push(newI);
      setStore('interns', current);
      return newI;
    }
    return current;
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
        target.full_name = `${target.first_name || ''} ${target.last_name || ''}`.trim() || target.username;
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

  return { status: 'ok' };
};
