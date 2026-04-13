import { getAdminSessionToken } from '../utils/adminSession';
import { getInstitutionSessionToken } from '../utils/institutionSession';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Retrieves the active Clerk session token from the browser runtime.
// This keeps API auth centralized so every protected request carries a valid bearer token.
async function getClerkToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  const clerk = window.Clerk;
  if (!clerk?.session) {
    return null;
  }

  try {
    return await clerk.session.getToken();
  } catch {
    return null;
  }
}

function toErrorMessage(payload, fallback = 'Request failed') {
  if (!payload) {
    return fallback;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error;
  }

  return fallback;
}

function parseMaybeJson(rawValue) {
  const text = String(rawValue || '');
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }

  const isObject = trimmed.startsWith('{') && trimmed.endsWith('}');
  const isArray = trimmed.startsWith('[') && trimmed.endsWith(']');
  if (!isObject && !isArray) {
    return text;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return text;
  }
}

async function request(path, options = {}) {
  const token = await getClerkToken();

  if (!token && path.startsWith('/api/users/me/profile')) {
    console.warn('apiClient: skipping request, no token available');
    return null;
  }

  const hasBody = Object.prototype.hasOwnProperty.call(options, 'body');
  const isFormData = hasBody && options.body instanceof FormData;
  const baseHeaders = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...baseHeaders,
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : { message: await response.text() };

  if (!response.ok) {
    const message = toErrorMessage(payload, `Request failed (${response.status})`);
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function requestText(path) {
  const token = await getClerkToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    const error = new Error(text || `Request failed (${response.status})`);
    error.status = response.status;
    error.payload = { message: text };
    throw error;
  }

  return text;
}

async function adminRequest(path, options = {}, requireAuth = true) {
  const token = requireAuth ? getAdminSessionToken() : null;

  if (requireAuth && !token) {
    const error = new Error('Admin authentication required');
    error.status = 401;
    throw error;
  }

  const hasBody = Object.prototype.hasOwnProperty.call(options, 'body');
  const isFormData = hasBody && options.body instanceof FormData;
  const baseHeaders = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...baseHeaders,
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : { message: await response.text() };

  if (!response.ok) {
    const message = toErrorMessage(payload, `Request failed (${response.status})`);
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function institutionRequest(path, options = {}, requireAuth = true) {
  const token = requireAuth ? getInstitutionSessionToken() : null;

  if (requireAuth && !token) {
    const error = new Error('Institution authentication required');
    error.status = 401;
    throw error;
  }

  const hasBody = Object.prototype.hasOwnProperty.call(options, 'body');
  const isFormData = hasBody && options.body instanceof FormData;
  const baseHeaders = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...baseHeaders,
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : { message: await response.text() };

  if (!response.ok) {
    const message = toErrorMessage(payload, `Request failed (${response.status})`);
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function streamSsePost(path, data, options = {}) {
  const { onEvent, signal } = options;
  const token = await getClerkToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data ?? {}),
    signal,
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : { message: await response.text() };

    const message = toErrorMessage(payload, `Request failed (${response.status})`);
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  if (!response.body) {
    throw new Error('Streaming response body is unavailable');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const emitBlock = (block) => {
    if (!block) {
      return;
    }

    const lines = block.split('\n');
    let eventName = 'message';
    const dataLines = [];

    for (const line of lines) {
      if (!line || line.startsWith(':')) {
        continue;
      }
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim() || 'message';
        continue;
      }
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (!dataLines.length) {
      return;
    }

    const rawData = dataLines.join('\n');
    onEvent?.({
      event: eventName,
      raw: rawData,
      data: parseMaybeJson(rawData),
    });
  };

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let delimiterIndex = buffer.indexOf('\n\n');

      while (delimiterIndex >= 0) {
        const block = buffer.slice(0, delimiterIndex);
        buffer = buffer.slice(delimiterIndex + 2);
        emitBlock(block);
        delimiterIndex = buffer.indexOf('\n\n');
      }
    }

    const trailing = buffer.trim();
    if (trailing) {
      emitBlock(trailing);
    }
  } finally {
    reader.releaseLock();
  }
}

// Syncs authenticated Clerk user details into backend MySQL tables.
export async function syncAuthenticatedUser() {
  return syncCurrentUserProfileFromClerk();
}

export async function syncCurrentUserProfileFromClerk() {
  return request('/api/users/me/profile/sync-clerk', {
    method: 'POST',
  });
}

export async function getCurrentUserProfile() {
  return request('/api/users/me/profile');
}

export async function updateCurrentUserProfile(data, providedToken) {
  const token = providedToken || (await getClerkToken());
  if (!token) {
    console.warn('apiClient: skipping request, no token available');
    return null;
  }

  return request('/api/users/me/profile', {
    method: 'PUT',
    body: JSON.stringify(data || {}),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function signup(userData) {
  return request('/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function registerInstitute(instituteData) {
  return request('/api/institute/register', {
    method: 'POST',
    body: JSON.stringify(instituteData),
  });
}

export async function submitInstitutionRegistrationRequest(data) {
  return request('/api/institution/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDiscoverableInstitutions() {
  return request('/api/institution/discover');
}

export async function submitInstitutionJoinRequest(data) {
  return request('/api/institution/join', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getInstitutionJoinRequestsV2(institutionId) {
  return institutionRequest(`/api/institution/${institutionId}/join-requests`);
}

export async function getInstitutionMembersV2(institutionId) {
  return institutionRequest(`/api/institution/${institutionId}/members`);
}

export async function approveInstitutionJoinRequestV2(institutionId, requestId, data = {}) {
  return institutionRequest(`/api/institution/${institutionId}/join-requests/${requestId}/approve`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function rejectInstitutionJoinRequestV2(institutionId, requestId, data = {}) {
  return institutionRequest(`/api/institution/${institutionId}/join-requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deregisterInstitutionMemberV2(institutionId, membershipId) {
  return institutionRequest(`/api/institution/${institutionId}/members/${membershipId}`, {
    method: 'DELETE',
  });
}

export async function getCurrentAuthRole() {
  return request('/api/auth/role');
}

export async function adminLogin(data) {
  return adminRequest(
    '/api/admin/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    false
  );
}

export async function institutionLogin(data) {
  return institutionRequest(
    '/api/institution/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    false
  );
}

export async function getInstitutionCurrentProfile() {
  return institutionRequest('/api/institution/auth/me');
}

export async function changeInstitutionPassword(data) {
  return institutionRequest('/api/institution/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAdminCurrentProfile() {
  return adminRequest('/api/admin/auth/me');
}

export async function getAdminUsers() {
  return adminRequest('/api/admin/users');
}

export async function createAdminUser(data) {
  return adminRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminUserPermissions(adminId, data) {
  return adminRequest(`/api/admin/users/${adminId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getAdminInstitutionRequests(status = 'PENDING') {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return adminRequest(`/api/admin/institutions/requests${query}`);
}

export async function getAdminInstitutions(status = '') {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return adminRequest(`/api/admin/institutions${query}`);
}

export async function approveAdminInstitutionRequest(requestId, data = {}) {
  return adminRequest(`/api/admin/institutions/requests/${requestId}/approve`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function rejectAdminInstitutionRequest(requestId, data = {}) {
  return adminRequest(`/api/admin/institutions/requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeAdminInstitution(institutionId) {
  return adminRequest(`/api/admin/institutions/${institutionId}`, {
    method: 'DELETE',
  });
}

export async function createInstituteTest(testData) {
  return request('/api/tests/create', {
    method: 'POST',
    body: JSON.stringify(testData),
  });
}

export async function getInstituteTests(instituteId) {
  return request(`/api/tests/institute/${instituteId}`);
}

export async function getInstituteTestDetails(testId) {
  return request(`/api/tests/details/${testId}`);
}

export async function createInstitution(data) {
  return request('/api/institution/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getInstitution(institutionId) {
  return institutionRequest(`/api/institution/${institutionId}`);
}

export async function createInstitutionTestV2(institutionId, data) {
  return institutionRequest(`/api/institution/${institutionId}/test/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getInstitutionTestsV2(institutionId) {
  return institutionRequest(`/api/institution/${institutionId}/tests`);
}

export async function getInstitutionTestV2(institutionId, testId) {
  return institutionRequest(`/api/institution/${institutionId}/test/${testId}`);
}

export async function updateInstitutionTestV2(institutionId, testId, data) {
  return institutionRequest(`/api/institution/${institutionId}/test/${testId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function createInstitutionProblemV2(institutionId, data) {
  return institutionRequest(`/api/institution/${institutionId}/problem/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getInstitutionProblemsV2(institutionId) {
  return institutionRequest(`/api/institution/${institutionId}/problems`);
}

export async function getInstitutionTestResultsV2(institutionId, testId) {
  return institutionRequest(`/api/institution/${institutionId}/test/${testId}/results`);
}

export async function exportInstitutionTestResultsV2(institutionId, testId) {
  return institutionRequest(`/api/institution/${institutionId}/test/${testId}/results/export`, {}, true).then(
    (payload) => {
      if (typeof payload === 'string') {
        return payload;
      }
      return payload?.message || '';
    }
  );
}

export async function joinInstitutionTest(testId, userId) {
  return request(`/api/test/${testId}/join`, {
    method: 'POST',
    body: JSON.stringify(userId ? { userId } : {}),
  });
}

export async function submitInstitutionTest(testId, attemptId, submitMode = 'manual') {
  return request(`/api/test/${testId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ attemptId, submitMode }),
  });
}

export async function getInstitutionTestAttempt(testId, attemptId) {
  return request(`/api/test/${testId}/attempt/${attemptId}`);
}

export async function trackInstitutionProctoringEvent(testId, data) {
  return request(`/api/test/${testId}/proctoring-event`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getActiveStudentTests() {
  return request('/api/student-tests/active');
}

export async function startStudentTestAttempt(data) {
  return request('/api/student-tests/start', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function joinStudentTestByCode(data) {
  return request('/api/tests/join-by-code', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getStudentTestAttempt(attemptId) {
  return request(`/api/student-tests/attempt/${attemptId}`);
}

export async function saveStudentTestSubmission(data) {
  return request('/api/student-tests/submissions/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function submitStudentTestAttempt(data) {
  return request('/api/student-tests/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function trackStudentAntiCheat(data) {
  return request('/api/student-tests/anti-cheat', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getStudentAttemptReport(attemptId) {
  return request(`/api/report/student/${attemptId}`);
}

export async function getInstituteTestReport(testId) {
  return request(`/api/report/test/${testId}`);
}

export async function login(userData) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function updatePerformance(data) {
  return request('/update-performance', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logPracticeEvent(data) {
  return request('/practice-event', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function submitPracticeSolution(data) {
  return request('/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function trackPracticeRun(data) {
  return request('/runs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyAnalytics() {
  return request('/api/analytics/me');
}

export async function getMyTopicAnalytics(tag) {
  return request(`/api/analytics/me/topic/${encodeURIComponent(tag)}`);
}

export async function recalculateMyAnalytics(userId) {
  return request('/api/analytics/recalculate', {
    method: 'POST',
    body: JSON.stringify(userId ? { userId } : {}),
  });
}

export async function getScraperDashboardStats() {
  return request('/api/admin/scraper/stats');
}

export async function chatWithAi(data) {
  return request('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAiHintStatus(problemId, testId) {
  const query = testId == null ? '' : `?testId=${encodeURIComponent(testId)}`;
  return request(`/api/ai/hint/status/${encodeURIComponent(problemId)}${query}`);
}

export async function requestAiHint(data) {
  return request('/api/ai/hint', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function requestAiHintStream(data, options = {}) {
  return streamSsePost('/api/ai/hint/stream', data, options);
}

export async function requestAiReview(data) {
  return request('/api/ai/review', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function requestAiReviewStream(data, options = {}) {
  return streamSsePost('/api/ai/review/stream', data, options);
}

export async function getPracticeRunHistory(userId, problemId) {
  return request(`/runs/${userId}/${problemId}`);
}

export async function getUserProfile(userId) {
  if (userId == null || String(userId).toLowerCase() === 'me') {
    return getCurrentUserProfile();
  }
  return request(`/user/${userId}`);
}

export async function getUserProgress(userId) {
  return request(`/api/user/progress/${userId}`);
}

export async function updateUserProfile(userId, data) {
  if (userId == null || String(userId).toLowerCase() === 'me') {
    return updateCurrentUserProfile(data);
  }
  return request(`/user/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function uploadProfileImage(file) {
  const formData = new FormData();
  formData.append('profileImage', file);

  const token = await getClerkToken();

  const response = await fetch(`${BASE_URL}/upload-profile-image`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : { message: await response.text() };

  if (!response.ok) {
    throw new Error(payload?.message || 'Image upload failed');
  }

  return payload;
}

export { BASE_URL };
export { getClerkToken };
