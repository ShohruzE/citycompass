from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langgraph.checkpoint.memory import InMemorySaver

from app.agent.prompts import SYSTEM_PROMPT
from app.agent.tools import AGENT_TOOLS
from app.core.config import get_settings


def create_neighborhood_agent():
    """
    Create and return the Neighborhood Navigator agent.

    The agent is configured with:
    - GPT-5-nano model (or configured alternative)
    - All neighborhood exploration tools
    - In-memory checkpointer for conversation persistence
    - Custom system prompt for neighborhood guidance

    Returns:
        A compiled LangGraph agent ready for invocation
    """
    settings = get_settings()

    # Initialize the model using LangChain's unified interface
    # This allows easy switching between providers via config
    model_name = getattr(settings, "AGENT_MODEL", "openai:gpt-5-nano")

    model = init_chat_model(
        model_name,
        temperature=0.3,  # Slightly creative but mostly factual
        max_tokens=2048,
    )

    # Create checkpointer for conversation memory
    # In production, replace with PostgresSaver for persistence across restarts
    checkpointer = InMemorySaver()

    # Create the agent with tools
    agent = create_agent(
        model=model,
        tools=AGENT_TOOLS,
        system_prompt=SYSTEM_PROMPT,
        checkpointer=checkpointer,
    )

    return agent


# Create a singleton agent instance for the application
# This is initialized once at module load time
_agent_instance = None


def get_agent():
    """
    Get the singleton agent instance.

    Creates the agent on first call, then returns the same instance.
    This ensures consistent conversation memory within a single process.

    Returns:
        The Neighborhood Navigator agent
    """
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = create_neighborhood_agent()
    return _agent_instance
