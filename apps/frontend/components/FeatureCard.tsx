"use client";

import { Feature, FeaturesApi } from "@/lib/api";
import { Layers, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

interface FeatureCardProps {
  feature: Feature;
  onDeleted?: (deletedId: string) => void;
}

export function FeatureCard({ feature, onDeleted }: FeatureCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await FeaturesApi.delete(feature.id);
      // Pass the deleted ID so parent can optimistically remove it
      onDeleted?.(feature.id);
    } catch (error) {
      console.error("Failed to delete feature:", error);
      alert("Failed to delete feature. Please try again.");
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      className="group relative bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
    >
      {/* Delete Confirmation Overlay */}
      {showConfirm && (
        <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center p-4">
          <p className="text-white text-center mb-4">
            Delete{" "}
            <span className="font-bold text-red-400">{feature.name}</span>?
          </p>
          <p className="text-neutral-400 text-xs text-center mb-6">
            This will also delete all associated flags.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isDeleting ? (
                <span>Deleting...</span>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-neutral-800 rounded-xl group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
          <Layers className="h-6 w-6" />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfirm(true)}
            className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Delete feature"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 border border-neutral-800 px-2 py-0.5 rounded-full">
            v1.0
          </span>
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-blue-400 transition-colors">
        {feature.name}
      </h3>

      <p className="text-neutral-400 text-sm mb-6 line-clamp-2 h-10 leading-relaxed">
        {feature.description || "No description provided for this feature."}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-800/50">
        <code className="text-xs bg-neutral-950/50 text-neutral-400 px-2.5 py-1 rounded-lg border border-neutral-800 font-mono group-hover:border-blue-500/30 transition-colors">
          {feature.key}
        </code>

        <Link
          href={`/dashboard/features/${feature.id}`}
          className="flex items-center space-x-2 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <span>Manage</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
