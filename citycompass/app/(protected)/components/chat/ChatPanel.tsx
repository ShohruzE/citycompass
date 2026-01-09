"use client";

import { useState } from "react";
import { MessageSquare, X, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAgentChat } from "../../hooks/useAgentChat";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

interface ChatPanelProps {
  onNavigateToZip?: (zip: string) => void;
  className?: string;
}

export default function ChatPanel({ onNavigateToZip, className }: ChatPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    messages,
    isStreaming,
    currentToolCall,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage,
  } = useAgentChat({
    onError: (err) => console.error("Chat error:", err),
  });

  const handleToggle = () => {
    setIsExpanded(prev => !prev);
  };

  // Collapsed state - floating button
  if (!isExpanded) {
    return (
      <button
        onClick={handleToggle}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "flex items-center gap-2 px-4 py-3",
          "bg-primary text-primary-foreground",
          "rounded-full shadow-lg",
          "hover:bg-primary/90 hover:shadow-xl hover:scale-105",
          "transition-all duration-200",
          "group",
          className
        )}
        aria-label="Open AI chat assistant"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-medium">Ask AI</span>
        {messages.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
            {messages.length}
          </span>
        )}
      </button>
    );
  }

  // Expanded state - fixed sidebar chat panel
  return (
    <div
      className={cn(
        "fixed right-0 top-0 z-40",
        "w-[380px] h-screen",
        "flex flex-col",
        "bg-card border-l border-border",
        "shadow-2xl",
        "animate-in slide-in-from-right duration-300",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-foreground">Neighborhood Navigator</h2>
            <p className="text-xs text-muted-foreground">AI-powered insights</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Close chat panel"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <EmptyState onSendMessage={sendMessage} />
        ) : (
          <ChatMessages
            messages={messages}
            isStreaming={isStreaming}
            currentToolCall={currentToolCall}
            onNavigateToZip={onNavigateToZip}
          />
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-destructive">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={retryLastMessage}
              className="text-destructive hover:text-destructive/80 h-7"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Input area */}
      <ChatInput
        onSendMessage={sendMessage}
        isDisabled={isStreaming}
        placeholder={isStreaming ? "AI is thinking..." : "Ask about NYC neighborhoods..."}
      />
    </div>
  );
}

// Empty state component with suggested prompts
function EmptyState({ onSendMessage }: { onSendMessage: (msg: string) => void }) {
  const suggestions = [
    {
      icon: "🏠",
      text: "What's the quality score for ZIP 10001?",
    },
    {
      icon: "📊",
      text: "Compare Brooklyn 11211 vs Manhattan 10013",
    },
    {
      icon: "🔍",
      text: "Find neighborhoods with low poverty rates",
    },
    {
      icon: "👥",
      text: "Show demographics for Williamsburg",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
        <MessageSquare className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">
        Explore NYC Neighborhoods
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-[240px]">
        Ask about quality scores, demographics, or compare different areas.
      </p>
      
      <div className="w-full space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
          Try asking
        </p>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSendMessage(suggestion.text)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5",
              "text-left text-sm",
              "bg-muted/50 hover:bg-muted",
              "border border-border hover:border-primary/30",
              "rounded-lg transition-all duration-200",
              "group"
            )}
          >
            <span className="text-base">{suggestion.icon}</span>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              {suggestion.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
