"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";

import { loginUser } from "@/lib/api/auth";
import { loginSchema } from "@/lib/validators/auth";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ApiError } from "@/types/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [apiError, setApiError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: (variables: { email: string; password: string }) =>
      loginUser(variables),
    onSuccess: async () => {
      await refreshUser();
      const redirectParam = searchParams.get("redirect");
      const target =
        redirectParam &&
        redirectParam.startsWith("/") &&
        !redirectParam.startsWith("//")
          ? redirectParam
          : "/";
      router.push(target);
    },
    onError: (error: unknown) => {
      const err = error as (ApiError & { message?: string }) | undefined;
      const message =
        err?.error?.message || err?.message || "Invalid email or password";
      setApiError(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setApiError(null);

    const result = loginSchema.safeParse({
      email,
      password,
    });

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0];
        if (fieldName && !formattedErrors[fieldName.toString()]) {
          formattedErrors[fieldName.toString()] = issue.message;
        }
      });
      setValidationErrors(formattedErrors);
      return;
    }

    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="text-center space-y-1">
          <CardTitle
            role="heading"
            aria-level={1}
            className="text-2xl font-bold tracking-tight"
          >
            Sign in to Kalano
          </CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {apiError && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-center gap-2 p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                disabled={loginMutation.isPending}
                aria-invalid={!!validationErrors.email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) {
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next.email;
                      return next;
                    });
                  }
                }}
              />
              {validationErrors.email && (
                <p className="text-xs text-destructive">
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                disabled={loginMutation.isPending}
                aria-invalid={!!validationErrors.password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) {
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next.password;
                      return next;
                    });
                  }
                }}
              />
              {validationErrors.password && (
                <p className="text-xs text-destructive">
                  {validationErrors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full mt-2"
              size="lg"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t py-4 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md shadow-md p-6 text-center">
            <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
          </Card>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
