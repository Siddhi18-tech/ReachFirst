"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  ArrowRight,
  Filter,
  Users,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { DynamicDisasterMap } from "@/components/map/MapWrapper";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDisasters } from "@/lib/api";
import { severityLabel } from "@/lib/utils";
import type { Disaster } from "@/types/api";

export default function LiveDisasterMapPage() {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    getDisasters()
      .then((data) => {
        setDisasters(data);
      })
      .catch((err) => console.error("Error loading disasters:", err))
      .finally(() => setLoading(false));
  }, []);

  // Filtered disasters list
  const filteredDisasters = useMemo(() => {
    return disasters.filter((d) => {
      const matchType = selectedType === "all" || d.type.toLowerCase() === selectedType.toLowerCase();
      const matchSeverity = selectedSeverity === "all" || String(d.severity) === selectedSeverity;
      return matchType && matchSeverity;
    });
  }, [disasters, selectedType, selectedSeverity]);

  // Aggregate live metrics for filtered set
  const metrics = useMemo(() => {
    const totalCasualties = filteredDisasters.reduce((s, d) => s + (d.casualties || 0), 0);
    const totalTeams = filteredDisasters.reduce((s, d) => s + (d.teamsDeployed || 0), 0);
    const criticalCount = filteredDisasters.filter((d) => d.severity === 4).length;
    return { totalCasualties, totalTeams, criticalCount };
  }, [filteredDisasters]);

  const resetFilters = () => {
    setSelectedType("all");
    setSelectedSeverity("all");
    setSelectedId(undefined);
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── Top Header Bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-urgent animate-pulse" />
            <span className="text-xs font-mono font-bold text-urgent uppercase tracking-wider">
              Real-Time Crisis Monitor
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Live Disaster & NGO Deployment Map
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Geospatial tracking of verified active disasters across India. Click any hotspot to view ranked responders.
          </p>
        </div>

        {/* Live Metrics Pill Strip (font-mono) */}
        <div className="flex items-center gap-2 sm:gap-4 bg-white p-2.5 sm:p-3 rounded-card border border-outline-variant/70 shadow-xs">
          <div className="text-center px-2 sm:px-3 border-r border-outline-variant/60">
            <div className="text-lg sm:text-xl font-bold font-mono text-on-surface">
              {filteredDisasters.length}
            </div>
            <div className="text-[10px] text-on-surface-variant uppercase font-medium">Active Zones</div>
          </div>
          <div className="text-center px-2 sm:px-3 border-r border-outline-variant/60">
            <div className="text-lg sm:text-xl font-bold font-mono text-urgent">
              {metrics.criticalCount}
            </div>
            <div className="text-[10px] text-on-surface-variant uppercase font-medium">Level 4</div>
          </div>
          <div className="text-center px-2 sm:px-3 border-r border-outline-variant/60">
            <div className="text-lg sm:text-xl font-bold font-mono text-secondary">
              {metrics.totalTeams}
            </div>
            <div className="text-[10px] text-on-surface-variant uppercase font-medium">Relief Teams</div>
          </div>
          <div className="text-center px-2 sm:px-3">
            <div className="text-lg sm:text-xl font-bold font-mono text-primary">
              100%
            </div>
            <div className="text-[10px] text-on-surface-variant uppercase font-medium">Verified</div>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Map (7 cols) + Side Filter Panel (5 cols) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Interactive Leaflet Map */}
        <div className="lg:col-span-7 h-[480px] lg:h-auto min-h-[500px] rounded-card overflow-hidden shadow-xs border border-outline-variant/70">
          <DynamicDisasterMap
            disasters={filteredDisasters}
            selectedDisasterId={selectedId}
            onSelectDisaster={(id) => setSelectedId(id)}
          />
        </div>

        {/* Side Panel: Filters + Disaster List */}
        <div className="lg:col-span-5 flex flex-col gap-4 max-h-[750px]">
          {/* Filter Toolbar */}
          <Card className="p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5 text-primary" />
                <span>Filter Response Zones</span>
              </div>
              {(selectedType !== "all" || selectedSeverity !== "all") && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Disaster Type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                options={[
                  { value: "all", label: "All Disaster Types" },
                  { value: "flood", label: "Floods" },
                  { value: "landslide", label: "Landslides" },
                  { value: "cyclone", label: "Cyclones" },
                  { value: "drought", label: "Drought" },
                  { value: "earthquake", label: "Earthquake" },
                ]}
              />

              <Select
                label="Severity Level"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                options={[
                  { value: "all", label: "All Severities" },
                  { value: "4", label: "Level 4 (Critical)" },
                  { value: "3", label: "Level 3 (High)" },
                  { value: "2", label: "Level 2 (Moderate)" },
                ]}
              />
            </div>
          </Card>

          {/* Disaster List Feed */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant px-1">
              <span>Showing {filteredDisasters.length} Emergencies</span>
              <span className="font-mono text-[11px]">Ranked by Severity</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-on-surface-variant">
                Loading live disaster feed...
              </div>
            ) : filteredDisasters.length === 0 ? (
              <EmptyState
                icon={<AlertTriangle className="w-6 h-6 text-outline" />}
                title="No matching crises"
                description="No active disaster zones match your filter criteria. Reset the filters to view all."
                action={
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Show All Crises
                  </Button>
                }
              />
            ) : (
              filteredDisasters.map((d) => {
                const sev = severityLabel(d.severity);
                const isSelected = selectedId === d.id;
                const badgeVariant =
                  d.severity === 4
                    ? "critical"
                    : d.severity === 3
                    ? "high"
                    : "moderate";

                return (
                  <Card
                    key={d.id}
                    hover
                    onClick={() => setSelectedId(d.id)}
                    className={`cursor-pointer transition-all p-4 ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 bg-surface-container/30"
                        : "border-outline-variant/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant={badgeVariant} dot>
                        {sev.label} Severity
                      </Badge>
                      <span className="font-mono text-[11px] font-bold text-outline uppercase">
                        {d.type}
                      </span>
                    </div>

                    <CardHeader className="p-0 mb-2">
                      <CardTitle className="text-base font-bold text-on-surface leading-snug">
                        {d.name}
                      </CardTitle>
                      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-mono text-[11px]">
                          {d.lat.toFixed(4)}° N, {d.lng.toFixed(4)}° E
                        </span>
                      </div>
                    </CardHeader>

                    {/* Quick Metrics */}
                    <div className="grid grid-cols-2 gap-2 my-3 p-2 rounded-input bg-surface-low border border-outline-variant/40 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-on-surface-variant block uppercase">
                          Casualties
                        </span>
                        <span className="font-bold text-on-surface">
                          {d.casualties > 0 ? d.casualties.toLocaleString("en-IN") : "0 Recorded"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-on-surface-variant block uppercase">
                          Teams Deployed
                        </span>
                        <span className="font-bold text-primary flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {d.teamsDeployed || 0} Teams
                        </span>
                      </div>
                    </div>

                    {/* View NGOs CTA */}
                    <Link href={`/disasters/${d.id}`} className="block mt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs font-bold"
                        iconRight={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        View Ranked NGOs & Donate
                      </Button>
                    </Link>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
