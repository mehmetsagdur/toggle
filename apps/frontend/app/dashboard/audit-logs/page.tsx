"use client";

import { useEffect, useState } from "react";
import { AuditLogsApi, AuditLog } from "@/lib/api";
import {
  Activity,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

type ActionFilter = "ALL" | "CREATE" | "UPDATE" | "DELETE";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<ActionFilter>("ALL");

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await AuditLogsApi.list({
        page,
        limit,
        action: actionFilter !== "ALL" ? actionFilter : undefined,
      });
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const totalPages = Math.ceil(total / limit);

  const handleFilterChange = (filter: ActionFilter) => {
    setActionFilter(filter);
    setPage(1);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
            Audit Logs
          </h1>
          <p className="text-neutral-400">
            Track all changes and promotions in the system.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Action Filter */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1">
            {(["ALL", "CREATE", "UPDATE", "DELETE"] as ActionFilter[]).map(
              (filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                    actionFilter === filter
                      ? "bg-blue-600 text-white"
                      : "text-neutral-400 hover:text-white",
                  )}
                >
                  {filter}
                </button>
              ),
            )}
          </div>
          <button
            onClick={fetchLogs}
            className="p-2 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-all"
            title="Refresh"
          >
            <RefreshCw className={clsx("h-5 w-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-neutral-900/30 border border-dashed border-neutral-800 rounded-3xl">
          <div className="h-16 w-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <Activity className="h-8 w-8 text-neutral-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            No activity recorded
          </h3>
          <p className="text-neutral-500">
            {actionFilter !== "ALL"
              ? `No ${actionFilter} actions found.`
              : "Changes will appear here."}
          </p>
        </div>
      ) : (
        <>
          <div className="relative border-l border-neutral-800 ml-3 space-y-6 pb-6">
            {logs.map((log, index) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                key={log.id}
                className="relative pl-8"
              >
                {/* Dot */}
                <div
                  className={clsx(
                    "absolute -left-1.5 top-1.5 h-3 w-3 bg-neutral-950 border rounded-full shadow-lg",
                    log.action === "CREATE" &&
                      "border-emerald-500 shadow-emerald-500/50",
                    log.action === "UPDATE" &&
                      "border-blue-500 shadow-blue-500/50",
                    log.action === "DELETE" &&
                      "border-red-500 shadow-red-500/50",
                  )}
                />

                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <span
                        className={clsx(
                          "text-xs font-bold px-2 py-1 rounded uppercase tracking-wider",
                          {
                            "bg-emerald-500/10 text-emerald-500":
                              log.action === "CREATE",
                            "bg-blue-500/10 text-blue-500":
                              log.action === "UPDATE",
                            "bg-red-500/10 text-red-500":
                              log.action === "DELETE",
                          },
                        )}
                      >
                        {log.action}
                      </span>
                      <span className="font-mono text-sm text-neutral-300">
                        {log.entityType}{" "}
                        <span className="text-neutral-500">
                          {log.entityId.slice(0, 8)}...
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-neutral-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{log.actorId.slice(0, 8)}...</span>
                      </div>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Deep Diff or JSON View */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {log.beforeState != null && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-neutral-500 uppercase">
                          Before
                        </span>
                        <pre className="bg-neutral-950 p-3 rounded-lg text-[10px] text-neutral-400 font-mono overflow-x-auto max-h-40 border border-neutral-800 custom-scrollbar">
                          {JSON.stringify(log.beforeState, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.afterState != null && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-neutral-500 uppercase">
                          After
                        </span>
                        <pre className="bg-neutral-950 p-3 rounded-lg text-[10px] text-emerald-400/80 font-mono overflow-x-auto max-h-40 border border-neutral-800 custom-scrollbar">
                          {JSON.stringify(log.afterState, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-neutral-800">
              <p className="text-sm text-neutral-500">
                Showing {(page - 1) * limit + 1} -{" "}
                {Math.min(page * limit, total)} of {total} logs
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={clsx(
                    "p-2 rounded-lg transition-colors",
                    page === 1
                      ? "text-neutral-700 cursor-not-allowed"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800",
                  )}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={clsx(
                          "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                          pageNum === page
                            ? "bg-blue-600 text-white"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-800",
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={clsx(
                    "p-2 rounded-lg transition-colors",
                    page === totalPages
                      ? "text-neutral-700 cursor-not-allowed"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800",
                  )}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
