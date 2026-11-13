import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  Sparkles,
  Trophy,
  Clock,
  Heart,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  playClickSound,
  playCollectStarSound,
  playCrashSound,
  playGameOverSound,
  playWinSound,
  isSoundMuted,
  toggleSoundMute,
} from '../../utils/sound';
import { recordGameSession, loadPlayerStats } from '../../utils/storage';

interface StarCollectorProps {
  onClose: () => void;
  onNextGame: () => void;
}

interface Spark {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  points: number;
  pulse: number;
}

interface GlitchHazard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export const StarCollector: React.FC<StarCollectorProps> = ({ onClose, onNextGame }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(35);
  const [starsCollected, setStarsCollected] = useState(0);
  const [combo, setCombo] = useState(1);
  const [bestScore, setBestScore] = useState(0);
  const [muted, setMuted] = useState(isSoundMuted());

  // Mutable Game Loop State
  const stateRef = useRef({
    player: { x: 300, y: 220, vx: 0, vy: 0, radius: 18, speed: 6 },
    sparks: [] as Spark[],
    glitches: [] as GlitchHazard[],
    keys: {} as Record<string, boolean>,
    score: 0,
    stars: 0,
    combo: 1,
    comboTimer: 0,
    timeLeft: 35,
    lastTime: 0,
    animId: null as number | null,
  });

  useEffect(() => {
    const stats = loadPlayerStats();
    setBestScore(stats.highScores.stars || 0);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Keyboard with complete Scroll Prevention
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (gameState === 'ready' && (e.code === 'Space' || e.code === 'Enter')) {
        startGame();
        return;
      }
      stateRef.current.keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      delete stateRef.current.keys[e.code];
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [gameState]);

  // Touch Drag
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const targetX = (e.clientX - rect.left) * scaleX;
    const targetY = (e.clientY - rect.top) * scaleY;

    const dx = targetX - stateRef.current.player.x;
    const dy = targetY - stateRef.current.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 5) {
      stateRef.current.player.vx = (dx / dist) * stateRef.current.player.speed;
      stateRef.current.player.vy = (dy / dist) * stateRef.current.player.speed;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || !canvasRef.current || e.buttons === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const targetX = (e.clientX - rect.left) * scaleX;
    const targetY = (e.clientY - rect.top) * scaleY;

    const dx = targetX - stateRef.current.player.x;
    const dy = targetY - stateRef.current.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 10) {
      stateRef.current.player.vx = (dx / dist) * stateRef.current.player.speed;
      stateRef.current.player.vy = (dy / dist) * stateRef.current.player.speed;
    }
  };

  const startGame = () => {
    playClickSound();
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width : 600;
    const h = canvas ? canvas.height : 450;

    const initialSparks: Spark[] = [];
    const colors = ['#CBB57B', '#9A8449', '#10B981', '#06B6D4'];
    for (let i = 0; i < 10; i++) {
      initialSparks.push({
        id: Math.random(),
        x: 40 + Math.random() * (w - 80),
        y: 40 + Math.random() * (h - 80),
        radius: 12 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        points: 15,
        pulse: Math.random() * Math.PI,
      });
    }

    const initialGlitches: GlitchHazard[] = [];
    for (let i = 0; i < 3; i++) {
      initialGlitches.push({
        x: Math.random() > 0.5 ? 50 : w - 50,
        y: Math.random() > 0.5 ? 50 : h - 50,
        vx: (Math.random() > 0.5 ? 1 : -1) * (2.2 + Math.random() * 1.5),
        vy: (Math.random() > 0.5 ? 1 : -1) * (2.2 + Math.random() * 1.5),
        radius: 14,
      });
    }

    stateRef.current = {
      player: { x: w / 2, y: h / 2, vx: 0, vy: 0, radius: 18, speed: 6 },
      sparks: initialSparks,
      glitches: initialGlitches,
      keys: {},
      score: 0,
      stars: 0,
      combo: 1,
      comboTimer: 0,
      timeLeft: 35,
      lastTime: performance.now(),
      animId: null,
    };

    setScore(0);
    setTimeLeft(35);
    setStarsCollected(0);
    setCombo(1);
    setGameState('playing');
  };

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set internal resolution
    canvas.width = 720;
    canvas.height = 480;

    let timerInterval: any = null;

    if (gameState === 'playing') {
      timerInterval = setInterval(() => {
        stateRef.current.timeLeft -= 1;
        setTimeLeft(stateRef.current.timeLeft);

        if (stateRef.current.timeLeft <= 0) {
          clearInterval(timerInterval);
          playWinSound();
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          setGameState('gameover');
          const finalStats = recordGameSession('stars', stateRef.current.score, stateRef.current.stars);
          setBestScore(finalStats.highScores.stars);
        }
      }, 1000);
    }

    const render = () => {
      stateRef.current.animId = requestAnimationFrame(render);
      if (document.hidden) return;

      const state = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      // Clear Canvas with Soft Warm Canvas Tone
      ctx.fillStyle = '#F8F6F0';
      ctx.fillRect(0, 0, w, h);

      // Subtle Architectural Grid Lines
      ctx.strokeStyle = '#EBE7DD';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x <= w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (gameState === 'playing') {
        // Player keyboard acceleration
        const keys = state.keys;
        const p = state.player;
        let ax = 0;
        let ay = 0;
        if (keys['ArrowLeft'] || keys['KeyA']) ax -= 1;
        if (keys['ArrowRight'] || keys['KeyD']) ax += 1;
        if (keys['ArrowUp'] || keys['KeyW']) ay -= 1;
        if (keys['ArrowDown'] || keys['KeyS']) ay += 1;

        if (ax !== 0 || ay !== 0) {
          const mag = Math.sqrt(ax * ax + ay * ay);
          p.vx = (ax / mag) * p.speed;
          p.vy = (ay / mag) * p.speed;
        } else {
          // Friction
          p.vx *= 0.88;
          p.vy *= 0.88;
        }

        // Apply movement & boundary collisions
        p.x = Math.max(p.radius, Math.min(w - p.radius, p.x + p.vx));
        p.y = Math.max(p.radius, Math.min(h - p.radius, p.y + p.vy));

        // Combo timer decay
        if (state.comboTimer > 0) {
          state.comboTimer -= 0.016;
          if (state.comboTimer <= 0) {
            state.combo = 1;
            setCombo(1);
          }
        }

        // Update Glitch Hazards
        state.glitches.forEach((g) => {
          g.x += g.vx;
          g.y += g.vy;

          if (g.x - g.radius <= 0 || g.x + g.radius >= w) g.vx *= -1;
          if (g.y - g.radius <= 0 || g.y + g.radius >= h) g.vy *= -1;

          // Check player collision with glitch
          const dx = g.x - p.x;
          const dy = g.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < g.radius + p.radius) {
            // Glitch hit: lose 3 seconds and combo reset!
            playCrashSound();
            state.timeLeft = Math.max(1, state.timeLeft - 2);
            setTimeLeft(state.timeLeft);
            state.combo = 1;
            setCombo(1);
            // Repel glitch
            g.vx = (dx / dist) * 5;
            g.vy = (dy / dist) * 5;
          }
        });

        // Update Sparks and Pickup Detection
        for (let i = state.sparks.length - 1; i >= 0; i--) {
          const s = state.sparks[i];
          s.pulse += 0.08;

          const dx = s.x - p.x;
          const dy = s.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < s.radius + p.radius) {
            // Collected!
            playCollectStarSound();
            const earned = s.points * state.combo;
            state.score += earned;
            state.stars += 1;
            state.combo = Math.min(5, state.combo + 1);
            state.comboTimer = 2.5;

            setScore(state.score);
            setStarsCollected(state.stars);
            setCombo(state.combo);

            // Respawn spark elsewhere
            state.sparks[i] = {
              id: Math.random(),
              x: 40 + Math.random() * (w - 80),
              y: 40 + Math.random() * (h - 80),
              radius: 12 + Math.random() * 6,
              color: s.color,
              points: 15,
              pulse: Math.random() * Math.PI,
            };
          }
        }
      }

      // Draw Sparks
      state.sparks.forEach((s) => {
        const pulseSize = s.radius + Math.sin(s.pulse) * 2.5;
        // Outer aura
        const grad = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, pulseSize * 1.5);
        grad.addColorStop(0, s.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, pulseSize * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Core star
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, pulseSize * 0.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Draw Glitch Hazards
      state.glitches.forEach((g) => {
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#991B1B';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pulsing exclamation mark
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', g.x, g.y);
      });

      // Draw Player Energy Orb
      const p = state.player;
      // Shadow
      ctx.fillStyle = 'rgba(30, 40, 28, 0.15)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + p.radius + 2, p.radius, p.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Outer Ring
      ctx.strokeStyle = '#CBB57B';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 3, 0, Math.PI * 2);
      ctx.stroke();

      // Player Body
      ctx.fillStyle = '#1E281C';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Center
      ctx.fillStyle = '#CBB57B';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    };

    render();

    return () => {
      clearInterval(timerInterval);
      if (stateRef.current.animId) {
        cancelAnimationFrame(stateRef.current.animId);
      }
    };
  }, [gameState]);

  return (
    <div className="relative w-full h-[85vh] sm:h-[88vh] rounded-3xl overflow-hidden bg-[#F8F6F0] border-2 border-[#A5B2A0]/50 shadow-2xl flex flex-col select-none touch-none">
      
      {/* Top HUD */}
      <div className="relative z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-[#1E281C]/20 via-transparent to-transparent pointer-events-none">
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#A5B2A0]/40 shadow-md flex items-center gap-2 pointer-events-auto">
            <Trophy className="w-4 h-4 text-[#9A8449]" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#1E281C]/60 font-bold">
                Energy Score
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-[#1E281C] leading-none">
                {score.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#A5B2A0]/40 shadow-md flex items-center gap-2 pointer-events-auto">
            <Sparkles className="w-4 h-4 text-[#CBB57B]" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#1E281C]/60 font-bold">
                Stars
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-[#1E281C] leading-none">
                {starsCollected}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {combo > 1 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-mono text-xs font-bold flex items-center gap-1 shadow-md">
              <span>{combo}X COMBO</span>
            </div>
          )}

          <div className="px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#A5B2A0]/40 shadow-md flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#1E281C]" />
            <span className="text-base font-mono font-bold text-[#1E281C]">{timeLeft}s</span>
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

      {/* Main Playable 2D Canvas */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="w-full h-full max-h-[70vh] object-contain rounded-2xl shadow-inner border border-[#A5B2A0]/30 cursor-default"
        />
      </div>

      {/* Start Overlay */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#F8F6F0]/85 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl border-2 border-[#A5B2A0]/50 p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1E281C]/5 border border-[#A5B2A0]/40 text-[#9A8449] font-mono text-xs uppercase tracking-widest font-bold">
              <span>Playhouse Agility Classic</span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E281C] tracking-tight">
                Star Collector
              </h2>
              <p className="text-sm text-[#1E281C]/70 mt-2 font-sans">
                The original restored EnthiosHub agility classic! Navigate your energy orb around the field, vacuum up event stars, and evade patrolling glitch anomalies.
              </p>
            </div>

            <div className="bg-[#F8F6F0] rounded-2xl p-4 border border-[#A5B2A0]/30 text-left space-y-2 font-mono text-xs text-[#1E281C]">
              <div className="flex justify-between border-b border-[#A5B2A0]/20 pb-1.5">
                <span className="font-bold text-[#9A8449]">MOVE ORB:</span>
                <span>Touch / Drag or Arrow Keys / WASD</span>
              </div>
              <div className="flex justify-between border-b border-[#A5B2A0]/20 pb-1.5">
                <span className="font-bold text-[#9A8449]">COLLECT STARS:</span>
                <span>Build Multiplier Combos</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-[#9A8449]">DODGE GLITCHES:</span>
                <span>Red Orbs Drain Time</span>
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
              <span>COLLECT STARS</span>
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#1E281C]/60 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl border-2 border-[#A5B2A0]/50 p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-xs uppercase tracking-widest font-bold">
              <span>Time Concluded</span>
            </div>

            <div>
              <h2 className="text-3xl font-serif font-bold text-[#1E281C]">
                Collection Summary
              </h2>
              <div className="mt-4 p-4 rounded-2xl bg-[#F8F6F0] border border-[#A5B2A0]/40 flex justify-around font-mono">
                <div>
                  <div className="text-xs text-[#1E281C]/60 uppercase">Final Score</div>
                  <div className="text-2xl font-bold text-[#1E281C]">{score.toLocaleString()}</div>
                </div>
                <div className="w-px bg-[#A5B2A0]/40" />
                <div>
                  <div className="text-xs text-[#1E281C]/60 uppercase">Stars Collected</div>
                  <div className="text-2xl font-bold text-amber-600">+{starsCollected}</div>
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

    </div>
  );
};

