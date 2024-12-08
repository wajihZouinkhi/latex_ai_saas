package com.Backend_project.service;

import com.Backend_project.model.Project;
import com.Backend_project.repository.ProjectRepository;
import com.Backend_project.model.ProjectFile;
import com.Backend_project.repository.ProjectFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.Optional;

@Service
public class ProjectService {
    private static final Logger logger = LoggerFactory.getLogger(ProjectService.class);

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private GitHubService gitHubService;

    @Autowired
    private ProjectFileRepository projectFileRepository;

    public List<Project> getUserProjects(String userId) {
        return projectRepository.findByUserId(userId);
    }

    public Project createProject(Project project) {
        project.setCreatedAt(new Date());
        project.setUpdatedAt(new Date());
        project.setStatus("ACTIVE");
        project.setAccessible(true);
        return projectRepository.save(project);
    }

    public Project createProjectFromRepository(String userId, String repositoryId) throws Exception {
        // Create initial project with PENDING status
        Project project = new Project();
        project.setUserId(userId);
        project.setRepositoryId(repositoryId);
        project.setStatus("PENDING");
        project.setAccessible(false);
        project.setCreatedAt(new Date());
        project.setUpdatedAt(new Date());

        // Get repository details from GitHub
        Map<String, Object> repoDetails = gitHubService.getRepositoryDetails(userId, repositoryId);
        project.setRepositoryName((String) repoDetails.get("name"));
        project.setRepositoryOwner((String) repoDetails.get("owner"));
        project.setDefaultBranch((String) repoDetails.get("default_branch"));

        // Save initial project
        project = projectRepository.save(project);

        // Start async process to fetch repository content
        processRepositoryContent(project.getId(), userId, repositoryId);

        return project;
    }

    public Project updateProject(String userId, String projectId, Project updatedProject) throws Exception {
        Project project = getProject(userId, projectId);

        // Update allowed fields
        if (updatedProject.getStatus() != null) {
            project.setStatus(updatedProject.getStatus());
        }
        project.setUpdatedAt(new Date());

        return projectRepository.save(project);
    }

    public void deleteProject(String userId, String projectId) throws Exception {
        Project project = getProject(userId, projectId);
        projectRepository.delete(project);
    }

    public Project getProject(String userId, String projectId) throws Exception {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new Exception("Project not found"));

        if (!project.getUserId().equals(userId)) {
            throw new Exception("Unauthorized access to project");
        }

        // Enrich file tree with cached contents
        if (project.getFileTree() != null) {
            Map<String, Object> enrichedFileTree = enrichFileTreeWithContent(project.getFileTree(), projectId);
            project.setFileTree(enrichedFileTree);
        }

