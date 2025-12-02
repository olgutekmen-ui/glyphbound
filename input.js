// input.js — FIXED + AUDIO UNLOCK
(function () {
  const GS = window.gameState || window.GameState || (window.gameState = {});

  const drag = {
    active: false, startR: -1, startC: -1, startX: 0, startY: 0, pointerId: null, swapped: false
  };
  let selected = null;

  function isSwappable(cell) { return cell && cell.kind === "glyph"; }
  function resetDrag() { drag.active = false; drag.startR = -1; drag.startC = -1; drag.pointerId = null; drag.swapped = false; }
  function clearSelection() { if (selected) { const el = document.getElementById(`cell-${selected.r}-${selected.c}`); if (el) el.classList.remove("cell-selected"); } selected = null; }
  function setSelection(r, c) { clearSelection(); selected = { r, c }; const el = document.getElementById(`cell-${r}-${c}`); if (el) el.classList.add("cell-selected"); }
  function areNeighbors(r1, c1, r2, c2) { return (Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1); }

  function onCellPointerDown(e, r, c) {
    // --- AUDIO FIX: Resume Context on First Interaction ---
    if (window.AudioSys && AudioSys.ctx && AudioSys.ctx.state === 'suspended') {
        AudioSys.ctx.resume().then(() => {
            console.log("Audio Context Resumed");
            // Optional: Restart BGM if it was paused
            if (!AudioSys.muted) AudioSys.playBGM('bgm_battle');
        });
    }

    if (GS.isProcessing || !window.Board) return;
    const cell = GS.board?.[r]?.[c];
    if (!isSwappable(cell)) { clearSelection(); return; }

    drag.active = true;
    drag.pointerId = e.pointerId;
    drag.startR = r; drag.startC = c;
    drag.startX = e.clientX; drag.startY = e.clientY;
    drag.swapped = false;

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp, { passive: false });
    window.addEventListener("pointercancel", onCancel, { passive: false });
    if (e.cancelable) e.preventDefault(); 
  }

  function onMove(e) {
    if (!drag.active || e.pointerId !== drag.pointerId || drag.swapped || GS.isProcessing) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

    let r2 = drag.startR, c2 = drag.startC;
    if (Math.abs(dx) > Math.abs(dy)) { dx < 0 ? c2-- : c2++; } else { dy < 0 ? r2-- : r2++; }

    const N = GS.GRID_SIZE;
    if (r2 < 0 || r2 >= N || c2 < 0 || c2 >= N) return;
    if (!isSwappable(GS.board[r2][c2])) return;

    drag.swapped = true;
    clearSelection();
    
    try { if(window.AudioSys && AudioSys.play) AudioSys.play('swap'); } catch(e){}

    window.Engine.trySwap(drag.startR, drag.startC, r2, c2).then(() => resetDrag());
    e.preventDefault();
  }

  function onUp(e) {
    if (e.pointerId !== drag.pointerId) return;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);

    if (!drag.swapped && !GS.isProcessing) {
      const r = drag.startR, c = drag.startC;
      if (!selected) {
        setSelection(r, c);
      } else {
        if (selected.r === r && selected.c === c) {
          clearSelection();
        } else if (areNeighbors(selected.r, selected.c, r, c)) {
           const r1 = selected.r, c1 = selected.c;
           clearSelection();
           try { if(window.AudioSys && AudioSys.play) AudioSys.play('swap'); } catch(e){}
           window.Engine.trySwap(r1, c1, r, c);
        } else {
           setSelection(r, c);
        }
      }
    }
    resetDrag();
    if(e.cancelable) e.preventDefault();
  }

  function onCancel(e) {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    resetDrag();
    clearSelection();
  }

  window.Input = { onCellPointerDown };
})();