"use client";

import { GeoJSON, MapContainer } from "react-leaflet";
import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";
import { point } from "leaflet";
import type * as L from "leaflet";
import "leaflet/dist/leaflet.css"; // important

export default function StaticNYCMap() {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch("/nyc_community_districts.geojson")
      .then((res) => res.json())
      .then(setGeoData)
      .catch((err) => console.error("Failed to load GeoJSON", err));
  }, []);

  // Base map style (no background, just polygons)
  const districtStyle = {
    color: "#fff",
    weight: 1,
    fillColor: "#7baac8",
    fillOpacity: 0.85,
  };

  const onEachDistrict = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const name =
      feature.properties?.cdtaname ||
      feature.properties?.boroname ||
      feature.properties?.cdta2020 ||
      "Unknown";
    
    
    (layer as L.Path).bindTooltip(name, {
      sticky: true,
      direction: "top",
      offset: point(0, -10),
      opacity: 0.9,
      className: "district-tooltip", // we'll style this next
    });

    layer.on({
      mouseover: () => {
        (layer as L.Path).openTooltip();
        (layer as L.Path).setStyle({ fillColor: "#3a80ba" });
      },
      mouseout: () => {
        (layer as L.Path).closeTooltip();
        (layer as L.Path).setStyle({ fillColor: "#7baac8" });
      },
      // Prevent tooltip glitching on click
      mousedown: (e: L.LeafletMouseEvent) => {
        e.originalEvent.preventDefault(); // stops focus/outline
        e.originalEvent.stopPropagation(); // stops re-focusing other polygons
      },
      click: () => {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        window.location.href = `/districts/${slug}`;
      },
    });

    // Disable keyboard focus outline (for accessibility consistency)
    const element = (layer as L.Path).getElement?.();
    if (element) {
      element.setAttribute("tabindex", "-1");
    }
  };

  return (
    <div className="static-nyc-map relative z-0 isolate pointer-events-auto w-full h-[500px] rounded-2xl shadow-md overflow-hidden">
      <MapContainer
        center={[40.7128, -74.006]} // NYC center
        zoom={10}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{
          height: "100%",
          width: "100%",
          background: "transparent",
        }}
      >
        {geoData && (
          <GeoJSON
            data={geoData}
            style={() => districtStyle}
            onEachFeature={onEachDistrict}
          />
        )}
      </MapContainer>
    </div>
  );
}
