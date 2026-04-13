package com.codemitra.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTOs for institution admin lifecycle, test management, and candidate test-taking APIs.
 */
public final class InstitutionDtos {

    private InstitutionDtos() {
    }

    /**
     * Payload for institution creation.
     */
    public record CreateInstitutionRequest(
            String name,
            String type,
            String logoUrl,
            String subscriptionTier
    ) {
    }

    /**
     * Payload for creating or updating institution tests.
     */
    public record UpsertInstitutionTestRequest(
            String title,
            String description,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Integer durationMinutes,
            Boolean allowAiHints,
            Integer aiHintCooldownMinutes,
            Integer maxHintsPerProblem,
            Boolean isProctored,
            String joinCode,
            String accessScope,
            Boolean published,
            List<TestProblemItem> problems,
            List<TestQuestionItem> questions
    ) {
    }

    /**
     * Public payload for institution onboarding request submission.
     */
    public record SubmitInstitutionRequest(
            String institutionName,
            String institutionType,
            String officialEmail,
            String contactName,
            String contactEmail,
            String contactPhone,
            String website,
            String message
    ) {
    }

    /**
     * Super admin payload for request review action.
     */
    public record ReviewInstitutionRequest(
            String institutionCode,
            String loginEmail,
            Long initialAdminUserId,
            String note
    ) {
    }

    /**
     * Student payload for requesting membership in an institution.
     */
    public record SubmitInstitutionJoinRequest(
            Long institutionId,
            String institutionCode,
            String message
    ) {
    }

    /**
     * Institution admin payload for approving/rejecting member requests.
     */
    public record ReviewInstitutionJoinRequest(
            String role,
            String note
    ) {
    }

    /**
     * Nested test problem assignment payload.
     */
    public record TestProblemItem(
            String problemId,
            Integer orderIndex,
            Integer marks
    ) {
    }

    /**
     * Nested test question payload for institution test create/update.
     */
    public record TestQuestionItem(
            String problemId,
            String customQuestion,
            String difficulty,
            String topic,
            String pattern,
            List<TestQuestionTestCaseItem> testCases
    ) {
    }

    /**
     * Nested test case payload for institution test questions.
     */
    public record TestQuestionTestCaseItem(
            String input,
            String expectedOutput
    ) {
    }

    /**
     * Payload for custom problem creation.
     */
    public record CreateCustomProblemRequest(
            String title,
            String description,
            String difficulty,
            List<String> topicTags,
            Integer timeLimitMs,
            Integer memoryLimitMb,
            Boolean isPublic,
            List<CustomTestCaseItem> testCases
    ) {
    }

    /**
     * Nested test case payload for custom problems.
     */
    public record CustomTestCaseItem(
            String input,
            String expectedOutput,
            Boolean isSample,
            Boolean isHidden
    ) {
    }

    /**
     * Payload for candidates joining tests.
     */
    public record JoinTestRequest(
            Long userId
    ) {
    }

    /**
     * Payload for submitting complete attempt.
     */
    public record SubmitTestRequest(
            Long attemptId,
            String submitMode
    ) {
    }

    /**
     * Payload for proctoring events.
     */
    public record ProctoringEventRequest(
            Long attemptId,
            String eventType,
            Map<String, Object> eventPayload
    ) {
    }
}
