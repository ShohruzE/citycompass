"use client";

import { cn } from "@/lib/utils";
import { MapPin, TrendingUp, Users, DollarSign, ChevronRight } from "lucide-react";

export interface NeighborhoodData {
  zip: string;
  borough?: string;
  district?: string;
  nsqiScore?: number;
  grade?: string;
  income?: number;
  population?: number;
  povertyRate?: number;
}

interface NeighborhoodResultCardProps {
  data: NeighborhoodData;
  onClick?: () => void;
  className?: string;
}

// Grade color mapping
const GRADE_COLORS: Record<string, string> = {
  "A": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "B": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "C": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "D": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "F": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function NeighborhoodResultCard({
  data,
  onClick,
  className,
}: NeighborhoodResultCardProps) {
  const gradeColor = data.grade ? GRADE_COLORS[data.grade[0]] || GRADE_COLORS["C"] : "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left",
        "rounded-xl border border-border bg-card",
        "hover:border-primary/50 hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-primary/20",
        "transition-all duration-200",
        "group",
        className
      )}
    >
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <MapPin className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-foreground">
                  ZIP {data.zip}
                </span>
                {data.grade && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-bold",
                    gradeColor
                  )}>
                    {data.grade}
                  </span>
                )}
              </div>
              {data.borough && (
                <span className="text-xs text-muted-foreground">
                  {data.borough}
                  {data.district && ` • District ${data.district}`}
                </span>
              )}
            </div>
          </div>
          
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {data.nsqiScore !== undefined && (
            <Stat
              icon={TrendingUp}
              label="NSQI"
              value={`${data.nsqiScore.toFixed(0)}`}
              color="text-blue-600 dark:text-blue-400"
            />
          )}
          {data.income !== undefined && (
            <Stat
              icon={DollarSign}
              label="Income"
              value={formatIncome(data.income)}
              color="text-green-600 dark:text-green-400"
            />
          )}
          {data.povertyRate !== undefined && (
            <Stat
              icon={Users}
              label="Poverty"
              value={`${(data.povertyRate * 100).toFixed(1)}%`}
              color="text-amber-600 dark:text-amber-400"
            />
          )}
        </div>
      </div>
      
      {/* Click hint */}
      <div className="px-3 py-1.5 border-t border-border bg-muted/30 rounded-b-xl">
        <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
          Click to view in dashboard
        </span>
      </div>
    </button>
  );
}

function Stat({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn("w-3 h-3", color)} />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className="text-xs font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function formatIncome(income: number): string {
  if (income >= 1000000) {
    return `$${(income / 1000000).toFixed(1)}M`;
  }
  if (income >= 1000) {
    return `$${(income / 1000).toFixed(0)}k`;
  }
  return `$${income}`;
}

// ============================================================================
// Parser for extracting neighborhood data from tool results
// ============================================================================

export function parseNeighborhoodData(result: string, toolName: string): NeighborhoodData[] {
  const neighborhoods: NeighborhoodData[] = [];

  try {
    // Pattern for NSQI results
    // e.g., "NSQI Results for ZIP 10001 (Manhattan, District MN01):"
    const nsqiPattern = /NSQI Results for ZIP (\d{5}) \(([^,]+)(?:, District ([A-Z]{2}\d+))?\):\s*.*?Score: ([\d.]+)\/100\s*.*?Grade: ([A-F])/gs;
    
    // Pattern for search results
    // e.g., "1. ZIP 10001 - Manhattan (District MN01)\n   NSQI: 75.2/100 (Grade B)"
    const searchPattern = /(?:\d+\.\s+)?ZIP (\d{5})\s*-\s*([^\s(]+)\s*\(District ([A-Z]{2}\d+)\)[\s\S]*?NSQI:\s*([\d.]+)\/100\s*\(Grade\s*([A-F])\)(?:[\s\S]*?Median Income:\s*\$?([\d,]+))?(?:[\s\S]*?Poverty Rate:\s*([\d.]+)%)?/g;

    // Pattern for comparison results
    const comparisonPattern = /(\d{5})\s*\(([^)]+)\):\s*([\d.]+)\/100\s*\(Grade\s*([A-F])\)/g;

    // Pattern for ACS demographics
    const acsPattern = /ACS Demographics for ZIP (\d{5})[\s\S]*?Total Population:\s*([\d,]+)[\s\S]*?Median Household Income:\s*\$?([\d,]+)[\s\S]*?Poverty Rate:\s*([\d.]+)%/g;

    let match;

    // Try NSQI pattern
    while ((match = nsqiPattern.exec(result)) !== null) {
      neighborhoods.push({
        zip: match[1],
        borough: match[2],
        district: match[3],
        nsqiScore: parseFloat(match[4]),
        grade: match[5],
      });
    }

    // Try search pattern
    while ((match = searchPattern.exec(result)) !== null) {
      neighborhoods.push({
        zip: match[1],
        borough: match[2],
        district: match[3],
        nsqiScore: parseFloat(match[4]),
        grade: match[5],
        income: match[6] ? parseInt(match[6].replace(/,/g, "")) : undefined,
        povertyRate: match[7] ? parseFloat(match[7]) / 100 : undefined,
      });
    }

    // Try comparison pattern (only if no results yet)
    if (neighborhoods.length === 0) {
      while ((match = comparisonPattern.exec(result)) !== null) {
        neighborhoods.push({
          zip: match[1],
          borough: match[2],
          nsqiScore: parseFloat(match[3]),
          grade: match[4],
        });
      }
    }

    // Try ACS pattern (only if no results yet)
    if (neighborhoods.length === 0) {
      while ((match = acsPattern.exec(result)) !== null) {
        neighborhoods.push({
          zip: match[1],
          population: parseInt(match[2].replace(/,/g, "")),
          income: parseInt(match[3].replace(/,/g, "")),
          povertyRate: parseFloat(match[4]) / 100,
        });
      }
    }

  } catch (error) {
    console.warn("Failed to parse neighborhood data:", error);
  }

  return neighborhoods;
}
