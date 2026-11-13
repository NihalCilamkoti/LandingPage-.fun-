import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * EnthiosHub Playhouse — Interactive 3D Globe Background
 *
 * Visuals:
 * - Dotted 3D tech globe surface in Moss (#697C70) and Eucalyptus (#98AA9D)
 * - Delicate wireframe latitude/longitude rings
 * - Champagne Gold (#CBB57B) event summit beacons with pulsing radar halos
 * - Quadratic 3D connection data arcs spanning across summit nodes
 * - Smooth mouse hover parallax & fluid inertia rotation (lerp damping)
 * - Continuous slow auto-rotation for mobile and idle states
 * - Base Light Palette: Ivory/Cream (#F8F6F0 / #F2EFE2)
 * - Strictly pointer-events-none at z-0 behind content
 */
export const InteractiveGlobeBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    // 1. Scene & Canvas Palette
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f6f0);

    // Subtle atmospheric linear fog to blend distant elements smoothly
    scene.fog = new THREE.Fog(0xf8f6f0, 18, 48);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.5, 9.2);

    // 3. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      powerPreference: 'high-performance',
      alpha: true,
      stencil: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.4 : 1.8));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // 4. Color Palette Definitions (EnthiosHub Brand Light Theme)
    const colMoss = 0x697c70;
    const colEucalyptus = 0x98aa9d;
    const colDarkSlate = 0x2d3536;
    const colGold = 0xcbb57b;
    const colPlaster = 0xf2efe2;

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaf0, 1.6);
    dirLight.position.set(8, 14, 10);
    scene.add(dirLight);

    const goldPoint = new THREE.PointLight(colGold, 1.8, 20);
    goldPoint.position.set(-5, 3, 4);
    scene.add(goldPoint);

    // 6. Master Globe Group
    // Positioned slightly lower and centered to gracefully bridge hero copy & player record card
    const globeGroup = new THREE.Group();
    const globeRadius = isMobile ? 2.5 : 3.0;
    globeGroup.position.set(isMobile ? 0 : 0.8, isMobile ? -0.4 : -0.7, -1.8);
    scene.add(globeGroup);

    // A. Translucent Core Sphere (Occludes back dots for real 3D depth)
    const coreGeo = new THREE.SphereGeometry(globeRadius * 0.985, 36, 36);
    const coreMat = new THREE.MeshStandardMaterial({
      color: colPlaster,
      roughness: 0.85,
      metalness: 0.05,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // B. Dotted Globe Point Matrix (Sophisticated Tech Surface)
    const dotCount = isMobile ? 1800 : 3200;
    const dotPositions = new Float32Array(dotCount * 3);
    const dotColors = new Float32Array(dotCount * 3);

    const color1 = new THREE.Color(colMoss);
    const color2 = new THREE.Color(colEucalyptus);
    const colorGold = new THREE.Color(colGold);

    // Fibonacci sphere point distribution
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    for (let i = 0; i < dotCount; i++) {
      const y = 1 - (i / (dotCount - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      dotPositions[i * 3] = x * globeRadius;
      dotPositions[i * 3 + 1] = y * globeRadius;
      dotPositions[i * 3 + 2] = z * globeRadius;

      // Subtle color gradient across latitude and random accents
      const mixedColor = color1.clone().lerp(color2, (y + 1) * 0.5);
      if (Math.random() < 0.08) mixedColor.lerp(colorGold, 0.6);

      dotColors[i * 3] = mixedColor.r;
      dotColors[i * 3 + 1] = mixedColor.g;
      dotColors[i * 3 + 2] = mixedColor.b;
    }

    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
    dotGeo.setAttribute('color', new THREE.BufferAttribute(dotColors, 3));

    const dotMat = new THREE.PointsMaterial({
      size: isMobile ? 0.055 : 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
    });
    const dotCloud = new THREE.Points(dotGeo, dotMat);
    globeGroup.add(dotCloud);

    // C. Delicate Wireframe Latitude & Longitude Rings
    const wireGroup = new THREE.Group();
    const wireMat = new THREE.LineBasicMaterial({
      color: colEucalyptus,
      transparent: true,
      opacity: 0.22,
    });

    // Latitude Rings
    [-60, -30, 0, 30, 60].forEach((lat) => {
      const rad = (lat * Math.PI) / 180;
      const r = Math.cos(rad) * globeRadius;
      const y = Math.sin(rad) * globeRadius;
      const ringGeo = new THREE.BufferGeometry();
      const pts: THREE.Vector3[] = [];
      const segments = 48;
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
      }
      ringGeo.setFromPoints(pts);
      wireGroup.add(new THREE.Line(ringGeo, wireMat));
    });

    // Longitude Meridians
    [0, 45, 90, 135].forEach((lon) => {
      const ringGeo = new THREE.BufferGeometry();
      const pts: THREE.Vector3[] = [];
      const segments = 48;
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        const x = Math.sin(theta) * globeRadius;
        const y = Math.cos(theta) * globeRadius;
        pts.push(new THREE.Vector3(x, y, 0));
      }
      ringGeo.setFromPoints(pts);
      const meridian = new THREE.Line(ringGeo, wireMat);
      meridian.rotation.y = (lon * Math.PI) / 180;
      wireGroup.add(meridian);
    });
    globeGroup.add(wireGroup);

    // D. Outer Axial Gimbal Ring (Gold Accented Orbit)
    const gimbalGeo = new THREE.TorusGeometry(globeRadius * 1.14, 0.02, 12, 64);
    const gimbalMat = new THREE.MeshStandardMaterial({
      color: colGold,
      metalness: 0.75,
      roughness: 0.25,
      transparent: true,
      opacity: 0.55,
    });
    const gimbalRing = new THREE.Mesh(gimbalGeo, gimbalMat);
    gimbalRing.rotation.x = (23.5 * Math.PI) / 180; // Earth axial tilt
    globeGroup.add(gimbalRing);

    // E. Event Summit Beacons (Glowing nodes with expanding pulse halos)
    interface BeaconNode {
      mesh: THREE.Mesh;
      halo: THREE.Mesh;
      haloScale: number;
      lat: number;
      lon: number;
      pulseSpeed: number;
    }
    const beaconList: BeaconNode[] = [];
    const beaconGeo = new THREE.SphereGeometry(0.07, 12, 12);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: colGold,
      emissive: 0x9a8449,
      emissiveIntensity: 0.6,
      metalness: 0.8,
    });
    const haloGeo = new THREE.RingGeometry(0.08, 0.12, 18);
    const haloMat = new THREE.MeshBasicMaterial({
      color: colGold,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });

    // Curated summit locations (lat, lon degrees)
    const summitCoords = [
      { lat: 28.6, lon: 77.2 }, // New Delhi
      { lat: 12.9, lon: 77.6 }, // Bengaluru
      { lat: 37.7, lon: -122.4 }, // San Francisco
      { lat: 51.5, lon: -0.1 }, // London
      { lat: 1.35, lon: 103.8 }, // Singapore
      { lat: 35.6, lon: 139.6 }, // Tokyo
      { lat: -33.8, lon: 151.2 }, // Sydney
      { lat: 52.5, lon: 13.4 }, // Berlin
    ];

    const getVectorFromLatLon = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    const beaconVectors: THREE.Vector3[] = [];
    summitCoords.forEach((coord, idx) => {
      const pos = getVectorFromLatLon(coord.lat, coord.lon, globeRadius * 1.008);
      beaconVectors.push(pos);

      const bMesh = new THREE.Mesh(beaconGeo, beaconMat);
      bMesh.position.copy(pos);
      globeGroup.add(bMesh);

      const hMesh = new THREE.Mesh(haloGeo, haloMat.clone());
      hMesh.position.copy(pos);
      hMesh.lookAt(0, 0, 0); // Face normal outward
      globeGroup.add(hMesh);

      beaconList.push({
        mesh: bMesh,
        halo: hMesh,
        haloScale: 1.0 + (idx % 3) * 0.4,
        lat: coord.lat,
        lon: coord.lon,
        pulseSpeed: 1.2 + (idx % 4) * 0.3,
      });
    });

    // F. Great-Circle 3D Connection Arcs
    const arcConnections = [
      [0, 1], // New Delhi -> Bengaluru
      [0, 3], // New Delhi -> London
      [1, 4], // Bengaluru -> Singapore
      [4, 5], // Singapore -> Tokyo
      [2, 5], // SF -> Tokyo
      [3, 7], // London -> Berlin
    ];

    const arcMatGold = new THREE.LineBasicMaterial({
      color: colGold,
      transparent: true,
      opacity: 0.65,
    });
    const arcMatSage = new THREE.LineBasicMaterial({
      color: colMoss,
      transparent: true,
      opacity: 0.5,
    });

    arcConnections.forEach(([i1, i2], idx) => {
      const v1 = beaconVectors[i1];
      const v2 = beaconVectors[i2];
      const mid = v1.clone().add(v2).multiplyScalar(0.5);
      const dist = v1.distanceTo(v2);
      // Lift midpoint outward for arc height
      mid.normalize().multiplyScalar(globeRadius * (1.12 + dist * 0.04));

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const points = curve.getPoints(24);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcLine = new THREE.Line(arcGeo, idx % 2 === 0 ? arcMatGold : arcMatSage);
      globeGroup.add(arcLine);
    });

    // 7. Interactive Mouse Tracking & Parallax Interpolation
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0.15;
    let targetRotY = 0;
    let currentRotX = 0.15;
    let currentRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to [-1, 1]
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseX = nx;
      mouseY = ny;
      // Controlled tilt ranges
      targetRotX = 0.15 + ny * 0.35;
      targetRotY = nx * 0.55;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 8. Animation Loop (60 FPS locked, lerp damping)
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const dt = Math.min(clock.getDelta(), 0.05);

      if (!prefersReducedMotion) {
        // Continuous organic base rotation
        globeGroup.rotation.y += dt * 0.14;

        // Smooth fluid lerp damping on mouse interaction
        currentRotX = THREE.MathUtils.lerp(currentRotX, targetRotX, 0.045);
        currentRotY = THREE.MathUtils.lerp(currentRotY, targetRotY, 0.045);

        globeGroup.rotation.x = currentRotX;
        gimbalRing.rotation.z += dt * 0.08;

        // Animate beacon pulse rings
        beaconList.forEach((b) => {
          b.haloScale += dt * b.pulseSpeed;
          if (b.haloScale > 2.8) b.haloScale = 1.0;
          b.halo.scale.set(b.haloScale, b.haloScale, b.haloScale);
          const mat = b.halo.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, (2.8 - b.haloScale) / 1.8) * 0.65;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Three.js 3D Interactive Globe Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Subtle Bottom Fade to Guarantee Content Readability on Scroll */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#F8F6F0] via-[#F8F6F0]/60 to-transparent pointer-events-none" />
    </div>
  );
};

export default InteractiveGlobeBackground;

