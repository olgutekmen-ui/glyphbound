// state.js — FIXED CURRENCY KEYS TO MATCH ECONOMY
(function () {
  const GameState = {
    currentLevelId: 1,
    activeLevel: null,
    disciple: null,
    GRID_SIZE: 9, 
    board: [],
    score: 0,
    movesLeft: 0,
    discipleHP: 0,
    discipleMaxHP: 0,
    aeliaCharge: 0,
    noctaCharge: 0,
    vyraCharge: 0,
    ionaCharge: 0,
    isProcessing: false,
    turnsTaken: 0,
    discipleAttackRate: 3,
  };

  function getLevelUnlocked() {
    const raw = localStorage.getItem("levelUnlocked");
    return parseInt(raw, 10) || 1;
  }

  function setLevelUnlocked(n) {
    const cur = getLevelUnlocked();
    if (n > cur) localStorage.setItem("levelUnlocked", String(n));
  }

  // --- SYNCED WITH ECONOMY.JS ("nx_" prefix) ---
  function getPrisma() {
    const raw = localStorage.getItem("nx_prisma"); // Fixed key
    return parseInt(raw, 10) || 0;
  }

  function addPrisma(delta) {
    // We defer to economy if it exists to handle UI updates cleanly
    if (window.economy && window.economy.addPrisma) {
        window.economy.addPrisma(delta);
    } else {
        const next = Math.max(0, getPrisma() + delta);
        localStorage.setItem("nx_prisma", String(next)); // Fixed key
    }
  }

  function getAurum() {
    const raw = localStorage.getItem("nx_aurum"); // Fixed key
    return parseInt(raw, 10) || 0;
  }

  function addAurum(delta) {
    if (window.economy && window.economy.addAurum) {
        window.economy.addAurum(delta);
    } else {
        const next = Math.max(0, getAurum() + delta);
        localStorage.setItem("nx_aurum", String(next)); // Fixed key
    }
  }

  function readLevelIdFromURL() {
    try {
      const u = new URL(window.location.href);
      const id = parseInt(u.searchParams.get("level"), 10);
      return Number.isFinite(id) && id > 0 ? id : 1;
    } catch { return 1; }
  }

  window.GameState = GameState;
  window.gameState = GameState;

  window.StorageAPI = {
    getLevelUnlocked,
    setLevelUnlocked,
    getPrisma,
    addPrisma,
    getAurum,
    addAurum,
  };

  window.GRID_SIZE = GameState.GRID_SIZE;
  window.readLevelIdFromURL = readLevelIdFromURL;
})();