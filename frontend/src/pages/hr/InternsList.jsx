import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import Modal from '../../components/Modal';
import {
  INTERN_STATUS_OPTIONS,
  calculateDuration,
  exportInternRecords,
  generateUniqueInternUsername,
  generateTemporaryPassword,
} from '../../utils/internSpreadsheet';
import {
  Users, UserPlus, UserCheck, Search, Eye, Pencil, Trash2,
  Upload, Download, FileSpreadsheet, RotateCcw, CheckCircle2,
  AlertCircle, KeyRound, Copy, Check, Power, ShieldCheck,
  Image as ImageIcon, ArrowLeft
} from 'lucide-react';

const emptyInternForm = {
  full_name: '',
  email: '',
  phone: '',
  course_name: '',
  course_code: '',
  batch: 'Batch 2026-A',
  joining_date: new Date().toISOString().split('T')[0],
  end_date: '',
  duration: '12 weeks',
  status: 'Active',
  department: 'Data Analytics',
  internship_role: '',
  college: '',
  gender: '',
  assigned_mentor: '',
  hr_contact_name: 'Sarah Connor',
  address: '',
  profile_photo: '',
};

const statusBadgeStyle = (status) => {
  switch ((status || 'Active').toLowerCase()) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'inactive':
      return 'bg-slate-100 text-slate-600 border-slate-300';
    case 'applied':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'selected':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'onboarding':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'completed':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'terminated':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
};

