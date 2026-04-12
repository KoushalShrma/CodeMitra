import PropTypes from 'prop-types';
import { cn } from '../../utils/ui/cn';

/**
 * Accessible input primitive with optional label and hint text.
 * @param {{id: string, label?: string, hint?: string, className?: string, value?: string, placeholder?: string, onChange?: (event: import("react").ChangeEvent<HTMLInputElement>) => void, type?: string}} props Input props.
 * @returns {JSX.Element} Labeled input block.
 */
export function Input({ id, label, hint, className, value, placeholder, onChange, type = 'text' }) {
  return (
    <label htmlFor={id} style={{ display: 'grid', gap: 'var(--space-2)' }}>
      {label ? <span className="label-text">{label}</span> : null}
      <input
        id={id}
        value={value}
        type={type}
        placeholder={placeholder}
        onChange={onChange}
        className={cn('ui-input', className)}
      />
      {hint ? (
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>{hint}</span>
      ) : null}
    </label>
  );
}

Input.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  hint: PropTypes.string,
  className: PropTypes.string,
  value: PropTypes.string,
  placeholder: PropTypes.string,
  onChange: PropTypes.func,
  type: PropTypes.string,
};
