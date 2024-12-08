"""
Main entry point for running the Repository Analysis Agent server.
"""

import os
import uvicorn
from dotenv import load_dotenv

def main():
    """Run the agent server."""
    # Load environment variables
    load_dotenv()
    
    # Get port from environment or use default
    port = int(os.getenv("PORT", "8000"))
    
    # Run the server
    uvicorn.run(
        "repository_agent.server:app",
        host="0.0.0.0",
        port=port,
        reload=True  # Enable auto-reload during development
    )

if __name__ == "__main__":
    main() 