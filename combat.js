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
  MonsterHitsToKill: 12.5,

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
  WeaponPerLevel: 0.03, ArmorPerLevel: 0.02,

  // Spells. Each turn the hero may cast instead of swinging: 15% of the
  // time for a purely martial character up to 60% for a purely arcane one,
  // and only while MP lasts.
  CastChanceMartial: 0.15, CastChanceArcane: 0.6,
  SpellCost: 0.05,            // of ExpectedPool(monster level), at level 0
  SpellSuccessBase: 0.75, SpellSuccessSlope: 0.2,   // WIS vs monster WIS
  // A spell's roman-numeral level: +10% effect and +5% MP cost per level,
  // so higher levels hit harder and are more efficient.
  SpellPowerPerLevel: 0.1, SpellCostPerLevel: 0.05,
  // heal: restores this share of max HP (scaled by WIS); cast below
  // HealBelow of max HP
  HealAmount: 0.3, HealBelow: 0.5,
  // buff: you deal +X and take -X/2 damage for the rest of the fight;
  // debuff: the monster deals -X/2, takes +X and hits less often.
  // X = BuffBase at level 0, growing with spell level, at most BuffMax.
  BuffBase: 0.35, BuffMax: 0.75, DebuffHitPenalty: 0.1,
  // cc: if it lands (CHA vs monster WIS), the monster loses turns:
  // CCTurns, plus 1 per CCLevelsPerTurn spell levels, at most CCMaxTurns
  CCBase: 0.55, CCSlope: 0.2, CCTurns: 2, CCLevelsPerTurn: 4, CCMaxTurns: 4,

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

