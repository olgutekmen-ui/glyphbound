/* board.js — FINAL STABLE CORE V2.0 */
(function () {
  const GS = window.gameState || (window.gameState = {});

  // --- INTERNAL DELAY HELPER (Prevents Dependency Crash) ---
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // --- HELPERS ---
  function randInt(n) { return Math.floor(Math.random() * n); }
  function makeGlyphCell(type) { return { kind: "glyph", type }; }
  
  function isGlyph(cell) { return cell && cell.kind === "glyph"; }
  function isPoison(cell) { return cell && cell.kind === "poison"; }
  function isFrozen(cell) { return cell && cell.kind === "frozen"; }
  function isJunk(cell) { return cell && cell.kind === "junk"; }
  function isLava(cell) { return cell && cell.kind === "lava"; }
  
  function isHazard(cell) { return (isPoison(cell) || isFrozen(cell) || isJunk(cell) || isLava(cell)); }
  function isEmpty(cell) { return cell == null; }
  
  // Logic
  function isStatic(cell) { return isHazard(cell); } 
  function canFall(cell) { return isGlyph(cell); }

  // CRITICAL EXPORTS (For Items.js)
  window.isGlyph = isGlyph; 
  window.isPoison = isPoison; 
  window.isFrozen = isFrozen; 
  window.isJunk = isJunk; 
  window.isLava = isLava; 
  window.isEmpty = isEmpty; 
  window.isHazard = isHazard;

  function initBoard(N) {
    GS.GRID_SIZE = N;
    GS.board = Array.from({ length: N }, () => Array.from({ length: N }, () => null));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        let t;
        // Simple prevention of initial matches
        do { t = randInt(4); GS.board[r][c] = makeGlyphCell(t); } 
        while ( (r>=2 && GS.board[r-1][c].type===t && GS.board[r-2][c].type===t) ||
                (c>=2 && GS.board[r][c-1].type===t && GS.board[r][c-2].type===t) );
      }
    }
    window.board = GS.board;
  }

  // --- MATCH FINDER ---
  function checkMatchAtOnBoard(bd, r, c) {
    if (!bd || !bd[r] || !bd[r][c]) return []; 
    const cell = bd[r][c];
    if (!isGlyph(cell)) return [];
    const t = cell.type;
    const N = bd.length;
    let out = [];
    
    let temp = [{ r, c }];
    let x = c - 1; while (x >= 0 && bd[r][x] && isGlyph(bd[r][x]) && bd[r][x].type === t) { temp.push({ r, c: x }); x--; }
    x = c + 1; while (x < N && bd[r][x] && isGlyph(bd[r][x]) && bd[r][x].type === t) { temp.push({ r, c: x }); x++; }
    if (temp.length >= 3) out = out.concat(temp);

    temp = [{ r, c }];
    let y = r - 1; while (y >= 0 && bd[y] && isGlyph(bd[y][c]) && bd[y][c].type === t) { temp.push({ r: y, c }); y--; }
    y = r + 1; while (y < N && bd[y] && isGlyph(bd[y][c]) && bd[y][c].type === t) { temp.push({ r: y, c }); y++; }
    if (temp.length >= 3) out = out.concat(temp);

    return out;
  }

  function findAllMatches() {
    const N = GS.GRID_SIZE;
    const matches = {};
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const m = checkMatchAtOnBoard(GS.board, r, c);
        if (m.length >= 3) {
          for (const pos of m) matches[`${pos.r}-${pos.c}`] = pos;
        }
      }
    }
    return matches;
  }

  // --- GRAVITY & REFILL ---
  function applyGravityAndRefill() {
    const N = GS.GRID_SIZE;
    // 1. Fall
    for (let c = 0; c < N; c++) {
      for (let r = N - 1; r >= 0; r--) {
        if (GS.board[r][c] === null) {
          for (let k = r - 1; k >= 0; k--) {
            const above = GS.board[k][c];
            if (isStatic(above)) break; // Blocked
            if (canFall(above)) {
              GS.board[r][c] = above;
              GS.board[k][c] = null;
              break; 
            }
          }
        }
      }
    }
    // 2. Refill Holes
    for (let c = 0; c < N; c++) {
       for (let r = 0; r < N; r++) {
           if (GS.board[r][c] === null) {
               GS.board[r][c] = makeGlyphCell(randInt(4));
           }
       }
    }
  }

  // --- CLEANUP ---
  function cleanHazardsAdjacentTo(matches) {
    const N = GS.GRID_SIZE;
    for (const key in matches) {
      const { r, c } = matches[key];
      [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(([nr, nc]) => {
        if (nr>=0 && nr<N && nc>=0 && nc<N) {
          if (isHazard(GS.board[nr][nc])) GS.board[nr][nc] = null;
        }
      });
    }
  }

  // --- MAIN PROCESS LOOP ---
  async function processBoardUntilStable() {
    try {
        let stable = false;
        let safeguard = 0;
        let comboStreak = 0;

        // Loop until NO matches are found
        while (!stable && safeguard < 30) {
            
            // 1. GRAVITY: Fill the board first
            applyGravityAndRefill();
            
            // 2. RENDER: Show the player the filled board
            if (window.UI && UI.renderBoard) UI.renderBoard();
            
            // 3. DELAY: Wait for eye to catch up (only if not first frame)
            if (safeguard > 0) await delay(250);

            // 4. CHECK: Are there matches now?
            const matches = findAllMatches();
            const matchCount = Object.keys(matches).length;

            if (matchCount === 0) {
                stable = true; // EXIT CONDITION
            } else {
                stable = false; // KEEP GOING
                
                // Audio
                try { if(window.AudioSys && AudioSys.play) AudioSys.play('match'); } catch(e){}

                // FX
                if (window.FX && FX.explode) {
                    for (const key in matches) {
                        const { r, c } = matches[key];
                        if (GS.board[r][c]) FX.explode(r, c, GS.board[r][c].type);
                    }
                }

                // Damage
                if (window.Abilities && window.Abilities.applyHeroDamage) {
                    const baseDmg = 25;
                    const multiplier = 1 + (comboStreak * 0.1); 
                    const dmg = Math.floor((matchCount / 3) * baseDmg * multiplier);
                    
                    window.Abilities.applyHeroDamage("board", dmg);
                    
                    if (window.FX) {
                        FX.showDamage(dmg);
                        // Safely check if showCombo exists
                        if (comboStreak > 0 && FX.showCombo) FX.showCombo(comboStreak + 1);
                    }

                    // Charge Heroes
                    GS.aeliaCharge = Math.min(10, GS.aeliaCharge + (matchCount > 3 ? 2 : 1));
                    GS.noctaCharge = Math.min(12, GS.noctaCharge + 1);
                    GS.vyraCharge = Math.min(15, GS.vyraCharge + 1);
                    GS.ionaCharge = Math.min(18, GS.ionaCharge + 1);
                }

                // Destroy Data
                cleanHazardsAdjacentTo(matches);
                for (const key in matches) { const { r, c } = matches[key]; GS.board[r][c] = null; }

                // Loop repeats -> Gravity will fill these holes -> Check again
                comboStreak++;
                safeguard++;
            }
        }

        // End of Turn Hazards
        if(window.spreadPoison) window.spreadPoison(); else spreadPoisonLocal();
        if(window.spreadLava) window.spreadLava(); else spreadLavaLocal();
        
        // Final Render
        if (window.UI && UI.renderBoard) UI.renderBoard();

    } catch (err) {
        console.error("BOARD CRASH RECOVERED:", err);
        GS.isProcessing = false;
    }
  }

  // Hazard Logic
  function spreadPoisonLocal() {
    const N = GS.GRID_SIZE; const p=[]; for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(isPoison(GS.board[r][c]))p.push({r,c});
    if(p.length){ const s=p[randInt(p.length)]; const g=[[s.r-1,s.c],[s.r+1,s.c],[s.r,s.c-1],[s.r,s.c+1]].filter(([r,c])=>r>=0&&r<N&&c>=0&&c<N&&isGlyph(GS.board[r][c])); if(g.length){const[rr,cc]=g[randInt(g.length)];GS.board[rr][cc]={kind:"poison"}} }
  }
  function spreadLavaLocal() {
    const N = GS.GRID_SIZE; const l=[]; for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(isLava(GS.board[r][c]))l.push({r,c});
    if(l.length){ const s=l[randInt(l.length)]; const g=[[s.r-1,s.c],[s.r+1,s.c],[s.r,s.c-1],[s.r,s.c+1]].filter(([r,c])=>r>=0&&r<N&&c>=0&&c<N&&isGlyph(GS.board[r][c])); if(g.length){const[rr,cc]=g[randInt(g.length)];GS.board[rr][cc]={kind:"lava"}} }
  }

  function performSwap(r1, c1, r2, c2) {
    const a = GS.board[r1][c1]; const b = GS.board[r2][c2];
    GS.board[r1][c1] = b; GS.board[r2][c2] = a;
    const matches = findAllMatches();
    if (Object.keys(matches).length === 0) { GS.board[r1][c1] = a; GS.board[r2][c2] = b; return false; }
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

  window.Board = {
    initBoard, findAllMatches, processBoardUntilStable, processAllMatches: processBoardUntilStable, 
    performSwap, forceFill: applyGravityAndRefill, shuffleBoard
  };
})();