// shop_ui.js
// Floating HUD + modal shop. Minimal CSS inline for portability.

import { economy } from "./economy.js";

// ------- HUD (top-right) -------
function ensureHud() {
  if (document.getElementById("prisma-hud")) return;
  const hud = document.createElement("div");
  hud.id = "prisma-hud";
  hud.style.cssText = `
    position:fixed; right:12px; top:12px; z-index:10000;
    display:flex; align-items:center; gap:.5rem;
    background:rgba(0,0,0,0.35); border:2px solid #00ffff; border-radius:.75rem;
    padding:.4rem .6rem; box-shadow:0 0 10px rgba(0,255,255,.6);
    font-family: Orbitron, system-ui, sans-serif; color:#fff;
  `;
  hud.innerHTML = `
    <div style="display:flex; align-items:center; gap:.35rem;">
      <span style="color:#00ffff; font-weight:800; letter-spacing:.06em;">PRISMA</span>
      <span id="prisma-amount" style="font-weight:900;">0</span>
    </div>
    <button id="shop-btn" style="
      background:#ff00ff; color:#000; font-weight:900;
      border:2px solid #fff; border-radius:.5rem; padding:.3rem .6rem;
      box-shadow:0 0 10px rgba(255,0,255,.6); letter-spacing:.06em; cursor:pointer;">
      SHOP
    </button>
  `;
  document.body.appendChild(hud);
  document.getElementById("shop-btn").addEventListener("click", openShop);
}

// ------- Modal Shop -------
function ensureModal() {
  if (document.getElementById("shop-modal")) return;

  const wrap = document.createElement("div");
  wrap.id = "shop-modal";
  wrap.style.cssText = `
    position:fixed; inset:0; display:none; align-items:center; justify-content:center;
    background:rgba(0,0,0,0.6); z-index:10001;
  `;
  wrap.innerHTML = `
    <div style="
      width:min(92vw,480px); background:rgba(15,15,26,0.95); border:2px solid #00ffff;
      border-radius:1rem; box-shadow:0 0 14px rgba(0,255,255,.8);
      padding:1rem; color:#fff; font-family: Orbitron, system-ui, sans-serif;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:.5rem;">
        <div style="color:#00ffff; font-weight:900; letter-spacing:.1em;">SYNC-STORE</div>
        <button id="shop-close" style="
          background:#ff00ff; color:#000; border:2px solid #fff; border-radius:.5rem;
          font-weight:900; padding:.25rem .5rem; cursor:pointer;">CLOSE</button>
      </div>

      <div style="font-size:.8rem; color:#a0ffff; margin-bottom:.75rem;">
        💠 Balance: <span id="shop-balance" style="color:#ffd700; font-weight:800">0</span> Prisma
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:.75rem;">
        <!-- SKUs -->
        <div class="sku" data-cost="20" data-action="extra_moves" style="background:rgba(0,255,255,.08); border:1px solid #00ffff; border-radius:.5rem; padding:.6rem;">
          <div style="font-weight:800; color:#00ffff;">Extra Moves +5</div>
          <div style="font-size:.75rem; color:#a0ffff;">Add 5 moves to the current run.</div>
          <button class="buy-btn" style="margin-top:.4rem;">Buy · 20💠</button>
        </div>

        <div class="sku" data-cost="30" data-action="revive" style="background:rgba(255,0,255,.08); border:1px solid #ff00ff; border-radius:.5rem; padding:.6rem;">
          <div style="font-weight:800; color:#ff00ff;">Revive</div>
          <div style="font-size:.75rem; color:#a0ffff;">Continue once after defeat.</div>
          <button class="buy-btn" style="margin-top:.4rem;">Buy · 30💠</button>
        </div>

        <div class="sku" data-cost="15" data-action="energy_5" style="background:rgba(0,255,128,.08); border:1px solid #00ff80; border-radius:.5rem; padding:.6rem;">
          <div style="font-weight:800; color:#00ff80;">+5 Energy</div>
          <div style="font-size:.75rem; color:#a0ffff;">Refill five energy now.</div>
          <button class="buy-btn" style="margin-top:.4rem;">Buy · 15💠</button>
        </div>

        <div class="sku" data-cost="0" data-action="debug_prisma" style="background:rgba(255,215,0,.08); border:1px solid #ffd700; border-radius:.5rem; padding:.6rem;">
          <div style="font-weight:800; color:#ffd700;">[Dev] +100 Prisma</div>
          <div style="font-size:.75rem; color:#a0ffff;">Developer grant for testing.</div>
          <button class="buy-btn" style="margin-top:.4rem;">Grant · 0💠</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  document.getElementById("shop-close").addEventListener("click", closeShop);
  wrap.addEventListener("click", (e) => {
    if (e.target.id === "shop-modal") closeShop();
  });

  wrap.querySelectorAll(".buy-btn").forEach(btn => {
    btn.addEventListener("click", onBuyClicked);
  });
}

function onBuyClicked(e) {
  const card = e.currentTarget.closest(".sku");
  const cost = parseInt(card.dataset.cost, 10);
  const action = card.dataset.action;

  if (action === "debug_prisma") {
    economy.addPrisma(100);
    showToast("Added 100 Prisma (dev)");
    syncShopBalances();
    return;
  }

  if (!economy.spendPrisma(cost)) {
    showToast("Not enough Prisma 💠");
    return;
  }

  // Simple actions (extend as needed)
  if (action === "extra_moves") {
    if (window.gameState) {
      window.gameState.movesLeft = (window.gameState.movesLeft | 0) + 5;
      if (window.updateStats) window.updateStats();
      showToast("+5 Moves added");
    }
  } else if (action === "revive") {
    if (window.gameState) {
      // Revive: give 5 moves and clear defeat state
      window.gameState.movesLeft = Math.max(5, window.gameState.movesLeft);
      if (window.updateStats) window.updateStats();
      showToast("Revived with +5 Moves");
    }
  } else if (action === "energy_5") {
    economy.grantEnergy(5);
    showToast("+5 Energy");
  }

  syncShopBalances();
}

function showToast(text) {
  if (window.showAlert) {
    window.showAlert(text, 1300);
    return;
  }
  // fallback toast
  const t = document.createElement("div");
  t.textContent = text;
  t.style.cssText = `
    position:fixed; bottom:18px; left:50%; transform:translateX(-50%);
    background:#000; color:#fff; padding:.5rem .75rem; border-radius:.5rem;
    border:2px solid #fff; z-index:10002; font-weight:800; font-family: Orbitron,sans-serif;
  `;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1400);
}

function syncShopBalances() {
  const amt = document.getElementById("prisma-amount");
  const shopBal = document.getElementById("shop-balance");
  if (amt) amt.textContent = `${economy.getPrisma()}`;
  if (shopBal) shopBal.textContent = `${economy.getPrisma()}`;
}

export function updatePrismaUI() { syncShopBalances(); }
window.updatePrismaUI = updatePrismaUI; // expose for economy.js

export function openShop() {
  ensureModal();
  syncShopBalances();
  const m = document.getElementById("shop-modal");
  if (m) m.style.display = "flex";
}
export function closeShop() {
  const m = document.getElementById("shop-modal");
  if (m) m.style.display = "none";
}

export function initShopUI() {
  ensureHud();
  ensureModal();
  syncShopBalances();
  console.log("%c[shop_ui] ready", "color:#00ffff;font-weight:700");
}

// Auto-init when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    economy.init();
    initShopUI();
  });
} else {
  economy.init();
  initShopUI();
}
