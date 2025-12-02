/* economy.js — V1.3 (INVENTORY SYSTEM) */
(function () {
  const LS = {
    energy: "nx_energy",
    lastEnergyAt: "nx_last_energy_timestamp",
    prisma: "nx_prisma",
    aurum: "nx_aurum",
    lastLogin: "nx_last_login_date",
    // NEW INVENTORY KEYS
    itemBomb: "nx_item_bomb",
    itemHourglass: "nx_item_hourglass",
    itemAntidote: "nx_item_antidote"
  };

  const economy = {
    maxEnergy: 10,       
    regenMinutes: 6,     
    levelCost: 1,
    
    // COSTS
    prismaToEnergyCost: 50,
    aurumToPrismaRate: 100,
    
    // ITEM COSTS
    costBomb: 30,      // Prisma
    costHourglass: 40, // Prisma
    costAntidote: 20,  // Prisma

    adWatchReward: 3,
    dailyLoginAurum: 3,

    LS_KEYS: LS,

    // --- GETTERS ---
    getEnergy() { return parseInt(localStorage.getItem(LS.energy) || "10", 10); },
    getPrisma() { return parseInt(localStorage.getItem(LS.prisma) || "0", 10); },
    getAurum() { return parseInt(localStorage.getItem(LS.aurum) || "0", 10); },
    
    getItemCount(type) {
        if(type === 'bomb') return parseInt(localStorage.getItem(LS.itemBomb) || "0", 10);
        if(type === 'hourglass') return parseInt(localStorage.getItem(LS.itemHourglass) || "0", 10);
        if(type === 'antidote') return parseInt(localStorage.getItem(LS.itemAntidote) || "0", 10);
        return 0;
    },

    // --- SETTERS ---
    setEnergy(n) {
      const val = Math.max(0, Math.min(this.maxEnergy, n));
      localStorage.setItem(LS.energy, String(val));
      if (val >= this.maxEnergy) localStorage.setItem(LS.lastEnergyAt, String(Date.now()));
    },

    addItem(type, n) {
        const current = this.getItemCount(type);
        const key = type === 'bomb' ? LS.itemBomb : type === 'hourglass' ? LS.itemHourglass : LS.itemAntidote;
        localStorage.setItem(key, String(current + n));
    },

    useItem(type) {
        const current = this.getItemCount(type);
        if (current > 0) {
            const key = type === 'bomb' ? LS.itemBomb : type === 'hourglass' ? LS.itemHourglass : LS.itemAntidote;
            localStorage.setItem(key, String(current - 1));
            return true;
        }
        return false;
    },

    // --- CORE ACTIONS ---
    addPrisma(n) { localStorage.setItem(LS.prisma, String(this.getPrisma() + n)); },
    addAurum(n) { localStorage.setItem(LS.aurum, String(this.getAurum() + n)); },

    addEnergy(n) {
      const e = this.getEnergy();
      const newVal = Math.min(this.maxEnergy, e + n);
      this.setEnergy(newVal);
    },

    spendPrisma(n) {
      const cur = this.getPrisma();
      if (cur < n) return false;
      localStorage.setItem(LS.prisma, String(cur - n));
      return true;
    },

    spendAurum(n) {
      const cur = this.getAurum();
      if (cur < n) return false;
      localStorage.setItem(LS.aurum, String(cur - n));
      return true;
    },

    spendEnergyForLevel() {
      this.regenerateEnergy(); 
      const e = this.getEnergy();
      if (e < this.levelCost) return false;
      this.setEnergy(e - this.levelCost);
      return true;
    },

    // --- SHOP ACTIONS ---
    buyItem(type) {
        let cost = 0;
        if(type === 'bomb') cost = this.costBomb;
        if(type === 'hourglass') cost = this.costHourglass;
        if(type === 'antidote') cost = this.costAntidote;

        if (this.spendPrisma(cost)) {
            this.addItem(type, 1);
            return true;
        }
        return false;
    },

    buyEnergyWithPrisma() {
      if (this.getEnergy() >= this.maxEnergy) return false;
      if (this.spendPrisma(this.prismaToEnergyCost)) {
        this.addEnergy(1);
        return true;
      }
      return false;
    },

    watchAdForEnergy() {
      if (this.getEnergy() >= this.maxEnergy) return false;
      this.addEnergy(this.adWatchReward);
      return true;
    },

    exchangeAurumToPrisma() {
      if (this.spendAurum(1)) {
        this.addPrisma(this.aurumToPrismaRate);
        return true;
      }
      return false;
    },

    // --- INIT & REGEN ---
    init() {
      if (!localStorage.getItem(LS.energy)) localStorage.setItem(LS.energy, String(this.maxEnergy));
      if (!localStorage.getItem(LS.prisma)) localStorage.setItem(LS.prisma, "100");
      if (!localStorage.getItem(LS.aurum))  localStorage.setItem(LS.aurum, "0");
      if (!localStorage.getItem(LS.lastEnergyAt)) localStorage.setItem(LS.lastEnergyAt, String(Date.now()));
      
      // Init items if missing
      if (!localStorage.getItem(LS.itemBomb)) localStorage.setItem(LS.itemBomb, "1"); // Give 1 free
      if (!localStorage.getItem(LS.itemHourglass)) localStorage.setItem(LS.itemHourglass, "1");
      if (!localStorage.getItem(LS.itemAntidote)) localStorage.setItem(LS.itemAntidote, "1");

      this.regenerateEnergy();
      this.checkDailyLogin();
    },

    regenerateEnergy() {
      let cur = this.getEnergy();
      if (cur >= this.maxEnergy) {
        localStorage.setItem(LS.lastEnergyAt, String(Date.now()));
        return;
      }
      const last = parseInt(localStorage.getItem(LS.lastEnergyAt) || "0", 10);
      const now = Date.now();
      const diff = now - last;
      const msPerEnergy = this.regenMinutes * 60 * 1000;

      if (diff >= msPerEnergy) {
        const gained = Math.floor(diff / msPerEnergy);
        const newTotal = Math.min(this.maxEnergy, cur + gained);
        this.setEnergy(newTotal);
        const remainder = diff % msPerEnergy;
        localStorage.setItem(LS.lastEnergyAt, String(now - remainder));
      }
    },

    checkDailyLogin() {
      const lastDate = localStorage.getItem(LS.lastLogin);
      const today = new Date().toDateString();
      if (lastDate !== today) {
        this.addAurum(this.dailyLoginAurum);
        localStorage.setItem(LS.lastLogin, today);
        setTimeout(() => { if(window.alert) alert(`DAILY LOGIN: +${this.dailyLoginAurum} Aurum!`); }, 500);
      }
    }
  };

  window.economy = economy;
  economy.init();
})();