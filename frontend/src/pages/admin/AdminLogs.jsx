import React, { useState, useEffect } from 'react';
import api from '../../api/client';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/admin/logs').then(res => {
      const d = res.data?.results ?? res.data;
      setLogs(Array.isArray(d) ? d : []);
    });
  }, []);

  const filtered = logs.filter(l =>
    `${l.actor} ${l.action} ${l.entity} ${l.metadata}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">System Activity & Audit Logs</h1>
        <p className="text-xs text-gray-500 mt-1">
          Every account modification, mentor assignment, project update, submission, evaluation, presentation, note, and certificate decision is recorded.
        </p>
      </div>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Filter logs by user, action, entity, or metadata..."
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm"
      />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-blue-50 uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(l => (
              <tr key={l.id}>
                <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                <td className="px-4 py-2.5 font-semibold text-gray-900">{l.actor} <span className="text-gray-400">({l.role})</span></td>
                <td className="px-4 py-2.5">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-semibold text-blue-700">{l.action}</span>
                </td>
                <td className="px-4 py-2.5 text-gray-700">{l.entity}</td>
                <td className="px-4 py-2.5 font-mono text-gray-500">{l.metadata}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminLogs;
