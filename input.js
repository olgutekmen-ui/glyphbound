// input.js
// ────────────────────────────────────────────────
// Handles click/drag swap & gesture feedback
// ────────────────────────────────────────────────

import { board, renderBoard, processMatches } from "./board.js";

let first = null;

export function enableInput() {
  const grid = document.getElementById("game-grid");

  grid.addEventListener("click", e => {
    const cell = e.target.closest(".grid-cell");
    if (!cell) return;
    const r = +cell.dataset.row, c = +cell.dataset.col;
    handleSelect(r, c);
  });
}

function handleSelect(r, c) {
  if (!first) {
    first = { r, c };
    highlightCell(r, c, true);
  } else {
    const second = { r, c };
    highlightCell(first.r, first.c, false);
    swapCells(first, second);
    first = null;
  }
}

function highlightCell(r, c, on) {
  const el = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
  if (el) el.style.outline = on ? "2px solid #00ffff" : "none";
}

function swapCells(a, b) {
  const temp = board[a.r][a.c];
  board[a.r][a.c] = board[b.r][b.c];
  board[b.r][b.c] = temp;
  renderBoard();
  processMatches();
}
