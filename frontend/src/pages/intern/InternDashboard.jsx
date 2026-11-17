import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import {
  GraduationCap, UserCheck, FolderKanban, CheckCircle2,
  Clock, Award, Calendar, ExternalLink, Download, FileText
} from 'lucide-react';

const InternDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/intern/profile/');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { user, summary, assignments, presentations, certificate } = data || {};

  return (
    <div className="space-y-8">
      {/* Top Profile Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-start sm:items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-orange-500/20">
            {user?.first_name ? user.first_name[0] : user?.username[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">{user?.full_name || user?.username}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                Intern
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center space-x-2">
              <span>{user?.email}</span>
              <span>•</span>
              <span>{user?.education_qualification || 'Degree in progress'}</span>
            </p>
            {user?.address && (
              <p className="text-xs text-gray-400 mt-0.5">{user?.address}</p>
            )}
          </div>
        </div>

        {/* Mentor Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[240px]">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Assigned Mentor
          </span>
          {user?.assigned_mentor_name ? (
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">{user.assigned_mentor_name}</div>
                <div className="text-[11px] text-emerald-600 font-medium">Lead Mentor</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-600 font-medium">
              Awaiting mentor assignment by HR
            </div>
          )}
        </div>
      </div>

      {/* Progress & Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">Assigned Projects</span>
          <div className="mt-2 text-2xl font-bold text-gray-900">{summary?.total_assigned || 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">Completed</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{summary?.completed || 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">Average Score</span>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            {summary?.average_score !== null ? `${summary?.average_score}/100` : 'N/A'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">Milestone Progress</span>
          <div className="mt-2 text-2xl font-bold text-purple-600">
            {summary?.completion_percentage || 0}%
          </div>
        </div>
      </div>

      {/* Certificate Status Banner */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-amber-300 backdrop-blur-md mb-3 border border-white/10">
              <Award className="w-3.5 h-3.5" />
              <span>Internship Completion Credential</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">Official Completion Certificate</h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Upon fulfilling project assignments and mentor evaluations, request your certified completion document generated and approved by HR.
            </p>
          </div>

          <div>
            {certificate?.status === 'APPROVED' ? (
              <a
                href={certificate.certificate_file}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Certificate (PDF)</span>
              </a>
            ) : certificate?.status === 'PENDING' ? (
              <div className="px-5 py-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-medium">
                Certificate request submitted • Awaiting HR Manager approval
              </div>
            ) : (
              <Link
                to="/intern/certificate"
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-white text-gray-900 hover:bg-slate-100 font-semibold text-sm transition-all"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>Request Certificate</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Active Projects Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-base flex items-center space-x-2">
            <FolderKanban className="w-4 h-4 text-blue-600" />
            <span>Assigned Projects & Current Status</span>
          </h3>
          <Link to="/intern/projects" className="text-xs font-semibold text-blue-600 hover:underline">
            View All Projects
          </Link>
        </div>

        <div className="space-y-3">
          {(!assignments || assignments.length === 0) ? (
            <p className="text-xs text-gray-400 text-center py-6">No projects assigned yet.</p>
          ) : (
            assignments.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{a.project_title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Assigned: {a.assigned_date} • Due: {a.due_date}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {a.score !== null && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      Score: {a.score}/100
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    a.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                    a.status === 'SUBMITTED' ? 'bg-indigo-50 text-indigo-700' :
                    a.status === 'OVERDUE' ? 'bg-rose-50 text-rose-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InternDashboard;
