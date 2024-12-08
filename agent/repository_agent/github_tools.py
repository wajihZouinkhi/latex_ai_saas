"""
This module provides tools for interacting with GitHub's API.
It handles file reading, tree traversal, and other GitHub operations.
"""
import base64
from typing import Optional, List, Dict, Any
import aiohttp
from repository_agent.state import GitHubContext, FileNode

class GitHubTools:
    """Tools for interacting with GitHub's API."""
    
    def __init__(self, context: GitHubContext):
        """
        Initialize GitHub tools with authentication context.
        
        Args:
            context: GitHub context containing access token and repo info
        """
        self.context = context
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"Bearer {context['access_token']}",
            "Accept": "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
    
    async def read_file(self, path: str) -> Optional[str]:
        """
        Read a file's contents from GitHub.
        
        Args:
            path: Path to the file in the repository
            
        Returns:
            The file's contents as a string, or None if not found
        """
        url = f"{self.base_url}/repos/{self.context['owner']}/{self.context['repo']}/contents/{path}"
        if self.context.get('ref'):
            url += f"?ref={self.context['ref']}"
            
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('type') == 'file':
                        content = base64.b64decode(data['content']).decode('utf-8')
                        return content
                return None
    
    async def read_files(self, paths: List[str]) -> Dict[str, Optional[str]]:
        """
        Read multiple files' contents from GitHub.
        
        Args:
            paths: List of file paths to read
            
        Returns:
            Dictionary mapping paths to their contents
        """
        results = {}
        for path in paths:
            content = await self.read_file(path)
            results[path] = content
        return results
    
    async def get_tree(self, path: str = "") -> Optional[List[FileNode]]:
        """
        Get the file tree for a directory.
        
        Args:
            path: Optional path to get tree for (empty for root)
            
        Returns:
            List of FileNode objects representing the tree
        """
        url = f"{self.base_url}/repos/{self.context['owner']}/{self.context['repo']}/contents/{path}"
        if self.context.get('ref'):
            url += f"?ref={self.context['ref']}"
            
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return [
                        {
                            "path": item['path'],
                            "type": "blob" if item['type'] == 'file' else "tree",
                            "content": None,
                            "cached": False,
                            "children": [] if item['type'] == 'dir' else None
                        }
                        for item in data
                    ]
                return None
    
    async def search_code(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for code in the repository.
        
        Args:
            query: Search query string
            
        Returns:
            List of matching files with snippets
        """
        url = f"{self.base_url}/search/code"
        params = {
            "q": f"{query} repo:{self.context['owner']}/{self.context['repo']}",
            "per_page": 10
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('items', []) 