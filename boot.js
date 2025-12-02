/* boot.js — FIXED SHUFFLE EXPLOIT */
(function () {
  const PATH = window.location.pathname;
  const IS_GAME = PATH.includes("game.html");
  const IS_MAP  = PATH.includes("map.html");
  const IS_INDEX = PATH.includes("index.html") || PATH.endsWith("/");

  function el(id) { return document.getElementById(id); }

  if (IS_INDEX) {
    document.addEventListener("DOMContentLoaded", () => {
      const btn = el("index-start-btn"); // Kept for legacy fallback
      if (btn) btn.onclick = () => window.location.href = "map.html";
    });
    return;
  }

  if (IS_MAP) { return; }

  if (IS_GAME) {
    document.addEventListener("DOMContentLoaded", () => {
      const params = new URLSearchParams(window.location.search);
      let levelId = parseInt(params.get("level"), 10);
      if (!levelId || levelId < 1) levelId = 1;

      if (window.Engine && typeof Engine.bootLevel === "function") {
        Engine.bootLevel(levelId);
      }

      const btnMap = el("btn-map");
      if (btnMap) btnMap.onclick = () => window.location.href = "map.html";

      const btnRestart = el("btn-restart");
      if (btnRestart) {
        btnRestart.onclick = () => {
          if (window.Engine && Engine.restartLevel) {
            Engine.restartLevel();
          }
        };
      }

      const btnShuffle = el("btn-shuffle");
      if (btnShuffle) {
        // BETA FIX: Shuffle now costs a move!
        btnShuffle.onclick = async () => {
          if (window.Engine && window.Engine.requestShuffle) {
             await Engine.requestShuffle();
          } else if (window.Board && Board.shuffleBoard) {
             // Fallback for older engine
             await Board.shuffleBoard();
          }
        };
      }
    });
    return;
  }
})();