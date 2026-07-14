"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/casos", label: "Casos" },
];

const SERVICIOS = [
  {
    href: "/desarrollo-web",
    title: "Desarrollo web",
    desc: "Webs que convierten",
    bg: "rgba(239,61,13,.15)",
    color: "var(--c-red)",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    href: "/agentes-ia",
    title: "Agentes IA",
    desc: "Automatiza con inteligencia",
    bg: "rgba(168,240,74,.12)",
    color: "var(--c-lime)",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M16.9 16.9l1.5 1.5M5.6 18.4l1.4-1.4M16.9 7.1l1.5-1.5" />
      </svg>
    ),
  },
  {
    href: "/automatizaciones",
    title: "Automatizaciones",
    desc: "Flujos sin intervención humana",
    bg: "rgba(255,157,125,.12)",
    color: "var(--c-salmon)",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 3L3 8.5v7L12 21l9-5.5v-7L12 3z" />
        <path d="M12 12l9-3.5M12 12L3 8.5M12 12v9" />
      </svg>
    ),
  },
  {
    href: "/seo",
    title: "SEO",
    desc: "Visibilidad real en Google",
    bg: "rgba(168,240,74,.12)",
    color: "var(--c-lime)",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="M16.5 16.5L21 21" />
        <path d="M11 8v6M8 11h6" />
      </svg>
    ),
  },
  {
    href: "/apps-software",
    title: "Apps & Software",
    desc: "Soluciones a medida",
    bg: "rgba(239,61,13,.15)",
    color: "var(--c-red)",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
];

export default function Header() {
  const pathname = usePathname();
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [navVisible, setNavVisible] = useState(false);
  const [srvOpen, setSrvOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const isDesktopRef = useRef(true);

  const normalize = (p: string) => p.replace(/\/$/, "") || "/";
  const isActive = (href: string) => normalize(href) === normalize(pathname || "/");

  useEffect(() => {
    isDesktopRef.current = window.innerWidth > 768;
    const onResize = () => {
      isDesktopRef.current = window.innerWidth > 768;
    };

    let ticking = false;
    const THRESHOLD = 80;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setNavHidden(y > THRESHOLD);
        // On the home page the floating bottom nav waits for the Intro
        // section to enter the viewport (the hero stays chrome-free);
        // everywhere else it appears after the usual small scroll. Measured
        // live each tick because pinned sections above can shift the
        // intro's document offset.
        const intro = document.getElementById("nxr-intro");
        if (intro) {
          setNavVisible(intro.getBoundingClientRect().top <= window.innerHeight * 0.7);
        } else {
          setNavVisible(y > THRESHOLD);
        }
        ticking = false;
      });
    };

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSrvOpen(false);
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKeydown);
    onScroll();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKeydown);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = hamburgerOpen ? "hidden" : "";
  }, [hamburgerOpen]);

  const openDD = () => setSrvOpen(true);
  const closeDD = () => setSrvOpen(false);

  return (
    <>
      <div id="nxr-bg-blur" className={srvOpen ? "nxr-open" : ""} />
      <div id="nxr-srv-overlay" className={srvOpen ? "nxr-open" : ""} onClick={closeDD} />

      <header id="nxr-header" className={navHidden ? "nxr-hidden" : ""}>
        <a href="/" className="nxr-header-logo">
          Nexora<span>.</span>
        </a>
        <nav className="nxr-header-links">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nxr-header-link">
              {l.label}
            </a>
          ))}
          <a href="/contacto" className="nxr-header-cta nxr-glass-edge">
            <span className="nxr-glass-edge-content">Hablemos</span>
          </a>
        </nav>
        <button
          className={`nxr-hamburger${hamburgerOpen ? " open" : ""}`}
          aria-label="Abrir menú"
          onClick={() => setHamburgerOpen((o) => !o)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      <div id="nxr-mobile-menu" className={hamburgerOpen ? "open" : ""}>
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} className="nxr-mobile-link">
            {l.label}
          </a>
        ))}
        <a href="/contacto" className="nxr-mobile-cta">
          Hablemos
        </a>
      </div>

      <nav
        id="nxr-nav"
        ref={navRef}
        role="navigation"
        aria-label="Menú principal"
        className={`nxr-glass-edge${navVisible ? " nxr-visible" : ""}`}
        onMouseLeave={() => {
          if (isDesktopRef.current) closeDD();
        }}
      >
        <div id="nxr-nav-row">
          <a
            href="/"
            className={`nxr-nav-link nxr-nav-home nxr-glass-edge${isActive("/") ? " active" : ""}`}
            // The inner "Inicio" span is display:none in the mobile pill
            // (icon-only), which axe flags as a link without discernible
            // text — the label keeps the name programmatically available.
            aria-label="Inicio"
          >
            <svg className="nxr-glass-edge-content" viewBox="0 0 24 24">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path d="M9 21V12h6v9" />
            </svg>
            <span className="nxr-glass-edge-content">Inicio</span>
          </a>
          <button
            className="nxr-nav-link"
            id="nxr-srv-btn"
            aria-expanded={srvOpen}
            aria-haspopup="true"
            onMouseEnter={() => {
              if (isDesktopRef.current) openDD();
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSrvOpen((o) => !o);
            }}
          >
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="8" height="8" rx="1.5" />
              <rect x="13" y="3" width="8" height="8" rx="1.5" />
              <rect x="3" y="13" width="8" height="8" rx="1.5" />
              <rect x="13" y="13" width="8" height="8" rx="1.5" />
            </svg>
            <span>Servicios</span>
            <svg className={`nxr-srv-chevron${srvOpen ? " nxr-open" : ""}`} viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <a href="/nosotros" className={`nxr-nav-link${isActive("/nosotros") ? " active" : ""}`}>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            <span>Nosotros</span>
          </a>
          <a href="/casos" className={`nxr-nav-link${isActive("/casos") ? " active" : ""}`}>
            <svg viewBox="0 0 24 24">
              <path d="M3 17l4-8 4 5 3-3 4 6" />
            </svg>
            <span>Casos</span>
          </a>
          {/* aria-label for the same reason as the home link: the text span
              hides in the icon-only mobile pill. */}
          <a href="/contacto" className="nxr-nav-cta nxr-glass-edge" aria-label="Hablemos">
            <svg className="nxr-glass-edge-content" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span className="nxr-glass-edge-content">Hablemos</span>
          </a>
        </div>

        <div id="nxr-nav-sep" className={srvOpen ? "nxr-open" : ""}></div>

        <div id="nxr-nav-services" className={srvOpen ? "nxr-open" : ""}>
          {SERVICIOS.map((s) => (
            <a key={s.href} href={s.href} className="nxr-nav-srv-item">
              <div className="nxr-nav-srv-icon" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div>
                <div className="nxr-nav-srv-title">{s.title}</div>
                <div className="nxr-nav-srv-desc">{s.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}
