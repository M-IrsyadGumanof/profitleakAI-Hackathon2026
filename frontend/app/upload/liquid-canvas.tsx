"use client";

import { useEffect, useRef } from "react";

interface LiquidCanvasProps {
  isDragging?: boolean;
}

export function LiquidCanvas({ isDragging = false }: LiquidCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dropzone = canvas.closest("[data-dropzone]") as HTMLElement | null;
    if (!dropzone) return;

    let animId: number;
    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;

    // Coba inisialisasi WebGL
    try {
      gl =
        canvas.getContext("webgl", { alpha: true, antialias: true }) ||
        (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    } catch {
      gl = null;
    }

    // Jika WebGL tidak didukung, fallback sederhana
    if (!gl) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0a1324";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const vsSource = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment Shader: Netlify Aurora (Modul 24390) + ChromaFlow Liquid (Modul 23329) + Scanlines (Modul 69375)
    const fsSource = `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform vec2 u_mouse_vel;
      uniform float u_hover;
      uniform float u_drag;

      #define PI 3.14159265359

      // 3D Simplex noise untuk deformasi tirai Aurora organik
      vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

      float snoise(vec3 v){
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

        i = mod(i, 289.0);
        vec4 p = permute(permute(permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
      }

      // Evaluasi tirai sinar Aurora (Netlify Module 24390)
      vec2 evalCurtain(vec2 uv, float curtainIdx, float phaseOffset, float timeVal) {
        float i = timeVal * 0.045 + phaseOffset;
        float a = 81.0 + curtainIdx * 31.7;
        float aspect = u_resolution.x / max(u_resolution.y, 1.0);
        float s = (uv.x - 0.5) * aspect * 2.0;

        float n = fract(sin(a * 12.9) * 4758.5) * (2.0 * PI);
        float o = fract(sin(a * 78.2) * 2847.1) * (2.0 * PI);
        float l = fract(sin(a * 41.6) * 1593.7) * (2.0 * PI);

        // Harmonik gelombang sinusoidal yang mengalun
        float u = sin(s * 0.75 + i * 0.45 + n) * 0.16
                + sin(s * 1.6 + i * 0.65 + o) * 0.08
                + sin(s * 2.8 + i * 0.32 + l) * 0.04;

        // Variasi noise 3D
        float h = snoise(vec3(s * 0.5, i * 0.25, a * 0.1));

        // Dasar ketinggian tirai
        float waviness = 1.35;
        float c_curve = 0.88 + u * waviness + h * 0.14 * waviness;
        float p_pos = s + h * 2.4;

        // Detail struktur sinar vertikal (ray density)
        float rayDensity = 0.08;
        float m_ray = mix(6.0, 22.0, rayDensity);
        float S_seed = fract(sin(a * 53.7) * 3847.2) * (2.0 * PI);
        float M = pow(sin(p_pos * (m_ray * 0.15) + i * 0.12 + S_seed) * 0.5 + 0.5, 1.5);

        // Ketinggian vertikal dan atenuasi
        float v_height = 1.25;
        float E = v_height * mix(0.4, 1.0, M);
        float w = uv.y - (1.0 - c_curve);
        float R = smoothstep(-0.06, 0.02, w);
        float A = E * (M * 0.4 + 0.6);
        float C = smoothstep(A, 0.0, w);
        float N = R * C;
        float P = mix(0.4, 1.0, h * 0.5 + 0.5);
        float L = clamp(w / (A + 0.001), 0.0, 1.0);
        float I = L - 0.2;
        float U = exp(I * I * -6.0) * 0.35 + 1.0;

        return vec2(L, N * M * P * U);
      }

      void main() {
        vec2 uv = vUv;

        // 1. Deformasi Fluida Cair ChromaFlow (Interaktif Mouse)
        vec2 toMouse = uv - u_mouse;
        toMouse.x *= (u_resolution.x / max(u_resolution.y, 1.0));
        float dist = length(toMouse);

        // Gelombang riak air yang menyebar saat mouse bergerak
        float ripple = sin(dist * 34.0 - u_time * 6.5) * exp(-dist * 4.6);
        vec2 fluidOffset = normalize(toMouse + vec2(0.0001)) * ripple * 0.03 * u_hover;
        vec2 velOffset = u_mouse_vel * exp(-dist * 4.0) * 0.045 * u_hover;
        
        vec2 distortedUv = uv + fluidOffset + velOffset;

        // 2. Multi-layer Tirai Aurora Netlify
        // Tirai 1 (Primer)
        vec2 i0 = evalCurtain(distortedUv, 0.0, 0.0, u_time);
        float t_acc = i0.x * i0.y;
        float r_acc = i0.y;

        // Tirai 2 (Sekunder, fase 3.14)
        vec2 i1 = evalCurtain(distortedUv, 1.0, 3.1415, u_time);
        float a1 = i1.y * 0.65;
        t_acc += i1.x * a1;
        r_acc += a1;

        // Tirai 3 (Tersier, fase 6.28)
        vec2 i2 = evalCurtain(distortedUv, 2.0, 6.283, u_time);
        float a2 = i2.y * 0.35;
        t_acc += i2.x * a2;
        r_acc += a2;

        // Distribusi warna berdasarkan ketinggian tirai
        float balance = 0.22;
        float c_balance = mix(2.5, 0.4, balance);
        float a_norm = pow(clamp(t_acc / (r_acc + 0.001), 0.0, 1.0), c_balance);

        float h_col = smoothstep(0.0, 0.25, a_norm);
        float f_col = smoothstep(0.4, 0.85, a_norm);

        // Palet Resmi ProfitLeak AI (Corporate Deep Navy, Ice Sky & Cyan 400):
        // Navy 700   : #1E40AF -> rgb(0.118, 0.251, 0.686)
        // Ice Sky 300 : #7DD3FC -> rgb(0.490, 0.827, 0.988)
        // Cyan 400    : #38BDF8 -> rgb(0.220, 0.741, 0.973)
        // Royal Accent: #2563EB -> rgb(0.145, 0.388, 0.922)
        vec3 colA = vec3(0.118, 0.251, 0.686);
        vec3 colB = vec3(0.490, 0.827, 0.988);
        vec3 colC = vec3(0.220, 0.741, 0.973);
        vec3 colAccent = vec3(0.145, 0.388, 0.922);

        vec3 auroraCol = mix(mix(colA, colB, h_col), colC, f_col);

        // Tambahkan kilau cairan biru es di jalur kursor
        float liquidGlow = exp(-dist * 5.5) * length(u_mouse_vel) * 2.8 * u_hover;
        auroraCol = mix(auroraCol, colC, clamp(liquidGlow, 0.0, 0.75));

        // Jika user sedang drag file ke atas dropzone, berikan kilauan aktif cyan-blue
        float dragPulse = u_drag * (sin(u_time * 8.0) * 0.15 + 0.25);
        auroraCol += vec3(0.15, 0.40, 0.75) * dragPulse;

        // Skala intensitas cahaya aurora
        float intensity = 1.25;
        vec3 finalRgb = auroraCol * r_acc * intensity;

        // 3. Filter Tekstur Halus High-Tech
        float scanline = sin(uv.y * u_resolution.y * 1.6) * 0.5 + 0.5;
        finalRgb *= (1.0 - 0.08 * scanline);

        // Background Gradien Dark Corporate Slate/Navy (#0B1124 ke #020613)
        vec3 bgGrad = mix(vec3(0.043, 0.067, 0.140), vec3(0.008, 0.024, 0.075), uv.y);
        vec3 composite = bgGrad + finalRgb;

        // Transparansi halus
        gl_FragColor = vec4(composite, 0.97);
      }
    `;

    // Helper kompilasi shader
    const createShader = (glCtx: WebGLRenderingContext, type: number, source: string) => {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.warn("Shader compile error:", glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry (-1 to 1)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posAttrLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posAttrLoc);
    gl.vertexAttribPointer(posAttrLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResLoc = gl.getUniformLocation(program, "u_resolution");
    const uTimeLoc = gl.getUniformLocation(program, "u_time");
    const uMouseLoc = gl.getUniformLocation(program, "u_mouse");
    const uMouseVelLoc = gl.getUniformLocation(program, "u_mouse_vel");
    const uHoverLoc = gl.getUniformLocation(program, "u_hover");
    const uDragLoc = gl.getUniformLocation(program, "u_drag");

    let currentMouseX = 0.5;
    let currentMouseY = 0.5;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;
    let mouseVelX = 0;
    let mouseVelY = 0;
    let hoverValue = 0;
    let lastEventTime = performance.now();
    const startTime = performance.now();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = dropzone.getBoundingClientRect();
      const x = (e.clientX - rect.left) / Math.max(1, rect.width);
      const y = 1.0 - (e.clientY - rect.top) / Math.max(1, rect.height); // WebGL Y is inverted

      const now = performance.now();
      const dt = Math.max(0.001, (now - lastEventTime) / 1000);
      lastEventTime = now;

      const vx = (x - targetMouseX) / dt;
      const vy = (y - targetMouseY) / dt;

      mouseVelX = mouseVelX * 0.4 + vx * 0.6;
      mouseVelY = mouseVelY * 0.4 + vy * 0.6;

      targetMouseX = Math.max(0, Math.min(1, x));
      targetMouseY = Math.max(0, Math.min(1, y));
      hoverValue = 1.0;
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const rect = dropzone.getBoundingClientRect();
      targetMouseX = (e.clientX - rect.left) / Math.max(1, rect.width);
      targetMouseY = 1.0 - (e.clientY - rect.top) / Math.max(1, rect.height);
      currentMouseX = targetMouseX;
      currentMouseY = targetMouseY;
      mouseVelX = 0.5;
      mouseVelY = 0.5;
      hoverValue = 1.0;
      lastEventTime = performance.now();
    };

    const handleMouseLeave = () => {
      hoverValue = 0.0;
    };

    const updateSize = () => {
      const rect = dropzone.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(rect.width * dpr);
      const h = Math.floor(rect.height * dpr);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(dropzone);

    dropzone.addEventListener("mousemove", handleMouseMove);
    dropzone.addEventListener("mouseenter", handleMouseEnter);
    dropzone.addEventListener("mouseleave", handleMouseLeave);

    // Loop render WebGL 60fps
    const render = () => {
      if (!gl || !program) return;

      const now = performance.now();
      const elapsed = (now - startTime) / 1000;

      // Lerp posisi mouse untuk kelancaran fluida
      currentMouseX += (targetMouseX - currentMouseX) * 0.15;
      currentMouseY += (targetMouseY - currentMouseY) * 0.15;
      mouseVelX *= 0.92;
      mouseVelY *= 0.92;

      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.useProgram(program);
      gl.uniform2f(uResLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, elapsed);
      gl.uniform2f(uMouseLoc, currentMouseX, currentMouseY);
      gl.uniform2f(uMouseVelLoc, mouseVelX * 0.015, mouseVelY * 0.015);
      gl.uniform1f(uHoverLoc, hoverValue);
      gl.uniform1f(uDragLoc, isDragging ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      dropzone.removeEventListener("mousemove", handleMouseMove);
      dropzone.removeEventListener("mouseenter", handleMouseEnter);
      dropzone.removeEventListener("mouseleave", handleMouseLeave);
      if (gl && program) {
        gl.deleteProgram(program);
      }
    };
  }, [isDragging]);

  return (
    <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
}
