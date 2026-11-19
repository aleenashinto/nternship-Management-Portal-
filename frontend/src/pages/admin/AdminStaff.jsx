import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/Modal';

const AdminStaff = () => {
  const [staff, setStaff] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [openModal, setOpenModal] = useState(false);
  const [role, setRole] = useState('MENTOR');
  const [form, setForm] = useState({ name: '', email: '', phone: '', work_start_time: '09:00', work_end_time: '17:30' });
  const [secret, setSecret] = useState(null);

  const load = () => {
    api.get('/admin/staff').then(res => {
      const d = res.data?.results ?? res.data;
      setStaff(Array.isArray(d) ? d : []);
    });
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await api.post('/admin/staff', { ...form, role });
    setOpenModal(false);
    setSecret({ email: form.email, password: res.data.temp_password });
    setForm({ name: '', email: '', phone: '', work_start_time: '09:00', work_end_time: '17:30' });
    load();
  };

  const toggleActive = async (row) => {
    await api.patch('/admin/staff', { id: row.id, is_active: !(row.is_active ?? true) });
    load();
  };

  const rows = staff.filter(r => filter === 'ALL' || r.role === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">HR Managers & Mentors (Admin Control)</h1>
          <p className="text-xs text-gray-500 mt-1">
            Admin creates, edits, activates, and deactivates HR Manager and Mentor accounts only. Intern accounts are created solely through HR registration.
          </p>
        </div>
        <button onClick={() => setOpenModal(true)} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
          + New Staff Account
        </button>
      </div>

      <div className="inline-flex rounded-xl bg-blue-50 p-1">
        {['ALL', 'HR', 'MENTOR'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === f ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-500'}`}>
            {f === 'ALL' ? 'All Staff' : f === 'HR' ? 'HR Managers' : 'Mentors'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-blue-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Email & Shift</th>
              <th className="px-4 py-3">Assigned Interns</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(r => {
              const active = r.is_active ?? true;
              return (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{r.full_name || r.name || r.username}</td>
                  <td className="px-4 py-3">{r.role === 'HR' ? 'HR Manager' : 'Mentor'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {r.email}
                    {r.phone && <div className="text-gray-400">{r.phone} · {r.work_start_time}-{r.work_end_time}</div>}
                  </td>
                  <td className="px-4 py-3">{r.assigned_intern_count ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleActive(r)} className="text-xs font-semibold text-blue-600 hover:underline">
                      {active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={openModal} onClose={() => setOpenModal(false)} title="Create HR Manager or Mentor Account">
        <form onSubmit={handleCreate} className="space-y-3">
          <label className="block text-xs font-semibold text-gray-700">
            Role
            <select value={role} onChange={e => setRole(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
              <option value="MENTOR">Mentor (Team Lead)</option>
              <option value="HR">HR Manager</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Full Name *
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Email (Username) *
            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          </label>
          {role === 'MENTOR' && (
            <>
              <label className="block text-xs font-semibold text-gray-700">
                Phone *
                <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-gray-700">
                  Work Start
                  <input type="time" value={form.work_start_time} onChange={e => setForm({ ...form, work_start_time: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                </label>
                <label className="block text-xs font-semibold text-gray-700">
                  Work End
                  <input type="time" value={form.work_end_time} onChange={e => setForm({ ...form, work_end_time: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                </label>
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpenModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">Create Account</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!secret} onClose={() => setSecret(null)} title="Temporary Password Generated">
        <p className="text-sm text-gray-600">Share this initial password with <b>{secret?.email}</b> (forced change on first login):</p>
        <code className="mt-3 block rounded-xl bg-blue-50 px-4 py-3 text-center font-mono text-base text-blue-800">{secret?.password}</code>
      </Modal>
    </div>
  );
};

export default AdminStaff;
