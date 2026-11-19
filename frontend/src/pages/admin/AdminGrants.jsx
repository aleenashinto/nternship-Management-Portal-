import React, { useState, useEffect } from 'react';
import api from '../../api/client';

const AdminGrants = () => {
  const [grants, setGrants] = useState([]);
  const [owner, setOwner] = useState('David Miller (mentor@portal.example.com)');
  const [grantee, setGrantee] = useState('Noah Mentor (noah.mentor@portal.example.com)');

  const load = () => {
    api.get('/admin/grants').then(res => {
      const d = res.data?.results ?? res.data;
      setGrants(Array.isArray(d) ? d : []);
    });
  };

  useEffect(() => { load(); }, []);

  const handleGrant = async (e) => {
    e.preventDefault();
    if (owner === grantee) return;
    await api.post('/admin/grants', { owner_name: owner, grantee_name: grantee });
    load();
  };

  const handleRevoke = async (id) => {
    await api.delete('/admin/grants', { data: { id } });
    load();
  };

  const mentors = [
    'David Miller (mentor@portal.example.com)',
    'Noah Mentor (noah.mentor@portal.example.com)',
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Cross-Mentor Access Grants</h1>
        <p className="text-xs text-gray-500 mt-1">
          Authorise a mentor (Grantee) to view the interns assigned to another mentor (Owner).
        </p>
      </div>

      <form onSubmit={handleGrant} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-gray-100">
        <label className="block text-xs font-semibold text-gray-700">
          Intern Owner (Mentor)
          <select value={owner} onChange={e => setOwner(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
            {mentors.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold text-gray-700">
          Authorised Viewer (Grantee Mentor)
          <select value={grantee} onChange={e => setGrantee(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
            {mentors.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Grant Cross-Mentor Access
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-blue-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Grantee (Can View)</th>
              <th className="px-4 py-3">Owner&apos;s Interns</th>
              <th className="px-4 py-3">Granted On</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {grants.map(g => (
              <tr key={g.id}>
                <td className="px-4 py-3 font-semibold text-gray-900">{g.grantee_name}</td>
                <td className="px-4 py-3 text-gray-700">{g.owner_name}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(g.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleRevoke(g.id)} className="text-xs font-semibold text-red-600 hover:underline">
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminGrants;
