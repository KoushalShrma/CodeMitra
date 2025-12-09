package com.codemitra.service;

import com.codemitra.dto.RunCodeRequest;
import com.codemitra.dto.RunCodeResponse;
import com.codemitra.dto.SubmissionDTO;
import com.codemitra.model.*;
import com.codemitra.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodeExecutionService {
    
    private final ProblemRepository problemRepository;
    private final SubmissionRepository submissionRepository;
    private final UserProgressRepository userProgressRepository;
    private final ObjectMapper objectMapper;
    
    @Value("${piston.api-url}")
    private String pistonApiUrl;
    
    @Value("${piston.timeout-seconds}")
    private int timeoutSeconds;
    
    @Value("${piston.max-code-length}")
    private int maxCodeLength;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    // Language mapping for Piston API
    private static final Map<String, String> LANGUAGE_MAP = Map.of(
            "python", "python",
            "python3", "python",
            "java", "java",
            "javascript", "javascript",
            "js", "javascript",
            "cpp", "c++",
            "c++", "c++",
            "c", "c"
    );
    
    private static final Map<String, String> LANGUAGE_VERSION = Map.of(
            "python", "3.10.0",
            "java", "15.0.2",
            "javascript", "18.15.0",
            "c++", "10.2.0",
            "c", "10.2.0"
    );
    
    @Transactional
    public RunCodeResponse runCode(RunCodeRequest request, User user) {
        // Validate code length
        if (request.getCode().length() > maxCodeLength) {
            return RunCodeResponse.builder()
                    .status(SubmissionStatus.ERROR)
                    .stderr("Code exceeds maximum length of " + maxCodeLength + " characters")
                    .build();
        }
        
        // Get problem
        Problem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new RuntimeException("Problem not found"));
        
        // Execute code
        String mode = request.getMode() != null ? request.getMode() : "SAMPLE";
        List<SubmissionDTO.TestResult> testResults;
        
        if ("SAMPLE".equalsIgnoreCase(mode)) {
            testResults = runSampleTest(request.getLanguage(), request.getCode(), 
                    problem.getSampleInput(), problem.getSampleOutput());
        } else {
            testResults = runAllTests(request.getLanguage(), request.getCode(), problem);
        }
        
        // Determine status
        SubmissionStatus status = testResults.stream().allMatch(SubmissionDTO.TestResult::isPassed) 
                ? SubmissionStatus.PASSED 
                : SubmissionStatus.FAILED;
        
        // Calculate runtime (from first test)
        Long runtimeMs = testResults.isEmpty() ? null : 100L; // Placeholder
        
        // Save submission
        Submission submission = Submission.builder()
                .user(user)
                .problem(problem)
                .stageType(request.getStageType())
                .language(request.getLanguage())
                .code(request.getCode())
                .status(status)
                .runtimeMs(runtimeMs)
                .testResultJson(serializeTestResults(testResults))
                .stdout(testResults.isEmpty() ? "" : testResults.get(0).getActualOutput())
                .stderr("")
                .build();
        
        if (request.getTestId() != null) {
            // Link to test if this is a test submission
            submission.setTest(null); // Would need to fetch test entity
        }
        
        submission = submissionRepository.save(submission);
        
        // Update user progress if passed
        boolean stageCompleted = false;
        if (status == SubmissionStatus.PASSED && "FULL".equalsIgnoreCase(mode)) {
            stageCompleted = updateUserProgress(user, problem, request.getStageType());
        }
        
        return RunCodeResponse.builder()
                .status(status)
                .stdout(submission.getStdout())
                .stderr(submission.getStderr())
                .runtimeMs(runtimeMs)
                .testResults(testResults)
                .submissionId(submission.getId())
                .stageCompleted(stageCompleted)
                .build();
    }
    
    private List<SubmissionDTO.TestResult> runSampleTest(String language, String code, String input, String expectedOutput) {
        List<SubmissionDTO.TestResult> results = new ArrayList<>();
        
        try {
            String actualOutput = executeCode(language, code, input);
            boolean passed = normalizeOutput(actualOutput).equals(normalizeOutput(expectedOutput));
            
            results.add(SubmissionDTO.TestResult.builder()
                    .testCaseNumber(1)
                    .passed(passed)
                    .input(input)
                    .expectedOutput(expectedOutput)
                    .actualOutput(actualOutput)
                    .message(passed ? "Correct!" : "Wrong answer")
                    .build());
        } catch (Exception e) {
            log.error("Error executing code: {}", e.getMessage());
            results.add(SubmissionDTO.TestResult.builder()
                    .testCaseNumber(1)
                    .passed(false)
                    .input(input)
                    .expectedOutput(expectedOutput)
                    .actualOutput("")
                    .message("Runtime error: " + e.getMessage())
                    .build());
        }
        
        return results;
    }
    
    private List<SubmissionDTO.TestResult> runAllTests(String language, String code, Problem problem) {
        List<SubmissionDTO.TestResult> results = new ArrayList<>();
        
        // Run sample test first
        results.addAll(runSampleTest(language, code, problem.getSampleInput(), problem.getSampleOutput()));
        
        // Run hidden tests
        if (problem.getHiddenTestCases() != null && !problem.getHiddenTestCases().isEmpty()) {
            try {
                List<Map<String, String>> hiddenTests = objectMapper.readValue(
                        problem.getHiddenTestCases(), 
                        new TypeReference<List<Map<String, String>>>() {}
                );
                
                int testNumber = 2;
                for (Map<String, String> testCase : hiddenTests) {
                    String input = testCase.get("input");
                    String expectedOutput = testCase.get("output");
                    
                    try {
                        String actualOutput = executeCode(language, code, input);
                        boolean passed = normalizeOutput(actualOutput).equals(normalizeOutput(expectedOutput));
                        
                        results.add(SubmissionDTO.TestResult.builder()
                                .testCaseNumber(testNumber++)
                                .passed(passed)
                                .input("Hidden")
                                .expectedOutput("Hidden")
                                .actualOutput(passed ? "Correct" : "Wrong answer")
                                .message(passed ? "Correct!" : "Wrong answer")
                                .build());
                    } catch (Exception e) {
                        results.add(SubmissionDTO.TestResult.builder()
                                .testCaseNumber(testNumber++)
                                .passed(false)
                                .input("Hidden")
                                .expectedOutput("Hidden")
                                .actualOutput("")
                                .message("Runtime error")
                                .build());
                    }
                }
            } catch (JsonProcessingException e) {
                log.error("Error parsing hidden test cases: {}", e.getMessage());
            }
        }
        
        return results;
    }
    
    private String executeCode(String language, String code, String stdin) {
        String pistonLanguage = LANGUAGE_MAP.getOrDefault(language.toLowerCase(), "python");
        String version = LANGUAGE_VERSION.getOrDefault(pistonLanguage, "3.10.0");
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("language", pistonLanguage);
        requestBody.put("version", version);
        requestBody.put("files", List.of(Map.of("content", code)));
        requestBody.put("stdin", stdin != null ? stdin : "");
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        
        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    pistonApiUrl + "/execute",
                    HttpMethod.POST,
                    entity,
                    JsonNode.class
            );
            
            if (response.getBody() != null && response.getBody().has("run")) {
                JsonNode runNode = response.getBody().get("run");
                if (runNode.has("stderr") && !runNode.get("stderr").asText().isEmpty()) {
                    throw new RuntimeException(runNode.get("stderr").asText());
                }
                return runNode.has("stdout") ? runNode.get("stdout").asText() : "";
            }
            
            return "";
        } catch (Exception e) {
            log.error("Piston API error: {}", e.getMessage());
            throw new RuntimeException("Code execution failed: " + e.getMessage());
        }
    }
    
    private String normalizeOutput(String output) {
        if (output == null) return "";
        return output.trim().replaceAll("\\r\\n", "\n").replaceAll("\\r", "\n");
    }
    
    private String serializeTestResults(List<SubmissionDTO.TestResult> results) {
        try {
            return objectMapper.writeValueAsString(results);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
    
    @Transactional
    private boolean updateUserProgress(User user, Problem problem, StageType stageType) {
        UserProgress progress = userProgressRepository.findByUserIdAndProblemId(user.getId(), problem.getId())
                .orElseGet(() -> UserProgress.builder()
                        .user(user)
                        .problem(problem)
                        .firstAttemptAt(LocalDateTime.now())
                        .build());
        
        boolean newCompletion = false;
        LocalDateTime now = LocalDateTime.now();
        
        switch (stageType) {
            case BRUTE:
                if (!progress.getBruteCompleted()) {
                    progress.setBruteCompleted(true);
                    progress.setBruteCompletedAt(now);
                    newCompletion = true;
                }
                break;
            case IMPROVED:
                if (!progress.getImprovedCompleted()) {
                    progress.setImprovedCompleted(true);
                    progress.setImprovedCompletedAt(now);
                    newCompletion = true;
                }
                break;
            case OPTIMAL:
                if (!progress.getOptimalCompleted()) {
                    progress.setOptimalCompleted(true);
                    progress.setOptimalCompletedAt(now);
                    newCompletion = true;
                }
                break;
        }
        
        progress.setTotalAttempts(progress.getTotalAttempts() + 1);
        userProgressRepository.save(progress);
        
        return newCompletion;
    }
}
