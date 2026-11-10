import { Skeleton } from "@/components/ui/Skeleton";

export default function DonateLoading() {
  return (
    <div className="section max-w-5xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      <Skeleton className="h-4 w-36 rounded-md mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Skeleton (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-card border border-outline-variant/60 bg-surface space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-64 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-pill" />
          </div>
          <Skeleton className="h-4 w-full rounded-md" />
          <div className="grid grid-cols-4 gap-2">
            <Skeleton className="h-12 rounded-card" />
            <Skeleton className="h-12 rounded-card" />
            <Skeleton className="h-12 rounded-card" />
            <Skeleton className="h-12 rounded-card" />
          </div>
          <Skeleton className="h-10 w-full rounded-input" />
          <Skeleton className="h-28 w-full rounded-card" />
          <Skeleton className="h-12 w-full rounded-input" />
        </div>

        {/* Right Summary Skeleton (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-48 w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}

