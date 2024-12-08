export type RepositoryFile = {
    type: 'file';
    size: number;
    sha: string;
};

export type RepositoryDirectory = {
    [key: string]: RepositoryFile | RepositoryDirectory;
};

export type ProjectStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface Project {
    id?: string;
    userId: string;
    username: string;
    
    // Repository information
    repositoryId: string;
    repositoryName: string;
    repositoryOwner: string;
    repositoryUrl: string;
    defaultBranch: string;
    isPrivate: boolean;
    
    // Repository data
    repositoryStructure?: RepositoryDirectory;
    lastSyncedAt?: string;
    
    // Import status
    importStatus: ProjectStatus;
    importError?: string;
    
    // Document information
    documentClass?: string;
    documentTitle?: string;
    authors?: string[];
    status?: string;
    latexContent?: string;
    sections?: Record<string, any>[];
    documentMetadata?: Record<string, any>;
    
    // Timestamps
    createdAt?: string;
    updatedAt?: string;
} 