        return project;
    }

    public Project getProjectStatus(String userId, String projectId) throws Exception {
        return getProject(userId, projectId);
    }

    public Project resyncRepository(String userId, String projectId) throws Exception {
        Project project = getProject(userId, projectId);

        // Clear cached files when resyncing
        projectFileRepository.deleteByProjectId(projectId);

        project.setStatus("PENDING");
        project.setAccessible(false);
        project.setUpdatedAt(new Date());
        Project savedProject = projectRepository.save(project);

        processRepositoryContent(projectId, userId, project.getRepositoryId());

        return savedProject;
    }

    @Async
    protected void processRepositoryContent(String projectId, String userId, String repositoryId) {
        try {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new Exception("Project not found"));

            // Get repository content including PRs
            Map<String, Object> repoContent = new HashMap<>();

            // Get main branch content
            Map<String, Object> mainContent = gitHubService.getRepositoryTree(
                    userId,
                    project.getRepositoryOwner(),
                    project.getRepositoryName(),
                    project.getDefaultBranch());
            repoContent.put("main", mainContent);

            // Get pull requests
            List<Map<String, Object>> pullRequests = gitHubService.getRepositoryPullRequests(
                    userId,
                    project.getRepositoryOwner(),
                    project.getRepositoryName());

            // Process each PR and get its content
            List<Map<String, Object>> processedPRs = new ArrayList<>();
            for (Map<String, Object> pr : pullRequests) {
                try {
                    String prNumber = String.valueOf(pr.get("number"));
                    Map<String, Object> prContent = gitHubService.getPullRequestContent(
                            userId,
                            project.getRepositoryOwner(),
                            project.getRepositoryName(),
                            prNumber);

                    Map<String, Object> processedPR = new HashMap<>();
                    processedPR.put("number", prNumber);
                    processedPR.put("title", pr.get("title"));
                    processedPR.put("state", pr.get("state"));
                    processedPR.put("user", pr.get("user"));
                    processedPR.put("created_at", pr.get("created_at"));
                    processedPR.put("updated_at", pr.get("updated_at"));
                    processedPR.put("content", prContent);

                    processedPRs.add(processedPR);
                } catch (Exception e) {
                    logger.error("Failed to process PR {}: {}", pr.get("number"), e.getMessage());
                }
            }
            repoContent.put("pull_requests", processedPRs);

            // Update project with content
            project.setFileTree(repoContent);
            project.setStatus("ACTIVE");
            project.setAccessible(true);
            project.setUpdatedAt(new Date());
            projectRepository.save(project);

            // Clear existing cached files for this project
            projectFileRepository.deleteByProjectId(projectId);

        } catch (Exception e) {
            logger.error("Failed to process repository content: {}", e.getMessage());
            try {
                Project project = projectRepository.findById(projectId).orElse(null);
                if (project != null) {
                    project.setStatus("FAILED");
                    project.setErrorMessage(e.getMessage());
                    project.setUpdatedAt(new Date());
                    projectRepository.save(project);
                }
            } catch (Exception ex) {
                logger.error("Failed to update project status: {}", ex.getMessage());
            }
        }
    }

    private Map<String, Object> enrichFileTreeWithContent(Map<String, Object> fileTree, String projectId) {
        if (fileTree == null || !fileTree.containsKey("tree")) {
            return fileTree;
        }

        Map<String, Object> tree = (Map<String, Object>) fileTree.get("tree");
        if (tree.containsKey("children")) {
            List<Map<String, Object>> children = (List<Map<String, Object>>) tree.get("children");
            enrichChildrenWithContent(children, projectId, "");
        }

        return fileTree;
    }

    private void enrichChildrenWithContent(List<Map<String, Object>> children, String projectId, String parentPath) {
        if (children == null)
            return;

        for (Map<String, Object> node : children) {
            String path = parentPath.isEmpty() ? (String) node.get("path") : parentPath + "/" + node.get("path");

            if ("blob".equals(node.get("type"))) {
                // Try to get cached content
                Optional<ProjectFile> cachedFile = projectFileRepository.findByProjectIdAndPath(projectId, path);
                if (cachedFile.isPresent()) {
                    node.put("content", cachedFile.get().getContent());
                    node.put("cached", true);
                }
            }

            // Recursively process children
            if (node.containsKey("children")) {
                enrichChildrenWithContent(
                        (List<Map<String, Object>>) node.get("children"),
                        projectId,
                        path);
            }
        }
    }

    public Map<String, Object> getFileContent(String userId, String projectId, String path) throws Exception {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new Exception("Project not found"));

        if (!project.getUserId().equals(userId)) {
            throw new Exception("Unauthorized access to project");
        }

        // Try to get file from cache first
        Optional<ProjectFile> cachedFile = projectFileRepository.findByProjectIdAndPath(projectId, path);
        Map<String, Object> result = new HashMap<>();

        if (cachedFile.isPresent()) {
            ProjectFile file = cachedFile.get();
            // Update last accessed time
            file.setLastAccessed(new Date());
            projectFileRepository.save(file);

            result.put("content", file.getContent());
            result.put("cached", true);
            return result;
        }

        // If not in cache, fetch from GitHub
        Map<String, Object> githubContent = gitHubService.getFileContent(
                userId,
                project.getRepositoryOwner(),
                project.getRepositoryName(),
                path,
                project.getDefaultBranch());

        // Cache the file content
        ProjectFile newFile = new ProjectFile();
        newFile.setProjectId(projectId);
        newFile.setPath(path);
        newFile.setContent((String) githubContent.get("content"));
        newFile.setLastUpdated(new Date());
        newFile.setLastAccessed(new Date());

        // If size and sha are available in the GitHub response
        if (githubContent.containsKey("size")) {
            newFile.setSize(Long.parseLong(githubContent.get("size").toString()));
        }
        if (githubContent.containsKey("sha")) {
            newFile.setSha((String) githubContent.get("sha"));
        }

        projectFileRepository.save(newFile);

        result.put("content", githubContent.get("content"));
        result.put("cached", false);
        return result;
    }
}