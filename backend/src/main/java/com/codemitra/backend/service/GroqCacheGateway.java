package com.codemitra.backend.service;

import com.codemitra.backend.model.GroqHintCacheEntity;
import com.codemitra.backend.model.ProblemEditorialEntity;
import com.codemitra.backend.model.ProblemEntity;
import com.codemitra.backend.model.ProblemSubmissionEntity;
import com.codemitra.backend.repository.GroqHintCacheRepository;
import com.codemitra.backend.repository.ProblemEditorialRepository;
import com.codemitra.backend.repository.ProblemSubmissionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Single entry point for all Groq access with cache lookup, in-flight dedupe, and budget enforcement.
 */
@Service
public class GroqCacheGateway {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final GroqService groqService;
    private final ProblemRegistryService problemRegistryService;
    private final GroqHintCacheRepository groqHintCacheRepository;
    private final ProblemEditorialRepository problemEditorialRepository;
    private final ProblemSubmissionRepository problemSubmissionRepository;
    private final CacheStatsService cacheStatsService;
    private final GroqUsageService groqUsageService;
    private final DailyBudgetGuard dailyBudgetGuard;
    private final StringRedisTemplate redisTemplate;

    private final ConcurrentHashMap<String, CompletableFuture<String>> inFlight = new ConcurrentHashMap<>();

    @Value("${groq.model.hint:llama3-8b-8192}")
    private String hintModel;

    @Value("${groq.model.review:llama3-70b-8192}")
    private String reviewModel;

    @Value("${groq.model.summary:llama3-8b-8192}")
    private String summaryModel;

    @Value("${groq.model.chat:llama3-8b-8192}")
    private String chatModel;

    @Value("${REDIS_URL:disabled}")
    private String redisUrl;

    public GroqCacheGateway(
            GroqService groqService,
            ProblemRegistryService problemRegistryService,
            GroqHintCacheRepository groqHintCacheRepository,
            ProblemEditorialRepository problemEditorialRepository,
            ProblemSubmissionRepository problemSubmissionRepository,
            CacheStatsService cacheStatsService,
            GroqUsageService groqUsageService,
            DailyBudgetGuard dailyBudgetGuard,
            ObjectProvider<StringRedisTemplate> redisTemplateProvider
    ) {
        this.groqService = groqService;
        this.problemRegistryService = problemRegistryService;
        this.groqHintCacheRepository = groqHintCacheRepository;
        this.problemEditorialRepository = problemEditorialRepository;
        this.problemSubmissionRepository = problemSubmissionRepository;
        this.cacheStatsService = cacheStatsService;
        this.groqUsageService = groqUsageService;
        this.dailyBudgetGuard = dailyBudgetGuard;
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
    }

    /**
     * Handles chat calls through unified usage logging path without shared cache.
     */
    public GroqService.ChatProxyResult chat(GroqService.ChatProxyRequest request, Long userId, String problemKey) {
        ProblemEntity problem = problemRegistryService.resolveOrCreate(problemKey == null ? "chat" : problemKey, null, List.of("General"));
        dailyBudgetGuard.assertBudgetAvailable();

        GroqService.ChatProxyResult result = groqService.chat(
                new GroqService.ChatProxyRequest(
                        request.messages(),
                        request.model() == null || request.model().isBlank() ? chatModel : request.model(),
                        request.temperature(),
                        request.maxTokens()
                )
        );

        groqUsageService.log(
                "CHAT",
                result.modelUsed(),
                result.inputTokens(),
                result.outputTokens(),
                false,
                userId,
                problem.getId()
        );

        return result;
    }

