package com.codemitra.backend.dto;

/**
 * DTOs for analytics trigger and query APIs.
 */
public final class AnalyticsDtos {

    private AnalyticsDtos() {
    }

    /**
     * Payload for explicit analytics recalculation requests.
     */
    public record RecalculateRequest(
            Long userId
    ) {
    }
}
