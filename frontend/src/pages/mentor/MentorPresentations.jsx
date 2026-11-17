import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import { Calendar, Plus, Video, Clock, Edit, Ban, CheckCircle2 } from 'lucide-react';

const MentorPresentations = () => {
  const [presentations, setPresentations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPres, setEditingPres] = useState(null);
  const [form, setForm] = useState({
    project: '',
    intern: '',
    presentation_date: new Date().toISOString().split('T')[0],
    presentation_time: '14:00',
    google_meet_link: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [presRes, projRes, internRes] = await Promise.all([
        api.get('/mentor/presentations/'),
        api.get('/mentor/projects/'),
        api.get('/mentor/interns/')
      ]);
      setPresentations((d => Array.isArray(d) ? d : [])(presRes.data?.results ?? presRes.data));
      setProjects((d => Array.isArray(d) ? d : [])(projRes.data?.results ?? projRes.data));
      setInterns((d => Array.isArray(d) ? d : [])(internRes.data?.results ?? internRes.data));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openScheduleModal = () => {
    setEditingPres(null);
    setForm({
      project: '',
      intern: '',
      presentation_date: new Date().toISOString().split('T')[0],
      presentation_time: '14:00',
      google_meet_link: 'https://meet.google.com/new',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openRescheduleModal = (pres) => {
    setEditingPres(pres);
    setForm({
      project: pres.project,
      intern: pres.intern,
      presentation_date: pres.presentation_date,
      presentation_time: pres.presentation_time,
      google_meet_link: pres.google_meet_link,
      notes: pres.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPres) {
        await api.patch(`/mentor/presentations/${editingPres.id}/`, {
          ...form,
          status: 'RESCHEDULED',
        });
      } else {
        await api.post('/mentor/presentations/', form);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error saving presentation schedule.');
    }
  };

  const handleCancelPresentation = async (presId) => {
    if (!confirm('Are you sure you want to cancel this scheduled presentation?')) return;
    try {
      await api.patch(`/mentor/presentations/${presId}/`, {
        status: 'CANCELLED',
      });
      fetchData();
    } catch (e) {
      alert('Error cancelling presentation.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Project Presentation Scheduling</h1>
          <p className="text-xs text-gray-500 mt-1">
            Schedule live Google Meet project demos and reviews, reschedule timings, or manage completions.
          </p>
        </div>
        <button
          onClick={openScheduleModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Presentation</span>
        </button>
      </div>

      {/* Presentations Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading scheduled presentations...</div>
        ) : presentations.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No presentations scheduled yet. Click "Schedule Presentation" to book a session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Project & Intern</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Meeting Link</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {presentations.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{p.project_title}</div>
                      <div className="text-xs text-emerald-600 font-medium">{p.intern_name}</div>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <div className="font-bold text-gray-900 flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-purple-600" />
                        {p.presentation_date}
                      </div>
                      <div className="text-gray-500 mt-0.5 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {p.presentation_time}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <a
                        href={p.google_meet_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Open Google Meet</span>
                      </a>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                        p.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' :
                        p.status === 'RESCHEDULED' ? 'bg-amber-50 text-amber-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      {p.status !== 'CANCELLED' && p.status !== 'COMPLETED' && (
                        <>
                          <button
                            onClick={() => openRescheduleModal(p)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Reschedule Presentation"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancelPresentation(p.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Cancel Presentation"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Schedule / Reschedule */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPres ? "Reschedule Presentation" : "Schedule Presentation"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Project *</label>
            <select
              required
              value={form.project}
              onChange={e => setForm({ ...form, project: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
            >
              <option value="">-- Choose Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Intern *</label>
            <select
              required
              value={form.intern}
              onChange={e => setForm({ ...form, intern: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
            >
              <option value="">-- Choose Intern --</option>
              {interns.map(i => (
                <option key={i.id} value={i.id}>{i.full_name || i.username}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Presentation Date *</label>
              <input
                type="date"
                required
                value={form.presentation_date}
                onChange={e => setForm({ ...form, presentation_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Presentation Time *</label>
              <input
                type="time"
                required
                value={form.presentation_time}
                onChange={e => setForm({ ...form, presentation_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Google Meet Link *</label>
            <input
              type="url"
              required
              value={form.google_meet_link}
              onChange={e => setForm({ ...form, google_meet_link: e.target.value })}
              placeholder="https://meet.google.com/xyz-uvw-rst"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Agenda (Optional)</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. 15-minute presentation followed by Q&A."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
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
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700"
            >
              {editingPres ? 'Save Rescheduled Details' : 'Book Presentation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MentorPresentations;
