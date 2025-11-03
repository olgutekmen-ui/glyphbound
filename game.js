/***************
 * CONFIG
 ***************/
const GRID_SIZE = 9;
const GLYPH_TYPES = 4;
const GLYPH_SYMBOLS = ["⚡","🔮","🌿","🌟"];

// Level params (fallbacks if no levels.js)
const urlParams = new URLSearchParams(location.search);
const currentLevelId = parseInt(urlParams.get("level") || "1", 10);
const LEVEL_DEFAULTS = {
  id: currentLevelId,
  name: "LINK " + String(currentLevelId).padStart(2,"0"),
  moves: 20,
  discipleMaxHP: 500,
  encounterPattern: "drainCharge",
  discipleAttackRate: 4,
  frozenSeed: 2,
  shield: { enabled:false, breakerHero:"vyra", hp:200, thresholdPct:50 },
};
const INITIAL_MOVES = LEVEL_DEFAULTS.moves;
const DISCIPLE_MAX_HP = LEVEL_DEFAULTS.discipleMaxHP;
const FROZEN_ON_ATTACK = true;
const INITIAL_FROZEN_SEED = LEVEL_DEFAULTS.frozenSeed;

const AELIA_GLYPH_TYPE=0, NOCTA_GLYPH_TYPE=1, VYRA_GLYPH_TYPE=2, IONA_GLYPH_TYPE=3;
const AELIA_CHARGE_MAX=10, NOCTA_CHARGE_MAX=12, VYRA_CHARGE_MAX=15, IONA_CHARGE_MAX=18;
const AELIA_DAMAGE=100, VYRA_DAMAGE=150, IONA_DAMAGE=250;
const POINTS_PER_MATCH=10;

const HERO_DATA = {
  aelia:{ name:"AELIA", idle:"aelia.png", wink:"aelia_wink.png", nameClass:"name-aelia" },
  nocta:{ name:"NOCTA", idle:"nocta.png", wink:"nocta_wink.png", nameClass:"name-nocta" },
  vyra: { name:"VYRA",  idle:"vyra.png",  wink:"vyra_wink.png",  nameClass:"name-vyra"  },
  iona: { name:"IONA",  idle:"iona.png",  wink:"iona_wink.png",  nameClass:"name-iona"  },
};

/***************
 * STATE
 ***************/
let board = [];
let selectedCell = null;
let isProcessing = false;

const dragState = { active:false, startR:null,startC:null,startX:0,startY:0,pointerId:null,moved:false,lockedSwap:false, ghost:null, target:null };

const gameState = {
  score:0, movesLeft:INITIAL_MOVES, discipleHP:DISCIPLE_MAX_HP,
  aeliaCharge:0, noctaCharge:0, vyraCharge:0, ionaCharge:0,
  turnsTaken:0, discipleAttackRate:LEVEL_DEFAULTS.discipleAttackRate,
  encounterPattern:LEVEL_DEFAULTS.encounterPattern,
  frozenThawed:0, frozenGoal:0,
  discipleShield:{ active:false, requiredHero:"vyra", hp:0 },
  damageModifiers:{ aelia:1.0, nocta:0.0, vyra:1.0, iona:1.0 },
  prisma: parseInt(localStorage.getItem("prisma")||"0",10)
};

/***************
 * DOM REFS
 ***************/
const gridElement = document.getElementById("game-grid");
const scoreElement = document.getElementById("score");
const movesElement = document.getElementById("moves");
const messageBox = document.getElementById("message-box");
const restartButton = document.getElementById("restart-btn");
const shuffleButton = document.getElementById("shuffle-btn");
const hintButton = document.getElementById("hint-btn");
const rebootButton = document.getElementById("reboot-btn");
const mapButton = document.getElementById("map-btn");
const alertBanner = document.getElementById("alert-banner");

const DISCIPLE_HP_ELEMENT = document.getElementById("disciple-hp-bar");
const DISCIPLE_HP_TEXT_ELEMENT = document.getElementById("disciple-hp-text");
const shieldStatusElement = document.getElementById("shield-status");

const victoryOverlay = document.getElementById("victory-overlay");
const victoryPlayAgainBtn = document.getElementById("victory-playagain");
const victoryMapBtn = document.getElementById("victory-map");

const prismaHud = document.getElementById("prisma-count");

let aeliaIcon, noctaIcon, vyraIcon, ionaIcon;
let aeliaChargeOverlay, noctaChargeOverlay, vyraChargeOverlay, ionaChargeOverlay;

/***************
 * HELPERS
 ***************/
const delay = (ms)=>new Promise(res=>setTimeout(res, ms));
const isEmpty = (cell)=>cell===null;
const isGlyph = (cell)=>cell && cell.kind==="glyph";
const isFrozen = (cell)=>cell && cell.kind==="frozen";
const makeGlyphCell = (t)=>({kind:"glyph",type:t});
const makeFrozenCell = ()=>({kind:"frozen"});
const getRandomGlyph = ()=>Math.floor(Math.random()*GLYPH_TYPES);
const getCellId = (r,c)=>`cell-${r}-${c}`;

function showAlert(text, ms=1400){
  if(!alertBanner) return;
  alertBanner.textContent = text;
  alertBanner.classList.add("alert-active");
  if(showAlert._t) clearTimeout(showAlert._t);
  showAlert._t = setTimeout(()=>alertBanner.classList.remove("alert-active"), ms);
}

