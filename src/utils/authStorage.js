const USER_STORAGE_KEY = 'codemitra_user';
const SUPER_ADMIN_ROLE_SET = new Set(['super_admin', 'superadmin']);
const INSTITUTION_ROLE_SET = new Set([
  'institute',
  'institute_admin',
  'institution_admin',
  'instructor',
]);

function emitAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('codemitra-auth-change'));
  }
}

export function getLoggedInUser() {
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLoggedInUser(user) {
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  emitAuthChange();
}

export function clearLoggedInUser() {
  window.localStorage.removeItem(USER_STORAGE_KEY);
  emitAuthChange();
}

export function isInstitutionRole(role) {
  const normalized = String(role || '')
    .trim()
    .toLowerCase();
  return INSTITUTION_ROLE_SET.has(normalized);
}

export function isSuperAdminRole(role) {
  const normalized = String(role || '')
    .trim()
    .toLowerCase();
  return SUPER_ADMIN_ROLE_SET.has(normalized);
}

export function getDefaultRouteForUser(user) {
  if (isSuperAdminRole(user?.role)) {
    return '/admin/dashboard';
  }
  return isInstitutionRole(user?.role) ? '/institution/dashboard' : '/dashboard';
}

export { USER_STORAGE_KEY };
