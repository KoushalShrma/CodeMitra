package com.codemitra.backend.service;

import com.codemitra.backend.config.RoleMapper;
import com.codemitra.backend.config.InstitutionAuthenticatedUser;
import com.codemitra.backend.config.InstitutionSecurityUtils;
import com.codemitra.backend.config.AuthenticatedUser;
import com.codemitra.backend.dto.InstitutionDtos;
import com.codemitra.backend.dto.TestDtos;
import com.codemitra.backend.model.CustomProblemEntity;
import com.codemitra.backend.model.CustomTestCaseEntity;
import com.codemitra.backend.model.InstituteEntity;
import com.codemitra.backend.model.InstitutionEntity;
import com.codemitra.backend.model.InstitutionUserEntity;
import com.codemitra.backend.model.ProctoringEventEntity;
import com.codemitra.backend.model.TestCaseEntity;
import com.codemitra.backend.model.UserEntity;
import com.codemitra.backend.model.TestAttemptEntity;
import com.codemitra.backend.model.TestEntity;
import com.codemitra.backend.model.TestProblemEntity;
import com.codemitra.backend.model.TestQuestionEntity;
import com.codemitra.backend.model.TestReportEntity;
import com.codemitra.backend.model.TestSubmissionEntity;
import com.codemitra.backend.repository.CustomProblemRepository;
import com.codemitra.backend.repository.CustomTestCaseRepository;
import com.codemitra.backend.repository.InstituteRepository;
import com.codemitra.backend.repository.InstitutionRepository;
import com.codemitra.backend.repository.InstitutionUserRepository;
import com.codemitra.backend.repository.ProblemAttemptRepository;
import com.codemitra.backend.repository.ProctoringEventRepository;
import com.codemitra.backend.repository.TestAttemptRepository;
import com.codemitra.backend.repository.TestCaseRepository;
import com.codemitra.backend.repository.TestProblemRepository;
import com.codemitra.backend.repository.TestQuestionRepository;
import com.codemitra.backend.repository.TestReportRepository;
import com.codemitra.backend.repository.TestRepository;
import com.codemitra.backend.repository.TestSubmissionRepository;
import com.codemitra.backend.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Implements institution administration, test management, result analytics, and candidate test-taking flows.
 */
