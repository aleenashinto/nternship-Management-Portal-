import React, { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import { useTheme, DEFAULT_BRANDING } from '../../context/ThemeContext';
import {
  Image as ImageIcon, Upload, Trash2, RotateCcw, CheckCircle2,
  AlertCircle, Monitor, Smartphone, Sun, Moon, Sparkles, RefreshCw, ShieldCheck
} from 'lucide-react';

const LOGO_VARIANTS = [
  {
    key: 'primary_logo',
    label: 'Primary Website Logo',
    description: 'Main brand logo displayed in the top navigation bar and login portal.',
    recommended: '240 × 64 px (PNG, SVG, WebP)',
  },
  {
    key: 'dark_logo',
    label: 'Dark-Background Logo',
    description: 'High-contrast logo automatically used when Dark Mode or dark headers are active.',
    recommended: '240 × 64 px (Light/White text PNG or SVG)',
  },
  {
    key: 'light_logo',
    label: 'Light-Background Logo',
    description: 'Standard logo optimized for white and light-colored surfaces.',
    recommended: '240 × 64 px (Dark text PNG or SVG)',
  },
  {
    key: 'mobile_logo',
    label: 'Mobile Compact Logo',
    description: 'Compact mark or icon displayed on mobile viewports (< 768px).',
    recommended: '80 × 80 px or 140 × 48 px',
  },
  {
    key: 'favicon',
    label: 'Browser Favicon',
    description: 'Browser tab icon updated dynamically across all portal pages.',
    recommended: '64 × 64 px or 32 × 32 px (PNG, SVG)',
  },
];

const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const detectFormat = (src, fileName = '') => {
  if (fileName) {
    const ext = fileName.split('.').pop()?.toUpperCase();
    if (ext) return ext;
  }
  if (!src) return 'PNG';
  if (src.startsWith('data:image/svg+xml')) return 'SVG';
  if (src.startsWith('data:image/webp')) return 'WEBP';
  if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) return 'JPG';
  if (src.startsWith('data:image/png')) return 'PNG';
  const clean = src.split('?')[0];
  const ext = clean.split('.').pop()?.toUpperCase();
  return ALLOWED_EXTENSIONS.includes((ext || '').toLowerCase()) ? ext : 'PNG';
};

