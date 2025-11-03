// levels.js — works for both classic <script> and "import './levels.js'"
// IMPORTANT: no top-level `export` here.

(function (global) {
  const L = (id, cfg) => ({
    id,
    name: cfg.name,
    desc: cfg.desc,
    moves: cfg.moves,
    discipleMaxHP: cfg.discipleMaxHP,
    discipleAttackRate: cfg.discipleAttackRate ?? 4,
    encounterPattern: cfg.encounterPattern ?? "drainCharge", // or "drainMove"
    frozenGoal: cfg.frozenGoal ?? 0,
    shield: cfg.shield ?? null, // { enabled, breakerHero, hp, thresholdPct }
    damageBuffs: cfg.damageBuffs ?? null,
    rewards: cfg.rewards ?? { prisma: 25, unlockNext: true },
  });

  const LEVELS = [
    L(1,  { name: "Seoul – Breach Alpha", desc: "First resonance spike.", moves: 20, discipleMaxHP: 500 }),
    L(2,  { name: "Harbor Node", desc: "Cryo bloom spreading in docks.", moves: 20, discipleMaxHP: 550 }),
    L(3,  { name: "Old City Ring", desc: "Frozen circuitry blocks links.", moves: 22, discipleMaxHP: 600 }),
    L(4,  { name: "Atrium Spire", desc: "Phase shield at half HP.", moves: 22, discipleMaxHP: 650,
            shield: { enabled: true, breakerHero: "vyra", hp: 150, thresholdPct: 50 } }),
    L(5,  { name: "Neon Bazaar", desc: "Glyph density increasing.", moves: 21, discipleMaxHP: 700 }),
    L(6,  { name: "Transit Spine", desc: "Faster disciple rhythm.", moves: 23, discipleMaxHP: 760,
            encounterPattern: "drainMove" }),
    L(7,  { name: "Cryo Vault", desc: "Shield reappears. Vyra must breach.", moves: 22, discipleMaxHP: 820,
            shield: { enabled: true, breakerHero: "vyra", hp: 180, thresholdPct: 55 } }),
    L(8,  { name: "Data Artery", desc: "Resonance bias favors Aelia’s strikes.", moves: 22, discipleMaxHP: 880,
            damageBuffs: { aelia: 1.2 } }),
    L(9,  { name: "Temple Verge", desc: "Frozen nodes everywhere. Thaw to stabilize.", moves: 24, discipleMaxHP: 940,
            frozenGoal: 10 }),
    L(10, { name: "Primordial Gate", desc: "Final seal—shielded and aggressive.", moves: 24, discipleMaxHP: 1000,
            encounterPattern: "drainCharge",
            shield: { enabled: true, breakerHero: "vyra", hp: 220, thresholdPct: 60 },
            damageBuffs: { aelia: 1.1, vyra: 1.2, iona: 1.05 },
            rewards: { prisma: 100, unlockNext: false } }),
  ];

  // Expose globally for classic scripts and for module code that reads window.LEVELS
  global.LEVELS = LEVELS;

  // Tiny self-check to help debugging
  if (!Array.isArray(global.LEVELS) || !global.LEVELS.length) {
    console.error("[levels.js] LEVELS is empty or not an array.");
  }
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
