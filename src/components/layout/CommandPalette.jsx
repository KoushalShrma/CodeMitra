import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Spotlight-style command palette for fast keyboard-driven navigation.
 * @param {{isOpen: boolean, onClose: () => void, commands: Array<{id: string, title: string, hint?: string, run: () => void}>}} props Command palette props.
 * @returns {JSX.Element | null} Command palette overlay.
 */
export function CommandPalette({ isOpen, onClose, commands }) {
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return commands;
    }

    return commands.filter((command) => {
      const title = command.title.toLowerCase();
      const hint = String(command.hint || '').toLowerCase();
      return title.includes(normalized) || hint.includes(normalized);
    });
  }, [commands, query]);

  const activeIndex = filtered.length ? Math.min(highlightedIndex, filtered.length - 1) : 0;

  const closePalette = () => {
    setQuery('');
    setHighlightedIndex(0);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="command-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={closePalette}
        >
          <motion.div
            className="command-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <label htmlFor="command-palette-search" className="visually-hidden">
              Search commands
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '16px 1fr',
                gap: 'var(--space-2)',
                alignItems: 'center',
                padding: 'var(--space-4)',
              }}
            >
              <Search size={16} color="var(--color-text-secondary)" />
              <input
                ref={inputRef}
                id="command-palette-search"
                className="ui-input"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    closePalette();
                    return;
                  }

                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setHighlightedIndex((current) =>
                      filtered.length ? Math.min(current + 1, filtered.length - 1) : 0
                    );
                    return;
                  }

                  if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setHighlightedIndex((current) =>
                      filtered.length ? Math.max(current - 1, 0) : 0
                    );
                    return;
                  }

                  if (event.key === 'Enter' && filtered[activeIndex]) {
                    event.preventDefault();
                    filtered[activeIndex].run();
                    closePalette();
                  }
                }}
                placeholder="Navigate, switch theme, open pages..."
                style={{ border: 'none', background: 'transparent', padding: 0 }}
              />
            </div>

            <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
              {filtered.length ? (
                filtered.map((command, index) => (
                  <button
                    key={command.id}
                    type="button"
                    className="command-item"
                    aria-pressed={index === activeIndex}
                    onClick={() => {
                      command.run();
                      closePalette();
                    }}
                  >
                    <span>{command.title}</span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                      {command.hint}
                    </span>
                  </button>
                ))
              ) : (
                <p style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
                  No matching commands.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

CommandPalette.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  commands: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      hint: PropTypes.string,
      run: PropTypes.func.isRequired,
    })
  ).isRequired,
};
