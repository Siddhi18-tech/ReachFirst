import { Skeleton } from "@/components/ui/Skeleton";

export default function NgoApplyLoading() {
  return (
    <div className="section max-w-3xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32 rounded-pill" />
        <Skeleton className="h-8 w-80 rounded-md" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>

      {/* Steps Bar Skeleton */}
      <div className="grid grid-cols-4 gap-2">
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
      </div>

      {/* Form Card Skeleton */}
      <div className="p-8 rounded-card border border-outline-variant/60 bg-surface space-y-6">
        <Skeleton className="h-6 w-48 rounded-md" />
        <Skeleton className="h-10 w-full rounded-input" />
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-10 w-full rounded-input" />
        <Skeleton className="h-28 w-full rounded-input" />
      </div>
    </div>
  );
}

