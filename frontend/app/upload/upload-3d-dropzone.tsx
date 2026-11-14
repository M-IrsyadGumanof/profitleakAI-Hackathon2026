"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Upload3DDropzoneProps {
  isDragging?: boolean;
}

export function Upload3DDropzone({ isDragging = false }: Upload3DDropzoneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(isDragging);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 450;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    container.appendChild(renderer.domElement);

    // 2. Lighting System (Palet Opsi 2: Deep Navy, Ice Cyan, Specular White)
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 4.0); // Cyan Key Light
    dirLight1.position.set(5, 7, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x1e40af, 3.2); // Navy Fill Light
    dirLight2.position.set(-6, -4, 4);
    scene.add(dirLight2);

    const centerGlow = new THREE.PointLight(0x38bdf8, 2.5, 8);
    centerGlow.position.set(0, 0, 1.5);
    scene.add(centerGlow);

    // 3. Perisai di Latar Belakang (Diblur, Lebih Besar, Diam Menetap)
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
      depth: 0.3,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.1,
      bevelThickness: 0.1,
    });
    shieldGeometry.center();

    // Material Perisai Latar: Sedikit Transparan / Soft Depth (Diam Menetap)
    const shieldMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1e3a8a,
      metalness: 0.75,
      roughness: 0.55,
      transparent: true,
      opacity: 0.35, // Efek kabut / blur lembut di belakang kubus
      clearcoat: 0.5,
    });

    const shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shieldMesh.position.set(0, 0, -1.8); // Berada di latar belakang
    shieldMesh.scale.set(1.45, 1.45, 1.45);
    scene.add(shieldMesh);

    // 4. Kubus Logistik 3D di Tengah (Berada Agak ke Depan, Menjadi Tempat Upload)
    const cubeGroup = new THREE.Group();
    cubeGroup.position.set(0, 0, 0.85); // Maju ke depan mendekati kamera
    scene.add(cubeGroup);

    const cubeSize = 2.5; // Ukuran kubus disesuaikan sebagai wadah upload
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

    // Material permukaan kubus (Semi-transparan elegan ala wadah brankas data)
    const cubeMaterials = [
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.25, transparent: true, opacity: 0.85 }), // Kanan
      new THREE.MeshPhysicalMaterial({ color: 0x1e40af, metalness: 0.8, roughness: 0.3, transparent: true, opacity: 0.85 }),  // Kiri
      new THREE.MeshPhysicalMaterial({ color: 0x7dd3fc, metalness: 0.6, roughness: 0.2, transparent: true, opacity: 0.9 }),   // Atas (Permukaan Drop)
      new THREE.MeshPhysicalMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.4, transparent: true, opacity: 0.9 }),   // Bawah
      new THREE.MeshPhysicalMaterial({ color: 0x1e3a8a, metalness: 0.75, roughness: 0.25, transparent: true, opacity: 0.9 }), // Depan
      new THREE.MeshPhysicalMaterial({ color: 0x1e40af, metalness: 0.85, roughness: 0.35, transparent: true, opacity: 0.85 }), // Belakang
    ];

    const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterials);
    // Orientasi isometrik miring agar permukaan atas & depan menjadi panggung upload
    cubeMesh.rotation.set(0.24, 0.42, 0.08);
    cubeGroup.add(cubeMesh);

    // Glowing Wireframe Edges
    const wireGeo = new THREE.EdgesGeometry(cubeGeometry);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.75,
      linewidth: 2,
    });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    cubeMesh.add(wireMesh);

    // Cincin Telemetri Penanda Dropzone
    const ringGeo = new THREE.TorusGeometry(2.2, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.2;
    cubeGroup.add(ring);

    // 5. Partikel Data Masuk (Floating Data Swarm)
    const particleCount = 60;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colCyan = new THREE.Color(0x38bdf8);
    const colNavy = new THREE.Color(0x1e40af);
    const colWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.0 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.9;

      particlePositions[i * 3] = radius * Math.cos(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi) * Math.sin(theta);

      const c = Math.random() < 0.4 ? colCyan : Math.random() < 0.8 ? colNavy : colWhite;
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
      opacity: 0.8,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    cubeGroup.add(particles);

    // 6. Resize Handling
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 600;
      height = container.clientHeight || 450;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      // Responsif scale
      const isMobile = width < 640;
      const s = isMobile ? 0.78 : 1.0;
      cubeGroup.scale.set(s, s, s);
      shieldMesh.scale.set(1.45 * s, 1.45 * s, 1.45 * s);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // 7. Loop Animasi WebGL
    let animId: number;
    const startTime = performance.now();
    let currentScale = 1.0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const elapsed = (now - startTime) / 1000;

      // Reaksi interaktif terhadap drag-and-drop file
      const targetScale = isDraggingRef.current ? 1.08 : 1.0;
      currentScale += (targetScale - currentScale) * 0.1;
      cubeMesh.scale.set(currentScale, currentScale, currentScale);

      // Wireframe intensitas saat dragging
      wireMat.opacity = isDraggingRef.current ? 1.0 : 0.75;
      wireMat.color.set(isDraggingRef.current ? 0xffffff : 0x7dd3fc);
      centerGlow.intensity = isDraggingRef.current ? 4.5 : 2.5;

      // Animasi apung santai pada kubus (Breathing Float)
      cubeMesh.position.y = Math.sin(elapsed * 1.4) * 0.05;
      cubeMesh.rotation.y = 0.42 + Math.sin(elapsed * 0.6) * 0.08;

      // Cincin & Partikel
      ring.rotation.z = elapsed * 0.25;
      particles.rotation.y = elapsed * 0.15;

      // Perisai di belakang TETAP DIAM MENETAP (tidak ada rotasi)
      shieldMesh.rotation.set(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);

      shieldGeometry.dispose();
      shieldMaterial.dispose();
      cubeGeometry.dispose();
      cubeMaterials.forEach((m) => m.dispose());
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
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
      className="absolute inset-0 pointer-events-none select-none z-0 flex items-center justify-center overflow-hidden"
    />
  );
}
