"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, AlertCircle, User, Mail, Lock, HeartHandshake, Building2 } from "lucide-react";
import { signIn } from "next-auth/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
} from "@/components/ui";

const registerSchema = z
  .object({
    name: z.string().min(2, "Full name or organisation name is required (min 2 characters)"),
    email: z.string().email("Valid email address is required"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.enum(["donor", "ngo"], { message: "Please select an account type" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "donor",
    },
  });

  const selectedRole = watch("role");

  async function onSubmit(data: RegisterFormData) {
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
          role: data.role,
        }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(body?.error ?? "Registration failed. Please check your details and try again.");
        return;
      }

      // Auto-authenticate immediately after successful registration
      const loginRes = await signIn("credentials", {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (loginRes?.error) {
        // Fallback to login page if auto-login fails
        router.push("/login?registered=true");
        return;
      }

      // Exact role-based destination per Phase 2 spec:
      // Donors go to /map, NGOs to /ngo/apply
      if (data.role === "ngo") {
        router.push("/ngo/apply");
      } else {
        router.push("/map");
      }

      router.refresh();
    } catch (err) {
      console.error("Registration submission error:", err);
      setError("An unexpected network error occurred. Please try again.");
    }
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
            Create an Account
          </h1>
          <p className="text-xs text-on-surface-variant max-w-xs mx-auto leading-relaxed">
            Join ReliefTrack to fund crisis response or manage verified humanitarian field deliveries.
          </p>
        </div>

        {/* Register Card */}
        <Card className="shadow-modal border-outline-variant animate-slide-up">
          <CardHeader>
            <CardTitle className="text-lg">Registration Details</CardTitle>
            <CardDescription>
              Complete the fields below to establish your secure credentials.
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
              {/* Role Select Dropdown */}
              <Select
                label="Account Type"
                options={[
                  { value: "donor", label: "💝 Donor (Fund crises & track escrow releases)" },
                  { value: "ngo", label: "🏥 NGO (Deploy relief teams & submit field proof)" },
                ]}
                error={errors.role?.message}
                {...register("role")}
              />

              {/* Informative helper banner for selected role */}
              <div className="p-3 rounded-input bg-surface-container border border-outline-variant/60 flex items-start gap-2.5 text-xs text-on-surface-variant">
                {selectedRole === "ngo" ? (
                  <>
                    <Building2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      NGOs will be redirected to the <strong>accreditation application</strong> immediately after registering.
                    </span>
                  </>
                ) : (
                  <>
                    <HeartHandshake className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>
                      Donors will be directed to the <strong>live crisis map</strong> to inspect priority zones and fund verified escrow milestones.
                    </span>
                  </>
                )}
              </div>

              {/* Full Name */}
              <Input
                label="Full Name or Organisation Name"
                placeholder={selectedRole === "ngo" ? "e.g. Rapid Relief Foundation" : "e.g. Priya Sharma"}
                autoComplete="name"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.name?.message}
                {...register("name")}
              />

              {/* Email Address */}
              <Input
                label="Email Address"
                type="email"
                placeholder="you@domain.com"
                autoComplete="email"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register("email")}
              />

              {/* Password */}
              <Input
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                helperText="Must be at least 8 characters long."
                {...register("password")}
              />

              {/* Confirm Password */}
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isSubmitting}
                loadingText="Creating account..."
              >
                Create Account & Continue
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-2 pt-2 border-t border-outline-variant/50 text-center">
            <p className="text-xs text-on-surface-variant">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Sign in here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
