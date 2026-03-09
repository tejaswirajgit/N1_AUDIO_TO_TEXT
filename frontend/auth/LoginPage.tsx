import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import authService from "./authService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { user, error: loginError } = await authService.signInWithPassword({ email, password });
    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }
    // Fetch role
    const { role, error: roleError } = await authService.fetchUserRole(user.id);
    if (roleError) {
      setError(roleError.message);
      setLoading(false);
      return;
    }
    // Redirect based on role
    if (role === "admin") {
      router.push("/admin");
    } else if (role === "user") {
      router.push("/resident/dashboard");
    } else {
      setError("Unknown role");
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        {error && <div className="error-message">{error}</div>}
      </form>
      {/* Style using Resource File template */}
    </div>
  );
}
