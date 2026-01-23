"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-blue-500/30">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
