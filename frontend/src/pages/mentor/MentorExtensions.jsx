import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import { Clock, Check, X, Calendar, AlertCircle } from 'lucide-react';

const MentorExtensions = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Respond Modal
  const [selectedReq, setSelectedReq] = useState(null);
  const [revisedDate, setRevisedDate] = useState('');
  const [mentorNotes, setMentorNotes] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mentor/extensions/');
      setRequests((d => Array.isArray(d) ? d : [])(res.data?.results ?? res.data));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openRespondModal = (req) => {
    setSelectedReq(req);
    setRevisedDate(req.requested_date);
    setMentorNotes('');
  };

  const handleDecision = async (decisionStatus) => {
    if (!selectedReq) return;
    try {
      await api.post(`/mentor/extensions/${selectedReq.id}/respond/`, {
        status: decisionStatus,
        revised_due_date: revisedDate,
        mentor_notes: mentorNotes,
      });
      setSelectedReq(null);
      fetchRequests();
    } catch (err) {
      alert('Error updating extension request.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <h1 className="text-xl font-bold text-gray-900">Project Deadline Extension Requests</h1>
        <p className="text-xs text-gray-500 mt-1">
          Review legitimate date extension justifications from interns and set approved revised deadlines.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading extension requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No extension requests submitted by your interns.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Intern & Project</th>
                  <th className="px-6 py-4">Current Due Date</th>
                  <th className="px-6 py-4">Requested New Date</th>
                  <th className="px-6 py-4">Intern Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{r.intern_name}</div>
                      <div className="text-xs text-emerald-600 font-medium">{r.project_title}</div>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500">
                      {r.current_due_date}
                    </td>

                    <td className="px-6 py-4 text-xs font-bold text-gray-900">
                      {r.requested_date}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-600 max-w-[260px]">
                      <p className="line-clamp-2">{r.reason}</p>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                        r.status === 'REVISION_REJECTED' || r.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {r.status === 'PENDING' ? (
                        <button
                          onClick={() => openRespondModal(r)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        >
                          <span>Review Request</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Decision recorded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      <Modal
        isOpen={!!selectedReq}
        onClose={() => setSelectedReq(null)}
        title="Review Extension Request"
      >
        <div className="space-y-4 text-sm">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
            <div><span className="font-semibold text-gray-700">Intern:</span> {selectedReq?.intern_name}</div>
            <div><span className="font-semibold text-gray-700">Project:</span> {selectedReq?.project_title}</div>
            <div><span className="font-semibold text-gray-700">Current Due Date:</span> {selectedReq?.current_due_date}</div>
            <div><span className="font-semibold text-gray-700">Requested Due Date:</span> {selectedReq?.requested_date}</div>
            <div className="mt-2 pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-700">Intern Reason:</span>
              <p className="text-gray-600 mt-0.5">{selectedReq?.reason}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Revised Due Date (If Approved)
            </label>
            <input
              type="date"
              value={revisedDate}
              onChange={e => setRevisedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Mentor Remarks / Instructions
            </label>
            <textarea
              rows={2}
              value={mentorNotes}
              onChange={e => setMentorNotes(e.target.value)}
              placeholder="e.g. Approved. Please ensure code quality and complete unit tests."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              onClick={() => handleDecision('REJECTED')}
              className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold"
            >
              Reject Request
            </button>
            <button
              onClick={() => handleDecision('APPROVED')}
              className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-semibold"
            >
              Approve & Update Due Date
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MentorExtensions;
