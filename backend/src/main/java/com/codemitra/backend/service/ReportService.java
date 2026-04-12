package com.codemitra.backend.service;

import com.codemitra.backend.model.TestAttemptEntity;
import com.codemitra.backend.model.TestQuestionEntity;
import com.codemitra.backend.model.TestReportEntity;
import com.codemitra.backend.model.TestSubmissionEntity;
import com.codemitra.backend.model.UserEntity;
import com.codemitra.backend.repository.TestAttemptRepository;
import com.codemitra.backend.repository.TestQuestionRepository;
import com.codemitra.backend.repository.TestReportRepository;
import com.codemitra.backend.repository.TestSubmissionRepository;
import com.codemitra.backend.repository.UserRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Builds report payloads for student-level and institute-level analytics endpoints.
 */
@Service
public class ReportService {

    private final TestAttemptRepository testAttemptRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestSubmissionRepository testSubmissionRepository;
    private final TestReportRepository testReportRepository;
    private final UserRepository userRepository;
    private final TestReportAnalyticsService testReportAnalyticsService;

    public ReportService(
            TestAttemptRepository testAttemptRepository,
            TestQuestionRepository testQuestionRepository,
            TestSubmissionRepository testSubmissionRepository,
            TestReportRepository testReportRepository,
            UserRepository userRepository,
            TestReportAnalyticsService testReportAnalyticsService
    ) {
        this.testAttemptRepository = testAttemptRepository;
        this.testQuestionRepository = testQuestionRepository;
        this.testSubmissionRepository = testSubmissionRepository;
        this.testReportRepository = testReportRepository;
        this.userRepository = userRepository;
        this.testReportAnalyticsService = testReportAnalyticsService;
    }

    /**
     * Returns student report analytics by attempt id.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getStudentReport(String attemptIdPath) {
        long attemptId = parseId(attemptIdPath, "Invalid attempt id");

        TestAttemptEntity attempt = testAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));

        List<TestQuestionEntity> questions = testQuestionRepository.findByTestIdOrderByIdAsc(attempt.getTestId());
        List<TestSubmissionEntity> submissions = testSubmissionRepository.findByAttemptId(attempt.getId());

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

        return testReportAnalyticsService.buildStudentReport(attemptMap, submissionMaps, questions);
    }

    /**
     * Returns institute analytics payload by test id.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getTestAnalytics(String testIdPath) {
        long testId = parseId(testIdPath, "Invalid test id");

        List<TestReportEntity> reports = testReportRepository.findByTestId(testId);
        List<TestQuestionEntity> questions = testQuestionRepository.findByTestIdOrderByIdAsc(testId);

        List<TestAttemptEntity> attempts = testAttemptRepository.findByTestId(testId);
        List<Long> attemptIds = attempts.stream().map(TestAttemptEntity::getId).toList();
        List<TestSubmissionEntity> submissions = attemptIds.isEmpty()
                ? List.of()
                : testSubmissionRepository.findByAttemptIdIn(attemptIds);

        Map<Long, String> usersById = userRepository
                .findAllById(reports.stream().map(TestReportEntity::getUserId).toList())
                .stream()
                .collect(Collectors.toMap(UserEntity::getId, UserEntity::getName, (left, right) -> left));

        List<Map<String, Object>> reportMaps = reports.stream().map(report -> Map.<String, Object>of(
                "userId", report.getUserId(),
                "score", report.getScore(),
                "accuracy", report.getAccuracy() == null ? 0.0 : report.getAccuracy().doubleValue(),
                "timeTaken", report.getTimeTaken()
        )).toList();

        List<Map<String, Object>> submissionMaps = submissions.stream().map(item -> Map.<String, Object>of(
                "questionId", item.getQuestionId(),
                "passed", item.getPassed(),
                "total", item.getTotal()
        )).toList();

        return testReportAnalyticsService.buildInstituteAnalytics(reportMaps, questions, submissionMaps, usersById);
    }

    private long parseId(String value, String message) {
        try {
            return Long.parseLong(value);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }
}
