"use client";

import { useEffect, useState } from "react";
import { FeaturesApi, Feature } from "@/lib/api";
import {
  Plus,
  Search,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { FeatureCard } from "@/components/FeatureCard";
import { FeatureModal } from "@/components/FeatureModal";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(9);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const response = await FeaturesApi.list({
        page,
        limit,
        search: debouncedSearch || undefined,
      });
      setFeatures(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, [page, debouncedSearch]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
            Features
          </h1>
          <p className="text-neutral-400">
            Manage your feature flags and rollout strategies.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search features..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all w-64"
            />
          </div>
          <button
            onClick={fetchFeatures}
            className="p-2 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-all"
            title="Refresh"
          >
            <RefreshCw className={clsx("h-5 w-5", loading && "animate-spin")} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            <span>New Feature</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && features.length === 0 ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : features.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onDeleted={(deletedId) => {
                  setFeatures((prev) => prev.filter((f) => f.id !== deletedId));
                  setTotal((prev) => prev - 1);
                }}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-neutral-800">
              <p className="text-sm text-neutral-500">
                Showing {(page - 1) * limit + 1} -{" "}
                {Math.min(page * limit, total)} of {total} features
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={clsx(
                          "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                          p === page
                            ? "bg-blue-600 text-white"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-800",
                        )}
                      >
                        {p}
                      </button>
                    ),
                  )}
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
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-32 bg-neutral-900/30 border border-dashed border-neutral-800 rounded-3xl"
        >
          <div className="h-16 w-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-neutral-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            No features found
          </h3>
          <p className="text-neutral-500 max-w-sm text-center mb-6">
            {search
              ? `No results matching "${search}"`
              : "Get started by creating your first feature flag."}
          </p>
          {!search && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-blue-500 hover:text-blue-400 font-medium"
            >
              Create a Feature
            </button>
          )}
        </motion.div>
      )}

      <FeatureModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchFeatures}
      />
    </div>
  );
}
