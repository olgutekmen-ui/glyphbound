/* save_system.js */
(function() {
    const SAVE_KEYS = [
        "levelUnlocked", "nx_energy", "nx_last_energy_timestamp", "nx_prisma", "nx_aurum",
        "nx_item_bomb", "nx_item_hourglass", "nx_item_antidote", "nx_tutorial_seen_final"
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
                if (!data.nx_energy && !data.levelUnlocked) throw new Error("Invalid");
                Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
                alert("RESTORED!");
                window.location.reload();
            } catch (e) { alert("Invalid Code"); }
        }
    };
    window.SaveSys = SaveSys;
})();