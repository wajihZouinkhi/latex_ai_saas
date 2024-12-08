"""
This is the state definition for the Repository Analysis Agent.
It defines the state of the agent and the state of the conversation.
"""

from typing import List, TypedDict, Optional, Union
from datetime import datetime
from langgraph.graph import MessagesState

class FileNode(TypedDict):
    """Represents a file or directory in the repository."""
    path: str
    type: str  # 'blob' or 'tree'
    content: Optional[str]
    cached: Optional[bool]
    children: Optional[List['FileNode']]

class GitHubContext(TypedDict):
    """GitHub-specific context for repository access."""
    access_token: str
    owner: str
    repo: str
    ref: Optional[str]  # branch or commit SHA

class LatexDocument(TypedDict):
    """Represents a LaTeX document generated from the repository."""
    id: str
    title: str
    type: str
    content: str
    status: str
    isCompiled: bool
    compiledContent: Optional[str]

class Step(TypedDict):
    """Represents a step in the analysis process."""
    id: str
    type: str
    description: str
    status: str  # 'pending', 'complete', or 'failed'
    result: Optional[str]
    updates: List[str]
    started_at: Optional[str]  # ISO format timestamp
    completed_at: Optional[str]  # ISO format timestamp
    duration: Optional[float]  # in seconds

class Log(TypedDict):
    """Represents a log message from the agent."""
    message: str
    done: bool
    timestamp: str  # ISO format
    level: str  # 'info', 'warning', 'error'

class AgentContext(TypedDict):
    """Represents the agent's context and memory."""
    last_action: Optional[str]
    last_action_time: Optional[str]  # ISO format
    action_history: List[str]
    discovered_files: List[str]  # Files we've seen/analyzed
    important_findings: List[str]  # Key insights found
    error_count: int
    start_time: str  # ISO format
    total_steps_completed: int
    total_steps_planned: int

class AgentState(MessagesState):
    """
    This is the state of the agent.
    It is a subclass of the MessagesState class from langgraph.
    """
    model: str = "openai"
    projectId: str
    projectName: str
    repositoryName: str
    repositoryUrl: str
    github: GitHubContext
    fileTree: List[FileNode]
    selectedPath: Optional[str]
    fileContent: Optional[str]
    latexDocuments: List[LatexDocument]
    selectedLatexDocument: Optional[LatexDocument]
    steps: List[Step]
    logs: List[Log]
    context: AgentContext  # Added agent context
 