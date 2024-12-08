package com.Backend_project.controller;

import com.Backend_project.model.LatexDocument;
import com.Backend_project.service.LatexDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/latex")
public class LatexDocumentController {

    @Autowired
    private LatexDocumentService latexDocumentService;

    @PostMapping
    public ResponseEntity<LatexDocument> createDocument(
            @PathVariable String projectId,
            Authentication authentication,
            @RequestBody LatexDocument document) {
        try {
            String userId = authentication.getName();
            LatexDocument createdDocument = latexDocumentService.createDocument(projectId, userId, document);
            return ResponseEntity.ok(createdDocument);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{documentId}")
    public ResponseEntity<LatexDocument> updateDocument(
            @PathVariable String projectId,
            @PathVariable String documentId,
            Authentication authentication,
            @RequestBody LatexDocument document) {
        try {
            String userId = authentication.getName();
            LatexDocument updatedDocument = latexDocumentService.updateDocument(projectId, userId, documentId,
                    document);
            return ResponseEntity.ok(updatedDocument);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable String projectId,
            @PathVariable String documentId,
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            latexDocumentService.deleteDocument(projectId, userId, documentId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<LatexDocument>> getProjectDocuments(
            @PathVariable String projectId,
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            List<LatexDocument> documents = latexDocumentService.getProjectDocuments(projectId, userId);
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<LatexDocument> getDocument(
            @PathVariable String projectId,
            @PathVariable String documentId,
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            LatexDocument document = latexDocumentService.getDocument(projectId, userId, documentId);
            return ResponseEntity.ok(document);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{documentId}/compile")
    public ResponseEntity<LatexDocument> compileDocument(
            @PathVariable String projectId,
            @PathVariable String documentId,
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            LatexDocument compiledDocument = latexDocumentService.compileDocument(projectId, userId, documentId);
            return ResponseEntity.ok(compiledDocument);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}