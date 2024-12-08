"""
This module handles the planning of steps for the Repository Analysis Agent.
"""

from typing import Dict, List, TypedDict
from datetime import datetime
import json
from langchain_core.messages import SystemMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from copilotkit.langchain import copilotkit_emit_state

from repository_agent.state import AgentState, Step
from repository_agent.model import get_model

class SubAction(TypedDict):
    """Represents a sub-action (tool operation) within a step."""
    tool: str  # The tool to use
    description: str  # What this sub-action does
    args: Dict  # Arguments for the tool
    order: int  # Order in sequence
    status: str  # 'pending', 'in_progress', 'complete', 'failed'

async def get_next_step(state: AgentState, config: RunnableConfig) -> Step:
    """Get the next step from the planner."""
    
    # Emit planning state
    await copilotkit_emit_state(config, {
        "logs": [{
            "message": "Planning next step...",
            "done": False,
            "timestamp": datetime.utcnow().isoformat(),
            "level": "info"
        }]
    })
    
    # Get the model
    model = get_model(state)
    
    # Create the system prompt
    system_prompt = """You are a Repository Analysis Agent that helps users understand GitHub repositories.
    Your task is to analyze repositories, understand their structure, and generate documentation.
    
    You have access to these tools:
    1. get_tree: Get repository directory structure
    2. read_files: Read specific files
    3. search_code: Search for patterns or text
    
    For each step, you should:
    1. Determine the main objective
    2. Break it down into sub-actions using available tools
    3. Specify the order of operations
    
    For example, to explore a project you might need to:
    1. First get the repository tree
    2. Then read key files like README, package.json
    3. Finally search for specific patterns
    
    Respond with a JSON object containing:
    {
        "type": "tool",
        "description": "High-level description of the step",
        "status": "pending",
        "sub_actions": [
            {
                "tool": "tool_name",
                "description": "What this sub-action does",
                "args": {"arg1": "value1"},
                "order": 1,
                "status": "pending"
            },
            ...
        ]
    }
    
    Consider the current context:
    - Files already discovered
    - Previous actions taken
    - Important findings so far
    """
    
    # Get the response from the model
    response = await model.invoke([
        SystemMessage(content=system_prompt),
        AIMessage(content=f"""
        Current state:
        - Discovered files: {state['context']['discovered_files']}
        - Previous actions: {state['context']['action_history'][-5:] if state['context']['action_history'] else []}
        - Important findings: {state['context']['important_findings']}
        - Total steps completed: {state['context']['total_steps_completed']}
        """)
    ])
    
    # Parse the response into a Step
    try:
        step_data = json.loads(response.content)
        step = {
            "id": f"step_{len(state['steps']) + 1}",
            "type": step_data["type"],
            "description": step_data["description"],
            "status": "pending",
            "result": None,
            "updates": [],
            "started_at": None,
            "completed_at": None,
            "duration": None,
            "sub_actions": step_data.get("sub_actions", [])
        }
    except Exception as e:
        # If parsing fails, create a simple step
        step = {
            "id": f"step_{len(state['steps']) + 1}",
            "type": "tool",
            "description": response.content,
            "status": "pending",
            "result": None,
            "updates": [],
            "started_at": None,
            "completed_at": None,
            "duration": None,
            "sub_actions": []
        }
    
    # Emit completion state
    await copilotkit_emit_state(config, {
        "logs": [{
            "message": f"Planning complete: {step['description']}",
            "done": True,
            "timestamp": datetime.utcnow().isoformat(),
            "level": "info"
        }]
    })
    
    return step 