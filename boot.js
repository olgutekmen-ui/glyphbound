// boot.js
// ────────────────────────────────────────────────
// Startup orchestration and victory buttons
// ────────────────────────────────────────────────

import { initializeBoard, processMatches } from "./board.js";
import { enableInput } from "./input.js";
import { updateUI, hideVictoryScreen, linkTransition } from "./ui.js";

window.addEventListener("load", () => {
  initializeBoard();
  enableInput();
  updateUI();

  document.getElementById("victory-playagain").onclick = () => {
    hideVictoryScreen();
    linkTransition("REBOOTING LINK...");
    setTimeout(() => {
      initializeBoard();
      updateUI();
    }, 800);
  };

  document.getElementById("victory-map").onclick = () => {
    linkTransition("RETURNING TO COMMAND...");
    setTimeout(() => (window.location.href = "map.html"), 800);
  };
});
