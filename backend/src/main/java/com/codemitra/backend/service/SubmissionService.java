package com.codemitra.backend.service;

import com.codemitra.backend.dto.PracticeDtos;
import com.codemitra.backend.model.PracticeRunEntity;
import com.codemitra.backend.model.ProblemProgressEntity;
import com.codemitra.backend.model.ProblemSubmissionEntity;
import com.codemitra.backend.repository.PracticeRunRepository;
import com.codemitra.backend.repository.ProblemProgressRepository;
import com.codemitra.backend.repository.ProblemSubmissionRepository;
import com.codemitra.backend.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Handles run tracking, run history retrieval, and final accepted practice submissions.
 */
@Service
public class SubmissionService {

    private final PracticeRunRepository practiceRunRepository;
    private final ProblemProgressRepository problemProgressRepository;
    private final ProblemSubmissionRepository problemSubmissionRepository;
    private final UserRepository userRepository;
    private final SubmissionAnalyticsService submissionAnalyticsService;
    private final AnalyticsEngineService analyticsEngineService;
    private final AiHintService aiHintService;
    private final AuthService authService;

    public SubmissionService(
            PracticeRunRepository practiceRunRepository,
            ProblemProgressRepository problemProgressRepository,
            ProblemSubmissionRepository problemSubmissionRepository,
            UserRepository userRepository,
            SubmissionAnalyticsService submissionAnalyticsService,
            AnalyticsEngineService analyticsEngineService,
                AiHintService aiHintService,
            AuthService authService
    ) {
        this.practiceRunRepository = practiceRunRepository;
        this.problemProgressRepository = problemProgressRepository;
        this.problemSubmissionRepository = problemSubmissionRepository;
        this.userRepository = userRepository;
        this.submissionAnalyticsService = submissionAnalyticsService;
        this.analyticsEngineService = analyticsEngineService;
        this.aiHintService = aiHintService;
        this.authService = authService;
    }

    /**
     * Persists one practice run and keeps problem progress in sync.
     */
    @Transactional
    public Map<String, Object> trackRun(PracticeDtos.TrackRunRequest request) {
        if (request.problemId() == null || request.problemId().isBlank()
                || request.language() == null || request.language().isBlank()
                || request.code() == null
                || request.passed() == null
                || request.total() == null
                || request.status() == null || request.status().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "userId, problemId, language, code, passed, total, and status are required");
        }

        Long userId = request.userId() == null
                ? authService.getOrCreateCurrentUser().getId()
                : authService.resolveUserId(String.valueOf(request.userId()));

        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        PracticeRunEntity run = new PracticeRunEntity();
        run.setUserId(userId);
        run.setProblemId(request.problemId());
        run.setLanguage(request.language());
        run.setCode(request.code());
        run.setPassed(request.passed());
        run.setTotal(request.total());
        run.setStatus(request.status());
        run.setErrorMessage(blankToNull(request.error()));
        run.setTimeTakenSeconds(safe(request.timeTakenSeconds()));
        run.setHintsUsed(safe(request.hintsUsed()));
        practiceRunRepository.save(run);

        analyticsEngineService.trackRunEvent(
            userId,
            request.problemId(),
            request.language(),
            request.status(),
            request.error(),
            null
        );

        upsertProblemProgress(userId, request.problemId(), "attempted", null);

