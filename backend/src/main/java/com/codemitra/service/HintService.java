package com.codemitra.service;

import com.codemitra.dto.HintRequest;
import com.codemitra.dto.HintResponse;
import com.codemitra.model.*;
import com.codemitra.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class HintService {
    
    private final HintRepository hintRepository;
    private final ProblemRepository problemRepository;
    private final ProblemStageRepository problemStageRepository;
    private final SubmissionRepository submissionRepository;
    private final UserProgressRepository userProgressRepository;
    private final ObjectMapper objectMapper;
    
    @Value("${groq.api-key}")
    private String groqApiKey;
    
    @Value("${groq.api-url}")
    private String groqApiUrl;
    
    @Value("${groq.model}")
    private String groqModel;
    
    @Value("${groq.max-tokens}")
    private int maxTokens;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Transactional
    public HintResponse requestHint(HintRequest request, User user) {
        Problem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new RuntimeException("Problem not found"));
        
        ProblemStage stage = problemStageRepository.findByProblemIdAndStageType(
                problem.getId(), request.getStageType())
                .orElseThrow(() -> new RuntimeException("Problem stage not found"));
        
        // Check eligibility
        checkHintEligibility(user, problem, stage, request.getStageType());
        
        // Generate hint using Groq
        String hintText = generateHint(problem, request.getStageType(), 
                request.getUserCode(), request.getErrorMessage());
        
        // Get latest submission for reference
        List<Submission> submissions = submissionRepository.findByUserIdAndProblemIdAndStageType(
                user.getId(), problem.getId(), request.getStageType());
        Submission latestSubmission = submissions.isEmpty() ? null : submissions.get(submissions.size() - 1);
        
        // Save hint
        Hint hint = Hint.builder()
                .problem(problem)
                .user(user)
                .submission(latestSubmission)
                .stageType(request.getStageType())
                .hintText(hintText)
                .build();
        hint = hintRepository.save(hint);
        
        // Update user progress hint count
        UserProgress progress = userProgressRepository.findByUserIdAndProblemId(user.getId(), problem.getId())
                .orElseGet(() -> UserProgress.builder()
                        .user(user)
                        .problem(problem)
                        .build());
        progress.setTotalHintsUsed(progress.getTotalHintsUsed() + 1);
        userProgressRepository.save(progress);
        
        int totalHints = hintRepository.countByUserIdAndProblemIdAndStageType(
                user.getId(), problem.getId(), request.getStageType());
        
        return HintResponse.builder()
                .hintId(hint.getId())
                .hintText(hintText)
                .createdAt(hint.getCreatedAt())
                .totalHintsUsed(totalHints)
                .build();
    }
    
    private void checkHintEligibility(User user, Problem problem, ProblemStage stage, StageType stageType) {
        // Check attempt count
        int attemptCount = submissionRepository.countByUserIdAndProblemIdAndStageType(
                user.getId(), problem.getId(), stageType);
        
        if (attemptCount < stage.getMinAttemptsBeforeHint()) {
            throw new RuntimeException(
                    "You need at least " + stage.getMinAttemptsBeforeHint() + 
                    " attempts before requesting a hint. Current attempts: " + attemptCount);
        }
        
        // Check time elapsed since first attempt
        List<LocalDateTime> firstAttemptTimes = submissionRepository.findFirstAttemptTime(
                user.getId(), problem.getId(), stageType, PageRequest.of(0, 1));
        
        if (!firstAttemptTimes.isEmpty()) {
            LocalDateTime firstAttempt = firstAttemptTimes.get(0);
            long secondsElapsed = Duration.between(firstAttempt, LocalDateTime.now()).getSeconds();
            
            if (secondsElapsed < stage.getMinSecondsBeforeHint()) {
                throw new RuntimeException(
                        "You need to wait at least " + stage.getMinSecondsBeforeHint() + 
                        " seconds before requesting a hint. Time elapsed: " + secondsElapsed + " seconds");
            }
        }
    }
    
    private String generateHint(Problem problem, StageType stageType, String userCode, String errorMessage) {
        if (groqApiKey == null || groqApiKey.isEmpty()) {
            return getDefaultHint(stageType);
        }
        
        String prompt = buildPrompt(problem, stageType, userCode, errorMessage);
        
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", groqModel);
            requestBody.put("messages", List.of(
                    Map.of("role", "system", "content", 
                            "You are a helpful coding tutor. Provide hints and guidance to help students learn, " +
                            "but NEVER give the complete solution. Focus on teaching problem-solving approaches."),
                    Map.of("role", "user", "content", prompt)
            ));
            requestBody.put("max_tokens", maxTokens);
            requestBody.put("temperature", 0.7);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    groqApiUrl,
                    HttpMethod.POST,
                    entity,
                    JsonNode.class
            );
            
            if (response.getBody() != null && response.getBody().has("choices")) {
                JsonNode choices = response.getBody().get("choices");
                if (choices.isArray() && choices.size() > 0) {
                    return choices.get(0).get("message").get("content").asText();
                }
            }
            
            return getDefaultHint(stageType);
        } catch (Exception e) {
            log.error("Error calling Groq API: {}", e.getMessage());
            return getDefaultHint(stageType);
        }
    }
    
    private String buildPrompt(Problem problem, StageType stageType, String userCode, String errorMessage) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Problem: ").append(problem.getTitle()).append("\n\n");
        prompt.append("Description: ").append(truncate(problem.getDescription(), 500)).append("\n\n");
        prompt.append("Current Stage: ").append(stageType.name()).append("\n\n");
        
        if (userCode != null && !userCode.isEmpty()) {
            prompt.append("Student's Code:\n```\n").append(truncate(userCode, 1000)).append("\n```\n\n");
        }
        
        if (errorMessage != null && !errorMessage.isEmpty()) {
            prompt.append("Error/Issue: ").append(errorMessage).append("\n\n");
        }
        
        prompt.append("Based on the ").append(stageType.name().toLowerCase()).append(" stage, ");
        
        switch (stageType) {
            case BRUTE:
                prompt.append("provide a hint for a brute-force approach. ");
                prompt.append("Focus on the most straightforward solution, even if it's not efficient.");
                break;
            case IMPROVED:
                prompt.append("provide a hint for improving the solution. ");
                prompt.append("Suggest ways to optimize time or space complexity from the brute-force approach.");
                break;
            case OPTIMAL:
                prompt.append("provide a hint for the optimal solution. ");
                prompt.append("Guide towards the most efficient algorithm or data structure for this problem.");
                break;
        }
        
        prompt.append("\n\nIMPORTANT: Do NOT provide the complete solution code. ");
        prompt.append("Give conceptual hints and guide the student's thinking process.");
        
        return prompt.toString();
    }
    
    private String getDefaultHint(StageType stageType) {
        switch (stageType) {
            case BRUTE:
                return "Think about the most straightforward approach first. " +
                       "Consider using nested loops to check all possibilities. " +
                       "Don't worry about efficiency yet - focus on correctness.";
            case IMPROVED:
                return "Look for patterns in your brute-force solution. " +
                       "Can you eliminate redundant calculations? " +
                       "Consider using a hash map or sorting to speed things up.";
            case OPTIMAL:
                return "Think about the best possible time complexity for this problem. " +
                       "Are there any mathematical properties you can exploit? " +
                       "Consider advanced data structures or algorithms specific to this pattern.";
            default:
                return "Break down the problem into smaller steps. Start with the simplest case.";
        }
    }
    
    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        return text.length() > maxLength ? text.substring(0, maxLength) + "..." : text;
    }
}
