package com.codemitra.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Backend proxy for Groq chat completions so browser clients never need to expose server-only API keys.
 */
@Service
public class GroqService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.model}")
    private String groqModel;

    /**
     * Forwards user/system chat messages to Groq and returns normalized assistant output.
     */
    public ChatProxyResult chat(ChatProxyRequest request) {
        try {
            if (groqApiKey == null || groqApiKey.isBlank()) {
                return new ChatProxyResult(HttpStatus.BAD_REQUEST, Map.of(
                        "message", "GROQ_API_KEY is not configured"
                ), request == null ? groqModel : request.model(), 0, 0);
            }

            if (request == null || request.messages() == null || request.messages().isEmpty()) {
                return new ChatProxyResult(HttpStatus.BAD_REQUEST, Map.of(
                        "message", "messages is required"
                ), request == null ? groqModel : request.model(), 0, 0);
            }

            String modelName = request.model() == null || request.model().isBlank() ? groqModel : request.model();

            Map<String, Object> body = new HashMap<>();
            body.put("model", modelName);
            body.put("messages", request.messages());
            body.put("temperature", request.temperature() == null ? 0.3 : request.temperature());
            body.put("max_tokens", request.maxTokens() == null ? 500 : request.maxTokens());

            HttpRequest groqRequest = HttpRequest.newBuilder()
                    .uri(URI.create(groqApiUrl))
                    .timeout(Duration.ofSeconds(40))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> groqResponse = httpClient.send(groqRequest, HttpResponse.BodyHandlers.ofString());
            if (groqResponse.statusCode() < 200 || groqResponse.statusCode() >= 300) {
                return new ChatProxyResult(HttpStatus.valueOf(groqResponse.statusCode()), Map.of(
                        "message", "Groq request failed",
                        "details", groqResponse.body()
                ), modelName, 0, 0);
            }

            JsonNode payload = objectMapper.readTree(groqResponse.body());
            String content = payload.path("choices").path(0).path("message").path("content").asText("").trim();
            int promptTokens = payload.path("usage").path("prompt_tokens").asInt(0);
            int completionTokens = payload.path("usage").path("completion_tokens").asInt(0);

            Map<String, Object> response = new HashMap<>();
            response.put("content", content);
            response.put("raw", payload);
            return new ChatProxyResult(HttpStatus.OK, response, modelName, promptTokens, completionTokens);
        } catch (Exception ex) {
            String fallbackModel = (request == null || request.model() == null || request.model().isBlank())
                    ? groqModel
                    : request.model();
            return new ChatProxyResult(HttpStatus.INTERNAL_SERVER_ERROR, Map.of(
                    "message", "Groq proxy request failed",
                    "details", ex.getMessage()
            ), fallbackModel, 0, 0);
        }
    }

    /**
     * Request DTO for chat proxy calls.
     */
    public record ChatProxyRequest(
            List<Map<String, Object>> messages,
            String model,
            Double temperature,
            Integer maxTokens
    ) {
    }

    /**
     * Result wrapper containing http status and payload map for controller mapping.
     */
    public record ChatProxyResult(
            HttpStatus status,
            Map<String, Object> payload,
            String modelUsed,
            int inputTokens,
            int outputTokens
    ) {
    }
}
