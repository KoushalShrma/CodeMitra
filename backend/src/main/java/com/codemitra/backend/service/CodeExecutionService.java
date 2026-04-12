package com.codemitra.backend.service;

import com.codemitra.backend.dto.ExecutionDtos;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Executes source code with Judge0 using RapidAPI when key is configured,
 * and falls back to public Judge0 endpoint when the key is blank.
 */
@Service
public class CodeExecutionService {

    private static final Map<String, Integer> JUDGE0_LANGUAGES = Map.of(
            "Python", 71,
            "JavaScript", 63,
            "C++", 54,
            "Java", 62
    );

    private static final int MAX_POLL_ATTEMPTS = 30;
    private static final long POLL_INTERVAL_MS = 1_000L;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();

    @Value("${judge0.rapidapi.key}")
    private String rapidApiKey;

    @Value("${judge0.rapidapi.host}")
    private String rapidApiHost;

    @Value("${judge0.fallback.endpoint}")
    private String fallbackEndpoint;

    /**
     * Returns the currently selected Judge0 endpoint so frontend can display provider diagnostics.
     */
    public Map<String, Object> getProvider() {
        return Map.of("endpoint", getJudge0Config().endpoint());
    }

    /**
     * Full execution flow:
     * 1) Validate request fields and language mapping
     * 2) Submit source to Judge0
     * 3) Poll by token until Judge0 marks run complete
     * 4) Normalize stdout/stderr/status into API-friendly response
     */
    public ExecutionResult execute(ExecutionDtos.ExecuteRequest request) {
        try {
            if (request.code() == null || request.code().isBlank()) {
                return new ExecutionResult(HttpStatus.BAD_REQUEST, Map.of(
                        "status", "error",
                        "stderr", "Missing required field: code",
                        "stdout", ""
                ));
            }

            Integer languageId = request.languageId();
            if (languageId == null && request.language() != null && !request.language().isBlank()) {
                languageId = JUDGE0_LANGUAGES.get(request.language());
            }
            if (languageId == null) {
                return new ExecutionResult(HttpStatus.BAD_REQUEST, Map.of(
                        "status", "error",
                        "stderr", "Missing or unsupported languageId",
                        "stdout", ""
                ));
            }

            Judge0Config config = getJudge0Config();

            Map<String, Object> body = new HashMap<>();
            body.put("language_id", languageId);
            body.put("source_code", request.code());
            if (request.stdin() != null && !request.stdin().isBlank()) {
                body.put("stdin", request.stdin());
            }

            HttpRequest.Builder submitBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(config.endpoint() + "/submissions?base64_encoded=false&wait=false"))
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)));
            config.headers().forEach(submitBuilder::header);

            HttpResponse<String> submitResponse = httpClient.send(submitBuilder.build(), HttpResponse.BodyHandlers.ofString());

            if (submitResponse.statusCode() < 200 || submitResponse.statusCode() >= 300) {
                return new ExecutionResult(HttpStatus.valueOf(submitResponse.statusCode()), Map.of(
                        "status", "error",
                        "message", "Judge0 submission failed",
                        "details", submitResponse.body()
                ));
            }

            JsonNode submitJson = objectMapper.readTree(submitResponse.body());
            String token = submitJson.path("token").asText("");
            if (token.isBlank()) {
                return new ExecutionResult(HttpStatus.INTERNAL_SERVER_ERROR, Map.of(
                        "status", "error",
                        "message", "Judge0 submission returned no token"
                ));
            }

            JsonNode result = null;
            int attempts = 0;
            while (attempts < MAX_POLL_ATTEMPTS) {
                Thread.sleep(POLL_INTERVAL_MS);

                HttpRequest.Builder statusBuilder = HttpRequest.newBuilder()
                        .uri(URI.create(config.endpoint() + "/submissions/" + token + "?base64_encoded=false"))
                        .timeout(Duration.ofSeconds(30))
                        .GET();
                config.headers().forEach(statusBuilder::header);

                HttpResponse<String> statusResponse = httpClient.send(statusBuilder.build(), HttpResponse.BodyHandlers.ofString());
                if (statusResponse.statusCode() < 200 || statusResponse.statusCode() >= 300) {
                    return new ExecutionResult(HttpStatus.valueOf(statusResponse.statusCode()), Map.of(
                            "status", "error",
                            "message", "Judge0 status check failed"
                    ));
                }

                result = objectMapper.readTree(statusResponse.body());
                int statusId = result.path("status").path("id").asInt(0);
                if (statusId > 2) {
                    break;
                }
                attempts++;
            }

            if (result == null) {
                return new ExecutionResult(HttpStatus.INTERNAL_SERVER_ERROR, Map.of(
                        "status", "error",
                        "message", "Judge0 execution timeout"
                ));
            }

            int statusId = result.path("status").path("id").asInt(0);
            String status;
            String stdout = trimOrDefault(result.path("stdout").asText(null), "");
            String stderr = trimOrDefault(result.path("stderr").asText(null), "");

            if (statusId == 3) {
                status = "Pass";
            } else {
                status = "Fail";
                if (stderr.isBlank()) {
                    stderr = trimOrDefault(result.path("compile_output").asText(null), "");
                }
                if (stderr.isBlank()) {
                    stderr = trimOrDefault(result.path("status").path("description").asText(null), "Execution error");
                }
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("stdout", stdout);
            payload.put("stderr", stderr);
            payload.put("status", status);
            return new ExecutionResult(HttpStatus.OK, payload);
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            return new ExecutionResult(HttpStatus.INTERNAL_SERVER_ERROR, Map.of(
                    "status", "error",
                    "stderr", "Execution interrupted",
                    "stdout", ""
            ));
        } catch (Exception ex) {
            return new ExecutionResult(HttpStatus.INTERNAL_SERVER_ERROR, Map.of(
                    "status", "error",
                    "stderr", "Internal server error during code execution",
                    "stdout", ""
            ));
        }
    }

    /**
     * Trims output text and falls back when Judge0 omits a field.
     */
    private String trimOrDefault(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    /**
     * Chooses RapidAPI endpoint when key is provided, otherwise public fallback endpoint.
     */
    private Judge0Config getJudge0Config() {
        if (rapidApiKey != null && !rapidApiKey.isBlank()) {
            Map<String, String> headers = new HashMap<>();
            headers.put("Content-Type", "application/json");
            headers.put("X-RapidAPI-Key", rapidApiKey);
            headers.put("X-RapidAPI-Host", rapidApiHost);
            return new Judge0Config("https://judge0-ce.p.rapidapi.com", headers);
        }

        return new Judge0Config(fallbackEndpoint, Map.of("Content-Type", "application/json"));
    }

    /**
     * Immutable endpoint/header bundle for Judge0 transport configuration.
     */
    private record Judge0Config(String endpoint, Map<String, String> headers) {
    }

    /**
     * Immutable controller response wrapper carrying HTTP status + payload body.
     */
    public record ExecutionResult(HttpStatus status, Map<String, Object> payload) {
    }
}
