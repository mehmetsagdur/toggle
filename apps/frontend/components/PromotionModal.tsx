"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  ArrowDown,
} from "lucide-react";
import { FeaturesApi, Environment, PromotionResultDto } from "@/lib/api";
import clsx from "clsx";

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureKey?: string; // If provided, promotes only this feature
  onSuccess: () => void;
}

export function PromotionModal({
  isOpen,
  onClose,
  featureKey,
  onSuccess,
}: PromotionModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [sourceEnv, setSourceEnv] = useState<Environment>(Environment.DEV);
  const [targetEnv, setTargetEnv] = useState<Environment>(Environment.STAGING);
  const [loading, setLoading] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<PromotionResultDto | null>(
    null,
  );
  const [error, setError] = useState("");

  const handleDryRun = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await FeaturesApi.promote({
        sourceEnv,
        targetEnv,
        dryRun: true,
        featureKeys: featureKey ? [featureKey] : undefined,
      });
      setDryRunResult(result);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to calculate dry run");
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async () => {
    setLoading(true);
    setError("");
    try {
      await FeaturesApi.promote({
        sourceEnv,
        targetEnv,
        dryRun: false,
        featureKeys: featureKey ? [featureKey] : undefined,
      });
      onSuccess();
      onClose();
      // Reset state
      setTimeout(() => {
        setStep(1);
        setDryRunResult(null);
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to promote features");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-6 border-b border-neutral-800 bg-neutral-900/50">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Promote Environment
                  </h2>
                  <p className="text-sm text-neutral-400">
                    Move feature flags from one environment to another.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {step === 1 && (
                  <div className="grid grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <label className="block text-xs font-semibold text-neutral-500 uppercase">
                        Source Environment
                      </label>
                      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl relative group cursor-pointer hover:border-blue-500/30 transition-colors">
                        <select
                          value={sourceEnv}
                          onChange={(e) =>
                            setSourceEnv(e.target.value as Environment)
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        >
                          {Object.values(Environment).map((e) => (
                            <option key={e} value={e}>
                              {e}
                            </option>
                          ))}
                        </select>
                        <div className="text-lg font-bold text-white">
                          {sourceEnv}
                        </div>
                        <div className="text-xs text-neutral-500">
                          Source of truth
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="h-10 w-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-xs font-semibold text-neutral-500 uppercase">
                        Target Environment
                      </label>
                      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl relative group cursor-pointer hover:border-blue-500/30 transition-colors">
                        <select
                          value={targetEnv}
                          onChange={(e) =>
                            setTargetEnv(e.target.value as Environment)
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        >
                          {Object.values(Environment)
                            .filter((e) => e !== sourceEnv)
                            .map((e) => (
                              <option key={e} value={e}>
                                {e}
                              </option>
                            ))}
                        </select>
                        <div className="text-lg font-bold text-white">
                          {targetEnv}
                        </div>
                        <div className="text-xs text-neutral-500">
                          Destination (Will be overwritten)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && dryRunResult && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-emerald-900/10 border border-emerald-900/30 rounded-xl">
                        <div className="text-2xl font-bold text-emerald-500">
                          {dryRunResult.stats.flagsCreated}
                        </div>
                        <div className="text-xs text-emerald-700 font-semibold uppercase">
                          Created
                        </div>
                      </div>
                      <div className="p-4 bg-blue-900/10 border border-blue-900/30 rounded-xl">
                        <div className="text-2xl font-bold text-blue-500">
                          {dryRunResult.stats.flagsUpdated}
                        </div>
                        <div className="text-xs text-blue-700 font-semibold uppercase">
                          Updated
                        </div>
                      </div>
                      <div className="p-4 bg-neutral-800/30 border border-neutral-800 rounded-xl">
                        <div className="text-2xl font-bold text-neutral-400">
                          {dryRunResult.stats.flagsSkipped}
                        </div>
                        <div className="text-xs text-neutral-500 font-semibold uppercase">
                          Skipped
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Changes Preview
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {dryRunResult.changes.map((change, i) => (
                          <div
                            key={i}
                            className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex items-start justify-between"
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <span
                                  className={clsx(
                                    "text-xs font-bold px-2 py-0.5 rounded uppercase",
                                    {
                                      "bg-emerald-500/10 text-emerald-500":
                                        change.action === "CREATE",
                                      "bg-blue-500/10 text-blue-500":
                                        change.action === "UPDATE",
                                      "bg-neutral-800 text-neutral-500":
                                        change.action === "SKIP",
                                    },
                                  )}
                                >
                                  {change.action}
                                </span>
                                <code className="text-sm text-neutral-300 font-mono">
                                  {change.featureKey}
                                </code>
                              </div>
                              {change.diff && change.diff.length > 0 && (
                                <div className="mt-2 space-y-1 pl-2 border-l-2 border-neutral-800">
                                  {change.diff.map((d, k) => (
                                    <div
                                      key={k}
                                      className="text-xs text-neutral-500 flex items-center space-x-2"
                                    >
                                      <span className="font-mono text-neutral-400">
                                        {d.field}
                                      </span>
                                      :
                                      <span className="line-through opacity-50">
                                        {JSON.stringify(d.oldValue)}
                                      </span>
                                      <ArrowRight className="h-3 w-3" />
                                      <span className="text-white">
                                        {JSON.stringify(d.newValue)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {dryRunResult.changes.length === 0 && (
                          <div className="text-center py-8 text-neutral-500">
                            No changes detected. Environments are identical.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center text-red-400 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {error}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-neutral-800 bg-neutral-900/50 flex justify-between">
                {step === 2 ? (
                  <button
                    onClick={() => setStep(1)}
                    className="text-neutral-400 hover:text-white text-sm font-medium"
                  >
                    Back to Settings
                  </button>
                ) : (
                  <div />
                )}

                {step === 1 ? (
                  <button
                    onClick={handleDryRun}
                    disabled={loading || sourceEnv === targetEnv}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-blue-900/20 flex items-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <span>Preview Changes</span>
                  </button>
                ) : (
                  <button
                    onClick={handlePromote}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-emerald-900/20 flex items-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                    <span>Confirm Promotion</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
