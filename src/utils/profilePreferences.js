const ALLOWED_THEMES = new Set(['dark', 'light']);
const ALLOWED_LANGUAGES = new Set(['javascript', 'python', 'java', 'cpp']);

const DEFAULT_PROFILE_PREFERENCES = {
  theme_mode: null,
  editor_font_size: 15,
  sidebar_collapsed: false,
  preferred_language: 'javascript',
  vim_mode: false,
  active_institution_id: '',
  locale: '',
  timezone: '',
};

function normalizeTheme(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return ALLOWED_THEMES.has(normalized) ? normalized : null;
}

function normalizeLanguage(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return ALLOWED_LANGUAGES.has(normalized)
    ? normalized
    : DEFAULT_PROFILE_PREFERENCES.preferred_language;
}

function normalizeFontSize(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_PROFILE_PREFERENCES.editor_font_size;
  }
  return Math.min(22, Math.max(12, Math.round(parsed)));
}

function normalizeBoolean(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === '1' || value === 1) {
    return true;
  }
  if (value === 'false' || value === '0' || value === 0) {
    return false;
  }
  return fallback;
}

function normalizeText(value) {
  if (value == null) {
    return '';
  }
  return String(value).trim();
}

export function normalizeProfilePreferences(rawPreferences) {
  const source = rawPreferences || {};

  return {
    theme_mode: normalizeTheme(source.theme_mode),
    editor_font_size: normalizeFontSize(source.editor_font_size),
    sidebar_collapsed: normalizeBoolean(
      source.sidebar_collapsed,
      DEFAULT_PROFILE_PREFERENCES.sidebar_collapsed
    ),
    preferred_language: normalizeLanguage(source.preferred_language),
    vim_mode: normalizeBoolean(source.vim_mode, DEFAULT_PROFILE_PREFERENCES.vim_mode),
    active_institution_id: normalizeText(source.active_institution_id),
    locale: normalizeText(source.locale),
    timezone: normalizeText(source.timezone),
  };
}

export { DEFAULT_PROFILE_PREFERENCES };
