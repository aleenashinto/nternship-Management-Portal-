import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import {
  FolderKanban, Upload, Clock, Download, FileText,
  CheckCircle2, AlertTriangle, AlertCircle, Database, Check
} from 'lucide-react';

const InternProjects = () => {
  const [assignments, setAssignments] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit Project Modal
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');

  // Extension Modal
  const [extendingAssignment, setExtendingAssignment] = useState(null);
  const [extensionReason, setExtensionReason] = useState('');
  const [requestedDate, setRequestedDate] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignRes, extRes] = await Promise.all([
        api.get('/intern/assignments/'),
        api.get('/intern/extensions/')
      ]);
      setAssignments(assignRes.data.results || assignRes.data || []);
      setExtensions(extRes.data.results || extRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openSubmitModal = (a) => {
    setSubmittingAssignment(a);
    setSubmissionFile(null);
    setSubmissionNotes(a.submission_notes || '');
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    if (!submittingAssignment) return;
    try {
      const formData = new FormData();
      if (submissionFile) {
        formData.append('submission_file', submissionFile);
      }
      formData.append('submission_notes', submissionNotes);

      await api.post(`/intern/assignments/${submittingAssignment.id}/submit/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSubmittingAssignment(null);
      fetchData();
    } catch (err) {
      alert('Error uploading submission.');
    }
  };

  const openExtensionModal = (a) => {
    setExtendingAssignment(a);
    setExtensionReason('');
    setRequestedDate(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);
  };

  const handleRequestExtension = async (e) => {
    e.preventDefault();
    if (!extendingAssignment) return;
    try {
      await api.post('/intern/extensions/', {
        assignment: extendingAssignment.id,
        reason: extensionReason,
        requested_date: requestedDate,
      });

      setExtendingAssignment(null);
      fetchData();
    } catch (err) {
      alert('Error requesting deadline extension.');
    }
  };

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
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <h1 className="text-xl font-bold text-gray-900">Assigned Projects & Deliverables</h1>
        <p className="text-xs text-gray-500 mt-1">
          Access instructions and datasets, upload solution deliverables, or request due date extensions.
        </p>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading your assigned projects...</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400">
          No projects assigned yet. Your mentor will allocate assignments to your profile.
        </div>
      ) : (
        <div className="space-y-6">
          {assignments.map((a) => {
            const proj = a.project_details || {};
            return (
              <div
                key={a.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 sm:p-8 space-y-6"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold text-gray-900">{a.project_title}</h2>
                      {getStatusBadge(a.status)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Mentor: <span className="font-semibold text-gray-700">{a.mentor_name}</span> •
                      Assigned: {a.assigned_date} • Due Date:{' '}
                      <span className="font-semibold text-gray-900">{a.due_date}</span>
                    </div>
                  </div>

                  {a.score !== null && (
                    <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 text-right">
                      <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                        Final Score
                      </span>
                      <span className="text-xl font-bold text-emerald-800">{a.score}/100</span>
                    </div>
                  )}
                </div>

                {/* Tools Used */}
                {proj.tools_used && proj.tools_used.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {proj.tools_used.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}

                {/* Instructions */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Project Instructions & Guidelines
                  </span>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line font-mono">
                    {proj.instructions || 'Follow guidelines provided by mentor.'}
                  </p>
                </div>

                {/* Data Source & Downloads */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-white">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      Data Source Information ({proj.data_source_type || 'N/A'})
                    </span>
                    <p className="text-xs text-gray-600 font-mono">
                      {proj.data_source_description || 'Standard project dataset provided below.'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    {proj.instruction_pdf && (
                      <a
                        href={proj.instruction_pdf}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
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
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Dataset</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Submission & Feedback Status */}
                {a.submitted_at && (
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-indigo-900 font-semibold">
                      <span>Submitted Solution:</span>
                      <span className="text-[11px] text-indigo-600 font-normal">
                        {new Date(a.submitted_at).toLocaleString()}
                      </span>
                    </div>
                    {a.submission_notes && (
                      <p className="text-gray-600 italic">Notes: "{a.submission_notes}"</p>
                    )}
                    {a.submission_file && (
                      <a
                        href={a.submission_file}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-indigo-700 hover:underline font-semibold pt-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Uploaded Solution File</span>
                      </a>
                    )}
                  </div>
                )}

                {a.evaluation_notes && (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs">
                    <span className="font-semibold text-emerald-900 block mb-0.5">Mentor Evaluation Feedback:</span>
                    <p className="text-emerald-800">{a.evaluation_notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                  <button
                    onClick={() => openExtensionModal(a)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-medium text-gray-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Request Extension</span>
                  </button>

                  <button
                    onClick={() => openSubmitModal(a)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{a.submitted_at ? 'Resubmit Project Files' : 'Upload Completed Project'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Upload Project Submission (Section 4.5 requirement) */}
      <Modal
        isOpen={!!submittingAssignment}
        onClose={() => setSubmittingAssignment(null)}
        title={`Upload Submission: ${submittingAssignment?.project_title}`}
      >
        <form onSubmit={handleSubmitProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Select Completed File (.zip, .pdf, .py, .pbix, .twbx, etc.)
            </label>
            <input
              type="file"
              onChange={e => setSubmissionFile(e.target.files[0])}
              className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Submission Notes / GitHub Repository Link / Dashboard URL
            </label>
            <textarea
              rows={3}
              value={submissionNotes}
              onChange={e => setSubmissionNotes(e.target.value)}
              placeholder="e.g. Repository URL, summary of models tested, and instructions for running the code."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setSubmittingAssignment(null)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
            >
              Submit Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Request Deadline Extension (Section 4.4 requirement) */}
      <Modal
        isOpen={!!extendingAssignment}
        onClose={() => setExtendingAssignment(null)}
        title="Request Submission Date Extension"
      >
        <form onSubmit={handleRequestExtension} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Requested Revised Submission Date *
            </label>
            <input
              type="date"
              required
              value={requestedDate}
              onChange={e => setRequestedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Valid Reason for Extension *
            </label>
            <textarea
              rows={3}
              required
              value={extensionReason}
              onChange={e => setExtensionReason(e.target.value)}
              placeholder="Please provide a clear justification (e.g. academic exams, complex dataset pipeline debugging, illness, etc.)"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setExtendingAssignment(null)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700"
            >
              Submit Extension Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InternProjects;
