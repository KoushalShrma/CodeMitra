import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

function CodeEditor({
  language,
  code,
  onCodeChange,
  onLanguageChange,
  onRun,
  onSubmit,
  templates,
  isRunning,
  isSubmitting,
  onLargePaste,
  largePasteThreshold = 120,
}) {
  const pasteDisposableRef = useRef(null);

  useEffect(() => {
    return () => {
      pasteDisposableRef.current?.dispose();
    };
  }, []);

  const handleEditorMount = (editorInstance) => {
    pasteDisposableRef.current?.dispose();

    pasteDisposableRef.current = editorInstance.onDidPaste((event) => {
      const pastedText = editorInstance.getModel()?.getValueInRange(event.range) || '';

      if (pastedText.length >= largePasteThreshold) {
        onLargePaste?.({
          pastedLength: pastedText.length,
          preview: pastedText.slice(0, 180),
        });
      }
    });
  };

  return (
    <section className="editor-shell card-surface flex h-full min-h-[360px] flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border/70 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <label htmlFor="language" className="text-sm font-medium text-brand-muted">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
            className="rounded-lg border border-brand-border bg-brand-elevated px-3 py-2 text-sm text-brand-text outline-none transition-all duration-200 focus:border-brand-secondary focus:shadow-[0_0_0_3px_rgba(127,151,255,0.2)]"
          >
            {Object.keys(templates).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRun}
            disabled={isRunning}
            className="rounded-lg border border-brand-border bg-brand-elevated px-4 py-2 text-sm font-semibold text-brand-text transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-secondary hover:bg-brand-elevated/90 hover:shadow-[0_8px_20px_rgba(17,30,64,0.5)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isRunning ? 'Running...' : 'Run'}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-gradient-to-r from-brand-accent to-brand-accentSoft px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_rgba(34,198,163,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_12px_26px_rgba(34,198,163,0.45)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-brand-border/60 bg-brand-bg/35 px-4 py-2 text-xs text-brand-muted sm:px-5">
        <span className="font-medium text-brand-text/90">
          main.{language === 'C++' ? 'cpp' : language.toLowerCase()}
        </span>
        <span>UTF-8 | Spaces: 2 | Ln 1, Col 1</span>
      </div>

      <div className="flex-1 overflow-hidden rounded-b-2xl">
        <Editor
          height="100%"
          language={language === 'C++' ? 'cpp' : language.toLowerCase()}
          value={code}
          theme="vs-dark"
          onChange={(value) => onCodeChange(value ?? '')}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            smoothScrolling: true,
            tabSize: 2,
            padding: { top: 16 },
            cursorBlinking: 'smooth',
            scrollBeyondLastLine: false,
            roundedSelection: true,
          }}
        />
      </div>
    </section>
  );
}

export default CodeEditor;
