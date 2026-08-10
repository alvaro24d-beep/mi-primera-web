import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './LogoLoop.css';

// Marquesina infinita de pastillas (React Bits, adaptada). Único consumidor:
// DwhTechStack, con dos filas horizontales de nodos React.
//
// V17.76 — PODADA a ese uso real. Se han ido: la variante de item por `src`
// (con su <img>, su srcSet/sizes/width/height y el hook useImageLoader entero,
// que esperaba a que cargaran imágenes que aquí no existen), el modo VERTICAL
// (up/down: media rama de cada cálculo de tamaño, más el ajuste de altura
// contra el padre), los items enlazables (`href` → <a target="_blank">),
// `renderItem`, y las props width/style/className/hoverSpeed/fadeOutColor/
// logoHeight, ninguna de las cuales se pasaba. De paso desaparecen los seis
// avisos de lint que arrastraba el original (deps no literales en tres hooks
// y el <img> sin next/image).
//
// Lo que se conserva intacto: el bucle rAF con suavizado de velocidad, la
// duplicación automática de la secuencia para cubrir el ancho, la pausa al
// pasar el ratón, el fundido de los bordes y la puerta de visibilidad (fuera
// de pantalla el rAF se detiene y el offset sobrevive en su ref).

// Solo `node`: `title`/`ariaLabel` por item quedaron sin uso al quitar los
// enlaces (eran el nombre accesible del <a>), y cada pastilla ya lleva el
// nombre de la tecnología como texto real.
export type LogoItem = {
  node: React.ReactNode;
};

export interface LogoLoopProps {
  logos: LogoItem[];
  speed?: number;
  direction?: 'left' | 'right';
  gap?: number;
  pauseOnHover?: boolean;
  fadeOut?: boolean;
  scaleOnHover?: boolean;
  ariaLabel?: string;
}

const ANIMATION_CONFIG = {
  SMOOTH_TAU: 0.25,
  MIN_COPIES: 2,
  COPY_HEADROOM: 2
} as const;

