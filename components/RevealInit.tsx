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

  // Acentos lima fuera de pantalla: animación PAUSADA (V17.76). El degradado
  // de .nxr-gradient-text-lime anima `background-position`, que no es una
  // propiedad componible: el navegador tiene que RE-RASTERIZAR el texto en
  // cada frame, y con background-clip: text eso es rasterizar glifos, lo más
  // caro que hay. Cada página tiene varios (hero, Intro, Proceso, Contacto…)
  // y todos animaban a la vez, todo el rato, estuvieran donde estuvieran.
  // Pausarlos fuera del viewport no cambia nada visualmente — cuando el
  // usuario llega, la animación ya está corriendo (margen de 200px) — y deja
  // como mucho uno o dos vivos en vez de la página entera.
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".nxr-gradient-text-lime");
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          (e.target as HTMLElement).style.animationPlayState = e.isIntersecting ? "" : "paused";
        }
      },
      { rootMargin: "200px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      els.forEach((el) => (el.style.animationPlayState = ""));
    };
  }, [pathname]);

  return null;
}
