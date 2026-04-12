package com.codemitra.backend.service.scraper.sources;

import com.codemitra.backend.model.ScraperSourceEntity;
import com.codemitra.backend.service.scraper.ProblemSourceScraper;
import com.codemitra.backend.service.scraper.ScrapedProblemCandidate;
import com.codemitra.backend.service.scraper.ScraperHttpClient;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

/**
 * Scraper adapter for Project Euler problem listings.
 */
@Component
public class ProjectEulerScraper implements ProblemSourceScraper {

    private final ScraperHttpClient scraperHttpClient;

    public ProjectEulerScraper(ScraperHttpClient scraperHttpClient) {
        this.scraperHttpClient = scraperHttpClient;
    }

    @Override
    public String sourceName() {
        return "Project Euler";
    }

    @Override
    public List<ScrapedProblemCandidate> scrape(ScraperSourceEntity source, int maxItems) {
        List<ScrapedProblemCandidate> rows = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        try {
            Document document = scraperHttpClient.getDocument(source.getBaseUrl() + "/recent");
            for (Element link : document.select("a[href^=problem=]")) {
                String href = link.attr("href");
                String externalId = href.replace("problem=", "").trim();
                if (externalId.isBlank() || !seen.add(externalId)) {
                    continue;
                }

                String title = link.text().trim();
                if (title.isBlank()) {
                    title = "Project Euler Problem " + externalId;
                }

                rows.add(new ScrapedProblemCandidate(
                        externalId,
                        title,
                        "Project Euler problem " + externalId + ".",
                        null,
                        List.of("Math"),
                        null,
                        null,
                        "Project Euler",
                        "https://projecteuler.net/problem=" + externalId
                ));

                if (rows.size() >= maxItems) {
                    break;
                }
            }
        } catch (Exception ignored) {
            return List.of();
        }
        return rows;
    }
}
