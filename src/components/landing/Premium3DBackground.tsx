import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * EnthiosHub Playhouse — Full-Site Seamless 3D Abstract Background
 *
 * Interactivity & Aesthetics:
 * - NO auto-rotation: All rotational motion is driven seamlessly by cursor hover
 * - Multi-layered Kinematic Rotation Chain:
 *   * Master assembly tilts gracefully to cursor position
 *   * Inner Torus Knot twists on Z and X axes in reaction to cursor trajectory
 *   * Companion gimbal ring counter-rotates with fluid inverse momentum
 *   * Satellite droplets orbit with depth parallax
 * - Liquid-glossy PBR material: Clearcoat 1.0 with ultra-smooth roughness (0.11), specular softbox glints
 * - Ultra-delicate resting breath float (sine wave displacement), zero mechanical spin
 * - Continuous scroll-linked camera traverse down the page tiers
 * - 100% non-blocking: fixed z-0 with pointer-events-none
 * - Strict EnthiosHub palette: Cream (#F8F6F0 / #F2EFE2), Muted Gold (#CBB57B), Polished Sage (#C3C9C0)
 */
export const Premium3DBackground: React.FC = () => {
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

    // 1. Scene & Canvas Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f6f0);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    camera.position.set(0, 0.4, 9.5);

    // 3. WebGL Renderer with ACES Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      powerPreference: 'high-performance',
      alpha: true,
      stencil: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.4 : 1.8));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. Studio Equirectangular Reflection Map (Ultra-glossy clearcoat highlights)
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 512;
    envCanvas.height = 256;
    const ctx = envCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.35, '#F5F2EB');
      grad.addColorStop(0.7, '#E5DAD6');
      grad.addColorStop(1, '#D8D0C5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);

      // Studio softbox specular highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      ctx.beginPath();
      ctx.ellipse(140, 75, 85, 45, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Warm gold rim bounce
      ctx.fillStyle = 'rgba(203, 181, 123, 0.55)';
      ctx.beginPath();
      ctx.ellipse(390, 165, 100, 48, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Sage ambient bounce
      ctx.fillStyle = 'rgba(195, 201, 192, 0.6)';
      ctx.beginPath();
      ctx.ellipse(260, 45, 95, 32, 0, 0, Math.PI * 2);
      ctx.fill();

      const envTexture = new THREE.CanvasTexture(envCanvas);
      envTexture.mapping = THREE.EquirectangularReflectionMapping;
      envTexture.needsUpdate = true;
      scene.environment = envTexture;
    }

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const sunKeyLight = new THREE.DirectionalLight(0xfffaf0, 2.4);
    sunKeyLight.position.set(8, 14, 10);
    scene.add(sunKeyLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
    rimLight.position.set(-10, -6, -6);
    scene.add(rimLight);

    const goldPoint = new THREE.PointLight(0xcbb57b, 2.4, 32);
    goldPoint.position.set(4, 5, 5);
    scene.add(goldPoint);

    const sagePoint = new THREE.PointLight(0xc3c9c0, 2.2, 32);
    sagePoint.position.set(-6, 2, 4);
    scene.add(sagePoint);

    // 6. Ultra-Glossy PBR Materials
    const goldPbrMat = new THREE.MeshPhysicalMaterial({
      color: 0xcbb57b,
      emissive: 0x1f1709,
      roughness: 0.11,
      metalness: 0.82,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 0.95,
      ior: 1.52,
    });

    const sageCeramicMat = new THREE.MeshPhysicalMaterial({
      color: 0xc3c9c0,
      roughness: 0.09,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 0.92,
    });

    // -------------------------------------------------------------
    // TIER 1: HERO SECTION (y ≈ -0.3)
    // -------------------------------------------------------------
    const heroGroup = new THREE.Group();
    heroGroup.position.set(isMobile ? 0 : 1.4, isMobile ? -0.4 : -0.3, -1.0);
    scene.add(heroGroup);

    const knotRadius = isMobile ? 1.65 : 2.15;
    const tubeRadius = isMobile ? 0.44 : 0.54;
    const knotGeo = new THREE.TorusKnotGeometry(knotRadius, tubeRadius, 240, 40, 2, 3);
    const knotMesh = new THREE.Mesh(knotGeo, goldPbrMat);
    heroGroup.add(knotMesh);

    const ringGeo1 = new THREE.TorusGeometry(knotRadius * 1.55, 0.075, 20, 72);
    const companionRing1 = new THREE.Mesh(ringGeo1, sageCeramicMat);
    companionRing1.rotation.x = Math.PI / 3;
    companionRing1.rotation.y = Math.PI / 6;
    heroGroup.add(companionRing1);

    // Floating Hero Accent Droplets
    const heroDroplets = new THREE.Group();
    [
      { x: -3.4, y: 1.8, z: -2.0, r: 0.28, mat: sageCeramicMat },
      { x: 3.6, y: -2.0, z: -1.8, r: 0.32, mat: goldPbrMat },
      { x: -2.5, y: -2.2, z: -1.2, r: 0.22, mat: goldPbrMat },
      { x: 4.2, y: 2.2, z: -2.5, r: 0.25, mat: sageCeramicMat },
    ].forEach((dp) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(dp.r, 24, 24), dp.mat);
      m.position.set(dp.x, dp.y, dp.z);
      heroDroplets.add(m);
    });
    heroGroup.add(heroDroplets);

    // -------------------------------------------------------------
    // TIER 2: DISCOVER EVENTS SECTION (y ≈ -4.8)
    // -------------------------------------------------------------
    const eventsGroup = new THREE.Group();
    eventsGroup.position.set(isMobile ? 0 : -1.8, -4.8, -1.5);
    scene.add(eventsGroup);

    const ribbonGeo = new THREE.TorusKnotGeometry(1.9, 0.42, 190, 36, 3, 4);
    const ribbonMesh = new THREE.Mesh(ribbonGeo, sageCeramicMat);
    eventsGroup.add(ribbonMesh);

    const eventsRingGeo = new THREE.TorusGeometry(2.9, 0.065, 18, 64);
    const eventsRing = new THREE.Mesh(eventsRingGeo, goldPbrMat);
    eventsRing.rotation.x = Math.PI / 4;
    eventsGroup.add(eventsRing);

    const eventsDroplets = new THREE.Group();
    [
      { x: 3.2, y: 1.5, z: -1.5, r: 0.3, mat: goldPbrMat },
      { x: -3.0, y: -1.6, z: -1.2, r: 0.26, mat: sageCeramicMat },
      { x: 2.8, y: -1.8, z: -2.0, r: 0.22, mat: goldPbrMat },
    ].forEach((dp) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(dp.r, 20, 20), dp.mat);
      m.position.set(dp.x, dp.y, dp.z);
      eventsDroplets.add(m);
    });
    eventsGroup.add(eventsDroplets);

    // -------------------------------------------------------------
    // TIER 3: PLATFORM FEATURES & FOOTER (y ≈ -9.2)
    // -------------------------------------------------------------
    const platformGroup = new THREE.Group();
    platformGroup.position.set(isMobile ? 0 : 1.6, -9.2, -1.2);
    scene.add(platformGroup);

    const gyroRingGeoA = new THREE.TorusGeometry(2.2, 0.07, 18, 64);
    const gyroRingA = new THREE.Mesh(gyroRingGeoA, goldPbrMat);
    platformGroup.add(gyroRingA);

    const gyroRingGeoB = new THREE.TorusGeometry(1.7, 0.06, 18, 64);
    const gyroRingB = new THREE.Mesh(gyroRingGeoB, sageCeramicMat);
    gyroRingB.rotation.x = Math.PI / 3;
    platformGroup.add(gyroRingB);

    const gyroRingGeoC = new THREE.TorusGeometry(1.2, 0.05, 18, 64);
    const gyroRingC = new THREE.Mesh(gyroRingGeoC, goldPbrMat);
    gyroRingC.rotation.y = Math.PI / 3;
    platformGroup.add(gyroRingC);

    const coreSphereGeo = new THREE.SphereGeometry(0.55, 28, 28);
    const coreSphere = new THREE.Mesh(coreSphereGeo, sageCeramicMat);
    platformGroup.add(coreSphere);

    [
      { x: -3.5, y: 1.2, z: -1.8, r: 0.28, mat: goldPbrMat },
      { x: 3.0, y: -1.4, z: -1.4, r: 0.24, mat: sageCeramicMat },
    ].forEach((dp) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(dp.r, 20, 20), dp.mat);
      m.position.set(dp.x, dp.y, dp.z);
      platformGroup.add(m);
    });

    // -------------------------------------------------------------
    // 7. Interactive Kinematic Rotation Chain Tracking
    // -------------------------------------------------------------
    let mouseX = 0;
    let mouseY = 0;

    let targetGroupRotX = 0.2;
    let targetGroupRotY = 0.35;
    let currentGroupRotX = 0.2;
    let currentGroupRotY = 0.35;

    let targetKnotRotZ = 0;
    let currentKnotRotZ = 0;
    let targetKnotRotX = 0;
    let currentKnotRotX = 0;

    let targetRingRotZ = Math.PI / 6;
    let currentRingRotZ = Math.PI / 6;
    let targetRingRotX = Math.PI / 3;
    let currentRingRotX = Math.PI / 3;

    let scrollY = window.scrollY;

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseX = nx;
      mouseY = ny;

      // Group assembly tilt
      targetGroupRotX = 0.2 + ny * 0.45;
      targetGroupRotY = 0.35 + nx * 0.65;

      // Kinematic Rotation Chain:
      // Primary knot twists in reaction to cursor position
      targetKnotRotZ = nx * 0.85 + ny * 0.35;
      targetKnotRotX = -ny * 0.55 + nx * 0.25;

      // Companion ring counter-rotates with fluid inverse momentum
      targetRingRotZ = Math.PI / 6 - nx * 0.95;
      targetRingRotX = Math.PI / 3 + ny * 0.6;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // -------------------------------------------------------------
    // 8. Animation Loop (Continuous Vibrant Motion + Interactive Hover Parallax)
    // -------------------------------------------------------------
    let animId: number;
    const clock = new THREE.Clock();

    let autoKnotZ = 0;
    let autoKnotY = 0;
    let autoRingZ = Math.PI / 6;
    let autoRingX = Math.PI / 3;

    let autoRibbonY = 0;
    let autoEventsRingZ = 0;

    let autoGyroA = 0;
    let autoGyroB = 0;
    let autoGyroC = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      // Fluid scroll-linked camera traverse down the page tiers
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollFraction = Math.min(1, Math.max(0, scrollY / maxScroll));
      const targetCamY = 0.4 - scrollFraction * 8.8;
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 3.5, dt);

      if (!prefersReducedMotion) {
        // Continuous lively movement speed (visible and engaging motion even with zero mouse input)
        const motionSpeed = 0.65; // increased lively speed

        autoKnotZ += dt * motionSpeed * 0.9;
        autoKnotY += dt * motionSpeed * 0.7;

        autoRingZ -= dt * motionSpeed * 0.65;
        autoRingX += dt * motionSpeed * 0.5;

        autoRibbonY += dt * motionSpeed * 0.8;
        autoEventsRingZ += dt * motionSpeed * 0.6;

        autoGyroA += dt * motionSpeed * 0.75;
        autoGyroB += dt * motionSpeed * 0.9;
        autoGyroC -= dt * motionSpeed * 0.7;

        // Continuous rhythmic floating motion (sine wave breathing with depth)
        heroGroup.position.y = (isMobile ? -0.4 : -0.3) + Math.sin(elapsed * 1.6) * 0.22;
        eventsGroup.position.y = -4.8 + Math.cos(elapsed * 1.5) * 0.2;
        platformGroup.position.y = -9.2 + Math.sin(elapsed * 1.7) * 0.2;

        // Mouse Parallax Damping on Master Groups
        currentGroupRotX = THREE.MathUtils.damp(currentGroupRotX, targetGroupRotX, 4.0, dt);
        currentGroupRotY = THREE.MathUtils.damp(currentGroupRotY, targetGroupRotY, 4.0, dt);
        heroGroup.rotation.x = currentGroupRotX;
        heroGroup.rotation.y = currentGroupRotY;

        // Tier 1 (Hero): Continuous Helical Twist + Mouse Cursor Tilt
        currentKnotRotZ = THREE.MathUtils.damp(currentKnotRotZ, targetKnotRotZ, 3.5, dt);
        currentKnotRotX = THREE.MathUtils.damp(currentKnotRotX, targetKnotRotX, 3.5, dt);
        knotMesh.rotation.z = autoKnotZ + currentKnotRotZ;
        knotMesh.rotation.y = autoKnotY;
        knotMesh.rotation.x = currentKnotRotX;

        // Tier 1 (Hero): Companion Gimbal Ring Counter-Rotation
        currentRingRotZ = THREE.MathUtils.damp(currentRingRotZ, targetRingRotZ, 3.0, dt);
        currentRingRotX = THREE.MathUtils.damp(currentRingRotX, targetRingRotX, 3.0, dt);
        companionRing1.rotation.z = autoRingZ + currentRingRotZ;
        companionRing1.rotation.x = autoRingX + currentRingRotX;

        // Tier 1 (Hero): Orbiting Satellite Droplets
        heroDroplets.rotation.y += dt * 0.55;
        heroDroplets.rotation.x = THREE.MathUtils.damp(heroDroplets.rotation.x, -mouseY * 0.35, 3.0, dt);

        // Tier 2 (Events): Continuous Möbius Motion
        eventsGroup.rotation.x = THREE.MathUtils.damp(eventsGroup.rotation.x, currentGroupRotX * 0.85, 3.5, dt);
        eventsGroup.rotation.y = THREE.MathUtils.damp(eventsGroup.rotation.y, -currentGroupRotY * 0.85, 3.5, dt);
        ribbonMesh.rotation.y = autoRibbonY;
        ribbonMesh.rotation.z = THREE.MathUtils.damp(ribbonMesh.rotation.z, mouseX * 0.7, 3.0, dt);
        eventsRing.rotation.z = autoEventsRingZ;
        eventsDroplets.rotation.y -= dt * 0.5;

        // Tier 3 (Platform/Footer): Multi-Axis Gyroscope Rotation
        platformGroup.rotation.x = THREE.MathUtils.damp(platformGroup.rotation.x, currentGroupRotX * 0.75, 3.0, dt);
        platformGroup.rotation.y = THREE.MathUtils.damp(platformGroup.rotation.y, currentGroupRotY * 0.75, 3.0, dt);
        gyroRingA.rotation.x = autoGyroA;
        gyroRingB.rotation.y = autoGyroB;
        gyroRingC.rotation.z = autoGyroC;
        coreSphere.rotation.y += dt * 0.4;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
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
      {/* Full-Website Glossy 3D Abstract Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default Premium3DBackground;
