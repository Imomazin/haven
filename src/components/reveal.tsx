"use client";

import { useEffect, useRef, useState } from "react";

// Reveals children on scroll into view with a restrained fade-up. Falls back to
// visible immediately when IntersectionObserver is unavailable or the user
// prefers reduced motion (the CSS handles the reduced-motion case too).
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: {
  children: React.ReactNode;
  delay?: 1 | 2 | 3 | 4 | 0;
  as?: "div" | "section" | "li";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setShown(true); io.disconnect(); }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cls = `reveal ${delay ? `reveal-${delay}` : ""} ${shown ? "in" : ""} ${className}`;
  // @ts-expect-error dynamic tag
  return <Tag ref={ref} className={cls}>{children}</Tag>;
}
