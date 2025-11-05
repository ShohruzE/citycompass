"use client";

import InsightCard from "../components/InsightCard";
import StaticNYCMap from "../components/StaticNYCMap";
import NeighborhoodACS from "../components/NeighborhoodACS";
import { ScoreCard } from "../components/ScoreCard";
import { Leaf, ShieldCheck, Database } from "lucide-react";

const mockScores = [
  { title: "Overall Score", score: 78, delta: 2.3, timeframe: "+6mo" },
  { title: "Safety", score: 82, delta: 1.8, timeframe: "+6mo" },
  { title: "Cleanliness", score: 74, delta: -0.2, timeframe: "+6mo" },
  { title: "Food Access", score: 65, delta: -0.5, timeframe: "+6mo" },
  { title: "Financials", score: 71, delta: 1.2, timeframe: "+6mo" },
  { title: "Crime", score: 79, delta: 0.8, timeframe: "+6mo" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Neighborhood Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover insights for New York City neighborhoods
          </p>
        </div>

        <button className="text-sm px-4 py-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors">
          My Location
        </button>
      </header>

      {/* Search Bar */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="Search neighborhood, ZIP, or representative..."
          className="flex-1 px-4 py-2 border border-input rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex gap-2">
          {["Manhattan", "Safety", "Food Access"].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Score Cards */}
      <NeighborhoodACS zip="10001" />
      <div className="flex flex-wrap gap-4">
        {mockScores.map((s) => (
          <ScoreCard key={s.title} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Map Section */}
        <div className="col-span-2 bg-card rounded-2xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-foreground">
              Neighborhood Overview
            </h2>
            <button className="text-sm text-primary hover:underline">
              Full Map
            </button>
          </div>
          <div className="w-full">
            <StaticNYCMap />
          </div>
        </div>

        {/* Right: Insights */}
        <div className="flex flex-col gap-4">
          <InsightCard
            color="green"
            icon={
              <Leaf className="w-4 h-4 text-green-600 dark:text-green-400" />
            }
            title="Food Access Strength"
            description="Your neighborhood ranks higher than 70% in Food Access but scores 12 points lower than average in Safety."
            actionText="View Details"
          />

          <InsightCard
            color="blue"
            icon={
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            }
            title="Safety Improvement"
            description="Safety projected to improve +4–6 points by April based on recent trends and city initiatives."
            actionText="See Forecast"
          />

          <InsightCard
            color="amber"
            icon={
              <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            }
            title="Data Update"
            description="New survey responses available. Your input helps improve neighborhood scoring accuracy."
            actionText="Take Survey"
          />
        </div>
      </div>
    </div>
  );
}
