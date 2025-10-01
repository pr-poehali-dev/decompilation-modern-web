import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

interface FileTreeProps {
  files: string[];
  selectedFile: string;
  onSelectFile: (path: string) => void;
}

function buildFileTree(files: string[]): FileNode[] {
  const root: FileNode[] = [];
  
  files.forEach(filePath => {
    const parts = filePath.split('/');
    let currentLevel = root;
    
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const existingNode = currentLevel.find(node => node.name === part);
      
      if (existingNode) {
        if (!isLast && existingNode.children) {
          currentLevel = existingNode.children;
        }
      } else {
        const newNode: FileNode = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          isDirectory: !isLast,
          children: !isLast ? [] : undefined,
        };
        
        currentLevel.push(newNode);
        
        if (!isLast && newNode.children) {
          currentLevel = newNode.children;
        }
      }
    });
  });
  
  return root;
}

function TreeNode({ 
  node, 
  level, 
  selectedFile, 
  onSelectFile 
}: { 
  node: FileNode; 
  level: number; 
  selectedFile: string; 
  onSelectFile: (path: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(level < 2);
  
  const handleClick = () => {
    if (node.isDirectory) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node.path);
    }
  };
  
  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
          selectedFile === node.path
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {node.isDirectory ? (
          <Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={14} className="flex-shrink-0" />
        ) : (
          <Icon name="FileCode" size={14} className="flex-shrink-0 text-primary" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      
      {node.isDirectory && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree({ files, selectedFile, onSelectFile }: FileTreeProps) {
  const tree = buildFileTree(files);
  
  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          level={0}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
        />
      ))}
    </div>
  );
}
