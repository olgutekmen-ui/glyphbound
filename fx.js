/* fx.js — FINAL: PARTICLES, SHAKE, COMBO */
(function() {
    const FX = {
        COLORS: ['#38bdf8', '#22d3ee', '#f472b6', '#4ade80'],
        
        init() { }, 

        // --- COMBO VISUAL (RESTORED) ---
        showCombo(count) {
            console.log(`COMBO x${count}!`); // Debug
            
            const existing = document.getElementById("active-combo-text");
            if(existing) existing.remove();

            if (count < 2) return;

            const el = document.createElement("div");
            el.id = "active-combo-text";
            el.className = "combo-text";
            el.innerText = `COMBO x${count}!`;
            
            document.body.appendChild(el);

            setTimeout(() => {
                if (document.body.contains(el)) el.remove();
            }, 1200);
        },

        shake(intensity = 1) {
            const root = document.getElementById("game-root");
            if (!root) return;
            root.classList.remove("shake-small", "shake-big");
            void root.offsetWidth;
            const cls = intensity > 1 ? "shake-big" : "shake-small";
            root.classList.add(cls);
            setTimeout(() => root.classList.remove(cls), 500);
        },

        showDamage(amount, isCrit = false) {
            const hud = document.getElementById("disciple-hp-area");
            if (!hud) return;
            
            const el = document.createElement("div");
            el.className = "float-dmg";
            el.textContent = `-${amount}`;
            if (isCrit) {
                el.style.color = "#f472b6"; 
                el.style.fontSize = "1.5rem";
                el.textContent += "!";
            }
            
            const rect = hud.getBoundingClientRect();
            const randX = (Math.random() * 40) - 20;
            el.style.left = (rect.left + rect.width/2 + randX) + "px";
            el.style.top = rect.top + "px";
            
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 1000);
        },

        explode(r, c, typeIndex) {
            const cellId = `cell-${r}-${c}`;
            const cell = document.getElementById(cellId);
            if (!cell) return;

            const rect = cell.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const color = this.COLORS[typeIndex] || '#ffffff';

            for (let i = 0; i < 6; i++) {
                this.createParticle(centerX, centerY, color);
            }
        },

        createParticle(x, y, color) {
            const p = document.createElement("div");
            p.className = "fx-particle";
            p.style.backgroundColor = color;
            p.style.left = x + "px";
            p.style.top = y + "px";
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 60 + 20; 
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            p.style.setProperty('--tx', `${tx}px`);
            p.style.setProperty('--ty', `${ty}px`);
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 600);
        }
    };
    window.FX = FX;
})();