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
 * Scraper adapter for Kattis public problem table.
 */
@Component
public class KattisScraper implements ProblemSourceScraper {

    private final ScraperHttpClient scraperHttpClient;

    public KattisScraper(ScraperHttpClient scraperHttpClient) {
        this.scraperHttpClient = scraperHttpClient;
    }

    @Override
    public String sourceName() {
        return "Kattis";
    }

    @Override
    public List<ScrapedProblemCandidate> scrape(ScraperSourceEntity source, int maxItems) {
        List<ScrapedProblemCandidate> rows = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();

        try {
            Document document = scraperHttpClient.getDocument(source.getBaseUrl() + "/problems");
            for (Element row : document.select("table tbody tr")) {
                Element link = row.selectFirst("a[href*=/problems/]");
                if (link == null) {
                    continue;
                }

                String href = link.attr("href");
                String externalId = href.replaceAll(".*?/problems/", "").replaceAll("/.*", "").trim();
                if (externalId.isBlank() || !seen.add(externalId)) {
                    continue;
                }

                String title = link.text().trim();
                String difficultyRaw = textOrNull(row.selectFirst("td:nth-child(4)"));
                String absoluteUrl = href.startsWith("http") ? href : "https://open.kattis.com" + href;

                rows.add(new ScrapedProblemCandidate(
                        externalId,
                        title,
                        "Kattis problem: " + title,
                        difficultyRaw,
                        List.of(),
                        null,
                        null,
                        "Kattis",
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

    private String textOrNull(Element element) {
        if (element == null) {
            return null;
        }
        String text = element.text().trim();
        return text.isBlank() ? null : text;
    }
}
