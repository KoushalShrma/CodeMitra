package com.codemitra.backend.service;

import com.codemitra.backend.model.GroqCacheStatsEntity;
import com.codemitra.backend.model.GroqHintCacheEntity;
import com.codemitra.backend.repository.GroqCacheStatsRepository;
import com.codemitra.backend.repository.GroqHintCacheRepository;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Maintains cache hit/miss counters and exposes admin-facing cache metrics.
 */
@Service
public class CacheStatsService {

    private final GroqCacheStatsRepository groqCacheStatsRepository;
    private final GroqHintCacheRepository groqHintCacheRepository;

    public CacheStatsService(
            GroqCacheStatsRepository groqCacheStatsRepository,
            GroqHintCacheRepository groqHintCacheRepository
    ) {
        this.groqCacheStatsRepository = groqCacheStatsRepository;
        this.groqHintCacheRepository = groqHintCacheRepository;
    }

    /**
     * Records one cache hit and adds an estimate of tokens saved.
     */
    @Transactional
    public void recordHit(String cacheKey, long tokensSavedEstimate) {
        GroqCacheStatsEntity stats = groqCacheStatsRepository.findByCacheKey(cacheKey)
                .orElseGet(() -> create(cacheKey));
        stats.setHitCount(stats.getHitCount() + 1);
        stats.setTokensSavedEstimate(stats.getTokensSavedEstimate() + Math.max(tokensSavedEstimate, 0));
        stats.setLastHitAt(LocalDateTime.now());
        groqCacheStatsRepository.save(stats);
    }

    /**
     * Records one cache miss for a key.
     */
    @Transactional
    public void recordMiss(String cacheKey) {
        GroqCacheStatsEntity stats = groqCacheStatsRepository.findByCacheKey(cacheKey)
                .orElseGet(() -> create(cacheKey));
        stats.setMissCount(stats.getMissCount() + 1);
        stats.setLastMissAt(LocalDateTime.now());
        groqCacheStatsRepository.save(stats);
    }

    /**
     * Returns aggregate cache statistics for admin dashboard widgets.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> buildDashboardStats() {
        List<GroqCacheStatsEntity> statsRows = groqCacheStatsRepository.findAll();
        long totalHits = statsRows.stream().mapToLong(item -> item.getHitCount() == null ? 0L : item.getHitCount()).sum();
        long totalMisses = statsRows.stream().mapToLong(item -> item.getMissCount() == null ? 0L : item.getMissCount()).sum();
        long totalRequests = totalHits + totalMisses;
        double hitRate = totalRequests == 0 ? 0.0 : (totalHits * 100.0 / totalRequests);
        long tokensSaved = statsRows.stream().mapToLong(item -> item.getTokensSavedEstimate() == null ? 0L : item.getTokensSavedEstimate()).sum();

        List<Map<String, Object>> topHints = groqHintCacheRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(GroqHintCacheEntity::getUsedCount, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(10)
                .map(item -> Map.<String, Object>of(
                        "problemId", item.getProblemId(),
                        "hintNumber", item.getHintNumber(),
                        "usedCount", item.getUsedCount() == null ? 0 : item.getUsedCount(),
                        "lastUsedAt", item.getLastUsedAt()
                ))
                .toList();

        return Map.of(
                "totalHits", totalHits,
                "totalMisses", totalMisses,
                "hitRate", round2(hitRate),
                "tokensSavedEstimate", tokensSaved,
                "topCachedHints", topHints
        );
    }

    private GroqCacheStatsEntity create(String cacheKey) {
        GroqCacheStatsEntity entity = new GroqCacheStatsEntity();
        entity.setCacheKey(cacheKey);
        return entity;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
