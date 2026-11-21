import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';

const ThemeContext = createContext();

export const DEFAULT_BRANDING = {
  site_name: 'Beat Internship Portal',
  primary_logo: '/beat-logo.png',
  dark_logo: '/beat-logo.png',
  light_logo: '/beat-logo.png',
  mobile_logo: '/beat-logo.png',
  favicon: '/beat-logo.png',
};

export const DEFAULT_THEME = {
  theme_name: 'Default Professional',
  primary_color: '#2563EB',
  secondary_color: '#4F46E5',
  accent_color: '#F59E0B',
  background_color: '#F8FAFC',
  surface_color: '#FFFFFF',
  text_color: '#0F172A',
  secondary_text_color: '#475569',
  border_color: '#E2E8F0',
  sidebar_color: '#FFFFFF',
  header_color: '#FFFFFF',
  button_color: '#2563EB',
  link_color: '#2563EB',
  font_family: 'Sora',
  heading_font: 'Sora',
  body_font: 'Sora',
  base_font_size: '16px',
  heading_weight: '700',
  body_weight: '400',
  border_radius: '16px',
  button_radius: '12px',
  input_radius: '12px',
  container_spacing: '24px',
  button_style: 'solid',
  shadow_intensity: 'medium',
  sidebar_width: '256px',
  color_mode: 'light',
};

export const THEME_PRESETS = [
  {
    theme_name: 'Default Professional',
    description: 'Clean enterprise indigo & slate palette',
    primary_color: '#2563EB',
    secondary_color: '#4F46E5',
    accent_color: '#F59E0B',
    background_color: '#F8FAFC',
    surface_color: '#FFFFFF',
    text_color: '#0F172A',
    secondary_text_color: '#475569',
    border_color: '#E2E8F0',
    sidebar_color: '#FFFFFF',
    header_color: '#FFFFFF',
    button_color: '#2563EB',
    link_color: '#2563EB',
    font_family: 'Sora',
    heading_font: 'Sora',
    body_font: 'Sora',
    color_mode: 'light',
  },
  {
    theme_name: 'Modern Blue',
    description: 'Crisp corporate sky & cobalt blue aesthetic',
    primary_color: '#0284C7',
    secondary_color: '#2563EB',
    accent_color: '#06B6D4',
    background_color: '#F0F9FF',
    surface_color: '#FFFFFF',
    text_color: '#0C4A6E',
    secondary_text_color: '#334155',
    border_color: '#BAE6FD',
    sidebar_color: '#FFFFFF',
    header_color: '#FFFFFF',
    button_color: '#0284C7',
    link_color: '#0284C7',
    font_family: 'Inter',
    heading_font: 'Inter',
    body_font: 'Inter',
    color_mode: 'light',
  },
  {
    theme_name: 'Royal Purple',
    description: 'Deep executive violet and Beat signature purple',
    primary_color: '#7C3AED',
    secondary_color: '#4B3A9B',
    accent_color: '#EC4899',
    background_color: '#FAF5FF',
    surface_color: '#FFFFFF',
    text_color: '#1E1B4B',
    secondary_text_color: '#4C1D95',
    border_color: '#E9D5FF',
    sidebar_color: '#FFFFFF',
    header_color: '#FFFFFF',
    button_color: '#7C3AED',
    link_color: '#7C3AED',
    font_family: 'Poppins',
    heading_font: 'Poppins',
    body_font: 'Poppins',
    color_mode: 'light',
  },
  {
    theme_name: 'Emerald Green',
    description: 'Fresh, sustainable growth & fintech emerald',
    primary_color: '#059669',
    secondary_color: '#0D9488',
    accent_color: '#F59E0B',
    background_color: '#ECFDF5',
    surface_color: '#FFFFFF',
    text_color: '#064E3B',
    secondary_text_color: '#374151',
    border_color: '#A7F3D0',
    sidebar_color: '#FFFFFF',
    header_color: '#FFFFFF',
    button_color: '#059669',
    link_color: '#059669',
    font_family: 'Inter',
    heading_font: 'Inter',
    body_font: 'Inter',
    color_mode: 'light',
  },
  {
    theme_name: 'Minimal Black & White',
    description: 'High-contrast monochrome editorial design',
    primary_color: '#18181B',
    secondary_color: '#3F3F46',
    accent_color: '#71717A',
    background_color: '#FAFAFA',
    surface_color: '#FFFFFF',
    text_color: '#09090B',
    secondary_text_color: '#52525B',
    border_color: '#E4E4E7',
    sidebar_color: '#FFFFFF',
    header_color: '#FFFFFF',
    button_color: '#18181B',
    link_color: '#18181B',
    font_family: 'Inter',
    heading_font: 'Inter',
    body_font: 'Inter',
    color_mode: 'light',
  },
  {
    theme_name: 'Ocean Blue',
    description: 'Deep navy & teal maritime executive look',
    primary_color: '#0F766E',
    secondary_color: '#1D4ED8',
    accent_color: '#38BDF8',
    background_color: '#F0FDFA',
    surface_color: '#FFFFFF',
    text_color: '#134E4A',
    secondary_text_color: '#475569',
    border_color: '#99F6E4',
    sidebar_color: '#FFFFFF',
    header_color: '#FFFFFF',
    button_color: '#0F766E',
    link_color: '#0F766E',
    font_family: 'Roboto',
    heading_font: 'Roboto',
    body_font: 'Roboto',
    color_mode: 'light',
  },
  {
    theme_name: 'Warm Orange',
    description: 'Energetic sunset amber and terracotta accents',
    primary_color: '#EA580C',
    secondary_color: '#D97706',
    accent_color: '#E11D48',
    background_color: '#FFF7ED',
    surface_color: '#FFFFFF',
    text_color: '#431407',
    secondary_text_color: '#57534E',
    border_color: '#FED7AA',
    sidebar_color: '#FFFFFF',
    header_color: '#FFFFFF',
    button_color: '#EA580C',
    link_color: '#EA580C',
    font_family: 'Open Sans',
    heading_font: 'Open Sans',
    body_font: 'Open Sans',
    color_mode: 'light',
  },
  {
    theme_name: 'Custom Theme',
    description: 'Fully personalized colors, fonts & components',
    primary_color: '#3B82F6',
    secondary_color: '#6366F1',
    accent_color: '#10B981',
    background_color: '#0F172A',
    surface_color: '#1E293B',
    text_color: '#F8FAFC',
    secondary_text_color: '#94A3B8',
    border_color: '#334155',
    sidebar_color: '#1E293B',
    header_color: '#1E293B',
    button_color: '#3B82F6',
    link_color: '#60A5FA',
    font_family: 'Lato',
    heading_font: 'Lato',
    body_font: 'Lato',
    color_mode: 'dark',
  },
];

