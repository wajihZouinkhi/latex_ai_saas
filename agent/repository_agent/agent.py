"""
This is the main entry point for the Repository Analysis Agent.
It defines the workflow graph and the entry point for the agent.
"""

from typing import List, Dict, Optional, Literal, cast, Union
from datetime import datetime
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from copilotkit.langchain import copilotkit_emit_state

from repository_agent.state import AgentState, Step, AgentContext
from repository_agent.tool import tool_node
from repository_agent.model import get_model
from repository_agent.steps import get_next_step

def initialize_context() -> AgentContext:
    """Initialize the agent context with default values."""
    current_time = datetime.utcnow().isoformat()
    return {
        "last_action": None,
        "last_action_time": None,
        "action_history": [],
        "discovered_files": [],
        "important_findings": [],
        "error_count": 0,
        "start_time": current_time,
        "total_steps_completed": 0,
        "total_steps_planned": 0,
    }

def update_context(state: AgentState, action: str) -> AgentContext:
    """Update the agent context with new action and timing information."""
    current_time = datetime.utcnow().isoformat()
    context = state.get("context", initialize_context())
    
    # Update action history
    context["last_action"] = action
    context["last_action_time"] = current_time
    context["action_history"].append(f"{current_time}: {action}")
    
    # Update progress
    completed_steps = [s for s in state["steps"] if s["status"] == "complete"]
    failed_steps = [s for s in state["steps"] if s["status"] == "failed"]
    
    context["total_steps_completed"] = len(completed_steps)
    context["error_count"] = len(failed_steps)
    context["total_steps_planned"] = len(state["steps"])
    
    return context

async def agent_node(state: AgentState, config: RunnableConfig):
    """Main agent node that decides what to do next."""
    
    # Initialize context if not present
    if "context" not in state:
        state["context"] = initialize_context()
    
    # Get the next step from the planner
    next_step = await get_next_step(state, config)
    
    # Add timing information to the step
    next_step["started_at"] = datetime.utcnow().isoformat()
    state["steps"].append(next_step)
    
    # Update context
    state["context"] = update_context(state, f"Planning step: {next_step['description']}")
    
    # Emit state update with new step and context
    await copilotkit_emit_state(config, {
        "steps": state["steps"],
        "context": state["context"],
        "logs": [{
            "message": f"Planning next step: {next_step['description']}",
            "done": False,
            "timestamp": datetime.utcnow().isoformat(),
            "level": "info"
        }]
    })
    
    return state

def route(state: AgentState) -> Union[Literal["tool_node", "agent_node"], str]:
    """Route to the next node based on the current state."""
    
    # Get the current step
    current_step = next((step for step in state["steps"] if step["status"] == "pending"), None)
    
    if not current_step:
        # No pending steps, go back to agent to get next step
        return "agent_node"
    
    if current_step["type"] == "tool":
        # Execute tool operation
        return "tool_node"
    
    # Unknown step type, end the workflow
    return END

# Create the workflow
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("agent_node", agent_node)
workflow.add_node("tool_node", tool_node)

# Set entry point
workflow.set_entry_point("agent_node")

# Add edges
workflow.add_conditional_edges(
    "agent_node",
    route,
    {
        "tool_node": "tool_node",
        "agent_node": "agent_node",
        END: END,
    }
)

workflow.add_conditional_edges(
    "tool_node",
    route,
    {
        "tool_node": "tool_node",
        "agent_node": "agent_node",
        END: END,
    }
)

# Compile the workflow
memory = MemorySaver()
graph = workflow.compile(checkpointer=memory) 