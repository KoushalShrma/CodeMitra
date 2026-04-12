import PropTypes from 'prop-types';

/**
 * Dropdown selector for programming language inside the editor toolbar.
 * @param {{options: Array<{key: string, label: string}>, value: string, onChange: (value: string) => void}} props Selector props.
 * @returns {JSX.Element} Language selector control.
 */
export function LanguageSelector({ options, value, onChange }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <span className="label-text">Language</span>
      <select
        className="ui-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Select programming language"
        style={{ minWidth: 140, paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)' }}
      >
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

LanguageSelector.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
