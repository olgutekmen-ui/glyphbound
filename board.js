// boot.js
// Single entry point that can be imported (ESM) AND called from window

import { initializeBoard, renderBoard, updateStats } from "./board.js";
import { wireUI, wireVictoryButtons, ensureAlertBanner } from "./ui.js"; // if you don't have these exact exports, it's fine; we guard below
import { currentLevelId, loadLevelIntoState } from "./state.js";

// Optional helpers – guarded calls
function tryFn(fnName, ...args) {
  const fn =
    (typeof fnName === "function" && fnName) ||
    (typeof window[fnName] === "function" && window[fnName]);
  if (!fn) return false;
  try { fn(...args); } catch (_) {}
  return true;
}

// This is the canonical boot. Exported and also attached to window.
export function bootGame() {
  // 1) Level wiring (if state exposes a loader)
  if (typeof loadLevelIntoState === "function") {
    loadLevelIntoState(currentLevelId || 1);
  } else {
    tryFn("loadLevelIntoState", currentLevelId || 1);
  }

  // 2) Build board + UI
  if (typeof initializeBoard === "function") initializeBoard();
  if (typeof renderBoard === "function") renderBoard();
  if (typeof updateStats === "function") updateStats();

  // 3) Optional UI wiring
  if (typeof wireUI === "function") wireUI();
  if (typeof wireVictoryButtons === "function") wireVictoryButtons();
  if (typeof ensureAlertBanner === "function") ensureAlertBanner();

  // 4) Make sure shield UI reflects current level rules (if present)
  tryFn("disciplePhaseCheck");
  tryFn("updateShieldUI");

  // 5) Resolve any auto-matches that spawned on first fill (if engine exposes it)
  tryFn("processMatches");
}

// Expose for non-module callers
// (lets <script nomodule> or older code do: window.bootGame())
window.bootGame = bootGame;

// Auto-boot on load so you don't *have* to call bootGame()
window.addEventListener("load", () => {
  bootGame();
});
