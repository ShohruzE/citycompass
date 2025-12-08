"use client";

import InsightCard from "../components/InsightCard";
import StaticNYCMap from "../components/StaticNYCMap";
import { ScoreCard } from "../components/ScoreCard";
import {
  Leaf,
  ShieldCheck,
  Database,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  AlertCircle,
} from "lucide-react";
import useNeighborhoodACS from "../hooks/useNeighborhoodACS";
import { useState, useEffect } from "react";
import { useUserLocation } from "@/lib/contexts/UserLocationContext";
import Link from "next/link";
import { LocationSearchCombobox } from "../components/LocationSearchCombobox";
import { LocationBadge } from "../components/LocationBadge";
import { getDisplayNameForZip, type Location } from "@/lib/data/nyc-locations";
import { inferBoroughFromZip } from "@/lib/actions/location";

export default function DashboardPage() {
  const {
    zipCode,
    neighborhood,
    loading: locationLoading,
    refreshLocation,
    updateLocation,
  } = useUserLocation();

  // Use user's zip code or fallback to default
  const defaultZip = zipCode || "10001";

  // State for viewing location (can be different from saved location)
  const [viewingZip, setViewingZip] = useState<string>(defaultZip);
  const [viewingLocation, setViewingLocation] = useState<Location | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  // Update viewing zip when user's saved location changes
  useEffect(() => {
    if (zipCode && zipCode !== viewingZip) {
      setViewingZip(zipCode);
      setViewingLocation(null);
    }
  }, [zipCode, viewingZip]);

  const {
    data: acsData,
    loading: acsLoading,
    zip: acsZip,
    setZip: setAcsZip,
  } = useNeighborhoodACS(viewingZip);

  // Update ACS zip when viewing location changes
  useEffect(() => {
    if (viewingZip && viewingZip !== acsZip) {
      setAcsZip(viewingZip);
    }
  }, [viewingZip, acsZip, setAcsZip]);

  // Check if user is viewing a different location than their saved one
  const isViewingDifferentLocation = viewingZip !== zipCode;

  // format values for the small ScoreCards
  const population =
    acsData?.total_population != null
      ? acsData.total_population.toLocaleString()
      : "—";
  const medianIncome =
    acsData?.median_household_income != null
      ? `$${Number(acsData.median_household_income).toLocaleString()}`
      : "—";
  const medianAge =
    acsData?.median_age != null ? acsData.median_age.toFixed(1) : "—";
  const povertyRate =
    acsData?.poverty_rate != null
      ? `${(acsData.poverty_rate * 100).toFixed(1)}%`
      : "—";

  // Helper functions for dynamic insights
  const getIncomeInsight = (income: number | null | undefined): string => {
    if (income == null) return "—";
    if (income >= 100000) return "High Income Area";
    if (income >= 70000) return "Above Average Income";
    if (income >= 50000) return "Average Income Area";
    return "Lower Income Area";
  };

  const getAgeInsight = (age: number | null | undefined): string => {
    if (age == null) return "—";
    if (age < 30) return "Young Demographic";
    if (age < 40) return "Young Professionals";
    if (age <= 50) return "Family-Oriented";
    return "Mature Community";
  };

  const getPopInsight = (pop: number | null | undefined): string => {
    if (!pop) return "—";
    return pop > 30000 ? "High Population Density" : "Moderate Density";
  };

  const getPovertyInsight = (rate: number | null | undefined): string => {
    if (rate == null) return "—";
    return rate < 0.15 ? "Low Poverty Rate" : "Moderate Poverty Rate";
  };

  const incomeInsight = getIncomeInsight(acsData?.median_household_income);
  const ageInsight = getAgeInsight(acsData?.median_age);
  const popInsight = getPopInsight(acsData?.total_population);
  const povertyInsight = getPovertyInsight(acsData?.poverty_rate);

  // Handle location search selection
  const handleLocationChange = (newZipCode: string, location: Location | null) => {
    setViewingZip(newZipCode);
    setViewingLocation(location);
  };

  // Handle setting the viewing location as the user's saved location
  const handleSetAsMyLocation = async () => {
    if (!viewingZip) return;

    setIsUpdatingLocation(true);
    try {
      const locationBorough = viewingLocation?.borough || inferBoroughFromZip(viewingZip);
      const locationName = viewingLocation?.label || neighborhood;

      await updateLocation(viewingZip, locationBorough ?? undefined, locationName ?? undefined);
      // Success - the context will update automatically
    } catch (error) {
      console.error("Failed to update location:", error);
      alert("Failed to set location. Please try again.");
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // Get display name for current viewing location
  const viewingLocationName = viewingLocation?.label || getDisplayNameForZip(viewingZip);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Neighborhood Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover insights for New York City neighborhoods</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {zipCode && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border transition-all duration-200 hover:bg-muted">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <div className="text-xs">
                <span className="text-muted-foreground">Saved: </span>
                <span className="font-medium text-foreground">{zipCode}</span>
              </div>
            </div>
          )}
          <button
            onClick={refreshLocation}
            disabled={locationLoading}
            aria-label="Refresh your saved location"
            className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {locationLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </header>

      {/* Location Badge and Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <LocationBadge
            zipCode={viewingZip}
            locationName={viewingLocationName}
            isUserLocation={!isViewingDifferentLocation}
            className="w-full sm:w-auto"
          />

          {isViewingDifferentLocation && (
            <button
              onClick={handleSetAsMyLocation}
              disabled={isUpdatingLocation}
              aria-label="Set current viewing location as your saved location"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md focus:ring-2 focus:ring-primary focus:ring-offset-2 whitespace-nowrap"
            >
              {isUpdatingLocation ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Saving...
                </span>
              ) : (
                "Set as My Location"
              )}
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="w-full">
          <LocationSearchCombobox value={viewingZip} onChange={handleLocationChange} disabled={locationLoading} />
        </div>

        {/* Error Display */}
        {locationError && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm animate-in fade-in-50 duration-300"
          >
            <span className="font-medium">Error: </span>
            {locationError}
          </div>
        )}
      </div>

      {/* Score Cards*/}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Population"
          value={acsLoading ? "—" : population}
          subtitle={acsLoading ? "Loading…" : `ZIP: ${acsZip}`}
          icon={<Users className="w-4 h-4" />}
          color="blue"
          insight={acsLoading ? "—" : popInsight}
        />
        <ScoreCard
          title="Median income"
          value={acsLoading ? "—" : medianIncome}
          subtitle={acsLoading ? "Loading…" : `ZIP: ${acsZip}`}
          icon={<DollarSign className="w-4 h-4" />}
          color="green"
          insight={acsLoading ? "—" : incomeInsight}
        />
        <ScoreCard
          title="Median age"
          value={acsLoading ? "—" : medianAge}
          subtitle={acsLoading ? "Loading…" : `ZIP: ${acsZip}`}
          icon={<Calendar className="w-4 h-4" />}
          color="purple"
          insight={acsLoading ? "—" : ageInsight}
        />
        <ScoreCard
          title="Poverty rate"
          value={acsLoading ? "—" : povertyRate}
          subtitle={acsLoading ? "Loading…" : `ZIP: ${acsZip}`}
          icon={<AlertCircle className="w-4 h-4" />}
          color="amber"
          insight={acsLoading ? "—" : povertyInsight}
        />
      </div>

      {/* ACS Error Display */}
      {acsError && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm animate-in fade-in-50 duration-300"
        >
          <span className="font-medium">Note: </span>
          Unable to load demographic data for this location. The data may not be available for this ZIP code.
        </div>
      )}

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
            <StaticNYCMap currentZipCode={viewingZip || undefined} />
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
