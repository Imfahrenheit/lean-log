"use client";

import { Suspense, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { checkUserExists, validateInviteEmail } from "./actions";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlError = searchParams.get("error");
    const urlMessage = searchParams.get("message");

    if (urlError) {
      setError(
        urlError === "missing_code"
          ? "The login link is missing or has already been used. Please request a new magic link."
          : urlError,
      );
      setMessage(null);
      return;
    }

    if (urlMessage) {
      setMessage(urlMessage);
      setError(null);
    }
  }, [searchParams]);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Check if user already exists
    const userExists = await checkUserExists(email);
    
    // If new user, validate invite exists for this email
    if (!userExists) {
      const validation = await validateInviteEmail(email);
      if (!validation.valid) {
        setLoading(false);
        setError(validation.error || "You need an invite to sign up. Please contact an administrator.");
        return;
      }
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    setLoading(false);
    if (error) return setError(error.message);
    setMessage("Check your email for the magic link.");
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (data.session) router.replace("/");
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>

      <form className="space-y-3" onSubmit={handleMagicLink}>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="you@example.com"
          required
        />
        <p className="text-xs text-muted-foreground">
          New users need an invite. Existing users can sign in directly.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black text-white py-2 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send magic link"}
        </button>
      </form>

      <div className="text-center text-sm text-gray-500">or</div>

      <form className="space-y-3" onSubmit={handlePassword}>
        <label className="block text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="••••••••"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-gray-900 text-white py-2 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in with password"}
        </button>
      </form>

      {message && <p className="text-green-600 text-sm">{message}</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md p-6 space-y-3">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-gray-500">Loading sign-in form…</p>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
