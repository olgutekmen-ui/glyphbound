/* save_system.js — V2.2 (ARTIFACT SUPPORT) */
(function() {
    const SAVE_KEYS = [
        "levelUnlocked", "nx_energy", "nx_last_energy_timestamp", "nx_prisma", "nx_aurum",
        "nx_item_bomb", "nx_item_hourglass", "nx_item_antidote", 
        "nx_quest_data_v1", "nx_quest_log_seen_date_v2",
        "nx_artifacts_inventory_v1", "nx_supply_pass_expiry" // NEW
    ];

    const SaveSys = {
        exportData() {
            const data = {};
            SAVE_KEYS.forEach(k => {
                const val = localStorage.getItem(k);
                if (val !== null) data[k] = val;
            });
            try { return btoa(JSON.stringify(data)); } catch (e) { return null; }
        },
        
        importData(encodedStr) {
            try {
                const data = JSON.parse(atob(encodedStr));
                
                // VALIDATION & SANITIZATION
                if (!data.nx_energy && !data.levelUnlocked && !data.nx_prisma) throw new Error("Invalid Data");

                const sanitize = (key, max = Infinity) => {
                    if (data[key]) {
                        let val = parseInt(data[key], 10);
                        if (!Number.isFinite(val) || isNaN(val)) val = 0;
                        if (val > max) val = max;
                        localStorage.setItem(key, String(val));
                    }
                };

                sanitize("nx_energy", 10); 
                sanitize("nx_prisma", 99999); 
                sanitize("nx_aurum", 999);
                sanitize("levelUnlocked", 200); // UPDATED MAX LEVEL
                sanitize("nx_item_bomb", 99);
                sanitize("nx_item_hourglass", 99);
                sanitize("nx_item_antidote", 99);

                if(data.nx_last_energy_timestamp) localStorage.setItem("nx_last_energy_timestamp", data.nx_last_energy_timestamp);
                if(data.nx_supply_pass_expiry) localStorage.setItem("nx_supply_pass_expiry", data.nx_supply_pass_expiry);

                // ARTIFACT RESTORE
                if(data.nx_artifacts_inventory_v1) {
                    try {
                        const inv = JSON.parse(data.nx_artifacts_inventory_v1);
                        if(Array.isArray(inv)) localStorage.setItem("nx_artifacts_inventory_v1", JSON.stringify(inv));
                    } catch(e) {}
                }

                // QUEST RESET (Security)
                if (data.nx_quest_data_v1) {
                    try {
                        const qData = JSON.parse(data.nx_quest_data_v1);
                        qData.progress = 0; 
                        qData.claimed = false; 
                        if (!qData.day || qData.day < 1 || qData.day > 7) qData.day = 1;
                        localStorage.setItem("nx_quest_data_v1", JSON.stringify(qData));
                    } catch(e) { localStorage.removeItem("nx_quest_data_v1"); }
                }

                if(data.nx_quest_log_seen_date_v2) localStorage.setItem("nx_quest_log_seen_date_v2", data.nx_quest_log_seen_date_v2);

                alert("DATA RESTORED.");
                window.location.reload();
            } catch (e) { 
                console.error(e);
                alert("CORRUPT OR INVALID SAVE CODE."); 
            }
        }
    };
    window.SaveSys = SaveSys;
})();