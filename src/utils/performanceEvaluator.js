export const MOVE_TYPES = {
  GREAT_MOVE: 'Great Move',
  MISTAKE: 'Mistake',
  BLUNDER: 'Blunder',
};

const MOVE_SCORE_MAP = {
  [MOVE_TYPES.GREAT_MOVE]: 12,
  [MOVE_TYPES.MISTAKE]: 5,
  [MOVE_TYPES.BLUNDER]: -6,
};

const HINT_PENALTY_AFTER_FREE_HINT = 2;
const EXTRA_WRONG_SUBMISSION_PENALTY = 3;
const SUSPICIOUS_ATTEMPT_PENALTY = 5;

function tryParseStructuredValue(rawValue) {
  const value = String(rawValue ?? '').trim();

  if (!value) {
    return '';
  }

  try {
    return JSON.parse(value);
  } catch {
    // Fall through to normalized literal parsing.
  }

  const sanitized = value
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    .replace(/'/g, '"');

  try {
    return JSON.parse(sanitized);
  } catch {
    // Fall through to primitive coercion.
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  if (/^(true|false)$/i.test(value)) {
    return value.toLowerCase() === 'true';
  }

  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  return String(value);
}

export function normalizeOutput(value) {
  return stableSerialize(tryParseStructuredValue(value));
}

export function isOutputCorrect(actualOutput, expectedOutput) {
  return normalizeOutput(actualOutput) === normalizeOutput(expectedOutput);
}

export function evaluateAttempt({ isCorrect, hintsUsed }) {
  if (!isCorrect) {
    return MOVE_TYPES.BLUNDER;
  }

  if (hintsUsed) {
    return MOVE_TYPES.MISTAKE;
  }

  return MOVE_TYPES.GREAT_MOVE;
}

export function updatePerformanceStats(stats, moveType) {
  if (moveType === MOVE_TYPES.GREAT_MOVE) {
    return { ...stats, greatMoves: stats.greatMoves + 1 };
  }

  if (moveType === MOVE_TYPES.MISTAKE) {
    return { ...stats, mistakes: stats.mistakes + 1 };
  }

  return { ...stats, blunders: stats.blunders + 1 };
}

export function calculatePenaltyPoints({ hintsUsed, wrongAttemptsBeforeSubmit, isSuspicious }) {
  const hintPenalty = Math.max(0, (hintsUsed || 0) - 1) * HINT_PENALTY_AFTER_FREE_HINT;
  const wrongAttemptPenalty =
    Math.max(0, wrongAttemptsBeforeSubmit || 0) * EXTRA_WRONG_SUBMISSION_PENALTY;
  const suspiciousPenalty = isSuspicious ? SUSPICIOUS_ATTEMPT_PENALTY : 0;

  return {
    hintPenalty,
    wrongAttemptPenalty,
    suspiciousPenalty,
    totalPenaltyPoints: hintPenalty + wrongAttemptPenalty + suspiciousPenalty,
  };
}

export function getScoreDelta({ moveType, penaltyPoints }) {
  const basePoints = MOVE_SCORE_MAP[moveType] ?? 0;
  return basePoints - (penaltyPoints || 0);
}
