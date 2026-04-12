package com.codemitra.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Enforces daily Groq spend budget and provides graceful degradation messaging.
 */
@Service
public class DailyBudgetGuard {

    private final com.codemitra.backend.repository.GroqUsageLogRepository groqUsageLogRepository;

    @Value("${groq.daily.budget.usd:5.00}")
    private BigDecimal dailyBudgetUsd;

    public DailyBudgetGuard(com.codemitra.backend.repository.GroqUsageLogRepository groqUsageLogRepository) {
        this.groqUsageLogRepository = groqUsageLogRepository;
    }

    /**
     * Throws 429 when today's estimated spend has reached budget and a fresh Groq call is requested.
     */
    public void assertBudgetAvailable() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        BigDecimal spent = groqUsageLogRepository.sumCostBetween(start, end);
        BigDecimal safeSpent = spent == null ? BigDecimal.ZERO : spent;
        BigDecimal safeBudget = dailyBudgetUsd == null ? BigDecimal.ZERO : dailyBudgetUsd;

        if (safeSpent.compareTo(safeBudget) >= 0) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "AI temporarily unavailable due to daily budget limit. Please try again in a few hours."
            );
        }
    }

    /**
     * Returns the remaining estimated budget for the current day.
     */
    public BigDecimal remainingBudgetUsd() {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();
        BigDecimal spent = groqUsageLogRepository.sumCostBetween(start, end);
        BigDecimal safeSpent = spent == null ? BigDecimal.ZERO : spent;
        BigDecimal safeBudget = dailyBudgetUsd == null ? BigDecimal.ZERO : dailyBudgetUsd;
        return safeBudget.subtract(safeSpent).max(BigDecimal.ZERO).setScale(6, RoundingMode.HALF_UP);
    }
}
