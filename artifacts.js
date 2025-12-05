/* artifacts.js — V1.0 (THE BLACK MARKET) */
(function() {
    const LS_KEY = "nx_artifacts_inventory_v1";

    // RARITY: Common (60%), Rare (30%), Legendary (9%), Mythic (1%)
    const DB = [
        // COMMON (Dmg Boosts)
        { id: "c_gpu", name: "Overclocked GPU", rarity: "common", text: "+5% Damage", stat: "dmg", val: 0.05 },
        { id: "c_fan", name: "Cooling Fan", rarity: "common", text: "+2 Moves", stat: "moves", val: 2 },
        { id: "c_ram", name: "Spare RAM", rarity: "common", text: "+5% Ability Charge", stat: "charge", val: 0.05 },
        
        // RARE (Utility)
        { id: "r_batt", name: "Lithium Cell", rarity: "rare", text: "+10% Damage", stat: "dmg", val: 0.10 },
        { id: "r_ssd",  name: "Solid State Drive", rarity: "rare", text: "Start with 10% Charge", stat: "start_charge", val: 10 },
        { id: "r_av",   name: "Antivirus Patch", rarity: "rare", text: "Hazards spread 10% slower", stat: "hazard_slow", val: 0.1 },

        // LEGENDARY (Game Changers)
        { id: "l_cpu",  name: "Quantum CPU", rarity: "legendary", text: "+25% All Damage", stat: "dmg", val: 0.25 },
        { id: "l_net",  name: "Neural Network", rarity: "legendary", text: "Abilities cost 20% less", stat: "cost_red", val: 0.2 },
        
        // MYTHIC (Broken)
        { id: "m_key",  name: "The Master Key", rarity: "mythic", text: "Start with 50% Charge", stat: "start_charge", val: 50 },
        { id: "m_core", name: "The Singularity", rarity: "mythic", text: "+100% DAMAGE", stat: "dmg", val: 1.0 }
    ];

    const Artifacts = {
        inventory: [], // Array of IDs

        init() {
            const raw = localStorage.getItem(LS_KEY);
            if(raw) this.inventory = JSON.parse(raw);
        },

        save() {
            localStorage.setItem(LS_KEY, JSON.stringify(this.inventory));
        },

        // --- GACHA LOGIC ---
        pull(cost) {
            if (!window.economy || !economy.spendAurum(cost)) return { success: false, msg: "Insufficient Aurum" };
            
            const rand = Math.random();
            let tier = "common";
            if (rand > 0.99) tier = "mythic";
            else if (rand > 0.90) tier = "legendary";
            else if (rand > 0.60) tier = "rare";

            // Filter DB by tier
            const pool = DB.filter(i => i.rarity === tier);
            const item = pool[Math.floor(Math.random() * pool.length)];

            // Add to inv (Allow duplicates? For now, let's say Duplicates convert to Prisma?)
            // Simplification: Duplicates STACK for now (or just exist).
            this.inventory.push(item.id);
            this.save();

            return { success: true, item: item };
        },

        // --- STAT GETTERS (Hooks for Game Engine) ---
        
        // Multiplier (Base 1.0 + Artifacts)
        getDamageMult() {
            let mult = 1.0;
            this.inventory.forEach(id => {
                const it = DB.find(x => x.id === id);
                if(it && it.stat === 'dmg') mult += it.val;
            });
            return mult;
        },

        // Flat Bonus
        getMoveBonus() {
            let moves = 0;
            this.inventory.forEach(id => {
                const it = DB.find(x => x.id === id);
                if(it && it.stat === 'moves') moves += it.val;
            });
            return moves;
        },

        // Charge Multiplier
        getChargeMult() {
            let mult = 1.0;
            this.inventory.forEach(id => {
                const it = DB.find(x => x.id === id);
                if(it && it.stat === 'charge') mult += it.val;
            });
            return mult;
        },

        // Start Charge (Flat Amount)
        getStartCharge() {
            let val = 0;
            this.inventory.forEach(id => {
                const it = DB.find(x => x.id === id);
                if(it && it.stat === 'start_charge') val += it.val;
            });
            return val;
        },
        
        // Cost Reduction (Multiplier 0.0 - 1.0)
        getCostReduction() {
            let red = 0;
            this.inventory.forEach(id => {
                const it = DB.find(x => x.id === id);
                if(it && it.stat === 'cost_red') red += it.val;
            });
            return Math.min(0.5, red); // Cap at 50% reduction
        }
    };

    window.Artifacts = Artifacts;
    Artifacts.init();
})();