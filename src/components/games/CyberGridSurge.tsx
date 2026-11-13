import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  Shield,
  Zap,
  Heart,
  Trophy,
  Coins,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  playClickSound,
  playCollectCoinSound,
  playPowerupSound,
  playCrashSound,
  playShieldAbsorbSound,
  playGameOverSound,
  playWinSound,
  isSoundMuted,
  toggleSoundMute,
} from '../../utils/sound';
import { recordGameSession, loadPlayerStats } from '../../utils/storage';

interface CyberGridSurgeProps {
  onClose: () => void;
  onNextGame: () => void;
}

export const CyberGridSurge: React.FC<CyberGridSurgeProps> = ({ onClose, onNextGame }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const gameStateRef = useRef<'ready' | 'playing' | 'paused' | 'gameover'>('ready');
  const [hudState, setHudState] = useState<'ready' | 'playing' | 'paused' | 'gameover'>('ready');
  const [score, setScore] = useState(0);
  const [packetsCollected, setPacketsCollected] = useState(0);
  const [lives, setLives] = useState(3);
  const [bestScore, setBestScore] = useState(0);
  const [overclockActive, setOverclockActive] = useState(false);
  const [muted, setMuted] = useState(isSoundMuted());

  const engineRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    shipGroup: THREE.Group;
    shieldMesh: THREE.Mesh;
    gridLines: THREE.LineSegments[];
    targetX: number;
    targetY: number;
    posX: number;
    posY: number;
    speed: number;
    distance: number;
    score: number;
    packets: number;
    lives: number;
    hasShield: boolean;
    overclockTimer: number;
    invincibleTimer: number;
    obstacles: Array<{
      mesh: THREE.Group;
      openSlot: 'left' | 'center' | 'right';
      passed: boolean;
    }>;
    pickups: Array<{
      mesh: THREE.Group;
      type: 'bandwidth' | 'key' | 'overclock' | 'shield';
      value: number;
      collected: boolean;
    }>;
    clock: THREE.Clock;
    animId: number | null;
  } | null>(null);

  const keysDownRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const stats = loadPlayerStats();
    setBestScore(stats.highScores.surge || 0);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const moveShip = useCallback((dx: number, dy: number) => {
    if (!engineRef.current || gameStateRef.current !== 'playing') return;
    const engine = engineRef.current;
    engine.targetX = Math.max(-3.5, Math.min(3.5, engine.targetX + dx));
    engine.targetY = Math.max(0.6, Math.min(3.5, engine.targetY + dy));
  }, []);

  // Keyboard navigation strictly via Arrow Keys & WASD
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (gameStateRef.current === 'ready' && (e.code === 'Space' || e.code === 'Enter')) {
        startGame();
        return;
      }
      keysDownRef.current[e.code] = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      delete keysDownRef.current[e.code];
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Spawn Firewall Barrier with 1 clear opening
  const spawnFirewallGate = (scene: THREE.Scene, obstacles: Array<any>, zPos: number) => {
    const slots: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
    const openSlot = slots[Math.floor(Math.random() * slots.length)];

    const group = new THREE.Group();
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });

    // 3 sectors: Left (-2.5), Center (0), Right (+2.5)
    [-2.5, 0, 2.5].forEach((x, idx) => {
      const slotName = slots[idx];
      if (slotName !== openSlot) {
        const wallGeo = new THREE.BoxGeometry(2.2, 3.2, 0.3);
        const wall = new THREE.Mesh(wallGeo, beamMat);
        wall.position.set(x, 1.8, 0);
        group.add(wall);
      } else {
        // Open clearance arch
        const archGeo = new THREE.BoxGeometry(2.4, 0.4, 0.3);
        const archMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.7,
        });
        const arch = new THREE.Mesh(archGeo, archMat);
        arch.position.set(x, 3.4, 0);
        group.add(arch);
      }
    });

    group.position.set(0, 0, zPos);
    scene.add(group);
    obstacles.push({
      mesh: group,
      openSlot,
      passed: false,
    });
  };

  const spawnPickup = (scene: THREE.Scene, pickups: Array<any>, zPos: number) => {
    const xs = [-2.5, 0, 2.5];
    const x = xs[Math.floor(Math.random() * xs.length)];
    const y = 1.0 + Math.random() * 1.8;

    const roll = Math.random();
    let type: 'bandwidth' | 'key' | 'overclock' | 'shield' = 'bandwidth';
    let value = 25;

    if (roll < 0.65) {
      type = 'bandwidth';
      value = 25;
    } else if (roll < 0.85) {
      type = 'key';
      value = 100;
    } else if (roll < 0.93) {
      type = 'overclock';
      value = 50;
    } else {
      type = 'shield';
      value = 20;
    }

    const group = new THREE.Group();

    if (type === 'bandwidth') {
      const geo = new THREE.SphereGeometry(0.35, 12, 12);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.8,
      });
      group.add(new THREE.Mesh(geo, mat));
    } else if (type === 'key') {
      const geo = new THREE.OctahedronGeometry(0.38);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xcbb57b,
        emissive: 0x9a8449,
        emissiveIntensity: 0.8,
      });
      group.add(new THREE.Mesh(geo, mat));
    } else if (type === 'overclock') {
      const geo = new THREE.TorusGeometry(0.32, 0.1, 8, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.8,
      });
      group.add(new THREE.Mesh(geo, mat));
    } else {
      const geo = new THREE.IcosahedronGeometry(0.35, 1);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.7,
      });
      group.add(new THREE.Mesh(geo, mat));
    }

    group.position.set(x, y, zPos);
    scene.add(group);
    pickups.push({ mesh: group, type, value, collected: false });
  };

  const startGame = () => {
    playClickSound();
    if (!engineRef.current) return;
    const engine = engineRef.current;

    engine.targetX = 0;
    engine.targetY = 1.8;
    engine.posX = 0;
    engine.posY = 1.8;
    engine.speed = 28;
    engine.distance = 0;
    engine.score = 0;
    engine.packets = 0;
    engine.lives = 3;
    engine.hasShield = false;
    engine.overclockTimer = 0;
    engine.invincibleTimer = 0;

    engine.obstacles.forEach((o) => engine.scene.remove(o.mesh));
    engine.obstacles = [];
    engine.pickups.forEach((p) => engine.scene.remove(p.mesh));
    engine.pickups = [];

    // Prepopulate
    for (let z = -25; z > -150; z -= 20) {
      if (Math.random() < 0.7) spawnFirewallGate(engine.scene, engine.obstacles, z);
      if (Math.random() < 0.8) spawnPickup(engine.scene, engine.pickups, z - 6);
    }

    setScore(0);
    setPacketsCollected(0);
    setLives(3);
    setOverclockActive(false);

    gameStateRef.current = 'playing';
    setHudState('playing');
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Calm Warm Ivory Scene (Zero spinning vortex rings!)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f6f0);
    scene.fog = new THREE.FogExp2(0xf8f6f0, 0.015);

    // Stable perspective camera
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    camera.position.set(0, 3.4, 7.0);
    camera.lookAt(0, 1.8, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe8e2d5, 1.8);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaf0, 1.8);
    dirLight.position.set(5, 15, 10);
    scene.add(dirLight);

    // Flat Cyber Matrix Floor (Non-spinning, peaceful forward motion)
    const gridHelper = new THREE.GridHelper(100, 50, 0xcbb57b, 0xdcd4c5);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Glider Model: Sleek, high-contrast, beautiful
    const shipGroup = new THREE.Group();
    const shipGeo = new THREE.ConeGeometry(0.7, 1.6, 4);
    const shipMat = new THREE.MeshStandardMaterial({
      color: 0x1e281c,
      roughness: 0.3,
      metalness: 0.7,
    });
    const shipMesh = new THREE.Mesh(shipGeo, shipMat);
    shipMesh.rotation.x = Math.PI / 2;
    shipGroup.add(shipMesh);

    const wingGeo = new THREE.BoxGeometry(2.4, 0.08, 0.6);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xcbb57b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, 0, 0.2);
    shipGroup.add(wings);

    const coreGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.9,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, 0.2, 0.1);
    shipGroup.add(coreMesh);

    const shieldGeo = new THREE.SphereGeometry(1.4, 16, 16);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0,
      wireframe: true,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shipGroup.add(shieldMesh);

    shipGroup.position.set(0, 1.8, 0);
    scene.add(shipGroup);

    engineRef.current = {
      scene,
      camera,
      renderer,
      shipGroup,
      shieldMesh,
      gridLines: [],
      targetX: 0,
      targetY: 1.8,
      posX: 0,
      posY: 1.8,
      speed: 28,
      distance: 0,
      score: 0,
      packets: 0,
      lives: 3,
      hasShield: false,
      overclockTimer: 0,
      invincibleTimer: 0,
      obstacles: [],
      pickups: [],
      clock: new THREE.Clock(),
      animId: null,
    };

    let spawnTimer = 0;
    let hudCounter = 0;

    const animate = () => {
      engineRef.current!.animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const engine = engineRef.current;
      if (!engine) return;

      const dt = Math.min(engine.clock.getDelta(), 0.05);

      if (gameStateRef.current === 'playing') {
        const isOverclock = engine.overclockTimer > 0;
        const currentSpeed = engine.speed * (isOverclock ? 1.4 : 1.0);

        // Process Keyboard steering (Arrow Keys & WASD only)
        const moveSpeedX = 14;
        const moveSpeedY = 10;
        const keys = keysDownRef.current;
        if (keys['ArrowLeft'] || keys['KeyA']) {
          engine.targetX = Math.max(-3.5, engine.targetX - moveSpeedX * dt);
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
          engine.targetX = Math.min(3.5, engine.targetX + moveSpeedX * dt);
        }
        if (keys['ArrowUp'] || keys['KeyW']) {
          engine.targetY = Math.min(3.5, engine.targetY + moveSpeedY * dt);
        }
        if (keys['ArrowDown'] || keys['KeyS']) {
          engine.targetY = Math.max(0.6, engine.targetY - moveSpeedY * dt);
        }

        engine.distance += currentSpeed * dt;
        engine.score += Math.floor(dt * 50 * (isOverclock ? 2 : 1));
        engine.speed = Math.min(48, engine.speed + dt * 0.2);

        if (engine.overclockTimer > 0) engine.overclockTimer = Math.max(0, engine.overclockTimer - dt);
        if (engine.invincibleTimer > 0) engine.invincibleTimer = Math.max(0, engine.invincibleTimer - dt);

        // Move floor grid smoothly forward
        gridHelper.position.z += currentSpeed * dt;
        if (gridHelper.position.z > 2) gridHelper.position.z -= 2;

        // Smooth ship positioning
        engine.posX += (engine.targetX - engine.posX) * 0.2;
        engine.posY += (engine.targetY - engine.posY) * 0.2;
        engine.shipGroup.position.set(engine.posX, engine.posY, 0);

        const vx = engine.targetX - engine.posX;
        engine.shipGroup.rotation.z = -vx * 0.25;

        // Shield
        const sMat = engine.shieldMesh.material as THREE.MeshStandardMaterial;
        sMat.opacity = engine.hasShield ? 0.5 : 0;
        if (engine.hasShield) engine.shieldMesh.rotation.y += dt * 3;

        // Spawn gates
        spawnTimer += currentSpeed * dt;
        if (spawnTimer > 20) {
          spawnTimer = 0;
          const spawnZ = -120;
          if (Math.random() < 0.75) spawnFirewallGate(scene, engine.obstacles, spawnZ);
          if (Math.random() < 0.8) spawnPickup(scene, engine.pickups, spawnZ - 5);
        }

        // Collision Check for Gate Openings
        for (let i = engine.obstacles.length - 1; i >= 0; i--) {
          const obs = engine.obstacles[i];
          obs.mesh.position.z += currentSpeed * dt;

          const distZ = Math.abs(obs.mesh.position.z - engine.shipGroup.position.z);

          if (distZ < 0.9 && !obs.passed) {
            // Determine player sector
            let playerSector: 'left' | 'center' | 'right' = 'center';
            if (engine.posX < -1.2) playerSector = 'left';
            else if (engine.posX > 1.2) playerSector = 'right';

            // If player is NOT in the open slot, collision occurs!
            if (playerSector !== obs.openSlot) {
              obs.passed = true;

              if (engine.hasShield) {
                engine.hasShield = false;
                playShieldAbsorbSound();
                scene.remove(obs.mesh);
                engine.obstacles.splice(i, 1);
                continue;
              } else if (engine.invincibleTimer <= 0) {
                engine.lives -= 1;
                engine.invincibleTimer = 1.8;
                playCrashSound();
                setLives(engine.lives);

                if (engine.lives <= 0) {
                  playGameOverSound();
                  gameStateRef.current = 'gameover';
                  setHudState('gameover');
                  const stats = recordGameSession('surge', engine.score, engine.packets);
                  setBestScore(stats.highScores.surge);
                  break;
                }
              }
            } else {
              // Successfully flew through the open slot!
              obs.passed = true;
              playWinSound();
              engine.score += 75;
            }
          }

          if (obs.mesh.position.z > 15) {
            scene.remove(obs.mesh);
            engine.obstacles.splice(i, 1);
          }
        }

        // Pickups
        for (let i = engine.pickups.length - 1; i >= 0; i--) {
          const p = engine.pickups[i];
          p.mesh.position.z += currentSpeed * dt;
          p.mesh.rotation.y += dt * 3.0;

          const distZ = Math.abs(p.mesh.position.z - engine.shipGroup.position.z);
          const dx = Math.abs(p.mesh.position.x - engine.shipGroup.position.x);
          const dy = Math.abs(p.mesh.position.y - engine.shipGroup.position.y);

          if (distZ < 1.0 && dx < 1.1 && dy < 1.1 && !p.collected) {
            p.collected = true;
            engine.score += p.value;
            engine.packets += 1;
            if (p.type === 'overclock') {
              engine.overclockTimer = 6;
              playPowerupSound();
            } else if (p.type === 'shield') {
              engine.hasShield = true;
              playPowerupSound();
            } else {
              playCollectCoinSound();
            }

            scene.remove(p.mesh);
            engine.pickups.splice(i, 1);
            continue;
          }

          if (p.mesh.position.z > 15) {
            scene.remove(p.mesh);
            engine.pickups.splice(i, 1);
          }
        }

        hudCounter++;
        if (hudCounter % 4 === 0) {
          setScore(engine.score);
          setPacketsCollected(engine.packets);
          setOverclockActive(engine.overclockTimer > 0);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (engineRef.current?.animId) {
        cancelAnimationFrame(engineRef.current.animId);
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
      engineRef.current = null;
    };
  }, []);

  return (
    <div
      className="relative w-full h-[85vh] sm:h-[88vh] rounded-3xl overflow-hidden bg-[#F8F6F0] border-2 border-[#A5B2A0]/50 shadow-2xl flex flex-col select-none cursor-default"
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-default" />

      {/* Top HUD */}
      <div className="relative z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-[#1E281C]/40 via-transparent to-transparent pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#A5B2A0]/40 shadow-md flex items-center gap-2 pointer-events-auto">
            <Trophy className="w-4 h-4 text-[#9A8449]" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#1E281C]/60 font-bold">
                Bandwidth Score
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-[#1E281C] leading-none">
                {score.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#A5B2A0]/40 shadow-md flex items-center gap-2 pointer-events-auto">
            <Coins className="w-4 h-4 text-emerald-600" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#1E281C]/60 font-bold">
                Packets
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-[#1E281C] leading-none">
                {packetsCollected}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {overclockActive && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-mono text-xs font-bold flex items-center gap-1 animate-pulse shadow-md">
              <Zap className="w-3.5 h-3.5" />
              <span>2X OVERCLOCK</span>
            </div>
          )}

          <div className="px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#A5B2A0]/40 shadow-md flex items-center gap-1.5">
            {[1, 2, 3].map((h) => (
              <Heart
                key={h}
                className={`w-4 h-4 transition-all ${
                  h <= lives ? 'text-rose-500 fill-rose-500 scale-100' : 'text-gray-300 scale-75'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              const nowMuted = toggleSoundMute();
              setMuted(nowMuted);
            }}
            className="p-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-[#A5B2A0]/40 text-[#1E281C] hover:bg-white shadow-sm cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-[#1E281C]" />}
          </button>

          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-[#A5B2A0]/40 text-[#1E281C] hover:bg-rose-50 hover:text-rose-600 shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Start Overlay (No game number or upcoming spoiler) */}
      {hudState === 'ready' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#F8F6F0]/85 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl border-2 border-[#A5B2A0]/50 p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1E281C]/5 border border-[#A5B2A0]/40 text-[#9A8449] font-mono text-xs uppercase tracking-widest font-bold">
              <span>Cyber Kinetic Arcade</span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E281C] tracking-tight">
                Cyber Grid Surge
              </h2>
              <p className="text-sm text-[#1E281C]/70 mt-2 font-sans">
                Pilot the high-speed data glider over the cyber matrix highway. Navigate through open firewall slots and gather bandwidth packets!
              </p>
            </div>

            <div className="bg-[#F8F6F0] rounded-2xl p-4 border border-[#A5B2A0]/30 text-left space-y-2 font-mono text-xs text-[#1E281C]">
              <div className="flex justify-between border-b border-[#A5B2A0]/20 pb-1.5">
                <span className="font-bold text-[#9A8449]">STEER GLIDER:</span>
                <span>Keyboard Arrow Keys / WASD</span>
              </div>
              <div className="flex justify-between border-b border-[#A5B2A0]/20 pb-1.5">
                <span className="font-bold text-[#9A8449]">FIREWALL GATES:</span>
                <span>Fly through open slots to survive</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-[#9A8449]">BANDWIDTH:</span>
                <span>Collect green orbs & 2X Multipliers</span>
              </div>
            </div>

            {bestScore > 0 && (
              <div className="text-xs font-mono text-[#9A8449] font-bold">
                CURRENT BEST: {bestScore.toLocaleString()} PTS
              </div>
            )}

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-[#1E281C] text-[#CBB57B] hover:bg-[#121911] font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>LAUNCH GLIDER</span>
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {hudState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#1E281C]/60 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl border-2 border-[#A5B2A0]/50 p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-mono text-xs uppercase tracking-widest font-bold">
              <span>Connection Terminated</span>
            </div>

            <div>
              <h2 className="text-3xl font-serif font-bold text-[#1E281C]">
                Grid Run Complete
              </h2>
              <div className="mt-4 p-4 rounded-2xl bg-[#F8F6F0] border border-[#A5B2A0]/40 flex justify-around font-mono">
                <div>
                  <div className="text-xs text-[#1E281C]/60 uppercase">Final Bandwidth</div>
                  <div className="text-2xl font-bold text-[#1E281C]">{score.toLocaleString()}</div>
                </div>
                <div className="w-px bg-[#A5B2A0]/40" />
                <div>
                  <div className="text-xs text-[#1E281C]/60 uppercase">Packets</div>
                  <div className="text-2xl font-bold text-emerald-600">+{packetsCollected}</div>
                </div>
              </div>
            </div>

            {score >= bestScore && score > 0 && (
              <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-mono font-bold flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>NEW PERSONAL BEST RECORD!</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={startGame}
                className="w-full py-3.5 rounded-2xl bg-[#1E281C] text-[#CBB57B] hover:bg-[#121911] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  onNextGame();
                }}
                className="w-full py-3.5 rounded-2xl bg-[#9A8449] text-white hover:bg-[#85713b] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Play Next Game ➔</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="w-full py-2.5 text-xs font-mono uppercase tracking-wider text-[#1E281C]/70 hover:text-[#1E281C] cursor-pointer"
              >
                Return to Playhouse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Directional D-Pad */}
      <div className="relative z-20 mt-auto p-4 flex justify-center pointer-events-none md:hidden">
        <div className="grid grid-cols-3 gap-1 pointer-events-auto">
          <div />
          <button
            onPointerDown={() => moveShip(0, 0.9)}
            className="w-12 h-12 rounded-xl bg-white/90 border border-[#A5B2A0]/50 shadow flex items-center justify-center text-[#1E281C] active:bg-[#1E281C] active:text-white"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <div />
          <button
            onPointerDown={() => moveShip(-0.9, 0)}
            className="w-12 h-12 rounded-xl bg-white/90 border border-[#A5B2A0]/50 shadow flex items-center justify-center text-[#1E281C] active:bg-[#1E281C] active:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onPointerDown={() => moveShip(0, -0.9)}
            className="w-12 h-12 rounded-xl bg-white/90 border border-[#A5B2A0]/50 shadow flex items-center justify-center text-[#1E281C] active:bg-[#1E281C] active:text-white"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <button
            onPointerDown={() => moveShip(0.9, 0)}
            className="w-12 h-12 rounded-xl bg-white/90 border border-[#A5B2A0]/50 shadow flex items-center justify-center text-[#1E281C] active:bg-[#1E281C] active:text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
