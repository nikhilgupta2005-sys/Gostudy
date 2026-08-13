"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "@/styles/sections/Admin.module.css";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  // Only ever return to a path inside this site
  const raw = params.get("next") || "/admin";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/admin";
  const wasRedirected = params.has("next");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push(next);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={styles.loginCard}>
      <h1 className={styles.loginTitle}>Admin Login</h1>
      <p className={styles.loginSub}>GoStudy Dashboard</p>

      {wasRedirected && (
        <p className={styles.loginNotice}>Please sign in to open the dashboard.</p>
      )}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className={styles.loginInput}
        autoComplete="username"
        autoFocus
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className={styles.loginInput}
        autoComplete="current-password"
        required
      />

      {error && <p className={styles.loginError}>{error}</p>}

      <button type="submit" className="pillBtn pillBtn--solid" disabled={busy}>
        {busy ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className={styles.loginWrap}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
