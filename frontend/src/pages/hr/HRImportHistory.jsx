import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Modal from '../../components/Modal';
import { downloadFailedRecords } from '../../utils/internSpreadsheet';
import {
  History, Upload, Download, FileSpreadsheet, Eye, CheckCircle2,
  AlertTriangle, XCircle, Users
} from 'lucide-react';

const HRImportHistory = () => {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState(null);

  const fetchHistories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hr/interns/import/history/');
      const list = Array.isArray(res.data?.results ?? res.data)
        ? (res.data?.results ?? res.data)
        : [];
      setHistories(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistories();
  }, []);

  const renderStatusBadge = (status) => {
    const s = (status || 'COMPLETED').toUpperCase();
    if (s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          <span>Completed</span>
        </span>
      );
    }
    if (s === 'PARTIAL') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
          <AlertTriangle className="w-3 h-3" />
          <span>Partial (With Errors)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
        <XCircle className="w-3 h-3" />
        <span>Failed</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            HR Management • Audit Trail
          </span>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Bulk Intern Import History
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Review past CSV and Excel import batches, audit record counts, and download failed row error reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/hr/interns/import"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5 shadow-sm shadow-blue-500/20"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>New CSV / Excel Import</span>
          </Link>
          <Link
            to="/hr/interns"
            className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold inline-flex items-center space-x-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Intern List</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading import history...</div>
        ) : histories.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm font-semibold text-gray-600">No bulk imports recorded yet.</p>
            <p className="text-xs text-gray-400">
              Upload your first CSV or Excel spreadsheet on the Import Interns page.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Import Filename</th>
                  <th className="px-5 py-3.5">Format</th>
                  <th className="px-5 py-3.5">Import Date</th>
                  <th className="px-5 py-3.5">Imported By</th>
                  <th className="px-5 py-3.5">Total</th>
                  <th className="px-5 py-3.5">Successful</th>
                  <th className="px-5 py-3.5">Updated / Skipped</th>
                  <th className="px-5 py-3.5">Failed</th>
                  <th className="px-5 py-3.5">Import Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {histories.map((h) => {
                  const errors = Array.isArray(h.error_details) ? h.error_details : [];
                  return (
                    <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-bold text-gray-900">
                        {h.file_name}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-100 text-slate-700">
                          {h.file_type || 'CSV'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                        {h.imported_at ? new Date(h.imported_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-800">
                        {h.imported_by_name || 'Sarah Connor'}
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900">
                        {h.total_records}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-700">
                        {h.successful_records}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {h.updated_records || 0} upd • {h.skipped_records || 0} skip
                      </td>
                      <td className="px-5 py-4 font-bold text-rose-600">
                        {h.failed_records}
                      </td>
                      <td className="px-5 py-4">
                        {renderStatusBadge(h.import_status)}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedHistory(h)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-gray-700 inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Summary</span>
                          </button>

                          {errors.length > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => downloadFailedRecords(errors, 'csv')}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 inline-flex items-center space-x-1"
                                title="Download Failed Rows CSV"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>CSV</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadFailedRecords(errors, 'xlsx')}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 inline-flex items-center space-x-1"
                                title="Download Failed Rows Excel"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                <span>XLSX</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Import Summary & Error Details */}
      <Modal
        isOpen={!!selectedHistory}
        onClose={() => setSelectedHistory(null)}
        title={`Import Batch Summary: ${selectedHistory?.file_name || ''}`}
        maxWidth="max-w-2xl"
      >
        {selectedHistory && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-gray-200">
                <span className="text-gray-500 block">Total</span>
                <span className="text-lg font-bold text-gray-900">
                  {selectedHistory.total_records}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 block">Imported</span>
                <span className="text-lg font-bold text-emerald-700">
                  {selectedHistory.successful_records}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-blue-700 block">Updated</span>
                <span className="text-lg font-bold text-blue-700">
                  {selectedHistory.updated_records || 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-amber-800 block">Skipped</span>
                <span className="text-lg font-bold text-amber-800">
                  {selectedHistory.skipped_records || 0}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-rose-700 block">Failed</span>
                <span className="text-lg font-bold text-rose-700">
                  {selectedHistory.failed_records}
                </span>
              </div>
            </div>

            {Array.isArray(selectedHistory.error_details) &&
              selectedHistory.error_details.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-800">
                      Failed Records & Error Reasons ({selectedHistory.error_details.length})
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadFailedRecords(selectedHistory.error_details, 'csv')}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold"
                      >
                        Download CSV Error Report
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFailedRecords(selectedHistory.error_details, 'xlsx')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                      >
                        Download Excel Error Report
                      </button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-gray-600 font-bold border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2">Row #</th>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Email</th>
                          <th className="px-3 py-2">Error Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedHistory.error_details.map((err, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-mono">{err.row_number || i + 1}</td>
                            <td className="px-3 py-2 font-medium">{err.full_name || '—'}</td>
                            <td className="px-3 py-2">{err.email || '—'}</td>
                            <td className="px-3 py-2 text-rose-700 font-semibold">
                              {err.error_reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedHistory(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HRImportHistory;
