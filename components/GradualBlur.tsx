"use client";

import { useEffect, useMemo, useRef, useState, memo, type CSSProperties, type ReactNode } from "react";

type BlurPosition = "top" | "bottom" | "left" | "right";
type BlurCurve = "linear" | "bezier" | "ease-in" | "ease-out" | "ease-in-out";
type BlurTarget = "parent" | "page";

interface GradualBlurConfig {
  position?: BlurPosition;
  strength?: number;
  height?: string;
  width?: string;
  mobileHeight?: string;
  tabletHeight?: string;
  desktopHeight?: string;
  mobileWidth?: string;
  tabletWidth?: string;
  desktopWidth?: string;
  divCount?: number;
  exponential?: boolean;
  zIndex?: number;
  animated?: boolean | "scroll";
  duration?: string;
  easing?: string;
  opacity?: number;
  curve?: BlurCurve;
  responsive?: boolean;
  target?: BlurTarget;
  className?: string;
  style?: CSSProperties;
  hoverIntensity?: number;
  onAnimationComplete?: () => void;
  preset?: string;
}

const DEFAULT_CONFIG: GradualBlurConfig = {
  position: "bottom",
  strength: 2,
  height: "6rem",
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false,
  duration: "0.3s",
  easing: "ease-out",
  opacity: 1,
  curve: "linear",
  responsive: false,
  target: "parent",
  className: "",
  style: {},
};

// Layered, progressively-blurred bands (see GradualBlur below) — a graduated
// fade so fixed chrome (header, floating nav) doesn't clip scrolling content
// abruptly. Presets are just named starting points; any field can still be
// overridden via props.
const PRESETS: Record<string, GradualBlurConfig> = {
  top: { position: "top", height: "6rem" },
  bottom: { position: "bottom", height: "6rem" },
  left: { position: "left", height: "6rem" },
  right: { position: "right", height: "6rem" },
  subtle: { height: "4rem", strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: "10rem", strength: 4, divCount: 8, exponential: true },
  smooth: { height: "8rem", curve: "bezier", divCount: 10 },
  sharp: { height: "5rem", curve: "linear", divCount: 4 },
  header: { position: "top", height: "8rem", curve: "ease-out" },
  footer: { position: "bottom", height: "8rem", curve: "ease-out" },
  sidebar: { position: "left", height: "6rem", strength: 2.5 },
  "page-header": { position: "top", height: "10rem", target: "page", strength: 3 },
  "page-footer": { position: "bottom", height: "10rem", target: "page", strength: 3 },
};

const CURVE_FUNCTIONS: Record<BlurCurve, (p: number) => number> = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  "ease-in": (p) => p * p,
  "ease-out": (p) => 1 - Math.pow(1 - p, 2),
  "ease-in-out": (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

const mergeConfigs = (...configs: GradualBlurConfig[]): GradualBlurConfig =>
  configs.reduce((acc, c) => ({ ...acc, ...c }), {} as GradualBlurConfig);

const getGradientDirection = (position: BlurPosition): string => {
  const directions: Record<BlurPosition, string> = {
    top: "to top",
    bottom: "to bottom",
    left: "to left",
    right: "to right",
  };
  return directions[position] || "to bottom";
};

function debounce<A extends unknown[]>(fn: (...args: A) => void, wait: number) {
  let t: ReturnType<typeof setTimeout>;
  return (...a: A) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), wait);
  };
}

function useResponsiveDimension(
  responsive: boolean,
  base: string | undefined,
  mobile: string | undefined,
  tablet: string | undefined,
  desktop: string | undefined
): string | undefined {
  const [val, setVal] = useState(base);
  useEffect(() => {
    if (!responsive) return;
    const calc = () => {
      const w = window.innerWidth;
      let v = base;
      if (w <= 480 && mobile) v = mobile;
      else if (w <= 768 && tablet) v = tablet;
      else if (w <= 1024 && desktop) v = desktop;
      setVal(v);
    };
    const deb = debounce(calc, 100);
    calc();
    window.addEventListener("resize", deb);
    return () => window.removeEventListener("resize", deb);
  }, [responsive, base, mobile, tablet, desktop]);
  return responsive ? val : base;
}

function useIntersectionObserver(ref: React.RefObject<HTMLElement | null>, shouldObserve = false): boolean {
  const [isVisible, setIsVisible] = useState(!shouldObserve);

  useEffect(() => {
    if (!shouldObserve || !ref.current) return;

    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.1 });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, shouldObserve]);

  return isVisible;
}