function updatePrismaUI(){
  prismaHud.textContent = String(gameState.prisma|0);
}
function addPrisma(n){
  gameState.prisma = (gameState.prisma|0) + (n|0);
  localStorage.setItem("prisma", String(gameState.prisma));
  updatePrismaUI();
}

/***************
 * INIT BOARD
 ***************/
function checkLocalLineMatch(r,c){
  const cell = board[r][c];
  if(!isGlyph(cell)) return [];

  const t = cell.type;

  // horiz
  let run=[{r,c}], cc=c-1;
  while(cc>=0 && isGlyph(board[r][cc]) && board[r][cc].type===t){ run.push({r,c:cc}); cc--; }
  cc=c+1;
  while(cc<GRID_SIZE && isGlyph(board[r][cc]) && board[r][cc].type===t){ run.push({r,c:cc}); cc++; }
  if(run.length>=3) return run;

  // vert
  run=[{r,c}]; let rr=r-1;
  while(rr>=0 && isGlyph(board[rr][c]) && board[rr][c].type===t){ run.push({r:rr,c}); rr--; }
  rr=r+1;
  while(rr<GRID_SIZE && isGlyph(board[rr][c]) && board[rr][c].type===t){ run.push({r:rr,c}); rr++; }
  if(run.length>=3) return run;

  return [];
}

function freezeRandomTile(){
  const cand=[];
  for(let r=0;r<GRID_SIZE;r++){
    for(let c=0;c<GRID_SIZE;c++){
      if(isGlyph(board[r][c])) cand.push({r,c});
    }
  }
  if(!cand.length) return;
  const pick = cand[Math.floor(Math.random()*cand.length)];
  board[pick.r][pick.c] = makeFrozenCell();
}

function initializeBoard(){
  board = Array(GRID_SIZE).fill(0).map(()=>Array(GRID_SIZE).fill(null));
  gameState.score=0; gameState.movesLeft=INITIAL_MOVES; gameState.discipleHP=DISCIPLE_MAX_HP;
  gameState.aeliaCharge=0; gameState.noctaCharge=0; gameState.vyraCharge=0; gameState.ionaCharge=0;
  gameState.turnsTaken=0; gameState.discipleAttackRate=LEVEL_DEFAULTS.discipleAttackRate;
  gameState.encounterPattern=LEVEL_DEFAULTS.encounterPattern;
  gameState.frozenThawed=0; gameState.frozenGoal=0;
  gameState.discipleShield={active:false, requiredHero:LEVEL_DEFAULTS.shield.breakerHero, hp:0};

  messageBox.classList.remove("text-green-400","text-red-400");
  selectedCell=null; isProcessing=false; resetDragState();

  // Fill without pre-made matches
  for(let r=0;r<GRID_SIZE;r++){
    for(let c=0;c<GRID_SIZE;c++){
      let t;
      do { t=getRandomGlyph(); board[r][c]=makeGlyphCell(t); }
      while(checkLocalLineMatch(r,c).length>=3);
    }
  }

  // Seed frozen
  for(let i=0;i<INITIAL_FROZEN_SEED;i++) freezeRandomTile();

  // Build DOM once
  if(gridElement.children.length===0){
    for(let r=0;r<GRID_SIZE;r++){
      for(let c=0;c<GRID_SIZE;c++){
        const cell=document.createElement("div");
        cell.className="grid-cell";
        cell.id=getCellId(r,c);
        cell.dataset.row=r; cell.dataset.col=c;
        cell.addEventListener("pointerdown", onCellPointerDown, {passive:false});
        gridElement.appendChild(cell);
      }
    }
  }

  victoryOverlay.classList.remove("active");
}

function renderBoard(){
  for(let r=0;r<GRID_SIZE;r++){
    for(let c=0;c<GRID_SIZE;c++){
      const data = board[r][c];
      const el = document.getElementById(getCellId(r,c));
      if(!el) continue;
      el.innerHTML="";

      if(isGlyph(data)){
        const g=document.createElement("div");
        g.className=`glyph glyph-${data.type}`;
        g.textContent=GLYPH_SYMBOLS[data.type];
        el.appendChild(g);
      } else if(isFrozen(data)){
        const f=document.createElement("div");
        f.className="glyph frozen-glyph";
        f.textContent="❄";
        el.appendChild(f);
      }
    }
  }
}

/***************
 * MATCH / CASCADE
 ***************/
function findAllMatchGroups(){
  const groups=[];
  // rows
  for(let r=0;r<GRID_SIZE;r++){
    let runType=null, run=[];
    for(let c=0;c<GRID_SIZE;c++){
      const obj=board[r][c]; const ok=isGlyph(obj); const t=ok?obj.type:null;
      if(ok && (runType===null || t===runType)){ if(runType===null) runType=t; run.push({r,c}); }
      else { if(run.length>=3 && runType!==null) groups.push({cells:[...run], type:runType});
             runType=ok?t:null; run= ok?[{r,c}]:[]; }
    }
    if(run.length>=3 && runType!==null) groups.push({cells:[...run], type:runType});
  }
  // cols
  for(let c=0;c<GRID_SIZE;c++){
    let runType=null, run=[];
    for(let r=0;r<GRID_SIZE;r++){
      const obj=board[r][c]; const ok=isGlyph(obj); const t=ok?obj.type:null;
      if(ok && (runType===null || t===runType)){ if(runType===null) runType=t; run.push({r,c}); }
      else { if(run.length>=3 && runType!==null) groups.push({cells:[...run], type:runType});
             runType=ok?t:null; run= ok?[{r,c}]:[]; }
    }
    if(run.length>=3 && runType!==null) groups.push({cells:[...run], type:runType});
  }
  return groups;
}

