// Judge0 API language IDs
const JUDGE0_LANGUAGES = {
  Python: 71,
  JavaScript: 63,
  'C++': 54,
  Java: 62,
};

// Max polling attempts (30 attempts × 1 second = 30 seconds timeout)
const MAX_POLL_ATTEMPTS = 30;
const POLL_INTERVAL = 1000; // 1 second

function getJudge0Endpoint() {
  return import.meta.env.VITE_JUDGE0_ENDPOINT || 'https://judge0.com/api/v2';
}

function getJudge0Headers() {
  const rapidApiKey = import.meta.env.VITE_JUDGE0_RAPIDAPI_KEY;
  const rapidApiHost = import.meta.env.VITE_JUDGE0_RAPIDAPI_HOST;

  // If RapidAPI credentials are set, use them; otherwise use public endpoint
  if (rapidApiKey && rapidApiHost) {
    return {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': rapidApiKey,
      'X-RapidAPI-Host': rapidApiHost,
    };
  }

  // Use public endpoint (no auth needed)
  return {
    'Content-Type': 'application/json',
  };
}

export function getJudge0Language(displayLanguage) {
  const languageId = JUDGE0_LANGUAGES[displayLanguage];
  if (!languageId) {
    throw new Error(`Unsupported language: ${displayLanguage}`);
  }
  return languageId;
}

/**
 * Submit code to Judge0 and poll for result
 * @param {string} displayLanguage - Language name (e.g., "Python", "JavaScript")
 * @param {string} sourceCode - Code to execute
 * @param {string} stdin - Standard input
 * @returns {Promise<object>} Execution result with status, output, errorType
 */
export async function executeCodeWithJudge0({ displayLanguage, sourceCode, stdin = '' }) {
  const languageId = getJudge0Language(displayLanguage);
  const endpoint = getJudge0Endpoint();
  const headers = getJudge0Headers();

  // Step 1: Submit code
  const submitResponse = await fetch(`${endpoint}/submissions?base64_encoded=false&wait=false`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      language_id: languageId,
      source_code: sourceCode,
      stdin: stdin || undefined,
    }),
  });

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text().catch(() => '');
    throw new Error(
      `Judge0 submission failed: ${submitResponse.status} ${submitResponse.statusText}. ${errorText}`
    );
  }

  const submission = await submitResponse.json();
  const token = submission.token;

  if (!token) {
    throw new Error('Judge0 submission returned no token');
  }

  // Step 2: Poll for result
  let attempts = 0;
  let result = null;

  while (attempts < MAX_POLL_ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

    const statusResponse = await fetch(`${endpoint}/submissions/${token}?base64_encoded=false`, {
      headers,
    });

    if (!statusResponse.ok) {
      throw new Error(
        `Judge0 status check failed: ${statusResponse.status} ${statusResponse.statusText}`
      );
    }

    result = await statusResponse.json();

    // Status codes: 1=In Queue, 2=Processing, 3=Accepted, 4=Wrong Answer, 5=Time Limit, 6=Compilation Error, 7=Runtime Error, 8=Internal Error, 12=Runtime Error
    if (result.status.id > 2) {
      // Result is ready
      break;
    }

    attempts++;
  }

  if (!result) {
    throw new Error('Judge0 execution timeout - result not received within 30 seconds');
  }

  // Parse Judge0 result into our format
  const statusId = result.status.id;
  let status = 'Pass';
  let errorType = null;
  let output = '';

  if (statusId === 3) {
    // Accepted
    status = 'Pass';
    output = (result.stdout || '(no output)').trim();
  } else if (statusId === 4) {
    // Wrong Answer
    status = 'Fail';
    errorType = 'Wrong Output';
    output = (result.stdout || '(no output)').trim();
  } else if (statusId === 5) {
    // Time Limit Exceeded
    status = 'Fail';
    errorType = 'Time Limit Exceeded';
    output = 'Execution exceeded time limit';
  } else if (statusId === 6) {
    // Compilation Error
    status = 'Fail';
    errorType = 'Compilation Error';
    output = (result.compile_output || 'Compilation failed').trim();
  } else if (statusId === 7 || statusId === 12) {
    // Runtime Error
    status = 'Fail';
    errorType = 'Runtime Error';
    output = (result.stderr || result.runtime_error || 'Runtime error').trim();
  } else if (statusId === 8) {
    // Internal Error
    status = 'Fail';
    errorType = 'Internal Error';
    output = 'Judge0 internal error - try again';
  } else {
    // Other status codes
    status = 'Fail';
    errorType = 'Execution Error';
    output = result.status.description || 'Unknown error';
  }

  return {
    status,
    errorType: errorType,
    output: output || '(no output)',
    stdout: result.stdout ? result.stdout.trim() : '',
  };
}
