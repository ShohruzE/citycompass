import json
import logging
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from langchain.messages import AIMessage, AIMessageChunk, ToolMessage

from app.agent.agent import get_agent
from app.schemas.agent import ChatRequest, ChatResponse
from app.api.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["Agent"])


async def _generate_stream_events(
    message: str,
    thread_id: str,
    user_id: str,
) -> AsyncGenerator[str, None]:
    """
    Generate Server-Sent Events from the agent's streaming response.

    Uses LangChain's native streaming with multiple stream modes:
    - "messages": For token-by-token LLM output
    - "updates": For step completion events (tool calls, final messages)
    - "custom": For progress updates from within tools

    Args:
        message: The user's input message
        thread_id: Conversation thread ID for memory
        user_id: Current user's ID for thread isolation

    Yields:
        JSON-formatted SSE events
    """
    agent = get_agent()

    # Use user_id + thread_id for proper isolation
    config = {"configurable": {"thread_id": 1}}

    input_message = {"role": "user", "content": message}
    final_content = []

    try:
        # Stream with multiple modes for comprehensive updates
        async for stream_mode, data in agent.astream(
            {"messages": [input_message]},
            config=config,
            stream_mode=["messages", "updates", "custom"],
        ):
            if stream_mode == "messages":
                # Token streaming from LLM
                token, metadata = data
                node = metadata.get("langgraph_node", "model")

                if isinstance(token, AIMessageChunk):
                    # Handle text content
                    if token.content:
                        # token.content can be a string or list of content blocks
                        if isinstance(token.content, str):
                            text = token.content
                        elif isinstance(token.content, list):
                            # Extract text from content blocks
                            text = ""
                            for block in token.content:
                                if (
                                    isinstance(block, dict)
                                    and block.get("type") == "text"
                                ):
                                    text += block.get("text", "")
                                elif isinstance(block, str):
                                    text += block
                        else:
                            text = str(token.content)

                        if text:
                            final_content.append(text)
                            event = {
                                "event": "token",
                                "content": text,
                                "node": node,
                            }
                            yield f"data: {json.dumps(event)}\n\n"

                    # Handle tool call chunks
                    if hasattr(token, "tool_call_chunks") and token.tool_call_chunks:
                        for chunk in token.tool_call_chunks:
                            if chunk.get("name"):
                                event = {
                                    "event": "tool_call_start",
                                    "tool_name": chunk.get("name"),
                                    "tool_call_id": chunk.get("id", ""),
                                }
                                yield f"data: {json.dumps(event)}\n\n"

            elif stream_mode == "updates":
                # Step completion events
                for source, update in data.items():
                    if source == "model":
                        # Model finished generating
                        messages = update.get("messages", [])
                        if messages:
                            last_msg = messages[-1]
                            if isinstance(last_msg, AIMessage) and last_msg.tool_calls:
                                # Model decided to call tools
                                for tc in last_msg.tool_calls:
                                    event = {
                                        "event": "tool_call",
                                        "tool_name": tc.get("name", ""),
                                        "tool_args": tc.get("args", {}),
                                        "tool_call_id": tc.get("id", ""),
                                    }
                                    yield f"data: {json.dumps(event)}\n\n"

                    elif source == "tools":
                        # Tool execution completed
                        messages = update.get("messages", [])
                        for msg in messages:
                            if isinstance(msg, ToolMessage):
                                event = {
                                    "event": "tool_result",
                                    "tool_name": msg.name,
                                    "tool_call_id": msg.tool_call_id,
                                    "content": msg.content
                                    if isinstance(msg.content, str)
                                    else str(msg.content),
                                }
                                yield f"data: {json.dumps(event)}\n\n"

            elif stream_mode == "custom":
                # Custom progress updates from tools (via get_stream_writer)
                event = {
                    "event": "custom",
                    "message": str(data),
                }
                yield f"data: {json.dumps(event)}\n\n"

        # Send done event with final message
        done_event = {
            "event": "done",
            "thread_id": thread_id,
            "final_message": "".join(final_content),
        }
        yield f"data: {json.dumps(done_event)}\n\n"

    except Exception as e:
        logger.exception(f"Error in agent stream: {e}")
        error_event = {
            "event": "error",
            "error": str(e),
            "error_type": type(e).__name__,
        }
        yield f"data: {json.dumps(error_event)}\n\n"


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    user: dict = Depends(get_current_user),
):
    """
    Stream a chat response from the Neighborhood Navigator agent.

    Returns a Server-Sent Events (SSE) stream with the following event types:
    - token: Individual text tokens as they're generated
    - tool_call: When the agent decides to use a tool
    - tool_result: Results from tool execution
    - custom: Progress updates from within tools
    - done: Stream completion with final message
    - error: If an error occurs

    Use the thread_id to maintain conversation context across requests.
    """
    # if user is None:
    #     raise HTTPException(status_code=401, detail="Authentication required")

    user_id = str(user.get("id", user.get("sub", "anonymous")))
    thread_id = request.thread_id or str(uuid.uuid4())

    return StreamingResponse(
        _generate_stream_events(request.message, thread_id, user_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Thread-ID": thread_id,
        },
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user: dict = Depends(get_current_user),
):
    """
    Non-streaming chat endpoint (fallback for clients that don't support SSE).

    Returns the complete response after the agent finishes processing.
    """
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    user_id = str(user.get("id", user.get("sub", "anonymous")))
    thread_id = request.thread_id or str(uuid.uuid4())

    agent = get_agent()

    config = {"configurable": {"thread_id": f"{user_id}:{thread_id}"}}

    input_message = {"role": "user", "content": request.message}

    try:
        result = await agent.ainvoke(
            {"messages": [input_message]},
            config=config,
        )

        # Extract the final AI message
        messages = result.get("messages", [])
        final_message = ""
        tool_calls = []

        for msg in messages:
            if isinstance(msg, AIMessage):
                if msg.content:
                    final_message = (
                        msg.content
                        if isinstance(msg.content, str)
                        else str(msg.content)
                    )
                if msg.tool_calls:
                    for tc in msg.tool_calls:
                        tool_calls.append(
                            {
                                "event": "tool_call",
                                "tool_name": tc.get("name", ""),
                                "tool_args": tc.get("args", {}),
                                "tool_call_id": tc.get("id", ""),
                            }
                        )

        return ChatResponse(
            message=final_message,
            thread_id=thread_id,
            tool_calls=tool_calls,
        )

    except Exception as e:
        logger.exception(f"Error in agent chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def agent_health():
    """Check if the agent service is healthy."""
    try:
        agent = get_agent()
        return {"status": "healthy", "agent_initialized": agent is not None}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
