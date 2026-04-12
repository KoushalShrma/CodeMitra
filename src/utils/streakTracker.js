const STREAK_STORAGE_KEY = 'codemitra_streak_stats';

const defaultStreakStats = {
  currentStreak: 0,
  bestStreak: 0,
};

export function getStreakStats() {
  try {
    const raw = window.localStorage.getItem(STREAK_STORAGE_KEY);

    if (!raw) {
      return defaultStreakStats;
    }

    const parsed = JSON.parse(raw);

    return {
      currentStreak: Number(parsed.currentStreak) || 0,
      bestStreak: Number(parsed.bestStreak) || 0,
    };
  } catch {
    return defaultStreakStats;
  }
}

export function updateSubmissionStreak(isCorrectSubmission) {
  const previous = getStreakStats();

  const nextCurrent = isCorrectSubmission ? previous.currentStreak + 1 : 0;
  const next = {
    currentStreak: nextCurrent,
    bestStreak: Math.max(previous.bestStreak, nextCurrent),
  };

  window.localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(next));
  return next;
}
