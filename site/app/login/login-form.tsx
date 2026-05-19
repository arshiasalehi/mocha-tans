"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateCredentials() {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail) return "Email is required.";
    if (!trimmedPassword) return "Password is required.";
    if (trimmedPassword.length < 8) return "Password must be at least 8 characters.";
    return null;
  }

  function normalizeAuthError(message: string) {
    if (message.toLowerCase().includes("anonymous sign-ins are disabled")) {
      return "Signup failed. Fill email/password and ensure Email signup is enabled in Supabase Auth settings.";
    }
    if (message.toLowerCase().includes("invalid login credentials")) {
      return "Invalid login credentials. Double-check email/password and remove any extra spaces.";
    }
    return message;
  }

  async function handleSignIn(event: FormEvent) {
    event.preventDefault();
    const validationError = validateCredentials();
    if (validationError) {
      setError(validationError);
      setMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });

    if (error) {
      setError(normalizeAuthError(error.message));
      setLoading(false);
      return;
    }

    window.location.assign(nextPath);
  }

  async function handleSignUp() {
    const validationError = validateCredentials();
    if (validationError) {
      setError(validationError);
      setMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({ email: email.trim(), password: password.trim() });

    if (error) {
      setError(normalizeAuthError(error.message));
      setLoading(false);
      return;
    }

    setMessage("Account created. If email confirmation is enabled, please verify your inbox.");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSignIn} className="mt-8 max-w-md space-y-4 rounded-3xl border border-[#eadfce] bg-white p-6">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        className="w-full rounded-xl border border-zinc-300 px-3 py-2"
      />
      <input
        type="password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        className="w-full rounded-xl border border-zinc-300 px-3 py-2"
      />
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-[#8e5e01] px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Loading..." : "Sign in"}
      </button>
      <button
        type="button"
        onClick={handleSignUp}
        disabled={loading}
        className="w-full rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold"
      >
        Create account
      </button>
    </form>
  );
}