function GradualBlur(props: GradualBlurConfig) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const config = useMemo<GradualBlurConfig>(() => {
    const presetConfig = props.preset && PRESETS[props.preset] ? PRESETS[props.preset] : {};
    return mergeConfigs(DEFAULT_CONFIG, presetConfig, props);
  }, [props]);

  const responsiveHeight = useResponsiveDimension(
    config.responsive ?? false,
    config.height,
    config.mobileHeight,
    config.tabletHeight,
    config.desktopHeight
  );
  const responsiveWidth = useResponsiveDimension(
    config.responsive ?? false,
    config.width,
    config.mobileWidth,
    config.tabletWidth,
    config.desktopWidth
  );
  const isVisible = useIntersectionObserver(containerRef, config.animated === "scroll");

  const blurDivs = useMemo(() => {
    const divs: ReactNode[] = [];
    const divCount = config.divCount ?? 5;
    const strength = config.strength ?? 2;
    const increment = 100 / divCount;
    const currentStrength = isHovered && config.hoverIntensity ? strength * config.hoverIntensity : strength;
    const curveFunc = CURVE_FUNCTIONS[config.curve ?? "linear"] || CURVE_FUNCTIONS.linear;

    for (let i = 1; i <= divCount; i++) {
      const progress = curveFunc(i / divCount);

      let blurValue: number;
      if (config.exponential) {
        blurValue = Math.pow(2, progress * 4) * 0.0625 * currentStrength;
      } else {
        blurValue = 0.0625 * (progress * divCount + 1) * currentStrength;
      }
      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;
      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const direction = getGradientDirection(config.position ?? "bottom");

      const divStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        maskImage: `linear-gradient(${direction}, ${gradient})`,
        WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
        backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        opacity: config.opacity,
        transition:
          config.animated && config.animated !== "scroll" ? `backdrop-filter ${config.duration} ${config.easing}` : undefined,
      };

      divs.push(<div key={i} style={divStyle} />);
    }

    return divs;
  }, [config, isHovered]);

  const containerStyle = useMemo<CSSProperties>(() => {
    const position = config.position ?? "bottom";
    const isVertical = position === "top" || position === "bottom";
    const isHorizontal = position === "left" || position === "right";
    const isPageTarget = config.target === "page";

    const baseStyle: CSSProperties = {
      position: isPageTarget ? "fixed" : "absolute",
      pointerEvents: config.hoverIntensity ? "auto" : "none",
      opacity: isVisible ? 1 : 0,
      transition: config.animated ? `opacity ${config.duration} ${config.easing}` : undefined,
      zIndex: isPageTarget ? (config.zIndex ?? 1000) + 100 : config.zIndex,
      ...config.style,
    };

    if (isVertical) {
      baseStyle.height = responsiveHeight;
      baseStyle.width = responsiveWidth || "100%";
      baseStyle[position] = 0;
      baseStyle.left = 0;
      baseStyle.right = 0;
    } else if (isHorizontal) {
      baseStyle.width = responsiveWidth || responsiveHeight;
      baseStyle.height = "100%";
      baseStyle[position] = 0;
      baseStyle.top = 0;
      baseStyle.bottom = 0;
    }

    return baseStyle;
  }, [config, responsiveHeight, responsiveWidth, isVisible]);

  const { hoverIntensity, animated, onAnimationComplete, duration } = config;
  useEffect(() => {
    if (isVisible && animated === "scroll" && onAnimationComplete) {
      const t = setTimeout(() => onAnimationComplete(), parseFloat(duration ?? "0.3s") * 1000);
      return () => clearTimeout(t);
    }
  }, [isVisible, animated, onAnimationComplete, duration]);

  return (
    <div
      ref={containerRef}
      className={`gradual-blur ${config.target === "page" ? "gradual-blur-page" : "gradual-blur-parent"} ${config.className ?? ""}`}
      style={containerStyle}
      onMouseEnter={hoverIntensity ? () => setIsHovered(true) : undefined}
      onMouseLeave={hoverIntensity ? () => setIsHovered(false) : undefined}
    >
      <div className="gradual-blur-inner" style={{ position: "relative", width: "100%", height: "100%" }}>
        {blurDivs}
      </div>
    </div>
  );
}

const GradualBlurMemo = memo(GradualBlur);
GradualBlurMemo.displayName = "GradualBlur";

export default GradualBlurMemo;
