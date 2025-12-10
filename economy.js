/* economy.js — V1.5 (DATA PACKS & MYTHIC 75) */
(function () {
  const LS = {
    energy: "nx_energy",
    lastEnergyAt: "nx_last_energy_timestamp",
    prisma: "nx_prisma",
    aurum: "nx_aurum",
    lastLogin: "nx_last_login_date",
    itemBomb: "nx_item_bomb",
    itemHourglass: "nx_item_hourglass",
    itemAntidote: "nx_item_antidote",
    premiumPass: "nx_premium_pass_active", 
    passDaysLeft: "nx_pass_days_left"
  };

  const economy = {
    maxEnergy: 10,       
    regenMinutes: 6,     
    levelCost: 1,
    
    // COSTS
    costBomb: 30,      
    costHourglass: 40, 
    costAntidote: 20,  
    
    // REWARDS
    adWatchReward: 3,
    
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

    addPrisma(n) { localStorage.setItem(LS.prisma, String(this.getPrisma() + n)); },
    addAurum(n) { localStorage.setItem(LS.aurum, String(this.getAurum() + n)); },

    addEnergy(n) {
      const e = this.getEnergy();
      this.setEnergy(Math.min(this.maxEnergy, e + n));
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

    // --- REAL MONEY SIMULATION ---
    buyPack(id) {
        if (id === 'cache') {
            this.addAurum(2);
            alert("1 MB CACHE ACQUIRED! (+2 Aurum)");
            return true;
        }
        if (id === 'pass') {
            this.addAurum(5);
            localStorage.setItem(LS.premiumPass, "true");
            localStorage.setItem(LS.passDaysLeft, "30");
            alert("10 MB PASS ACTIVE! (+5 Aurum Now, +2 Daily)");
            return true;
        }
        if (id === 'data') {
            this.addAurum(12);
            alert("100 MB PRO PACK ACQUIRED! (+12 Aurum)");
            return true;
        }
        if (id === 'dump') {
            this.addAurum(75); // 75 AURUM CONFIRMED
            alert("1 TB MYTHIC DUMP! (+75 Aurum) UNSTOPPABLE.");
            return true;
        }
        return false;
    },

    // --- INIT ---
    init() {
      if (!localStorage.getItem(LS.energy)) localStorage.setItem(LS.energy, String(this.maxEnergy));
      if (!localStorage.getItem(LS.prisma)) localStorage.setItem(LS.prisma, "100");
      if (!localStorage.getItem(LS.aurum))  localStorage.setItem(LS.aurum, "0");
      if (!localStorage.getItem(LS.lastEnergyAt)) localStorage.setItem(LS.lastEnergyAt, String(Date.now()));
      
      if (!localStorage.getItem(LS.itemBomb)) localStorage.setItem(LS.itemBomb, "1");
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
        this.setEnergy(Math.min(this.maxEnergy, cur + gained));
        localStorage.setItem(LS.lastEnergyAt, String(now - (diff % msPerEnergy)));
      }
    },

    checkDailyLogin() {
      const lastDate = localStorage.getItem(LS.lastLogin);
      const today = new Date().toDateString();
      
      if (lastDate !== today) {
        let reward = 1;
        let msg = "DAILY LOGIN: +1 Aurum";
        
        if (localStorage.getItem(LS.premiumPass) === "true") {
            let days = parseInt(localStorage.getItem(LS.passDaysLeft) || "0", 10);
            if (days > 0) {
                reward += 2;
                msg = "DAILY LOGIN + PASS: +3 Aurum!";
                localStorage.setItem(LS.passDaysLeft, String(days - 1));
            } else {
                localStorage.removeItem(LS.premiumPass);
                alert("10 MB PASS EXPIRED.");
            }
        }
        this.addAurum(reward);
        localStorage.setItem(LS.lastLogin, today);
        setTimeout(() => { if(window.alert) alert(msg); }, 500);
      }
    }
  };

  window.economy = economy;
  economy.init();
})();