import { Building2, ShieldCheck, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const ROLE_META = {
  user: {
    label: 'As User',
    description: 'Practice, tests, and progress tracking',
    icon: User,
  },
  organization: {
    label: 'As Organization',
    description: 'Manage members, tests, and analytics',
    icon: Building2,
  },
  admin: {
    label: 'As Admin',
    description: 'Review and approve organizations',
    icon: ShieldCheck,
  },
};

function getRoleOptions(mode, organizationHref) {
  if (mode === 'login') {
    return [
      { key: 'user', href: '/login?as=user' },
      { key: 'organization', href: '/institution/login' },
      { key: 'admin', href: '/admin/login' },
    ];
  }

  return [
    { key: 'user', href: '/signup?as=user' },
    { key: 'organization', href: organizationHref || '/institute-signup' },
    { key: 'admin', href: '/admin/login' },
  ];
}

function AuthRoleSwitch({ mode = 'login', activeRole = 'user', organizationHref = '' }) {
  const options = getRoleOptions(mode, organizationHref);
  const navLabel = mode === 'login' ? 'Choose login role' : 'Choose signup role';

  return (
    <nav className="auth-role-switch" aria-label={navLabel}>
      {options.map((item) => {
        const meta = ROLE_META[item.key];
        const Icon = meta.icon;
        const isActive = item.key === activeRole;

        return (
          <Link
            key={item.key}
            to={item.href}
            className={isActive ? 'auth-role-card auth-role-card-active' : 'auth-role-card'}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="auth-role-card-header">
              <Icon size={15} />
              <span className="auth-role-card-title">{meta.label}</span>
            </span>
            <span className="auth-role-card-description">{meta.description}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default AuthRoleSwitch;
