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
 * Scraper adapter for SPOJ classical problem listings.
 */
@Component
public class SpojScraper implements ProblemSourceScraper {

    private final ScraperHttpClient scraperHttpClient;

    public SpojScraper(ScraperHttpClient scraperHttpClient) {
        this.scraperHttpClient = scraperHttpClient;
    }

    @Override
    public String sourceName() {
        return "SPOJ";
    }

    @Override
    public List<ScrapedProblemCandidate> scrape(ScraperSourceEntity source, int maxItems) {
        List<ScrapedProblemCandidate> rows = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();

        try {
            Document document = scraperHttpClient.getDocument(source.getBaseUrl());
            for (Element link : document.select("a[href*=/problems/]") ) {
                String href = link.attr("href");
                String externalId = href.replaceAll(".*?/problems/", "").replaceAll("/.*", "").trim();
                if (externalId.isBlank() || !seen.add(externalId)) {
                    continue;
                }

                String title = link.text().trim();
                if (title.isBlank()) {
                    continue;
                }

                String absoluteUrl = href.startsWith("http") ? href : "https://www.spoj.com" + href;
                rows.add(new ScrapedProblemCandidate(
                        externalId,
                        title,
                        "SPOJ problem: " + title,
                        null,
                        List.of(),
                        null,
                        null,
                        "SPOJ Classical",
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
