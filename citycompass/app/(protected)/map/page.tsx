"use client";

import FullPageMap from "../components/FullPageMap";

export default function MapPage() {
  return (
    <div className="fixed inset-0 ml-60">
      <div className="h-full w-full flex flex-col">
        <header className="bg-background border-b border-border px-6 py-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Interactive Map
            </h1>
            <p className="text-sm text-muted-foreground">
              Explore NYC neighborhoods and community districts
            </p>
          </div>
        </header>
        <div className="flex-1 relative">
          <FullPageMap />
        </div>
      </div>
    </div>
  );
}