// Loot tuning (used by main.js)
K.Loot = {
  // Chance a beaten monster drops its item: base, +per level the monster
  // is above you, +per unit of CHA above typical for your level
  DropBase: 0.65, DropPerLevel: 0.04, DropPerCha: 0.15, DropMin: 0.3, DropMax: 0.95,
  // Chance a drop is rare ("Glowing orc ear of Destiny"), which sells for
  // far more
  RareBase: 0.02, RarePerLevel: 0.01, RarePerCha: 0.02, RareMin: 0.005, RareMax: 0.2,
  // Chance a beaten monster carries gold (about its level, per monster)
  GoldChance: 0.4,
  // CHA and sale prices / gold found: 1 + PriceSlope * (CHA ratio - 1)
  PriceSlope: 0.5, PriceMin: 0.7, PriceMax: 1.6,
  // Shop gear: your level + ShopMin + random(ShopSpread), and a charming
  // haggler (CHA) may get up to HaggleMax more
  ShopMin: -1, ShopSpread: 4, HaggleSlope: 1, HaggleMax: 2,
  // Premium stock for the wealthy: up to this many levels better
  PremiumMax: 5,
  // Quest and act rewards: your level + RewardMin + random(RewardSpread)
  RewardMin: 1, RewardSpread: 3
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
//         weapon, armor,        (gear power: weapon, and armor averaged
//                                over shield and armor slots)
//         physicality,          (0..1, from AttributeProfile)
//         spells: [{name, level, roman, type}] }  (type: see SpellType)
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

  // Spell state for this fight
  var buff = 0, debuff = 0, stunned = 0;
  var levelF = function (spell) { return 1 + C.SpellPowerPerLevel * spell.level; };
  var byType = {};
  $.each(spells, function (i, spell) {
    (byType[spell.type] = byType[spell.type] || []).push(spell);
  });
  // A spell of the given type, favoring higher levels
  function pickSpell(type) {
    var list = byType[type];
    if (!list) return null;
    var total = 0;
    $.each(list, function (i, sp) { total += (1 + sp.level) * (1 + sp.level); });
    var r = roll() * total;
    for (var i = 0; i < list.length; ++i) {
      r -= (1 + list[i].level) * (1 + list[i].level);
      if (r < 0) return list[i];
    }
    return list[list.length - 1];
  }
  function flavor(lines) { return lines[Math.floor(roll() * lines.length)]; }
  var Name = ProperName(name);

  // What to cast this turn, if anything: heal when hurt, buff and debuff
  // once each early on, crowd control a healthy monster, otherwise blast.
  function chooseSpell() {
    if (hp < hero.hpMax * C.HealBelow && byType.heal) return pickSpell("heal");
    if (!buff && byType.buff && monHP > monMax * 0.3) return pickSpell("buff");
    if (!debuff && byType.debuff && monHP > monMax * 0.5) return pickSpell("debuff");
    if (!stunned && byType.cc && monHP > monMax * 0.4 && roll() < 0.5) return pickSpell("cc");
    return pickSpell("damage");
  }

  function castSpell(spell) {
    var cost = Math.max(1, Math.round(P * C.SpellCost * (1 + C.SpellCostPerLevel * spell.level)));
    if (mp < cost) return false;
    mp -= cost;
    var label = spell.name + (spell.roman ? " " + spell.roman : "");
    var ok = _clamp(C.SpellSuccessBase + C.SpellSuccessSlope * _log2(ratio(hero.WIS, mon.WIS)),
                    C.HitMin, C.HitMax);
    if (roll() >= ok) {
      log.push("Your " + label + " fizzles");
      return true;
    }
    var strength = Math.min(C.BuffMax, C.BuffBase * levelF(spell));
    switch (spell.type) {
    case "heal":
      var healed = Math.min(hero.hpMax - hp, hero.hpMax * C.HealAmount * levelF(spell) *
                            Math.pow(ratio(hero.WIS, ExpectedStat(hero.level)), 0.5));
      hp += healed;
      log.push("You cast " + label + " and recover " + Show(healed) + " HP");
      break;
    case "buff":
      buff = Math.max(buff, strength);
      log.push("You cast " + label + ". " + flavor([
        "You feel mighty", "You feel fabulous", "You feel weirdly confident",
        "You are ready for anything", "Your muscles get muscles"]));
      break;
    case "debuff":
      debuff = Math.max(debuff, strength);
      log.push("You cast " + label + ". " + Name + " " + flavor([
        "looks worse for wear", "feels a little off", "is visibly uncomfortable",
        "questions its life choices", "starts to sweat"]));
      break;
    case "cc":
      var lands = _clamp(C.CCBase + C.CCSlope * _log2(ratio(hero.CHA, mon.WIS)), C.HitMin, C.HitMax);
      if (roll() < lands) {
        stunned = Math.min(C.CCMaxTurns, C.CCTurns + Math.floor(spell.level / C.CCLevelsPerTurn));
        log.push("You cast " + label + ". " + Name + " is " + flavor([
          "confused", "dazed", "charmed", "bewildered", "transfixed",
          "stuck in place", "dancing against its will"]));
      } else {
        log.push("You cast " + label + ", but " + name + " shrugs it off");
      }
      break;
    default:  // damage
      var sdmg = perHP / C.SpellHitsToKill *
        Math.pow(ratio(hero.INT, mon.INT), C.DamageExponent) *
        levelF(spell) * (1 + buff) * (1 + debuff) * between(0.8, 1.2);
      monHP -= sdmg;
      log.push("You cast " + label + " on " + name + " for " + Show(sdmg));
    }
    return true;
  }

  function heroTurn() {
    if (spells.length && roll() < castChance) {
      var spell = chooseSpell();
      if (spell && castSpell(spell)) return;
    }
    // Melee
    var hit = _clamp(C.HeroHitBase + C.HitSlope * _log2(ratio(hero.DEX, mon.DEX)), C.HitMin, C.HitMax);
    if (roll() < hit) {
      var dmg = perHP / C.MeleeHitsToKill *
        Math.pow(ratio(hero.STR, mon.STR), C.DamageExponent) * weaponF *
        (1 + buff) * (1 + debuff) * between(0.8, 1.2);
      monHP -= dmg;
      log.push("You hit for " + Show(dmg));
    } else {
      log.push("You miss");
    }
  }

  function foeTurn() {
    if (stunned > 0) {
      --stunned;
      log.push(Name + " does nothing useful");
      return;
    }
    var alive = Math.max(1, Math.ceil(monHP / perHP));
    for (var a = 0; a < alive && hp > 0; ++a) {
      var magic = roll() < C.MonsterMagicChance;
      var dodge = magic ? hero.WIS : hero.DEX;
      var resist = magic ? hero.WIS : hero.CON;
      var hit = _clamp(C.MonsterHitBase + C.HitSlope * _log2(ratio(magic ? mon.INT : mon.DEX, dodge)) -
                       (debuff ? C.DebuffHitPenalty : 0), C.HitMin, C.HitMax);
      if (roll() < hit) {
        var dmg = P / C.MonsterHitsToKill *
          Math.pow(ratio(magic ? mon.INT : mon.STR, resist), C.DefenseExponent) *
          (magic ? 1 : armorF) * (1 - buff / 2) * (1 - debuff / 2) * between(0.8, 1.2);
        // Damage stays fractional inside the fight (a level 1 monster hits
        // for well under 1 HP); only the log and the totals are rounded.
        hp -= dmg;
        log.push(Name + (magic ? " hexes you for " : " hits you for ") + Show(dmg));
      } else {
        log.push(Name + (magic ? "'s hex misses" : " misses"));
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

// Spell types, from K.Spells ("Name|type"). A spell without a valid type
// gets a random one, always the same for the same name.
K.SpellTypes = ["damage", "heal", "buff", "debuff", "cc"];
K.SpellTypeHelp = {
  damage: "damages the monster (INT)",
  heal:   "restores your HP (WIS)",
  buff:   "you hit harder and take less damage",
  debuff: "the monster hits softer and takes more damage",
  cc:     "the monster loses turns (CHA)"
};
var _spellTypes = null;
function SpellType(name) {
  if (!_spellTypes) {
    _spellTypes = {};
    $.each(K.Spells, function (i, entry) {
      var parts = entry.split("|");
      if (K.SpellTypes.indexOf(parts[1]) >= 0) _spellTypes[parts[0]] = parts[1];
    });
  }
  if (_spellTypes[name]) return _spellTypes[name];
  return K.SpellTypes[Math.floor(Mash()(name) * K.SpellTypes.length)];
}

function SpellName(entry) {
  return entry.split("|")[0];
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
