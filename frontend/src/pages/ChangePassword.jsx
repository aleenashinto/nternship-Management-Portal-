import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { KeyRound, ShieldAlert, CheckCircle2, AlertCircle, Lock, LogOut } from 'lucide-react';

const ChangePassword = () => {
  const { user, updateUserSession, logout } = useAuth();
  const { branding } = useTheme();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }
    if (currentPassword && newPassword === currentPassword) {
      setError('New password must be different from your temporary initial password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      const updatedUser = res.data?.user || {
        ...user,
        must_change_password: false,
        mustChangePassword: false,
      };
      updateUserSession(updatedUser);
      setSuccess('Password updated successfully! Redirecting to your dashboard...');

      setTimeout(() => {
        if (updatedUser.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
        else if (updatedUser.role === 'HR') navigate('/hr/dashboard', { replace: true });
        else if (updatedUser.role === 'MENTOR') navigate('/mentor/dashboard', { replace: true });
        else navigate('/intern/dashboard', { replace: true });
      }, 900);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Could not update password. Ensure your current temporary password is correct.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-7 text-white text-center">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl px-4 py-2 mb-3 shadow-sm">
            <img
              src={branding?.primary_logo || '/beat-logo.png'}
              alt={branding?.site_name || 'Beat'}
              className="h-8 w-auto object-contain"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Set Your Permanent Password</h1>
          <p className="text-blue-100 text-xs mt-1">
            First-login security requirement for <strong>@{user?.username}</strong>
          </p>
        </div>

        <div className="p-8 space-y-5">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-2.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Temporary Credential Active:</strong> You logged in with an HR-generated temporary password. Please create a strong permanent password (min. 8 characters) to access your dashboard.
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Current Temporary Password *
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your temporary password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-600 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                New Permanent Password *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-600 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-600 bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>{submitting ? 'Updating Password...' : 'Update Password & Continue'}</span>
            </button>
          </form>

          <div className="pt-3 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-500 hover:text-rose-600"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
