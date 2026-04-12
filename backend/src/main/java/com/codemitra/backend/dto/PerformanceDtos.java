package com.codemitra.backend.dto;

/**
 * DTOs used for performance update APIs.
 */
public final class PerformanceDtos {

    private PerformanceDtos() {
    }

    /**
     * Payload for performance upsert endpoint.
     */
    public record UpdatePerformanceRequest(
            Long user_id,
            Integer great_moves,
            Integer mistakes,
            Integer blunders,
            Integer streak,
            Integer score,
            Integer penalty_points,
            Integer suspicious_attempts
    ) {
    }
}
