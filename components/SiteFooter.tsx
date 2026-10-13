"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";

/**
 * Global footer shown on every page except the landing page (which has its own
 * styled footer) and the editor (a full-screen workspace).
 */
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/editor")) return null;
  return <Footer />;
}
