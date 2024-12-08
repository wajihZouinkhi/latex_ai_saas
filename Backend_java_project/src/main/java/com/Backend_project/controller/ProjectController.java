package com.Backend_project.controller;

import com.Backend_project.dto.ApiResponse;
import com.Backend_project.model.Project;
import com.Backend_project.service.ProjectService;
import com.Backend_project.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private static final Logger logger = LoggerFactory.getLogger(ProjectController.class);

    @Autowired
    private ProjectService projectService;

    @Autowired
    private JwtService jwtService;

    private String getUserIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtService.extractUserId(token);
        }
        throw new RuntimeException("No authorization token found");
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getUserProjects(
            HttpServletRequest request,
            @RequestParam(required = false) String userId) {
        try {
            // If userId is not provided, get it from token
            String effectiveUserId = userId != null ? userId : getUserIdFromToken(request);
            List<Project> projects = projectService.getUserProjects(effectiveUserId);

            Map<String, Object> data = new HashMap<>();
            data.put("projects", projects);
            return ResponseEntity.ok(ApiResponse.success("Projects retrieved successfully", data));
        } catch (Exception e) {
            logger.error("Failed to retrieve projects: {}", e.getMessage(), e);
            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to retrieve projects", errors));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse> createProject(
            HttpServletRequest request,
            @RequestBody Project project) {
        try {
            String userId = getUserIdFromToken(request);
            project.setUserId(userId);
            Project savedProject = projectService.createProject(project);
            Map<String, Object> data = new HashMap<>();
            data.put("project", savedProject);
            return ResponseEntity.ok(ApiResponse.success("Project created successfully", data));
        } catch (Exception e) {
            logger.error("Failed to create project: {}", e.getMessage(), e);
            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to create project", errors));
        }
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ApiResponse> getProject(
            HttpServletRequest request,
            @PathVariable String projectId) {
        try {
            String userId = getUserIdFromToken(request);
            Project project = projectService.getProject(userId, projectId);

            Map<String, Object> data = new HashMap<>();
            data.put("project", project);
            return ResponseEntity.ok(ApiResponse.success("Project retrieved successfully", data));
        } catch (Exception e) {
            logger.error("Failed to get project {}: {}", projectId, e.getMessage(), e);
            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to get project", errors));
        }
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ApiResponse> updateProject(
            HttpServletRequest request,
            @PathVariable String projectId,
            @RequestBody Project project) {
        try {
            String userId = getUserIdFromToken(request);
            Project updatedProject = projectService.updateProject(userId, projectId, project);

            Map<String, Object> data = new HashMap<>();
            data.put("project", updatedProject);
            return ResponseEntity.ok(ApiResponse.success("Project updated successfully", data));
        } catch (Exception e) {
            logger.error("Failed to update project {}: {}", projectId, e.getMessage(), e);
            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to update project", errors));
        }
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<ApiResponse> deleteProject(
            HttpServletRequest request,
            @PathVariable String projectId) {
        try {
            String userId = getUserIdFromToken(request);
            projectService.deleteProject(userId, projectId);
            return ResponseEntity.ok(ApiResponse.success("Project deleted successfully", new HashMap<>()));
        } catch (Exception e) {
            logger.error("Failed to delete project {}: {}", projectId, e.getMessage(), e);
            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to delete project", errors));
        }
    }

    @PostMapping("/create/from-repository/{repositoryId}")
    public ResponseEntity<ApiResponse> createProjectFromRepository(
            HttpServletRequest request,
            @PathVariable String repositoryId) {
        try {
            String userId = getUserIdFromToken(request);
            Project project = projectService.createProjectFromRepository(userId, repositoryId);

            Map<String, Object> data = new HashMap<>();
            data.put("project", Map.of(
                    "id", project.getId(),
                    "status", project.getStatus()));

            return ResponseEntity.ok(ApiResponse.success("Project creation started", data));
        } catch (Exception e) {
            logger.error("Failed to create project from repository {}: {}", repositoryId, e.getMessage(), e);
            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to create project", errors));
        }
    }

    @GetMapping("/{projectId}/status")
    public ResponseEntity<ApiResponse> getProjectStatus(
            HttpServletRequest request,
            @PathVariable String projectId) {
        try {
            String userId = getUserIdFromToken(request);
            Project project = projectService.getProjectStatus(userId, projectId);

            Map<String, Object> data = new HashMap<>();
            data.put("status", project.getStatus());
            data.put("isAccessible", project.isAccessible());
            if (project.getErrorMessage() != null) {
                data.put("error", project.getErrorMessage());
            }

            return ResponseEntity.ok(ApiResponse.success("Project status retrieved", data));
        } catch (Exception e) {
            logger.error("Failed to get project status {}: {}", projectId, e.getMessage(), e);
            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to get project status", errors));
        }
    }

    @PostMapping("/{projectId}/resync")
    public ResponseEntity<ApiResponse> resyncRepository(
            HttpServletRequest request,
            @PathVariable String projectId) {
        try {
            String userId = getUserIdFromToken(request);
            Project project = projectService.resyncRepository(userId, projectId);
            Map<String, Object> data = new HashMap<>();
            data.put("project", project);
            return ResponseEntity.ok(ApiResponse.success("Repository resync started", data));
        } catch (Exception e) {
            logger.error("Failed to resync repository: {}", e.getMessage(), e);
            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to resync repository", errors));
        }
    }

    @GetMapping("/{projectId}/file-content")
    public ResponseEntity<ApiResponse> getFileContent(
            HttpServletRequest request,
            @PathVariable String projectId,
            @RequestParam String path) {
        try {
            String userId = getUserIdFromToken(request);
            Map<String, Object> fileContent = projectService.getFileContent(userId, projectId, path);
            Map<String, Object> data = new HashMap<>();
            data.put("content", fileContent.get("content"));
            return ResponseEntity.ok(ApiResponse.success("File content retrieved successfully", data));
        } catch (Exception e) {
            logger.error("Failed to get file content: {}", e.getMessage(), e);
            Map<String, String> errors = new HashMap<>();
            errors.put("message", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to get file content", errors));
        }
    }
}