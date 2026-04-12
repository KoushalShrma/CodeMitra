import { useEffect, useState } from 'react';
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile';
import { useDebouncedPreferenceSave } from '../hooks/useDebouncedPreferenceSave';
import { useTheme } from '../hooks/useTheme';

function Settings() {
  const { theme, setTheme } = useTheme();
  const { profile, preferences, isLoading, error, updateProfile, isSaving } =
    useCurrentUserProfile();
  const { queuePreferencePatch, isSaving: isAutoSaving } = useDebouncedPreferenceSave();

  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('success');
  const [email, setEmail] = useState('');
  const [editorFontSize, setEditorFontSize] = useState(15);
  const [preferredLanguage, setPreferredLanguage] = useState('javascript');
  const [vimMode, setVimMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isDarkModeOn = theme === 'dark';

  useEffect(() => {
    setEmail(profile?.email || '');
  }, [profile?.email]);

  useEffect(() => {
    setEditorFontSize(preferences.editor_font_size);
    setPreferredLanguage(preferences.preferred_language);
    setVimMode(Boolean(preferences.vim_mode));
    setSidebarCollapsed(Boolean(preferences.sidebar_collapsed));
  }, [preferences]);

  const handleSaveEmail = async (event) => {
    event.preventDefault();
    setStatusMessage('');

    if (!email.trim()) {
      setStatusType('error');
      setStatusMessage('Email is required.');
      return;
    }

    try {
      await updateProfile({ email: email.trim().toLowerCase() });
      setStatusType('success');
      setStatusMessage('Email updated successfully.');
    } catch (saveError) {
      setStatusType('error');
      setStatusMessage(saveError instanceof Error ? saveError.message : 'Unable to update email');
    }
  };

  const handleSaveEditorDefaults = async (event) => {
    event.preventDefault();
    setStatusMessage('');

    try {
      await updateProfile({
        preferences: {
          editor_font_size: editorFontSize,
          preferred_language: preferredLanguage,
          vim_mode: vimMode,
          sidebar_collapsed: sidebarCollapsed,
        },
      });
      setStatusType('success');
      setStatusMessage('Editor defaults saved.');
    } catch (saveError) {
      setStatusType('error');
      setStatusMessage(
        saveError instanceof Error ? saveError.message : 'Unable to save editor defaults'
      );
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = isDarkModeOn ? 'light' : 'dark';
    setTheme(nextTheme);
    queuePreferencePatch({ theme_mode: nextTheme });
  };

  const handleToggleSidebarPreference = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    queuePreferencePatch({ sidebar_collapsed: next });
  };

  const pageError = error instanceof Error ? error.message : '';

  return (
    <section className="premium-page">
      <header className="premium-hero subtle-grid">
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
            Account Center
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-brand-text sm:text-3xl">
            Settings
          </h1>
          <p className="mt-3 text-sm leading-7 text-brand-muted sm:text-base">
            Control your account security, communication details, and interface preferences.
          </p>
        </div>
      </header>

      {isLoading ? (
        <section className="premium-card text-sm text-brand-muted">Loading settings...</section>
      ) : null}

      {pageError ? (
        <section className="premium-card">
          <p className="status-error m-0">{pageError}</p>
        </section>
      ) : null}

      {statusMessage ? (
        <p className={statusType === 'error' ? 'status-error' : 'status-success'}>
          {statusMessage}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="premium-card">
          <h2 className="text-lg font-semibold text-brand-text">Account Identity</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Email updates are persisted to your profile and restored on next sign-in.
          </p>

          <form className="mt-4 space-y-3" onSubmit={handleSaveEmail}>
            <label htmlFor="settings-email" className="text-xs font-medium text-brand-muted">
              Email
            </label>
            <input
              id="settings-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="form-input"
              placeholder="name@example.com"
            />
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-gradient-to-r from-brand-accent to-brand-accentSoft px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:brightness-105"
            >
              {isSaving ? 'Saving...' : 'Update Email'}
            </button>
          </form>
        </section>

        <section className="premium-card">
          <h2 className="text-lg font-semibold text-brand-text">Editor Defaults</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Persist preferred language, font size, and Vim mode across sessions.
          </p>

          <form className="mt-4 space-y-3" onSubmit={handleSaveEditorDefaults}>
            <label htmlFor="settings-language" className="text-xs font-medium text-brand-muted">
              Preferred Language
            </label>
            <select
              id="settings-language"
              value={preferredLanguage}
              onChange={(event) => setPreferredLanguage(event.target.value)}
              className="form-input"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>

            <label htmlFor="settings-font-size" className="text-xs font-medium text-brand-muted">
              Editor Font Size: {editorFontSize}
            </label>
            <input
              id="settings-font-size"
              type="range"
              min="12"
              max="22"
              value={editorFontSize}
              onChange={(event) => setEditorFontSize(Number(event.target.value))}
            />

            <button
              type="button"
              onClick={() => setVimMode((current) => !current)}
              className="rounded-xl border border-brand-border/70 bg-brand-elevated px-4 py-2.5 text-sm font-semibold text-brand-text"
            >
              Vim Mode: {vimMode ? 'On' : 'Off'}
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl border border-brand-secondary/65 bg-brand-elevated px-4 py-2.5 text-sm font-semibold text-brand-text transition hover:-translate-y-0.5 hover:border-brand-secondary"
            >
              {isSaving ? 'Saving...' : 'Save Editor Defaults'}
            </button>
          </form>
        </section>

        <section className="premium-card">
          <h2 className="text-lg font-semibold text-brand-text">Appearance</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Customize your workspace comfort preferences.
          </p>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-brand-border/70 bg-brand-elevated/35 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-brand-text">Dark mode</p>
              <p className="text-xs text-brand-muted">Synced to your backend profile.</p>
            </div>
            <button
              type="button"
              onClick={handleToggleTheme}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${
                isDarkModeOn ? 'bg-brand-accent/80' : 'bg-brand-border'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                  isDarkModeOn ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl border border-brand-border/70 bg-brand-elevated/35 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-brand-text">Collapsed Sidebar by default</p>
              <p className="text-xs text-brand-muted">Applied on your next session restore.</p>
            </div>
            <button
              type="button"
              onClick={handleToggleSidebarPreference}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${
                sidebarCollapsed ? 'bg-brand-accent/80' : 'bg-brand-border'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                  sidebarCollapsed ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <p className="mt-3 text-xs text-brand-muted">
            {isAutoSaving
              ? 'Saving appearance preferences...'
              : 'Appearance preferences sync automatically.'}
          </p>
        </section>

        <section className="premium-card border-rose-500/35">
          <h2 className="text-lg font-semibold text-rose-500">Danger Zone</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Permanently remove your account and learning history.
          </p>

          <button
            type="button"
            className="mt-4 rounded-xl border border-rose-500/55 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-500 transition hover:bg-rose-500/20"
          >
            Delete Account
          </button>
        </section>
      </div>
    </section>
  );
}

export default Settings;
