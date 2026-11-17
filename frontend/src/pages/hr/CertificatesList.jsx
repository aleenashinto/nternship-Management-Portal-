import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import { Award, Check, X, Download, FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const CertificatesList = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [rejectModalCert, setRejectModalCert] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hr/certificates/');
      setCertificates((d => Array.isArray(d) ? d : [])(res.data?.results ?? res.data));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleApprove = async (certId) => {
    try {
      await api.post(`/hr/certificates/${certId}/approve/`);
      fetchCertificates();
    } catch (e) {
      alert('Error approving certificate.');
    }
  };

  const handleReject = async () => {
    if (!rejectModalCert) return;
    try {
      await api.post(`/hr/certificates/${rejectModalCert.id}/reject/`, {
        reason: rejectReason || 'Internship criteria not fulfilled'
      });
      setRejectModalCert(null);
      setRejectReason('');
      fetchCertificates();
    } catch (e) {
      alert('Error rejecting certificate.');
    }
  };

  const filteredCerts = certificates.filter(c => {
    if (activeTab === 'PENDING') return c.status === 'PENDING';
    if (activeTab === 'APPROVED') return c.status === 'APPROVED';
    if (activeTab === 'REJECTED') return c.status === 'REJECTED';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Certificate Approval & Governance</h1>
          <p className="text-xs text-gray-500 mt-1">
            Review completed internship criteria, approve official PDF completion certificates, or request further project work.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === tab ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading certificate records...</div>
        ) : filteredCerts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No certificate requests found for this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Intern</th>
                  <th className="px-6 py-4">Status & Certificate #</th>
                  <th className="px-6 py-4">Completed Projects</th>
                  <th className="px-6 py-4">Request Date</th>
                  <th className="px-6 py-4">Approval Details</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{cert.intern_name}</div>
                      <div className="text-xs text-gray-400 font-mono">{cert.intern_email}</div>
                    </td>

                    <td className="px-6 py-4">
                      {cert.status === 'APPROVED' ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Approved
                          </span>
                          <div className="text-[11px] font-mono text-gray-500 mt-1">
                            {cert.certificate_number}
                          </div>
                        </div>
                      ) : cert.status === 'REJECTED' ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
                            <X className="w-3.5 h-3.5 mr-1" />
                            Rejected
                          </span>
                          <div className="text-[11px] text-rose-600 mt-1 max-w-[200px] truncate" title={cert.rejection_reason}>
                            {cert.rejection_reason}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          Pending Review
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-gray-700">
                      {cert.completed_projects_count} verified projects
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(cert.request_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-600">
                      {cert.approved_by_name ? (
                        <div>
                          <div>Reviewed by {cert.approved_by_name}</div>
                          <div className="text-[11px] text-gray-400">
                            {new Date(cert.approval_date).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Awaiting HR decision</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      {cert.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(cert.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setRejectModalCert(cert)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {cert.status === 'APPROVED' && cert.certificate_file && (
                        <a
                          href={cert.certificate_file}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectModalCert}
        onClose={() => setRejectModalCert(null)}
        title="Reject Certificate Request"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Provide rejection feedback for <span className="font-semibold text-gray-900">{rejectModalCert?.intern_name}</span>.
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g. Intern needs to complete at least 2 assigned projects before certificate issuance."
            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setRejectModalCert(null)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CertificatesList;
