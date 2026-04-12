package com.codemitra.backend.service;

import com.codemitra.backend.dto.TestDtos;
import com.codemitra.backend.model.TestCaseEntity;
import com.codemitra.backend.model.TestEntity;
import com.codemitra.backend.model.TestQuestionEntity;
import com.codemitra.backend.repository.TestCaseRepository;
import com.codemitra.backend.repository.TestQuestionRepository;
import com.codemitra.backend.repository.TestRepository;
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
 * Business logic for institute-side test creation and retrieval endpoints.
 */
@Service
public class TestService {

    private final TestRepository testRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestCaseRepository testCaseRepository;

    public TestService(
            TestRepository testRepository,
            TestQuestionRepository testQuestionRepository,
            TestCaseRepository testCaseRepository
    ) {
        this.testRepository = testRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.testCaseRepository = testCaseRepository;
    }

    /**
     * Creates a test with nested questions and test cases in one transaction.
     */
    @Transactional
    public Map<String, Object> createTest(TestDtos.CreateTestRequest request) {
        if (request.instituteId() == null || request.title() == null || request.title().isBlank()
                || request.startTime() == null || request.endTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "instituteId, title, startTime, and endTime are required");
        }

        if (request.duration() == null || request.duration() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duration must be greater than 0");
        }

        if (request.questions() == null || request.questions().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one question is required");
        }

        for (TestDtos.QuestionPayload question : request.questions()) {
            validateQuestion(question);
        }

        TestEntity test = new TestEntity();
        test.setInstituteId(request.instituteId());
        test.setInstitutionId(request.instituteId());
        test.setTitle(request.title().trim());
        test.setDescription(blankToNull(request.description()));
        test.setDuration(request.duration());
        test.setDurationMinutes(request.duration());
        test.setStartTime(request.startTime());
        test.setEndTime(request.endTime());
        test.setAllowMultipleAttempts(Boolean.TRUE.equals(request.allowMultipleAttempts()));
        test.setAntiCheatingEnabled(Boolean.TRUE.equals(request.antiCheatingEnabled()));
        test.setIsProctored(Boolean.TRUE.equals(request.antiCheatingEnabled()));
        test.setAllowAiHints(false);
        test.setAiHintCooldownMinutes(10);
        test.setMaxHintsPerProblem(3);
        test.setShowResults(Boolean.TRUE.equals(request.showResultsImmediately()));

        TestEntity savedTest = testRepository.save(test);

        for (TestDtos.QuestionPayload payload : request.questions()) {
            TestQuestionEntity question = new TestQuestionEntity();
            question.setTestId(savedTest.getId());
            question.setProblemId(blankToNull(payload.problemId()));
            question.setCustomQuestion(blankToNull(payload.customQuestion()));
            question.setDifficulty(payload.difficulty().trim());
            question.setTopic(payload.topic().trim());
            question.setPattern(payload.pattern().trim());
            TestQuestionEntity savedQuestion = testQuestionRepository.save(question);

            for (TestDtos.TestCasePayload casePayload : payload.testCases()) {
                TestCaseEntity testCase = new TestCaseEntity();
                testCase.setQuestionId(savedQuestion.getId());
                testCase.setInput(casePayload.input());
                testCase.setExpectedOutput(casePayload.expectedOutput());
                testCaseRepository.save(testCase);
            }
        }

        return Map.of(
                "message", "Test created successfully",
                "testId", savedTest.getId()
        );
    }

    /**
     * Returns tests belonging to one institute ordered newest-first.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getTestsByInstitute(String instituteIdPath) {
        long instituteId = parseId(instituteIdPath, "Invalid institute id");

        List<Map<String, Object>> tests = testRepository.findByInstituteIdOrderByCreatedAtDescIdDesc(instituteId)
                .stream()
                .map(this::toTestSummary)
                .toList();

        return Map.of("tests", tests);
    }

    /**
     * Returns one full test payload including questions and nested test cases.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getTestDetails(String testIdPath) {
        long testId = parseId(testIdPath, "Invalid test id");

        TestEntity test = testRepository.findById(testId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test not found"));

        List<TestQuestionEntity> questions = testQuestionRepository.findByTestIdOrderByIdAsc(testId);
        List<Long> questionIds = questions.stream().map(TestQuestionEntity::getId).toList();
        List<TestCaseEntity> testCases = questionIds.isEmpty()
                ? List.of()
                : testCaseRepository.findByQuestionIdInOrderByIdAsc(questionIds);

        List<Map<String, Object>> questionsWithCases = new ArrayList<>();
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

            Map<String, Object> row = new HashMap<>();
            row.put("id", question.getId());
            row.put("testId", question.getTestId());
            row.put("problemId", question.getProblemId());
            row.put("customQuestion", question.getCustomQuestion());
            row.put("difficulty", question.getDifficulty());
            row.put("topic", question.getTopic());
            row.put("pattern", question.getPattern());
            row.put("createdAt", question.getCreatedAt());
            row.put("testCases", nestedCases);
            questionsWithCases.add(row);
        }

        Map<String, Object> testPayload = new HashMap<>(toTestSummary(test));
        testPayload.put("questions", questionsWithCases);

        return Map.of("test", testPayload);
    }

    private void validateQuestion(TestDtos.QuestionPayload question) {
        if (question == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each question is required");
        }

        if ((question.problemId() == null || question.problemId().isBlank())
                && (question.customQuestion() == null || question.customQuestion().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Each question must reference an existing problem or define a custom question");
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

        boolean invalidCase = question.testCases().stream()
                .anyMatch(testCase -> testCase.input() == null || testCase.input().isBlank()
                        || testCase.expectedOutput() == null || testCase.expectedOutput().isBlank());

        if (invalidCase) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Each test case must include input and expectedOutput");
        }
    }

    private Map<String, Object> toTestSummary(TestEntity test) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", test.getId());
        payload.put("instituteId", test.getInstituteId());
        payload.put("title", test.getTitle());
        payload.put("description", test.getDescription() == null ? "" : test.getDescription());
        payload.put("duration", test.getDuration());
        payload.put("startTime", test.getStartTime());
        payload.put("endTime", test.getEndTime());
        payload.put("allowMultipleAttempts", Boolean.TRUE.equals(test.getAllowMultipleAttempts()));
        payload.put("antiCheatingEnabled", Boolean.TRUE.equals(test.getAntiCheatingEnabled()));
        payload.put("showResults", Boolean.TRUE.equals(test.getShowResults()));
        payload.put("createdAt", test.getCreatedAt());
        return payload;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private long parseId(String value, String message) {
        try {
            return Long.parseLong(value);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    /**
     * Helper for active-test querying by current timestamp.
     */
    @Transactional(readOnly = true)
    public List<TestEntity> getActiveTestsNow() {
        LocalDateTime now = LocalDateTime.now();
        return testRepository.findByStartTimeLessThanEqualAndEndTimeGreaterThanEqualOrderByStartTimeAscIdAsc(now, now);
    }
}
