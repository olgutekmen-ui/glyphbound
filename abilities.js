/* abilities.js — FINAL: INSTANT DAMAGE + FX */
(function () {
  const GS = window.GameState || window.gameState;
  const UI = window.UI;
  const delay = (ms) => new Promise(res => setTimeout(res, ms)); // Internal delay helper

  // Sync HP
  function updateStatsSync() {
      const hpBar = document.getElementById("disciple-hp-bar");
      const hpLabel = document.getElementById("disciple-hp-label");
      if (hpBar && GS.discipleHP != null) {
          const pct = Math.max(0, GS.discipleHP / GS.discipleMaxHP);
          hpBar.style.width = (pct * 100) + "%";
          void hpBar.offsetWidth; 
      }
      if (hpLabel && GS.discipleHP != null) hpLabel.textContent = GS.discipleHP + " HP";
  }

  function applyHeroDamage(sourceHero, rawDamage) {
    if (!GS.discipleHP || GS.discipleHP <= 0) return true;
    
    const actual = Math.max(0, Math.floor(rawDamage));
    GS.discipleHP = Math.max(0, GS.discipleHP - actual);

    updateStatsSync();

    if (window.FX) {
        if (actual > 500) { FX.shake(2); FX.showDamage(actual, true); }
        else { FX.showDamage(actual); }
    }
    // Sound for abilities
    if (window.AudioSys && sourceHero !== "board") AudioSys.play('cast');

    if (GS.discipleHP <= 0) {
        if (window.Engine && window.Engine.handleVictory) window.Engine.handleVictory();
        GS.isProcessing = false; 
        return true; 
    }
    return false;
  }

  function resetCharge(heroName) {
      const propName = heroName + "Charge"; 
      if (typeof GS[propName] !== 'undefined') GS[propName] = 0;
      if (UI && UI.updateAbilityUI) UI.updateAbilityUI();
  }

  async function clearAndFill(cellsToClear) {
      if (!cellsToClear.length) return;
      
      cellsToClear.forEach(({ r, c }) => {
        const el = document.getElementById(`cell-${r}-${c}`);
        if (el && el.firstChild) {
            el.firstChild.style.opacity = "0";
            el.firstChild.style.transform = "scale(0)";
        }
      });
      await delay(150);

      cellsToClear.forEach(({ r, c }) => GS.board[r][c] = null);
      
      if (window.Board && window.Board.processBoardUntilStable) {
          await window.Board.processBoardUntilStable();
      }
  }

  async function activateAelia() {
    if (GS.isProcessing || GS.aeliaCharge < 10) return;
    resetCharge("aelia");
    GS.isProcessing = true;
    try {
      const isDead = applyHeroDamage("aelia", 2500); 
      if (isDead) return;
      const row = Math.floor(Math.random() * GS.GRID_SIZE);
      const toClear = [];
      for (let c = 0; c < GS.GRID_SIZE; c++) { const cell = GS.board[row][c]; if (cell) toClear.push({ r: row, c }); }
      await clearAndFill(toClear);
    } catch(e) { console.error(e); } finally { if (GS.discipleHP > 0) GS.isProcessing = false; }
  }

  async function activateNocta() {
    if (GS.isProcessing || GS.noctaCharge < 12) return;
    resetCharge("nocta");
    GS.isProcessing = true;
    try {
      applyHeroDamage("nocta", 1500); 
      const N = GS.GRID_SIZE; const candidates = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { if (GS.board[r][c]) candidates.push({ r, c }); }
      for (let i = candidates.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]]; }
      const toClear = candidates.slice(0, Math.min(9, candidates.length));
      await clearAndFill(toClear);
    } catch(e) { console.error(e); } finally { if (GS.discipleHP > 0) GS.isProcessing = false; }
  }

  async function activateIona() {
    if (GS.isProcessing || GS.ionaCharge < 18) return;
    resetCharge("iona");
    GS.isProcessing = true;
    try {
      const isDead = applyHeroDamage("iona", 1000);
      if (isDead) return;
      const types = [];
      for (let r=0; r<GS.GRID_SIZE; r++) for (let c=0; c<GS.GRID_SIZE; c++) { const cell = GS.board[r][c]; if (window.isGlyph(cell) && !types.includes(cell.type)) types.push(cell.type); }
      if (!types.length) { GS.isProcessing = false; return; }
      const t = types[Math.floor(Math.random() * types.length)];
      const toClear = [];
      for (let r=0; r<GS.GRID_SIZE; r++) for (let c=0; c<GS.GRID_SIZE; c++) { if (window.isGlyph(GS.board[r][c]) && GS.board[r][c].type === t) toClear.push({ r, c }); }
      await clearAndFill(toClear);
    } catch(e) { console.error(e); } finally { if (GS.discipleHP > 0) GS.isProcessing = false; }
  }

  async function activateVyra() {
    if (GS.isProcessing || GS.vyraCharge < 15) return;
    resetCharge("vyra");
    GS.isProcessing = true;
    try {
      const isDead = applyHeroDamage("vyra", 500); 
      if (isDead) return;
      const max = GS.GRID_SIZE - 2;
      const r0 = 1 + Math.floor(Math.random() * max);
      const c0 = 1 + Math.floor(Math.random() * max);
      const toClear = [];
      for (let r = r0 - 1; r <= r0 + 1; r++) { for (let c = c0 - 1; c <= c0 + 1; c++) { const cell = GS.board[r][c]; if (cell) toClear.push({ r, c }); } }
      await clearAndFill(toClear);
    } catch(e) { console.error(e); } finally { if (GS.discipleHP > 0) GS.isProcessing = false; }
  }

  window.Abilities = { activateAelia, activateNocta, activateVyra, activateIona, applyHeroDamage };
})();