    /**
     * Returns one shared hint for problem+hintNumber. First miss pays Groq cost, all later reads are cache hits.
     */
    @Transactional
    public String getHint(
            Long userId,
            String problemKey,
            int hintNumber,
            String problemStatement,
            List<String> topicTags,
            String systemPrompt
    ) {
        ProblemEntity problem = problemRegistryService.resolveOrCreate(problemKey, problemStatement, topicTags);
        String cacheKey = "hint:" + problem.getId() + ":" + hintNumber;

        String redisValue = readHintFromRedis(problem.getId(), hintNumber);
        if (redisValue != null) {
            cacheStatsService.recordHit(cacheKey, estimateHintTokens(redisValue));
            groqHintCacheRepository.incrementUsage(problem.getId(), hintNumber);
            groqUsageService.log("HINT", hintModel, 0, 0, true, userId, problem.getId());
            return redisValue;
        }

        GroqHintCacheEntity dbHint = groqHintCacheRepository.findByProblemIdAndHintNumber(problem.getId(), hintNumber).orElse(null);
        if (dbHint != null) {
            groqHintCacheRepository.incrementUsage(problem.getId(), hintNumber);
            cacheStatsService.recordHit(cacheKey, estimateHintTokens(dbHint.getHintText()));
            writeHintToRedis(problem.getId(), hintNumber, dbHint.getHintText());
            groqUsageService.log("HINT", hintModel, 0, 0, true, userId, problem.getId());
            return dbHint.getHintText();
        }

        try {
            return inFlight.computeIfAbsent(cacheKey, ignored -> CompletableFuture.supplyAsync(() -> {
                try {
                    dailyBudgetGuard.assertBudgetAvailable();
                    cacheStatsService.recordMiss(cacheKey);

                    String summary = ensureProblemSummary(userId, problem, problemStatement);
                    String userPrompt = "Problem summary:\n" + summary
                            + "\n\nHint number: " + hintNumber
                            + "\nReturn only the hint text.";

                    GroqService.ChatProxyResult result = groqService.chat(
                            new GroqService.ChatProxyRequest(
                                    List.of(
                                            Map.of("role", "system", "content", systemPrompt),
                                            Map.of("role", "user", "content", userPrompt)
                                    ),
                                    hintModel,
                                    0.45,
                                    220
                            )
                    );

                    if (!HttpStatus.OK.equals(result.status())) {
                        throw new ResponseStatusException(result.status(), String.valueOf(result.payload().getOrDefault("message", "Hint generation failed")));
                    }

                    String hint = String.valueOf(result.payload().getOrDefault("content", "")).trim();
                    if (hint.isBlank()) {
                        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Hint generation returned empty payload");
                    }

                    GroqHintCacheEntity toSave = new GroqHintCacheEntity();
                    toSave.setProblemId(problem.getId());
                    toSave.setHintNumber(hintNumber);
                    toSave.setHintText(hint);
                    toSave.setGeneratedAt(LocalDateTime.now());
                    toSave.setUsedCount(1);
                    toSave.setLastUsedAt(LocalDateTime.now());
                    groqHintCacheRepository.save(toSave);
                    writeHintToRedis(problem.getId(), hintNumber, hint);

                    groqUsageService.log(
                            "HINT",
                            result.modelUsed(),
                            result.inputTokens(),
                            result.outputTokens(),
                            false,
                            userId,
                            problem.getId()
                    );

                    return hint;
                } finally {
                    inFlight.remove(cacheKey);
                }
            })).join();
        } catch (CompletionException ex) {
            if (ex.getCause() instanceof ResponseStatusException responseStatusException) {
                throw responseStatusException;
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Hint generation failed", ex);
        }
    }

    /**
     * Returns cached user-specific code review for submission, generating once when missing.
     */
    @Transactional
    public Map<String, Object> getCodeReview(
            Long userId,
            Long submissionId,
            String problemKey,
            String problemStatement,
            String userCode,
            String language,
            String timeComplexityClaimed
    ) {
        ProblemEntity problem = problemRegistryService.resolveOrCreate(problemKey, problemStatement, List.of("General"));
        ProblemSubmissionEntity submission = resolveSubmission(userId, submissionId, problemKey);
        String cacheKey = "review:" + userId + ":" + problemKey + ":" + submission.getId();

        if (submission.getGroqReview() != null && !submission.getGroqReview().isBlank()) {
            cacheStatsService.recordHit(cacheKey, estimateHintTokens(submission.getGroqReview()));
            groqUsageService.log("REVIEW", reviewModel, 0, 0, true, userId, problem.getId());
            return parseObject(submission.getGroqReview());
        }

        try {
            String reviewJson = inFlight.computeIfAbsent(cacheKey, ignored -> CompletableFuture.supplyAsync(() -> {
                try {
                    dailyBudgetGuard.assertBudgetAvailable();
                    cacheStatsService.recordMiss(cacheKey);

                    String summary = ensureProblemSummary(userId, problem, problemStatement);
                    String systemPrompt = "You are a strict but constructive code reviewer. Return ONLY JSON with keys: "
                            + "best_line, worst_line, good_logic_segments, suggested_approach, time_complexity, "
                            + "optimal_complexity, trade_offs, chess_rating, overall_score.";
                    String userPrompt = "Problem summary:\n" + summary
                            + "\n\nLanguage: " + language
                            + "\nClaimed complexity: " + (timeComplexityClaimed == null ? "Not specified" : timeComplexityClaimed)
                            + "\n\nCode:\n" + userCode;

                    GroqService.ChatProxyResult result = groqService.chat(
                            new GroqService.ChatProxyRequest(
                                    List.of(
                                            Map.of("role", "system", "content", systemPrompt),
                                            Map.of("role", "user", "content", userPrompt)
                                    ),
                                    reviewModel,
                                    0.2,
                                    700
                            )
                    );

                    if (!HttpStatus.OK.equals(result.status())) {
                        throw new ResponseStatusException(result.status(), String.valueOf(result.payload().getOrDefault("message", "Review generation failed")));
                    }

                    String content = String.valueOf(result.payload().getOrDefault("content", "")).trim();
                    String json = extractJsonObject(content);
                    Map<String, Object> parsed = parseObject(json);
                    if (parsed.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Review generation returned invalid JSON");
                    }

                    String storedJson = writeJson(parsed, "{}");
                    submission.setGroqReview(storedJson);
                    problemSubmissionRepository.save(submission);

                    groqUsageService.log(
                            "REVIEW",
                            result.modelUsed(),
                            result.inputTokens(),
                            result.outputTokens(),
                            false,
                            userId,
                            problem.getId()
                    );
                    return storedJson;
                } finally {
                    inFlight.remove(cacheKey);
                }
            })).join();

            return parseObject(reviewJson);
        } catch (CompletionException ex) {
            if (ex.getCause() instanceof ResponseStatusException responseStatusException) {
                throw responseStatusException;
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Code review generation failed", ex);
        }
    }

    /**
     * Returns one shared difficulty explanation per problem and caches it on the problem row.
     */
    @Transactional
    public String getDifficultyExplanation(Long userId, String problemKey, String problemStatement, String difficulty) {
        ProblemEntity problem = problemRegistryService.resolveOrCreate(problemKey, problemStatement, List.of("General"));
        String cacheKey = "difficulty_explain:" + problem.getId();

        if (problem.getDifficultyExplanation() != null && !problem.getDifficultyExplanation().isBlank()) {
            cacheStatsService.recordHit(cacheKey, estimateHintTokens(problem.getDifficultyExplanation()));
            groqUsageService.log("DIFFICULTY", summaryModel, 0, 0, true, userId, problem.getId());
            return problem.getDifficultyExplanation();
        }

        dailyBudgetGuard.assertBudgetAvailable();
        cacheStatsService.recordMiss(cacheKey);

        String summary = ensureProblemSummary(userId, problem, problemStatement);
        String prompt = "Explain in 2-3 sentences why this problem is " + (difficulty == null ? "Medium" : difficulty)
                + " level for DSA learners. Problem summary:\n" + summary;

        GroqService.ChatProxyResult result = groqService.chat(
                new GroqService.ChatProxyRequest(
                        List.of(
                                Map.of("role", "system", "content", "You are a concise DSA mentor."),
                                Map.of("role", "user", "content", prompt)
                        ),
                        summaryModel,
                        0.25,
                        180
                )
        );

        if (!HttpStatus.OK.equals(result.status())) {
            throw new ResponseStatusException(result.status(), String.valueOf(result.payload().getOrDefault("message", "Difficulty explanation generation failed")));
        }

        String text = String.valueOf(result.payload().getOrDefault("content", "")).trim();
        problem.setDifficultyExplanation(text);
        problemRegistryService.save(problem);

        groqUsageService.log("DIFFICULTY", result.modelUsed(), result.inputTokens(), result.outputTokens(), false, userId, problem.getId());
        return text;
    }

    /**
     * Returns one shared high-level editorial and caches it in problem_editorials.
     */
    @Transactional
    public String getEditorial(Long userId, String problemKey, String problemStatement) {
        ProblemEntity problem = problemRegistryService.resolveOrCreate(problemKey, problemStatement, List.of("General"));
        String cacheKey = "editorial:" + problem.getId();

        ProblemEditorialEntity cached = problemEditorialRepository.findByProblemId(problem.getId()).orElse(null);
        if (cached != null && cached.getEditorialText() != null && !cached.getEditorialText().isBlank()) {
            cacheStatsService.recordHit(cacheKey, estimateHintTokens(cached.getEditorialText()));
            groqUsageService.log("EDITORIAL", summaryModel, 0, 0, true, userId, problem.getId());
            return cached.getEditorialText();
        }

        dailyBudgetGuard.assertBudgetAvailable();
        cacheStatsService.recordMiss(cacheKey);

        String summary = ensureProblemSummary(userId, problem, problemStatement);
        GroqService.ChatProxyResult result = groqService.chat(
                new GroqService.ChatProxyRequest(
                        List.of(
                                Map.of("role", "system", "content", "You are a DSA mentor. Provide high-level approach only. No direct code."),
                                Map.of("role", "user", "content", "Create a concise editorial approach outline for this problem:\n" + summary)
                        ),
                        summaryModel,
                        0.3,
                        260
                )
        );

        if (!HttpStatus.OK.equals(result.status())) {
            throw new ResponseStatusException(result.status(), String.valueOf(result.payload().getOrDefault("message", "Editorial generation failed")));
        }

        String text = String.valueOf(result.payload().getOrDefault("content", "")).trim();
        ProblemEditorialEntity row = new ProblemEditorialEntity();
        row.setProblemId(problem.getId());
        row.setEditorialText(text);
        row.setGeneratedByUserId(userId);
        row.setGeneratedAt(LocalDateTime.now());
        problemEditorialRepository.save(row);

        groqUsageService.log("EDITORIAL", result.modelUsed(), result.inputTokens(), result.outputTokens(), false, userId, problem.getId());
        return text;
    }

    /**
     * Generates and caches a compressed problem summary used for prompt compression.
     */
    @Transactional
    public String ensureProblemSummary(Long userId, ProblemEntity problem, String problemStatement) {
        if (problem.getProblemSummary() != null && !problem.getProblemSummary().isBlank()) {
            cacheStatsService.recordHit("summary:" + problem.getId(), estimateHintTokens(problem.getProblemSummary()));
            groqUsageService.log("SUMMARY", summaryModel, 0, 0, true, userId, problem.getId());
            return problem.getProblemSummary();
        }

        dailyBudgetGuard.assertBudgetAvailable();
        cacheStatsService.recordMiss("summary:" + problem.getId());

        String statement = (problemStatement == null || problemStatement.isBlank())
                ? (problem.getDescription() == null ? problem.getTitle() : problem.getDescription())
                : problemStatement;

        GroqService.ChatProxyResult result = groqService.chat(
                new GroqService.ChatProxyRequest(
                        List.of(
                                Map.of("role", "system", "content", "Summarize DSA problems for mentors in at most 3 concise sentences."),
                                Map.of("role", "user", "content", statement)
                        ),
                        summaryModel,
                        0.1,
                        220
                )
        );

        if (!HttpStatus.OK.equals(result.status())) {
            String fallback = truncate(statement, 350);
            problem.setProblemSummary(fallback);
            problemRegistryService.save(problem);
            groqUsageService.log("SUMMARY", summaryModel, 0, 0, false, userId, problem.getId());
            return fallback;
        }

        String summary = String.valueOf(result.payload().getOrDefault("content", "")).trim();
        if (summary.isBlank()) {
            summary = truncate(statement, 350);
        }

        problem.setProblemSummary(summary);
        problemRegistryService.save(problem);
        groqUsageService.log("SUMMARY", result.modelUsed(), result.inputTokens(), result.outputTokens(), false, userId, problem.getId());
        return summary;
    }

    private ProblemSubmissionEntity resolveSubmission(Long userId, Long submissionId, String problemKey) {
        if (submissionId != null) {
            ProblemSubmissionEntity byId = problemSubmissionRepository.findById(submissionId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
            if (!byId.getUserId().equals(userId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access another user's submission");
            }
            return byId;
        }

        return problemSubmissionRepository.findByUserIdAndProblemId(userId, problemKey)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
    }

    private String readHintFromRedis(Long problemId, int hintNumber) {
        if (!isRedisEnabled()) {
            return null;
        }
        try {
            return redisTemplate.opsForValue().get(redisHintKey(problemId, hintNumber));
        } catch (Exception ignored) {
            return null;
        }
    }

    private void writeHintToRedis(Long problemId, int hintNumber, String hintText) {
        if (!isRedisEnabled()) {
            return;
        }
        try {
            redisTemplate.opsForValue().set(redisHintKey(problemId, hintNumber), hintText);
        } catch (Exception ignored) {
            // Redis is optional. DB cache remains authoritative.
        }
    }

    private boolean isRedisEnabled() {
        return redisTemplate != null
                && redisUrl != null
                && !redisUrl.isBlank()
                && !"disabled".equalsIgnoreCase(redisUrl);
    }

    private String redisHintKey(Long problemId, int hintNumber) {
        return "codemitra:hint:" + problemId + ":" + hintNumber;
    }

    private int estimateHintTokens(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        return Math.max(1, text.length() / 4);
    }

    private String truncate(String text, int maxLength) {
        if (text == null) {
            return "";
        }
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength);
    }

    private String extractJsonObject(String content) {
        if (content == null || content.isBlank()) {
            return "{}";
        }
        int start = content.indexOf('{');
        int end = content.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return content.substring(start, end + 1);
        }
        return "{}";
    }

    private Map<String, Object> parseObject(String json) {
        try {
            return OBJECT_MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception ex) {
            return new HashMap<>();
        }
    }

    private String writeJson(Object value, String fallback) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (Exception ex) {
            return fallback;
        }
    }

}
