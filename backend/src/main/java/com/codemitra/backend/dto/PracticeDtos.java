package com.codemitra.backend.dto;

import java.util.List;

/**
 * DTOs for practice events and submission flows.
 */
public final class PracticeDtos {

    private PracticeDtos() {
    }

    /**
     * Payload for practice event logging.
     */
    public record PracticeEventRequest(
            Long user_id,
            String event_type,
            String details
    ) {
    }

    /**
     * Payload for tracking one run.
     */
    public record TrackRunRequest(
            Long userId,
            String problemId,
            String language,
            String code,
            Integer passed,
            Integer total,
            String status,
            String error,
            Integer timeTakenSeconds,
            Integer hintsUsed
    ) {
    }

    /**
     * Payload for final practice solution submission.
     */
    public record SubmitSolutionRequest(
            Long userId,
            String problemId,
            String finalCode,
            String language,
            Integer passed,
            Integer total,
            String problemStatement,
            String timeComplexityClaimed,
            List<String> topicTags
    ) {
    }
}
