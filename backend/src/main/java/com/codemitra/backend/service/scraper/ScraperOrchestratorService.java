package com.codemitra.backend.service.scraper;

import com.codemitra.backend.model.ScrapedProblemEntity;
import com.codemitra.backend.model.ScraperRunLogEntity;
import com.codemitra.backend.model.ScraperSourceEntity;
import com.codemitra.backend.repository.ScrapedProblemRepository;
import com.codemitra.backend.repository.ScraperRunLogRepository;
import com.codemitra.backend.repository.ScraperSourceRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Coordinates source scraping, dedupe checks, and run-log persistence.
 */
@Service
public class ScraperOrchestratorService {

    private static final List<String> ACTIVE_DUPLICATE_STATUSES = List.of("PENDING", "IMPORTED", "DUPLICATE");

    private final ScraperSourceRepository scraperSourceRepository;
    private final ScrapedProblemRepository scrapedProblemRepository;
    private final ScraperRunLogRepository scraperRunLogRepository;
    private final ProblemNormalizer problemNormalizer;
    private final Map<String, ProblemSourceScraper> scrapersByName;

    @Value("${scraper.enabled:true}")
    private boolean scraperEnabled;

    @Value("${scraper.max-problems-per-source:80}")
    private int maxProblemsPerSource;

    public ScraperOrchestratorService(
            ScraperSourceRepository scraperSourceRepository,
            ScrapedProblemRepository scrapedProblemRepository,
            ScraperRunLogRepository scraperRunLogRepository,
            ProblemNormalizer problemNormalizer,
            List<ProblemSourceScraper> sourceScrapers
    ) {
        this.scraperSourceRepository = scraperSourceRepository;
        this.scrapedProblemRepository = scrapedProblemRepository;
        this.scraperRunLogRepository = scraperRunLogRepository;
        this.problemNormalizer = problemNormalizer;
        this.scrapersByName = sourceScrapers.stream().collect(Collectors.toMap(
                scraper -> normalizeName(scraper.sourceName()),
                Function.identity(),
                (left, right) -> left,
                LinkedHashMap::new
        ));
    }

    /**
     * Scheduled weekly scraper run. Skips execution when scraper.enabled=false.
     */
    @Scheduled(cron = "${scraper.weekly.cron:0 0 2 * * MON}")
    public void runScheduledWeeklyScrape() {
        if (!scraperEnabled) {
            return;
        }
        runAllSources(false);
    }

    /**
     * Runs all active sources and returns per-source run metrics.
     */
    public Map<String, Object> runAllSources(boolean force) {
        List<ScraperSourceEntity> sources = scraperSourceRepository.findByIsActiveTrueOrderByIdAsc();
        List<Map<String, Object>> results = new ArrayList<>();

        for (ScraperSourceEntity source : sources) {
            results.add(executeSource(source, force));
        }

        long totalNew = results.stream().mapToLong(item -> asLong(item.get("newCount"))).sum();
        long totalDuplicates = results.stream().mapToLong(item -> asLong(item.get("duplicateCount"))).sum();
        long totalFailed = results.stream().mapToLong(item -> asLong(item.get("failedCount"))).sum();

        return Map.of(
                "sourceCount", sources.size(),
                "totalNew", totalNew,
                "totalDuplicates", totalDuplicates,
                "totalFailed", totalFailed,
                "results", results
        );
    }

    /**
     * Runs one source immediately by name.
     */
    public Map<String, Object> runSingleSource(String sourceName, boolean force) {
        ScraperSourceEntity source = scraperSourceRepository.findByNameIgnoreCase(sourceName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scraper source not found"));
        return executeSource(source, force);
    }

    /**
     * Toggles source active/inactive status for admin controls.
     */
    @Transactional
    public Map<String, Object> setSourceActive(Long sourceId, boolean active) {
        ScraperSourceEntity source = scraperSourceRepository.findById(sourceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scraper source not found"));
        source.setIsActive(active);
        scraperSourceRepository.save(source);
        return Map.of(
                "sourceId", source.getId(),
                "sourceName", source.getName(),
                "active", source.getIsActive()
        );
    }

    @Transactional
    protected Map<String, Object> executeSource(ScraperSourceEntity source, boolean force) {
        LocalDateTime now = LocalDateTime.now();
        if (!force && !isSourceDue(source, now)) {
            return Map.of(
                    "sourceId", source.getId(),
                    "sourceName", source.getName(),
                    "skipped", true,
                    "message", "Source is not due yet",
                    "newCount", 0,
                    "duplicateCount", 0,
                    "failedCount", 0
            );
        }

        ScraperRunLogEntity runLog = new ScraperRunLogEntity();
        runLog.setSourceId(source.getId());
        runLog.setRunStartedAt(now);

        int newCount = 0;
        int duplicateCount = 0;
        int failedCount = 0;
        String errorMessage = null;

        try {
            ProblemSourceScraper scraper = scrapersByName.get(normalizeName(source.getName()));
            if (scraper == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No scraper registered for source: " + source.getName());
            }

            List<ScrapedProblemCandidate> candidates = scraper.scrape(source, Math.max(1, maxProblemsPerSource));
            for (ScrapedProblemCandidate candidate : candidates) {
                try {
                    ScrapedProblemEntity entity = problemNormalizer.normalizeToStaging(source.getId(), source.getName(), candidate);
                    if (entity.getTitle() == null || entity.getTitle().isBlank()) {
                        failedCount++;
                        continue;
                    }

                    String externalId = entity.getExternalId();
                    if (externalId != null) {
                        Optional<ScrapedProblemEntity> existing = scrapedProblemRepository
                                .findBySourceIdAndExternalId(source.getId(), externalId);
                        if (existing.isPresent()) {
                            duplicateCount++;
                            continue;
                        }
                    }

                    boolean duplicateByHash = scrapedProblemRepository
                            .existsByContentHashAndImportStatusIn(entity.getContentHash(), ACTIVE_DUPLICATE_STATUSES);
                    if (duplicateByHash) {
                        entity.setImportStatus("DUPLICATE");
                        duplicateCount++;
                    } else {
                        entity.setImportStatus("PENDING");
                        newCount++;
                    }

                    scrapedProblemRepository.save(entity);
                } catch (Exception ex) {
                    failedCount++;
                }
            }

            source.setLastScrapedAt(LocalDateTime.now());
            source.setProblemsScraped(safeInt(source.getProblemsScraped()) + newCount);
            scraperSourceRepository.save(source);
        } catch (Exception ex) {
            failedCount++;
            errorMessage = truncate(ex.getMessage(), 2000);
        } finally {
            runLog.setRunEndedAt(LocalDateTime.now());
            runLog.setNewCount(newCount);
            runLog.setDuplicateCount(duplicateCount);
            runLog.setFailedCount(failedCount);
            runLog.setErrorMessage(errorMessage);
            scraperRunLogRepository.save(runLog);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("sourceId", source.getId());
        response.put("sourceName", source.getName());
        response.put("skipped", false);
        response.put("newCount", newCount);
        response.put("duplicateCount", duplicateCount);
        response.put("failedCount", failedCount);
        response.put("error", errorMessage);
        return response;
    }

    private boolean isSourceDue(ScraperSourceEntity source, LocalDateTime now) {
        if (source.getLastScrapedAt() == null) {
            return true;
        }
        int intervalHours = source.getScrapeIntervalHours() == null ? 168 : Math.max(source.getScrapeIntervalHours(), 1);
        return source.getLastScrapedAt().plusHours(intervalHours).isBefore(now);
    }

    private String normalizeName(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return 0L;
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
