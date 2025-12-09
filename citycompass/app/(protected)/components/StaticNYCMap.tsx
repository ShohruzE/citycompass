"use client";

import dynamic from "next/dynamic";

const StaticNYCMapClient = dynamic(() => import("./StaticNYCMap.client"), {
  ssr: false,
});

interface StaticNYCMapProps {
  currentZipCode?: string;
  compareZipCode?: string;
}

export default function StaticNYCMap({
  currentZipCode,
  compareZipCode,
}: StaticNYCMapProps) {
  return (
    <StaticNYCMapClient
      currentZipCode={currentZipCode}
      compareZipCode={compareZipCode}
    />
  );
}
