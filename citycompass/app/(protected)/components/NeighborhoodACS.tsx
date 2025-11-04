"use client";

import { useState, useEffect } from "react";

export default function NeighborhoodACS({ zip = "10001" }: { zip?: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // Use NEXT_PUBLIC_API_BASE to target the backend in development. If it's not set,
    // fall back to the local backend address. This prevents relative `/api` calls from
    // being handled by Next's own server (which would return 404 in dev).
    const API_BASE =
      (process.env.NEXT_PUBLIC_API_BASE as string) || "http://127.0.0.1:8000";
    const url = `${API_BASE}/api/acs/neighborhood?zip=${zip}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Network response was not ok (status=${res.status})`);
        }
        return res.json();
      })
      .then((json) => {
        if (mounted) {
          setData(json);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [zip]);

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }
  if (!data) {
    return <div>No data available.</div>;
  }

  return (
    <div>
      <h3>{data.name ?? `ZCTA ${data.zcta}`}</h3>
      <div>Population: {data.total_population ?? "—"}</div>
      <div>Median income: {data.median_household_income ?? "—"}</div>
      <div>
        Poverty rate:{" "}
        {data.poverty_rate ? `${(data.poverty_rate * 100).toFixed(1)}%` : "—"}
      </div>
    </div>
  );
}
