package com.codemitra.backend.dto;

import java.util.List;

/**
 * DTOs used by AI hint and post-acceptance code review endpoints.
 */
public final class AiDtos {

    private AiDtos() {
    }

    /**
     * Payload for requesting a guided AI hint.
     */
    public record HintRequest(
            String problemId,
            String problemStatement,
            String userCode,
            List<String> topicTags,
            Long testId,
            Integer hintNumber
    ) {
    }

    /**
     * Payload for checking hint budget and cooldown status.
     */
    public record HintStatusRequest(
            Long testId
    ) {
    }

    /**
     * Payload for generating post-accepted code analysis.
     */
    public record ReviewRequest(
            String problemId,
            String problemStatement,
            String userCode,
            String language,
            String timeComplexityClaimed,
            Long testId
    ) {
    }
}
