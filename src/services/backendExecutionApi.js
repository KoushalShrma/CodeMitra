/**
 * Backend Proxy API for Code Execution
 * Calls backend server instead of external Piston API
 * Avoids CORS issues and whitelist restrictions
 */

import { BASE_URL, getClerkToken } from './apiClient';

const languageMap = {
  Python: 71,
  JavaScript: 63,
  'C++': 54,
  Java: 62,
};

export async function executeCodeViaBackend({ displayLanguage, sourceCode, stdin = '' }) {
  const token = await getClerkToken();
  const languageId = languageMap[displayLanguage];

  const response = await fetch(`${BASE_URL}/api/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      code: sourceCode,
      languageId,
      language: displayLanguage,
      stdin,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Execution failed: ${response.statusText}`);
  }

  const result = await response.json();

  // Handle error responses from backend
  if (result.status === 'error') {
    throw new Error(result.message);
  }

  return result;
}
