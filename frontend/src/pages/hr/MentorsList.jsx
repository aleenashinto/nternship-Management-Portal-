import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import { UserCheck, Plus, Clock, Phone, Mail, Users, Search } from 'lucide-react';

const MentorsList = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    username: '', password: '', first_name: '', last_name: '',
    email: '', phone: '', work_start_time: '09:00', work_end_time: '17:30'
  });

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hr/mentors/');
      setMentors((d => Array.isArray(d) ? d : [])(res.data?.results ?? res.data));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/mentors/', form);
      setIsModalOpen(false);
      setForm({
        username: '', password: '', first_name: '', last_name: '',
        email: '', phone: '', work_start_time: '09:00', work_end_time: '17:30'
      });
      fetchMentors();
    } catch (err) {
      alert(err.response?.data?.username?.[0] || 'Error creating mentor.');
    }
  };

  const filteredMentors = mentors.filter(m =>
    m.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.full_name && m.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mentor Accounts & Allocation</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage Team Leads/Mentors, shift timings, and active assigned intern quotas.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Mentor</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-gray-400 ml-2" />
        <input
          type="text"
          placeholder="Search by mentor name, username, or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full text-sm outline-none bg-transparent"
        />
      </div>

      {/* Mentors Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading mentors...</div>
        ) : filteredMentors.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No mentors found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Mentor Name & Username</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Working Hours</th>
                  <th className="px-6 py-4">Assigned Interns</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMentors.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{m.full_name || m.username}</div>
                      <div className="text-xs text-gray-400 font-mono">@{m.username}</div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center text-xs text-gray-600">
                        <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        <span>{m.email}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        <span>{m.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-xs text-gray-700 bg-slate-100 px-2.5 py-1 rounded-lg w-fit">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        <span>{m.work_start_time || '09:00'} - {m.work_end_time || '17:30'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        <Users className="w-3.5 h-3.5 mr-1" />
                        {m.assigned_intern_count} Assigned
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
                        Active Lead
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Mentor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Mentor (Team Lead)"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Username *</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                placeholder="mentor_username"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
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
                value={form.first_name}
                onChange={e => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value })}
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
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Work Starting Time</label>
              <input
                type="time"
                value={form.work_start_time}
                onChange={e => setForm({ ...form, work_start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Work Ending Time</label>
              <input
                type="time"
                value={form.work_end_time}
                onChange={e => setForm({ ...form, work_end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
    </div>
  );
};

export default MentorsList;
