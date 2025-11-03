// ui.js
// ────────────────────────────────────────────────
// HUD, overlays, alerts, victory & transitions
// ────────────────────────────────────────────────

import { gameState, HERO_DATA, savePrisma } from "./state.js";

export function updateUI() {
  document.getElementById("score").textContent = gameState.score;
  document.getElementById("moves-left").textContent = gameState.movesLeft;
  document.getElementById("disciple-hp").textContent = gameState.discipleHP;
  document.getElementById("prisma-count").textContent = gameState.prisma;
  savePrisma();
}

export function showAlert(msg, ms = 1000) {
  const el = document.getElementById("alert-banner");
  el.textContent = msg;
  el.classList.add("alert-active");
  setTimeout(() => el.classList.remove("alert-active"), ms);
}

export function showVictoryScreen(hero) {
  const overlay = document.getElementById("victory-overlay");
  const chibi = document.getElementById("victory-chibi");
  const text = document.getElementById("victory-text");

  // Chibi + style
  if (chibi && hero?.wink) chibi.src = hero.wink;
  if (text && hero?.color) text.style.color = hero.color;

  // Show overlay
  overlay?.classList.add("active");

  // --- Prisma reward injection ---
  try {
    const reward = (window.activeLevel && window.activeLevel.rewards && window.activeLevel.rewards.prisma)
      ? window.activeLevel.rewards.prisma
      : 25;
    if (window.economy && reward > 0) {
      window.economy.addPrisma(reward);
      console.log(`[economy] Added ${reward} Prisma for victory.`);
      if (window.showAlert) window.showAlert(`+${reward} Prisma earned! 💠`, 1600);
    }
  } catch (e) {
    console.warn("[economy] reward grant failed", e);
  }
  // --- End Prisma reward injection ---
}

export function hideVictoryScreen() {
  const overlay = document.getElementById("victory-overlay");
  overlay.classList.remove("active");
}

export function linkTransition(textOverride) {
  const overlay = document.getElementById("link-overlay");
  const txt = document.getElementById("link-overlay-text");
  const phrases = [
    "ESTABLISHING LINK...",
    "UPLINK SYNCHRONIZING...",
    "NEURAL LOCK VERIFIED...",
    "SIGNAL PHASE ALIGNMENT..."
  ];
  txt.textContent = textOverride || phrases[Math.floor(Math.random() * phrases.length)];
  overlay.style.opacity = "1";
  overlay.style.pointerEvents = "all";
  setTimeout(() => {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
  }, 800);
}

export function ensureShieldBar() {
  // Try to find an existing shield bar
  let el = document.getElementById("disciple-shield-bar");
  if (el) return el;

  // Try to attach under HP container if present
  const hpWrap = document.getElementById("disciple-hp-container") || document.body;
  el = document.createElement("div");
  el.id = "disciple-shield-bar";
  el.style.cssText = "height:6px;background:#00ffff;width:0%;transition:width .2s;box-shadow:0 0 8px #00ffff;margin-top:4px;border-radius:4px;";
  // Place it just after the HP bar if possible
  if (hpWrap && hpWrap.parentNode) {
    hpWrap.parentNode.insertBefore(el, hpWrap.nextSibling);
  } else {
    document.body.appendChild(el);
  }
  return el;
}

export function updateShieldUI() {
  const gs = window.gameState || {};
  const max = gs.discipleShieldMax || 0;
  const val = gs.discipleShield || 0;
  const el = ensureShieldBar();
  const pct = max > 0 ? Math.max(0, Math.min(100, (val / max) * 100)) : 0;
  el.style.width = pct + "%";
  el.style.background = pct > 0 ? "#00ffff" : "transparent";
  el.style.boxShadow = pct > 0 ? "0 0 8px #00ffff" : "none";
}

try { window.updateShieldUI = updateShieldUI; } catch(_) {}

try { window.ensureShieldBar = ensureShieldBar; } catch(_) {}