async function resolveMatchesOnceAndRefill(){
  const groups = findAllMatchGroups();
  if(groups.length===0) return false;

  const clearMap={}; const clearCountByType=[0,0,0,0];
  groups.forEach(g=>{
    g.cells.forEach(({r,c})=>{
      const key=r+","+c;
      if(!clearMap[key]) clearMap[key]={r,c,type:g.type};
    });
  });

  Object.values(clearMap).forEach(({r,c})=>{
    const el=document.getElementById(getCellId(r,c));
    if(el&&el.firstChild) el.firstChild.classList.add("match-animation");
  });
  await delay(250);

  let destroyed=0;
  Object.values(clearMap).forEach(({r,c,type})=>{
    if(isFrozen(board[r][c])) gameState.frozenThawed++;
    else if(type>=0) clearCountByType[type]++;
    board[r][c]=null; destroyed++;
  });
  gameState.score += destroyed*POINTS_PER_MATCH;

  // charge
  gameState.aeliaCharge=Math.min(AELIA_CHARGE_MAX, gameState.aeliaCharge + clearCountByType[AELIA_GLYPH_TYPE]);
  gameState.noctaCharge=Math.min(NOCTA_CHARGE_MAX, gameState.noctaCharge + clearCountByType[NOCTA_GLYPH_TYPE]);
  gameState.vyraCharge =Math.min(VYRA_CHARGE_MAX,  gameState.vyraCharge  + clearCountByType[VYRA_GLYPH_TYPE]);
  gameState.ionaCharge =Math.min(IONA_CHARGE_MAX,  gameState.ionaCharge  + clearCountByType[IONA_GLYPH_TYPE]);

  thawFrozenAdjacentToClears(clearMap);

  await applyGravityAndRefill();
  return true;
}

function thawFrozenAdjacentToClears(clearMap){
  const cleared=Object.values(clearMap);
  const toThaw=[]; const s=new Set();
  cleared.forEach(({r,c})=>{
    [{rr:r-1,cc:c},{rr:r+1,cc:c},{rr:r,cc:c-1},{rr:r,cc:c+1}].forEach(({rr,cc})=>{
      if(rr>=0 && rr<GRID_SIZE && cc>=0 && cc<GRID_SIZE && isFrozen(board[rr][cc])){
        const k=rr+","+cc; if(!s.has(k)){ s.add(k); toThaw.push({r:rr,c:cc}); }
      }
    });
  });
  toThaw.forEach(({r,c})=>{ board[r][c]=makeGlyphCell(getRandomGlyph()); gameState.frozenThawed++; });
}

async function applyGravityAndRefill(){
  for(let c=0;c<GRID_SIZE;c++){
    const col=[];
    for(let r=GRID_SIZE-1;r>=0;r--) if(!isEmpty(board[r][c])) col.push(board[r][c]);
    for(let r=0;r<GRID_SIZE;r++){
      const tr=GRID_SIZE-1-r;
      board[tr][c] = (r<col.length)? col[r] : makeGlyphCell(getRandomGlyph());
    }
  }
  renderBoard();
  await delay(110);
}

async function processMatches(){
  try{
    while(await resolveMatchesOnceAndRefill()){}
    updateStats();
  } catch(e){
    console.error("cascade loop:", e);
    messageBox.textContent="CRITICAL CASCADE ERROR.";
    throw e;
  }
  resetDragState();
  if(checkWinCondition()){ await finalizeBoardAfterWin(); return; }
  if(gameState.movesLeft<=0){ updateStats(); }
  else if(!hasPossibleMove()){ messageBox.textContent="Board locked! Shuffling..."; await delay(600); shuffleBoard(); }
}

/***************
 * UI / STATS
 ***************/
function updateStats(){
  scoreElement.textContent=gameState.score;
  movesElement.textContent=gameState.movesLeft;

  const hpPct=Math.max(0,(gameState.discipleHP/DISCIPLE_MAX_HP)*100);
  DISCIPLE_HP_ELEMENT.style.width=`${hpPct}%`;
  DISCIPLE_HP_TEXT_ELEMENT.textContent=`${gameState.discipleHP} / ${DISCIPLE_MAX_HP} HP`;

  if(gameState.discipleShield.active){
    shieldStatusElement.classList.remove("hidden");
    shieldStatusElement.textContent=`SHIELDED (${gameState.discipleShield.requiredHero.toUpperCase()} ONLY) [${gameState.discipleShield.hp}HP]`;
  }else{
    shieldStatusElement.classList.add("hidden"); shieldStatusElement.textContent="";
  }

  const setBar=(overlay,n,max)=>{ if(overlay) overlay.style.height=`${Math.min(100,(n/max)*100)|0}%`; };
  setBar(aeliaChargeOverlay,gameState.aeliaCharge,AELIA_CHARGE_MAX);
  setBar(noctaChargeOverlay,gameState.noctaCharge,NOCTA_CHARGE_MAX);
  setBar(vyraChargeOverlay, gameState.vyraCharge, VYRA_CHARGE_MAX);
  setBar(ionaChargeOverlay, gameState.ionaCharge, IONA_CHARGE_MAX);

  const setReady=(icon,ready)=>{ if(!icon) return; icon.classList.toggle("charged", !!ready); };
  setReady(aeliaIcon, gameState.aeliaCharge>=AELIA_CHARGE_MAX);
  setReady(noctaIcon, gameState.noctaCharge>=NOCTA_CHARGE_MAX);
  setReady(vyraIcon,  gameState.vyraCharge >=VYRA_CHARGE_MAX);
  setReady(ionaIcon,  gameState.ionaCharge >=IONA_CHARGE_MAX);

  if(gameState.movesLeft<=3) movesElement.classList.add("moves-danger"); else movesElement.classList.remove("moves-danger");

  if(gameState.discipleHP<=0){ restartButton.textContent="PLAY AGAIN"; }
  else if(gameState.movesLeft<=0){
    messageBox.textContent="LINK CORRUPTED: PRIMORDIAL DOMINION ESTABLISHED. DEFEAT.";
    messageBox.classList.add("text-red-400");
    restartButton.textContent="TRY AGAIN";
  } else if(!isProcessing) {
    messageBox.textContent = "Disciple HP: "+gameState.discipleHP+". Charge abilities and strike.";
  }

  updatePrismaUI();
}

