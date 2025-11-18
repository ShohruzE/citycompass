"use client";

import { useState, useEffect } from "react";

export type ACSEntry = {
  zcta: string;
  name: string;
  total_population?: number | null;
  median_household_income?: number | null;
  median_age?: number | null;
  poverty_count?: number | null;
  poverty_total?: number | null;
  poverty_rate?: number | null;
};

export default function useNeighborhoodACS(initialZip = "10001") {
  const [zip, setZip] = useState<string>(initialZip);
  const [data, setData] = useState<ACSEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const API_BASE =
      (process.env.NEXT_PUBLIC_API_BASE as string) || "http://127.0.0.1:8000";
    const url = `${API_BASE}/api/acs/neighborhood?zip=${zip}`;

    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Network response was not ok (status=${res.status})`);
        }
        return res.json();
      })
      .then((json) => {
        if (!mounted) return;
        setData(json);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message ?? "Failed to load data");
        setData(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [zip]);

  return { data, loading, error, zip, setZip } as const;
}
