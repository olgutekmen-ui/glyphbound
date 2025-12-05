/* board.js — V3.4 (DYNAMIC COMBO SCALING) */
(function () {
  const GS = window.gameState || (window.gameState = {});
  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  function randInt(n) { return Math.floor(Math.random() * n); }
  function makeGlyphCell(type) { return { kind: "glyph", type }; }
  function isGlyph(cell) { return cell && cell.kind === "glyph"; }
  function isPoison(cell) { return cell && cell.kind === "poison"; }
  function isFrozen(cell) { return cell && cell.kind === "frozen"; }
  function isJunk(cell) { return cell && cell.kind === "junk"; }
  function isLava(cell) { return cell && cell.kind === "lava"; }
  function isHazard(cell) { return (isPoison(cell) || isFrozen(cell) || isJunk(cell) || isLava(cell)); }
  function isEmpty(cell) { return cell == null; }
  function isStatic(cell) { return isHazard(cell); } 
  function canFall(cell) { return isGlyph(cell); }

  window.isGlyph = isGlyph; window.isPoison = isPoison; window.isFrozen = isFrozen;
  window.isJunk = isJunk; window.isLava = isLava; window.isEmpty = isEmpty; window.isHazard = isHazard;

  function initBoard(N) {
    GS.GRID_SIZE = N;
    GS.board = Array.from({ length: N }, () => Array.from({ length: N }, () => null));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        let t;
        do { t = randInt(4); GS.board[r][c] = makeGlyphCell(t); } 
        while ( (r>=2 && GS.board[r-1][c].type===t && GS.board[r-2][c].type===t) ||
                (c>=2 && GS.board[r][c-1].type===t && GS.board[r][c-2].type===t) );
      }
    }
    window.board = GS.board;
  }

  function findAllMatches() {
    const N = GS.GRID_SIZE;
    const matchedSet = new Set();
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N - 2; c++) {
            const c1 = GS.board[r][c]; const c2 = GS.board[r][c+1]; const c3 = GS.board[r][c+2];
            if (isGlyph(c1) && isGlyph(c2) && isGlyph(c3) && c1.type === c2.type && c1.type === c3.type) {
                matchedSet.add(`${r},${c}`); matchedSet.add(`${r},${c+1}`); matchedSet.add(`${r},${c+2}`);
            }
        }
    }
    for (let c = 0; c < N; c++) {
        for (let r = 0; r < N - 2; r++) {
            const c1 = GS.board[r][c]; const c2 = GS.board[r+1][c]; const c3 = GS.board[r+2][c];
            if (isGlyph(c1) && isGlyph(c2) && isGlyph(c3) && c1.type === c2.type && c1.type === c3.type) {
                matchedSet.add(`${r},${c}`); matchedSet.add(`${r+1},${c}`); matchedSet.add(`${r+2},${c}`);
            }
        }
    }
    return matchedSet;
  }

  function hasPossibleMoves() {
      const N = GS.GRID_SIZE;
      const check = (r, c, type) => {
          if (r<0 || r>=N || c<0 || c>=N) return false;
          if (c>=2 && GS.board[r][c-1]?.type===type && GS.board[r][c-2]?.type===type) return true;
          if (c>=1 && c<N-1 && GS.board[r][c-1]?.type===type && GS.board[r][c+1]?.type===type) return true;
          if (c<N-2 && GS.board[r][c+1]?.type===type && GS.board[r][c+2]?.type===type) return true;
          if (r>=2 && GS.board[r-1][c]?.type===type && GS.board[r-2][c]?.type===type) return true;
          if (r>=1 && r<N-1 && GS.board[r-1][c]?.type===type && GS.board[r+1][c]?.type===type) return true;
          if (r<N-2 && GS.board[r+1][c]?.type===type && GS.board[r+2][c]?.type===type) return true;
          return false;
      };
      for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
              if (!isGlyph(GS.board[r][c])) continue;
              const t = GS.board[r][c].type;
              if (c < N - 1 && isGlyph(GS.board[r][c+1])) { if (check(r, c+1, t) || check(r, c, GS.board[r][c+1].type)) return true; }
              if (r < N - 1 && isGlyph(GS.board[r+1][c])) { if (check(r+1, c, t) || check(r, c, GS.board[r+1][c].type)) return true; }
          }
      }
      return false;
  }

  function applyGravityAndRefill() {
    const N = GS.GRID_SIZE;
    for (let c = 0; c < N; c++) {
      for (let r = N - 1; r >= 0; r--) {
        if (GS.board[r][c] === null) {
          for (let k = r - 1; k >= 0; k--) {
            const above = GS.board[k][c];
            if (isStatic(above)) break;
            if (canFall(above)) {
              GS.board[r][c] = above;
              GS.board[k][c] = null;
              break; 
            }
          }
        }
      }
    }
    for (let c = 0; c < N; c++) {
       for (let r = 0; r < N; r++) { if (GS.board[r][c] === null) GS.board[r][c] = makeGlyphCell(randInt(4)); }
    }
  }

  async function processBoardUntilStable() {
    let stable = false;
    let safeguard = 0;
    let comboStreak = 0;

    const COSTS = window.ABILITY_COSTS || { aelia:20, nocta:25, vyra:30, iona:35 };

    while (!stable && safeguard < 20) {
        if (GS.victoryTriggered) break;

        applyGravityAndRefill();
        if (window.UI && UI.renderBoard) UI.renderBoard();
        if (safeguard > 0) await delay(300);

        const matchedSet = findAllMatches();
        
        if (matchedSet.size === 0) {
            if (!hasPossibleMoves()) {
                shuffleGlyphsOnly();
                if (window.UI && UI.flashAlert) UI.flashAlert("NO MOVES - AUTO SHUFFLE");
                continue; 
            }
            stable = true;
        } else {
            stable = false;
            
            if (GS.victoryTriggered) break;

            try { 
                if(window.AudioSys && AudioSys.play) {
                    const pitchMult = 1.0 + (comboStreak * 0.15);
                    AudioSys.play('match', pitchMult); 
                }
            } catch(e){}

            if(window.FX && comboStreak > 0) FX.showCombo(comboStreak + 1);
            if(window.FX && FX.explode) {
                matchedSet.forEach(key => {
                    const [r, c] = key.split(',').map(Number);
                    const cell = GS.board[r][c];
                    if (cell) FX.explode(r, c, cell.type);
                });
            }

            const uniqueMatches = matchedSet.size; 
            if (window.Abilities && window.Abilities.applyHeroDamage) {
                let dmgMult = 1.0;
                let chgMult = 1.0;
                if (window.Artifacts) {
                    dmgMult = Artifacts.getDamageMult();
                    chgMult = Artifacts.getChargeMult();
                }
                
                // DYNAMIC COMBO SCALING
                // Starts at 5% per step. Adds 0.05% per level. Capped at 15%.
                let comboFactor = 0.05 + (GS.currentLevelId * 0.0005);
                if (comboFactor > 0.15) comboFactor = 0.15;

                const baseDmg = 50 * dmgMult; 
                const multiplier = 1 + (comboStreak * comboFactor); 
                const dmg = Math.floor((uniqueMatches / 3) * baseDmg * multiplier);
                
                window.Abilities.applyHeroDamage("board", dmg);
                if (window.FX) FX.showDamage(dmg);
                
                const chgBonus = (uniqueMatches > 3 ? 2 : 1) * chgMult;
                GS.aeliaCharge = Math.min(COSTS.aelia, GS.aeliaCharge + chgBonus);
                GS.noctaCharge = Math.min(COSTS.nocta, GS.noctaCharge + (1 * chgMult));
                GS.vyraCharge = Math.min(COSTS.vyra, GS.vyraCharge + (1 * chgMult));
                GS.ionaCharge = Math.min(COSTS.iona, GS.ionaCharge + (1 * chgMult));
            }

            if (GS.victoryTriggered) break;

            matchedSet.forEach(key => {
                const [r, c] = key.split(',').map(Number);
                [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(([nr, nc]) => {
                    if (nr>=0 && nr<GS.GRID_SIZE && nc>=0 && nc<GS.GRID_SIZE) {
                        if (isHazard(GS.board[nr][nc])) {
                            GS.board[nr][nc] = null;
                            if(window.Quests) Quests.report('destroy_haz');
                        }
                    }
                });
                GS.board[r][c] = null;
            });
            
            if(window.Quests && comboStreak >= 2) Quests.report('combo_x3');
            if (window.UI && UI.renderBoard) UI.renderBoard();
            await delay(200);

            comboStreak++;
            safeguard++;
        }
    }
    
    if (!GS.victoryTriggered) {
        spreadHazards();
        if (window.UI && UI.renderBoard) UI.renderBoard();
    }
  }

  function spreadHazards() {
      const N = GS.GRID_SIZE;
      let totalHazards = 0;
      for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(isHazard(GS.board[r][c])) totalHazards++;
      if (totalHazards > (N * N * 0.30)) return;

      const poisons = [];
      for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(isPoison(GS.board[r][c])) poisons.push({r,c});
      if(poisons.length) {
          const seed = poisons[randInt(poisons.length)];
          const g = [[seed.r-1,seed.c],[seed.r+1,seed.c],[seed.r,seed.c-1],[seed.r,seed.c+1]].filter(([r,c])=>r>=0&&r<N&&c>=0&&c<N&&isGlyph(GS.board[r][c]));
          if(g.length) { const [rr,cc] = g[randInt(g.length)]; GS.board[rr][cc] = {kind:"poison"}; }
      }
      const lavas = [];
      for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(isLava(GS.board[r][c])) lavas.push({r,c});
      if(lavas.length) {
          const seed = lavas[randInt(lavas.length)];
          const g = [[seed.r-1,seed.c],[seed.r+1,seed.c],[seed.r,seed.c-1],[seed.r,seed.c+1]].filter(([r,c])=>r>=0&&r<N&&c>=0&&c<N&&isGlyph(GS.board[r][c]));
          if(g.length) { const [rr,cc] = g[randInt(g.length)]; GS.board[rr][cc] = {kind:"lava"}; }
      }
  }

  function performSwap(r1, c1, r2, c2) {
    const a = GS.board[r1][c1]; const b = GS.board[r2][c2];
    GS.board[r1][c1] = b; GS.board[r2][c2] = a;
    const matches = findAllMatches();
    if (matches.size === 0) { GS.board[r1][c1] = a; GS.board[r2][c2] = b; return false; }
    return true;
  }
  function shuffleGlyphsOnly() {
    const N = GS.GRID_SIZE; const glyphs = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { if (isGlyph(GS.board[r][c])) { glyphs.push(GS.board[r][c]); } }
    for (let i = glyphs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [glyphs[i], glyphs[j]] = [glyphs[j], glyphs[i]]; }
    let idx = 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { if (isGlyph(GS.board[r][c])) { GS.board[r][c] = glyphs[idx++]; } }
  }
  async function shuffleBoard() { shuffleGlyphsOnly(); await processBoardUntilStable(); }
  window.Board = { initBoard, findAllMatches, processBoardUntilStable, processAllMatches: processBoardUntilStable, performSwap, forceFill: applyGravityAndRefill, shuffleBoard };
})();