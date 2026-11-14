"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Hero3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensi window/viewport penuh untuk sticky background
    let width = window.innerWidth;
    let height = window.innerHeight;

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
    renderer.toneMappingExposure = 1.25;

    container.appendChild(renderer.domElement);

    // 2. Lighting System (Corporate Titanium & Ice Specular)
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 3.8); // Ice Cyan key light
    dirLight1.position.set(6, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x1e40af, 3.0); // Deep Navy fill light
    dirLight2.position.set(-6, -5, 4);
    scene.add(dirLight2);

    const rimLight = new THREE.PointLight(0xffffff, 2.5, 15);
    rimLight.position.set(2, 4, 4);
    scene.add(rimLight);

    // 3. Root 3D Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Responsif: tempatkan di sebelah kanan pada desktop, di tengah atas pada mobile
    const updateLayout = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop) {
        rootGroup.position.set(2.4, 0.1, 0);
        rootGroup.scale.set(1.05, 1.05, 1.05);
      } else {
        rootGroup.position.set(0, 1.0, -1.0);
        rootGroup.scale.set(0.72, 0.72, 0.72);
      }
    };
    updateLayout();

    // 4. Geometri Perisai 3D (Clean Extrusion sesuai Logo Resmi)
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(0, 2.2);
    shieldShape.bezierCurveTo(0.9, 2.1, 1.9, 1.8, 2.0, 1.0);
    shieldShape.bezierCurveTo(2.05, -0.4, 1.3, -1.5, 0, -2.4);
    shieldShape.bezierCurveTo(-1.3, -1.5, -2.05, -0.4, -2.0, 1.0);
    shieldShape.bezierCurveTo(-1.9, 1.8, -0.9, 2.1, 0, 2.2);

    // Lubang tengah interlock
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
    
    // Material sisi-sisi kubus (Palet Opsi 2)
    const cubeMaterials = [
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.18 }), // Kanan (Cyan)
      new THREE.MeshPhysicalMaterial({ color: 0x1e40af, metalness: 0.8, roughness: 0.25 }), // Kiri (Navy)
      new THREE.MeshPhysicalMaterial({ color: 0x7dd3fc, metalness: 0.6, roughness: 0.15 }), // Atas (Sky)
      new THREE.MeshPhysicalMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.35 }), // Bawah (Slate)
      new THREE.MeshPhysicalMaterial({ color: 0x2563eb, metalness: 0.75, roughness: 0.2 }), // Depan (Royal)
      new THREE.MeshPhysicalMaterial({ color: 0x1e3a8a, metalness: 0.85, roughness: 0.3 }), // Belakang (Deep)
    ];

    const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterials);
    cubeMesh.rotation.set(0.65, 0.78, 0.2);
    rootGroup.add(cubeMesh);

    // Wireframe edge glow
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
    const particleCount = 80;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colSafe = new THREE.Color(0x38bdf8);
    const colAlert = new THREE.Color(0xf43f5e);
    const colNavy = new THREE.Color(0x1e40af);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.4 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.9;

      particlePositions[i * 3] = radius * Math.cos(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi) * Math.sin(theta);

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

    // 8. Interaktivitas: Drag, Mouse Parallax & Scroll Coupling
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let scrollRotY = 0;
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      // Hanya drag jika klik langsung pada background canvas
      if ((e.target as HTMLElement).tagName === "CANVAS") {
        isDragging = true;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevPointerX;
        const deltaY = e.clientY - prevPointerY;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;

        targetRotY += deltaX * 0.007;
        targetRotX += deltaY * 0.007;
        targetRotX = Math.max(-0.8, Math.min(0.8, targetRotX));
      } else {
        // Parallax kursor lembut di seluruh halaman
        const normX = e.clientX / window.innerWidth - 0.5;
        const normY = e.clientY / window.innerHeight - 0.5;

        targetRotY = normX * 0.55;
        targetRotX = -normY * 0.45;
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleScroll = () => {
      // Putar perisai perlahan saat halaman discroll ke bawah (Sticky Parallax)
      const scrollY = window.scrollY;
      scrollRotY = scrollY * 0.0016;
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("scroll", handleScroll, { passive: true });

    // 9. Resize Handling
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      updateLayout();
    };

    window.addEventListener("resize", handleResize);

    // 10. Loop Render WebGL 60FPS
    let animId: number;
    let prevTime = performance.now();
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min(0.1, (now - prevTime) / 1000);
      const elapsed = (now - startTime) / 1000;
      prevTime = now;

      // Rotasi kontinu anggun
      if (!isDragging) {
        targetRotY += delta * 0.16;
      }

      // Spring damping lerp
      currentRotX += (targetRotX - currentRotX) * 0.06;
      currentRotY += (targetRotY - currentRotY) * 0.06;

      rootGroup.rotation.x = currentRotX;
      rootGroup.rotation.y = currentRotY + scrollRotY;

      // Orbit kubus mandiri di dalam perisai
      cubeMesh.rotation.x = 0.65 + Math.sin(elapsed * 1.2) * 0.15;
      cubeMesh.rotation.y = 0.78 + elapsed * 0.45;
      cubeMesh.position.y = Math.sin(elapsed * 1.8) * 0.08;

      // Cincin hologram
      ring1.rotation.z = elapsed * 0.3;
      ring2.rotation.z = -elapsed * 0.25;

      // Partikel audit
      particles.rotation.y = -elapsed * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    // 11. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);

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
    // Sticky Background Penuh yang tidak bergeser saat di-scroll
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      <div
        ref={containerRef}
        className="w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
