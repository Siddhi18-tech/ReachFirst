import type { Disaster } from "@/types/api";
import type { disasters } from "@/lib/db/schema";

type DisasterRow = typeof disasters.$inferSelect;

export function toDisaster(r: DisasterRow): Disaster {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    severity: Math.min(4, Math.max(2, r.severity)) as 2 | 3 | 4,
    lat: Number(r.centerLat ?? 0),
    lng: Number(r.centerLng ?? 0),
    casualties: r.casualties,
    teamsDeployed: r.teamsDeployed,
    status: r.active ? "active" : "closed",
  };
}