/***************
 * WIN / VICTORY
 ***************/
function checkWinCondition(){ return gameState.discipleHP<=0 || (gameState.frozenGoal>0 && gameState.frozenThawed>=gameState.frozenGoal); }

async function finalizeBoardAfterWin(){
  await applyGravityAndRefill();
  renderBoard();
  isProcessing=true;

  messageBox.textContent="PROTOCOL ESTABLISHED: DISCIPLE PURGED! VICTORY!";
  messageBox.classList.add("text-green-400");
  showAlert("VICTORY: LINK SECURED", 1800);
  restartButton.textContent="PLAY AGAIN";
  updateStats();

  openVictoryOverlay(); // centered overlay

  // Reward + unlock
  addPrisma(15 + Math.floor(gameState.score/50));
  const nextLevel = currentLevelId+1;
  const unlocked = Math.max(parseInt(localStorage.getItem("levelUnlocked")||"1",10), nextLevel);
  localStorage.setItem("levelUnlocked", String(unlocked));
}

function openVictoryOverlay(){
  victoryOverlay.classList.add("active");
  const heroKeys=Object.keys(HERO_DATA);
  const pick=heroKeys[Math.floor(Math.random()*heroKeys.length)];
  const hero = HERO_DATA[pick];

  const img = document.getElementById("chibi-center");
  const name= document.getElementById("chibi-center-name");

  img.setAttribute("data-idle", hero.idle);
  img.setAttribute("data-wink", hero.wink);
  img.alt = hero.name;
  img.src = hero.idle;

  name.textContent = hero.name;
  name.className = "chibi-name "+hero.nameClass;

  setTimeout(()=>{ img.src=hero.wink; }, 600);
  setTimeout(()=>{ img.src=hero.idle; }, 1000);
}
function closeVictoryOverlay(){
  victoryOverlay.classList.remove("active");
}

/***************
 * SWAP / INPUT
 ***************/
function hasPossibleMove(){
  for(let r=0;r<GRID_SIZE;r++){
    for(let c=0;c<GRID_SIZE;c++){
      if(c+1<GRID_SIZE && isSwapValid(r,c,r,c+1)) return true;
      if(r+1<GRID_SIZE && isSwapValid(r,c,r+1,c)) return true;
    }
  }
  return false;
}

function isSwapValid(r1,c1,r2,c2){
  if(isFrozen(board[r1][c1])||isFrozen(board[r2][c2])) return false;
  const tmp=board[r1][c1]; board[r1][c1]=board[r2][c2]; board[r2][c2]=tmp;
  const valid = findAllMatchGroups().length>0;
  board[r2][c2]=board[r1][c1]; board[r1][c1]=tmp;
  return valid;
}

async function performSwap(r1,c1,r2,c2){
  if(isProcessing || gameState.discipleHP<=0 || gameState.movesLeft<=0) return;
  if(isFrozen(board[r1][c1])||isFrozen(board[r2][c2])) return;

  isProcessing=true;
  try{
    const tmp=board[r1][c1]; board[r1][c1]=board[r2][c2]; board[r2][c2]=tmp;
    renderBoard(); await delay(110);

    const groups=findAllMatchGroups();
    if(groups.length>0){
      gameState.movesLeft--;
      await processMatches();
      gameState.turnsTaken++;
      discipleAttackIfReady();
      renderBoard();
    } else {
      messageBox.textContent="Invalid link. Swapping back.";
      const tb=board[r1][c1]; board[r1][c1]=board[r2][c2]; board[r2][c2]=tb;
      await delay(110); renderBoard();
    }
  } catch(e){
    console.error("swap error", e);
    messageBox.textContent="CRITICAL ERROR DURING SWAP.";
  } finally {
    await gameLoopFinished();
  }
}

function resetDragState(){ dragState.active=false; dragState.startR=null; dragState.startC=null; dragState.startX=0; dragState.startY=0; dragState.pointerId=null; dragState.moved=false; dragState.lockedSwap=false; cleanupDragGhost(); }

function cleanupDragGhost(){
  if(dragState.ghost && dragState.ghost.parentNode){ dragState.ghost.remove(); }
  dragState.ghost=null;
}

