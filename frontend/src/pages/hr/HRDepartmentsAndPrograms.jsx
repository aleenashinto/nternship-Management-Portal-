import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/client';
import Modal from '../../components/Modal';
import {
  Building2, BookOpen, Plus, Pencil, Trash2, CheckCircle2, AlertCircle
} from 'lucide-react';

const HRDepartmentsAndPrograms = ({ initialView = 'departments' }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.pathname.includes('/programs') ? 'programs' : initialView
  );

  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Department Modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    description: '',
    head_of_department: 'David Miller',
  });

  // Program Modal
  const [isProgModalOpen, setIsProgModalOpen] = useState(false);
  const [editingProg, setEditingProg] = useState(null);
  const [progForm, setProgForm] = useState({
    title: '',
    code: '',
    department: 'Data Analytics',
    duration_weeks: 12,
    description: '',
    skills_covered: 'Python, SQL, Power BI, Excel',
  });

  useEffect(() => {
    if (location.pathname.includes('/programs')) {
      setActiveTab('programs');
    } else if (location.pathname.includes('/departments')) {
      setActiveTab('departments');
    }
  }, [location.pathname]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [dRes, pRes] = await Promise.all([
        api.get('/hr/departments/'),
        api.get('/hr/programs/'),
      ]);
      setDepartments(Array.isArray(dRes.data?.results ?? dRes.data) ? (dRes.data?.results ?? dRes.data) : []);
      setPrograms(Array.isArray(pRes.data?.results ?? pRes.data) ? (pRes.data?.results ?? pRes.data) : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSaveDept = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await api.patch(`/hr/departments/${editingDept.id}/`, deptForm);
        showToast('success', `Updated department "${deptForm.name}".`);
      } else {
        await api.post('/hr/departments/', deptForm);
        showToast('success', `Created department "${deptForm.name}".`);
      }
      setIsDeptModalOpen(false);
      setEditingDept(null);
      fetchAll();
    } catch {
      showToast('error', 'Failed to save department.');
    }
  };

  const handleDeleteDept = async (dept) => {
    try {
      await api.delete(`/hr/departments/${dept.id}/`);
      showToast('success', `Deleted department "${dept.name}".`);
      fetchAll();
    } catch {
      showToast('error', 'Failed to delete department.');
    }
  };

  const handleSaveProg = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...progForm,
        duration_weeks: Number(progForm.duration_weeks) || 12,
        skills_covered: String(progForm.skills_covered || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (editingProg) {
        await api.patch(`/hr/programs/${editingProg.id}/`, payload);
        showToast('success', `Updated internship program "${progForm.title}".`);
      } else {
        await api.post('/hr/programs/', payload);
        showToast('success', `Created internship program "${progForm.title}".`);
      }
      setIsProgModalOpen(false);
      setEditingProg(null);
      fetchAll();
    } catch {
      showToast('error', 'Failed to save internship program.');
    }
  };

  const handleDeleteProg = async (prog) => {
    try {
      await api.delete(`/hr/programs/${prog.id}/`);
      showToast('success', `Deleted program "${prog.title}".`);
      fetchAll();
    } catch {
      showToast('error', 'Failed to delete program.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            HR Management • Academic & Cohort Structure
          </span>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            {activeTab === 'departments' ? 'Intern Departments' : 'Internship Programs'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage organizational departments and structured internship tracks used across manual onboarding and bulk CSV/Excel imports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('departments')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 ${
                activeTab === 'departments'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Departments ({departments.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('programs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 ${
                activeTab === 'programs'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Programs ({programs.length})</span>
            </button>
          </div>

          {activeTab === 'departments' ? (
            <button
              type="button"
              onClick={() => {
                setEditingDept(null);
                setDeptForm({ name: '', code: '', description: '', head_of_department: 'David Miller' });
                setIsDeptModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingProg(null);
                setProgForm({
                  title: '',
                  code: '',
                  department: departments[0]?.name || 'Data Analytics',
                  duration_weeks: 12,
                  description: '',
                  skills_covered: 'Python, SQL, Power BI',
                });
                setIsProgModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Program</span>
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div
          className={`p-4 rounded-2xl border flex items-center space-x-2 text-xs font-medium ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500 text-sm">
          Loading records...
        </div>
      ) : activeTab === 'departments' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div
              key={d.id}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold bg-blue-50 text-blue-700">
                    {d.code || 'DEPT'}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {d.intern_count ?? 0} Interns
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mt-2">{d.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{d.description || 'Active internship department'}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Lead: <strong className="text-gray-800">{d.head_of_department || 'David Miller'}</strong>
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDept(d);
                      setDeptForm({
                        name: d.name,
                        code: d.code || '',
                        description: d.description || '',
                        head_of_department: d.head_of_department || 'David Miller',
                      });
                      setIsDeptModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDept(d)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map((p) => (
            <div
              key={p.id}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold bg-purple-50 text-purple-700">
                    {p.code || 'PROG'}
                  </span>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {p.duration_weeks} Weeks • {p.department_name || p.department}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mt-2">{p.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{p.description}</p>
                {Array.isArray(p.skills_covered) && p.skills_covered.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.skills_covered.map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProg(p);
                    setProgForm({
                      title: p.title,
                      code: p.code || '',
                      department: p.department_name || p.department || 'Data Analytics',
                      duration_weeks: p.duration_weeks || 12,
                      description: p.description || '',
                      skills_covered: Array.isArray(p.skills_covered)
                        ? p.skills_covered.join(', ')
                        : p.skills_covered || '',
                    });
                    setIsProgModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-xs font-semibold text-gray-700 hover:text-blue-700 inline-flex items-center space-x-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProg(p)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 inline-flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add/Edit Department */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title={editingDept ? `Edit Department: ${editingDept.name}` : 'Add Intern Department'}
      >
        <form onSubmit={handleSaveDept} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Department Name *</label>
              <input
                type="text"
                required
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="e.g. Data Analytics"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Department Code *</label>
              <input
                type="text"
                required
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g. DATA"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm uppercase"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Head of Department</label>
            <input
              type="text"
              value={deptForm.head_of_department}
              onChange={(e) => setDeptForm({ ...deptForm, head_of_department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDeptModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600"
            >
              Save Department
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add/Edit Program */}
      <Modal
        isOpen={isProgModalOpen}
        onClose={() => setIsProgModalOpen(false)}
        title={editingProg ? `Edit Program: ${editingProg.title}` : 'Add Internship Program'}
      >
        <form onSubmit={handleSaveProg} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Program Title *</label>
              <input
                type="text"
                required
                value={progForm.title}
                onChange={(e) => setProgForm({ ...progForm, title: e.target.value })}
                placeholder="e.g. Data Analytics Cohort"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Program Code *</label>
              <input
                type="text"
                required
                value={progForm.code}
                onChange={(e) => setProgForm({ ...progForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g. PROG-DA"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm uppercase"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
              <select
                value={progForm.department}
                onChange={(e) => setProgForm({ ...progForm, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id || d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Duration (Weeks)</label>
              <input
                type="number"
                min={1}
                max={52}
                value={progForm.duration_weeks}
                onChange={(e) => setProgForm({ ...progForm, duration_weeks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Skills Covered (comma-separated)
            </label>
            <input
              type="text"
              value={progForm.skills_covered}
              onChange={(e) => setProgForm({ ...progForm, skills_covered: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={progForm.description}
              onChange={(e) => setProgForm({ ...progForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsProgModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600"
            >
              Save Program
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HRDepartmentsAndPrograms;
