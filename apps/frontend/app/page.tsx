"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Terminal, Lock, ArrowRight, Loader2, Building2 } from "lucide-react";

const DEMO_TENANTS = [
  { slug: "zebra", name: "Zebra Electronics", color: "bg-blue-600" },
  { slug: "yms", name: "YMS Yazılım", color: "bg-emerald-600" },
];

interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: string;
  services: {
    database: "up" | "down";
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Health Check State
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async (): Promise<void> => {
      try {
        // Use relative URL to leverage the proxy we just fixed
        const response = await fetch("/api/backend/health");

        if (!response.ok) {
          throw new Error("Backend unavailable");
        }

        const data: HealthStatus = await response.json();
        setHealth(data);
        setHealthError(null);
      } catch (err) {
        setHealthError((err as Error).message || "Connection failed");
        setHealth(null);
      } finally {
        setHealthLoading(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (slug: string) => {
    setLoading(true);
    setError("");

    try {
      // 1. Get Token - send slug, receive actual tenantId
      const res = await api.post("/auth/demo-token", { tenantSlug: slug });
      const { token, tenantId: actualTenantId } = res.data;

      // 2. Store Creds - use the actual tenantId from response
      localStorage.setItem("token", token);
      localStorage.setItem("tenantId", actualTenantId);

      // 3. Redirect
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError("Invalid Tenant ID or Server Error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(tenantId);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Login Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-blue-500/20 shadow-lg">
              <Terminal className="text-white h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Feature Flag Admin
            </h1>
            <p className="text-neutral-400 text-sm mt-2">
              Select a demo tenant or enter your own
            </p>
          </div>

          {/* Demo Tenant Buttons */}
          <div className="space-y-3 mb-6">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Demo Tenants
            </label>
            <div className="grid grid-cols-2 gap-3">
              {DEMO_TENANTS.map((tenant) => (
                <button
                  key={tenant.slug}
                  onClick={() => handleLogin(tenant.slug)}
                  disabled={loading}
                  className={`${tenant.color} hover:opacity-90 text-white font-medium py-3 px-4 rounded-lg flex flex-col items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Building2 className="h-5 w-5 mb-1" />
                  <span className="text-sm">{tenant.name}</span>
                  <span className="text-[10px] opacity-70">{tenant.slug}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-neutral-800" />
            <span className="px-4 text-xs text-neutral-500">OR</span>
            <div className="flex-1 border-t border-neutral-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2 tracking-wider">
                Custom Tenant ID
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                <input
                  type="text"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="Enter tenant slug..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !tenantId}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Access Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* System Status Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
            System Status
          </h2>

          {healthLoading && (
            <div className="flex items-center space-x-2 text-neutral-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking backend health...</span>
            </div>
          )}

          {healthError && (
            <div className="flex justify-between items-center py-2 border-b border-neutral-800/50">
              <span className="text-sm font-medium text-neutral-300">
                Backend
              </span>
              <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-xs font-medium border border-red-500/20">
                Offline
              </span>
            </div>
          )}

          {health && (
            <div className="space-y-1">
              <div className="flex justify-between items-center py-2 border-b border-neutral-800/50">
                <span className="text-sm font-medium text-neutral-300">
                  Backend API
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    health.status === "healthy"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                  }`}
                >
                  {health.status === "healthy" ? "Online" : "Degraded"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-neutral-300">
                  Database
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    health.services.database === "up"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}
                >
                  {health.services.database === "up"
                    ? "Connected"
                    : "Disconnected"}
                </span>
              </div>
              <p className="text-[10px] text-neutral-600 mt-2 text-right">
                Last checked: {new Date(health.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-neutral-500 text-xs">Made By YMS</p>
        </div>
      </div>
    </div>
  );
}
