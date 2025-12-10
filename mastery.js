/* mastery.js — JINRI'S LOGIC TRIAL */
(function() {
    const STATE = {
        activeTrial: null,
        sequence: [],
        playerInput: [],
        round: 1,
        maxRounds: 5,
        canInput: false
    };

    // --- HUB LOGIC ---
    window.startTrial = function(id) {
        if(id === 'jinri') {
            document.getElementById('mastery-hub').style.display = 'none';
            document.getElementById('trial-jinri').style.display = 'flex';
            initJinriTrial();
        }
    };

    // --- JINRI: MEMORY MATRIX ---
    function initJinriTrial() {
        const grid = document.getElementById('memory-grid');
        grid.innerHTML = '';
        
        // Create 3x3 Grid (Indices 0-8)
        for(let i=0; i<9; i++) {
            const cell = document.createElement('div');
            cell.className = 'mem-cell';
            cell.id = `mem-${i}`;
            cell.onclick = () => handleJinriInput(i);
            grid.appendChild(cell);
        }
        
        STATE.round = 1;
        STATE.sequence = [];
        setTimeout(nextRound, 1000);
    }

    async function nextRound() {
        STATE.canInput = false;
        STATE.playerInput = [];
        document.getElementById('round-num').innerText = STATE.round;
        setDialogue(`"Focus. Pattern length: ${STATE.round + 2}."`);
        
        // Add new step to sequence
        const nextStep = Math.floor(Math.random() * 9);
        STATE.sequence.push(nextStep);
        
        // Play Sequence
        await new Promise(r => setTimeout(r, 800));
        
        for (const idx of STATE.sequence) {
            flashCell(idx, 'mem-active');
            // Play sound if AudioSys exists
            // if(window.AudioSys) AudioSys.play('swap');
            await new Promise(r => setTimeout(r, 600)); // Gap between flashes
        }
        
        setDialogue(`"Your turn."`);
        STATE.canInput = true;
    }

    function handleJinriInput(idx) {
        if(!STATE.canInput) return;
        
        // Visual Feedback
        flashCell(idx, 'mem-active', 150);
        
        // Check Logic
        const currentStep = STATE.playerInput.length;
        if (idx === STATE.sequence[currentStep]) {
            // Correct
            STATE.playerInput.push(idx);
            
            // Check if round complete
            if (STATE.playerInput.length === STATE.sequence.length) {
                if (STATE.round >= STATE.maxRounds) {
                    victory("Logic Validated.");
                } else {
                    STATE.round++;
                    setTimeout(nextRound, 1000);
                }
            }
        } else {
            // Wrong
            flashCell(idx, 'mem-wrong', 300);
            setDialogue(`"Error detected. Resetting."`);
            STATE.canInput = false;
            setTimeout(() => {
                window.location.reload(); // Hard fail for now
            }, 1000);
        }
    }

    // --- HELPERS ---
    function flashCell(idx, cls, time=300) {
        const el = document.getElementById(`mem-${idx}`);
        if(el) {
            el.classList.add(cls);
            setTimeout(() => el.classList.remove(cls), time);
        }
    }

    function setDialogue(text) {
        const el = document.getElementById('jinri-msg');
        if(el) el.innerText = text;
    }

    function victory(msg) {
        const overlay = document.getElementById('mastery-overlay');
        const title = document.getElementById('m-title');
        const reward = document.getElementById('m-reward');
        
        title.innerText = "TRIAL CLEARED";
        reward.innerHTML = `
            <div style="font-size:3rem; margin:10px 0;">💠</div>
            <p>"${msg}"</p>
            <p style="color:#fbbf24; font-weight:bold;">REWARD: 100 PRISMA + 5 AURUM</p>
        `;
        
        // Grant Rewards
        if(window.economy) {
            economy.addPrisma(100);
            economy.addAurum(5);
        }
        
        overlay.style.display = 'flex';
    }

})();