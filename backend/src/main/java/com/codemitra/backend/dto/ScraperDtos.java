package com.codemitra.backend.dto;

/**
 * DTOs used by scraper admin APIs.
 */
public final class ScraperDtos {

    private ScraperDtos() {
    }

    /**
     * Payload for triggering a source run or all-source run when sourceName is absent.
     */
    public record RunRequest(
            String sourceName,
            Boolean force
    ) {
    }

    /**
     * Payload for toggling source active state.
     */
    public record SourceToggleRequest(
            Boolean active
    ) {
    }
}
