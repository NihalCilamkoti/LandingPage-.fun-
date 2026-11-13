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
  Magnet,
  Zap,
  Heart,
  Trophy,
  Coins,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  playClickSound,
  playJumpSound,
  playSlideSound,
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

interface EnthiosHubChaseProps {
  onClose: () => void;
  onNextGame: () => void;
}

type Lane = -1 | 0 | 1;
const LANE_WIDTH = 2.4;

export const EnthiosHubChase: React.FC<EnthiosHubChaseProps> = ({ onClose, onNextGame }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const gameStateRef = useRef<'ready' | 'playing' | 'paused' | 'gameover'>('ready');
  const [hudState, setHudState] = useState<'ready' | 'playing' | 'paused' | 'gameover'>('ready');
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [lives, setLives] = useState(3);
  const [bestScore, setBestScore] = useState(0);
  const [activePowerUps, setActivePowerUps] = useState<Record<string, number>>({});
  const [muted, setMuted] = useState(isSoundMuted());

  const engineRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerGroup: THREE.Group;
    playerMesh: THREE.Mesh;
    shieldMesh: THREE.Mesh;
    currentLane: Lane;
    playerY: number;
    playerVelY: number;
    isJumping: boolean;
    isSliding: boolean;
    slideTimer: number;
    invincibleTimer: number;
    speed: number;
    distance: number;
    coins: number;
    lives: number;
    score: number;
    powerUps: {
      magnet: number;
      shield: number;
      boost: number;
    };
    obstacles: Array<{
      mesh: THREE.Group;
      lane: Lane;
      type: 'hurdle' | 'high_gate' | 'pillar';
      passed: boolean;
    }>;
    pickups: Array<{
      mesh: THREE.Group;
      lane: Lane;
      type: 'coin' | 'gem' | 'magnet' | 'shield' | 'boost';
      collected: boolean;
    }>;
    groundTiles: THREE.Mesh[];
    lamps: THREE.Group[];
    clock: THREE.Clock;
    animId: number | null;
  } | null>(null);

  useEffect(() => {
    const stats = loadPlayerStats();
    setBestScore(stats.highScores.chase || 0);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleMoveLeft = useCallback(() => {
    if (!engineRef.current || gameStateRef.current !== 'playing') return;
    const engine = engineRef.current;
    if (engine.currentLane === 1) engine.currentLane = 0;
    else if (engine.currentLane === 0) engine.currentLane = -1;
    playClickSound();
  }, []);

  const handleMoveRight = useCallback(() => {
    if (!engineRef.current || gameStateRef.current !== 'playing') return;
    const engine = engineRef.current;
    if (engine.currentLane === -1) engine.currentLane = 0;
    else if (engine.currentLane === 0) engine.currentLane = 1;
    playClickSound();
  }, []);

  const handleJump = useCallback(() => {
    if (!engineRef.current || gameStateRef.current !== 'playing') return;
    const engine = engineRef.current;
    if (!engine.isJumping && engine.playerY <= 0.05) {
      engine.isJumping = true;
      engine.playerVelY = 13.0;
      playJumpSound();
    }
  }, []);

  const handleSlide = useCallback(() => {
    if (!engineRef.current || gameStateRef.current !== 'playing') return;
    const engine = engineRef.current;
    if (!engine.isSliding) {
      engine.isSliding = true;
      engine.slideTimer = 0.7;
      playSlideSound();
    }
  }, []);

  // Keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (gameStateRef.current === 'ready' && (e.code === 'Space' || e.code === 'Enter')) {
        startGame();
        return;
      }
      if (gameStateRef.current !== 'playing') return;

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') handleMoveLeft();
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') handleMoveRight();
      else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') handleJump();
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') handleSlide();
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleMoveLeft, handleMoveRight, handleJump, handleSlide]);

  // Touch Swipe
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) handleMoveRight();
      else if (dx < -30) handleMoveLeft();
    } else {
      if (dy < -30) handleJump();
      else if (dy > 30) handleSlide();
    }
  };

  // Spawners
  const spawnObstacle = (scene: THREE.Scene, obstacles: Array<any>, zPos: number) => {
    const lanes: Lane[] = [-1, 0, 1];
    // Randomly choose 1 or 2 lanes to block (never all 3!)
    const roll = Math.random();
    const type: 'hurdle' | 'high_gate' | 'pillar' =
      roll < 0.4 ? 'hurdle' : roll < 0.75 ? 'high_gate' : 'pillar';

    const blockedLane = lanes[Math.floor(Math.random() * lanes.length)];
    const group = new THREE.Group();

    if (type === 'hurdle') {
      // Low barrier: Jump over!
      const hurdleGeo = new THREE.BoxGeometry(1.8, 0.7, 0.25);
      const hurdleMat = new THREE.MeshStandardMaterial({
        color: 0xd97706, // Amber
        roughness: 0.3,
        metalness: 0.2,
      });
      const mesh = new THREE.Mesh(hurdleGeo, hurdleMat);
      mesh.position.y = 0.35;
      group.add(mesh);

      // Warning stripe
      const stripeGeo = new THREE.BoxGeometry(1.82, 0.15, 0.27);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0x1e281c });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.y = 0.35;
      group.add(stripe);
    } else if (type === 'high_gate') {
      // Overhead laser gate: Slide under!
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e281c });
      const p1 = new THREE.Mesh(poleGeo, poleMat);
      p1.position.set(-1.0, 1.6, 0);
      const p2 = new THREE.Mesh(poleGeo, poleMat);
      p2.position.set(1.0, 1.6, 0);
      group.add(p1, p2);

      // High beam suspended above y=1.2
      const beamGeo = new THREE.BoxGeometry(2.1, 0.7, 0.2);
      const beamMat = new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        emissive: 0x7f1d1d,
        emissiveIntensity: 0.6,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, 2.2, 0);
      group.add(beam);
    } else {
      // Solid campus kiosk: Change lane!
      const kGeo = new THREE.BoxGeometry(1.8, 3.0, 0.8);
      const kMat = new THREE.MeshStandardMaterial({
        color: 0x1e281c,
        roughness: 0.3,
        metalness: 0.3,
      });
      const kMesh = new THREE.Mesh(kGeo, kMat);
      kMesh.position.y = 1.5;
      group.add(kMesh);

      const signGeo = new THREE.BoxGeometry(1.82, 0.6, 0.82);
      const signMat = new THREE.MeshStandardMaterial({
        color: 0xcbb57b,
        emissive: 0x9a8449,
        emissiveIntensity: 0.4,
      });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.y = 2.0;
      group.add(sign);
    }

    group.position.set(blockedLane * LANE_WIDTH, 0, zPos);
    scene.add(group);
    obstacles.push({
      mesh: group,
      lane: blockedLane,
      type,
      passed: false,
    });
  };

  const spawnPickups = (scene: THREE.Scene, pickups: Array<any>, zPos: number) => {
    const lanes: Lane[] = [-1, 0, 1];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const roll = Math.random();

    let type: 'coin' | 'gem' | 'magnet' | 'shield' | 'boost' = 'coin';
    if (roll < 0.65) type = 'coin';
    else if (roll < 0.82) type = 'gem';
    else if (roll < 0.89) type = 'magnet';
    else if (roll < 0.95) type = 'shield';
    else type = 'boost';

    const group = new THREE.Group();

    if (type === 'coin') {
      const geo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xcbb57b,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x9a8449,
        emissiveIntensity: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
    } else if (type === 'gem') {
      const geo = new THREE.OctahedronGeometry(0.35);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.6,
      });
      group.add(new THREE.Mesh(geo, mat));
    } else if (type === 'magnet') {
      const geo = new THREE.TorusGeometry(0.3, 0.08, 8, 16, Math.PI);
      const mat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x2563eb, emissiveIntensity: 0.5 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.z = Math.PI;
      group.add(mesh);
    } else if (type === 'shield') {
      const geo = new THREE.IcosahedronGeometry(0.32, 1);
      const mat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.6, wireframe: true });
      group.add(new THREE.Mesh(geo, mat));
    } else {
      const geo = new THREE.ConeGeometry(0.28, 0.6, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.8 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      group.add(mesh);
    }

    group.position.set(lane * LANE_WIDTH, 0.85, zPos);
    scene.add(group);
    pickups.push({
      mesh: group,
      lane,
      type,
      collected: false,
    });
  };

  const startGame = () => {
    playClickSound();
    if (!engineRef.current) return;
    const engine = engineRef.current;

    engine.currentLane = 0;
    engine.playerY = 0;
    engine.playerVelY = 0;
    engine.isJumping = false;
    engine.isSliding = false;
    engine.slideTimer = 0;
    engine.invincibleTimer = 0;
    engine.speed = 22;
    engine.distance = 0;
    engine.coins = 0;
    engine.lives = 3;
    engine.score = 0;
    engine.powerUps = { magnet: 0, shield: 0, boost: 0 };

    engine.obstacles.forEach((o) => engine.scene.remove(o.mesh));
    engine.obstacles = [];
    engine.pickups.forEach((p) => engine.scene.remove(p.mesh));
    engine.pickups = [];

    // Prepopulate track
    for (let z = -25; z > -160; z -= 16) {
      if (Math.random() < 0.65) spawnObstacle(engine.scene, engine.obstacles, z);
      if (Math.random() < 0.8) spawnPickups(engine.scene, engine.pickups, z - 6);
    }

    setScore(0);
    setCoinsCollected(0);
    setLives(3);
    setActivePowerUps({});

    gameStateRef.current = 'playing';
    setHudState('playing');
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Calm, stable Warm Ivory environment (No flickers or sudden jumps)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f6f0);
    scene.fog = new THREE.FogExp2(0xf8f6f0, 0.015);

    // Fixed, perfectly stable camera
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    camera.position.set(0, 3.8, 6.8);
    camera.lookAt(0, 1.4, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe8e2d5, 1.8);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaf0, 1.8);
    dirLight.position.set(10, 25, 15);
    scene.add(dirLight);

    // Stable Highway Track (Segmented smoothly)
    const groundTiles: THREE.Mesh[] = [];
    const tileLength = 50;
    const roadWidth = 8.6;

    for (let i = 0; i < 4; i++) {
      const roadGeo = new THREE.PlaneGeometry(roadWidth, tileLength);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.1,
      });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.z = -i * tileLength;
      scene.add(road);
      groundTiles.push(road);

      // Lane separator lines
      [-1.2, 1.2].forEach((lx) => {
        const lineGeo = new THREE.PlaneGeometry(0.1, tileLength);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xcbb57b });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(lx, 0.01, -i * tileLength);
        scene.add(line);
      });

      // Curbs
      [-4.4, 4.4].forEach((cx) => {
        const curbGeo = new THREE.BoxGeometry(0.4, 0.35, tileLength);
        const curbMat = new THREE.MeshStandardMaterial({ color: 0x1e281c, roughness: 0.5 });
        const curb = new THREE.Mesh(curbGeo, curbMat);
        curb.position.set(cx, 0.17, -i * tileLength);
        scene.add(curb);
      });
    }

    // Roadside Lamps (Stationary, peaceful scenery)
    const lamps: THREE.Group[] = [];
    for (let z = 0; z > -200; z -= 25) {
      [-5.5, 5.5].forEach((lx) => {
        const lamp = new THREE.Group();
        const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.5);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0xa5b2a0 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 2.25;
        lamp.add(pole);

        const headGeo = new THREE.BoxGeometry(0.6, 0.2, 0.4);
        const headMat = new THREE.MeshStandardMaterial({
          color: 0xcbb57b,
          emissive: 0x9a8449,
          emissiveIntensity: 0.8,
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(lx > 0 ? -0.2 : 0.2, 4.5, 0);
        lamp.add(head);

        lamp.position.set(lx, 0, z);
        scene.add(lamp);
        lamps.push(lamp);
      });
    }

    // Player Model: Clean, distinct EnthiosHub Tech Runner
    const playerGroup = new THREE.Group();
    const bodyGeo = new THREE.CapsuleGeometry(0.55, 0.9, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e281c, // Deep Forest
      roughness: 0.2,
      metalness: 0.6,
    });
    const playerMesh = new THREE.Mesh(bodyGeo, bodyMat);
    playerMesh.position.y = 1.0;
    playerGroup.add(playerMesh);

    // Gold Core Visor
    const coreGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xcbb57b,
      emissive: 0x9a8449,
      emissiveIntensity: 0.9,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, 1.1, 0.45);
    playerGroup.add(coreMesh);

    // Protective Bubble
    const shieldGeo = new THREE.SphereGeometry(1.2, 24, 24);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.0,
      wireframe: true,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.y = 1.0;
    playerGroup.add(shieldMesh);

    playerGroup.position.set(0, 0, 0);
    scene.add(playerGroup);

    engineRef.current = {
      scene,
      camera,
      renderer,
      playerGroup,
      playerMesh,
      shieldMesh,
      currentLane: 0,
      playerY: 0,
      playerVelY: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      invincibleTimer: 0,
      speed: 22,
      distance: 0,
      coins: 0,
      lives: 3,
      score: 0,
      powerUps: { magnet: 0, shield: 0, boost: 0 },
      obstacles: [],
      pickups: [],
      groundTiles,
      lamps,
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
        const boostMultiplier = engine.powerUps.boost > 0 ? 1.4 : 1.0;
        const currentSpeed = engine.speed * boostMultiplier;
        engine.distance += currentSpeed * dt;
        engine.score = Math.floor(engine.distance) + engine.coins * 10;
        engine.speed = Math.min(38, engine.speed + dt * 0.2);

        if (engine.powerUps.magnet > 0) engine.powerUps.magnet = Math.max(0, engine.powerUps.magnet - dt);
        if (engine.powerUps.shield > 0) engine.powerUps.shield = Math.max(0, engine.powerUps.shield - dt);
        if (engine.powerUps.boost > 0) engine.powerUps.boost = Math.max(0, engine.powerUps.boost - dt);
        if (engine.invincibleTimer > 0) engine.invincibleTimer = Math.max(0, engine.invincibleTimer - dt);

        // Shield Visual
        const sMat = engine.shieldMesh.material as THREE.MeshStandardMaterial;
        sMat.opacity = engine.powerUps.shield > 0 ? 0.45 : 0.0;
        if (engine.powerUps.shield > 0) engine.shieldMesh.rotation.y += dt * 3.0;

        // Slide mechanics
        if (engine.isSliding) {
          engine.slideTimer -= dt;
          engine.playerMesh.scale.set(1.2, 0.4, 1.4);
          engine.playerMesh.position.y = 0.4;
          if (engine.slideTimer <= 0) {
            engine.isSliding = false;
            engine.playerMesh.scale.set(1.0, 1.0, 1.0);
            engine.playerMesh.position.y = 1.0;
          }
        }

        // Jump physics
        if (engine.isJumping) {
          engine.playerY += engine.playerVelY * dt;
          engine.playerVelY -= 32 * dt;
          if (engine.playerY <= 0) {
            engine.playerY = 0;
            engine.playerVelY = 0;
            engine.isJumping = false;
          }
        }

        // Smooth Lane Transition (NO camera jerk)
        const targetX = engine.currentLane * LANE_WIDTH;
        engine.playerGroup.position.x += (targetX - engine.playerGroup.position.x) * 0.22;
        engine.playerGroup.position.y = engine.playerY;

        // Subtle tilt
        const dx = targetX - engine.playerGroup.position.x;
        engine.playerGroup.rotation.z = -dx * 0.12;

        if (engine.invincibleTimer > 0) {
          engine.playerMesh.visible = Math.floor(engine.invincibleTimer * 12) % 2 === 0;
        } else {
          engine.playerMesh.visible = true;
        }

        // Move road tiles smoothly
        groundTiles.forEach((tile) => {
          tile.position.z += currentSpeed * dt;
          if (tile.position.z > tileLength) {
            tile.position.z -= tileLength * groundTiles.length;
          }
        });

        // Move lamps
        lamps.forEach((lamp) => {
          lamp.position.z += currentSpeed * dt;
          if (lamp.position.z > 15) {
            lamp.position.z -= 200;
          }
        });

        // Spawn obstacles & pickups
        spawnTimer += currentSpeed * dt;
        if (spawnTimer > 18) {
          spawnTimer = 0;
          const spawnZ = -120;
          if (Math.random() < 0.7) spawnObstacle(scene, engine.obstacles, spawnZ);
          if (Math.random() < 0.8) spawnPickups(scene, engine.pickups, spawnZ - 5);
        }

        // Collision Check (Precise, Fair & Reliable)
        for (let i = engine.obstacles.length - 1; i >= 0; i--) {
          const obs = engine.obstacles[i];
          obs.mesh.position.z += currentSpeed * dt;

          const distZ = Math.abs(obs.mesh.position.z - engine.playerGroup.position.z);
          const laneMatch = obs.lane === engine.currentLane;

          if (laneMatch && distZ < 0.9 && !obs.passed) {
            let hit = false;

            if (obs.type === 'hurdle') {
              // Jump over check: player must be above y = 0.65
              if (engine.playerY < 0.65) hit = true;
            } else if (obs.type === 'high_gate') {
              // Slide under check: player must be sliding and low
              if (!engine.isSliding || engine.playerY > 0.4) hit = true;
            } else {
              // Pillar: Must switch lanes!
              hit = true;
            }

            if (hit) {
              obs.passed = true;

              if (engine.powerUps.boost > 0) {
                playWinSound();
                scene.remove(obs.mesh);
                engine.obstacles.splice(i, 1);
                engine.score += 50;
                continue;
              } else if (engine.powerUps.shield > 0) {
                engine.powerUps.shield = 0;
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
                  const finalStats = recordGameSession('chase', engine.score, engine.coins);
                  setBestScore(finalStats.highScores.chase);
                  break;
                }
              }
            }
          }

          if (obs.mesh.position.z > 15) {
            scene.remove(obs.mesh);
            engine.obstacles.splice(i, 1);
          }
        }

        // Pickups Check
        for (let i = engine.pickups.length - 1; i >= 0; i--) {
          const p = engine.pickups[i];
          p.mesh.position.z += currentSpeed * dt;
          p.mesh.rotation.y += dt * 3.0;

          if (engine.powerUps.magnet > 0 && !p.collected) {
            const dx = engine.playerGroup.position.x - p.mesh.position.x;
            const dz = engine.playerGroup.position.z - p.mesh.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 12) {
              p.mesh.position.x += dx * dt * 8.0;
              p.mesh.position.z += dz * dt * 8.0;
            }
          }

          const distZ = Math.abs(p.mesh.position.z - engine.playerGroup.position.z);
          const distX = Math.abs(p.mesh.position.x - engine.playerGroup.position.x);

          if (distZ < 1.1 && distX < 1.0 && !p.collected) {
            p.collected = true;
            if (p.type === 'coin') {
              engine.coins += 1;
              playCollectCoinSound();
            } else if (p.type === 'gem') {
              engine.coins += 5;
              playCollectCoinSound();
            } else if (p.type === 'magnet') {
              engine.powerUps.magnet = 10;
              playPowerupSound();
            } else if (p.type === 'shield') {
              engine.powerUps.shield = 1;
              playPowerupSound();
            } else if (p.type === 'boost') {
              engine.powerUps.boost = 6;
              playPowerupSound();
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
          setCoinsCollected(engine.coins);
          setActivePowerUps({
            magnet: Math.ceil(engine.powerUps.magnet),
            shield: engine.powerUps.shield > 0 ? 1 : 0,
            boost: Math.ceil(engine.powerUps.boost),
          });
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
      className="relative w-full h-[85vh] sm:h-[88vh] rounded-3xl overflow-hidden bg-[#F8F6F0] border-2 border-[#A5B2A0]/50 shadow-2xl flex flex-col select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-default" />

      {/* Top HUD */}
      <div className="relative z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-[#1E281C]/40 via-transparent to-transparent pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#A5B2A0]/40 shadow-md flex items-center gap-2 pointer-events-auto">
            <Trophy className="w-4 h-4 text-[#9A8449]" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#1E281C]/60 font-bold">
                Score
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-[#1E281C] leading-none">
                {score.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#A5B2A0]/40 shadow-md flex items-center gap-2 pointer-events-auto">
            <Coins className="w-4 h-4 text-amber-500" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#1E281C]/60 font-bold">
                Coins
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-[#1E281C] leading-none">
                {coinsCollected}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {activePowerUps.boost > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-mono text-xs font-bold flex items-center gap-1 animate-pulse shadow-md">
              <Zap className="w-3.5 h-3.5" />
              <span>BOOST {activePowerUps.boost}s</span>
            </div>
          )}
          {activePowerUps.magnet > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-mono text-xs font-bold flex items-center gap-1 shadow-md">
              <Magnet className="w-3.5 h-3.5" />
              <span>MAGNET {activePowerUps.magnet}s</span>
            </div>
          )}
          {activePowerUps.shield > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold flex items-center gap-1 shadow-md">
              <Shield className="w-3.5 h-3.5" />
              <span>SHIELD</span>
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

      {/* Start / Briefing Overlay (NO game numbers or spoilers) */}
      {hudState === 'ready' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#F8F6F0]/85 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl border-2 border-[#A5B2A0]/50 p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1E281C]/5 border border-[#A5B2A0]/40 text-[#9A8449] font-mono text-xs uppercase tracking-widest font-bold">
              <span>Campus 3D Runner</span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E281C] tracking-tight">
                EnthiosHub Chase
              </h2>
              <p className="text-sm text-[#1E281C]/70 mt-2 font-sans">
                Sprint through the campus track, jump over hurdles, slide under laser gates, and collect golden event coins!
              </p>
            </div>

            <div className="bg-[#F8F6F0] rounded-2xl p-4 border border-[#A5B2A0]/30 text-left space-y-2 font-mono text-xs text-[#1E281C]">
              <div className="flex justify-between border-b border-[#A5B2A0]/20 pb-1.5">
                <span className="font-bold text-[#9A8449]">LANE SWITCH:</span>
                <span>◀ Left / Right ▶ (or A / D)</span>
              </div>
              <div className="flex justify-between border-b border-[#A5B2A0]/20 pb-1.5">
                <span className="font-bold text-[#9A8449]">JUMP HURDLES:</span>
                <span>▲ Up / Spacebar</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-[#9A8449]">SLIDE GATES:</span>
                <span>▼ Down Arrow / S</span>
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
              <span>START SPRINT</span>
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {hudState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#1E281C]/60 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl border-2 border-[#A5B2A0]/50 p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-mono text-xs uppercase tracking-widest font-bold">
              <span>Sprint Completed</span>
            </div>

            <div>
              <h2 className="text-3xl font-serif font-bold text-[#1E281C]">
                Challenge Result
              </h2>
              <div className="mt-4 p-4 rounded-2xl bg-[#F8F6F0] border border-[#A5B2A0]/40 flex justify-around font-mono">
                <div>
                  <div className="text-xs text-[#1E281C]/60 uppercase">Final Score</div>
                  <div className="text-2xl font-bold text-[#1E281C]">{score.toLocaleString()}</div>
                </div>
                <div className="w-px bg-[#A5B2A0]/40" />
                <div>
                  <div className="text-xs text-[#1E281C]/60 uppercase">Coins Collected</div>
                  <div className="text-2xl font-bold text-amber-600">+{coinsCollected}</div>
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
                <span>Play Again</span>
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

      {/* On-Screen Mobile Touch Controls */}
      <div className="relative z-20 mt-auto p-4 flex items-center justify-between pointer-events-none md:hidden">
        <div className="flex gap-2 pointer-events-auto">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              handleMoveLeft();
            }}
            className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-md border border-[#A5B2A0]/50 shadow-lg flex items-center justify-center text-[#1E281C] active:bg-[#1E281C] active:text-white"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              handleMoveRight();
            }}
            className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-md border border-[#A5B2A0]/50 shadow-lg flex items-center justify-center text-[#1E281C] active:bg-[#1E281C] active:text-white"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              handleSlide();
            }}
            className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-md border border-[#A5B2A0]/50 shadow-lg flex flex-col items-center justify-center text-[#1E281C] active:bg-[#1E281C] active:text-white"
          >
            <ArrowDown className="w-5 h-5" />
            <span className="text-[9px] font-mono font-bold">SLIDE</span>
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              handleJump();
            }}
            className="w-14 h-14 rounded-2xl bg-[#1E281C]/90 text-[#CBB57B] backdrop-blur-md border border-[#A5B2A0]/50 shadow-lg flex flex-col items-center justify-center active:bg-[#121911]"
          >
            <ArrowUp className="w-5 h-5" />
            <span className="text-[9px] font-mono font-bold">JUMP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
