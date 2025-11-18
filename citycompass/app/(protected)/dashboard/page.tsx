"use client";

import InsightCard from "../components/InsightCard";
import StaticNYCMap from "../components/StaticNYCMap";
import { ScoreCard } from "../components/ScoreCard";
import { Leaf, ShieldCheck, Database, MapPin, Users, DollarSign, Calendar, AlertCircle } from "lucide-react";
import useNeighborhoodACS from "../hooks/useNeighborhoodACS";
import { useState, useEffect } from "react";
import { useUserLocation } from "@/lib/contexts/UserLocationContext";
import Link from "next/link";

export default function DashboardPage() {
  const {
    zipCode,
    borough,
    neighborhood,
    loading: locationLoading,
    error: locationError,
    refreshLocation,
  } = useUserLocation();

  // Use user's zip code or fallback to default
  const defaultZip = zipCode || "10001";
  const {
    data: acsData,
    loading: acsLoading,
    error: acsError,
    zip: acsZip,
    setZip: setAcsZip,
  } = useNeighborhoodACS(defaultZip);

  // Update ACS zip when location changes
  useEffect(() => {
    if (zipCode && zipCode !== acsZip) {
      setAcsZip(zipCode);
    }
  }, [zipCode, acsZip, setAcsZip]);

  // search input at top of page to change ZIP used across components
  // Start empty on page load even though the hook defaults to ZIP 10001.
  const [searchInput, setSearchInput] = useState<string>("");

  // format values for the small ScoreCards
  const population = acsData?.total_population != null ? acsData.total_population.toLocaleString() : "—";
  const medianIncome =
    acsData?.median_household_income != null ? `$${Number(acsData.median_household_income).toLocaleString()}` : "—";
  const medianAge = acsData?.median_age != null ? acsData.median_age.toFixed(1) : "—";
  const povertyRate = acsData?.poverty_rate != null ? `${(acsData.poverty_rate * 100).toFixed(1)}%` : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Neighborhood Dashboard</h1>
          <p className="text-sm text-muted-foreground">Discover insights for New York City neighborhoods</p>
        </div>

        <div className="flex items-center gap-3">
          {zipCode ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary/10 border border-primary/20">
              <MapPin className="w-4 h-4 text-primary" />
              <div className="text-sm">
                <span className="text-muted-foreground">Current Location: </span>
                <span className="font-semibold text-primary">{zipCode}</span>
                {neighborhood && <span className="text-muted-foreground ml-1">({neighborhood})</span>}
              </div>
            </div>
          ) : (
            <Link
              href="/survey"
              className="text-sm px-4 py-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors"
            >
              Set Location
            </Link>
          )}
          <button
            onClick={refreshLocation}
            disabled={locationLoading}
            className="text-sm px-4 py-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors disabled:opacity-50"
          >
            {locationLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = searchInput.trim();
          if (/^\d{5}$/.test(trimmed)) {
            // update the hook's ZIP so data + ScoreCards re-fetch and re-render
            setAcsZip(trimmed);
            // optional: clear input after submit
            setSearchInput("");
          }
        }}
        className="flex gap-3 items-center"
      >
        <input
          type="text"
          placeholder="Search neighborhood, ZIP, or representative..."
          className="flex-1 px-4 py-2 border border-input rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <div className="flex gap-2">
          {["Manhattan", "Safety", "Food Access"].map((tag) => (
            <span key={tag} className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
              {tag}
            </span>
          ))}
        </div>
      </form>

      {/* Score Cards*/}
      <div className="flex flex-wrap gap-4">
        <ScoreCard
          title="Population"
          value={population}
          subtitle={acsLoading ? "Loading…" : `ZIP: ${acsZip}`}
          icon={<Users className="w-4 h-4" />}
          color="blue"
        />
        <ScoreCard
          title="Median income"
          value={medianIncome}
          subtitle={acsLoading ? "Loading…" : `ZIP: ${acsZip}`}
          icon={<DollarSign className="w-4 h-4" />}
          color="green"
        />
        <ScoreCard
          title="Median age"
          value={medianAge}
          subtitle={acsLoading ? "Loading…" : `ZIP: ${acsZip}`}
          icon={<Calendar className="w-4 h-4" />}
          color="purple"
        />
        <ScoreCard
          title="Poverty rate"
          value={povertyRate}
          subtitle={acsLoading ? "Loading…" : `ZIP: ${acsZip}`}
          icon={<AlertCircle className="w-4 h-4" />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Map Section */}
        <div className="col-span-2 bg-card rounded-2xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-foreground">Neighborhood Overview</h2>
            <button className="text-sm text-primary hover:underline">Full Map</button>
          </div>
          <div className="w-full">
            <StaticNYCMap currentZipCode={zipCode || undefined} />
          </div>
        </div>

        {/* Right: Insights */}
        <div className="flex flex-col gap-4">
          <InsightCard
            color="green"
            icon={<Leaf className="w-4 h-4 text-green-600 dark:text-green-400" />}
            title="Food Access Strength"
            description="Your neighborhood ranks higher than 70% in Food Access but scores 12 points lower than average in Safety."
            actionText="View Details"
          />

          <InsightCard
            color="blue"
            icon={<ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            title="Safety Improvement"
            description="Safety projected to improve +4–6 points by April based on recent trends and city initiatives."
            actionText="See Forecast"
          />

          <InsightCard
            color="amber"
            icon={<Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            title="Data Update"
            description="New survey responses available. Your input helps improve neighborhood scoring accuracy."
            actionText="Take Survey"
          />
        </div>
      </div>
    </div>
  );
}
