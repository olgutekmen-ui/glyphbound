/**
 * patch_shield.js
 * Adds disciple shield state, UI renderer, and Vyra ability hook.
 * Usage:
 *   node patch_shield.js "C:\\Users\\olgut\\Desktop\\N-X\\game"
 * or:
 *   node patch_shield.js        // runs in current directory
 */

const fs = require("fs");
const path = require("path");

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const files = {
  state: path.join(root, "state.js"),
  ui: path.join(root, "ui.js"),
  abilities: path.join(root, "abilities.js"),
};

function backupFile(fp) {
  const bak = fp + ".bak";
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(fp, bak);
  }
}

function readOrDie(fp) {
  if (!fs.existsSync(fp)) {
    console.error(`✘ Missing file: ${fp}`);
    process.exit(1);
  }
  return fs.readFileSync(fp, "utf8");
}

function write(fp, content) {
  fs.writeFileSync(fp, content, "utf8");
  console.log(`✔ Wrote ${path.basename(fp)}`);
}

/* ---------------------------
 * 1) state.js patch
 * --------------------------- */
(function patchState() {
  const fp = files.state;
  let src = readOrDie(fp);
  backupFile(fp);

  let changed = false;

  // Ensure gameState has discipleShield & discipleShieldMax & prisma
  const gameStateRegex = /export\s+const\s+gameState\s*=\s*{([\s\S]*?)}/m;
  const m = src.match(gameStateRegex);
  if (m) {
    let block = m[0];

    const ensureProp = (prop, line) => {
      if (!new RegExp(`\\b${prop}\\b\\s*:`).test(block)) {
        const insertAt = block.lastIndexOf("}");
        block = block.slice(0, insertAt) + `  ${line},\n}`; // simple append before closing
        changed = true;
      }
    };

    ensureProp("discipleShield", "discipleShield: 0          // current shield HP");
    ensureProp("discipleShieldMax", "discipleShieldMax: 0       // max shield HP");
    // Prisma default if missing
    ensureProp(
      "prisma",
      `prisma: parseInt(localStorage.getItem("prisma") || "0", 10)`
    );

    if (changed) {
      src = src.replace(gameStateRegex, block);
    }
  } else {
    console.warn("⚠ Could not find `export const gameState = { ... }` in state.js");
  }

  // Only write if changed
  if (changed) write(fp, src);
  else console.log("• state.js already OK (no changes)");
})();

/* ---------------------------
 * 2) ui.js patch
 *    - ensure updateShieldUI
 *    - ensure a runtime creator for shield bar (ensureShieldBar)
 * --------------------------- */
(function patchUI() {
  const fp = files.ui;
  let src = readOrDie(fp);
  backupFile(fp);

  let changed = false;

  // Add ensureShieldBar() if missing
  if (!/function\s+ensureShieldBar\s*\(/.test(src)) {
    const ensureFn = `
export function ensureShieldBar() {
  // Try to find an existing shield bar
  let el = document.getElementById("disciple-shield-bar");
  if (el) return el;

  // Try to attach under HP container if present
  const hpWrap = document.getElementById("disciple-hp-container") || document.body;
  el = document.createElement("div");
  el.id = "disciple-shield-bar";
  el.style.cssText = "height:6px;background:#00ffff;width:0%;transition:width .2s;box-shadow:0 0 8px #00ffff;margin-top:4px;border-radius:4px;";
  // Place it just after the HP bar if possible
  if (hpWrap && hpWrap.parentNode) {
    hpWrap.parentNode.insertBefore(el, hpWrap.nextSibling);
  } else {
    document.body.appendChild(el);
  }
  return el;
}
`;
    src += "\n" + ensureFn.trim() + "\n";
    changed = true;
  }

  // Add updateShieldUI() if missing
  if (!/export\s+function\s+updateShieldUI\s*\(/.test(src)) {
    const uiFn = `
export function updateShieldUI() {
  const gs = window.gameState || {};
  const max = gs.discipleShieldMax || 0;
  const val = gs.discipleShield || 0;
  const el = ensureShieldBar();
  const pct = max > 0 ? Math.max(0, Math.min(100, (val / max) * 100)) : 0;
  el.style.width = pct + "%";
  el.style.background = pct > 0 ? "#00ffff" : "transparent";
  el.style.boxShadow = pct > 0 ? "0 0 8px #00ffff" : "none";
}
`;
    src += "\n" + uiFn.trim() + "\n";
    changed = true;
  }

  // Ensure it’s callable globally (optional convenience)
  if (!/window\.updateShieldUI\s*=/.test(src)) {
    src += `\ntry { window.updateShieldUI = updateShieldUI; } catch(_) {}\n`;
    changed = true;
  }
  if (!/window\.ensureShieldBar\s*=/.test(src)) {
    src += `\ntry { window.ensureShieldBar = ensureShieldBar; } catch(_) {}\n`;
    changed = true;
  }

  if (changed) write(fp, src);
  else console.log("• ui.js already OK (no changes)");
})();

/* ---------------------------
 * 3) abilities.js patch
 *    - Hook Vyra ability to apply shield to disciple
 * --------------------------- */
(function patchAbilities() {
  const fp = files.abilities;
  let src = readOrDie(fp);
  backupFile(fp);

  let changed = false;

  // Helper to inject a small shield function if absent
  if (!/function\s+applyDiscipleShield\s*\(/.test(src)) {
    const helper = `
function applyDiscipleShield(amount) {
  const gs = window.gameState || {};
  gs.discipleShieldMax = Math.max(gs.discipleShieldMax || 0, amount|0);
  gs.discipleShield = gs.discipleShieldMax;
  if (typeof window.updateShieldUI === "function") window.updateShieldUI();
}
try { window.applyDiscipleShield = applyDiscipleShield; } catch(_) {}
`;
    src += "\n" + helper.trim() + "\n";
    changed = true;
  }

  // Try to patch common patterns for Vyra ability
  // 1) case "vyra": ... break;
  const vyraCaseRegex = /case\s*["']vyra["']\s*:\s*([\s\S]*?)break\s*;/m;
  if (vyraCaseRegex.test(src) && !/applyDiscipleShield\(/.test(src.match(vyraCaseRegex)[1] || "")) {
    src = src.replace(vyraCaseRegex, (full, body) => {
      const injected = `
case "vyra":
${body.trim() ? "  " + body.trim() + "\n" : ""}
  // Reinforce disciple with a temporary shield (cyan bar)
  applyDiscipleShield(150);
  if (typeof window.showAlert === "function") window.showAlert("Disciple shield online!", 1200);
  break;
`;
      return injected;
    });
    changed = true;
  }

  // 2) activateVyraAbility / handleVyraClick style injection (fallback)
  if (!vyraCaseRegex.test(src) && !/applyDiscipleShield\(/.test(src)) {
    // try to find a function activateVyraAbility
    const vyraFnRegex = /(function\s+activateVyraAbility\s*\([\s\S]*?\)\s*{)([\s\S]*?)(})/m;
    if (vyraFnRegex.test(src)) {
      src = src.replace(vyraFnRegex, (full, start, body, end) => {
        if (/applyDiscipleShield\(/.test(body)) return full; // already patched
        const patchedBody = body + `\n  // Ensure disciple shield appears\n  applyDiscipleShield(150);\n  if (typeof window.updateShieldUI === "function") window.updateShieldUI();\n`;
        return start + patchedBody + end;
      });
      changed = true;
    }
  }

  if (changed) write(fp, src);
  else console.log("• abilities.js already OK (no changes)");
})();

console.log("\n✅ Patch complete. Now reload the game and test Vyra → shield appears/cyan bar fills.\n");
