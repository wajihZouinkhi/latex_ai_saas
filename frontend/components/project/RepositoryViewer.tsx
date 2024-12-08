import { FC, useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RepositoryDirectory, RepositoryFile } from '@/types/project';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RepositoryViewerProps {
    structure: RepositoryDirectory;
    className?: string;
}

interface TreeNodeProps {
    name: string;
    item: RepositoryFile | RepositoryDirectory;
    level: number;
    expanded: boolean;
    onToggle: () => void;
}

const TreeNode: FC<TreeNodeProps> = ({ name, item, level, expanded, onToggle }) => {
    const isFile = 'type' in item && item.type === 'file';
    const indent = level * 16; // 16px per level

    return (
        <div style={{ paddingLeft: `${indent}px` }} className="py-1">
            <Button
                variant="ghost"
                size="sm"
                className={cn(
                    'h-8 w-full justify-start gap-2 px-2 hover:bg-accent/50',
                    expanded && 'bg-accent/30'
                )}
                onClick={onToggle}
            >
                {isFile ? (
                    <>
                        <File className="h-4 w-4" />
                        <span>{name}</span>
                        {/* Show file size if available */}
                        {(item as RepositoryFile).size && (
                            <span className="ml-auto text-xs text-muted-foreground">
                                {formatFileSize((item as RepositoryFile).size)}
                            </span>
                        )}
                    </>
                ) : (
                    <>
                        {expanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                        <Folder className="h-4 w-4" />
                        <span>{name}</span>
                    </>
                )}
            </Button>
        </div>
    );
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const RepositoryViewer: FC<RepositoryViewerProps> = ({ structure, className }) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    const toggleNode = (path: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedNodes(newExpanded);
    };

    const renderTree = (
        structure: RepositoryDirectory,
        parentPath = '',
        level = 0
    ): JSX.Element[] => {
        return Object.entries(structure).map(([name, item]) => {
            const currentPath = parentPath ? `${parentPath}/${name}` : name;
            const isExpanded = expandedNodes.has(currentPath);

            return (
                <div key={currentPath}>
                    <TreeNode
                        name={name}
                        item={item}
                        level={level}
                        expanded={isExpanded}
                        onToggle={() => toggleNode(currentPath)}
                    />
                    {!('type' in item) && isExpanded && (
                        <div>{renderTree(item as RepositoryDirectory, currentPath, level + 1)}</div>
                    )}
                </div>
            );
        });
    };

    return (
        <ScrollArea className={cn('h-[500px] rounded-md border', className)}>
            <div className="p-2">{renderTree(structure)}</div>
        </ScrollArea>
    );
}; 