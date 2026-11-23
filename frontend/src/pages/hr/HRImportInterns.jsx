import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  SYSTEM_FIELDS,
  parseSpreadsheetFile,
  autoDetectColumnMapping,
  downloadSampleTemplate,
  downloadFailedRecords,
} from '../../utils/internSpreadsheet';
import {
  Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle,
  AlertTriangle, ArrowRight, RotateCcw, Sliders, ShieldCheck,
  History, Users, Eye, Check, XCircle
} from 'lucide-react';

const HRImportInterns = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Workflow state
  const [fileInfo, setFileInfo] = useState(null); // { fileName, fileType, sizeKB }
  const [headers, setHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [validation, setValidation] = useState(null);
  const [rowFilter, setRowFilter] = useState('ALL'); // 'ALL' | 'VALID' | 'INVALID' | 'DUPLICATE'

  // Step 5 Import Options
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [duplicateAction, setDuplicateAction] = useState('skip'); // 'skip' | 'update'
  const [confirmUpdateExisting, setConfirmUpdateExisting] = useState(false);

  // Progress & Step 6 Summary
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSummary, setImportSummary] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const runServerValidation = async (rowsToValidate, mappingToUse) => {
    setIsValidating(true);
    try {
      const res = await api.post('/hr/interns/import/validate/', {
        rows: rowsToValidate,
        column_mapping: mappingToUse,
      });
      setValidation(res.data);
    } catch (err) {
      showToast('error', err.response?.data?.detail || 'Error validating imported data.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileSelected = async (file) => {
    if (!file) return;
    setImportSummary(null);
    setToast(null);

    try {
      const parsed = await parseSpreadsheetFile(file);
      if (parsed.rows.length === 0) {
        showToast('error', 'The uploaded file contains headers but 0 data rows.');
        return;
      }

      const detectedMap = autoDetectColumnMapping(parsed.headers);
      setFileInfo({
        fileName: parsed.fileName,
        fileType: parsed.fileType,
        sizeKB: Math.max(1, Math.round(file.size / 1024)),
      });
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      setColumnMapping(detectedMap);

      // Call preview/validate endpoint
      const res = await api.post('/hr/interns/import/preview/', {
        file_name: parsed.fileName,
        file_type: parsed.fileType,
        headers: parsed.headers,
        rows: parsed.rows,
      });

      if (res.data?.column_mapping) {
        setColumnMapping(res.data.column_mapping);
      }
      if (res.data?.validation) {
        setValidation(res.data.validation);
      } else {
        await runServerValidation(parsed.rows, detectedMap);
      }

      showToast(
        'success',
        `Loaded ${parsed.rows.length} records from "${parsed.fileName}". Review column mapping and validation below.`
      );
    } catch (err) {
      showToast('error', err.message || 'Failed to parse file.');
    }
  };

  const handleMappingChange = async (sysKey, selectedColumn) => {
    const updatedMap = { ...columnMapping, [sysKey]: selectedColumn };
    setColumnMapping(updatedMap);
    await runServerValidation(rawRows, updatedMap);
  };

  const handleExecuteImport = async () => {
    if (!rawRows.length) return;
    if (duplicateAction === 'update' && !confirmUpdateExisting) {
      showToast(
        'error',
        'Please check the explicit confirmation box before updating existing intern records.'
      );
      return;
    }

    setIsImporting(true);
    setImportProgress(25);
    const timer = setInterval(() => {
      setImportProgress((p) => (p < 85 ? p + 15 : p));
    }, 180);

    try {
      const res = await api.post('/hr/interns/import/confirm/', {
        rows: rawRows,
        column_mapping: columnMapping,
        file_name: fileInfo?.fileName || 'interns_import.csv',
        file_type: fileInfo?.fileType || 'CSV',
        skip_invalid: skipInvalid,
        duplicate_action: duplicateAction,
        confirm_update_existing: confirmUpdateExisting,
      });
      clearInterval(timer);
      setImportProgress(100);
      setImportSummary(res.data);
      showToast(
        'success',
        `Import finished: ${res.data.successful_records} imported, ${res.data.updated_records} updated, ${res.data.skipped_records} skipped, ${res.data.failed_records} failed.`
      );
    } catch (err) {
      clearInterval(timer);
      setImportProgress(0);
      const errData = err.response?.data;
      if (errData?.failed_rows) {
        setImportSummary(errData);
      }
      showToast(
        'error',
        errData?.detail || 'Import aborted due to validation errors. No partial records were created.'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFileInfo(null);
    setHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setValidation(null);
    setImportSummary(null);
    setImportProgress(0);
    setConfirmUpdateExisting(false);
    setDuplicateAction('skip');
    setSkipInvalid(true);
  };

  const filteredValidationRows = (validation?.rows || []).filter((r) => {
    if (rowFilter === 'VALID') return r.is_valid && !r.is_db_duplicate;
    if (rowFilter === 'INVALID') return !r.is_valid;
    if (rowFilter === 'DUPLICATE') return r.is_in_file_duplicate || r.is_db_duplicate;
    return true;
  });

  const renderCell = (row, fieldKey, displayValue) => {
    const err = row.cell_errors?.[fieldKey];
    return (
      <td
        className={`px-3 py-2.5 whitespace-nowrap ${
          err
            ? 'bg-rose-50 text-rose-800 font-semibold border border-rose-200'
            : 'text-gray-700'
        }`}
        title={err || ''}
      >
        <div className="flex items-center space-x-1">
          <span>{displayValue || (err ? '— Missing —' : '—')}</span>
          {err && <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
        </div>
        {err && <div className="text-[10px] text-rose-600 font-normal">{err}</div>}
      </td>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              HR Management • Bulk Onboarding Engine
            </span>
            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Supports .CSV, .XLSX, .XLS
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Bulk Intern Import (CSV & Excel)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload spreadsheet cohorts, map columns automatically or manually, validate cells before insertion, and download error reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => downloadSampleTemplate('csv')}
            className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-slate-50 text-gray-700 text-xs font-semibold inline-flex items-center space-x-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Sample CSV Template</span>
          </button>

          <button
            type="button"
            onClick={() => downloadSampleTemplate('xlsx')}
            className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold inline-flex items-center space-x-1.5 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sample Excel (.xlsx) Template</span>
          </button>

          <Link
            to="/hr/import-history"
            className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-slate-100 text-xs font-semibold inline-flex items-center space-x-1.5"
          >
            <History className="w-3.5 h-3.5" />
            <span>Import History</span>
          </Link>

          <Link
            to="/hr/interns"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Intern List</span>
          </Link>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="underline text-[11px] ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: UPLOAD FILE */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Step 1: Upload CSV or Excel File (.csv, .xlsx, .xls)
            </h2>
            <p className="text-xs text-gray-500">
              Drag and drop your spreadsheet or browse from your device. Max size: 10 MB.
            </p>
          </div>
          {fileInfo && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 inline-flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Upload Different File</span>
            </button>
          )}
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer?.files?.[0];
            if (file) handleFileSelected(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-600 bg-blue-50/60'
              : fileInfo
              ? 'border-emerald-300 bg-emerald-50/30'
              : 'border-gray-300 hover:border-blue-500 hover:bg-slate-50/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelected(file);
              e.target.value = '';
            }}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>

          {fileInfo ? (
            <div>
              <p className="text-sm font-bold text-gray-900">
                Loaded: {fileInfo.fileName} ({fileInfo.fileType} • {fileInfo.sizeKB} KB)
              </p>
              <p className="text-xs text-emerald-700 font-semibold mt-1">
                {rawRows.length} total records detected across {headers.length} columns. Click to replace file.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Drag and drop your CSV or Excel file here, or{' '}
                <span className="text-blue-600 underline">browse files</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: <strong>CSV (.csv), Excel (.xlsx), Excel 97-2003 (.xls)</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* STEP 3: COLUMN MAPPING */}
      {rawRows.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Step 2 & 3: Automatic & Manual Column Mapping</span>
              </h2>
              <p className="text-xs text-gray-500">
                Matching column headings were auto-detected. You can adjust any column mapping below and validation will update immediately.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
              {Object.values(columnMapping).filter(Boolean).length} of {SYSTEM_FIELDS.length} fields mapped
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SYSTEM_FIELDS.map((field) => {
              const mappedCol = columnMapping[field.key] || '';
              return (
                <div
                  key={field.key}
                  className={`p-3 rounded-xl border ${
                    mappedCol
                      ? 'border-blue-200 bg-blue-50/30'
                      : field.required
                      ? 'border-rose-300 bg-rose-50/40'
                      : 'border-gray-200 bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-800">
                      {field.label}{' '}
                      {field.required && <span className="text-rose-600">*</span>}
                    </label>
                    {mappedCol ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Mapped
                      </span>
                    ) : field.required ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                        Required
                      </span>
                    ) : null}
                  </div>
                  <select
                    value={mappedCol}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700"
                  >
                    <option value="">-- Not Mapped --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: VALIDATION SUMMARY & PREVIEW TABLE */}
      {validation && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Step 4: Data Preview & Cell-Level Validation Results
              </h2>
              <p className="text-xs text-gray-500">
                Problematic cells are highlighted in red with exact validation messages.
              </p>
            </div>
            {isValidating && (
              <span className="text-xs font-semibold text-blue-600 animate-pulse">
                Re-validating rows...
              </span>
            )}
          </div>

          {/* 5 Validation Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl border border-gray-200 bg-slate-50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Total Detected
              </span>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {validation.total_records}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Valid Records
              </span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {validation.valid_count}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                Invalid Records
              </span>
              <p className="text-2xl font-bold text-rose-700 mt-1">
                {validation.invalid_count}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Duplicate Records
              </span>
              <p className="text-2xl font-bold text-amber-800 mt-1">
                {validation.duplicate_count}
              </p>
              <span className="text-[10px] text-amber-700">
                {validation.in_file_duplicate_count} in-file • {validation.db_duplicate_count} existing
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                Missing Required
              </span>
              <p className="text-2xl font-bold text-purple-800 mt-1">
                {validation.missing_required_count}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-gray-200">
              {[
                { id: 'ALL', label: `All Rows (${validation.total_records})` },
                { id: 'VALID', label: `Valid (${validation.valid_count})` },
                { id: 'INVALID', label: `Invalid (${validation.invalid_count})` },
                { id: 'DUPLICATE', label: `Duplicates (${validation.duplicate_count})` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setRowFilter(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    rowFilter === t.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {validation.invalid_count > 0 && (
              <button
                type="button"
                onClick={() =>
                  downloadFailedRecords(
                    validation.rows.filter((r) => !r.is_valid),
                    'csv'
                  )
                }
                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold inline-flex items-center space-x-1.5 hover:bg-rose-100"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Invalid Rows (.CSV)</span>
              </button>
            )}
          </div>

          {/* Preview & Validation Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-2xl max-h-[420px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-gray-600 text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3">Validation Status</th>
                  <th className="px-3 py-3">Full Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Phone</th>
                  <th className="px-3 py-3">College</th>
                  <th className="px-3 py-3">Course</th>
                  <th className="px-3 py-3">Department</th>
                  <th className="px-3 py-3">Internship Role</th>
                  <th className="px-3 py-3">Start Date</th>
                  <th className="px-3 py-3">End Date</th>
                  <th className="px-3 py-3">Assigned Mentor</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredValidationRows.map((row) => (
                  <tr
                    key={row.row_number}
                    className={
                      !row.is_valid
                        ? 'bg-rose-50/25'
                        : row.is_db_duplicate
                        ? 'bg-amber-50/40'
                        : 'hover:bg-slate-50'
                    }
                  >
                    <td className="px-3 py-2.5 font-mono text-gray-500">
                      {row.row_number}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {!row.is_valid ? (
                        <div>
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3" />
                            <span>Invalid</span>
                          </span>
                          <div className="text-[10px] text-rose-600 mt-0.5 max-w-[220px] truncate">
                            {row.error_reasons.join('; ')}
                          </div>
                        </div>
                      ) : row.is_db_duplicate ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Existing Duplicate</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3" />
                          <span>Valid</span>
                        </span>
                      )}
                    </td>
                    {renderCell(row, 'full_name', row.full_name)}
                    {renderCell(row, 'email', row.email)}
                    {renderCell(row, 'phone', row.phone)}
                    {renderCell(row, 'college', row.college)}
                    {renderCell(row, 'course', row.course)}
                    {renderCell(row, 'department', row.department)}
                    {renderCell(row, 'internship_role', row.internship_role)}
                    {renderCell(row, 'start_date', row.start_date)}
                    {renderCell(row, 'end_date', row.end_date)}
                    {renderCell(row, 'assigned_mentor', row.assigned_mentor)}
                    {renderCell(row, 'status', row.status)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 5: IMPORT OPTIONS & CONFIRMATION */}
      {validation && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-5">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Step 5: Import Options & Duplicate Governance
            </h2>
            <p className="text-xs text-gray-500">
              Configure how invalid rows and existing duplicate email records should be handled during batch database transaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Invalid rows policy */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-slate-50/60 space-y-2.5">
              <div className="text-xs font-bold text-gray-900">
                Invalid Records Handling
              </div>
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="invalidPolicy"
                  checked={skipInvalid}
                  onChange={() => setSkipInvalid(true)}
                  className="mt-0.5"
                />
                <span className="text-xs text-gray-700">
                  <strong>Import all valid records & skip invalid records</strong> (Recommended — failed rows will be exported in the error report)
                </span>
              </label>
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="invalidPolicy"
                  checked={!skipInvalid}
                  onChange={() => setSkipInvalid(false)}
                  className="mt-0.5"
                />
                <span className="text-xs text-gray-700">
                  <strong>Strict Transaction Mode</strong> (Abort entire import if any invalid record exists; creates 0 partial records)
                </span>
              </label>
            </div>

            {/* Duplicate records policy */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-slate-50/60 space-y-2.5">
              <div className="text-xs font-bold text-gray-900">
                Existing Duplicate Records ({validation.db_duplicate_count} detected)
              </div>
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="dupPolicy"
                  checked={duplicateAction === 'skip'}
                  onChange={() => {
                    setDuplicateAction('skip');
                    setConfirmUpdateExisting(false);
                  }}
                  className="mt-0.5"
                />
                <span className="text-xs text-gray-700">
                  <strong>Skip existing duplicate records</strong> (Never overwrite existing intern profiles)
                </span>
              </label>
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="dupPolicy"
                  checked={duplicateAction === 'update'}
                  onChange={() => setDuplicateAction('update')}
                  className="mt-0.5"
                />
                <span className="text-xs text-gray-700">
                  <strong>Update existing intern records matching by email</strong> (Requires explicit confirmation below)
                </span>
              </label>

              {duplicateAction === 'update' && (
                <label className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-300 flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmUpdateExisting}
                    onChange={(e) => setConfirmUpdateExisting(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-[11px] font-semibold text-amber-900">
                    I explicitly confirm updating existing intern records matching uploaded email addresses.
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {isImporting && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-blue-700">
                <span>Processing batch import transaction...</span>
                <span>{importProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-200"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel & Clear
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 inline-flex items-center space-x-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isImporting
                  ? 'Importing Interns...'
                  : `Confirm & Execute Import (${validation.valid_count} new${
                      duplicateAction === 'update' ? ` + ${validation.db_duplicate_count} updates` : ''
                    })`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: IMPORT SUMMARY & ERROR REPORT DOWNLOAD */}
      {importSummary && (
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-500/30 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800">
                Step 6 • Final Import Summary Report
              </span>
              <h2 className="text-lg font-bold text-gray-900 mt-1">
                Import Batch Processed ({importSummary.file_name})
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {importSummary.failed_rows?.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => downloadFailedRecords(importSummary.failed_rows, 'csv')}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Failed Records (.CSV)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadFailedRecords(importSummary.failed_rows, 'xlsx')}
                    className="px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold inline-flex items-center space-x-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Download Failed Records (.XLSX)</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => navigate('/hr/interns')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5"
              >
                <span>View Updated Intern List</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-gray-200">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Total Processed</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{importSummary.total_records}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Successfully Imported</span>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{importSummary.successful_records}</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[11px] font-bold text-blue-700 uppercase">Updated Records</span>
              <p className="text-2xl font-bold text-blue-700 mt-1">{importSummary.updated_records}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[11px] font-bold text-amber-800 uppercase">Skipped Records</span>
              <p className="text-2xl font-bold text-amber-800 mt-1">{importSummary.skipped_records}</p>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[11px] font-bold text-rose-700 uppercase">Failed Records</span>
              <p className="text-2xl font-bold text-rose-700 mt-1">{importSummary.failed_records}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRImportInterns;
