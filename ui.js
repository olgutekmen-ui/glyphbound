/* ui.js — V1.9.1 (CACHE BUSTER UPDATE) */
(function () {
  const GS = window.GameState || window.gameState || (window.gameState = {});
  const IS_GAME = window.location.pathname.includes("game.html");
  function el(id) { return document.getElementById(id); }

  const TILE_IMAGES = ["assets/tile_aelia.png", "assets/tile_nocta.png", "assets/tile_vyra.png", "assets/tile_iona.png"];
  
  // UPDATE: Bumped version to v=105 to force new image load
  const HAZARD_IMAGES = { 
      frozen: "assets/tile_deceit.png?v=105", 
      poison: "assets/tile_plague.png?v=105", 
      junk:   "assets/tile_greed.png?v=105", 
      lava:   "assets/tile_lava.png?v=105" 
  };

  const TUTORIAL_KEY = "nx_tutorial_gold_v2";
  function launchTutorial() {
      if(GS.isProcessing) { GS.isProcessing = false; if(window.UI && UI.updateAbilityUI) UI.updateAbilityUI(); }
      if(document.getElementById("tutorial-overlay")) return;
      const overlay = document.createElement("div");
      overlay.id = "tutorial-overlay";
      overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(2, 6, 23, 0.98); z-index: 20000; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; text-align: center; padding: 2rem;`;
      overlay.innerHTML = `<h2 style="color:#38bdf8; margin-bottom:1rem; font-family:monospace; font-size: 2rem;">COMBAT MANUAL</h2><div style="text-align:left; color:#ccc; line-height:1.8; max-width:400px; margin-bottom:2rem; font-family:sans-serif;"><p><strong>1. MATCH 3:</strong> Swap tiles to damage the Disciple.</p><p><strong>2. HERO SKILLS:</strong> Matches charge the rings below. Tap when glowing!</p><p><strong>3. HAZARDS:</strong> Match NEXT to Poison/Lava to destroy them.</p><p><strong>4. ITEMS:</strong> Use Bombs/Antidotes from the bar above.</p></div><button id="tut-close-btn" style="padding:1rem 3rem; background:linear-gradient(135deg, #0ea5e9, #2563eb); border:none; border-radius:4px; font-weight:bold; cursor:pointer; color:#fff; font-size:1.1rem; box-shadow: 0 0 15px rgba(14,165,233,0.5);">INITIALIZE</button>`;
      document.body.appendChild(overlay);
      document.getElementById("tut-close-btn").onclick = () => { overlay.remove(); localStorage.setItem(TUTORIAL_KEY, "true"); if(UI.flashAlert) UI.flashAlert("SYSTEM READY", 1500); };
  }
  window.resetTutorial = launchTutorial;

  if (IS_GAME) {
    window.renderBoard = renderBoard;
    window.UI = window.UI || {};
    window.UI.renderBoard = renderBoard;
    window.UI.updateChibiUI = updateChibiUI;
    window.UI.updateDiscipleBadge = updateDiscipleBadge;
    window.UI.updateStats = updateStats;
    window.UI.updateAbilityUI = updateAbilityUI;
    window.UI.updateEnergyUI = updateEnergyUI;
    window.UI.flashAlert = flashAlert;
    window.UI.updatePrismaUI = updatePrismaUI;
    window.UI.updateItemCounts = updateItemCounts;
    window.UI.highlightTile = highlightTile;

    document.addEventListener("DOMContentLoaded", () => {
      initAbilityIcons(); injectTutorialButton(); bindAbilityklClicks(); injectItemBar();
      if (!localStorage.getItem(TUTORIAL_KEY)) setTimeout(launchTutorial, 1000);
      setTimeout(() => { updateEnergyUI(); updatePrismaUI(); updateItemCounts(); if(GS.board) renderBoard(); }, 50);
    });
  } else { window.UI = window.UI || {}; window.UI.updateEnergyUI = function(){}; window.UI.updateStats = function(){}; window.UI.renderBoard = function(){}; window.renderBoard = function(){}; return; }

  function highlightTile(r,c,a){const e=document.getElementById(`cell-${r}-${c}`);if(e){if(a)e.classList.add("danger-pulse");else e.classList.remove("danger-pulse")}}
  function injectItemBar(){const b=document.createElement("div");b.id="item-bar";b.style.cssText=`display:flex;justify-content:center;gap:10px;margin-top:10px;margin-bottom:5px;`;const i=[{id:'bomb',icon:'💣',fn:'useBomb'},{id:'hourglass',icon:'⏳',fn:'useHourglass'},{id:'antidote',icon:'🧪',fn:'useAntidote'}];i.forEach(it=>{const btn=document.createElement("button");btn.className="item-btn";btn.style.cssText=`background:rgba(255,255,255,0.08);border:1px solid #475569;color:#e2e8f0;border-radius:6px;padding:4px 8px;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:0.85rem;transition:background 0.2s;`;btn.onmouseover=()=>btn.style.background="rgba(255,255,255,0.15)";btn.onmouseout=()=>btn.style.background="rgba(255,255,255,0.08)";btn.innerHTML=`${it.icon} <span id="count-${it.id}" style="font-weight:bold;color:#38bdf8;">0</span>`;btn.onclick=()=>{if(window.Items&&window.Items[it.fn]){if(GS.isProcessing){if(UI.flashAlert)UI.flashAlert("BUSY",500);return}Items[it.fn]()}};b.appendChild(btn)});const ab=document.getElementById("ability-bar");if(ab)ab.parentNode.insertBefore(b,ab)}
  function updateItemCounts(){if(!window.economy)return;const b=document.getElementById("count-bomb"),h=document.getElementById("count-hourglass"),a=document.getElementById("count-antidote");if(b)b.innerText=economy.getItemCount('bomb');if(h)h.innerText=economy.getItemCount('hourglass');if(a)a.innerText=economy.getItemCount('antidote')}
  function injectTutorialButton(){const e=document.getElementById("tut-trig");if(e)e.remove();const b=document.createElement("div");b.id="tut-trig";b.innerText="?";b.style.cssText=`position:fixed;top:70px;right:15px;width:36px;height:36px;border:2px solid #38bdf8;color:#38bdf8;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;cursor:pointer;z-index:15000;background:rgba(15,23,42,0.9);box-shadow:0 0 10px rgba(0,0,0,0.5);font-family:monospace;font-size:1.2rem;`;b.onclick=launchTutorial;document.body.appendChild(b);const m=document.createElement("div");m.id="mute-btn";m.innerText="🔊";m.style.cssText=`position:fixed;top:70px;right:60px;width:36px;height:36px;border:2px solid #38bdf8;color:#38bdf8;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;cursor:pointer;z-index:15000;background:rgba(15,23,42,0.9);box-shadow:0 0 10px rgba(0,0,0,0.5);font-size:1.2rem;`;m.onclick=()=>{if(window.AudioSys)AudioSys.toggleMute()};document.body.appendChild(m);if(window.AudioSys)AudioSys.updateMuteState()}
  function bindAbilityklClicks(){const b=(id,f)=>{const e=el(id+"-ability-ring");if(e){const n=e.cloneNode(!0);e.parentNode.replaceChild(n,e);n.onclick=()=>{if(GS.isProcessing)return;const i=document.getElementById(id+"-ability-icon");if(!i||!i.classList.contains("ability-ready"))return;n.style.background="conic-gradient(#38bdf8 0deg, rgba(255,255,255,0.08) 0deg)";i.classList.remove("ability-ready");i.classList.remove("icon-full-opacity");i.style.cssText="opacity:0.4 !important; transition:opacity 0.2s;";const pt=document.getElementById("tap-"+id);if(pt)pt.remove();if(window.Abilities&&window.Abilities[f]){try{window.Abilities[f]()}catch(e){console.error(e);GS.isProcessing=!1}}}}};b("aelia","activateAelia");b("nocta","activateNocta");b("vyra","activateVyra");b("iona","activateIona")}
  function initAbilityIcons(){const m={"aelia":0,"nocta":1,"vyra":2,"iona":3};for(const[h,t]of Object.entries(m)){const i=el(h+"-ability-icon");if(i){i.classList.add(`glyph-type-${t}`);i.style.transition="transform 0.2s, filter 0.2s, opacity 0.2s"}}}

  function updateAbilityUI() {
    if (!IS_GAME) return;
    const bar = el("ability-bar");
    if (GS.isProcessing) { if(bar) bar.style.opacity = "0.7"; } else { if(bar) bar.style.opacity = "1"; }
    
    const A = [ { id: "aelia", charge: GS.aeliaCharge, max: 10 }, { id: "nocta", charge: GS.noctaCharge, max: 12 }, { id: "vyra",  charge: GS.vyraCharge,  max: 15 }, { id: "iona",  charge: GS.ionaCharge,  max: 18 } ];
    A.forEach((h) => {
      const ring = el(h.id + "-ability-ring");
      const icon = el(h.id + "-ability-icon");
      const slot = ring ? ring.parentNode : null;
      if (!ring || !icon) return;
      
      const pct = Math.min(1, h.charge / h.max);
      const deg = pct * 360;
      
      if (pct >= 1) {
          // FULL
          ring.style.background = `conic-gradient(#38bdf8 360deg, transparent 0deg)`;
          ring.style.boxShadow = `0 0 15px #38bdf8`;
          icon.classList.add("ability-ready");
          ring.classList.add("ring-ready");
          
          // HARD OPACITY FIX
          icon.style.cssText = "opacity: 1 !important; transform: scale(1.0); transition: opacity 0.2s;";
          icon.classList.add("icon-full-opacity");
          
          if (slot && !document.getElementById("tap-" + h.id)) {
              const tap = document.createElement("div");
              tap.id = "tap-" + h.id; tap.innerText = "TAP!";
              tap.style.cssText = "position:absolute; top:-15px; color:#fff; font-weight:bold; font-size:0.7rem; text-shadow:0 0 5px #000; animation: bounce 0.5s infinite alternate;";
              slot.style.position = "relative"; slot.appendChild(tap);
          }
      } else {
          // CHARGING
          ring.style.background = `conic-gradient(#38bdf8 ${deg}deg, rgba(255,255,255,0.1) ${deg}deg)`;
          ring.style.boxShadow = `none`;
          icon.classList.remove("ability-ready");
          ring.classList.remove("ring-ready");
          icon.classList.remove("icon-full-opacity");
          
          const prevTap = document.getElementById("tap-" + h.id); if(prevTap) prevTap.remove();
          
          // DIMMED (Fixed 0.4 Opacity)
          icon.style.cssText = `opacity: 0.4 !important; transform: scale(1.0);`;
      }
    });
  }

  function renderBoard(){const g=el("game-grid");if(!GS.board||!g)return;const N=GS.GRID_SIZE;g.innerHTML="";for(let r=0;r<N;r++){for(let c=0;c<N;c++){const cell=GS.board[r][c],d=document.createElement("div");d.className="grid-cell tile3D";d.id=`cell-${r}-${c}`;if(window.Input&&window.Input.onCellPointerDown)d.addEventListener("pointerdown",e=>window.Input.onCellPointerDown(e,r,c),{passive:!1});const k=document.createElement("div");k.className="glyphContainer";if(cell){const i=document.createElement("img");i.className="tileIcon";if(cell.kind==="frozen"){i.src=HAZARD_IMAGES.frozen;d.classList.add("frozenTile")}else if(cell.kind==="poison"){i.src=HAZARD_IMAGES.poison;d.classList.add("poisonTile")}else if(cell.kind==="junk"){i.src=HAZARD_IMAGES.junk;d.classList.add("junkTile")}else if(cell.kind==="lava"){i.src=HAZARD_IMAGES.lava;d.classList.add("lavaTile")}else if(cell.kind==="glyph"){i.src=TILE_IMAGES[cell.type]||"assets/tile_unknown.png";i.classList.add(`glyph-type-${cell.type}`)}i.onerror=function(){this.style.display='none';this.parentNode.style.backgroundColor='#333';this.parentNode.innerText='?'};k.appendChild(i)}d.appendChild(k);g.appendChild(d)}}}
  function updateDiscipleBadge(){const b=el("disciple-badge-live"),c=el("disciple-chibi-live"),d=GS.disciple;if(!d)return;if(b)b.textContent="Disciple: "+d.name;if(c){c.src="assets/disciple_"+d.id.toLowerCase()+".jpg";c.onerror=function(){this.onerror=null;let f="tile_greed.png";if(d.attack==="poison")f="tile_plague.png";if(d.attack==="drain")f="tile_war.png";if(d.attack==="deceit")f="tile_deceit.png";if(d.attack==="greed")f="tile_greed.png";this.src="assets/"+f;};c.style.display="block"}}
  function updateChibiUI(){const h=el("hero-chibi-live"),d=GS.disciple;if(!h||!d)return;const m={GREED:"aelia",PLAGUE:"nocta",WAR:"vyra",DECEIT:"iona"},n=m[d.id]||"aelia";h.src="assets/"+n+".png";h.onerror=function(){this.onerror=null;this.src="assets/tile_"+n+".png"};updateDiscipleBadge()}
  
  // --- UPDATED HUD ---
  function updateStats(){if(!IS_GAME)return;const b=el("disciple-hp-bar"),l=el("disciple-hp-label"),m=el("moves-left");if(b&&GS.discipleHP!=null){const p=Math.max(0,GS.discipleHP/GS.discipleMaxHP);b.style.width=(p*100)+"%"}if(l&&GS.discipleHP!=null)l.textContent=GS.discipleHP+" HP";if(m)m.innerText=GS.movesLeft;if(GS.currentLevelId){const l=GS.currentLevelId,z=Math.ceil(l/10);const e=document.getElementById("level-indicator");if(e)e.innerText=`SEC ${z}-${l}`}if(GS.timeLeft){const t=document.getElementById("time-indicator");if(t)t.innerText=`TIME: ${GS.timeLeft}s`}}
  
  function updateEnergyUI(){if(!window.economy)return;window.economy.regenerateEnergy();const c=window.economy.getEnergy(),e=el("energy-count");if(e)e.textContent=c;}
  function updatePrismaUI(){const p=el("prisma-count"),a=el("aurum-count");if(window.economy){if(p)p.textContent=economy.getPrisma();if(a)a.textContent=economy.getAurum()}}
  function flashAlert(t,d=2500){const b=el("alert-banner");if(!b)return;b.textContent=t;b.classList.add("alert-active");setTimeout(()=>b.classList.remove("alert-active"),d)}
})();