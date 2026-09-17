"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { BrandMark } from "@/components/ui/BrandMark";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, name };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Something went wrong");
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      <header className="px-5 sm:px-8 h-16 flex items-center border-b border-border">
        <Link href="/">
          <BrandMark />
        </Link>
      </header>

      <main className="flex-1 grid place-items-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="font-mono-label text-fg-dim mb-2">
              {mode === "login" ? "WELCOME BACK" : "START TRAINING"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {mode === "login" ? "Sign in to FlexGain" : "Create your account"}
            </h1>
            <p className="text-fg-muted text-sm mt-2">
              {mode === "login"
                ? "Pick up where you left off. Every rep counts."
                : "Two minutes. No card. No noise."}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" ? (
              <div>
                <Label htmlFor="name" required>
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Stone"
                />
              </div>
            ) : null}
            <div>
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password" required>
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={mode === "signup" ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <div className="rounded border border-accent-red/40 bg-accent-red/10 px-3 py-2 text-sm text-accent-red">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              fullWidth
              disabled={submitting}
              className="mt-2"
            >
              {submitting
                ? mode === "login"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-fg-muted">
            {mode === "login" ? (
              <>
                New here?{" "}
                <Link href="/signup" className="text-accent-red hover:underline">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login" className="text-accent-red hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
