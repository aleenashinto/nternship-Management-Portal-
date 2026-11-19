import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { downloadCertificatePdf } from '../../utils/certificatePdf';
import {
  Award, Download, Clock, CheckCircle2, AlertCircle, FileCheck2, ArrowRight
} from 'lucide-react';

const InternCertificate = () => {
  const [certificates, setCertificates] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [certRes, profileRes] = await Promise.all([
        api.get('/intern/certificate/'),
        api.get('/intern/profile/')
      ]);
      setCertificates(certRes.data || []);
      setProfileData(profileRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestCertificate = async () => {
    try {
      setRequesting(true);
      await api.post('/intern/certificate/');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error requesting certificate.');
    } finally {
      setRequesting(false);
    }
  };

  const activeCert = certificates[0] || null;
  const completedProjects = profileData?.summary?.completed || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <h1 className="text-xl font-bold text-gray-900">Internship Completion Certificate</h1>
        <p className="text-xs text-gray-500 mt-1">
          Once your assigned projects and mentor evaluations are complete, request your officially signed PDF certificate from HR.
        </p>
      </div>

      {/* Main Status Showcase */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading certificate status...</div>
      ) : activeCert?.status === 'APPROVED' ? (
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-lg p-8 text-center max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-10 h-10" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              OFFICIALLY APPROVED & ISSUED
            </span>
            <h2 className="text-2xl font-bold text-gray-900 mt-3">Congratulations on Graduating!</h2>
            <p className="text-sm text-gray-600 mt-1">
              Your completion certificate has been reviewed and approved by HR Management.
            </p>
            <div className="mt-3 font-mono text-xs text-gray-500">
              Certificate ID: <span className="font-bold text-gray-800">{activeCert.certificate_number}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => downloadCertificatePdf(activeCert)}
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Certificate PDF</span>
            </button>
          </div>
        </div>
      ) : activeCert?.status === 'PENDING' ? (
        <div className="bg-white rounded-3xl border border-amber-200 shadow-md p-8 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Certificate Approval Pending</h2>
          <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
            Your certificate request was submitted on{' '}
            <span className="font-semibold">{new Date(activeCert.request_date).toLocaleDateString()}</span>.
            The HR Manager is currently reviewing your project evaluations. You will receive an automated notification once approved.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-8 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Request Completion Certificate</h2>
              <p className="text-xs text-gray-500">
                Submit an official certificate request for HR review.
              </p>
            </div>
          </div>

          {activeCert?.status === 'REJECTED' && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Previous Request Not Approved</span>
              </div>
              <p>Reason: "{activeCert.rejection_reason}"</p>
              <p className="text-[11px] text-rose-600">You may re-submit once you have fulfilled your mentor's criteria.</p>
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
            <span className="font-bold text-gray-700 block">Internship Progress Checklist:</span>
            <div className="flex items-center justify-between text-gray-600 py-1">
              <span>Completed Projects</span>
              <span className="font-bold text-gray-900">{completedProjects} completed</span>
            </div>
            <div className="flex items-center justify-between text-gray-600 py-1">
              <span>Assigned Mentor</span>
              <span className="font-bold text-gray-900">{profileData?.user?.assigned_mentor_name || 'None'}</span>
            </div>
          </div>

          <button
            onClick={handleRequestCertificate}
            disabled={requesting}
            className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Award className="w-4 h-4" />
            <span>{requesting ? 'Submitting Request...' : 'Submit Request for HR Approval'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default InternCertificate;
