/* levels.js — V3.0 (200 LEVEL EXPANSION) */
(function () {
  const DISCIPLES = {
    WAR:    { id: "WAR",    name: "WAR",    attack: "drain"  }, 
    DECEIT: { id: "DECEIT", name: "DECEIT", attack: "deceit" },
    PLAGUE: { id: "PLAGUE", name: "PLAGUE", attack: "poison" }, 
    GREED:  { id: "GREED",  name: "GREED",  attack: "greed"  }
  };

  function L(id, name, desc, disciple, moves, hp, rate) {
    return { id, name, desc, disciple, moves, discipleMaxHP: hp, attackRate: rate };
  }

  // BOSS TEMPLATES (Hand-tuned for impact)
  const BOSS_NAMES = [
      "The Gatekeeper", "Titan of War", "Master of Lies", "Patient Zero", "Data Eater",
      "The Corruptor", "System Shock", "Null Pointer", "Stack Overflow", "The Glitch",
      "Logic Bomb", "Fatal Exception", "Memory Leak", "Infinite Loop", "Blue Screen",
      "Kernel Panic", "Rootkit", "Trojan Prime", "Worm Queen", "OMEGA ZERO"
  ];

  const FINAL_LEVELS = [];
  const ZONE_TYPES = [DISCIPLES.WAR, DISCIPLES.DECEIT, DISCIPLES.PLAGUE, DISCIPLES.GREED];

  for (let i = 1; i <= 200; i++) {
      // 1. DETERMINE ZONE & DISCIPLE
      // Zones are 10 levels long. 20 Zones total.
      // We loop through the 4 Disciple types every 40 levels.
      const zoneIndex = Math.floor((i - 1) / 10); // 0..19
      const discipleType = ZONE_TYPES[zoneIndex % 4];
      
      // 2. SCALING MATH
      // Base: 3500. 
      // Early Game (1-50): +450 per level.
      // Mid Game (51-100): +800 per level (Artifacts needed).
      // Late Game (101-200): +1500 per level (Optimized gear needed).
      
      let hp = 3500;
      if (i <= 50) {
          hp += (i - 1) * 450;
      } else if (i <= 100) {
          hp = 25550 + ((i - 50) * 800); // Start from ~26k
      } else {
          hp = 65550 + ((i - 100) * 1500); // Start from ~66k, ends at ~215k
      }

      // Boss Buff (Every 10th level)
      const isBoss = (i % 10 === 0);
      if (isBoss) hp = Math.floor(hp * 1.5); 

      // 3. GENERATE LEVEL
      const name = isBoss ? `BOSS: ${BOSS_NAMES[(i/10)-1]}` : `Sector ${i}`;
      const desc = isBoss ? "CRITICAL THREAT DETECTED." : "System intrusion in progress.";
      
      // Attack Rate: Harder levels = Faster attacks
      let rate = 3;
      if (i > 100) rate = 2; // Elite Mode

      FINAL_LEVELS.push(L(
          i, 
          name, 
          desc, 
          discipleType, 
          isBoss ? 40 : 30, // More moves for bosses
          hp, 
          rate
      ));
  }

  window.LEVELS = FINAL_LEVELS;
})();