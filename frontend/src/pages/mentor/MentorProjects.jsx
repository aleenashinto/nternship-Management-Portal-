import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import {
  FolderKanban, Plus, Edit, FileText, Database, Code2,
  Paperclip, ExternalLink, Check, Search, Download
} from 'lucide-react';

const AVAILABLE_TOOLS = ['Excel', 'SQL', 'Power BI', 'Tableau', 'Python', 'Other'];

const MentorProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [form, setForm] = useState({
    title: '',
    tools_used: [],
    instructions: '',
    data_source_type: 'DATABASE',
    data_source_description: '',
  });
  const [instructionPdf, setInstructionPdf] = useState(null);
  const [dataSourceFile, setDataSourceFile] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mentor/projects/');
      setProjects(res.data.results || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setForm({
      title: '',
      tools_used: ['Python', 'SQL'],
      instructions: '',
      data_source_type: 'DATABASE',
      data_source_description: '',
    });
    setInstructionPdf(null);
    setDataSourceFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (proj) => {
    setEditingProject(proj);
    setForm({
      title: proj.title,
      tools_used: proj.tools_used || [],
      instructions: proj.instructions,
      data_source_type: proj.data_source_type,
      data_source_description: proj.data_source_description || '',
    });
    setInstructionPdf(null);
    setDataSourceFile(null);
    setIsModalOpen(true);
  };

  const toggleTool = (tool) => {
    const current = [...form.tools_used];
    const idx = current.indexOf(tool);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(tool);
    }
    setForm({ ...form, tools_used: current });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('instructions', form.instructions);
      formData.append('data_source_type', form.data_source_type);
      formData.append('data_source_description', form.data_source_description);
      formData.append('tools_used', JSON.stringify(form.tools_used));

      if (instructionPdf) {
        formData.append('instruction_pdf', instructionPdf);
      }
      if (dataSourceFile) {
        formData.append('data_source_file', dataSourceFile);
      }

      if (editingProject) {
        await api.patch(`/mentor/projects/${editingProject.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/mentor/projects/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      alert('Error saving project. Please check the inputs.');
    }
  };

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.instructions.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Project Guidelines & Dataset Repository</h1>
          <p className="text-xs text-gray-500 mt-1">
            Create reusable project templates, define required tools (Excel, SQL, Power BI, Python, etc.), and attach PDF instructions.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Project</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-gray-400 ml-2" />
        <input
          type="text"
          placeholder="Search by project title, requirements, or tools..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full text-sm outline-none bg-transparent"
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading project templates...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400">
          No projects found. Click "Create New Project" to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-900 text-base leading-snug">
                    {proj.title}
                  </h3>
                  <button
                    onClick={() => openEditModal(proj)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="Edit Project"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                {/* Tools Used Badges */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(proj.tools_used || []).map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100"
                    >
                      {tool}
                    </span>
                  ))}
                </div>

                {/* Instructions preview */}
                <div className="mt-4">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Instructions & Guidelines
                  </span>
                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed whitespace-pre-line">
                    {proj.instructions}
                  </p>
                </div>

                {/* Data Source details */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center text-gray-700 font-semibold mb-1">
                    <Database className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                    <span>Data Source ({proj.data_source_type}):</span>
                  </div>
                  <p className="text-gray-600 font-mono text-[11px] break-all">
                    {proj.data_source_description || 'Standard provided dataset / file attachment.'}
                  </p>
                </div>
              </div>

              {/* Attachments / Download Footer */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  {proj.instruction_pdf && (
                    <a
                      href={proj.instruction_pdf}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-blue-600 hover:underline font-medium"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Instruction PDF</span>
                    </a>
                  )}
                  {proj.data_source_file && (
                    <a
                      href={proj.data_source_file}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-emerald-600 hover:underline font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Dataset</span>
                    </a>
                  )}
                </div>

                <span className="text-[11px] text-gray-400">
                  {proj.active_assignments_count || 0} active assignments
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create / Edit Project */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? "Edit Project Template" : "Create New Project"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Project Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              placeholder="e.g. Financial Portfolio Risk & Monte Carlo Stress Testing"
            />
          </div>

          {/* Multiple Tools Selection (Section 3.3 requirement) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Tools Used (Select multiple) *
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TOOLS.map(tool => {
                const isSelected = form.tools_used.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{tool}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Project Instructions & Guidelines *</label>
            <textarea
              rows={4}
              required
              value={form.instructions}
              onChange={e => setForm({ ...form, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono text-xs"
              placeholder="1. Step-by-step deliverables...&#10;2. Specific KPIs or algorithms...&#10;3. Final presentation format..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Data Source Type *</label>
              <select
                value={form.data_source_type}
                onChange={e => setForm({ ...form, data_source_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
              >
                <option value="DATABASE">Database / SQL Connection</option>
                <option value="API">API Endpoint</option>
                <option value="FILE">File Upload / Dataset</option>
                <option value="TEXT">Text Description</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Instruction Document (PDF)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={e => setInstructionPdf(e.target.files[0])}
                className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Data Source Details (API URL / Database Credentials / Notes)
            </label>
            <textarea
              rows={2}
              value={form.data_source_description}
              onChange={e => setForm({ ...form, data_source_description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono text-xs"
              placeholder="e.g. Host: db.internship.local:5432 / DB: analytics_2026 / Table: transactions"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Dataset File Upload (Optional)</label>
            <input
              type="file"
              onChange={e => setDataSourceFile(e.target.files[0])}
              className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700"
            >
              {editingProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MentorProjects;
