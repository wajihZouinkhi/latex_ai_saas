"""
This node is responsible for file operations using GitHub's API.
It can read files, get directory trees, and search code.
"""
from typing import List, Dict, Optional
from datetime import datetime
from langchain_core.runnables import RunnableConfig
from copilotkit.langchain import copilotkit_emit_state

from repository_agent.state import AgentState
from repository_agent.github_tools import GitHubTools

def update_context_for_tool(state: AgentState, action: str, discovered_files: List[str] = None, findings: List[str] = None) -> None:
    """Update the agent context with tool-specific information."""
    current_time = datetime.utcnow().isoformat()
    context = state["context"]
    
    # Update action tracking
    context["last_action"] = action
    context["last_action_time"] = current_time
    context["action_history"].append(f"{current_time}: {action}")
    
    # Update discovered files
    if discovered_files:
        context["discovered_files"].extend(discovered_files)
        context["discovered_files"] = list(set(context["discovered_files"]))  # Remove duplicates
    
    # Update findings
    if findings:
        context["important_findings"].extend(findings)

async def execute_sub_action(state: AgentState, config: RunnableConfig, github: GitHubTools, sub_action: Dict) -> Dict:
    """Execute a single sub-action and return its results."""
    
    tool_name = sub_action["tool"]
    description = sub_action["description"]
    args = sub_action["args"]
    
    # Update sub-action status
    sub_action["status"] = "in_progress"
    sub_action["started_at"] = datetime.utcnow().isoformat()
    
    # Emit progress
    await copilotkit_emit_state(config, {
        "steps": state["steps"],
        "context": state["context"],
        "logs": [{
            "message": f"Executing: {description}",
            "done": False,
            "timestamp": datetime.utcnow().isoformat(),
            "level": "info"
        }]
    })
    
    try:
        result = None
        
        if tool_name == "get_tree":
            path = args.get("path", "")
            tree = await github.get_tree(path)
            discovered_files = [node["path"] for node in tree if node["type"] == "blob"]
            update_context_for_tool(
                state,
                f"Got tree for: {path or 'root'}",
                discovered_files=discovered_files,
                findings=[f"Found {len(discovered_files)} files in {path or 'root'}"]
            )
            result = tree
            
        elif tool_name == "read_files":
            paths = args.get("paths", [])
            contents = await github.read_files(paths)
            update_context_for_tool(
                state,
                f"Read files: {', '.join(paths)}",
                discovered_files=paths,
                findings=[f"Read {len(paths)} files"]
            )
            result = contents
            
        elif tool_name == "search_code":
            query = args.get("query", "")
            results = await github.search_code(query)
            discovered_files = [result["path"] for result in results]
            update_context_for_tool(
                state,
                f"Searched for: {query}",
                discovered_files=discovered_files,
                findings=[f"Found {len(results)} matches for '{query}'"]
            )
            result = results
            
        # Update sub-action completion
        sub_action["status"] = "complete"
        sub_action["completed_at"] = datetime.utcnow().isoformat()
        sub_action["duration"] = (
            datetime.fromisoformat(sub_action["completed_at"]) -
            datetime.fromisoformat(sub_action["started_at"])
        ).total_seconds()
        sub_action["result"] = result
        
        # Emit completion
        await copilotkit_emit_state(config, {
            "steps": state["steps"],
            "context": state["context"],
            "logs": [{
                "message": f"Completed: {description}",
                "done": True,
                "timestamp": datetime.utcnow().isoformat(),
                "level": "info"
            }]
        })
        
    except Exception as e:
        sub_action["status"] = "failed"
        sub_action["error"] = str(e)
        state["context"]["error_count"] += 1
        
        # Emit error
        await copilotkit_emit_state(config, {
            "steps": state["steps"],
            "context": state["context"],
            "logs": [{
                "message": f"Error in {description}: {str(e)}",
                "done": True,
                "timestamp": datetime.utcnow().isoformat(),
                "level": "error"
            }]
        })
    
    return sub_action

async def tool_node(state: AgentState, config: RunnableConfig):
    """Handle file operations using GitHub API."""
    
    # Get the current step that needs file operations
    current_step = next((step for step in state["steps"] if step["status"] == "pending"), None)
    if not current_step or current_step["type"] != "tool":
        return state

    # Initialize GitHub tools
    github = GitHubTools(state["github"])
    
    # Update step timing
    current_step["started_at"] = datetime.utcnow().isoformat()
    
    # Update step status and emit state
    current_step["updates"].append("Starting step execution...")
    update_context_for_tool(state, f"Starting step: {current_step['description']}")
    await copilotkit_emit_state(config, {
        "steps": state["steps"],
        "context": state["context"],
        "logs": [{
            "message": f"Starting step: {current_step['description']}",
            "done": False,
            "timestamp": datetime.utcnow().isoformat(),
            "level": "info"
        }]
    })
    
    try:
        # Execute each sub-action in order
        sub_actions = sorted(current_step.get("sub_actions", []), key=lambda x: x["order"])
        results = []
        
        for sub_action in sub_actions:
            result = await execute_sub_action(state, config, github, sub_action)
            results.append(result)
            
            # If a sub-action failed, mark the step as failed
            if result["status"] == "failed":
                current_step["status"] = "failed"
                current_step["error"] = result["error"]
                break
        
        # If all sub-actions completed successfully, mark the step as complete
        if current_step["status"] != "failed":
            current_step["status"] = "complete"
            current_step["result"] = results
        
        # Update timing
        current_step["completed_at"] = datetime.utcnow().isoformat()
        current_step["duration"] = (
            datetime.fromisoformat(current_step["completed_at"]) -
            datetime.fromisoformat(current_step["started_at"])
        ).total_seconds()
        
        # Emit final state
        await copilotkit_emit_state(config, {
            "steps": state["steps"],
            "context": state["context"],
            "logs": [{
                "message": f"Step {current_step['status']}: {current_step['description']}",
                "done": True,
                "timestamp": datetime.utcnow().isoformat(),
                "level": "info" if current_step["status"] == "complete" else "error"
            }]
        })
        
    except Exception as e:
        current_step["status"] = "failed"
        current_step["error"] = str(e)
        state["context"]["error_count"] += 1
        
        await copilotkit_emit_state(config, {
            "steps": state["steps"],
            "context": state["context"],
            "logs": [{
                "message": f"Step failed: {str(e)}",
                "done": True,
                "timestamp": datetime.utcnow().isoformat(),
                "level": "error"
            }]
        })
    
    return state