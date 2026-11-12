"use client";

import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense } from "react";
import { NotAuthorized } from "@/components/ui/NotAuthorized";
import { LoadingState } from "@/components/ui/LoadingState";

function NotAuthorizedContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const required = searchParams.get("required") ?? undefined;
  const currentRole = session?.user?.role;

  return (
    <NotAuthorized
      requiredRole={required}
      currentRole={currentRole}
      message={
        required
          ? `This portal is restricted to ${required.toUpperCase()} accounts only.`
          : undefined
      }
    />
  );
}

export default function NotAuthorizedPage() {
  return (
    <Suspense fallback={<LoadingState message="Checking security clearance..." />}>
      <NotAuthorizedContent />
    </Suspense>
  );
}

