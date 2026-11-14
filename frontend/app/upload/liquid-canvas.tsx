"use client";

import { useEffect, useRef } from "react";

interface LiquidCanvasProps {
  className?: string;
  isHovering?: boolean;
}

export function LiquidCanvas({ className, isHovering }: LiquidCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    // Skala 2 untuk kerapatan gelombang yang tajam dan responsif
    const scale = 2.5;
    let gridW = 0;
    let gridH = 0;
    let buffer1: Float32Array;
    let buffer2: Float32Array;
    let imgData: ImageData;

    // Damping gelombang: 0.965 membuat gelombang merambat meluas dan memantul halus di tepi
    const damping = 0.968;
    let lastMouseX = -1;
    let lastMouseY = -1;

    const offscreenCanvas = document.createElement("canvas");
    let offscreenCtx: CanvasRenderingContext2D | null = null;

    const updateSize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;

      width = Math.floor(rect.width);
      height = Math.floor(rect.height);

      canvas.width = width;
      canvas.height = height;

      gridW = Math.max(10, Math.floor(width / scale));
      gridH = Math.max(10, Math.floor(height / scale));

      buffer1 = new Float32Array(gridW * gridH);
      buffer2 = new Float32Array(gridW * gridH);

      offscreenCanvas.width = gridW;
      offscreenCanvas.height = gridH;
      offscreenCtx = offscreenCanvas.getContext("2d");
      if (offscreenCtx) {
        imgData = offscreenCtx.createImageData(gridW, gridH);
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Menambah impuls gelombang air
    const addDisturbance = (x: number, y: number, radius: number, strength: number) => {
      if (!buffer1 || gridW === 0 || gridH === 0) return;
      const gx = Math.floor(x / scale);
      const gy = Math.floor(y / scale);

      const r = Math.max(1, Math.floor(radius / scale));
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const distSq = dx * dx + dy * dy;
          if (distSq <= r * r) {
            const nx = gx + dx;
            const ny = gy + dy;
            if (nx > 2 && nx < gridW - 3 && ny > 2 && ny < gridH - 3) {
              const falloff = 1 - Math.sqrt(distSq) / (r + 0.1);
              buffer1[ny * gridW + nx] += strength * falloff;
            }
          }
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x < 0 || x > width || y < 0 || y > height) return;

      const dx = lastMouseX >= 0 ? x - lastMouseX : 0;
      const dy = lastMouseY >= 0 ? y - lastMouseY : 0;
      const speed = Math.min(30, Math.sqrt(dx * dx + dy * dy));

      // Gelombang yang hidup mengikuti gesekan kursor
      const strength = Math.max(25, speed * 2.8);
      const radius = Math.min(36, 16 + speed * 1.1);

      addDisturbance(x, y, radius, strength);

      lastMouseX = x;
      lastMouseY = y;
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Impuls awal saat kursor pertama kali masuk ke area dropzone
      addDisturbance(x, y, 24, 45);
    };

    const handleMouseLeave = () => {
      lastMouseX = -1;
      lastMouseY = -1;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener("mousemove", handleMouseMove);
      parent.addEventListener("mouseenter", handleMouseEnter);
      parent.addEventListener("mouseleave", handleMouseLeave);
    }

    // Loop fisika gelombang fluida
    const render = () => {
      if (!buffer1 || !buffer2 || !offscreenCtx || !imgData || gridW === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      // 1. Persamaan diferensial gelombang fluida (Wave propagation equation)
      for (let y = 1; y < gridH - 1; y++) {
        const row = y * gridW;
        for (let x = 1; x < gridW - 1; x++) {
          const idx = row + x;
          const val =
            (buffer1[idx - 1] +
              buffer1[idx + 1] +
              buffer1[idx - gridW] +
              buffer1[idx + gridW]) *
              0.5 -
            buffer2[idx];
          buffer2[idx] = val * damping;
        }
      }

      // Swap buffer gelombang
      const temp = buffer1;
      buffer1 = buffer2;
      buffer2 = temp;

      // 2. Render refraksi optik air ke ImageData
      const data = imgData.data;
      let hasActiveWaves = false;

      for (let y = 1; y < gridH - 1; y++) {
        const row = y * gridW;
        for (let x = 1; x < gridW - 1; x++) {
          const idx = row + x;
          const pIdx = idx * 4;

          // Slope gradien normal permukaan air
          const slopeX = buffer1[idx + 1] - buffer1[idx - 1];
          const slopeY = buffer1[idx + gridW] - buffer1[idx - gridW];
          const intensity = slopeX - slopeY;

          if (Math.abs(intensity) > 0.04) {
            hasActiveWaves = true;
          }

          if (intensity > 0) {
            // Puncak gelombang / specular highlight cairan (kontras jelas di atas latar putih)
            const alpha = Math.min(160, Math.floor(intensity * 3.6));
            data[pIdx] = 37;      // R (Royal Blue #2563eb)
            data[pIdx + 1] = 99;  // G
            data[pIdx + 2] = 235; // B
            data[pIdx + 3] = alpha;
          } else if (intensity < 0) {
            // Lembah gelombang / bayangan refraksi cair
            const alpha = Math.min(110, Math.floor(-intensity * 2.5));
            data[pIdx] = 30;      // R (Darker Blue)
            data[pIdx + 1] = 58;  // G
            data[pIdx + 2] = 138; // B (#1e3a8a)
            data[pIdx + 3] = alpha;
          } else {
            data[pIdx + 3] = 0;
          }
        }
      }

      ctx.clearRect(0, 0, width, height);

      if (hasActiveWaves) {
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
      if (parent) {
        parent.removeEventListener("mousemove", handleMouseMove);
        parent.removeEventListener("mouseenter", handleMouseEnter);
        parent.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <div
      className={`absolute inset-0 pointer-events-none rounded-2xl overflow-hidden ${
        className || ""
      }`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block filter blur-[1.2px] opacity-85 transition-opacity"
      />
    </div>
  );
}
