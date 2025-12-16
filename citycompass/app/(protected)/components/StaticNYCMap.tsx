"use client";

import dynamic from "next/dynamic";

const StaticNYCMapClient = dynamic(() => import("./StaticNYCMap.client"), {
  ssr: false,
});

interface StaticNYCMapProps {
  currentZipCode?: string;
}

export default function StaticNYCMap({ currentZipCode }: StaticNYCMapProps) {
  return <StaticNYCMapClient currentZipCode={currentZipCode} />;
}
