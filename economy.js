/* economy.js — V3.6 (INFLATION CONTROL) */
(function () {
  const LS = {
    energy: "nx_energy",
    lastEnergyAt: "nx_last_energy_timestamp",
    prisma: "nx_prisma",
    aurum: "nx_aurum",
    lastLogin: "nx_last_login_date",
    lastAdWatch: "nx_last_ad_watch",
    itemBomb: "nx_item_bomb",
    itemHourglass: "nx_item_hourglass",
    itemAntidote: "nx_item_antidote",
    supplyPassExpiry: "nx_supply_pass_expiry"
  };

  const economy = {
    maxEnergy: 10, regenMinutes: 6, levelCost: 1,
    prismaToEnergyCost: 50, aurumToPrismaRate: 100,
    
    // INCREASED COSTS (V3.6)
    costBomb: 50,      // Was 30
    costHourglass: 60, // Was 40
    costAntidote: 40,  // Was 20
    
    adWatchReward: 3, adCooldownMinutes: 10,
    dailyLoginPrisma: 50, 
    LS_KEYS: LS,

    getEnergy() { return parseInt(localStorage.getItem(LS.energy) || "10", 10); },
    getPrisma() { return parseInt(localStorage.getItem(LS.prisma) || "0", 10); },
    getAurum() { return parseInt(localStorage.getItem(LS.aurum) || "0", 10); },
    getItemCount(type) {
        if(type === 'bomb') return parseInt(localStorage.getItem(LS.itemBomb) || "0", 10);
        if(type === 'hourglass') return parseInt(localStorage.getItem(LS.itemHourglass) || "0", 10);
        if(type === 'antidote') return parseInt(localStorage.getItem(LS.itemAntidote) || "0", 10);
        return 0;
    },
    setEnergy(n) { const val = Math.max(0, Math.min(this.maxEnergy, n)); localStorage.setItem(LS.energy, String(val)); if (val >= this.maxEnergy) localStorage.setItem(LS.lastEnergyAt, String(Date.now())); },
    addItem(type, n) { const c = this.getItemCount(type); const k = type === 'bomb' ? LS.itemBomb : type === 'hourglass' ? LS.itemHourglass : LS.itemAntidote; localStorage.setItem(k, String(c + n)); },
    useItem(type) { const c = this.getItemCount(type); if (c > 0) { const k = type === 'bomb' ? LS.itemBomb : type === 'hourglass' ? LS.itemHourglass : LS.itemAntidote; localStorage.setItem(k, String(c - 1)); return true; } return false; },
    addPrisma(n) { localStorage.setItem(LS.prisma, String(this.getPrisma() + n)); },
    addAurum(n) { localStorage.setItem(LS.aurum, String(this.getAurum() + n)); },
    addEnergy(n) { const e = this.getEnergy(); const newVal = Math.min(this.maxEnergy, e + n); this.setEnergy(newVal); },
    spendPrisma(n) { const cur = this.getPrisma(); if (cur < n) return false; localStorage.setItem(LS.prisma, String(cur - n)); return true; },
    spendAurum(n) { const cur = this.getAurum(); if (cur < n) return false; localStorage.setItem(LS.aurum, String(cur - n)); return true; },
    spendEnergyForLevel() { this.regenerateEnergy(); const e = this.getEnergy(); if (e < this.levelCost) return false; this.setEnergy(e - this.levelCost); return true; },
    
    // UPDATED BUY LOGIC TO USE NEW COSTS
    buyItem(type) { 
        let cost = 0; 
        if(type==='bomb') cost=this.costBomb; 
        if(type==='hourglass') cost=this.costHourglass; 
        if(type==='antidote') cost=this.costAntidote; 
        if (this.spendPrisma(cost)) { this.addItem(type, 1); return true; } 
        return false; 
    },
    
    buyEnergyWithPrisma() { if (this.getEnergy() >= this.maxEnergy) return false; if (this.spendPrisma(this.prismaToEnergyCost)) { this.addEnergy(1); return true; } return false; },
    exchangeAurumToPrisma() { if (this.spendAurum(1)) { this.addPrisma(this.aurumToPrismaRate); return true; } return false; },
    watchAdForEnergy() {
      const now = Date.now(); const last = parseInt(localStorage.getItem(LS.lastAdWatch) || "0", 10);
      const diff = now - last; const cooldownMs = this.adCooldownMinutes * 60 * 1000;
      if (diff < cooldownMs) { const remainingMin = Math.ceil((cooldownMs - diff) / 60000); alert(`Signal Jammed! Cooldown: ${remainingMin}m`); return false; }
      if (this.getEnergy() >= this.maxEnergy) { alert("Energy Full!"); return false; }
      this.addEnergy(this.adWatchReward); localStorage.setItem(LS.lastAdWatch, String(now)); return true;
    },

    checkSupplyPass() {
        const expiry = parseInt(localStorage.getItem(LS.supplyPassExpiry) || "0", 10);
        if (Date.now() < expiry) {
            const lastDate = localStorage.getItem(LS.lastLogin);
            const today = new Date().toDateString();
            if (lastDate !== today) {
                this.addAurum(2); 
                alert("NEURO LINK PASS ACTIVE: +2 AURUM DROP!");
            }
        }
    },

    activateSupplyPass() {
        const now = Date.now();
        const currentExp = parseInt(localStorage.getItem(LS.supplyPassExpiry) || "0", 10);
        const start = (currentExp > now) ? currentExp : now;
        const newExp = start + (30 * 24 * 60 * 60 * 1000);
        localStorage.setItem(LS.supplyPassExpiry, String(newExp));
        this.addAurum(5);
        alert("NEURO LINK ACTIVATED! +5 Aurum Immediate. +2 Daily for 30 Days.");
    },

    init() {
      if (!localStorage.getItem(LS.energy)) localStorage.setItem(LS.energy, String(this.maxEnergy));
      if (!localStorage.getItem(LS.prisma)) localStorage.setItem(LS.prisma, "100");
      if (!localStorage.getItem(LS.aurum))  localStorage.setItem(LS.aurum, "0");
      if (!localStorage.getItem(LS.lastEnergyAt)) localStorage.setItem(LS.lastEnergyAt, String(Date.now()));
      if (!localStorage.getItem(LS.itemBomb)) localStorage.setItem(LS.itemBomb, "1"); 
      if (!localStorage.getItem(LS.itemHourglass)) localStorage.setItem(LS.itemHourglass, "1");
      if (!localStorage.getItem(LS.itemAntidote)) localStorage.setItem(LS.itemAntidote, "1");
      
      this.regenerateEnergy();
      this.checkSupplyPass();

      const lastDate = localStorage.getItem(LS.lastLogin);
      const today = new Date().toDateString();
      if (lastDate !== today) {
        this.addPrisma(this.dailyLoginPrisma);
        localStorage.setItem(LS.lastLogin, today);
        setTimeout(() => { if(window.alert) alert(`DAILY LOGIN: +${this.dailyLoginPrisma} Prisma!`); }, 500);
      }
    },

    regenerateEnergy() {
      let cur = this.getEnergy();
      if (cur >= this.maxEnergy) { localStorage.setItem(LS.lastEnergyAt, String(Date.now())); return; }
      const last = parseInt(localStorage.getItem(LS.lastEnergyAt) || "0", 10); const now = Date.now();
      const diff = now - last; const msPerEnergy = this.regenMinutes * 60 * 1000;
      if (diff >= msPerEnergy) {
        const gained = Math.floor(diff / msPerEnergy); const newTotal = Math.min(this.maxEnergy, cur + gained);
        this.setEnergy(newTotal); const remainder = diff % msPerEnergy; localStorage.setItem(LS.lastEnergyAt, String(now - remainder));
      }
    }
  };
  window.economy = economy; economy.init();
})();