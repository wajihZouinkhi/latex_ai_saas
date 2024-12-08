package com.Backend_project.model;

import lombok.Data;
import java.util.List;

@Data
public class RepositoryFile {
    private String name;
    private String path;
    private String type; // "file" or "dir"
    private List<RepositoryFile> children;
}