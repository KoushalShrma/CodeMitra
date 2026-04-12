package com.codemitra.backend.service.scraper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.time.Duration;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Shared HTTP utility for scraper adapters with polite throttling and retry handling.
 */
@Component
public class ScraperHttpClient {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final OkHttpClient httpClient;

    @Value("${scraper.request.delay.ms:600}")
    private long requestDelayMs;

    @Value("${scraper.request.retries:2}")
    private int retryCount;

    private long lastRequestAt;

    public ScraperHttpClient() {
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(Duration.ofSeconds(8))
                .readTimeout(Duration.ofSeconds(15))
                .writeTimeout(Duration.ofSeconds(15))
                .build();
    }

    /**
     * Fetches a URL and parses it as HTML.
     */
    public Document getDocument(String url) throws IOException {
        String body = getBody(url);
        return Jsoup.parse(body, url);
    }

    /**
     * Fetches a URL and parses it as JSON tree.
     */
    public JsonNode getJson(String url) throws IOException {
        String body = getBody(url);
        return OBJECT_MAPPER.readTree(body);
    }

    /**
     * Fetches raw response body with retry and basic backoff.
     */
    public String getBody(String url) throws IOException {
        IOException lastFailure = null;
        int attempts = Math.max(0, retryCount) + 1;

        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                enforceRequestDelay();
                Request request = new Request.Builder()
                        .url(url)
                        .header("User-Agent", "CodeMitraScraper/1.0")
                        .header("Accept", "application/json, text/html, */*")
                        .build();

                try (Response response = httpClient.newCall(request).execute()) {
                    if (!response.isSuccessful()) {
                        throw new IOException("HTTP " + response.code() + " for " + url);
                    }
                    if (response.body() == null) {
                        throw new IOException("Empty response body for " + url);
                    }
                    return response.body().string();
                }
            } catch (IOException ex) {
                lastFailure = ex;
                if (attempt < attempts) {
                    sleepQuietly((long) (300L * Math.pow(2, attempt - 1)));
                }
            }
        }

        throw lastFailure == null ? new IOException("Unknown scraper client error") : lastFailure;
    }

    private synchronized void enforceRequestDelay() {
        long now = System.currentTimeMillis();
        long elapsed = now - lastRequestAt;
        long delay = Math.max(requestDelayMs - elapsed, 0L);
        if (delay > 0) {
            sleepQuietly(delay);
        }
        lastRequestAt = System.currentTimeMillis();
    }

    private void sleepQuietly(long millis) {
        try {
            Thread.sleep(Math.max(0L, millis));
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }
}
