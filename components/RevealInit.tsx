"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function RevealInit() {
  const pathname = usePathname();
  useEffect(() => {
    const els = document.querySelectorAll(".nxr-reveal");
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("nxr-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // Re-scan on CLIENT-SIDE navigation: with next/link the layout (and this
    // component) persists across routes, so a mount-once scan would leave
    // every .nxr-reveal of the next page permanently hidden.
  }, [pathname]);

  return null;
}
