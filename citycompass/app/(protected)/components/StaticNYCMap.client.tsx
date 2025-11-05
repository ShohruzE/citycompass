"use client";

import { GeoJSON, MapContainer } from "react-leaflet";
import { useEffect, useState } from "react";
import type { FeatureCollection, Feature } from "geojson";
import { point, Layer, LeafletMouseEvent } from "leaflet";
import type L from "leaflet";
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

  const onEachDistrict = (feature: Feature, layer: Layer) => {
    const name =
      feature.properties?.cdtaname || feature.properties?.boroname || feature.properties?.cdta2020 || "Unknown";

    // Extract district ID from properties - try multiple possible fields
    const districtID =
      feature.properties?.cdta2020 ||
      feature.properties?.boro_cd ||
      feature.properties?.id ||
      feature.properties?.district_id ||
      feature.id ||
      null;

    layer.bindTooltip(name, {
      sticky: true,
      direction: "top",
      offset: point(0, -10),
      opacity: 0.9,
      className: "district-tooltip", // we'll style this next
    });

    // Cast layer to L.Path to access styling methods
    const pathLayer = layer as L.Path;

    layer.on({
      mouseover: () => {
        layer.openTooltip();
        pathLayer.setStyle({ fillColor: "#3a80ba" });
      },
      mouseout: () => {
        layer.closeTooltip();
        pathLayer.setStyle({ fillColor: "#7baac8" });
      },
      // Prevent tooltip glitching on click
      mousedown: (e: LeafletMouseEvent) => {
        e.originalEvent.preventDefault(); // stops focus/outline
        e.originalEvent.stopPropagation(); // stops re-focusing other polygons
      },
      // click: () => {
      //   const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      //   window.location.href = `/districts/${slug}`;
      // },
      click: (e: LeafletMouseEvent) => {
        // Check if the district ID exists
        if (!districtID) {
          console.error("No districtID found for this feature", feature);
          layer.bindPopup(`District ID not found.`).openPopup(e.latlng);
          return;
        }

        // Open a loading popup immediately at the clicked location
        layer.bindPopup("Loading prediction...").openPopup(e.latlng);

        // Make the API call to your backend
        fetch(`http://localhost:8000/api/ml/predict?community_district=${districtID}`)
          .then((res) => {
            if (!res.ok) {
              // Handle backend errors (e.g., 404 Not Found, 500 Server Error)
              return res.json().then((err) => {
                throw new Error(err.detail || `Error: ${res.statusText}`);
              });
            }
            return res.json();
          })
          .then((data) => {
            // --- 3. Format the successful response ---
            // 'data' is your JSON: { score, percentile, grade }
            // Guard against missing/undefined numeric values to avoid runtime errors
            const scoreText = typeof data?.score === "number" ? data.score.toFixed(2) : "—";
            const percentileText = typeof data?.percentile === "number" ? `${data.percentile.toFixed(1)}%` : "—";
            const gradeText = data?.grade ?? "—";

            const popupContent = `
            <div style="font-family: sans-serif; line-height: 1.4;">
              <h4 style="margin: 0 0 5px 0; font-size: 1.1rem;">${name} (${districtID})</h4>
              <p style="margin: 0;"><strong>Grade:</strong> ${gradeText}</p>
              <p style="margin: 0;"><strong>Percentile:</strong> ${percentileText}</p>
            </div>
          `;

            // Update the popup with the results
            layer.setPopupContent(popupContent);
          })
          .catch((err) => {
            // --- 4. Handle fetch errors ---
            console.error("Failed to fetch prediction:", err);
            layer.setPopupContent(`
            <div style="font-family: sans-serif; color: red;">
              <strong>Error loading data for ${districtID}</strong>
              <p style="margin: 2px 0 0 0; font-size: 0.9rem;">${err.message}</p>
            </div>
          `);
          });
      },
    });

    // Disable keyboard focus outline (for accessibility consistency)
    const element = pathLayer.getElement?.();
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
        {geoData && <GeoJSON data={geoData} style={() => districtStyle} onEachFeature={onEachDistrict} />}
      </MapContainer>
    </div>
  );
}
