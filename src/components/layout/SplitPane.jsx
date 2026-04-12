import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

/**
 * Horizontal split pane with draggable divider for problem/editor workspace.
 * @param {{left: import("react").ReactNode, right: import("react").ReactNode, initialLeftPercent?: number}} props Split pane props.
 * @returns {JSX.Element} Split layout.
 */
export function SplitPane({ left, right, initialLeftPercent = 40 }) {
  const [leftPercent, setLeftPercent] = useState(initialLeftPercent);
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!dragging) {
      return undefined;
    }

    const onMove = (event) => {
      if (!rootRef.current) {
        return;
      }

      const bounds = rootRef.current.getBoundingClientRect();
      const relativeX = event.clientX - bounds.left;
      const percentage = (relativeX / bounds.width) * 100;
      setLeftPercent(Math.min(60, Math.max(30, percentage)));
    };

    const onUp = () => setDragging(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  return (
    <section
      ref={rootRef}
      className="split-pane"
      style={{
        gridTemplateColumns: `minmax(320px, ${leftPercent}%) 12px 1fr`,
      }}
    >
      <div>{left}</div>
      <button
        type="button"
        aria-label="Resize workspace panels"
        className="split-pane-divider"
        onMouseDown={() => setDragging(true)}
      />
      <div>{right}</div>
    </section>
  );
}

SplitPane.propTypes = {
  left: PropTypes.node.isRequired,
  right: PropTypes.node.isRequired,
  initialLeftPercent: PropTypes.number,
};
