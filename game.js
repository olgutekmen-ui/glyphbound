// game.js — overlay wiring for play-again

// ❌ REMOVE THIS (input.js is non-module)
// import * as Input from "./input.js";
// window.Input = Input;

(function () {
  window.addEventListener("gp:play-again", () => {
    if (window.bootGame) {
      window.bootGame({ bossIntro: true });
    } else if (window.Engine && window.Engine.bootLevel) {
      window.Engine.bootLevel();
      if (window.UI && window.UI.updateChibiUI) {
        window.UI.updateChibiUI({ bossIntro: true });
      }
    }
  });
})();
