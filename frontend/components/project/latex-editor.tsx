"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

interface LatexEditorProps {
  initialContent?: string;
  onSave?: (content: string) => Promise<void>;
  className?: string;
}

export function LatexEditor({ initialContent = "", onSave, className }: LatexEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [preview, setPreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);

  useEffect(() => {
    const compileLatex = async () => {
      setIsCompiling(true);
      try {
        // TODO: Implement LaTeX compilation
        // This should call your backend API to compile LaTeX to HTML/PDF
        // For now, we'll just set the preview to the content
        setPreview(content);
      } catch (error) {
        console.error("Failed to compile LaTeX:", error);
      } finally {
        setIsCompiling(false);
      }
    };

    const debounce = setTimeout(compileLatex, 1000);
    return () => clearTimeout(debounce);
  }, [content]);

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(content);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className={cn("h-full", className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="font-semibold">LaTeX Editor</h3>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </Button>
      </div>

      <ResizablePanelGroup direction="horizontal" className="h-[calc(100%-49px)]">
        <ResizablePanel defaultSize={50}>
          <ScrollArea className="h-full">
            <div className="p-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your LaTeX content here..."
                className="min-h-[calc(100vh-200px)] font-mono"
              />
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={50}>
          <ScrollArea className="h-full border-l">
            <div className="p-4">
              {isCompiling ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              )}
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
} 