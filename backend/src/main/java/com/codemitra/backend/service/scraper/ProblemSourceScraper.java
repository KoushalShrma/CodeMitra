package com.codemitra.backend.service.scraper;

import com.codemitra.backend.model.ScraperSourceEntity;
import java.util.List;

/**
 * Contract implemented by each external DSA source scraper.
 */
public interface ProblemSourceScraper {

    /**
     * Returns the source name as stored in scraper_sources.name.
     */
    String sourceName();

    /**
     * Scrapes up to the requested number of problems from one source.
     */
    List<ScrapedProblemCandidate> scrape(ScraperSourceEntity source, int maxItems);
}
