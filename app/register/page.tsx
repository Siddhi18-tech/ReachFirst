"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { signIn } from "next-auth/react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Minimum 8 characters"),
  confirmPassword: z.string(),
  role: z.enum(["donor", "ngo"]),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "donor" },
  });

  const selectedRole = watch("role");

  async function onSubmit(data: FormData) {
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name, email: data.email, password: data.password, role: data.role }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Registration failed");
      return;
    }

    // Auto-login after registration
    await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    if (data.role === "ngo") {
      router.push("/ngo/apply");
    } else {
      router.push("/");
    }
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-surface-low px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-card mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Create an account</h1>
          <p className="text-sm text-on-surface-variant mt-1">Join ReliefTrack to donate or register your NGO</p>
        </div>

        <div className="card p-8 animate-slide-up">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-input text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Role selector */}
            <div>
              <label className="label">I am a</label>
              <div className="flex rounded-input border border-outline-variant overflow-hidden">
                {(["donor", "ngo"] as const).map((r) => (
                  <label
                    key={r}
                    className={`flex-1 text-center py-2.5 text-sm font-semibold cursor-pointer transition-colors ${
                      selectedRole === r
                        ? "bg-primary text-white"
                        : "bg-white text-on-surface-variant hover:bg-surface-low"
                    }`}
                  >
                    <input type="radio" className="sr-only" value={r} {...register("role")} />
                    {r === "donor" ? "💝 Donor" : "🏥 NGO"}
                  </label>
                ))}
              </div>
              {selectedRole === "ngo" && (
                <p className="mt-1.5 text-xs text-on-surface-variant">
                  After registering, you&apos;ll complete the NGO accreditation form.
                </p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="name">Full name / Organisation</label>
              <input id="name" type="text" className="input" placeholder="Priya Sharma" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-error">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input id="email" type="email" autoComplete="email" className="input" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" placeholder="Min. 8 characters" {...register("password")} />
              {errors.password && <p className="mt-1 text-xs text-error">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="confirmPassword">Confirm password</label>
              <input id="confirmPassword" type="password" className="input" placeholder="••••••••" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="mt-1 text-xs text-error">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
