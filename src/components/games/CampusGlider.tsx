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
  Send,
  Zap,
} from 'lucide-react';
import {
  playClickSound,
  playJumpSound,
  playCollectCoinSound,
  playCrashSound,
  playGameOverSound,
  playWinSound,
  isSoundMuted,
  toggleSoundMute,
} from '../../utils/sound';
import { recordGameSession, loadPlayerStats } from '../../utils/storage';

interface CampusGliderProps {
  onClose: () => void;
  onNextGame: () => void;
}

interface Gate {
  x: number;
  topHeight: number;
  gap: number;
  passed: boolean;
  hasCoin: boolean;
}

export const CampusGlider: React.FC<CampusGliderProps> = ({ onClose, onNextGame }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gameStateRef = useRef<'ready' | 'playing' | 'gameover'>('ready');
  const [hudState, setHudState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [muted, setMuted] = useState(isSoundMuted());

  const stateRef = useRef<{
    bot: {
      x: number;
      y: number;
      vy: number;
      radius: number;
    };
    gates: Gate[];
    score: number;
    coins: number;
    animId: number | null;
  }>({
    bot: { x: 90, y: 240, vy: 0, radius: 16 },
    gates: [],
    score: 0,
    coins: 0,
    animId: null,
  });

  useEffect(() => {
    const stats = loadPlayerStats();
    setBestScore(stats.highScores.glider || 0);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const flap = useCallback(() => {
    if (gameStateRef.current === 'ready') {
      startGame();
      return;
    }
    if (gameStateRef.current !== 'playing') return;
    stateRef.current.bot.vy = -6.8;
    playJumpSound();
  }, []);

  // Keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        flap();
      }
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flap]);

  const startGame = () => {
    playClickSound();
    const canvas = canvasRef.current;
    const ch = canvas ? canvas.height : 500;

    const initialGates: Gate[] = [];
    const startX = 350;
    const spacing = 190;
    const gap = 145; // generous, fair gap

    for (let i = 0; i < 5; i++) {
      const topH = 60 + Math.random() * (ch - gap - 120);
      initialGates.push({
        x: startX + i * spacing,
        topHeight: topH,
        gap,
        passed: false,
        hasCoin: true,
      });
    }

    stateRef.current = {
      bot: { x: 90, y: 220, vy: -4, radius: 16 },
      gates: initialGates,
      score: 0,
      coins: 0,
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

    canvas.width = 500;
    canvas.height = 500;

    const cw = canvas.width;
    const ch = canvas.height;

    const animate = () => {
      stateRef.current.animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const state = stateRef.current;
      const bot = state.bot;

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
        // Physics
        bot.vy += 0.32; // Gravity
        bot.y += bot.vy;

        // Ground / Ceiling collision
        if (bot.y + bot.radius >= ch || bot.y - bot.radius <= 0) {
          playCrashSound();
          playGameOverSound();
          gameStateRef.current = 'gameover';
          setHudState('gameover');
          const stats = recordGameSession('glider', state.score, state.coins);
          setBestScore(stats.highScores.glider);
          return;
        }

        // Scroll Gates
        const gateSpeed = 2.6;
        state.gates.forEach((gate) => {
          gate.x -= gateSpeed;

          // Gate passing check
          if (!gate.passed && gate.x + 40 < bot.x) {
            gate.passed = true;
            state.score += 10;
            playClickSound();
            setScore(state.score);
          }

          // Coin collection check
          if (gate.hasCoin) {
            const coinX = gate.x + 20;
            const coinY = gate.topHeight + gate.gap / 2;
            const dx = bot.x - coinX;
            const dy = bot.y - coinY;
            if (Math.sqrt(dx * dx + dy * dy) < bot.radius + 12) {
              gate.hasCoin = false;
              state.coins += 1;
              state.score += 25;
              playCollectCoinSound();
              setCoins(state.coins);
              setScore(state.score);
            }
          }

          // Gate collision check
          const gateW = 40;
          if (bot.x + bot.radius > gate.x && bot.x - bot.radius < gate.x + gateW) {
            // Check top pillar or bottom pillar overlap
            if (bot.y - bot.radius < gate.topHeight || bot.y + bot.radius > gate.topHeight + gate.gap) {
              playCrashSound();
              playGameOverSound();
              gameStateRef.current = 'gameover';
              setHudState('gameover');
              const stats = recordGameSession('glider', state.score, state.coins);
              setBestScore(stats.highScores.glider);
              return;
            }
          }
        });

        // Recycle passed gates
        if (state.gates[0] && state.gates[0].x < -60) {
          state.gates.shift();
          const lastGate = state.gates[state.gates.length - 1];
          const newX = lastGate ? lastGate.x + 190 : cw + 100;
          const gap = 145;
          const topH = 60 + Math.random() * (ch - gap - 120);
          state.gates.push({
            x: newX,
            topHeight: topH,
            gap,
            passed: false,
            hasCoin: true,
          });
        }
      }

      // Draw Gates (Campus Architecture Gateways)
      state.gates.forEach((gate) => {
        const gw = 40;

        // Top Gate Pillar
        ctx.fillStyle = '#1E281C';
        ctx.beginPath();
        ctx.roundRect(gate.x, 0, gw, gate.topHeight, [0, 0, 8, 8]);
        ctx.fill();

        // Pillar Cap
        ctx.fillStyle = '#CBB57B';
        ctx.beginPath();
        ctx.roundRect(gate.x - 4, gate.topHeight - 8, gw + 8, 8, 3);
        ctx.fill();

        // Bottom Gate Pillar
        const bottomY = gate.topHeight + gate.gap;
        ctx.fillStyle = '#1E281C';
        ctx.beginPath();
        ctx.roundRect(gate.x, bottomY, gw, ch - bottomY, [8, 8, 0, 0]);
        ctx.fill();

        // Pillar Cap
        ctx.fillStyle = '#CBB57B';
        ctx.beginPath();
        ctx.roundRect(gate.x - 4, bottomY, gw + 8, 8, 3);
        ctx.fill();

        // Draw Coin
        if (gate.hasCoin) {
          const coinX = gate.x + 20;
          const coinY = gate.topHeight + gate.gap / 2;
          ctx.fillStyle = '#CBB57B';
          ctx.beginPath();
          ctx.arc(coinX, coinY, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // Draw Drone Bot
      ctx.fillStyle = '#1E281C';
      ctx.beginPath();
      ctx.arc(bot.x, bot.y, bot.radius, 0, Math.PI * 2);
      ctx.fill();

      // Gold Core Visor
      ctx.fillStyle = '#CBB57B';
      ctx.beginPath();
      ctx.arc(bot.x + 5, bot.y - 1, bot.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Thruster flame
      if (bot.vy < 0) {
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(bot.x - bot.radius - 2, bot.y + 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    stateRef.current.animId = requestAnimationFrame(animate);

    return () => {
      if (stateRef.current.animId) {
        cancelAnimationFrame(stateRef.current.animId);
      }
    };
  }, []);

  return (
    <div
      className="relative w-full h-[85vh] sm:h-[88vh] rounded-3xl overflow-hidden bg-[#F8F6F0] border-2 border-[#A5B2A0]/50 shadow-2xl flex flex-col select-none touch-none"
      onClick={flap}
    >
      {/* Top HUD */}
      <div className="relative z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-[#1E281C]/30 via-transparent to-transparent pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#A5B2A0]/40 shadow-md flex items-center gap-2 pointer-events-auto">
            <Trophy className="w-4 h-4 text-[#9A8449]" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#1E281C]/60 font-bold">
                Flight Score
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
                {coins}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const nowMuted = toggleSoundMute();
              setMuted(nowMuted);
            }}
            className="p-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-[#A5B2A0]/40 text-[#1E281C] hover:bg-white shadow-sm cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-[#1E281C]" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              playClickSound();
              onClose();
            }}
            className="p-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-[#A5B2A0]/40 text-[#1E281C] hover:bg-rose-50 hover:text-rose-600 shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4">
        <canvas
          ref={canvasRef}
          className="w-full h-full max-h-[70vh] object-contain rounded-2xl shadow-inner border border-[#A5B2A0]/30 cursor-default"
        />
      </div>

      {/* Start Overlay */}
      {hudState === 'ready' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#F8F6F0]/85 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl border-2 border-[#A5B2A0]/50 p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1E281C]/5 border border-[#A5B2A0]/40 text-[#9A8449] font-mono text-xs uppercase tracking-widest font-bold">
              <span>Campus Glider</span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E281C] tracking-tight">
                Flappy Bot: Campus Flight
              </h2>
              <p className="text-sm text-[#1E281C]/70 mt-2 font-sans">
                Pilot the drone through campus archways and collect golden tokens! Tap to flap your thrusters and maintain altitude.
              </p>
            </div>

            <div className="bg-[#F8F6F0] rounded-2xl p-4 border border-[#A5B2A0]/30 text-left space-y-2 font-mono text-xs text-[#1E281C]">
              <div className="flex justify-between border-b border-[#A5B2A0]/20 pb-1.5">
                <span className="font-bold text-[#9A8449]">THRUST:</span>
                <span>Spacebar / Up Arrow or Click / Tap anywhere</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-[#9A8449]">GOAL:</span>
                <span>Pass through archway gaps & collect tokens</span>
              </div>
            </div>

            {bestScore > 0 && (
              <div className="text-xs font-mono text-[#9A8449] font-bold">
                CURRENT BEST: {bestScore.toLocaleString()} PTS
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="w-full py-4 rounded-2xl bg-[#1E281C] text-[#CBB57B] hover:bg-[#121911] font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START FLIGHT</span>
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {hudState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#1E281C]/60 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl border-2 border-[#A5B2A0]/50 p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-mono text-xs uppercase tracking-widest font-bold">
              <span>Flight Concluded</span>
            </div>

            <div>
              <h2 className="text-3xl font-serif font-bold text-[#1E281C]">
                Flight Record
              </h2>
              <div className="mt-4 p-4 rounded-2xl bg-[#F8F6F0] border border-[#A5B2A0]/40 flex justify-around font-mono">
                <div>
                  <div className="text-xs text-[#1E281C]/60 uppercase">Final Score</div>
                  <div className="text-2xl font-bold text-[#1E281C]">{score.toLocaleString()}</div>
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
                <span>NEW PERSONAL FLIGHT RECORD!</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
                className="w-full py-3.5 rounded-2xl bg-[#1E281C] text-[#CBB57B] hover:bg-[#121911] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Fly Again</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playClickSound();
                  onNextGame();
                }}
                className="w-full py-3.5 rounded-2xl bg-[#9A8449] text-white hover:bg-[#85713b] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Play Next Game ➔</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
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