const useResizeObserver = (
  callback: () => void,
  elements: Array<React.RefObject<Element | null>>,
  dependencies: React.DependencyList
) => {
  useEffect(() => {
    if (!window.ResizeObserver) {
      const handleResize = () => callback();
      window.addEventListener('resize', handleResize);
      callback();
      return () => window.removeEventListener('resize', handleResize);
    }

    const observers = elements.map(ref => {
      if (!ref.current) return null;
      const observer = new ResizeObserver(callback);
      observer.observe(ref.current);
      return observer;
    });

    callback();

    return () => {
      observers.forEach(observer => observer?.disconnect());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
};

const useAnimationLoop = (
  trackRef: React.RefObject<HTMLDivElement | null>,
  targetVelocity: number,
  seqWidth: number,
  isHovered: boolean,
  hoverSpeed: number | undefined,
  active: boolean
) => {
  const rafRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Off-screen loops sleep entirely ("lo que no está en pantalla, no
    // renderiza") — offset lives in a ref, so scrolling back resumes the
    // marquee exactly where it left off.
    if (!active) return;

    if (seqWidth > 0) {
      offsetRef.current = ((offsetRef.current % seqWidth) + seqWidth) % seqWidth;
      track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
    }

    const animate = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      const deltaTime = Math.max(0, timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      const target = isHovered && hoverSpeed !== undefined ? hoverSpeed : targetVelocity;

      const easingFactor = 1 - Math.exp(-deltaTime / ANIMATION_CONFIG.SMOOTH_TAU);
      velocityRef.current += (target - velocityRef.current) * easingFactor;

      if (seqWidth > 0) {
        let nextOffset = offsetRef.current + velocityRef.current * deltaTime;
        nextOffset = ((nextOffset % seqWidth) + seqWidth) % seqWidth;
        offsetRef.current = nextOffset;
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimestampRef.current = null;
    };
  }, [trackRef, targetVelocity, seqWidth, isHovered, hoverSpeed, active]);
};

export const LogoLoop = React.memo<LogoLoopProps>(
  ({
    logos,
    speed = 120,
    direction = 'left',
    gap = 32,
    pauseOnHover,
    fadeOut = false,
    scaleOnHover = false,
    ariaLabel = 'Partner logos'
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const seqRef = useRef<HTMLUListElement>(null);

    const [seqWidth, setSeqWidth] = useState<number>(0);
    const [copyCount, setCopyCount] = useState<number>(ANIMATION_CONFIG.MIN_COPIES);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [inView, setInView] = useState<boolean>(true);

    // Visibility gate for the rAF marquee below.
    useEffect(() => {
      const el = containerRef.current;
      if (!el || !("IntersectionObserver" in window)) return;
      const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
        rootMargin: "150px 0px"
      });
      io.observe(el);
      return () => io.disconnect();
    }, []);

    const effectiveHoverSpeed = useMemo(() => {
      if (pauseOnHover === false) return undefined;
      return 0;
    }, [pauseOnHover]);

    const targetVelocity = useMemo(() => {
      const magnitude = Math.abs(speed);
      const directionMultiplier = direction === 'left' ? 1 : -1;
      const speedMultiplier = speed < 0 ? -1 : 1;
      return magnitude * directionMultiplier * speedMultiplier;
    }, [speed, direction]);

    const updateDimensions = useCallback(() => {
      const containerWidth = containerRef.current?.clientWidth ?? 0;
      const sequenceWidth = seqRef.current?.getBoundingClientRect?.().width ?? 0;
      if (sequenceWidth > 0) {
        setSeqWidth(Math.ceil(sequenceWidth));
        const copiesNeeded = Math.ceil(containerWidth / sequenceWidth) + ANIMATION_CONFIG.COPY_HEADROOM;
        setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded));
      }
    }, []);

    useResizeObserver(updateDimensions, [containerRef, seqRef], [logos, gap, updateDimensions]);

    useAnimationLoop(trackRef, targetVelocity, seqWidth, isHovered, effectiveHoverSpeed, inView);

    const cssVariables = useMemo(
      () =>
        ({
          '--logoloop-gap': `${gap}px`,
          '--logoloop-logoHeight': `28px`
        }) as React.CSSProperties,
      [gap]
    );

    const rootClassName = useMemo(
      () =>
        ['logoloop', 'logoloop--horizontal', fadeOut && 'logoloop--fade', scaleOnHover && 'logoloop--scale-hover']
          .filter(Boolean)
          .join(' '),
      [fadeOut, scaleOnHover]
    );

    const handleMouseEnter = useCallback(() => {
      if (effectiveHoverSpeed !== undefined) setIsHovered(true);
    }, [effectiveHoverSpeed]);
    const handleMouseLeave = useCallback(() => {
      if (effectiveHoverSpeed !== undefined) setIsHovered(false);
    }, [effectiveHoverSpeed]);

    const logoLists = useMemo(
      () =>
        Array.from({ length: copyCount }, (_, copyIndex) => (
          <ul
            className="logoloop__list"
            key={`copy-${copyIndex}`}
            role="list"
            aria-hidden={copyIndex > 0}
            ref={copyIndex === 0 ? seqRef : undefined}
          >
            {logos.map((item, itemIndex) => (
              <li className="logoloop__item" key={`${copyIndex}-${itemIndex}`} role="listitem">
                {/* Sin aria-label: un <span> no tiene rol, así que el nombre
                    accesible sale del texto real de dentro (cada pastilla
                    lleva el nombre de la tecnología). Las copias 2..n van
                    aria-hidden, así que no se lee nada dos veces. */}
                <span className="logoloop__node">{item.node}</span>
              </li>
            ))}
          </ul>
        )),
      [copyCount, logos]
    );

    return (
      <div
        ref={containerRef}
        className={rootClassName}
        style={{ width: '100%', ...cssVariables }}
        role="region"
        aria-label={ariaLabel}
      >
        <div className="logoloop__track" ref={trackRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {logoLists}
        </div>
      </div>
    );
  }
);

LogoLoop.displayName = 'LogoLoop';

export default LogoLoop;
