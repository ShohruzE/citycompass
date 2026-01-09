"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Message, ToolCall } from "../../hooks/useAgentChat";
import ToolCallCard from "./ToolCallCard";
import NeighborhoodResultCard, { parseNeighborhoodData, type NeighborhoodData } from "./NeighborhoodResultCard";

interface ChatMessagesProps {
  messages: Message[];
  isStreaming: boolean;
  currentToolCall: ToolCall | null;
  onNavigateToZip?: (zip: string) => void;
}

export default function ChatMessages({
  messages,
  isStreaming,
  currentToolCall,
  onNavigateToZip,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll, isStreaming]);

  // Detect user scrolling up to pause auto-scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isAtBottom);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onNavigateToZip={onNavigateToZip}
        />
      ))}
      
      {/* Streaming indicator */}
      {isStreaming && !currentToolCall && messages[messages.length - 1]?.content === "" && (
        <TypingIndicator />
      )}
      
      {/* Current tool call indicator */}
      {currentToolCall && (
        <div className="pl-10">
          <ToolCallCard toolCall={currentToolCall} isActive />
        </div>
      )}
      
      {/* Scroll anchor */}
      <div ref={scrollRef} />
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  onNavigateToZip?: (zip: string) => void;
}

function MessageBubble({ message, onNavigateToZip }: MessageBubbleProps) {
  const isUser = message.role === "user";
  
  // Extract neighborhood data from tool results for rendering cards
  const neighborhoodData: NeighborhoodData[] = [];
  if (!isUser && message.toolCalls) {
    for (const toolCall of message.toolCalls) {
      if (toolCall.result && toolCall.status === "completed") {
        const parsed = parseNeighborhoodData(toolCall.result, toolCall.name);
        neighborhoodData.push(...parsed);
      }
    }
  }

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-br from-primary/20 to-primary/5 text-primary"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          "flex flex-col gap-2 max-w-[85%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Tool calls */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="space-y-2 w-full">
            {message.toolCalls.map((toolCall) => (
              <ToolCallCard key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <div
            className={cn(
              "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
              isUser
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md border border-border"
            )}
          >
            <MessageContent content={message.content} isUser={isUser} />
          </div>
        )}

        {/* Neighborhood cards */}
        {neighborhoodData.length > 0 && (
          <div className="space-y-2 w-full">
            {neighborhoodData.map((data, index) => (
              <NeighborhoodResultCard
                key={`${data.zip}-${index}`}
                data={data}
                onClick={() => onNavigateToZip?.(data.zip)}
              />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

// Markdown content renderer using react-markdown
function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  return (
    <ReactMarkdown
      components={{
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-2 last:mb-0">{children}</p>
        ),
        // Bold text
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        // Italic text
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        // Code blocks
        pre: ({ children }) => (
          <pre
            className={cn(
              "p-2 rounded-lg text-xs font-mono overflow-x-auto my-2",
              isUser
                ? "bg-white/10"
                : "bg-background border border-border"
            )}
          >
            {children}
          </pre>
        ),
        // Inline code
        code: ({ children, className }) => {
          // Check if it's a code block (has language class) or inline
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return <code className="text-xs">{children}</code>;
          }
          return (
            <code
              className={cn(
                "px-1 py-0.5 rounded text-xs font-mono",
                isUser
                  ? "bg-white/20"
                  : "bg-muted"
              )}
            >
              {children}
            </code>
          );
        },
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm">{children}</li>
        ),
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "underline underline-offset-2",
              isUser ? "text-primary-foreground/90" : "text-primary"
            )}
          >
            {children}
          </a>
        ),
        // Headings
        h1: ({ children }) => (
          <h1 className="text-base font-bold mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-bold mb-1.5">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mb-1">{children}</h3>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
        <Bot className="w-4 h-4" />
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 bg-muted rounded-2xl rounded-bl-md border border-border">
        <Loader2 className="w-3 h-3 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Thinking...</span>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
