package com.Backend_project.service;

import com.Backend_project.model.Project;
import com.Backend_project.model.User;
import com.Backend_project.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GitHubService {

    private static final Logger logger = LoggerFactory.getLogger(GitHubService.class);

    @Value("${github.api.token}")
    private String githubToken;

    @Value("${github.client.id}")
    private String clientId;

    @Value("${github.client.secret}")
    private String clientSecret;

    @Value("${github.redirect.uri}")
    private String redirectUri;

    private final RestTemplate restTemplate;
    private final UserRepository userRepository;
    private final String GITHUB_API_BASE_URL = "https://api.github.com";

    @Autowired
    public GitHubService(RestTemplate restTemplate, UserRepository userRepository) {
        this.restTemplate = restTemplate;
        this.userRepository = userRepository;
    }

    /**
     * Fetches and processes repository content, converting it to a JSON structure
     */
    public Map<String, Object> fetchRepositoryStructure(String owner, String repo, String branch) {
        try {
            String path = String.format("/repos/%s/%s/git/trees/%s", owner, repo, branch);
            Map<String, Object> treeData = fetchGitHubTree(path, true);
            return processGitHubTree(treeData);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch repository structure: " + e.getMessage());
        }
    }

    /**
     * Fetches tree data from GitHub API
     */
    private Map<String, Object> fetchGitHubTree(String path, boolean recursive) {
        URI uri = UriComponentsBuilder
                .fromUriString(GITHUB_API_BASE_URL)
                .path(path)
                .queryParam("recursive", recursive ? 1 : 0)
                .build()
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + githubToken);
        headers.set("Accept", "application/vnd.github.v3+json");

        RequestEntity<?> request = new RequestEntity<>(headers, HttpMethod.GET, uri);
        return restTemplate.exchange(request, Map.class).getBody();
    }

    /**
     * Processes GitHub tree data into our custom JSON structure
     */
    private Map<String, Object> processGitHubTree(Map<String, Object> treeData) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> tree = (List<Map<String, Object>>) treeData.get("tree");

        for (Map<String, Object> item : tree) {
            String path = (String) item.get("path");
            String type = (String) item.get("type");

            // Skip files/directories that are typically in .gitignore
            if (shouldSkipPath(path)) {
                continue;
            }

            // Process the path
            processPath(result, path, type, item);
        }

        return result;
    }

    /**
     * Checks if a path should be skipped (typically in .gitignore)
     */
    private boolean shouldSkipPath(String path) {
        List<String> skipPatterns = Arrays.asList(
                "node_modules/", ".git/", "target/", "build/",
                ".env", ".DS_Store", "*.log", "*.class",
                "dist/", "coverage/", ".next/");

        return skipPatterns.stream()
                .anyMatch(pattern -> {
                    if (pattern.endsWith("/")) {
                        return path.startsWith(pattern) || path.contains("/" + pattern);
                    }
                    return path.equals(pattern) || path.endsWith(pattern);
                });
    }

    /**
     * Processes a single path into the result structure
     */
    private void processPath(Map<String, Object> result, String path, String type, Map<String, Object> item) {
        String[] parts = path.split("/");
        Map<String, Object> current = result;

        for (int i = 0; i < parts.length; i++) {
            String part = parts[i];
            boolean isLast = i == parts.length - 1;

            if (!isLast) {
                current = (Map<String, Object>) current.computeIfAbsent(part, k -> new HashMap<String, Object>());
            } else {
                if ("tree".equals(type)) {
                    current.put(part, new HashMap<String, Object>());
                } else {
                    Map<String, Object> fileInfo = new HashMap<>();
                    fileInfo.put("type", "file");
                    fileInfo.put("size", item.get("size"));
                    fileInfo.put("sha", item.get("sha"));
                    current.put(part, fileInfo);
                }
            }
        }
    }

    public List<Map<String, Object>> getUserRepositories(String userId) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("User not found"));

        if (!user.isGithubConnected() || user.getGithubAccessToken() == null) {
            throw new Exception("GitHub account not connected");
        }

        try {
            String url = GITHUB_API_BASE_URL + "/user/repos?sort=updated&per_page=100";
            HttpHeaders headers = createGitHubHeaders(user.getGithubAccessToken());

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    });

            List<Map<String, Object>> repositories = response.getBody();
            return repositories.stream()
                    .map(repo -> {
                        Map<String, Object> simplifiedRepo = new HashMap<>();
                        simplifiedRepo.put("id", repo.get("id"));
                        simplifiedRepo.put("name", repo.get("name"));
                        simplifiedRepo.put("full_name", repo.get("full_name"));
                        simplifiedRepo.put("description", repo.get("description"));
                        simplifiedRepo.put("html_url", repo.get("html_url"));
                        simplifiedRepo.put("clone_url", repo.get("clone_url"));
                        simplifiedRepo.put("default_branch", repo.get("default_branch"));
                        simplifiedRepo.put("visibility", repo.get("visibility"));
                        simplifiedRepo.put("private", repo.get("private"));
                        simplifiedRepo.put("updated_at", repo.get("updated_at"));
                        simplifiedRepo.put("created_at", repo.get("created_at"));
                        simplifiedRepo.put("owner", ((Map<String, Object>) repo.get("owner")).get("login"));
                        return simplifiedRepo;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            // If the token is invalid, disconnect the GitHub account
            if (e.getMessage().contains("401") || e.getMessage().contains("Unauthorized")) {
                disconnectGitHub(userId);
                throw new Exception("GitHub token is invalid. Please reconnect your GitHub account.");
            }
            throw new Exception("Failed to fetch repositories: " + e.getMessage());
        }
    }

    public Map<String, Object> getRepositoryDetails(String userId, String repositoryId) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("User not found"));

        if (!user.isGithubConnected()) {
            throw new Exception("GitHub account not connected");
        }

        try {
            String token = ensureValidToken(user);
            String url = String.format(GITHUB_API_BASE_URL + "/repositories/%s", repositoryId);
            HttpHeaders headers = createGitHubHeaders(token);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class);

            Map<String, Object> repoMap = response.getBody();
            Map<String, Object> repository = new HashMap<>();
            repository.put("id", repoMap.get("id"));
            repository.put("name", repoMap.get("name"));
            repository.put("fullName", repoMap.get("full_name"));
            repository.put("owner", ((Map<String, Object>) repoMap.get("owner")).get("login"));
            repository.put("htmlUrl", repoMap.get("html_url"));
            repository.put("description", repoMap.get("description"));
            repository.put("private", repoMap.get("private"));
            repository.put("defaultBranch", repoMap.get("default_branch"));
            repository.put("createdAt", repoMap.get("created_at"));
            repository.put("updatedAt", repoMap.get("updated_at"));
            repository.put("language", repoMap.get("language"));
            repository.put("stargazersCount", repoMap.get("stargazers_count"));
            repository.put("forksCount", repoMap.get("forks_count"));

            return repository;
        } catch (Exception e) {
            if (e.getMessage().contains("401") || e.getMessage().contains("Unauthorized")) {
                disconnectGitHub(userId);
                throw new Exception("GitHub token is invalid. Please reconnect your GitHub account.");
            }
            throw e;
        }
    }

    public Map<String, Object> getGitHubStatus(String userId) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("User not found"));

        Map<String, Object> status = new HashMap<>();
        status.put("githubConnected", user.isGithubConnected());

        if (user.isGithubConnected()) {
            try {
                String url = GITHUB_API_BASE_URL + "/user";
                HttpHeaders headers = createGitHubHeaders(user.getGithubAccessToken());

                ResponseEntity<Map> response = restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        new HttpEntity<>(headers),
                        Map.class);

                Map<String, Object> githubUser = response.getBody();
                status.put("githubUsername", githubUser.get("login"));
                status.put("githubId", String.valueOf(githubUser.get("id")));
                status.put("avatarUrl", githubUser.get("avatar_url"));
                status.put("name", githubUser.get("name"));
                status.put("publicRepos", githubUser.get("public_repos"));
                status.put("followers", githubUser.get("followers"));
                status.put("following", githubUser.get("following"));
            } catch (Exception e) {
                // If we can't connect to GitHub, disconnect the account
                disconnectGitHub(userId);
                status.put("githubConnected", false);
                throw new Exception("Failed to connect to GitHub. Account has been disconnected.");
            }
        }

        return status;
    }

    private HttpHeaders createGitHubHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(githubToken);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        return headers;
    }

    public Map<String, Object> getRepositoryContents(String userId, String owner, String repo, String path, String ref)
            throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("User not found"));

        if (!user.isGithubConnected() || user.getGithubAccessToken() == null) {
            throw new Exception("GitHub account not connected or token not available");
        }

        String url = String.format("%s/repos/%s/%s/contents/%s", GITHUB_API_BASE_URL, owner, repo,
                path != null ? path : "");
        if (ref != null && !ref.isEmpty()) {
            url += "?ref=" + ref;
        }

        HttpHeaders headers = createGitHubHeaders(user.getGithubAccessToken());
        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class);

        return response.getBody();
    }

    private final Set<String> IGNORED_PATHS = new HashSet<>(Arrays.asList(
            "build", "dist", "node_modules", ".git", ".idea", ".vscode",
            "__pycache__", ".DS_Store", "*.pyc", "*.pyo", "*.pyd",
            "target", "bin", "obj", ".next", ".env", "venv",
            "coverage", ".coverage", ".pytest_cache", ".tox"));

    private boolean shouldIgnorePath(String path) {
        // Check if path or any parent directory should be ignored
        String[] parts = path.split("/");
        for (String part : parts) {
            if (IGNORED_PATHS.contains(part.toLowerCase())) {
                return true;
            }
        }
        // Check file extensions
        return path.endsWith(".pyc") || path.endsWith(".pyo") ||
                path.endsWith(".pyd") || path.endsWith(".DS_Store");
    }

    private Map<String, Object> transformTreeForFrontend(List<Map<String, Object>> items) {
        Map<String, Object> root = new HashMap<>();
        root.put("name", "root");
        root.put("type", "directory");
        root.put("children", new ArrayList<>());

        for (Map<String, Object> item : items) {
            String path = (String) item.get("path");

            // Skip ignored paths
            if (shouldIgnorePath(path)) {
                continue;
            }

            String type = (String) item.get("type");
            String[] parts = path.split("/");

            Map<String, Object> current = root;
            for (int i = 0; i < parts.length; i++) {
                String part = parts[i];
                List<Map<String, Object>> children = (List<Map<String, Object>>) current.get("children");

                if (i == parts.length - 1) {
                    // This is the actual file/directory
                    Map<String, Object> node = new HashMap<>();
                    node.put("name", part);
                    node.put("path", path);
                    node.put("type", type);
                    node.put("size", item.get("size"));
                    node.put("sha", item.get("sha"));
                    node.put("url", item.get("url"));

                    if (type.equals("tree")) {
                        node.put("children", new ArrayList<>());
                    }

                    children.add(node);
                } else {
                    // This is a parent directory
                    Map<String, Object> found = null;
                    for (Map<String, Object> child : children) {
                        if (child.get("name").equals(part)) {
                            found = child;
                            break;
                        }
                    }

                    if (found == null) {
                        found = new HashMap<>();
                        found.put("name", part);
                        found.put("path", String.join("/", Arrays.copyOfRange(parts, 0, i + 1)));
                        found.put("type", "tree");
                        found.put("children", new ArrayList<>());
                        children.add(found);
                    }

                    current = found;
                }
            }
        }

        return root;
    }

    public Map<String, Object> getRepositoryTree(String userId, String owner, String repo, String branch)
            throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("User not found"));

        if (!user.isGithubConnected()) {
            throw new Exception("GitHub account not connected");
        }

        HttpHeaders headers = createGitHubHeaders(user.getGithubAccessToken());
        headers.set("Accept", "application/vnd.github+json");
        headers.set("X-GitHub-Api-Version", "2022-11-28");

        try {
            // First get the reference using the correct format: refs/heads/{branch}
            String refUrl = String.format("%s/repos/%s/%s/git/refs/heads/%s",
                    GITHUB_API_BASE_URL, owner, repo, branch);

            ResponseEntity<Map<String, Object>> refResponse = restTemplate.exchange(
                    refUrl,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            // Extract commit SHA from reference
            Map<String, Object> refData = refResponse.getBody();
            Map<String, Object> object = (Map<String, Object>) refData.get("object");
            String commitSha = (String) object.get("sha");

            // Get the tree using the commit SHA
            String treeUrl = String.format("%s/repos/%s/%s/git/trees/%s?recursive=1",
                    GITHUB_API_BASE_URL, owner, repo, commitSha);

            ResponseEntity<Map<String, Object>> treeResponse = restTemplate.exchange(
                    treeUrl,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> treeData = treeResponse.getBody();
            List<Map<String, Object>> items = (List<Map<String, Object>>) treeData.get("tree");

            // Transform the flat tree into a hierarchical structure
            Map<String, Object> hierarchicalTree = transformTreeForFrontend(items);

            // Return both the raw data and the transformed tree
            Map<String, Object> result = new HashMap<>();
            result.put("sha", commitSha);
            result.put("tree", hierarchicalTree);

            return result;

        } catch (Exception e) {
            // If reference not found, try getting the default branch
            String repoUrl = String.format("%s/repos/%s/%s",
                    GITHUB_API_BASE_URL, owner, repo);

            ResponseEntity<Map<String, Object>> repoResponse = restTemplate.exchange(
                    repoUrl,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            Map<String, Object> repoData = repoResponse.getBody();
            String defaultBranch = (String) repoData.get("default_branch");

            // Try again with the default branch
            return getRepositoryTree(userId, owner, repo, defaultBranch);
        }
    }

    private HttpHeaders createGitHubHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.set("Accept", "application/vnd.github+json");
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        return headers;
    }

    public String getGitHubAuthUrl() {
        return String.format(
                "https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=repo,user",
                clientId,
                redirectUri);
    }

    public void disconnectGitHub(String userId) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("User not found"));

        // Revoke GitHub access token if it exists
        if (user.getGithubAccessToken() != null) {
            try {
                revokeGitHubToken(user.getGithubAccessToken());
            } catch (Exception e) {
                logger.error("Failed to revoke GitHub token: {}", e.getMessage());
            }
        }

        // Clear GitHub data using the helper method
        user.clearGithubData();
        userRepository.save(user);
    }

    private void revokeGitHubToken(String token) {
        String revokeUrl = "https://api.github.com/applications/" + clientId + "/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(clientId, clientSecret);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("access_token", token);

        restTemplate.exchange(
                revokeUrl,
                HttpMethod.DELETE,
                new HttpEntity<>(requestBody, headers),
                Void.class);
    }

    public Map<String, Object> handleGitHubCallback(String code, String state) throws Exception {
        try {
            // Exchange code for access token
            String tokenUrl = "https://github.com/login/oauth/access_token";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("client_id", clientId);
            requestBody.put("client_secret", clientSecret);
            requestBody.put("code", code);
            requestBody.put("redirect_uri", redirectUri);

            ResponseEntity<Map> tokenResponse = restTemplate.exchange(
                    tokenUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    Map.class);

            if (!tokenResponse.getStatusCode().is2xxSuccessful() || !tokenResponse.hasBody()) {
                throw new Exception("Failed to obtain access token from GitHub");
            }

            Map<String, Object> tokenData = tokenResponse.getBody();
            String accessToken = tokenData.get("access_token") != null ? tokenData.get("access_token").toString()
                    : null;
            String refreshToken = tokenData.get("refresh_token") != null ? tokenData.get("refresh_token").toString()
                    : null;
            String scope = tokenData.get("scope") != null ? tokenData.get("scope").toString() : null;

            // Handle expires_in which might be Integer or String
            long expiresIn = 8 * 60 * 60; // Default to 8 hours
            if (tokenData.containsKey("expires_in")) {
                Object rawExpiresIn = tokenData.get("expires_in");
                if (rawExpiresIn instanceof Integer) {
                    expiresIn = ((Integer) rawExpiresIn).longValue();
                } else if (rawExpiresIn instanceof String) {
                    expiresIn = Long.parseLong((String) rawExpiresIn);
                }
            }

            if (accessToken == null || accessToken.isEmpty()) {
                String error = tokenData.get("error") != null ? tokenData.get("error").toString() : null;
                String errorDescription = tokenData.get("error_description") != null
                        ? tokenData.get("error_description").toString()
                        : null;
                throw new Exception(errorDescription != null ? errorDescription : "Invalid response from GitHub");
            }

            // Get user data from GitHub
            String userUrl = GITHUB_API_BASE_URL + "/user";
            HttpHeaders userHeaders = createGitHubHeaders(accessToken);

            ResponseEntity<Map> userResponse = restTemplate.exchange(
                    userUrl,
                    HttpMethod.GET,
                    new HttpEntity<>(userHeaders),
                    Map.class);

            if (!userResponse.getStatusCode().is2xxSuccessful() || !userResponse.hasBody()) {
                throw new Exception("Failed to fetch user data from GitHub");
            }

            Map<String, Object> userData = userResponse.getBody();

            // Get user's email from GitHub
            String emailUrl = GITHUB_API_BASE_URL + "/user/emails";
            ResponseEntity<List<Map<String, Object>>> emailResponse = restTemplate.exchange(
                    emailUrl,
                    HttpMethod.GET,
                    new HttpEntity<>(userHeaders),
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    });

            String primaryEmail = null;
            if (emailResponse.getStatusCode().is2xxSuccessful() && emailResponse.getBody() != null) {
                // Find primary email
                for (Map<String, Object> email : emailResponse.getBody()) {
                    if (Boolean.TRUE.equals(email.get("primary")) && Boolean.TRUE.equals(email.get("verified"))) {
                        primaryEmail = (String) email.get("email");
                        break;
                    }
                }
            }

            // Get user ID and username
            Object rawId = userData.get("id");
            String githubId = rawId != null ? rawId.toString() : null;
            if (githubId == null) {
                throw new Exception("GitHub user ID is missing from response");
            }

            String githubUsername = (String) userData.get("login");
            if (githubUsername == null) {
                throw new Exception("GitHub username is missing from response");
            }

            // Get name and avatar URL
            String name = userData.get("name") != null ? userData.get("name").toString() : null;
            String avatarUrl = userData.get("avatar_url") != null ? userData.get("avatar_url").toString() : null;

            // Find or create user
            User user = userRepository.findByGithubId(githubId)
                    .orElseGet(() -> {
                        User newUser = new User();
                        newUser.setGithubId(githubId);
                        return newUser;
                    });

            // Update user GitHub data
            user.setGithubUsername(githubUsername);
            user.updateGithubToken(accessToken, refreshToken, expiresIn);
            user.setGithubConnected(true);
            user.setGithubAvatarUrl(avatarUrl);
            user.setGithubEmail(primaryEmail); // Use primary email if available
            user.setGithubName(name);
            user.setGithubScope(scope);

            // Save user
            userRepository.save(user);

            // Return user data
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("githubId", user.getGithubId());
            response.put("githubUsername", user.getGithubUsername());
            response.put("githubAvatarUrl", user.getGithubAvatarUrl());
            response.put("githubEmail", user.getGithubEmail());
            response.put("githubName", user.getGithubName());
            response.put("isConnected", true);
            response.put("scope", user.getGithubScope());
            response.put("expiresIn", expiresIn);

            return response;

        } catch (HttpClientErrorException e) {
            String errorBody = e.getResponseBodyAsString();
            throw new Exception("GitHub API error: " + errorBody);
        } catch (Exception e) {
            throw new Exception("Failed to process GitHub callback: " + e.getMessage());
        }
    }

    public List<Map<String, Object>> getRepositoryPullRequests(String userId, String owner, String repo)
            throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("User not found"));

        if (!user.isGithubConnected()) {
            throw new Exception("GitHub account not connected");
        }

        String url = String.format("%s/repos/%s/%s/pulls?state=all", GITHUB_API_BASE_URL, owner, repo);
        HttpHeaders headers = createGitHubHeaders(user.getGithubAccessToken());

        ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<List<Map<String, Object>>>() {
                });

        return response.getBody();
    }

    public Map<String, Object> getPullRequestContent(String userId, String owner, String repo, String pullNumber)
            throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("User not found"));

        if (!user.isGithubConnected()) {
            throw new Exception("GitHub account not connected");
        }

        // Get PR details first
        String prUrl = String.format("%s/repos/%s/%s/pulls/%s", GITHUB_API_BASE_URL, owner, repo, pullNumber);
        HttpHeaders headers = createGitHubHeaders(user.getGithubAccessToken());

        ResponseEntity<Map<String, Object>> prResponse = restTemplate.exchange(
                prUrl,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<Map<String, Object>>() {
                });

        Map<String, Object> prDetails = prResponse.getBody();

        // Get PR files
        String filesUrl = String.format("%s/repos/%s/%s/pulls/%s/files", GITHUB_API_BASE_URL, owner, repo, pullNumber);
        ResponseEntity<List<Map<String, Object>>> filesResponse = restTemplate.exchange(
                filesUrl,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<List<Map<String, Object>>>() {
                });

        // Combine PR details with files
        Map<String, Object> result = new HashMap<>();
        result.put("details", prDetails);
        result.put("files", filesResponse.getBody());

        // Get PR comments if any
        String commentsUrl = String.format("%s/repos/%s/%s/pulls/%s/comments", GITHUB_API_BASE_URL, owner, repo,
                pullNumber);
        ResponseEntity<List<Map<String, Object>>> commentsResponse = restTemplate.exchange(
                commentsUrl,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<List<Map<String, Object>>>() {
                });

        result.put("comments", commentsResponse.getBody());

        return result;
    }

    public Map<String, Object> getFileContent(String userId, String owner, String repo, String path, String branch)
            throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("User not found"));

        if (!user.isGithubConnected()) {
            throw new Exception("GitHub account not connected");
        }

        String url = String.format("%s/repos/%s/%s/contents/%s",
                GITHUB_API_BASE_URL, owner, repo, path);
        if (branch != null && !branch.isEmpty()) {
            url += "?ref=" + branch;
        }

        HttpHeaders headers = createGitHubHeaders(user.getGithubAccessToken());
        headers.set("Accept", "application/vnd.github.v3.raw");

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class);

            Map<String, Object> result = new HashMap<>();
            result.put("content", response.getBody());
            return result;
        } catch (HttpClientErrorException e) {
            throw new Exception("Failed to fetch file content: " + e.getMessage());
        }
    }

    public String refreshGitHubToken(User user) throws Exception {
        if (user.getGithubRefreshToken() == null) {
            throw new Exception("No refresh token available");
        }

        String tokenUrl = "https://github.com/login/oauth/access_token";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("client_id", clientId);
        requestBody.put("client_secret", clientSecret);
        requestBody.put("refresh_token", user.getGithubRefreshToken());
        requestBody.put("grant_type", "refresh_token");

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    tokenUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    Map.class);

            if (!response.getStatusCode().is2xxSuccessful() || !response.hasBody()) {
                throw new Exception("Failed to refresh token");
            }

            Map<String, String> tokenData = response.getBody();
            String newAccessToken = tokenData.get("access_token");
            String newRefreshToken = tokenData.get("refresh_token");
            String scope = tokenData.get("scope");
            long expiresIn = tokenData.containsKey("expires_in") ? Long.parseLong(tokenData.get("expires_in"))
                    : 8 * 60 * 60; // Default to 8 hours

            if (newAccessToken == null || newAccessToken.isEmpty()) {
                throw new Exception("Invalid response while refreshing token");
            }

            // Update user's token information
            user.updateGithubToken(newAccessToken, newRefreshToken, expiresIn);
            user.setGithubScope(scope);
            userRepository.save(user);

            return newAccessToken;
        } catch (Exception e) {
            logger.error("Failed to refresh GitHub token: {}", e.getMessage());
            throw new Exception("Failed to refresh GitHub token: " + e.getMessage());
        }
    }

    // Helper method to ensure valid token before API calls
    private String ensureValidToken(User user) throws Exception {
        if (user.isGithubTokenExpired()) {
            return refreshGitHubToken(user);
        }
        return user.getGithubAccessToken();
    }
}