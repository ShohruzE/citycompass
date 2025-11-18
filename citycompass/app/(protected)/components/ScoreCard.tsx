import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CardColor = "blue" | "green" | "amber" | "purple" | "red" | "indigo";

interface ScoreCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  score?: number;
  delta?: number;
  timeframe?: string;
  icon?: React.ReactNode;
  color?: CardColor;
}

const colorClasses: Record<CardColor, { bg: string; icon: string; border: string }> = {
  blue: {
    bg: "from-blue-50/50 to-blue-50/30 dark:from-blue-950/20 dark:to-blue-950/10",
    icon: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200/50 dark:border-blue-800/50",
  },
  green: {
    bg: "from-green-50/50 to-green-50/30 dark:from-green-950/20 dark:to-green-950/10",
    icon: "text-green-600 dark:text-green-400",
    border: "border-green-200/50 dark:border-green-800/50",
  },
  amber: {
    bg: "from-amber-50/50 to-amber-50/30 dark:from-amber-950/20 dark:to-amber-950/10",
    icon: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200/50 dark:border-amber-800/50",
  },
  purple: {
    bg: "from-purple-50/50 to-purple-50/30 dark:from-purple-950/20 dark:to-purple-950/10",
    icon: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200/50 dark:border-purple-800/50",
  },
  red: {
    bg: "from-red-50/50 to-red-50/30 dark:from-red-950/20 dark:to-red-950/10",
    icon: "text-red-600 dark:text-red-400",
    border: "border-red-200/50 dark:border-red-800/50",
  },
  indigo: {
    bg: "from-indigo-50/50 to-indigo-50/30 dark:from-indigo-950/20 dark:to-indigo-950/10",
    icon: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200/50 dark:border-indigo-800/50",
  },
};

export function ScoreCard({ title, value, subtitle, score, delta, timeframe, icon, color = "blue" }: ScoreCardProps) {
  const colors = colorClasses[color];

  if (value !== undefined) {
    return (
      <div
        className={cn(
          "group relative bg-gradient-to-br rounded-2xl shadow-sm hover:shadow-md p-5 w-[180px] border transition-all duration-200 hover:scale-[1.02]",
          colors.bg,
          colors.border,
          "hover:border-opacity-70"
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          {icon && <div className={cn("opacity-80", colors.icon)}>{icon}</div>}
        </div>
        <div className="text-2xl font-semibold mt-1 text-foreground leading-tight">{value}</div>
        {subtitle ? (
          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">{subtitle}</div>
        ) : null}
      </div>
    );
  }

  // Fallback to the original ScoreCard rendering when `score` is provided.
  const isPositive = (delta ?? 0) >= 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={cn(
        "group relative bg-gradient-to-br rounded-2xl shadow-sm hover:shadow-md p-5 w-[180px] border transition-all duration-200 hover:scale-[1.02]",
        colors.bg,
        colors.border,
        "hover:border-opacity-70"
      )}
    >
      {/* Title */}
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        {icon && <div className={cn("opacity-80", colors.icon)}>{icon}</div>}
      </div>

      {/* Score */}
      <div className="text-3xl font-semibold mt-1 text-foreground leading-tight">{score ?? "—"}</div>

      {/* Delta trend */}
      <div
        className={cn(
          "flex items-center text-xs mt-3 pt-2 border-t border-border/30 font-medium",
          isPositive
            ? "text-green-600 dark:text-green-400"
            : delta !== undefined && delta < 0
            ? "text-red-600 dark:text-red-400"
            : "text-muted-foreground"
        )}
      >
        <Icon
          className={cn(
            "w-3 h-3 mr-1",
            isPositive
              ? "text-green-600 dark:text-green-400"
              : delta !== undefined && delta < 0
              ? "text-red-600 dark:text-red-400"
              : "text-muted-foreground"
          )}
        />
        {isPositive ? "+" : ""}
        {delta ?? 0} vs last month
      </div>

      {/* Timeframe */}
      <div className="text-xs text-muted-foreground mt-1">{timeframe ?? ""}</div>
    </div>
  );
}