function startDrag(r,c,clientX,clientY,pointerId){
  dragState.active=true; dragState.startR=r; dragState.startC=c; dragState.startX=clientX; dragState.startY=clientY; dragState.pointerId=pointerId; dragState.moved=false; dragState.lockedSwap=false;

  clearAllSelectedHighlights();
  const el=document.getElementById(getCellId(r,c));
  if(el && el.firstChild) el.firstChild.classList.add("selected");

  window.addEventListener("pointermove", globalPointerMove,{passive:false});
  window.addEventListener("pointerup",   globalPointerUp,  {passive:false});
  window.addEventListener("pointercancel",globalPointerCancel,{passive:false});
}

function tryDragSwap(clientX,clientY){
  if(!dragState.active || dragState.lockedSwap) return;
  const dx=clientX-dragState.startX, dy=clientY-dragState.startY;
  const thr=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--drag-threshold"))||14;
  if(dx*dx+dy*dy < thr*thr) return;

  dragState.moved=true;

  let tr=dragState.startR, tc=dragState.startC;
  if(Math.abs(dx)>Math.abs(dy)) tc = dragState.startC + (dx>0?1:-1);
  else tr = dragState.startR + (dy>0?1:-1);

  if(tr<0||tr>=GRID_SIZE||tc<0||tc>=GRID_SIZE) return;

  dragState.lockedSwap=true;
  performSwap(dragState.startR, dragState.startC, tr, tc);
}

function handleTapRelease(r,c){
  if(dragState.lockedSwap || isProcessing){ clearAllSelectedHighlights(); return; }
  if(!dragState.moved && isFrozen(board[r][c])){ messageBox.textContent="FROZEN NODE: Thaw by linking next to it."; clearAllSelectedHighlights(); return; }

  if(!selectedCell){
    selectedCell={r,c};
    clearAllSelectedHighlights();
    const el=document.getElementById(getCellId(r,c));
    if(el&&el.firstChild) el.firstChild.classList.add("selected");
    messageBox.textContent="Glyph selected. Pick an adjacent glyph.";
  } else {
    const {r:r1,c:c1}=selectedCell; const r2=r, c2=c;
    if(r1===r2 && c1===c2){ selectedCell=null; clearAllSelectedHighlights(); messageBox.textContent="Glyph deselected."; }
    else {
      const adj = Math.abs(r1-r2)+Math.abs(c1-c2)===1;
      if(adj){
        if(!isFrozen(board[r1][c1])&&!isFrozen(board[r2][c2])){
          dragState.lockedSwap=true; performSwap(r1,c1,r2,c2);
        } else messageBox.textContent="FROZEN LINK BLOCKED.";
      } else {
        selectedCell={r,c}; clearAllSelectedHighlights();
        const el2=document.getElementById(getCellId(r,c));
        if(el2&&el2.firstChild) el2.firstChild.classList.add("selected");
        messageBox.textContent="Must choose an adjacent glyph. New glyph selected.";
      }
    }
  }
}

function onCellPointerDown(e){
  if(isProcessing || gameState.discipleHP<=0 || gameState.movesLeft<=0) return;
  e.preventDefault();
  resetDragState();
  const r=parseInt(this.dataset.row,10);
  const c=parseInt(this.dataset.col,10);
  startDrag(r,c,e.clientX,e.clientY,e.pointerId);
}
function globalPointerMove(e){ if(!dragState.active||e.pointerId!==dragState.pointerId) return; e.preventDefault(); tryDragSwap(e.clientX,e.clientY); }
function globalPointerUp(e){
  if(!dragState.active||e.pointerId!==dragState.pointerId) return;
  e.preventDefault();
  const r=dragState.startR, c=dragState.startC;
  handleTapRelease(r,c);
  window.removeEventListener("pointermove", globalPointerMove,{passive:false});
  window.removeEventListener("pointerup", globalPointerUp,{passive:false});
  window.removeEventListener("pointercancel", globalPointerCancel,{passive:false});
  if(!(dragState.lockedSwap||isProcessing)) resetDragState();
}
function globalPointerCancel(e){
  if(!dragState.active||e.pointerId!==dragState.pointerId) return;
  clearAllSelectedHighlights();
  window.removeEventListener("pointermove", globalPointerMove,{passive:false});
  window.removeEventListener("pointerup", globalPointerUp,{passive:false});
  window.removeEventListener("pointercancel", globalPointerCancel,{passive:false});
  resetDragState();
}

function clearAllSelectedHighlights(){
  document.querySelectorAll(".glyph.selected,.frozen-glyph.selected").forEach(el=>el.classList.remove("selected"));
}

/***************
 * DISCIPLE RETALIATION
 ***************/
