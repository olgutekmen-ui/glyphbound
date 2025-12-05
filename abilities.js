/* abilities.js — V4.1 (FLAGGED ABILITIES + BALANCE) */
(function () {
  const GS = window.GameState || window.gameState;
  const UI = window.UI;
  const delay = (ms) => new Promise(res => setTimeout(res, ms)); 

  let reduction = 0;
  if (window.Artifacts && typeof Artifacts.getCostReduction === 'function') {
      reduction = Artifacts.getCostReduction();
  }

  // COSTS: Aelia 25
  const BASE_COSTS = { aelia: 25, nocta: 22, vyra: 25, iona: 30 };

  const COSTS = {
      aelia: Math.floor(BASE_COSTS.aelia * (1 - reduction)),
      nocta: Math.floor(BASE_COSTS.nocta * (1 - reduction)),
      vyra:  Math.floor(BASE_COSTS.vyra * (1 - reduction)),
      iona:  Math.floor(BASE_COSTS.iona * (1 - reduction))
  };

  window.ABILITY_COSTS = COSTS;

  function getScaledDamage(base, growth) {
      const lvl = GS.currentLevelId || 1;
      let dmg = base + (lvl * growth);
      let mult = 1.0;
      if (window.Artifacts && typeof Artifacts.getDamageMult === 'function') {
          mult = Artifacts.getDamageMult();
      }
      return Math.floor(dmg * mult);
  }

  function updateStatsSync() {
      const hpBar = document.getElementById("disciple-hp-bar");
      const hpLabel = document.getElementById("disciple-hp-label");
      if (hpBar && GS.discipleHP != null) {
          const pct = Math.max(0, GS.discipleHP / GS.discipleMaxHP);
          hpBar.style.width = (pct * 100) + "%";
          void hpBar.offsetWidth; 
      }
      if (hpLabel && GS.discipleHP != null) hpLabel.textContent = GS.discipleHP + " HP";
      const m = document.getElementById("moves-left");
      if (m) m.textContent = GS.movesLeft;
  }

  function applyHeroDamage(sourceHero, rawDamage) {
    if (!GS.discipleHP || GS.discipleHP <= 0) return true;
    const actual = Math.max(0, Math.floor(rawDamage));
    GS.discipleHP = Math.max(0, GS.discipleHP - actual);
    updateStatsSync();
    if (window.FX) {
        if (actual > (GS.discipleMaxHP * 0.1)) { FX.shake(2); FX.showDamage(actual, true); }
        else { FX.showDamage(actual); }
    }
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

  function payMoveCost() {
      if (GS.movesLeft <= 0) return false;
      GS.movesLeft--;
      if (window.UI && UI.updateStats) UI.updateStats();
      return true;
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
      if (window.Board && window.Board.forceFill) {
          window.Board.forceFill(); 
          if (window.UI && UI.renderBoard) UI.renderBoard(); 
          await delay(100); 
      }
      if (window.Board && window.Board.processBoardUntilStable) {
          await window.Board.processBoardUntilStable();
      }
  }

  // --- SAFE WRAPPER FOR ABILITY TURN ---
  async function performAbility(logicFn) {
      if (GS.movesLeft <= 0) { if(window.UI && UI.flashAlert) UI.flashAlert("NO MOVES LEFT!"); return; }
      
      // SET FLAG
      GS.isAbilityTurn = true;
      payMoveCost();
      GS.isProcessing = true;
      
      try {
          await logicFn();
      } catch(e) { 
          console.error(e); 
      } finally { 
          // RESET FLAG
          GS.isAbilityTurn = false;
          if (GS.discipleHP > 0) GS.isProcessing = false; 
      }
  }

  async function activateAelia() {
    if (GS.isProcessing || GS.aeliaCharge < COSTS.aelia) return;
    if(window.Quests) Quests.report('use_ulti'); 
    resetCharge("aelia");
    
    await performAbility(async () => {
        // V7.0 NERF: 1500 + 100/lvl
        const dmg = getScaledDamage(1500, 100);
        const isDead = applyHeroDamage("aelia", dmg); 
        if (isDead) return;
        const row = Math.floor(Math.random() * GS.GRID_SIZE);
        const toClear = [];
        for (let c = 0; c < GS.GRID_SIZE; c++) { const cell = GS.board[row][c]; if (cell) toClear.push({ r: row, c }); }
        await clearAndFill(toClear);
    });
  }

  async function activateNocta() {
    if (GS.isProcessing || GS.noctaCharge < COSTS.nocta) return;
    if(window.Quests) Quests.report('use_ulti'); 
    resetCharge("nocta");
    await performAbility(async () => {
        const dmg = getScaledDamage(1200, 90);
        applyHeroDamage("nocta", dmg); 
        const N = GS.GRID_SIZE; const candidates = [];
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { if (GS.board[r][c]) candidates.push({ r, c }); }
        for (let i = candidates.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]]; }
        const toClear = candidates.slice(0, Math.min(9, candidates.length));
        await clearAndFill(toClear);
    });
  }

  async function activateIona() {
    if (GS.isProcessing || GS.ionaCharge < COSTS.iona) return;
    if(window.Quests) Quests.report('use_ulti');
    resetCharge("iona");
    await performAbility(async () => {
        const dmg = getScaledDamage(1000, 80);
        const isDead = applyHeroDamage("iona", dmg);
        if (isDead) return;
        const types = [];
        for (let r=0; r<GS.GRID_SIZE; r++) for (let c=0; c<GS.GRID_SIZE; c++) { const cell = GS.board[r][c]; if (window.isGlyph(cell) && !types.includes(cell.type)) types.push(cell.type); }
        if (!types.length) { GS.isProcessing = false; return; }
        const t = types[Math.floor(Math.random() * types.length)];
        const toClear = [];
        for (let r=0; r<GS.GRID_SIZE; r++) for (let c=0; c<GS.GRID_SIZE; c++) { if (window.isGlyph(GS.board[r][c]) && GS.board[r][c].type === t) toClear.push({ r, c }); }
        await clearAndFill(toClear);
    });
  }

  async function activateVyra() {
    if (GS.isProcessing || GS.vyraCharge < COSTS.vyra) return;
    if(window.Quests) Quests.report('use_ulti'); 
    resetCharge("vyra");
    await performAbility(async () => {
        const dmg = getScaledDamage(1000, 80);
        const isDead = applyHeroDamage("vyra", dmg); 
        if (isDead) return;
        const max = GS.GRID_SIZE - 2;
        const r0 = 1 + Math.floor(Math.random() * max);
        const c0 = 1 + Math.floor(Math.random() * max);
        const toClear = [];
        for (let r = r0 - 1; r <= r0 + 1; r++) { for (let c = c0 - 1; c <= c0 + 1; c++) { const cell = GS.board[r][c]; if (cell) toClear.push({ r, c }); } }
        await clearAndFill(toClear);
    });
  }

  window.Abilities = { activateAelia, activateNocta, activateVyra, activateIona, applyHeroDamage };
})();