'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Arreglo de iconos para Next.js/Leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  lat: number;
  lng: number;
  radio: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

// Sub-componente para mover el mapa cuando cambian las coordenadas desde fuera
function MapUpdater({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Sub-componente para detectar clics
function MapEvents({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ lat, lng, radio, onLocationSelect }: LocationPickerProps) {
  return (
    <div className="h-100 w-100 position-relative" style={{ minHeight: '400px', zIndex: 1 }}>
      <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        <Marker position={[lat, lng]} icon={icon} />
        <Circle center={[lat, lng]} radius={radio} pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.2 }} />
        
        <MapUpdater lat={lat} lng={lng} />
        <MapEvents onSelect={onLocationSelect} />
      </MapContainer>
    </div>
  );
}