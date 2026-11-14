"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number; // millisecond delay for staggered cards
  direction?: "up" | "none";
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Jika browser tidak mendukung IntersectionObserver (fallback aman)
    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -50px 0px", // Memicu animasi sedikit sebelum elemen penuh di viewport
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  const transformClass =
    direction === "up"
      ? isVisible
        ? "translate-y-0 opacity-100"
        : "translate-y-10 opacity-0"
      : isVisible
      ? "opacity-100"
      : "opacity-0";

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${transformClass} ${className}`}
    >
      {children}
    </div>
  );
}
