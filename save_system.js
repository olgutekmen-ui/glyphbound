/* save_system.js — V2.1 (ANTI-QUEST FARMING) */
(function() {
    const SAVE_KEYS = [
        "levelUnlocked", "nx_energy", "nx_last_energy_timestamp", "nx_prisma", "nx_aurum",
        "nx_item_bomb", "nx_item_hourglass", "nx_item_antidote", 
        "nx_quest_data_v1", "nx_quest_log_seen_date_v2"
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

                // 1. Sanitize Currencies & Progression
                sanitize("nx_energy", 10); 
                sanitize("nx_prisma", 99999); 
                sanitize("nx_aurum", 999);
                sanitize("levelUnlocked", 50);
                sanitize("nx_item_bomb", 99);
                sanitize("nx_item_hourglass", 99);
                sanitize("nx_item_antidote", 99);

                // 2. Restore Timestamps Safeley
                if(data.nx_last_energy_timestamp) localStorage.setItem("nx_last_energy_timestamp", data.nx_last_energy_timestamp);
                
                // 3. SECURITY PATCH: QUEST SANITIZATION
                // We do NOT blindly restore quest progress to prevent "Claim -> Import -> Claim" loops.
                // We only restore the 'Day' index to maintain the schedule, but reset progress.
                if (data.nx_quest_data_v1) {
                    try {
                        const qData = JSON.parse(data.nx_quest_data_v1);
                        // Reset progress to prevent farming
                        qData.progress = 0; 
                        qData.claimed = false; 
                        
                        // Validate Day
                        if (!qData.day || qData.day < 1 || qData.day > 7) qData.day = 1;
                        
                        localStorage.setItem("nx_quest_data_v1", JSON.stringify(qData));
                    } catch(e) {
                        // If corrupt, remove it to trigger a reset
                        localStorage.removeItem("nx_quest_data_v1");
                    }
                }

                if(data.nx_quest_log_seen_date_v2) localStorage.setItem("nx_quest_log_seen_date_v2", data.nx_quest_log_seen_date_v2);

                alert("DATA RESTORED. QUEST PROGRESS RESET FOR SECURITY.");
                window.location.reload();
            } catch (e) { 
                console.error(e);
                alert("CORRUPT OR INVALID SAVE CODE."); 
            }
        }
    };
    window.SaveSys = SaveSys;
})();