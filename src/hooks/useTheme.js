import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const THEME_STORAGE_KEY = 'codemitra-theme';
const ThemeContext = createContext(null);

/**
 * Determines the initial theme from localStorage or system preference.
 * @returns {"dark" | "light"} Initial theme value.
 */
function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/**
 * Theme provider that manages dark/light mode with persistence and system preference fallback.
 * @param {{ children: import("react").ReactNode }} props Provider props.
 * @returns {JSX.Element} Theme context provider.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');

    const onChange = (event) => {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return;
      }
      setTheme(event.matches ? 'light' : 'dark');
    };

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme() {
        setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
      },
    }),
    [theme]
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Returns theme state and actions.
 * @returns {{ theme: "dark" | "light", setTheme: (value: "dark" | "light") => void, toggleTheme: () => void }} Theme API.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}
