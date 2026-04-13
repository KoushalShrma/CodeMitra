package com.codemitra.backend.service;

import com.codemitra.backend.config.RoleMapper;
import com.codemitra.backend.dto.TestDtos;
import com.codemitra.backend.model.ProctoringEventEntity;
import com.codemitra.backend.model.TestAttemptEntity;
import com.codemitra.backend.model.TestCaseEntity;
import com.codemitra.backend.model.TestEntity;
import com.codemitra.backend.model.TestQuestionEntity;
import com.codemitra.backend.model.TestReportEntity;
import com.codemitra.backend.model.TestSubmissionEntity;
import com.codemitra.backend.repository.TestAttemptRepository;
import com.codemitra.backend.repository.TestCaseRepository;
import com.codemitra.backend.repository.InstitutionRepository;
import com.codemitra.backend.repository.InstitutionUserRepository;
import com.codemitra.backend.repository.ProctoringEventRepository;
import com.codemitra.backend.repository.TestQuestionRepository;
import com.codemitra.backend.repository.TestReportRepository;
import com.codemitra.backend.repository.TestSubmissionRepository;
import com.codemitra.backend.repository.TestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Handles student-facing test lifecycle operations: discover, start, save, anti-cheat, and submit.
 */
@Service
public class StudentTestService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final TestRepository testRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestCaseRepository testCaseRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final TestSubmissionRepository testSubmissionRepository;
    private final TestReportRepository testReportRepository;
    private final TestReportAnalyticsService testReportAnalyticsService;
    private final InstitutionRepository institutionRepository;
    private final InstitutionUserRepository institutionUserRepository;
    private final ProctoringEventRepository proctoringEventRepository;
    private final AuthService authService;

    public StudentTestService(
            TestRepository testRepository,
            TestQuestionRepository testQuestionRepository,
            TestCaseRepository testCaseRepository,
            TestAttemptRepository testAttemptRepository,
            TestSubmissionRepository testSubmissionRepository,
            TestReportRepository testReportRepository,
            TestReportAnalyticsService testReportAnalyticsService,
            InstitutionRepository institutionRepository,
            InstitutionUserRepository institutionUserRepository,
            ProctoringEventRepository proctoringEventRepository,
            AuthService authService
    ) {
        this.testRepository = testRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.testCaseRepository = testCaseRepository;
        this.testAttemptRepository = testAttemptRepository;
        this.testSubmissionRepository = testSubmissionRepository;
        this.testReportRepository = testReportRepository;
        this.testReportAnalyticsService = testReportAnalyticsService;
        this.institutionRepository = institutionRepository;
        this.institutionUserRepository = institutionUserRepository;
        this.proctoringEventRepository = proctoringEventRepository;
        this.authService = authService;
    }

    /**
     * Returns tests active at current server time.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getActiveTests() {
        LocalDateTime now = LocalDateTime.now();
        List<Map<String, Object>> tests = testRepository
            .findByEndTimeGreaterThanEqualAndPublishedTrueOrderByStartTimeAscIdAsc(now)
                .stream()
                .filter(test -> test.getEndTime() != null && now.isBefore(test.getEndTime()))
                .filter(test -> testQuestionRepository.existsByTestId(test.getId()))
                .map(this::toTestSummary)
                .toList();
        return Map.of("tests", tests);
    }

    /**
     * Starts one attempt while enforcing multi-attempt policy.
     */
    @Transactional
    public Map<String, Object> startTestAttempt(TestDtos.StartAttemptRequest request) {
        if (request == null || request.testId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "testId is required");
        }

        Long userId = resolveAttemptUserId(request.userId());
        TestEntity test = getActivePublishedTestById(request.testId());
        ensureTestHasQuestions(test.getId());
        return createAttempt(test, userId);
    }

    /**
     * Starts one attempt using unique join code.
     */
    @Transactional
    public Map<String, Object> startTestAttemptByCode(TestDtos.JoinByCodeRequest request) {
        if (request == null || request.joinCode() == null || request.joinCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "joinCode is required");
        }

        String code = request.joinCode().trim().toUpperCase(Locale.ROOT);
        TestEntity test = testRepository.findByJoinCodeIgnoreCase(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found for join code"));

        if (Boolean.FALSE.equals(test.getPublished())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found for join code");
        }

        LocalDateTime now = LocalDateTime.now();
        if (test.getStartTime() != null && now.isBefore(test.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This test has not started yet");
        }
        if (test.getEndTime() == null || !now.isBefore(test.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This test is no longer available");
        }

        Long userId = authService.getOrCreateCurrentUser().getId();
        ensureTestHasQuestions(test.getId());
        enforceJoinScope(test, userId);

        TestAttemptEntity ongoingAttempt = resolveReusableOngoingAttempt(test.getId(), userId, now);
        if (ongoingAttempt != null) {
            return Map.of(
                    "attemptId", ongoingAttempt.getId(),
                    "testId", ongoingAttempt.getTestId()
            );
        }

        TestAttemptEntity createdAttempt = createAttemptEntity(test, userId);
        return Map.of(
                "attemptId", createdAttempt.getId(),
                "testId", createdAttempt.getTestId()
        );
    }

    private TestEntity getActivePublishedTestById(Long testId) {
        LocalDateTime now = LocalDateTime.now();
        TestEntity test = testRepository.findById(testId)
                .filter(item -> !Boolean.FALSE.equals(item.getPublished()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Available test not found"));

        if (test.getStartTime() != null && now.isBefore(test.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This test has not started yet");
        }
        if (test.getEndTime() == null || !now.isBefore(test.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This test is no longer available");
        }

        return test;
    }

    private Long resolveAttemptUserId(Long requestedUserId) {
        if (requestedUserId == null) {
            return authService.getOrCreateCurrentUser().getId();
        }
        return authService.resolveUserId(String.valueOf(requestedUserId));
    }

    private Map<String, Object> createAttempt(TestEntity test, Long userId) {
        TestAttemptEntity saved = createAttemptEntity(test, userId);
        return Map.of(
                "message", "Test attempt started",
                "attempt", toAttemptSummary(saved)
        );
    }

    private TestAttemptEntity createAttemptEntity(TestEntity test, Long userId) {
        LocalDateTime now = LocalDateTime.now();

        if (test == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Active test not found");
        }

        if (!Boolean.TRUE.equals(test.getAllowMultipleAttempts())) {
            List<TestAttemptEntity> priorAttempts = testAttemptRepository
                    .findByTestIdAndUserIdOrderByStartTimeDesc(test.getId(), userId);

            boolean hasBlockingAttempt = priorAttempts.stream().anyMatch(existing -> {
                TestAttemptEntity normalized = closeExpiredOngoingAttemptIfNeeded(existing, now);
                if ("ongoing".equalsIgnoreCase(normalized.getStatus())) {
                    return true;
                }

                if (!"completed".equalsIgnoreCase(normalized.getStatus())) {
                    return false;
                }

                return !isPotentialImmediateAutoSubmit(normalized);
            });

            if (hasBlockingAttempt) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Multiple attempts are not allowed for this test");
            }
        }

        Integer configuredDuration = test.getDuration();
        if (configuredDuration == null || configuredDuration <= 0) {
            configuredDuration = test.getDurationMinutes();
        }
        if (configuredDuration == null || configuredDuration <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Test duration is invalid");
        }
        if (test.getEndTime() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Test end time is invalid");
        }

        LocalDateTime tentativeEnd = now.plusMinutes(configuredDuration);
        LocalDateTime finalEnd = tentativeEnd.isAfter(test.getEndTime()) ? test.getEndTime() : tentativeEnd;
        if (!finalEnd.isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This test is no longer available");
        }

        TestAttemptEntity attempt = new TestAttemptEntity();
        attempt.setTestId(test.getId());
        attempt.setUserId(userId);
        attempt.setStartTime(now);
        attempt.setEndTime(finalEnd);
        attempt.setStatus("ongoing");

        return testAttemptRepository.save(attempt);
    }

    private void enforceJoinScope(TestEntity test, Long userId) {
        String scope = test.getAccessScope() == null
                ? "INSTITUTION_MEMBERS"
                : test.getAccessScope().trim().toUpperCase(Locale.ROOT);

        if (!"INSTITUTION_MEMBERS".equals(scope)) {
            return;
        }

        Long institutionId = test.getInstitutionId();
        if (institutionId == null || institutionId <= 0 || !institutionRepository.existsById(institutionId)) {
            return;
        }

        boolean member = institutionUserRepository.existsByUserIdAndInstitutionId(userId, institutionId);
        if (!member) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This test is limited to institution members");
        }
    }

    /**
     * Returns attempt details with questions, cases, and saved code.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAttemptDetails(String attemptIdPath) {
        long attemptId = parseId(attemptIdPath, "Invalid attempt id");

        TestAttemptEntity attempt = testAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));

        enforceStudentOwnership(attempt.getUserId());

        attempt = closeExpiredOngoingAttemptIfNeeded(attempt, LocalDateTime.now());

        TestEntity test = testRepository.findById(attempt.getTestId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found"));

        List<TestQuestionEntity> questions = testQuestionRepository.findByTestIdOrderByIdAsc(test.getId());
        if (questions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Test attempt not available. This test has no questions yet.");
        }
        List<Long> questionIds = questions.stream().map(TestQuestionEntity::getId).toList();
        List<TestCaseEntity> testCases = questionIds.isEmpty()
                ? List.of()
                : testCaseRepository.findByQuestionIdInOrderByIdAsc(questionIds);
        List<TestSubmissionEntity> savedSubmissions = testSubmissionRepository.findByAttemptId(attempt.getId());

        List<Map<String, Object>> questionPayload = new ArrayList<>();
        for (TestQuestionEntity question : questions) {
            List<Map<String, Object>> nestedCases = testCases.stream()
                    .filter(testCase -> testCase.getQuestionId().equals(question.getId()))
                    .map(testCase -> Map.<String, Object>of(
                            "id", testCase.getId(),
                            "questionId", testCase.getQuestionId(),
                            "input", testCase.getInput(),
                            "expectedOutput", testCase.getExpectedOutput()
                    ))
                    .toList();

            TestSubmissionEntity saved = savedSubmissions.stream()
                    .filter(submission -> submission.getQuestionId().equals(question.getId()))
                    .findFirst()
                    .orElse(null);

            Map<String, Object> questionMap = new HashMap<>();
            questionMap.put("id", question.getId());
            questionMap.put("testId", question.getTestId());
            questionMap.put("problemId", question.getProblemId());
            questionMap.put("customQuestion", question.getCustomQuestion());
            questionMap.put("difficulty", question.getDifficulty());
            questionMap.put("topic", question.getTopic());
            questionMap.put("pattern", question.getPattern());
            questionMap.put("testCases", nestedCases);
            questionMap.put("savedSubmission", saved == null ? null : Map.of(
                    "id", saved.getId(),
                    "attemptId", saved.getAttemptId(),
                    "questionId", saved.getQuestionId(),
                    "code", saved.getCode(),
                    "language", saved.getLanguage(),
                    "passed", saved.getPassed(),
                    "total", saved.getTotal()
            ));
            questionPayload.add(questionMap);
        }

        Map<String, Object> attemptPayload = new HashMap<>();
        attemptPayload.putAll(toAttemptSummary(attempt));
        attemptPayload.put("title", test.getTitle());
        attemptPayload.put("description", test.getDescription());
        attemptPayload.put("duration", test.getDuration());
        attemptPayload.put("allowMultipleAttempts", Boolean.TRUE.equals(test.getAllowMultipleAttempts()));
        attemptPayload.put("antiCheatingEnabled", Boolean.TRUE.equals(test.getAntiCheatingEnabled()));
        attemptPayload.put("showResults", Boolean.TRUE.equals(test.getShowResults()));
        attemptPayload.put("questions", questionPayload);

        return Map.of("attempt", attemptPayload);
    }

    /**
     * Upserts code for one attempt/question pair.
     */
    @Transactional
    public Map<String, Object> saveTestSubmission(TestDtos.SaveSubmissionRequest request) {
        if (request.attemptId() == null || request.questionId() == null || request.code() == null
                || request.language() == null || request.language().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "attemptId, questionId, code, and language are required");
        }

        TestAttemptEntity attempt = testAttemptRepository.findById(request.attemptId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));
        enforceStudentOwnership(attempt.getUserId());
        if (!"ongoing".equalsIgnoreCase(attempt.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This attempt is already submitted");
        }

        TestSubmissionEntity submission = testSubmissionRepository.findByAttemptIdAndQuestionId(request.attemptId(), request.questionId())
                .orElseGet(TestSubmissionEntity::new);

        submission.setAttemptId(request.attemptId());
        submission.setQuestionId(request.questionId());
        submission.setCode(request.code());
        submission.setLanguage(request.language());
        submission.setPassed(request.passed() == null ? 0 : request.passed());
        submission.setTotal(request.total() == null ? 0 : request.total());
        testSubmissionRepository.save(submission);

        return Map.of("message", "Answer saved");
    }

    /**
     * Tracks anti-cheat counters on attempt rows.
     */
    @Transactional
    public Map<String, Object> trackAntiCheat(TestDtos.AntiCheatRequest request) {
        if (request.attemptId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "attemptId is required");
        }

        TestAttemptEntity attempt = testAttemptRepository.findById(request.attemptId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));
        enforceStudentOwnership(attempt.getUserId());

        String type = request.type() == null ? "tab_switch" : request.type();
        if ("tab_switch".equals(type)) {
            attempt.setTabSwitchCount(attempt.getTabSwitchCount() + 1);
            attempt.setAntiCheatFlags(attempt.getAntiCheatFlags() + 1);
        } else {
            attempt.setAntiCheatFlags(attempt.getAntiCheatFlags() + 1);
        }

        testAttemptRepository.save(attempt);

        ProctoringEventEntity event = new ProctoringEventEntity();
        event.setTestId(attempt.getTestId());
        event.setAttemptId(attempt.getId());
        event.setUserId(attempt.getUserId());
        event.setEventType(type);
        event.setEventPayload(writeJson(request.eventPayload() == null ? Map.of() : request.eventPayload(), "{}"));
        event.setOccurredAt(LocalDateTime.now());
        proctoringEventRepository.save(event);

        return Map.of("message", "Anti-cheat event tracked");
    }

    /**
     * Finalizes attempt, computes report, and returns result summary.
     */
    @Transactional
    public Map<String, Object> submitTestAttempt(TestDtos.SubmitAttemptRequest request) {
        if (request.attemptId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "attemptId is required");
        }

        TestAttemptEntity attempt = testAttemptRepository.findById(request.attemptId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));
        enforceStudentOwnership(attempt.getUserId());

        String submitMode = normalizeSubmitMode(request.submitMode());
        LocalDateTime now = LocalDateTime.now();

        if ("time_up".equals(submitMode)) {
            if (attempt.getEndTime() == null || now.isBefore(attempt.getEndTime())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Timer is still running");
            }
        }

        if ("fullscreen_exit".equals(submitMode)) {
            long fullscreenExitCount = proctoringEventRepository.findByAttemptIdOrderByOccurredAtAsc(attempt.getId())
                    .stream()
                    .filter(event -> "fullscreen_exit".equalsIgnoreCase(event.getEventType()))
                    .count();

            if (fullscreenExitCount < 2) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Fullscreen exit threshold not reached");
            }
        }

        List<TestQuestionEntity> questions = testQuestionRepository.findByTestIdOrderByIdAsc(attempt.getTestId());
        List<TestSubmissionEntity> submissions = testSubmissionRepository.findByAttemptId(request.attemptId());

        Map<String, Object> attemptMap = new HashMap<>();
        attemptMap.put("id", attempt.getId());
        attemptMap.put("testId", attempt.getTestId());
        attemptMap.put("userId", attempt.getUserId());
        attemptMap.put("startTime", attempt.getStartTime());
        attemptMap.put("endTime", attempt.getEndTime());
        attemptMap.put("status", attempt.getStatus());

        List<Map<String, Object>> submissionMaps = submissions.stream().map(item -> Map.<String, Object>of(
                "questionId", item.getQuestionId(),
                "code", item.getCode(),
                "passed", item.getPassed(),
                "total", item.getTotal()
        )).toList();

        Map<String, Object> report = testReportAnalyticsService.buildStudentReport(attemptMap, submissionMaps, questions);

        attempt.setStatus("completed");
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setTotalScore(toInt(report.get("score")));
        testAttemptRepository.save(attempt);

        TestReportEntity reportEntity = testReportRepository.findByAttemptId(attempt.getId())
                .orElseGet(TestReportEntity::new);
        reportEntity.setAttemptId(attempt.getId());
        reportEntity.setUserId(attempt.getUserId());
        reportEntity.setTestId(attempt.getTestId());
        reportEntity.setAccuracy(BigDecimal.valueOf(toDouble(report.get("accuracy"))));
        reportEntity.setScore(toInt(report.get("score")));
        reportEntity.setGreatMoves(toInt(report.get("greatMoves")));
        reportEntity.setMistakes(toInt(report.get("mistakes")));
        reportEntity.setBlunders(toInt(report.get("blunders")));
        reportEntity.setTimeTaken(toInt(report.get("timeTaken")));
        testReportRepository.save(reportEntity);

        int totalQuestions = toInt(report.get("totalQuestions"));
        int solved = toInt(report.get("solved"));

        return Map.of(
                "result", Map.of(
                        "totalQuestions", totalQuestions,
                        "solved", solved,
                        "accuracy", toDouble(report.get("accuracy")),
                        "score", toInt(report.get("score")),
                        "status", solved == totalQuestions && totalQuestions > 0 ? "pass" : "fail"
                ),
                "report", report
        );
    }

    private void enforceStudentOwnership(Long ownerUserId) {
        String role = RoleMapper.normalize(authService.currentPrincipal().role());
        if (RoleMapper.isInstitutionLevel(role)) {
            return;
        }
        Long currentUserId = authService.getOrCreateCurrentUser().getId();
        if (!ownerUserId.equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
    }

    private Map<String, Object> toAttemptSummary(TestAttemptEntity attempt) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", attempt.getId());
        payload.put("testId", attempt.getTestId());
        payload.put("userId", attempt.getUserId());
        payload.put("startTime", attempt.getStartTime());
        payload.put("endTime", attempt.getEndTime());
        payload.put("status", attempt.getStatus());
        payload.put("tabSwitchCount", attempt.getTabSwitchCount());
        payload.put("antiCheatFlags", attempt.getAntiCheatFlags());
        payload.put("submittedAt", attempt.getSubmittedAt());
        payload.put("totalScore", attempt.getTotalScore());
        payload.put("remainingSeconds", computeRemainingSeconds(attempt));
        return payload;
    }

    private int computeRemainingSeconds(TestAttemptEntity attempt) {
        if (attempt == null || !"ongoing".equalsIgnoreCase(attempt.getStatus())) {
            return 0;
        }

        LocalDateTime endTime = attempt.getEndTime();
        if (endTime == null) {
            return 0;
        }

        long millisRemaining = Duration.between(LocalDateTime.now(), endTime).toMillis();
        if (millisRemaining <= 0) {
            return 0;
        }

        return (int) Math.ceil(millisRemaining / 1000.0);
    }

    private Map<String, Object> toTestSummary(TestEntity test) {
        LocalDateTime now = LocalDateTime.now();
        boolean started = test.getStartTime() == null || !now.isBefore(test.getStartTime());
        boolean ended = test.getEndTime() == null || !now.isBefore(test.getEndTime());

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", test.getId());
        payload.put("instituteId", test.getInstituteId());
        payload.put("institutionId", test.getInstitutionId());
        payload.put("title", test.getTitle());
        payload.put("description", test.getDescription() == null ? "" : test.getDescription());
        payload.put("duration", test.getDuration());
        payload.put("startTime", test.getStartTime());
        payload.put("endTime", test.getEndTime());
        payload.put("accessScope", test.getAccessScope() == null ? "INSTITUTION_MEMBERS" : test.getAccessScope());
        payload.put("joinCode", test.getJoinCode() == null ? "" : test.getJoinCode());
        payload.put("published", !Boolean.FALSE.equals(test.getPublished()));
        payload.put("allowMultipleAttempts", Boolean.TRUE.equals(test.getAllowMultipleAttempts()));
        payload.put("antiCheatingEnabled", Boolean.TRUE.equals(test.getAntiCheatingEnabled()));
        payload.put("showResults", Boolean.TRUE.equals(test.getShowResults()));
        payload.put("canJoinNow", started && !ended);
        payload.put("createdAt", test.getCreatedAt());
        return payload;
    }

    private long parseId(String value, String message) {
        try {
            return Long.parseLong(value);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private void ensureTestHasQuestions(Long testId) {
        if (!testQuestionRepository.existsByTestId(testId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Test attempt not available. This test has no questions yet.");
        }
    }

    private int toInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        return 0;
    }

    private TestAttemptEntity resolveReusableOngoingAttempt(Long testId, Long userId, LocalDateTime now) {
        TestAttemptEntity attempt = testAttemptRepository
                .findFirstByTestIdAndUserIdAndStatusOrderByStartTimeDesc(testId, userId, "ongoing")
                .orElse(null);

        if (attempt == null) {
            return null;
        }

        return closeExpiredOngoingAttemptIfNeeded(attempt, now);
    }

    private TestAttemptEntity closeExpiredOngoingAttemptIfNeeded(TestAttemptEntity attempt, LocalDateTime now) {
        if (attempt == null || !"ongoing".equalsIgnoreCase(attempt.getStatus())) {
            return attempt;
        }

        LocalDateTime endTime = attempt.getEndTime();
        if (endTime == null || now.isBefore(endTime)) {
            return attempt;
        }

        attempt.setStatus("completed");
        if (attempt.getSubmittedAt() == null) {
            attempt.setSubmittedAt(endTime);
        }
        return testAttemptRepository.save(attempt);
    }

    private boolean isPotentialImmediateAutoSubmit(TestAttemptEntity attempt) {
        if (attempt == null || !"completed".equalsIgnoreCase(attempt.getStatus())) {
            return false;
        }

        LocalDateTime startedAt = attempt.getStartTime();
        LocalDateTime submittedAt = attempt.getSubmittedAt();
        if (startedAt == null || submittedAt == null) {
            return false;
        }

        Integer score = attempt.getTotalScore();
        boolean zeroScore = score == null || score <= 0;
        boolean immediateSubmit = !submittedAt.isAfter(startedAt.plusSeconds(2));

        return immediateSubmit && zeroScore;
    }

    private double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return 0.0;
    }

    private String writeJson(Object value, String fallback) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private String normalizeSubmitMode(String submitMode) {
        if (submitMode == null || submitMode.isBlank()) {
            return "manual";
        }

        String normalized = submitMode.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "manual", "time_up", "fullscreen_exit" -> normalized;
            default -> "manual";
        };
    }
}
