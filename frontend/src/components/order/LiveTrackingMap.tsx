'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icons reference image files that don't resolve
// correctly under Next.js bundling — rebuild them from CDN URLs instead of
// fighting the bundler. This is the standard workaround for react-leaflet.
const riderIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const destinationIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'grayscale',
});

const startIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  className: 'opacity-70',
});

function RecenterOnMove({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(position, { animate: true });
  }, [position, map]);
  return null;
}

export function LiveTrackingMap({
  riderPosition,
  destination,
  path = [],
  riderLabel = 'Your rider',
  destinationLabel = 'Delivery address',
  arrived = false,
  lineColor = '#3b82f6', // blue-500; pass '#ef4444' (red) if preferred
}: {
  riderPosition: [number, number] | null; // [lat, lng]
  destination: [number, number]; // [lat, lng]
  /** Every GPS ping recorded since tracking started, in order — drawn as
   * the traveled route from the rider's start point to their current spot. */
  path?: [number, number][];
  riderLabel?: string;
  destinationLabel?: string;
  /** True once the rider is within "arrived" range of the destination. */
  arrived?: boolean;
  lineColor?: string;
}) {
  const center = riderPosition || destination;
  const startPoint = path.length > 0 ? path[0] : null;

  return (
    <div className="h-72 w-full overflow-hidden rounded-2xl border border-border">
      <MapContainer center={center} zoom={15} scrollWheelZoom={false} className="h-full w-full">
        {/* Free OpenStreetMap tiles — no API key, no billing account needed */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Traveled route: a growing line from where the rider started
            moving up to their current live position. */}
        {path.length > 1 && (
          <Polyline
            positions={path}
            pathOptions={{ color: lineColor, weight: 4, opacity: 0.85 }}
          />
        )}

        {/* Straight "as the crow flies" line from the current position to
            the destination, so the remaining leg of the trip is visible too. */}
        {riderPosition && (
          <Polyline
            positions={[riderPosition, destination]}
            pathOptions={{ color: lineColor, weight: 2, opacity: 0.35, dashArray: '6 8' }}
          />
        )}

        {startPoint && (
          <Marker position={startPoint} icon={startIcon}>
            <Popup>Started here</Popup>
          </Marker>
        )}

        <Marker position={destination} icon={destinationIcon}>
          <Popup>{destinationLabel}{arrived ? ' — rider has arrived' : ''}</Popup>
        </Marker>

        {riderPosition && (
          <>
            <Marker position={riderPosition} icon={riderIcon}>
              <Popup>{arrived ? `${riderLabel} — arrived` : riderLabel}</Popup>
            </Marker>
            <RecenterOnMove position={riderPosition} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
