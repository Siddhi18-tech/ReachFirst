"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./Card";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export interface NotAuthorizedProps {
  requiredRole?: string;
  currentRole?: string;
  message?: string;
  className?: string;
}

export function NotAuthorized({
  requiredRole,
  currentRole,
  message,
  className,
}: NotAuthorizedProps) {
  const roleDisplay: Record<string, string> = {
    admin: "Platform Administrator",
    ngo: "Verified NGO Representative",
    donor: "Donor",
  };

  return (
    <div className={cn("min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-surface-low", className)}>
      <Card className="w-full max-w-lg shadow-modal border-urgent/20 text-center animate-slide-up">
        <CardHeader className="items-center text-center pb-2">
          <div className="w-16 h-16 rounded-full bg-urgent-container flex items-center justify-center text-urgent mb-3 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <Badge variant="urgent" className="mb-2">ACCESS RESTRICTED</Badge>
          <CardTitle className="text-xl font-extrabold text-on-surface">
            Authorization Required
          </CardTitle>
          <CardDescription className="text-sm">
            {message ?? "You do not have the required security credentials to access this protected area."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          <div className="bg-surface-container rounded-card p-4 text-xs font-mono space-y-2 border border-outline-variant/60">
            {requiredRole && (
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Required Role:</span>
                <span className="font-bold text-urgent uppercase tracking-wide">
                  {roleDisplay[requiredRole] ?? requiredRole}
                </span>
              </div>
            )}
            {currentRole && (
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Current Session:</span>
                <span className="font-semibold text-on-surface uppercase">
                  {roleDisplay[currentRole] ?? currentRole}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            If you need access to this role, please sign in using an authorized account or contact the ReliefTrack administrator.
          </p>
        </CardContent>

        <CardFooter className="flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full" iconLeft={<ArrowLeft className="w-4 h-4" />}>
              Return Home
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
            onClick={() => signOut({ callbackUrl: "/login" })}
            iconLeft={<LogIn className="w-4 h-4" />}
          >
            Switch Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
