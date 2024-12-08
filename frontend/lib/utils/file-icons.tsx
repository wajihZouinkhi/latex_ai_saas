import { 
  File, 
  Folder,
  FileJson,
  FileText,
  FileCode,
  FileImage,
  FileArchive,
  Coffee,
  Hash,
  FileType,
  Braces,
  Terminal,
  FileCheck,
  Settings,
  Package,
  FileKey,
  FileSpreadsheet,
  Database,
  FileVideo,
  FileAudio,
  FileCog,
  FileWarning,
  FileX,
  FileSearch,
  FileLock,
  FileOutput,
  FileInput,
} from 'lucide-react';

const fileExtensionMap = {
  // Config files
  'json': FileJson,
  'yaml': FileCode,
  'yml': FileCode,
  'toml': FileCode,
  'ini': FileCode,
  'env': FileKey,
  'config': Settings,
  
  // Documentation
  'md': FileText,
  'txt': FileText,
  'pdf': FileText,
  'doc': FileText,
  'docx': FileText,
  
  // Web
  'html': FileCode,
  'htm': FileCode,
  'css': FileCode,
  'scss': FileCode,
  'sass': FileCode,
  'less': FileCode,
  'jsx': FileCode,
  'tsx': FileCode,
  
  // Programming Languages
  'js': FileCode,
  'ts': FileCode,
  'py': FileCode,
  'java': Coffee,
  'c': FileCode,
  'cpp': FileCode,
  'cs': Hash,
  'go': FileCode,
  'rs': FileCode,
  'php': FileCode,
  'rb': FileCode,
  'swift': FileCode,
  'kt': FileCode,
  
  // Data
  'csv': FileSpreadsheet,
  'xls': FileSpreadsheet,
  'xlsx': FileSpreadsheet,
  'sql': Database,
  
  // Images
  'png': FileImage,
  'jpg': FileImage,
  'jpeg': FileImage,
  'gif': FileImage,
  'svg': FileImage,
  'ico': FileImage,
  'webp': FileImage,
  
  // Media
  'mp4': FileVideo,
  'webm': FileVideo,
  'mp3': FileAudio,
  'wav': FileAudio,
  
  // Archives
  'zip': FileArchive,
  'tar': FileArchive,
  'gz': FileArchive,
  'rar': FileArchive,
  '7z': FileArchive,
  
  // Special files
  'gitignore': FileCog,
  'dockerignore': FileCog,
  'dockerfile': FileWarning,
  'package.json': Package,
  'package-lock.json': Package,
  'yarn.lock': Package,
  'pnpm-lock.yaml': Package,
  'requirements.txt': Package,
  'pipfile': Package,
  'cargo.toml': Package,
  'gemfile': Package,
  'composer.json': Package,
};

const specialFileMap = {
  'readme': FileSearch,
  'license': FileLock,
  'changelog': FileOutput,
  'contributing': FileInput,
  'authors': FileCheck,
};

export function getFileIcon(fileName: string, isDirectory: boolean) {
  if (isDirectory) {
    return Folder;
  }

  // Check for special files first (case insensitive)
  const lowerFileName = fileName.toLowerCase();
  for (const [special, icon] of Object.entries(specialFileMap)) {
    if (lowerFileName.includes(special)) {
      return icon;
    }
  }

  // Check exact file names
  const exactMatch = fileExtensionMap[fileName.toLowerCase()];
  if (exactMatch) {
    return exactMatch;
  }

  // Check file extensions
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension && fileExtensionMap[extension]) {
    return fileExtensionMap[extension];
  }

  // Default file icon
  return File;
} 