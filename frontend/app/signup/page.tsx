"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

import { registerUser } from "@/lib/api/auth";
import { signupSchema } from "@/lib/validators/auth";
import { RoleSelector } from "@/components/role-selector";
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

export default function SignupPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"buyer" | "merchant" | null>(
    null
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: (variables: {
      display_name: string;
      email: string;
      password: string;
      user_role: "buyer" | "merchant";
    }) => registerUser(variables),
    onSuccess: () => {
      toast.success("Account created successfully!");
      router.push("/login");
    },
    onError: (error: unknown) => {
      const err = error as (ApiError & { message?: string }) | undefined;
      const message =
        err?.error?.message ||
        err?.message ||
        "An unexpected error occurred during registration. Please try again.";
      setApiError(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setApiError(null);

    const result = signupSchema.safeParse({
      display_name: displayName,
      email,
      password,
      confirm_password: confirmPassword,
      user_role: selectedRole,
    });

    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0];
        if (fieldName && !formattedErrors[fieldName.toString()]) {
          formattedErrors[fieldName.toString()] = issue.message;
        }
      });
      setFieldErrors(formattedErrors);
      return;
    }

    if (!selectedRole) {
      setFieldErrors((prev) => ({
        ...prev,
        user_role: "Please select a role",
      }));
      return;
    }

    registerMutation.mutate({
      display_name: displayName.trim(),
      email: email.trim(),
      password,
      user_role: selectedRole,
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="max-w-xl w-full mx-auto shadow-md">
        <CardHeader className="text-center space-y-1">
          <CardTitle
            role="heading"
            aria-level={1}
            className="text-2xl font-bold tracking-tight"
          >
            Create an Account
          </CardTitle>
          <CardDescription>
            Choose your account type and fill in your details to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div
                role="alert"
                className="flex items-center gap-2 p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <RoleSelector
              selectedRole={selectedRole}
              onRoleSelect={(role) => {
                setSelectedRole(role);
                if (fieldErrors.user_role) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.user_role;
                    return next;
                  });
                }
              }}
              errorMessage={fieldErrors.user_role}
            />

            <div className="space-y-1.5">
              <label
                htmlFor="display_name"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Display Name
              </label>
              <Input
                id="display_name"
                type="text"
                placeholder="e.g. Jane Doe"
                value={displayName}
                disabled={registerMutation.isPending}
                aria-invalid={!!fieldErrors.display_name}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (fieldErrors.display_name) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.display_name;
                      return next;
                    });
                  }
                }}
              />
              {fieldErrors.display_name && (
                <p className="text-xs text-destructive">
                  {fieldErrors.display_name}
                </p>
              )}
            </div>

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
                disabled={registerMutation.isPending}
                aria-invalid={!!fieldErrors.email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.email;
                      return next;
                    });
                  }
                }}
              />
              {fieldErrors.email && (
                <p className="text-xs text-destructive">{fieldErrors.email}</p>
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
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                disabled={registerMutation.isPending}
                aria-invalid={!!fieldErrors.password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.password;
                      return next;
                    });
                  }
                }}
              />
              {fieldErrors.password && (
                <p className="text-xs text-destructive">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm_password"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Confirm Password
              </label>
              <Input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                disabled={registerMutation.isPending}
                aria-invalid={!!fieldErrors.confirm_password}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirm_password) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.confirm_password;
                      return next;
                    });
                  }
                }}
              />
              {fieldErrors.confirm_password && (
                <p className="text-xs text-destructive">
                  {fieldErrors.confirm_password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full mt-2"
              size="lg"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t py-4 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
