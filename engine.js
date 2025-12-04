/* engine.js — V2.1 (QUEST HOOKS) */
(function () {
  const GS = window.GameState || window.gameState || (window.gameState = {});
  const delay = window.delay || (ms => new Promise(res => setTimeout(res, ms)));
  let timerInterval = null;
  let defeatReason = 'moves';

  function startLevelTimer() {
      if (timerInterval) clearInterval(timerInterval);
      GS.timeLeft = (GS.activeLevel && GS.activeLevel.time) ? GS.activeLevel.time : 120; 
      timerInterval = setInterval(() => {
          if (GS.isProcessing || GS.victoryTriggered) return;
          GS.timeLeft--;
          if (window.UI && UI.updateStats) UI.updateStats();
          if (GS.timeLeft <= 0) {
              clearInterval(timerInterval);
              handleDefeat('time');
          }
      }, 1000);
  }

  function getSafeRandomGlyph() {
    const c=[]; const N=GS.GRID_SIZE; for(let r=0;r<N;r++)for(let k=0;k<N;k++){const l=GS.board[r][k];if(l&&l.kind==="glyph")c.push({r,c:k})}
    if(!c.length)return null; return c[Math.floor(Math.random()*c.length)];
  }

  function performDiscipleAttack(type, forcedTarget) {
    if(window.AudioSys) AudioSys.play('warning');
    const target = forcedTarget || getSafeRandomGlyph();
    if(target) {
        if (window.FX && FX.shake) FX.shake(1);
        const {r, c} = target;
        if (type === "poison") GS.board[r][c] = { kind: "poison" };
        else if (type === "drain") GS.board[r][c] = { kind: "lava" };
        else if (type === "deceit") GS.board[r][c] = { kind: "frozen" };
        else GS.board[r][c] = { kind: "junk" };
    }
    if(window.UI && UI.renderBoard) UI.renderBoard();
  }

  function discipleAttackIfReady() {
    if (!GS.disciple || GS.discipleHP <= 0) return;
    const every = GS.discipleAttackRate || 3; 
    if (GS.turnsTaken > 0 && GS.turnsTaken % every === 0) {
        GS.isProcessing = true; 
        const target = getSafeRandomGlyph();
        if (target) {
            if (window.UI && UI.highlightTile) UI.highlightTile(target.r, target.c, true);
            if (window.UI && UI.flashAlert) UI.flashAlert(`WARNING: ${GS.disciple.name} ATTACK!`, 1000);
            setTimeout(() => { 
                if (window.UI && UI.highlightTile) UI.highlightTile(target.r, target.c, false);
                performDiscipleAttack(GS.disciple.attack || "greed", target); 
                GS.isProcessing = false;
            }, 1000); 
        } else { GS.isProcessing = false; }
    }
  }

  async function handleVictory() {
    if (GS.victoryTriggered) return; 
    GS.victoryTriggered = true;
    GS.isProcessing = true; 
    if(timerInterval) clearInterval(timerInterval);
    if(window.AudioSys) { AudioSys.stopBGM(); AudioSys.play('win'); }

    // --- QUEST HOOK ---
    if(window.Quests) {
        Quests.report('win_level'); // Day 1 & 5
        Quests.report('kill_boss', GS.currentLevelId); // Day 7
    }
    // ------------------

    const reward = 20 + (GS.movesLeft * 2);
    if (window.economy && window.economy.addPrisma) window.economy.addPrisma(reward);
    if (window.StorageAPI?.setLevelUnlocked) StorageAPI.setLevelUnlocked(GS.currentLevelId + 1);

    const msgEl = document.getElementById("end-message");
    const btnNext = document.getElementById("btn-next-level");
    const btnRevive = document.getElementById("btn-revive");
    if(btnRevive) btnRevive.style.display = "none";

    if (msgEl) { msgEl.textContent = `VICTORY! +${reward} Prisma`; msgEl.className = "victory-title"; }
    if (btnNext) {
        const nextLevelExists = window.LEVELS && window.LEVELS.some(l => l.id === GS.currentLevelId + 1);
        if (nextLevelExists) {
            btnNext.style.display = "block";
            btnNext.onclick = () => { if (window.economy && window.economy.spendEnergyForLevel()) window.location.href = `game.html?level=${GS.currentLevelId+1}`; else if(confirm("Not enough Energy!")) window.location.href = "shop.html"; };
        } else { btnNext.style.display = "none"; if (msgEl) msgEl.textContent = "CAMPAIGN COMPLETE!"; }
    }
    const hId = ({GREED:"aelia",PLAGUE:"nocta",WAR:"vyra",DECEIT:"iona"})[GS.disciple?.id] || "aelia";
    const imgEl = document.getElementById("end-chibi");
    if (imgEl) imgEl.src = `assets/${hId}_wink.png`;
    document.getElementById("end-overlay").style.display = "flex";
  }

  function handleDefeat(reason) {
    if (GS.victoryTriggered) return;
    GS.victoryTriggered = true;
    GS.isProcessing = true;
    defeatReason = reason || 'moves'; 
    if(timerInterval) clearInterval(timerInterval);
    if(window.AudioSys) { AudioSys.stopBGM(); AudioSys.play('lose'); }

    const msgEl = document.getElementById("end-message");
    if (msgEl) { msgEl.textContent = defeatReason === 'time' ? "OUT OF TIME" : "OUT OF MOVES"; msgEl.className = "defeat-title"; }
    document.getElementById("btn-next-level").style.display = "none";
    const imgEl = document.getElementById("end-chibi");
    if (imgEl && GS.disciple) { imgEl.src = `assets/disciple_${GS.disciple.id.toLowerCase()}.jpg`; imgEl.onerror = function() { this.src = "assets/tile_greed.png"; }; }
    injectReviveButton();
    document.getElementById("end-overlay").style.display = "flex";
  }

  function injectReviveButton() {
      let btn = document.getElementById("btn-revive");
      const box = document.getElementById("end-box");
      const playAgain = document.getElementById("btn-play-again");
      if (!btn) {
          btn = document.createElement("button");
          btn.id = "btn-revive";
          btn.style.cssText = "width:100%; padding:12px; margin-bottom:8px; border-radius:10px; background:linear-gradient(135deg, #8b5cf6, #d946ef); color:#fff; border:1px solid #c084fc; cursor:pointer; font-weight:900; letter-spacing:1px; text-transform:uppercase; box-shadow:0 0 15px rgba(217, 70, 239, 0.4);";
          if(box && playAgain) box.insertBefore(btn, playAgain);
      }
      const cost = 50;
      const benefit = defeatReason === 'time' ? "+15 SECONDS" : "+5 MOVES";
      btn.innerHTML = `CONTINUE <span style="font-size:0.8em; opacity:0.9;">(${benefit})</span><br><span style="font-size:0.8em">💎 ${cost} PRISMA</span>`;
      btn.style.display = "block";
      btn.onclick = () => attemptRevive(cost);
  }

  function attemptRevive(cost) {
      if (window.economy && economy.spendPrisma(cost)) {
          if (defeatReason === 'time') { GS.timeLeft += 15; startLevelTimer(); } else { GS.movesLeft += 5; if(window.UI && UI.updateStats) UI.updateStats(); }
          GS.victoryTriggered = false;
          GS.isProcessing = false;
          defeatReason = null;
          document.getElementById("end-overlay").style.display = "none";
          if(window.AudioSys) AudioSys.playBGM('bgm_battle');
          if(window.UI && UI.flashAlert) UI.flashAlert("SYSTEM RESTORED!", 1000);
      } else { alert(`Insufficient Prisma! Needed: ${cost}`); }
  }

  async function trySwap(r1, c1, r2, c2) {
    if (GS.isProcessing || GS.movesLeft <= 0 || GS.timeLeft <= 0 || GS.victoryTriggered) return false;
    try {
        const valid = window.Board.performSwap(r1, c1, r2, c2);
        if (valid) {
            GS.isProcessing = true;
            if (window.UI) UI.renderBoard();
            await delay(250);
            await window.Board.processBoardUntilStable();
            GS.movesLeft--;
            GS.turnsTaken++;
            if (window.UI) { UI.updateStats(); UI.updateAbilityUI(); }
            if (GS.discipleHP <= 0) { await handleVictory(); return true; } 
            if (GS.movesLeft <= 0) { handleDefeat('moves'); return true; }
            discipleAttackIfReady();
            return true;
        } 
    } catch(err) { console.error(err); } finally {
        if (!GS.victoryTriggered) GS.isProcessing = false;
    }
    return false;
  }

  async function requestShuffle() {
      if (GS.isProcessing || GS.victoryTriggered) return;
      if (GS.movesLeft < 1) { if(window.UI && UI.flashAlert) UI.flashAlert("NOT ENOUGH MOVES"); return; }
      if (window.confirm("Shuffle Board? Cost: 1 Move")) {
          GS.isProcessing = true; GS.movesLeft--;
          if (window.UI) UI.updateStats();
          await window.Board.shuffleBoard();
          if (window.UI) UI.renderBoard();
          GS.isProcessing = false;
      }
  }

  async function bootLevel(lvlId) {
    const id = typeof lvlId === 'number' ? lvlId : window.readLevelIdFromURL();
    const lvl = (window.LEVELS || []).find((L) => L.id === id) || window.LEVELS[0];
    GS.currentLevelId = id;
    GS.activeLevel = lvl;
    GS.disciple = lvl.disciple;
    GS.discipleMaxHP = lvl.discipleMaxHP || 800;
    GS.discipleHP = GS.discipleMaxHP;
    GS.discipleAttackRate = lvl.attackRate || 3; 
    GS.GRID_SIZE = 9;
    GS.movesLeft = lvl.moves || 25;
    GS.score = 0;
    GS.turnsTaken = 0;
    GS.aeliaCharge=0; GS.noctaCharge=0; GS.vyraCharge=0; GS.ionaCharge=0;
    GS.isProcessing = false;
    GS.victoryTriggered = false;
    GS.timeLeft = 0; 
    if(window.AudioSys) AudioSys.playBGM('bgm_battle');
    if (window.Board?.initBoard) {
        Board.initBoard(GS.GRID_SIZE);
        if(Board.processBoardUntilStable) await Board.processBoardUntilStable();
    }
    if (window.UI) { UI.renderBoard(); UI.updateStats(); UI.updateDiscipleBadge(); UI.updateChibiUI(); UI.updateAbilityUI(); }
    startLevelTimer();
  }

  function restartLevel() {
      if (window.economy && window.economy.spendEnergyForLevel()) {
          bootLevel(GS.currentLevelId);
          document.getElementById("end-overlay").style.display = "none";
      } else { if(confirm("Not enough Energy! Go to Shop?")) window.location.href = "shop.html"; }
  }

  window.Engine = { bootLevel, restartLevel, trySwap, handleVictory, requestShuffle };
})();