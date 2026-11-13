import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  Trophy,
  Coins,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUp,
} from 'lucide-react';
import {
  playClickSound,
  playJumpSound,
  playCollectCoinSound,
  playPowerupSound,
  playGameOverSound,
  playWinSound,
  isSoundMuted,
  toggleSoundMute,
} from '../../utils/sound';
import { recordGameSession, loadPlayerStats } from '../../utils/storage';

interface CampusGravityJumperProps {
  onClose: () => void;
  onNextGame: () => void;
}

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'normal' | 'moving' | 'spring';
  vx?: number;
  hasCoin?: boolean;
}

export const CampusGravityJumper: React.FC<CampusGravityJumperProps> = ({ onClose, onNextGame }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gameStateRef = useRef<'ready' | 'playing' | 'gameover'>('ready');
  const [hudState, setHudState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [muted, setMuted] = useState(isSoundMuted());

  const stateRef = useRef<{
    player: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      w: number;
      h: number;
    };
    platforms: Platform[];
    cameraY: number;
    maxHeight: number;
    coinsCollected: number;
    keys: Record<string, boolean>;
    animId: number | null;
  }>({
    player: { x: 200, y: 300, vx: 0, vy: 0, w: 28, h: 36 },
    platforms: [],
    cameraY: 0,
    maxHeight: 0,
    coinsCollected: 0,
    keys: {},
    animId: null,
  });

  useEffect(() => {
    const stats = loadPlayerStats();
    setBestScore(stats.highScores.jump || 0);

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

      if (gameStateRef.current === 'ready' && (e.code === 'Space' || e.code === 'Enter')) {
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
  }, []);

  const movePlayerDir = useCallback((dx: number) => {
    stateRef.current.player.vx = dx * 7;
  }, []);

  // Touch / Pointer
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameStateRef.current !== 'playing' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 2) {
      movePlayerDir(-1);
    } else {
      movePlayerDir(1);
    }
  };

  const handlePointerUp = () => {
    stateRef.current.player.vx = 0;
  };

  const startGame = () => {
    playClickSound();
    const canvas = canvasRef.current;
    const cw = canvas ? canvas.width : 450;
    const ch = canvas ? canvas.height : 600;

    const initialPlatforms: Platform[] = [
      { x: cw / 2 - 40, y: ch - 50, w: 80, h: 14, type: 'normal' },
    ];

    for (let y = ch - 120; y > -800; y -= 65) {
      const typeRoll = Math.random();
      const pType = typeRoll < 0.25 ? 'moving' : typeRoll < 0.4 ? 'spring' : 'normal';
      initialPlatforms.push({
        x: 20 + Math.random() * (cw - 110),
        y,
        w: 70,
        h: 14,
        type: pType,
        vx: pType === 'moving' ? (Math.random() > 0.5 ? 2 : -2) : 0,
        hasCoin: Math.random() < 0.4,
      });
    }

    stateRef.current = {
      player: { x: cw / 2 - 14, y: ch - 100, vx: 0, vy: -12, w: 28, h: 36 },
      platforms: initialPlatforms,
      cameraY: 0,
      maxHeight: 0,
      coinsCollected: 0,
      keys: {},
      animId: null,
    };

    setScore(0);
    setCoins(0);
    gameStateRef.current = 'playing';
    setHudState('playing');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 450;
    canvas.height = 600;

    const cw = canvas.width;
    const ch = canvas.height;

    const animate = () => {
      stateRef.current.animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const state = stateRef.current;
      const p = state.player;

      // Clear Canvas
      ctx.fillStyle = '#F8F6F0';
      ctx.fillRect(0, 0, cw, ch);

      // Subtle Background Grid
      ctx.strokeStyle = '#EBE7DD';
      ctx.lineWidth = 1;
      for (let x = 0; x <= cw; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ch);
        ctx.stroke();
      }

      if (gameStateRef.current === 'playing') {
        // Keyboard input
        if (state.keys['ArrowLeft'] || state.keys['KeyA']) {
          p.vx = -6.5;
        } else if (state.keys['ArrowRight'] || state.keys['KeyD']) {
          p.vx = 6.5;
        } else {
          p.vx *= 0.82;
        }

        // Apply horizontal movement & screen wrapping
        p.x += p.vx;
        if (p.x < -p.w) p.x = cw;
        else if (p.x > cw) p.x = -p.w;

        // Apply gravity
        p.vy += 0.42;
        p.y += p.vy;

        // Platform bounce check (only when falling downwards)
        if (p.vy > 0) {
          state.platforms.forEach((plat) => {
            if (
              p.x + p.w - 6 >= plat.x &&
              p.x + 6 <= plat.x + plat.w &&
              p.y + p.h >= plat.y &&
              p.y + p.h <= plat.y + plat.h + p.vy + 2
            ) {
              if (plat.type === 'spring') {
                p.vy = -18; // Super Spring launch
                playPowerupSound();
              } else {
                p.vy = -12; // Normal bounce
                playJumpSound();
              }
            }
          });
        }

        // Coin collection check
        state.platforms.forEach((plat) => {
          if (plat.hasCoin) {
            const coinX = plat.x + plat.w / 2;
            const coinY = plat.y - 14;
            const dx = p.x + p.w / 2 - coinX;
            const dy = p.y + p.h / 2 - coinY;
            if (Math.sqrt(dx * dx + dy * dy) < 22) {
              plat.hasCoin = false;
              state.coinsCollected += 1;
              playCollectCoinSound();
              setCoins(state.coinsCollected);
            }
          }
        });

        // Update moving platforms
        state.platforms.forEach((plat) => {
          if (plat.type === 'moving' && plat.vx) {
            plat.x += plat.vx;
            if (plat.x < 10 || plat.x + plat.w > cw - 10) {
              plat.vx *= -1;
            }
          }
        });

        // Camera scroll tracking player altitude
        if (p.y < ch / 2) {
          const diff = ch / 2 - p.y;
          p.y = ch / 2;
          state.cameraY += diff;
          state.maxHeight = Math.max(state.maxHeight, Math.floor(state.cameraY / 10));
          setScore(state.maxHeight);

          // Shift platforms down
          state.platforms.forEach((plat) => {
            plat.y += diff;
          });

          // Recycle platforms that left bottom screen
          state.platforms = state.platforms.filter((plat) => plat.y < ch + 30);
          while (state.platforms.length < 14) {
            const highestY = Math.min(...state.platforms.map((pl) => pl.y));
            const typeRoll = Math.random();
            const pType = typeRoll < 0.25 ? 'moving' : typeRoll < 0.4 ? 'spring' : 'normal';
            state.platforms.push({
              x: 20 + Math.random() * (cw - 110),
              y: highestY - (55 + Math.random() * 25),
              w: 70,
              h: 14,
              type: pType,
              vx: pType === 'moving' ? (Math.random() > 0.5 ? 2.2 : -2.2) : 0,
              hasCoin: Math.random() < 0.35,
            });
          }
        }

        // Game Over when falling below bottom
        if (p.y > ch + 20) {
          playGameOverSound();
          gameStateRef.current = 'gameover';
          setHudState('gameover');
          const finalScore = state.maxHeight + state.coinsCollected * 10;
          const stats = recordGameSession('jump', finalScore, state.coinsCollected);
          setBestScore(stats.highScores.jump);
        }
      }

      // Draw Platforms
      state.platforms.forEach((plat) => {
        if (plat.type === 'spring') {
          ctx.fillStyle = '#CBB57B';
        } else if (plat.type === 'moving') {
          ctx.fillStyle = '#06B6D4';
        } else {
          ctx.fillStyle = '#1E281C';
        }

        // Rounded platform bar
        ctx.beginPath();
        ctx.roundRect(plat.x, plat.y, plat.w, plat.h, 6);
        ctx.fill();

        // Spring cap
        if (plat.type === 'spring') {
          ctx.fillStyle = '#D97706';
          ctx.beginPath();
          ctx.roundRect(plat.x + plat.w / 2 - 10, plat.y - 4, 20, 6, 3);
          ctx.fill();
        }

        // Draw Coin
        if (plat.hasCoin) {
          const coinX = plat.x + plat.w / 2;
          const coinY = plat.y - 14;
          ctx.fillStyle = '#CBB57B';
          ctx.beginPath();
          ctx.arc(coinX, coinY, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // Draw Player Tech Jumper
      ctx.fillStyle = '#1E281C';
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, 12);
      ctx.fill();

      // Golden Visor
      ctx.fillStyle = '#CBB57B';
      ctx.beginPath();
      ctx.roundRect(p.x + 4, p.y + 6, p.w - 8, 10, 4);
      ctx.fill();

      // Thruster trail when jumping up
      if (p.vy < -2) {
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2, p.y + p.h + 4, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    animate();

    return () => {
      if (stateRef.current.animId) {
        cancelAnimationFrame(stateRef.current.animId);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[85vh] sm:h-[88vh] rounded-3xl overflow-hidden bg-[#F8F6F0] border-2 border-[#A5B2A0]/50 shadow-2xl flex flex-col select-none touch-none">
      
      {/* Top HUD */}
      <div className="relative z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-[#1E281C]/30 via-transparent to-transparent pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#A5B2A0]/40 shadow-md flex items-center gap-2 pointer-events-auto">
            <ArrowUp className="w-4 h-4 text-[#9A8449]" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#1E281C]/60 font-bold">
                Altitude
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-[#1E281C] leading-none">
                {score}m
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
                {coins}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
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

      {/* Main Canvas */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="w-full h-full max-h-[70vh] object-contain rounded-2xl shadow-inner border border-[#A5B2A0]/30 cursor-default"
        />
      </div>

      {/* Start Overlay */}
      {hudState === 'ready' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#F8F6F0]/85 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl border-2 border-[#A5B2A0]/50 p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1E281C]/5 border border-[#A5B2A0]/40 text-[#9A8449] font-mono text-xs uppercase tracking-widest font-bold">
              <span>Gravity Bouncer</span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E281C] tracking-tight">
                Campus Gravity Jumper
              </h2>
              <p className="text-sm text-[#1E281C]/70 mt-2 font-sans">
                Bounce upward across campus sky platforms! Land on spring pads for high launches and gather gold coins as you climb into the clouds.
              </p>
            </div>

            <div className="bg-[#F8F6F0] rounded-2xl p-4 border border-[#A5B2A0]/30 text-left space-y-2 font-mono text-xs text-[#1E281C]">
              <div className="flex justify-between border-b border-[#A5B2A0]/20 pb-1.5">
                <span className="font-bold text-[#9A8449]">STEER:</span>
                <span>◀ Left / Right ▶ (or A / D / Tap Sides)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-[#9A8449]">BOUNCE:</span>
                <span>Automatic on landing • Gold pads = Super Bounce</span>
              </div>
            </div>

            {bestScore > 0 && (
              <div className="text-xs font-mono text-[#9A8449] font-bold">
                CURRENT BEST: {bestScore}m
              </div>
            )}

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-[#1E281C] text-[#CBB57B] hover:bg-[#121911] font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START BOUNCING</span>
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {hudState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#1E281C]/60 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl border-2 border-[#A5B2A0]/50 p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-mono text-xs uppercase tracking-widest font-bold">
              <span>Descent Concluded</span>
            </div>

            <div>
              <h2 className="text-3xl font-serif font-bold text-[#1E281C]">
                Flight Record
              </h2>
              <div className="mt-4 p-4 rounded-2xl bg-[#F8F6F0] border border-[#A5B2A0]/40 flex justify-around font-mono">
                <div>
                  <div className="text-xs text-[#1E281C]/60 uppercase">Max Altitude</div>
                  <div className="text-2xl font-bold text-[#1E281C]">{score}m</div>
                </div>
                <div className="w-px bg-[#A5B2A0]/40" />
                <div>
                  <div className="text-xs text-[#1E281C]/60 uppercase">Coins Collected</div>
                  <div className="text-2xl font-bold text-amber-600">+{coins}</div>
                </div>
              </div>
            </div>

            {score >= bestScore && score > 0 && (
              <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-mono font-bold flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>NEW PERSONAL ALTITUDE RECORD!</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={startGame}
                className="w-full py-3.5 rounded-2xl bg-[#1E281C] text-[#CBB57B] hover:bg-[#121911] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Jump Again</span>
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

      {/* Mobile Touch Controls */}
      <div className="relative z-20 mt-auto p-4 flex justify-between pointer-events-none md:hidden">
        <button
          onPointerDown={() => movePlayerDir(-1)}
          onPointerUp={() => movePlayerDir(0)}
          className="w-16 h-14 rounded-2xl bg-white/90 border border-[#A5B2A0]/50 shadow flex items-center justify-center text-[#1E281C] active:bg-[#1E281C] active:text-white pointer-events-auto"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onPointerDown={() => movePlayerDir(1)}
          onPointerUp={() => movePlayerDir(0)}
          className="w-16 h-14 rounded-2xl bg-white/90 border border-[#A5B2A0]/50 shadow flex items-center justify-center text-[#1E281C] active:bg-[#1E281C] active:text-white pointer-events-auto"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

    </div>
  );
};
