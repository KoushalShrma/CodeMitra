import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import PropTypes from 'prop-types';
import { useTheme } from '../../hooks/useTheme';

/**
 * Theme toggle button with animated sun/moon icon morph and persistent mode switching.
 * @param {{className?: string}} props Optional class name.
 * @returns {JSX.Element} Theme toggle control.
 */
export function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className || 'ui-button ui-button-ghost'}
      aria-label="Toggle dark and light theme"
      title="Toggle theme"
      style={{ width: 38, height: 38, padding: 0 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'dark' ? (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: -40, scale: 0.65 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 40, scale: 0.65 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ display: 'inline-flex' }}
          >
            <Moon size={16} />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: 40, scale: 0.65 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -40, scale: 0.65 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ display: 'inline-flex' }}
          >
            <Sun size={16} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

ThemeToggle.propTypes = {
  className: PropTypes.string,
};
