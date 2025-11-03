// legacy-ui.js
// Bridge between the modular JS and the classic game_fixed.html UI.
// Restores shield HUD, alerts, hero charge indicators, and victory overlays.

import { updateShieldUI, showVictoryOverlay } from "./ui.js";
import { gameState } from "./state.js";
import { restartGame } from "./game.js";

// Expose needed functions globally for inline or legacy references
window.gameState = gameState;
window.updateShieldUI = updateShieldUI;

// Unified alert / message feedback
window.showAlert = (txt, duration = 1500) => {
  const el = document.getElementById("alert-banner");
  if (!el) {
    console.warn("Alert banner not found:", txt);
    return;
  }
  el.textContent = txt;
  el.classList.add("alert-active");
  setTimeout(() => el.classList.remove("alert-active"), duration);
};

// Restore victory screen handling
window.showVictoryScreen = () => {
  try {
    showVictoryOverlay();
  } catch (err) {
    console.warn("showVictoryOverlay() missing, fallback triggered");
    const overlay = document.getElementById("victory-overlay");
    if (overlay) overlay.style.display = "flex";
  }
};

// Restore restart button logic if missing
window.restartGame = window.restartGame || restartGame;

// Compatibility helpers for shield / HP UI
window.updateStats = () => {
  const hpBar = document.getElementById("disciple-hp-bar");
  const hpText = document.getElementById("disciple-hp-text");
  const maxHP = gameState.discipleMaxHP || 1000;
  if (hpBar) hpBar.style.width = `${(gameState.discipleHP / maxHP) * 100}%`;
  if (hpText) hpText.textContent = `${Math.max(0, gameState.discipleHP)} / ${maxHP}`;
  updateShieldUI?.();
};

// Hook ability buttons (hero charges)
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-hero]").forEach(btn => {
    btn.addEventListener("click", e => {
      const hero = e.currentTarget.dataset.hero;
      if (window.activateHeroAbility) window.activateHeroAbility(hero);
    });
  });
});

console.log("%c[legacy-ui.js loaded]%c — Compatibility layer active", "color:#00ffff;font-weight:700", "color:#aaa");
