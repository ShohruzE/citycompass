"use client";

import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L, { Layer, PathOptions } from "leaflet";
import type { FeatureCollection, Feature } from "geojson";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { useUserLocation } from "@/lib/contexts/UserLocationContext";
import { MapPin, Info, Layers, X } from "lucide-react";
import { LocationSearchCombobox } from "./LocationSearchCombobox";
import type { Location } from "@/lib/data/nyc-locations";

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/marker-icon-2x.png",
  iconUrl: "/marker-icon.png",
  shadowUrl: "/marker-shadow.png",
});

// Districts missing from our model dataset
const MISSING_DISTRICTS = [
  "BX26",
  "BX27",
  "BX28",
  "MN64",
  "SI95",
  "QN80",
  "QN81",
  "QN82",
  "QN83",
  "QN84",
  "BK55",
  "BK56",
];

interface DistrictData {
  neighborhood_name: string;
  grade: string;
  percentile: number;
}

interface MapControlsProps {
  searchZip: string;
  onLocationChange: (zipCode: string, location: Location | null) => void;
  showLegend: boolean;
  onToggleLegend: () => void;
}

function MapControls({
  searchZip,
  onLocationChange,
  showLegend,
  onToggleLegend,
}: MapControlsProps) {
  return (
    <div className="absolute top-4 left-4 z-[9999] flex gap-2 pointer-events-auto">
      <div className="w-80">
        <LocationSearchCombobox
          value={searchZip}
          onChange={onLocationChange}
          disabled={false}
        />
      </div>
      <button
        onClick={onToggleLegend}
        className={`bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors ${
          showLegend ? "bg-blue-50" : ""
        }`}
        title="Toggle Legend"
      >
        <Info className="h-5 w-5 text-gray-700" />
      </button>
    </div>
  );
}

function Legend({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="absolute bottom-8 left-4 z-[9999] bg-white rounded-lg shadow-lg p-4 max-w-xs pointer-events-auto">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Layers className="h-4 w-4" />
        Map Legend
      </h3>
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 border-blue-600 bg-blue-100"></div>
          <span>Community Districts (Clickable)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 border-gray-400 bg-gray-200"></div>
          <span>Districts with Limited Data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-red-500 opacity-70"></div>
          <span>Your Current Location</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>Tip:</strong> Click on any district to view detailed
          neighborhood predictions and ratings.
        </p>
      </div>
    </div>
  );
}

function SelectedDistrictPanel({
  districtData,
  districtName,
  onClose,
}: {
  districtData: DistrictData | null;
  districtName: string | null;
  onClose: () => void;
}) {
  if (!districtData && !districtName) return null;

  return (
    <div className="absolute top-20 right-4 z-[9999] bg-white rounded-lg shadow-xl p-4 w-80 pointer-events-auto">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          {districtName || "District Information"}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {districtData ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Neighborhood</p>
            <p className="text-base font-medium">
              {districtData.neighborhood_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Grade</p>
            <p className="text-2xl font-bold text-blue-600">
              {districtData.grade}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Percentile</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${districtData.percentile}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">
                {districtData.percentile}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Click on a district to view detailed information.
        </p>
      )}
    </div>
  );
}

// Component to fly to location when search is triggered
function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 13, {
        duration: 1.5,
      });
    }
  }, [position, map]);

  return null;
}

