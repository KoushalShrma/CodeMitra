package com.codemitra.backend.service;

import com.codemitra.backend.model.ProblemAttemptEntity;
import com.codemitra.backend.model.UserAnalyticsEntity;
import com.codemitra.backend.repository.ProblemAttemptRepository;
import com.codemitra.backend.repository.UserAnalyticsRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Computes and persists the analytics backbone used for ranking, coaching, and dashboard visualizations.
 */
@Service
public class AnalyticsEngineService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final String VERDICT_ACCEPTED = "AC";

    private final ProblemAttemptRepository problemAttemptRepository;
    private final UserAnalyticsRepository userAnalyticsRepository;
    private final PracticeProblemCatalogService practiceProblemCatalogService;
    private final Set<Long> bufferedUserIds = ConcurrentHashMap.newKeySet();

    public AnalyticsEngineService(
            ProblemAttemptRepository problemAttemptRepository,
            UserAnalyticsRepository userAnalyticsRepository,
            PracticeProblemCatalogService practiceProblemCatalogService
    ) {
        this.problemAttemptRepository = problemAttemptRepository;
        this.userAnalyticsRepository = userAnalyticsRepository;
        this.practiceProblemCatalogService = practiceProblemCatalogService;
    }

    /**
     * Tracks run telemetry and triggers synchronous score refresh.
     */
    @Transactional
    public ProblemAttemptEntity trackRunEvent(
            Long userId,
            String problemId,
            String language,
            String runStatus,
            String runError,
            Long testId
    ) {
        LocalDateTime now = LocalDateTime.now();
        ProblemAttemptEntity attempt = getOrCreateActiveAttempt(userId, problemId, testId, now);

        if (attempt.getRunCount() == 0) {
            attempt.setTimeToFirstRun(Duration.between(attempt.getSessionStartedAt(), now).toMillis());
        }

        attempt.setRunCount(safe(attempt.getRunCount()) + 1);
        attempt.setLanguageUsed(language);
        attempt.setTotalSessionTime(Duration.between(attempt.getSessionStartedAt(), now).toMillis());
        attempt.setVerdict(classifyVerdict(runStatus, runError));

        if ("CE".equals(attempt.getVerdict())) {
            attempt.setCompileErrors(safe(attempt.getCompileErrors()) + 1);
        } else if ("RE".equals(attempt.getVerdict())) {
            attempt.setRuntimeErrors(safe(attempt.getRuntimeErrors()) + 1);
        }

        ProblemAttemptEntity saved = problemAttemptRepository.save(attempt);
        markAnalyticsDirty(userId);
        return saved;
    }

    /**
     * Tracks submit telemetry and dispatches asynchronous score refresh.
     */
    @Transactional
    public ProblemAttemptEntity trackSubmitEvent(
            Long userId,
            String problemId,
            String language,
            String verdict,
            String finalCode,
            String groqReviewJson,
            List<String> topicTags,
            Long testId
    ) {
        LocalDateTime now = LocalDateTime.now();
        ProblemAttemptEntity attempt = getOrCreateActiveAttempt(userId, problemId, testId, now);

        attempt.setSubmitCount(safe(attempt.getSubmitCount()) + 1);
        attempt.setTimeToSubmit(Duration.between(attempt.getSessionStartedAt(), now).toMillis());
        attempt.setTotalSessionTime(Duration.between(attempt.getSessionStartedAt(), now).toMillis());
        attempt.setLanguageUsed(language);
        attempt.setVerdict(verdict);

        if (!VERDICT_ACCEPTED.equals(verdict)) {
            attempt.setWrongSubmissions(safe(attempt.getWrongSubmissions()) + 1);
        }

        if ("CE".equals(verdict)) {
            attempt.setCompileErrors(safe(attempt.getCompileErrors()) + 1);
        }
        if ("RE".equals(verdict)) {
            attempt.setRuntimeErrors(safe(attempt.getRuntimeErrors()) + 1);
        }

        if (finalCode != null) {
            attempt.setFinalCode(finalCode);
            attempt.setFinalCodeLength(finalCode.length());
        }
        if (groqReviewJson != null && !groqReviewJson.isBlank()) {
            attempt.setGroqReview(groqReviewJson);
        }
        if (topicTags != null && !topicTags.isEmpty()) {
            attempt.setTopicTags(writeJsonSafely(topicTags, attempt.getTopicTags() == null ? "[]" : attempt.getTopicTags()));
        }

        ProblemAttemptEntity saved = problemAttemptRepository.save(attempt);
        markAnalyticsDirty(userId);
        return saved;
    }

    /**
     * Tracks hint telemetry and triggers synchronous score refresh to apply hint penalties immediately.
     */
    @Transactional
    public ProblemAttemptEntity trackHintEvent(
            Long userId,
            String problemId,
            Long testId
    ) {
        LocalDateTime now = LocalDateTime.now();
        ProblemAttemptEntity attempt = getOrCreateActiveAttempt(userId, problemId, testId, now);

        List<String> timestamps = parseStringArray(attempt.getHintTimestamps());
        timestamps.add(now.toString());

        attempt.setHintsRequested(safe(attempt.getHintsRequested()) + 1);
        attempt.setHintTimestamps(writeJsonSafely(timestamps, "[]"));
        attempt.setLastHintTimestamp(now);
        attempt.setTotalSessionTime(Duration.between(attempt.getSessionStartedAt(), now).toMillis());

        ProblemAttemptEntity saved = problemAttemptRepository.save(attempt);
        markAnalyticsDirty(userId);
        return saved;
    }

    /**
     * Tracks blocked hint attempts while user is still in cooldown.
     */
    @Transactional
    public void trackCooldownViolation(Long userId, String problemId, Long testId) {
        LocalDateTime now = LocalDateTime.now();
        ProblemAttemptEntity attempt = getOrCreateActiveAttempt(userId, problemId, testId, now);
        attempt.setAiCooldownViolationsAttempted(safe(attempt.getAiCooldownViolationsAttempted()) + 1);
        problemAttemptRepository.save(attempt);
        markAnalyticsDirty(userId);
    }

    /**
     * Marks one analytics row stale and queues recalculation in the background batch.
     */
    @Transactional
    public void markAnalyticsDirty(Long userId) {
        if (userId == null) {
            return;
        }

        bufferedUserIds.add(userId);

        UserAnalyticsEntity analytics = userAnalyticsRepository.findById(userId)
                .orElseGet(() -> buildDefaultAnalytics(userId));
        analytics.setStale(true);
        if (analytics.getStaleSince() == null) {
            analytics.setStaleSince(LocalDateTime.now());
        }
        userAnalyticsRepository.save(analytics);
    }

    /**
     * Recomputes buffered analytics rows in 30-second batches.
     */
    @Scheduled(fixedDelayString = "${analytics.recalculate.batch-ms:30000}")
    public void flushBufferedAnalytics() {
        if (bufferedUserIds.isEmpty()) {
            return;
        }

        List<Long> batch = new ArrayList<>(bufferedUserIds);
        bufferedUserIds.removeAll(batch);

        for (Long userId : batch) {
            try {
                recalculateSync(userId);
            } catch (Exception ex) {
                bufferedUserIds.add(userId);
            }
        }
    }

    /**
     * Returns full analytics payload for dashboard and deep-dive pages.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAnalyticsPayload(Long userId) {
        List<ProblemAttemptEntity> attempts = problemAttemptRepository.findByUserId(userId);
        UserAnalyticsEntity analytics = userAnalyticsRepository.findById(userId)
                .orElseGet(() -> buildDefaultAnalytics(userId));

        Map<String, Double> topicScores = parseTopicScores(analytics.getTopicScores());
        List<ProblemAttemptEntity> acceptedAttempts = attempts.stream()
                .filter(item -> VERDICT_ACCEPTED.equals(item.getVerdict()))
                .toList();

        Map<LocalDate, Long> solvedPerDay = new LinkedHashMap<>();
        acceptedAttempts.stream()
                .map(ProblemAttemptEntity::getUpdatedAt)
                .filter(item -> item != null)
                .map(LocalDateTime::toLocalDate)
                .sorted()
                .forEach(day -> solvedPerDay.put(day, solvedPerDay.getOrDefault(day, 0L) + 1));

        Map<String, Object> hintBreakdown = buildHintUsageBreakdown(attempts);
        Map<String, Object> chessDistribution = buildChessDistribution(attempts);
        List<Map<String, Object>> codeQualityTimeline = buildCodeQualityTimeline(attempts);
        Map<String, Object> comparison = buildComparisonPayload(userId, analytics);

        Map<String, Object> payload = new HashMap<>();
        payload.put("scores", Map.of(
                "consistency", round2(analytics.getConsistencyScore()),
                "independence", round2(analytics.getIndependenceScore()),
                "speedPercentile", round2(analytics.getSpeedPercentile()),
                "codeQuality", round2(analytics.getCodeQualityRating()),
                "overallRank", round2(analytics.getOverallRankScore())
        ));
        payload.put("independenceScore", round2(analytics.getIndependenceScore()));
        payload.put("topicScores", topicScores);
        payload.put("radar", buildRadarPayload(topicScores));
        payload.put("heatmap", solvedPerDay.entrySet().stream().map(entry -> Map.of(
                "date", entry.getKey().toString(),
                "solved", entry.getValue()
        )).toList());
        payload.put("hintUsage", hintBreakdown);
        payload.put("codeQualityTimeline", codeQualityTimeline);
        payload.put("chessRatings", chessDistribution);
        payload.put("comparison", comparison);
        payload.put("totals", Map.of(
                "totalSolved", safe(analytics.getTotalSolved()),
                "totalAttempts", safe(analytics.getTotalAttempts()),
                "totalHintsUsed", safe(analytics.getTotalHintsUsed()),
                "streakDays", safe(analytics.getStreakDays())
        ));
        payload.put("stale", Boolean.TRUE.equals(analytics.getStale()));
        payload.put("updating", Boolean.TRUE.equals(analytics.getStale()));
        payload.put("staleSince", analytics.getStaleSince());
        payload.put("updatedAt", analytics.getUpdatedAt());
        return payload;
    }

    /**
     * Returns per-topic detailed analytics with attempt history.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getTopicPayload(Long userId, String tag) {
        String normalizedTag = normalizeTag(tag);
        UserAnalyticsEntity analytics = userAnalyticsRepository.findById(userId)
                .orElseGet(() -> buildDefaultAnalytics(userId));
        Map<String, Double> topicScores = parseTopicScores(analytics.getTopicScores());
        double score = topicScores.getOrDefault(normalizedTag, 0.0);

        List<Map<String, Object>> attempts = problemAttemptRepository.findByUserId(userId)
                .stream()
                .filter(item -> tagsForAttempt(item).contains(normalizedTag))
                .sorted(Comparator.comparing(ProblemAttemptEntity::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(item -> Map.<String, Object>of(
                        "problemId", item.getProblemId(),
                        "verdict", item.getVerdict(),
                        "timeToSubmit", safe(item.getTimeToSubmit()),
                        "hintsRequested", safe(item.getHintsRequested()),
                        "runCount", safe(item.getRunCount()),
                        "submitCount", safe(item.getSubmitCount()),
                        "updatedAt", item.getUpdatedAt()
                ))
                .toList();

        return Map.of(
                "topic", normalizedTag,
                "score", round2(score),
                "attempts", attempts
        );
    }

    /**
     * Recomputes and persists all analytics values synchronously.
     */
    @Transactional
    public void recalculateSync(Long userId) {
        List<ProblemAttemptEntity> attempts = problemAttemptRepository.findByUserId(userId);
        UserAnalyticsEntity analytics = userAnalyticsRepository.findById(userId)
                .orElseGet(() -> buildDefaultAnalytics(userId));

        if (attempts.isEmpty()) {
            analytics.setTopicScores("{}");
            analytics.setConsistencyScore(0.0);
            analytics.setIndependenceScore(100.0);
            analytics.setSpeedPercentile(0.0);
            analytics.setCodeQualityRating(0.0);
            analytics.setOverallRankScore(0.0);
            analytics.setTotalSolved(0);
            analytics.setTotalAttempts(0);
            analytics.setTotalHintsUsed(0);
            analytics.setStreakDays(0);
            analytics.setLastActivityDate(null);
            analytics.setStale(false);
            analytics.setStaleSince(null);
            userAnalyticsRepository.save(analytics);
            return;
        }

        Map<String, TopicAccumulator> topicBuckets = new HashMap<>();
        Set<String> solvedProblemIds = new HashSet<>();
        Set<String> attemptedProblemIds = new HashSet<>();
        int totalHintsUsed = 0;
        double codeQualityScoreSum = 0;
        int codeQualityCount = 0;

        LocalDate lastActivityDate = null;
        Set<LocalDate> activeDays = new HashSet<>();
        Set<String> problemsLastSevenDays = new HashSet<>();
        LocalDate sevenDaysAgo = LocalDate.now().minusDays(7);

        for (ProblemAttemptEntity attempt : attempts) {
            attemptedProblemIds.add(attempt.getProblemId());
            totalHintsUsed += safe(attempt.getHintsRequested());

            if (VERDICT_ACCEPTED.equals(attempt.getVerdict())) {
                solvedProblemIds.add(attempt.getProblemId());
            }

            LocalDateTime updatedAt = attempt.getUpdatedAt();
            if (updatedAt != null) {
                LocalDate day = updatedAt.toLocalDate();
                activeDays.add(day);
                if (lastActivityDate == null || day.isAfter(lastActivityDate)) {
                    lastActivityDate = day;
                }
                if (!day.isBefore(sevenDaysAgo)) {
                    problemsLastSevenDays.add(attempt.getProblemId());
                }
            }

            Double reviewScore = parseGroqOverallScore(attempt.getGroqReview());
            if (reviewScore != null) {
                codeQualityScoreSum += reviewScore;
                codeQualityCount += 1;
            }

            for (String tag : tagsForAttempt(attempt)) {
                TopicAccumulator accumulator = topicBuckets.computeIfAbsent(tag, ignored -> new TopicAccumulator(tag));
                accumulator.attempts += 1;
                accumulator.hints += safe(attempt.getHintsRequested());
                if (VERDICT_ACCEPTED.equals(attempt.getVerdict())) {
                    accumulator.accepted += 1;
                    if (safe(attempt.getTimeToSubmit()) > 0) {
                        accumulator.solveTimes.add(attempt.getTimeToSubmit());
                    }
                }
                if (reviewScore != null) {
                    accumulator.qualitySum += reviewScore;
                    accumulator.qualityCount += 1;
                }
            }
        }

        Map<String, Double> topicScores = new LinkedHashMap<>();
        for (TopicAccumulator bucket : topicBuckets.values()) {
            double attemptsCount = Math.max(bucket.attempts, 1);
            double base = ((double) bucket.accepted / attemptsCount) * 60.0;
            double averageSolveTime = bucket.solveTimes.isEmpty()
                    ? 300000.0
                    : bucket.solveTimes.stream().mapToLong(value -> value).average().orElse(300000.0);
            double speedBonus = Math.max(0.0, 10.0 - (averageSolveTime / 300000.0) * 10.0);
            double hintPenalty = bucket.hints * 5.0;
            double qualityAverage = bucket.qualityCount == 0 ? 0.0 : bucket.qualitySum / bucket.qualityCount;
            double qualityBonus = qualityAverage * 0.3;
            double topicScore = clamp(base + speedBonus - hintPenalty + qualityBonus, 0.0, 100.0);
            topicScores.put(bucket.topic, round2(topicScore));
        }

        double consistencyScore = computeConsistencyScore(activeDays, problemsLastSevenDays.size());
        int streakDays = computeStreakDays(activeDays);
        double independenceScore = clamp(
                100.0 - ((double) totalHintsUsed / Math.max(attemptedProblemIds.size(), 1)) * 15.0,
                0.0,
                100.0
        );
        double speedPercentile = computeSpeedPercentile(userId, attempts);
        double codeQualityRating = codeQualityCount == 0 ? 0.0 : (codeQualityScoreSum / codeQualityCount);
        double topicAverage = topicScores.isEmpty()
                ? 0.0
                : topicScores.values().stream().mapToDouble(value -> value).average().orElse(0.0);
        double overallRankScore = clamp(
                topicAverage * 0.30
                        + consistencyScore * 0.20
                        + independenceScore * 0.25
                        + speedPercentile * 0.10
                        + codeQualityRating * 0.15,
                0.0,
                100.0
        );

        analytics.setTopicScores(writeJsonSafely(topicScores, "{}"));
        analytics.setConsistencyScore(round2(consistencyScore));
        analytics.setIndependenceScore(round2(independenceScore));
        analytics.setSpeedPercentile(round2(speedPercentile));
        analytics.setCodeQualityRating(round2(codeQualityRating));
        analytics.setOverallRankScore(round2(overallRankScore));
        analytics.setTotalSolved(solvedProblemIds.size());
        analytics.setTotalAttempts(attemptedProblemIds.size());
        analytics.setTotalHintsUsed(totalHintsUsed);
        analytics.setStreakDays(streakDays);
        analytics.setLastActivityDate(lastActivityDate);
        analytics.setStale(false);
        analytics.setStaleSince(null);

        userAnalyticsRepository.save(analytics);
    }

    /**
     * Recomputes analytics asynchronously for submit-driven events.
     */
    @Async
    @Transactional
    public CompletableFuture<Void> recalculateAsync(Long userId) {
        recalculateSync(userId);
        return CompletableFuture.completedFuture(null);
    }

    private ProblemAttemptEntity getOrCreateActiveAttempt(
            Long userId,
            String problemId,
            Long testId,
            LocalDateTime now
    ) {
        Optional<ProblemAttemptEntity> existing = problemAttemptRepository
                .findTopByUserIdAndProblemIdOrderByUpdatedAtDescIdDesc(userId, problemId)
                .filter(item -> item.getSubmitCount() == 0 || !VERDICT_ACCEPTED.equals(item.getVerdict()));

        ProblemAttemptEntity attempt = existing.orElseGet(ProblemAttemptEntity::new);
        if (attempt.getId() == null) {
            attempt.setUserId(userId);
            attempt.setProblemId(problemId);
            attempt.setSessionStartedAt(now);
            attempt.setTopicTags(resolveTopicTags(problemId));
            attempt.setHintTimestamps("[]");
            attempt.setVerdict("SKIP");
        }

        if (testId != null) {
            attempt.setTestId(testId);
        }

        if (attempt.getSessionStartedAt() == null) {
            attempt.setSessionStartedAt(now);
        }

        if (attempt.getTopicTags() == null || attempt.getTopicTags().isBlank()) {
            attempt.setTopicTags(resolveTopicTags(problemId));
        }

        return attempt;
    }

    private String resolveTopicTags(String problemId) {
        String topic = practiceProblemCatalogService.getProblemCatalogEntry(problemId).topic();
        return writeJsonSafely(List.of(topic), "[]");
    }

    private String classifyVerdict(String runStatus, String runError) {
        String error = runError == null ? "" : runError.toLowerCase();
        if (error.contains("compile")) {
            return "CE";
        }
        if (error.contains("runtime") || error.contains("exception")) {
            return "RE";
        }

        String normalized = runStatus == null ? "" : runStatus.trim().toLowerCase();
        if ("great".equals(normalized) || "accepted".equals(normalized) || "ac".equals(normalized)) {
            return "AC";
        }
        if ("blunder".equals(normalized)) {
            return "RE";
        }
        if ("running".equals(normalized)) {
            return "SKIP";
        }
        return "WA";
    }

    private double computeConsistencyScore(Set<LocalDate> activeDays, int problemsLastSevenDays) {
        int streakDays = computeStreakDays(activeDays);
        return (streakDays * 2.0) + (problemsLastSevenDays * 5.0);
    }

    private int computeStreakDays(Collection<LocalDate> activeDays) {
        if (activeDays.isEmpty()) {
            return 0;
        }

        List<LocalDate> sorted = activeDays.stream().distinct().sorted(Comparator.reverseOrder()).toList();
        LocalDate cursor = sorted.get(0);
        int streak = 1;
        for (int index = 1; index < sorted.size(); index += 1) {
            LocalDate next = sorted.get(index);
            if (next.equals(cursor.minusDays(1))) {
                streak += 1;
                cursor = next;
            } else {
                break;
            }
        }
        return streak;
    }

    private double computeSpeedPercentile(Long userId, List<ProblemAttemptEntity> userAttempts) {
        List<ProblemAttemptEntity> accepted = userAttempts.stream()
                .filter(item -> VERDICT_ACCEPTED.equals(item.getVerdict()))
                .filter(item -> safe(item.getTimeToSubmit()) > 0)
                .toList();

        if (accepted.isEmpty()) {
            return 0.0;
        }

        List<Double> perProblemPercentiles = new ArrayList<>();
        for (ProblemAttemptEntity userAttempt : accepted) {
            long userTime = safe(userAttempt.getTimeToSubmit());
            List<Long> comparison = problemAttemptRepository.findByProblemIdAndVerdict(userAttempt.getProblemId(), VERDICT_ACCEPTED)
                    .stream()
                    .map(ProblemAttemptEntity::getTimeToSubmit)
                    .filter(item -> item != null && item > 0)
                    .toList();

            if (comparison.isEmpty()) {
                continue;
            }

            long slowerOrEqual = comparison.stream().filter(item -> item >= userTime).count();
            double percentile = ((double) slowerOrEqual / comparison.size()) * 100.0;
            perProblemPercentiles.add(percentile);
        }

        return perProblemPercentiles.isEmpty()
                ? 0.0
                : perProblemPercentiles.stream().mapToDouble(value -> value).average().orElse(0.0);
    }

    private Map<String, Object> buildHintUsageBreakdown(List<ProblemAttemptEntity> attempts) {
        Map<String, ProblemAttemptEntity> latestByProblem = new HashMap<>();
        for (ProblemAttemptEntity attempt : attempts) {
            ProblemAttemptEntity current = latestByProblem.get(attempt.getProblemId());
            if (current == null || compareTime(attempt.getUpdatedAt(), current.getUpdatedAt()) > 0) {
                latestByProblem.put(attempt.getProblemId(), attempt);
            }
        }

        int zero = 0;
        int one = 0;
        int two = 0;
        int threePlus = 0;
        for (ProblemAttemptEntity attempt : latestByProblem.values()) {
            int hints = safe(attempt.getHintsRequested());
            if (hints <= 0) {
                zero += 1;
            } else if (hints == 1) {
                one += 1;
            } else if (hints == 2) {
                two += 1;
            } else {
                threePlus += 1;
            }
        }

        return Map.of(
                "zero", zero,
                "one", one,
                "two", two,
                "threePlus", threePlus
        );
    }

    private Map<String, Object> buildChessDistribution(List<ProblemAttemptEntity> attempts) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        counts.put("Brilliant", 0);
        counts.put("Great", 0);
        counts.put("Good", 0);
        counts.put("Inaccuracy", 0);
        counts.put("Mistake", 0);
        counts.put("Blunder", 0);

        for (ProblemAttemptEntity attempt : attempts) {
            String rating = parseChessRating(attempt.getGroqReview());
            if (rating == null) {
                continue;
            }
            if (!counts.containsKey(rating)) {
                counts.put(rating, 0);
            }
            counts.put(rating, counts.get(rating) + 1);
        }

        return new HashMap<>(counts);
    }

    private List<Map<String, Object>> buildCodeQualityTimeline(List<ProblemAttemptEntity> attempts) {
        return attempts.stream()
                .filter(item -> parseGroqOverallScore(item.getGroqReview()) != null)
                .sorted(Comparator.comparing(ProblemAttemptEntity::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(item -> Map.<String, Object>of(
                        "problemId", item.getProblemId(),
                        "score", round2(parseGroqOverallScore(item.getGroqReview())),
                        "date", item.getUpdatedAt() == null ? null : item.getUpdatedAt().toString()
                ))
                .toList();
    }

    private Map<String, Object> buildComparisonPayload(Long userId, UserAnalyticsEntity userAnalytics) {
        List<UserAnalyticsEntity> analyticsRows = userAnalyticsRepository.findAll();
        if (analyticsRows.isEmpty()) {
            return Map.of(
                    "user", Map.of("overallRank", round2(userAnalytics.getOverallRankScore())),
                    "platformAverage", Map.of("overallRank", 0.0),
                    "topTenPercent", Map.of("overallRank", 0.0)
            );
        }

        double platformAverage = analyticsRows.stream()
                .map(UserAnalyticsEntity::getOverallRankScore)
                .filter(item -> item != null)
                .mapToDouble(value -> value)
                .average()
                .orElse(0.0);

        List<UserAnalyticsEntity> sorted = analyticsRows.stream()
                .sorted((left, right) -> Double.compare(
                        safe(right.getOverallRankScore()),
                        safe(left.getOverallRankScore())
                ))
                .toList();

        int topSliceSize = Math.max(1, (int) Math.ceil(sorted.size() * 0.1));
        double topTenAverage = sorted.stream()
                .limit(topSliceSize)
                .map(UserAnalyticsEntity::getOverallRankScore)
                .filter(item -> item != null)
                .mapToDouble(value -> value)
                .average()
                .orElse(0.0);

        return Map.of(
                "user", Map.of(
                        "userId", userId,
                        "overallRank", round2(userAnalytics.getOverallRankScore()),
                        "independence", round2(userAnalytics.getIndependenceScore()),
                        "consistency", round2(userAnalytics.getConsistencyScore())
                ),
                "platformAverage", Map.of(
                        "overallRank", round2(platformAverage)
                ),
                "topTenPercent", Map.of(
                        "overallRank", round2(topTenAverage)
                )
        );
    }

    private Map<String, Object> buildRadarPayload(Map<String, Double> topicScores) {
        return Map.of(
                "Arrays", round2(topicScores.getOrDefault("Array", 0.0)),
                "Trees", round2(topicScores.getOrDefault("Tree", 0.0)),
                "Graphs", round2(topicScores.getOrDefault("Graph", 0.0)),
                "DP", round2(topicScores.getOrDefault("Dynamic Programming", 0.0)),
                "Strings", round2(topicScores.getOrDefault("String", 0.0)),
                "Math", round2(topicScores.getOrDefault("Math", 0.0))
        );
    }

    private List<String> tagsForAttempt(ProblemAttemptEntity attempt) {
        List<String> tags = parseStringArray(attempt.getTopicTags())
                .stream()
                .map(this::normalizeTag)
                .toList();

        if (!tags.isEmpty()) {
            return tags;
        }

        return List.of(normalizeTag(practiceProblemCatalogService
                .getProblemCatalogEntry(attempt.getProblemId())
                .topic()));
    }

    private Map<String, Double> parseTopicScores(String json) {
        try {
            if (json == null || json.isBlank()) {
                return new LinkedHashMap<>();
            }
            Map<String, Object> parsed = OBJECT_MAPPER.readValue(json, new TypeReference<Map<String, Object>>() { });
            Map<String, Double> normalized = new LinkedHashMap<>();
            for (Map.Entry<String, Object> entry : parsed.entrySet()) {
                normalized.put(normalizeTag(entry.getKey()), safeDouble(entry.getValue()));
            }
            return normalized;
        } catch (Exception ignored) {
            return new LinkedHashMap<>();
        }
    }

    private List<String> parseStringArray(String json) {
        try {
            if (json == null || json.isBlank()) {
                return new ArrayList<>();
            }
            return OBJECT_MAPPER.readValue(json, new TypeReference<List<String>>() { });
        } catch (Exception ignored) {
            return new ArrayList<>();
        }
    }

    private Double parseGroqOverallScore(String groqReviewJson) {
        try {
            if (groqReviewJson == null || groqReviewJson.isBlank()) {
                return null;
            }
            Map<String, Object> parsed = OBJECT_MAPPER.readValue(groqReviewJson, new TypeReference<Map<String, Object>>() { });
            if (!parsed.containsKey("overall_score")) {
                return null;
            }
            return safeDouble(parsed.get("overall_score"));
        } catch (Exception ignored) {
            return null;
        }
    }

    private String parseChessRating(String groqReviewJson) {
        try {
            if (groqReviewJson == null || groqReviewJson.isBlank()) {
                return null;
            }
            Map<String, Object> parsed = OBJECT_MAPPER.readValue(groqReviewJson, new TypeReference<Map<String, Object>>() { });
            Object value = parsed.get("chess_rating");
            if (value == null) {
                return null;
            }
            String normalized = String.valueOf(value).trim();
            return normalized.isEmpty() ? null : normalized;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String writeJsonSafely(Object value, String fallback) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private UserAnalyticsEntity buildDefaultAnalytics(Long userId) {
        UserAnalyticsEntity analytics = new UserAnalyticsEntity();
        analytics.setUserId(userId);
        analytics.setTopicScores("{}");
        analytics.setConsistencyScore(0.0);
        analytics.setIndependenceScore(100.0);
        analytics.setSpeedPercentile(0.0);
        analytics.setCodeQualityRating(0.0);
        analytics.setOverallRankScore(0.0);
        analytics.setTotalSolved(0);
        analytics.setTotalAttempts(0);
        analytics.setTotalHintsUsed(0);
        analytics.setStreakDays(0);
        analytics.setStale(false);
        analytics.setStaleSince(null);
        return analytics;
    }

    private int compareTime(LocalDateTime left, LocalDateTime right) {
        if (left == null && right == null) {
            return 0;
        }
        if (left == null) {
            return -1;
        }
        if (right == null) {
            return 1;
        }
        return left.compareTo(right);
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private long safe(Long value) {
        return value == null ? 0L : value;
    }

    private double safe(Double value) {
        return value == null ? 0.0 : value;
    }

    private double safeDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return value == null ? 0.0 : Double.parseDouble(String.valueOf(value));
        } catch (Exception ignored) {
            return 0.0;
        }
    }

    private String normalizeTag(String tag) {
        if (tag == null || tag.isBlank()) {
            return "General";
        }
        String trimmed = tag.trim();
        if (trimmed.equalsIgnoreCase("dp")) {
            return "Dynamic Programming";
        }
        return Character.toUpperCase(trimmed.charAt(0)) + trimmed.substring(1);
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Mutable topic bucket used during analytics accumulation.
     */
    private static final class TopicAccumulator {
        private final String topic;
        private int attempts;
        private int accepted;
        private int hints;
        private final List<Long> solveTimes = new ArrayList<>();
        private double qualitySum;
        private int qualityCount;

        private TopicAccumulator(String topic) {
            this.topic = topic;
        }
    }
}
