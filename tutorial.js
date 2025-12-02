/* tutorial.js — RELIABLE LOADING */
(function() {
    const LS_KEY = "nx_tutorial_seen";

    function showTutorial() {
        // Double check we are in game
        if (!document.getElementById("game-grid")) return;

        // If you want to force test it, run localStorage.removeItem('nx_tutorial_seen') in console
        if (localStorage.getItem(LS_KEY)) {
            console.log("Tutorial already seen. Skipping.");
            return;
        }
        
        const GS = window.gameState || window.GameState;
        if(GS) GS.isProcessing = true; // Pause game input

        const overlay = document.createElement("div");
        overlay.id = "tutorial-overlay";
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(2, 6, 23, 0.95); z-index: 9999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            color: #fff; text-align: center; padding: 2rem;
            backdrop-filter: blur(10px);
            animation: fadeIn 0.5s ease;
        `;

        const html = `
            <h2 style="color:#0ea5e9; font-size:1.8rem; margin-bottom:1rem; text-shadow:0 0 10px #0ea5e9;">SYSTEM LINK ESTABLISHED</h2>
            <div style="max-width:400px; line-height:1.6; color:#cbd5e1; margin-bottom:2rem; text-align: left;">
                <p><strong>1. MATCH GLYPHS:</strong> Swap tiles to damage the DISCIPLE.</p>
                <p><strong>2. HERO SKILLS:</strong> Matches charge the rings below. Tap them to unleash attacks!</p>
                <p><strong>3. HAZARDS:</strong> Clear tiles adjacent to Poison/Lava to stop the spread.</p>
            </div>
            <button id="tut-btn" style="
                background: linear-gradient(135deg, #0ea5e9, #2563eb); border: none;
                color: white; padding: 1rem 2rem; font-weight: bold; font-size: 1rem;
                border-radius: 8px; cursor: pointer; box-shadow: 0 0 15px rgba(14,165,233,0.5);
                text-transform: uppercase; letter-spacing: 2px;
            ">INITIATE COMBAT</button>
        `;

        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        document.getElementById("tut-btn").onclick = () => {
            overlay.style.opacity = "0";
            overlay.style.transition = "opacity 0.3s";
            setTimeout(() => overlay.remove(), 300);
            
            localStorage.setItem(LS_KEY, "true");
            if(GS) GS.isProcessing = false;
        };
    }

    // Try to load when script runs
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => setTimeout(showTutorial, 1000));
    } else {
        setTimeout(showTutorial, 1000);
    }
    
    // EXPORT FUNCTION FOR MANUAL TRIGGER (e.g. Help Button)
    window.resetTutorial = function() {
        localStorage.removeItem(LS_KEY);
        showTutorial();
    };
})();