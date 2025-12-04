/* levels.js — V2.0 (BALANCED PROGRESSION) */
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
      // Base HP buffed to 3500 to ensure mechanics are learned.
      1:  L(1,  "Neon Breach",      "Link init.",            DISCIPLES.WAR,    30, 3500, 3),
      10: L(10, "The General",      "BOSS: Titan of War.",   DISCIPLES.WAR,    35, 9500, 2),
      
      // ZONE 2: DECEIT (Tricky)
      11: L(11, "Mirror Maze",      "Illusions forming.",    DISCIPLES.DECEIT, 28, 11000, 3),
      20: L(20, "The Architect",    "BOSS: Master of Lies.", DISCIPLES.DECEIT, 40, 18500, 2),

      // ZONE 3: PLAGUE (The Infection)
      21: L(21, "Toxic Bloom",      "Infection spreading.",  DISCIPLES.PLAGUE, 26, 19000, 3),
      30: L(30, "Hive Queen",       "BOSS: Patient Zero.",   DISCIPLES.PLAGUE, 45, 28000, 2),

      // ZONE 4: GREED (High Difficulty)
      31: L(31, "Golden Cage",      "Avarice takes hold.",   DISCIPLES.GREED,  26, 29000, 3),
      40: L(40, "The Hoarder",      "BOSS: Data Eater.",     DISCIPLES.GREED,  50, 42000, 2),

      // ZONE 5: THE CORE (Nightmare)
      41: L(41, "The Descent",      "Reality breaking.",     DISCIPLES.WAR,    25, 45000, 2),
      50: L(50, "OMEGA",            "FINAL BOSS.",           DISCIPLES.GREED,  60, 65000, 2) 
      // Note: OMEGA HP increased slightly because Player base DMG is doubled now.
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
          // MATH: NEW SCALING CURVE
          // Base 3500 (Harder Start). +450 HP per level (Smoother curve).
          // Previous curve was +800, which made mid-game impossible.
          
          let base = 3500;
          let scaling = (i - 1) * 450; 
          let hp = base + scaling;
          
          FINAL_LEVELS.push(L(
              i, 
              `Sector ${i}`, 
              "System intrusion.", 
              getZoneDisciple(i), 
              28, 
              hp, 
              3
          ));
      }
  }

  window.LEVELS = FINAL_LEVELS;
})();