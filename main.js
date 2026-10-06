// Copyright (c)2002-2010 Eric Fredricksen <e@fredricksen.net> all rights reserved

var game = {};
var clock;

function timeGetTime() {
  return new Date().getTime();
}

function StartTimer() {
  if (!clock) {
    clock = new Worker('clock.js');
    clock.addEventListener('message', e => {
      Timer1Timer();
      clock.lasttick = timeGetTime();
    });
  }
  if (!clock.running) {
    clock.lasttick = timeGetTime();
    clock.running = true;
    clock.postMessage('start');
  }
}

function StopTimer() {
  if (clock) {
    clock.postMessage('stop');
    clock.running = false;
  }
}

function Q(s) {
  game.queue.push(s);
  Dequeue();
}

function TaskDone() {
  return TaskBar.done();
}

function Odds(chance, outof) {
  return Random(outof) < chance;
}

function RandSign() {
  return Random(2) * 2 - 1;
}

function RandomLow(below) {
  return Min(Random(below), Random(below));
}

function PickLow(s) {
  return s[RandomLow(s.length)];
}

function Copy(s, b, l) {
  return s.substr(b-1, l);
}

function Length(s) {
  return s.length;
}

function Starts(s, pre) {
  return 0 === s.indexOf(pre);
}

function Ends(s, e) {
  return Copy(s, 1+Length(s)-Length(e), Length(e)) == e;
}

function Plural(s) {
  if (Ends(s,'y'))
    return Copy(s,1,Length(s)-1) + 'ies';
  else if (Ends(s,'us'))
    return Copy(s,1,Length(s)-2) + 'i';
  else if (Ends(s,'ch') || Ends(s,'x') || Ends(s,'s') || Ends(s, 'sh'))
    return s + 'es';
  else if (Ends(s,'f'))
    return Copy(s,1,Length(s)-1) + 'ves';
  else if (Ends(s,'man') || Ends(s,'Man'))
    return Copy(s,1,Length(s)-2) + 'en';
  else return s + 's';
}

function Split(s, field, separator) {
  return s.split(separator || "|")[field];
}

function Indefinite(s, qty) {
  if (qty == 1) {
    if (Pos(s.charAt(0), 'AEIOUÜaeiouü') > 0)
      return 'an ' + s;
    else
      return 'a ' + s;
  } else {
    return IntToStr(qty) + ' ' + Plural(s);
  }
}

function Definite(s, qty) {
  if (qty > 1)
    s = Plural(s);
  return 'the ' + s;
}

function prefix(a, m, s, sep) {
  if (sep == undefined) sep = ' ';
  m = Abs(m);
  if (m < 1 || m > a.length) return s;  // In case of screwups
  return a[m-1] + sep + s;
}

function Sick(m, s) {
  m = 6 - Abs(m);
  return prefix(['Fjord-Pining','Mostly-Dead','Plague-Ridden','Flesh-Wounded','Hung-Over'], m, s);
}

function Young(m, s) {
  m = 6 - Abs(m);
  return prefix(['Fetal','Infantile','Kiddie','Teenage-Mutant','Has-Fake-ID'], m, s);
}

function Big(m, s) {
  return prefix(['Biggun','Dummy-Thicc','Barge-Sized','Ginormous','Kaiju'], m, s);
}

function Special(m, s) {
  if (Pos(' ', s) > 0)
    return prefix(['Super-Sonic','Underdark','Lycan','Deadite','Caffinated'], m, s);
  else
    return prefix(['Mecha-','Underdark ','Battle-','Deadite ','Demon '], m, s, '');
}

// The current Act is over: play the ending of its story, then move on to
// the next Act (see story.js).
function InterplotCinematic() {
  var story = game.story && game.story.act == game.act ? game.story : NewStory(game.act);
  var ending = StoryEnding(story);
  // Keep the ending, so an idle player can read it later by hovering
  // over the Act in the list
  var entry = StoryFor(game.act);
  if (entry) {
    entry.ending = ending;
    RefreshActTooltips();
  }
  $.each(ending, function (i, line) { Q('scene|4|' + line); });
  Q('plot|1|Loading ...');
}

function StrToInt(s) {
  return parseInt(s, 10);
}

function IntToStr(i) {
  return i + "";
}

function NamedMonster(level) {
  var lev = 0;
  var result = '';
  for (var i = 0; i < 5; ++i) {
    var m = Pick(K.Monsters);
    if (!result || (Abs(level-StrToInt(Split(m,1))) < Abs(level-lev))) {
      result = Split(m,0);
      lev = StrToInt(Split(m,1));
    }
  }
  return GenerateName() + ' the ' + result;
}

function ImpressiveGuy() {
  if (Random(2)) {
    return 'the ' + Pick(K.ImpressiveTitles) + ' of the ' + Plural(Split(Pick(K.Races), 0));
  } else {
    return Pick(K.ImpressiveTitles) + ' ' + GenerateName() + ' of ' + GenerateName();
  }
}

function MonsterTask(level) {
  var definite = false;
  var npc = false;
  for (var i = level; i >= 1; --i) {
    if (Odds(2,5))
      level += RandSign();
  }
  if (level < 1) level = 1;
  // level = level of puissance of opponent(s) we'll return

  var monster, lev;
  if (Odds(1,25)) {
    // Use an NPC every once in a while
      monster = ' ' + Split(Pick(K.Races), 0);
    if (Odds(1,2)) {
      monster = 'passing' + monster + ' ' + Split(Pick(K.Klasses), 0);
    } else {
      monster = PickLow(K.Titles) + ' ' + GenerateName() + ' the' + monster;
      definite = true;
    }
    lev = level;
    npc = true;
    monster = monster + '|' + IntToStr(level) + '|*';
  } else if (game.questmonster && Odds(1,4)) {
    // Use the quest monster
    monster = K.Monsters[game.questmonsterindex];
    lev = StrToInt(Split(monster,1));
  } else {
    // Pick the monster out of so many random ones closest to the level we want
    monster = Pick(K.Monsters);
    lev = StrToInt(Split(monster,1));
    for (var ii = 0; ii < 5; ++ii) {
      var m1 = Pick(K.Monsters);
      if (Abs(level-StrToInt(Split(m1,1))) < Abs(level-lev)) {
        monster = m1;
        lev = StrToInt(Split(monster,1));
      }
    }
  }

  var result = Split(monster,0);
  game.task = 'kill|' + monster;

  var qty = 1;
  if (level-lev > 10) {
    // lev is too low. multiply...
    qty = Math.floor((level + Random(Max(lev,1))) / Max(lev,1));
    if (qty < 1) qty = 1;
    level = Math.floor(level / qty);
  }

  if ((level - lev) <= -10) {
    result = 'imaginary ' + result;
  } else if ((level-lev) < -5) {
    i = 10+(level-lev);
    i = 5-Random(i+1);
    result = Sick(i,Young((lev-level)-i,result));
  } else if (((level-lev) < 0) && (Random(2) == 1)) {
    result = Sick(level-lev,result);
  } else if (((level-lev) < 0)) {
    result = Young(level-lev,result);
  } else if ((level-lev) >= 10) {
    result = 'messianic ' + result;
  } else if ((level-lev) > 5) {
    i = 10-(level-lev);
    i = 5-Random(i+1);
    result = Big(i,Special((level-lev)-i,result));
  } else if (((level-lev) > 0) && (Random(2) == 1)) {
    result = Big(level-lev,result);
  } else if (((level-lev) > 0)) {
    result = Special(level-lev,result);
  }

  // K.MonMods: now and then the monster gets an adjective that makes it
  // stronger or weaker than it would otherwise be ("+4 Giant *").
  // An adjective may shift the level by at most a third of it (at least 1),
  // so a level 2 rat can be Greater but not Kaiju; all of them are in play
  // from about level 15.
  var mod = 0;
  if (!npc && Odds(1,4)) {
    var cap = Max(1, Math.floor(level / 3));
    var mods = K.MonMods.filter(function (m) { return Abs(StrToInt(m)) <= cap; });
    var mm = Pick(mods);
    mod = StrToInt(Split(mm, 0, ' '));
    result = mm.substr(mm.indexOf(' ') + 1).replace('*', result);
  }

  lev = Max(1, level + mod);   // level of each opponent
  level = lev * qty;           // total puissance: sets XP and fight length

  var foe = { name: definite ? result : Definite(result, qty), level: lev, qty: qty };
  if (!definite) result = Indefinite(result, qty);
  return { 'description': result, 'level': level, 'foe': foe };
}

function LowerCase(s) {
  return s.toLowerCase();
}

function ProperCase(s) {
  return Copy(s,1,1).toUpperCase() + Copy(s,2,10000);
}

// Price of gear of a given power (by default, gear at your level)
function EquipPrice(power) {
  if (power === undefined) power = GetI(Traits,'Level');
  power = Max(0, power);
  return 5 * power * power + 10 * power + 20;
}

