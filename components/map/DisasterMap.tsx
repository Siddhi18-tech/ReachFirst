"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { severityLabel } from "@/lib/utils";
import type { Disaster } from "@/types/api";

interface DisasterMapProps {
  disasters: Disaster[];
  selectedDisasterId?: string;
  onSelectDisaster?: (id: string) => void;
  className?: string;
}

export default function DisasterMap({
  disasters,
  selectedDisasterId,
  onSelectDisaster,
  className,
}: DisasterMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | undefined;

    import("leaflet").then((L) => {
      if (disposed || !mapContainerRef.current) return;

      // Ensure no previous map instance on this element
      const container = mapContainerRef.current;
      // @ts-expect-error Leaflet attaches _leaflet_id internally
      if (container._leaflet_id) {
        // @ts-expect-error clean up if existing
        delete container._leaflet_id;
      }

      // Center around India
      const defaultCenter: [number, number] = [22.9734, 78.6569];
      const currentMap = L.map(container, {
        center: defaultCenter,
        zoom: 5,
        minZoom: 4,
        maxZoom: 13,
      });
      map = currentMap;

      // OpenStreetMap standard tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(currentMap);

      const bounds: [number, number][] = [];

      // Severity Color Tokens (Stitch Design System):
      // Level 4 = Crimson (#ba1a1a)
      // Level 3 = Amber (#855300 / #fea619)
      // Level 2 = Teal (#005c55 / #0f766e)
      const severityTokens: Record<number, { bg: string; ring: string; label: string }> = {
        4: { bg: "#ba1a1a", ring: "rgba(186, 26, 26, 0.4)", label: "Level 4 (Critical)" },
        3: { bg: "#855300", ring: "rgba(254, 166, 25, 0.45)", label: "Level 3 (High)" },
        2: { bg: "#005c55", ring: "rgba(0, 92, 85, 0.4)", label: "Level 2 (Moderate)" },
      };

      disasters.forEach((disaster) => {
        const lat = disaster.lat;
        const lng = disaster.lng;
        if (!lat || !lng || Number.isNaN(lat) || Number.isNaN(lng)) return;

        bounds.push([lat, lng]);

        const token = severityTokens[disaster.severity] || severityTokens[2];
        const sev = severityLabel(disaster.severity);

        // Custom L.divIcon resolving Leaflet default marker bug
        const markerHtml = `
          <div style="
            position: relative;
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background-color: ${token.ring};
              transform: scale(1.1);
            "></div>
            <div style="
              position: relative;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background-color: ${token.bg};
              border: 2px solid #ffffff;
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: 'JetBrains Mono', ui-monospace, monospace;
              font-weight: 800;
              font-size: 11px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            ">
              L${disaster.severity}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: "relief-marker",
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -18],
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(currentMap);

        const escapeHtml = (val: string) =>
          val.replace(/[&<>"']/g, (c) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          }[c]!));

        const popupHtml = `
          <div style="font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; padding: 6px 4px; min-width: 220px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${token.bg};">
                ${sev.label} Severity
              </span>
              <span style="font-size: 10px; font-family: monospace; color: #6e7977; text-transform: uppercase;">
                ${escapeHtml(disaster.type)}
              </span>
            </div>
            <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 800; color: #0f172a; line-height: 1.25;">
              ${escapeHtml(disaster.name)}
            </h4>
            <div style="font-size: 11px; font-family: monospace; color: #475569; margin-bottom: 10px; display: flex; gap: 8px;">
              <span>🚨 ${disaster.casualties || 0} casualties</span>
              <span>👥 ${disaster.teamsDeployed || 0} teams</span>
            </div>
            <a
              href="/disasters/${encodeURIComponent(disaster.id)}"
              style="display: block; text-align: center; background-color: #1e3a5f; color: #ffffff; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; text-decoration: none; box-shadow: 0 1px 3px rgba(0,0,0,0.15); transition: background-color 150ms;"
            >
              View NGOs & Donate &rarr;
            </a>
          </div>
        `;

        marker.bindPopup(popupHtml);

        if (selectedDisasterId === disaster.id) {
          marker.openPopup();
          currentMap.setView([lat, lng], 8);
        }

        marker.on("click", () => {
          if (onSelectDisaster) {
            onSelectDisaster(disaster.id);
          }
        });
      });

      if (bounds.length > 0 && !selectedDisasterId) {
        currentMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
      }
    }).catch((err) => console.error("DisasterMap failed to initialize:", err));

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [disasters, selectedDisasterId, onSelectDisaster]);

  return (
    <div className={`relative w-full h-full min-h-[520px] rounded-card overflow-hidden ${className ?? ""}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[520px] z-0" />

      {/* Floating Severity Legend */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-3 rounded-card border border-outline-variant/80 shadow-md text-xs space-y-2 pointer-events-auto">
        <p className="font-bold text-on-surface text-[11px] uppercase tracking-wider">
          Crisis Severity Scale
        </p>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ba1a1a] shrink-0 shadow-xs" />
          <span className="text-on-surface font-medium text-[11px]">Level 4: Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#855300] shrink-0 shadow-xs" />
          <span className="text-on-surface font-medium text-[11px]">Level 3: High</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#005c55] shrink-0 shadow-xs" />
          <span className="text-on-surface font-medium text-[11px]">Level 2: Moderate</span>
        </div>
      </div>
    </div>
  );
}
