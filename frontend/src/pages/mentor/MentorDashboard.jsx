import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import {
  Users, FolderKanban, CheckCircle2, Clock, AlertTriangle,
  FileCheck2, Calendar, ArrowRight, PlusCircle, CheckSquare
} from 'lucide-react';

const MentorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mentor/dashboard/');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mentor & Team Lead Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Scoped to your assigned interns, project assignments, submissions evaluation, and scheduled reviews.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/mentor/projects"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <FolderKanban className="w-4 h-4" />
            <span>Create Project</span>
          </Link>
          <Link
            to="/mentor/assignments"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Assign Project</span>
          </Link>
        </div>
      </div>

      {/* KPIs Grid (Section 3.2 requirements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Total Assigned Interns */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Assigned Interns</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{kpis.total_assigned_interns}</span>
            <Link to="/mentor/interns" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center">
              View roster <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Active Interns */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Active Interns</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{kpis.active_interns}</span>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              100% active
            </span>
          </div>
        </div>

        {/* Total Projects Assigned */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Assignments</span>
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{kpis.total_projects_assigned}</span>
            <span className="text-xs text-gray-500">To your interns</span>
          </div>
        </div>

        {/* Completed Projects */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Completed Projects</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600">{kpis.completed_projects}</span>
            <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
              Evaluated
            </span>
          </div>
        </div>

        {/* Pending Projects */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Pending Projects</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{kpis.pending_projects}</span>
            <span className="text-xs text-gray-500">In work</span>
          </div>
        </div>

        {/* Overdue Projects */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Overdue Projects</span>
            <div className={`p-2.5 rounded-xl ${kpis.overdue_projects > 0 ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${kpis.overdue_projects > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {kpis.overdue_projects}
            </span>
            <Link to="/mentor/assignments" className="text-xs text-rose-600 hover:text-rose-700 font-medium">
              Review
            </Link>
          </div>
        </div>

        {/* Projects Awaiting Evaluation */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Awaiting Evaluation</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-indigo-600">{kpis.projects_awaiting_evaluation}</span>
            <Link to="/mentor/assignments" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
              Grade now <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Upcoming Presentations */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Upcoming Presentations</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">{kpis.upcoming_presentations}</span>
            <Link to="/mentor/presentations" className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center">
              Calendar <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Access Actions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/mentor/projects"
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
            Project Repository
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Author and manage reusable project guidelines, PDF instructions, and database/API data sources.
          </p>
        </Link>

        <Link
          to="/mentor/assignments"
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            Assignments & Grading
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Assign projects to interns with deadlines, review uploaded submissions, and assign 0-100 scores.
          </p>
        </Link>

        <Link
          to="/mentor/presentations"
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
            Presentation Schedules
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Schedule live Google Meet demo sessions, reschedule timings, or track completion status.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default MentorDashboard;
