package com.Backend_project.repository;

import com.Backend_project.model.ProjectFile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface ProjectFileRepository extends MongoRepository<ProjectFile, String> {
    Optional<ProjectFile> findByProjectIdAndPath(String projectId, String path);

    void deleteByProjectId(String projectId);
}