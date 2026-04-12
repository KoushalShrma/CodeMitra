package com.codemitra.backend.service;

import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

/**
 * Provides topic/title metadata for practice problem identifiers used in analytics responses.
 */
@Service
public class PracticeProblemCatalogService {

    private final Map<String, ProblemCatalogEntry> coreCatalog = new HashMap<>();
    private final Map<String, String> generatedTopicSlugMap = new HashMap<>();

    public PracticeProblemCatalogService() {
        coreCatalog.put("two-sum", new ProblemCatalogEntry("Two Sum", "Array"));
        coreCatalog.put("valid-parentheses", new ProblemCatalogEntry("Valid Parentheses", "Stack"));
        coreCatalog.put("reverse-string", new ProblemCatalogEntry("Reverse String", "String"));
        coreCatalog.put("maximum-subarray", new ProblemCatalogEntry("Maximum Subarray", "Array"));
        coreCatalog.put("binary-search", new ProblemCatalogEntry("Binary Search", "Array"));
        coreCatalog.put("climbing-stairs", new ProblemCatalogEntry("Climbing Stairs", "Dynamic Programming"));
        coreCatalog.put("longest-substring-without-repeating-characters", new ProblemCatalogEntry("Longest Substring Without Repeating Characters", "String"));
        coreCatalog.put("merge-intervals", new ProblemCatalogEntry("Merge Intervals", "Interval"));
        coreCatalog.put("fibonacci-number", new ProblemCatalogEntry("Fibonacci Number", "Dynamic Programming"));
        coreCatalog.put("contains-duplicate", new ProblemCatalogEntry("Contains Duplicate", "Array"));
        coreCatalog.put("product-of-array-except-self", new ProblemCatalogEntry("Product of Array Except Self", "Array"));
        coreCatalog.put("kth-smallest-in-bst", new ProblemCatalogEntry("Kth Smallest in BST", "Tree"));

        generatedTopicSlugMap.put("array", "Array");
        generatedTopicSlugMap.put("string", "String");
        generatedTopicSlugMap.put("stack", "Stack");
        generatedTopicSlugMap.put("queue", "Queue");
        generatedTopicSlugMap.put("linked-list", "Linked List");
        generatedTopicSlugMap.put("tree", "Tree");
        generatedTopicSlugMap.put("graph", "Graph");
        generatedTopicSlugMap.put("binary-search", "Binary Search");
        generatedTopicSlugMap.put("dynamic-programming", "Dynamic Programming");
        generatedTopicSlugMap.put("greedy", "Greedy");
        generatedTopicSlugMap.put("interval", "Interval");
        generatedTopicSlugMap.put("heap", "Heap");
        generatedTopicSlugMap.put("backtracking", "Backtracking");
        generatedTopicSlugMap.put("bit-manipulation", "Bit Manipulation");
        generatedTopicSlugMap.put("math", "Math");
        generatedTopicSlugMap.put("matrix", "Matrix");
    }

    /**
     * Returns canonical total count used by existing frontend progress widgets.
     */
    public int totalPracticeProblems() {
        return 120;
    }

    /**
     * Resolves a problem id into title/topic with fallback inference.
     */
    public ProblemCatalogEntry getProblemCatalogEntry(String problemId) {
        if (coreCatalog.containsKey(problemId)) {
            return coreCatalog.get(problemId);
        }
        return new ProblemCatalogEntry(inferGeneratedTitle(problemId), inferGeneratedTopic(problemId));
    }

    private String inferGeneratedTopic(String problemId) {
        if (problemId == null) {
            return "General";
        }
        for (String slug : generatedTopicSlugMap.keySet()) {
            if (problemId.endsWith("-" + slug)) {
                return generatedTopicSlugMap.get(slug);
            }
        }
        return "General";
    }

    private String inferGeneratedTitle(String problemId) {
        if (problemId == null || problemId.isBlank()) {
            return "Practice Problem";
        }
        String cleaned = problemId;
        for (String slug : generatedTopicSlugMap.keySet()) {
            String suffix = "-" + slug;
            if (problemId.endsWith(suffix)) {
                cleaned = problemId.substring(0, problemId.length() - suffix.length());
                break;
            }
        }

        String[] parts = cleaned.split("-");
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (part.isBlank()) {
                continue;
            }
            if (!builder.isEmpty()) {
                builder.append(' ');
            }
            builder.append(Character.toUpperCase(part.charAt(0)));
            if (part.length() > 1) {
                builder.append(part.substring(1));
            }
        }
        String title = builder.toString().trim();
        return title.isEmpty() ? "Practice Problem" : title;
    }

    /**
     * Immutable catalog result returned for analytics assembly.
     */
    public record ProblemCatalogEntry(String title, String topic) {
    }
}