function Dequeue() {
  while (TaskDone()) {
    if (Split(game.task,0) == 'kill') {
      if (FightWon()) {
        if (Split(game.task,3) == '*') {
          WinItem();
        } else if (Split(game.task,3)) {
          DropLoot(LowerCase(Split(game.task,1) + ' ' + Split(game.task,3)));
        }
      }
      FinishFight();
      if (FightWon()) MaybeEvent('field', game.task);
    } else if (game.task == 'rest' || game.task == 'heal') {
      if (game.task == 'heal') PayTemple();
      RestoreHealth();
      if (game.task == 'rest') MaybeEvent('rest', 'rest');
    } else if (game.task == 'heading') {
      MaybeEvent('road', 'heading');
    } else if (Split(game.task,0) == 'event') {
      FinishEvent();
    } else if (game.task == 'boss') {
      FinishFight();
      FinishBoss();
    } else if (game.task == 'buying') {
      // buy some equipment, if the shop has anything better
      var offer = ShopPower();
      if (WinEquip(offer, true)) {
        Add(Inventory,'Gold',-EquipPrice(offer));
      } else {
        game.shopped = true;  // nothing worth buying until next trip
      }
    } else if ((game.task == 'market') || (game.task == 'sell')) {
      if (game.task == 'market') {
        RestoreHealth();  // a night at the inn
        BankPurse();
        game.shopped = false;
        MaybeEvent('town', 'market');
      }
      if (game.task == 'sell') {
        var amt = GetI(Inventory, 1) * GetI(Traits,'Level');
        if (Pos(' of ', Inventory.label(1)) > 0)
          amt *= (1+RandomLow(10)) * (1+RandomLow(GetI(Traits,'Level')));
        amt = Math.round(amt * ChaFactor(K.Loot.PriceSlope, K.Loot.PriceMin, K.Loot.PriceMax));
        Inventory.remove1();
        Add(Inventory, 'Gold', amt);
      }
      if (Inventory.length() > 1) {
        Inventory.scrollToTop();
        Task('Selling ' + Indefinite(Inventory.label(1), GetI(Inventory,1)),
             1 * 1000);
        game.task = 'sell';
        break;
      }
    }

    var old = game.task;
    if (Split(old,0) == 'event') old = game.eventResume || '';
    game.task = '';
    if (game.queue.length > 0) {
      var a = Split(game.queue[0],0);
      var n = StrToInt(Split(game.queue[0],1));
      var s = Split(game.queue[0],2);
      if (a == 'task' || a == 'plot' || a == 'heal' || a == 'scene') {
        var last = Split(game.queue[0],3);
        game.queue.shift();
        if (a == 'plot') {
          CompleteAct();
          s = 'Loading ' + game.bestplot;
        }
        Task(s, n * 1000);
        if (a == 'heal') game.task = 'heal';
        if (a == 'scene') Narrate(s);
        if (last == 'ev' || last == 'event') RevealEventLine();
        if (last == 'event') game.task = 'event';
        if (last == 'victory') ShowFinaleDialog();
      } else if (a == 'boss') {
        game.queue.shift();
        BeginBoss();
      } else {
        throw 'bah!' + a;
      }
    } else if (EncumBar.done()) {
      Task('Heading to market to sell viscera-covered loot',4 * 1000);
      game.task = 'market';
    } else if ((Pos('kill|',old) <= 0) && (old != 'heading') && (old != 'rest')) {
      if (GetI(Inventory, 'Gold') > EquipPrice() && !game.shopped) {
        Task('Haggling over the price of better equipment', 5 * 1000);
        game.task = 'buying';
      } else {
        Task('Heading to the Killing Fields™', 4 * 1000);
        game.task = 'heading';
      }
    } else if (FinaleDue()) {
      StartFinale();   // queues the cinematic and the fight; picked up next time round
    } else if (NeedsRest()) {
      // A heal spell gets you back on your feet twice as fast
      var heals = game.Spells.filter(function (sp) { return SpellType(sp[0]) == 'heal'; });
      if (heals.length) {
        Task('Casting ' + Pick(heals)[0] + ' on yourself', RestTime() / 2);
      } else {
        Task('Catching your breath', RestTime());
      }
      game.task = 'rest';
    } else {
      var nn = GetI(Traits, 'Level');
      // After a defeat, a sensible hero picks easier fights for a while
      var t = MonsterTask(Max(1, nn - Math.floor(game.caution || 0)));
      var InventoryLabelAlsoGameStyleTag = 3;
      nn = Math.floor((2 * InventoryLabelAlsoGameStyleTag * t.level * 1000) / nn);
      // The fight is settled now; the task bar just plays it out. Harder
      // fights (more rounds) take longer to watch.
      var fight = ResolveCombat(HeroSnapshot(), t.foe, Random(0x7fffffff));
      fight.foe = t.foe.name;
      fight.foeLevel = t.foe.level;
      fight.qty = t.foe.qty;
      fight.xp = nn / 1000;
      game.combat = fight;
      Task('Executing ' + t.description, Math.round(nn * FightLength(fight)));
    }
  }
}


// ---- Combat glue ------------------------------------------------------

// Snapshot of the character for ResolveCombat().
function HeroSnapshot() {
  var hero = {
    name: Get(Traits,'Name'),
    level: GetI(Traits,'Level'),
    hp: HPBar.Position(), hpMax: PoolMax('HP Max'),
    mp: MPBar.Position(), mpMax: PoolMax('MP Max'),
    weapon: SlotPower('Weapon'),
    armor: ArmorPowerAvg(),
    physicality: CharProfile().physicality,
    wounded: game.wounded > 0,
    spells: game.Spells.map(function (s) {
      return { name: s[0], level: toArabic(s[1]), roman: s[1], type: SpellType(s[0]) };
    })
  };
  $.each(K.PrimeStats, function (i, stat) { hero[stat] = EffStat(stat); });
  return hero;
}

// Did the fight that just played out end in victory? Fights from saves made
// before combat existed count as wins.
function FightWon() {
  return !game.combat || game.combat.outcome == 'win' || game.combat.outcome == 'close';
}

// A typical fight lasts about 6 rounds and takes as long as fights always
// have; longer fights take longer to watch, short ones are over quickly.
function FightLength(fight) {
  return Min(2, Max(0.6, fight.rounds / 6));
}

// Apply the fight's toll, then regain a little between fights.
function FinishFight() {
  var fight = game.combat;
  if (!fight) return;
  HPBar.reposition(Max(0, HPBar.Position() - fight.hpLost));
  MPBar.reposition(Max(0, MPBar.Position() - fight.mpSpent));
  $.each(fight.log, function (i, line) { Log(line); });

  if (game.wounded > 0) { --game.wounded; ShowCondition(); }
  if (fight.outcome == 'win' || fight.outcome == 'close')
    game.caution = Max(0, (game.caution || 0) - K.Defeat.CautionDecay);

  if (fight.outcome == 'defeat') {
    Defeated(fight);
  } else {
    if (fight.outcome == 'flee')
      game.queue.push('task|2|Running away from ' + fight.foe + ' as fast as you can');
    var regen = CombatRegen(HeroSnapshot());
    HPBar.increment(regen.hp);
    MPBar.increment(regen.mp);
  }
  fight.done = true;
  ShowFight();
}

// ---- The finale -----------------------------------------------------------

// At K.Boss.Level the hero goes after the Old Bastard(TM) from the Prologue.
// game.finale: { state: 'pending' or 'won', tries, nextTry (game seconds),
// wonAt, wonLevel }. null until the first attempt.
function FinaleDue() {
  if (GetI(Traits,'Level') < K.Boss.Level || game.event) return false;
  var f = game.finale;
  if (f && f.state == 'won') return false;
  return !f || (game.elapsed || 0) >= (f.nextTry || 0);
}

function FinaleVars() {
  var vars = StoryVars();
  var prologue = StoryFor(0);
  vars.taunt = (prologue && prologue.taunt) || Insult();
  vars.tries = ((game.finale && game.finale.tries) || 0) + 1;
  vars.hours = Math.round((game.elapsed || 0) / 3600);
  return vars;
}

// Queue the lines of a part of the finale (K.FinaleStory), narrated. The
// last line can carry a marker for Dequeue.
function QueueFinale(part, marker) {
  var vars = FinaleVars();
  var lines = K.FinaleStory[part] || [];
  $.each(lines, function (i, line) {
    var text = ProperName(StoryText(line, vars)).replace(/\|/g, '/');
    game.queue.push('scene|4|' + text + (marker && i == lines.length - 1 ? '|' + marker : ''));
  });
}

function StartFinale() {
  game.finale = game.finale || { state: 'pending', tries: 0 };
  QueueFinale(game.finale.tries && K.FinaleStory.rematch ? 'rematch' : 'approach');
  game.queue.push('boss|0|The Old Bastard\u2122');
  Log('The finale begins');
}

// The fight itself. Settled now, like any fight; the task bar plays it out.
function BeginBoss() {
  var B = K.Boss;
  RestoreHealth();   // you rested up for this
  var escapes = game.finale.tries || 0;   // he gets older every time he runs
  var foe = { name: 'the Old Bastard\u2122',
              level: Max(1, B.Level + B.BossLevelGap - Min(B.WeakenMax, escapes * B.WeakenPerEscape)),
              qty: 1, boss: true, hpMult: B.BossHP, maxRounds: B.BossMaxRounds };
  var fight = ResolveCombat(HeroSnapshot(), foe, Random(0x7fffffff));
  fight.foe = foe.name;
  fight.foeLevel = foe.level;
  fight.qty = 1;
  fight.boss = true;
  game.combat = fight;
  game.finale.tries = (game.finale.tries || 0) + 1;
  Task('Fighting the Old Bastard\u2122 for the fate of everything (attempt ' + game.finale.tries + ')',
       Min(60000, 10000 + fight.rounds * 800));
  game.task = 'boss';
  ShowFight(true);
}

// The fight has played out (FinishFight has applied it)
function FinishBoss() {
  var fight = game.combat || {};
  var f = game.finale = game.finale || { state: 'pending', tries: 1 };
  if (fight.outcome == 'win' || fight.outcome == 'close') {
    f.state = 'won';
    f.wonAt = game.elapsed || 0;
    f.wonLevel = GetI(Traits,'Level');
    Log('Defeated the Old Bastard\u2122 after ' + f.tries + (f.tries == 1 ? ' try' : ' tries'));
    QueueFinale('victory', 'victory');
    ShowRetire();
    Brag('f');
  } else {
    f.nextTry = (game.elapsed || 0) + K.Boss.RetryMinutes * 60;
    QueueFinale('escape');
  }
}

function CanRetire() {
  return !!(game.finale && game.finale.state == 'won');
}

// "Retire" under the task bar, once the Old Bastard(TM) is beaten
function ShowRetire() {
  if (!document) return;
  $("#RetireLink").toggle(CanRetire());
}

function ShowFinaleDialog() {
  if (!document || !CanRetire()) return;
  var dlg = document.getElementById("FinaleDialog");
  if (!dlg || !dlg.showModal) return;
  var f = game.finale;
  $("#FinaleSummary").text(Get(Traits,'Name') + " beat the Old Bastard\u2122 at level " + f.wonLevel +
    ", " + RoughTime(f.wonAt) + " into the adventure" +
    (f.tries > 1 ? ", on attempt " + f.tries : ", on the first try") +
    ", after being defeated " + (game.deaths || 0) + (game.deaths == 1 ? " time." : " times."));
  CloseEventPopup();
  if (!dlg.open) dlg.showModal();
}

// ---- Cheating ---------------------------------------------------------------
//
// A single-player game in a browser can't stop a determined cheat, but it
// can notice the usual ones and say so. A hero caught cheating is branded
// for good (game.cheater, sealed into the save): they can keep playing,
// but the brand shows on the character sheet, in Resume and in the Hall,
// and a branded legend's race and class don't count for New Game+.
//
// What gets noticed:
// - a save edited outside the game (its seal, see Seal in config.js)
// - game time running faster than the clock (console fast-forwarding,
//   speed hacks): game time can only pass while the game is open
// - for heroes created from save version 9 on, things a fair game can't
//   produce: levels faster than the XP allows, stats, HP/MP or gear far
//   beyond the level. The limits are several times what simulated heroes
//   (with a full New Game+ legacy) ever reach.
K.Guard = {
  CheckEvery: 50,       // tasks between checks
  SpeedSlack: 1.1,      // game time may run this much faster than the clock...
  SpeedGrace: 600,      // ...plus this many seconds (a task already under way)
  LevelPace: 0.3,       // game time >= this share of the XP time for the level
  StatMax: 4,           // a core stat <= 18 + this many times typical for the level
  PoolMax: 3,           // HP/MP Max <= this many times typical, + 100
  GearAbove: 20         // gear power <= level + this
};

var _guardSession = null;   // real time and game time when this page started

// later: the save happens as usual (while loading, the sheet isn't ready)
function Brand(reason, later) {
  if (!game || game.cheater) return;
  var level = game.Traits ? parseInt(game.Traits.Level, 10) || 0 : 0;
  game.cheater = { reason: reason, at: new Date().toISOString(), level: level };
  Log('Branded a cheater: ' + reason);
  if (later) return;
  ShowBrand();
  if (document) SaveGame();
}

