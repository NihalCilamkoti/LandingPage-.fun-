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
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  playClickSound,
  playCollectCoinSound,
  playPowerupSound,
  playCrashSound,
  playGameOverSound,
  playWinSound,
  isSoundMuted,
  toggleSoundMute,
} from '../../utils/sound';
import { recordGameSession, loadPlayerStats } from '../../utils/storage';

interface NeonGridCrawlerProps {
  onClose: () => void;
  onNextGame: () => void;
}

interface Point {
  x: number;
  y: number;
}

const GRID_SIZE = 22;
const CELL_COUNT = 20; // 20x20 grid

export const NeonGridCrawler: React.FC<NeonGridCrawlerProps> = ({ onClose, onNextGame }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gameStateRef = useRef<'ready' | 'playing' | 'gameover'>('ready');
  const [hudState, setHudState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState(0);
  const [tokensCollected, setTokensCollected] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [muted, setMuted] = useState(isSoundMuted());

  const stateRef = useRef<{
    snake: Point[];
    dir: Point;
    nextDir: Point;
    food: Point;
    bonus: Point | null;
    bonusTimer: number;
    score: number;
    tokens: number;
    lastTick: number;
    animId: number | null;
  }>({
    snake: [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ],
    dir: { x: 0, y: -1 },
    nextDir: { x: 0, y: -1 },
    food: { x: 5, y: 5 },
    bonus: null,
    bonusTimer: 0,
    score: 0,
    tokens: 0,
    lastTick: 0,
    animId: null,
  });

  useEffect(() => {
    const stats = loadPlayerStats();
    setBestScore(stats.highScores.snake || 0);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const changeDirection = useCallback((dx: number, dy: number) => {
    const current = stateRef.current.dir;
    // Disallow reverse
    if (dx === -current.x && dy === -current.y) return;
    stateRef.current.nextDir = { x: dx, y: dy };
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

      if (e.code === 'ArrowUp' || e.code === 'KeyW') changeDirection(0, -1);
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') changeDirection(0, 1);
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') changeDirection(-1, 0);
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') changeDirection(1, 0);
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [changeDirection]);

  const spawnRandomFood = (snake: Point[]): Point => {
    let p: Point;
    while (true) {
      p = {
        x: Math.floor(Math.random() * CELL_COUNT),
        y: Math.floor(Math.random() * CELL_COUNT),
      };
      if (!snake.some((s) => s.x === p.x && s.y === p.y)) break;
    }
    return p;
  };

  const startGame = () => {
    playClickSound();
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];

    stateRef.current = {
      snake: initialSnake,
      dir: { x: 0, y: -1 },
      nextDir: { x: 0, y: -1 },
      food: spawnRandomFood(initialSnake),
      bonus: null,
      bonusTimer: 0,
      score: 0,
      tokens: 0,
      lastTick: performance.now(),
      animId: null,
    };

    setScore(0);
    setTokensCollected(0);
    gameStateRef.current = 'playing';
    setHudState('playing');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CELL_COUNT * GRID_SIZE;
    canvas.height = CELL_COUNT * GRID_SIZE;

    const w = canvas.width;
    const h = canvas.height;

    const tickSpeed = 95; // ms per grid step

    const animate = (time: number) => {
      stateRef.current.animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const state = stateRef.current;

      // Render Loop
      ctx.fillStyle = '#F8F6F0';
      ctx.fillRect(0, 0, w, h);

      // Grid background
      ctx.strokeStyle = '#EBE7DD';
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (gameStateRef.current === 'playing') {
        if (time - state.lastTick > tickSpeed) {
          state.lastTick = time;
          state.dir = state.nextDir;

          const head = {
            x: state.snake[0].x + state.dir.x,
            y: state.snake[0].y + state.dir.y,
          };

          // Wall collision
          if (head.x < 0 || head.x >= CELL_COUNT || head.y < 0 || head.y >= CELL_COUNT) {
            playCrashSound();
            playGameOverSound();
            gameStateRef.current = 'gameover';
            setHudState('gameover');
            const stats = recordGameSession('snake', state.score, state.tokens);
            setBestScore(stats.highScores.snake);
            return;
          }

          // Self collision
          if (state.snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
            playCrashSound();
            playGameOverSound();
            gameStateRef.current = 'gameover';
            setHudState('gameover');
            const stats = recordGameSession('snake', state.score, state.tokens);
            setBestScore(stats.highScores.snake);
            return;
          }

          state.snake.unshift(head);

          // Food check
          if (head.x === state.food.x && head.y === state.food.y) {
            playCollectCoinSound();
            state.score += 25;
            state.tokens += 1;
            setScore(state.score);
            setTokensCollected(state.tokens);
            state.food = spawnRandomFood(state.snake);

            // Chance to spawn golden bonus
            if (Math.random() < 0.3 && !state.bonus) {
              state.bonus = spawnRandomFood(state.snake);
              state.bonusTimer = 60;
            }
          } else if (state.bonus && head.x === state.bonus.x && head.y === state.bonus.y) {
            playPowerupSound();
            state.score += 100;
            state.tokens += 3;
            setScore(state.score);
            setTokensCollected(state.tokens);
            state.bonus = null;
          } else {
            state.snake.pop(); // Normal move
          }

          if (state.bonusTimer > 0) {
            state.bonusTimer--;
            if (state.bonusTimer <= 0) state.bonus = null;
          }
        }
      }

      // Draw Normal Food
      const fx = state.food.x * GRID_SIZE + GRID_SIZE / 2;
      const fy = state.food.y * GRID_SIZE + GRID_SIZE / 2;
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(fx, fy, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Bonus Token if active
      if (state.bonus) {
        const bx = state.bonus.x * GRID_SIZE + GRID_SIZE / 2;
        const by = state.bonus.y * GRID_SIZE + GRID_SIZE / 2;
        ctx.fillStyle = '#CBB57B';
        ctx.beginPath();
        ctx.arc(bx, by, GRID_SIZE / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#9A8449';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw Snake Body
      state.snake.forEach((seg, i) => {
        const sx = seg.x * GRID_SIZE + 1;
        const sy = seg.y * GRID_SIZE + 1;
        const sz = GRID_SIZE - 2;

        if (i === 0) {
          // Head
          ctx.fillStyle = '#1E281C';
          ctx.beginPath();
          ctx.roundRect(sx, sy, sz, sz, 6);
          ctx.fill();

          // Visor
          ctx.fillStyle = '#CBB57B';
          ctx.beginPath();
          ctx.arc(sx + sz / 2, sy + sz / 2, sz / 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Body gradient
          ctx.fillStyle = i % 2 === 0 ? '#2C3A29' : '#3B4C38';
          ctx.beginPath();
          ctx.roundRect(sx, sy, sz, sz, 4);
          ctx.fill();
        }
      });
    };

    stateRef.current.animId = requestAnimationFrame(animate);

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
            <Trophy className="w-4 h-4 text-[#9A8449]" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#1E281C]/60 font-bold">
                Data Score
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
                Nodes Eaten
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-[#1E281C] leading-none">
                {tokensCollected}
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
              <span>Grid Matrix Snake</span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1E281C] tracking-tight">
                Neon Grid Crawler
              </h2>
              <p className="text-sm text-[#1E281C]/70 mt-2 font-sans">
                Guide your cyber stream across the matrix! Consume green bandwidth nodes and gold event tokens to grow and climb the leaderboard.
              </p>
            </div>

            <div className="bg-[#F8F6F0] rounded-2xl p-4 border border-[#A5B2A0]/30 text-left space-y-2 font-mono text-xs text-[#1E281C]">
              <div className="flex justify-between border-b border-[#A5B2A0]/20 pb-1.5">
                <span className="font-bold text-[#9A8449]">STEER STREAM:</span>
                <span>Arrow Keys / WASD / Touch D-Pad</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-[#9A8449]">AVOID:</span>
                <span>Walls & your own stream body</span>
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
              <span>START CRAWL</span>
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {hudState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#1E281C]/60 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl border-2 border-[#A5B2A0]/50 p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-mono text-xs uppercase tracking-widest font-bold">
              <span>Stream Severed</span>
            </div>

            <div>
              <h2 className="text-3xl font-serif font-bold text-[#1E281C]">
                Crawl Result
              </h2>
              <div className="mt-4 p-4 rounded-2xl bg-[#F8F6F0] border border-[#A5B2A0]/40 flex justify-around font-mono">
                <div>
                  <div className="text-xs text-[#1E281C]/60 uppercase">Final Score</div>
                  <div className="text-2xl font-bold text-[#1E281C]">{score.toLocaleString()}</div>
                </div>
                <div className="w-px bg-[#A5B2A0]/40" />
                <div>
                  <div className="text-xs text-[#1E281C]/60 uppercase">Nodes Collected</div>
                  <div className="text-2xl font-bold text-emerald-600">{tokensCollected}</div>
                </div>
              </div>
            </div>

            {score >= bestScore && score > 0 && (
              <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-mono font-bold flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>NEW PERSONAL HIGH RECORD!</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={startGame}
                className="w-full py-3.5 rounded-2xl bg-[#1E281C] text-[#CBB57B] hover:bg-[#121911] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Crawl Again</span>
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

      {/* Mobile Touch D-Pad */}
      <div className="relative z-20 mt-auto p-4 flex justify-center pointer-events-none md:hidden">
        <div className="grid grid-cols-3 gap-1 pointer-events-auto">
          <div />
          <button
            onPointerDown={() => changeDirection(0, -1)}
            className="w-12 h-12 rounded-xl bg-white/90 border border-[#A5B2A0]/50 shadow flex items-center justify-center text-[#1E281C] active:bg-[#1E281C] active:text-white"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <div />
          <button
            onPointerDown={() => changeDirection(-1, 0)}
            className="w-12 h-12 rounded-xl bg-white/90 border border-[#A5B2A0]/50 shadow flex items-center justify-center text-[#1E281C] active:bg-[#1E281C] active:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onPointerDown={() => changeDirection(0, 1)}
            className="w-12 h-12 rounded-xl bg-white/90 border border-[#A5B2A0]/50 shadow flex items-center justify-center text-[#1E281C] active:bg-[#1E281C] active:text-white"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <button
            onPointerDown={() => changeDirection(1, 0)}
            className="w-12 h-12 rounded-xl bg-white/90 border border-[#A5B2A0]/50 shadow flex items-center justify-center text-[#1E281C] active:bg-[#1E281C] active:text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
