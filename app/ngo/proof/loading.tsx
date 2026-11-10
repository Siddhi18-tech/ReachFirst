import { Skeleton } from "@/components/ui/Skeleton";

export default function NgoProofLoading() {
  return (
    <div className="section max-w-3xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      <Skeleton className="h-4 w-32 rounded-md mb-4" />
      <div className="p-8 rounded-card border border-outline-variant/60 bg-surface space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40 rounded-pill" />
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
        </div>
        <Skeleton className="h-48 w-full rounded-card" />
        <Skeleton className="h-10 w-full rounded-input" />
        <Skeleton className="h-12 w-full rounded-input" />
      </div>
    </div>
  );
}

