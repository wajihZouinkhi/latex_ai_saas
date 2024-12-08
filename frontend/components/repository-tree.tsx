import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFileIcon } from '@/lib/utils/file-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TreeNode {
  path: string;
  type: 'tree' | 'blob';
  children?: TreeNode[];
  content?: string;
  cached?: boolean;
}

interface RepositoryTreeProps {
  data: TreeNode[];
  onSelect?: (path: string, type: string, node: TreeNode) => void;
  selectedPath?: string;
  isCollapsed?: boolean;
}

export function RepositoryTree({ data, onSelect, selectedPath, isCollapsed }: RepositoryTreeProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expanded);
    if (expanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpanded(newExpanded);
  };

  const renderNode = (node: TreeNode, level: number) => {
    const isDirectory = node.type === 'tree';
    const isExpanded = expanded.has(node.path);
    const isSelected = node.path === selectedPath;
    const hasChildren = isDirectory && node.children && node.children.length > 0;
    const fileName = node.path.split('/').pop() || '';
    const FileIcon = getFileIcon(fileName, isDirectory);

    const nodeContent = (
      <motion.div
        className={cn(
          'group flex items-center py-[3px] px-2 hover:bg-accent/50 cursor-pointer text-[13px]',
          isSelected && 'bg-accent/60',
          !isCollapsed && level > 0 && 'ml-4'
        )}
        onClick={() => {
          if (hasChildren) {
            toggleNode(node.path);
          }
          onSelect?.(node.path, node.type, node);
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="flex items-center min-w-[18px] h-[18px] mr-1">
          {!isCollapsed && hasChildren && (
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <FileIcon className={cn(
            "w-4 h-4 flex-shrink-0",
            isDirectory && "text-blue-400",
            !isDirectory && "text-zinc-400"
          )} />
          {!isCollapsed && <span className="truncate">{fileName}</span>}
        </div>
      </motion.div>
    );

    return (
      <div key={node.path}>
        {isCollapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                {nodeContent}
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {fileName}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          nodeContent
        )}
        <AnimatePresence>
          {!isCollapsed && isExpanded && hasChildren && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {node.children!.map((child) => renderNode(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <ScrollArea className="h-[calc(100vh-8.5rem)]">
      <div className="text-sm text-muted-foreground p-2">
        {data.map((node) => renderNode(node, 0))}
      </div>
    </ScrollArea>
  );
} 