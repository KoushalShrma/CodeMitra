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
 * Scraper adapter for CSES problemset links.
 */
@Component
public class CsesScraper implements ProblemSourceScraper {

    private final ScraperHttpClient scraperHttpClient;

    public CsesScraper(ScraperHttpClient scraperHttpClient) {
        this.scraperHttpClient = scraperHttpClient;
    }

    @Override
    public String sourceName() {
        return "CSES";
    }

    @Override
    public List<ScrapedProblemCandidate> scrape(ScraperSourceEntity source, int maxItems) {
        List<ScrapedProblemCandidate> rows = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();

        try {
            Document document = scraperHttpClient.getDocument(source.getBaseUrl() + "/list");
            for (Element link : document.select("a[href*=/problemset/task/]")) {
                String href = link.attr("href");
                String absoluteUrl = href.startsWith("http") ? href : "https://cses.fi" + href;
                String externalId = href.replaceAll(".*?/problemset/task/", "").replaceAll("/.*", "").trim();
                if (externalId.isBlank() || !seen.add(externalId)) {
                    continue;
                }

                String title = link.text().trim();
                if (title.isBlank()) {
                    continue;
                }

                rows.add(new ScrapedProblemCandidate(
                        externalId,
                        title,
                        "CSES problem: " + title,
                        null,
                        List.of(),
                        1000,
                        512,
                        "CSES Problem Set",
                        absoluteUrl
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
