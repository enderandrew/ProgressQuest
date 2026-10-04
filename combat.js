// Combat resolution for Progress Quest Remix.
//
// Everything here is a pure function: no DOM, no game state, no use of the
// game's main random number generator. ResolveCombat() takes a snapshot of
// the hero, a description of the foe and a seed, and returns the whole fight.
// The same three inputs always give the same fight, so a server can replay
// and verify a character's history from its saves.
//
// Depends on config.js (K, Alea).

// Tuning knobs. Monster strength is measured against what a typical
// character has at the monster's level (ExpectedStat/ExpectedPool), so these
// stay meaningful from level 1 to level 60+.
K.Combat = {
  MaxRounds: 25,

  // Monster hit points, as a fraction of ExpectedPool(monster level)
  MonsterHP: 0.5,
  // Hero hits a same-level monster with average STR/gear this many times to
  // kill it; spells hit harder
  MeleeHitsToKill: 4,
  SpellHitsToKill: 2.5,
  // A same-level monster hits an average hero this many times to kill him
  MonsterHitsToKill: 13,

  // How hard a stat ratio pushes damage (damage *= ratio ^ exponent)
  DamageExponent: 0.7,
  DefenseExponent: 0.6,

  // Hit chance = base + slope * log2(attacker DEX / defender DEX)
  HeroHitBase: 0.78, MonsterHitBase: 0.62, HitSlope: 0.22,
  HitMin: 0.2, HitMax: 0.97,

  // Share of monster attacks that are magic: dodged with WIS, not DEX, and
  // softened by WIS instead of CON
  MonsterMagicChance: 0.3,

  // Gear: each level of weapon power above the monster's level adds this
  // much damage; each level of armor power above it removes this much
  WeaponPerLevel: 0.04, ArmorPerLevel: 0.025,

  // Spells (Prompt 4 makes these richer)
  CastChanceMartial: 0.15, CastChanceArcane: 0.6,
  SpellCost: 0.05,            // of ExpectedPool(monster level), before level
  SpellSuccessBase: 0.6, SpellSuccessSlope: 0.2,
  SpellLevelBonus: 0.05,      // +5% damage and cost per spell level

  // CHA: once a monster is below half health, each round it may give up
  GiveUpBase: 0.05, GiveUpMax: 0.3,

  // DEX: a hero below FleeAtHP of his health, facing a monster above
  // FleeIfFoeAbove of its health, tries to run
  FleeAtHP: 0.25, FleeIfFoeAbove: 0.4, FleeBase: 0.35,

  // A win that costs more than this share of max HP is a close win
  CloseWin: 0.25,
  // Share of a fight's XP earned by running away or losing
  LossXP: 0.25,

  // Between fights: HP and MP regained, as a share of max, scaled by
  // CON (HP) and WIS (MP) against what is typical for the hero's level
  RegenHP: 0.08, RegenMP: 0.08, RegenMax: 0.25,
  // The hero stops to rest when HP falls below this share of max
  RestBelow: 0.35
};

// What a typical character's core stat is at a given level (fitted to
// simulated characters: linear early, then driven up by quest rewards).
function ExpectedStat(level) {
  level = Math.max(1, level);
  return 9.5 + 0.45 * level + 0.133 * Math.pow(1.15, level);
}

// What a typical character's HP Max / MP Max is at a given level.
var _poolCache = [0, 5.5];
function ExpectedPool(level) {
  level = Math.max(1, Math.floor(level));
  for (var l = _poolCache.length; l <= level; ++l)
    _poolCache[l] = _poolCache[l - 1] + ExpectedStat(l) / 2.8 + 2.5;
  return _poolCache[level];
}

// Power of a piece of gear from its name: base item level plus its
// adjectives plus any leading +N/-N. Comes out near the character's level
// when it was bought. 0 for empty slots and unknown items.
// (Prompt 5 replaces this with numbers stored on the item.)
function GearPower(name, bases, good, bad) {
  name = (name || "").trim();
  if (!name) return 0;
  var power = 0;
  var m = name.match(/^([+-]\d+) (.*)$/);
  if (m) {
    power += parseInt(m[1], 10);
    name = m[2];
  }
  var mods = good.concat(bad);
  for (var again = true; again;) {
    again = false;
    for (var i = 0; i < mods.length; ++i) {
      var mod = mods[i].split("|");
      if (name.indexOf(mod[0] + " ") === 0) {
        power += parseInt(mod[1], 10);
        name = name.substr(mod[0].length + 1);
        again = true;
        break;
      }
    }
  }
  for (var j = 0; j < bases.length; ++j) {
    var base = bases[j].split("|");
    if (base[0] === name) return power + parseInt(base[1], 10);
  }
  return power;
}

