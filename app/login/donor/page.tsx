"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Lock, Mail, ArrowRight, ShieldCheck, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

export default function DonorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("donor@demo.com");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid donor credentials. Please use donor@demo.com / demo1234");
      setLoading(false);
    } else {
      router.push("/map");
    }
  };

  const handleQuickDemo = async () => {
    setEmail("donor@demo.com");
    setPassword("demo1234");
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email: "donor@demo.com",
      password: "demo1234",
      redirect: false,
    });

    if (res?.error) {
      setError("Could not sign in with demo donor.");
      setLoading(false);
    } else {
      router.push("/map");
    }
  };

  return (
    <div className="section min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Role Portal Indicator Tabs */}
        <div className="flex bg-surface-container rounded-pill p-1 border border-outline-variant/60 text-xs font-semibold justify-between">
          <Link
            href="/login/donor"
            className="flex-1 py-1.5 text-center rounded-pill bg-primary text-white shadow-xs font-bold transition-all"
          >
            Donor Portal
          </Link>
          <Link
            href="/login/ngo"
            className="flex-1 py-1.5 text-center rounded-pill text-on-surface-variant hover:text-on-surface transition-all"
          >
            NGO Portal
          </Link>
          <Link
            href="/login/admin"
            className="flex-1 py-1.5 text-center rounded-pill text-on-surface-variant hover:text-on-surface transition-all"
          >
            Admin Console
          </Link>
        </div>

        <Card className="shadow-md border-outline-variant/60">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 bg-primary-container text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Badge variant="PLATFORM" dot>
                Donor Access
              </Badge>
            </div>
            <CardTitle className="text-2xl font-extrabold text-on-surface">
              Donor Portal Sign In
            </CardTitle>
            <CardDescription className="text-xs">
              Fund real-time crisis relief with verified escrow protection.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {error && (
              <div className="p-3 rounded-input bg-error-container text-error text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-xs"
                    placeholder="donor@demo.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full text-xs font-bold" isLoading={loading}>
                <span>Sign In as Donor</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-outline-variant/60"></div>
              <span className="flex-shrink mx-3 text-[10px] font-mono uppercase text-on-surface-variant">
                1-click demo login
              </span>
              <div className="flex-grow border-t border-outline-variant/60"></div>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleQuickDemo}
              disabled={loading}
              className="w-full text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-secondary" />
              <span>Use Demo Account (donor@demo.com)</span>
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 text-center border-t border-outline-variant/40 pt-4">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-on-surface-variant">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Redirects directly to Live Disaster Map & Impact Feed</span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Need to register as an NGO instead?{" "}
              <Link href="/login/ngo" className="text-primary font-bold hover:underline">
                Go to NGO Portal
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

