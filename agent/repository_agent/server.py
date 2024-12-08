"""
FastAPI server to expose the Repository Analysis Agent API.
"""

import os
from typing import Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from dotenv import load_dotenv

from copilotkit import CopilotKitSDK, LangGraphAgent
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from copilotkit.langchain import copilotkit_messages_to_langchain

from repository_agent.agent import graph

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize CopilotKit SDK
sdk = CopilotKitSDK(
    agents=[
        LangGraphAgent(
            name="repository_agent",
            description="Repository Analysis Agent that helps understand GitHub repositories.",
            graph=graph,
            copilotkit_config={
                "convert_messages": copilotkit_messages_to_langchain(use_function_call=True)
            }
        ),
    ],
)

# Add CopilotKit endpoint
add_fastapi_endpoint(app, sdk, "/copilotkit")

# Health check endpoint
@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok"} 