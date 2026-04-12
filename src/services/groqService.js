import { BASE_URL } from './apiClient';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Reads the optional browser-side Groq key from Vite env.
 * This key is used only as fallback when backend proxy is unavailable.
 */
function getGroqApiKey() {
  return import.meta.env.VITE_GROQ_API_KEY;
}

/**
 * Returns the effective model from env override or default model.
 */
function getGroqModel() {
  return import.meta.env.VITE_GROQ_MODEL || DEFAULT_MODEL;
}

/**
 * Calls backend proxy endpoint so Groq key stays server-side whenever possible.
 */
async function callGroqProxy(messages, options = {}) {
  const response = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model: options.model || getGroqModel(),
      temperature: options.temperature ?? 0.3,
      maxTokens: options.maxTokens ?? 320,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || `AI proxy request failed: ${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.content?.trim();
  if (!content) {
    throw new Error('AI proxy returned empty content');
  }
  return content;
}

/**
 * Fallback direct browser call to Groq using VITE_GROQ_API_KEY when proxy is unavailable.
 */
async function callGroqDirect(messages, options = {}) {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('Missing Groq API key. Add VITE_GROQ_API_KEY in .env.local.');
  }

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || getGroqModel(),
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 320,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('No response content returned by Groq');
  }
  return content;
}

/**
 * Executes AI chat with proxy-first strategy and direct fallback.
 */
async function chatWithGroq(messages, options = {}) {
  try {
    return await callGroqProxy(messages, options);
  } catch {
    return callGroqDirect(messages, options);
  }
}

/**
 * Builds staged hint-depth guidance used by requestHintFromGroq.
 */
function getHintStageInstruction(hintLevel) {
  if (hintLevel <= 1) {
    return 'Stage 1 (Small Clue): Give one light directional clue only. Keep it short and conceptual.';
  }

  if (hintLevel === 2) {
    return "Stage 2 (Deeper Hint): Give 2-3 concrete thinking steps and mention one likely bug/pitfall in the student's current code.";
  }

  return 'Stage 3+ (Guided Mentor): Give structured guidance with checkpoints, but still no final algorithm dump and no complete code.';
}

/**
 * Creates student-facing hint prompt that forbids full-solution output.
 */
function buildHintPrompt({
  problemTitle,
  problemDescription,
  userCode,
  language,
  hintLevel,
  previousHint,
}) {
  return `You are a coding mentor helping a student on CodeMitra.

Problem title: ${problemTitle}
Problem description:
${problemDescription}

Student language: ${language}
Student code:
${userCode}

Previous mentor hint (if any):
${previousHint || 'None yet'}

Current hint depth request: Level ${hintLevel}
${getHintStageInstruction(hintLevel)}

Give only hints, not the final solution.
Rules:
1) Do not provide complete code or exact final answer.
2) Use a warm, encouraging, student-friendly tone.
3) Prefer short bullets and clear next actions.
4) Mention one thing the student should try immediately.
5) End with encouragement and a reflective question.

Response format:
- Clue:
- Why this matters:
- Next step to try:
- Encouragement:`;
}

/**
 * Requests structured mentoring hints from Groq using proxy-first secure flow.
 */
export async function requestHintFromGroq({
  problemTitle,
  problemDescription,
  userCode,
  language,
  hintLevel = 1,
  previousHint = '',
}) {
  const messages = [
    {
      role: 'system',
      content:
        'You are a patient programming mentor. Provide only hints and guidance, never full solutions or full code.',
    },
    {
      role: 'user',
      content: buildHintPrompt({
        problemTitle,
        problemDescription,
        userCode,
        language,
        hintLevel,
        previousHint,
      }),
    },
  ];

  return chatWithGroq(messages, { temperature: 0.4, maxTokens: 280 });
}

/**
 * Builds conceptual debugging prompt that prevents direct solution leaks.
 */
function buildDebuggerPrompt({ userCode, errorMessage, problemDescription, language }) {
  return `You are an AI coding mentor, not a solution generator.

Your job is to guide the student to understand their mistake without giving the answer.

INPUT:
- User Code:
${userCode}

- Error (if any):
${errorMessage || 'None'}

- Problem Description:
${problemDescription || 'Not provided.'}

- Language:
${language}

INSTRUCTIONS:
1. DO NOT:
- Do NOT provide code
- Do NOT provide pseudocode
- Do NOT rewrite the solution
- Do NOT give exact fix
- Do NOT directly point to the exact line of error

2. ANALYZE:
- Understand the student's logic from the code
- Detect the mistake type:
  (logic error / edge case / syntax / misunderstanding)

3. RESPOND LIKE A MENTOR

Use exactly this structure:

🔍 What might be going wrong:
Explain the issue conceptually without giving the solution.

🌍 Real-life analogy:
Give a simple everyday analogy to explain the mistake.

🧭 Direction to think:
Tell the student what to re-check or rethink, without revealing the answer.

⚠️ If error exists:
If an error message is present, explain why that kind of error happens in simple words, but do not explain the exact fix.

4. TONE:
- Friendly
- Encouraging
- Teacher-like
- Simple language
- Avoid heavy jargon

5. OUTPUT LENGTH:
- Keep it concise but meaningful
- 5 to 10 lines total

GOAL:
Help the student think, not copy.`;
}

/**
 * Requests conceptual debugging help from Groq using proxy-first secure flow.
 */
export async function requestErrorExplanationFromGroq({
  userCode,
  errorMessage,
  problemDescription,
  language,
}) {
  const messages = [
    {
      role: 'system',
      content:
        "You are a patient coding mentor. Guide the student's thinking, explain mistakes conceptually, and never provide code, pseudocode, or direct fixes.",
    },
    {
      role: 'user',
      content: buildDebuggerPrompt({
        userCode,
        errorMessage,
        problemDescription,
        language,
      }),
    },
  ];

  return chatWithGroq(messages, { temperature: 0.3, maxTokens: 260 });
}
