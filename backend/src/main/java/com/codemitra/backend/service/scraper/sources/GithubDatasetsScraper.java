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
 * Scraper adapter for GitHub competitive programming dataset repositories.
 */
@Component
public class GithubDatasetsScraper implements ProblemSourceScraper {

    private final ScraperHttpClient scraperHttpClient;

    public GithubDatasetsScraper(ScraperHttpClient scraperHttpClient) {
        this.scraperHttpClient = scraperHttpClient;
    }

    @Override
    public String sourceName() {
        return "GitHub Datasets";
    }

    @Override
    public List<ScrapedProblemCandidate> scrape(ScraperSourceEntity source, int maxItems) {
        try {
            String url = source.getBaseUrl()
                    + "/search/repositories?q=competitive+programming+problems+dataset&sort=stars&order=desc&per_page="
                    + Math.max(1, Math.min(maxItems, 30));
            JsonNode root = scraperHttpClient.getJson(url);

            List<ScrapedProblemCandidate> rows = new ArrayList<>();
            for (JsonNode item : root.path("items")) {
                String fullName = item.path("full_name").asText("").trim();
                if (fullName.isBlank()) {
                    continue;
                }

                String title = item.path("name").asText(fullName);
                String description = item.path("description").asText("GitHub dataset repository for DSA/CP problems.");
                String sourceUrl = item.path("html_url").asText("");

                rows.add(new ScrapedProblemCandidate(
                        fullName,
                        title,
                        description,
                        null,
                        List.of("Data Curation"),
                        null,
                        null,
                        "GitHub Dataset",
                        sourceUrl.isBlank() ? null : sourceUrl
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
