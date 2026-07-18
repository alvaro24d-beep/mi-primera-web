"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

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
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTl = useRef<gsap.core.Timeline | null>(null);
  const reducedMotion = useReducedMotion();

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
      if (e.key === "Escape") {
        setSrvOpen(false);
        setHamburgerOpen(false);
      }
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

  // Staggered-menu timeline (React Bits StaggeredMenu pattern, adapted):
  // two brand-color prelayers sweep in from the right, the dark glass panel
  // follows, then the big links reveal through an overflow mask with
  // stagger + slight rotation, and the services/CTA cascade after. Built
  // once, paused; open plays it, close reverses it slightly faster. The
  // root's visibility/pointer-events live INSIDE the timeline (a `set` at
  // t=0 reverts when the reverse playhead crosses it), so CSS only needs
  // the resting hidden state.
  useEffect(() => {
    if (reducedMotion) return;
    const root = menuRef.current;
    if (!root) return;
    const q = gsap.utils.selector(root);
    const tl = gsap.timeline({ paused: true, defaults: { ease: "power4.out" } });
    tl.set(root, { visibility: "visible", pointerEvents: "all" }, 0)
      .fromTo(q(".nxr-mm-layer-a"), { xPercent: 100 }, { xPercent: 0, duration: 0.5 }, 0)
      .fromTo(q(".nxr-mm-layer-b"), { xPercent: 100 }, { xPercent: 0, duration: 0.5 }, 0.07)
      .fromTo(q(".nxr-mm-panel"), { xPercent: 100 }, { xPercent: 0, duration: 0.6 }, 0.14)
      .fromTo(
        q(".nxr-mm-link"),
        { yPercent: 130, rotate: 5 },
        { yPercent: 0, rotate: 0, duration: 0.7, stagger: 0.08 },
        0.3
      )
      .fromTo(q(".nxr-mm-sep, .nxr-mm-srv-label"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.55)
      .fromTo(q(".nxr-mm-srv-item"), { x: 28, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, stagger: 0.05 }, 0.58)
      .fromTo(q(".nxr-mm-cta"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, 0.72);
    menuTl.current = tl;
    return () => {
      tl.kill();
      menuTl.current = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    document.body.style.overflow = hamburgerOpen ? "hidden" : "";
    const root = menuRef.current;
    if (!root) return;
    if (reducedMotion) {
      // Static branch: show/hide instantly, children at natural positions.
      gsap.set(root, {
        visibility: hamburgerOpen ? "visible" : "hidden",
        pointerEvents: hamburgerOpen ? "all" : "none",
      });
      return;
    }
    const tl = menuTl.current;
    if (!tl) return;
    if (hamburgerOpen) tl.timeScale(1).play();
    else tl.timeScale(1.35).reverse();
  }, [hamburgerOpen, reducedMotion]);

  const openDD = () => setSrvOpen(true);
  const closeDD = () => setSrvOpen(false);

  return (
    <>
      <div id="nxr-bg-blur" className={srvOpen ? "nxr-open" : ""} />
      <div id="nxr-srv-overlay" className={srvOpen ? "nxr-open" : ""} onClick={closeDD} />

      <header id="nxr-header" className={navHidden ? "nxr-hidden" : ""}>
        <Link href="/" className="nxr-header-logo">
          Nexora<span>.</span>
        </Link>
        <nav className="nxr-header-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nxr-header-link">
              {l.label}
            </Link>
          ))}
          <Link href="/contacto" className="nxr-header-cta nxr-glass-edge">
            <span className="nxr-glass-edge-content">Hablemos</span>
          </Link>
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

      <div id="nxr-mobile-menu" ref={menuRef} aria-hidden={!hamburgerOpen}>
        <div className="nxr-mm-layer nxr-mm-layer-a" />
        <div className="nxr-mm-layer nxr-mm-layer-b" />
        <div className="nxr-mm-panel">
          <nav className="nxr-mm-links" aria-label="Menú móvil">
            {NAV_LINKS.map((l, i) => (
              // The overflow-hidden wrapper is the reveal MASK: the link
              // animates yPercent 130→0 inside it (StaggeredMenu's
              // signature masked rise).
              <div className="nxr-mm-item" key={l.href}>
                <Link href={l.href} className="nxr-mm-link" onClick={() => setHamburgerOpen(false)}>
                  <span className="nxr-mm-num">0{i + 1}</span>
                  {l.label}
                </Link>
              </div>
            ))}
          </nav>
          <div className="nxr-mm-sep" />
          <div className="nxr-mm-srv-label">Servicios</div>
          <div className="nxr-mm-srv">
            {SERVICIOS.map((s) => (
              <Link key={s.href} href={s.href} className="nxr-mm-srv-item" onClick={() => setHamburgerOpen(false)}>
                <span className="nxr-mm-srv-ico" style={{ color: s.color }}>
                  {s.icon}
                </span>
                {s.title}
              </Link>
            ))}
          </div>
          <Link href="/contacto" className="nxr-mm-cta" onClick={() => setHamburgerOpen(false)}>
            Hablemos
            <svg viewBox="0 0 24 24">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </Link>
        </div>
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
          <Link
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
          </Link>
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
          <Link href="/nosotros" className={`nxr-nav-link${isActive("/nosotros") ? " active" : ""}`}>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            <span>Nosotros</span>
          </Link>
          <Link href="/casos" className={`nxr-nav-link${isActive("/casos") ? " active" : ""}`}>
            <svg viewBox="0 0 24 24">
              <path d="M3 17l4-8 4 5 3-3 4 6" />
            </svg>
            <span>Casos</span>
          </Link>
          {/* aria-label for the same reason as the home link: the text span
              hides in the icon-only mobile pill. */}
          <Link href="/contacto" className="nxr-nav-cta nxr-glass-edge" aria-label="Hablemos">
            <svg className="nxr-glass-edge-content" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span className="nxr-glass-edge-content">Hablemos</span>
          </Link>
        </div>

        <div id="nxr-nav-sep" className={srvOpen ? "nxr-open" : ""}></div>

        <div id="nxr-nav-services" className={srvOpen ? "nxr-open" : ""}>
          {SERVICIOS.map((s) => (
            <Link key={s.href} href={s.href} className="nxr-nav-srv-item" onClick={closeDD}>
              <div className="nxr-nav-srv-icon" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div>
                <div className="nxr-nav-srv-title">{s.title}</div>
                <div className="nxr-nav-srv-desc">{s.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
