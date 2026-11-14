"use client";

import { useEffect, useRef } from "react";

interface LiquidRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  strength: number;
  alpha: number;
  wavelength: number;
}

interface LiquidCanvasProps {
  className?: string;
  isHovering?: boolean;
}

export function LiquidCanvas({ className }: LiquidCanvasProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cari elemen dropzone terdekat
    const dropzone = canvas.closest("[data-dropzone]") as HTMLElement | null;
    if (!dropzone) return;

    let animId: number;
    let width = 0;
    let height = 0;

    // Koordinat kursor mouse dengan easing halus (fluid trailing)
    let mouseX = -1000;
    let mouseY = -1000;
    let smoothMouseX = -1000;
    let smoothMouseY = -1000;
    let isHovering = false;
    let lastEmitX = -1000;
    let lastEmitY = -1000;

    const ripples: LiquidRipple[] = [];

    const updateSize = () => {
      const rect = dropzone.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(dropzone);

    // Fungsi membuat riak gelombang air
    const emitRipple = (x: number, y: number, strength = 1.0, maxRadius = 140) => {
      ripples.push({
        x,
        y,
        radius: 0,
        maxRadius,
        speed: 2.2 + strength * 1.2,
        strength,
        alpha: 0.65 * strength,
        wavelength: 22 + strength * 8,
      });

      // Batasi jumlah gelombang aktif agar performa tetap 60fps
      if (ripples.length > 25) {
        ripples.shift();
      }
    };

    // Event listener mouse langsung pada elemen dropzone
    const handleMouseMove = (e: MouseEvent) => {
      const rect = dropzone.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouseX = x;
      mouseY = y;
      isHovering = true;

      if (smoothMouseX < 0) {
        smoothMouseX = x;
        smoothMouseY = y;
      }

      // Hitung jarak dari riak sebelumnya
      const distFromLast = Math.hypot(x - lastEmitX, y - lastEmitY);
      if (distFromLast > 16) {
        const speed = Math.min(2.5, distFromLast / 8);
        emitRipple(x, y, speed, 120 + speed * 30);
        lastEmitX = x;
        lastEmitY = y;
      }
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const rect = dropzone.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouseX = x;
      mouseY = y;
      smoothMouseX = x;
      smoothMouseY = y;
      isHovering = true;

      // Percikan gelombang awal saat mouse masuk
      emitRipple(x, y, 1.8, 160);
      emitRipple(x, y, 1.2, 110);
    };

    const handleMouseLeave = () => {
      isHovering = false;
      mouseX = -1000;
      mouseY = -1000;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = dropzone.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Multi-ring ripple saat di-klik
      emitRipple(x, y, 2.5, 220);
      setTimeout(() => emitRipple(x, y, 1.8, 160), 60);
      setTimeout(() => emitRipple(x, y, 1.2, 110), 120);
    };

    dropzone.addEventListener("mousemove", handleMouseMove);
    dropzone.addEventListener("mouseenter", handleMouseEnter);
    dropzone.addEventListener("mouseleave", handleMouseLeave);
    dropzone.addEventListener("click", handleClick);

    // Animasi rendering gelombang cairan
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Easing pergerakan kursor fluida
      if (isHovering && mouseX >= 0) {
        smoothMouseX += (mouseX - smoothMouseX) * 0.18;
        smoothMouseY += (mouseY - smoothMouseY) * 0.18;

        // 1. Fluid Cursor Spotlight (Aksen cairan lembut yang mengikuti kursor)
        const glowRadius = 90;
        const auraGrad = ctx.createRadialGradient(
          smoothMouseX,
          smoothMouseY,
          0,
          smoothMouseX,
          smoothMouseY,
          glowRadius
        );
        // Tetap menggunakan warna asli produk (Royal Blue transparan)
        auraGrad.addColorStop(0, "rgba(37, 99, 235, 0.14)");
        auraGrad.addColorStop(0.4, "rgba(59, 130, 246, 0.08)");
        auraGrad.addColorStop(0.8, "rgba(147, 197, 253, 0.03)");
        auraGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(smoothMouseX, smoothMouseY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Render riak gelombang air konsentris
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;

        // Fade out alami saat radius mendekati batas maksimum
        const progress = r.radius / r.maxRadius;
        const currentAlpha = r.alpha * (1 - progress);

        if (progress >= 1 || currentAlpha <= 0.01) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();

        // Lingkaran gelombang luar (bias cahaya cairan)
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1, r.wavelength * (1 - progress * 0.7));
        ctx.strokeStyle = `rgba(37, 99, 235, ${currentAlpha * 0.45})`;
        ctx.stroke();

        // Lingkaran puncak gelombang dalam (specular light shine)
        ctx.beginPath();
        ctx.arc(r.x, r.y, Math.max(1, r.radius - 4), 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = `rgba(96, 165, 250, ${currentAlpha * 0.8})`;
        ctx.stroke();

        // Highlight putih halus di punggung gelombang
        ctx.beginPath();
        ctx.arc(r.x, r.y, Math.max(1, r.radius - 2), 0, Math.PI * 2);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = `rgba(255, 255, 255, ${currentAlpha * 0.95})`;
        ctx.stroke();

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      dropzone.removeEventListener("mousemove", handleMouseMove);
      dropzone.removeEventListener("mouseenter", handleMouseEnter);
      dropzone.removeEventListener("mouseleave", handleMouseLeave);
      dropzone.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full block filter blur-[0.5px]"
      />
    </div>
  );
}
