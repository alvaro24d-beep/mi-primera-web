"use client";

// CurvedLoop (React Bits, TS-CSS variant) — adapted for this project:
//  - Upstream called setState(offset) on EVERY rAF tick → a React re-render
//    per frame, the exact anti-pattern this repo documents (see CLAUDE.md).
//    The offset now lives only in the SVG attribute, mutated directly.
//  - The rAF loop is gated by an IntersectionObserver: off-screen, the loop
//    doesn't run at all (same philosophy as Tech's marquees / HeroScene).
//  - `paused` prop for the reduced-motion branch: static curved text, no
//    loop, drag disabled.
//  - Shipped CurvedLoop.css folded into globals.css as .nxr-curvedloop*
//    (single-stylesheet convention), upstream min-height:100vh dropped.
import { useRef, useEffect, useState, useMemo, useId, FC, PointerEvent } from "react";

interface CurvedLoopProps {
  marqueeText?: string;
  speed?: number;
  className?: string;
  curveAmount?: number;
  direction?: "left" | "right";
  interactive?: boolean;
  paused?: boolean;
}

const CurvedLoop: FC<CurvedLoopProps> = ({
  marqueeText = "",
  speed = 2,
  className,
  curveAmount = 400,
  direction = "left",
  interactive = true,
  paused = false,
}) => {
  const text = useMemo(() => {
    const hasTrailing = /\s|\u00A0$/.test(marqueeText);
    return (hasTrailing ? marqueeText.replace(/\s+$/, "") : marqueeText) + "\u00A0";
  }, [marqueeText]);

  const jacketRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<SVGTextElement | null>(null);
  const textPathRef = useRef<SVGTextPathElement | null>(null);
  const [spacing, setSpacing] = useState(0);
  const uid = useId();
  const pathId = `curve-${uid}`;
  const pathD = `M-100,40 Q500,${40 + curveAmount} 1540,40`;

  const dragRef = useRef(false);
  const lastXRef = useRef(0);
  const dirRef = useRef<"left" | "right">(direction);
  const velRef = useRef(0);

  const canInteract = interactive && !paused;
  const totalText = spacing
    ? Array(Math.ceil(1800 / spacing) + 2)
        .fill(text)
        .join("")
    : text;
  const ready = spacing > 0;

  useEffect(() => {
    if (measureRef.current) setSpacing(measureRef.current.getComputedTextLength());
  }, [text, className]);

  // Wraps an arbitrary offset into (-spacing, 0] and writes it to the SVG —
  // attribute only, never React state (a per-frame setState re-rendered the
  // whole component 60×/s upstream).
  const setPathOffset = (value: number) => {
    const tp = textPathRef.current;
    if (!tp) return;
    let v = value;
    if (v <= -spacing) v += spacing;
    if (v > 0) v -= spacing;
    tp.setAttribute("startOffset", v + "px");
  };

  useEffect(() => {
    if (spacing) setPathOffset(-spacing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spacing]);

  useEffect(() => {
    if (!spacing || paused) return;
    const jacket = jacketRef.current;
    if (!jacket) return;

    let frame: number | null = null;
    const step = () => {
      if (!dragRef.current && textPathRef.current) {
        const delta = dirRef.current === "right" ? speed : -speed;
        const current = parseFloat(textPathRef.current.getAttribute("startOffset") || "0");
        setPathOffset(current + delta);
      }
      frame = requestAnimationFrame(step);
    };

    // Only loop while the strip is anywhere near the viewport.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && frame === null) {
          frame = requestAnimationFrame(step);
        } else if (!entry.isIntersecting && frame !== null) {
          cancelAnimationFrame(frame);
          frame = null;
        }
      },
      { rootMargin: "120px 0px" }
    );
    io.observe(jacket);

    return () => {
      io.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spacing, speed, paused]);

  const onPointerDown = (e: PointerEvent) => {
    if (!canInteract) return;
    dragRef.current = true;
    lastXRef.current = e.clientX;
    velRef.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (jacketRef.current) jacketRef.current.style.cursor = "grabbing";
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!canInteract || !dragRef.current || !textPathRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    velRef.current = dx;
    const current = parseFloat(textPathRef.current.getAttribute("startOffset") || "0");
    setPathOffset(current + dx);
  };

  const endDrag = () => {
    if (!canInteract) return;
    dragRef.current = false;
    dirRef.current = velRef.current > 0 ? "right" : "left";
    if (jacketRef.current) jacketRef.current.style.cursor = "grab";
  };

  return (
    <div
      ref={jacketRef}
      className="nxr-curvedloop"
      style={{ visibility: ready ? "visible" : "hidden", cursor: canInteract ? "grab" : "auto" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <svg className="nxr-curvedloop-svg" viewBox="0 0 1440 120">
        <text ref={measureRef} xmlSpace="preserve" style={{ visibility: "hidden", opacity: 0, pointerEvents: "none" }}>
          {text}
        </text>
        <defs>
          <path id={pathId} d={pathD} fill="none" stroke="transparent" />
        </defs>
        {ready && (
          <text fontWeight="bold" xmlSpace="preserve" className={className}>
            <textPath ref={textPathRef} href={`#${pathId}`} startOffset={-spacing + "px"} xmlSpace="preserve">
              {totalText}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
};

export default CurvedLoop;
