"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, TileLayer } from "leaflet";
import type { Facility, FacilityType } from "@/lib/facilities";
import type { GeoPoint } from "@/lib/geo";

/** Raster tile endpoint. Override with NEXT_PUBLIC_MAP_TILES (e.g. a self-hosted
 *  or low-bandwidth tile server); defaults to OpenStreetMap standard tiles. */
const TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILES ??
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Northeast AgriChain';

type LeafletNS = typeof import("leaflet");

type InteractiveMapProps = {
  origin: GeoPoint | undefined;
  facilities: Facility[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  typeColor: Record<FacilityType, string>;
  className?: string;
};

export default function InteractiveMap({
  origin,
  facilities,
  selectedId,
  onSelect,
  typeColor,
  className,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<LeafletNS | null>(null);
  const tileRef = useRef<TileLayer | null>(null);
  const onSelectRef = useRef(onSelect);
  const firstDrawRef = useRef(true);
  const [ready, setReady] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);

  // Keep the latest click handler without re-initialising markers on every render.
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Initialise Leaflet once, client-only (SSR renders the placeholder div).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        center: [25.9, 92.8],
        zoom: 6,
        minZoom: 4,
        maxZoom: 18,
        preferCanvas: true,
        worldCopyJump: true,
        zoomControl: true,
        attributionControl: true,
      });

      const tiles = L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 18,
        detectRetina: true,
      });
      tiles.on("tileerror", () => setTilesFailed(true));
      tiles.on("tileload", () => setTilesFailed(false));
      tiles.addTo(map);

      tileRef.current = tiles;
      mapRef.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      tileRef.current = null;
      leafletRef.current = null;
      firstDrawRef.current = true;
      setReady(false);
    };
  }, []);

  // Draw origin, facility markers and the active route whenever inputs change.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    const group: LayerGroup = L.layerGroup().addTo(map);
    const points: [number, number][] = [];

    if (origin) {
      const at: [number, number] = [origin.lat, origin.lon];
      points.push(at);
      L.circleMarker(at, {
        radius: 10,
        color: "#2e6b3e",
        weight: 2,
        fillColor: "#2e6b3e",
        fillOpacity: 0.22,
      })
        .addTo(group)
        .bindTooltip(`Origin · ${origin.label}`, { direction: "top", offset: [0, -10] });
      L.circleMarker(at, {
        radius: 5,
        color: "#ffffff",
        weight: 2,
        fillColor: "#2e6b3e",
        fillOpacity: 1,
      }).addTo(group);
    }

    facilities.forEach((f) => {
      const selected = f.id === selectedId;
      points.push([f.lat, f.lon]);
      const marker = L.circleMarker([f.lat, f.lon], {
        radius: selected ? 10 : 7,
        color: "#ffffff",
        weight: 2,
        fillColor: typeColor[f.type],
        fillOpacity: 1,
      }).addTo(group);

      marker.bindTooltip(f.name, { direction: "top", offset: [0, -8], opacity: 0.95 });
      marker.bindPopup(
        `<div style="min-width:180px">
           <strong style="font-size:13px">${f.name}</strong>
           <div style="margin-top:3px;font-size:11px;color:#4a5a50">${f.district} · ${f.state}</div>
           <div style="margin-top:6px;font-size:12px">${f.availableT} t free of ${f.capacityT} t</div>
           <div style="font-size:12px">₹${f.rate} / t / day · ★ ${f.rating.toFixed(1)}</div>
         </div>`,
      );
      marker.on("click", () => onSelectRef.current(f.id));
      if (selected) marker.openTooltip();
    });

    const selectedFacility = selectedId
      ? facilities.find((f) => f.id === selectedId)
      : undefined;

    if (origin && selectedFacility) {
      L.polyline(
        [
          [origin.lat, origin.lon],
          [selectedFacility.lat, selectedFacility.lon],
        ],
        { color: "#f2c266", weight: 3, dashArray: "7 7", opacity: 0.9 },
      ).addTo(group);
    }

    if (points.length > 0) {
      if (firstDrawRef.current || !selectedFacility) {
        map.fitBounds(L.latLngBounds(points), { padding: [44, 44], maxZoom: 9 });
        firstDrawRef.current = false;
      } else {
        map.flyTo(
          [selectedFacility.lat, selectedFacility.lon],
          Math.max(9, map.getZoom()),
          { duration: 0.6 },
        );
      }
    }

    return () => {
      group.remove();
    };
  }, [ready, facilities, selectedId, origin, typeColor]);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label="Interactive map of storage and logistics facilities"
      />
      {!ready ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-sand-100">
          <span className="text-xs font-semibold text-ink-400">Loading live map…</span>
        </div>
      ) : null}
      {ready && tilesFailed ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink-900/85 px-3.5 py-1.5 text-[11px] font-semibold text-sand-50 shadow-lg">
          Map tiles unavailable — markers still active
        </div>
      ) : null}
    </div>
  );
}
