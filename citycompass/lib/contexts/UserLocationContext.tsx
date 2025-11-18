"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface UserLocation {
  zipCode: string | null;
  borough: string | null;
  neighborhood: string | null;
  createdAt: string | null;
}

interface UserLocationContextType {
  zipCode: string | null;
  borough: string | null;
  neighborhood: string | null;
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
}

const UserLocationContext = createContext<UserLocationContextType | undefined>(undefined);

const STORAGE_KEY = "user_current_location";
const STORAGE_TIMESTAMP_KEY = "user_current_location_timestamp";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function UserLocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<UserLocation>({
    zipCode: null,
    borough: null,
    neighborhood: null,
    createdAt: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE = (process.env.NEXT_PUBLIC_API_BASE as string) || "http://127.0.0.1:8000";
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE}/api/survey/current-location`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error(`Failed to fetch location: ${response.statusText}`);
      }

      const data = await response.json();

      const locationData: UserLocation = {
        zipCode: data.zip_code || null,
        borough: data.borough || null,
        neighborhood: data.neighborhood || null,
        createdAt: data.created_at || null,
      };

      setLocation(locationData);

      // Store in localStorage with timestamp
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(locationData));
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch location";
      setError(errorMessage);
      console.error("Error fetching user location:", err);

      // Try to load from localStorage as fallback
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(STORAGE_KEY);
        const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
        if (cached && timestamp) {
          const age = Date.now() - parseInt(timestamp, 10);
          if (age < CACHE_TTL) {
            try {
              const cachedData = JSON.parse(cached) as UserLocation;
              setLocation(cachedData);
              setError(null);
            } catch {
              // Invalid cache, ignore
            }
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load from localStorage on mount, then fetch fresh data
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Try to load from localStorage first for instant display
    const cached = localStorage.getItem(STORAGE_KEY);
    const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < CACHE_TTL) {
        try {
          const cachedData = JSON.parse(cached) as UserLocation;
          setLocation(cachedData);
          setLoading(false);
        } catch {
          // Invalid cache, ignore
        }
      }
    }

    // Fetch fresh data
    fetchLocation();
  }, [fetchLocation]);

  const refreshLocation = useCallback(async () => {
    await fetchLocation();
  }, [fetchLocation]);

  const value: UserLocationContextType = {
    zipCode: location.zipCode,
    borough: location.borough,
    neighborhood: location.neighborhood,
    loading,
    error,
    refreshLocation,
  };

  return <UserLocationContext.Provider value={value}>{children}</UserLocationContext.Provider>;
}

export function useUserLocation(): UserLocationContextType {
  const context = useContext(UserLocationContext);
  if (context === undefined) {
    throw new Error("useUserLocation must be used within a UserLocationProvider");
  }
  return context;
}
