"use client";

import { useEffect, useState } from "react";
import { ChevronRight, ChevronDown, File, FolderOpen, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LatexDocument {
  id: string;
  title: string;
  type: string;
  order: number;
  status: string;
  content: string | null;
  compiledContent: string | null;
  compiled: boolean;
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

interface LatexDocumentTreeProps {
  documents: LatexDocument[];
  onSelect?: (document: LatexDocument) => void;
  selectedDocument?: LatexDocument | null;
}

interface DocumentsByType {
  [key: string]: LatexDocument[];
}

export function LatexDocumentTree({ documents, onSelect, selectedDocument }: LatexDocumentTreeProps) {
  const [expandedTypes, setExpandedTypes] = useState<{ [key: string]: boolean }>({
    chapter: true,
    section: true,
    subsection: true,
  });

  // Group documents by type
  const documentsByType = documents.reduce((acc: DocumentsByType, doc) => {
    if (!acc[doc.type]) {
      acc[doc.type] = [];
    }
    acc[doc.type].push(doc);
    return acc;
  }, {});

  // Sort documents within each type by order
  Object.keys(documentsByType).forEach(type => {
    documentsByType[type].sort((a, b) => a.order - b.order);
  });

  const toggleType = (type: string) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chapter':
        return <FolderOpen className="h-4 w-4" />;
      case 'section':
        return <Folder className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full">
      {Object.entries(documentsByType).map(([type, docs]) => (
        <div key={type} className="mb-2">
          <Button
            variant="ghost"
            className="w-full justify-start p-2 hover:bg-accent"
            onClick={() => toggleType(type)}
          >
            <span className="mr-2">
              {expandedTypes[type] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
            {getTypeIcon(type)}
            <span className="ml-2 capitalize">{type}s</span>
            <span className="ml-2 text-muted-foreground">({docs.length})</span>
          </Button>

          {expandedTypes[type] && (
            <div className="ml-6 space-y-1">
              {docs.map((doc) => (
                <Button
                  key={doc.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start p-2 hover:bg-accent",
                    selectedDocument?.id === doc.id && "bg-accent"
                  )}
                  onClick={() => onSelect?.(doc)}
                >
                  <File className="mr-2 h-4 w-4" />
                  <span className="truncate">{doc.title}</span>
                  {doc.status === 'draft' && (
                    <span className="ml-2 text-xs text-muted-foreground">(Draft)</span>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 