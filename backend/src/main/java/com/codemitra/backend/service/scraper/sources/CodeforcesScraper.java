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
 * Scraper adapter for Codeforces API problemset endpoint.
 */
@Component
public class CodeforcesScraper implements ProblemSourceScraper {

    private final ScraperHttpClient scraperHttpClient;

    public CodeforcesScraper(ScraperHttpClient scraperHttpClient) {
        this.scraperHttpClient = scraperHttpClient;
    }

    @Override
    public String sourceName() {
        return "Codeforces";
    }

    @Override
    public List<ScrapedProblemCandidate> scrape(ScraperSourceEntity source, int maxItems) {
        try {
            JsonNode root = scraperHttpClient.getJson(source.getBaseUrl() + "/problemset.problems");
            JsonNode problems = root.path("result").path("problems");

            List<ScrapedProblemCandidate> rows = new ArrayList<>();
            for (JsonNode problem : problems) {
                int contestId = problem.path("contestId").asInt(0);
                String index = problem.path("index").asText("").trim();
                String name = problem.path("name").asText("").trim();
                if (contestId <= 0 || index.isBlank() || name.isBlank()) {
                    continue;
                }

                String externalId = contestId + "-" + index;
                List<String> tags = new ArrayList<>();
                for (JsonNode tagNode : problem.path("tags")) {
                    String tag = tagNode.asText("").trim();
                    if (!tag.isBlank()) {
                        tags.add(tag);
                    }
                }

                String rating = problem.hasNonNull("rating") ? String.valueOf(problem.path("rating").asInt()) : null;
                String sourceUrl = "https://codeforces.com/problemset/problem/" + contestId + "/" + index;

                rows.add(new ScrapedProblemCandidate(
                        externalId,
                        name,
                        "Codeforces problem " + externalId + ": " + name,
                        rating,
                        tags,
                        null,
                        null,
                        "Codeforces",
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
