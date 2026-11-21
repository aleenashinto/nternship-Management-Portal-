import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GraduationCap, Shield, Award, Briefcase, KeyRound, AlertCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { branding } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const userData = await login(username, password);
      if (userData.role === 'ADMIN') navigate('/admin/dashboard');
      else if (userData.role === 'HR') navigate('/hr/dashboard');
      else if (userData.role === 'MENTOR') navigate('/mentor/dashboard');
      else if (userData.role === 'INTERN') navigate('/intern/dashboard');
      else navigate('/hr/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDemoCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/60 to-blue-100/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-blue-500/5 border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-8 text-white text-center">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl px-5 py-2 mb-3 shadow-md">
            <img
              src={branding?.primary_logo || '/beat-logo.png'}
              alt={branding?.site_name || 'Beat'}
              className="h-10 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {branding?.site_name || 'Internship Portal'}
          </h1>
          <p className="text-blue-100 text-xs mt-1">Role-Based Internship Management System</p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'Signing in...' : 'Sign In to Portal'}</span>
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center mb-3">
              One-Click Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials('hr_manager', 'hr123')}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-left transition-all group"
              >
                <div className="flex items-center space-x-1.5 text-blue-600 font-semibold mb-0.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>HR Manager</span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono">hr_manager / hr123</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('lead_mentor', 'mentor123')}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all group"
              >
                <div className="flex items-center space-x-1.5 text-emerald-600 font-semibold mb-0.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Mentor (Lead)</span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono">lead_mentor / mentor123</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('intern_emma', 'intern123')}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-amber-50 hover:border-amber-300 text-left transition-all group"
              >
                <div className="flex items-center space-x-1.5 text-amber-600 font-semibold mb-0.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Intern (Emma)</span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono">intern_emma / intern123</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('admin', 'admin123')}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-purple-50 hover:border-purple-300 text-left transition-all group"
              >
                <div className="flex items-center space-x-1.5 text-purple-600 font-semibold mb-0.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Administrator</span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono">admin / admin123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
