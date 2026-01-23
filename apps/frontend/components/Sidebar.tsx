"use client";

import { motion } from "framer-motion";
import {
  Terminal,
  Layers,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const items = [
    { name: "Features", icon: Layers, href: "/dashboard" },
    { name: "Audit Logs", icon: Activity, href: "/dashboard/audit-logs" },
    { name: "Metrics", icon: BarChart3, href: "/dashboard/metrics" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    router.push("/");
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 80 : 250 }}
      className="border-r border-neutral-800 bg-neutral-950/50 backdrop-blur-xl h-screen sticky top-0 flex flex-col z-40"
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-800">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2"
          >
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <Terminal className="text-white h-5 w-5" />
            </div>
            <span className="font-bold text-white tracking-tight whitespace-nowrap">
              Admin
            </span>
          </motion.div>
        )}
        {collapsed && (
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 mx-auto shadow-lg shadow-blue-500/20">
            <Terminal className="text-white h-5 w-5" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            "p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 transition-colors",
            collapsed &&
              "absolute -right-3 top-6 bg-neutral-900 border border-neutral-800 text-white z-50",
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-6 px-3 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-blue-600/10 text-blue-500"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900",
              )}
            >
              <item.icon
                className={clsx(
                  "h-5 w-5 shrink-0",
                  isActive && "text-blue-500",
                )}
              />
              {!collapsed && (
                <span
                  className={clsx("font-medium", isActive && "text-blue-500")}
                >
                  {item.name}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                />
              )}
              {collapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-neutral-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-800">
        <button
          onClick={handleLogout}
          className={clsx(
            "flex items-center space-x-3 w-full px-3 py-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-xl transition-all",
            collapsed && "justify-center",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </motion.div>
  );
}
