import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Modal from '../../components/Modal';
import {
  Users, UserCheck, Award, FolderKanban, CheckCircle2, Clock,
  AlertTriangle, UserX, PlusCircle, Check, X, FileText, ArrowRight,
  Sparkles, ExternalLink
} from 'lucide-react';

const HRDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mentorsList, setMentorsList] = useState([]);

  // Create Mentor Modal State
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [mentorForm, setMentorForm] = useState({
    username: '', password: '', first_name: '', last_name: '',
    email: '', phone: '', work_start_time: '09:00', work_end_time: '17:30'
  });

  // Create Intern Modal State
  const [isInternModalOpen, setIsInternModalOpen] = useState(false);
  const [internForm, setInternForm] = useState({
    username: '', password: '', first_name: '', last_name: '',
    email: '', phone: '', phone2: '', address: '',
    education_qualification: '', source: 'Direct', assigned_mentor: ''
  });

  // Rejection modal
  const [rejectModalCert, setRejectModalCert] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, mentorRes] = await Promise.all([
        api.get('/hr/dashboard/'),
        api.get('/hr/mentors/')
      ]);
      setData(dashRes.data);
      const rawMentors = mentorRes.data?.results ?? mentorRes.data;
      setMentorsList(Array.isArray(rawMentors) ? rawMentors : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCreateMentor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/mentors/', mentorForm);
      setIsMentorModalOpen(false);
      setMentorForm({
        username: '', password: '', first_name: '', last_name: '',
        email: '', phone: '', work_start_time: '09:00', work_end_time: '17:30'
      });
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.username?.[0] || 'Error creating mentor.');
    }
  };

  const handleCreateIntern = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...internForm };
      if (!payload.assigned_mentor) delete payload.assigned_mentor;
      await api.post('/hr/interns/', payload);
      setIsInternModalOpen(false);
      setInternForm({
        username: '', password: '', first_name: '', last_name: '',
        email: '', phone: '', phone2: '', address: '',
        education_qualification: '', source: 'Direct', assigned_mentor: ''
      });
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.username?.[0] || 'Error registering intern.');
    }
  };

  const handleApproveCert = async (certId) => {
    try {
      await api.post(`/hr/certificates/${certId}/approve/`);
      fetchDashboard();
    } catch (e) {
      alert('Error approving certificate.');
    }
  };

  const handleRejectCert = async () => {
    if (!rejectModalCert) return;
    try {
      await api.post(`/hr/certificates/${rejectModalCert.id}/reject/`, {
        reason: rejectReason || 'Incomplete internship criteria'
      });
      setRejectModalCert(null);
      setRejectReason('');
      fetchDashboard();
    } catch (e) {
      alert('Error rejecting certificate.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const pendingCerts = data?.pending_certificates || [];

  return (
    <div className="space-y-8">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">HR Manager Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time management KPIs, mentor allocations, and certificate approval governance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/hr/interns/import"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Import CSV / Excel</span>
          </Link>
          <button
            onClick={() => setIsMentorModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            <span>Create Mentor</span>
          </button>
          <Link
            to="/hr/interns/add"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Intern</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Total Mentors */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Mentors</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{kpis.total_mentors}</span>
            <Link to="/hr/mentors" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center">
              View all <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Total Interns */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Interns</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{kpis.total_interns}</span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {kpis.active_interns} active
            </span>
          </div>
        </div>

        {/* Interns Without Mentors */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Unassigned Interns</span>
            <div className={`p-2.5 rounded-xl ${kpis.interns_without_mentors > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{kpis.interns_without_mentors}</span>
            <Link to="/hr/interns" className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center">
              Assign now <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Total Projects Assigned */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Projects Assigned</span>
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{kpis.total_projects_assigned}</span>
            <span className="text-xs text-gray-500">Across all interns</span>
          </div>
        </div>

        {/* Completed Projects */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Completed Projects</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600">{kpis.completed_projects}</span>
            <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
              Success
            </span>
          </div>
        </div>

        {/* Pending Projects */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Pending Projects</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{kpis.pending_projects}</span>
            <span className="text-xs text-gray-500">In-progress / review</span>
          </div>
        </div>

        {/* Overdue Projects */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Overdue Projects</span>
            <div className={`p-2.5 rounded-xl ${kpis.overdue_projects > 0 ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${kpis.overdue_projects > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {kpis.overdue_projects}
            </span>
            <span className="text-xs text-gray-400">Past deadline</span>
          </div>
        </div>

        {/* Pending Certificate Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Pending Certificates</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-600">{kpis.pending_certificate_approvals}</span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              Action Required
            </span>
          </div>
        </div>
      </div>

      {/* Added Mentors Table directly on HR Dashboard */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Mentors Directory</h2>
              <p className="text-xs text-gray-500 mt-0.5">All registered Team Leads/Mentors, contact details, shift hours, and assigned intern counts</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMentorModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add Mentor</span>
            </button>
            <Link
              to="/hr/mentors"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
            >
              <span>Manage Mentors (Edit / Delete)</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          {mentorsList.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              No mentors added yet. Click "Create Mentor" to add a mentor.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5">Mentor Name</th>
                  <th className="px-6 py-3.5">Username</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Phone</th>
                  <th className="px-6 py-3.5">Shift Hours</th>
                  <th className="px-6 py-3.5">Assigned Interns</th>
                  <th className="px-6 py-3.5 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mentorsList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {m.full_name || m.username}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">
                      @{m.username}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {m.email}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {m.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {m.work_start_time || '09:00'} – {m.work_end_time || '17:30'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        {m.assigned_intern_count ?? 0} Assigned
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to="/hr/mentors"
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        View / Edit / Delete →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Dedicated Certification Section (Section 2.2 requirement) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Dedicated Certification Section</h2>
              <p className="text-xs text-gray-500 mt-0.5">Certificates submitted by interns awaiting HR Manager review & issuance</p>
            </div>
          </div>
          <Link
            to="/hr/certificates"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
          >
            <span>View All Certificate History</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {pendingCerts.length === 0 ? (
            <div className="py-12 text-center">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">No certificates currently awaiting approval.</p>
              <p className="text-xs text-gray-400 mt-0.5">Pending requests will appear here automatically when interns complete requirements.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5">Intern Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Completed Projects</th>
                  <th className="px-6 py-3.5">Request Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {cert.intern_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                      {cert.intern_email}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {cert.completed_projects_count} completed
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(cert.request_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleApproveCert(cert.id)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Issue PDF</span>
                      </button>
                      <button
                        onClick={() => setRejectModalCert(cert)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Create Mentor */}
      <Modal
        isOpen={isMentorModalOpen}
        onClose={() => setIsMentorModalOpen(false)}
        title="Create Mentor (Team Lead) Account"
      >
        <form onSubmit={handleCreateMentor} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Username *</label>
              <input
                type="text"
                required
                value={mentorForm.username}
                onChange={e => setMentorForm({ ...mentorForm, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                placeholder="e.g. mentor_david"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={mentorForm.password}
                onChange={e => setMentorForm({ ...mentorForm, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                placeholder="Initial password"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={mentorForm.first_name}
                onChange={e => setMentorForm({ ...mentorForm, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={mentorForm.last_name}
                onChange={e => setMentorForm({ ...mentorForm, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={mentorForm.email}
                onChange={e => setMentorForm({ ...mentorForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                placeholder="mentor@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
              <input
                type="text"
                required
                value={mentorForm.phone}
                onChange={e => setMentorForm({ ...mentorForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                placeholder="+1 555-0199"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Work Starting Time</label>
              <input
                type="time"
                value={mentorForm.work_start_time}
                onChange={e => setMentorForm({ ...mentorForm, work_start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Work Ending Time</label>
              <input
                type="time"
                value={mentorForm.work_end_time}
                onChange={e => setMentorForm({ ...mentorForm, work_end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsMentorModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              Save Mentor
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Register Intern */}
      <Modal
        isOpen={isInternModalOpen}
        onClose={() => setIsInternModalOpen(false)}
        title="Register New Intern"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateIntern} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Username *</label>
              <input
                type="text"
                required
                value={internForm.username}
                onChange={e => setInternForm({ ...internForm, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                placeholder="e.g. intern_alex"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password (Optional)</label>
              <input
                type="password"
                value={internForm.password}
                onChange={e => setInternForm({ ...internForm, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                placeholder="Default: InternPassword@123"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full First Name *</label>
              <input
                type="text"
                required
                value={internForm.first_name}
                onChange={e => setInternForm({ ...internForm, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={internForm.last_name}
                onChange={e => setInternForm({ ...internForm, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={internForm.email}
                onChange={e => setInternForm({ ...internForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone 1 *</label>
              <input
                type="text"
                required
                value={internForm.phone}
                onChange={e => setInternForm({ ...internForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone 2 (Optional)</label>
              <input
                type="text"
                value={internForm.phone2}
                onChange={e => setInternForm({ ...internForm, phone2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Residential Address *</label>
            <input
              type="text"
              required
              value={internForm.address}
              onChange={e => setInternForm({ ...internForm, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              placeholder="Full address"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Educational Qualification *</label>
              <input
                type="text"
                required
                value={internForm.education_qualification}
                onChange={e => setInternForm({ ...internForm, education_qualification: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                placeholder="e.g. B.S. Computer Science"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Source *</label>
              <select
                value={internForm.source}
                onChange={e => setInternForm({ ...internForm, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
              >
                <option value="Direct">Direct Application</option>
                <option value="Campus Drive">Campus Placement</option>
                <option value="Referral">Referral</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Mentor (Optional)</label>
            <select
              value={internForm.assigned_mentor}
              onChange={e => setInternForm({ ...internForm, assigned_mentor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
            >
              <option value="">-- No Mentor Assigned (Assign Later) --</option>
              {mentorsList.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.username} ({m.assigned_intern_count} current interns)
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsInternModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              Register Intern
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Rejection Reason */}
      <Modal
        isOpen={!!rejectModalCert}
        onClose={() => setRejectModalCert(null)}
        title="Reject Certificate Request"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please state the reason for rejecting the completion certificate for{' '}
            <span className="font-semibold text-gray-900">{rejectModalCert?.intern_name}</span>.
            The intern will be notified automatically.
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g. Incomplete final evaluation, requires project resubmission."
            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setRejectModalCert(null)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectCert}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HRDashboard;
