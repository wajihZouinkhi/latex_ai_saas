package com.Backend_project.controller;

import com.Backend_project.dto.ApiResponse;
import com.Backend_project.service.GitHubService;
import com.Backend_project.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.view.RedirectView;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.util.UriComponentsBuilder;
import java.util.function.Function;

@RestController
@RequestMapping("/api/github")
public class GitHubController {

    private static final Logger logger = LoggerFactory.getLogger(GitHubController.class);

    @Autowired
    private GitHubService gitHubService;

    @Autowired
    private JwtService jwtService;

    @Value("${frontend.url}")
    private String frontendUrl;

    private String getUserIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtService.extractUserId(token);
        }
        throw new RuntimeException("No authorization token found");
    }

    @GetMapping("/auth/url")
    public ResponseEntity<ApiResponse> getGitHubAuthUrl() {
        try {
            String authUrl = gitHubService.getGitHubAuthUrl();
            Map<String, Object> data = new HashMap<>();
            data.put("url", authUrl);
            return ResponseEntity.ok(ApiResponse.success("GitHub auth URL retrieved successfully", data));
        } catch (Exception e) {
            logger.error("Failed to retrieve GitHub auth URL: {}", e.getMessage(), e);
            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to retrieve GitHub auth URL", errors));
        }
    }

    @GetMapping("/auth/callback")
    public RedirectView handleGitHubCallback(
            @RequestParam("code") String code,
            @RequestParam(value = "state", required = false) String state) {
        try {
            logger.info("Received GitHub callback with code");
            Map<String, Object> userData = gitHubService.handleGitHubCallback(code, state);

            // Generate new JWT token with GitHub info
            String userId = (String) userData.get("id");
            Map<String, Object> tokenData = new HashMap<>(userData);
            tokenData.put("githubConnected", true);
            tokenData.put("githubUsername", userData.get("githubUsername"));
            tokenData.put("githubAvatarUrl", userData.get("githubAvatarUrl"));
            tokenData.put("githubName", userData.get("githubName"));
            tokenData.put("githubEmail", userData.get("githubEmail"));
            tokenData.put("publicRepos", userData.get("publicRepos"));
            tokenData.put("followers", userData.get("followers"));
            tokenData.put("following", userData.get("following"));

            String newToken = jwtService.generateTokenWithClaims(userId, tokenData);

            // Helper method to safely encode strings
            Function<Object, String> safeEncode = (value) -> {
                if (value == null)
                    return "";
                String strValue = String.valueOf(value);
                try {
                    return URLEncoder.encode(strValue, StandardCharsets.UTF_8);
                } catch (Exception e) {
                    logger.warn("Failed to encode value: {}", strValue);
                    return "";
                }
            };

            // Create success URL pointing to settings page with all GitHub info
            String successUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                    .path("/settings/github")
                    .queryParam("success", true)
                    .queryParam("token", newToken)
                    .queryParam("githubConnected", true)
                    .queryParam("githubUsername", userData.getOrDefault("githubUsername", ""))
                    .queryParam("githubAvatarUrl", safeEncode.apply(userData.get("githubAvatarUrl")))
                    .queryParam("githubName", safeEncode.apply(userData.get("githubName")))
                    .queryParam("githubEmail", safeEncode.apply(userData.get("githubEmail")))
                    .queryParam("publicRepos", userData.getOrDefault("publicRepos", 0))
                    .queryParam("followers", userData.getOrDefault("followers", 0))
                    .queryParam("following", userData.getOrDefault("following", 0))
                    .build(false) // Set encode to false since we're manually encoding sensitive parameters
                    .toString();

            logger.info("Redirecting to GitHub settings page with new token and GitHub info");
            return new RedirectView(successUrl);

        } catch (Exception e) {
            logger.error("GitHub authentication failed: {}", e.getMessage(), e);

            // Create error URL pointing to settings page
            String errorUrl = String.format("%s/settings/github?error=%s",
                    frontendUrl,
                    URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));

            return new RedirectView(errorUrl);
        }
    }

    private String mapToQueryParams(Map<String, Object> params) {
        return params.entrySet().stream()
                .map(entry -> {
                    String key = URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8);
                    String value = URLEncoder.encode(
                            entry.getValue() != null ? entry.getValue().toString() : "",
                            StandardCharsets.UTF_8);
                    return key + "=" + value;
                })
                .reduce((p1, p2) -> p1 + "&" + p2)
                .orElse("");
    }

    @GetMapping("/user/status")
    public ResponseEntity<ApiResponse> getGitHubStatus(HttpServletRequest request) {
        try {
            String userId = getUserIdFromToken(request);
            Map<String, Object> status = gitHubService.getGitHubStatus(userId);
            Map<String, Object> data = new HashMap<>();
            data.put("status", status);
            return ResponseEntity.ok(ApiResponse.success("GitHub status retrieved successfully", data));
        } catch (Exception e) {
            logger.error("Failed to retrieve GitHub status: {}", e.getMessage(), e);
            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to retrieve GitHub status", errors));
        }
    }

    @GetMapping("/repositories")
    public ResponseEntity<ApiResponse> getUserRepositories(HttpServletRequest request) {
        try {
            String userId = getUserIdFromToken(request);
            List<Map<String, Object>> repositories = gitHubService.getUserRepositories(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("repositories", repositories);
            return ResponseEntity.ok(ApiResponse.success("Repositories retrieved successfully", response));
        } catch (Exception e) {
            logger.error("Failed to retrieve repositories: {}", e.getMessage(), e);
            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Failed to retrieve repositories", errors));
        }
    }

    @GetMapping("/repository/{repositoryId}")
    public ResponseEntity<ApiResponse> getRepositoryDetails(
            HttpServletRequest request,
            @PathVariable String repositoryId) {
        try {
            String userId = getUserIdFromToken(request);
            Map<String, Object> repository = gitHubService.getRepositoryDetails(userId, repositoryId);
            Map<String, Object> data = new HashMap<>();
            data.put("repository", repository);
            return ResponseEntity.ok(ApiResponse.success("Repository details retrieved successfully", data));
        } catch (Exception e) {
            logger.error("Failed to retrieve repository {}: {}", repositoryId, e.getMessage(), e);
            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            errors.put("repositoryId", repositoryId);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to retrieve repository details", errors));
        }
    }

    @GetMapping("/repos/{owner}/{repo}/contents")
    public ResponseEntity<ApiResponse> getRepositoryContents(
            HttpServletRequest request,
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam(required = false) String path,
            @RequestParam(required = false) String ref) {
        try {
            String userId = getUserIdFromToken(request);
            Map<String, Object> contents = gitHubService.getRepositoryContents(userId, owner, repo, path, ref);
            Map<String, Object> data = new HashMap<>();
            data.put("contents", contents);
            return ResponseEntity.ok(ApiResponse.success("Repository contents retrieved successfully", data));
        } catch (Exception e) {
            logger.error("Failed to retrieve contents for repository {}/{}: {}",
                    owner, repo, e.getMessage(), e);
            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            errors.put("owner", owner);
            errors.put("repo", repo);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to retrieve repository contents", errors));
        }
    }

    @GetMapping("/repos/{owner}/{repo}/tree")
    public ResponseEntity<ApiResponse> getRepositoryTree(
            HttpServletRequest request,
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam String branch) {
        try {
            String userId = getUserIdFromToken(request);
            Map<String, Object> tree = gitHubService.getRepositoryTree(userId, owner, repo, branch);
            Map<String, Object> data = new HashMap<>();
            data.put("tree", tree);
            return ResponseEntity.ok(ApiResponse.success("Repository tree retrieved successfully", data));
        } catch (Exception e) {
            logger.error("Failed to retrieve tree for repository {}/{}: {}",
                    owner, repo, e.getMessage(), e);
            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            errors.put("owner", owner);
            errors.put("repo", repo);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to retrieve repository tree", errors));
        }
    }

    @PostMapping("/disconnect")
    public ResponseEntity<ApiResponse> disconnectGitHub(HttpServletRequest request) {
        try {
            String userId = getUserIdFromToken(request);
            gitHubService.disconnectGitHub(userId);

            Map<String, Object> data = new HashMap<>();
            data.put("isConnected", false);

            logger.info("GitHub account disconnected successfully for user: {}", userId);
            return ResponseEntity.ok(ApiResponse.success("GitHub account disconnected successfully", data));

        } catch (Exception e) {
            logger.error("Failed to disconnect GitHub account: {}", e.getMessage(), e);

            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            errors.put("type", "GITHUB_DISCONNECT_ERROR");

            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to disconnect GitHub account", errors));
        }
    }
}