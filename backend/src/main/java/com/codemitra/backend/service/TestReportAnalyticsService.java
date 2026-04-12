package com.codemitra.backend.service;

import com.codemitra.backend.model.TestQuestionEntity;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/**
 * Recreates student and institute test analytics payloads from the former Node utility module.
 */
@Service
public class TestReportAnalyticsService {

    /**
     * Builds full student report payload using attempt metadata, question list, and submissions.
     */
    public Map<String, Object> buildStudentReport(
            Map<String, Object> attempt,
            List<Map<String, Object>> submissions,
            List<TestQuestionEntity> questions
    ) {
        int totalQuestions = questions.size();
        int totalPassed = submissions.stream().mapToInt(item -> toInt(item.get("passed"))).sum();
        int totalTestCases = submissions.stream().mapToInt(item -> toInt(item.get("total"))).sum();
        int solved = (int) submissions.stream()
                .filter(item -> {
                    int passed = toInt(item.get("passed"));
                    int total = toInt(item.get("total"));
                    return total > 0 && passed == total;
                })
                .count();

        double accuracy = totalTestCases > 0 ? round2((double) totalPassed * 100.0 / totalTestCases) : 0.0;

        List<Map<String, Object>> questionWise = new ArrayList<>();
        for (TestQuestionEntity question : questions) {
            Map<String, Object> submission = submissions.stream()
                    .filter(item -> toLong(item.get("questionId")) == question.getId())
                    .findFirst()
                    .orElse(Map.of());
            int passed = toInt(submission.get("passed"));
            int total = toInt(submission.get("total"));

            questionWise.add(Map.of(
                    "questionId", question.getId(),
                    "passed", passed,
                    "total", total,
                    "status", getQuestionStatus(passed, total),
                    "code", submission.getOrDefault("code", ""),
                    "topic", question.getTopic(),
                    "pattern", question.getPattern()
            ));
        }

        int greatMoves = (int) questionWise.stream().filter(item -> "Great".equals(item.get("status"))).count();
        int mistakes = (int) questionWise.stream().filter(item -> "Mistake".equals(item.get("status"))).count();
        int blunders = (int) questionWise.stream().filter(item -> "Blunder".equals(item.get("status"))).count();

        int score = totalQuestions == 0 ? 0 : (int) Math.round(solved * 10 + accuracy * 0.4);
        int timeTaken = calculateTimeTaken(attempt.get("startTime"), attempt.get("endTime"));

        Set<String> weakTopics = questionWise.stream()
                .filter(item -> !"Great".equals(item.get("status")))
                .map(item -> String.valueOf(item.getOrDefault("topic", "")))
                .filter(topic -> !topic.isBlank())
                .collect(Collectors.toCollection(HashSet::new));
        Set<String> strongTopics = questionWise.stream()
                .filter(item -> "Great".equals(item.get("status")))
                .map(item -> String.valueOf(item.getOrDefault("topic", "")))
                .filter(topic -> !topic.isBlank())
                .collect(Collectors.toCollection(HashSet::new));

        Map<String, Object> payload = new HashMap<>();
        payload.put("testId", attempt.get("testId"));
        payload.put("totalQuestions", totalQuestions);
        payload.put("solved", solved);
        payload.put("accuracy", accuracy);
        payload.put("score", score);
        payload.put("timeTaken", timeTaken);
        payload.put("greatMoves", greatMoves);
        payload.put("mistakes", mistakes);
        payload.put("blunders", blunders);
        payload.put("questionWise", questionWise);
        payload.put("weakTopics", new ArrayList<>(weakTopics));
        payload.put("strongTopics", new ArrayList<>(strongTopics));
        return payload;
    }

    /**
     * Builds institute-wide analytics summary payload for one test.
     */
    public Map<String, Object> buildInstituteAnalytics(
            List<Map<String, Object>> reports,
            List<TestQuestionEntity> questions,
            List<Map<String, Object>> submissions,
            Map<Long, String> usersById
    ) {
        int totalStudents = reports.size();
        List<Integer> scores = reports.stream().map(item -> toInt(item.get("score"))).toList();

        double averageScore = totalStudents > 0
                ? round2(scores.stream().mapToInt(Integer::intValue).average().orElse(0.0))
                : 0.0;
        int highestScore = scores.stream().max(Integer::compareTo).orElse(0);
        int lowestScore = scores.stream().min(Integer::compareTo).orElse(0);

        List<Map<String, Object>> leaderboard = reports.stream().map(report -> {
            long userId = toLong(report.get("userId"));
            return Map.<String, Object>of(
                    "userId", userId,
                    "name", usersById.getOrDefault(userId, "Student " + userId),
                    "score", toInt(report.get("score")),
                    "accuracy", toDouble(report.get("accuracy")),
                    "timeTaken", toInt(report.get("timeTaken"))
            );
        }).sorted(Comparator
                .comparing((Map<String, Object> row) -> toInt(row.get("score"))).reversed()
                .thenComparing(row -> toInt(row.get("timeTaken"))))
                .toList();

        List<Map<String, Object>> questionAnalytics = new ArrayList<>();
        for (TestQuestionEntity question : questions) {
            List<Map<String, Object>> questionSubmissions = submissions.stream()
                    .filter(item -> toLong(item.get("questionId")) == question.getId())
                    .toList();
            long successCount = questionSubmissions.stream()
                    .filter(item -> {
                        int passed = toInt(item.get("passed"));
                        int total = toInt(item.get("total"));
                        return total > 0 && passed == total;
                    })
                    .count();
            double successRate = questionSubmissions.isEmpty()
                    ? 0.0
                    : round2((double) successCount * 100.0 / questionSubmissions.size());

            Set<String> mistakes = questionSubmissions.stream()
                    .filter(item -> !"Great".equals(getQuestionStatus(toInt(item.get("passed")), toInt(item.get("total")))))
                    .map(item -> "Mistake".equals(getQuestionStatus(toInt(item.get("passed")), toInt(item.get("total"))))
                            ? "Partial test case failures"
                            : "No test cases passed")
                    .collect(Collectors.toCollection(HashSet::new));

            questionAnalytics.add(Map.of(
                    "questionId", question.getId(),
                    "successRate", successRate,
                    "commonMistakes", new ArrayList<>(mistakes)
            ));
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("totalStudents", totalStudents);
        payload.put("averageScore", averageScore);
        payload.put("highestScore", highestScore);
        payload.put("lowestScore", lowestScore);
        payload.put("leaderboard", leaderboard);
        payload.put("questionAnalytics", questionAnalytics);
        return payload;
    }

    private String getQuestionStatus(int passed, int total) {
        if (passed == total && total > 0) {
            return "Great";
        }
        if (passed > 0) {
            return "Mistake";
        }
        return "Blunder";
    }

    private int calculateTimeTaken(Object start, Object end) {
        if (!(start instanceof LocalDateTime startTime) || !(end instanceof LocalDateTime endTime)) {
            return 0;
        }
        return (int) Math.max(0, ChronoUnit.SECONDS.between(startTime, endTime));
    }

    private int toInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value == null) {
            return 0;
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    private long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value == null) {
            return 0L;
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return 0L;
        }
    }

    private double toDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value == null) {
            return 0.0;
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return 0.0;
        }
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
