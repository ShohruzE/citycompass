"use client";

import { GeoJSON, MapContainer } from "react-leaflet";
import { useEffect, useState } from "react";
import type { FeatureCollection, Feature } from "geojson";
import { point, Layer, LeafletMouseEvent } from "leaflet";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";

//Districts missing from our model dataset
const MISSING_DISTRICTS = [
  "BX26", "BX27", "BX28", "MN64", "SI95",
  "QN80", "QN81", "QN82", "QN83", "QN84",
  "BK55", "BK56",
];

export default function StaticNYCMap() {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch("/nyc_community_districts.geojson")
      .then((res) => res.json())
      .then(setGeoData)
      .catch((err) => console.error("Failed to load GeoJSON", err));
  }, []);

  // Base map style
  const getDistrictStyle = (districtID: string | null) => {
    if (districtID && MISSING_DISTRICTS.includes(districtID)) {
      return {
        color: "#fff",
        weight: 1,
        fillColor: "#d3d3d3", 
        fillOpacity: 0.6,
        interactive: false,
      };
    }
    return {
      color: "#fff",
      weight: 1,
      fillColor: "#7baac8",
      fillOpacity: 0.85,
      interactive: true,
    };
  };

  const onEachDistrict = (feature: Feature, layer: Layer) => {
    const name =
      feature.properties?.cdtaname ||
      feature.properties?.boroname ||
      feature.properties?.cdta2020 ||
      "Unknown";

    const districtID =
      feature.properties?.cdta2020 ||
      feature.properties?.boro_cd ||
      feature.properties?.id ||
      feature.properties?.district_id ||
      feature.id ||
      null;

    console.log("Feature ID:", districtID, "Name:", name);

    const pathLayer = layer as L.Path;

    const style = getDistrictStyle(districtID);
    pathLayer.setStyle(style);

    //Skip hover/click if it's missing
    if (districtID && MISSING_DISTRICTS.includes(districtID)) return;

    layer.bindTooltip(name, {
      sticky: true,
      direction: "top",
      offset: point(0, -10),
      opacity: 0.9,
      className: "district-tooltip",
    });

    layer.on({
      mouseover: () => {
        layer.openTooltip();
        pathLayer.setStyle({ fillColor: "#3a80ba" });
      },
      mouseout: () => {
        layer.closeTooltip();
        pathLayer.setStyle({ fillColor: "#7baac8" });
      },
      mousedown: (e: LeafletMouseEvent) => {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      },
      click: (e: LeafletMouseEvent) => {
        if (!districtID) {
          layer.bindPopup("District ID not found.").openPopup(e.latlng);
          return;
        }

        layer.bindPopup("Loading prediction...").openPopup(e.latlng);

        fetch(`http://localhost:8000/api/ml/predict?community_district=${districtID}`)
          .then((res) => {
            if (!res.ok) {
              return res.json().then((err) => {
                throw new Error(err.detail || `Error: ${res.statusText}`);
              });
            }
            return res.json();
          })
          .then((data) => {
            const scoreText =
              typeof data?.score === "number" ? data.score.toFixed(2) : "—";
            const percentileText =
              typeof data?.percentile === "number"
                ? `${data.percentile.toFixed(1)}%`
                : "—";
            const gradeText = data?.grade ?? "—";

            const popupContent = `
              <div style="font-family: sans-serif; line-height: 1.4;">
                <h4 style="margin: 0 0 5px 0; font-size: 1.1rem;">
                  ${name} (${districtID})
                </h4>
                <p style="margin: 0;"><strong>Grade:</strong> ${gradeText}</p>
                <p style="margin: 0;"><strong>Percentile:</strong> ${percentileText}</p>
              </div>
            `;
            layer.setPopupContent(popupContent);
          })
          .catch((err) => {
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

    const element = pathLayer.getElement?.();
    if (element) element.setAttribute("tabindex", "-1");
  };

  return (
    <div className="static-nyc-map relative z-0 isolate pointer-events-auto w-full h-[500px] rounded-2xl shadow-md overflow-hidden">
      <MapContainer
        center={[40.7128, -74.006]}
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
        {geoData && <GeoJSON data={geoData} onEachFeature={onEachDistrict} />}
      </MapContainer>
    </div>
  );
}