function discipleAttackIfReady(){
  if(gameState.discipleHP<=0 || gameState.movesLeft<=0) return;
  if(gameState.turnsTaken<=0) return;

  if(gameState.turnsTaken % gameState.discipleAttackRate === 0){
    if(gameState.encounterPattern==="drainMove"){
      gameState.movesLeft=Math.max(0, gameState.movesLeft-1);
      messageBox.textContent="PRIMORDIAL BACKLASH: Link destabilized (-1 Move).";
      showAlert("DISCIPLE STRIKE: -1 MOVE");
    } else {
      const candidates=[];
      if(gameState.aeliaCharge>0) candidates.push("aelia");
      if(gameState.noctaCharge>0) candidates.push("nocta");
      if(gameState.vyraCharge>0)  candidates.push("vyra");
      if(gameState.ionaCharge>0)  candidates.push("iona");
      if(candidates.length){
        const chosen=candidates[Math.floor(Math.random()*candidates.length)];
        if(chosen==="aelia") gameState.aeliaCharge=Math.max(0, gameState.aeliaCharge-3);
        if(chosen==="nocta") gameState.noctaCharge=Math.max(0, gameState.noctaCharge-3);
        if(chosen==="vyra")  gameState.vyraCharge =Math.max(0, gameState.vyraCharge -3);
        if(chosen==="iona")  gameState.ionaCharge =Math.max(0, gameState.ionaCharge -3);
        messageBox.textContent=`DISCIPLE INTERFERENCE: ${chosen.toUpperCase()} link drained.`; showAlert(`DISCIPLE DRAINED ${chosen.toUpperCase()}`);
      } else {
        gameState.movesLeft=Math.max(0, gameState.movesLeft-1);
        messageBox.textContent="PRIMORDIAL BACKLASH: Link destabilized (-1 Move).";
        showAlert("DISCIPLE STRIKE: -1 MOVE");
      }
    }
    if(FROZEN_ON_ATTACK) freezeRandomTile();
    updateStats(); renderBoard();
  }
}

function applyHeroDamage(sourceHero, raw){
  if(gameState.discipleHP<=0) return;
  if(gameState.discipleShield.active){
    if(gameState.discipleShield.requiredHero===sourceHero){
      gameState.discipleShield.hp -= raw;
      if(gameState.discipleShield.hp<=0){
        gameState.discipleShield.active=false; gameState.discipleShield.hp=0;
        messageBox.textContent="SHIELD BROKEN: Disciple is vulnerable!";
        showAlert("SHIELD BROKEN ▶ DIRECT DAMAGE");
      } else {
        messageBox.textContent=`SHIELD FRACTURING (${gameState.discipleShield.hp} integrity)`;
        showAlert("VYRA PULSE: SHIELD CRACKING");
      }
    } else {
      messageBox.textContent="LINK DENIED: Cryo Shield resists this protocol."; showAlert("IMMUNE: WRONG HERO");
    }
    updateStats(); return;
  }

  const mult = gameState.damageModifiers[sourceHero] ?? 1.0;
  const actual = Math.floor(raw * mult);
  gameState.discipleHP = Math.max(0, gameState.discipleHP - actual);

  if(gameState.discipleHP<=0){ messageBox.textContent="TARGET PURGED. LINK SECURED."; showAlert("DISCIPLE NEUTRALIZED"); }
  else { messageBox.textContent=`Direct hit: -${actual} HP. Disciple at ${gameState.discipleHP} HP.`; showAlert(`DISCIPLE HIT: -${actual} HP`); }

  updateStats();
}

/***************
 * ABILITIES
 ***************/
async function activateAeliaAbility(){
  if(isProcessing || gameState.aeliaCharge < AELIA_CHARGE_MAX) return;
  isProcessing=true;
  try{
    applyHeroDamage("aelia", AELIA_DAMAGE);
    gameState.aeliaCharge=0; updateStats();
    messageBox.textContent="Aelia: SOLAR SWORD DEPLOYED."; showAlert("AELIA PROTOCOL: ROW CLEAVE");
    const row=Math.floor(Math.random()*GRID_SIZE);
    const cells=[];
    for(let c=0;c<GRID_SIZE;c++) if(!isEmpty(board[row][c])) cells.push({r:row,c});
    cells.forEach(({r,c})=>{ const el=document.getElementById(getCellId(r,c)); if(el&&el.firstChild) el.firstChild.classList.add("match-animation"); });
    await delay(250);
    let cleared=0; const clearMap={};
    cells.forEach(({r,c})=>{ if(isFrozen(board[r][c])) gameState.frozenThawed++; board[r][c]=null; cleared++; clearMap[r+","+c]={r,c,type:null}; });
    gameState.score += cleared*POINTS_PER_MATCH*1.5;
    thawFrozenAdjacentToClears(clearMap);
    await settleBoardAndCascade();
  } catch(e){ console.error("Aelia",e); messageBox.textContent="Aelia ability failed."; }
  finally{ await gameLoopFinished(); }
}
function handleAeliaClick(){ if(isProcessing || gameState.movesLeft<=0 || gameState.discipleHP<=0) return; if(gameState.aeliaCharge>=AELIA_CHARGE_MAX) activateAeliaAbility(); else messageBox.textContent=`Aelia charging... Need ${AELIA_CHARGE_MAX-gameState.aeliaCharge} ⚡ Johwa Glyphs.`; }

async function activateNoctaAbility(){
  if(isProcessing || gameState.noctaCharge < NOCTA_CHARGE_MAX) return;
  isProcessing=true;
  try{
    gameState.noctaCharge=0; gameState.movesLeft+=3; updateStats();
    messageBox.textContent="Nocta: LUNAR SHIELD STABILIZED (+3 Moves)."; showAlert("NOCTA: +3 MOVES");
    await delay(600);
  } catch(e){ console.error("Nocta",e); messageBox.textContent="Nocta ability failed."; }
  finally{ await gameLoopFinished(); }
}
function handleNoctaClick(){ if(isProcessing || gameState.movesLeft<=0 || gameState.discipleHP<=0) return; if(gameState.noctaCharge>=NOCTA_CHARGE_MAX) activateNoctaAbility(); else messageBox.textContent=`Nocta charging... Need ${NOCTA_CHARGE_MAX-gameState.noctaCharge} 🔮 Jinri Glyphs.`; }

