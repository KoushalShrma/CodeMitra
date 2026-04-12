import PropTypes from 'prop-types';

/**
 * Shared page scaffold providing consistent heading hierarchy and spacing.
 * @param {{title: string, subtitle?: string, actions?: import("react").ReactNode, children: import("react").ReactNode}} props Wrapper props.
 * @returns {JSX.Element} Page layout wrapper.
 */
export function PageWrapper({ title, subtitle, actions, children }) {
  return (
    <section className="page-main" aria-label={title}>
      <header
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 'var(--space-4)',
          alignItems: 'start',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <span className="label-text">Code_Mitra</span>
          <h1 style={{ fontSize: 'var(--text-3xl)' }}>{title}</h1>
          {subtitle ? (
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: 760 }}>{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

PageWrapper.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  children: PropTypes.node.isRequired,
};
