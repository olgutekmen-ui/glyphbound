/* levels.js — V1.5 (HIERARCHY REBALANCE) */
(function () {
  // DISCIPLE HIERARCHY (Low to High Strength):
  // 1. WAR (Weakest) -> 2. DECEIT -> 3. PLAGUE -> 4. GREED (Strongest)
  
  const DISCIPLES = {
    WAR:    { id: "WAR",    name: "WAR",    attack: "drain"  }, 
    DECEIT: { id: "DECEIT", name: "DECEIT", attack: "deceit" },
    PLAGUE: { id: "PLAGUE", name: "PLAGUE", attack: "poison" }, 
    GREED:  { id: "GREED",  name: "GREED",  attack: "greed"  }
  };

  function L(id, name, desc, disciple, moves, hp, rate) {
    return { id, name, desc, disciple, moves, discipleMaxHP: hp, attackRate: rate };
  }

  // Key Milestones
  const KEY_LEVELS = {
      // ZONE 1: WAR (The Grunt)
      1:  L(1,  "Frontline",        "War begins.",           DISCIPLES.WAR,    25, 5000, 3),
      10: L(10, "The General",      "BOSS: Titan of War.",   DISCIPLES.WAR,    35, 15000, 2),
      
      // ZONE 2: DECEIT (The Trickster)
      11: L(11, "Mirror Maze",      "Illusions forming.",    DISCIPLES.DECEIT, 26, 18000, 3),
      20: L(20, "The Architect",    "BOSS: Master of Lies.", DISCIPLES.DECEIT, 40, 30000, 2),

      // ZONE 3: PLAGUE (The Corruptor)
      21: L(21, "Toxic Bloom",      "Infection spreading.",  DISCIPLES.PLAGUE, 26, 35000, 3),
      30: L(30, "Hive Queen",       "BOSS: Patient Zero.",   DISCIPLES.PLAGUE, 40, 55000, 2),

      // ZONE 4: GREED (The Tyrant)
      31: L(31, "Golden Cage",      "Avarice takes hold.",   DISCIPLES.GREED,  26, 60000, 3),
      40: L(40, "The Hoarder",      "BOSS: Data Eater.",     DISCIPLES.GREED,  45, 85000, 2),

      // ZONE 5: THE CORE (All Out War)
      41: L(41, "The Descent",      "Reality breaking.",     DISCIPLES.WAR,    25, 90000, 2),
      50: L(50, "OMEGA",            "FINAL BOSS.",           DISCIPLES.GREED,  50, 150000, 2)
  };

  function getZoneDisciple(lvlId) {
      if (lvlId <= 10) return DISCIPLES.WAR;    // Zone 1
      if (lvlId <= 20) return DISCIPLES.DECEIT; // Zone 2
      if (lvlId <= 30) return DISCIPLES.PLAGUE; // Zone 3
      if (lvlId <= 40) return DISCIPLES.GREED;  // Zone 4
      return DISCIPLES.GREED;                   // Zone 5
  }

  // Generator Loop
  const FINAL_LEVELS = [];
  for (let i = 1; i <= 50; i++) {
      if (KEY_LEVELS[i]) {
          FINAL_LEVELS.push(KEY_LEVELS[i]);
      } else {
          // HP Scaling: Base + Linear Increase
          let hp = 5000 + ((i - 1) * 2500);
          if(i > 20) hp += 10000; 
          if(i > 40) hp += 20000;
          
          FINAL_LEVELS.push(L(i, `Sector ${i}`, "System intrusion.", getZoneDisciple(i), 25, hp, 3));
      }
  }

  window.LEVELS = FINAL_LEVELS;
})();