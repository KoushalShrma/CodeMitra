package com.codemitra.backend.service;

import com.codemitra.backend.dto.PerformanceDtos;
import com.codemitra.backend.model.PerformanceEntity;
import com.codemitra.backend.model.UserEntity;
import com.codemitra.backend.repository.PerformanceRepository;
import com.codemitra.backend.repository.UserRepository;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Handles upsert logic for user performance metrics.
 */
@Service
public class PerformanceService {

    private final PerformanceRepository performanceRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    public PerformanceService(
            PerformanceRepository performanceRepository,
            UserRepository userRepository,
            AuthService authService
    ) {
        this.performanceRepository = performanceRepository;
        this.userRepository = userRepository;
        this.authService = authService;
    }

    /**
     * Upserts performance row for authenticated user or explicit institute-managed user id.
     */
    @Transactional
    public Map<String, Object> updatePerformance(PerformanceDtos.UpdatePerformanceRequest request) {
        Long userId = request.user_id() == null
                ? authService.getOrCreateCurrentUser().getId()
                : authService.resolveUserId(String.valueOf(request.user_id()));

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        PerformanceEntity performance = performanceRepository.findByUserId(user.getId()).orElseGet(PerformanceEntity::new);
        performance.setUserId(user.getId());
        performance.setGreatMoves(safe(request.great_moves()));
        performance.setMistakes(safe(request.mistakes()));
        performance.setBlunders(safe(request.blunders()));
        performance.setStreak(safe(request.streak()));
        performance.setScore(safe(request.score()));
        performance.setPenaltyPoints(safe(request.penalty_points()));
        performance.setSuspiciousAttempts(safe(request.suspicious_attempts()));

        PerformanceEntity saved = performanceRepository.save(performance);

        return Map.of(
                "message", "Performance updated",
                "performance", Map.of(
                        "user_id", saved.getUserId(),
                        "great_moves", saved.getGreatMoves(),
                        "mistakes", saved.getMistakes(),
                        "blunders", saved.getBlunders(),
                        "streak", saved.getStreak(),
                        "score", saved.getScore(),
                        "penalty_points", saved.getPenaltyPoints(),
                        "suspicious_attempts", saved.getSuspiciousAttempts()
                )
        );
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }
}
