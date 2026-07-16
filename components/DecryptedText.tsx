"use client";

// DecryptedText (React Bits, TS-CSS variant) — adapted for this project:
//  - `motion/react` stripped: it was only used as a passive <motion.span>
//    wrapper, and this repo's animation stack is GSAP — pulling framer-motion
//    (~35KB gz) for a static span was pure dead weight. Plain <span> now.
//  - a11y fix vs upstream: the sr-only twin holds the FINAL `text`, not the
//    live scrambled `displayText` (screen readers were being read noise).
//  - Reduced motion is the CALLER's job (render plain text on that branch),
//    matching the sitewide pattern of separate reduced-motion JSX branches.
import { useEffect, useState, useRef, useMemo, useCallback } from "react";

const styles = {
  wrapper: {
    display: "inline-block" as const,
    whiteSpace: "pre-wrap" as const,
  },
  srOnly: {
    position: "absolute" as const,
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    border: 0,
  },
};

interface DecryptedTextProps extends React.ComponentPropsWithoutRef<"span"> {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: "view" | "hover";
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
  className = "",
  parentClassName = "",
  encryptedClassName = "",
  animateOn = "hover",
  ...props
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState<string>(text);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);
  const [isDecrypted, setIsDecrypted] = useState<boolean>(true);

  const containerRef = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const availableChars = useMemo<string[]>(() => {
    return useOriginalCharsOnly
      ? Array.from(new Set(text.split(""))).filter((char) => char !== " ")
      : characters.split("");
  }, [useOriginalCharsOnly, text, characters]);

  const shuffleText = useCallback(
    (originalText: string, currentRevealed: Set<number>) => {
      return originalText
        .split("")
        .map((char, i) => {
          if (char === " ") return " ";
          if (currentRevealed.has(i)) return originalText[i];
          return availableChars[Math.floor(Math.random() * availableChars.length)];
        })
        .join("");
    },
    [availableChars]
  );

  const triggerDecrypt = useCallback(() => {
    setRevealedIndices(new Set());
    setIsDecrypted(false);
    setIsAnimating(true);
  }, []);

  useEffect(() => {
    if (!isAnimating) return;

    let currentIteration = 0;

    const getNextIndex = (revealedSet: Set<number>): number => {
      const textLength = text.length;
      switch (revealDirection) {
        case "start":
          return revealedSet.size;
        case "end":
          return textLength - 1 - revealedSet.size;
        case "center": {
          const middle = Math.floor(textLength / 2);
          const offset = Math.floor(revealedSet.size / 2);
          const nextIndex = revealedSet.size % 2 === 0 ? middle + offset : middle - offset - 1;
          if (nextIndex >= 0 && nextIndex < textLength && !revealedSet.has(nextIndex)) {
            return nextIndex;
          }
          for (let i = 0; i < textLength; i++) {
            if (!revealedSet.has(i)) return i;
          }
          return 0;
        }
        default:
          return revealedSet.size;
      }
    };

    intervalRef.current = setInterval(() => {
      setRevealedIndices((prevRevealed) => {
        if (sequential) {
          if (prevRevealed.size < text.length) {
            const nextIndex = getNextIndex(prevRevealed);
            const newRevealed = new Set(prevRevealed);
            newRevealed.add(nextIndex);
            setDisplayText(shuffleText(text, newRevealed));
            return newRevealed;
          }
          clearInterval(intervalRef.current ?? undefined);
          setIsAnimating(false);
          setIsDecrypted(true);
          return prevRevealed;
        }
        // Non-sequential: whole string shuffles, resolves after maxIterations.
        setDisplayText(shuffleText(text, prevRevealed));
        currentIteration++;
        if (currentIteration >= maxIterations) {
          clearInterval(intervalRef.current ?? undefined);
          setIsAnimating(false);
          setDisplayText(text);
          setIsDecrypted(true);
        }
        return prevRevealed;
      });
    }, speed);

    return () => clearInterval(intervalRef.current ?? undefined);
  }, [isAnimating, text, speed, maxIterations, sequential, revealDirection, shuffleText]);

  /* View trigger */
  useEffect(() => {
    if (animateOn !== "view") return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            triggerDecrypt();
            setHasAnimated(true);
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animateOn, hasAnimated, triggerDecrypt]);

  /* Hover trigger */
  const triggerHoverDecrypt = useCallback(() => {
    if (isAnimating) return;
    triggerDecrypt();
  }, [isAnimating, triggerDecrypt]);

  const hoverProps = animateOn === "hover" ? { onMouseEnter: triggerHoverDecrypt } : {};

  return (
    <span className={parentClassName} ref={containerRef} style={styles.wrapper} {...hoverProps} {...props}>
      <span style={styles.srOnly}>{text}</span>
      <span aria-hidden="true">
        {displayText.split("").map((char, index) => {
          const isRevealedOrDone = revealedIndices.has(index) || (!isAnimating && isDecrypted);
          return (
            <span key={index} className={isRevealedOrDone ? className : encryptedClassName}>
              {char}
            </span>
          );
        })}
      </span>
    </span>
  );
}
