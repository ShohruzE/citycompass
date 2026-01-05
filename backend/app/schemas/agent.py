from typing import Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class ChatRequest(BaseModel):
    """Request model for sending a message to the agent."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="The user's message to send to the agent",
    )
    thread_id: Optional[str] = Field(
        default=None,
        description="Conversation thread ID for maintaining context. "
        "If not provided, a new thread will be created.",
    )


class StreamEvent(BaseModel):
    """
    Base model for streaming events sent to the client.

    Event types:
    - token: A text token from the LLM response
    - tool_call: Agent is calling a tool
    - tool_result: Result from a tool execution
    - custom: Custom progress update from within a tool
    - done: Stream is complete
    - error: An error occurred
    """

    event: Literal["token", "tool_call", "tool_result", "custom", "done", "error"]
    data: dict = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class TokenEvent(BaseModel):
    """Event for streaming text tokens."""

    event: Literal["token"] = "token"
    content: str = Field(..., description="The text content of this token")
    node: str = Field(
        default="model", description="The graph node that emitted this token"
    )


class ToolCallEvent(BaseModel):
    """Event when the agent decides to call a tool."""

    event: Literal["tool_call"] = "tool_call"
    tool_name: str = Field(..., description="Name of the tool being called")
    tool_args: dict = Field(
        default_factory=dict, description="Arguments passed to the tool"
    )
    tool_call_id: str = Field(..., description="Unique ID for this tool call")


class ToolResultEvent(BaseModel):
    """Event with the result of a tool execution."""

    event: Literal["tool_result"] = "tool_result"
    tool_name: str = Field(..., description="Name of the tool that was called")
    tool_call_id: str = Field(..., description="ID of the tool call this result is for")
    content: str = Field(..., description="The result returned by the tool")


class CustomEvent(BaseModel):
    """Event for custom progress updates from tools."""

    event: Literal["custom"] = "custom"
    message: str = Field(..., description="Custom progress message")


class DoneEvent(BaseModel):
    """Event indicating the stream is complete."""

    event: Literal["done"] = "done"
    thread_id: str = Field(..., description="The thread ID for this conversation")
    final_message: Optional[str] = Field(
        default=None, description="The complete final response text"
    )


class ErrorEvent(BaseModel):
    """Event indicating an error occurred."""

    event: Literal["error"] = "error"
    error: str = Field(..., description="Error message")
    error_type: str = Field(
        default="unknown", description="Type of error that occurred"
    )


class ChatResponse(BaseModel):
    """
    Non-streaming response model (for fallback or simple queries).
    """

    message: str = Field(..., description="The agent's response message")
    thread_id: str = Field(..., description="The conversation thread ID")
    tool_calls: list[ToolCallEvent] = Field(
        default_factory=list, description="Tools that were called during this response"
    )
