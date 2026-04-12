import { motion } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { Button } from '../ui/Button';
import { cn } from '../../utils/ui/cn';

/**
 * Collapsible side navigation optimized for dense coding workflows.
 * @param {{items: Array<{to: string, label: string, icon: import("react").ComponentType<any>}>, collapsed: boolean, onToggle: () => void}} props Sidebar props.
 * @returns {JSX.Element} Sidebar navigation.
 */
export function Sidebar({ items, collapsed, onToggle }) {
  return (
    <aside className="sidebar-shell" aria-label="Primary navigation">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: 'var(--space-4)',
        }}
      >
        {!collapsed ? (
          <div>
            <p className="label-text" style={{ marginBottom: 'var(--space-1)' }}>
              Code_Mitra
            </p>
            <strong
              style={{ fontFamily: 'var(--font-display)', letterSpacing: 'var(--letter-heading)' }}
            >
              Focus Console
            </strong>
          </div>
        ) : null}
        <Button
          ariaLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          variant="ghost"
          onClick={onToggle}
          className="ui-button"
          style={{ width: 34, height: 34, padding: 0 }}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </Button>
      </div>

      <nav className="sidebar-nav">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn('sidebar-link', isActive ? 'sidebar-link-active' : '')
                }
                end={
                  item.to === '/dashboard' ||
                  item.to === '/' ||
                  item.to === '/institution/dashboard'
                }
              >
                <Icon size={16} />
                {!collapsed ? (
                  <span>{item.label}</span>
                ) : (
                  <span className="visually-hidden">{item.label}</span>
                )}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      <div
        style={{
          padding: 'var(--space-4)',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-xs)',
        }}
      >
        {!collapsed ? 'Build mode: immersive' : 'IM'}
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      to: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
    })
  ).isRequired,
  collapsed: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};
