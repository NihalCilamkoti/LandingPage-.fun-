// Safe Client-side Game Progression & Sequential Launcher Manager for EnthiosHub Playhouse

export interface GameHighScores {
  chase: number;
  surge: number;
  jump: number;
  snake: number;
  glider: number;
  stars: number;
}

export interface PlayerStats {
  totalCoins: number;
  gamesPlayed: number;
  highScores: GameHighScores;
}

const STATS_KEY = 'enthios_playhouse_stats_v5';
const SEQUENCE_KEY = 'enthios_playhouse_seq_idx_v5';

const DEFAULT_SCORES: GameHighScores = {
  chase: 0,
  surge: 0,
  jump: 0,
  snake: 0,
  glider: 0,
  stars: 0,
};

export function loadPlayerStats(): PlayerStats {
  if (typeof window === 'undefined') {
    return {
      totalCoins: 0,
      gamesPlayed: 0,
      highScores: { ...DEFAULT_SCORES },
    };
  }
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      return {
        totalCoins: 0,
        gamesPlayed: 0,
        highScores: { ...DEFAULT_SCORES },
      };
    }
    const parsed = JSON.parse(raw);
    return {
      totalCoins: Number(parsed.totalCoins) || 0,
      gamesPlayed: Number(parsed.gamesPlayed) || 0,
      highScores: {
        chase: Number(parsed.highScores?.chase) || 0,
        surge: Number(parsed.highScores?.surge) || 0,
        jump: Number(parsed.highScores?.jump) || 0,
        snake: Number(parsed.highScores?.snake) || 0,
        glider: Number(parsed.highScores?.glider) || 0,
        stars: Number(parsed.highScores?.stars) || 0,
      },
    };
  } catch {
    return {
      totalCoins: 0,
      gamesPlayed: 0,
      highScores: { ...DEFAULT_SCORES },
    };
  }
}

export function savePlayerStats(stats: PlayerStats) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export function recordGameSession(gameId: keyof GameHighScores, score: number, coinsEarned: number) {
  const current = loadPlayerStats();
  current.gamesPlayed += 1;
  current.totalCoins += Math.max(0, coinsEarned);
  if (score > (current.highScores[gameId] || 0)) {
    current.highScores[gameId] = Math.round(score);
  }
  savePlayerStats(current);
  return current;
}

export function getSavedGameIndex(totalGames: number): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(SEQUENCE_KEY);
    if (raw === null) return 0;
    const idx = parseInt(raw, 10);
    return isNaN(idx) ? 0 : idx % totalGames;
  } catch {
    return 0;
  }
}

export function setSavedGameIndex(nextIndex: number, totalGames: number) {
  if (typeof window === 'undefined') return;
  try {
    const safeIdx = ((nextIndex % totalGames) + totalGames) % totalGames;
    localStorage.setItem(SEQUENCE_KEY, String(safeIdx));
  } catch {}
}

export function advanceToNextGame(currentIndex: number, totalGames: number): number {
  const next = (currentIndex + 1) % totalGames;
  setSavedGameIndex(next, totalGames);
  return next;
}