@Service
public class InstitutionService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AuthService authService;
    private final UserRepository userRepository;
    private final InstitutionRepository institutionRepository;
    private final InstitutionUserRepository institutionUserRepository;
    private final InstituteRepository instituteRepository;
    private final PasswordEncoder passwordEncoder;
    private final TestRepository testRepository;
    private final TestProblemRepository testProblemRepository;
    private final CustomProblemRepository customProblemRepository;
    private final CustomTestCaseRepository customTestCaseRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final TestSubmissionRepository testSubmissionRepository;
    private final TestReportRepository testReportRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestCaseRepository testCaseRepository;
    private final ProctoringEventRepository proctoringEventRepository;
    private final ProblemAttemptRepository problemAttemptRepository;
    private final TestReportAnalyticsService testReportAnalyticsService;
    private final StudentTestService studentTestService;
    private final InstitutionSecurityUtils institutionSecurityUtils;

    public InstitutionService(
            AuthService authService,
            UserRepository userRepository,
            InstitutionRepository institutionRepository,
            InstitutionUserRepository institutionUserRepository,
            InstituteRepository instituteRepository,
            PasswordEncoder passwordEncoder,
            TestRepository testRepository,
            TestProblemRepository testProblemRepository,
            CustomProblemRepository customProblemRepository,
            CustomTestCaseRepository customTestCaseRepository,
            TestAttemptRepository testAttemptRepository,
            TestSubmissionRepository testSubmissionRepository,
            TestReportRepository testReportRepository,
            TestQuestionRepository testQuestionRepository,
            TestCaseRepository testCaseRepository,
            ProctoringEventRepository proctoringEventRepository,
            ProblemAttemptRepository problemAttemptRepository,
                TestReportAnalyticsService testReportAnalyticsService,
            StudentTestService studentTestService,
            InstitutionSecurityUtils institutionSecurityUtils
    ) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.institutionRepository = institutionRepository;
        this.institutionUserRepository = institutionUserRepository;
        this.instituteRepository = instituteRepository;
        this.passwordEncoder = passwordEncoder;
        this.testRepository = testRepository;
        this.testProblemRepository = testProblemRepository;
        this.customProblemRepository = customProblemRepository;
        this.customTestCaseRepository = customTestCaseRepository;
        this.testAttemptRepository = testAttemptRepository;
        this.testSubmissionRepository = testSubmissionRepository;
        this.testReportRepository = testReportRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.testCaseRepository = testCaseRepository;
        this.proctoringEventRepository = proctoringEventRepository;
        this.problemAttemptRepository = problemAttemptRepository;
        this.testReportAnalyticsService = testReportAnalyticsService;
        this.studentTestService = studentTestService;
        this.institutionSecurityUtils = institutionSecurityUtils;
    }

    /**
     * Creates an institution and auto-assigns the requester as institution admin.
     */
    @Transactional
    public Map<String, Object> createInstitution(InstitutionDtos.CreateInstitutionRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()
                || request.type() == null || request.type().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name and type are required");
        }

        Long userId = authService.getOrCreateCurrentUser().getId();
        userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        InstitutionEntity institution = new InstitutionEntity();
        institution.setName(request.name().trim());
        institution.setType(request.type().trim().toUpperCase());
        institution.setCode(generateUniqueInstitutionCode(request.name()));
        institution.setLogoUrl(request.logoUrl() == null || request.logoUrl().isBlank() ? null : request.logoUrl().trim());
        institution.setSubscriptionTier(request.subscriptionTier() == null || request.subscriptionTier().isBlank()
                ? "FREE"
                : request.subscriptionTier().trim().toUpperCase());
        institution.setStatus("ACTIVE");

        InstitutionEntity saved = institutionRepository.save(institution);
        InstituteEntity legacy = createLegacyInstituteMirror(saved);
        saved.setLegacyInstituteId(legacy.getId());
        saved = institutionRepository.save(saved);

        InstitutionUserEntity membership = new InstitutionUserEntity();
        membership.setUserId(userId);
        membership.setInstitutionId(saved.getId());
        membership.setRole("INSTITUTION_ADMIN");
        institutionUserRepository.save(membership);

        return Map.of(
                "message", "Institution created",
                "institution", toInstitutionSummary(saved),
                "membership", Map.of(
                        "userId", userId,
                        "role", "INSTITUTION_ADMIN"
                )
        );
    }

    /**
     * Returns institution profile and member counts.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getInstitution(Long institutionId) {
        InstitutionEntity institution = getInstitutionOrThrow(institutionId);
        requireInstitutionViewer(institutionId);

        List<InstitutionUserEntity> members = institutionUserRepository.findByInstitutionId(institutionId);
        Map<String, Long> roleCounts = new HashMap<>();
        for (InstitutionUserEntity member : members) {
            String role = RoleMapper.normalize(member.getRole());
            roleCounts.put(role, roleCounts.getOrDefault(role, 0L) + 1L);
        }

        return Map.of(
                "institution", toInstitutionSummary(institution),
                "memberCount", members.size(),
                "roleCounts", roleCounts
        );
    }

    /**
     * Creates an institution test with hint policy and ordered problem mapping.
     */
    @Transactional
    public Map<String, Object> createInstitutionTest(Long institutionId, InstitutionDtos.UpsertInstitutionTestRequest request) {
        InstitutionEntity institution = getInstitutionOrThrow(institutionId);
        requireInstitutionAdmin(institutionId);

        if (request == null || request.title() == null || request.title().isBlank()
                || request.startTime() == null || request.endTime() == null
                || request.durationMinutes() == null || request.durationMinutes() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "title, startTime, endTime, and durationMinutes are required");
        }
        validateTestWindow(request.startTime(), request.endTime());

        validateQuestionItems(request.questions());
        List<InstitutionDtos.TestProblemItem> problemItems = resolveProblemItems(request.problems(), request.questions());

        institution = ensureLegacyInstituteMirror(institution);

        Long currentUserId = resolveActorUserId(institutionId);

        TestEntity test = new TestEntity();
        test.setInstituteId(institution.getLegacyInstituteId());
        test.setInstitutionId(institution.getId());
        test.setTitle(request.title().trim());
        test.setDescription(blankToNull(request.description()));
        test.setStartTime(request.startTime());
        test.setEndTime(request.endTime());
        test.setDuration(request.durationMinutes());
        test.setDurationMinutes(request.durationMinutes());
        test.setAllowAiHints(Boolean.TRUE.equals(request.allowAiHints()));
        test.setAiHintCooldownMinutes(request.aiHintCooldownMinutes() == null ? 10 : Math.max(request.aiHintCooldownMinutes(), 1));
        test.setMaxHintsPerProblem(request.maxHintsPerProblem() == null ? 3 : Math.max(request.maxHintsPerProblem(), 1));
        test.setIsProctored(Boolean.TRUE.equals(request.isProctored()));
        test.setJoinCode(resolveJoinCode(request.joinCode()));
        test.setAccessScope(request.accessScope() == null || request.accessScope().isBlank()
            ? "INSTITUTION_MEMBERS"
            : request.accessScope().trim().toUpperCase(Locale.ROOT));
        test.setPublished(request.published() == null ? Boolean.TRUE : request.published());
        test.setCreatedBy(currentUserId);
        test.setAllowMultipleAttempts(false);
        test.setAntiCheatingEnabled(Boolean.TRUE.equals(request.isProctored()));
        test.setShowResults(false);

        TestEntity saved = testRepository.save(test);
        persistTestProblems(saved.getId(), problemItems);
        persistTestQuestions(saved.getId(), request.questions());

        return Map.of(
                "message", "Test created",
                "test", toInstitutionTestSummary(saved)
        );
    }

    /**
     * Lists all tests for one institution.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getInstitutionTests(Long institutionId) {
        InstitutionEntity institution = getInstitutionOrThrow(institutionId);
        requireInstitutionViewer(institutionId);

        List<TestEntity> tests = new ArrayList<>(testRepository.findByInstitutionIdOrderByCreatedAtDescIdDesc(institutionId));
        if (institution.getLegacyInstituteId() != null) {
            tests.addAll(testRepository.findByInstituteIdOrderByCreatedAtDescIdDesc(institution.getLegacyInstituteId()));
        }

        List<Map<String, Object>> deduplicated = tests.stream()
                .collect(HashMap<Long, Map<String, Object>>::new,
                        (map, test) -> map.put(test.getId(), toInstitutionTestSummary(test)),
                        HashMap::putAll)
                .values()
                .stream()
                .sorted((left, right) -> Long.compare(
                        ((Number) right.get("id")).longValue(),
                        ((Number) left.get("id")).longValue()))
                .toList();

        return Map.of("tests", deduplicated);
    }

    /**
     * Returns one institution test with ordered problem assignment.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getInstitutionTest(Long institutionId, Long testId) {
        requireInstitutionViewer(institutionId);
        TestEntity test = getInstitutionTestOrThrow(institutionId, testId);

        List<Map<String, Object>> problems = testProblemRepository.findByTestIdOrderByOrderIndexAsc(testId)
                .stream()
                .map(item -> Map.<String, Object>of(
                        "problemId", item.getProblemId(),
                        "orderIndex", item.getOrderIndex(),
                        "marks", item.getMarks()
                ))
                .toList();

            List<TestQuestionEntity> questionEntities = testQuestionRepository.findByTestIdOrderByIdAsc(testId);
            List<Long> questionIds = questionEntities.stream().map(TestQuestionEntity::getId).toList();
            List<TestCaseEntity> questionTestCases = questionIds.isEmpty()
                ? List.of()
                : testCaseRepository.findByQuestionIdInOrderByIdAsc(questionIds);

            List<Map<String, Object>> questions = questionEntities.stream()
                .map(question -> {
                    List<Map<String, Object>> nestedCases = questionTestCases.stream()
                        .filter(testCase -> testCase.getQuestionId().equals(question.getId()))
                        .map(testCase -> Map.<String, Object>of(
                            "id", testCase.getId(),
                            "input", testCase.getInput(),
                            "expectedOutput", testCase.getExpectedOutput()
                        ))
                        .toList();

                    Map<String, Object> payload = new LinkedHashMap<>();
                    payload.put("id", question.getId());
                    payload.put("problemId", question.getProblemId());
                    payload.put("customQuestion", question.getCustomQuestion());
                    payload.put("difficulty", question.getDifficulty());
                    payload.put("topic", question.getTopic());
                    payload.put("pattern", question.getPattern());
                    payload.put("testCases", nestedCases);
                    return payload;
                })
                .toList();

        Map<String, Object> payload = new HashMap<>(toInstitutionTestSummary(test));
        payload.put("problems", problems);
            payload.put("questions", questions);
        return Map.of("test", payload);
    }

    /**
     * Updates mutable test settings and assigned problems.
     */
    @Transactional
    public Map<String, Object> updateInstitutionTest(
            Long institutionId,
            Long testId,
            InstitutionDtos.UpsertInstitutionTestRequest request
    ) {
        requireInstitutionAdmin(institutionId);
        TestEntity test = getInstitutionTestOrThrow(institutionId, testId);

        if (request.title() != null && !request.title().isBlank()) {
            test.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            test.setDescription(blankToNull(request.description()));
        }
        if (request.startTime() != null) {
            test.setStartTime(request.startTime());
        }
        if (request.endTime() != null) {
            test.setEndTime(request.endTime());
        }
        if (request.durationMinutes() != null && request.durationMinutes() > 0) {
            test.setDuration(request.durationMinutes());
            test.setDurationMinutes(request.durationMinutes());
        }
        if (request.allowAiHints() != null) {
            test.setAllowAiHints(request.allowAiHints());
        }
        if (request.aiHintCooldownMinutes() != null && request.aiHintCooldownMinutes() > 0) {
            test.setAiHintCooldownMinutes(request.aiHintCooldownMinutes());
        }
        if (request.maxHintsPerProblem() != null && request.maxHintsPerProblem() > 0) {
            test.setMaxHintsPerProblem(request.maxHintsPerProblem());
        }
        if (request.isProctored() != null) {
            test.setIsProctored(request.isProctored());
            test.setAntiCheatingEnabled(request.isProctored());
        }
        if (request.joinCode() != null) {
            String requestedJoinCode = request.joinCode().trim().toUpperCase(Locale.ROOT);
            if (requestedJoinCode.isBlank()) {
                test.setJoinCode(resolveJoinCode(null));
            } else {
                String currentJoinCode = test.getJoinCode() == null ? "" : test.getJoinCode();
                if (!requestedJoinCode.equalsIgnoreCase(currentJoinCode)
                        && testRepository.existsByJoinCodeIgnoreCase(requestedJoinCode)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Join code already exists");
                }
                test.setJoinCode(requestedJoinCode);
            }
        }
        if (request.accessScope() != null && !request.accessScope().isBlank()) {
            test.setAccessScope(request.accessScope().trim().toUpperCase(Locale.ROOT));
        }
        if (request.published() != null) {
            test.setPublished(request.published());
        }

        validateTestWindow(test.getStartTime(), test.getEndTime());

        TestEntity saved = testRepository.save(test);

        boolean shouldReplaceAssignments = request.problems() != null || request.questions() != null;
        if (shouldReplaceAssignments) {
            validateQuestionItems(request.questions());
            List<InstitutionDtos.TestProblemItem> problemItems = resolveProblemItems(request.problems(), request.questions());
            testProblemRepository.deleteByTestId(saved.getId());
            persistTestProblems(saved.getId(), problemItems);
            replaceTestQuestions(saved.getId(), request.questions());
        }

        return Map.of(
                "message", "Test updated",
                "test", toInstitutionTestSummary(saved)
        );
    }

    /**
     * Creates one custom institution problem with hidden/sample test cases.
     */
    @Transactional
    public Map<String, Object> createInstitutionProblem(
            Long institutionId,
            InstitutionDtos.CreateCustomProblemRequest request
    ) {
        requireInstitutionAdmin(institutionId);
        getInstitutionOrThrow(institutionId);

        if (request == null || request.title() == null || request.title().isBlank()
                || request.description() == null || request.description().isBlank()
                || request.difficulty() == null || request.difficulty().isBlank()
                || request.topicTags() == null || request.topicTags().isEmpty()
                || request.timeLimitMs() == null || request.timeLimitMs() <= 0
                || request.memoryLimitMb() == null || request.memoryLimitMb() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "title, description, difficulty, topicTags, timeLimitMs, and memoryLimitMb are required");
        }

        Long currentUserId = authService.getOrCreateCurrentUser().getId();

        CustomProblemEntity problem = new CustomProblemEntity();
        problem.setInstitutionId(institutionId);
        problem.setTitle(request.title().trim());
        problem.setDescription(request.description().trim());
        problem.setDifficulty(request.difficulty().trim());
        problem.setTopicTags(writeJson(request.topicTags(), "[]"));
        problem.setTimeLimitMs(request.timeLimitMs());
        problem.setMemoryLimitMb(request.memoryLimitMb());
        problem.setIsPublic(Boolean.TRUE.equals(request.isPublic()));
        problem.setCreatedBy(currentUserId);
        CustomProblemEntity savedProblem = customProblemRepository.save(problem);

        List<Map<String, Object>> savedCases = new ArrayList<>();
        if (request.testCases() != null) {
            for (InstitutionDtos.CustomTestCaseItem item : request.testCases()) {
                if (item.input() == null || item.expectedOutput() == null) {
                    continue;
                }
                CustomTestCaseEntity testCase = new CustomTestCaseEntity();
                testCase.setProblemId(savedProblem.getId());
                testCase.setInput(item.input());
                testCase.setExpectedOutput(item.expectedOutput());
                testCase.setIsSample(Boolean.TRUE.equals(item.isSample()));
                testCase.setIsHidden(item.isHidden() == null ? !Boolean.TRUE.equals(item.isSample()) : item.isHidden());
                CustomTestCaseEntity savedCase = customTestCaseRepository.save(testCase);
                savedCases.add(Map.of(
                        "id", savedCase.getId(),
                        "isSample", savedCase.getIsSample(),
                        "isHidden", savedCase.getIsHidden()
                ));
            }
        }

        return Map.of(
                "message", "Custom problem created",
                "problem", Map.of(
                        "id", savedProblem.getId(),
                        "title", savedProblem.getTitle(),
                        "difficulty", savedProblem.getDifficulty(),
                        "topicTags", request.topicTags(),
                        "timeLimitMs", savedProblem.getTimeLimitMs(),
                        "memoryLimitMb", savedProblem.getMemoryLimitMb(),
                        "isPublic", savedProblem.getIsPublic(),
                        "testCases", savedCases
                )
        );
    }

    /**
     * Lists all custom problems for one institution.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getInstitutionProblems(Long institutionId) {
        requireInstitutionViewer(institutionId);
        getInstitutionOrThrow(institutionId);

        List<Map<String, Object>> problems = customProblemRepository.findByInstitutionIdOrderByUpdatedAtDescIdDesc(institutionId)
                .stream()
                .map(problem -> {
                    List<Map<String, Object>> testCases = customTestCaseRepository.findByProblemIdOrderByIdAsc(problem.getId())
                            .stream()
                            .map(item -> Map.<String, Object>of(
                                    "id", item.getId(),
                                    "isSample", item.getIsSample(),
                                    "isHidden", item.getIsHidden(),
                                    "input", item.getInput(),
                                    "expectedOutput", item.getExpectedOutput()
                            ))
                            .toList();

                        Map<String, Object> problemPayload = new LinkedHashMap<>();
                        problemPayload.put("id", problem.getId());
                        problemPayload.put("title", problem.getTitle());
                        problemPayload.put("description", problem.getDescription());
                        problemPayload.put("difficulty", problem.getDifficulty());
                        problemPayload.put("topicTags", parseJsonList(problem.getTopicTags()));
                        problemPayload.put("timeLimitMs", problem.getTimeLimitMs());
                        problemPayload.put("memoryLimitMb", problem.getMemoryLimitMb());
                        problemPayload.put("isPublic", problem.getIsPublic());
                        problemPayload.put("createdBy", problem.getCreatedBy());
                        problemPayload.put("testCases", testCases);
                        problemPayload.put("updatedAt", problem.getUpdatedAt());
                        return problemPayload;
                })
                .toList();

        return Map.of("problems", problems);
    }

    /**
     * Returns test results including ranking, score distribution, hardest problems, hint usage, and plagiarism flags.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getInstitutionTestResults(Long institutionId, Long testId) {
        requireInstitutionAdmin(institutionId);
        getInstitutionTestOrThrow(institutionId, testId);

        List<TestAttemptEntity> attempts = testAttemptRepository.findByTestId(testId)
                .stream()
                .sorted(Comparator.comparing(TestAttemptEntity::getTotalScore, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(TestAttemptEntity::getSubmittedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        List<Long> attemptIds = attempts.stream().map(TestAttemptEntity::getId).toList();
        List<TestSubmissionEntity> submissions = attemptIds.isEmpty()
                ? List.of()
                : testSubmissionRepository.findByAttemptIdIn(attemptIds);
        List<TestQuestionEntity> questionEntities = testQuestionRepository.findByTestIdOrderByIdAsc(testId);

        Map<Long, TestQuestionEntity> questionsById = new HashMap<>();
        for (TestQuestionEntity question : questionEntities) {
            questionsById.put(question.getId(), question);
        }

        Map<Long, List<TestSubmissionEntity>> submissionsByAttempt = new HashMap<>();
        for (TestSubmissionEntity submission : submissions) {
            submissionsByAttempt
                    .computeIfAbsent(submission.getAttemptId(), ignored -> new ArrayList<>())
                    .add(submission);
        }

        Map<Long, TestReportEntity> reportsByAttempt = new HashMap<>();
        for (TestReportEntity report : testReportRepository.findByTestId(testId)) {
            reportsByAttempt.put(report.getAttemptId(), report);
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        List<Map<String, Object>> attemptDetails = new ArrayList<>();
        Map<Long, String> candidateNames = new HashMap<>();
        int rank = 1;
        for (TestAttemptEntity attempt : attempts) {
            String candidateName = candidateNames.computeIfAbsent(
                attempt.getUserId(),
                userId -> userRepository.findById(userId)
                    .map(UserEntity::getName)
                    .orElse("Candidate " + userId)
            );

            List<TestSubmissionEntity> attemptSubmissions = submissionsByAttempt.getOrDefault(attempt.getId(), List.of());

            TestReportEntity report = reportsByAttempt.get(attempt.getId());
            int solved = (int) attemptSubmissions.stream()
                    .filter(item -> item.getTotal() != null && item.getPassed() != null && item.getTotal() > 0)
                    .filter(item -> item.getPassed().equals(item.getTotal()))
                    .count();

            Map<String, Object> attemptMap = new HashMap<>();
            attemptMap.put("id", attempt.getId());
            attemptMap.put("testId", attempt.getTestId());
            attemptMap.put("userId", attempt.getUserId());
            attemptMap.put("startTime", attempt.getStartTime());
            attemptMap.put("endTime", attempt.getSubmittedAt() == null ? attempt.getEndTime() : attempt.getSubmittedAt());
            attemptMap.put("status", attempt.getStatus());

            List<Map<String, Object>> submissionMaps = attemptSubmissions.stream()
                    .map(item -> {
                        Map<String, Object> payload = new LinkedHashMap<>();
                        payload.put("questionId", item.getQuestionId());
                        payload.put("code", item.getCode());
                        payload.put("language", item.getLanguage());
                        payload.put("passed", item.getPassed());
                        payload.put("total", item.getTotal());
                        return payload;
                    })
                    .toList();

            Map<String, Object> reportPayload = testReportAnalyticsService
                    .buildStudentReport(attemptMap, submissionMaps, questionEntities);

            double hintUsage = problemAttemptRepository.findByUserIdAndTestId(attempt.getUserId(), testId)
                    .stream()
                    .mapToInt(item -> item.getHintsRequested() == null ? 0 : item.getHintsRequested())
                    .sum();

                Map<String, Object> row = new LinkedHashMap<>();
                row.put("rank", rank);
                row.put("attemptId", attempt.getId());
                row.put("candidateId", attempt.getUserId());
                row.put("candidateName", candidateName);
                row.put("score", report == null ? toInt(reportPayload.get("score")) : report.getScore());
                row.put("accuracy", report == null ? toDouble(reportPayload.get("accuracy")) : report.getAccuracy());
                row.put("timeTakenSeconds", computeAttemptDurationSeconds(attempt));
                row.put("problemsSolved", solved);
                row.put("status", attempt.getStatus());
                row.put("hintUsage", hintUsage);
                row.put("tabSwitchCount", attempt.getTabSwitchCount());
                rows.add(row);

            List<Map<String, Object>> submissionDetails = attemptSubmissions.stream()
                    .map(item -> {
                        TestQuestionEntity question = questionsById.get(item.getQuestionId());

                        Map<String, Object> detail = new LinkedHashMap<>();
                        detail.put("submissionId", item.getId());
                        detail.put("questionId", item.getQuestionId());
                        detail.put("problemId", question == null ? "" : question.getProblemId());
                        detail.put("topic", question == null ? "" : question.getTopic());
                        detail.put("pattern", question == null ? "" : question.getPattern());
                        detail.put("language", item.getLanguage());
                        detail.put("passed", item.getPassed());
                        detail.put("total", item.getTotal());
                        detail.put("status", getQuestionStatus(item.getPassed(), item.getTotal()));
                        detail.put("updatedAt", item.getUpdatedAt());
                        detail.put("code", item.getCode());
                        return detail;
                    })
                    .toList();

            Map<String, Object> detailRow = new LinkedHashMap<>();
            detailRow.put("rank", rank);
            detailRow.put("attemptId", attempt.getId());
            detailRow.put("candidateId", attempt.getUserId());
            detailRow.put("candidateName", candidateName);
            detailRow.put("status", attempt.getStatus());
            detailRow.put("submittedAt", attempt.getSubmittedAt());
            detailRow.put("tabSwitchCount", attempt.getTabSwitchCount());
            detailRow.put("antiCheatFlags", attempt.getAntiCheatFlags());
            detailRow.put("report", reportPayload);
            detailRow.put("submissions", submissionDetails);
            attemptDetails.add(detailRow);

            rank += 1;
        }

        List<Map<String, Object>> scoreHistogram = buildScoreHistogram(rows);
        List<Map<String, Object>> hardestProblems = buildHardestProblemStats(testId, submissions);
        List<Map<String, Object>> plagiarismFlags = detectPlagiarismFlags(submissions);
        List<Map<String, Object>> fullscreenExitEvents = proctoringEventRepository
            .findByTestIdAndEventTypeIgnoreCaseOrderByOccurredAtDesc(testId, "fullscreen_exit")
            .stream()
            .map(event -> {
                Map<String, Object> eventPayload = new LinkedHashMap<>();
                eventPayload.put("attemptId", event.getAttemptId());
                eventPayload.put("candidateId", event.getUserId());
                eventPayload.put(
                    "candidateName",
                    candidateNames.computeIfAbsent(
                        event.getUserId(),
                        userId -> userRepository.findById(userId)
                            .map(UserEntity::getName)
                            .orElse("Candidate " + userId)
                    )
                );
                eventPayload.put("exitedAt", event.getOccurredAt());
                return eventPayload;
            })
            .toList();

        return Map.of(
                "testId", testId,
                "rows", rows,
                "attemptDetails", attemptDetails,
                "scoreDistribution", scoreHistogram,
                "hardestProblems", hardestProblems,
            "plagiarismFlags", plagiarismFlags,
            "fullscreenExitEvents", fullscreenExitEvents
        );
    }

    /**
     * Exports institution test results as CSV payload.
     */
    @Transactional(readOnly = true)
    public String exportInstitutionTestResultsCsv(Long institutionId, Long testId) {
        Map<String, Object> payload = getInstitutionTestResults(institutionId, testId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) payload.getOrDefault("rows", List.of());

        StringBuilder builder = new StringBuilder();
        builder.append("rank,attempt_id,candidate_id,candidate_name,score,accuracy,time_taken_seconds,problems_solved,status,hint_usage,tab_switch_count\n");
        for (Map<String, Object> row : rows) {
            builder.append(asCsv(row.get("rank"))).append(',')
                    .append(asCsv(row.get("attemptId"))).append(',')
                    .append(asCsv(row.get("candidateId"))).append(',')
                    .append(asCsv(row.get("candidateName"))).append(',')
                    .append(asCsv(row.get("score"))).append(',')
                    .append(asCsv(row.get("accuracy"))).append(',')
                    .append(asCsv(row.get("timeTakenSeconds"))).append(',')
                    .append(asCsv(row.get("problemsSolved"))).append(',')
                    .append(asCsv(row.get("status"))).append(',')
                    .append(asCsv(row.get("hintUsage"))).append(',')
                    .append(asCsv(row.get("tabSwitchCount"))).append('\n');
        }
        return builder.toString();
    }

    /**
     * Starts candidate test attempt using unified /api/test/:testId/join path.
     */
    @Transactional
    public Map<String, Object> joinTest(Long testId, InstitutionDtos.JoinTestRequest request) {
        Long currentUserId = authService.getOrCreateCurrentUser().getId();
        Long userId = request != null && request.userId() != null
                ? authService.resolveUserId(String.valueOf(request.userId()))
                : currentUserId;

        return studentTestService.startTestAttempt(new TestDtos.StartAttemptRequest(testId, userId));
    }

    /**
     * Submits candidate attempt through unified /api/test/:testId/submit path.
     */
    @Transactional
    public Map<String, Object> submitTest(Long testId, InstitutionDtos.SubmitTestRequest request) {
        if (request == null || request.attemptId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "attemptId is required");
        }

        TestAttemptEntity attempt = testAttemptRepository.findById(request.attemptId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));
        if (!attempt.getTestId().equals(testId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attempt does not belong to this test");
        }

        return studentTestService.submitTestAttempt(new TestDtos.SubmitAttemptRequest(
            request.attemptId(),
            request.submitMode()
        ));
    }

    /**
     * Returns one attempt detail through unified /api/test/:testId/attempt/:attemptId path.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getTestAttempt(Long testId, Long attemptId) {
        Map<String, Object> payload = studentTestService.getAttemptDetails(String.valueOf(attemptId));
        @SuppressWarnings("unchecked")
        Map<String, Object> attempt = (Map<String, Object>) payload.get("attempt");
        if (attempt == null || !String.valueOf(testId).equals(String.valueOf(attempt.get("testId")))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attempt does not belong to this test");
        }
        return payload;
    }

    /**
     * Logs proctoring event to DB and increments anti-cheat counters on attempt.
     */
    @Transactional
    public Map<String, Object> trackProctoringEvent(Long testId, InstitutionDtos.ProctoringEventRequest request) {
        if (request == null || request.attemptId() == null || request.eventType() == null || request.eventType().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "attemptId and eventType are required");
        }

        TestAttemptEntity attempt = testAttemptRepository.findById(request.attemptId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));
        if (!attempt.getTestId().equals(testId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attempt does not belong to this test");
        }

        studentTestService.trackAntiCheat(new TestDtos.AntiCheatRequest(
                request.attemptId(),
                request.eventType(),
                request.eventPayload()
        ));

        return Map.of("message", "Proctoring event logged");
    }

    private InstitutionEntity getInstitutionOrThrow(Long institutionId) {
        return institutionRepository.findById(institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Institution not found"));
    }

    private TestEntity getInstitutionTestOrThrow(Long institutionId, Long testId) {
        TestEntity test = testRepository.findById(testId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found"));

        boolean ownedByInstitution = (test.getInstitutionId() != null && test.getInstitutionId().equals(institutionId));
        if (!ownedByInstitution) {
            InstitutionEntity institution = getInstitutionOrThrow(institutionId);
            if (institution.getLegacyInstituteId() != null && institution.getLegacyInstituteId().equals(test.getInstituteId())) {
                ownedByInstitution = true;
            }
        }

        if (!ownedByInstitution) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found for institution");
        }

        return test;
    }

    private InstitutionEntity ensureLegacyInstituteMirror(InstitutionEntity institution) {
        Long legacyInstituteId = institution.getLegacyInstituteId();
        if (legacyInstituteId != null && instituteRepository.existsById(legacyInstituteId)) {
            return institution;
        }

        InstituteEntity legacy = createLegacyInstituteMirror(institution);
        institution.setLegacyInstituteId(legacy.getId());
        return institutionRepository.save(institution);
    }

    private void requireInstitutionAdmin(Long institutionId) {
        InstitutionAuthenticatedUser principal = institutionSecurityUtils.requireInstitutionPrincipal();
        if (!principal.institutionId().equals(institutionId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
    }

    private void requireInstitutionViewer(Long institutionId) {
        InstitutionAuthenticatedUser principal = institutionSecurityUtils.requireInstitutionPrincipal();
        if (!principal.institutionId().equals(institutionId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
    }

    /**
     * Resolves the acting user id when available from Clerk, otherwise falls back to any linked institution member.
     */
    private Long resolveActorUserId(Long institutionId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser) {
            return authService.getOrCreateCurrentUser().getId();
        }

        return institutionUserRepository.findByInstitutionId(institutionId)
                .stream()
                .map(InstitutionUserEntity::getUserId)
                .filter(id -> id != null && id > 0)
                .findFirst()
                .orElse(institutionId);
    }

    private InstituteEntity createLegacyInstituteMirror(InstitutionEntity institution) {
        InstituteEntity legacy = new InstituteEntity();
        legacy.setInstituteName(institution.getName());
        legacy.setEmail("inst-" + UUID.randomUUID().toString().replace("-", "") + "@codemitra.local");
        legacy.setPassword(passwordEncoder.encode("legacy-" + UUID.randomUUID()));
        legacy.setContactNumber("0000000000");
        legacy.setAddress("Not specified");
        legacy.setCity("Not specified");
        legacy.setState("Not specified");
        legacy.setWebsite(null);
        legacy.setInstituteCode("INST-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase());
        return instituteRepository.save(legacy);
    }

    private List<InstitutionDtos.TestProblemItem> resolveProblemItems(
            List<InstitutionDtos.TestProblemItem> explicitItems,
            List<InstitutionDtos.TestQuestionItem> questionItems
    ) {
        if (explicitItems != null && !explicitItems.isEmpty()) {
            return explicitItems;
        }

        if (questionItems == null || questionItems.isEmpty()) {
            return List.of();
        }

        List<InstitutionDtos.TestProblemItem> derived = new ArrayList<>();
        for (int index = 0; index < questionItems.size(); index += 1) {
            InstitutionDtos.TestQuestionItem question = questionItems.get(index);
            if (question == null || question.problemId() == null || question.problemId().isBlank()) {
                continue;
            }

            derived.add(new InstitutionDtos.TestProblemItem(
                    question.problemId().trim(),
                    index + 1,
                    100
            ));
        }

        return derived;
    }

    private void validateQuestionItems(List<InstitutionDtos.TestQuestionItem> questionItems) {
        if (questionItems == null || questionItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "questions are required and must include at least one test case");
        }

        for (InstitutionDtos.TestQuestionItem question : questionItems) {
            if (question == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each question is required");
            }

            boolean hasProblemId = question.problemId() != null && !question.problemId().isBlank();
            boolean hasCustomQuestion = question.customQuestion() != null && !question.customQuestion().isBlank();
            if (!hasProblemId && !hasCustomQuestion) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Each question must reference an existing problem or provide a custom question");
            }

            if (question.difficulty() == null || question.difficulty().isBlank()
                    || question.topic() == null || question.topic().isBlank()
                    || question.pattern() == null || question.pattern().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Each question must include difficulty, topic, and pattern");
            }

            if (question.testCases() == null || question.testCases().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Each question must include at least one test case");
            }

            boolean hasInvalidTestCase = question.testCases().stream().anyMatch(item ->
                    item == null
                            || item.input() == null
                            || item.input().isBlank()
                            || item.expectedOutput() == null
                            || item.expectedOutput().isBlank()
            );
            if (hasInvalidTestCase) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Each test case must include input and expectedOutput");
            }
        }
    }

    private void replaceTestQuestions(Long testId, List<InstitutionDtos.TestQuestionItem> questionItems) {
        List<Long> existingQuestionIds = testQuestionRepository.findByTestIdOrderByIdAsc(testId)
                .stream()
                .map(TestQuestionEntity::getId)
                .toList();
        if (!existingQuestionIds.isEmpty()) {
            testCaseRepository.deleteByQuestionIdIn(existingQuestionIds);
        }

        testQuestionRepository.deleteByTestId(testId);
        persistTestQuestions(testId, questionItems);
    }

    private void persistTestProblems(Long testId, List<InstitutionDtos.TestProblemItem> items) {
        if (items == null) {
            return;
        }

        for (int index = 0; index < items.size(); index += 1) {
            InstitutionDtos.TestProblemItem item = items.get(index);
            if (item == null || item.problemId() == null || item.problemId().isBlank()) {
                continue;
            }

            TestProblemEntity entity = new TestProblemEntity();
            entity.setTestId(testId);
            entity.setProblemId(item.problemId().trim());
            entity.setOrderIndex(item.orderIndex() == null ? index + 1 : item.orderIndex());
            entity.setMarks(item.marks() == null ? 100 : Math.max(item.marks(), 1));
            testProblemRepository.save(entity);
        }
    }

    private void persistTestQuestions(Long testId, List<InstitutionDtos.TestQuestionItem> questionItems) {
        if (questionItems == null) {
            return;
        }

        for (InstitutionDtos.TestQuestionItem questionItem : questionItems) {
            if (questionItem == null) {
                continue;
            }

            TestQuestionEntity questionEntity = new TestQuestionEntity();
            questionEntity.setTestId(testId);
            questionEntity.setProblemId(blankToNull(questionItem.problemId()));
            questionEntity.setCustomQuestion(blankToNull(questionItem.customQuestion()));
            questionEntity.setDifficulty(questionItem.difficulty().trim());
            questionEntity.setTopic(questionItem.topic().trim());
            questionEntity.setPattern(questionItem.pattern().trim());
            TestQuestionEntity savedQuestion = testQuestionRepository.save(questionEntity);

            for (InstitutionDtos.TestQuestionTestCaseItem testCaseItem : questionItem.testCases()) {
                if (testCaseItem == null) {
                    continue;
                }

                TestCaseEntity testCase = new TestCaseEntity();
                testCase.setQuestionId(savedQuestion.getId());
                testCase.setInput(testCaseItem.input());
                testCase.setExpectedOutput(testCaseItem.expectedOutput());
                testCaseRepository.save(testCase);
            }
        }
    }

    private List<Map<String, Object>> buildScoreHistogram(List<Map<String, Object>> rows) {
        int[] buckets = new int[5];
        for (Map<String, Object> row : rows) {
            int score = toInt(row.get("score"));
            if (score < 20) {
                buckets[0] += 1;
            } else if (score < 40) {
                buckets[1] += 1;
            } else if (score < 60) {
                buckets[2] += 1;
            } else if (score < 80) {
                buckets[3] += 1;
            } else {
                buckets[4] += 1;
            }
        }

        return List.of(
                Map.of("range", "0-19", "count", buckets[0]),
                Map.of("range", "20-39", "count", buckets[1]),
                Map.of("range", "40-59", "count", buckets[2]),
                Map.of("range", "60-79", "count", buckets[3]),
                Map.of("range", "80-100", "count", buckets[4])
        );
    }

    private List<Map<String, Object>> buildHardestProblemStats(Long testId, List<TestSubmissionEntity> submissions) {
        List<TestQuestionEntity> questions = testQuestionRepository.findByTestIdOrderByIdAsc(testId);
        List<Map<String, Object>> rows = new ArrayList<>();

        for (TestQuestionEntity question : questions) {
            List<TestSubmissionEntity> questionSubs = submissions.stream()
                    .filter(item -> item.getQuestionId().equals(question.getId()))
                    .toList();
            int attempts = questionSubs.size();
            int accepted = (int) questionSubs.stream()
                    .filter(item -> item.getTotal() != null && item.getPassed() != null && item.getTotal() > 0)
                    .filter(item -> item.getPassed().equals(item.getTotal()))
                    .count();
            double acRate = attempts == 0 ? 0.0 : (accepted * 100.0) / attempts;
            rows.add(Map.of(
                    "questionId", question.getId(),
                    "problemId", question.getProblemId() == null ? "custom-" + question.getId() : question.getProblemId(),
                    "acRate", round2(acRate),
                    "attempts", attempts
            ));
        }

        return rows.stream()
                .sorted(Comparator.comparingDouble(item -> toDouble(item.get("acRate"))))
                .limit(5)
                .toList();
    }

    private List<Map<String, Object>> detectPlagiarismFlags(List<TestSubmissionEntity> submissions) {
        List<Map<String, Object>> flags = new ArrayList<>();

        for (int left = 0; left < submissions.size(); left += 1) {
            for (int right = left + 1; right < submissions.size(); right += 1) {
                TestSubmissionEntity a = submissions.get(left);
                TestSubmissionEntity b = submissions.get(right);
                if (a.getAttemptId().equals(b.getAttemptId()) || !a.getQuestionId().equals(b.getQuestionId())) {
                    continue;
                }

                double similarity = jaccardSimilarity(tokenize(a.getCode()), tokenize(b.getCode()));
                if (similarity >= 0.80) {
                    flags.add(Map.of(
                            "attemptA", a.getAttemptId(),
                            "attemptB", b.getAttemptId(),
                            "questionId", a.getQuestionId(),
                            "similarity", round2(similarity * 100.0)
                    ));
                }
            }
        }

        return flags;
    }

    private Set<String> tokenize(String code) {
        if (code == null || code.isBlank()) {
            return Set.of();
        }
        String[] tokens = code.toLowerCase().replaceAll("[^a-z0-9_]+", " ").trim().split("\\s+");
        Set<String> unique = new HashSet<>();
        for (String token : tokens) {
            if (!token.isBlank()) {
                unique.add(token);
            }
        }
        return unique;
    }

    private double jaccardSimilarity(Set<String> left, Set<String> right) {
        if (left.isEmpty() && right.isEmpty()) {
            return 1.0;
        }

        Set<String> union = new HashSet<>(left);
        union.addAll(right);
        Set<String> intersection = new HashSet<>(left);
        intersection.retainAll(right);

        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }

    private String getQuestionStatus(Integer passed, Integer total) {
        int passedCount = passed == null ? 0 : passed;
        int totalCount = total == null ? 0 : total;

        if (totalCount > 0 && passedCount == totalCount) {
            return "Great";
        }
        if (passedCount > 0) {
            return "Mistake";
        }
        return "Blunder";
    }

    private long computeAttemptDurationSeconds(TestAttemptEntity attempt) {
        LocalDateTime start = attempt.getStartTime();
        LocalDateTime end = attempt.getSubmittedAt() == null ? attempt.getEndTime() : attempt.getSubmittedAt();
        if (start == null || end == null) {
            return 0;
        }
        return Math.max(Duration.between(start, end).toSeconds(), 0);
    }

    private void validateTestWindow(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            return;
        }

        if (!endTime.isAfter(startTime)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endTime must be later than startTime");
        }
    }

    private Map<String, Object> toInstitutionSummary(InstitutionEntity institution) {
        return Map.of(
                "id", institution.getId(),
                "name", institution.getName(),
                "code", institution.getCode() == null ? "" : institution.getCode(),
                "type", institution.getType(),
                "logoUrl", institution.getLogoUrl() == null ? "" : institution.getLogoUrl(),
                "subscriptionTier", institution.getSubscriptionTier(),
                "status", institution.getStatus(),
                "createdAt", institution.getCreatedAt()
        );
    }

    private Map<String, Object> toInstitutionTestSummary(TestEntity test) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", test.getId());
        payload.put("institutionId", test.getInstitutionId());
        payload.put("title", test.getTitle());
        payload.put("description", test.getDescription() == null ? "" : test.getDescription());
        payload.put("startTime", test.getStartTime());
        payload.put("endTime", test.getEndTime());
        payload.put(
            "durationMinutes",
            test.getDurationMinutes() == null ? test.getDuration() : test.getDurationMinutes()
        );
        payload.put("allowAiHints", Boolean.TRUE.equals(test.getAllowAiHints()));
        payload.put(
            "aiHintCooldownMinutes",
            test.getAiHintCooldownMinutes() == null ? 10 : test.getAiHintCooldownMinutes()
        );
        payload.put(
            "maxHintsPerProblem",
            test.getMaxHintsPerProblem() == null ? 3 : test.getMaxHintsPerProblem()
        );
        payload.put("isProctored", Boolean.TRUE.equals(test.getIsProctored()));
        payload.put("joinCode", test.getJoinCode() == null ? "" : test.getJoinCode());
        payload.put("accessScope", test.getAccessScope() == null ? "INSTITUTION_MEMBERS" : test.getAccessScope());
        payload.put("published", !Boolean.FALSE.equals(test.getPublished()));
        payload.put("createdBy", test.getCreatedBy());
        payload.put("createdAt", test.getCreatedAt());
        return payload;
    }

    private String generateUniqueInstitutionCode(String institutionName) {
        String candidate = generateInstitutionCode(institutionName);
        while (institutionRepository.existsByCodeIgnoreCase(candidate)) {
            candidate = generateInstitutionCode(institutionName);
        }
        return candidate;
    }

    private String generateInstitutionCode(String institutionName) {
        String normalized = institutionName == null
                ? "INST"
                : institutionName.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        String prefix = (normalized + "INST").substring(0, 4);
        int random = RANDOM.nextInt(10000);
        return "INST-" + prefix + "-" + String.format(Locale.ROOT, "%04d", random);
    }

    private String resolveJoinCode(String requestedJoinCode) {
        String normalized = requestedJoinCode == null ? "" : requestedJoinCode.trim().toUpperCase(Locale.ROOT);
        if (!normalized.isBlank()) {
            if (testRepository.existsByJoinCodeIgnoreCase(normalized)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Join code already exists");
            }
            return normalized;
        }

        String generated = generateJoinCode();
        while (testRepository.existsByJoinCodeIgnoreCase(generated)) {
            generated = generateJoinCode();
        }
        return generated;
    }

    private String generateJoinCode() {
        final String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder builder = new StringBuilder("TST-");
        for (int index = 0; index < 8; index += 1) {
            builder.append(alphabet.charAt(RANDOM.nextInt(alphabet.length())));
        }
        return builder.toString();
    }

    private List<String> parseJsonList(String json) {
        try {
            if (json == null || json.isBlank()) {
                return List.of();
            }
            return OBJECT_MAPPER.readValue(json, new TypeReference<List<String>>() { });
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private String writeJson(Object value, String fallback) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (Exception ignored) {
            return fallback;
        }
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

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String asCsv(Object value) {
        if (value == null) {
            return "";
        }
        String raw = String.valueOf(value).replace("\"", "\"\"");
        return '"' + raw + '"';
    }
}