async function activateVyraAbility(){
  if(isProcessing || gameState.vyraCharge < VYRA_CHARGE_MAX) return;
  isProcessing=true;
  try{
    applyHeroDamage("vyra", VYRA_DAMAGE);
    gameState.vyraCharge=0; updateStats();
    messageBox.textContent="Vyra: KINETIC PULSE RELEASED."; showAlert("VYRA: SHIELD BREAK / AREA CLEAR");
    const r0=1+Math.floor(Math.random()*(GRID_SIZE-2)), c0=1+Math.floor(Math.random()*(GRID_SIZE-2));
    const cells=[];
    for(let r=r0-1;r<=r0+1;r++) for(let c=c0-1;c<=c0+1;c++) if(!isEmpty(board[r][c])) cells.push({r,c});
    cells.forEach(({r,c})=>{ const el=document.getElementById(getCellId(r,c)); if(el&&el.firstChild) el.firstChild.classList.add("match-animation"); });
    await delay(250);
    let cleared=0; const clearMap={};
    cells.forEach(({r,c})=>{ if(isFrozen(board[r][c])) gameState.frozenThawed++; board[r][c]=null; cleared++; clearMap[r+","+c]={r,c,type:null}; });
    gameState.score += cleared*POINTS_PER_MATCH*2;
    thawFrozenAdjacentToClears(clearMap);
    await settleBoardAndCascade();
  } catch(e){ console.error("Vyra",e); messageBox.textContent="Vyra ability failed."; }
  finally{ await gameLoopFinished(); }
}
function handleVyraClick(){ if(isProcessing || gameState.movesLeft<=0 || gameState.discipleHP<=0) return; if(gameState.vyraCharge>=VYRA_CHARGE_MAX) activateVyraAbility(); else messageBox.textContent=`Vyra charging... Need ${VYRA_CHARGE_MAX-gameState.vyraCharge} 🌿 Bari Glyphs.`; }

async function activateIonaAbility(){
  if(isProcessing || gameState.ionaCharge < IONA_CHARGE_MAX) return;
  isProcessing=true;
  try{
    applyHeroDamage("iona", IONA_DAMAGE);
    gameState.ionaCharge=0; updateStats(); showAlert("IONA: GLOBAL PURGE");
    const present=[]; for(let r=0;r<GRID_SIZE;r++) for(let c=0;c<GRID_SIZE;c++) if(isGlyph(board[r][c])){ const t=board[r][c].type; if(!present.includes(t)) present.push(t); }
    if(!present.length){ messageBox.textContent="IONA LINK FAILED: No valid glyphs."; await gameLoopFinished(); return; }
    const targetType=present[Math.floor(Math.random()*present.length)];
    messageBox.textContent=`IONA: RADIANT UPLINK. Purging all ${GLYPH_SYMBOLS[targetType]} glyphs.`;
    const cells=[];
    for(let r=0;r<GRID_SIZE;r++) for(let c=0;c<GRID_SIZE;c++) if(isGlyph(board[r][c]) && board[r][c].type===targetType) cells.push({r,c});
    cells.forEach(({r,c})=>{ const el=document.getElementById(getCellId(r,c)); if(el&&el.firstChild) el.firstChild.classList.add("match-animation"); });
    await delay(250);
    let cleared=0; const clearMap={};
    cells.forEach(({r,c})=>{ board[r][c]=null; cleared++; clearMap[r+","+c]={r,c,type:null}; });
    gameState.score += cleared*POINTS_PER_MATCH*2.5;
    thawFrozenAdjacentToClears(clearMap);
    await settleBoardAndCascade();
  } catch(e){ console.error("Iona",e); messageBox.textContent="IONA ability failed."; }
  finally{ await gameLoopFinished(); }
}
function handleIonaClick(){ if(isProcessing || gameState.movesLeft<=0 || gameState.discipleHP<=0) return; if(gameState.ionaCharge>=IONA_CHARGE_MAX) activateIonaAbility(); else messageBox.textContent=`IONA charging... Need ${IONA_CHARGE_MAX-gameState.ionaCharge} 🌟 Mireuk Glyphs.`; }

/***************
 * SHUFFLE / HINT / RESTART
 ***************/
function findAnyValidMove(){
  for(let r=0;r<GRID_SIZE;r++){
    for(let c=0;c<GRID_SIZE;c++){
      if(c+1<GRID_SIZE && !isFrozen(board[r][c])&&!isFrozen(board[r][c+1]) && isSwapValid(r,c,r,c+1)) return {r1:r,c1:c,r2:r,c2:c+1};
      if(r+1<GRID_SIZE && !isFrozen(board[r][c])&&!isFrozen(board[r+1][c]) && isSwapValid(r,c,r+1,c)) return {r1:r,c1:c,r2:r+1,c2:c};
    }
  }
  return null;
}

async function flashHint(r1,c1,r2,c2){
  clearAllSelectedHighlights();
  const A=document.getElementById(getCellId(r1,c1));
  const B=document.getElementById(getCellId(r2,c2));
  if(A&&A.firstChild) A.firstChild.classList.add("hinted");
  if(B&&B.firstChild) B.firstChild.classList.add("hinted");
  messageBox.textContent="SCAN RESULT: Viable link identified."; showAlert("TACTICAL LINK FOUND");
  await delay(1200);
  if(A&&A.firstChild) A.firstChild.classList.remove("hinted");
  if(B&&B.firstChild) B.firstChild.classList.remove("hinted");
}

