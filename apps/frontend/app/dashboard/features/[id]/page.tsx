"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  FeaturesApi,
  FlagsApi,
  Feature,
  FeatureFlag,
  Environment,
} from "@/lib/api";
import { ArrowLeft, Loader2, GitMerge, LayoutDashboard } from "lucide-react";
import { FlagCard } from "@/components/FlagCard";
import { PromotionModal } from "@/components/PromotionModal";
import Link from "next/link";

export default function FeatureDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [feature, setFeature] = useState<Feature | null>(null);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPromotionOpen, setIsPromotionOpen] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [featureData, flagsData] = await Promise.all([
        FeaturesApi.get(id),
        FlagsApi.list(id),
      ]);
      setFeature(featureData);
      setFlags(flagsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Refetch flags without full loading state
  const refreshFlags = async () => {
    if (!id) return;
    try {
      const flagsData = await FlagsApi.list(id);
      setFlags(flagsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const getFlagForEnv = (env: Environment) => flags.find((f) => f.env === env);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-bold text-white">Feature not found</h3>
        <Link
          href="/dashboard"
          className="text-blue-500 hover:underline mt-2 inline-block"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-neutral-800 pb-6">
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="flex items-center text-neutral-400 hover:text-white transition-colors text-sm group"
          >
            <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Features
          </Link>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {feature.name}
              </h1>
              <code className="text-xs bg-neutral-900 border border-neutral-800 px-2 py-1 rounded-lg text-neutral-400 font-mono">
                {feature.key}
              </code>
            </div>
            <p className="text-neutral-400 max-w-2xl">
              {feature.description || "No description provided."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPromotionOpen(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 transition-all active:scale-95"
          >
            <GitMerge className="h-5 w-5" />
            <span>Promote Feature</span>
          </button>
        </div>
      </div>

      {/* Environments Grid */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center">
          <LayoutDashboard className="h-5 w-5 mr-2 text-blue-500" />
          Environments
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FlagCard
            env={Environment.DEV}
            featureId={feature.id}
            flag={getFlagForEnv(Environment.DEV)}
            onUpdate={refreshFlags}
          />
          <FlagCard
            env={Environment.STAGING}
            featureId={feature.id}
            flag={getFlagForEnv(Environment.STAGING)}
            onUpdate={refreshFlags}
          />
          <FlagCard
            env={Environment.PROD}
            featureId={feature.id}
            flag={getFlagForEnv(Environment.PROD)}
            onUpdate={refreshFlags}
          />
        </div>
      </div>

      <PromotionModal
        isOpen={isPromotionOpen}
        onClose={() => setIsPromotionOpen(false)}
        featureKey={feature.key}
        onSuccess={refreshFlags}
      />
    </div>
  );
}
