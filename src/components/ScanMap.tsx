"use client";

import { MapContainer, TileLayer, Circle, Marker, useMapEvents, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

const centerIcon = divIcon({
  className: "",
  html: '<div style="width:12px;height:12px;transform:rotate(45deg);background:#f5c451;box-shadow:0 0 16px rgba(245,196,81,0.9)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function ScanMap({
  center,
  radiusMeters,
  onSelect,
}: {
  center: { lat: number; lng: number };
  radiusMeters: number;
  onSelect: (lat: number, lng: number) => void;
}) {
  return (
    <div style={{ height: 320, borderRadius: 2, overflow: "hidden", border: "1px solid var(--border-soft)" }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%", background: "#030610" }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <ClickHandler onSelect={onSelect} />
        <Recenter lat={center.lat} lng={center.lng} />
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusMeters}
          pathOptions={{ color: "#38bdf8", weight: 1.5, opacity: 0.6, fillColor: "#0ea5e9", fillOpacity: 0.08 }}
        />
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusMeters * 0.66}
          pathOptions={{ color: "#38bdf8", weight: 1, opacity: 0.2, fill: false }}
        />
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusMeters * 0.33}
          pathOptions={{ color: "#38bdf8", weight: 1, opacity: 0.2, fill: false }}
        />
        <Marker position={[center.lat, center.lng]} icon={centerIcon} />
      </MapContainer>
    </div>
  );
}
