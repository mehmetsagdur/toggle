"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Save,
  Plus,
  Trash2,
  Percent,
  Users,
  ToggleLeft,
} from "lucide-react";
import { StrategyType, FlagsApi, FeatureFlag } from "@/lib/api";
import clsx from "clsx";

interface PercentageConfig {
  percentage: number;
}

interface UserTargetingRule {
  attribute: string;
  operator: "in" | "not_in" | "eq" | "contains";
  values: string[];
}

interface UserTargetingConfig {
  rules: UserTargetingRule[];
  defaultValue: boolean;
}

interface StrategyEditorProps {
  isOpen: boolean;
  onClose: () => void;
  flag: FeatureFlag;
  featureId: string;
  onSuccess: () => void;
}

export function StrategyEditor({
  isOpen,
  onClose,
  flag,
  featureId,
  onSuccess,
}: StrategyEditorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Strategy state
  const [strategyType, setStrategyType] = useState<StrategyType>(
    flag.strategyType,
  );
  const [percentage, setPercentage] = useState<number>(
    (flag.strategyConfig as PercentageConfig)?.percentage ?? 50,
  );
  const [rules, setRules] = useState<UserTargetingRule[]>(
    (flag.strategyConfig as UserTargetingConfig)?.rules ?? [],
  );
  const [defaultValue, setDefaultValue] = useState<boolean>(
    (flag.strategyConfig as UserTargetingConfig)?.defaultValue ?? false,
  );

  // Reset state when flag changes
  useEffect(() => {
    setStrategyType(flag.strategyType);
    setPercentage((flag.strategyConfig as PercentageConfig)?.percentage ?? 50);
    setRules((flag.strategyConfig as UserTargetingConfig)?.rules ?? []);
    setDefaultValue(
      (flag.strategyConfig as UserTargetingConfig)?.defaultValue ?? false,
    );
  }, [flag]);

  const handleSave = async () => {
    setLoading(true);
    setError("");

    try {
      let strategyConfig: any = {};

      if (strategyType === StrategyType.PERCENTAGE) {
        strategyConfig = { percentage };
      } else if (strategyType === StrategyType.USER_TARGETING) {
        strategyConfig = { rules, defaultValue };
      }

      await FlagsApi.update(featureId, flag.env, {
        strategyType,
        strategyConfig,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update strategy");
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    setRules([...rules, { attribute: "userId", operator: "in", values: [] }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (
    index: number,
    field: keyof UserTargetingRule,
    value: any,
  ) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const strategyIcons = {
    [StrategyType.BOOLEAN]: ToggleLeft,
    [StrategyType.PERCENTAGE]: Percent,
    [StrategyType.USER_TARGETING]: Users,
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
            <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-neutral-800">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Edit Strategy
                  </h2>
                  <p className="text-sm text-neutral-400">
                    Configure evaluation strategy for {flag.env}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Strategy Type Selector */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Strategy Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.values(StrategyType).map((type) => {
                      const Icon = strategyIcons[type];
                      return (
                        <button
                          key={type}
                          onClick={() => setStrategyType(type)}
                          className={clsx(
                            "p-4 rounded-xl border transition-all flex flex-col items-center space-y-2",
                            strategyType === type
                              ? "bg-blue-600/10 border-blue-500 text-blue-500"
                              : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs font-medium">
                            {type.replace("_", " ")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Percentage Config */}
                {strategyType === StrategyType.PERCENTAGE && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Rollout Percentage
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={percentage}
                        onChange={(e) => setPercentage(Number(e.target.value))}
                        className="flex-1 h-2 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={percentage}
                          onChange={(e) =>
                            setPercentage(
                              Math.min(
                                100,
                                Math.max(0, Number(e.target.value)),
                              ),
                            )
                          }
                          className="w-12 bg-transparent text-white text-center font-mono focus:outline-none"
                        />
                        <span className="text-neutral-500">%</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>0% (No users)</span>
                      <span>100% (All users)</span>
                    </div>
                  </motion.div>
                )}

                {/* User Targeting Config */}
                {strategyType === StrategyType.USER_TARGETING && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Targeting Rules
                      </label>
                      <button
                        onClick={addRule}
                        className="flex items-center space-x-1 text-xs text-blue-500 hover:text-blue-400 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Rule</span>
                      </button>
                    </div>

                    {rules.length === 0 ? (
                      <div className="text-center py-8 bg-neutral-950 border border-dashed border-neutral-800 rounded-xl">
                        <Users className="h-8 w-8 text-neutral-700 mx-auto mb-2" />
                        <p className="text-sm text-neutral-500">
                          No rules defined. Add a rule to target specific users.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rules.map((rule, index) => (
                          <div
                            key={index}
                            className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-neutral-500 font-medium">
                                Rule {index + 1}
                              </span>
                              <button
                                onClick={() => removeRule(index)}
                                className="text-red-500 hover:text-red-400 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <input
                                type="text"
                                value={rule.attribute}
                                onChange={(e) =>
                                  updateRule(index, "attribute", e.target.value)
                                }
                                placeholder="Attribute"
                                className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500"
                              />
                              <select
                                value={rule.operator}
                                onChange={(e) =>
                                  updateRule(index, "operator", e.target.value)
                                }
                                className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                              >
                                <option value="in">in</option>
                                <option value="not_in">not in</option>
                                <option value="eq">equals</option>
                                <option value="contains">contains</option>
                              </select>
                              <input
                                type="text"
                                value={rule.values.join(",")}
                                onChange={(e) =>
                                  updateRule(
                                    index,
                                    "values",
                                    e.target.value
                                      .split(",")
                                      .map((v) => v.trim()),
                                  )
                                }
                                placeholder="value1, value2"
                                className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Default Value Toggle */}
                    <div className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                      <div>
                        <span className="text-sm font-medium text-white">
                          Default Value
                        </span>
                        <p className="text-xs text-neutral-500">
                          When no rules match
                        </p>
                      </div>
                      <button
                        onClick={() => setDefaultValue(!defaultValue)}
                        className={clsx(
                          "w-12 h-6 rounded-full transition-colors relative",
                          defaultValue ? "bg-emerald-600" : "bg-neutral-700",
                        )}
                      >
                        <div
                          className={clsx(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                            defaultValue ? "left-7" : "left-1",
                          )}
                        />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Boolean Info */}
                {strategyType === StrategyType.BOOLEAN && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-center"
                  >
                    <ToggleLeft className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
                    <p className="text-sm text-neutral-400">
                      Boolean strategy has no additional configuration.
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      The flag will be enabled or disabled for all users.
                    </p>
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-neutral-800 flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-blue-900/20 flex items-center space-x-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Save Strategy</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
