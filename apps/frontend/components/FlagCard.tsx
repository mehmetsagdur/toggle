"use client";

import { FeatureFlag, Environment, FlagsApi, StrategyType } from "@/lib/api";
import { useState } from "react";
import { ToggleLeft, ToggleRight, Loader2, Pencil } from "lucide-react";
import clsx from "clsx";
import { StrategyEditor } from "./StrategyEditor";

interface FlagCardProps {
  env: Environment;
  flag?: FeatureFlag;
  featureId: string;
  onUpdate: () => void;
}

export function FlagCard({ env, flag, featureId, onUpdate }: FlagCardProps) {
  const [loading, setLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (flag) {
        // Update existing
        await FlagsApi.update(featureId, env, { enabled: !flag.enabled });
      } else {
        // Create new default
        await FlagsApi.create(featureId, {
          env,
          enabled: true,
          strategyType: StrategyType.BOOLEAN,
          strategyConfig: {},
        });
      }
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isEnabled = flag?.enabled ?? false;

  const getStrategyLabel = (type: StrategyType) => {
    switch (type) {
      case StrategyType.BOOLEAN:
        return "Boolean";
      case StrategyType.PERCENTAGE:
        return `Percentage (${(flag?.strategyConfig as any)?.percentage ?? 0}%)`;
      case StrategyType.USER_TARGETING:
        const rules = (flag?.strategyConfig as any)?.rules?.length ?? 0;
        return `Targeting (${rules} rule${rules !== 1 ? "s" : ""})`;
      default:
        return "None";
    }
  };

  return (
    <>
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden group hover:border-neutral-700 transition-colors">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{env}</h3>
            <div
              className={clsx(
                "text-xs font-mono px-2 py-0.5 rounded-full inline-block border",
                isEnabled
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-neutral-800 text-neutral-500 border-neutral-700",
              )}
            >
              {isEnabled ? "ENABLED" : "DISABLED"}
            </div>
          </div>

          <button
            onClick={handleToggle}
            disabled={loading}
            className={clsx(
              "transition-colors",
              isEnabled
                ? "text-emerald-500 hover:text-emerald-400"
                : "text-neutral-600 hover:text-neutral-500",
            )}
          >
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : isEnabled ? (
              <ToggleRight className="h-8 w-8" />
            ) : (
              <ToggleLeft className="h-8 w-8" />
            )}
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Strategy</span>
            <span className="text-white font-medium">
              {flag ? getStrategyLabel(flag.strategyType) : "NONE"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Version</span>
            <span className="font-mono text-neutral-400">
              v{flag?.version || 0}
            </span>
          </div>
        </div>

        {flag && (
          <div className="mt-6 pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-500 uppercase">
                Config
              </span>
              <button
                onClick={() => setIsEditorOpen(true)}
                className="flex items-center space-x-1 text-xs text-blue-500 hover:text-blue-400 transition-colors"
              >
                <Pencil className="h-3 w-3" />
                <span>Edit Strategy</span>
              </button>
            </div>
            <pre className="bg-neutral-950 p-3 rounded-lg text-[10px] text-neutral-400 font-mono overflow-x-auto">
              {JSON.stringify(flag.strategyConfig, null, 2)}
            </pre>
          </div>
        )}

        {!flag && (
          <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
            <p className="text-xs text-neutral-600 italic">
              Not configured for {env}
            </p>
          </div>
        )}

        {/* Environment Color Strip */}
        <div
          className={clsx(
            "absolute top-0 left-0 w-full h-1",
            env === "DEV"
              ? "bg-blue-500"
              : env === "STAGING"
                ? "bg-orange-500"
                : "bg-emerald-500",
          )}
        />
      </div>

      {/* Strategy Editor Modal */}
      {flag && (
        <StrategyEditor
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          flag={flag}
          featureId={featureId}
          onSuccess={onUpdate}
        />
      )}
    </>
  );
}
