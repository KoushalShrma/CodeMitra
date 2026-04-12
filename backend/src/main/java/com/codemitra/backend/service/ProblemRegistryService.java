package com.codemitra.backend.service;

import com.codemitra.backend.model.ProblemEntity;
import com.codemitra.backend.repository.ProblemRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Resolves canonical problem rows for cache indexing and scraper imports.
 */
@Service
public class ProblemRegistryService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final ProblemRepository problemRepository;
    private final PracticeProblemCatalogService practiceProblemCatalogService;

    public ProblemRegistryService(
            ProblemRepository problemRepository,
            PracticeProblemCatalogService practiceProblemCatalogService
    ) {
        this.problemRepository = problemRepository;
        this.practiceProblemCatalogService = practiceProblemCatalogService;
    }

    /**
     * Resolves one canonical problem by key, creating a lightweight row when not yet present.
     */
    @Transactional
    public ProblemEntity resolveOrCreate(String problemKey, String problemStatement, List<String> topicTags) {
        String normalizedKey = normalizeProblemKey(problemKey);
        return problemRepository.findByProblemKey(normalizedKey)
                .map(existing -> updateExisting(existing, problemStatement, topicTags))
                .orElseGet(() -> createNew(normalizedKey, problemStatement, topicTags));
    }

    /**
     * Resolves one canonical problem by scraper hash when available.
     */
    @Transactional(readOnly = true)
    public ProblemEntity findByScrapeHash(String scrapeHash) {
        return scrapeHash == null || scrapeHash.isBlank()
                ? null
                : problemRepository.findByScrapeHash(scrapeHash).orElse(null);
    }

    /**
     * Computes deterministic dedupe hash using title plus first 200 chars of description.
     */
    public String computeScrapeHash(String title, String description) {
        String material = (title == null ? "" : title.trim().toLowerCase(Locale.ROOT))
                + "::"
                + firstN(description, 200).trim().toLowerCase(Locale.ROOT);
        return sha256(material);
    }

    /**
     * Persists updates to an existing canonical problem row.
     */
    @Transactional
    public ProblemEntity save(ProblemEntity entity) {
        return problemRepository.save(entity);
    }

    private ProblemEntity updateExisting(ProblemEntity existing, String statement, List<String> topicTags) {
        boolean changed = false;

        if ((existing.getDescription() == null || existing.getDescription().isBlank())
                && statement != null && !statement.isBlank()) {
            existing.setDescription(statement);
            changed = true;
        }

        if ((existing.getTopicTags() == null || existing.getTopicTags().isBlank())
                && topicTags != null && !topicTags.isEmpty()) {
            existing.setTopicTags(writeJson(topicTags, "[]"));
            changed = true;
        }

        return changed ? problemRepository.save(existing) : existing;
    }

    private ProblemEntity createNew(String problemKey, String statement, List<String> topicTags) {
        PracticeProblemCatalogService.ProblemCatalogEntry entry = practiceProblemCatalogService.getProblemCatalogEntry(problemKey);

        ProblemEntity entity = new ProblemEntity();
        entity.setProblemKey(problemKey);
        entity.setTitle(entry.title());
        entity.setDescription(statement == null || statement.isBlank() ? entry.title() : statement);
        entity.setDifficulty("Medium");
        entity.setTopicTags(topicTags == null || topicTags.isEmpty()
                ? writeJson(List.of(entry.topic()), "[]")
                : writeJson(topicTags, "[]"));
        entity.setSource("CodeMitra");
        entity.setWhereAsked("Code_Mitra Practice");
        entity.setIsVerified(true);
        entity.setScrapeHash(computeScrapeHash(entity.getTitle(), entity.getDescription()));
        return problemRepository.save(entity);
    }

    private String normalizeProblemKey(String problemKey) {
        if (problemKey == null || problemKey.isBlank()) {
            return "unknown-problem";
        }
        return problemKey.trim().toLowerCase(Locale.ROOT);
    }

    private String firstN(String text, int length) {
        if (text == null || text.isBlank()) {
            return "";
        }
        if (text.length() <= length) {
            return text;
        }
        return text.substring(0, length);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte item : hash) {
                builder.append(String.format("%02x", item));
            }
            return builder.toString();
        } catch (Exception ex) {
            return Integer.toHexString(value.hashCode());
        }
    }

    private String writeJson(Object value, String fallback) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return fallback;
        }
    }
}