function hexToRgb(hex) {
  const clean = (hex || '#2563EB').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return { r: 37, g: 99, b: 235 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function mixRgb(c1, c2, weight) {
  const w = Math.max(0, Math.min(1, weight));
  const r = Math.round(c1.r * (1 - w) + c2.r * w);
  const g = Math.round(c1.g * (1 - w) + c2.g * w);
  const b = Math.round(c1.b * (1 - w) + c2.b * w);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function generateColorShades(hex) {
  const base = hexToRgb(hex);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 10, g: 12, b: 28 };
  return {
    50: mixRgb(base, white, 0.92),
    100: mixRgb(base, white, 0.84),
    200: mixRgb(base, white, 0.68),
    300: mixRgb(base, white, 0.48),
    400: mixRgb(base, white, 0.26),
    500: mixRgb(base, white, 0.1),
    600: hex || '#2563EB',
    700: mixRgb(base, black, 0.16),
    800: mixRgb(base, black, 0.34),
    900: mixRgb(base, black, 0.52),
    950: mixRgb(base, black, 0.7),
  };
}

export const ThemeProvider = ({ children }) => {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [publishedTheme, setPublishedTheme] = useState(DEFAULT_THEME);
  const [activeTheme, setActiveTheme] = useState(DEFAULT_THEME);
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  const applyThemeToDom = useCallback((themeObj, brandingObj) => {
    if (typeof document === 'undefined') return;
    const t = { ...DEFAULT_THEME, ...(themeObj || {}) };
    const b = { ...DEFAULT_BRANDING, ...(brandingObj || {}) };
    const root = document.documentElement;

    // Resolve color mode (light / dark / system)
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = t.color_mode === 'dark' || (t.color_mode === 'system' && prefersDark);

    if (isDark) {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }

    const effectiveBg = isDark && t.background_color === '#F8FAFC' ? '#0F172A' : t.background_color;
    const effectiveSurface = isDark && t.surface_color === '#FFFFFF' ? '#1E293B' : t.surface_color;
    const effectiveText = isDark && t.text_color === '#0F172A' ? '#F8FAFC' : t.text_color;
    const effectiveSecondaryText = isDark && t.secondary_text_color === '#475569' ? '#94A3B8' : t.secondary_text_color;
    const effectiveBorder = isDark && t.border_color === '#E2E8F0' ? '#334155' : t.border_color;
    const effectiveSidebar = isDark && t.sidebar_color === '#FFFFFF' ? '#1E293B' : t.sidebar_color;
    const effectiveHeader = isDark && t.header_color === '#FFFFFF' ? '#1E293B' : t.header_color;

    // Apply primary shades to Tailwind v4 --color-blue-* and --color-indigo-*
    const primaryShades = generateColorShades(t.primary_color);
    const secondaryShades = generateColorShades(t.secondary_color || t.primary_color);

    Object.entries(primaryShades).forEach(([shade, hexVal]) => {
      root.style.setProperty(`--color-blue-${shade}`, hexVal);
    });
    Object.entries(secondaryShades).forEach(([shade, hexVal]) => {
      root.style.setProperty(`--color-indigo-${shade}`, hexVal);
    });
    root.style.setProperty('--color-violet-50', primaryShades[50]);
    root.style.setProperty('--color-violet-100', primaryShades[100]);
    root.style.setProperty('--color-violet-500', primaryShades[500]);
    root.style.setProperty('--color-violet-600', primaryShades[600]);
    root.style.setProperty('--color-violet-700', primaryShades[700]);

    // Semantic theme variables
    root.style.setProperty('--color-primary', t.primary_color);
    root.style.setProperty('--color-secondary', t.secondary_color);
    root.style.setProperty('--color-accent', t.accent_color);
    root.style.setProperty('--color-background', effectiveBg);
    root.style.setProperty('--color-surface', effectiveSurface);
    root.style.setProperty('--color-text', effectiveText);
    root.style.setProperty('--color-secondary-text', effectiveSecondaryText);
    root.style.setProperty('--color-border', effectiveBorder);
    root.style.setProperty('--color-sidebar', effectiveSidebar);
    root.style.setProperty('--color-header', effectiveHeader);
    root.style.setProperty('--color-button', t.button_color || t.primary_color);
    root.style.setProperty('--color-link', t.link_color || t.primary_color);

    // Typography variables
    const fontFamily = t.font_family || 'Sora';
    const headingFont = t.heading_font || fontFamily;
    const bodyFont = t.body_font || fontFamily;
    root.style.setProperty('--font-sans', `'${bodyFont}', Inter, system-ui, sans-serif`);
    root.style.setProperty('--font-heading', `'${headingFont}', sans-serif`);
    root.style.setProperty('--font-body', `'${bodyFont}', sans-serif`);
    root.style.setProperty('--base-font-size', t.base_font_size || '16px');
    root.style.setProperty('--heading-weight', t.heading_weight || '700');
    root.style.setProperty('--body-weight', t.body_weight || '400');

    // Component geometry variables
    root.style.setProperty('--radius-card', t.border_radius || '16px');
    root.style.setProperty('--radius-button', t.button_radius || '12px');
    root.style.setProperty('--radius-input', t.input_radius || '12px');
    root.style.setProperty('--container-spacing', t.container_spacing || '24px');
    root.style.setProperty('--sidebar-width', t.sidebar_width || '256px');

    // Dynamic site title & favicon
    if (b.site_name) {
      document.title = b.site_name;
    }
    if (b.favicon) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = b.favicon;
    }
  }, []);

  const refreshWebsiteConfig = useCallback(async () => {
    try {
      const res = await client.get('/public/website-config/');
      const fetchedBranding = res.data?.branding || DEFAULT_BRANDING;
      const fetchedTheme = res.data?.theme || DEFAULT_THEME;
      setBranding(fetchedBranding);
      setPublishedTheme(fetchedTheme);
      setActiveTheme(fetchedTheme);
      applyThemeToDom(fetchedTheme, fetchedBranding);
      return { branding: fetchedBranding, theme: fetchedTheme };
    } catch {
      applyThemeToDom(DEFAULT_THEME, DEFAULT_BRANDING);
      return { branding: DEFAULT_BRANDING, theme: DEFAULT_THEME };
    } finally {
      setIsLoadingTheme(false);
    }
  }, [applyThemeToDom]);

  useEffect(() => {
    refreshWebsiteConfig();
  }, [refreshWebsiteConfig]);

  const updateLiveBranding = useCallback(
    (nextBranding) => {
      const merged = { ...branding, ...nextBranding };
      setBranding(merged);
      applyThemeToDom(activeTheme, merged);
    },
    [branding, activeTheme, applyThemeToDom]
  );

  const updateLiveTheme = useCallback(
    (nextTheme, markAsPublished = false) => {
      const merged = { ...activeTheme, ...nextTheme };
      setActiveTheme(merged);
      if (markAsPublished) {
        setPublishedTheme(merged);
      }
      applyThemeToDom(merged, branding);
    },
    [activeTheme, branding, applyThemeToDom]
  );

  const revertLiveThemeToPublished = useCallback(() => {
    setActiveTheme(publishedTheme);
    applyThemeToDom(publishedTheme, branding);
  }, [publishedTheme, branding, applyThemeToDom]);

  return (
    <ThemeContext.Provider
      value={{
        branding,
        publishedTheme,
        theme: activeTheme,
        isLoadingTheme,
        refreshWebsiteConfig,
        updateLiveBranding,
        updateLiveTheme,
        revertLiveThemeToPublished,
        applyThemeToDom,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      branding: DEFAULT_BRANDING,
      publishedTheme: DEFAULT_THEME,
      theme: DEFAULT_THEME,
      isLoadingTheme: false,
      refreshWebsiteConfig: async () => {},
      updateLiveBranding: () => {},
      updateLiveTheme: () => {},
      revertLiveThemeToPublished: () => {},
      applyThemeToDom: () => {},
    };
  }
  return ctx;
};
