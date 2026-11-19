import React, { useState, useEffect } from 'react';
import api from '../../api/client';

const AdminTemplate = () => {
  const [tpl, setTpl] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/admin/template').then(res => setTpl(res.data));
  }, []);

  if (!tpl) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    await api.put('/admin/template', tpl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Certificate PDF Template Configuration</h1>
        <p className="text-xs text-gray-500 mt-1">
          Configure the organisation name, program title, body wording, authorised signatory, and accent colour used when generating PDF completion certificates.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 bg-white p-6 rounded-2xl border border-gray-100">
        {saved && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-700">
            Certificate template saved! Newly approved certificates will use this configuration.
          </div>
        )}
        <label className="block text-xs font-semibold text-gray-700">
          Organisation Name *
          <input required value={tpl.organisation} onChange={e => setTpl({ ...tpl, organisation: e.target.value })}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        </label>
        <label className="block text-xs font-semibold text-gray-700">
          Program Title *
          <input required value={tpl.programTitle} onChange={e => setTpl({ ...tpl, programTitle: e.target.value })}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        </label>
        <label className="block text-xs font-semibold text-gray-700">
          Completion Body Text *
          <input required value={tpl.bodyText} onChange={e => setTpl({ ...tpl, bodyText: e.target.value })}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-gray-700">
            Authorised Signatory Name *
            <input required value={tpl.signatoryName} onChange={e => setTpl({ ...tpl, signatoryName: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="block text-xs font-semibold text-gray-700">
            Signatory Designation *
            <input required value={tpl.signatoryTitle} onChange={e => setTpl({ ...tpl, signatoryTitle: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="block text-xs font-semibold text-gray-700">
          Accent Hex Colour *
          <input required value={tpl.accentColor} onChange={e => setTpl({ ...tpl, accentColor: e.target.value })}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          Save Template
        </button>
      </form>
    </div>
  );
};

export default AdminTemplate;
