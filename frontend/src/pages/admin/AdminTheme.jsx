import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import client from '../../api/client';
import {
  useTheme,
  DEFAULT_THEME,
  THEME_PRESETS,
} from '../../context/ThemeContext';
import {
  Palette, Type, Sliders, Sun, Moon, Monitor, Smartphone,
  CheckCircle2, AlertCircle, RotateCcw, Eye, Save, Rocket, Sparkles, Check
} from 'lucide-react';

const COLOR_FIELDS = [
  { key: 'primary_color', label: 'Primary Colour', desc: 'Main brand colour' },
  { key: 'secondary_color', label: 'Secondary Colour', desc: 'Secondary brand colour' },
  { key: 'accent_color', label: 'Accent Colour', desc: 'Highlight & badge colour' },
  { key: 'background_color', label: 'Background Colour', desc: 'Main page background' },
  { key: 'surface_color', label: 'Surface Colour', desc: 'Cards and containers' },
  { key: 'text_color', label: 'Text Colour', desc: 'Primary headings & body text' },
  { key: 'secondary_text_color', label: 'Secondary Text', desc: 'Muted descriptions & captions' },
  { key: 'border_color', label: 'Border Colour', desc: 'Component & table borders' },
  { key: 'sidebar_color', label: 'Sidebar Colour', desc: 'Admin & role sidebar surface' },
  { key: 'header_color', label: 'Header Colour', desc: 'Top website navigation bar' },
  { key: 'button_color', label: 'Button Colour', desc: 'Primary CTA buttons' },
  { key: 'link_color', label: 'Link Colour', desc: 'Interactive website links' },
];

const FONT_OPTIONS = ['Sora', 'Inter', 'Roboto', 'Poppins', 'Open Sans', 'Lato'];