const AdminBranding = () => {
  const { branding, updateLiveBranding, refreshWebsiteConfig } = useTheme();

  const [savedBranding, setSavedBranding] = useState(DEFAULT_BRANDING);
  const [draftBranding, setDraftBranding] = useState(DEFAULT_BRANDING);
  const [selectedVariant, setSelectedVariant] = useState('primary_logo');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [fileMeta, setFileMeta] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  // Preview toggles
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [previewBg, setPreviewBg] = useState('light'); // 'light' | 'dark'

  const fileInputRef = useRef(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const res = await client.get('/admin/branding/');
        const data = { ...DEFAULT_BRANDING, ...(res.data || {}) };
        setSavedBranding(data);
        setDraftBranding(data);
      } catch {
        setSavedBranding(branding);
        setDraftBranding(branding);
      }
    };
    loadBranding();
  }, [branding]);

  const activeLogoSrc = draftBranding[selectedVariant] || '/beat-logo.png';
  const savedLogoSrc = savedBranding[selectedVariant] || '/beat-logo.png';
  const hasUnsavedChanges =
    JSON.stringify(draftBranding) !== JSON.stringify(savedBranding);

  // Measure image dimensions whenever activeLogoSrc changes
  useEffect(() => {
    if (!activeLogoSrc) return;
    const img = new window.Image();
    img.onload = () => {
      setDimensions({ width: img.naturalWidth || 240, height: img.naturalHeight || 64 });
    };
    img.onerror = () => {
      setDimensions({ width: 240, height: 64 });
    };
    img.src = activeLogoSrc;
  }, [activeLogoSrc]);

  const validateAndStageFile = (file) => {
    if (!file) return;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      showToast('error', `Invalid format (.${ext}). Supported formats: PNG, JPG, JPEG, SVG, WebP.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast('error', `File is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 5 MB.`);
      return;
    }

    const handleValidDataUrl = (dataUrl) => {
      setDraftBranding((prev) => ({
        ...prev,
        [selectedVariant]: dataUrl,
      }));
      setFileMeta((prev) => ({
        ...prev,
        [selectedVariant]: {
          name: file.name,
          sizeKB: Math.max(1, Math.round(file.size / 1024)),
          format: ext.toUpperCase(),
        },
      }));
      showToast('success', `Staged "${file.name}" for ${LOGO_VARIANTS.find(v => v.key === selectedVariant)?.label}. Review preview and click Save Changes.`);
    };

    if (ext === 'svg') {
      const textReader = new FileReader();
      textReader.onload = (e) => {
        const svgText = String(e.target?.result || '');
        const lower = svgText.toLowerCase();
        if (lower.includes('<script') || lower.includes('javascript:') || lower.includes('onload=') || lower.includes('onerror=')) {
          showToast('error', 'Security Error: SVG files containing executable scripts or event handlers are blocked.');
          return;
        }
        const dataReader = new FileReader();
        dataReader.onload = (ev) => handleValidDataUrl(String(ev.target?.result || ''));
        dataReader.readAsDataURL(file);
      };
      textReader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => handleValidDataUrl(String(e.target?.result || ''));
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) validateAndStageFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) validateAndStageFile(file);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Upload changed variant(s) and update branding config
      for (const variant of LOGO_VARIANTS) {
        const key = variant.key;
        if (draftBranding[key] !== savedBranding[key]) {
          await client.post('/admin/branding/upload/', {
            variant: key,
            data_url: draftBranding[key],
            filename: fileMeta[key]?.name || `${key}.png`,
            site_name: draftBranding.site_name,
          });
        }
      }
      const res = await client.put('/admin/branding/', draftBranding);
      const updated = { ...DEFAULT_BRANDING, ...(res.data || draftBranding) };
      setSavedBranding(updated);
      setDraftBranding(updated);
      updateLiveBranding(updated);
      await refreshWebsiteConfig();
      showToast('success', 'Website branding & logos saved and published across all pages.');
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to save branding changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveVariant = async (variantKey) => {
    setSaving(true);
    try {
      const res = await client.delete('/admin/branding/logo/', {
        data: { variant: variantKey },
      });
      const updated = { ...DEFAULT_BRANDING, ...(res.data?.branding || {}), [variantKey]: '/beat-logo.png' };
      setSavedBranding(updated);
      setDraftBranding(updated);
      updateLiveBranding(updated);
      setConfirmModal(null);
      showToast('success', `${LOGO_VARIANTS.find(v => v.key === variantKey)?.label} reset to default logo.`);
    } catch {
      showToast('error', 'Failed to reset logo variant.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetAllLogos = async () => {
    setSaving(true);
    try {
      const res = await client.delete('/admin/branding/logo/', {
        data: { variant: 'all' },
      });
      const updated = { ...DEFAULT_BRANDING, ...(res.data?.branding || DEFAULT_BRANDING) };
      setSavedBranding(updated);
      setDraftBranding(updated);
      updateLiveBranding(updated);
      setConfirmModal(null);
      showToast('success', 'All logo variants have been restored to the default Beat logo.');
    } catch {
      showToast('error', 'Failed to reset logos.');
    } finally {
      setSaving(false);
    }
  };

  const previewLogoForHeader = () => {
    if (previewDevice === 'mobile' && draftBranding.mobile_logo) {
      return draftBranding.mobile_logo;
    }
    if (previewBg === 'dark' && draftBranding.dark_logo) {
      return draftBranding.dark_logo;
    }
    if (previewBg === 'light' && draftBranding.light_logo && draftBranding.light_logo !== '/beat-logo.png') {
      return draftBranding.light_logo;
    }
    return draftBranding.primary_logo || '/beat-logo.png';
  };

  const activeVariantObj = LOGO_VARIANTS.find((v) => v.key === selectedVariant) || LOGO_VARIANTS[0];
  const currentMeta = fileMeta[selectedVariant];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Website Settings • Module 1
            </span>
            {hasUnsavedChanges && (
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Unsaved Staged Changes
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Website Branding & Logo Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload, preview, and publish your primary website logo, dark/light variants, mobile mark, and browser favicon.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={() => setDraftBranding(savedBranding)}
              className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Discard Staged
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              setConfirmModal({
                title: 'Reset All Logos to Default?',
                message: 'This will restore Primary, Dark, Light, Mobile, and Favicon logos back to the default Beat logo across the portal.',
                onConfirm: handleResetAllLogos,
              })
            }
            className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-slate-100 inline-flex items-center space-x-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default Logo</span>
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 inline-flex items-center space-x-2 disabled:opacity-50 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Saving Branding...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium shadow-sm ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-[11px] underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Site Name & Logo Variants Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Variant Tabs + Current & Upload Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Brand Name */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Portal Brand / Website Title
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={draftBranding.site_name || ''}
                onChange={(e) =>
                  setDraftBranding((prev) => ({ ...prev, site_name: e.target.value }))
                }
                placeholder="Beat Internship Portal"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Displayed in the navigation bar, login header, and browser tab title.
            </p>
          </div>

          {/* 5 Logo Variants Grid */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">1. Select Logo Variant to Manage</h2>
              <span className="text-[11px] text-gray-400">5 Variants Supported</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {LOGO_VARIANTS.map((v) => {
                const isSelected = selectedVariant === v.key;
                const isModified = draftBranding[v.key] !== savedBranding[v.key];
                return (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setSelectedVariant(v.key)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/15'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="h-10 rounded-lg bg-slate-100 flex items-center justify-center p-1.5 mb-2 overflow-hidden">
                      <img
                        src={draftBranding[v.key] || '/beat-logo.png'}
                        alt={v.label}
                        className="max-h-8 w-auto object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-800 line-clamp-1">
                          {v.label.replace(' Logo', '')}
                        </span>
                        {isModified && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" title="Modified" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Website Logo Card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  2. Current {activeVariantObj.label}
                </h2>
                <p className="text-xs text-gray-500">{activeVariantObj.description}</p>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                Recommended: {activeVariantObj.recommended}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Live Saved Logo */}
              <div className="p-4 rounded-xl border border-gray-200 bg-slate-50/70 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Currently Active on Website
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700">
                    Published
                  </span>
                </div>
                <div className="h-24 rounded-xl bg-white border border-gray-100 flex items-center justify-center p-4">
                  <img
                    src={savedLogoSrc}
                    alt="Active Logo"
                    className="max-h-16 w-auto object-contain"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Format: <strong>{detectFormat(savedLogoSrc)}</strong></span>
                  <span>Preserved until Save</span>
                </div>
              </div>

              {/* Staged / Selected Preview */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                    {draftBranding[selectedVariant] !== savedBranding[selectedVariant]
                      ? 'Staged Upload Preview'
                      : 'Active Variant Preview'}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-700">
                    {dimensions.width} × {dimensions.height} px
                  </span>
                </div>
                <div
                  className={`h-24 rounded-xl border flex items-center justify-center p-4 ${
                    selectedVariant === 'dark_logo'
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <img
                    src={activeLogoSrc}
                    alt="Staged Preview"
                    className="max-h-16 w-auto object-contain"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-600">
                  <span>
                    Format:{' '}
                    <strong>
                      {currentMeta?.format || detectFormat(activeLogoSrc)}
                    </strong>
                  </span>
                  <span>
                    {currentMeta?.sizeKB ? `${currentMeta.sizeKB} KB` : 'Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Logo Actions Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace Logo</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfirmModal({
                    title: `Remove Custom ${activeVariantObj.label}?`,
                    message: `This will remove the custom ${activeVariantObj.label} and revert it to the default Beat logo.`,
                    onConfirm: () => handleRemoveVariant(selectedVariant),
                  })
                }
                className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold inline-flex items-center space-x-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Logo</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setDraftBranding((prev) => ({
                    ...prev,
                    [selectedVariant]: '/beat-logo.png',
                  }))
                }
                className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold inline-flex items-center space-x-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Variant to Default</span>
              </button>
            </div>
          </div>

          {/* Drag-and-Drop Upload Zone */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">
                3. Upload New {activeVariantObj.label}
              </h2>
              <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SVG Sanitization & 5 MB Guard Active</span>
              </span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/60'
                  : 'border-gray-300 hover:border-blue-500 hover:bg-slate-50/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                Drag and drop your logo file here, or{' '}
                <span className="text-blue-600 underline">browse files</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports <strong>PNG, JPG, JPEG, SVG, and WebP</strong> • Max file size: <strong>5 MB</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Interactive Branding Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4 sticky top-20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Live Branding Preview</span>
                </h2>
                <p className="text-xs text-gray-500">
                  Preview how your logo looks across devices & backgrounds before saving.
                </p>
              </div>
            </div>

            {/* Preview Controls: Desktop/Mobile & Light/Dark */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="inline-flex rounded-lg bg-white p-1 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center space-x-1 transition-all ${
                    previewDevice === 'desktop'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center space-x-1 transition-all ${
                    previewDevice === 'mobile'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>

              <div className="inline-flex rounded-lg bg-white p-1 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setPreviewBg('light')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center space-x-1 transition-all ${
                    previewBg === 'light'
                      ? 'bg-amber-500 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('dark')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center space-x-1 transition-all ${
                    previewBg === 'dark'
                      ? 'bg-slate-900 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Simulated Browser Frame */}
            <div
              className={`rounded-2xl border overflow-hidden transition-all mx-auto ${
                previewDevice === 'mobile' ? 'max-w-[320px]' : 'w-full'
              } ${
                previewBg === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-white'
                  : 'bg-slate-50 border-gray-200 text-gray-900'
              }`}
            >
              {/* Browser Tab / Favicon Preview */}
              <div
                className={`px-3 py-2 border-b flex items-center space-x-2 text-[11px] ${
                  previewBg === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-300'
                    : 'bg-gray-100 border-gray-200 text-gray-600'
                }`}
              >
                <div className="flex space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div
                  className={`ml-2 px-2.5 py-1 rounded-md flex items-center space-x-1.5 max-w-[200px] truncate ${
                    previewBg === 'dark' ? 'bg-slate-800' : 'bg-white'
                  }`}
                >
                  <img
                    src={draftBranding.favicon || '/beat-logo.png'}
                    alt="Favicon"
                    className="w-3.5 h-3.5 object-contain shrink-0"
                  />
                  <span className="truncate font-medium">
                    {draftBranding.site_name || 'Beat Internship Portal'}
                  </span>
                </div>
              </div>

              {/* Simulated Website Header */}
              <div
                className={`h-14 px-4 border-b flex items-center justify-between ${
                  previewBg === 'dark'
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <img
                    src={previewLogoForHeader()}
                    alt="Header Preview"
                    className="h-8 w-auto object-contain"
                  />
                  {previewDevice === 'desktop' && (
                    <span
                      className={`text-xs font-semibold border-l pl-2.5 ${
                        previewBg === 'dark'
                          ? 'text-slate-200 border-slate-700'
                          : 'text-gray-700 border-gray-200'
                      }`}
                    >
                      {draftBranding.site_name || 'Internship Portal'}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-600 text-white">
                    Admin
                  </span>
                </div>
              </div>

              {/* Simulated Body */}
              <div className="p-4 space-y-3">
                <div
                  className={`p-3.5 rounded-xl border ${
                    previewBg === 'dark'
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="text-xs font-bold">
                    {draftBranding.site_name || 'Beat Internship Portal'}
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      previewBg === 'dark' ? 'text-slate-400' : 'text-gray-500'
                    }`}
                  >
                    {previewDevice === 'mobile'
                      ? 'Mobile layout using Mobile Logo variant'
                      : `Desktop layout on ${previewBg} surface`}
                  </div>
                </div>

                {/* All 5 Variant Mini Summary */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {LOGO_VARIANTS.map((v) => (
                    <div
                      key={v.key}
                      className={`p-1.5 rounded-lg border text-center ${
                        previewBg === 'dark'
                          ? 'bg-slate-900 border-slate-800'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="h-7 flex items-center justify-center">
                        <img
                          src={draftBranding[v.key] || '/beat-logo.png'}
                          alt={v.label}
                          className="max-h-5 w-auto object-contain"
                        />
                      </div>
                      <div className="text-[9px] font-semibold truncate mt-1 opacity-75">
                        {v.label.split(' ')[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-100 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">{confirmModal.title}</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{confirmModal.message}</p>
            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBranding;
