import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import { Users, UserPlus, UserCheck, Phone, Mail, MapPin, GraduationCap, ArrowRightLeft, Search } from 'lucide-react';

const InternsList = () => {
  const [interns, setInterns] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Register Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [internForm, setInternForm] = useState({
    username: '', password: '', first_name: '', last_name: '',
    email: '', phone: '', phone2: '', address: '',
    education_qualification: '', source: 'Direct', assigned_mentor: ''
  });

  // Assign Mentor Modal
  const [assigningIntern, setAssigningIntern] = useState(null);
  const [selectedMentorId, setSelectedMentorId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [internRes, mentorRes] = await Promise.all([
        api.get('/hr/interns/'),
        api.get('/hr/mentors/')
      ]);
      setInterns(internRes.data.results || internRes.data || []);
      setMentors(mentorRes.data.results || mentorRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...internForm };
      if (!payload.assigned_mentor) delete payload.assigned_mentor;
      await api.post('/hr/interns/', payload);
      setIsRegisterOpen(false);
      setInternForm({
        username: '', password: '', first_name: '', last_name: '',
        email: '', phone: '', phone2: '', address: '',
        education_qualification: '', source: 'Direct', assigned_mentor: ''
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.username?.[0] || 'Error registering intern.');
    }
  };

  const handleAssignMentor = async (e) => {
    e.preventDefault();
    if (!assigningIntern) return;
    try {
      await api.post(`/hr/interns/${assigningIntern.id}/assign-mentor/`, {
        mentor_id: selectedMentorId ? parseInt(selectedMentorId) : null
      });
      setAssigningIntern(null);
      setSelectedMentorId('');
      fetchData();
    } catch (err) {
      alert('Error updating mentor assignment.');
    }
  };

  const filteredInterns = interns.filter(i =>
    i.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.full_name && i.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    i.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.education_qualification && i.education_qualification.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Intern Directory & Mentorship Assignment</h1>
          <p className="text-xs text-gray-500 mt-1">
            Register new interns, track academic qualifications, and assign or reassign dedicated mentors.
          </p>
        </div>
        <button
          onClick={() => setIsRegisterOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Intern</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-gray-400 ml-2" />
        <input
          type="text"
          placeholder="Search by intern name, email, qualification, or username..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full text-sm outline-none bg-transparent"
        />
      </div>

      {/* Interns Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading intern profiles...</div>
        ) : filteredInterns.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No interns found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Intern Name</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Education & Source</th>
                  <th className="px-6 py-4">Assigned Mentor</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInterns.map((intern) => (
                  <tr key={intern.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{intern.full_name || intern.username}</div>
                      <div className="text-xs text-gray-400 font-mono">@{intern.username}</div>
                      {intern.address && (
                        <div className="flex items-center text-[11px] text-gray-500 mt-1">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{intern.address}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center text-xs text-gray-600">
                        <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        <span>{intern.email}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        <span>{intern.phone} {intern.phone2 ? `• ${intern.phone2}` : ''}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center text-xs font-medium text-gray-800">
                        <GraduationCap className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        <span>{intern.education_qualification || 'Degree in progress'}</span>
                      </div>
                      <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Source: {intern.source || 'Direct'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {intern.assigned_mentor ? (
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-900">
                              {intern.assigned_mentor_name}
                            </div>
                            <div className="text-[10px] text-emerald-600">Active Mentor</div>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setAssigningIntern(intern);
                          setSelectedMentorId(intern.assigned_mentor ? String(intern.assigned_mentor) : '');
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 transition-colors"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>{intern.assigned_mentor ? 'Reassign Mentor' : 'Assign Mentor'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Register Intern */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register New Intern"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Username *</label>
              <input
                type="text"
                required
                value={internForm.username}
                onChange={e => setInternForm({ ...internForm, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                placeholder="intern_username"
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
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
            <div>
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">Address *</label>
            <input
              type="text"
              required
              value={internForm.address}
              onChange={e => setInternForm({ ...internForm, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
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
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Source *</label>
              <select
                value={internForm.source}
                onChange={e => setInternForm({ ...internForm, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
              >
                <option value="Direct">Direct</option>
                <option value="Campus Drive">Campus Drive</option>
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
              <option value="">-- No Mentor Assigned --</option>
              {mentors.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.username} ({m.assigned_intern_count} interns)
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
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

      {/* Modal: Assign / Reassign Mentor */}
      <Modal
        isOpen={!!assigningIntern}
        onClose={() => setAssigningIntern(null)}
        title="Assign or Reassign Mentor"
      >
        <form onSubmit={handleAssignMentor} className="space-y-4">
          <p className="text-sm text-gray-600">
            Select a mentor for <span className="font-semibold text-gray-900">{assigningIntern?.full_name || assigningIntern?.username}</span>.
            The system will automatically update the assigned intern count for the mentors.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Mentor</label>
            <select
              value={selectedMentorId}
              onChange={e => setSelectedMentorId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white"
            >
              <option value="">-- Unassign Mentor --</option>
              {mentors.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.username} ({m.assigned_intern_count} current interns)
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setAssigningIntern(null)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InternsList;
