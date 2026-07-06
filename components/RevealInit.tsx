"use client";

import { useEffect } from "react";

export default function RevealInit() {
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
  }, []);

  return null;
}
