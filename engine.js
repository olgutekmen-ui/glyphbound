// engine.js
import { initUI } from "./ui.js";
import { LEVELS } from "./levels.js"; // optional if you use structured levels

export const gameState = { score:0, moves:20, ... };

export function initializeBoard() { /* fill board */ }
export function renderBoard() { /* draw board */ }
export function performSwap(r1,c1,r2,c2) { /* swap and check matches */ }
export async function processMatches() { /* cascades */ }
export function activateHero(heroKey) { /* aelia/nocta/vyra/iona abilities */ }
export function restartGame() { initializeBoard(); renderBoard(); 
export function startDiscipleAttackLoop() {
  if (window.__discipleLoopActive) return;
  window.__discipleLoopActive = true;
  setInterval(() => {
    if (window.gameState?.discipleHP > 0 && !window.gameState?.isPaused) {
      if (window.discipleAttackTick) window.discipleAttackTick();
if (gameState.discipleShield > 0) {
  const absorbed = Math.min(damage, gameState.discipleShield);
  gameState.discipleShield -= absorbed;
  damage -= absorbed;
  updateShieldUI();
  if (gameState.discipleShield <= 0) showAlert("Shield broken!");
}

    }
  }, 1000);
}
}
// ==========================================================
// 🛡 Shield-aware disciple damage + attack tick
// ==========================================================

// Apply damage from disciple to player (hero side)
export function discipleAttackTick() {
  const gs = window.gameState;
  if (!gs || gs.discipleHP <= 0) return;

  // Simple damage formula (tune later)
  const damage = 25;

  applyDiscipleDamage(damage);
}

// Core damage function: shield absorbs first, then HP
export function applyDiscipleDamage(amount) {
  const gs = window.gameState;
  if (!gs) return;

  let dmg = amount;
  let shieldAbsorbed = 0;

  // Absorb damage with shield if present
  if (gs.discipleShield && gs.discipleShield > 0) {
    const absorb = Math.min(dmg, gs.discipleShield);
    gs.discipleShield -= absorb;
    dmg -= absorb;
    shieldAbsorbed = absorb;
    if (window.updateShieldUI) window.updateShieldUI();

    if (gs.discipleShield <= 0) {
      if (window.showAlert) window.showAlert("Shield broken!", 1200);
    }
  }

  // Any remaining damage hits HP
  if (dmg > 0) {
    gs.discipleHP = Math.max(0, gs.discipleHP - dmg);
    if (window.updateStats) window.updateStats();
  }

  // Optional logging
  console.log(
    `[damage] ${amount} incoming → ${shieldAbsorbed} absorbed, ${dmg} to HP`
  );

  // Check defeat
  if (gs.discipleHP <= 0) {
    if (window.showAlert) window.showAlert("Disciple defeated!", 1200);
    if (typeof window.showVictoryScreen === "function") {
      window.showVictoryScreen({ wink: "./assets/hero_win.png", color: "#00ffff" });
    }
  }
}

// Expose globally for other modules
try {
  window.discipleAttackTick = discipleAttackTick;
  window.applyDiscipleDamage = applyDiscipleDamage;
} catch (err) {
  console.warn("shield damage hooks failed", err);
}
window.addEventListener("load", initUI);
