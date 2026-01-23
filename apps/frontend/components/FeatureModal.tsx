"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save } from "lucide-react";
import { FeaturesApi } from "@/lib/api";

interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FeatureModal({
  isOpen,
  onClose,
  onSuccess,
}: FeatureModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    key: "",
    name: "",
    description: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await FeaturesApi.create(formData);
      onSuccess();
      onClose();
      setFormData({ key: "", name: "", description: "" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create feature");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-neutral-800 bg-neutral-900/50">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Create Feature
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">
                    Feature Key
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. dark_mode"
                    value={formData.key}
                    onChange={(e) =>
                      setFormData({ ...formData, key: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 px-4 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Unique identifier used in code.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dark Mode"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 px-4 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe what this feature does..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3 px-4 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
                    <p className="text-red-400 text-sm flex items-center">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2" />
                      {error}
                    </p>
                  </div>
                )}

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-neutral-400 hover:text-white font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-blue-900/20 flex items-center space-x-2 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>Create Feature</span>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