        return Map.of("message", "Run tracked");
    }

    /**
     * Returns chronological run history for a user/problem pair.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getRunHistory(String userIdOrMe, String problemId) {
        if (problemId == null || problemId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId and problemId are required");
        }
        Long userId = authService.resolveUserId(userIdOrMe);

        List<PracticeRunEntity> runs = practiceRunRepository.findByUserIdAndProblemIdOrderByCreatedAtAscIdAsc(userId, problemId);
        List<Map<String, Object>> payload = runs.stream().map(run -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", run.getId());
            row.put("userId", run.getUserId());
            row.put("problemId", run.getProblemId());
            row.put("language", run.getLanguage());
            row.put("code", run.getCode());
            row.put("passed", run.getPassed());
            row.put("total", run.getTotal());
            row.put("status", run.getStatus());
            row.put("error", run.getErrorMessage());
            row.put("timeTakenSeconds", run.getTimeTakenSeconds());
            row.put("hintsUsed", run.getHintsUsed());
            row.put("timestamp", run.getCreatedAt());
            return row;
        }).toList();

        return Map.of("runs", payload);
    }

    /**
     * Finalizes a fully passing submission and returns leaderboard-style report metadata.
     */
    @Transactional
    public Map<String, Object> submitSolution(PracticeDtos.SubmitSolutionRequest request) {
        if (request.problemId() == null || request.problemId().isBlank()
                || request.language() == null || request.language().isBlank()
                || request.finalCode() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "userId, problemId, language, and finalCode are required");
        }

        if (request.passed() == null || request.total() == null || !request.passed().equals(request.total())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only fully passing solutions can be submitted");
        }

        Long userId = request.userId() == null
                ? authService.getOrCreateCurrentUser().getId()
                : authService.resolveUserId(String.valueOf(request.userId()));

        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        List<PracticeRunEntity> runs = practiceRunRepository.findByUserIdAndProblemIdOrderByCreatedAtAscIdAsc(userId, request.problemId());
        if (runs.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No tracked runs found for this problem");
        }

        ProblemSubmissionEntity existing = problemSubmissionRepository
                .findByUserIdAndProblemId(userId, request.problemId())
                .orElse(null);

        Map<String, Object> metrics;
        LocalDateTime submittedAt;
        if (existing != null) {
            metrics = new HashMap<>();
            metrics.put("totalAttempts", safe(existing.getTotalAttempts()));
            metrics.put("greatMoves", safe(existing.getGreatMoves()));
            metrics.put("mistakes", safe(existing.getMistakes()));
            metrics.put("blunders", safe(existing.getBlunders()));
            metrics.put("totalPassed", safe(existing.getTotalPassed()));
            metrics.put("totalTestCases", safe(existing.getTotalTestCases()));
            metrics.put("accuracy", existing.getAccuracy() == null ? 0.0 : existing.getAccuracy().doubleValue());
            metrics.put("totalTimeTakenSeconds", safe(existing.getTotalTimeTakenSeconds()));
            metrics.put("totalHintsUsed", safe(existing.getTotalHintsUsed()));
            metrics.put("errors", new ArrayList<String>());
            submittedAt = existing.getSubmittedAt() == null ? LocalDateTime.now() : existing.getSubmittedAt();
        } else {
            metrics = submissionAnalyticsService.buildSubmissionMetrics(runs);
            submittedAt = LocalDateTime.now();
        }

        Map<String, Object> report = submissionAnalyticsService.buildSubmissionReport(request.problemId(), metrics, submittedAt);

        if (existing != null) {
            existing.setFinalCode(request.finalCode());
            existing.setCompleted(true);
            problemSubmissionRepository.save(existing);
        } else {
            ProblemSubmissionEntity created = new ProblemSubmissionEntity();
            created.setUserId(userId);
            created.setProblemId(request.problemId());
            created.setFinalCode(request.finalCode());
            created.setTotalAttempts(toInt(metrics.get("totalAttempts")));
            created.setGreatMoves(toInt(metrics.get("greatMoves")));
            created.setMistakes(toInt(metrics.get("mistakes")));
            created.setBlunders(toInt(metrics.get("blunders")));
            created.setTotalPassed(toInt(metrics.get("totalPassed")));
            created.setTotalTestCases(toInt(metrics.get("totalTestCases")));
            created.setAccuracy(BigDecimal.valueOf(toDouble(metrics.get("accuracy"))));
            created.setTotalTimeTakenSeconds(toInt(metrics.get("totalTimeTakenSeconds")));
            created.setTotalHintsUsed(toInt(metrics.get("totalHintsUsed")));
            created.setCompleted(true);
            problemSubmissionRepository.save(created);
        }

        upsertProblemProgress(userId, request.problemId(), "completed", submittedAt);

        analyticsEngineService.trackSubmitEvent(
            userId,
            request.problemId(),
            request.language(),
            "AC",
            request.finalCode(),
            existing != null ? existing.getGroqReview() : null,
            request.topicTags(),
            null
        );

        Map<String, Object> codeReview = aiHintService.generatePostAcReview(
            userId,
            request.problemId(),
            request.problemStatement(),
            request.finalCode(),
            request.language(),
            request.timeComplexityClaimed()
        );

        String celebrationMessage = existing != null
                ? "Encore complete. This problem is already in your victory vault, and your progress score stays protected."
                : "Brilliant work. You cleared every test case and unlocked a fresh milestone on your CodeMitra journey.";

        return Map.of(
                "message", celebrationMessage,
                "alreadyCompleted", existing != null,
                "redirectTo", "/progress",
            "report", report,
            "codeReview", codeReview
        );
    }

    private void upsertProblemProgress(Long userId, String problemId, String status, LocalDateTime completedAt) {
        ProblemProgressEntity progress = problemProgressRepository
                .findByUserIdAndProblemId(userId, problemId)
                .orElseGet(ProblemProgressEntity::new);

        progress.setUserId(userId);
        progress.setProblemId(problemId);
        if (!"completed".equalsIgnoreCase(progress.getStatus())) {
            progress.setStatus(status);
        }
        progress.setLastRunAt(LocalDateTime.now());
        if (progress.getCompletedAt() == null && completedAt != null) {
            progress.setCompletedAt(completedAt);
        }
        problemProgressRepository.save(progress);
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private int toInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return 0;
    }

    private double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return 0.0;
    }
}
