package com.codemitra.backend.service;

import com.codemitra.backend.dto.AiDtos;
import com.codemitra.backend.model.HintLogEntity;
import com.codemitra.backend.model.ProblemAttemptEntity;
import com.codemitra.backend.model.ProblemSubmissionEntity;
import com.codemitra.backend.model.TestEntity;
import com.codemitra.backend.repository.HintLogRepository;
import com.codemitra.backend.repository.ProblemAttemptRepository;
import com.codemitra.backend.repository.ProblemSubmissionRepository;
import com.codemitra.backend.repository.TestRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Enforces AI hint cooldown and budget policies, and runs post-AC Groq code review analysis.
 */
@Service
public class AiHintService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final AuthService authService;
    private final TestRepository testRepository;
    private final GroqCacheGateway groqCacheGateway;
    private final AnalyticsEngineService analyticsEngineService;
    private final ProblemAttemptRepository problemAttemptRepository;
    private final HintLogRepository hintLogRepository;
    private final ProblemSubmissionRepository problemSubmissionRepository;
    private final PracticeProblemCatalogService practiceProblemCatalogService;

    public AiHintService(
            AuthService authService,
            TestRepository testRepository,
            GroqCacheGateway groqCacheGateway,
            AnalyticsEngineService analyticsEngineService,
            ProblemAttemptRepository problemAttemptRepository,
            HintLogRepository hintLogRepository,
            ProblemSubmissionRepository problemSubmissionRepository,
            PracticeProblemCatalogService practiceProblemCatalogService
    ) {
        this.authService = authService;
        this.testRepository = testRepository;
        this.groqCacheGateway = groqCacheGateway;
        this.analyticsEngineService = analyticsEngineService;
        this.problemAttemptRepository = problemAttemptRepository;
        this.hintLogRepository = hintLogRepository;
        this.problemSubmissionRepository = problemSubmissionRepository;
        this.practiceProblemCatalogService = practiceProblemCatalogService;
    }

    /**
     * Returns current hint cooldown and budget status for one problem session.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getHintStatus(String problemId, Long testId) {
        Long userId = authService.getOrCreateCurrentUser().getId();
        HintPolicy policy = resolveHintPolicy(testId);

        ProblemAttemptEntity attempt = problemAttemptRepository
                .findTopByUserIdAndProblemIdOrderByUpdatedAtDescIdDesc(userId, problemId)
                .orElse(null);

        int usedHints = attempt == null ? 0 : safe(attempt.getHintsRequested());
        int remainingHints = policy.allowHints
                ? Math.max(policy.maxHintsPerProblem - usedHints, 0)
                : 0;
        long secondsRemaining = computeCooldownSecondsRemaining(
                attempt == null ? null : attempt.getLastHintTimestamp(),
                policy.cooldownMinutes
        );

        List<Map<String, Object>> history = hintLogRepository
                .findByUserIdAndProblemIdOrderByRequestedAtAsc(userId, problemId)
                .stream()
                .map(item -> Map.<String, Object>of(
                        "id", item.getId(),
                        "hintNumber", item.getHintNumber(),
                        "requestedAt", item.getRequestedAt(),
                        "response", item.getGroqResponse() == null ? "" : item.getGroqResponse()
                ))
                .toList();

        return Map.of(
                "problemId", problemId,
                "allowHints", policy.allowHints,
                "cooldownMinutes", policy.cooldownMinutes,
                "secondsRemaining", secondsRemaining,
                "maxHints", policy.maxHintsPerProblem,
                "usedHints", usedHints,
                "remainingHints", remainingHints,
                "hintHistory", history
        );
    }

    /**
     * Enforces cooldown and hint budget, then generates one contextual Groq hint.
     */
    @Transactional
    public AiOperationResult requestHint(AiDtos.HintRequest request) {
        if (request == null
                || request.problemId() == null || request.problemId().isBlank()
                || request.userCode() == null) {
            return new AiOperationResult(HttpStatus.BAD_REQUEST, Map.of(
                    "message", "problemId and userCode are required"
            ));
        }

        Long userId = authService.getOrCreateCurrentUser().getId();
        HintPolicy policy = resolveHintPolicy(request.testId());
        if (!policy.allowHints) {
            return new AiOperationResult(HttpStatus.FORBIDDEN, Map.of(
                    "message", "AI hints are disabled for this test"
            ));
        }

        ProblemAttemptEntity attempt = problemAttemptRepository
                .findTopByUserIdAndProblemIdOrderByUpdatedAtDescIdDesc(userId, request.problemId())
                .orElse(null);

        int usedHints = attempt == null ? 0 : safe(attempt.getHintsRequested());
        if (usedHints >= policy.maxHintsPerProblem) {
            return new AiOperationResult(HttpStatus.TOO_MANY_REQUESTS, Map.of(
                    "message", "Hint budget exhausted for this problem",
                    "seconds_remaining", 0,
                    "hints_remaining", 0
            ));
        }

        long secondsRemaining = computeCooldownSecondsRemaining(
                attempt == null ? null : attempt.getLastHintTimestamp(),
                policy.cooldownMinutes
        );
        if (secondsRemaining > 0) {
            analyticsEngineService.trackCooldownViolation(userId, request.problemId(), request.testId());
            persistHintLog(userId, request.problemId(), usedHints + 1, (int) secondsRemaining,
                    "Cooldown violation attempt");
            return new AiOperationResult(HttpStatus.TOO_MANY_REQUESTS, Map.of(
                    "message", "Hint cooldown active",
                    "seconds_remaining", secondsRemaining,
                    "hints_remaining", policy.maxHintsPerProblem - usedHints
            ));
        }

        int hintNumber = usedHints + 1;
        String problemStatement = request.problemStatement() == null || request.problemStatement().isBlank()
                ? "Problem: " + practiceProblemCatalogService.getProblemCatalogEntry(request.problemId()).title()
                : request.problemStatement();

        List<String> topicTags = request.topicTags() == null || request.topicTags().isEmpty()
                ? List.of(practiceProblemCatalogService.getProblemCatalogEntry(request.problemId()).topic())
                : request.topicTags();

        String systemPrompt = buildHintSystemPrompt(hintNumber);
        String hintText;
        try {
            hintText = groqCacheGateway.getHint(
                userId,
                request.problemId(),
                hintNumber,
                problemStatement,
                topicTags,
                systemPrompt
            );
        } catch (ResponseStatusException ex) {
            return new AiOperationResult(HttpStatus.valueOf(ex.getStatusCode().value()), Map.of(
                "message", ex.getReason() == null ? "Hint generation failed" : ex.getReason()
            ));
        }

        persistHintLog(userId, request.problemId(), hintNumber, 0, hintText);
        analyticsEngineService.trackHintEvent(userId, request.problemId(), request.testId());

        Map<String, Object> statusPayload = new HashMap<>(getHintStatus(request.problemId(), request.testId()));
        statusPayload.put("hint", hintText);
        statusPayload.put("hintNumber", hintNumber);
        return new AiOperationResult(HttpStatus.OK, statusPayload);
    }

    /**
     * Generates and persists post-AC Groq code review payload.
     */
    @Transactional
    public AiOperationResult requestReview(AiDtos.ReviewRequest request) {
        if (request == null
                || request.problemId() == null || request.problemId().isBlank()
                || request.userCode() == null || request.userCode().isBlank()
                || request.language() == null || request.language().isBlank()) {
            return new AiOperationResult(HttpStatus.BAD_REQUEST, Map.of(
                    "message", "problemId, userCode, and language are required"
            ));
        }

        Long userId = authService.getOrCreateCurrentUser().getId();
        ProblemAttemptEntity attempt = problemAttemptRepository
                .findTopByUserIdAndProblemIdOrderByUpdatedAtDescIdDesc(userId, request.problemId())
                .orElse(null);

        if (attempt == null || !"AC".equalsIgnoreCase(attempt.getVerdict())) {
            return new AiOperationResult(HttpStatus.BAD_REQUEST, Map.of(
                    "message", "Code review is available only after an Accepted submission"
            ));
        }

        Map<String, Object> reviewPayload = generateReviewPayload(
            userId,
                request.problemId(),
                request.problemStatement(),
                request.userCode(),
                request.language(),
                request.timeComplexityClaimed()
        );

        if (reviewPayload.containsKey("__error_status")) {
            HttpStatus errorStatus = HttpStatus.valueOf((Integer) reviewPayload.get("__error_status"));
            reviewPayload.remove("__error_status");
            return new AiOperationResult(errorStatus, reviewPayload);
        }

        String reviewJson = writeJson(reviewPayload, "{}");
        attempt.setGroqReview(reviewJson);
        problemAttemptRepository.save(attempt);

        problemSubmissionRepository.findByUserIdAndProblemId(userId, request.problemId()).ifPresent(submission -> {
            submission.setGroqReview(reviewJson);
            submission.setChessRating(asString(reviewPayload.get("chess_rating")));
            submission.setOverallScore(BigDecimal.valueOf(asDouble(reviewPayload.get("overall_score"))));
            problemSubmissionRepository.save(submission);
        });

        analyticsEngineService.markAnalyticsDirty(userId);

        return new AiOperationResult(HttpStatus.OK, Map.of(
                "message", "Code review generated",
                "review", reviewPayload
        ));
    }

    /**
     * Internal helper used by submit flow to auto-run post-AC review and persist it.
     */
    @Transactional
    public Map<String, Object> generatePostAcReview(
            Long userId,
            String problemId,
            String problemStatement,
            String userCode,
            String language,
            String timeComplexityClaimed
    ) {
        Map<String, Object> reviewPayload = generateReviewPayload(
            userId,
                problemId,
                problemStatement,
                userCode,
                language,
                timeComplexityClaimed
        );

        if (reviewPayload.containsKey("__error_status")) {
            return Map.of(
                    "message", "Code review unavailable",
                    "reason", reviewPayload.getOrDefault("message", "Groq review failed")
            );
        }

        String reviewJson = writeJson(reviewPayload, "{}");
        problemAttemptRepository.findTopByUserIdAndProblemIdOrderByUpdatedAtDescIdDesc(userId, problemId)
                .ifPresent(attempt -> {
                    attempt.setGroqReview(reviewJson);
                    problemAttemptRepository.save(attempt);
                });

        problemSubmissionRepository.findByUserIdAndProblemId(userId, problemId).ifPresent(submission -> {
            submission.setGroqReview(reviewJson);
            submission.setChessRating(asString(reviewPayload.get("chess_rating")));
            submission.setOverallScore(BigDecimal.valueOf(asDouble(reviewPayload.get("overall_score"))));
            problemSubmissionRepository.save(submission);
        });

        analyticsEngineService.markAnalyticsDirty(userId);
        return reviewPayload;
    }

    private Map<String, Object> generateReviewPayload(
            Long userId,
            String problemId,
            String problemStatement,
            String userCode,
            String language,
            String timeComplexityClaimed
    ) {
        try {
            Map<String, Object> payload = groqCacheGateway.getCodeReview(
                    userId,
                    null,
                    problemId,
                    problemStatement,
                    userCode,
                    language,
                    timeComplexityClaimed
            );

            payload.putIfAbsent("trade_offs", List.of("Balance readability and raw speed for maintainability."));
            payload.putIfAbsent("good_logic_segments", List.of());
            payload.putIfAbsent("chess_rating", "Good");
            payload.putIfAbsent("overall_score", 70);
            payload.putIfAbsent("time_complexity", "Not specified");
            payload.putIfAbsent("optimal_complexity", "Problem dependent");
            payload.putIfAbsent("suggested_approach", "Refine edge-case handling and validate complexity assumptions.");
            return payload;
        } catch (ResponseStatusException ex) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("message", ex.getReason() == null ? "Review generation failed" : ex.getReason());
            payload.put("__error_status", ex.getStatusCode().value());
            return payload;
        } catch (Exception ex) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("message", "Review generation failed");
            payload.put("details", ex.getMessage());
            payload.put("__error_status", HttpStatus.BAD_GATEWAY.value());
            return payload;
        }
    }

    private String buildHintSystemPrompt(int hintNumber) {
        if (hintNumber <= 1) {
            return "You are a friendly senior developer mentor. The student is stuck. "
                    + "Give a gentle nudge, do NOT give code or the answer. Ask one guiding question that makes them think about the right direction. "
                    + "Write in Hinglish (Roman Hindi + English) using a relatable story. Keep it under 3 sentences. No code.";
        }

        if (hintNumber == 2) {
            return "You are a senior developer who expected the student to solve it after the first hint. "
                    + "Show mild, respectful disappointment in Hinglish Roman script. "
                    + "Reference the earlier hint, still do NOT give code or final answer. Max 4 sentences.";
        }

        return "You are a frustrated senior developer who believes this student is capable but being lazy. "
                + "Be direct and slightly harsh (not abusive), in Hinglish Roman script. "
                + "Make them think for themselves. Do NOT give code or direct answer. Max 3 sentences.";
    }

    private String buildHintUserPrompt(
            String problemStatement,
            String userCode,
            List<String> topicTags,
            int hintNumber
    ) {
        return "Hint Number: " + hintNumber
                + "\nTopics: " + String.join(", ", topicTags)
                + "\n\nProblem Statement:\n" + problemStatement
                + "\n\nCurrent User Code:\n" + userCode
                + "\n\nGive a contextual hint according to the tone rules.";
    }

    private HintPolicy resolveHintPolicy(Long testId) {
        if (testId == null) {
            return new HintPolicy(true, 10, 3);
        }

        Optional<TestEntity> optional = testRepository.findById(testId);
        if (optional.isEmpty()) {
            return new HintPolicy(true, 10, 3);
        }

        TestEntity test = optional.get();
        boolean allowHints = Boolean.TRUE.equals(test.getAllowAiHints());
        int cooldown = test.getAiHintCooldownMinutes() == null ? 10 : Math.max(test.getAiHintCooldownMinutes(), 1);
        int maxHints = test.getMaxHintsPerProblem() == null ? 3 : Math.max(test.getMaxHintsPerProblem(), 1);
        return new HintPolicy(allowHints, cooldown, maxHints);
    }

    private long computeCooldownSecondsRemaining(LocalDateTime lastHintTimestamp, int cooldownMinutes) {
        if (lastHintTimestamp == null) {
            return 0;
        }
        long cooldownSeconds = cooldownMinutes * 60L;
        long elapsed = Duration.between(lastHintTimestamp, LocalDateTime.now()).getSeconds();
        return Math.max(cooldownSeconds - elapsed, 0);
    }

    private void persistHintLog(
            Long userId,
            String problemId,
            int hintNumber,
            int cooldownRemaining,
            String response
    ) {
        HintLogEntity entity = new HintLogEntity();
        entity.setUserId(userId);
        entity.setProblemId(problemId);
        entity.setHintNumber(hintNumber);
        entity.setCooldownRemainingAtRequest(cooldownRemaining);
        entity.setGroqResponse(response);
        hintLogRepository.save(entity);
    }

    private Map<String, Object> parseObject(String json) {
        try {
            if (json == null || json.isBlank()) {
                return Map.of();
            }
            return OBJECT_MAPPER.readValue(json, new TypeReference<Map<String, Object>>() { });
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private String extractJsonObject(String response) {
        if (response == null || response.isBlank()) {
            return "";
        }

        String trimmed = response.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```json", "").replaceFirst("^```", "");
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3).trim();
            }
        }

        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1);
        }

        return trimmed;
    }

    private Map<String, Object> buildReviewFallback(String userCode) {
        List<String> lines = userCode == null ? List.of() : List.of(userCode.split("\\R"));
        int bestLineNumber = lines.isEmpty() ? 1 : Math.min(lines.size(), 1);
        String bestLine = lines.isEmpty() ? "" : lines.get(bestLineNumber - 1);
        int worstLineNumber = lines.isEmpty() ? 1 : lines.size();
        String worstLine = lines.isEmpty() ? "" : lines.get(worstLineNumber - 1);

        Map<String, Object> payload = new HashMap<>();
        payload.put("best_line", Map.of(
                "line_number", bestLineNumber,
                "code", bestLine,
                "reason", "Readable intent in this line."
        ));
        payload.put("worst_line", Map.of(
                "line_number", worstLineNumber,
                "code", worstLine,
                "reason", "This line can be optimized or clarified."
        ));
        payload.put("good_logic_segments", List.of());
        payload.put("suggested_approach", "Break the solution into clear edge-case guards, then optimize inner loops.");
        payload.put("time_complexity", "Not specified");
        payload.put("optimal_complexity", "Problem dependent");
        payload.put("trade_offs", List.of("Readable code may add minor constant overhead."));
        payload.put("chess_rating", "Good");
        payload.put("overall_score", 68);
        return payload;
    }

    private String writeJson(Object value, String fallback) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return value == null ? 0.0 : Double.parseDouble(String.valueOf(value));
        } catch (Exception ignored) {
            return 0.0;
        }
    }

    /**
     * Hint policy tuple with allowance flag, cooldown duration, and per-problem budget.
     */
    private record HintPolicy(boolean allowHints, int cooldownMinutes, int maxHintsPerProblem) {
    }

    /**
     * Generic operation result used by AI endpoints for status-specific payload returns.
     */
    public record AiOperationResult(HttpStatus status, Map<String, Object> payload) {
    }
}
