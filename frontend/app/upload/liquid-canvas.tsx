"use client";

import { useEffect, useRef } from "react";

export function LiquidCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const dropzone = canvas.closest("[data-dropzone]") as HTMLElement | null;
    if (!dropzone) return;

    let animId: number;
    let width = 0;
    let height = 0;

    // Grid fluida ChromaFlow (64x64 grid untuk fluid advection yang sangat halus & 60fps)
    const GRID_SIZE = 64;
    const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

    // Buffer kecepatan (Vx, Vy) dan densitas fluida (Dye)
    let vx = new Float32Array(TOTAL_CELLS);
    let vy = new Float32Array(TOTAL_CELLS);
    let density = new Float32Array(TOTAL_CELLS);
    let nextDensity = new Float32Array(TOTAL_CELLS);
    let nextVx = new Float32Array(TOTAL_CELLS);
    let nextVy = new Float32Array(TOTAL_CELLS);

    let lastMouseX = -1;
    let lastMouseY = -1;
    let lastTime = performance.now();

    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = GRID_SIZE;
    offscreenCanvas.height = GRID_SIZE;
    const offscreenCtx = offscreenCanvas.getContext("2d");
    let imgData: ImageData | null = null;
    if (offscreenCtx) {
      imgData = offscreenCtx.createImageData(GRID_SIZE, GRID_SIZE);
    }

    const updateSize = () => {
      const rect = dropzone.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      width = Math.floor(rect.width);
      height = Math.floor(rect.height);

      canvas.width = width;
      canvas.height = height;
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(dropzone);

    // Menambahkan impuls fluida ChromaFlow di posisi kursor
    const addFluidImpulse = (
      px: number,
      py: number,
      velX: number,
      velY: number,
      speed: number
    ) => {
      const gx = (px / width) * GRID_SIZE;
      const gy = (py / height) * GRID_SIZE;
      const radius = 3.5;

      const rInt = Math.ceil(radius);
      for (let dy = -rInt; dy <= rInt; dy++) {
        for (let dx = -rInt; dx <= rInt; dx++) {
          const distSq = dx * dx + dy * dy;
          if (distSq <= radius * radius) {
            const cx = Math.floor(gx + dx);
            const cy = Math.floor(gy + dy);
            if (cx >= 1 && cx < GRID_SIZE - 1 && cy >= 1 && cy < GRID_SIZE - 1) {
              const idx = cy * GRID_SIZE + cx;
              const falloff = Math.exp(-distSq / (radius * 1.5));

              // Suntikkan momentum kecepatan dan partikel fluida
              vx[idx] += velX * falloff * 0.4;
              vy[idx] += velY * falloff * 0.4;
              density[idx] = Math.min(1.0, density[idx] + speed * falloff * 0.25);
            }
          }
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = dropzone.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const now = performance.now();
      const dt = Math.max(0.001, (now - lastTime) / 1000);
      lastTime = now;

      if (lastMouseX >= 0 && lastMouseY >= 0) {
        const dx = x - lastMouseX;
        const dy = y - lastMouseY;
        const speed = Math.min(30, Math.hypot(dx, dy));

        if (speed > 0.5) {
          const velX = (dx / dt) * 0.015;
          const velY = (dy / dt) * 0.015;
          addFluidImpulse(x, y, velX, velY, speed);
        }
      }

      lastMouseX = x;
      lastMouseY = y;
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const rect = dropzone.getBoundingClientRect();
      lastMouseX = e.clientX - rect.left;
      lastMouseY = e.clientY - rect.top;
      lastTime = performance.now();
      addFluidImpulse(lastMouseX, lastMouseY, 0, 1.5, 8);
    };

    const handleMouseLeave = () => {
      lastMouseX = -1;
      lastMouseY = -1;
    };

    dropzone.addEventListener("mousemove", handleMouseMove);
    dropzone.addEventListener("mouseenter", handleMouseEnter);
    dropzone.addEventListener("mouseleave", handleMouseLeave);

    // Loop simulasi fluida & adveksi momentum (Semi-Lagrangian Advection ala Netlify)
    const render = () => {
      if (!offscreenCtx || !imgData || width === 0 || height === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      const decay = 0.94; // Disipasi partikel air alami
      const dt = 0.8;

      // 1. Adveksi & pembaruan fluida
      for (let y = 1; y < GRID_SIZE - 1; y++) {
        const row = y * GRID_SIZE;
        for (let x = 1; x < GRID_SIZE - 1; x++) {
          const idx = row + x;

          // Trace balik koordinat fluida (Semi-Lagrangian trace back)
          const srcX = x - vx[idx] * dt;
          const srcY = y - vy[idx] * dt;

          // Bilinear interpolation
          const x0 = Math.max(0, Math.min(GRID_SIZE - 2, Math.floor(srcX)));
          const y0 = Math.max(0, Math.min(GRID_SIZE - 2, Math.floor(srcY)));
          const x1 = x0 + 1;
          const y1 = y0 + 1;

          const s1 = srcX - x0;
          const s0 = 1 - s1;
          const t1 = srcY - y0;
          const t0 = 1 - t1;

          const d00 = density[y0 * GRID_SIZE + x0];
          const d10 = density[y0 * GRID_SIZE + x1];
          const d01 = density[y1 * GRID_SIZE + x0];
          const d11 = density[y1 * GRID_SIZE + x1];

          nextDensity[idx] =
            (s0 * (t0 * d00 + t1 * d01) + s1 * (t0 * d10 + t1 * d11)) * decay;

          nextVx[idx] = vx[idx] * 0.91;
          nextVy[idx] = vy[idx] * 0.91;
        }
      }

      // Salin buffer
      density.set(nextDensity);
      vx.set(nextVx);
      vy.set(nextVy);

      // 2. Render permukaan cairan ke ImageData dengan gradien refraksi lembut
      const data = imgData.data;
      let hasActiveLiquid = false;

      for (let i = 0; i < TOTAL_CELLS; i++) {
        const pIdx = i * 4;
        const d = density[i];

        if (d > 0.015) {
          hasActiveLiquid = true;
          // Warna fluida Royal Blue (#2563eb) transparan tanpa mengubah warna asli
          const alpha = Math.min(110, Math.floor(d * 180));
          data[pIdx] = 37;      // R: 37
          data[pIdx + 1] = 99;  // G: 99
          data[pIdx + 2] = 235; // B: 235
          data[pIdx + 3] = alpha;
        } else {
          data[pIdx + 3] = 0;
        }
      }

      ctx.clearRect(0, 0, width, height);

      // Gambar ke canvas utama dengan bilinear filtering tinggi agar menjadi gradien cair yang mulus
      if (hasActiveLiquid) {
        offscreenCtx.putImageData(imgData, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(offscreenCanvas, 0, 0, width, height);
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
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full block filter blur-[6px] opacity-75 transition-opacity"
      />
    </div>
  );
}
