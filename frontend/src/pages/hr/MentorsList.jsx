import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import { UserCheck, Plus, Clock, Phone, Mail, Users, Search, Eye, Pencil, Trash2 } from 'lucide-react';

const emptyForm = {
  username: '', password: '', first_name: '', last_name: '',
  email: '', phone: '', work_start_time: '09:00', work_end_time: '17:30'
};

const MentorsList = () => {
  const [mentors, setMentors] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // View Details Modal
  const [viewingMentor, setViewingMentor] = useState(null);

  // Delete Confirmation Modal
  const [deletingMentor, setDeletingMentor] = useState(null);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const [mentorRes, internRes] = await Promise.all([
        api.get('/hr/mentors/'),
        api.get('/hr/interns/'),
      ]);
      setMentors((d => Array.isArray(d) ? d : [])(mentorRes.data?.results ?? mentorRes.data));
      setInterns((d => Array.isArray(d) ? d : [])(internRes.data?.results ?? internRes.data));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const openAddModal = () => {
    setEditingMentor(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (m) => {
    setEditingMentor(m);
    const nameParts = (m.full_name || '').split(' ');
    setForm({
      username: m.username || '',
      password: '',
      first_name: m.first_name || nameParts[0] || '',
      last_name: m.last_name || nameParts.slice(1).join(' ') || '',
      email: m.email || '',
      phone: m.phone || '',
      work_start_time: m.work_start_time || '09:00',
      work_end_time: m.work_end_time || '17:30',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingMentor) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.patch(`/hr/mentors/${editingMentor.id}/`, payload);
      } else {
        await api.post('/hr/mentors/', form);
      }
      setIsModalOpen(false);
      setEditingMentor(null);
      setForm(emptyForm);
      fetchMentors();
    } catch (err) {
      alert(err.response?.data?.username?.[0] || 'Error saving mentor.');
    }
  };

  const handleDelete = async () => {
    if (!deletingMentor) return;
    try {
      await api.delete(`/hr/mentors/${deletingMentor.id}/`);
      setDeletingMentor(null);
      fetchMentors();
    } catch (err) {
      alert('Error deleting mentor.');
    }
  };

  const filteredMentors = mentors.filter(m =>
    (m.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.full_name && m.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMentorInterns = (mentorId) =>
    interns.filter(i => Number(i.assigned_mentor) === Number(mentorId));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mentor Accounts & Allocation</h1>
          <p className="text-xs text-gray-500 mt-1">
            Add, view, update, and delete Team Leads/Mentors, shift timings, and active assigned interns.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Mentor</span>
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
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMentors.map((m) => {
                  const assignedList = getMentorInterns(m.id);
                  const count = assignedList.length || m.assigned_intern_count || 0;
                  return (
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
                          {count} Assigned
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => setViewingMentor(m)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-gray-700 transition-colors"
                            title="View Mentor Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => openEditModal(m)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                            title="Update Mentor"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingMentor(m)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                            title="Delete Mentor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        )}
      </div>

      {/* Modal: Add / Update Mentor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMentor ? `Update Mentor: ${editingMentor.full_name || editingMentor.username}` : 'Add Mentor (Team Lead)'}
      >
        <form onSubmit={handleSave} className="space-y-4">
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {editingMentor ? 'New Password (Optional)' : 'Initial Password *'}
              </label>
              <input
                type="password"
                required={!editingMentor}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                placeholder={editingMentor ? 'Leave blank to keep current' : 'Initial password'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                required
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
              {editingMentor ? 'Update Mentor' : 'Save Mentor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Mentor Details */}
      <Modal
        isOpen={!!viewingMentor}
        onClose={() => setViewingMentor(null)}
        title="Mentor Profile & Assigned Interns"
      >
        {viewingMentor && (
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
              <div className="text-base font-bold text-gray-900">{viewingMentor.full_name || viewingMentor.username}</div>
              <div className="text-xs text-gray-500 font-mono">@{viewingMentor.username}</div>
              <div className="text-xs text-gray-700 pt-1">
                <b>Email:</b> {viewingMentor.email} · <b>Phone:</b> {viewingMentor.phone || 'N/A'}
              </div>
              <div className="text-xs text-gray-700">
                <b>Working Hours:</b> {viewingMentor.work_start_time || '09:00'} – {viewingMentor.work_end_time || '17:30'}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Assigned Interns ({getMentorInterns(viewingMentor.id).length})
              </h3>
              {getMentorInterns(viewingMentor.id).length === 0 ? (
                <p className="text-xs text-gray-400">No interns currently assigned to this mentor.</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {getMentorInterns(viewingMentor.id).map(i => (
                    <div key={i.id} className="p-3 rounded-xl border border-gray-100 bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-gray-900">{i.full_name || i.username}</div>
                        <div className="text-gray-500">{i.email}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                        {i.education_qualification || 'Intern'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  const m = viewingMentor;
                  setViewingMentor(null);
                  openEditModal(m);
                }}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100"
              >
                Edit Mentor
              </button>
              <button
                onClick={() => setViewingMentor(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Delete Confirmation */}
      <Modal
        isOpen={!!deletingMentor}
        onClose={() => setDeletingMentor(null)}
        title="Delete Mentor Account?"
      >
        {deletingMentor && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete mentor{' '}
              <b className="text-gray-900">{deletingMentor.full_name || deletingMentor.username}</b>? Any interns currently assigned to this mentor will be marked unassigned so they can be reallocated.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeletingMentor(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MentorsList;
