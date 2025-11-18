"use client";

import { useState } from "react";
import useNeighborhoodACS from "../hooks/useNeighborhoodACS";
import NeighborhoodACS from ".//NeighborhoodACS";
import { ScoreCard } from "./ScoreCard";

export default function CompareView() {
  const [zipA, setZipA] = useState("10001");
  const [zipB, setZipB] = useState("11211");

  const a = useNeighborhoodACS(zipA);
  const b = useNeighborhoodACS(zipB);

  const makeSummary = (data: typeof a.data | null) => {
    if (!data) return { population: "—", income: "—", poverty: "—" };
    return {
      population: data.total_population?.toLocaleString() ?? "—",
      income:
        data.median_household_income != null
          ? `$${Number(data.median_household_income).toLocaleString()}`
          : "—",
      poverty:
        data.poverty_rate != null
          ? `${(data.poverty_rate * 100).toFixed(1)}%`
          : "—",
    };
  };

  const A = makeSummary(a.data);
  const B = makeSummary(b.data);

  const diff = (numA?: number | null, numB?: number | null) => {
    if (numA == null || numB == null) return "—";
    const d = Number(numA) - Number(numB);
    return d >= 0 ? `+${d}` : `${d}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-sm text-muted-foreground">
            ZIP / Neighborhood A
          </label>
          <input
            type="text"
            value={zipA}
            onChange={(e) => setZipA(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm text-muted-foreground">
            ZIP / Neighborhood B
          </label>
          <input
            type="text"
            value={zipB}
            onChange={(e) => setZipB(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <ScoreCard title="Population" value={A.population} subtitle="A" />
        <ScoreCard title="Median income" value={A.income} subtitle="A" />
        <ScoreCard title="Poverty rate" value={A.poverty} subtitle="A" />

        <div className="flex-1" />

        <ScoreCard title="Population" value={B.population} subtitle="B" />
        <ScoreCard title="Median income" value={B.income} subtitle="B" />
        <ScoreCard title="Poverty rate" value={B.poverty} subtitle="B" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card rounded p-4">
          <h3 className="font-medium mb-2">Neighborhood A</h3>
          <NeighborhoodACS zip={zipA} />
        </div>
        <div className="bg-card rounded p-4">
          <h3 className="font-medium mb-2">Neighborhood B</h3>
          <NeighborhoodACS zip={zipB} />
        </div>
      </div>
    </div>
  );
}
