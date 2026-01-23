"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  BarChart3,
  Layers,
  ToggleLeft,
  Activity,
  Database,
  RefreshCw,
  Loader2,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

interface Stats {
  features: {
    total: number;
    byEnvironment: Record<string, number>;
    byStrategy: Record<string, number>;
  };
  flags: {
    total: number;
    enabled: number;
    disabled: number;
  };
  auditLogs: {
    total: number;
    last24h: number;
    byAction: Record<string, number>;
  };
  cache: {
    status: string;
    keys?: number;
  };
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  delay = 0,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-colors"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-neutral-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && (
          <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </motion.div>
);

const ProgressBar = ({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-neutral-400">{label}</span>
        <span className="text-white font-medium">
          {value} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
};

export default function MetricsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<Stats>("/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-neutral-400">{error || "No data available"}</p>
        <button
          onClick={fetchStats}
          className="mt-4 text-blue-500 hover:text-blue-400"
        >
          Retry
        </button>
      </div>
    );
  }

  const enabledPercentage =
    stats.flags.total > 0
      ? ((stats.flags.enabled / stats.flags.total) * 100).toFixed(0)
      : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
            Metrics & Stats
          </h1>
          <p className="text-neutral-400">
            Overview of your feature flag system
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white px-4 py-2 rounded-xl transition-all"
        >
          <RefreshCw className={clsx("h-4 w-4", loading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Features"
          value={stats.features.total}
          icon={Layers}
          color="bg-blue-600"
          delay={0}
        />
        <StatCard
          title="Total Flags"
          value={stats.flags.total}
          icon={ToggleLeft}
          color="bg-emerald-600"
          subtitle={`${enabledPercentage}% enabled`}
          delay={0.1}
        />
        <StatCard
          title="Audit Logs"
          value={stats.auditLogs.total}
          icon={Activity}
          color="bg-orange-600"
          subtitle={`${stats.auditLogs.last24h} in last 24h`}
          delay={0.2}
        />
        <StatCard
          title="Cached Keys"
          value={stats.cache.keys || 0}
          icon={Zap}
          color={
            stats.cache.status === "connected" ? "bg-green-600" : "bg-red-600"
          }
          subtitle={`Redis: ${stats.cache.status}`}
          delay={0.3}
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flags Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6"
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center">
            <ToggleLeft className="h-5 w-5 mr-2 text-blue-500" />
            Flag Status
          </h2>
          <div className="space-y-4">
            <ProgressBar
              label="Enabled"
              value={stats.flags.enabled}
              total={stats.flags.total}
              color="bg-emerald-500"
            />
            <ProgressBar
              label="Disabled"
              value={stats.flags.disabled}
              total={stats.flags.total}
              color="bg-neutral-600"
            />
          </div>
        </motion.div>

        {/* By Environment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6"
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center">
            <Database className="h-5 w-5 mr-2 text-blue-500" />
            Flags by Environment
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {["DEV", "STAGING", "PROD"].map((env) => (
              <div
                key={env}
                className="bg-neutral-800/50 rounded-xl p-4 text-center"
              >
                <p className="text-2xl font-bold text-white">
                  {stats.features.byEnvironment[env] || 0}
                </p>
                <p
                  className={clsx(
                    "text-xs font-medium mt-1",
                    env === "DEV" && "text-blue-400",
                    env === "STAGING" && "text-yellow-400",
                    env === "PROD" && "text-emerald-400",
                  )}
                >
                  {env}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* By Strategy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6"
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            Flags by Strategy
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.features.byStrategy).map(
              ([strategy, count]) => (
                <div
                  key={strategy}
                  className="flex items-center justify-between bg-neutral-800/50 rounded-xl p-3"
                >
                  <span className="text-neutral-300">{strategy}</span>
                  <span className="text-white font-bold">{count}</span>
                </div>
              ),
            )}
            {Object.keys(stats.features.byStrategy).length === 0 && (
              <p className="text-neutral-500 text-center py-4">No flags yet</p>
            )}
          </div>
        </motion.div>

        {/* Audit Log Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6"
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
            Activity by Action
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.auditLogs.byAction).map(([action, count]) => (
              <div
                key={action}
                className="flex items-center justify-between bg-neutral-800/50 rounded-xl p-3"
              >
                <span
                  className={clsx(
                    "text-xs font-bold px-2 py-1 rounded uppercase",
                    action === "CREATE" && "bg-emerald-500/10 text-emerald-500",
                    action === "UPDATE" && "bg-blue-500/10 text-blue-500",
                    action === "DELETE" && "bg-red-500/10 text-red-500",
                  )}
                >
                  {action}
                </span>
                <span className="text-white font-bold">{count}</span>
              </div>
            ))}
            {Object.keys(stats.auditLogs.byAction).length === 0 && (
              <p className="text-neutral-500 text-center py-4">
                No activity yet
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
