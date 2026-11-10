import { Skeleton } from "@/components/ui/Skeleton";

export default function ConfirmationLoading() {
  return (
    <div className="section max-w-3xl mx-auto py-12 px-4 space-y-8 animate-in fade-in duration-300">
      {/* Success Card Skeleton */}
      <div className="p-8 rounded-card border border-outline-variant/60 bg-surface text-center space-y-4">
        <Skeleton className="w-16 h-16 rounded-full mx-auto" />
        <Skeleton className="h-6 w-36 rounded-pill mx-auto" />
        <Skeleton className="h-8 w-72 rounded-md mx-auto" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md mx-auto" />
        <Skeleton className="h-24 w-80 max-w-full rounded-card mx-auto mt-4" />
      </div>

      {/* Stepper Skeleton */}
      <div className="p-6 rounded-card border border-outline-variant/60 bg-surface space-y-4">
        <Skeleton className="h-6 w-48 rounded-md" />
        <Skeleton className="h-16 w-full rounded-md" />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-20 w-full rounded-card" />
          <Skeleton className="h-20 w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}

