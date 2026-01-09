"use client";

import { useState, useCallback, useRef } from "react";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";

// ============================================================================
// Types
// ============================================================================

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "error";
  result?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
}

// SSE Event types matching backend/app/schemas/agent.py
type TokenEvent = { event: "token"; content: string; node: string };
type ToolCallStartEvent = { event: "tool_call_start"; tool_name: string; tool_call_id: string };
type ToolCallEvent = { event: "tool_call"; tool_name: string; tool_args: Record<string, unknown>; tool_call_id: string };
type ToolResultEvent = { event: "tool_result"; tool_name: string; content: string; tool_call_id: string };
type CustomEvent = { event: "custom"; message: string };
type DoneEvent = { event: "done"; thread_id: string; final_message: string };
type ErrorEvent = { event: "error"; error: string; error_type?: string };

type SSEEvent = 
  | TokenEvent 
  | ToolCallStartEvent 
  | ToolCallEvent 
  | ToolResultEvent 
  | CustomEvent 
  | DoneEvent 
  | ErrorEvent;

export interface UseAgentChatOptions {
  apiEndpoint?: string;
  onError?: (error: Error) => void;
}

export interface UseAgentChatReturn {
  messages: Message[];
  isStreaming: boolean;
  currentToolCall: ToolCall | null;
  error: string | null;
  threadId: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useAgentChat(options: UseAgentChatOptions = {}): UseAgentChatReturn {
  const { 
    apiEndpoint = `${API_BASE_URL}/api/agent/chat/stream`,
    onError 
  } = options;

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentToolCall, setCurrentToolCall] = useState<ToolCall | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useLocalStorage<string | null>("agent-thread-id", null);
  
  // Refs for managing stream state
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>("");

  // Generate unique message IDs
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Parse SSE data line
  const parseSSELine = (line: string): SSEEvent | null => {
    if (!line.startsWith("data: ")) return null;
    try {
      return JSON.parse(line.slice(6)) as SSEEvent;
    } catch {
      console.warn("Failed to parse SSE event:", line);
      return null;
    }
  };

  // Process incoming SSE events
  const processSSEEvent = useCallback((
    event: SSEEvent,
    assistantMessageId: string,
    toolCallsMap: Map<string, ToolCall>
  ) => {
    switch (event.event) {
      case "token":
        // Accumulate tokens into the assistant message
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId
            ? { ...msg, content: msg.content + event.content }
            : msg
        ));
        break;

      case "tool_call_start":
        // Tool is starting - create a pending tool call
        const pendingTool: ToolCall = {
          id: event.tool_call_id,
          name: event.tool_name,
          args: {},
          status: "pending",
        };
        toolCallsMap.set(event.tool_call_id, pendingTool);
        setCurrentToolCall(pendingTool);
        break;

      case "tool_call":
        // Tool call with full arguments
        const runningTool: ToolCall = {
          id: event.tool_call_id,
          name: event.tool_name,
          args: event.tool_args,
          status: "running",
        };
        toolCallsMap.set(event.tool_call_id, runningTool);
        setCurrentToolCall(runningTool);
        
        // Update message with tool calls
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId
            ? { ...msg, toolCalls: Array.from(toolCallsMap.values()) }
            : msg
        ));
        break;

      case "tool_result":
        // Tool execution completed
        const existingTool = toolCallsMap.get(event.tool_call_id);
        if (existingTool) {
          const completedTool: ToolCall = {
            ...existingTool,
            status: "completed",
            result: event.content,
          };
          toolCallsMap.set(event.tool_call_id, completedTool);
          setCurrentToolCall(null);
          
          // Update message with completed tool
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId
              ? { ...msg, toolCalls: Array.from(toolCallsMap.values()) }
              : msg
          ));
        }
        break;

      case "custom":
        // Custom progress update - could be used for UI feedback
        console.log("Agent progress:", event.message);
        break;

      case "done":
        // Stream completed - update thread ID
        setThreadId(event.thread_id);
        setIsStreaming(false);
        setCurrentToolCall(null);
        break;

      case "error":
        setError(event.error);
        setIsStreaming(false);
        setCurrentToolCall(null);
        if (onError) {
          onError(new Error(event.error));
        }
        break;
    }
  }, [onError, setThreadId]);

  // Send a message to the agent
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    // Clear any previous errors
    setError(null);
    lastUserMessageRef.current = content;

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Create placeholder assistant message
    const assistantMessageId = generateId();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      toolCalls: [],
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);
    setIsStreaming(true);

    // Track tool calls for this response
    const toolCallsMap = new Map<string, ToolCall>();

    try {
      // Get auth token
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: content.trim(),
          thread_id: threadId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get thread ID from response header if available
      const responseThreadId = response.headers.get("X-Thread-ID");
      if (responseThreadId) {
        setThreadId(responseThreadId);
      }

      // Read the stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === "") continue;
          
          const event = parseSSELine(trimmedLine);
          if (event) {
            processSSEEvent(event, assistantMessageId, toolCallsMap);
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const event = parseSSELine(buffer.trim());
        if (event) {
          processSSEEvent(event, assistantMessageId, toolCallsMap);
        }
      }

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was cancelled
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setIsStreaming(false);
      setCurrentToolCall(null);
      
      // Update assistant message to show error
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId
          ? { ...msg, content: `Error: ${errorMessage}` }
          : msg
      ));

      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    }
  }, [apiEndpoint, isStreaming, threadId, processSSEEvent, onError, setThreadId]);

  // Clear all messages and start fresh
  const clearMessages = useCallback(() => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setMessages([]);
    setError(null);
    setIsStreaming(false);
    setCurrentToolCall(null);
    setThreadId(null);
  }, [setThreadId]);

  // Retry the last failed message
  const retryLastMessage = useCallback(async () => {
    if (!lastUserMessageRef.current || isStreaming) return;
    
    // Remove the last assistant message (which has the error)
    setMessages(prev => {
      const newMessages = [...prev];
      // Remove last two messages (user + failed assistant)
      if (newMessages.length >= 2) {
        newMessages.pop(); // Remove assistant
        newMessages.pop(); // Remove user
      }
      return newMessages;
    });
    
    setError(null);
    await sendMessage(lastUserMessageRef.current);
  }, [isStreaming, sendMessage]);

  return {
    messages,
    isStreaming,
    currentToolCall,
    error,
    threadId,
    sendMessage,
    clearMessages,
    retryLastMessage,
  };
}