export default function FullPageMapClient() {
  const { zipCode } = useUserLocation();
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [zipMarker, setZipMarker] = useState<[number, number] | null>(null);
  const [searchZip, setSearchZip] = useState("");
  const [searchMarker, setSearchMarker] = useState<[number, number] | null>(
    null
  );
  const [showLegend, setShowLegend] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<{
    data: DistrictData | null;
    name: string | null;
  }>({ data: null, name: null });

  // Load GeoJSON data
  useEffect(() => {
    fetch("/nyc_community_districts.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, []);

  // Geocode current ZIP code
  useEffect(() => {
    if (zipCode) {
      console.log("Geocoding current location ZIP:", zipCode);
      fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=US&format=json&limit=1`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            console.log("Current location marker set at:", coords);
            setZipMarker(coords);
          } else {
            console.warn("Could not geocode ZIP code:", zipCode);
          }
        })
        .catch((err) => console.error("Error geocoding ZIP:", err));
    } else {
      console.log("No ZIP code available from UserLocationContext. Have you completed the survey?");
    }
  }, [zipCode]);

  const handleLocationChange = (newZipCode: string, location: Location | null) => {
    setSearchZip(newZipCode);
    
    if (!newZipCode.trim()) {
      setSearchMarker(null);
      return;
    }

    // Geocode the selected ZIP code
    fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${newZipCode}&country=US&format=json&limit=1`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          const position: [number, number] = [
            parseFloat(data[0].lat),
            parseFloat(data[0].lon),
          ];
          setSearchMarker(position);
        } else {
          console.warn("ZIP code not found:", newZipCode);
        }
      })
      .catch((err) => {
        console.error("Error searching ZIP:", err);
      });
  };

  // Marker icons
  const userIcon = new L.DivIcon({
    className: "custom-marker",
    html: `
      <div style="position: relative;">
        <div style="
          width: 20px;
          height: 20px;
          background-color: #ef4444;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          animation: pulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      </style>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const searchIcon = new L.DivIcon({
    className: "custom-marker",
    html: `
      <div style="position: relative;">
        <div style="
          width: 20px;
          height: 20px;
          background-color: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const onEachDistrict = (feature: Feature, layer: Layer) => {
    if (!feature.properties) return;

    const pathLayer = layer as L.Path;

    // Extract district name from multiple possible properties
    const districtName =
      feature.properties?.cdtaname ||
      feature.properties?.boroname ||
      feature.properties?.cdta2020 ||
      "Unknown District";

    // Extract district ID from multiple possible properties
    const districtID =
      feature.properties?.cdta2020 ||
      feature.properties?.boro_cd ||
      feature.properties?.id ||
      feature.properties?.district_id ||
      feature.id ||
      null;

    // Check if district has data (not in missing districts list)
    const hasData = districtID ? !MISSING_DISTRICTS.includes(districtID as string) : false;

    const defaultStyle: PathOptions = {
      fillColor: hasData ? "#7baac8" : "#d1d5db",
      fillOpacity: 0.6,
      color: hasData ? "#2563eb" : "#6b7280",
      weight: 2,
    };

    const hoverStyle: PathOptions = {
      fillColor: hasData ? "#3a80ba" : "#9ca3af",
      fillOpacity: 0.8,
    };

    pathLayer.setStyle(defaultStyle);

    // Tooltip with district name
    layer.bindTooltip(districtName, {
      sticky: true,
      className: "district-tooltip",
    });

    // Hover effects
    layer.on({
      mouseover: () => {
        pathLayer.setStyle(hoverStyle);
      },
      mouseout: () => {
        pathLayer.setStyle(defaultStyle);
      },
      click: async () => {
        if (!hasData || !districtID) {
          setSelectedDistrict({
            data: null,
            name: districtName,
          });
          return;
        }
        try {
          const response = await fetch(
            `http://localhost:8000/api/ml/predict?community_district=${districtID}`
          );
          const data: DistrictData = await response.json();

          setSelectedDistrict({
            data,
            name: districtName,
          });

          // Also bind a popup to the layer
          const popupContent = `
            <div style="min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: 600;">${data.neighborhood_name}</h3>
              <p style="margin: 4px 0;"><strong>Grade:</strong> ${data.grade}</p>
              <p style="margin: 4px 0;"><strong>Percentile:</strong> ${data.percentile}%</p>
            </div>
          `;

          layer.bindPopup(popupContent).openPopup();
        } catch (error) {
          console.error("Error fetching district data:", error);
          layer.bindPopup(
            `<p><strong>${districtName}</strong></p><p>Error loading data</p>`
          );
        }
      },
    });
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[40.7128, -74.006]}
        zoom={10}
        className="h-full w-full z-0"
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomControl position="topright" />

        {geoData && <GeoJSON data={geoData} onEachFeature={onEachDistrict} />}

        {zipMarker && (
          <Marker position={zipMarker} icon={userIcon}>
            <Popup>
              <strong>Your Location</strong>
              <br />
              ZIP: {zipCode}
            </Popup>
          </Marker>
        )}

        {searchMarker && (
          <Marker position={searchMarker} icon={searchIcon}>
            <Popup>
              <strong>Search Result</strong>
              <br />
              ZIP: {searchZip}
            </Popup>
          </Marker>
        )}

        <FlyToLocation position={searchMarker} />
      </MapContainer>

      <MapControls
        searchZip={searchZip}
        onLocationChange={handleLocationChange}
        showLegend={showLegend}
        onToggleLegend={() => setShowLegend(!showLegend)}
      />

      <Legend show={showLegend} />

      <SelectedDistrictPanel
        districtData={selectedDistrict.data}
        districtName={selectedDistrict.name}
        onClose={() => setSelectedDistrict({ data: null, name: null })}
      />
    </div>
  );
}
