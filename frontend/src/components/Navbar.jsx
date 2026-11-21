import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationDropdown from './NotificationDropdown';
import { LogOut, GraduationCap, Shield, Briefcase, Award } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { branding, theme } = useTheme();

  const isDarkHeader =
    theme?.color_mode === 'dark' ||
    (theme?.header_color && theme.header_color.toLowerCase() !== '#ffffff' && theme.header_color.toLowerCase() !== '#f8fafc');

  const activeDesktopLogo = isDarkHeader
    ? branding?.dark_logo || branding?.primary_logo || '/beat-logo.png'
    : branding?.primary_logo || '/beat-logo.png';

  const activeMobileLogo = branding?.mobile_logo || activeDesktopLogo;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3" />
            <span>Admin</span>
          </span>
        );
      case 'HR':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            <Award className="w-3 h-3" />
            <span>HR Manager</span>
          </span>
        );
      case 'MENTOR':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
            <Briefcase className="w-3 h-3" />
            <span>Mentor (Team Lead)</span>
          </span>
        );
      case 'INTERN':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            <GraduationCap className="w-3 h-3" />
            <span>Intern</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header
      className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-xs transition-colors"
      style={{
        backgroundColor: 'var(--color-header, #ffffff)',
        borderColor: 'var(--color-border, #e2e8f0)',
      }}
    >
      {/* Brand logo & mobile toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          title="Toggle Navigation"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center space-x-2">
          <img
            src={activeDesktopLogo}
            alt={branding?.site_name || 'Beat'}
            className="hidden sm:block h-9 w-auto object-contain"
          />
          <img
            src={activeMobileLogo}
            alt={branding?.site_name || 'Beat'}
            className="sm:hidden h-8 w-auto object-contain"
          />
          <div>
            <span className="hidden md:inline-block font-semibold text-gray-700 tracking-tight text-sm border-l border-gray-200 pl-3">
              {branding?.site_name || 'Internship Portal'}
            </span>
            <span className="hidden sm:inline-block ml-2 text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              v1.0
            </span>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {user && (
          <>
            <NotificationDropdown />

            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-gray-800 leading-tight">
                  {user.full_name || user.username}
                </span>
                <span className="text-[11px] text-gray-500">
                  {user.email || user.username}
                </span>
              </div>

              {getRoleBadge(user.role)}

              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
