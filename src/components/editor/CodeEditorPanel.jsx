import { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { BrainCircuit, Play, RotateCcw, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { LanguageSelector } from './LanguageSelector';
import { Skeleton } from '../ui/Skeleton';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

/**
 * Main coding panel containing toolbar controls and Monaco editor instance.
 * @param {{languageKey: string, languageOptions: Array<{key: string, label: string}>, onLanguageChange: (value: string) => void, code: string, onCodeChange: (value: string) => void, onRun: () => void, onSubmit: () => void, onReset: () => void, onToggleAi: () => void, isRunning: boolean, isSubmitting: boolean, fontSize: number, setFontSize: (value: number) => void, vimMode: boolean, setVimMode: (value: boolean) => void}} props Editor props.
 * @returns {JSX.Element} Editor panel.
 */
export function CodeEditorPanel({
  languageKey,
  languageOptions,
  onLanguageChange,
  code,
  onCodeChange,
  onRun,
  onSubmit,
  onReset,
  onToggleAi,
  isRunning,
  isSubmitting,
  fontSize,
  setFontSize,
  vimMode,
  setVimMode,
}) {
  const monacoTheme =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'light'
      ? 'vs'
      : 'vs-dark';

  return (
    <section
      className="surface-card"
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        gap: 'var(--space-3)',
        minHeight: 500,
      }}
    >
      <header style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <div
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          <LanguageSelector
            options={languageOptions}
            value={languageKey}
            onChange={onLanguageChange}
          />

          <label
            className="label-text"
            htmlFor="font-size-range"
            style={{ marginLeft: 'var(--space-2)' }}
          >
            Font
          </label>
          <input
            id="font-size-range"
            type="range"
            min="12"
            max="22"
            value={fontSize}
            onChange={(event) => setFontSize(Number(event.target.value))}
            aria-label="Editor font size"
          />

          <Button variant={vimMode ? 'secondary' : 'ghost'} onClick={() => setVimMode(!vimMode)}>
            Vim: {vimMode ? 'On' : 'Off'}
          </Button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <Button onClick={onRun} disabled={isRunning}>
            <Play size={14} />
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting} variant="secondary">
            <Send size={14} />
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
          <Button onClick={onReset} variant="ghost">
            <RotateCcw size={14} />
            Reset
          </Button>
          <Button onClick={onToggleAi} variant="ghost">
            <BrainCircuit size={14} />
            AI Assist
          </Button>
        </div>
      </header>

      <div className="mono-panel" style={{ overflow: 'hidden', minHeight: 360 }}>
        <Suspense fallback={<Skeleton height="100%" width="100%" radius="0" />}>
          <MonacoEditor
            language={languageKey === 'cpp' ? 'cpp' : languageKey}
            value={code}
            onChange={(value) => onCodeChange(value || '')}
            theme={monacoTheme}
            loading="Loading editor..."
            options={{
              fontFamily: 'var(--font-mono)',
              fontSize,
              minimap: { enabled: false },
              smoothScrolling: true,
              automaticLayout: true,
              wordWrap: 'on',
              lineNumbers: 'on',
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              bracketPairColorization: { enabled: true },
            }}
          />
        </Suspense>
      </div>
    </section>
  );
}

CodeEditorPanel.propTypes = {
  languageKey: PropTypes.string.isRequired,
  languageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  onLanguageChange: PropTypes.func.isRequired,
  code: PropTypes.string.isRequired,
  onCodeChange: PropTypes.func.isRequired,
  onRun: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onToggleAi: PropTypes.func.isRequired,
  isRunning: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  fontSize: PropTypes.number.isRequired,
  setFontSize: PropTypes.func.isRequired,
  vimMode: PropTypes.bool.isRequired,
  setVimMode: PropTypes.func.isRequired,
};
