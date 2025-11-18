"use client";

import React from "react";
import useNeighborhoodACS from "../hooks/useNeighborhoodACS";
import { ScoreCard } from "./ScoreCard";

export default function NeighborhoodACS({ zip }: { zip: string }) {
  const { data, loading, error } = useNeighborhoodACS(zip);

  const population =
    data?.total_population != null
      ? data.total_population.toLocaleString()
      : "—";
  const medianIncome =
    data?.median_household_income != null
      ? `$${Number(data.median_household_income).toLocaleString()}`
      : "—";
  const medianAge = data?.median_age != null ? data.median_age.toFixed(1) : "—";
  const povertyRate =
    data?.poverty_rate != null
      ? `${(data.poverty_rate * 100).toFixed(1)}%`
      : "—";

  if (loading)
    return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  if (error)
    return <div className="p-4 text-sm text-red-600">Error loading ACS</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <ScoreCard
          title="Population"
          value={population}
          subtitle={`ZIP: ${zip}`}
        />
        <ScoreCard
          title="Median income"
          value={medianIncome}
          subtitle={`ZIP: ${zip}`}
        />
        <ScoreCard
          title="Median age"
          value={medianAge}
          subtitle={`ZIP: ${zip}`}
        />
        <ScoreCard
          title="Poverty rate"
          value={povertyRate}
          subtitle={`ZIP: ${zip}`}
        />
      </div>
    </div>
  );
}
