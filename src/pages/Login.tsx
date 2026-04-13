import React from "react";
import { useUser, useGoogleLogin, useSendLoginLink } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HeartPulse, CheckCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SignUpForm } from "@/components/SignUpForm";

export default function LoginPage() {
  const user = useUser();
  const navigate = useNavigate();
  const googleLoginUrl = useGoogleLogin();
  const { sendLoginLink, isLoading } = useSendLoginLink();
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    if (user.isAuthenticated) {
      // Role-based redirect
      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else if (user.role === "facility_manager") {
        navigate("/facility-dashboard");
      } else if (user.role === "staff") {
        navigate("/staff-dashboard");
      } else {
        // Fallback to admin dashboard if role is not recognized
        navigate("/admin-dashboard");
      }
    }
  }, [user.isAuthenticated, navigate]);

  const handleEmailLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendLoginLink({ email });
      setShowSuccess(true);
      setEmail("");
      setTimeout(() => setShowSuccess(false), 10000);
    } catch (error) {
      toast.error("Failed to send login link");
    }
  }, [email, sendLoginLink]);

  const switchToSignIn = useCallback(() => setActiveTab("signin"), []);
  const switchToSignUp = useCallback(() => setActiveTab("signup"), []);

  if (user.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-8">
      <Card className="w-full max-w-md shadow-lg">
        {/* Branding Header */}
        <CardHeader className="space-y-4 text-center pb-4">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-md">
              <HeartPulse className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold md:text-3xl">ALJO CareCrew</CardTitle>
            <CardDescription className="text-base mt-2">
              Healthcare Staffing Platform
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-8">
          {/* Tab Toggle */}
          <div className="flex rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={switchToSignIn}
              className={cn(
                "flex-1 rounded-md py-2.5 text-sm font-medium transition-all",
                activeTab === "signin"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={switchToSignUp}
              className={cn(
                "flex-1 rounded-md py-2.5 text-sm font-medium transition-all",
                activeTab === "signup"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign Up
            </button>
          </div>

          {/* Sign In Tab Content */}
          {activeTab === "signin" && (
            <div className="space-y-6">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 text-base"
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Login Link"}
                </Button>
                {showSuccess && (
                  <div className="flex items-center gap-2 rounded-lg bg-accent/10 p-3 text-sm text-accent">
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <p className="font-medium">Check your email for a login link</p>
                  </div>
                )}
              </form>

              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                  OR
                </span>
              </div>

              <div>
                <a href={googleLoginUrl}>
                  <Button variant="outline" className="w-full h-12 text-base" type="button">
                    <img
                      className="mr-2 h-5 w-5"
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      alt="Google"
                    />
                    Continue with Google
                  </Button>
                </a>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  New staff member?{" "}
                  <button
                    type="button"
                    onClick={switchToSignUp}
                    className="font-medium text-primary hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Sign Up Tab Content */}
          {activeTab === "signup" && (
            <SignUpForm onSwitchToSignIn={switchToSignIn} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}