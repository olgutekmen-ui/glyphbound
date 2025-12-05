/* levels.js — V6.1 (MID-GAME RELIEF) */
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
      
      // HP SCALING
      let hp = 4500;
      
      if (i <= 20) {
          // Lvl 1-20: +750 per level (Hard early game kept intact)
          hp += (i - 1) * 750; 
      } else if (i <= 50) {
          // RELIEF VALVE: Reduced from 1500 to 1100
          hp = 18750 + ((i - 20) * 1100);
      } else if (i <= 100) {
          hp = 51750 + ((i - 50) * 2000);
      } else {
          hp = 151750 + ((i - 100) * 3500);
      }

      const isBoss = (i % 10 === 0);
      let moveLimit = 20; 
      let rate = 3;

      if (isBoss) {
          // BOSS MULTIPLIER: 2.2x (Was 3.0x - Too Hard)
          hp = Math.floor(hp * 2.2); 
          moveLimit = 30; // 30 Moves for Bosses (Was 25 - Too Tight)
          rate = 2; 
      }

      if (i > 50 && !isBoss) rate = 2; 

      const name = isBoss ? `BOSS: ${BOSS_NAMES[(i/10)-1]}` : `Sector ${i}`;
      
      FINAL_LEVELS.push(L(
          i, name, "System Intrusion", discipleType, 
          moveLimit, 
          hp, rate
      ));
  }

  window.LEVELS = FINAL_LEVELS;
})();