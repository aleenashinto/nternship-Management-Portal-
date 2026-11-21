import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { Image as ImageIcon, Palette, Type, Sliders } from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const { branding, publishedTheme } = useTheme();

  useEffect(() => {
    api.get('/admin/dashboard').then(res => setData(res.data)).catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = data.kpis || {};
  const cards = [
    { label: 'Total HR Managers', value: kpis.total_hr },
    { label: 'Total Mentors', value: kpis.total_mentors },
    { label: 'Total Interns', value: kpis.total_interns },
    { label: 'Active Internships', value: kpis.active_internships },
    { label: 'Completed Internships', value: kpis.completed_internships },
    { label: 'Reusable Projects', value: kpis.total_projects },
    { label: 'Completed Assignments', value: `${kpis.completed_assignments} / ${kpis.total_assignments}` },
    { label: 'Pending Cert Approvals', value: kpis.pending_certificates },
    { label: 'Average Evaluation Score', value: `${kpis.avg_score} / 100` },
  ];

  const breakdown = Array.isArray(data.status_breakdown) ? data.status_breakdown : [];
  const total = breakdown.reduce((s, b) => s + (b.value || 0), 0) || 1;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Executive Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform-wide internship lifecycle metrics, completion statistics, branding, and theme governance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/branding"
            className="px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-semibold inline-flex items-center space-x-2 transition-all"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Update Website Logo</span>
          </Link>
          <Link
            to="/admin/theme"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 inline-flex items-center space-x-2 transition-all"
          >
            <Palette className="w-4 h-4" />
            <span>Theme Customization ({publishedTheme?.theme_name || 'Default'})</span>
          </Link>
        </div>
      </div>

      {/* Website Settings Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/branding"
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-blue-300 transition-all flex items-center space-x-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900">Branding & Logo</p>
            <p className="text-[11px] text-gray-500 truncate">{branding?.site_name || 'Beat Internship Portal'}</p>
          </div>
        </Link>

        <Link
          to="/admin/theme"
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-blue-300 transition-all flex items-center space-x-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900">Theme Customization</p>
            <p className="text-[11px] text-gray-500 truncate">Active: {publishedTheme?.theme_name}</p>
          </div>
        </Link>

        <Link
          to="/admin/typography"
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-blue-300 transition-all flex items-center space-x-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Type className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900">Typography</p>
            <p className="text-[11px] text-gray-500 truncate">Font: {publishedTheme?.font_family} ({publishedTheme?.base_font_size})</p>
          </div>
        </Link>

        <Link
          to="/admin/appearance"
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-blue-300 transition-all flex items-center space-x-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900">Appearance Settings</p>
            <p className="text-[11px] text-gray-500 truncate capitalize">Mode: {publishedTheme?.color_mode || 'Light'}</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-gray-900">Project Assignment Status Distribution</h2>
        <div className="space-y-3">
          {breakdown.map((b) => {
            const pct = Math.round(((b.value || 0) / total) * 100);
            return (
              <div key={b.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-700">
                  <span>{b.name}</span>
                  <span>{b.value} ({pct}%)</span>
                </div>
                <div className="w-full h-2.5 bg-blue-50 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
