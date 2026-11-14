"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, RotateCcw, Move3d } from "lucide-react";

export function Hero3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [activeMode, setActiveMode] = useState<"shield" | "audit">("shield");
  const resetRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensi kontainer
    let width = container.clientWidth;
    let height = container.clientHeight || 460;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    // 2. Lighting System (Corporate Titanium & Ice Specular)
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 3.5); // Ice Cyan key light
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x1e40af, 2.8); // Deep Navy fill light
    dirLight2.position.set(-6, -5, 4);
    scene.add(dirLight2);

    const rimLight = new THREE.PointLight(0xffffff, 2.0, 15);
    rimLight.position.set(0, 4, 3);
    scene.add(rimLight);

    // 3. Root 3D Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 4. Geometri Perisai 3D (Shield Extrusion sesuai Logo Resmi)
    const shieldShape = new THREE.Shape();
    // Bentuk perisai kurva simetris proporsional
    shieldShape.moveTo(0, 2.2);
    shieldShape.bezierCurveTo(0.9, 2.1, 1.9, 1.8, 2.0, 1.0);
    shieldShape.bezierCurveTo(2.05, -0.4, 1.3, -1.5, 0, -2.4);
    shieldShape.bezierCurveTo(-1.3, -1.5, -2.05, -0.4, -2.0, 1.0);
    shieldShape.bezierCurveTo(-1.9, 1.8, -0.9, 2.1, 0, 2.2);

    // Lubang tengah agar kubus di dalam terlihat menyatu (Interlocking Shield)
    const holePath = new THREE.Path();
    holePath.moveTo(0, 1.7);
    holePath.bezierCurveTo(0.65, 1.6, 1.45, 1.35, 1.5, 0.75);
    holePath.bezierCurveTo(1.55, -0.3, 0.95, -1.15, 0, -1.85);
    holePath.bezierCurveTo(-0.95, -1.15, -1.55, -0.3, -1.5, 0.75);
    holePath.bezierCurveTo(-1.45, 1.35, -0.65, 1.6, 0, 1.7);
    shieldShape.holes.push(holePath);

    const extrudeSettings = {
      depth: 0.35,
      bevelEnabled: true,
      bevelSegments: 6,
      steps: 2,
      bevelSize: 0.12,
      bevelThickness: 0.12,
    };

    const shieldGeometry = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
    shieldGeometry.center();

    // Material Perisai: Titanium Deep Navy & Gloss Metallic
    const shieldMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1e3a8a, // Navy corporate
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 0.9,
      clearcoatRoughness: 0.15,
      reflectivity: 0.9,
    });

    const shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    rootGroup.add(shieldMesh);

    // 5. Kubus Logistik 3D di Tengah (Interlocking Cube)
    const cubeSize = 1.05;
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    
    // Material sisi-sisi kubus dengan warna Palet Opsi 2 (Navy, Sky, Slate)
    const cubeMaterials = [
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.18 }), // Kanan (Cyan)
      new THREE.MeshPhysicalMaterial({ color: 0x1e40af, metalness: 0.8, roughness: 0.25 }), // Kiri (Navy)
      new THREE.MeshPhysicalMaterial({ color: 0x7dd3fc, metalness: 0.6, roughness: 0.15 }), // Atas (Sky light)
      new THREE.MeshPhysicalMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.35 }), // Bawah (Slate dark)
      new THREE.MeshPhysicalMaterial({ color: 0x2563eb, metalness: 0.75, roughness: 0.2 }), // Depan (Royal blue)
      new THREE.MeshPhysicalMaterial({ color: 0x1e3a8a, metalness: 0.85, roughness: 0.3 }), // Belakang (Deep blue)
    ];

    const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterials);
    cubeMesh.rotation.set(0.65, 0.78, 0.2); // Orientasi isometrik anggun
    rootGroup.add(cubeMesh);

    // Kawat wireframe kubus bercahaya (Glow Edge)
    const wireGeo = new THREE.EdgesGeometry(cubeGeometry);
    const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    cubeMesh.add(wireMesh);

    // 6. Cincin Orbit Telemetri (Holographic Audit Rings)
    const ringGeo1 = new THREE.TorusGeometry(2.8, 0.02, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2.3;
    rootGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(3.3, 0.015, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.3 });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 6;
    rootGroup.add(ring2);

    // 7. Partikel Aliran Transaksi 3D (Swarm Audit Nodes)
    const particleCount = 75;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colSafe = new THREE.Color(0x38bdf8); // Cyan safe
    const colAlert = new THREE.Color(0xf43f5e); // Rose leak
    const colNavy = new THREE.Color(0x1e40af); // Navy standard

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.4 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.9;

      particlePositions[i * 3] = radius * Math.cos(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi) * Math.sin(theta);

      // 80% safe/navy nodes, 20% alert leak nodes
      const isLeak = Math.random() < 0.2;
      const c = isLeak ? colAlert : Math.random() < 0.5 ? colSafe : colNavy;
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    rootGroup.add(particles);

    // 8. Interaktivitas & Fisika Drag / Parallax
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      setIsInteracting(true);
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevPointerX;
        const deltaY = e.clientY - prevPointerY;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;

        targetRotY += deltaX * 0.008;
        targetRotX += deltaY * 0.008;
        targetRotX = Math.max(-0.9, Math.min(0.9, targetRotX));
      } else {
        // Parallax kursor lembut saat hovering tanpa drag
        const rect = container.getBoundingClientRect();
        const normX = (e.clientX - rect.left) / rect.width - 0.5;
        const normY = (e.clientY - rect.top) / rect.height - 0.5;

        targetRotY = normX * 0.65;
        targetRotX = -normY * 0.5;
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
      setTimeout(() => setIsInteracting(false), 800);
    };

    const handlePointerLeave = () => {
      if (!isDragging) {
        targetRotX = 0;
        targetRotY = 0;
      }
    };

    // Tombol Reset Posisi
    resetRef.current = () => {
      targetRotX = 0;
      targetRotY = 0;
      currentRotX = 0;
      currentRotY = 0;
    };

    container.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("pointerleave", handlePointerLeave);

    // 9. Resize Observer
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight || 460;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    const ro = new ResizeObserver(() => handleResize());
    ro.observe(container);

    // 10. Pause rendering saat canvas berada di luar layar (Hemat Baterai & GPU)
    let isVisible = true;
    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    io.observe(container);

    // 11. Loop Render WebGL 60FPS
    let animId: number;
    let prevTime = performance.now();
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const now = performance.now();
      const delta = Math.min(0.1, (now - prevTime) / 1000);
      const elapsed = (now - startTime) / 1000;
      prevTime = now;

      // Rotasi kontinu anggun
      if (!isDragging) {
        targetRotY += delta * 0.18;
      }

      // Spring Damping lerp
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentRotY += (targetRotY - currentRotY) * 0.08;

      rootGroup.rotation.x = currentRotX;
      rootGroup.rotation.y = currentRotY;

      // Animasi orbit kubus mandiri di dalam perisai
      cubeMesh.rotation.x = 0.65 + Math.sin(elapsed * 1.2) * 0.15;
      cubeMesh.rotation.y = 0.78 + elapsed * 0.45;
      cubeMesh.position.y = Math.sin(elapsed * 1.8) * 0.08;

      // Rotasi cincin hologram
      ring1.rotation.z = elapsed * 0.3;
      ring2.rotation.z = -elapsed * 0.25;

      // Gelombang partikel audit
      particles.rotation.y = -elapsed * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    // 12. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      io.disconnect();
      container.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointerleave", handlePointerLeave);

      shieldGeometry.dispose();
      shieldMaterial.dispose();
      cubeGeometry.dispose();
      cubeMaterials.forEach((m) => m.dispose());
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] flex items-center justify-center select-none">
      {/* 3D Canvas Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing relative z-10 touch-none"
        title="Klik dan geser untuk memutar model 3D perisai logistik"
      />

      {/* Floating Interactive HUD Overlay */}
      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/90 text-[11px] font-semibold text-slate-700 shadow-xs">
          <Move3d className="w-3.5 h-3.5 text-[#1E40AF]" />
          <span>Interactive 3D Mesh</span>
        </div>

        <button
          onClick={() => resetRef.current && resetRef.current()}
          className="p-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/90 text-slate-600 hover:text-slate-900 shadow-xs hover:bg-white transition-all"
          title="Reset Sudut Pandang 3D"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Telemetry Micro-Pill (Status Model AI 3D) */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-white shadow-lg">
          <div className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
          <span className="text-[11px] font-mono tracking-wide text-slate-200">
            Audit Stream: <strong className="text-[#38BDF8]">78.181 Pesanan Terlindungi</strong>
          </span>
        </div>
      </div>

      {/* Petunjuk Interaksi Halus di Bawah Canvas */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 pointer-events-none hidden sm:block">
        <span className="text-[11px] text-slate-400 font-medium bg-white/70 px-2.5 py-1 rounded-full border border-slate-200/60 backdrop-blur-xs">
          🖱️ Geser mouse untuk memutar 360°
        </span>
      </div>
    </div>
  );
}