function ShowBrand() {
  if (!document) return;
  var c = game.cheater;
  $("#CheaterBrand").text(c ? "Branded a cheater: " + c.reason + ". This hero can keep playing, " +
                          "but won't count for New Game+." : "").toggle(!!c);
  $("#main").toggleClass("branded", !!c);
}

// Typical gains are measured, not fixed: see K.Guard
function CheckForCheating() {
  if (!document || !game || game.cheater) return;
  var G = K.Guard, now = Date.now(), elapsed = game.elapsed || 0;
  if (!_guardSession) _guardSession = { real: now, elapsed: elapsed };

  // Game time can't pass faster than real time, this session...
  var played = elapsed - _guardSession.elapsed, real = (now - _guardSession.real) / 1000;
  if (played > real * G.SpeedSlack + G.SpeedGrace)
    return Brand("the game ran faster than the clock");

  // The Old Bastard(TM) can only have been beaten at the finale level
  var f = game.finale;
  if (f && f.state == 'won' && ((f.wonLevel || 0) < K.Boss.Level || GetI(Traits,'Level') < K.Boss.Level))
    return Brand("they claim to have beaten the Old Bastard\u2122 before level " + K.Boss.Level);

  if ((game.birthVersion || 0) < 9) return;   // older heroes: only the above

  // ...or since the hero was born
  if (game.birthstamp && elapsed > (now - game.birthstamp) / 1000 * G.SpeedSlack + G.SpeedGrace)
    return Brand("more time was played than has passed since they were born");

  var level = GetI(Traits,'Level');
  if (level >= 5) {
    var xpTime = 0;
    for (var l = 1; l < level; ++l) xpTime += LevelUpTime(l);
    if (elapsed < xpTime * G.LevelPace)
      return Brand("they reached level " + level + " faster than is possible");
  }
  var E = ExpectedStat(level), P = ExpectedPool(level);
  for (var i = 0; i < K.PrimeStats.length; ++i) {
    var stat = K.PrimeStats[i];
    if (GetI(Stats, stat) > 18 + G.StatMax * E + 20)
      return Brand("their " + stat + " is impossibly high for level " + level);
  }
  if (GetI(Stats,'HP Max') > G.PoolMax * P + 100 || GetI(Stats,'MP Max') > G.PoolMax * P + 100)
    return Brand("their HP or MP is impossibly high for level " + level);
  for (var s = 0; s < K.Equips.length; ++s) {
    if (SlotPower(K.Equips[s]) > level + G.GearAbove)
      return Brand("their " + K.Equips[s] + " is far too good for level " + level);
  }
}

// ---- Retiring to the Hall of Legends ----------------------------------------

// What the Hall remembers about a hero
function MakeLegend() {
  var f = game.finale || {};
  var prologue = StoryFor(0);
  var stats = {};
  $.each(K.Stats, function (i, s) { stats[s] = GetI(Stats, s); });
  return {
    id: Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36),
    name: Get(Traits,'Name'),
    race: Get(Traits,'Race'),
    klass: Get(Traits,'Class'),
    level: GetI(Traits,'Level'),
    stats: stats,
    retired: new Date().toISOString(),
    played: Math.round(game.elapsed || 0),
    wonLevel: f.wonLevel || GetI(Traits,'Level'),
    wonAt: Math.round(f.wonAt || game.elapsed || 0),
    tries: f.tries || 1,
    deaths: game.deaths || 0,
    acts: game.act || 0,
    bestequip: game.bestequip || '',
    bestspell: game.bestspell || '',
    beststat: game.beststat || '',
    taunt: (prologue && prologue.taunt) || '',
    mode: game.mode || 'normal',
    cheater: game.cheater ? game.cheater.reason : null
  };
}

function AskRetire() {
  if (!document || !CanRetire()) return;
  var dlg = document.getElementById("RetireDialog");
  $("#RetireName").text(Get(Traits,'Name'));
  $("#RetireRace").text(Get(Traits,'Race'));
  $("#RetireClass").text(Get(Traits,'Class'));
  $("#RetireBackup")
    .attr("href", "data:text/plain;charset=utf-8," +
          encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(game))))))
    .attr("download", Get(Traits,'Name') + ".pqw");
  $("#FinaleDialog")[0].close();
  if (!dlg.open) dlg.showModal();
}

// Enshrine the hero, take them off the roster, and go to the Hall
function Retire() {
  if (!CanRetire()) return;
  CheckForCheating();   // a branded hero still retires, but won't count
  SuspendAutosave();   // or leaving the page would save them back
  StopTimer();
  var legend = MakeLegend();
  var name = Get(Traits,'Name');
  storage.addLegend(legend, function () {
    storage.loadRoster(function (games) {
      delete games[name];
      storage.storeRoster(games, function () {
        window.location.href = "index.html#hall/" + legend.id;
      });
    });
  });
}

// ---- Narration ------------------------------------------------------------

// Read the important things aloud (cinematics, new Acts, random events)
// with the browser's speech synthesis, since an idle game is easy to miss.
// Toggle with N or the "Narration" link; remembered per browser.
var _narrationQueued = 0;
function NarrationOn() {
  try { return window.localStorage.getItem("pq.narrate") !== "0"; } catch (e) { return true; }
}

