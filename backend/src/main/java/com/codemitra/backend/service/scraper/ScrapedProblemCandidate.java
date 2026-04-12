package com.codemitra.backend.service.scraper;

import java.util.List;

/**
 * Raw scraped problem payload produced by source adapters before normalization.
 */
public record ScrapedProblemCandidate(
        String externalId,
        String title,
        String description,
        String difficultyRaw,
        List<String> topicTags,
        Integer timeLimitMs,
        Integer memoryLimitMb,
        String whereAsked,
        String sourceUrl
) {
}
