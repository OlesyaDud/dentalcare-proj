import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Mail } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const sendLink = async () => {
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
      },
    });
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <main className="container py-14 max-w-lg">
      <h1 className="text-3xl font-semibold">Staff Login</h1>
      <p className="text-muted mt-2">
        We’ll email you a one-time sign-in link.
      </p>
      <div className="card mt-6">
        <input
          className="input w-full"
          type="email"
          placeholder="you@clinic.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={sendLink} className="btn-primary w-full mt-3">
          <Mail className="h-4 w-4" /> Send Magic Link
        </button>
        {sent && (
          <div className="text-sm text-green-600 mt-3">
            Check your inbox for the sign-in link.
          </div>
        )}
        {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
        <div className="text-xs text-muted mt-3">
          In Supabase Auth settings, add{" "}
          <code>{window.location.origin}/dashboard</code> to the Allowed
          Redirect URLs.
        </div>
      </div>
    </main>
  );
}
