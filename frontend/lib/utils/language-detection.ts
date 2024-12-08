const languageMap: { [key: string]: string } = {
  // Common programming languages
  'js': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'java': 'java',
  'cpp': 'cpp',
  'c': 'c',
  'cs': 'csharp',
  'go': 'go',
  'rs': 'rust',
  'php': 'php',
  'swift': 'swift',
  'kt': 'kotlin',
  
  // Web technologies
  'html': 'html',
  'css': 'css',
  'scss': 'scss',
  'less': 'less',
  'json': 'json',
  'xml': 'xml',
  'yaml': 'yaml',
  'yml': 'yaml',
  'md': 'markdown',
  
  // Shell scripts
  'sh': 'bash',
  'bash': 'bash',
  'zsh': 'bash',
  'fish': 'fish',
  
  // Configuration files
  'dockerfile': 'dockerfile',
  'env': 'plaintext',
  'ini': 'ini',
  'toml': 'toml',
  
  // LaTeX
  'tex': 'latex',
  'bib': 'bibtex',
  'cls': 'latex',
  'sty': 'latex',
};

export function getLanguageFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  return languageMap[extension] || 'plaintext';
} 