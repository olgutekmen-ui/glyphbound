/* items.js — V1.2 (QUEST HOOKS) */
(function() {
    const Items = {
        
        useBomb() {
            if (!window.economy || !economy.useItem('bomb')) return;
            
            // --- QUEST HOOK ---
            if(window.Quests) Quests.report('use_item');
            // ------------------

            const N = window.GRID_SIZE || 9;
            const candidates = [];
            const hazards = [];
            
            for(let r=0; r<N; r++) {
                for(let c=0; c<N; c++) {
                    const cell = window.gameState.board[r][c];
                    if(cell) {
                        candidates.push({r,c});
                        if(window.isHazard(cell)) hazards.push({r,c});
                    }
                }
            }
            
            let targets = [];
            while(targets.length < 3 && hazards.length > 0) {
                const idx = Math.floor(Math.random() * hazards.length);
                targets.push(hazards[idx]);
                hazards.splice(idx, 1);
            }
            while(targets.length < 5 && candidates.length > 0) {
                const idx = Math.floor(Math.random() * candidates.length);
                targets.push(candidates[idx]);
                candidates.splice(idx, 1);
            }
            
            targets.forEach(p => window.gameState.board[p.r][p.c] = null);
            
            if(window.FX) FX.shake(2);
            if(window.AudioSys) AudioSys.play('cast');
            if(window.Board) window.Board.processBoardUntilStable();
            if(window.UI) UI.updateItemCounts();
        },

        useHourglass() {
            if (!window.economy || !economy.useItem('hourglass')) return;
            
            // --- QUEST HOOK ---
            if(window.Quests) Quests.report('use_item');
            // ------------------

            window.gameState.movesLeft += 5;
            if(window.UI) {
                UI.updateStats();
                UI.updateItemCounts();
                UI.flashAlert("+5 MOVES!", 1000);
            }
            if(window.AudioSys) AudioSys.play('match');
        },

        useAntidote() {
            if (!window.economy || !economy.useItem('antidote')) return;
            
            // --- QUEST HOOK ---
            if(window.Quests) Quests.report('use_item');
            // ------------------

            const N = window.GRID_SIZE || 9;
            let count = 0;
            for(let r=0; r<N; r++) {
                for(let c=0; c<N; c++) {
                    if(window.isPoison(window.gameState.board[r][c])) {
                        window.gameState.board[r][c] = null; 
                        count++;
                    }
                }
            }
            
            if(count > 0) {
                // --- QUEST HOOK (Hazard destroy by item) ---
                if(window.Quests) Quests.report('destroy_haz', count);
                // -------------------------------------------

                if(window.Board) window.Board.processBoardUntilStable();
                if(window.UI) UI.flashAlert("POISON CLEARED!", 1000);
                if(window.AudioSys) AudioSys.play('cast');
            } else {
                if(window.UI) UI.flashAlert("NO POISON FOUND", 1000);
            }
            if(window.UI) UI.updateItemCounts();
        }
    };

    window.Items = Items;
})();