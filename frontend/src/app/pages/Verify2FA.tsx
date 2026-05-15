import { useState } from "react";
import { useNavigate } from "react-router";
import { authApi } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";

export function Verify2FA() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const userId = sessionStorage.getItem("pending2FAUserId");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError("Session expired. Please log in again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await authApi.verify2FA(userId, token);
      sessionStorage.removeItem("pending2FAUserId");
      if (data.user) setUser(data.user);
      navigate("/student/dashboard");
    } catch {
      setError("Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Two-Factor Authentication</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-center text-2xl tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading || token.length !== 6}
            className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>
        <button
          onClick={() => navigate("/login")}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:underline"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