const AdminTheme = ({ initialSection = 'presets' }) => {
  const location = useLocation();
  const {
    branding,
    publishedTheme,
    updateLiveTheme,
    revertLiveThemeToPublished,
    refreshWebsiteConfig,
  } = useTheme();

  const [activeTab, setActiveTab] = useState(initialSection);
  const [savedPublished, setSavedPublished] = useState(DEFAULT_THEME);
  const [draftTheme, setDraftTheme] = useState(DEFAULT_THEME);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [isLiveDomPreviewing, setIsLiveDomPreviewing] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [busyAction, setBusyAction] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (location.pathname.includes('/typography')) {
      setActiveTab('typography');
    } else if (location.pathname.includes('/appearance')) {
      setActiveTab('appearance');
    } else if (initialSection) {
      setActiveTab(initialSection);
    }
  }, [location.pathname, initialSection]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    const fetchAdminTheme = async () => {
      try {
        const res = await client.get('/admin/theme/');
        const pub = { ...DEFAULT_THEME, ...(res.data?.published || publishedTheme) };
        const drf = res.data?.draft ? { ...pub, ...res.data.draft } : pub;
        setSavedPublished(pub);
        setDraftTheme(drf);
        setHasSavedDraft(Boolean(res.data?.draft));
      } catch {
        setSavedPublished(publishedTheme);
        setDraftTheme(publishedTheme);
      }
    };
    fetchAdminTheme();
  }, [publishedTheme]);

  // Revert any un-published live DOM preview when leaving the page
  useEffect(() => {
    return () => {
      revertLiveThemeToPublished();
    };
  }, [revertLiveThemeToPublished]);

  const hasUnsavedChanges =
    JSON.stringify(draftTheme) !== JSON.stringify(savedPublished);

  const handleFieldChange = (field, value) => {
    setDraftTheme((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'font_family') {
        next.heading_font = value;
        next.body_font = value;
      }
      if (isLiveDomPreviewing) {
        updateLiveTheme(next, false);
      }
      return next;
    });
  };

  const handleSelectPreset = (preset) => {
    const merged = {
      ...draftTheme,
      ...preset,
      button_color: preset.button_color || preset.primary_color,
      link_color: preset.link_color || preset.primary_color,
    };
    setDraftTheme(merged);
    if (isLiveDomPreviewing) {
      updateLiveTheme(merged, false);
    }
    showToast('success', `Loaded "${preset.theme_name}" into Live Preview. Click Publish Theme to apply publicly.`);
  };

  const handleToggleLivePreview = () => {
    if (!isLiveDomPreviewing) {
      setIsLiveDomPreviewing(true);
      updateLiveTheme(draftTheme, false);
      showToast('success', 'Full-Portal Preview Mode activated. Only your current session sees these changes until published.');
    } else {
      setIsLiveDomPreviewing(false);
      revertLiveThemeToPublished();
      showToast('success', 'Exited Full-Portal Preview Mode. Public theme restored.');
    }
  };

  const handleSaveDraft = async () => {
    setBusyAction('draft');
    try {
      const res = await client.post('/admin/theme/draft/', draftTheme);
      const savedDraft = { ...draftTheme, ...(res.data?.draft || res.data || {}) };
      setDraftTheme(savedDraft);
      setHasSavedDraft(true);
      showToast('success', 'Theme saved as draft. Public website remains unchanged until you click Publish Theme.');
    } catch {
      showToast('error', 'Failed to save theme draft.');
    } finally {
      setBusyAction('');
    }
  };

  const handlePublishTheme = async () => {
    setBusyAction('publish');
    try {
      const res = await client.post('/admin/theme/publish/', draftTheme);
      const published = { ...DEFAULT_THEME, ...(res.data?.theme || draftTheme) };
      setSavedPublished(published);
      setDraftTheme(published);
      setHasSavedDraft(false);
      setIsLiveDomPreviewing(false);
      updateLiveTheme(published, true);
      await refreshWebsiteConfig();
      showToast('success', `"${published.theme_name}" is now live across the entire website!`);
    } catch {
      showToast('error', 'Failed to publish theme.');
    } finally {
      setBusyAction('');
    }
  };

  const handleResetDefault = async () => {
    setBusyAction('reset');
    try {
      const res = await client.post('/admin/theme/reset/');
      const resetObj = { ...DEFAULT_THEME, ...(res.data?.theme || DEFAULT_THEME) };
      setSavedPublished(resetObj);
      setDraftTheme(resetObj);
      setHasSavedDraft(false);
      setIsLiveDomPreviewing(false);
      setConfirmReset(false);
      updateLiveTheme(resetObj, true);
      await refreshWebsiteConfig();
      showToast('success', 'Website theme reset to Default Professional.');
    } catch {
      showToast('error', 'Failed to reset theme.');
    } finally {
      setBusyAction('');
    }
  };

  const isPreviewDark =
    draftTheme.color_mode === 'dark' ||
    (draftTheme.color_mode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const previewBgColor =
    isPreviewDark && draftTheme.background_color === '#F8FAFC'
      ? '#0F172A'
      : draftTheme.background_color;
  const previewSurfaceColor =
    isPreviewDark && draftTheme.surface_color === '#FFFFFF'
      ? '#1E293B'
      : draftTheme.surface_color;
  const previewTextColor =
    isPreviewDark && draftTheme.text_color === '#0F172A'
      ? '#F8FAFC'
      : draftTheme.text_color;
  const previewSubTextColor =
    isPreviewDark && draftTheme.secondary_text_color === '#475569'
      ? '#94A3B8'
      : draftTheme.secondary_text_color;
  const previewBorderColor =
    isPreviewDark && draftTheme.border_color === '#E2E8F0'
      ? '#334155'
      : draftTheme.border_color;
  const previewHeaderColor =
    isPreviewDark && draftTheme.header_color === '#FFFFFF'
      ? '#1E293B'
      : draftTheme.header_color;

  const previewShadow =
    draftTheme.shadow_intensity === 'none'
      ? 'none'
      : draftTheme.shadow_intensity === 'soft'
      ? '0 2px 6px rgba(15,23,42,0.05)'
      : draftTheme.shadow_intensity === 'strong'
      ? '0 14px 30px rgba(15,23,42,0.16)'
      : '0 6px 16px rgba(15,23,42,0.08)';

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Website Settings • Dynamic Theme Engine
            </span>
            <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Published: {savedPublished.theme_name}
            </span>
            {hasSavedDraft && (
              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Draft Saved
              </span>
            )}
            {hasUnsavedChanges && (
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Unpublished Customizations
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Dynamic Website Theme & Appearance Customization
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Customise theme presets, 12 brand colours, light/dark mode, typography, and component geometry with real-time preview.
          </p>
        </div>

        {/* 4 Required Actions: Preview Changes, Save as Draft, Publish Theme, Reset to Default */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleLivePreview}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center space-x-1.5 transition-all ${
              isLiveDomPreviewing
                ? 'border-amber-400 bg-amber-50 text-amber-800'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isLiveDomPreviewing ? 'Exit Portal Preview' : 'Preview Changes'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={busyAction !== ''}
            className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-700 text-xs font-semibold inline-flex items-center space-x-1.5 disabled:opacity-50 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{busyAction === 'draft' ? 'Saving Draft...' : 'Save as Draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            disabled={busyAction !== ''}
            className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-slate-100 text-xs font-semibold inline-flex items-center space-x-1.5 disabled:opacity-50 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            type="button"
            onClick={handlePublishTheme}
            disabled={busyAction !== ''}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 inline-flex items-center space-x-2 disabled:opacity-50 transition-all"
          >
            <Rocket className="w-4 h-4" />
            <span>{busyAction === 'publish' ? 'Publishing...' : 'Publish Theme'}</span>
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

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl p-1.5 border border-gray-100 shadow-xs flex flex-wrap gap-1.5">
        {[
          { id: 'presets', label: 'A. Theme Presets (8)', icon: Sparkles },
          { id: 'colors', label: 'B. Colour Customization (12)', icon: Palette },
          { id: 'mode', label: 'C. Light & Dark Mode', icon: Sun },
          { id: 'typography', label: 'D. Typography', icon: Type },
          { id: 'appearance', label: 'E. Component Styling', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center space-x-2 transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-slate-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Split Grid: Customizer Controls (Left 7 cols) + Live Interactive Preview (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Customizer Panels */}
        <div className="lg:col-span-7 space-y-6">
          {/* A. THEME PRESETS */}
          {activeTab === 'presets' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Predefined Theme Presets
                  </h2>
                  <p className="text-xs text-gray-500">
                    Click any visual preset card to preview instantly. Customize further in Colours or Typography tabs.
                  </p>
                </div>
                <span className="text-xs font-semibold text-blue-600">
                  Selected: {draftTheme.theme_name}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = draftTheme.theme_name === preset.theme_name;
                  const isPublished = savedPublished.theme_name === preset.theme_name;
                  return (
                    <button
                      key={preset.theme_name}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between group ${
                        isSelected
                          ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {/* Visual Mini UI Card Preview */}
                      <div
                        className="rounded-xl border p-3 mb-3 transition-transform group-hover:scale-[1.01]"
                        style={{
                          backgroundColor: preset.background_color,
                          borderColor: preset.border_color,
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: preset.primary_color }}
                            />
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: preset.secondary_color }}
                            />
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: preset.accent_color }}
                            />
                          </div>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: preset.primary_color,
                              color: '#FFFFFF',
                            }}
                          >
                            {preset.font_family}
                          </span>
                        </div>
                        <div
                          className="rounded-lg p-2.5 border"
                          style={{
                            backgroundColor: preset.surface_color,
                            borderColor: preset.border_color,
                          }}
                        >
                          <div
                            className="h-2 w-24 rounded mb-1.5"
                            style={{ backgroundColor: preset.text_color }}
                          />
                          <div
                            className="h-1.5 w-36 rounded opacity-60"
                            style={{ backgroundColor: preset.secondary_text_color }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900">
                            {preset.theme_name}
                          </span>
                          <div className="flex items-center space-x-1">
                            {isPublished && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                                Live
                              </span>
                            )}
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{preset.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* B. COLOUR CUSTOMIZATION (12 ELEMENTS) */}
          {activeTab === 'colors' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    12-Point Brand & UI Colour Customization
                  </h2>
                  <p className="text-xs text-gray-500">
                    Use the interactive colour picker or enter an exact HEX code (e.g., #2563EB).
                  </p>
                </div>
                <span className="text-xs font-medium text-gray-500">
                  Preset: <strong>{draftTheme.theme_name}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {COLOR_FIELDS.map((item) => {
                  const val = draftTheme[item.key] || '#2563EB';
                  return (
                    <div
                      key={item.key}
                      className="p-3.5 rounded-xl border border-gray-200 bg-slate-50/50 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-800">{item.label}</div>
                        <div className="text-[11px] text-gray-500 truncate">{item.desc}</div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <input
                          type="color"
                          value={val.startsWith('#') && val.length === 7 ? val : '#2563EB'}
                          onChange={(e) => {
                            handleFieldChange('theme_name', 'Custom Theme');
                            handleFieldChange(item.key, e.target.value.toUpperCase());
                          }}
                          className="w-9 h-9 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white"
                          title={`Pick ${item.label}`}
                        />
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            handleFieldChange('theme_name', 'Custom Theme');
                            handleFieldChange(item.key, e.target.value);
                          }}
                          maxLength={9}
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-mono font-semibold text-gray-800 uppercase focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* C. LIGHT & DARK MODE */}
          {activeTab === 'mode' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Default Website Appearance Mode
                </h2>
                <p className="text-xs text-gray-500">
                  Select the default appearance mode for all portal visitors. Readable contrast is automatically enforced.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    id: 'light',
                    title: 'Light Mode',
                    desc: 'High-clarity bright surfaces for daytime enterprise productivity.',
                    icon: Sun,
                    previewBg: 'bg-slate-50 border-gray-200 text-gray-900',
                  },
                  {
                    id: 'dark',
                    title: 'Dark Mode',
                    desc: 'Low-glare slate surfaces with automatic high-contrast text.',
                    icon: Moon,
                    previewBg: 'bg-slate-900 border-slate-700 text-white',
                  },
                  {
                    id: 'system',
                    title: 'System Default',
                    desc: "Automatically adapts to each user's OS light/dark preference.",
                    icon: Monitor,
                    previewBg: 'bg-gradient-to-r from-slate-50 to-slate-900 border-gray-300 text-gray-800',
                  },
                ].map((m) => {
                  const Icon = m.icon;
                  const active = draftTheme.color_mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleFieldChange('color_mode', m.id)}
                      className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        active
                          ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/30'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-gray-700'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          {active && (
                            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">
                              Active
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">{m.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{m.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* D. TYPOGRAPHY CUSTOMIZATION */}
          {activeTab === 'typography' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Typography & Font Hierarchy
                </h2>
                <p className="text-xs text-gray-500">
                  Configure primary font families, heading and body fonts, base font scale, and font weights.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Global Font Family
                  </label>
                  <select
                    value={draftTheme.font_family || 'Sora'}
                    onChange={(e) => handleFieldChange('font_family', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Heading Font
                  </label>
                  <select
                    value={draftTheme.heading_font || draftTheme.font_family || 'Sora'}
                    onChange={(e) => handleFieldChange('heading_font', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Body Font
                  </label>
                  <select
                    value={draftTheme.body_font || draftTheme.font_family || 'Sora'}
                    onChange={(e) => handleFieldChange('body_font', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Base Font Size ({draftTheme.base_font_size})
                  </label>
                  <select
                    value={draftTheme.base_font_size || '16px'}
                    onChange={(e) => handleFieldChange('base_font_size', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    {['14px', '15px', '16px', '17px', '18px'].map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Heading Font Weight
                  </label>
                  <select
                    value={draftTheme.heading_weight || '700'}
                    onChange={(e) => handleFieldChange('heading_weight', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    <option value="500">500 (Medium)</option>
                    <option value="600">600 (Semi-Bold)</option>
                    <option value="700">700 (Bold)</option>
                    <option value="800">800 (Extra-Bold)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Body Font Weight
                  </label>
                  <select
                    value={draftTheme.body_weight || '400'}
                    onChange={(e) => handleFieldChange('body_weight', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    <option value="400">400 (Regular)</option>
                    <option value="500">500 (Medium)</option>
                    <option value="600">600 (Semi-Bold)</option>
                  </select>
                </div>
              </div>

              {/* Typography Specimen Preview Card */}
              <div
                className="p-5 rounded-2xl border border-gray-200 bg-slate-50/70 space-y-2"
                style={{
                  fontFamily: `'${draftTheme.body_font || draftTheme.font_family}', sans-serif`,
                  fontSize: draftTheme.base_font_size,
                  fontWeight: draftTheme.body_weight,
                }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Live Typography Specimen
                </span>
                <h3
                  className="text-lg text-gray-900"
                  style={{
                    fontFamily: `'${draftTheme.heading_font || draftTheme.font_family}', sans-serif`,
                    fontWeight: draftTheme.heading_weight,
                  }}
                >
                  The quick brown fox jumps over the lazy dog
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Heading Font: <strong>{draftTheme.heading_font}</strong> ({draftTheme.heading_weight}) • Body Font:{' '}
                  <strong>{draftTheme.body_font}</strong> ({draftTheme.body_weight}) • Base Size:{' '}
                  <strong>{draftTheme.base_font_size}</strong>
                </p>
              </div>
            </div>
          )}

          {/* E. COMPONENT STYLING */}
          {activeTab === 'appearance' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Component Geometry & Layout Styling
                </h2>
                <p className="text-xs text-gray-500">
                  Fine-tune border radii, container spacing, button styling, elevation shadows, and sidebar width.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Button Border Radius
                  </label>
                  <select
                    value={draftTheme.button_radius || '12px'}
                    onChange={(e) => handleFieldChange('button_radius', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    <option value="0px">0px (Sharp Square)</option>
                    <option value="6px">6px (Subtle)</option>
                    <option value="10px">10px (Modern)</option>
                    <option value="12px">12px (Rounded Default)</option>
                    <option value="9999px">9999px (Full Pill)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Card Border Radius
                  </label>
                  <select
                    value={draftTheme.border_radius || '16px'}
                    onChange={(e) => handleFieldChange('border_radius', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    <option value="4px">4px (Minimal)</option>
                    <option value="8px">8px (Compact)</option>
                    <option value="12px">12px (Standard)</option>
                    <option value="16px">16px (Enterprise Default)</option>
                    <option value="24px">24px (Soft Modern)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Input Field Border Radius
                  </label>
                  <select
                    value={draftTheme.input_radius || '12px'}
                    onChange={(e) => handleFieldChange('input_radius', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    <option value="4px">4px (Sharp)</option>
                    <option value="8px">8px (Medium)</option>
                    <option value="12px">12px (Rounded Default)</option>
                    <option value="16px">16px (Extra Rounded)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Container Spacing
                  </label>
                  <select
                    value={draftTheme.container_spacing || '24px'}
                    onChange={(e) => handleFieldChange('container_spacing', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    <option value="16px">16px (Compact)</option>
                    <option value="24px">24px (Standard)</option>
                    <option value="32px">32px (Spacious)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Button Style
                  </label>
                  <select
                    value={draftTheme.button_style || 'solid'}
                    onChange={(e) => handleFieldChange('button_style', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    <option value="solid">Solid Fill</option>
                    <option value="gradient">Brand Gradient</option>
                    <option value="outline">Outlined Accent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Shadow Intensity
                  </label>
                  <select
                    value={draftTheme.shadow_intensity || 'medium'}
                    onChange={(e) => handleFieldChange('shadow_intensity', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    <option value="none">None (Flat)</option>
                    <option value="soft">Soft Elevation</option>
                    <option value="medium">Medium SaaS</option>
                    <option value="strong">Strong Depth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Sidebar Width
                  </label>
                  <select
                    value={draftTheme.sidebar_width || '256px'}
                    onChange={(e) => handleFieldChange('sidebar_width', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                  >
                    <option value="224px">224px (Slim)</option>
                    <option value="256px">256px (Default)</option>
                    <option value="288px">288px (Wide)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: MODULE 3 INTERACTIVE LIVE THEME PREVIEW PANEL */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4 sticky top-20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Interactive Live Theme Preview</span>
                </h2>
                <p className="text-[11px] text-gray-500">
                  Instant sandbox preview. Public users are unaffected until you click Publish Theme.
                </p>
              </div>

              <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-gray-200">
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
            </div>

            {/* Simulated Full Website Container */}
            <div
              className={`border overflow-hidden transition-all mx-auto ${
                previewDevice === 'mobile' ? 'max-w-[330px]' : 'w-full'
              }`}
              style={{
                backgroundColor: previewBgColor,
                borderColor: previewBorderColor,
                borderRadius: draftTheme.border_radius,
                fontFamily: `'${draftTheme.body_font || draftTheme.font_family}', sans-serif`,
                color: previewTextColor,
              }}
            >
              {/* 1. Sample Website Header */}
              <div
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{
                  backgroundColor: previewHeaderColor,
                  borderColor: previewBorderColor,
                }}
              >
                <div className="flex items-center space-x-2.5">
                  <img
                    src={
                      previewDevice === 'mobile'
                        ? branding.mobile_logo || branding.primary_logo || '/beat-logo.png'
                        : isPreviewDark
                        ? branding.dark_logo || branding.primary_logo || '/beat-logo.png'
                        : branding.primary_logo || '/beat-logo.png'
                    }
                    alt="Logo"
                    className="h-7 w-auto object-contain"
                  />
                  <span
                    className="text-xs font-bold truncate"
                    style={{
                      fontFamily: `'${draftTheme.heading_font || draftTheme.font_family}', sans-serif`,
                      fontWeight: draftTheme.heading_weight,
                      color: previewTextColor,
                    }}
                  >
                    {branding.site_name || 'Beat Internship Portal'}
                  </span>
                </div>
                <span
                  className="px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: draftTheme.accent_color,
                    color: '#FFFFFF',
                    borderRadius: draftTheme.button_radius,
                  }}
                >
                  {draftTheme.theme_name}
                </span>
              </div>

              {/* 2. Sample Navigation Menu + Content Area */}
              <div className="flex">
                {previewDevice === 'desktop' && (
                  <div
                    className="w-36 border-r p-3 space-y-1.5 shrink-0"
                    style={{
                      backgroundColor:
                        isPreviewDark && draftTheme.sidebar_color === '#FFFFFF'
                          ? '#1E293B'
                          : draftTheme.sidebar_color,
                      borderColor: previewBorderColor,
                    }}
                  >
                    <div
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-white"
                      style={{
                        backgroundColor: draftTheme.primary_color,
                        borderRadius: draftTheme.button_radius,
                      }}
                    >
                      Dashboard
                    </div>
                    <div
                      className="px-2.5 py-1.5 text-[11px] font-medium"
                      style={{ color: previewSubTextColor }}
                    >
                      Intern Registry
                    </div>
                    <div
                      className="px-2.5 py-1.5 text-[11px] font-medium"
                      style={{ color: previewSubTextColor }}
                    >
                      Assignments
                    </div>
                    <div
                      className="px-2.5 py-1.5 text-[11px] font-medium"
                      style={{ color: previewSubTextColor }}
                    >
                      Certificates
                    </div>
                  </div>
                )}

                {/* Main Preview Canvas */}
                <div
                  className="flex-1 space-y-3"
                  style={{ padding: draftTheme.container_spacing === '32px' ? '20px' : '14px' }}
                >
                  {/* 3. Sample Cards */}
                  <div
                    className="p-3.5 border"
                    style={{
                      backgroundColor: previewSurfaceColor,
                      borderColor: previewBorderColor,
                      borderRadius: draftTheme.border_radius,
                      boxShadow: previewShadow,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs"
                        style={{
                          fontFamily: `'${draftTheme.heading_font || draftTheme.font_family}', sans-serif`,
                          fontWeight: draftTheme.heading_weight,
                          color: previewTextColor,
                        }}
                      >
                        Internship Cohort Analytics
                      </span>
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: draftTheme.secondary_color }}
                      >
                        +24.5%
                      </span>
                    </div>
                    <p
                      className="text-[11px] mt-1"
                      style={{
                        color: previewSubTextColor,
                        fontWeight: draftTheme.body_weight,
                      }}
                    >
                      Live preview of cards, typography weights, and border radii.
                    </p>
                    <div className="mt-2">
                      <a
                        href="#preview-link"
                        onClick={(e) => e.preventDefault()}
                        className="text-[11px] font-semibold underline"
                        style={{ color: draftTheme.link_color }}
                      >
                        Explore Cohort Report →
                      </a>
                    </div>
                  </div>

                  {/* 4. Sample Form & Buttons */}
                  <div
                    className="p-3.5 border space-y-2.5"
                    style={{
                      backgroundColor: previewSurfaceColor,
                      borderColor: previewBorderColor,
                      borderRadius: draftTheme.border_radius,
                      boxShadow: previewShadow,
                    }}
                  >
                    <div
                      className="text-[11px] font-bold"
                      style={{
                        fontFamily: `'${draftTheme.heading_font || draftTheme.font_family}', sans-serif`,
                        color: previewTextColor,
                      }}
                    >
                      Quick Intern Evaluation Form
                    </div>
                    <input
                      type="text"
                      readOnly
                      value="Emma Watson — Data Analytics"
                      className="w-full px-2.5 py-1.5 text-[11px] border"
                      style={{
                        backgroundColor: previewBgColor,
                        borderColor: previewBorderColor,
                        borderRadius: draftTheme.input_radius,
                        color: previewTextColor,
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-[11px] font-semibold transition-all"
                        style={{
                          background:
                            draftTheme.button_style === 'gradient'
                              ? `linear-gradient(135deg, ${draftTheme.primary_color}, ${draftTheme.secondary_color})`
                              : draftTheme.button_style === 'outline'
                              ? 'transparent'
                              : draftTheme.button_color || draftTheme.primary_color,
                          color:
                            draftTheme.button_style === 'outline'
                              ? draftTheme.button_color || draftTheme.primary_color
                              : '#FFFFFF',
                          border:
                            draftTheme.button_style === 'outline'
                              ? `1.5px solid ${draftTheme.button_color || draftTheme.primary_color}`
                              : 'none',
                          borderRadius: draftTheme.button_radius,
                        }}
                      >
                        Primary Button
                      </button>

                      <button
                        type="button"
                        className="px-3 py-1.5 text-[11px] font-semibold text-white"
                        style={{
                          backgroundColor: draftTheme.secondary_color,
                          borderRadius: draftTheme.button_radius,
                        }}
                      >
                        Secondary
                      </button>

                      <span
                        className="px-2 py-0.5 text-[10px] font-bold text-white"
                        style={{
                          backgroundColor: draftTheme.accent_color,
                          borderRadius: draftTheme.button_radius,
                        }}
                      >
                        Accent Badge
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Sample Website Footer */}
              <div
                className="px-4 py-2.5 border-t flex items-center justify-between text-[10px]"
                style={{
                  backgroundColor: previewHeaderColor,
                  borderColor: previewBorderColor,
                  color: previewSubTextColor,
                }}
              >
                <span>© {new Date().getFullYear()} {branding.site_name}</span>
                <span style={{ color: draftTheme.link_color }}>Privacy • Terms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-100 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Reset Website Theme to Default?
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              This will discard any saved draft and restore the public website theme to{' '}
              <strong>Default Professional</strong> (#2563EB, Sora, Light Mode).
            </p>
            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDefault}
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

export default AdminTheme;
