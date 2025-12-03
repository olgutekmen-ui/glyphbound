/* levels.js — V1.11 (SMOOTHED PROGRESSION) */
(function () {
  // DISCIPLE HIERARCHY
  const DISCIPLES = {
    WAR:    { id: "WAR",    name: "WAR",    attack: "drain"  }, 
    DECEIT: { id: "DECEIT", name: "DECEIT", attack: "deceit" },
    PLAGUE: { id: "PLAGUE", name: "PLAGUE", attack: "poison" }, 
    GREED:  { id: "GREED",  name: "GREED",  attack: "greed"  }
  };

  function L(id, name, desc, disciple, moves, hp, rate) {
    return { id, name, desc, disciple, moves, discipleMaxHP: hp, attackRate: rate };
  }

  // KEY MILESTONES (Hand-Tuned Bosses)
  const KEY_LEVELS = {
      // ZONE 1: WAR (Tutorial / Warmup)
      // Buffed HP to prevent 3-move wins. 
      // Player does ~100 dmg/turn on average. 2000 HP = ~20 turns.
      1:  L(1,  "Neon Breach",      "Link init.",            DISCIPLES.WAR,    30, 2000, 3),
      10: L(10, "The General",      "BOSS: Titan of War.",   DISCIPLES.WAR,    35, 8000, 2),
      
      // ZONE 2: DECEIT (Tricky)
      11: L(11, "Mirror Maze",      "Illusions forming.",    DISCIPLES.DECEIT, 28, 9000, 3),
      20: L(20, "The Architect",    "BOSS: Master of Lies.", DISCIPLES.DECEIT, 40, 16000, 2),

      // ZONE 3: PLAGUE (The Wall - NERFED)
      // Previously ~35k HP. Now ~17k. Much more manageable.
      21: L(21, "Toxic Bloom",      "Infection spreading.",  DISCIPLES.PLAGUE, 26, 17000, 3),
      30: L(30, "Hive Queen",       "BOSS: Patient Zero.",   DISCIPLES.PLAGUE, 45, 24000, 2),

      // ZONE 4: GREED (High Difficulty)
      31: L(31, "Golden Cage",      "Avarice takes hold.",   DISCIPLES.GREED,  26, 25000, 3),
      40: L(40, "The Hoarder",      "BOSS: Data Eater.",     DISCIPLES.GREED,  50, 35000, 2),

      // ZONE 5: THE CORE (Nightmare)
      41: L(41, "The Descent",      "Reality breaking.",     DISCIPLES.WAR,    25, 38000, 2),
      50: L(50, "OMEGA",            "FINAL BOSS.",           DISCIPLES.GREED,  60, 60000, 2)
  };

  function getZoneDisciple(lvlId) {
      if (lvlId <= 10) return DISCIPLES.WAR;
      if (lvlId <= 20) return DISCIPLES.DECEIT;
      if (lvlId <= 30) return DISCIPLES.PLAGUE;
      if (lvlId <= 40) return DISCIPLES.GREED;
      return DISCIPLES.GREED;
  }

  // GENERATOR LOOP (Fills the gaps)
  const FINAL_LEVELS = [];
  for (let i = 1; i <= 50; i++) {
      if (KEY_LEVELS[i]) {
          FINAL_LEVELS.push(KEY_LEVELS[i]);
      } else {
          // MATH: LINEAR SCALING
          // Base 2000. +800 HP per level roughly.
          // Lvl 5 = ~5200. Lvl 15 = ~12000. Lvl 25 = ~20000.
          
          let base = 2000;
          let scaling = (i - 1) * 800; 
          let hp = base + scaling;
          
          // Slight bump for later zones
          if(i > 40) hp += 5000;

          FINAL_LEVELS.push(L(
              i, 
              `Sector ${i}`, 
              "System intrusion.", 
              getZoneDisciple(i), 
              28, // Standard moves (slightly generous)
              hp, 
              3   // Standard attack rate
          ));
      }
  }

  window.LEVELS = FINAL_LEVELS;
})();