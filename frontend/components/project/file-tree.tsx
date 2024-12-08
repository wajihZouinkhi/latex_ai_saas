"use client";

import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface RepositoryFile {
  name: string;
  path: string;
  type: "file" | "dir";
  content?: string;
  children?: RepositoryFile[];
}

interface FileTreeProps {
  files: RepositoryFile[];
  onFileSelect: (file: RepositoryFile) => void;
  selectedFile?: RepositoryFile | null;
}

interface FileTreeNodeProps extends FileTreeProps {
  level: number;
}

function FileTreeNode({ files, level, onFileSelect, selectedFile }: FileTreeNodeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  return (
    <ul className={cn("space-y-1", level > 0 && "ml-4")}>
      {files.map((file) => (
        <li key={file.path}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start px-2 hover:bg-accent",
              selectedFile?.path === file.path && "bg-accent",
              file.type === "dir" && "font-medium"
            )}
            onClick={() => {
              if (file.type === "dir") {
                toggleFolder(file.path);
              } else {
                onFileSelect(file);
              }
            }}
          >
            <div className="flex items-center w-full">
              {file.type === "dir" ? (
                <>
                  {expandedFolders[file.path] ? (
                    <ChevronDown className="h-4 w-4 shrink-0 mr-1" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 mr-1" />
                  )}
                  <Folder className="h-4 w-4 shrink-0 mr-2 text-blue-500" />
                </>
              ) : (
                <File className="h-4 w-4 shrink-0 mr-2 text-gray-500" />
              )}
              <span className="truncate">{file.name}</span>
            </div>
          </Button>
          {file.type === "dir" && file.children && expandedFolders[file.path] && (
            <FileTreeNode
              files={file.children}
              level={level + 1}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export function FileTree({ files, onFileSelect, selectedFile }: FileTreeProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <FileTreeNode
          files={files}
          level={0}
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
        />
      </div>
    </ScrollArea>
  );
} 