const InternsList = ({ standaloneAddMode = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAddPage = standaloneAddMode || location.pathname === '/hr/interns/add';

  const [interns, setInterns] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Add / Edit Form + Credential Confirmation Step
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIntern, setEditingIntern] = useState(null);
  const [internForm, setInternForm] = useState(emptyInternForm);
  const [credentialPreview, setCredentialPreview] = useState(null); // non-null -> shows confirmation step!
  const [copiedField, setCopiedField] = useState('');
  const [saving, setSaving] = useState(false);

  // Modals: View Profile, Delete Confirmation, Reset Password Result, Assign Mentor
  const [viewingIntern, setViewingIntern] = useState(null);
  const [deletingIntern, setDeletingIntern] = useState(null);
  const [resetPwdResult, setResetPwdResult] = useState(null);
  const [assigningIntern, setAssigningIntern] = useState(null);
  const [selectedMentorId, setSelectedMentorId] = useState('');

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const copyToClipboard = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [internRes, mentorRes, deptRes] = await Promise.all([
        api.get('/hr/interns/'),
        api.get('/hr/mentors/'),
        api.get('/hr/departments/').catch(() => ({ data: [] })),
      ]);
      const iList = Array.isArray(internRes.data?.results ?? internRes.data)
        ? internRes.data?.results ?? internRes.data
        : [];
      const mList = Array.isArray(mentorRes.data?.results ?? mentorRes.data)
        ? mentorRes.data?.results ?? mentorRes.data
        : [];
      const dList = Array.isArray(deptRes.data?.results ?? deptRes.data)
        ? deptRes.data?.results ?? deptRes.data
        : [];

      setInterns(iList);
      setMentors(mList);
      setDepartments(
        dList.length > 0
          ? dList
          : [
              { id: 1, name: 'Data Analytics' },
              { id: 2, name: 'Software Engineering' },
              { id: 3, name: 'Artificial Intelligence & ML' },
              { id: 4, name: 'Cloud & DevOps' },
              { id: 5, name: 'Product & UI/UX Design' },
              { id: 6, name: 'Cybersecurity' },
            ]
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Live instant preview while HR types Full Name & Course Code
  const liveUsernamePreview = useMemo(() => {
    if (!internForm.full_name.trim()) return '';
    return generateUniqueInternUsername(
      internForm.full_name,
      interns.map((i) => i.username)
    );
  }, [internForm.full_name, interns]);

  const liveTempPasswordPreview = useMemo(() => {
    if (!internForm.full_name.trim() || !internForm.course_code.trim()) return '';
    return generateTemporaryPassword(internForm.full_name, internForm.course_code);
  }, [internForm.full_name, internForm.course_code]);

  const handleDateChange = (field, val) => {
    setInternForm((prev) => {
      const next = { ...prev, [field]: val };
      if (next.joining_date && next.end_date) {
        const calc = calculateDuration(next.joining_date, next.end_date);
        if (calc) next.duration = calc;
      }
      return next;
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast('error', 'Profile photo must be smaller than 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setInternForm((prev) => ({ ...prev, profile_photo: String(ev.target?.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setEditingIntern(null);
    setCredentialPreview(null);
    setInternForm(emptyInternForm);
    setIsFormOpen(true);
  };

  const openEditModal = (intern) => {
    setEditingIntern(intern);
    setCredentialPreview(null);
    const fullName =
      intern.full_name ||
      intern.fullName ||
      `${intern.first_name || ''} ${intern.last_name || ''}`.trim() ||
      intern.username ||
      '';
    setInternForm({
      full_name: fullName,
      email: intern.email || '',
      phone: intern.phone || '',
      course_name: intern.course_name || intern.courseName || intern.course || intern.education_qualification || '',
      course_code: intern.course_code || intern.courseCode || '',
      batch: intern.batch || 'Batch 2026-A',
      joining_date: intern.joining_date || intern.joiningDate || intern.start_date || '',
      end_date: intern.end_date || '',
      duration: intern.duration || intern.internship_duration || '12 weeks',
      status: intern.status || intern.intern_status || 'Active',
      department: intern.department_name || intern.department || 'Data Analytics',
      internship_role: intern.internship_role || '',
      college: intern.college || '',
      gender: intern.gender || '',
      assigned_mentor: intern.assigned_mentor ? String(intern.assigned_mentor) : '',
      hr_contact_name: intern.hr_contact_name || 'Sarah Connor',
      address: intern.address || '',
      profile_photo: intern.profile_photo || '',
    });
    setIsFormOpen(true);
  };

  const handleResetForm = () => {
    setCredentialPreview(null);
    if (editingIntern) {
      openEditModal(editingIntern);
    } else {
      setInternForm(emptyInternForm);
    }
  };

  // Step 1 of Add Intern: Validate & Preview Generated Credentials before confirmation
  const handlePreviewOrSaveEdit = async (e) => {
    e.preventDefault();
    if (!internForm.full_name.trim() || !internForm.email.trim()) {
      showToast('error', 'Full Name and Email Address are required.');
      return;
    }
    if (!editingIntern && (!internForm.course_name.trim() || !internForm.course_code.trim())) {
      showToast('error', 'Course Name and Course Code are required to generate credentials.');
      return;
    }
    if (internForm.joining_date && internForm.end_date && internForm.joining_date > internForm.end_date) {
      showToast('error', 'Joining Date must not be after End Date.');
      return;
    }

    // If editing an existing intern, save directly
    if (editingIntern) {
      setSaving(true);
      try {
        const parts = internForm.full_name.trim().split(' ');
        const payload = {
          ...internForm,
          first_name: parts[0] || 'Intern',
          last_name: parts.slice(1).join(' ') || '',
          course: internForm.course_name,
          education_qualification: internForm.course_name,
          start_date: internForm.joining_date || null,
          internship_duration: internForm.duration,
          intern_status: internForm.status,
          assigned_mentor: internForm.assigned_mentor ? parseInt(internForm.assigned_mentor, 10) : null,
        };
        await api.patch(`/hr/interns/${editingIntern.id}/`, payload);
        showToast('success', `Updated intern profile for ${internForm.full_name}.`);
        setIsFormOpen(false);
        setEditingIntern(null);
        await fetchData();
      } catch (err) {
        showToast('error', err.response?.data?.detail || 'Error updating intern record.');
      } finally {
        setSaving(false);
      }
      return;
    }

    // For new intern creation: request server-verified preview & display Confirmation Screen!
    setSaving(true);
    try {
      const res = await api.post('/hr/interns/preview-credentials/', {
        full_name: internForm.full_name.trim(),
        course_name: internForm.course_name.trim(),
        course_code: internForm.course_code.trim(),
      });
      setCredentialPreview({
        full_name: res.data?.full_name || internForm.full_name.trim(),
        course_name: res.data?.course_name || internForm.course_name.trim(),
        course_code: res.data?.course_code || internForm.course_code.trim(),
        username: res.data?.username || liveUsernamePreview,
        temporary_password: res.data?.temporary_password || liveTempPasswordPreview,
      });
    } catch {
      setCredentialPreview({
        full_name: internForm.full_name.trim(),
        course_name: internForm.course_name.trim(),
        course_code: internForm.course_code.trim(),
        username: liveUsernamePreview,
        temporary_password: liveTempPasswordPreview,
      });
    } finally {
      setSaving(false);
    }
  };

  // Step 2 of Add Intern: Only create the intern account AFTER HR confirms!
  const handleConfirmCreateAccount = async () => {
    setSaving(true);
    try {
      const parts = internForm.full_name.trim().split(' ');
      const payload = {
        ...internForm,
        full_name: internForm.full_name.trim(),
        fullName: internForm.full_name.trim(),
        first_name: parts[0] || 'Intern',
        last_name: parts.slice(1).join(' ') || '',
        course: internForm.course_name.trim(),
        course_name: internForm.course_name.trim(),
        courseName: internForm.course_name.trim(),
        course_code: internForm.course_code.trim(),
        courseCode: internForm.course_code.trim(),
        education_qualification: internForm.course_name.trim(),
        start_date: internForm.joining_date || null,
        joining_date: internForm.joining_date || null,
        end_date: internForm.end_date || null,
        duration: internForm.duration,
        internship_duration: internForm.duration,
        internship_role: internForm.internship_role || `${internForm.course_name.trim()} Intern`,
        intern_status: internForm.status,
        assigned_mentor: internForm.assigned_mentor ? parseInt(internForm.assigned_mentor, 10) : null,
      };

      const res = await api.post('/hr/interns/', payload);
      const createdUsername = res.data?.username || credentialPreview?.username;
      const createdTempPwd =
        res.data?.generated_credentials?.temporary_password ||
        credentialPreview?.temporary_password;

      setIsFormOpen(false);
      setCredentialPreview(null);
      setInternForm(emptyInternForm);
      await fetchData();

      // Display created credentials modal so HR can also copy after creation
      setResetPwdResult({
        mode: 'created',
        full_name: internForm.full_name.trim(),
        course_name: internForm.course_name.trim(),
        course_code: internForm.course_code.trim(),
        username: createdUsername,
        temporary_password: createdTempPwd,
      });

      showToast(
        'success',
        `Intern account @${createdUsername} created! Intern must change their temporary password on first login.`
      );
      if (isAddPage) {
        navigate('/hr/interns');
      }
    } catch (err) {
      const errData = err.response?.data || {};
      const msg =
        errData.email?.[0] ||
        errData.username?.[0] ||
        errData.detail ||
        'Could not create intern account.';
      showToast('error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (intern) => {
    try {
      const res = await api.post(`/hr/interns/${intern.id}/reset-password/`);
      setResetPwdResult({
        mode: 'reset',
        full_name: intern.full_name || intern.username,
        course_name: intern.course_name || intern.course || '',
        course_code: intern.course_code || intern.courseCode || 'INT01',
        username: res.data?.username || intern.username,
        temporary_password: res.data?.temporary_password,
      });
      showToast('success', `Temporary password regenerated for @${intern.username}.`);
      fetchData();
    } catch {
      showToast('error', 'Failed to reset intern password.');
    }
  };

  const handleToggleActive = async (intern) => {
    const currentStatus = intern.status || intern.intern_status || 'Active';
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.post(`/hr/interns/${intern.id}/toggle-active/`, { status: nextStatus });
      showToast(
        'success',
        `${intern.full_name || intern.username} is now ${nextStatus}.`
      );
      fetchData();
    } catch {
      showToast('error', 'Error updating account status.');
    }
  };

  const handleDelete = async () => {
    if (!deletingIntern) return;
    try {
      await api.delete(`/hr/interns/${deletingIntern.id}/`);
      showToast('success', `Deleted intern account @${deletingIntern.username}.`);
      setDeletingIntern(null);
      fetchData();
    } catch {
      showToast('error', 'Error deleting intern.');
    }
  };

  const handleAssignMentor = async (e) => {
    e.preventDefault();
    if (!assigningIntern) return;
    try {
      await api.post(`/hr/interns/${assigningIntern.id}/assign-mentor/`, {
        mentor_id: selectedMentorId ? parseInt(selectedMentorId, 10) : null,
      });
      showToast('success', 'Mentor assignment updated.');
      setAssigningIntern(null);
      setSelectedMentorId('');
      fetchData();
    } catch {
      showToast('error', 'Error updating mentor assignment.');
    }
  };

  // Distinct courses and batches for filter dropdowns
  const courseOptions = useMemo(() => {
    const set = new Set();
    interns.forEach((i) => {
      const c = i.course_name || i.courseName || i.course || i.education_qualification;
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [interns]);

  const batchOptions = useMemo(() => {
    const set = new Set();
    interns.forEach((i) => {
      if (i.batch) set.add(i.batch);
    });
    return Array.from(set).sort();
  }, [interns]);

  // Filtered Interns
  const filteredInterns = useMemo(() => {
    return interns.filter((i) => {
      const q = searchTerm.trim().toLowerCase();
      if (q) {
        const matchSearch =
          (i.full_name || '').toLowerCase().includes(q) ||
          (i.username || '').toLowerCase().includes(q) ||
          (i.email || '').toLowerCase().includes(q) ||
          (i.intern_code || '').toLowerCase().includes(q) ||
          (i.course_code || '').toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      const iCourse = (i.course_name || i.course || i.education_qualification || '').toLowerCase();
      if (courseFilter !== 'ALL' && iCourse !== courseFilter.toLowerCase()) {
        return false;
      }

      const iBatch = (i.batch || '').toLowerCase();
      if (batchFilter !== 'ALL' && iBatch !== batchFilter.toLowerCase()) {
        return false;
      }

      const iStatus = (i.status || i.intern_status || 'Active').toLowerCase();
      if (statusFilter !== 'ALL' && iStatus !== statusFilter.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [interns, searchTerm, courseFilter, batchFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, courseFilter, batchFilter, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredInterns.length / pageSize));
  const paginatedInterns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInterns.slice(start, start + pageSize);
  }, [filteredInterns, currentPage, pageSize]);

  // Confirmation Screen before account creation (Section 4)
  const renderCredentialConfirmationScreen = () => (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-blue-800 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span>Confirm Automatic Intern Account Creation</span>
        </div>
        <p className="text-blue-700">
          Review the generated login credentials below. The account will only be created after you click{' '}
          <strong>Create Intern Account</strong>.
        </p>
      </div>

      <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-gray-100">
          <div>
            <span className="text-gray-400 block">Intern Name</span>
            <span className="text-sm font-bold text-gray-900">{credentialPreview.full_name}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Course</span>
            <span className="text-sm font-bold text-gray-900">{credentialPreview.course_name}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Course Code</span>
            <span className="text-sm font-mono font-bold text-blue-700">{credentialPreview.course_code}</span>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
            Generated Credentials
          </span>

          {/* Username Row + Copy Button */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-gray-200 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-gray-500 block">Username</span>
              <span className="text-base font-mono font-bold text-gray-900">
                {credentialPreview.username}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(credentialPreview.username, 'preview_user')}
              className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-xs font-semibold text-gray-700 inline-flex items-center space-x-1.5"
            >
              {copiedField === 'preview_user' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Username</span>
                </>
              )}
            </button>
          </div>

          {/* Temporary Password Row + Copy Button */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-amber-800 block">Temporary Password</span>
              <span className="text-base font-mono font-bold text-amber-950">
                {credentialPreview.temporary_password}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(credentialPreview.temporary_password, 'preview_pwd')}
              className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-xs font-semibold text-amber-900 inline-flex items-center space-x-1.5"
            >
              {copiedField === 'preview_pwd' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Temporary Password</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 pt-1">
          Security note: This temporary password will be securely hashed before saving. The intern will be required to change their password on first login.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => setCredentialPreview(null)}
          className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Edit Details</span>
        </button>

        <button
          type="button"
          onClick={handleConfirmCreateAccount}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 inline-flex items-center space-x-2 disabled:opacity-50"
        >
          <UserPlus className="w-4 h-4" />
          <span>{saving ? 'Creating Account...' : 'Create Intern Account'}</span>
        </button>
      </div>
    </div>
  );

  const renderInternFormFields = (onCancel) => {
    if (credentialPreview && !editingIntern) {
      return renderCredentialConfirmationScreen();
    }

    return (
      <form onSubmit={handlePreviewOrSaveEdit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={internForm.full_name}
              onChange={(e) => setInternForm({ ...internForm, full_name: e.target.value })}
              placeholder="e.g. Aleena Mathew"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={internForm.email}
              onChange={(e) => setInternForm({ ...internForm, email: e.target.value })}
              placeholder="aleena.mathew@example.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={internForm.phone}
              onChange={(e) => setInternForm({ ...internForm, phone: e.target.value })}
              placeholder="+91 9847000001"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Course Name *</label>
            <input
              type="text"
              required
              value={internForm.course_name}
              onChange={(e) => setInternForm({ ...internForm, course_name: e.target.value })}
              placeholder="e.g. Python Full Stack Development"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Course Code *</label>
            <input
              type="text"
              required
              value={internForm.course_code}
              onChange={(e) => setInternForm({ ...internForm, course_code: e.target.value.toUpperCase() })}
              placeholder="e.g. PYFS01 or DM01"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Batch</label>
            <input
              type="text"
              value={internForm.batch}
              onChange={(e) => setInternForm({ ...internForm, batch: e.target.value })}
              placeholder="e.g. Batch 2026-A"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Joining Date</label>
            <input
              type="date"
              value={internForm.joining_date}
              onChange={(e) => handleDateChange('joining_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Internship Duration</label>
            <input
              type="text"
              value={internForm.duration}
              onChange={(e) => setInternForm({ ...internForm, duration: e.target.value })}
              placeholder="e.g. 12 weeks / 3 months"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
            <select
              value={internForm.status}
              onChange={(e) => setInternForm({ ...internForm, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white font-semibold"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Onboarding">Onboarding</option>
              <option value="Selected">Selected</option>
              <option value="Applied">Applied</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
            <select
              value={internForm.department}
              onChange={(e) => setInternForm({ ...internForm, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
            >
              {departments.map((d) => (
                <option key={d.id || d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Assigned Mentor</label>
            <select
              value={internForm.assigned_mentor}
              onChange={(e) => setInternForm({ ...internForm, assigned_mentor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
            >
              <option value="">-- Assign Later --</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Profile Photo (Optional)</label>
            <label className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:border-blue-500 cursor-pointer flex items-center justify-center space-x-1.5 bg-slate-50/50">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>{internForm.profile_photo ? 'Photo Selected' : 'Upload Image'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Live Automatic Username & Temporary Password Preview Banner */}
        {!editingIntern && (liveUsernamePreview || liveTempPasswordPreview) && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Auto-Generated Credentials Preview
              </span>
              <span className="text-[11px] text-gray-500">
                First-login password change enforced
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block">Username</span>
                  <span className="font-mono font-bold text-gray-900">
                    {liveUsernamePreview || '—'}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                  Unique
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block">Temporary Password</span>
                  <span className="font-mono font-bold text-amber-800">
                    {liveTempPasswordPreview || 'Enter Course Code'}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
                  Temporary
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 border border-gray-200 hover:bg-slate-100 inline-flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 disabled:opacity-50"
          >
            {saving
              ? 'Processing...'
              : editingIntern
              ? 'Save Changes'
              : 'Preview & Confirm Credentials →'}
          </button>
        </div>
      </form>
    );
  };

  // Standalone /hr/interns/add route
  if (isAddPage) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              HR Management • Automatic Account Creation
            </span>
            <h1 className="text-xl font-bold text-gray-900 mt-1">Add New Intern</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Automatically generates a unique <code className="font-mono">firstname.lastname</code> username and temporary initial password (<code className="font-mono">InternName + CourseCode</code>).
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to="/hr/interns/import"
              className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/60 text-blue-700 text-xs font-semibold inline-flex items-center space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Interns (Excel / CSV)</span>
            </Link>
            <Link
              to="/hr/interns"
              className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50"
            >
              Intern Management Table
            </Link>
          </div>
        </div>

        {toast && (
          <div
            className={`p-4 rounded-2xl border flex items-center space-x-2 text-xs font-medium ${
              toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>{toast.text}</span>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          {renderInternFormFields(() => navigate('/hr/interns'))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              HR Management • Intern Accounts & Credentials
            </span>
            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-700">
              {filteredInterns.length} {filteredInterns.length === 1 ? 'Intern' : 'Interns'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Intern Management Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Create intern accounts with automatic usernames and temporary passwords, reset credentials, activate/deactivate accounts, and bulk import cohorts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportInternRecords(filteredInterns, 'csv')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={() => exportInternRecords(filteredInterns, 'xlsx')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>

          <Link
            to="/hr/interns/import"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel / CSV</span>
          </Link>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Intern Manually</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Search by Name or Username + Filter by Course, Batch, Status */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 flex items-center space-x-2 px-3 py-2 rounded-xl border border-gray-200 bg-slate-50/50">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, username, email, or course code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs outline-none bg-transparent text-gray-800"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white text-gray-700"
            >
              <option value="ALL">All Courses</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white text-gray-700"
            >
              <option value="ALL">All Batches</option>
              {batchOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white text-gray-700"
            >
              <option value="ALL">All Statuses</option>
              {INTERN_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {(searchTerm || courseFilter !== 'ALL' || batchFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCourseFilter('ALL');
                  setBatchFilter('ALL');
                  setStatusFilter('ALL');
                }}
                title="Reset Filters"
                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Intern Management Table: Name | Username | Course | Course Code | Batch | Status | Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading intern accounts...</div>
        ) : filteredInterns.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-gray-600">No intern accounts match your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5">Username</th>
                    <th className="px-5 py-3.5">Course</th>
                    <th className="px-5 py-3.5">Course Code</th>
                    <th className="px-5 py-3.5">Batch</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedInterns.map((intern) => {
                    const statusVal = intern.status || intern.intern_status || 'Active';
                    const isActive = statusVal.toLowerCase() === 'active';
                    const courseVal =
                      intern.course_name ||
                      intern.courseName ||
                      intern.course ||
                      intern.education_qualification ||
                      'Data Analytics';
                    const codeVal = intern.course_code || intern.courseCode || 'DA01';

                    return (
                      <tr key={intern.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center space-x-2.5">
                            {intern.profile_photo ? (
                              <img
                                src={intern.profile_photo}
                                alt={intern.full_name}
                                className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                                {(intern.full_name || intern.username || 'I')[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-gray-900">
                                {intern.full_name || intern.username}
                              </div>
                              <div className="text-[11px] text-gray-400">{intern.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                              {intern.username}
                            </span>
                            {(intern.must_change_password || intern.mustChangePassword) && (
                              <span
                                title="Intern must change temporary password on first login"
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800"
                              >
                                Temp Pwd
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 font-medium text-gray-800">
                          <div>{courseVal}</div>
                          <div className="text-[10px] text-gray-400">
                            {intern.assigned_mentor_name
                              ? `Mentor: ${intern.assigned_mentor_name}`
                              : 'Mentor: Unassigned'}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-gray-700 bg-slate-100 px-2 py-0.5 rounded">
                            {codeVal}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap text-gray-700 font-medium">
                          {intern.batch || 'Batch 2026-A'}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadgeStyle(
                              statusVal
                            )}`}
                          >
                            {statusVal}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingIntern(intern)}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-gray-700 inline-flex items-center space-x-1"
                              title="View Details"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(intern)}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 inline-flex items-center space-x-1"
                              title="Edit Intern"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResetPassword(intern)}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 inline-flex items-center space-x-1"
                              title="Reset Temporary Password"
                            >
                              <KeyRound className="w-3 h-3" />
                              <span>Reset Pwd</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleActive(intern)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center space-x-1 ${
                                isActive
                                  ? 'bg-slate-100 hover:bg-rose-50 text-gray-700 hover:text-rose-700'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              }`}
                              title={isActive ? 'Deactivate Account' : 'Activate Account'}
                            >
                              <Power className="w-3 h-3" />
                              <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingIntern(intern)}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 inline-flex items-center space-x-1"
                              title="Delete Intern"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 bg-slate-50/60 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <span>
                  Showing{' '}
                  <strong>
                    {(currentPage - 1) * pageSize + 1}–
                    {Math.min(currentPage * pageSize, filteredInterns.length)}
                  </strong>{' '}
                  of <strong>{filteredInterns.length}</strong> interns
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="ml-2 px-2 py-1 rounded-lg border border-gray-200 bg-white text-xs"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 font-semibold text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal: Add / Edit Intern with Credential Confirmation Screen */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setCredentialPreview(null);
        }}
        title={
          editingIntern
            ? `Edit Intern: ${editingIntern.full_name || editingIntern.username}`
            : credentialPreview
            ? 'Confirm Generated Intern Credentials'
            : 'Add New Intern (Automatic Credential Generation)'
        }
        maxWidth="max-w-3xl"
      >
        {renderInternFormFields(() => {
          setIsFormOpen(false);
          setCredentialPreview(null);
        })}
      </Modal>

      {/* Modal: Newly Created or Reset Temporary Password Display (Copyable) */}
      <Modal
        isOpen={!!resetPwdResult}
        onClose={() => setResetPwdResult(null)}
        title={
          resetPwdResult?.mode === 'created'
            ? 'Intern Account Created Successfully'
            : 'Temporary Password Reset Successfully'
        }
        maxWidth="max-w-md"
      >
        {resetPwdResult && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              Share these initial login credentials securely with{' '}
              <strong>{resetPwdResult.full_name}</strong>. They will be prompted to set a permanent password on their first login.
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block">Username</span>
                  <span className="text-sm font-mono font-bold text-gray-900">
                    {resetPwdResult.username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(resetPwdResult.username, 'res_user')}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 inline-flex items-center space-x-1"
                >
                  {copiedField === 'res_user' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'res_user' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-700 block">Temporary Password</span>
                  <span className="text-sm font-mono font-bold text-amber-950">
                    {resetPwdResult.temporary_password}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(resetPwdResult.temporary_password, 'res_pwd')}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-semibold text-amber-900 inline-flex items-center space-x-1"
                >
                  {copiedField === 'res_pwd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'res_pwd' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setResetPwdResult(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: View Details */}
      <Modal
        isOpen={!!viewingIntern}
        onClose={() => setViewingIntern(null)}
        title="Intern Account Details"
        maxWidth="max-w-xl"
      >
        {viewingIntern && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-gray-900">
                  {viewingIntern.full_name || viewingIntern.username}
                </h4>
                <p className="font-mono text-blue-700 font-semibold">@{viewingIntern.username}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full font-bold border ${statusBadgeStyle(
                  viewingIntern.status || viewingIntern.intern_status
                )}`}
              >
                {viewingIntern.status || viewingIntern.intern_status || 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block">Email Address</span>
                <span className="font-semibold text-gray-800">{viewingIntern.email}</span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block">Phone Number</span>
                <span className="font-semibold text-gray-800">{viewingIntern.phone || '—'}</span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block">Course Name</span>
                <span className="font-semibold text-gray-800">
                  {viewingIntern.course_name || viewingIntern.course || '—'}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block">Course Code</span>
                <span className="font-mono font-bold text-blue-700">
                  {viewingIntern.course_code || '—'}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block">Batch</span>
                <span className="font-semibold text-gray-800">{viewingIntern.batch || 'Batch 2026-A'}</span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block">Joining Date & Duration</span>
                <span className="font-semibold text-gray-800">
                  {viewingIntern.joining_date || viewingIntern.start_date || '—'} •{' '}
                  {viewingIntern.duration || viewingIntern.internship_duration || '12 weeks'}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block">Assigned Mentor</span>
                <span className="font-semibold text-gray-800">
                  {viewingIntern.assigned_mentor_name || 'Unassigned'}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block">Password Security</span>
                <span className="font-semibold text-gray-800">
                  {viewingIntern.must_change_password || viewingIntern.mustChangePassword
                    ? 'Pending First-Login Change'
                    : 'Permanent Password Active'}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const t = viewingIntern;
                  setViewingIntern(null);
                  setAssigningIntern(t);
                  setSelectedMentorId(t.assigned_mentor ? String(t.assigned_mentor) : '');
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-100 text-gray-700 font-semibold"
              >
                Assign Mentor
              </button>
              <button
                type="button"
                onClick={() => setViewingIntern(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Assign Mentor */}
      <Modal
        isOpen={!!assigningIntern}
        onClose={() => setAssigningIntern(null)}
        title={`Assign Mentor for ${assigningIntern?.full_name || assigningIntern?.username}`}
      >
        <form onSubmit={handleAssignMentor} className="space-y-4">
          <select
            value={selectedMentorId}
            onChange={(e) => setSelectedMentorId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
          >
            <option value="">-- Unassigned --</option>
            {mentors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name || m.username} ({m.email})
              </option>
            ))}
          </select>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setAssigningIntern(null)} className="px-4 py-2 text-xs font-semibold text-gray-600">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Confirmation */}
      <Modal
        isOpen={!!deletingIntern}
        onClose={() => setDeletingIntern(null)}
        title="Confirm Intern Account Deletion"
        maxWidth="max-w-md"
      >
        {deletingIntern && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete intern account{' '}
              <span className="font-bold text-gray-900">
                {deletingIntern.full_name} (@{deletingIntern.username})
              </span>
              ?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingIntern(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-rose-600 hover:bg-rose-700"
              >
                Delete Intern
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InternsList;
