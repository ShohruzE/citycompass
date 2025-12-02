"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import useNeighborhoodACS from "../hooks/useNeighborhoodACS";
import StaticNYCMap from "./StaticNYCMap";

export default function CompareView() {
  const [zipA, setZipA] = useState("10001");
  const [zipB, setZipB] = useState("11211");

  const a = useNeighborhoodACS(zipA);
  const b = useNeighborhoodACS(zipB);

  const [nsqiA, setNsqiA] = useState<number | null>(null);
  const [nsqiB, setNsqiB] = useState<number | null>(null);
  const [nsqiLoadingA, setNsqiLoadingA] = useState(false);
  const [nsqiLoadingB, setNsqiLoadingB] = useState(false);

  // NEED TO FIX NSQI FETCHING

  // useEffect(() => {
  //   async function fetchNsqiForZip(
  //     zip: string,
  //     setter: (v: number | null) => void,
  //     setLoading: (b: boolean) => void
  //   ) {
  //     setLoading(true);
  //     try {
  //       const API_BASE =
  //         (process.env.NEXT_PUBLIC_API_BASE as string) ||
  //         "http://127.0.0.1:8000";
  //       const res = await fetch(
  //         `${API_BASE}/api/ml/predict?community_district=${encodeURIComponent(
  //           zip
  //         )}`
  //       );
  //       if (!res.ok) {
  //         setter(null);
  //         return;
  //       }
  //       const json = await res.json();

  //       // Accept multiple possible response shapes
  //       let score: number | null = null;
  //       if (typeof json?.score === "number") score = json.score;
  //       else if (typeof json?.nsqi === "number") score = json.nsqi;
  //       else if (typeof json?.pred === "number") score = json.pred;
  //       else if (typeof json?.prediction === "number") score = json.prediction;
  //       else if (
  //         Array.isArray(json?.predictions) &&
  //         typeof json.predictions[0]?.score === "number"
  //       )
  //         score = json.predictions[0].score;
  //       else if (typeof json === "number") score = json;

  //       setter(score);
  //     } catch (err) {
  //       console.error("NSQI fetch failed:", err);
  //       setter(null);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  //   fetchNsqiForZip(zipA, setNsqiA, setNsqiLoadingA);
  //   fetchNsqiForZip(zipB, setNsqiB, setNsqiLoadingB);
  // }, [zipA, zipB]);

  const compare = (
    aVal?: number | null,
    bVal?: number | null,
    higherIsBetter = true
  ) => {
    if (aVal == null || bVal == null) return "na";
    if (aVal === bVal) return "tie";
    if (higherIsBetter) return aVal > bVal ? "a" : "b";
    return aVal < bVal ? "a" : "b";
  };

  const summaryA = {
    population: a.data?.total_population ?? null,
    income: a.data?.median_household_income ?? null,
    poverty: a.data?.poverty_rate ?? null,
    // safety: a.data?.safety_score ?? null,
    // cleanliness: a.data?.cleanliness_score ?? null,
    nsqi: nsqiA,
  };
  const summaryB = {
    population: b.data?.total_population ?? null,
    income: b.data?.median_household_income ?? null,
    poverty: b.data?.poverty_rate ?? null,
    // safety: b.data?.safety_score ?? null,
    // cleanliness: b.data?.cleanliness_score ?? null,
    nsqi: nsqiB,
  };

  const metrics = useMemo(
    () => [
      {
        key: "population",
        label: "Population",
        a: summaryA.population,
        b: summaryB.population,
        higherIsBetter: true,
        format: (v: number | null) =>
          v == null ? "—" : Number(v).toLocaleString(),
      },
      {
        key: "median_income",
        label: "Median Income",
        a: summaryA.income,
        b: summaryB.income,
        higherIsBetter: true,
        format: (v: number | null) =>
          v == null ? "—" : `$${Number(v).toLocaleString()}`,
      },
      {
        key: "poverty_rate",
        label: "Poverty Rate",
        a: summaryA.poverty != null ? summaryA.poverty * 100 : null,
        b: summaryB.poverty != null ? summaryB.poverty * 100 : null,
        higherIsBetter: false,
        format: (v: number | null) => (v == null ? "—" : `${v.toFixed(1)}%`),
      },
      // { key: "safety", label: "Safety Score", a: summaryA.safety, b: summaryB.safety, higherIsBetter: true, format: (v: number | null) => (v == null ? "—" : `${v}/100`) },
      // { key: "cleanliness", label: "Cleanliness Score", a: summaryA.cleanliness, b: summaryB.cleanliness, higherIsBetter: true, format: (v: number | null) => (v == null ? "—" : `${v}/100`) },
      {
        key: "nsqi",
        label: "NSQI Score",
        a: summaryA.nsqi,
        b: summaryB.nsqi,
        higherIsBetter: true,
        format: (v: number | null) =>
          v == null ? "—" : `${Math.round(Number(v))}/100`,
      },
    ],
    [summaryA, summaryB]
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm text-muted-foreground block mb-1">
            Neighborhood / ZIP A
          </label>
          <input
            className="w-full px-3 py-2 border rounded"
            placeholder="Enter ZIP (e.g., 10003)"
            value={zipA}
            onChange={(e) => setZipA(e.target.value)}
          />
        </div>

        <div className="flex-1">
          <label className="text-sm text-muted-foreground block mb-1">
            Neighborhood / ZIP B
          </label>
          <input
            className="w-full px-3 py-2 border rounded"
            placeholder="Enter ZIP (e.g., 11211)"
            value={zipB}
            onChange={(e) => setZipB(e.target.value)}
          />
        </div>

        <div>
          <button
            className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              a.setZip(zipA);
              b.setZip(zipB);
              console.log("button clicked");
            }}
          >
            Compare
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-blue-200 bg-blue-50 rounded-2xl overflow-hidden">
          <CardHeader className="bg-blue-50 border-b border-blue-200 rounded-t-2xl">
            <CardTitle className="text-slate-900">{zipA}</CardTitle>
            <p className="text-sm text-blue-700 mt-1">Zip Code: {zipA}</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-blue-100 p-3 rounded-lg">
                <p className="text-xs text-blue-700 mb-1">Population</p>
                <p className="text-lg font-bold text-slate-900">
                  {summaryA.population
                    ? Number(summaryA.population).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div className="bg-white border border-blue-100 p-3 rounded-lg">
                <p className="text-xs text-blue-700 mb-1">Median Income</p>
                <p className="text-lg font-bold text-slate-900">
                  {summaryA.income
                    ? `$${Number(summaryA.income).toLocaleString()}`
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 rounded-2xl overflow-hidden">
          <CardHeader className="bg-red-50 border-b border-red-200 rounded-t-2xl">
            <CardTitle className="text-slate-900">{zipB}</CardTitle>
            <p className="text-sm text-red-700 mt-1">Zip Code: {zipB}</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-red-100 p-3 rounded-lg">
                <p className="text-xs text-red-700 mb-1">Population</p>
                <p className="text-lg font-bold text-slate-900">
                  {summaryB.population
                    ? Number(summaryB.population).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div className="bg-white border border-red-100 p-3 rounded-lg">
                <p className="text-xs text-red-700 mb-1">Median Income</p>
                <p className="text-lg font-bold text-slate-900">
                  {summaryB.income
                    ? `$${Number(summaryB.income).toLocaleString()}`
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border">
        <StaticNYCMap {...({ highlightZips: [zipA, zipB] } as any)} />
      </div>

      <Card className="border-slate-200 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-slate-900">Detailed Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((m) => {
              const winner = compare(
                typeof m.a === "number" ? m.a : null,
                typeof m.b === "number" ? m.b : null,
                m.higherIsBetter
              );
              const aWins = winner === "a";
              const bWins = winner === "b";

              // show Loading for NSQI specifically
              const aDisplay =
                m.key === "nsqi" && nsqiLoadingA
                  ? "Loading…"
                  : m.format(m.a as number | null);
              const bDisplay =
                m.key === "nsqi" && nsqiLoadingB
                  ? "Loading…"
                  : m.format(m.b as number | null);

              return (
                <div
                  key={m.key}
                  className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition"
                >
                  <div className="flex-1">
                    <p className="text-slate-900 font-medium">{m.label}</p>
                  </div>

                  <div
                    className={`flex-1 text-center p-3 rounded-lg mr-2 transition ${
                      aWins
                        ? "bg-green-100 border border-green-400"
                        : "bg-white border border-slate-200"
                    }`}
                  >
                    <p
                      className={`font-bold text-sm ${
                        aWins ? "text-green-700" : "text-slate-700"
                      }`}
                    >
                      {aDisplay}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">{zipA}</p>
                    {aWins && (
                      <p className="text-xs text-green-700 font-semibold mt-1 flex items-center justify-center gap-1">
                        <TrendingUp size={12} /> Better
                      </p>
                    )}
                  </div>

                  <div
                    className={`flex-1 text-center p-3 rounded-lg transition ${
                      bWins
                        ? "bg-green-100 border border-green-400"
                        : "bg-white border border-slate-200"
                    }`}
                  >
                    <p
                      className={`font-bold text-sm ${
                        bWins ? "text-green-700" : "text-slate-700"
                      }`}
                    >
                      {bDisplay}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">{zipB}</p>
                    {bWins && (
                      <p className="text-xs text-green-700 font-semibold mt-1 flex items-center justify-center gap-1">
                        <TrendingUp size={12} /> Better
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
