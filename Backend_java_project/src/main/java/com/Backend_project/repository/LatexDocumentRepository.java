package com.Backend_project.repository;

import com.Backend_project.model.LatexDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LatexDocumentRepository extends MongoRepository<LatexDocument, String> {
    
    /**
     * Find all LaTeX documents belonging to a specific project
     * @param projectId The ID of the project
     * @return List of LaTeX documents
     */
    List<LatexDocument> findByProjectId(String projectId);

    /**
     * Find all LaTeX documents belonging to a specific project and type
     * @param projectId The ID of the project
     * @param type The type of document (e.g., "chapter", "section")
     * @return List of LaTeX documents
     */
    List<LatexDocument> findByProjectIdAndType(String projectId, String type);

    /**
     * Find all LaTeX documents belonging to a specific project, ordered by their order field
     * @param projectId The ID of the project
     * @return List of ordered LaTeX documents
     */
    List<LatexDocument> findByProjectIdOrderByOrderAsc(String projectId);

    /**
     * Find a specific document by its project ID and title
     * @param projectId The ID of the project
     * @param title The title of the document
     * @return Optional of LatexDocument
     */
    Optional<LatexDocument> findByProjectIdAndTitle(String projectId, String title);

    /**
     * Delete all documents belonging to a specific project
     * @param projectId The ID of the project
     */
    void deleteByProjectId(String projectId);

    /**
     * Count documents of a specific type in a project
     * @param projectId The ID of the project
     * @param type The type of document
     * @return Number of documents
     */
    long countByProjectIdAndType(String projectId, String type);

    /**
     * Find the maximum order number in a project for a specific type
     * @param projectId The ID of the project
     * @param type The type of document
     * @return Optional of Integer containing the max order, or empty if no documents exist
     */
    @Query(value = "{ 'projectId': ?0, 'type': ?1 }", sort = "{ 'order': -1 }")
    Optional<LatexDocument> findFirstByProjectIdAndTypeOrderByOrderDesc(String projectId, String type);

    /**
     * Find all compiled documents in a project
     * @param projectId The ID of the project
     * @return List of compiled LaTeX documents
     */
    List<LatexDocument> findByProjectIdAndIsCompiledTrue(String projectId);

    /**
     * Find all documents in a project with a specific status
     * @param projectId The ID of the project
     * @param status The status to filter by
     * @return List of LaTeX documents
     */
    List<LatexDocument> findByProjectIdAndStatus(String projectId, String status);
} 