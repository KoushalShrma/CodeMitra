const INSTITUTION_SESSION_STORAGE_KEY = 'codemitra_institution_session';

function hasWindow() {
  return typeof window !== 'undefined';
}

export function getInstitutionSession() {
  if (!hasWindow()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(INSTITUTION_SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getInstitutionSessionToken() {
  return getInstitutionSession()?.token || null;
}

export function setInstitutionSession(session) {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(INSTITUTION_SESSION_STORAGE_KEY, JSON.stringify(session || {}));
}

export function clearInstitutionSession() {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(INSTITUTION_SESSION_STORAGE_KEY);
}

export { INSTITUTION_SESSION_STORAGE_KEY };