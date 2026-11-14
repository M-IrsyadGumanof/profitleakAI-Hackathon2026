"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";

export function Global3DScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    container.appendChild(renderer.domElement);

    // 2. Lighting System
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 4.0); // Cyan Key Light
    dirLight1.position.set(5, 7, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x1e40af, 3.2); // Navy Fill Light
    dirLight2.position.set(-6, -4, 4);
    scene.add(dirLight2);

    const centerGlow = new THREE.PointLight(0x38bdf8, 2.0, 10);
    centerGlow.position.set(0, 0, 2);
    scene.add(centerGlow);

    // 3. Root 3D Group (Persisten, bertransisi mulus antar halaman)
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Subgroup Perisai
    const shieldGroup = new THREE.Group();
    rootGroup.add(shieldGroup);

    // Subgroup Kubus & Elemen Inti
    const cubeGroup = new THREE.Group();
    rootGroup.add(cubeGroup);

    // 4. Geometri Perisai 3D (Sesuai Logo Resmi)
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(0, 2.2);
    shieldShape.bezierCurveTo(0.9, 2.1, 1.9, 1.8, 2.0, 1.0);
    shieldShape.bezierCurveTo(2.05, -0.4, 1.3, -1.5, 0, -2.4);
    shieldShape.bezierCurveTo(-1.3, -1.5, -2.05, -0.4, -2.0, 1.0);
    shieldShape.bezierCurveTo(-1.9, 1.8, -0.9, 2.1, 0, 2.2);

    const holePath = new THREE.Path();
    holePath.moveTo(0, 1.7);
    holePath.bezierCurveTo(0.65, 1.6, 1.45, 1.35, 1.5, 0.75);
    holePath.bezierCurveTo(1.55, -0.3, 0.95, -1.15, 0, -1.85);
    holePath.bezierCurveTo(-0.95, -1.15, -1.55, -0.3, -1.5, 0.75);
    holePath.bezierCurveTo(-1.45, 1.35, -0.65, 1.6, 0, 1.7);
    shieldShape.holes.push(holePath);

    const shieldGeometry = new THREE.ExtrudeGeometry(shieldShape, {
      depth: 0.35,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.12,
      bevelThickness: 0.12,
    });
    shieldGeometry.center();

    const shieldMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1e3a8a,
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 0.9,
      clearcoatRoughness: 0.15,
      transparent: true,
      opacity: 1.0,
    });

    const shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shieldGroup.add(shieldMesh);

    // 5. Kubus Logistik 3D (Dapat membesar & berputar datar)
    // Sisi depan diperbesar proporsional agar menjadi platform upload yang pas
    const cubeWidth = 4.2;
    const cubeHeight = 2.8;
    const cubeDepth = 1.2;
    const cubeGeometry = new THREE.BoxGeometry(cubeWidth, cubeHeight, cubeDepth);

    const cubeMaterials = [
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.2, transparent: true, opacity: 0.9 }), // Kanan
      new THREE.MeshPhysicalMaterial({ color: 0x1e40af, metalness: 0.8, roughness: 0.25, transparent: true, opacity: 0.9 }), // Kiri
      new THREE.MeshPhysicalMaterial({ color: 0x7dd3fc, metalness: 0.6, roughness: 0.15, transparent: true, opacity: 0.92 }), // Atas
      new THREE.MeshPhysicalMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.35, transparent: true, opacity: 0.95 }), // Bawah
      new THREE.MeshPhysicalMaterial({ color: 0x0f224a, metalness: 0.85, roughness: 0.18, clearcoat: 0.95, clearcoatRoughness: 0.1, transparent: true, opacity: 0.95 }), // Depan (Permukaan Platform Upload)
      new THREE.MeshPhysicalMaterial({ color: 0x172554, metalness: 0.85, roughness: 0.3, transparent: true, opacity: 0.9 }), // Belakang
    ];

    const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterials);
    cubeGroup.add(cubeMesh);

    // Glowing Wireframe
    const wireGeo = new THREE.EdgesGeometry(cubeGeometry);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.85,
    });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    cubeMesh.add(wireMesh);

    // Cincin Orbit Telemetri
    const ringGeo1 = new THREE.TorusGeometry(2.6, 0.02, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2.3;
    cubeGroup.add(ring1);

    // Partikel Audit
    const particleCount = 65;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colSafe = new THREE.Color(0x38bdf8);
    const colAlert = new THREE.Color(0xf43f5e);
    const colNavy = new THREE.Color(0x1e40af);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.4 + Math.random() * 2.0;
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
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    cubeGroup.add(particles);

    // 6. Variabel State Interpolasi Mulus Antar Halaman
    let curPosX = 2.2;
    let curPosY = 0.05;
    let curPosZ = 0;
    let curScale = 1.0;

    let curShieldZ = 0;
    let curShieldScale = 1.0;
    let curShieldRotX = 0;
    let curShieldRotY = 0;
    let curShieldOpacity = 1.0;

    let curCubeZ = 0;
    let curCubeRotX = 0.65;
    let curCubeRotY = 0.78;
    let curCubeRotZ = 0.2;
    let curCubeScale = 0.65; // skala pada home (kubus proporsional di dalam perisai)

    let mouseNormX = 0;
    let mouseNormY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      mouseNormX = e.clientX / window.innerWidth - 0.5;
      mouseNormY = e.clientY / window.innerHeight - 0.5;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    // 7. Resize Handling
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    window.addEventListener("resize", handleResize);

    // 8. Render Loop WebGL 60FPS
    let animId: number;
    let prevTime = performance.now();
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min(0.1, (now - prevTime) / 1000);
      const elapsed = (now - startTime) / 1000;
      prevTime = now;

      const currentPath = pathnameRef.current;
      const isDesktop = window.innerWidth >= 1024;
      const scrollY = typeof window !== "undefined" ? window.scrollY : 0;

      // =========================================================================
      // Target Parameters Berdasarkan Halaman yang Aktif
      // =========================================================================
      let targetPosX = 0;
      let targetPosY = 0;
      let targetPosZ = 0;
      let targetScale = 1.0;

      let targetShieldZ = 0;
      let targetShieldScale = 1.0;
      let targetShieldRotX = 0;
      let targetShieldRotY = 0;
      let targetShieldOpacity = 1.0;

      let targetCubeZ = 0;
      let targetCubeRotX = 0;
      let targetCubeRotY = 0;
      let targetCubeRotZ = 0;
      let targetCubeScale = 0.65;

      if (currentPath === "/") {
        // --- MODE BERANDA (HOME) ---
        // Elemen berada di samping judul besar.
        // Saat di-scroll ke bawah, elemen naik ke atas bersama hero (scrollY offset) sehingga tetap berada di atas dan tidak ikut ke bawah!
        const scrollOffsetY = (scrollY / Math.max(1, height)) * 5.2;

        targetPosX = isDesktop ? 2.2 : 0;
        targetPosY = (isDesktop ? 0.05 : 0.85) + scrollOffsetY;
        targetPosZ = 0;
        targetScale = isDesktop ? 1.08 : 0.8;

        // Perisai aktif berotasi lembut & merespons kursor
        targetShieldZ = 0;
        targetShieldScale = 1.0;
        targetShieldRotX = -mouseNormY * 0.45;
        targetShieldRotY = mouseNormX * 0.55 + elapsed * 0.2;
        targetShieldOpacity = 1.0;

        // Kubus berada di dalam perisai, berotasi isometrik proporsional
        targetCubeZ = 0;
        targetCubeScale = 0.58;
        targetCubeRotX = 0.65 + Math.sin(elapsed * 1.2) * 0.15;
        targetCubeRotY = 0.78 + elapsed * 0.45;
        targetCubeRotZ = 0.2;
      } else if (currentPath === "/upload") {
        // --- MODE UNGGAH FILE (UPLOAD) ---
        // Elemen berpindah ke TENGAH LAYAR
        // Sinkronisasi posisi vertikal dengan scroll halaman upload
        const scrollOffsetUpload = (scrollY / Math.max(1, height)) * 5.0;

        targetPosX = 0;
        targetPosY = (isDesktop ? 0.38 : 0.32) + scrollOffsetUpload;
        targetPosZ = 0;
        targetScale = isDesktop ? 1.0 : 0.85;

        // Perisai: berada di belakang, agak diblur/redup, DIAM MENETAP (rotasi 0)
        targetShieldZ = -2.6;
        targetShieldScale = 1.6;
        targetShieldRotX = 0; // Diam menetap
        targetShieldRotY = 0; // Diam menetap
        targetShieldOpacity = 0.28; // Lembut / blur di background

        // Kubus: berada AGAK KEDEPAN, UKURAN DIPERBESAR, SEJAJAR PERMUKAAN DATAR TIDAK MENYERONG
        targetCubeZ = 1.35; // Maju ke depan
        targetCubeScale = 1.0; // Ukuran diperbesar pas untuk permukaan upload
        targetCubeRotX = 0; // Datar sejajar lurus ke depan
        targetCubeRotY = 0; // Tidak menyerong!
        targetCubeRotZ = 0;
      } else {
        // Halaman lain (seperti /dashboard): sembunyikan secara anggun
        targetScale = 0;
        targetShieldOpacity = 0;
      }

      // =========================================================================
      // Interpolasi Halus (Smooth Spring Damping)
      // =========================================================================
      const lerpSpeed = 0.065; // Transisi mulus sinematik

      curPosX += (targetPosX - curPosX) * lerpSpeed;
      curPosY += (targetPosY - curPosY) * lerpSpeed;
      curPosZ += (targetPosZ - curPosZ) * lerpSpeed;
      curScale += (targetScale - curScale) * lerpSpeed;

      rootGroup.position.set(curPosX, curPosY, curPosZ);
      rootGroup.scale.set(curScale, curScale, curScale);

      // Perisai interpolasi
      curShieldZ += (targetShieldZ - curShieldZ) * lerpSpeed;
      curShieldScale += (targetShieldScale - curShieldScale) * lerpSpeed;
      curShieldRotX += (targetShieldRotX - curShieldRotX) * lerpSpeed;
      curShieldRotY += (targetShieldRotY - curShieldRotY) * lerpSpeed;
      curShieldOpacity += (targetShieldOpacity - curShieldOpacity) * lerpSpeed;

      shieldGroup.position.z = curShieldZ;
      shieldGroup.scale.set(curShieldScale, curShieldScale, curShieldScale);
      shieldGroup.rotation.set(curShieldRotX, curShieldRotY, 0);
      shieldMaterial.opacity = curShieldOpacity;
      shieldMaterial.roughness = THREE.MathUtils.lerp(0.22, 0.65, 1 - curShieldOpacity);

      // Kubus interpolasi
      curCubeZ += (targetCubeZ - curCubeZ) * lerpSpeed;
      curCubeScale += (targetCubeScale - curCubeScale) * lerpSpeed;
      curCubeRotX += (targetCubeRotX - curCubeRotX) * lerpSpeed;
      curCubeRotY += (targetCubeRotY - curCubeRotY) * lerpSpeed;
      curCubeRotZ += (targetCubeRotZ - curCubeRotZ) * lerpSpeed;

      cubeGroup.position.z = curCubeZ;
      cubeGroup.scale.set(curCubeScale, curCubeScale, curCubeScale);
      cubeMesh.rotation.set(curCubeRotX, curCubeRotY, curCubeRotZ);

      // Floating breathing mikro saat di upload
      if (currentPath === "/upload") {
        cubeGroup.position.y = Math.sin(elapsed * 1.6) * 0.03;
      } else {
        cubeGroup.position.y = Math.sin(elapsed * 1.8) * 0.08;
      }

      // Cincin & Partikel rotasi
      ring1.rotation.z = elapsed * 0.25;
      particles.rotation.y = elapsed * 0.1;

      // Sembunyikan render jika scale mendekati 0
      if (curScale > 0.01) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);

      shieldGeometry.dispose();
      shieldMaterial.dispose();
      cubeGeometry.dispose();
      cubeMaterials.forEach((m) => m.dispose());
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden"
    />
  );
}
