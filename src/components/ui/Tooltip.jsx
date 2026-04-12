import PropTypes from 'prop-types';

/**
 * Lightweight tooltip wrapper for icon-only actions.
 * @param {{content: string, children: import("react").ReactNode}} props Tooltip props.
 * @returns {JSX.Element} Tooltip anchor.
 */
export function Tooltip({ content, children }) {
  return (
    <span className="ui-tooltip-anchor">
      {children}
      <span role="tooltip" className="ui-tooltip">
        {content}
      </span>
    </span>
  );
}

Tooltip.propTypes = {
  content: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
