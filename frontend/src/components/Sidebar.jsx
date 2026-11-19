import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, UserCheck, Award, FolderKanban,
  FileCheck2, Clock, Calendar, GraduationCap, FileText
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const hrLinks = [
    { to: '/hr/dashboard', label: 'HR Dashboard', icon: LayoutDashboard },
    { to: '/hr/mentors', label: 'Mentor Accounts', icon: UserCheck },
    { to: '/hr/interns', label: 'Intern Registry', icon: Users },
    { to: '/hr/certificates', label: 'Certificate Approvals', icon: Award },
  ];

  const mentorLinks = [
    { to: '/mentor/dashboard', label: 'Mentor Dashboard', icon: LayoutDashboard },
    { to: '/mentor/projects', label: 'Create Projects', icon: FolderKanban },
    { to: '/mentor/interns', label: 'My Interns', icon: Users },
    { to: '/mentor/assignments', label: 'Project Assignments & Eval', icon: FileCheck2 },
    { to: '/mentor/extensions', label: 'Extension Requests', icon: Clock },
    { to: '/mentor/presentations', label: 'Presentation Schedules', icon: Calendar },
  ];

  const internLinks = [
    { to: '/intern/dashboard', label: 'My Profile & Stats', icon: GraduationCap },
    { to: '/intern/projects', label: 'Assigned Projects', icon: FolderKanban },
    { to: '/intern/presentations', label: 'My Presentations', icon: Calendar },
    { to: '/intern/certificate', label: 'My Certificate', icon: Award },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/staff', label: 'HR & Mentor Accounts', icon: UserCheck },
    { to: '/admin/grants', label: 'Cross-Mentor Grants', icon: Users },
    { to: '/admin/template', label: 'Certificate Template', icon: FileText },
    { to: '/admin/logs', label: 'Activity Audit Logs', icon: Clock },
  ];

  const getLinks = () => {
    if (role === 'HR') return hrLinks;
    if (role === 'MENTOR') return mentorLinks;
    if (role === 'INTERN') return internLinks;
    if (role === 'ADMIN') {
      return [
        { header: 'Admin Module' },
        ...adminLinks,
        { header: 'HR Module' },
        ...hrLinks,
        { header: 'Mentor Module' },
        ...mentorLinks,
        { header: 'Intern Module' },
        ...internLinks,
      ];
    }
    return [];
  };

  const navClass = ({ isActive }) =>
    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
        : 'text-gray-600 hover:bg-slate-100 hover:text-gray-900'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden backdrop-blur-2xs"
        />
      )}

      <aside
        className={`fixed lg:static top-16 bottom-0 left-0 w-64 bg-white border-r border-gray-200 z-40 transition-transform duration-200 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6">
          <div className="space-y-1">
            {getLinks().map((item, idx) => {
              if (item.header) {
                return (
                  <div key={idx} className="pt-4 pb-1 px-3 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                    {item.header}
                  </div>
                );
              }
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose && onClose()}
                  className={navClass}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="pt-4 border-t border-gray-100 px-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Active Session
              </span>
              <p className="text-xs font-medium text-gray-800 truncate">
                {user.full_name || user.username}
              </p>
              <p className="text-[11px] text-gray-400 capitalize">
                Role: {(user.role || '').toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
