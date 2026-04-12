package com.codemitra.backend.service;

import com.codemitra.backend.model.GroqUsageLogEntity;
import com.codemitra.backend.repository.GroqUsageLogRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Persists Groq call telemetry and computes budget-related aggregates.
 */
@Service
public class GroqUsageService {

    private final GroqUsageLogRepository groqUsageLogRepository;

    @Value("${groq.daily.budget.usd:5.00}")
    private BigDecimal dailyBudgetUsd;

    public GroqUsageService(GroqUsageLogRepository groqUsageLogRepository) {
        this.groqUsageLogRepository = groqUsageLogRepository;
    }

    /**
     * Records one Groq usage event including token counts, cache hit flag, and cost estimate.
     */
    @Transactional
    public void log(
            String callType,
            String modelUsed,
            int inputTokens,
            int outputTokens,
            boolean cacheHit,
            Long userId,
            Long problemId
    ) {
        GroqUsageLogEntity row = new GroqUsageLogEntity();
        row.setCallType(callType);
        row.setModelUsed(modelUsed == null || modelUsed.isBlank() ? "unknown" : modelUsed);
        row.setTokensUsedInput(Math.max(inputTokens, 0));
        row.setTokensUsedOutput(Math.max(outputTokens, 0));
        row.setCacheHit(cacheHit);
        row.setCostEstimateUsd(estimateCostUsd(modelUsed, inputTokens, outputTokens, cacheHit));
        row.setUserId(userId);
        row.setProblemId(problemId);
        row.setCalledAt(LocalDateTime.now());
        groqUsageLogRepository.save(row);
    }

    /**
     * Returns the current day's spend and utilization against configured budget.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> todayBudgetSnapshot() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        BigDecimal spent = safe(groqUsageLogRepository.sumCostBetween(start, end));
        BigDecimal budget = safe(dailyBudgetUsd);
        BigDecimal remaining = budget.subtract(spent).max(BigDecimal.ZERO);
        double utilization = budget.compareTo(BigDecimal.ZERO) == 0
                ? 0.0
                : spent.multiply(BigDecimal.valueOf(100)).divide(budget, 2, RoundingMode.HALF_UP).doubleValue();

        return Map.of(
                "date", today.toString(),
                "spentUsd", spent,
                "budgetUsd", budget,
                "remainingUsd", remaining,
                "utilizationPercent", utilization
        );
    }

    private BigDecimal estimateCostUsd(String modelUsed, int inputTokens, int outputTokens, boolean cacheHit) {
        if (cacheHit) {
            return BigDecimal.ZERO.setScale(6, RoundingMode.HALF_UP);
        }

        String model = modelUsed == null ? "" : modelUsed.toLowerCase();

        // Approximate rates in USD per 1K tokens.
        BigDecimal inputRate;
        BigDecimal outputRate;
        if (model.contains("70b")) {
            inputRate = new BigDecimal("0.00059");
            outputRate = new BigDecimal("0.00079");
        } else {
            inputRate = new BigDecimal("0.00005");
            outputRate = new BigDecimal("0.00008");
        }

        BigDecimal inputCost = BigDecimal.valueOf(Math.max(inputTokens, 0))
                .divide(BigDecimal.valueOf(1000), 8, RoundingMode.HALF_UP)
                .multiply(inputRate);
        BigDecimal outputCost = BigDecimal.valueOf(Math.max(outputTokens, 0))
                .divide(BigDecimal.valueOf(1000), 8, RoundingMode.HALF_UP)
                .multiply(outputRate);
        return inputCost.add(outputCost).setScale(6, RoundingMode.HALF_UP);
    }

    private BigDecimal safe(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(6, RoundingMode.HALF_UP);
        }
        return value.setScale(6, RoundingMode.HALF_UP);
    }
}
