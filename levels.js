/* levels.js — FINAL (BALANCED FOR MOVE COST) */
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

  const BOSS_NAMES = [
      "The Gatekeeper", "Titan of War", "Master of Lies", "Patient Zero", "Data Eater",
      "The Corruptor", "System Shock", "Null Pointer", "Stack Overflow", "The Glitch",
      "Logic Bomb", "Fatal Exception", "Memory Leak", "Infinite Loop", "Blue Screen",
      "Kernel Panic", "Rootkit", "Trojan Prime", "Worm Queen", "OMEGA ZERO"
  ];

  const FINAL_LEVELS = [];
  const ZONE_TYPES = [DISCIPLES.WAR, DISCIPLES.DECEIT, DISCIPLES.PLAGUE, DISCIPLES.GREED];

  for (let i = 1; i <= 200; i++) {
      const zoneIndex = Math.floor((i - 1) / 10);
      const discipleType = ZONE_TYPES[zoneIndex % 4];
      
      // HP SCALING: SOFT START, HARD RAMP
      let hp = 3000; 
      
      if (i <= 20) {
          hp += (i - 1) * 750; 
      } else if (i <= 50) {
          hp = 17250 + ((i - 20) * 1500);
      } else if (i <= 100) {
          hp = 62250 + ((i - 50) * 3000);
      } else {
          hp = 212250 + ((i - 100) * 5000);
      }

      const isBoss = (i % 10 === 0);
      let moveLimit = 22; // Tight but fair
      let rate = 3;

      if (isBoss) {
          // BOSS: 2.2x HP (Mathematical Limit)
          hp = Math.floor(hp * 2.2); 
          moveLimit = 30; // Extra moves for the boss fight
          rate = 2;
      }

      FINAL_LEVELS.push(L(
          i, isBoss ? `BOSS: ${BOSS_NAMES[(i/10)-1]}` : `Sector ${i}`, 
          "System Intrusion", discipleType, 
          moveLimit, hp, rate
      ));
  }

  window.LEVELS = FINAL_LEVELS;
})();