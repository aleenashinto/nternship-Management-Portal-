import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';

// HR Pages
import HRDashboard from './pages/hr/HRDashboard';
import MentorsList from './pages/hr/MentorsList';
import InternsList from './pages/hr/InternsList';
import CertificatesList from './pages/hr/CertificatesList';
import HRImportInterns from './pages/hr/HRImportInterns';
import HRImportHistory from './pages/hr/HRImportHistory';
import HRDepartmentsAndPrograms from './pages/hr/HRDepartmentsAndPrograms';

// Mentor Pages
import MentorDashboard from './pages/mentor/MentorDashboard';
import MentorProjects from './pages/mentor/MentorProjects';
import MentorInterns from './pages/mentor/MentorInterns';
import MentorAssignments from './pages/mentor/MentorAssignments';
import MentorExtensions from './pages/mentor/MentorExtensions';
import MentorPresentations from './pages/mentor/MentorPresentations';

// Intern Pages
import InternDashboard from './pages/intern/InternDashboard';
import InternProjects from './pages/intern/InternProjects';
import InternPresentations from './pages/intern/InternPresentations';
import InternCertificate from './pages/intern/InternCertificate';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStaff from './pages/admin/AdminStaff';
import AdminGrants from './pages/admin/AdminGrants';
import AdminTemplate from './pages/admin/AdminTemplate';
import AdminLogs from './pages/admin/AdminLogs';
import AdminBranding from './pages/admin/AdminBranding';
import AdminTheme from './pages/admin/AdminTheme';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'HR') return <Navigate to="/hr/dashboard" replace />;
  if (user.role === 'MENTOR') return <Navigate to="/mentor/dashboard" replace />;
  if (user.role === 'INTERN') return <Navigate to="/intern/dashboard" replace />;
  return <Navigate to="/hr/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Authenticated Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                {/* Admin Module */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/staff" element={<AdminStaff />} />
                <Route path="/admin/users" element={<AdminStaff />} />
                <Route path="/admin/grants" element={<AdminGrants />} />
                <Route path="/admin/template" element={<AdminTemplate />} />
                <Route path="/admin/logs" element={<AdminLogs />} />
                <Route path="/admin/branding" element={<AdminBranding />} />
                <Route path="/admin/theme" element={<AdminTheme initialSection="presets" />} />
                <Route path="/admin/typography" element={<AdminTheme initialSection="typography" />} />
                <Route path="/admin/appearance" element={<AdminTheme initialSection="appearance" />} />

              {/* HR Module */}
              <Route path="/hr" element={<HRDashboard />} />
              <Route path="/hr/dashboard" element={<HRDashboard />} />
              <Route path="/hr/mentors" element={<MentorsList />} />
              <Route path="/hr/interns" element={<InternsList />} />
              <Route path="/hr/interns/add" element={<InternsList standaloneAddMode={true} />} />
              <Route path="/hr/interns/import" element={<HRImportInterns />} />
              <Route path="/hr/departments" element={<HRDepartmentsAndPrograms initialView="departments" />} />
              <Route path="/hr/programs" element={<HRDepartmentsAndPrograms initialView="programs" />} />
              <Route path="/hr/import-history" element={<HRImportHistory />} />
              <Route path="/hr/certificates" element={<CertificatesList />} />

              {/* Mentor Module */}
              <Route path="/mentor" element={<MentorDashboard />} />
              <Route path="/mentor/dashboard" element={<MentorDashboard />} />
              <Route path="/mentor/projects" element={<MentorProjects />} />
              <Route path="/mentor/interns" element={<MentorInterns />} />
              <Route path="/mentor/assignments" element={<MentorAssignments />} />
              <Route path="/mentor/extensions" element={<MentorExtensions />} />
              <Route path="/mentor/presentations" element={<MentorPresentations />} />

              {/* Intern Module */}
              <Route path="/intern" element={<InternDashboard />} />
              <Route path="/intern/dashboard" element={<InternDashboard />} />
              <Route path="/intern/projects" element={<InternProjects />} />
              <Route path="/intern/assignments" element={<InternProjects />} />
              <Route path="/intern/presentations" element={<InternPresentations />} />
              <Route path="/intern/certificate" element={<InternCertificate />} />
            </Route>
          </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
