import { motion, useReducedMotion } from 'framer-motion';
import PropTypes from 'prop-types';
import { cn } from '../../utils/ui/cn';

/**
 * Reusable button primitive with variants and motion states.
 * @param {{children: import("react").ReactNode, type?: "button" | "submit" | "reset", variant?: "primary" | "secondary" | "ghost" | "danger", disabled?: boolean, onClick?: () => void, className?: string, ariaLabel?: string}} props Button props.
 * @returns {JSX.Element} Styled button.
 */
export function Button({
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  onClick,
  className,
  ariaLabel,
  style,
  ...rest
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn('ui-button', `ui-button-${variant}`, className)}
      style={style}
      whileHover={reducedMotion ? undefined : { scale: 1.02 }}
      whileTap={reducedMotion ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger']),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
  style: PropTypes.object,
};
