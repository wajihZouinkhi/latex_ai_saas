package com.Backend_project.service;

import com.Backend_project.model.LatexDocument;
import com.Backend_project.model.Project;
import com.Backend_project.repository.LatexDocumentRepository;
import com.Backend_project.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Date;
import java.util.List;

@Service
public class LatexDocumentService {

    @Autowired
    private LatexDocumentRepository latexDocumentRepository;

    @Autowired
    private ProjectRepository projectRepository;

    public LatexDocument createDocument(String projectId, String userId, LatexDocument document) throws Exception {
        // Verify project exists and user has access
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new Exception("Project not found"));

        if (!project.getUserId().equals(userId)) {
            throw new Exception("User not authorized to access this project");
        }

        // Set metadata
        document.setProjectId(projectId);
        document.setCreatedAt(new Date());
        document.setUpdatedAt(new Date());
        document.setStatus("draft");
        document.setCompiled(false);

        return latexDocumentRepository.save(document);
    }

    public LatexDocument updateDocument(String projectId, String userId, String documentId,
            LatexDocument updatedDocument) throws Exception {
        // Verify project exists and user has access
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new Exception("Project not found"));

        if (!project.getUserId().equals(userId)) {
            throw new Exception("User not authorized to access this project");
        }

        LatexDocument existingDocument = latexDocumentRepository.findById(documentId)
                .orElseThrow(() -> new Exception("Document not found"));

        // Update fields
        existingDocument.setTitle(updatedDocument.getTitle());
        existingDocument.setContent(updatedDocument.getContent());
        existingDocument.setType(updatedDocument.getType());
        existingDocument.setOrder(updatedDocument.getOrder());
        existingDocument.setStatus(updatedDocument.getStatus());
        existingDocument.setUpdatedAt(new Date());
        existingDocument.setCompiled(false); // Reset compilation status

        return latexDocumentRepository.save(existingDocument);
    }

    public void deleteDocument(String projectId, String userId, String documentId) throws Exception {
        // Verify project exists and user has access
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new Exception("Project not found"));

        if (!project.getUserId().equals(userId)) {
            throw new Exception("User not authorized to access this project");
        }

        LatexDocument document = latexDocumentRepository.findById(documentId)
                .orElseThrow(() -> new Exception("Document not found"));

        latexDocumentRepository.delete(document);
    }

    public List<LatexDocument> getProjectDocuments(String projectId, String userId) throws Exception {
        // Verify project exists and user has access
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new Exception("Project not found"));

        if (!project.getUserId().equals(userId)) {
            throw new Exception("User not authorized to access this project");
        }

        return latexDocumentRepository.findByProjectId(projectId);
    }

    public LatexDocument getDocument(String projectId, String userId, String documentId) throws Exception {
        // Verify project exists and user has access
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new Exception("Project not found"));

        if (!project.getUserId().equals(userId)) {
            throw new Exception("User not authorized to access this project");
        }

        return latexDocumentRepository.findById(documentId)
                .orElseThrow(() -> new Exception("Document not found"));
    }

    public LatexDocument compileDocument(String projectId, String userId, String documentId) throws Exception {
        // Verify project exists and user has access
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new Exception("Project not found"));

        if (!project.getUserId().equals(userId)) {
            throw new Exception("User not authorized to access this project");
        }

        LatexDocument document = latexDocumentRepository.findById(documentId)
                .orElseThrow(() -> new Exception("Document not found"));

        // TODO: Implement LaTeX compilation logic here
        // This would involve using a LaTeX compiler service to convert the content
        // For now, we'll just set a placeholder
        document.setCompiledContent("Compiled content placeholder");
        document.setCompiled(true);
        document.setUpdatedAt(new Date());

        return latexDocumentRepository.save(document);
    }
}