const LARGE_PASTE_THRESHOLD = 120;
const TOO_FAST_SUBMISSION_SECONDS = 20;
const EXCESSIVE_HINTS_THRESHOLD = 2;

export function evaluateAntiCheatRisk({ largePasteCount, hintsUsed, timeTakenSeconds }) {
  const reasons = [];

  if (largePasteCount > 0) {
    reasons.push('Large code paste detected');
  }

  if (hintsUsed >= EXCESSIVE_HINTS_THRESHOLD) {
    reasons.push('Multiple hints used before submission');
  }

  if (timeTakenSeconds > 0 && timeTakenSeconds < TOO_FAST_SUBMISSION_SECONDS) {
    reasons.push('Submission made very quickly');
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}

export { LARGE_PASTE_THRESHOLD };
