import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface ScoreCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  score?: number;
  delta?: number;
  timeframe?: string;
}

export function ScoreCard({
  title,
  value,
  subtitle,
  score,
  delta,
  timeframe,
}: ScoreCardProps) {
  if (value !== undefined) {
    return (
      <div className="bg-card rounded-2xl shadow-sm p-4 w-[180px] border border-border transition-colors">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="text-2xl font-semibold mt-1 text-foreground">
          {value}
        </div>
        {subtitle ? (
          <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
        ) : null}
      </div>
    );
  }

  // Fallback to the original ScoreCard rendering when `score` is provided.
  const isPositive = (delta ?? 0) >= 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="bg-card rounded-2xl shadow-sm p-4 w-[180px] border border-border transition-colors">
      {/* Title */}
      <div className="text-sm text-muted-foreground">{title}</div>

      {/* Score */}
      <div className="text-3xl font-semibold mt-1 text-foreground">
        {score ?? "—"}
      </div>

      {/* Delta trend */}
      <div
        className={`flex items-center text-xs mt-2 ${
          isPositive
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {isPositive ? "+" : ""}
        {delta ?? 0} vs last month
      </div>

      {/* Timeframe */}
      <div className="text-xs text-muted-foreground mt-1">
        {timeframe ?? ""}
      </div>
    </div>
  );
}
