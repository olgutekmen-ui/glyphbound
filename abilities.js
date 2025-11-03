// abilities.js
// ────────────────────────────────────────────────
// Heroine abilities & victory effects
// ────────────────────────────────────────────────

import { HERO_DATA, gameState, addPrisma } from "./state.js";
import { renderBoard } from "./board.js";
import { showAlert, showVictoryScreen, updateUI } from "./ui.js";

export function applyHeroAbility(heroKey) {
  const hero = HERO_DATA[heroKey];
  if (!hero) return;

  switch (heroKey) {
    case "aelia":
      showAlert("Aelia’s light purifies!");
      break;
    case "nocta":
      showAlert("Nocta shrouds the field!");
      break;
    
case "vyra":
  showAlert("Vyra reinforces the disciple!");

  // Reinforce disciple with a temporary shield (cyan bar)
  applyDiscipleShield(150);
  if (typeof window.showAlert === "function") window.showAlert("Disciple shield online!", 1200);
  break;

    case "iona":
      showAlert("Iona heals all allies!");
      break;
  }

  // simple placeholder: reward prisma & refresh board
  addPrisma(5);
  renderBoard();
  updateUI();

  // victory condition for demonstration
  if (gameState.score > 500) showVictoryScreen(hero);
}

function applyDiscipleShield(amount) {
  const gs = window.gameState || {};
  gs.discipleShieldMax = Math.max(gs.discipleShieldMax || 0, amount|0);
  gs.discipleShield = gs.discipleShieldMax;
  if (typeof window.updateShieldUI === "function") window.updateShieldUI();
}
try { window.applyDiscipleShield = applyDiscipleShield; } catch(_) {}
