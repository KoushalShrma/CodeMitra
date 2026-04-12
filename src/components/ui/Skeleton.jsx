import PropTypes from 'prop-types';

/**
 * Skeleton placeholder matching target content shape for loading states.
 * @param {{height?: string, width?: string, radius?: string, className?: string}} props Skeleton props.
 * @returns {JSX.Element} Skeleton block.
 */
export function Skeleton({
  height = '16px',
  width = '100%',
  radius = 'var(--radius-md)',
  className,
}) {
  return (
    <div
      className={className ? `skeleton ${className}` : 'skeleton'}
      style={{
        height,
        width,
        borderRadius: radius,
      }}
      aria-hidden="true"
    />
  );
}

Skeleton.propTypes = {
  height: PropTypes.string,
  width: PropTypes.string,
  radius: PropTypes.string,
  className: PropTypes.string,
};
