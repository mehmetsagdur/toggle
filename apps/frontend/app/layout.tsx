import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Feature Flag Admin",
  description: "Premium Feature Flag Management System",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-200 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
