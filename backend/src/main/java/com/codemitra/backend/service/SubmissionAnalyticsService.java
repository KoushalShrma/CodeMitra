package com.codemitra.backend.service;

import com.codemitra.backend.model.PracticeRunEntity;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/**
 * Reproduces submission metric computation previously implemented in Node utility code.
 */
@Service
public class SubmissionAnalyticsService {

    /**
     * Builds aggregated submission metrics from run history.
     */
    public Map<String, Object> buildSubmissionMetrics(List<PracticeRunEntity> runs) {
        int totalAttempts = runs.size();
        int greatMoves = (int) runs.stream().filter(run -> "Great".equals(run.getStatus())).count();
        int mistakes = (int) runs.stream().filter(run -> "Mistake".equals(run.getStatus())).count();
        int blunders = (int) runs.stream().filter(run -> "Blunder".equals(run.getStatus())).count();
        int totalPassed = runs.stream().mapToInt(run -> safe(run.getPassed())).sum();
        int totalTestCases = runs.stream().mapToInt(run -> safe(run.getTotal())).sum();
        int totalTimeTakenSeconds = runs.stream().mapToInt(run -> safe(run.getTimeTakenSeconds())).sum();
        int totalHintsUsed = runs.stream().mapToInt(run -> safe(run.getHintsUsed())).sum();
        double accuracy = totalTestCases > 0 ? round2((double) totalPassed * 100.0 / totalTestCases) : 0.0;
        List<String> errors = runs.stream()
                .map(PracticeRunEntity::getErrorMessage)
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.toList());

        return Map.of(
                "totalAttempts", totalAttempts,
                "greatMoves", greatMoves,
                "mistakes", mistakes,
                "blunders", blunders,
                "totalPassed", totalPassed,
                "totalTestCases", totalTestCases,
                "accuracy", accuracy,
                "totalTimeTakenSeconds", totalTimeTakenSeconds,
                "totalHintsUsed", totalHintsUsed,
                "errors", errors
        );
    }

    /**
     * Builds submission report payload that matches current frontend shape.
     */
    public Map<String, Object> buildSubmissionReport(String problemId, Map<String, Object> metrics, LocalDateTime submittedAt) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("problemId", problemId);
        payload.put("attempts", metrics.get("totalAttempts"));
        payload.put("accuracy", metrics.get("accuracy"));
        payload.put("greatMoves", metrics.get("greatMoves"));
        payload.put("mistakes", metrics.get("mistakes"));
        payload.put("blunders", metrics.get("blunders"));
        payload.put("finalStatus", "Completed");
        payload.put("completed", true);
        payload.put("submittedAt", submittedAt);
        payload.put("errors", metrics.get("errors"));
        payload.put("totalTimeTakenSeconds", metrics.get("totalTimeTakenSeconds"));
        payload.put("totalHintsUsed", metrics.get("totalHintsUsed"));
        return payload;
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
