"use client";

import { cn } from "@/lib/utils";
import { 
  Search, 
  BarChart3, 
  Users, 
  MapPin,
  CheckCircle2,
  Loader2,
  AlertCircle
} from "lucide-react";
import type { ToolCall } from "../../hooks/useAgentChat";

interface ToolCallCardProps {
  toolCall: ToolCall;
  isActive?: boolean;
}

// Tool metadata for display
const TOOL_META: Record<string, { 
  icon: React.ElementType; 
  label: string; 
  color: string;
  bgColor: string;
  getDescription: (args: Record<string, unknown>) => string;
}> = {
  get_nsqi_prediction: {
    icon: BarChart3,
    label: "Quality Score",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    getDescription: (args) => `Calculating NSQI for ZIP ${args.zip_code || "..."}`,
  },
  get_acs_demographics: {
    icon: Users,
    label: "Demographics",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    getDescription: (args) => `Fetching census data for ZIP ${args.zip_code || "..."}`,
  },
  compare_neighborhoods: {
    icon: BarChart3,
    label: "Comparison",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    getDescription: (args) => `Comparing ${args.zip_code_a || "..."} vs ${args.zip_code_b || "..."}`,
  },
  search_neighborhoods: {
    icon: Search,
    label: "Search",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    getDescription: (args) => {
      const filters: string[] = [];
      if (args.borough) filters.push(args.borough as string);
      if (args.min_nsqi_score) filters.push(`score ≥ ${args.min_nsqi_score}`);
      if (args.max_poverty_rate) filters.push(`poverty ≤ ${(args.max_poverty_rate as number) * 100}%`);
      if (args.min_income) filters.push(`income ≥ $${(args.min_income as number).toLocaleString()}`);
      return filters.length > 0 
        ? `Searching: ${filters.join(", ")}`
        : "Searching neighborhoods...";
    },
  },
};

const DEFAULT_META = {
  icon: MapPin,
  label: "Tool",
  color: "text-muted-foreground",
  bgColor: "bg-muted border-border",
  getDescription: () => "Processing...",
};

export default function ToolCallCard({ toolCall, isActive = false }: ToolCallCardProps) {
  const meta = TOOL_META[toolCall.name] || DEFAULT_META;
  const Icon = meta.icon;
  const description = meta.getDescription(toolCall.args);

  const statusIcon = () => {
    switch (toolCall.status) {
      case "pending":
      case "running":
        return <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />;
      case "completed":
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />;
      case "error":
        return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 transition-all duration-300",
        meta.bgColor,
        isActive && "animate-pulse ring-2 ring-primary/20"
      )}
    >
      <div className="flex items-center gap-2">
        {/* Tool icon */}
        <div className={cn("p-1 rounded", meta.color)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        
        {/* Tool info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn("text-xs font-medium", meta.color)}>
              {meta.label}
            </span>
            {statusIcon()}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {description}
          </p>
        </div>
      </div>
      
      {/* Show truncated result if completed */}
      {toolCall.status === "completed" && toolCall.result && (
        <div className="mt-2 pt-2 border-t border-current/10">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {truncateResult(toolCall.result)}
          </p>
        </div>
      )}
      
      {/* Show error if failed */}
      {toolCall.status === "error" && (
        <div className="mt-2 pt-2 border-t border-destructive/20">
          <p className="text-xs text-destructive">
            Tool execution failed
          </p>
        </div>
      )}
    </div>
  );
}

function truncateResult(result: string, maxLength: number = 100): string {
  // Clean up the result a bit
  const cleaned = result.replace(/\n+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength) + "...";
}
