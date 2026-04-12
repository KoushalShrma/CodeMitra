const ADMIN_SESSION_STORAGE_KEY = 'codemitra_admin_session';

function hasWindow() {
  return typeof window !== 'undefined';
}

export function getAdminSession() {
  if (!hasWindow()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAdminSessionToken() {
  return getAdminSession()?.token || null;
}

export function setAdminSession(session) {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session || {}));
}

export function clearAdminSession() {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
}

export { ADMIN_SESSION_STORAGE_KEY };
