package com.codemitra.backend.service.scraper;

import com.codemitra.backend.model.ScrapedProblemEntity;
import com.codemitra.backend.service.ProblemRegistryService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

/**
 * Normalizes raw scraped payloads into canonical staging values.
 */
@Service
public class ProblemNormalizer {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private static final Map<String, String> TOPIC_HINTS = Map.ofEntries(
            Map.entry("array", "Arrays"),
            Map.entry("string", "Strings"),
            Map.entry("two pointer", "Two Pointers"),
            Map.entry("prefix", "Prefix Sum"),
            Map.entry("binary search", "Binary Search"),
            Map.entry("dfs", "Graphs"),
            Map.entry("bfs", "Graphs"),
            Map.entry("graph", "Graphs"),
            Map.entry("tree", "Trees"),
            Map.entry("heap", "Heap"),
            Map.entry("priority queue", "Heap"),
            Map.entry("dynamic programming", "Dynamic Programming"),
            Map.entry("dp", "Dynamic Programming"),
            Map.entry("greedy", "Greedy"),
            Map.entry("bit", "Bit Manipulation"),
            Map.entry("math", "Math"),
            Map.entry("number", "Math"),
            Map.entry("sort", "Sorting"),
            Map.entry("stack", "Stack"),
            Map.entry("queue", "Queue"),
            Map.entry("sliding window", "Sliding Window")
    );

    private final ProblemRegistryService problemRegistryService;

    public ProblemNormalizer(ProblemRegistryService problemRegistryService) {
        this.problemRegistryService = problemRegistryService;
    }

    /**
     * Converts a source candidate into scraped_problems staging row values.
     */
    public ScrapedProblemEntity normalizeToStaging(
            Long sourceId,
            String sourceName,
            ScrapedProblemCandidate candidate
    ) {
        String title = safe(candidate.title(), "Untitled Problem");
        String description = candidate.description() == null ? "" : candidate.description().trim();
        List<String> topicTags = normalizeTopicTags(candidate.topicTags(), title, description);

        ScrapedProblemEntity entity = new ScrapedProblemEntity();
        entity.setSourceId(sourceId);
        entity.setExternalId(blankToNull(candidate.externalId()));
        entity.setTitle(title);
        entity.setDescription(description);
        entity.setDifficultyRaw(blankToNull(candidate.difficultyRaw()));
        entity.setDifficultyNormalized(normalizeDifficulty(candidate.difficultyRaw()));
        entity.setTopicTags(writeJson(topicTags, "[]"));
        entity.setTimeLimitMs(candidate.timeLimitMs());
        entity.setMemoryLimitMb(candidate.memoryLimitMb());
        entity.setWhereAsked(safe(candidate.whereAsked(), sourceName));
        entity.setSourceUrl(blankToNull(candidate.sourceUrl()));
        entity.setContentHash(problemRegistryService.computeScrapeHash(title, description));
        return entity;
    }

    /**
     * Builds stable canonical problem key used in problems.problem_key.
     */
    public String buildProblemKey(String sourceName, String externalId, String title) {
        String sourceSlug = slugify(sourceName == null ? "source" : sourceName);
        String externalSlug = externalId == null || externalId.isBlank() ? "" : slugify(externalId);
        if (!externalSlug.isBlank()) {
            return sourceSlug + "-" + externalSlug;
        }
        return sourceSlug + "-" + slugify(title == null ? "problem" : title);
    }

    /**
     * Parses topic JSON list persisted in staging rows.
     */
    public List<String> parseTopicTags(String topicTagsJson) {
        try {
            if (topicTagsJson == null || topicTagsJson.isBlank()) {
                return List.of();
            }
            List<String> tags = OBJECT_MAPPER.readValue(topicTagsJson, new TypeReference<List<String>>() {
            });
            return tags == null ? List.of() : tags;
        } catch (Exception ex) {
            return List.of();
        }
    }

    /**
     * Maps external difficulty labels into Easy/Medium/Hard.
     */
    public String normalizeDifficulty(String rawDifficulty) {
        if (rawDifficulty == null || rawDifficulty.isBlank()) {
            return "Medium";
        }

        String value = rawDifficulty.trim().toLowerCase(Locale.ROOT);
        if (value.matches(".*(easy|beginner|800|900|1000|1\\*|a\\b).*")) {
            return "Easy";
        }
        if (value.matches(".*(hard|expert|advanced|1800|1900|2000|2100|2200|3\\*|4\\*|5\\*).*")) {
            return "Hard";
        }
        return "Medium";
    }

    private List<String> normalizeTopicTags(List<String> candidateTopics, String title, String description) {
        Set<String> tags = new LinkedHashSet<>();
        if (candidateTopics != null) {
            for (String tag : candidateTopics) {
                if (tag != null && !tag.isBlank()) {
                    tags.add(capitalizeWords(tag.trim()));
                }
            }
        }

        String text = (title + " " + description).toLowerCase(Locale.ROOT);
        TOPIC_HINTS.forEach((keyword, mapped) -> {
            if (text.contains(keyword)) {
                tags.add(mapped);
            }
        });

        if (tags.isEmpty()) {
            tags.add("General");
        }

        return new ArrayList<>(tags).subList(0, Math.min(tags.size(), 6));
    }

    private String slugify(String input) {
        String value = input.trim().toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+", "")
                .replaceAll("-+$", "");
        return value.isBlank() ? "problem" : value;
    }

    private String capitalizeWords(String value) {
        String[] tokens = value.toLowerCase(Locale.ROOT).split("\\s+");
        StringBuilder builder = new StringBuilder();
        for (String token : tokens) {
            if (token.isBlank()) {
                continue;
            }
            if (!builder.isEmpty()) {
                builder.append(' ');
            }
            builder.append(Character.toUpperCase(token.charAt(0)));
            if (token.length() > 1) {
                builder.append(token.substring(1));
            }
        }
        return builder.toString();
    }

    private String safe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String writeJson(Object value, String fallback) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return fallback;
        }
    }
}
