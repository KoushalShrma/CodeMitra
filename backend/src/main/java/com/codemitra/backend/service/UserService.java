package com.codemitra.backend.service;

import com.codemitra.backend.model.PerformanceEntity;
import com.codemitra.backend.model.PracticeRunEntity;
import com.codemitra.backend.model.ProblemSubmissionEntity;
import com.codemitra.backend.model.UserEntity;
import com.codemitra.backend.repository.PerformanceRepository;
import com.codemitra.backend.repository.PracticeRunRepository;
import com.codemitra.backend.repository.ProblemProgressRepository;
import com.codemitra.backend.repository.ProblemSubmissionRepository;
import com.codemitra.backend.repository.UserRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * Handles profile retrieval/update, avatar uploads, and progress analytics payloads.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PerformanceRepository performanceRepository;
    private final PracticeRunRepository practiceRunRepository;
    private final ProblemSubmissionRepository problemSubmissionRepository;
    private final ProblemProgressRepository problemProgressRepository;
    private final PracticeProblemCatalogService catalogService;
    private final AuthService authService;

    public UserService(
            UserRepository userRepository,
            PerformanceRepository performanceRepository,
            PracticeRunRepository practiceRunRepository,
            ProblemSubmissionRepository problemSubmissionRepository,
            ProblemProgressRepository problemProgressRepository,
            PracticeProblemCatalogService catalogService,
            AuthService authService
    ) {
        this.userRepository = userRepository;
        this.performanceRepository = performanceRepository;
        this.practiceRunRepository = practiceRunRepository;
        this.problemSubmissionRepository = problemSubmissionRepository;
        this.problemProgressRepository = problemProgressRepository;
        this.catalogService = catalogService;
        this.authService = authService;
    }

    /**
     * Returns user profile by numeric id or "me" alias while preserving legacy response keys.
     */
    @Transactional
    public Map<String, Object> getUserById(String idOrMe) {
        Long userId = authService.resolveUserId(idOrMe);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        PerformanceEntity performance = performanceRepository.findByUserId(userId).orElseGet(PerformanceEntity::new);

        return Map.of(
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "bio", nullToEmpty(user.getBio()),
                        "profile_image", nullToEmpty(user.getProfileImage()),
                        "created_at", user.getCreatedAt(),
                        "great_moves", safe(performance.getGreatMoves()),
                        "mistakes", safe(performance.getMistakes()),
                        "blunders", safe(performance.getBlunders()),
                        "streak", safe(performance.getStreak())
                )
        );
    }

    /**
     * Updates mutable profile fields and returns updated user payload.
     */
    @Transactional
    public Map<String, Object> updateUserById(String idOrMe, Map<String, Object> payload) {
        Long userId = authService.resolveUserId(idOrMe);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String name = payload.get("name") == null ? user.getName() : String.valueOf(payload.get("name")).trim();
        String bio = payload.get("bio") == null ? user.getBio() : String.valueOf(payload.get("bio")).trim();
        String profileImage = payload.get("profile_image") == null
                ? user.getProfileImage()
                : String.valueOf(payload.get("profile_image")).trim();

        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }

        user.setName(name);
        user.setBio(bio == null || bio.isBlank() ? null : bio);
        user.setProfileImage(profileImage == null || profileImage.isBlank() ? null : profileImage);

        UserEntity saved = userRepository.save(user);

        return Map.of(
                "message", "Profile updated successfully",
                "user", Map.of(
                        "id", saved.getId(),
                        "name", saved.getName(),
                        "email", saved.getEmail(),
                        "bio", nullToEmpty(saved.getBio()),
                        "profile_image", nullToEmpty(saved.getProfileImage()),
                        "created_at", saved.getCreatedAt()
                )
        );
    }

    /**
     * Saves uploaded profile image and returns a browser-consumable URL path.
     */
    public Map<String, Object> uploadProfileImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile image is required");
        }
        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
        }

        try {
            Path uploadDir = Paths.get("uploads", "profiles").toAbsolutePath().normalize();
            Files.createDirectories(uploadDir);

            String safeName = System.currentTimeMillis() + "-" + UUID.randomUUID() + "-" + file.getOriginalFilename().replaceAll("\\s+", "-");
            Path destination = uploadDir.resolve(safeName).normalize();
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            return Map.of(
                    "message", "Profile image uploaded",
                    "imageUrl", "/uploads/profiles/" + safeName
            );
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to save profile image");
        }
    }

    /**
     * Returns progress analytics payload consumed by the frontend progress page.
     */
    @Transactional
    public Map<String, Object> getUserProgress(String userIdOrMe) {
        Long userId = authService.resolveUserId(userIdOrMe);

        List<PracticeRunEntity> allRuns = practiceRunRepository.findByUserId(userId);
        long completedProblems = problemProgressRepository.countByUserIdAndStatus(userId, "completed");
        List<ProblemSubmissionEntity> completedSubmissions = problemSubmissionRepository.findByUserIdAndCompletedTrue(userId);

        int totalRuns = allRuns.size();
        int greatMoves = (int) allRuns.stream().filter(run -> "Great".equals(run.getStatus())).count();
        int mistakes = (int) allRuns.stream().filter(run -> "Mistake".equals(run.getStatus())).count();
        int blunders = (int) allRuns.stream().filter(run -> "Blunder".equals(run.getStatus())).count();

        int totalPassed = completedSubmissions.stream().mapToInt(item -> safe(item.getTotalPassed())).sum();
        int totalTestCases = completedSubmissions.stream().mapToInt(item -> safe(item.getTotalTestCases())).sum();
        double accuracy = totalTestCases > 0 ? round2((double) totalPassed * 100.0 / totalTestCases) : 0.0;

        Map<String, TopicAccumulator> topicMap = new HashMap<>();
        for (ProblemSubmissionEntity submission : completedSubmissions) {
            PracticeProblemCatalogService.ProblemCatalogEntry entry = catalogService.getProblemCatalogEntry(submission.getProblemId());
            TopicAccumulator accumulator = topicMap.computeIfAbsent(entry.topic(), ignored -> new TopicAccumulator(entry.topic()));
            accumulator.passed += safe(submission.getTotalPassed());
            accumulator.total += safe(submission.getTotalTestCases());
        }

        List<Map<String, Object>> topicStats = topicMap.values().stream()
                .map(acc -> Map.<String, Object>of(
                        "topic", acc.topic,
                        "accuracy", acc.total > 0 ? round2((double) acc.passed * 100.0 / acc.total) : 0.0
                ))
                .sorted((left, right) -> Double.compare(
                        (double) right.get("accuracy"),
                        (double) left.get("accuracy")
                ))
                .toList();

        List<PracticeRunEntity> activityRuns = practiceRunRepository.findTop8ByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> activity = activityRuns.stream().map(run -> {
            PracticeProblemCatalogService.ProblemCatalogEntry entry = catalogService.getProblemCatalogEntry(run.getProblemId());
            return Map.<String, Object>of(
                    "problem", entry.title(),
                    "status", run.getStatus(),
                    "date", run.getCreatedAt(),
                    "topic", entry.topic()
            );
        }).toList();

        Map<LocalDate, int[]> byDay = new HashMap<>();
        for (PracticeRunEntity run : allRuns) {
            LocalDate day = run.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
            int[] sums = byDay.computeIfAbsent(day, ignored -> new int[]{0, 0});
            sums[0] += safe(run.getPassed());
            sums[1] += safe(run.getTotal());
        }

        List<Map<String, Object>> accuracyTrend = byDay.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .limit(10)
                .map(entry -> {
                    int passed = entry.getValue()[0];
                    int total = entry.getValue()[1];
                    double dayAccuracy = total > 0 ? round2((double) passed * 100.0 / total) : 0.0;
                    return Map.<String, Object>of(
                            "date", entry.getKey().toString(),
                            "accuracy", dayAccuracy
                    );
                })
                .toList();

        String strongArea = topicStats.isEmpty() ? "consistent practice" : String.valueOf(topicStats.get(0).get("topic"));
        String weakArea = topicStats.isEmpty()
                ? "newer topics"
                : String.valueOf(topicStats.get(topicStats.size() - 1).get("topic"));

        Map<String, Object> payload = new HashMap<>();
        payload.put("totalProblems", catalogService.totalPracticeProblems());
        payload.put("completedProblems", completedProblems);
        payload.put("totalRuns", totalRuns);
        payload.put("accuracy", accuracy);
        payload.put("greatMoves", greatMoves);
        payload.put("mistakes", mistakes);
        payload.put("blunders", blunders);
        payload.put("topicStats", topicStats);
        payload.put("activity", activity);
        payload.put("accuracyTrend", accuracyTrend);
        payload.put("strongArea", strongArea);
        payload.put("weakArea", weakArea);
        payload.put("aiInsight", "You are strong in " + strongArea + ", but you need a bit more focused practice in " + weakArea + ".");
        return payload;
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    /**
     * Mutable topic accumulator used during stream-to-report conversion.
     */
    private static final class TopicAccumulator {
        private final String topic;
        private int passed;
        private int total;

        private TopicAccumulator(String topic) {
            this.topic = topic;
        }
    }
}
