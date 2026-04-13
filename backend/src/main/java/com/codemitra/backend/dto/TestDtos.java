package com.codemitra.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTOs for institute test creation and student attempt operations.
 */
public final class TestDtos {

    private TestDtos() {
    }

    /**
     * Payload for creating an institute test with questions and cases.
     */
    public record CreateTestRequest(
            Long instituteId,
            String title,
            String description,
            Integer duration,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Boolean allowMultipleAttempts,
            Boolean antiCheatingEnabled,
            Boolean showResultsImmediately,
            List<QuestionPayload> questions
    ) {
    }

    /**
     * Nested question payload for create test API.
     */
    public record QuestionPayload(
            String problemId,
            String customQuestion,
            String difficulty,
            String topic,
            String pattern,
            List<TestCasePayload> testCases
    ) {
    }

    /**
     * Nested test case payload for create test API.
     */
    public record TestCasePayload(
            String input,
            String expectedOutput
    ) {
    }

    /**
     * Payload for starting a student attempt.
     */
    public record StartAttemptRequest(
            Long testId,
            Long userId
    ) {
    }

    /**
     * Payload for joining a test using unique join code.
     */
    public record JoinByCodeRequest(
            String joinCode,
            Long userId
    ) {
    }

    /**
     * Payload for saving one student answer.
     */
    public record SaveSubmissionRequest(
            Long attemptId,
            Long questionId,
            String code,
            String language,
            Integer passed,
            Integer total
    ) {
    }

    /**
     * Payload for final attempt submission.
     */
    public record SubmitAttemptRequest(
            Long attemptId,
            String submitMode
    ) {
    }

    /**
     * Payload for anti-cheat events.
     */
    public record AntiCheatRequest(
            Long attemptId,
            String type,
            Map<String, Object> eventPayload
    ) {
    }
}
