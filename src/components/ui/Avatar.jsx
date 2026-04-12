import PropTypes from 'prop-types';

/**
 * User avatar with image fallback and initials rendering.
 * @param {{name?: string, imageUrl?: string, size?: number}} props Avatar props.
 * @returns {JSX.Element} Avatar display.
 */
export function Avatar({ name = 'User', imageUrl = '', size = 36 }) {
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';

  return (
    <span
      style={{
        inlineSize: size,
        blockSize: size,
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--color-border)',
        display: 'inline-grid',
        placeItems: 'center',
        overflow: 'hidden',
        background: 'color-mix(in srgb, var(--color-accent-primary) 16%, transparent)',
        color: 'var(--color-text-primary)',
        fontWeight: 700,
        fontSize: 'var(--text-xs)',
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${name} avatar`}
          loading="lazy"
          width={size}
          height={size}
          style={{ inlineSize: '100%', blockSize: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials
      )}
    </span>
  );
}

Avatar.propTypes = {
  name: PropTypes.string,
  imageUrl: PropTypes.string,
  size: PropTypes.number,
};
