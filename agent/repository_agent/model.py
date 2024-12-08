"""
This module handles the model configuration and setup.
It provides a consistent way to get the language model across all nodes.
"""
import os
from typing import Optional
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.language_models import BaseChatModel
from langchain_core.runnables import RunnableConfig

# Load environment variables
load_dotenv()

# Configure OpenAI with our specific setup
openai_config = {
    "api_key": os.getenv("GLHF_API_KEY"),
    "base_url": "https://glhf.chat/api/openai/v1",
    "model": "hf:meta-llama/Meta-Llama-3.1-405B-Instruct",
    "temperature": 0,  # Use 0 for more deterministic outputs
    "streaming": True  # Enable streaming for better UX
}

def get_model(state: Optional[dict] = None) -> BaseChatModel:
    """
    Get the language model instance based on the current state.
    This function ensures we use consistent model settings across all nodes.
    
    Args:
        state: Optional state dictionary that might contain model preferences
        
    Returns:
        A ChatOpenAI instance configured with our settings
    """
    # You could use state to switch models if needed
    model_name = state.get("model", openai_config["model"]) if state else openai_config["model"]
    
    return ChatOpenAI(
        api_key=openai_config["api_key"],
        base_url=openai_config["base_url"],
        model=model_name,
        temperature=openai_config["temperature"],
        streaming=openai_config["streaming"]
    )

def get_config(state: Optional[dict] = None) -> RunnableConfig:
    """
    Get the configuration for the model runs.
    This includes any callbacks or special settings needed.
    
    Args:
        state: Optional state dictionary that might contain configuration preferences
        
    Returns:
        A RunnableConfig instance with our settings
    """
    # You can add callbacks or other config options here
    return RunnableConfig(
        callbacks=[],  # We can add callbacks for logging, monitoring, etc.
        tags=["repository_agent"]  # Useful for tracking/logging
    ) 