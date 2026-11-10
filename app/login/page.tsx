"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, AlertCircle, Mail, Lock, Sparkles, UserCheck } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Badge,
  LoadingState,
} from "@/components/ui";

const loginSchema = z.object({
  email: z.string().email("Valid email address is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  {
    role: "donor",
    label: "Donor",
    email: "donor@demo.com",
    desc: "Explore map & fund escrow",
    badge: "platform" as const,
  },
  {
    role: "ngo",
    label: "NGO",
    email: "ngo@demo.com",
    desc: "Manage relief & field proof",
    badge: "govt" as const,
  },
  {
    role: "admin",
    label: "Admin",
    email: "admin@demo.com",
    desc: "Verify proofs & release funds",
    badge: "high" as const,
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [error, setError] = useState<string | null>(null);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function executeSignIn(emailVal: string, passwordVal: string) {
    setError(null);

    const result = await signIn("credentials", {
      email: emailVal.trim().toLowerCase(),
      password: passwordVal,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. You can use the quick demo accounts below.");
      setActiveDemo(null);
      return;
    }

    // Role-based redirect
    const session = await getSession();
    const userRole = session?.user?.role;

    if (callbackUrl && callbackUrl !== "/" && !callbackUrl.startsWith("/login")) {
      router.push(callbackUrl);
    } else {
      if (userRole === "admin") {
        router.push("/admin");
      } else if (userRole === "ngo") {
        router.push("/ngo/profile");
      } else {
        router.push("/map");
      }
    }

    router.refresh();
  }

  async function onSubmit(data: LoginFormData) {
    await executeSignIn(data.email, data.password);
  }

  async function handleQuickDemo(email: string) {
    setActiveDemo(email);
    setValue("email", email, { shouldValidate: true });
    setValue("password", "demo1234", { shouldValidate: true });
    await executeSignIn(email, "demo1234");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-surface-low px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-card shadow-sm text-primary-on-container mb-1">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Welcome to Relief<span className="text-secondary-container">Track</span>
          </h1>
          <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
            Sign in to access real-time crisis mapping, verified escrow donations, and field audit tools.
          </p>
        </div>

        {/* Dedicated Role Portals Switcher */}
        <div className="flex bg-surface-container rounded-pill p-1 border border-outline-variant/60 text-xs font-semibold justify-between">
          <Link
            href="/login/donor"
            className="flex-1 py-1.5 text-center rounded-pill text-on-surface-variant hover:text-on-surface hover:bg-surface transition-all"
          >
            Donor Portal
          </Link>
          <Link
            href="/login/ngo"
            className="flex-1 py-1.5 text-center rounded-pill text-on-surface-variant hover:text-on-surface hover:bg-surface transition-all"
          >
            NGO Portal
          </Link>
          <Link
            href="/login/admin"
            className="flex-1 py-1.5 text-center rounded-pill text-on-surface-variant hover:text-on-surface hover:bg-surface transition-all"
          >
            Admin Console
          </Link>
        </div>

        {/* Login Card */}
        <Card className="shadow-modal border-outline-variant animate-slide-up">
          <CardHeader>
            <CardTitle className="text-lg">Account Sign In</CardTitle>
            <CardDescription>
              Enter your credentials or select a pre-configured demo account.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 bg-urgent-container/40 border border-urgent/30 rounded-input text-xs text-urgent animate-fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="you@domain.com"
                autoComplete="email"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register("password")}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isSubmitting && !activeDemo}
                loadingText="Authenticating..."
              >
                Sign In
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-2 pt-2 border-t border-outline-variant/50 text-center">
            <p className="text-xs text-on-surface-variant">
              Don&apos;t have an account yet?{" "}
              <Link href="/register" className="text-primary font-bold hover:underline">
                Register here
              </Link>
            </p>
            <p className="text-xs text-on-surface-variant">
              Are you an NGO seeking accreditation?{" "}
              <Link href="/ngo/apply" className="text-secondary font-bold hover:underline">
                Apply for verification
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Quick Demo Accounts Banner for Hackathon Judges */}
        <Card className="bg-surface-low border border-dashed border-outline-variant/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-secondary-container" />
              <span>Hackathon Demo Accounts</span>
            </div>
            <span className="text-[11px] font-mono text-outline">password: demo1234</span>
          </div>

          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Click any button below to instantly authenticate and evaluate that persona&apos;s interface:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((d) => {
              const isLoadingThis = activeDemo === d.email;
              return (
                <button
                  key={d.email}
                  type="button"
                  disabled={Boolean(activeDemo) || isSubmitting}
                  onClick={() => handleQuickDemo(d.email)}
                  className="flex flex-col items-start p-2.5 rounded-input bg-white border border-outline-variant hover:border-primary/60 hover:bg-surface-container transition-all cursor-pointer text-left shadow-xs group disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Badge variant={d.badge}>{d.label}</Badge>
                    <UserCheck className="w-3.5 h-3.5 text-outline group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-[11px] font-mono text-on-surface font-semibold truncate w-full">
                    {isLoadingThis ? "Logging in..." : d.email}
                  </span>
                  <span className="text-[10px] text-on-surface-variant truncate w-full mt-0.5">
                    {d.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState message="Preparing ReliefTrack authentication..." />}>
      <LoginForm />
    </Suspense>
  );
}
