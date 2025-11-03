"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  title: string;
  description: string;
  color?: "green" | "blue" | "amber";
  actionText?: string;
  icon?: ReactNode;
}

export default function InsightCard({
  title,
  description,
  color = "blue",
  actionText,
  icon,
}: InsightCardProps) {
  // use Tailwind color utilities instead of hard-coded hex
  const colorStyles =
    color === "green"
      ? "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100"
      : color === "blue"
      ? "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100"
      : "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-100";

  return (
    <div
      className={cn(
        "flex flex-col justify-between border rounded-xl p-4 text-sm transition-colors",
        colorStyles
      )}
    >
      <div>
        <div className="flex items-center gap-2 font-semibold mb-1">
          {icon}
          <span>{title}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-snug">
          {description}
        </p>
      </div>

      {actionText && (
        <button className="mt-3 text-xs font-medium text-primary hover:underline self-start">
          {actionText}
        </button>
      )}
    </div>
  );
}
