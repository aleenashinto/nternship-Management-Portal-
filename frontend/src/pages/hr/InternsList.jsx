import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import Modal from '../../components/Modal';
import {
  INTERN_STATUS_OPTIONS,
  calculateDuration,
  exportInternRecords,
} from '../../utils/internSpreadsheet';
import {
  Users, UserPlus, UserCheck, Phone, Mail, MapPin,
  GraduationCap, ArrowRightLeft, Search, Eye, Pencil, Trash2,
  Upload, Download, FileSpreadsheet, Filter, RotateCcw, Calendar,
  Building2, Briefcase, CheckCircle2, AlertCircle, RefreshCw, Image as ImageIcon
} from 'lucide-react';

const emptyInternForm = {
  full_name: '',
  email: '',
  phone: '',
  gender: '',
  college: '',
  course: '',
  department: 'Data Analytics',
  internship_role: 'Data Analytics Intern',
  start_date: '',
  end_date: '',
  internship_duration: '',
  assigned_mentor: '',
  hr_contact: '2',
  hr_contact_name: 'Sarah Connor',
  status: 'Active',
  address: '',
  profile_photo: '',
  source: 'Direct',
  username: '',
  password: '',
};

const statusBadgeStyle = (status) => {
  switch ((status || 'Active').toLowerCase()) {
    case 'applied':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'selected':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'onboarding':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
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
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Add / Edit Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIntern, setEditingIntern] = useState(null);
  const [internForm, setInternForm] = useState(emptyInternForm);
  const [saving, setSaving] = useState(false);

  // Modals: View Profile, Delete Confirmation, Change Status, Assign Mentor
  const [viewingIntern, setViewingIntern] = useState(null);
  const [deletingIntern, setDeletingIntern] = useState(null);
  const [statusModalIntern, setStatusModalIntern] = useState(null);
  const [nextStatusValue, setNextStatusValue] = useState('Active');
  const [assigningIntern, setAssigningIntern] = useState(null);
  const [selectedMentorId, setSelectedMentorId] = useState('');

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
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
        ? (internRes.data?.results ?? internRes.data)
        : [];
      const mList = Array.isArray(mentorRes.data?.results ?? mentorRes.data)
        ? (mentorRes.data?.results ?? mentorRes.data)
        : [];
      const dList = Array.isArray(deptRes.data?.results ?? deptRes.data)
        ? (deptRes.data?.results ?? deptRes.data)
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

  // Auto-calculate duration when start_date or end_date changes
  const handleDateChange = (field, val) => {
    setInternForm((prev) => {
      const next = { ...prev, [field]: val };
      if (next.start_date && next.end_date) {
        next.internship_duration = calculateDuration(next.start_date, next.end_date);
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
    setInternForm(emptyInternForm);
    setIsFormOpen(true);
  };

  const openEditModal = (intern) => {
    setEditingIntern(intern);
    const fullName =
      intern.full_name ||
      `${intern.first_name || ''} ${intern.last_name || ''}`.trim() ||
      intern.username ||
      '';
    setInternForm({
      full_name: fullName,
      email: intern.email || '',
      phone: intern.phone || '',
      gender: intern.gender || '',
      college: intern.college || '',
      course: intern.course || intern.education_qualification || '',
      department: intern.department_name || intern.department || 'Data Analytics',
      internship_role: intern.internship_role || 'Data Analytics Intern',
      start_date: intern.start_date || '',
      end_date: intern.end_date || '',
      internship_duration:
        intern.internship_duration ||
        calculateDuration(intern.start_date, intern.end_date) ||
        '',
      assigned_mentor: intern.assigned_mentor ? String(intern.assigned_mentor) : '',
      hr_contact: intern.hr_contact ? String(intern.hr_contact) : '2',
      hr_contact_name: intern.hr_contact_name || 'Sarah Connor',
      status: intern.status || intern.intern_status || 'Active',
      address: intern.address || '',
      profile_photo: intern.profile_photo || '',
      source: intern.source || 'Direct',
      username: intern.username || '',
      password: '',
    });
    setIsFormOpen(true);
  };

  const handleResetForm = () => {
    if (editingIntern) {
      openEditModal(editingIntern);
    } else {
      setInternForm(emptyInternForm);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (internForm.start_date && internForm.end_date && internForm.start_date > internForm.end_date) {
      showToast('error', 'Internship Start Date must not be after End Date.');
      return;
    }
    setSaving(true);
    try {
      const parts = (internForm.full_name || '').trim().split(' ');
      const payload = {
        ...internForm,
        first_name: parts[0] || 'Intern',
        last_name: parts.slice(1).join(' ') || '',
        education_qualification: internForm.course,
        intern_status: internForm.status,
        assigned_mentor: internForm.assigned_mentor ? parseInt(internForm.assigned_mentor, 10) : null,
      };
      if (!payload.password) delete payload.password;
      if (!payload.username) delete payload.username;

      if (editingIntern) {
        await api.patch(`/hr/interns/${editingIntern.id}/`, payload);
        showToast('success', `Updated intern profile for ${internForm.full_name}.`);
      } else {
        await api.post('/hr/interns/', payload);
        showToast('success', `Added new intern ${internForm.full_name} to the directory.`);
      }

      setIsFormOpen(false);
      setEditingIntern(null);
      setInternForm(emptyInternForm);
      await fetchData();
      if (isAddPage) {
        navigate('/hr/interns');
      }
    } catch (err) {
      const errData = err.response?.data || {};
      const firstMsg =
        errData.detail ||
        errData.end_date?.[0] ||
        errData.email?.[0] ||
        errData.username?.[0] ||
        'Error saving intern record.';
      showToast('error', firstMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingIntern) return;
    try {
      await api.delete(`/hr/interns/${deletingIntern.id}/`);
      showToast('success', `Deleted intern record for ${deletingIntern.full_name || deletingIntern.username}.`);
      setDeletingIntern(null);
      fetchData();
    } catch {
      showToast('error', 'Error deleting intern.');
    }
  };

  const handleChangeStatus = async (e) => {
    e.preventDefault();
    if (!statusModalIntern) return;
    try {
      await api.post(`/hr/interns/${statusModalIntern.id}/change-status/`, {
        status: nextStatusValue,
      });
      showToast(
        'success',
        `Updated status for ${statusModalIntern.full_name || statusModalIntern.username} to ${nextStatusValue}.`
      );
      setStatusModalIntern(null);
      fetchData();
    } catch {
      showToast('error', 'Error updating intern status.');
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
          (i.college || '').toLowerCase().includes(q) ||
          (i.internship_role || '').toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      const iDept = (i.department_name || i.department || 'Data Analytics').toLowerCase();
      if (deptFilter !== 'ALL' && iDept !== deptFilter.toLowerCase()) {
        return false;
      }

      const iStatus = (i.status || i.intern_status || 'Active').toLowerCase();
      if (statusFilter !== 'ALL' && iStatus !== statusFilter.toLowerCase()) {
        return false;
      }

      if (startDateFilter && i.start_date && i.start_date < startDateFilter) {
        return false;
      }
      if (endDateFilter && i.end_date && i.end_date > endDateFilter) {
        return false;
      }
      return true;
    });
  }, [interns, searchTerm, deptFilter, statusFilter, startDateFilter, endDateFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, deptFilter, statusFilter, startDateFilter, endDateFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredInterns.length / pageSize));
  const paginatedInterns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInterns.slice(start, start + pageSize);
  }, [filteredInterns, currentPage, pageSize]);

  const renderInternFormFields = (onCancel) => (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={internForm.full_name}
            onChange={(e) => setInternForm({ ...internForm, full_name: e.target.value })}
            placeholder="e.g. Aarav Sharma"
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
            placeholder="aarav.sharma@university.edu"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
          <input
            type="text"
            required
            value={internForm.phone}
            onChange={(e) => setInternForm({ ...internForm, phone: e.target.value })}
            placeholder="+91 9876543210"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Gender (Optional)</label>
          <select
            value={internForm.gender}
            onChange={(e) => setInternForm({ ...internForm, gender: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-Binary">Non-Binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">College / University *</label>
          <input
            type="text"
            required
            value={internForm.college}
            onChange={(e) => setInternForm({ ...internForm, college: e.target.value })}
            placeholder="e.g. IIT Madras / MIT"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Course / Degree *</label>
          <input
            type="text"
            required
            value={internForm.course}
            onChange={(e) => setInternForm({ ...internForm, course: e.target.value })}
            placeholder="e.g. B.Tech in Data Science"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Department *</label>
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
          <label className="block text-xs font-bold text-gray-700 mb-1">Internship Role *</label>
          <input
            type="text"
            required
            value={internForm.internship_role}
            onChange={(e) => setInternForm({ ...internForm, internship_role: e.target.value })}
            placeholder="e.g. Data Analytics Intern"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Status *</label>
          <select
            value={internForm.status}
            onChange={(e) => setInternForm({ ...internForm, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white font-semibold"
          >
            {INTERN_STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Internship Start Date *</label>
          <input
            type="date"
            required
            value={internForm.start_date}
            onChange={(e) => handleDateChange('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Internship End Date *</label>
          <input
            type="date"
            required
            value={internForm.end_date}
            onChange={(e) => handleDateChange('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Internship Duration (Auto-Calculated)
          </label>
          <input
            type="text"
            value={internForm.internship_duration}
            onChange={(e) => setInternForm({ ...internForm, internship_duration: e.target.value })}
            placeholder="Auto-calculated from dates"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-slate-50 text-gray-700 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Assigned Mentor</label>
          <select
            value={internForm.assigned_mentor}
            onChange={(e) => setInternForm({ ...internForm, assigned_mentor: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
          >
            <option value="">-- Unassigned (Assign Later) --</option>
            {mentors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name || m.username} ({m.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">HR Contact</label>
          <select
            value={internForm.hr_contact_name}
            onChange={(e) => setInternForm({ ...internForm, hr_contact_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
          >
            <option value="Sarah Connor">Sarah Connor (HR Manager)</option>
            <option value="System Administrator">System Administrator</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Profile Photo (Optional)</label>
          <div className="flex items-center space-x-2">
            {internForm.profile_photo && (
              <img
                src={internForm.profile_photo}
                alt="Preview"
                className="w-9 h-9 rounded-xl object-cover border border-gray-200 shrink-0"
              />
            )}
            <label className="flex-1 px-3 py-2 border border-dashed border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:border-blue-500 cursor-pointer flex items-center justify-center space-x-1.5 bg-slate-50/50">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>{internForm.profile_photo ? 'Change Photo' : 'Upload Photo'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Residential Address *</label>
        <textarea
          rows={2}
          required
          value={internForm.address}
          onChange={(e) => setInternForm({ ...internForm, address: e.target.value })}
          placeholder="Street address, City, State, Postal Code"
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
        />
      </div>

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
          {saving ? 'Saving...' : editingIntern ? 'Save Changes' : 'Save Intern'}
        </button>
      </div>
    </form>
  );

  // If rendered on /hr/interns/add dedicated route
  if (isAddPage) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              HR Management • Manual Onboarding
            </span>
            <h1 className="text-xl font-bold text-gray-900 mt-1">Add New Intern</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Register an individual intern profile with department, academic details, timeline, mentor, and onboarding status.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to="/hr/interns/import"
              className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/60 text-blue-700 text-xs font-semibold inline-flex items-center space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Bulk Import CSV / Excel</span>
            </Link>
            <Link
              to="/hr/interns"
              className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50"
            >
              Back to Intern List
            </Link>
          </div>
        </div>

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
              HR Management • Intern Registry
            </span>
            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-700">
              {filteredInterns.length} {filteredInterns.length === 1 ? 'Intern' : 'Interns'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Intern Management & Directory
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Search, filter, onboard, assign mentors, update lifecycle status, and bulk import or export intern records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportInternRecords(filteredInterns, 'csv')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-slate-50 transition-all"
            title="Export filtered interns to CSV"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => exportInternRecords(filteredInterns, 'xlsx')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all"
            title="Export filtered interns to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <Link
            to="/hr/interns/import"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV / Excel</span>
          </Link>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Intern</span>
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

      {/* Search & Multi-Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search by name, email, or Intern ID */}
          <div className="md:col-span-4 flex items-center space-x-2 px-3 py-2 rounded-xl border border-gray-200 bg-slate-50/50">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by Intern ID, name, email, college, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs outline-none bg-transparent text-gray-800"
            />
          </div>

          {/* Filter by Department */}
          <div className="md:col-span-2">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white text-gray-700"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id || d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium bg-white text-gray-700"
            >
              <option value="ALL">All Statuses</option>
              {INTERN_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Start Date / End Date */}
          <div className="md:col-span-2">
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              title="Filter Start Date From"
              className="w-full px-2.5 py-2 rounded-xl border border-gray-200 text-xs bg-white text-gray-600"
            />
          </div>
          <div className="md:col-span-2 flex items-center space-x-1.5">
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              title="Filter End Date To"
              className="w-full px-2.5 py-2 rounded-xl border border-gray-200 text-xs bg-white text-gray-600"
            />
            {(searchTerm || deptFilter !== 'ALL' || statusFilter !== 'ALL' || startDateFilter || endDateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setDeptFilter('ALL');
                  setStatusFilter('ALL');
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
                title="Clear Filters"
                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interns Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading intern records...</div>
        ) : filteredInterns.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-gray-600">No matching intern records found.</p>
            <p className="text-xs text-gray-400">
              Try adjusting your search filters, add a new intern manually, or import a CSV/Excel cohort.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3.5">Intern ID</th>
                    <th className="px-4 py-3.5">Name</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-4 py-3.5">Internship Role</th>
                    <th className="px-4 py-3.5">Start Date</th>
                    <th className="px-4 py-3.5">End Date</th>
                    <th className="px-4 py-3.5">Assigned Mentor</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedInterns.map((intern, idx) => {
                    const internCode =
                      intern.intern_code ||
                      `INT-2026-${String(intern.id || idx + 1).padStart(4, '0')}`;
                    const statusVal = intern.status || intern.intern_status || 'Active';
                    const deptVal = intern.department_name || intern.department || 'Data Analytics';
                    const roleVal = intern.internship_role || 'Data Analytics Intern';

                    return (
                      <tr key={intern.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {internCode}
                        </td>

                        <td className="px-4 py-3.5">
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
                              <div className="text-[11px] text-gray-400">
                                {intern.college || intern.course || intern.education_qualification || `@${intern.username}`}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="text-gray-700 font-medium">{intern.email}</div>
                          {intern.phone && (
                            <div className="text-[11px] text-gray-400">{intern.phone}</div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {deptVal}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-medium text-gray-800">
                          {roleVal}
                        </td>

                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {intern.start_date || '2026-06-01'}
                        </td>

                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {intern.end_date || '2026-08-31'}
                        </td>

                        <td className="px-4 py-3.5">
                          {intern.assigned_mentor_name || intern.assigned_mentor ? (
                            <button
                              type="button"
                              onClick={() => {
                                setAssigningIntern(intern);
                                setSelectedMentorId(
                                  intern.assigned_mentor ? String(intern.assigned_mentor) : ''
                                );
                              }}
                              className="inline-flex items-center space-x-1.5 text-left group"
                              title="Click to reassign mentor"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <span className="font-semibold text-gray-800 group-hover:text-blue-600">
                                {intern.assigned_mentor_name || `Mentor #${intern.assigned_mentor}`}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAssigningIntern(intern);
                                setSelectedMentorId('');
                              }}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                            >
                              + Assign Mentor
                            </button>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => {
                              setStatusModalIntern(intern);
                              setNextStatusValue(statusVal);
                            }}
                            title="Click to change status"
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadgeStyle(
                              statusVal
                            )}`}
                          >
                            {statusVal}
                          </button>
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingIntern(intern)}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-gray-700 inline-flex items-center space-x-1"
                              title="View Profile"
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
                              onClick={() => {
                                setStatusModalIntern(intern);
                                setNextStatusValue(statusVal);
                              }}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 inline-flex items-center space-x-1"
                              title="Change Status"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Status</span>
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
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold disabled:opacity-40 hover:bg-gray-50"
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
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-semibold disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal: Add / Edit Intern */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          editingIntern
            ? `Edit Intern: ${editingIntern.full_name || editingIntern.username}`
            : 'Add New Intern'
        }
        maxWidth="max-w-3xl"
      >
        {renderInternFormFields(() => setIsFormOpen(false))}
      </Modal>

      {/* Modal: View Intern Profile */}
      <Modal
        isOpen={!!viewingIntern}
        onClose={() => setViewingIntern(null)}
        title="Intern Profile Overview"
        maxWidth="max-w-xl"
      >
        {viewingIntern && (
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                  {(viewingIntern.full_name || viewingIntern.username || 'I')[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-gray-900 text-base">
                      {viewingIntern.full_name || viewingIntern.username}
                    </h4>
                    <span className="font-mono text-xs font-bold text-blue-600">
                      {viewingIntern.intern_code || `INT-2026-${String(viewingIntern.id).padStart(4, '0')}`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {viewingIntern.internship_role || 'Data Analytics Intern'} •{' '}
                    {viewingIntern.department_name || viewingIntern.department || 'Data Analytics'}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeStyle(
                  viewingIntern.status || viewingIntern.intern_status
                )}`}
              >
                {viewingIntern.status || viewingIntern.intern_status || 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Email Address</span>
                <span className="font-semibold text-gray-800">{viewingIntern.email}</span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Phone Number</span>
                <span className="font-semibold text-gray-800">{viewingIntern.phone || '—'}</span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">College / University</span>
                <span className="font-semibold text-gray-800">{viewingIntern.college || '—'}</span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Course / Degree</span>
                <span className="font-semibold text-gray-800">
                  {viewingIntern.course || viewingIntern.education_qualification || '—'}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Start & End Dates</span>
                <span className="font-semibold text-gray-800">
                  {viewingIntern.start_date || '2026-06-01'} → {viewingIntern.end_date || '2026-08-31'}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Duration</span>
                <span className="font-semibold text-gray-800">
                  {viewingIntern.internship_duration ||
                    calculateDuration(viewingIntern.start_date, viewingIntern.end_date) ||
                    '12 weeks'}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">Assigned Mentor</span>
                <span className="font-semibold text-gray-800">
                  {viewingIntern.assigned_mentor_name || 'Unassigned'}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 block mb-0.5">HR Contact</span>
                <span className="font-semibold text-gray-800">
                  {viewingIntern.hr_contact_name || 'Sarah Connor'}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 col-span-2">
                <span className="text-gray-400 block mb-0.5">Address</span>
                <span className="font-semibold text-gray-800">{viewingIntern.address || '—'}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const target = viewingIntern;
                  setViewingIntern(null);
                  openEditModal(target);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => setViewingIntern(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Change Status */}
      <Modal
        isOpen={!!statusModalIntern}
        onClose={() => setStatusModalIntern(null)}
        title={`Change Internship Status: ${statusModalIntern?.full_name || ''}`}
      >
        <form onSubmit={handleChangeStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Select New Lifecycle Status
            </label>
            <select
              value={nextStatusValue}
              onChange={(e) => setNextStatusValue(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white font-semibold"
            >
              {INTERN_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setStatusModalIntern(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700"
            >
              Update Status
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Assign Mentor */}
      <Modal
        isOpen={!!assigningIntern}
        onClose={() => setAssigningIntern(null)}
        title={`Assign Mentor for ${assigningIntern?.full_name || assigningIntern?.username}`}
      >
        <form onSubmit={handleAssignMentor} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Select Mentor (Team Lead)
            </label>
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
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setAssigningIntern(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Confirmation */}
      <Modal
        isOpen={!!deletingIntern}
        onClose={() => setDeletingIntern(null)}
        title="Confirm Intern Deletion"
        maxWidth="max-w-md"
      >
        {deletingIntern && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete intern{' '}
              <span className="font-bold text-gray-900">
                {deletingIntern.full_name || deletingIntern.username}
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
