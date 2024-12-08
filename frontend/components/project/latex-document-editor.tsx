"use client";

import { FC, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Play } from 'lucide-react';
import { Editor } from '@monaco-editor/react';

interface LatexDocument {
    id: string;
    title: string;
    content: string;
    type: string;
    status: string;
    isCompiled: boolean;
    compiledContent?: string;
}

interface LatexDocumentEditorProps {
    projectId: string;
    document: LatexDocument;
    onSave?: (document: LatexDocument) => void;
}

export const LatexDocumentEditor: FC<LatexDocumentEditorProps> = ({
    projectId,
    document,
    onSave
}) => {
    const { toast } = useToast();
    const [content, setContent] = useState(document.content);
    const [saving, setSaving] = useState(false);
    const [compiling, setCompiling] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        setContent(document.content);
    }, [document]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await fetch(`/api/projects/${projectId}/latex/${document.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...document,
                    content
                }),
            });

            if (!response.ok) throw new Error('Failed to save document');

            const updatedDocument = await response.json();
            onSave?.(updatedDocument);
            toast({
                title: "Success",
                description: "Document saved successfully",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save document",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCompile = async () => {
        try {
            setCompiling(true);
            const response = await fetch(`/api/projects/${projectId}/latex/${document.id}/compile`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Failed to compile document');

            const compiledDocument = await response.json();
            onSave?.(compiledDocument);
            setShowPreview(true);
            toast({
                title: "Success",
                description: "Document compiled successfully",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to compile document",
                variant: "destructive",
            });
        } finally {
            setCompiling(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-9 px-4 border-b">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{document.title}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-accent">
                        {document.type}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        <span className="ml-2">Save</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCompile}
                        disabled={compiling}
                    >
                        {compiling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        <span className="ml-2">Compile</span>
                    </Button>
                </div>
            </div>
            <div className="flex-1 min-h-0">
                {showPreview && document.compiledContent ? (
                    <ScrollArea className="h-full">
                        <div className="p-4">
                            <div
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: document.compiledContent }}
                            />
                        </div>
                    </ScrollArea>
                ) : (
                    <Editor
                        height="100%"
                        defaultLanguage="latex"
                        value={content}
                        onChange={(value) => setContent(value || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            renderWhitespace: 'none',
                            scrollBeyondLastLine: false,
                            wordWrap: 'on'
                        }}
                    />
                )}
            </div>
        </div>
    );
}; 