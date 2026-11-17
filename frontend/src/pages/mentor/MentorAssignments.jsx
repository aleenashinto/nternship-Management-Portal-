import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import {
  FileCheck2, Plus, Download, FileText, CheckCircle2,
  Clock, AlertTriangle, MessageSquare, Award, Check, X, Filter
} from 'lucide-react';

const MentorAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    project: '',
    intern: '',
    assigned_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });

  // Evaluate Modal
  const [evaluatingAssignment, setEvaluatingAssignment] = useState(null);
  const [evalForm, setEvalForm] = useState({
    score: 90,
    evaluation_notes: '',
    mark_completed: true,
    request_revision: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignRes, projRes, internRes] = await Promise.all([
        api.get('/mentor/assignments/'),
        api.get('/mentor/projects/'),
        api.get('/mentor/interns/')
      ]);
      setAssignments(assignRes.data.results || assignRes.data || []);
      setProjects(projRes.data.results || projRes.data || []);
      setInterns(internRes.data.results || internRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/mentor/assignments/', assignForm);
      setIsAssignModalOpen(false);
      setAssignForm({
        project: '',
        intern: '',
        assigned_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      });
      fetchData();
    } catch (err) {
      alert('Error creating project assignment.');
    }
  };

  const openEvaluateModal = (assignment) => {
    setEvaluatingAssignment(assignment);
    setEvalForm({
      score: assignment.score !== null ? assignment.score : 85,
      evaluation_notes: assignment.evaluation_notes || '',
      mark_completed: assignment.status === 'COMPLETED' || true,
      request_revision: false,
    });
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!evaluatingAssignment) return;
    try {
      await api.post(`/mentor/assignments/${evaluatingAssignment.id}/evaluate/`, evalForm);
      setEvaluatingAssignment(null);
      fetchData();
    } catch (err) {
      alert('Error submitting evaluation.');
    }
  };

  const filtered = assignments.filter(a => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">Completed</span>;
      case 'SUBMITTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">Under Review</span>;
      case 'REVISION_REQUIRED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">Revision Required</span>;
      case 'OVERDUE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">Overdue</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">In Progress</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Project Assignments & Evaluation</h1>
          <p className="text-xs text-gray-500 mt-1">
            Assign projects to individual interns with deadlines, track submissions, and evaluate performance scores.
          </p>
        </div>
        <button
          onClick={() => setIsAssignModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Assign Project to Intern</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold w-fit">
        {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUIRED', 'COMPLETED', 'OVERDUE'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === st ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading assignments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No project assignments found for this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Project & Intern</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Status & Score</th>
                  <th className="px-6 py-4">Submission Details</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{a.project_title}</div>
                      <div className="text-xs text-emerald-700 font-medium mt-0.5">
                        Intern: {a.intern_name}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs space-y-1">
                      <div className="text-gray-500">Assigned: {a.assigned_date}</div>
                      <div className="text-gray-900 font-semibold">Due: {a.due_date}</div>
                    </td>

                    <td className="px-6 py-4">
                      {getStatusBadge(a.status)}
                      {a.score !== null && (
                        <div className="text-xs font-bold text-gray-900 mt-1">
                          Score: {a.score}/100
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs">
                      {a.submitted_at ? (
                        <div>
                          <div className="text-gray-500">
                            Submitted on {new Date(a.submitted_at).toLocaleDateString()}
                          </div>
                          {a.submission_file && (
                            <a
                              href={a.submission_file}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-blue-600 hover:underline mt-1 font-semibold"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download Solution File</span>
                            </a>
                          )}
                          {a.submission_notes && (
                            <p className="text-gray-500 italic mt-0.5 line-clamp-1">
                              "{a.submission_notes}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No submission yet</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEvaluateModal(a)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{a.score !== null ? 'Re-Evaluate' : 'Evaluate'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Assign Project (Section 3.7 requirement) */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Project to Intern"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Project *</label>
            <select
              required
              value={assignForm.project}
              onChange={e => setAssignForm({ ...assignForm, project: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
            >
              <option value="">-- Choose Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Assigned Intern *</label>
            <select
              required
              value={assignForm.intern}
              onChange={e => setAssignForm({ ...assignForm, intern: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
            >
              <option value="">-- Choose Intern --</option>
              {interns.map(i => (
                <option key={i.id} value={i.id}>{i.full_name || i.username} ({i.email})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Date *</label>
              <input
                type="date"
                required
                value={assignForm.assigned_date}
                onChange={e => setAssignForm({ ...assignForm, assigned_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={assignForm.due_date}
                onChange={e => setAssignForm({ ...assignForm, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Evaluate Project (Section 3.11 requirement) */}
      <Modal
        isOpen={!!evaluatingAssignment}
        onClose={() => setEvaluatingAssignment(null)}
        title={`Evaluate: ${evaluatingAssignment?.project_title}`}
      >
        <form onSubmit={handleEvaluate} className="space-y-4">
          <p className="text-xs text-gray-600">
            Evaluating work submitted by{' '}
            <span className="font-semibold text-gray-900">{evaluatingAssignment?.intern_name}</span>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Score (0 to 100 Marks) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              required
              value={evalForm.score}
              onChange={e => setEvalForm({ ...evalForm, score: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mentor Evaluation Remarks & Feedback
            </label>
            <textarea
              rows={3}
              value={evalForm.evaluation_notes}
              onChange={e => setEvalForm({ ...evalForm, evaluation_notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              placeholder="e.g. Excellent presentation of customer cohorts. Code is modular and well-documented."
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="status_action"
                checked={evalForm.mark_completed}
                onChange={() => setEvalForm({ ...evalForm, mark_completed: true, request_revision: false })}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-emerald-800">
                Mark Project as Completed (Fulfills criteria)
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="status_action"
                checked={evalForm.request_revision}
                onChange={() => setEvalForm({ ...evalForm, mark_completed: false, request_revision: true })}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs font-semibold text-amber-800">
                Request Revision (Intern must fix issues & resubmit)
              </span>
            </label>
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setEvaluatingAssignment(null)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700"
            >
              Submit Evaluation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MentorAssignments;
