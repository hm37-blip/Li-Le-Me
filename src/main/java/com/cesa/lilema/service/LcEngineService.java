package com.cesa.lilema.service;

import com.cesa.lilema.dto.LcUserStats;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class LcEngineService {

    private static final String LC_GRAPHQL_URL = "https://leetcode.com/graphql";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Build common headers required to reach LeetCode's GraphQL endpoint.
     */
    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Referer", "https://leetcode.com");
        headers.set("User-Agent", "Mozilla/5.0");
        return headers;
    }

    /**
     * Fetch LeetCode statistics for the given username.
     * Retried up to 3 times with a 1-second back-off on any exception.
     *
     * @param lcUsername the LeetCode username to query
     * @return populated {@link LcUserStats}
     */
    @Retryable(retryFor = Exception.class, maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public LcUserStats fetchStats(String lcUsername) throws Exception {
        log.debug("Fetching LC stats for user: {}", lcUsername);

        // --- Step 1: validate user exists ---
        String validateBody = String.format(
                "{\"query\":\"query getUserProfile($username: String!) { matchedUser(username: $username) { username } }\","
                        + "\"variables\":{\"username\":\"%s\"}}",
                lcUsername);

        HttpEntity<String> validateRequest = new HttpEntity<>(validateBody, buildHeaders());
        ResponseEntity<String> validateResponse =
                restTemplate.postForEntity(LC_GRAPHQL_URL, validateRequest, String.class);

        JsonNode validateRoot = objectMapper.readTree(validateResponse.getBody());
        JsonNode matchedUser = validateRoot.path("data").path("matchedUser");
        if (matchedUser.isNull() || matchedUser.isMissingNode()) {
            throw new RuntimeException("LeetCode user not found: " + lcUsername);
        }

        // Polite delay between requests
        Thread.sleep(500);

        // --- Step 2: fetch submission stats ---
        String statsBody = String.format(
                "{\"query\":\"query getUserStats($username: String!) { matchedUser(username: $username) { submitStats { acSubmissionNum { difficulty count } } } }\","
                        + "\"variables\":{\"username\":\"%s\"}}",
                lcUsername);

        HttpEntity<String> statsRequest = new HttpEntity<>(statsBody, buildHeaders());
        ResponseEntity<String> statsResponse =
                restTemplate.postForEntity(LC_GRAPHQL_URL, statsRequest, String.class);

        JsonNode statsRoot = objectMapper.readTree(statsResponse.getBody());
        JsonNode acSubmissionNum = statsRoot
                .path("data")
                .path("matchedUser")
                .path("submitStats")
                .path("acSubmissionNum");

        // --- Step 3: parse the acSubmissionNum array ---
        LcUserStats stats = new LcUserStats();
        if (acSubmissionNum.isArray()) {
            for (JsonNode entry : acSubmissionNum) {
                String difficulty = entry.path("difficulty").asText();
                int count = entry.path("count").asInt(0);
                switch (difficulty) {
                    case "All"    -> stats.setTotalSolved(count);
                    case "Easy"   -> stats.setEasySolved(count);
                    case "Medium" -> stats.setMediumSolved(count);
                    case "Hard"   -> stats.setHardSolved(count);
                    default       -> log.warn("Unknown difficulty level: {}", difficulty);
                }
            }
        }

        log.debug("LC stats for {}: total={}, easy={}, medium={}, hard={}",
                lcUsername, stats.getTotalSolved(), stats.getEasySolved(),
                stats.getMediumSolved(), stats.getHardSolved());

        return stats;
    }

    /**
     * Recovery method called after all retry attempts are exhausted.
     * Always re-throws so the caller knows the fetch failed.
     *
     * @param e          the last exception from the final retry attempt
     * @param lcUsername the username that was being queried
     */
    @Recover
    public LcUserStats recoverFetchStats(Exception e, String lcUsername) {
        log.error("All retry attempts exhausted for LC user: {}. Error: {}", lcUsername, e.getMessage());
        throw new RuntimeException("LC fetch failed for: " + lcUsername, e);
    }
}
