export const QUERY_STALE_TIMES = {
  realtime: 5_000,
  interactive: 20_000,
  dashboard: 30_000,
  profile: 60_000,
  institution: 60_000,
  lowVolatility: 120_000,
};

export const queryKeys = {
  myAnalytics: ['analytics', 'me'],
  myTopicAnalytics: (tag) => ['analytics', 'topic', tag || ''],
  hintStatus: (problemId, testId) => ['ai', 'hint-status', problemId || '', testId ?? 'none'],
  studentTestsActive: ['student-tests', 'active'],
  studentAttempt: (attemptId, testId, institutionId) => [
    'student-tests',
    'attempt',
    attemptId || '',
    testId || '',
    institutionId || '',
  ],
  studentAttemptReport: (attemptId) => ['student-tests', 'attempt-report', attemptId || ''],
  institutionWorkspace: (institutionId) => ['institution', 'workspace', institutionId || ''],
  institutionTests: (institutionId) => ['institution', 'tests', institutionId || ''],
  institutionTest: (institutionId, testId) => [
    'institution',
    'test',
    institutionId || '',
    testId || '',
  ],
  institutionResults: (institutionId, testId) => [
    'institution',
    'results',
    institutionId || '',
    testId || '',
  ],
  userProfile: (userId) => ['user', 'profile', userId || ''],
  currentUserProfile: (userId) => ['user', 'current-profile', userId || ''],
  userProgress: (userId) => ['user', 'progress', userId || ''],
  scraperDashboardStats: ['admin', 'scraper', 'stats'],
};