function WeaponPower(equips) {
  return GearPower(equips.Weapon, K.Weapons, K.OffenseAttrib, K.OffenseBad);
}

// Average power over the shield and armor slots.
function ArmorPower(equips) {
  var total = 0, n = 0;
  $.each(K.Equips, function (i, slot) {
    if (slot === "Weapon") return;
    total += GearPower(equips[slot], slot === "Shield" ? K.Shields : K.Armors,
                       K.DefenseAttrib, K.DefenseBad);
    ++n;
  });
  return n ? total / n : 0;
}

function Show(dmg) { return Math.max(1, Math.round(dmg)); }

function _clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
function _log2(x) { return Math.log(x) / Math.LN2; }

// Resolve one fight.
//
// hero: { name, level, STR, CON, DEX, INT, WIS, CHA, hp, hpMax, mp, mpMax,
//         weapon, armor,        (gear power, see WeaponPower/ArmorPower)
//         physicality,          (0..1, from AttributeProfile)
//         spells: [{name, level}] }
// foe:  { name, level, qty }    (level is per monster; qty fight together)
// seed: anything; the same seed replays the same fight
//
// Returns { outcome, rounds, hpLost, mpSpent, foeFled, log }
//   outcome: "win" (clean), "close" (won, but hurt), "flee" (hero ran, or
//            the fight dragged on until both sides gave up), "defeat"
function ResolveCombat(hero, foe, seed) {
  var C = K.Combat;
  var rng = new Alea("combat", seed);
  var roll = function () { return rng(); };
  var between = function (lo, hi) { return lo + (hi - lo) * rng(); };

  var qty = Math.max(1, foe.qty || 1);
  var L = Math.max(1, foe.level);
  var E = ExpectedStat(L);
  var P = ExpectedPool(L);

  // The monster: typical stats for its level, give or take
  var mon = {};
  $.each(K.PrimeStats, function (i, s) { mon[s] = E * between(0.85, 1.15); });
  var perHP = Math.max(1, P * C.MonsterHP * between(0.85, 1.15));
  var monHP = perHP * qty;
  var monMax = monHP;

  var hp = hero.hp, mp = hero.mp;
  var log = [];
  var ratio = function (a, b) { return Math.max(a, 1) / Math.max(b, 1); };
  var weaponF = _clamp(1 + C.WeaponPerLevel * ((hero.weapon || 0) - L), 0.6, 1.6);
  var armorF = _clamp(1 - C.ArmorPerLevel * ((hero.armor || 0) - L), 0.6, 1.4);
  var castChance = C.CastChanceArcane +
    (C.CastChanceMartial - C.CastChanceArcane) * (hero.physicality === undefined ? 0.5 : hero.physicality);
  var spells = hero.spells || [];
  var name = foe.name || "the foe";

  function heroTurn() {
    // Spell?
    if (spells.length && roll() < castChance) {
      var spell = spells[Math.floor(roll() * spells.length)];
      var cost = Math.max(1, Math.round(P * C.SpellCost * (1 + C.SpellLevelBonus * spell.level)));
      if (mp >= cost) {
        mp -= cost;
        var ok = _clamp(C.SpellSuccessBase + C.SpellSuccessSlope * _log2(ratio(hero.WIS, mon.WIS)),
                        C.HitMin, C.HitMax);
        if (roll() < ok) {
          var sdmg = perHP / C.SpellHitsToKill *
            Math.pow(ratio(hero.INT, mon.INT), C.DamageExponent) *
            (1 + C.SpellLevelBonus * spell.level) * between(0.8, 1.2);
          monHP -= sdmg;
          log.push("You cast " + spell.name + " for " + Show(sdmg));
        } else {
          log.push("Your " + spell.name + " fizzles");
        }
        return;
      }
    }
    // Melee
    var hit = _clamp(C.HeroHitBase + C.HitSlope * _log2(ratio(hero.DEX, mon.DEX)), C.HitMin, C.HitMax);
    if (roll() < hit) {
      var dmg = perHP / C.MeleeHitsToKill *
        Math.pow(ratio(hero.STR, mon.STR), C.DamageExponent) * weaponF * between(0.8, 1.2);
      monHP -= dmg;
      log.push("You hit for " + Show(dmg));
    } else {
      log.push("You miss");
    }
  }

  function foeTurn() {
    var alive = Math.max(1, Math.ceil(monHP / perHP));
    for (var a = 0; a < alive && hp > 0; ++a) {
      var magic = roll() < C.MonsterMagicChance;
      var dodge = magic ? hero.WIS : hero.DEX;
      var resist = magic ? hero.WIS : hero.CON;
      var hit = _clamp(C.MonsterHitBase + C.HitSlope * _log2(ratio(magic ? mon.INT : mon.DEX, dodge)),
                       C.HitMin, C.HitMax);
      if (roll() < hit) {
        var dmg = P / C.MonsterHitsToKill *
          Math.pow(ratio(magic ? mon.INT : mon.STR, resist), C.DefenseExponent) *
          (magic ? 1 : armorF) * between(0.8, 1.2);
        // Damage stays fractional inside the fight (a level 1 monster hits
        // for well under 1 HP); only the log and the totals are rounded.
        hp -= dmg;
        log.push(ProperName(name) + (magic ? " hexes you for " : " hits you for ") + Show(dmg));
      } else {
        log.push(ProperName(name) + (magic ? "'s hex misses" : " misses"));
      }
    }
  }

  var outcome = null, foeFled = false, rounds = 0;
  while (!outcome) {
    ++rounds;
    var heroFirst = roll() < ratio(hero.DEX, 1) / (ratio(hero.DEX, 1) + ratio(mon.DEX, 1));
    for (var turn = 0; turn < 2 && !outcome; ++turn) {
      if ((turn === 0) === heroFirst) {
        heroTurn();
        if (monHP <= 0) outcome = "win";
      } else {
        foeTurn();
        if (hp <= 0) { hp = 0; outcome = "defeat"; }
      }
    }
    if (outcome) break;

    // CHA: a beaten monster may give up
    if (monHP < monMax / 2) {
      var giveUp = _clamp(C.GiveUpBase * ratio(hero.CHA, mon.CHA), 0, C.GiveUpMax);
      if (roll() < giveUp) {
        log.push(ProperName(name) + " gives up and runs off");
        outcome = "win"; foeFled = true;
        break;
      }
    }
    // DEX: a losing hero may run
    if (hp < hero.hpMax * C.FleeAtHP && monHP > monMax * C.FleeIfFoeAbove) {
      if (roll() < _clamp(C.FleeBase * ratio(hero.DEX, mon.DEX), 0.1, 0.8)) {
        log.push("You flee from " + name);
        outcome = "flee";
        break;
      }
      log.push("You try to flee, but " + name + " blocks the way");
    }
    if (rounds >= C.MaxRounds) {
      log.push("You and " + name + " lose interest and wander off");
      outcome = "flee";
    }
  }

  var hpLost = Math.min(hero.hp, Math.round(hero.hp - hp));
  if (outcome === "defeat") hpLost = hero.hp;
  if (outcome === "win" && hpLost > hero.hpMax * C.CloseWin) outcome = "close";
  if (outcome === "win" || outcome === "close") {
    if (!foeFled) log.push(ProperName(name) + (qty > 1 ? " are" : " is") + " slain");
  } else if (outcome === "defeat") {
    log.push(ProperName(name) + " defeats you");
  }

  return {
    outcome: outcome,
    rounds: rounds,
    hpLost: hpLost,
    mpSpent: hero.mp - mp,
    foeFled: foeFled,
    log: log
  };
}

// HP/MP regained after a fight.
function CombatRegen(hero) {
  var C = K.Combat;
  var E = ExpectedStat(hero.level);
  return {
    hp: Math.round(hero.hpMax * _clamp(C.RegenHP * hero.CON / E, 0.01, C.RegenMax)),
    mp: Math.round(hero.mpMax * _clamp(C.RegenMP * hero.WIS / E, 0.01, C.RegenMax))
  };
}

// "a Big Orc" -> "A Big Orc"
function ProperName(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
