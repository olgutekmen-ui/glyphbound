// economy.js
// Lightweight economy layer: Prisma + Energy with localStorage persistence.

const LS_KEYS = {
  prisma: "glp_prisma",
  energy: "glp_energy",
  lastEnergyAt: "glp_energy_last_ts",
  unlock: "glp_level_unlocked" // Optional: future use
};

const DEFAULTS = {
  prisma: 0,
  energy: 10,           // starting energy
  maxEnergy: 10,        // cap
  regenMinutes: 20      // 1 energy / 20 minutes (tune later)
};

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

export const economy = {
  prisma: DEFAULTS.prisma,
  energy: DEFAULTS.energy,
  maxEnergy: DEFAULTS.maxEnergy,
  regenMinutes: DEFAULTS.regenMinutes,

  init() {
    try {
      const p = parseInt(localStorage.getItem(LS_KEYS.prisma) || `${DEFAULTS.prisma}`, 10);
      const e = parseInt(localStorage.getItem(LS_KEYS.energy) || `${DEFAULTS.energy}`, 10);
      const last = parseInt(localStorage.getItem(LS_KEYS.lastEnergyAt) || "0", 10);

      this.prisma = isNaN(p) ? DEFAULTS.prisma : p;
      this.energy = isNaN(e) ? DEFAULTS.energy : e;

      // Regen tick
      this._tickRegen(last);

      this._save();
      // Expose globally for legacy calls and UI
      window.economy = this;
      // Initial HUD sync (if shop_ui loaded)
      if (window.updatePrismaUI) window.updatePrismaUI();
    } catch (err) {
      console.warn("[economy] init failed:", err);
      window.economy = this; // still expose
    }
  },

  _tickRegen(lastTs) {
    if (!lastTs) return this._stamp();
    const now = Date.now();
    const diffMin = Math.floor((now - lastTs) / 60000);
    if (diffMin <= 0) return;
    const gained = Math.floor(diffMin / this.regenMinutes);
    if (gained > 0) {
      this.energy = clamp(this.energy + gained, 0, this.maxEnergy);
      // move forward the last timestamp by used chunks
      const usedMs = gained * this.regenMinutes * 60000;
      const newLast = lastTs + usedMs;
      localStorage.setItem(LS_KEYS.lastEnergyAt, `${newLast}`);
    }
  },

  _stamp() {
    localStorage.setItem(LS_KEYS.lastEnergyAt, `${Date.now()}`);
  },

  _save() {
    localStorage.setItem(LS_KEYS.prisma, `${this.prisma}`);
    localStorage.setItem(LS_KEYS.energy, `${this.energy}`);
  },

  addPrisma(n) {
    this.prisma = Math.max(0, this.prisma + (n | 0));
    this._save();
    if (window.updatePrismaUI) window.updatePrismaUI();
    return this.prisma;
  },

  spendPrisma(n) {
    n = n | 0;
    if (n <= 0) return true;
    if (this.prisma < n) return false;
    this.prisma -= n;
    this._save();
    if (window.updatePrismaUI) window.updatePrismaUI();
    return true;
  },

  getPrisma() { return this.prisma; },

  getEnergy() { return this.energy; },

  consumeEnergy(n = 1) {
    if (this.energy < n) return false;
    this.energy -= n;
    this._save();
    return true;
  },

  grantEnergy(n = 1) {
    this.energy = clamp(this.energy + n, 0, this.maxEnergy);
    this._save();
    return this.energy;
  }
};
