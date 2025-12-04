/* quests.js — V2.1 (FIXED IMAGE EXTENSION) */
(function() {
    const LS_KEY = "nx_quest_data_v1";
    
    // DEFINITIONS
    const WEEKLY_CONFIG = [
        { day: 1, type: "win_level",     target: 1,  reward: 30,  rType: "prisma", desc: "Win 1 Sector" },
        { day: 2, type: "destroy_haz",   target: 20, reward: 1,   rType: "item_antidote", desc: "Destroy 20 Hazards" },
        { day: 3, type: "use_ulti",      target: 5,  reward: 40,  rType: "prisma", desc: "Use Hero Ultimates (x5)" },
        { day: 4, type: "combo_x3",      target: 3,  reward: 1,   rType: "item_hourglass", desc: "Score 3 Combos (x3+)" },
        { day: 5, type: "win_level",     target: 3,  reward: 50,  rType: "prisma", desc: "Win 3 Sectors" },
        { day: 6, type: "use_item",      target: 2,  reward: 60,  rType: "prisma", desc: "Use 2 Items" },
        { day: 7, type: "kill_boss",     target: 1,  reward: 5,   rType: "aurum",  desc: "Defeat a BOSS (Level 10, 20...)" }
    ];

    const Quests = {
        data: null,

        init() {
            this.load();
            this.checkDayRoll();
        },

        load() {
            const raw = localStorage.getItem(LS_KEY);
            if(raw) {
                try {
                    this.data = JSON.parse(raw);
                } catch(e) { this.reset(1); }
            } else {
                this.reset(1);
            }
        },

        save() {
            localStorage.setItem(LS_KEY, JSON.stringify(this.data));
        },

        reset(dayIndex) {
            this.data = {
                day: dayIndex, // 1-7
                progress: 0,
                claimed: false,
                lastDate: new Date().toDateString(),
                weekStart: Date.now()
            };
            this.save();
        },

        checkDayRoll() {
            const today = new Date().toDateString();
            if (this.data.lastDate !== today) {
                let nextDay = this.data.day + 1;
                if (nextDay > 7) nextDay = 1; // Loop week
                
                this.data.day = nextDay;
                this.data.progress = 0;
                this.data.claimed = false;
                this.data.lastDate = today;
                this.save();
            }
        },

        // --- HOOKS ---
        report(type, amount = 1) {
            if (this.data.claimed) return; 
            
            const q = WEEKLY_CONFIG[this.data.day - 1];
            if (!q) return;
            if (q.type !== type) return;

            if (type === 'kill_boss') {
                if (amount % 10 !== 0) return;
                amount = 1;
            }

            this.data.progress += amount;
            this.save();

            if (window.UI && UI.flashAlert) {
                if (this.data.progress < q.target) {
                    UI.flashAlert(`QUEST: ${this.data.progress}/${q.target}`);
                } else {
                    UI.flashAlert(`QUEST COMPLETE! CLAIM REWARD!`);
                }
            }
        },

        // --- REWARDS ---
        claim() {
            if (this.data.claimed) return alert("Already claimed today.");
            const q = WEEKLY_CONFIG[this.data.day - 1];
            if (this.data.progress < q.target) return alert("Quest not finished.");

            this.data.claimed = true;
            this.save();

            if (window.economy) {
                if (q.rType === 'prisma') economy.addPrisma(q.reward);
                if (q.rType === 'aurum') economy.addAurum(q.reward);
                if (q.rType.startsWith('item_')) {
                    const item = q.rType.replace('item_', ''); 
                    economy.addItem(item, q.reward);
                }
                
                if(window.UI) {
                    if(UI.updatePrismaUI) UI.updatePrismaUI();
                    if(UI.updateItemCounts) UI.updateItemCounts();
                }
            }

            alert(`REWARD CLAIMED: +${q.reward} ${q.rType.toUpperCase()}`);
            this.renderModal(); 
            
            // Hide Map Badge if open
            const badge = document.getElementById("quest-badge");
            if(badge) badge.style.display = "none";
        },

        // --- UI ---
        openLog() {
            let el = document.getElementById("quest-modal");
            if (!el) {
                el = document.createElement("div");
                el.id = "quest-modal";
                // Fixed/Overlay style
                el.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(2, 6, 23, 0.95); z-index: 11000; 
                    display: flex; flex-direction: column; align-items: center; justify-content: center; 
                    backdrop-filter: blur(8px); animation: fadeIn 0.2s ease-out;
                `;
                document.body.appendChild(el);
            }
            el.style.display = "flex";
            this.renderModal();
        },

        renderModal() {
            const el = document.getElementById("quest-modal");
            if(!el) return;
            
            const q = WEEKLY_CONFIG[this.data.day - 1];
            const isDone = this.data.progress >= q.target;
            const isClaimed = this.data.claimed;
            
            // BUTTON LOGIC
            let btnState = "";
            if (isClaimed) btnState = `<button disabled style="background:#1e293b; color:#94a3b8; border:1px solid #334155; padding:12px 40px; border-radius:8px; font-weight:bold; letter-spacing:1px;">ARTIFACT SECURED</button>`;
            else if (isDone) btnState = `<button onclick="Quests.claim()" style="background:linear-gradient(135deg, #22c55e, #16a34a); color:#fff; border:none; padding:12px 40px; border-radius:8px; font-weight:900; letter-spacing:1px; cursor:pointer; box-shadow:0 0 20px rgba(34, 197, 94, 0.6); transform:scale(1.05);">CLAIM REWARD</button>`;
            else btnState = `<button disabled style="background:#334155; color:#94a3b8; border:1px solid #475569; padding:12px 40px; border-radius:8px; font-weight:bold;">IN PROGRESS</button>`;

            // PROGRESS STRIP GENERATION
            let stripHTML = `<div style="display:flex; gap:8px; margin-bottom:20px; justify-content:center;">`;
            WEEKLY_CONFIG.forEach(wk => {
                const active = wk.day === this.data.day;
                const past = wk.day < this.data.day;
                
                let imgStyle = "width:40px; height:40px; border-radius:6px; object-fit:cover; transition:all 0.2s;";
                let borderStyle = "2px solid #1e293b";
                
                if (active) {
                    // Active Day: Gold Border, Full Brightness
                    imgStyle += " filter: none; transform: scale(1.1); box-shadow: 0 0 10px #facc15;";
                    borderStyle = "2px solid #facc15";
                } else if (past) {
                    // Past: Dimmed, Blue Border
                    imgStyle += " filter: grayscale(0.5) brightness(0.6);";
                    borderStyle = "2px solid #38bdf8";
                } else {
                    // Future: Very Dim, Grayscale
                    imgStyle += " filter: grayscale(1) brightness(0.3);";
                    borderStyle = "2px solid #334155";
                }

                // FIXED: Changed extension to .png
                stripHTML += `<div style="border:${borderStyle}; border-radius:8px; overflow:hidden; padding:2px; background:#020617;">
                                <img src="assets/quest${wk.day}.png" style="${imgStyle}" onerror="this.style.backgroundColor='#333'">
                              </div>`;
            });
            stripHTML += `</div>`;

            // HERO IMAGE (Current Quest) - FIXED: Changed to .png
            const currentImg = `assets/quest${q.day}.png`;

            el.innerHTML = `
                <div style="
                    background: linear-gradient(145deg, #0f172a, #020617); 
                    padding: 2rem; border-radius: 16px; 
                    border: 1px solid #38bdf8; 
                    text-align: center; 
                    max-width: 90%; width: 400px; 
                    box-shadow: 0 0 40px rgba(14,165,233,0.15);
                    position: relative;
                ">
                    <h2 style="margin:0 0 15px 0; color:#fff; letter-spacing:3px; text-shadow:0 0 10px #38bdf8;">ARCHIVE LINK</h2>
                    
                    ${stripHTML}
                    
                    <div style="margin-bottom:20px; position:relative;">
                        <div style="font-size:0.8rem; color:#94a3b8; letter-spacing:2px; text-transform:uppercase; margin-bottom:10px;">
                            Day ${q.day} Protocol
                        </div>
                        
                        <div style="
                            width: 140px; height: 140px; margin: 0 auto 15px auto; 
                            border-radius: 12px; overflow: hidden; 
                            border: 2px solid #facc15; 
                            box-shadow: 0 0 25px rgba(250, 204, 21, 0.2);
                            background: #000;
                        ">
                            <img src="${currentImg}" style="width:100%; height:100%; object-fit:cover;" onerror="this.parentNode.style.backgroundColor='#333'; this.style.display='none'">
                        </div>

                        <div style="font-size:1.3rem; color:#fff; font-weight:800; margin-bottom:5px;">${q.desc}</div>
                        
                        <div style="font-size:2.5rem; margin:10px 0; color:#facc15; font-family:monospace; font-weight:bold; text-shadow:0 0 15px rgba(250, 204, 21, 0.3);">
                            ${Math.min(this.data.progress, q.target)}<span style="font-size:1.5rem; color:#64748b;">/${q.target}</span>
                        </div>
                        
                        <div style="
                            background: rgba(255,255,255,0.05); 
                            padding: 10px; border-radius: 8px; 
                            margin-bottom: 20px; border: 1px solid #334155;
                            display: flex; justify-content: center; align-items: center; gap: 10px;
                        ">
                            <span style="font-size:0.8rem; color:#94a3b8; text-transform:uppercase;">Reward:</span>
                            <span style="font-size:1.1rem; color:#fff; font-weight:bold; color:#38bdf8;">+${q.reward} ${q.rType.toUpperCase().replace('ITEM_','')}</span>
                        </div>
                    </div>
                    
                    ${btnState}
                    
                    <div style="
                        position: absolute; top: 15px; right: 15px; 
                        color: #64748b; font-size: 1.5rem; cursor: pointer; 
                        line-height: 1; transition: color 0.2s;
                    " onclick="document.getElementById('quest-modal').style.display='none'">&times;</div>
                </div>
            `;
        }
    };

    window.Quests = Quests;
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => Quests.init());
    } else {
        Quests.init();
    }
})();