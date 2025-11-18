"use client";

import CompareView from "../components/CompareView";

export default function ComparePage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Compare Neighborhoods
          </h1>
          <p className="text-sm text-muted-foreground">
            Compare two neighborhoods side-by-side.
          </p>
        </div>
      </header>

      <CompareView />
    </div>
  );
}
