package com.codemitra.backend.service.scraper.sources;

import com.codemitra.backend.model.ScraperSourceEntity;
import com.codemitra.backend.service.scraper.ProblemSourceScraper;
import com.codemitra.backend.service.scraper.ScrapedProblemCandidate;
import com.codemitra.backend.service.scraper.ScraperHttpClient;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Scraper adapter for AtCoder public problem metadata feed.
 */
@Component
public class AtCoderScraper implements ProblemSourceScraper {

    private final ScraperHttpClient scraperHttpClient;

    public AtCoderScraper(ScraperHttpClient scraperHttpClient) {
        this.scraperHttpClient = scraperHttpClient;
    }

    @Override
    public String sourceName() {
        return "AtCoder";
    }

    @Override
    public List<ScrapedProblemCandidate> scrape(ScraperSourceEntity source, int maxItems) {
        try {
            JsonNode root = scraperHttpClient.getJson(source.getBaseUrl());
            List<ScrapedProblemCandidate> rows = new ArrayList<>();

            for (JsonNode problem : root) {
                String id = problem.path("id").asText("").trim();
                String title = problem.path("title").asText("").trim();
                String contestId = problem.path("contest_id").asText("").trim();
                if (id.isBlank() || title.isBlank()) {
                    continue;
                }

                String sourceUrl = contestId.isBlank()
                        ? null
                        : "https://atcoder.jp/contests/" + contestId + "/tasks/" + id;

                rows.add(new ScrapedProblemCandidate(
                        id,
                        title,
                        "AtCoder problem: " + title,
                        null,
                        List.of(),
                        null,
                        null,
                        "AtCoder",
                        sourceUrl
                ));

                if (rows.size() >= maxItems) {
                    break;
                }
            }

            return rows;
        } catch (Exception ignored) {
            return List.of();
        }
    }
}
