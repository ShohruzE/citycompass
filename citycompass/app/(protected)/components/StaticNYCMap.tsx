"use client";

import dynamic from "next/dynamic";

const StaticNYCMapClient = dynamic(() => import("./StaticNYCMap.client"), {
  ssr: false,
});

export default function StaticNYCMap() {
  return <StaticNYCMapClient />;
}
