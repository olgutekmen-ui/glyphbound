// state.js
// ────────────────────────────────────────────────
// Global constants, state, and economy management
// ────────────────────────────────────────────────

export const GRID_SIZE = 9;
export const GLYPH_TYPES = 4;
export const GLYPH_SYMBOLS = ["⚡", "🔮", "🌿", "🌟"];

export const HERO_DATA = {
  aelia: {
    name: "AELIA",
    idle: "assets/aelia.png",
    wink: "assets/aelia_wink.png",
    color: "#ffb6c1",
  },
  nocta: {
    name: "NOCTA",
    idle: "assets/nocta.png",
    wink: "assets/nocta_wink.png",
    color: "#9370db",
  },
  vyra: {
    name: "VYRA",
    idle: "assets/vyra.png",
    wink: "assets/vyra_wink.png",
    color: "#7fffd4",
  },
  iona: {
    name: "IONA",
    idle: "assets/iona.png",
    wink: "assets/iona_wink.png",
    color: "#ffd700",
  },
};

// Level parameters from query
const urlParams = new URLSearchParams(location.search);
export const currentLevelId = parseInt(urlParams.get("level") || "1", 10);

// Defaults for when LEVELS.js doesn't override
export const LEVEL_DEFAULTS = {
  id: currentLevelId,
  moves: 20,
  discipleMaxHP: 500,
  discipleAttackRate: 4,
  frozenSeed: 2,
};

// Persistent state
export const gameState = {
  score: 0,
  movesLeft: LEVEL_DEFAULTS.moves,
  discipleHP: LEVEL_DEFAULTS.discipleMaxHP,
  aeliaCharge: 0,
  noctaCharge: 0,
  vyraCharge: 0,
  ionaCharge: 0,
  turnsTaken: 0,
  frozenGoal: 0,
  prisma: parseInt(localStorage.getItem("prisma") || "0", 10),
  discipleShield: 0          // current shield HP,
  discipleShieldMax: 0       // max shield HP,
};

export function addPrisma(amount) {
  gameState.prisma += amount;
  savePrisma();
}

export function savePrisma() {
  localStorage.setItem("prisma", String(gameState.prisma));
}
