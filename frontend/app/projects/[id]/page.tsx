"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Maximize2, Minimize2, ChevronRight, ChevronLeft } from "lucide-react";
import { RepositoryTree } from "@/components/repository-tree";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { getLanguageFromFilename } from '@/lib/utils/language-detection';
import { Card } from "@/components/ui/card";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { LatexDocumentTree } from "@/components/project/latex-document-tree";

interface Project {
  id: string;
  name: string;
  description: string;
  repositoryName: string;
  repositoryUrl: string;
  fileTree: any;
  status: string;
  importStatus: string;
  isAccessible: boolean;
}

export default function ProjectPage() {
  const params = useParams();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | undefined>(undefined);
  const [fileContent, setFileContent] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'repository' | 'latex'>('repository');
  const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);
  const [latexDocuments, setLatexDocuments] = useState<any[]>([]);
  const [selectedLatexDocument, setSelectedLatexDocument] = useState<any>(null);

  // Helper function to check if a file is cached
  const isFileCached = (tree: any, path: string): boolean => {
    if (!tree) return false;
    if (tree.path === path) return !!tree.cached;
    if (tree.children) {
      return tree.children.some((child: any) => isFileCached(child, path));
    }
    return false;
  };

  // Helper function to format file tree for copilot
  const formatFileTreeForCopilot = (tree: any): any => {
    if (!tree || !tree.children) return [];
    
    const formatNode = (node: any) => {
      const result: any = {
        path: node.path,
        type: node.type,
      };

      if (node.type === 'blob') {
        result.content = node.content;
        result.cached = node.cached;
      }

      if (node.children && node.children.length > 0) {
        result.children = node.children.map(formatNode);
      }

      return result;
    };

    return tree.children.map(formatNode);
  };

  // Provide project context to copilot
  useCopilotReadable({
    description: "Current project information",
    value: project ? {
      id: project.id,
      name: project.name,
      description: project.description,
      repositoryName: project.repositoryName,
      repositoryUrl: project.repositoryUrl,
      status: project.status,
      importStatus: project.importStatus,
      isAccessible: project.isAccessible
    } : "No project loaded"
  });

  // Provide repository structure context with explicit file listing
  useCopilotReadable({
    description: "Available files in the repository",
    value: project?.fileTree ? {
      availableFiles: getAllFilePaths(project.fileTree),
      currentDirectory: "/",
      fileTree: formatFileTreeForCopilot(project.fileTree)
    } : "No files available"
  });

  // Provide file context to copilot
  useCopilotReadable({
    description: "Currently selected file",
    value: selectedPath ? {
      path: selectedPath,
      content: fileContent,
      language: getLanguageFromFilename(selectedPath),
      isCached: project?.fileTree ? isFileCached(project.fileTree, selectedPath) : false
    } : "No file selected",
    parentId: "project-context"
  });

  // Enhance LaTeX context to include file content
  useCopilotReadable({
    description: "LaTeX files and content in the project",
    value: {
      currentView: activeTab,
      latexFiles: latexDocuments.map(doc => ({
        name: `${doc.title}.tex`,
        path: `latex/${doc.title}.tex`,
        content: doc.content || '',
        type: 'latex',
        id: doc.id,
        documentType: doc.type, // chapter, section, etc.
        status: doc.status,
        isCompiled: doc.isCompiled,
        compiledContent: doc.compiledContent
      })),
      selectedFile: selectedLatexDocument ? {
        name: `${selectedLatexDocument.title}.tex`,
        path: `latex/${selectedLatexDocument.title}.tex`,
        content: selectedLatexDocument.content || '',
        type: 'latex',
        id: selectedLatexDocument.id,
        documentType: selectedLatexDocument.type,
        status: selectedLatexDocument.status,
        isCompiled: selectedLatexDocument.isCompiled,
        compiledContent: selectedLatexDocument.compiledContent
      } : null,
      availableViews: ['repository', 'latex'],
      currentTab: activeTab,
      hasLatexFiles: latexDocuments.length > 0,
      totalLatexFiles: latexDocuments.length,
    }
  });

  // Add a helper function for view switching
  const switchToView = (view: 'repository' | 'latex') => {
    setActiveTab(view);
    return `Switched to ${view} view`;
  };

  // Enhanced view switching action
  useCopilotAction({
    name: "switchView",
    description: "Switch between repository and LaTeX views. Use this to change what you're looking at.",
    parameters: [
      {
        name: "view",
        type: "string",
        description: "Which view to switch to - either 'repository' (for project files) or 'latex' (for LaTeX documents)",
        required: true
      }
    ],
    handler: async ({ view }) => {
      const normalizedView = view.toLowerCase();
      if (normalizedView !== 'repository' && normalizedView !== 'latex') {
        return `Please specify either 'repository' or 'latex' as the view type.`;
      }
      return switchToView(normalizedView as 'repository' | 'latex');
    }
  });

  // Enhanced readLatexFile action with automatic view switching
  useCopilotAction({
    name: "readLatexFile",
    description: "Read a LaTeX document's content. This will automatically switch to the LaTeX view.",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "The title of the LaTeX document to read",
        required: true
      }
    ],
    handler: async ({ title }) => {
      // First switch to LaTeX view
      switchToView('latex');
      
      const document = latexDocuments.find(doc => 
        doc.title.toLowerCase() === title.toLowerCase() ||
        `${doc.title}.tex`.toLowerCase() === title.toLowerCase()
      );

      if (!document) {
        return `LaTeX document "${title}" not found. Available documents: ${latexDocuments.map(d => d.title).join(', ')}`;
      }

      // Set the selected document
      setSelectedLatexDocument(document);

      return {
        message: `Switched to LaTeX view and loaded document: ${document.title}`,
        document: {
          title: document.title,
          content: document.content || '',
          type: document.type,
          status: document.status,
          isCompiled: document.isCompiled,
          compiledContent: document.compiledContent
        }
      };
    }
  });

  // Enhanced viewFile action with automatic view switching
  useCopilotAction({
    name: "viewFile",
    description: "View a file from the repository. This will automatically switch to the repository view.",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "The path of the file to view",
        required: true
      }
    ],
    handler: async ({ path }) => {
      // First switch to repository view
      switchToView('repository');
      
      if (!project?.fileTree) return "Project or file tree not loaded";
      
      try {
        setFileLoading(true);
        const response = await fetch(`/api/projects/${params.id}/file-content?path=${encodeURIComponent(path)}`);
        if (!response.ok) throw new Error('Failed to fetch file content');
        const data = await response.json();
        setFileContent(data.content);
        setSelectedPath(path);
        
        return `Switched to repository view and loaded file: ${path}`;
      } catch (error) {
        console.error(error);
        return `Failed to load file: ${path}`;
      } finally {
        setFileLoading(false);
      }
    }
  });

  // Enhanced createLatexDocument action with automatic view switching
  useCopilotAction({
    name: "createLatexDocument",
    description: "Create a new LaTeX document. This will automatically switch to the LaTeX view.",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "The title of the document",
        required: true
      },
      {
        name: "type",
        type: "string",
        description: "The type of document (chapter, section, subsection)",
        required: true
      }
    ],
    handler: async ({ title, type }) => {
      // First switch to LaTeX view
      switchToView('latex');
      
      try {
        const response = await fetch(`/api/projects/${params.id}/latex`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(session?.user as any).token}`,
          },
          body: JSON.stringify({ title, type }),
        });

        if (!response.ok) {
          throw new Error('Failed to create LaTeX document');
        }

        const data = await response.json();
        await fetchLatexDocuments();
        return `Switched to LaTeX view and created new ${type}: ${title}`;
      } catch (error) {
        console.error(error);
        return `Failed to create ${type}: ${title}`;
      }
    }
  });

  // Action to delete a LaTeX document
  useCopilotAction({
    name: "deleteLatexDocument",
    description: "Delete a LaTeX document from the project",
    parameters: [
      {
        name: "documentId",
        type: "string",
        description: "The ID of the document to delete",
        required: true
      }
    ],
    handler: async ({ documentId }) => {
      try {
        const response = await fetch(`/api/projects/${params.id}/latex/${documentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${(session!.user as any).token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete LaTeX document');
        }

        return `Successfully deleted document`;
      } catch (error) {
        console.error(error);
        return `Failed to delete document`;
      }
    }
  });

  // Action to compile a LaTeX document
  useCopilotAction({
    name: "compileLatexDocument",
    description: "Compile a LaTeX document",
    parameters: [
      {
        name: "documentId",
        type: "string",
        description: "The ID of the document to compile",
        required: true
      }
    ],
    handler: async ({ documentId }) => {
      try {
        const response = await fetch(`/api/projects/${params.id}/latex/${documentId}/compile`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(session!.user as any).token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to compile LaTeX document');
        }

        return `Successfully compiled document`;
      } catch (error) {
        console.error(error);
        return `Failed to compile document`;
      }
    }
  });

  // Action to update a LaTeX document
  useCopilotAction({
    name: "updateLatexDocument",
    description: "Update a LaTeX document's content",
    parameters: [
      {
        name: "documentId",
        type: "string",
        description: "The ID of the document to update",
        required: true
      },
      {
        name: "content",
        type: "string",
        description: "The new content for the document",
        required: true
      }
    ],
    handler: async ({ documentId, content }) => {
      try {
        const response = await fetch(`/api/projects/${params.id}/latex/${documentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(session!.user as any).token}`,
          },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          throw new Error('Failed to update LaTeX document');
        }

        return `Successfully updated document`;
      } catch (error) {
        console.error(error);
        return `Failed to update document`;
      }
    }
  });

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/repository-structure`);
      if (!response.ok) throw new Error('Failed to fetch project');
      const data = await response.json();
      setProject(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load project",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResync = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/resync`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to resync repository');
      const data = await response.json();
      setProject(data);
      toast({
        title: "Success",
        description: "Repository resync initiated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resync repository",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  // Helper function to update file content in the tree
  const updateFileTreeContent = (tree: any, path: string, content: string, cached: boolean): any => {
    if (!tree) return tree;

    // If this is a file and matches the path
    if (tree.path === path) {
      return {
        ...tree,
        content,
        cached
      };
    }

    // If this is a directory, recursively update children
    if (tree.children) {
      return {
        ...tree,
        children: tree.children.map((child: any) => 
          updateFileTreeContent(child, path, content, cached)
        )
      };
    }

    return tree;
  };

  const loadFileContent = async (path: string, node: any = null) => {
    try {
      setFileLoading(true);
      setSelectedPath(path);
      await handleFileSelect(path, 'blob', node);
      let content;
      // Check if content is already in the file tree
      if (node?.content) {
        content = node.content;
        setFileContent(content);
        if (node.cached) {
          toast({
            title: "File loaded from cache",
            description: "Using cached version of the file",
            variant: "default",
          });
        }
      } else {
        // If not cached, fetch from backend
        const response = await fetch(`/api/projects/${params.id}/file-content?path=${encodeURIComponent(path)}`);
        if (!response.ok) throw new Error('Failed to fetch file content');
        const data = await response.json();
        content = data.content;
        
        // Set the file content
        setFileContent(content);

        // Update the node in the file tree with the new content
        const updatedTree = updateFileTreeContent(project!.fileTree, path, content, data.cached);
        setProject({
          ...project!,
          fileTree: updatedTree
        });

        if (data.cached) {
          toast({
            title: "File loaded from cache",
            description: "Using cached version of the file",
            variant: "default",
          });
        }
      }

      return content;
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load file content",
        variant: "destructive",
      });
      console.error(error);
      throw error;
    } finally {
      setFileLoading(false);
    }
  };

  const handleFileSelect = async (path: string, type: string, node: any) => {
    if (type === 'blob') {
      await loadFileContent(path, node);
    }
  };

  // Add Copilot action for reading files
  useCopilotAction({
    name: "readProjectFile",
    description: "Read a file from the project using the same preview system",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "The path of the file to read",
        required: true
      }
    ],
    handler: async ({ path }) => {
      try {
        // Use the same implementation as viewFile
        await switchToView('repository');
        setFileLoading(true);
        const response = await fetch(`/api/projects/${params.id}/file-content?path=${encodeURIComponent(path)}`);
        if (!response.ok) throw new Error('Failed to fetch file content');
        const data = await response.json();
        setFileContent(data.content);
        setSelectedPath(path);
        
        return {
          content: data.content,
          language: getLanguageFromFilename(path),
          path,
          message: `Switched to repository view and loaded file: ${path}`
        };
      } catch (error: any) {
        console.error(error);
        return `Failed to read file: ${path}. Error: ${error.message}`;
      } finally {
        setFileLoading(false);
      }
    }
  });

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const fetchLatexDocuments = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/latex`);
      if (!response.ok) throw new Error('Failed to fetch LaTeX documents');
      const data = await response.json();
      setLatexDocuments(data);
    } catch (error) {
      console.error('Error fetching LaTeX documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch LaTeX documents',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchProject();
    fetchLatexDocuments();

    // Poll for updates if status is PENDING
    let interval: NodeJS.Timeout;
    if (project?.importStatus === 'PENDING') {
      interval = setInterval(fetchProject, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [params.id, project?.importStatus]);

  // Add toggleTreeCollapse function
  const toggleTreeCollapse = () => setIsTreeCollapsed(!isTreeCollapsed);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container max-w-7xl px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground">The requested project could not be found.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <div className="hidden flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{project?.name}</h1>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTreeCollapse}
            className="shrink-0"
          >
            {isTreeCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleExpand}
            className="shrink-0"
          >
            {isExpanded ? <Minimize2 /> : <Maximize2 />}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "400px" }}
          exit={{ width: 0 }}
          className="border-r bg-background"
        >
          <div className="h-full flex flex-col">
            <CopilotChat 
              className="flex-1 min-h-0"
              makeSystemMessage={(context) => `You are a helpful AI assistant for a software development project.
                You have access to several tools to help you interact with the codebase:

                1. codebase_search: Find relevant code snippets using semantic search
                2. readProjectFile: Read file contents using the project's preview system
                3. edit_file: Make changes to files
                4. list_dir: List directory contents
                5. grep_search: Search for exact text matches
                6. file_search: Fuzzy search for files
                7. delete_file: Delete files
                8. run_terminal_command: Execute terminal commands
                9. viewFile: View a file in the repository preview panel (switches to repository view automatically)

                Important notes:
                - You can read any file regardless of its extension (they're all treated as plain text)
                - When reading files, you can use either readProjectFile or viewFile:
                  * readProjectFile: Returns the file content directly
                  * viewFile: Shows the file in the preview panel and switches to repository view
                - When reading files, ensure you have complete context by checking for lines not shown
                - You can make edits to files using the edit_file tool
                - Use semantic search for concept-based searches and grep for exact matches

                Current project context: ${context}

                You should provide clear, concise, and accurate responses.
                You can help with:
                - Code understanding and analysis
                - File navigation and content viewing
                - Code modifications and improvements
                - Repository structure understanding
                - LaTeX document management`}
              labels={{
                title: "",  
                initial: "Hi! 👋 I can help you understand the code, generate documentation, or create LaTeX content from your repository.",
              }}
            />
          </div>
        </motion.div>

        <div className="flex-1 flex flex-col min-w-0">
          <Tabs defaultValue="repository" className="flex-1 flex flex-col">
            <div className="flex items-center justify-between h-10 px-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center gap-4">
                <TabsList className="h-9 bg-transparent">
                  <TabsTrigger 
                    value="repository"
                    className="relative h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    Repository
                  </TabsTrigger>
                  <TabsTrigger 
                    value="latex"
                    className="relative h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    LaTeX Documents
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2 text-sm">
                  <h2 className="font-medium">{project?.name}</h2>
                  <span className="text-muted-foreground text-xs">{project?.description}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResync}
                  disabled={project?.importStatus === 'PENDING'}
                  className="h-8"
                >
                  <RefreshCw className={cn(
                    "h-4 w-4",
                    project?.importStatus === 'PENDING' && "animate-spin"
                  )} />
                  <span className="ml-2 text-xs">Resync</span>
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleExpand}
                  className="h-8 w-8"
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <TabsContent value="repository" className="flex-1 p-0 m-0">
              <div className="grid h-full" style={{ 
                gridTemplateColumns: isTreeCollapsed ? "2.5rem 1fr" : "300px 1fr"
              }}>
                <div className="border-r flex flex-col bg-background/95 overflow-hidden">
                  <div className="flex items-center h-9 px-2 border-b justify-between shrink-0">
                    {!isTreeCollapsed && (
                      <span className="text-xs font-medium">REPOSITORY FILES</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsTreeCollapsed(!isTreeCollapsed)}
                      className="h-6 w-6"
                    >
                      {isTreeCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronLeft className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex-1">
                    <RepositoryTree
                      data={transformFileTree(project?.fileTree)}
                      onSelect={handleFileSelect}
                      selectedPath={selectedPath}
                      isCollapsed={isTreeCollapsed}
                    />
                  </div>
                </div>

                <div className="flex flex-col min-w-0 bg-[#1e1e1e]">
                  <div className="flex items-center h-9 px-4 border-b border-[#2d2d2d] justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm text-zinc-400">
                        {selectedPath ? selectedPath.split('/').pop() : 'Select a file'}
                      </h3>
                    </div>
                    {selectedPath && (
                      <div className="text-xs px-2 py-1 rounded bg-[#2d2d2d] text-zinc-400">
                        {getLanguageFromFilename(selectedPath)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-auto relative">
                    {fileLoading ? (
                      <div className="flex items-center justify-center h-full text-zinc-400">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Loading file content...</span>
                        </div>
                      </div>
                    ) : selectedPath && fileContent ? (
                      <div className="absolute inset-0">
                        <SyntaxHighlighter
                          language={getLanguageFromFilename(selectedPath)}
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            background: 'transparent',
                            fontSize: '13px',
                            lineHeight: '20px',
                            height: '100%',
                          }}
                          showLineNumbers
                          lineNumberStyle={{
                            minWidth: '3em',
                            paddingRight: '1em',
                            color: '#6e7681',
                            textAlign: 'right',
                            userSelect: 'none',
                          }}
                          codeTagProps={{
                            style: {
                              fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                            }
                          }}
                        >
                          {fileContent}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-zinc-400">
                        Select a file from the repository tree to view its content
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="latex" className="flex-1 p-0 m-0">
              <div className="grid grid-cols-[300px_1fr] h-full divide-x">
                <div className="overflow-auto">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-sm">LaTeX Documents</h3>
                  </div>
                  <div className="p-4">
                    {latexDocuments.length > 0 ? (
                      <LatexDocumentTree
                        documents={latexDocuments}
                        onSelect={setSelectedLatexDocument}
                        selectedDocument={selectedLatexDocument}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        No LaTeX documents generated yet
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-sm">Preview</h3>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    {selectedLatexDocument ? (
                      <div className="prose prose-sm max-w-none">
                        <h1>{selectedLatexDocument.title}</h1>
                        <div className="flex gap-2 text-sm text-muted-foreground mb-4">
                          <span>Type: {selectedLatexDocument.type}</span>
                          <span>•</span>
                          <span>Status: {selectedLatexDocument.status}</span>
                        </div>
                        {selectedLatexDocument.content ? (
                          <pre className="bg-muted p-4 rounded-lg">
                            {selectedLatexDocument.content}
                          </pre>
                        ) : (
                          <p className="text-muted-foreground">No content yet</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        Select a LaTeX document to preview
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function transformFileTree(tree: any): any[] {
  if (!tree || !tree.tree) return [];

  const hierarchicalTree = tree.tree;
  if (!hierarchicalTree.children) return [];

  // Convert the hierarchical structure to our flat format
  function flattenTree(node: any): any {
    const result = {
      path: node.path || node.name,
      type: node.type,
      children: [],
    };

    if (node.children && Array.isArray(node.children)) {
      result.children = node.children.map(flattenTree);
    }

    return result;
  }

  return hierarchicalTree.children.map(flattenTree);
}

// Helper function to get all file paths
const getAllFilePaths = (tree: any): string[] => {
  if (!tree || !tree.tree || !tree.tree.children) return [];
  
  const paths: string[] = [];
  
  const traverse = (node: any) => {
    if (node.path) {
      paths.push(node.path);
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  };
  
  tree.tree.children.forEach(traverse);
  return paths;
}; 