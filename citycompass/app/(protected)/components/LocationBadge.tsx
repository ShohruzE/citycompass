"use client";

import { MapPin, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationBadgeProps {
  zipCode: string;
  locationName?: string;
  isUserLocation: boolean; // true if this is the user's saved location
  className?: string;
}

export function LocationBadge({
  zipCode,
  locationName,
  isUserLocation,
  className,
}: LocationBadgeProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={
        isUserLocation
          ? `Your saved location: ${locationName || zipCode}`
          : `Currently viewing: ${locationName || zipCode}`
      }
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-300 ease-in-out",
        isUserLocation
          ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
          : "bg-muted border-border text-foreground",
        className
      )}
    >
      {isUserLocation ? (
        <MapPin className="w-4 h-4 flex-shrink-0 animate-pulse" />
      ) : (
        <Info className="w-4 h-4 flex-shrink-0" />
      )}
      
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium opacity-75 uppercase tracking-wide">
          {isUserLocation ? "Your Location" : "Viewing"}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-sm truncate">
            {locationName || zipCode}
          </span>
          {locationName && (
            <span className="text-xs opacity-60 whitespace-nowrap">({zipCode})</span>
          )}
        </div>
      </div>
    </div>
  );
}