function Narrate(text) {
  if (!document || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  if (!NarrationOn()) return;
  if (_narrationQueued > 12) return;   // don't pile up hours of backlog
  var speech = String(text)
    .replace(/\u2122/g, '')                 // ™
    .replace(/\.\.\.+$/, '')
    .replace(/[\u201c\u201d]/g, '"');
  var u = new SpeechSynthesisUtterance(speech);
  u.rate = 1;
  u.onend = function () { _narrationQueued = Max(0, _narrationQueued - 1); };
  u.onerror = function (e) {
    _narrationQueued = Max(0, _narrationQueued - 1);
    // Browsers won't speak until the player has clicked or pressed a key on
    // the page. Hold the lines and say them at the first interaction.
    if (e.error == 'not-allowed') {
      if (_narrationHeld.length < 6) _narrationHeld.push(speech);
      WaitForNarrationGesture();
    }
  };
  ++_narrationQueued;
  window.speechSynthesis.speak(u);
}

var _narrationHeld = [], _narrationWaiting = false;
function WaitForNarrationGesture() {
  if (_narrationWaiting) return;
  _narrationWaiting = true;
  $("#NarrateToggle").text("Narration: click to enable");
  $(document).one("pointerdown.narrate keydown.narrate", function () {
    $(document).off(".narrate");
    _narrationWaiting = false;
    ShowNarration();
    var held = _narrationHeld;
    _narrationHeld = [];
    $.each(held, function (i, line) { Narrate(line); });
  });
}

function ToggleNarration() {
  var on = !NarrationOn();
  try { window.localStorage.setItem("pq.narrate", on ? "1" : "0"); } catch (e) {}
  if (!on && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    _narrationQueued = 0;
  }
  ShowNarration();
  if (on) Narrate("Narration on.");
}

function ShowNarration() {
  if (!document) return;
  $("#NarrateToggle").text(NarrationOn() ? "Narration: on" : "Narration: off")
    .toggle(!!window.speechSynthesis);
}

// ---- Random events --------------------------------------------------------

// Maybe start a random event (see events.js). where: 'rest', 'road',
// 'town' or 'field'. resume: the task to carry on from afterwards.
function MaybeEvent(where, resume) {
  if (!K.Events || game.queue.length) return;
  if (game.tasks - (game.lastEvent || 0) < K.EventCooldown) return;
  if (Random(1000) >= (K.EventChance[where] || 0) * 1000) return;
  var level = GetI(Traits,'Level');
  var choices = K.Events.filter(function (e) {
    return e.where.indexOf(where) >= 0 &&
      (!e.minLevel || level >= e.minLevel) && (!e.maxLevel || level <= e.maxLevel);
  });
  if (!choices.length) return;
  var total = 0;
  $.each(choices, function (i, e) { total += e.weight || 1; });
  var r = Random(1000) / 1000 * total, event = choices[choices.length - 1];
  for (var i = 0; i < choices.length; ++i) {
    r -= choices[i].weight || 1;
    if (r < 0) { event = choices[i]; break; }
  }

  // Fill in the details now, so the lines and the effect agree
  var effect = event.effect || {};
  var vars = StoryVars();
  var instance = { key: event.key, effect: effect };
  if (effect.gold) {
    instance.gold = Max(1, Math.round(Abs(effect.gold) * level * (0.5 + Random(100) / 100)));
    vars.gold = instance.gold;
  }
  if (effect.item) {
    instance.loot = effect.item == 'special' ? SpecialItem() : BoringItem();
    vars.loot = Indefinite(instance.loot, 1);
  }
  game.event = instance;
  game.eventResume = resume;
  game.lastEvent = game.tasks;
  instance.where = where;
  instance.shown = 0;
  instance.lines = event.lines.map(function (line) {
    return ProperName(StoryText(line, vars)).replace(/([^.])\.$/, '$1').replace(/\|/g, '/');
  });
  // One task per line. Each line is shown (RevealEventLine) as its task
  // starts; 'event' marks the last one, after which the effect is applied.
  $.each(instance.lines, function (i, text) {
    game.queue.push('scene|3|' + text + '|' + (i == instance.lines.length - 1 ? 'event' : 'ev'));
  });
}

// The event's last line has played: apply what it does, and note what
// happened for the pop-up and the "Last event" box.
function FinishEvent() {
  var ev = game.event;
  game.event = null;
  if (!ev) return;
  var fx = ev.effect || {};
  var result = [];
  if (fx.gold > 0) {
    game.purse = (game.purse || 0) + ev.gold;
    ShowPurse();
    result.push('Found ' + ev.gold + ' gold');
  } else if (fx.gold < 0) {
    var fromPurse = Min(game.purse || 0, ev.gold);
    game.purse = (game.purse || 0) - fromPurse;
    var fromBank = Min(GetI(Inventory,'Gold'), ev.gold - fromPurse);
    if (fromBank) Add(Inventory, 'Gold', -fromBank);
    ShowPurse();
    result.push('Lost ' + (fromPurse + fromBank) + ' gold');
  }
  if (fx.item && ev.loot) {
    Add(Inventory, ev.loot, 1);
    result.push('Got ' + Indefinite(ev.loot, 1));
  }
  if (fx.stat) {
    var stat = fx.stat == 'random' ? Pick(K.PrimeStats) : fx.stat;
    var amount = AddBuff(stat);
    result.push('+' + amount + ' ' + stat + ' for ' + K.BuffMinutes + ' minutes');
  }
  if (fx.spell) {
    var spell = WinSpell();
    result.push('Learned ' + spell + ' (now ' + Get(Spells, spell) + ')');
  }
  if (fx.equip) {
    result.push(WinEquip() ? 'Equipped ' + game.bestequip : 'Got a spare piece of gear to sell');
  }
  if (fx.heal) {
    RestoreHealth();
    result.push('Fully healed');
  }
  if (fx.wounded) {
    game.wounded = Max(game.wounded || 0, fx.wounded);
    ShowCondition();
    result.push('Wounded for ' + fx.wounded + (fx.wounded == 1 ? ' fight' : ' fights'));
  }
  if (fx.xp) {
    ExpBar.increment(ExpBar.Max() * fx.xp);
    result.push('+' + Math.round(fx.xp * 100) + '% of the way to the next level');
  }
  Log('Event: ' + ev.key);

  var shown = game.recentEvent;
  if (!shown || shown.key != ev.key || shown.result.length)
    shown = game.recentEvent = { key: ev.key, where: ev.where, lines: ev.lines || [],
                                 at: game.elapsed || 0 };
  shown.result = result;
  ShowRecentEvent();
  ShowEventPopup(true);
}

// ---- Temporary buffs --------------------------------------------------------

// Stat events give a buff for K.BuffMinutes of game time (game.elapsed
// counts seconds of tasks played, so a paused game does not run it down).
// game.buffs is a list of { stat, amount, until }.

// Raise a core stat by K.BuffPercent of what is typical at your level. The
// same stat again refreshes the timer (and keeps the larger amount); other
// stats stack. Returns the amount.
function AddBuff(stat) {
  var amount = Max(1, Math.round(ExpectedStat(GetI(Traits,'Level')) * K.BuffPercent));
  var until = (game.elapsed || 0) + K.BuffMinutes * 60;
  var buffs = ActiveBuffs(), found = null;
  $.each(buffs, function (i, b) { if (b.stat == stat) found = b; });
  if (found) {
    found.amount = Max(found.amount, amount);
    found.until = until;
    amount = found.amount;
  } else {
    buffs.push({ stat: stat, amount: amount, until: until });
  }
  game.buffs = buffs;
  ShowBuffs();
  return amount;
}

// The buffs still running (and forget the ones that have worn off)
function ActiveBuffs() {
  var now = game.elapsed || 0, buffs = game.buffs || [];
  var live = buffs.filter(function (b) { return b.until > now; });
  if (live.length != buffs.length) {
    $.each(buffs, function (i, b) { if (b.until <= now) Log('Your ' + b.stat + ' buff wears off'); });
    game.buffs = live;
  }
  return live;
}

function BuffAmount(stat) {
  var total = 0;
  $.each(ActiveBuffs(), function (i, b) { if (b.stat == stat) total += b.amount; });
  return total;
}

// A stat as it counts right now: buffs and the New Game+ legacy included
function EffStat(stat) {
  return GetI(Stats, stat) + BuffAmount(stat) + LegacyAmount(stat);
}

// ---- New Game+ legacy (see K.Legacy in config.js) ----------------------------

// This hero's legacy share for an attribute (0.15 is +15%)
function LegacyPct(stat) {
  return (game.legacy && game.legacy.bonus && game.legacy.bonus[stat]) || 0;
}

// Core stats: that share of what is typical at the hero's level
function LegacyAmount(stat) {
  var pct = LegacyPct(stat);
  return pct ? Math.round(ExpectedStat(GetI(Traits,'Level')) * pct) : 0;
}

// HP Max and MP Max as they count (the bars' maximum): the legacy share of
// the hero's own
function PoolMax(stat) {
  return Math.round(GetI(Stats, stat) * (1 + LegacyPct(stat)));
}

// "New Game+ legacy: 6 races and classes" under the stats
function ShowLegacy() {
  if (!document) return;
  var L = game.legacy;
  var n = L ? (L.races || []).length + (L.klasses || []).length : 0;
  if (!n) { $("#Legacy").text("").attr("title", ""); return; }
  $("#Legacy").text("New Game+ legacy: " + n + (n == 1 ? " race or class" : " races and classes") +
                    " (+" + Math.round(LegacyAverage(L.bonus) * 1000) / 10 + "% on average)")
    .attr("title", "From the Hall of Legends, fixed when this hero was created. " +
          LegacySummary(L.bonus) + ". Core stats get a share of what is typical for your level; " +
          "HP Max and MP Max a share of your own." +
          (L.races.length ? "\nRaces: " + L.races.join(", ") : "") +
          (L.klasses.length ? "\nClasses: " + L.klasses.join(", ") : ""));
  $("#Stats tr").each(function () {
    var pct = LegacyPct(Key(this));
    $(this).toggleClass("legacy", pct > 0);
  });
}

// "Buffed: +14 STR (9:41) +12 WIS (3:20)" under the health bars, and the
// affected stats marked on the character sheet
var _buffShown = null;
function ShowBuffs() {
  if (!document) return;
  var now = (game.elapsed || 0) + (TaskBar ? TaskBar.Position() / 1000 : 0);
  var live = ActiveBuffs().filter(function (b) { return b.until > now; });
  var text = live.map(function (b) {
    var left = Math.ceil(b.until - now);
    return '+' + b.amount + ' ' + b.stat + ' (' + Math.floor(left / 60) + ':' +
           ('0' + (left % 60)).slice(-2) + ')';
  }).join('  ');
  if (text === _buffShown) return;
  _buffShown = text;
  $("#Buffs").text(text ? 'Buffed: ' + text : '')
    .attr("title", text ? "Temporary buffs from events. They count in fights, prices, resting " +
                          "and recovery, not for carrying capacity or level-ups." : "");
  $("#Stats tr").each(function () {
    var stat = Key(this), amount = 0;
    $.each(live, function (i, b) { if (b.stat == stat) amount += b.amount; });
    $(this).toggleClass("buffed", amount > 0)
           .attr("title", amount > 0 ? "+" + amount + " from an event, for a limited time" : null);
  });
}

// ---- Event pop-up and "Last event" box -------------------------------------

K.EventWhere = { rest: 'While resting', road: 'On the road', town: 'In town',
                 field: 'On the Killing Fields™' };

// Called as each line of an event starts: remember what has been shown so
// far, and show it.
function RevealEventLine() {
  var ev = game.event;
  if (!ev || !ev.lines) return;
  ev.shown = Min(ev.lines.length, (ev.shown || 0) + 1);
  game.recentEvent = { key: ev.key, where: ev.where, lines: ev.lines.slice(0, ev.shown),
                       result: [], at: game.elapsed || 0 };
  ShowRecentEvent();
  ShowEventPopup(false);
}

function EventPopupsOn() {
  try { return window.localStorage.getItem("pq.eventpopup") !== "0"; } catch (e) { return true; }
}

function ToggleEventPopups() {
  var on = !EventPopupsOn();
  try { window.localStorage.setItem("pq.eventpopup", on ? "1" : "0"); } catch (e) {}
  if (!on) CloseEventPopup();
  ShowEventPopupToggle();
}

function ShowEventPopupToggle() {
  if (!document) return;
  $("#EventPopupToggle").text(EventPopupsOn() ? "Event pop-ups: on" : "Event pop-ups: off");
}

// Fill in a box with an event: where, the lines so far, and what it did
function RenderEvent(ev, $where, $lines, $result) {
  $where.text(ev ? (K.EventWhere[ev.where] || 'Something happened') : '');
  $lines.empty();
  $result.text('');
  if (!ev) return;
  $.each(ev.lines || [], function (i, line) { $lines.append($("<div>").text(line)); });
  $result.text((ev.result || []).join(' · '));
}

function ShowRecentEvent() {
  if (!document) return;
  var ev = game.recentEvent;
  $("#RecentEvent").toggleClass("empty", !ev);
  if (!ev) {
    $("#RecentWhere").text('');
    $("#RecentLines").text('Nothing eventful has happened yet.');
    $("#RecentResult").text('');
    return;
  }
  RenderEvent(ev, $("#RecentWhere"), $("#RecentLines"), $("#RecentResult"));
  ShowRecentAge();
}

// "(14 minutes ago)" next to the heading, refreshed as the game runs
var _recentAge = null;
function ShowRecentAge() {
  if (!document || !game.recentEvent) return;
  var age = Max(0, (game.elapsed || 0) - (game.recentEvent.at || 0));
  var text = age < 10 ? ' · just now' : ' · ' + RoughTime(age) + ' ago';
  if (text === _recentAge) return;
  _recentAge = text;
  $("#RecentAge").text(text);
}

var _popupTimer = null;
// Show the event in a dialog. It stays up while the event plays, and for
// K.EventPopupLinger seconds after it ends (longer while the mouse is over
// it). Click, Esc or OK closes it sooner. The game keeps running behind it.
function ShowEventPopup(finished) {
  if (!document || !EventPopupsOn()) return;
  var dlg = document.getElementById("EventDialog");
  if (!dlg || !dlg.showModal || !game.recentEvent) return;
  RenderEvent(game.recentEvent, $("#EventWhere"), $("#EventLines"), $("#EventResult"));
  if (!dlg.open) dlg.showModal();
  clearTimeout(_popupTimer);
  if (finished) _popupTimer = setTimeout(PopupTimeout, K.EventPopupLinger * 1000);
}

function PopupTimeout() {
  var dlg = document.getElementById("EventDialog");
  // (the dialog element itself counts the backdrop as hover, so ask the
  // window's own parts)
  var reading = dlg && dlg.open && Array.prototype.some.call(dlg.children, function (part) {
    return part.matches(":hover");
  });
  if (reading)
    _popupTimer = setTimeout(PopupTimeout, 2000);   // still reading
  else
    CloseEventPopup();
}

function CloseEventPopup() {
  clearTimeout(_popupTimer);
  var dlg = document.getElementById("EventDialog");
  if (dlg && dlg.open) dlg.close();
}

// ---- Story ----------------------------------------------------------------

// The story of a given Act (0 is the Prologue), if it was recorded
function StoryFor(act) {
  var log = game.storyLog || [];
  for (var i = log.length - 1; i >= 0; --i)
    if (log[i].act == act) return log[i];
  return null;
}

// "Act II: The Heist" (or just "Act II" for Acts from before stories), and
// for the Prologue, the Old Bastard™'s taunt: "Prologue: Thou paltry
// evil-eyed varlet"
function ActCaption(act) {
  if (!act) {
    var prologue = StoryFor(0);
    var taunt = prologue && (prologue.taunt ||
      (prologue.purpose.match(/\u201c(Thou [^\u201d]*)\u201d/) || [])[1]);
    return taunt ? 'Prologue: ' + taunt.replace(/!$/, '') : 'Prologue';
  }
  var entry = StoryFor(act);
  return 'Act ' + toRoman(act) + (entry ? ': ' + entry.title : '');
}

// The Act number in a caption from the Acts list ("Act XIV: ..." -> 14)
function ActFromCaption(caption) {
  var m = /^\s*Act ([A-Z]+)/.exec(caption || '');
  return m ? toArabic(m[1]) : 0;
}

// Hover text for an Act: what it was about, and once it is over, how it
// ended (the cinematic, which an idle player has probably missed)
function ActTooltip(act) {
  var entry = StoryFor(act);
  if (!entry) return '';
  var tip = entry.purpose;
  if (entry.ending && entry.ending.length)
    tip += '\n\nHow it ended:\n' + entry.ending.join('\n');
  return tip;
}

function RefreshActTooltips() {
  if (!Plots || !Plots.box) return;
  Plots.box.find("tr").each(function () {
    var tip = ActTooltip(ActFromCaption($(this).text()));
    if (tip) $(this).attr("title", tip);
  });
}

// Make a story the current one, remember it, and show it
function BeginStory(story) {
  game.story = story;
  if (!game.storyLog) game.storyLog = [];
  game.storyLog.push({ act: story.act, key: story.key, title: story.title, purpose: story.purpose,
                      taunt: story.taunt });
  while (game.storyLog.length > 100) game.storyLog.shift();
  ShowStory();
}

// Saves from before stories: give the current Act one
function EnsureStory() {
  if (game.story && game.story.act == game.act) return;
  BeginStory(game.act ? NewStory(game.act) : PrologueStory());
}

function ShowStory() {
  if (!document || !game.story) return;
  $("#StoryTitle").text(ActCaption(game.act));
  $("#StoryText").text(game.story.purpose);
}

// ---- Watching the fight -------------------------------------------------

// One line on how a fight went, for under the task bar
function FightSummary(fight) {
  var rounds = fight.rounds + (fight.rounds == 1 ? " round" : " rounds");
  var cost = [];
  if (fight.hpLost) cost.push(fight.hpLost + " HP");
  if (fight.mpSpent) cost.push(fight.mpSpent + " MP");
  cost = cost.length ? " (cost " + cost.join(", ") + ")" : "";
  var foe = fight.foe || "the foe";
  switch (fight.outcome) {
  case 'win':    return (fight.foeFled ? ProperName(foe) + " gave up after " + rounds : "Beat " + foe + " in " + rounds) + cost;
  case 'close':  return "Barely beat " + foe + " in " + rounds + cost;
  case 'flee':   return "Got away from " + foe + " after " + rounds + cost;
  case 'defeat': return "Defeated by " + foe + " after " + rounds;
  }
  return "";
}

// The fight plays out as the task bar fills: the combat log reveals its
// lines in step with the bar, and the line under the bar shows the latest
// blow, then the result once the fight is over.
var _shownLines = -1, _shownFight = null, _shownLive = null;
function ShowFight(force) {
  if (!document) return;
  var fight = game.combat;
  if (!fight || !fight.log) { $("#FightLine").text(""); return; }
  var live = Pos('kill|', game.task) == 1 && !fight.done;
  var n = live ? Math.floor(fight.log.length * TaskBar.Position() / Max(1, TaskBar.Max())) : fight.log.length;
  if (!force && fight === _shownFight && n === _shownLines && live === _shownLive) return;
  if (fight !== _shownFight) {
    $("#CombatLog").empty();
    $("<div class='fight-head'>").text("vs " + fight.foe).appendTo("#CombatLog");
    _shownLines = 0;
  }
  for (var i = Max(0, _shownLines); i < n; ++i)
    $("<div>").text(fight.log[i]).appendTo("#CombatLog");
  if (!live && (fight !== _shownFight || _shownLive !== false || force))
    $("<div class='fight-result'>").text(FightSummary(fight)).appendTo("#CombatLog");
  _shownFight = fight;
  _shownLines = n;
  _shownLive = live;
  var log = $("#CombatLog")[0];
  if (log) log.scrollTop = log.scrollHeight;
  $("#FightLine").text(live ? (n ? fight.log[n - 1] : "Sizing each other up...") :
                       "Last fight: " + FightSummary(fight))
    .toggleClass("defeat", !live && fight.outcome == 'defeat');
}

function ToggleCombatLog() {
  $("body").toggleClass("show-log");
  try {
    window.localStorage.setItem("pq.combatlog", $("body").hasClass("show-log") ? "1" : "0");
  } catch (e) {}
  ShowFight(true);
}

// ---- Defeat ---------------------------------------------------------------

// Beaten: the monster goes through your pockets (unbanked gold and loot
// only; banked gold and equipped gear are safe), someone drags you back to
// town, and you convalesce at a temple, which charges for the privilege.
// You stay Wounded for the next few fights.
function Defeated(fight) {
  var D = K.Defeat;
  game.deaths = (game.deaths || 0) + 1;

  // Pockets: a share of the purse and of each stack of loot
  var lostGold = 0, lostItems = 0;
  if (game.purse) {
    lostGold = Math.round(game.purse * (D.PurseLossMin + Random(100) / 100 * (D.PurseLossMax - D.PurseLossMin)));
    game.purse -= lostGold;
  }
  for (var i = game.Inventory.length - 1; i >= 1; --i) {
    var name = game.Inventory[i][0];
    var qty = StrToInt(game.Inventory[i][1]);
    var lose = 0;
    for (var u = 0; u < qty; ++u)
      if (Random(100) < D.ItemLossPercent) ++lose;
    if (lose) {
      lostItems += lose;
      Add(Inventory, name, -lose);
      if (GetI(Inventory, name) <= 0) RemoveItem(name);
    }
  }
  ShowPurse();
  Log('Defeated by ' + fight.foe + '; lost ' + lostGold + ' gold and ' + lostItems + ' items');

  var taken = [];
  if (lostGold) taken.push(lostGold + ' gold');
  if (lostItems) taken.push(lostItems + (lostItems == 1 ? ' item' : ' items'));
  var robbed = taken.length ?
    ' and makes off with ' + taken.join(' and ') :
    ' and finds your pockets disappointingly empty';
  var rescuer = Indefinite(Split(Pick(K.Races), 0) + ' ' + Split(Pick(K.Klasses), 0), 1);
  var temple = 'the Temple of ' + Pick(K.ImpressiveTitles) + ' ' + GenerateName();
  game.queue.push('task|4|' + ProperName(fight.foe) + ' leaves you for dead' + robbed);
  game.queue.push('task|4|You are dragged back to town by ' + rescuer);
  game.queue.push('heal|' + RecoveryTime() + '|Convalescing at ' + temple);
  game.wounded = D.WoundedFights;
  game.caution = Min(D.CautionMax, (game.caution || 0) + D.CautionPerDefeat);
  ShowCondition();
}

// Seconds at the temple: longer at higher levels, shorter with more CON
function RecoveryTime() {
  var D = K.Defeat;
  var level = GetI(Traits,'Level');
  var con = EffStat('CON') / ExpectedStat(level);
  return Math.round((D.RecoveryBase + D.RecoveryPerLevel * level) / Min(2, Max(0.5, con)));
}

// The temple's tithe: a share of your purse and of your banked gold. The
// richer you are, the more salvation costs.
function PayTemple() {
  var fromPurse = Math.floor((game.purse || 0) * K.Defeat.Tithe);
  var fromBank = Math.floor(GetI(Inventory, 'Gold') * K.Defeat.Tithe);
  game.purse = (game.purse || 0) - fromPurse;
  if (fromBank) Add(Inventory, 'Gold', -fromBank);
  if (fromPurse + fromBank) Log('Tithed ' + (fromPurse + fromBank) + ' gold to the temple');
  ShowPurse();
}

// Remove an inventory row whose count has hit zero
function RemoveItem(name) {
  for (var i = 1; i < game.Inventory.length; ++i) {
    if (game.Inventory[i][0] === name) {
      game.Inventory.splice(i, 1);
      if (Inventory.box) Inventory.box.find("tr").eq(i).remove();
      Put(Inventory, 'Gold', GetI(Inventory, 'Gold'));  // refresh encumbrance
      return;
    }
  }
}

// "Wounded (3 fights)" and the defeat count, under the health bars
function ShowCondition() {
  if (!document) return;
  var deaths = game.deaths || 0;
  $("#Condition").text(
    (game.wounded > 0 ? "Wounded (" + game.wounded + (game.wounded == 1 ? " fight)" : " fights)") + " \u00b7 " : "") +
    "Defeated " + deaths + (deaths == 1 ? " time" : " times"))
    .toggleClass("wounded", game.wounded > 0);
}

function NeedsRest() {
  return HPBar.Position() < HPBar.Max() * K.Combat.RestBelow;
}

// Resting takes 3-8 seconds depending on how hurt you are; more CON, less.
function RestTime() {
  var hurt = 1 - HPBar.Position() / Max(1, HPBar.Max());
  var con = EffStat('CON') / ExpectedStat(GetI(Traits,'Level'));
  return Math.round(1000 * (3 + 5 * hurt) / Min(2, Max(0.5, con)));
}

function RestoreHealth() {
  HPBar.reset(PoolMax('HP Max'), PoolMax('HP Max'));
  MPBar.reset(PoolMax('MP Max'), PoolMax('MP Max'));
}

// ---- Loot ---------------------------------------------------------------

// CHA against what is typical for your level, turned into a multiplier:
// 1 for an average character, more for a charming one, within [lo, hi].
function ChaFactor(slope, lo, hi) {
  var r = EffStat('CHA') / ExpectedStat(GetI(Traits,'Level'));
  return Min(hi, Max(lo, 1 + slope * (r - 1)));
}

// Spoils of a won fight. Each monster may drop its item; tougher monsters
// and more CHA mean better odds of a drop and of a rare one. Monsters may
// also carry some gold. All of it is unbanked until sold at market.
function DropLoot(part) {
  var L = K.Loot;
  var fight = game.combat || {};
  var gap = (fight.foeLevel || GetI(Traits,'Level')) - GetI(Traits,'Level');
  var cha = ChaFactor(1, 0, 3) - 1;   // -1 .. +2
  var chance = Min(L.DropMax, Max(L.DropMin, L.DropBase + L.DropPerLevel * gap + L.DropPerCha * cha));
  var rare = Min(L.RareMax, Max(L.RareMin, L.RareBase + L.RarePerLevel * gap + L.RarePerCha * cha));
  var qty = fight.qty || 1;
  for (var i = 0; i < qty; ++i) {
    if (Random(1000) >= chance * 1000) continue;
    if (Random(1000) < rare * 1000)
      Add(Inventory, Pick(K.ItemAttrib) + ' ' + part + ' of ' + Pick(K.ItemOfs), 1);
    else
      Add(Inventory, part, 1);
  }
  if (Random(1000) < L.GoldChance * 1000) {
    var gold = Math.round((fight.foeLevel || 1) * qty * (0.5 + Random(100) / 100) *
                          ChaFactor(L.PriceSlope, L.PriceMin, L.PriceMax));
    if (gold > 0) {
      game.purse = (game.purse || 0) + gold;
      Log('Looted ' + gold + ' gold');
      ShowPurse();
    }
  }
}

// Market day: the purse goes in the bank
function BankPurse() {
  if (game.purse) {
    Add(Inventory, 'Gold', game.purse);
    game.purse = 0;
  }
  ShowPurse();
}

function ShowPurse() {
  if (!document) return;
  var items = 0;
  $.each(game.Inventory.slice(1), function (i, row) { items += StrToInt(row[1]); });
  $("#Purse").text("Unbanked: " + (game.purse || 0) + " gold, " + items +
                   (items == 1 ? " item" : " items"));
}

function Put(list, key, value) {
  if (typeof key === typeof 1)
    key = list.label(key);

  if (list.fixedkeys) {
    game[list.id][key] = value;
  } else {
    var i = 0;
    for (; i < game[list.id].length; ++i) {
      if (game[list.id][i][0] === key) {
        game[list.id][i][1] = value;
        break;
      }
    }
    if (i == game[list.id].length)
      game[list.id].push([key,value]);
  }

  list.PutUI(key, value);

  if (key === 'STR')
    EncumBar.reset(10 + value, EncumBar.Position());
  if (key === 'HP Max')
    HPBar.reset(PoolMax('HP Max'), HPBar.Position());
  if (key === 'MP Max')
    MPBar.reset(PoolMax('MP Max'), MPBar.Position());

  if (list === Inventory) {
    ShowPurse();
    var cubits = 0;
    $.each(game.Inventory.slice(1), function (index, item) {
      cubits += StrToInt(item[1]);
    });
    EncumBar.reposition(cubits);
  }
}


function ProgressBar(id, tmpl) {
  this.id = id;
  this.bar = $("#"+ id + " > .bar");
  this.tmpl = tmpl;

  this.Max = function () { return game[this.id].max; };
  this.Position = function () { return game[this.id].position; };

  this.reset = function (newmax, newposition) {
    game[this.id].max = newmax;
    this.reposition(newposition || 0);
  };

  this.reposition = function (newpos) {
    game[this.id].position = Min(newpos, this.Max());

    // Recompute hint
    game[this.id].percent = (100 * this.Position()).div(this.Max());
    game[this.id].remaining = Math.floor(this.Max() - this.Position());
    game[this.id].time = RoughTime(this.Max() - this.Position());
    game[this.id].hint = template(this.tmpl, game[this.id]);

    // Update UI
    if (this.bar) {
      var p = this.Max() ? 100 * this.Position() / this.Max() : 0;
      this.bar.css("width", p + "%");
      this.bar.parent().find(".hint").text(game[this.id].hint);
    }
  };

  this.increment = function (inc) {
    this.reposition(this.Position() + inc);
  };

  this.done = function () {
    return this.Position() >= this.Max();
  };

  this.load = function (game) {
    this.reposition(this.Position());
  };
}



function Key(tr) {
  return $(tr).children().first().text();
}

function Value(tr) {
  return $(tr).children().last().text();
}



function ListBox(id, columns, fixedkeys) {
  this.id = id;
  this.box = $("tbody#_, #_ tbody".replace(/_/g, id));
  this.columns = columns;
  this.fixedkeys = fixedkeys;

  this.AddUI = function (caption) {
    if (!this.box) return;
    var tr = $("<tr>").append(
      $("<td>").append($("<input>", { type: "checkbox", disabled: true }),
                       document.createTextNode(" " + caption)));
    tr.appendTo(this.box);
    tr.each(function () {this.scrollIntoView();});
    if (this.decorate) this.decorate(tr, caption);
    return tr;
  };

  this.ClearSelection = function () {
    if (this.box)
      this.box.find("tr").removeClass("selected");
  };

  this.PutUI = function (key, value) {
    if (!this.box) return;
    var item = this.rows().filter(function (index) {
      return Key(this) === key;
    });
    if (!item.length) {
      item = $("<tr>").append($("<td>").text(key), $("<td>"));
      this.box.append(item);
    }

    item.children().last().text(value);
    item.addClass("selected");
    if (this.decorate) this.decorate(item, key);
    item.each(function () {this.scrollIntoView();});
  };

  this.scrollToTop = function () {
    if (this.box)
      this.box.parents(".scroll").scrollTop(0);
  };

  this.rows = function () {
    return this.box.find("tr").has("td");
  };

  this.CheckAll = function (butlast) {
    if (this.box) {
      var boxes = this.rows().find("input:checkbox");
      if (butlast) boxes = boxes.slice(0, -1);
      boxes.prop("checked", true);
    }
  };

  this.length = function () {
    return (this.fixedkeys || game[this.id]).length;
  };

  this.remove0 = function (n) {
    if (game[this.id])
      game[this.id].shift();
    if (this.box)
      this.box.find("tr").first().remove();
  };

  this.remove1 = function (n) {
    var t = game[this.id].shift();
    game[this.id].shift();
    game[this.id].unshift(t);
    if (this.box)
      this.box.find("tr").eq(1).remove();
  };


  this.load = function (game) {
    var that = this;
    var dict = game[this.id];
    if (this.fixedkeys) {
      $.each(this.fixedkeys, function (index, key) {
        that.PutUI(key, dict[key]);
      });
    } else {
      $.each(dict, function (index, row) {
        if (that.columns == 2)
          that.PutUI(row[0], row[1]);
        else
          that.AddUI(row);
      });
    }
  };


  this.label = function (n) {
    return this.fixedkeys ? this.fixedkeys[n] : game[this.id][n][0];
  };
}


var ExpBar, PlotBar, TaskBar, QuestBar, EncumBar, HPBar, MPBar;
var Traits,Stats,Spells,Equips,Inventory,Plots,Quests;
var Kill;
var AllBars, AllLists;


function StrToIntDef(s, def) {
  var result = parseInt(s, 10);
  return isNaN(result) ? def : result;
}


if (document)
  $(document).ready(FormCreate);


function WinSpell() {
  var spell = SpellName(K.Spells[RandomLow(Min(GetI(Stats,'WIS')+GetI(Traits,'Level'),
                                               K.Spells.length))]);
  AddR(Spells, spell, 1);
  return spell;
}

function LPick(list, goal) {
  var result = Pick(list);
  for (var i = 1; i <= 5; ++i) {
    var best = StrToInt(Split(result, 1));
    var s = Pick(list);
    var b1 = StrToInt(Split(s,1));
    if (Abs(goal-best) > Abs(goal-b1))
      result = s;
  }
  return result;
}

function Abs(x) {
  if (x < 0) return -x; else return x;
}

// The piece of gear for a slot at a given power: a base item near that
// power, adjectives and a +N/-N making up the difference.
function MakeEquip(posn, power) {
  var stuff, better, worse;
  if (!posn) {
    stuff = K.Weapons;
    better = K.OffenseAttrib;
    worse = K.OffenseBad;
  } else {
    better = K.DefenseAttrib;
    worse = K.DefenseBad;
    stuff = (posn == 1) ? K.Shields:  K.Armors;
  }
  var name = LPick(stuff, power);
  var qual = StrToInt(Split(name,1));
  name = Split(name,0);
  var plus = power - qual;
  if (plus < 0) better = worse;
  var count = 0;
  while (count < 2 && plus) {
    var modifier = Pick(better);
    qual = StrToInt(Split(modifier, 1));
    modifier = Split(modifier, 0);
    if (Pos(modifier, name) > 0) break; // no repeats
    if (Abs(plus) < Abs(qual)) break; // too much
    name = modifier + ' ' + name;
    plus -= qual;
    ++count;
  }
  if (plus) name = plus + ' ' + name;
  if (plus > 0) name = '+' + name;
  return name;
}

// Power of the gear in a slot ("Weapon", "Helm"...), stored when it was
// equipped; read from its name for gear from older saves.
function SlotPower(slot) {
  if (game.EquipPower && game.EquipPower[slot] !== undefined)
    return game.EquipPower[slot];
  if (slot == 'Weapon')
    return GearPower(game.Equips.Weapon, K.Weapons, K.OffenseAttrib, K.OffenseBad);
  return GearPower(game.Equips[slot], slot == 'Shield' ? K.Shields : K.Armors,
                   K.DefenseAttrib, K.DefenseBad);
}

// Average power of the shield and armor slots
function ArmorPowerAvg() {
  var total = 0, n = 0;
  $.each(K.Equips, function (i, slot) {
    if (slot == 'Weapon') return;
    total += SlotPower(slot);
    ++n;
  });
  return n ? total / n : 0;
}

// Power of what the shop offers: around your level, better with CHA. A
// rich customer is shown the premium stock: up to K.Loot.PremiumMax more,
// as long as it costs no more than half the gold on hand.
function ShopPower() {
  var power = GetI(Traits,'Level') + K.Loot.ShopMin + Random(K.Loot.ShopSpread) +
    Math.round(ChaFactor(K.Loot.HaggleSlope, 0, K.Loot.HaggleMax) * Random(2));
  var gold = GetI(Inventory,'Gold');
  for (var extra = 0; extra < K.Loot.PremiumMax &&
       EquipPrice(power + 1) * 2 <= gold; ++extra)
    ++power;
  // ...but never more than you can pay for
  while (power > 0 && EquipPrice(power) > gold)
    --power;
  return power;
}

// New gear for the weakest slot. It is equipped only if it beats what is
// there; otherwise it goes in the pack to sell (or, when shopping, is
// simply not bought). Returns whether anything was equipped.
// power: defaults to a reward a little above your level.
function WinEquip(power, shopping) {
  if (power === undefined)
    power = GetI(Traits,'Level') + K.Loot.RewardMin + Random(K.Loot.RewardSpread);
  power = Max(0, power);

  // weakest slot; ties broken at random
  var weakest = [], low = Infinity;
  $.each(K.Equips, function (i, slot) {
    var p = SlotPower(slot);
    if (p < low) { low = p; weakest = [i]; }
    else if (p == low) weakest.push(i);
  });
  var posn = Pick(weakest);
  var slot = K.Equips[posn];
  var name = MakeEquip(posn, power);

  if (power <= SlotPower(slot)) {
    if (!shopping) Add(Inventory, 'spare ' + name, 1);
    return false;
  }
  if (!game.EquipPower) game.EquipPower = {};
  game.EquipPower[slot] = power;
  Put(Equips, posn, name);
  game.bestequip = name;
  if (posn > 1) game.bestequip += ' ' + Equips.label(posn);
  ShowGearPower();
  return true;
}

function ShowGearPower() {
  if (!document) return;
  $("#GearPower").text("Weapon power " + SlotPower('Weapon') +
                       " \u00b7 Armor power " + ArmorPowerAvg().toFixed(1));
}


function Square(x) { return x * x; }

// The current character's attribute profile (see AttributeProfile).
function CharProfile() {
  return AttributeProfile(Get(Traits,'Race'), Get(Traits,'Class'));
}

function WinStat() {
  var i;
  if (Odds(1,2))  {
    // Favor the race and class attributes: each stat's chance is
    // K.StatPickBase plus its profile weight.
    var weights = CharProfile().weights;
    var t = 0;
    $.each(K.Stats, function (index, key) {
      t += K.StatPickBase + weights[key];
    });
    t = Random(t);
    $.each(K.Stats, function (index, key) {
      i = key;
      t -= K.StatPickBase + weights[key];
      if (t < 0) return false;
    });
  } else {
    // Favor the best stat so it will tend to clump
    var t = 0;
    $.each(K.PrimeStats, function (index, key) {
      t += Square(GetI(Stats, key));
    });
    t = Random(t);
    $.each(K.PrimeStats, function (index, key) {
      i = key;
      t -= Square(GetI(Stats, key));
      if (t < 0) return false;
    });
  }
  Add(Stats, i, 1);
}

function SpecialItem() {
  return InterestingItem() + ' of ' + Pick(K.ItemOfs);
}

function InterestingItem() {
  return Pick(K.ItemAttrib) + ' ' + Pick(K.Specials);
}

function BoringItem() {
  return Pick(K.BoringItems);
}

function WinItem() {
  if (Max(250, Random(999)) < Inventory.length()) {
    Add(Inventory, Pick(game.Inventory)[0], 1);
  } else {
    Add(Inventory, SpecialItem(), 1);
  }
}

function CompleteQuest() {
  QuestBar.reset(50 + Random(100));
  if (Quests.length()) {
    Log('Quest completed: ' + game.bestquest);
    Quests.CheckAll();
    [WinSpell,WinEquip,WinStat,WinItem][Random(4)]();
  }
  while (Quests.length() > 99)
    Quests.remove0();

  game.questmonster = '';
  var quest = MakeQuest();
  var caption = quest.caption;
  if (quest.monster) {
    game.questmonster = quest.monster;
    game.questmonsterindex = quest.monsterIndex;
  }
  if (!game.Quests) game.Quests = [];
  while (game.Quests.length > 99) game.Quests.shift();
  game.Quests.push(caption);
  game.bestquest = caption;
  Quests.AddUI(caption);


  Log('Commencing quest: ' + caption);

  SaveGame();
}

function toRoman(n) {
  if (!n) return "N";
  var s = "";
  function _rome(dn,ds) {
    if (n >= dn) {
      n -= dn;
      s += ds;
      return true;
    } else return false;
  }
  if (n < 0) {
    s = "-";
    n = -n;
  }

  while (_rome(10000,"T")) {0;}
  _rome(9000,"MT");
  _rome(5000,"A");
  _rome(4000,"MA");
  while (_rome(1000,"M")) {0;}
  _rome(900,"CM");
  _rome(500,"D");
  _rome(400,"CD");
  while (_rome(100,"C")) {0;}
  _rome(90,"XC");
  _rome(50,"L");
  _rome(40,"XL");
  while (_rome(10,"X")) {0;}
  _rome(9,"IX");
  _rome(5,"V");
  _rome(4,"IV");
  while (_rome(1,"I")) {0;}
  return s;
}

function toArabic(s) {
  var n = 0;
  s = s.toUpperCase();
  function _arab(ds,dn) {
    if (!Starts(s, ds)) return false;
    s = s.substr(ds.length);
    n += dn;
    return true;
  }
  while (_arab("T",10000)) {0;}
  _arab("MT",9000);
  _arab("A",5000);
  _arab("MA",4000);
  while (_arab("M",1000)) {0;}
  _arab("CM",900);
  _arab("D",500);
  _arab("CD",400);
  while (_arab("C",100)) {0;}
  _arab("XC",90);
  _arab("L",50);
  _arab("XL",40);
  while (_arab("X",10)) {0;}
  _arab("IX",9);
  _arab("V",5);
  _arab("IV",4);
  while (_arab("I",1)) {0;}
  return n;
}

function CompleteAct() {
  Plots.CheckAll();
  game.act += 1;
  PlotBar.reset(60 * 60 * (1 + 5 * game.act)); // 1 hr + 5/act
  game.bestplot = 'Act ' + toRoman(game.act);
  BeginStory(NewStory(game.act));
  Narrate(ActCaption(game.act) + '. ' + game.story.purpose);
  Plots.AddUI(ActCaption(game.act));

  if (game.act > 1) {
    WinItem();
    WinEquip();
  }

  Brag('a');
}


function Log(line) {
  if (game.log)
    game.log[+new Date()] = line;
  // TODO: and now what?
}

function Task(caption, msec) {
  game.kill = caption + "...";
  if (Kill)
    Kill.text(game.kill).attr("title", game.kill);
  Log(game.kill);
  TaskBar.reset(msec);
}

function Add(list, key, value) {
  Put(list, key, value + GetI(list,key));

  /*$IFDEF LOGGING*/
  if (!value) return;
  var line = (value > 0) ? "Gained" : "Lost";
  if (key == 'Gold') {
    key = "gold piece";
    line = (value > 0) ? "Got paid" : "Spent";
  }
  if (value < 0) value = -value;
  line = line + ' ' + Indefinite(key, value);
  Log(line);
  /*$ENDIF*/
}

function AddR(list, key, value) {
  Put(list, key, toRoman(value + toArabic(Get(list,key))));
}

function Get(list, key) {
  if (list.fixedkeys) {
    if (typeof key === typeof 1)
      key = list.fixedkeys[key];
    return game[list.id][key];
  } else if (typeof key === typeof 1) {
    if (key < game[list.id].length)
      return game[list.id][key][1];
    else
      return "";
  } else {
    for (var i = 0; i < game[list.id].length; ++i) {
      if (game[list.id][i][0] === key)
        return game[list.id][i][1];
    }
    return "";
  }
}

function GetI(list, key) {
  return StrToIntDef(Get(list,key), 0);
}

function Min(a,b) {
  return a < b ? a : b;
}

function Max(a,b) {
  return a > b ? a : b;
}

// HP/MP gained on level-up, boosted when that pool is in the profile.
function PoolGain(base, weight) {
  return base + Math.round(base * weight * K.PoolGrowthPerWeight / 100);
}

function LevelUp() {
  var weights = CharProfile().weights;
  Add(Traits,'Level',1);
  Add(Stats,'HP Max', PoolGain(GetI(Stats,'CON').div(3) + 1 + Random(4), weights['HP Max']));
  Add(Stats,'MP Max', PoolGain(GetI(Stats,'INT').div(3) + 1 + Random(4), weights['MP Max']));
  WinStat();
  WinStat();
  WinSpell();
  RestoreHealth();  // a new level, a fresh start
  ExpBar.reset(LevelUpTime(GetI(Traits,'Level')));
  Brag('l');
  CheckForCheating();
}

function ClearAllSelections() {
  $.each(AllLists, function () {this.ClearSelection();});
}

function RoughTime(s) {
  if (s < 120) return s.div(1) + ' seconds';
  else if (s < 60 * 120) return s.div(60) + ' minutes';
  else if (s < 60 * 60 * 48) return s.div(3600) + ' hours';
  else if (s < 60 * 60 * 24 * 60) return s.div(3600 * 24) + ' days';
  else if (s < 60 * 60 * 24 * 30 * 24) return s.div(3600 * 24 * 30) +" months";
  else return s.div(3600 * 24 * 30 * 12) + " years";

}

function Pos(needle, haystack) {
  return haystack.indexOf(needle) + 1;
}

var dealing = false;

function Timer1Timer() {
  if (TaskBar.done()) {
    game.tasks += 1;
    game.elapsed += TaskBar.Max().div(1000);

    ClearAllSelections();

    if (game.kill == 'Loading....')
      TaskBar.reset(0);  // Not sure if this is still the ticket

    // gain XP / level up. Wins earn the monster's full worth; running away
    // or losing still teaches you something.
    var fought = Pos('kill|', game.task) == 1;
    var gain = fought && FightWon();
    var reward = (fought && game.combat && game.combat.xp !== undefined) ?
      game.combat.xp : TaskBar.Max() / 1000;
    if (fought) {
      if (ExpBar.done())
        LevelUp();
      else
        ExpBar.increment(gain ? reward : reward * K.Combat.LossXP);
    }

    // advance quest
    if (gain && game.act >= 1) {
      if (QuestBar.done() || !Quests.length()) {
        CompleteQuest();
      } else {
        QuestBar.increment(reward);
      }
    }

    // advance plot
    if (gain || !game.act) {
      if (PlotBar.done())
        InterplotCinematic();
      else
        PlotBar.increment(gain ? reward : TaskBar.Max() / 1000);
    }

    Dequeue();
    ShowBuffs();
    ShowRecentAge();
    if (game.tasks % K.Guard.CheckEvery == 0) CheckForCheating();
  } else {
    var elapsed = timeGetTime() - clock.lasttick;
    if (elapsed > 100) elapsed = 100;
    if (elapsed < 0) elapsed = 0;
    TaskBar.increment(elapsed);
    ShowFight();
    ShowBuffs();
  }

  StartTimer();
}

function FormCreate() {
  ExpBar =   new ProgressBar("ExpBar", "$remaining XP needed for next level");
  EncumBar = new ProgressBar("EncumBar", "$position/$max cubits");
  PlotBar =  new ProgressBar("PlotBar", "$time remaining");
  QuestBar = new ProgressBar("QuestBar", "$percent% complete");
  TaskBar =  new ProgressBar("TaskBar", "$percent%");
  HPBar =    new ProgressBar("HPBar", "$position/$max HP");
  MPBar =    new ProgressBar("MPBar", "$position/$max MP");

  AllBars = [ExpBar,PlotBar,TaskBar,QuestBar,EncumBar,HPBar,MPBar];

  Traits =    new ListBox("Traits",    2, K.Traits);
  Stats =     new ListBox("Stats",     2, K.Stats);
  Spells =    new ListBox("Spells",    2);
  Equips =    new ListBox("Equips",    2, K.Equips);
  Inventory = new ListBox("Inventory", 2);
  Plots =     new ListBox("Plots",  1);
  Quests =    new ListBox("Quests", 1);

  // Each Act in the list shows its story on hover
  Plots.decorate = function (row, caption) {
    var tip = ActTooltip(ActFromCaption(caption));
    if (tip) row.attr("title", tip);
  };

  // Show each slot's gear power on hover
  Equips.decorate = function (row, slot) {
    row.attr("title", "Power " + SlotPower(slot));
  };

  // Tag each spell in the book with what it does in a fight
  Spells.decorate = function (row, name) {
    var type = SpellType(name);
    row.attr("class", row.hasClass("selected") ? "selected" : "")
       .addClass("spell-" + type).attr("title", name + ": " + K.SpellTypeHelp[type]);
  };

  Plots.load = function (sheet) {
    for (var i = Max(0, game.act-99); i <= game.act; ++i)
      this.AddUI(ActCaption(i));
  };

  AllLists = [Traits,Stats,Spells,Equips,Inventory,Plots,Quests];

  if (document) {
    Kill = $("#Kill");

    $("#quit").on("click", quit);
    $("#LogToggle").on("click", function (e) {
      e.preventDefault();
      ToggleCombatLog();
    });
    $("#NarrateToggle").on("click", function (e) {
      e.preventDefault();
      ToggleNarration();
    });
    ShowNarration();
    $("#EventPopupToggle").on("click", function (e) {
      e.preventDefault();
      ToggleEventPopups();
    });
    ShowEventPopupToggle();
    $("#RetireLink").on("click", function (e) { e.preventDefault(); AskRetire(); });
    $("#FinaleRetire").on("click", AskRetire);
    $("#FinaleKeep").on("click", function () { this.closest("dialog").close(); });
    $("#RetireYes").on("click", Retire);
    $("#RetireNo").on("click", function () { this.closest("dialog").close(); });
    // Close the event pop-up with a click anywhere on it (or its backdrop)
    $("#EventDialog").on("click", CloseEventPopup);
    try {
      if (window.localStorage.getItem("pq.combatlog") === "1")
        $("body").addClass("show-log");
    } catch (e) {}

    $(document).on("keydown", FormKeyDown);

    // Save whenever the page is hidden or closed. 'unload' is being removed
    // from browsers and is unreliable on mobile; pagehide and
    // visibilitychange are the supported replacements.
    $(window).on("pagehide.pqsave", function () { SaveGame(); });
    $(document).on("visibilitychange.pqsave", function () {
      if (document.visibilityState === "hidden") SaveGame();
    });

    if (iOS) $("body").addClass("iOS");
  }

  var name = DecodeName(window.location.href.split('#')[1]);
  storage.loadSheet(name, LoadGame);

  if (window.opener) {
    // Opened as a popup, so go bare style
    prepPopup();
  }
}

function prepPopup() {
  document.body.classList.add("bare");
  window.resizeBy($("#main")[0].offsetWidth - window.innerWidth,
                  $("#main")[0].offsetHeight - window.innerHeight);

  let titlebar = $("#titlebar");
  let delta;

  titlebar.on("mousedown", e => {
      delta = {
          x: e.pageX,
          y: e.pageY
      };
  });

  $("html").on("mouseup", e => { delta = null; });

  $("html").on("mousemove", e => {
    if (!e.buttons) delta = null;
    if (delta) {
        window.moveBy(e.pageX - delta.x,
                      e.pageY - delta.y);
    }
  });
}


function SuspendAutosave() {
  $(window).off(".pqsave");
  $(document).off(".pqsave");
}

function quit() {
  SuspendAutosave();
  SaveGame(() => {
    if (window.opener) {
      window.close();
    } else {
      window.location.href = "index.html#resume";
    }
  });
}


function HotOrNot() {
  // Figure out which spell is best
  if (Spells.length()) {
    var flat = 1;  // Flattening constant
    var best = 0, i;
    for (i = 1; i < Spells.length(); ++i) {
      if ((i+flat) * toArabic(Get(Spells,i)) >
          (best+flat) * toArabic(Get(Spells,best)))
        best = i;
    }
    game.bestspell = Spells.label(best) + ' ' + Get(Spells, best);
  } else {
    game.bestspell = '';
  }

  /// And which stat is best?
  best = 0;
  for (i = 1; i <= 5; ++i) {
    if (GetI(Stats,i) > GetI(Stats,best))
      best = i;
  }
  game.beststat = Stats.label(best) + ' ' + GetI(Stats, best);
}


function SaveGame(callback) {
  Log('Saving game: ' + GameSaveName());
  HotOrNot();
  game.date = ''+new Date();
  game.stamp = +new Date();
  game.seed = randseed();
  storage.addToRoster(game, callback);
}

function LoadGame(sheet) {
  if (!sheet) {
    alert("Error loading game");
    window.location.href = "index.html#resume";
    return;
  }

  var sealState = SaveSealState(sheet);   // before migrating changes it
  try {
    game = MigrateSave(sheet);
  } catch (err) {
    alert(err.message);
    window.location.href = "index.html#resume";
    return;
  }
  if (sealState == "bad") Brand("its save was edited outside the game", true);

  if (document) {
    var title = "Progress Quest Remix - " + GameSaveName();
    $("#title").text(title);
    if (iOS) title = GameSaveName();
    document.title = title;
  }

  randseed(game.seed);
  EnsureStory();
  $.each(AllBars.concat(AllLists), function (i, e) { e.load(game); });
  ShowStory();
  ShowProfile();
  ShowPurse();
  ShowGearPower();
  ShowCondition();
  ShowBuffs();
  ShowRecentEvent();
  ShowRetire();
  ShowLegacy();
  ShowFight(true);
  if (Kill)
    Kill.text(game.kill);
  ClearAllSelections();
  $.each([Plots,Quests], function () {
    this.CheckAll(true);
  });

  ShowBrand();
  CheckForCheating();
  Log('Loaded game: ' + game.Traits.Name);
  if (!game.elapsed)
    Brag('s');
  StartTimer();
}

// Mark the race/class attributes on the character sheet and show the
// martial/arcane split.
function ShowProfile() {
  if (!document) return;
  var p = CharProfile();
  $("#Stats tr").each(function () {
    var stat = Key(this);
    $(this).toggleClass("primary", p.primary.indexOf(stat) >= 0)
           .toggleClass("secondary", p.secondary.indexOf(stat) >= 0);
  });
  $("#Profile").text(ProfileSummary(p))
    .attr("title", "Race and class attributes. Primary (\u2605): " +
          (p.primary.join(", ") || "none") + ". Secondary (\u2606): " +
          (p.secondary.join(", ") || "none") + ".");
}

function GameSaveName() {
  if (!game.saveName) {
    game.saveName = Get(Traits, 'Name');
    if (game.online)
      game.saveName += ' [' + game.online.realm + ']';
  }
  return game.saveName;
}


function InputBox(message, def) {
  return prompt(message, def || '');
}

function ToDna(s) {
  s = s + "";
  var code = {
    '0': "AT",
    '1': "AG",
    '2': "AC",
    '3': "TA",
    '4': "TG",
    '5': "TC",
    '6': "GA",
    '7': "GT",
    '8': "GC",
    '9': "CA",
    ',': "CT",
    '.': "CG"
  };
  var r = "";
  for (var i = 0; i < s.length; ++i) {
    r += code[s[i]];
    if (i && (i % 4) == 0) r += " ";
  }
  return r;
}

window.onerror = function(message, source, lineno, colno, error) {
  $("#bsod_message").text(message);
  $("#bsod_source").text(source);
  $("#bsod_lineno").text(lineno);
  $("#bsod_colno").text(colno);
  $("#bsod_error").text(error && error.stack ? error.stack : '');

  $("#bsodmom").show();
};

function FormKeyDown(e) {
  $("#bsodmom").hide();

  // keydown also fires for shortcuts (Ctrl+S, Cmd+Q...) and auto-repeat,
  // which the old keypress handler never saw. Leave those to the browser.
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;

  if (e.key === 'd') {
    alert("Your character's genome is " + ToDna(game.dna + ""));
  }

  if (game.online) {
    if (e.key === 'b') {
      Brag('b', true);
    }

    if (e.key === 'g') {
      Guildify(InputBox('Choose a guild.\n\nMake sure you understand the guild rules before you join one. To learn more about guilds, visit http://progressquest.com/guilds.php\n', game.guild));
    }

    if (e.key === 'm') {
      let mot = InputBox('Declare your motto!', game.motto);
      if (mot !== null) {
        game.motto = mot;
        Brag('m', true);
      }
    }
  }

  if (e.key === 'c') {
    ToggleCombatLog();
  }

  if (e.key === 'n') {
    ToggleNarration();
  }

  if (e.key === 'e') {
    ToggleEventPopups();
  }

  if (e.key === 'p') {
    if (clock && clock.running) {
      $('#paused').css('display', 'block');
      StopTimer();
    } else {
      $('#paused').css('display', '');
      StartTimer();
    }
  }

  if (e.key === 'q') {
    quit();
  }

  if (e.key === 's') {
    SaveGame();
    alert('Saved (' + JSON.stringify(game).length + ' bytes).');
  }

  if (e.key === 'w') {
    if (window.opener) return;
    SuspendAutosave();  // we're about to save it anyway
    SaveGame(() => {
      let ext = window.open(window.location.href, "Progress Quest Remix",
        `resizable,width=${$("#main")[0].offsetWidth},height=${$("#main")[0].offsetHeight},popup,location=0`);
      if(ext && !ext.closed && typeof ext.closed !== 'undefined') {
        // popup was apparently not blocked
        window.location.href = "index.html#resume";  // this window can go back to the menu
      }
    });
  }

  /*
  if (e.key === 't') {
    TaskBar.reposition(TaskBar.Max());
  }
  */
}

function Navigate(url) {
  window.open(url);
}

function LFSR(pt, salt) {
  var result = salt;
  for (var k = 0; k < pt.length; ++k)
    result = (result << 1) ^ (1 & ((result >> 31) ^ (result >> 5))) ^ pt.charCodeAt(k);
  for (var kk = 0; kk < 10; ++kk)
    result = (result << 1) ^ (1 & ((result >> 31) ^ (result >> 5)));
  return result;
}

function StandardizeUrl(url) {
  // This shit fucks up some special characters. JQuery is going to do this anyway so
  // we need it standardized before we compute a validator.
  let a = document.createElement('a');
  a.href = url;
  return a.href;
  // TODO we could probably remove all those UrlEncode's before this is called
}

function Validator(url) {
  url = url.substr(url.indexOf("cmd="));
  return IntToStr(LFSR(url, game.online.passkey));
}

function Brag(trigger, andSeeIt) {
  SaveGame();

  if (game.online) {
    // game.bragtrigger = trigger;
    // $.post("webrag.php", game, function (data, textStatus, request) {
    //   if (data.alert)
    //     alert(data.alert);
    // }, "json");

    let url = game.online.host + 'cmd=b&t=' + trigger;
    for (let trait in game.Traits) {
      url += '&' + LowerCase(trait.substr(0,1)) + '=' + UrlEncode(game.Traits[trait]);
    }
    url += '&x=' + IntToStr(ExpBar.Position());
    url += '&i=' + UrlEncode(game.bestequip);
    url += '&z=' + UrlEncode(game.bestspell);
    url += '&k=' + UrlEncode(game.beststat);

    url += '&a=' + UrlEncode(game.bestplot);
    url += '&h=' + UrlEncode(game.online.realm);
    url += RevString;
    url = StandardizeUrl(url);
    url += '&p=' + Validator(url);
    url += '&m=' + UrlEncode(game.motto || '');

    $.ajax(url)
    .then(body => {
      if (LowerCase(Split(body,0)) == 'report') {
        alert(Split(body,1));
      } else if (andSeeIt) {
        Navigate(game.online.host + 'name=' + UrlEncode(Get(Traits,'Name')));
      }
    });
  }
}


function Guildify(guild) {
  if (!game.online) return;
  if (guild === null) return;  // input box cancelled

  game.guild = guild;

  let url = game.online.host + 'cmd=guild';
  for (let trait in game.Traits) {
    url += '&' + LowerCase(trait.substr(0,1)) + '=' + UrlEncode(game.Traits[trait]);
  }
  url += '&h=' + UrlEncode(game.online.realm);
  url += RevString;
  url += '&guild=' + UrlEncode(game.guild);
  url = StandardizeUrl(url);
  url += '&p=' + Validator(url);

  $.ajax(url)
  .then(body => {
    let parts = body.split('|');
    let s = parts.shift();
    if (s) alert(s);
    s = parts.shift();
    if (s) Navigate(s);
  });
}