function shuffleBoard(){
  let attempts=0;
  do{
    board=Array(GRID_SIZE).fill(0).map(()=>Array(GRID_SIZE).fill(null));
    for(let r=0;r<GRID_SIZE;r++){
      for(let c=0;c<GRID_SIZE;c++){
        let t; do{ t=getRandomGlyph(); board[r][c]=makeGlyphCell(t); }
        while(checkLocalLineMatch(r,c).length>=3);
      }
    }
    if(FROZEN_ON_ATTACK) freezeRandomTile();
    attempts++;
  } while(!hasPossibleMove() && attempts<100);

  messageBox.textContent = (attempts>=100) ? "ERROR: No solvable board found. Please Restart." : "Board Rescrambled. New Links Available.";
  renderBoard();
}

async function handleShuffleClick(){
  if(isProcessing || gameState.discipleHP<=0 || gameState.movesLeft<=0) return;
  isProcessing=true;
  try{
    if(gameState.movesLeft>0) gameState.movesLeft--;
    showAlert("MANUAL REROUTE: BOARD SHUFFLED"); shuffleBoard(); updateStats();
    gameState.turnsTaken++; discipleAttackIfReady(); renderBoard();
  } catch(e){ console.error("Shuffle error",e); }
  finally{ await gameLoopFinished(); }
}

async function handleHintClick(){
  if(isProcessing || gameState.discipleHP<=0 || gameState.movesLeft<=0) return;
  const mv=findAnyValidMove();
  if(!mv){ messageBox.textContent="SCAN RESULT: No stable links. Manual reroute advised."; showAlert("NO LINKS - SHUFFLE?"); return; }
  await flashHint(mv.r1,mv.c1,mv.r2,mv.c2);
}

function restartGame(){
  initializeBoard(); renderBoard(); updateStats();
  restartButton.textContent="RESTART";
  messageBox.textContent="Establishing Link Protocol...";
  showAlert("NEW LINK ESTABLISHED", 1200);
}

async function settleBoardAndCascade(){ await applyGravityAndRefill(); await processMatches(); }

async function gameLoopFinished(){
  selectedCell=null; clearAllSelectedHighlights(); resetDragState();
  if(checkWinCondition()){ isProcessing=true; return; }
  if(gameState.movesLeft<=0){ updateStats(); isProcessing=true; return; }
  updateStats(); isProcessing=false;
}

/***************
 * BOOT / WIRING
 ***************/
window.onload = function(){
  aeliaIcon = document.getElementById("aelia-ability-icon");
  noctaIcon = document.getElementById("nocta-ability-icon");
  vyraIcon  = document.getElementById("vyra-ability-icon");
  ionaIcon  = document.getElementById("iona-ability-icon");

  aeliaChargeOverlay = document.getElementById("aelia-charge-overlay");
  noctaChargeOverlay = document.getElementById("nocta-charge-overlay");
  vyraChargeOverlay  = document.getElementById("vyra-charge-overlay");
  ionaChargeOverlay  = document.getElementById("iona-charge-overlay");

  victoryPlayAgainBtn.addEventListener("click", ()=>{
    closeVictoryOverlay();
    restartGame();
  });
  victoryMapBtn.addEventListener("click", ()=>{
    const overlay=document.getElementById("link-overlay");
    const text=document.getElementById("link-overlay-text");
    const phrases=["SEALING BREACH...","RELEASING LINK...","SIGNAL DISSIPATING...","RETURNING TO COMMAND...","UPLINK TERMINATED..."];
    if(overlay&&text){ text.textContent=phrases[Math.floor(Math.random()*phrases.length)];
      overlay.style.opacity="1"; overlay.style.pointerEvents="all"; setTimeout(()=>location.href="map.html", 800);
    } else location.href="map.html";
  });

  restartButton.addEventListener("click", restartGame, {passive:true});
  shuffleButton.addEventListener("click", handleShuffleClick, {passive:true});
  hintButton.addEventListener("click", handleHintClick, {passive:true});

  aeliaIcon.addEventListener("click", handleAeliaClick, {passive:true});
  noctaIcon.addEventListener("click", handleNoctaClick, {passive:true});
  vyraIcon.addEventListener("click",  handleVyraClick,  {passive:true});
  ionaIcon.addEventListener("click",  handleIonaClick,  {passive:true});

  rebootButton.addEventListener("click", ()=>{
    if(gameState.prisma>=5){
      gameState.prisma-=5; localStorage.setItem("prisma", String(gameState.prisma)); updatePrismaUI();
      gameState.movesLeft+=3; updateStats(); showAlert("+3 MOVES (REBOOT)");
    } else { showAlert("Not enough ✦ PRISMA"); }
  });

  mapButton.addEventListener("click", ()=>{
    const overlay=document.getElementById("link-overlay");
    const text=document.getElementById("link-overlay-text");
    const phrases=["SEALING BREACH...","RELEASING LINK...","SIGNAL DISSIPATING...","RETURNING TO COMMAND...","UPLINK TERMINATED..."];
    if(overlay&&text){ text.textContent=phrases[Math.floor(Math.random()*phrases.length)];
      overlay.style.opacity="1"; overlay.style.pointerEvents="all"; setTimeout(()=>location.href="map.html", 800);
    } else location.href="map.html";
  });

  restartGame();

  // Resolve any accidental auto-matches on the freshly spawned board
  setTimeout(()=>{ processMatches(); }, 0);
};

// Expose for safety integration
window.restartGame = restartGame;
window.processMatches = processMatches;
