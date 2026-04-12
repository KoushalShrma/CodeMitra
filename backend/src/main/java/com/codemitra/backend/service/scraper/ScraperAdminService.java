package com.codemitra.backend.service.scraper;

import com.codemitra.backend.model.ProblemEntity;
import com.codemitra.backend.model.ScrapedProblemEntity;
import com.codemitra.backend.model.ScraperRunLogEntity;
import com.codemitra.backend.model.ScraperSourceEntity;
import com.codemitra.backend.repository.ScrapedProblemRepository;
import com.codemitra.backend.repository.ScraperRunLogRepository;
import com.codemitra.backend.repository.ScraperSourceRepository;
import com.codemitra.backend.service.CacheStatsService;
import com.codemitra.backend.service.GroqUsageService;
import com.codemitra.backend.service.ProblemRegistryService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Provides admin workflows for queue review, import approval, and scraper dashboard data.
 */
@Service
public class ScraperAdminService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final ScrapedProblemRepository scrapedProblemRepository;
    private final ScraperSourceRepository scraperSourceRepository;
    private final ScraperRunLogRepository scraperRunLogRepository;
    private final ProblemRegistryService problemRegistryService;
    private final ProblemNormalizer problemNormalizer;
    private final CacheStatsService cacheStatsService;
    private final GroqUsageService groqUsageService;

    public ScraperAdminService(
            ScrapedProblemRepository scrapedProblemRepository,
            ScraperSourceRepository scraperSourceRepository,
            ScraperRunLogRepository scraperRunLogRepository,
            ProblemRegistryService problemRegistryService,
            ProblemNormalizer problemNormalizer,
            CacheStatsService cacheStatsService,
            GroqUsageService groqUsageService
    ) {
        this.scrapedProblemRepository = scrapedProblemRepository;
        this.scraperSourceRepository = scraperSourceRepository;
        this.scraperRunLogRepository = scraperRunLogRepository;
        this.problemRegistryService = problemRegistryService;
        this.problemNormalizer = problemNormalizer;
        this.cacheStatsService = cacheStatsService;
        this.groqUsageService = groqUsageService;
    }

    /**
     * Returns scraper queue, run health, and AI cache/budget dashboard metrics.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> dashboardStats() {
        long pending = scrapedProblemRepository.countByImportStatus("PENDING");
        long imported = scrapedProblemRepository.countByImportStatus("IMPORTED");
        long duplicate = scrapedProblemRepository.countByImportStatus("DUPLICATE");
        long failed = scrapedProblemRepository.countByImportStatus("FAILED");

        List<Map<String, Object>> sources = scraperSourceRepository.findAll().stream()
                .map(this::sourceStats)
                .toList();

        return Map.of(
                "queue", Map.of(
                        "pending", pending,
                        "imported", imported,
                        "duplicate", duplicate,
                        "failed", failed
                ),
                "sources", sources,
                "groqCache", cacheStatsService.buildDashboardStats(),
                "groqBudget", groqUsageService.todayBudgetSnapshot()
        );
    }

    /**
     * Returns review queue rows for a selected status.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> queue(String status, int limit) {
        String safeStatus = normalizeStatus(status);
        int safeLimit = Math.max(1, Math.min(limit, 200));

        return scrapedProblemRepository.findByImportStatusOrderByScrapedAtDescIdDesc(safeStatus)
                .stream()
                .limit(safeLimit)
                .map(this::queueRow)
                .toList();
    }

    /**
     * Approves one staging row and imports/updates canonical problems table.
     */
    @Transactional
    public Map<String, Object> approve(Long scrapedProblemId, Long reviewerId) {
        ScrapedProblemEntity staged = scrapedProblemRepository.findById(scrapedProblemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scraped problem not found"));

        if ("IMPORTED".equalsIgnoreCase(staged.getImportStatus())) {
            return Map.of(
                    "message", "Already imported",
                    "scrapedProblemId", staged.getId()
            );
        }

        ScraperSourceEntity source = scraperSourceRepository.findById(staged.getSourceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Scraper source not found"));

        List<String> topicTags = problemNormalizer.parseTopicTags(staged.getTopicTags());
        String problemKey = problemNormalizer.buildProblemKey(source.getName(), staged.getExternalId(), staged.getTitle());

        ProblemEntity problem = problemRegistryService.resolveOrCreate(problemKey, staged.getDescription(), topicTags);
        problem.setTitle(staged.getTitle());
        problem.setDescription(staged.getDescription());
        problem.setDifficulty(staged.getDifficultyNormalized());
        problem.setTopicTags(writeJson(topicTags, "[]"));
        problem.setTimeLimitMs(staged.getTimeLimitMs());
        problem.setMemoryLimitMb(staged.getMemoryLimitMb());
        problem.setSource(source.getName());
        problem.setWhereAsked(staged.getWhereAsked());
        problem.setExternalUrl(staged.getSourceUrl());
        problem.setIsVerified(true);
        problem.setScrapeHash(staged.getContentHash());
        problemRegistryService.save(problem);

        staged.setImportStatus("IMPORTED");
        staged.setImportedAt(LocalDateTime.now());
        scrapedProblemRepository.save(staged);

        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "Scraped problem approved and imported");
        payload.put("scrapedProblemId", staged.getId());
        payload.put("problemId", problem.getId());
        payload.put("problemKey", problem.getProblemKey());
        payload.put("reviewerUserId", reviewerId);
        return payload;
    }

    /**
     * Marks one staging row as rejected.
     */
    @Transactional
    public Map<String, Object> reject(Long scrapedProblemId) {
        ScrapedProblemEntity staged = scrapedProblemRepository.findById(scrapedProblemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scraped problem not found"));

        if ("IMPORTED".equalsIgnoreCase(staged.getImportStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imported rows cannot be rejected");
        }

        staged.setImportStatus("FAILED");
        scrapedProblemRepository.save(staged);

        return Map.of(
                "message", "Scraped problem rejected",
                "scrapedProblemId", staged.getId(),
                "status", staged.getImportStatus()
        );
    }

    private Map<String, Object> sourceStats(ScraperSourceEntity source) {
        ScraperRunLogEntity latestRun = scraperRunLogRepository.findTopBySourceIdOrderByRunStartedAtDesc(source.getId()).orElse(null);

        Map<String, Object> row = new HashMap<>();
        row.put("id", source.getId());
        row.put("name", source.getName());
        row.put("baseUrl", source.getBaseUrl());
        row.put("active", source.getIsActive());
        row.put("intervalHours", source.getScrapeIntervalHours());
        row.put("lastScrapedAt", source.getLastScrapedAt());
        row.put("problemsScraped", source.getProblemsScraped());
        row.put("pendingCount", scrapedProblemRepository.countBySourceIdAndImportStatus(source.getId(), "PENDING"));

        if (latestRun != null) {
            row.put("lastRunStartedAt", latestRun.getRunStartedAt());
            row.put("lastRunEndedAt", latestRun.getRunEndedAt());
            row.put("lastRunNewCount", latestRun.getNewCount());
            row.put("lastRunDuplicateCount", latestRun.getDuplicateCount());
            row.put("lastRunFailedCount", latestRun.getFailedCount());
            row.put("lastRunError", latestRun.getErrorMessage());
        }

        return row;
    }

    private Map<String, Object> queueRow(ScrapedProblemEntity item) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", item.getId());
        row.put("sourceId", item.getSourceId());
        row.put("externalId", item.getExternalId() == null ? "" : item.getExternalId());
        row.put("title", item.getTitle());
        row.put("difficultyRaw", item.getDifficultyRaw() == null ? "" : item.getDifficultyRaw());
        row.put("difficultyNormalized", item.getDifficultyNormalized());
        row.put("topicTags", problemNormalizer.parseTopicTags(item.getTopicTags()));
        row.put("importStatus", item.getImportStatus());
        row.put("sourceUrl", item.getSourceUrl() == null ? "" : item.getSourceUrl());
        row.put("whereAsked", item.getWhereAsked() == null ? "" : item.getWhereAsked());
        row.put("scrapedAt", item.getScrapedAt());
        row.put("importedAt", item.getImportedAt());
        return row;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "PENDING";
        }
        String value = status.trim().toUpperCase();
        return switch (value) {
            case "PENDING", "IMPORTED", "DUPLICATE", "FAILED" -> value;
            default -> "PENDING";
        };
    }

    private String writeJson(Object value, String fallback) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return fallback;
        }
    }
}
