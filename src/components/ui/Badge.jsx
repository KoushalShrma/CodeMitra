import PropTypes from 'prop-types';
import { cn } from '../../utils/ui/cn';

/**
 * Generic badge primitive for status, labels, and difficulty chips.
 * @param {{children: import("react").ReactNode, className?: string, variant?: string}} props Badge props.
 * @returns {JSX.Element} Badge element.
 */
export function Badge({ children, className, variant = 'default' }) {
  return (
    <span className={cn('ui-badge', variant !== 'default' ? `badge-${variant}` : '', className)}>
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.string,
};
