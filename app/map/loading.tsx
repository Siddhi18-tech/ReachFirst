import { Skeleton } from "@/components/ui/Skeleton";

export default function MapLoading() {
  return (
    <div className="section max-w-7xl mx-auto py-6 px-4 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/40">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40 rounded-pill" />
          <Skeleton className="h-8 w-64 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-input" />
          <Skeleton className="h-9 w-32 rounded-input" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Skeleton (8 cols) */}
        <div className="lg:col-span-8">
          <Skeleton className="h-[560px] w-full rounded-card" />
        </div>

        {/* Sidebar Skeleton (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-28 w-full rounded-card" />
          <Skeleton className="h-36 w-full rounded-card" />
          <Skeleton className="h-36 w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}

