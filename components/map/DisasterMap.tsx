"use client";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { severityLabel } from "@/lib/utils";

interface Disaster {
  id: string;
  name: string;
  type: string;
  location: string;
  centerLat: string | null;
  centerLng: string | null;
  severity: number;
  active: boolean;
  campaignsCount?: number;
}

interface DisasterMapProps {
  disasters: Disaster[];
  selectedDisasterId?: string;
  onSelectDisaster?: (id: string) => void;
}

export default function DisasterMap({ disasters, selectedDisasterId, onSelectDisaster }: DisasterMapProps) {
  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | undefined;
    import("leaflet").then((L) => {
      if (disposed) return;

      // Center around India
      const defaultCenter: [number, number] = [22.9734, 78.6569];
      const currentMap = L.map("disaster-leaflet-map", {
        center: defaultCenter,
        zoom: 5,
        minZoom: 4,
        maxZoom: 12,
      });
      map = currentMap;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(currentMap);

      // Add disaster circles/markers
      const bounds: [number, number][] = [];

      disasters.forEach((disaster) => {
        const lat = parseFloat(disaster.centerLat || "0");
        const lng = parseFloat(disaster.centerLng || "0");
        if (!lat || !lng) return;

        bounds.push([lat, lng]);

        const colorMap: Record<number, string> = {
          4: "#ba1a1a", // Crimson / Critical
          3: "#d97706", // Amber / High
          2: "#0284c7", // Sky / Moderate
          1: "#0f766e", // Teal / Low
        };
        const color = colorMap[disaster.severity] || "#0f766e";

        const circle = L.circleMarker([lat, lng], {
          radius: disaster.severity === 4 ? 14 : disaster.severity === 3 ? 12 : 9,
          fillColor: color,
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        }).addTo(currentMap);

        const sev = severityLabel(disaster.severity);

        const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
          "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
        })[char]!);
        const popupContent = `
          <div style="font-family: inherit; padding: 4px; min-width: 190px;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: ${color}; letter-spacing: 0.5px;">
              ${sev.label} Severity (Level ${disaster.severity})
            </div>
            <h4 style="margin: 4px 0 2px 0; font-size: 14px; font-weight: 700; color: #131b2e;">
              ${escapeHtml(disaster.name)}
            </h4>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #40484b;">
              📍 ${escapeHtml(disaster.location)}
            </p>
            <a href="/disasters/${encodeURIComponent(disaster.id)}" style="display: block; text-align: center; background: #005c55; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-decoration: none;">
              View Ranked NGOs & Donate &rarr;
            </a>
          </div>
        `;

        circle.bindPopup(popupContent);

        if (selectedDisasterId === disaster.id) {
          circle.openPopup();
          currentMap.setView([lat, lng], 8);
        }

        circle.on("click", () => {
          if (onSelectDisaster) {
            onSelectDisaster(disaster.id);
          }
        });
      });

      if (bounds.length > 0 && !selectedDisasterId) {
        currentMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 7 });
      }
    }).catch((error) => console.error("Failed to load disaster map:", error));
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [disasters, selectedDisasterId, onSelectDisaster]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-card overflow-hidden border border-outline-variant/60 shadow-sm">
      <div id="disaster-leaflet-map" className="w-full h-full min-h-[500px] z-0" />
      <div className="absolute top-3 right-3 z-[1000] bg-surface/90 backdrop-blur-md px-3 py-2 rounded-card border border-outline-variant/60 text-xs flex flex-col gap-1.5 shadow-sm">
        <div className="font-semibold text-on-surface text-[11px] uppercase tracking-wider">Severity Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-error" />
          <span className="text-on-surface font-medium">Level 4: Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-600" />
          <span className="text-on-surface font-medium">Level 3: High</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-sky-600" />
          <span className="text-on-surface font-medium">Level 2: Moderate</span>
        </div>
      </div>
    </div>
  );
}
