// Copyright (c)2002-2010 Eric Fredricksen <e@fredricksen.net> all rights reserved

var game = {};
var clock;

function timeGetTime() {
  return new Date().getTime();
}

function StartTimer() {
  if (!_heroHere) return;   // another tab is playing this hero (see PlayHere)
  if (!clock) {
    clock = new Worker('clock.js');
    clock.addEventListener('message', e => {
      // A tick the worker sent before it got 'stop' can still arrive after
      // StopTimer(); don't let it play on (or restart the clock)
      if (!clock.running) return;
      if (MissedTime()) return;
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

// Ticks come every 50 ms, and each counts at most 100 ms (so a hiccup
// doesn't skip a task). But a browser may slow a background tab's ticks, or
// freeze the tab, and a computer may sleep with the game open: then the
// time between ticks is lost. Not any more: a gap of up to
// K.CatchUp.MinSeconds is played through at once, a tenth of a second at a
// time; a longer one is caught up like time away with the game closed
// (CatchUp). Returns whether it took the tick.
function MissedTime() {
  var gap = timeGetTime() - clock.lasttick;
  if (gap <= 250) return false;   // (a slow tick: the 100 ms cap is fine)
  if (gap > K.CatchUp.MinSeconds * 1000 && K.CatchUp.MaxHours && !game.dead && !_catchingUp) {
    var since = Date.now() - gap;
    StopTimer();
    CatchUp(StartTimer, since);
    return true;
  }
  // play it now: Timer1Timer counts timeGetTime() - clock.lasttick, at most 100 ms
  var now = timeGetTime(), owed = gap, guard = 0;
  while (owed > 0 && clock.running && !game.dead && guard++ < 5000) {
    var step = Min(owed, 100), finishing = TaskBar.done();
    clock.lasttick = now - step;
    Timer1Timer();
    if (!finishing) owed -= step;   // (finishing a task takes no time)
  }
  if (clock.running) clock.lasttick = timeGetTime();
  return true;
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
  if (typeof JournalActEnd == "function") JournalActEnd(game.act, ending);
  if (game.act == 1 && typeof MeetRival == "function") MeetRival();   // (Act I's ending introduces them)
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
    return Pick(K.ImpressiveTitles) + ' ' + GenerateName() + ' of ' + KingdomName();
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

// Price of gear of a given power (by default, gear at your level)
function EquipPrice(power) {
  if (power === undefined) power = GetI(Traits,'Level');
  power = Max(0, power);
  return 5 * power * power + 10 * power + 20;
}

// What the shop charges this hero for it (the Cheapskate perk pays less)
function ShopPrice(power) {
  return Max(1, Math.round(EquipPrice(power) * MutatorProduct('shopMult')));
}

// Off to haggle for gear, if there's gold for it and the shop had anything
function WillShop() {
  return GetI(Inventory, 'Gold') > ShopPrice() && !game.shopped && !HasMutator('noShop');
}

function Dequeue() {
  while (TaskDone()) {
    ExpireBoons();
    if (Split(game.task,0) == 'kill') {
      if (FightWon()) {
        if (Split(game.task,3) == '*') {
          WinItem();
        } else if (Split(game.task,3)) {
          DropLoot(LowerCase(Split(game.task,1) + ' ' + Split(game.task,3)));
        }
      }
      FinishFight();
      // the Bestiary: the kind of monster (not a passing NPC), won or lost
      if (Split(game.task,3) != '*' && game.combat && game.combat.outcome != 'flee')
        CodexMonster(Split(game.task,1), FightWon());
      if (game.combat && game.combat.elite && !game.dead) EliteFought(game.combat);
      if (game.combat && !game.dead && typeof Gossip == "function")
        Gossip('fight', { outcome: game.combat.outcome, rounds: game.combat.rounds, elite: game.combat.elite,
                          kind: Split(game.task,1), loot: Split(game.task,3) == '*' ? '' : Split(game.task,3) });
      if (FightWon()) MaybeEvent('field', game.task);
    } else if (game.task == 'rest' || game.task == 'heal') {
      if (game.task == 'heal') PayTemple();
      RestoreHealth();
      if (game.task == 'rest') MaybeEvent('rest', 'rest');
      if (game.task == 'rest' && typeof Gossip == "function") Gossip('rest');
    } else if (game.task == 'heading') {
      MaybeEvent('road', 'heading');
      if (typeof Gossip == "function") Gossip('arrive');
    } else if (Split(game.task,0) == 'event') {
      FinishEvent();
    } else if (game.task == 'choice') {
      ResolveChoice();
    } else if (game.task == 'boss') {
      FinishFight();
      FinishBoss();
    } else if (game.task == 'buying') {
      // buy some equipment, if the shop has anything better
      var offer = ShopPower();
      if (WinEquip(offer, true)) {
        Add(Inventory,'Gold',-ShopPrice(offer));
      } else {
        game.shopped = true;  // nothing worth buying until next trip
      }
    } else if ((game.task == 'market') || (game.task == 'sell')) {
      if (game.task == 'market') {
        RestoreHealth();  // a night at the inn
        game.lastMarket = game.elapsed || 0;
        BankPurse();
        game.shopped = false;
        MaybeEvent('town', 'market');
        if (typeof Gossip == "function") Gossip('town');
      }
      if (game.task == 'sell') {
        var amt = GetI(Inventory, 1) * GetI(Traits,'Level');
        if (Pos(' of ', Inventory.label(1)) > 0)
          amt *= (1+RandomLow(10)) * (1+RandomLow(GetI(Traits,'Level')));
        amt = Math.round(amt * ChaFactor(K.Loot.PriceSlope, K.Loot.PriceMin, K.Loot.PriceMax) * MutatorProduct('goldMult'));
        Inventory.remove1();
        Add(Inventory, 'Gold', amt);
        game.goldEarned = (game.goldEarned || 0) + amt;
        CodexBump('gold', amt);
      }
      if (Inventory.length() > 1) {
        Inventory.scrollToTop();
        Task('Selling ' + Indefinite(Inventory.label(1), GetI(Inventory,1)),
             1 * 1000);
        game.task = 'sell';
        break;
      }
    }

    // a word from the entourage, maybe (only for show)
    var outcome = game.combat && Split(game.task,0) == 'kill' ? game.combat.outcome : null;
    CompanyChatter(outcome || (/^(heading|rest|market|sell|buying)$/.test(game.task) && !game.event &&
                               !game.queue.length ? 'idle' : null), game.combat);

    if (game.dead) return;   // Hardcore: nothing more to do
    var old = game.task;
    if (Split(old,0) == 'event') old = game.eventResume || '';
    game.task = '';
    if (game.perkDue && !game.event && !game.queue.length) OfferPerk();
    // Done shopping, and still rolling in gold? Spend some (K.Sinks)
    if (SplurgeDue(old) && !WillShop()) StartSplurge(old);
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
        if (a == 'scene') { Narrate(s); Announce(s); }
        if (last == 'ev' || last == 'event') RevealEventLine();
        if (last == 'event') game.task = 'event';
        if (last == 'victory') ShowFinaleDialog();
      } else if (a == 'boss') {
        game.queue.shift();
        BeginBoss();
      } else if (a == 'choice') {
        game.queue.shift();
        BeginChoice(n, s);
      } else {
        throw new Error('Unknown entry in the task queue: ' + game.queue[0]);
      }
    } else if (EncumBar.done() || MarketDue()) {
      Task('Heading to market to sell viscera-covered loot', Math.round(4000 * MutatorProduct('travelMult')));
      game.task = 'market';
    } else if ((Pos('kill|',old) <= 0) && (old != 'heading') && (old != 'rest')) {
      if (WillShop()) {
        Task('Haggling over the price of better equipment', 5 * 1000);
        game.task = 'buying';
      } else {
        Task('Heading to the Killing Fields™', Math.round(4000 * MutatorProduct('travelMult')));
        game.task = 'heading';
      }
    } else if (FinaleDue()) {
      StartFinale();   // queues the cinematic and the fight; picked up next time round
    } else if (NeedsRest()) {
      // A heal spell gets you back on your feet twice as fast
      var heals = MutatorProduct('castMult') ? game.Spells.filter(function (sp) { return SpellType(sp[0]) == 'heal'; }) : [];
      if (heals.length) {
        Task('Casting ' + Pick(heals)[0] + ' on yourself', RestTime() / 2);
      } else {
        Task('Catching your breath', RestTime());
      }
      game.task = 'rest';
    } else {
      var nn = GetI(Traits, 'Level');
      // After a defeat, a sensible hero picks easier fights for a while
      var t = MonsterTask(Max(1, nn - Math.floor(game.caution || 0) + Tactic('fights').levels));
      var InventoryLabelAlsoGameStyleTag = 3;
      nn = Math.floor((2 * InventoryLabelAlsoGameStyleTag * t.level * 1000) / nn);
      // The fight is settled now; the task bar just plays it out. Harder
      // fights (more rounds) take longer to watch.
      var seed = Random(0x7fffffff);
      var elite = EliteFor(t, seed);   // now and then, a named elite (K.Elite)
      if (elite) {
        RestoreHealth();               // (seen coming: the hero steels themselves)
        // and a fresh seed for the fight: the one that picked an elite is
        // a rare one, and the fight's dice would lean the same way
        seed = Random(0x7fffffff);
      }
      var hero = HeroSnapshot();
      if (elite) nn = Math.floor(nn * elite.level / Max(1, t.level));
      var fight = ResolveCombat(hero, elite ? elite.foe : t.foe, seed);
      fight.wounded = hero.wounded;   // (for Hardcore's death roll)
      fight.foe = elite ? elite.name : t.foe.name;
      fight.foeLevel = elite ? elite.level : t.foe.level;
      fight.qty = elite ? 1 : t.foe.qty;
      fight.xp = nn / 1000 * (Tactic('fights').xp || 1) * MutatorProduct('xp');   // tactics pay for risk
      if (elite) {
        fight.xp *= K.Elite.XP;
        fight.elite = { name: elite.name, kind: elite.kind, epithet: elite.epithet, level: elite.level };
      }
      game.combat = fight;
      Task('Executing ' + (elite ? elite.name + ', an elite ' + elite.kind : t.description),
           Math.round(nn * FightLength(fight)));
    }
  }
}


// ---- Combat glue ------------------------------------------------------

// ---- Elites and their uniques (K.Elite in combat.js) ------------------------

// Is this fight an elite? From the fight's seed (no dice of the game's): 1
// in K.Elite.Odds. Never a passing NPC, a group, or a low-level
// hero. Returns { name, kind, epithet, level, foe } or null.
function EliteFor(t, seed) {
  if (!K.Elite || new Alea("elite", seed)() * K.Elite.Odds >= 1) return null;
  if (Split(game.task,3) == '*' || GetI(Traits,'Level') < K.Elite.MinLevel) return null;
  var kind = Split(game.task,1);
  // as tough as the fight the hero picked (a group's worth, for a group),
  // plus K.Elite.LevelsAbove
  var level = (t.foe.qty > 1 ? Min(t.level, GetI(Traits,'Level')) : t.foe.level) + K.Elite.LevelsAbove;
  var epithet = Pick(K.Elite.Epithets);
  var name = GenerateName() + ' the ' + epithet + ', ' + Pick(K.Elite.Titles) + ' of ' + KingdomName();
  return { name: name, kind: kind, epithet: epithet, level: level,
           foe: { name: name, level: level, qty: 1, hpMult: K.Elite.HP, elite: true,
                  maxRounds: Math.round(K.Combat.MaxRounds * K.Elite.HP) } };
}

// An elite fight is over (won, lost or fled): a win takes its unique
function EliteFought(fight) {
  var e = fight.elite;
  if (fight.eliteDone) return;
  fight.eliteDone = true;
  var won = fight.outcome == 'win' || fight.outcome == 'close';
  var item = won ? WinUnique(e) : null;
  game.elites = (game.elites || 0) + (won ? 1 : 0);
  Log((won ? 'Slew ' : 'Fought ') + e.name + (item ? ' and took ' + item.name : ''));
  if (won) CodexElite(e, item, fight.foeLevel);
  if (typeof JournalElite == "function") JournalElite(fight, item);
  if (typeof Gossip == "function") Gossip('elite', { elite: e, item: item });
  Announce("An elite! " + e.name + ", an elite " + e.kind + ", " + (won ? "falls. You take " + item.name + "." :
           fight.outcome == 'flee' ? "chases you off." : "beats you."), true);
  // Shown like an event: it's news
  game.recentEvent = { key: 'elite', where: 'elite', at: game.elapsed || 0,
    lines: [e.name + ', an elite ' + e.kind + ', ' + (won ? 'falls before you' : fight.outcome == 'flee' ? 'chases you off' : 'beats you senseless')],
    result: item ? ['Took ' + item.name + ' (' + item.slot + ', power ' + item.power + ')'] : [] };
  ShowRecentEvent();
  ShowEventPopup(true);
}

// The elite's unique: gear named for it, better than anything the shop
// sells, for your weakest slot. game.uniques remembers the ones won.
function WinUnique(e) {
  var weakest = [], low = Infinity;
  $.each(K.Equips, function (i, slot) {
    var p = SlotPower(slot);
    if (p < low) { low = p; weakest = [i]; }
    else if (p == low) weakest.push(i);
  });
  var posn = Pick(weakest), slot = K.Equips[posn];
  var power = Max(GetI(Traits,'Level') + K.Elite.GearBonus + Random(K.Elite.GearSpread), low + 1);
  var stuff = !posn ? K.Weapons : posn == 1 ? K.Shields : K.Armors;
  var owner = Split(e.name, 0, ' ');
  var name = owner + (/s$/.test(owner) ? "'" : "'s") + ' ' + e.epithet + ' ' + Split(LPick(stuff, power), 0);
  if (!game.EquipPower) game.EquipPower = {};
  game.EquipPower[slot] = power;
  Put(Equips, posn, name);
  game.bestequip = name + (posn > 1 ? ' ' + Equips.label(posn) : '');
  var item = { name: name, slot: slot, power: power, from: e.name, kind: e.kind, level: GetI(Traits,'Level') };
  game.uniques = (game.uniques || []).concat([item]).slice(-50);
  ShowGearPower();
  return item;
}

// Is this the unique still worn in that slot?
function UniqueIn(slot) {
  var worn = Get(Equips, slot), list = game.uniques || [];
  for (var i = list.length - 1; i >= 0; --i)
    if (list[i].slot == slot && list[i].name == worn) return list[i];
  return null;
}

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
    castMult: Tactic('spells').castMult * MutatorProduct('castMult'),
    damageMult: MutatorProduct('damageMult'),
    giveUpMult: MutatorProduct('giveUpMult'),
    takenMult: MutatorProduct('takenMult'),
    initiativeMult: MutatorProduct('initiativeMult'),
    fleeMult: MutatorProduct('fleeMult'),
    healMult: MutatorProduct('healMult'),
    ally: Henchman(),
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
  if (PQDebug) $.each(fight.log, function (i, line) { Log(line); });

  if (game.wounded > 0) { --game.wounded; ShowCondition(); }
  if (fight.outcome == 'win' || fight.outcome == 'close')
    game.caution = Max(0, (game.caution || 0) - K.Defeat.CautionDecay);
  if (fight.outcome == 'win' || fight.outcome == 'close') {
    game.wins = (game.wins || 0) + 1;
    game.streak = (game.streak || 0) + 1;
    CodexBump('wins', 1);
  } else {
    game.streak = 0;   // a defeat or running away ends a winning streak
  }

  if (fight.outcome == 'defeat') {
    // Hardcore: this defeat may be the last
    if (game.mode == 'hardcore') {
      fight.deathChance = DeathChance(fight);
      if (Random(1000000) < fight.deathChance * 1000000) {
        fight.done = true;
        Die(fight);
        return;
      }
    }
    Defeated(fight);
  } else {
    if (fight.outcome == 'flee')
      game.queue.push('task|2|Running away from ' + fight.foe + ' as fast as you can');
    var regen = CombatRegen(HeroSnapshot()), more = MutatorProduct('regenMult');
    HPBar.increment(Math.round(regen.hp * more));
    MPBar.increment(Math.round(regen.mp * more));
  }
  fight.done = true;
  ShowFight();
}

// ---- Hardcore ---------------------------------------------------------------
//
// One life (game.mode 'hardcore', chosen in the main menu's Challenge
// Modes). Each defeat may be fatal (K.Hardcore in combat.js); the roll uses
// the game's seeded random numbers, so reloading doesn't change it. A dead
// hero gets an obituary in the Hall of the Fallen and leaves the roster.

function DeathChance(fight) {
  var H = K.Hardcore;
  var p = H.DeathChance;
  if (fight.wounded) p *= H.WoundedMult;
  var above = (fight.foeLevel || 0) - GetI(Traits,'Level');
  if (above > 0) p *= Math.pow(H.TougherMult, above);
  if (fight.boss) p *= H.BossMult;
  return Min(H.DeathMax, p * MutatorProduct('deathMult'));
}

function Percent(p) {
  var pct = p * 100;
  return (pct < 1 ? pct.toFixed(2).replace(/0$/, '') : pct < 10 ? pct.toFixed(1) : Math.round(pct)) + '%';
}

function Die(fight) {
  var obit = MakeObituary(fight);
  if (typeof JournalDeath == "function") JournalDeath(obit.cause);   // (the tombstone has a Journal button)
  if (typeof Gossip == "function") Gossip('death', { cause: obit.cause });
  Announce("Your hero has died: " + obit.cause + ".", true);
  game.dead = obit;
  game.queue.length = 0;
  if (game.daily && !game.daily.status) SettleDaily('died');
  if (storage.noteHardcore) storage.noteHardcore(game);   // the ledger remembers
  HPBar.reposition(0);
  Log('Died: ' + obit.cause);
  if (!document) return;   // (the simulator just records it)
  StopTimer();
  SuspendAutosave();
  StopChoiceAlert();
  CloseEventPopup();
  Narrate(obit.headline + ". " + obit.cause + ". " + (obit.lastWords ? "Last words: " + obit.lastWords : ""));
  storage.addFallen(obit, function () {
    storage.deleteHero(HeroId(game), function () { ShowDeath(obit); });
  });
}

// What the Hall of the Fallen remembers
function MakeObituary(fight) {
  var level = GetI(Traits,'Level');
  var foe = fight.foe || 'something';
  var story = game.story && game.story.act == game.act ? game.story : null;
  var vars = { hero: Get(Traits,'Name'), foe: foe, level: level,
               race: Get(Traits,'Race'), klass: Get(Traits,'Class'),
               boring: BoringItem(), act: game.bestplot || 'Prologue' };
  var O = K.Obituary || { lastWords: [], epitaphs: [] };
  var prologue = StoryFor(0);
  var obit = {
    id: Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36),
    name: Get(Traits,'Name'),
    race: Get(Traits,'Race'),
    klass: Get(Traits,'Class'),
    level: level,
    mode: game.mode || 'hardcore',
    born: game.birthday || '',
    birthstamp: game.birthstamp || 0,
    died: new Date().toISOString(),
    played: Math.round(game.elapsed || 0),
    survived: game.deaths || 0,            // defeats lived through
    slainBy: foe,
    slainLevel: fight.foeLevel || level,
    boss: !!fight.boss,
    chance: fight.deathChance || 0,
    act: game.bestplot || 'Prologue',
    story: story ? story.title : '',
    legacy: game.legacy ? (game.legacy.races || []).length + (game.legacy.klasses || []).length : 0,
    taunt: (prologue && prologue.taunt) || '',
    headline: 'Here lies ' + Get(Traits,'Name') + ', level ' + level + ' ' + Get(Traits,'Race') + ' ' + Get(Traits,'Class'),
    cause: (fight.boss ? 'Slain by the Old Bastard\u2122 himself' : 'Slain by ' + foe) + ' at level ' + level,
    lastWords: O.lastWords.length ? StoryText(Pick(O.lastWords), vars) : '',
    epitaph: O.epitaphs.length ? StoryText(Pick(O.epitaphs), vars) : '',
    cheater: game.cheater ? game.cheater.reason : null
  };
  // their character sheet as it was (the Hall of the Fallen links to it:
  // FallenSheet). (transfer.js isn't loaded in the simulator.)
  if (typeof SharePayload == "function") obit.sheet = SharePayload(game, { died: obit.died, cause: obit.cause });
  return obit;
}

// The tombstone
function ShowDeath(obit) {
  if (!document) return;
  $("#main").addClass("dead");
  var dlg = document.getElementById("DeathDialog");
  if (!dlg) return;
  $("#DeathHeadline").text(obit.headline);
  var when = /^Prologue/.test(obit.act) ? "the Prologue" :
             obit.story && obit.act.indexOf(obit.story) < 0 ? obit.act + ": " + obit.story : obit.act;
  $("#DeathCause").text(obit.cause + ", during " + when + ".");
  $("#DeathStats").text("Played " + RoughTime(obit.played) + " and lived through " + obit.survived +
    (obit.survived == 1 ? " defeat" : " defeats") + ". This one had a " + Percent(obit.chance) + " chance of being fatal." +
    (obit.legacy ? " Carried the legacy of " + obit.legacy + (obit.legacy == 1 ? " legend." : " legends.") : ""));
  $("#DeathWords").text(obit.lastWords ? "Last words: \u201c" + obit.lastWords + "\u201d" : "");
  $("#DeathEpitaph").text(obit.epitaph);
  if (!dlg.open) dlg.showModal();
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
  vars.raceending = FinaleEnding(K.FinaleRaceEndings, Get(Traits,'Race'));
  vars.classending = FinaleEnding(K.FinaleClassEndings, Get(Traits,'Class'));
  // (a race or class without a line of its own just skips it)
  var lines = (K.FinaleStory[part] || []).filter(function (line) {
    return !/^\{(race|class)ending\}$/.test(line) || vars[line.slice(1, -1)];
  });
  $.each(lines, function (i, line) {
    var text = ProperName(StoryText(line, vars)).replace(/\|/g, '/');
    game.queue.push('scene|4|' + text + (marker && i == lines.length - 1 ? '|' + marker : ''));
  });
}

// The victory line for this race or class (K.FinaleRaceEndings and
// K.FinaleClassEndings in story.js), or ""
function FinaleEnding(list, name) {
  return (list && list[name]) || "";
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
  var hero = HeroSnapshot();
  var fight = ResolveCombat(hero, foe, Random(0x7fffffff));
  fight.wounded = hero.wounded;
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
  if (game.dead) return;
  var fight = game.combat || {};
  var f = game.finale = game.finale || { state: 'pending', tries: 1 };
  if (fight.outcome == 'win' || fight.outcome == 'close') {
    f.state = 'won';
    f.wonAt = game.elapsed || 0;
    f.wonLevel = GetI(Traits,'Level');
    Log('Defeated the Old Bastard\u2122 after ' + f.tries + (f.tries == 1 ? ' try' : ' tries'));
    if (typeof JournalFinale == "function") JournalFinale(true, f.tries);
    if (typeof Gossip == "function") Gossip('finale', { won: true });
    CodexFlag('boss');
    if (f.tries == 1) CodexFlag('bossfirst');
    if (game.mode == 'hardcore') CodexFlag('bosshc');
    $.each(game.mutators || [], function (i, m) { CodexFlag('boss:' + m); });
    QueueFinale('victory', 'victory');
    ShowRetire();
    Brag('f');
  } else {
    f.nextTry = (game.elapsed || 0) + K.Boss.RetryMinutes * 60;
    if (typeof JournalFinale == "function") JournalFinale(false, f.tries);
    if (typeof Gossip == "function") Gossip('finale', { won: false });
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
  if (_catchingUp) { _catchingUp.finale = true; return; }   // shown after the summary
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
//   speed hacks): game time can only pass while the game is open, or be
//   made up for time it was closed (CatchUp), never more
// - for heroes created from save version 9 on, things a fair game can't
//   produce: levels faster than the XP allows, stats, HP/MP or gear far
//   beyond the level. The limits are several times what simulated heroes
//   (with a full New Game+ legacy) ever reach.
// (K.Guard, the limits, is in config.js)

var _guardSession = null;   // real time and game time when this page started

// later: the save happens as usual (while loading, the sheet isn't ready)
function Brand(reason, later) {
  if (!game || game.cheater) return;
  var level = game.Traits ? parseInt(game.Traits.Level, 10) || 0 : 0;
  game.cheater = { reason: reason, at: new Date().toISOString(), level: level };
  Log('Branded a cheater: ' + reason);
  if (typeof JournalBrand == "function") JournalBrand(reason);
  if (later) return;
  ShowBrand();
  if (document) SaveGame();
}

function ShowBrand() {
  if (!document) return;
  var c = game.cheater, u = !c && game.unverified;
  $("#CheaterBrand").text(c ? "Branded a cheater: " + c.reason + ". This hero can keep playing, " +
                              "but won't count for New Game+." :
                          u ? "Unverified: " + u + ". This hero plays as normal, but won't count for " +
                              "the Hall of Legends or New Game+." : "")
    .toggle(!!(c || u)).toggleClass("unverified", !!u);
  $("#main").toggleClass("branded", !!c);
}

// Typical gains are measured, not fixed: see K.Guard
function CheckForCheating() {
  if (!document || !game || game.cheater || _catchingUp) return;   // (checked once it's caught up)
  var G = K.Guard, now = Date.now(), elapsed = game.elapsed || 0;
  if (!_guardSession) _guardSession = { real: now, elapsed: elapsed };

  // Game time can't pass faster than real time, this session...
  var played = elapsed - _guardSession.elapsed, real = (now - _guardSession.real) / 1000;
  if (played > real * G.SpeedSlack + G.SpeedGrace)
    return Brand("the game ran faster than the clock");

  // The rest looks only at the save itself (transfer.js, which also checks
  // imported heroes with it)
  var failed = AuditSheet(game).filter(function (c) { return !c.ok; })[0];
  if (failed) return Brand(failed.reason);
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
    alignment: Get(Traits,'Alignment') || '',
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
    startLevel: game.startLevel || 1,
    mutators: game.mutators || [],
    runSeed: game.runSeed || '',
    daily: game.daily ? game.daily.date : null,
    cheater: game.cheater ? game.cheater.reason : null,
    unverified: game.unverified || null,
    // their character sheet as it was (the Hall links to it: LegendSheet)
    sheet: SharePayload(game, { retired: new Date().toISOString() })
  };
}

function AskRetire() {
  if (!document || !CanRetire()) return;
  var dlg = document.getElementById("RetireDialog");
  $("#RetireName").text(Get(Traits,'Name'));
  $("#RetireRace").text(Get(Traits,'Race'));
  $("#RetireClass").text(Get(Traits,'Class'));
  $("#FinaleDialog")[0].close();
  if (!dlg.open) dlg.showModal();
}

// Enshrine the hero, take them off the roster, and go to the Hall
function Retire() {
  if (!CanRetire()) return;
  CheckForCheating();   // a branded hero still retires, but won't count
  if (typeof JournalRetire == "function") JournalRetire();
  SuspendAutosave();   // or leaving the page would save them back
  StopTimer();
  game.retired = true;   // and nothing else saves them either (SaveGame)
  var legend = MakeLegend();
  storage.addLegend(legend, function () {
    storage.deleteHero(HeroId(game), function () {
      window.location.href = "index.html#hall/" + legend.id;
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

// For screen readers: read a line out (the live regions in main.html).
// urgent: interrupt (a choice waiting, a death). Not while catching up: that's
// hours of it at once, summed up at the end.
function Announce(text, urgent) {
  if (!document || _catchingUp || !text) return;
  if (typeof ScreenReaderOn == "function" && !ScreenReaderOn()) return;
  var el = document.getElementById(urgent ? "A11yAlert" : "A11yStatus");
  if (!el) return;
  el.textContent = "";   // (so the same words twice are read twice)
  setTimeout(function () { el.textContent = String(text).replace(/\u2122/g, ""); }, 30);
}

function Narrate(text) {
  if (!document || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  if (_catchingUp) return;   // hours of it, all at once: no
  if (!NarrationOn()) return;
  if (_narrationQueued > 12) return;   // don't pile up hours of backlog
  var speech = String(text)
    .replace(/\u2122/g, '')                 // ™
    .replace(/\.\.\.+$/, '')
    .replace(/[\u201c\u201d]/g, '"');
  var u = new SpeechSynthesisUtterance(speech);
  u.rate = 1;
  if (typeof ApplyVoice == "function") ApplyVoice(u);   // (the voice, speed and volume from Settings)
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
  if (Random(1000) >= Min(1, (K.EventChance[where] || 0) * MutatorProduct('eventMult')) * 1000) return;
  var level = GetI(Traits,'Level');
  var choices = K.Events.filter(function (e) {
    return e.where.indexOf(where) >= 0 &&
      (!e.minLevel || level >= e.minLevel) && (!e.maxLevel || level <= e.maxLevel) &&
      (!e.race || e.race == Get(Traits,'Race')) && (!e.klass || e.klass == Get(Traits,'Class')) &&
      (!e.sink || !!LiveBoon(e.sink)) &&   // (only with what the gold bought: K.SinkCompany)
      (!e.rival || (typeof RivalMet == "function" && RivalMet()));   // (only once you've met your rival)
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
  if (event.sink) vars.who = BoonWho(LiveBoon(event.sink));
  var instance = EventAmounts(effect, level, { key: event.key, effect: effect });
  if (instance.gold) vars.gold = instance.gold;
  if (instance.loot) vars.loot = Indefinite(instance.loot, 1);
  // A choice event: each option gets its own amounts and lines
  if (event.choices && event.choices.length) {
    instance.choices = event.choices.map(function (c) {
      var o = EventAmounts(c.effect || {}, level, { effect: c.effect || {} });
      var ov = Object.assign({}, vars);
      if (o.gold) { ov.gold = o.gold; if (vars.gold === undefined) vars.gold = o.gold; }
      if (o.loot) { ov.loot = Indefinite(o.loot, 1); if (vars.loot === undefined) vars.loot = ov.loot; }
      o.label = ProperName(StoryText(c.label, ov));
      o.lines = (c.lines || []).map(function (line) { return EventLine(line, ov); });
      return o;
    });
  }
  game.event = instance;
  game.eventResume = resume;
  game.lastEvent = game.tasks;
  instance.where = where;
  instance.shown = 0;
  instance.lines = event.lines.map(function (line) { return EventLine(line, vars); });
  CodexEvent(event.key, instance.lines[0]);
  // One task per line. Each line is shown (RevealEventLine) as its task
  // starts; 'event' marks the last one, after which the effect is applied.
  // A choice event asks its question after its lines (BeginChoice), and the
  // chosen option's lines follow.
  var asking = !!instance.choices;
  $.each(instance.lines, function (i, text) {
    game.queue.push('scene|3|' + text + '|' + (i == instance.lines.length - 1 && !asking ? 'event' : 'ev'));
  });
  if (asking) {
    instance.ask = EventLine(event.ask || 'What do you do?', vars);
    instance.askAt = instance.lines.length;
    game.queue.push('choice|' + K.ChoiceSeconds + '|' + instance.ask);
  }
}

function EventLine(line, vars) {
  return ProperName(StoryText(line, vars)).replace(/([^.])\.$/, '$1').replace(/\|/g, '/');
}

// How much gold, and which item, an effect gives (into an object)
function EventAmounts(fx, level, into) {
  if (fx.gold)
    into.gold = Max(1, Math.round(Abs(fx.gold) * level * (0.5 + Random(100) / 100)));
  if (fx.item)
    into.loot = fx.item == 'special' ? SpecialItem() : BoringItem();
  return into;
}

// ---- Tactics ----------------------------------------------------------------
//
// Standing orders from the Tactics panel (K.Tactics in combat.js). They
// apply from the next fight on, and each change is logged with the
// choices (game.choiceLog) for replays.

function Tactic(name) {
  var group = K.Tactics[name], want = (game.tactics && game.tactics[name]) || 'normal';
  for (var i = 0; i < group.options.length; ++i)
    if (group.options[i].key == want) return group.options[i];
  for (i = 0; i < group.options.length; ++i)
    if (group.options[i].key == 'normal') return group.options[i];
  return group.options[0];
}

function SetTactic(name, key) {
  game.tactics = game.tactics || {};
  if (game.tactics[name] == key) return;
  game.tactics[name] = key;
  LogInput({ t: game.tasks, tactic: name, value: key });
  Log('Tactics: ' + K.Tactics[name].label + ' ' + Tactic(name).label);
  ShowTactics();
}

// Every choice and tactics change goes in game.choiceLog, so the hero's
// game can be replayed (replay.js). Past K.Replay.MaxInputs, the next task
// starts a new stretch of replay (AnchorReplay), and the older ones go.
function LogInput(entry) {
  var log = game.choiceLog = game.choiceLog || [];
  log.push(entry);
  if (log.length > K.Replay.MaxInputs && game.replay && !_anchorWanted)
    _anchorWanted = { why: 'inputs', fp: game.replay.fp };
}

// The Tactics link says what is set, if anything is not Normal
function ShowTactics() {
  if (!document) return;
  var set = [];
  $.each(K.Tactics, function (name, group) {
    var t = Tactic(name);
    if (t.key != 'normal') set.push(t.label);
  });
  $("#TacticsLink").text(set.length ? "Tactics: " + set.join(", ") : "Tactics")
    .attr("title", "Standing orders for your hero (T)");
  // the panel, if open
  $.each(K.Tactics, function (name) {
    var t = Tactic(name);
    $("#Tactics input[name=tactic-" + name + "][value=" + t.key + "]").prop("checked", true);
    $("#Tactics .help-" + name).text(t.help);
  });
}

function OpenTactics() {
  if (!document) return;
  var dlg = document.getElementById("TacticsDialog");
  if (!dlg) return;
  var box = $("#Tactics");
  if (!box.children().length) {
    $.each(K.Tactics, function (name, group) {
      var row = $("<fieldset class='tactic'>").appendTo(box);
      $("<legend>").text(group.label).appendTo(row);
      var opts = $("<div class='tactic-options'>").appendTo(row);
      $.each(group.options, function (i, o) {
        var id = "tactic-" + name + "-" + o.key;
        $("<label>").attr("for", id).append(
          $("<input type='radio'>").attr({ id: id, name: "tactic-" + name, value: o.key }),
          document.createTextNode(" " + o.label)).appendTo(opts);
      });
      $("<div class='tactic-help'>").addClass("help-" + name).appendTo(row);
      opts.on("change", "input", function () { SetTactic(name, this.value); });
    });
  }
  ShowTactics();
  if (!dlg.open) dlg.showModal();
}

// ---- Choices ----------------------------------------------------------------
//
// Now and then an event asks a question (K.Events entries with choices).
// The narrator reads it out, the tab title flashes, and the pop-up and the
// Last Event box show the options (or press 1, 2, 3). Nobody there after
// K.ChoiceSeconds? Fate picks one at random and the game moves on.
//
// The random pick is drawn whether or not someone chose, so the game's
// random numbers run the same either way, and every pick is logged
// (game.choiceLog), so a seeded daily challenge can be replayed.

function ChoicePending() {
  return game.task == 'choice' && !!game.event && !!game.event.pending;
}

function BeginChoice(seconds, caption) {
  var ev = game.event;
  if (!ev || !ev.choices) return;   // nothing to ask (an older save)
  ev.pending = true;
  ev.picked = null;
  Task('Deciding: ' + caption, seconds * 1000);
  game.task = 'choice';
  SyncRecentEvent();
  ShowEventPopup(false);
  Narrate("Decision time! " + caption + " " + OptionsSentence(ev.choices) + "?");
  Announce("Decision time: " + caption + " " + ev.choices.map(function (c, i) { return (i + 1) + ": " + c.label; }).join(". ") +
           ". Press a number, or fate decides in " + seconds + " seconds. P pauses the clock.", true);
  StartChoiceAlert();
}

// "Pay the toll, fight the troll, or ford the river"
function OptionsSentence(choices) {
  var labels = choices.map(function (c) { return c.label; });
  if (labels.length < 2) return labels.join('');
  return labels.slice(0, -1).join(', ') + (labels.length > 2 ? ',' : '') + ' or ' + labels[labels.length - 1];
}

// The player picked option i: finish the waiting task now
function PickChoice(i) {
  var ev = game.event;
  if (!ChoicePending() || i < 0 || i >= ev.choices.length) return;
  ev.picked = i;
  ev.pending = false;
  // the task ends now, counting only the time actually spent deciding
  var pos = TaskBar.Position();
  TaskBar.reset(Max(1, pos), pos);
  SyncRecentEvent();
  ShowEventPopup(false);
  StopChoiceAlert();
}

// The deciding task is over: use the player's pick, or fate's
function ResolveChoice() {
  var ev = game.event;
  StopChoiceAlert();
  if (!ev || !ev.choices) return;
  var n = ev.choices.length;
  var fate = Random(n);   // always drawn, so the random numbers don't depend on who chose
  var mine = ev.picked !== null && ev.picked !== undefined && ev.picked >= 0 && ev.picked < n;
  ev.chosen = mine ? ev.picked : fate;
  ev.by = mine ? 'you' : 'fate';
  ev.pending = false;
  // (a pick of yours ended the deciding task early: ms is how long it took)
  LogInput(mine ? { t: game.tasks, event: ev.key, pick: ev.chosen, by: ev.by, ms: TaskBar.Max() }
                : { t: game.tasks, event: ev.key, pick: ev.chosen, by: ev.by });
  if (!ev.perk) CodexChoice(ev.key, ev.chosen, ev.by);   // (a perk isn't an event, for the Codex)
  var o = ev.choices[ev.chosen];
  var lines = o.lines && o.lines.length ? o.lines : ['You decide: ' + o.label];
  var first = ev.lines.length;
  ev.lines = ev.lines.concat(lines);
  $.each(lines, function (i, text) {
    game.queue.push('scene|3|' + text + '|' + (first + i == ev.lines.length - 1 ? 'event' : 'ev'));
  });
  SyncRecentEvent();
  ShowEventPopup(false);
}

// Flash the tab title while a choice waits, for whoever is in another tab
var _titleAlert = null, _titleSaved = null;
function StartChoiceAlert() {
  if (!document || _catchingUp) return;
  if (typeof ChoiceAlertOn == "function" && !ChoiceAlertOn()) return;   // (Settings)
  StopChoiceAlert();
  _titleSaved = document.title;
  var on = false;
  _titleAlert = setInterval(function () {
    on = !on;
    document.title = on ? "\u26a0 Your hero needs you!" : _titleSaved;
  }, 1000);
}

function StopChoiceAlert() {
  if (!document) return;
  if (_titleAlert) clearInterval(_titleAlert);
  _titleAlert = null;
  if (_titleSaved) document.title = _titleSaved;
  _titleSaved = null;
}

// "Deciding for you in 12s", as the task bar runs down
function ShowChoiceTimer() {
  if (!document || !ChoicePending()) return;
  var left = Math.ceil((TaskBar.Max() - TaskBar.Position()) / 1000);
  $(".choice-timer").text("Fate decides in " + Max(0, left) + "s");
}

// The event's last line has played: apply what it does, and note what
// happened for the pop-up and the "Last event" box.
function FinishEvent() {
  var ev = game.event;
  game.event = null;
  if (!ev) return;
  var result = [];
  if (ev.sink) ApplySink(ev, result);
  if (ev.choices && ev.chosen !== null && ev.chosen !== undefined) {
    var o = ev.choices[ev.chosen];
    ApplyEventEffect(o.effect || {}, o, result);
  }
  ApplyEventEffect(ev.effect || {}, ev, result);
  Log('Event: ' + ev.key);
  if (typeof JournalEvent == "function") JournalEvent(ev, result);
  if (ev.sink && typeof JournalSplurge == "function") JournalSplurge(ev);
  if (typeof Gossip == "function" && !ev.perk) {
    var bought = ev.sink ? SinkByKey(ev.sink) : null;
    if (ev.sink) Gossip('splurge', { sink: ev.sink, thing: bought ? bought.label : 'something', gold: ev.gold });
    else Gossip('event', ev);
  }

  var shown = game.recentEvent;
  if (!shown || shown.key != ev.key || shown.result.length)
    shown = game.recentEvent = { key: ev.key, where: ev.where, lines: ev.lines || [],
                                 at: game.elapsed || 0 };
  shown.lines = ev.lines || shown.lines;
  shown.result = result;
  ShowRecentEvent();
  ShowEventPopup(true);
}

// What an effect does, with its amounts (gold, loot) from amt
function ApplyEventEffect(fx, amt, result) {
  if (fx.gold > 0) {
    game.purse = (game.purse || 0) + amt.gold;
    ShowPurse();
    result.push('Found ' + amt.gold + ' gold');
  } else if (fx.gold < 0) {
    var fromPurse = Min(game.purse || 0, amt.gold);
    game.purse = (game.purse || 0) - fromPurse;
    var fromBank = Min(GetI(Inventory,'Gold'), amt.gold - fromPurse);
    if (fromBank) Add(Inventory, 'Gold', -fromBank);
    ShowPurse();
    result.push('Lost ' + (fromPurse + fromBank) + ' gold');
  }
  if (fx.item && amt.loot) {
    Add(Inventory, amt.loot, 1);
    result.push('Got ' + Indefinite(amt.loot, 1));
  }
  if (fx.stat) {
    var stat = fx.stat == 'random' ? Pick(K.PrimeStats) : fx.stat;
    var amount = AddBuff(stat);
    result.push('+' + amount + ' ' + stat + ' for ' + RoughTime(BuffSeconds()));
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
  if (fx.perk && AddPerk(fx.perk)) result.push('New perk: ' + PerkByKey(fx.perk).label);
}

// ---- Perks (K.Perks in combat.js) ----------------------------------------------
//
// One at creation; another offered at every K.PerkEvery levels up to
// K.PerkLast (combat.js), as a choice of three: like an event's choices, you pick (1, 2
// or 3, or click) or fate does, and the pick goes in the replay log.


function OfferPerk() {
  game.perkDue = Max(0, (game.perkDue || 0) - 1);
  var have = game.perks || [];
  var pool = K.Perks.filter(function (p) { return have.indexOf(p.key) < 0; });
  var options = [];
  while (options.length < 3 && pool.length) options.push(pool.splice(Random(pool.length), 1)[0]);
  if (!options.length) return;
  var level = GetI(Traits,'Level');
  var ev = { key: 'perk', perk: true, where: 'perk', effect: {}, shown: 0,
             lines: ['Level ' + level + '. You feel a new quirk coming on',
                     'Three of them, actually. Only one of them will stick'] };
  ev.choices = options.map(function (p) {
    return { label: PerkText(p), effect: { perk: p.key }, lines: [p.label + '. It is who you are now'] };
  });
  ev.ask = 'Which perk will it be?';
  ev.askAt = ev.lines.length;
  game.event = ev;
  game.eventResume = '';
  game.lastEvent = game.tasks;
  $.each(ev.lines, function (i, text) { game.queue.push('scene|3|' + text + '|ev'); });
  game.queue.push('choice|' + K.ChoiceSeconds + '|' + ev.ask);
}

// Returns whether it was new
function AddPerk(key) {
  var p = PerkByKey(key);
  if (!p) return false;
  game.perks = game.perks || [];
  if (game.perks.indexOf(key) >= 0) return false;
  game.perks.push(key);
  RefreshPools();   // the pools and the pack may change size
  Log('New perk: ' + p.label);
  if (typeof JournalPerk == "function") JournalPerk(p);
  ShowPerks();
  return true;
}

// "Perks: Pack Mule, Greedy" under the stats, the details on hover
function ShowPerks() {
  if (!document) return;
  var perks = Perks();
  $("#PerkLine").text(perks.length ? "Perks: " + perks.map(function (p) { return p.label; }).join(", ") : "")
    .attr("title", perks.map(PerkText).join("\n"));
}

// "Rival: Grezlaeg the Insufferable, level 13 (a level ahead)", once met
// (K.Rival in story.js)
function ShowRival() {
  if (!document) return;
  if (typeof RivalMet != "function" || !RivalMet()) { $("#RivalLine").text("").attr("title", null); return; }
  var mine = GetI(Traits,'Level'), theirs = RivalLevel();
  $("#RivalLine").text("Rival: " + RivalFull() + ", level " + theirs +
                       (theirs > mine ? " (a level ahead)" : theirs < mine ? " (a level behind)" : " (neck and neck)"))
    .attr("title", "The same race, class and alignment as you, racing you to the Old Bastard\u2122. " +
                   "They level up as fast as you do.");
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
  var until = (game.elapsed || 0) + BuffSeconds();
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

// How long a buff lasts (the Party Animal perk: longer)
function BuffSeconds() {
  return Math.round(K.BuffMinutes * 60 * MutatorProduct('buffMult'));
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

// ---- Mutators (K.Mutators in combat.js) -------------------------------------

function Mutators() {
  return (game.mutators || []).map(function (key) {
    for (var i = 0; i < K.Mutators.length; ++i) if (K.Mutators[i].key == key) return K.Mutators[i];
    return null;
  }).filter(Boolean);
}

// Everything that changes the rules for this hero: the run's mutators, the
// hero's perks (K.Perks in combat.js) and what their gold has bought
// (boons: K.Sinks in events.js). Asked for many times a fight, so it's kept
// until the hero, or any of those, change.
var _modifiers = { key: null, list: null, products: {} };
function Modifiers() {
  var key = (game.lifeId || '') + '|' + (game.perks || []).join(',') + '|' + (game.mutators || []).join(',') +
            '|' + (game.boons || []).map(function (b) { return b.k + (b.c || 1); }).join(',');
  if (_modifiers.key !== key) _modifiers = { key: key, list: Mutators().concat(Perks(), BoonModifiers()), products: {} };
  return _modifiers.list;
}

function Perks() {
  return (game.perks || []).map(PerkByKey).filter(Boolean);
}

function HasMutator(prop) {
  return Modifiers().some(function (m) { return !!m[prop]; });
}

// The product of a numeric property over this hero's mutators (1 if none)
function MutatorProduct(prop) {
  var list = Modifiers(), cache = _modifiers.products;
  if (cache[prop] !== undefined) return cache[prop];
  var p = 1;
  list.forEach(function (m) { if (typeof m[prop] == 'number') p *= m[prop]; });
  return cache[prop] = p;
}

function CarryMax() {
  return Max(5, Math.round(CarryFor(GetI(Stats,'STR')) * MutatorProduct('carryMult')));
}

// HP, MP and the pack, after what changes them has changed
function RefreshPools() {
  HPBar.reset(PoolMax('HP Max'), Min(HPBar.Position(), PoolMax('HP Max')));
  MPBar.reset(PoolMax('MP Max'), Min(MPBar.Position(), PoolMax('MP Max')));
  EncumBar.reset(CarryMax(), EncumBar.Position());
}

// ---- Gold sinks (K.Sink and K.Sinks in events.js) -----------------------------
//
// A hero who has piled up more gold than the shops can soak up spends some
// of it, after shopping, on something at random: a henchman, a horse, a
// tavern, taxes. It plays like an event (game.event, with sink: its key).
// What lasts is a boon: game.boons, a list of { k: the sink's key, n: its
// name, until: game seconds (0: for good), c: times bought, e: the line
// when it wears off }. A boon's perk properties count like a perk's.

function SinkByKey(key) {
  for (var i = 0; i < K.Sinks.length; ++i) if (K.Sinks[i].key == key) return K.Sinks[i];
  return null;
}

// The best gear the shop sells, at the price this hero pays
function PremiumPrice() {
  return ShopPrice(GetI(Traits,'Level') + K.Loot.PremiumMax);
}

// Banked gold to spare: beyond K.Sink.Keep times the price of premium gear
function SpareGold() {
  return Max(0, GetI(Inventory,'Gold') - Math.round(K.Sink.Keep * PremiumPrice()));
}

// Time to splurge? In town, between tasks, now and then, with a hoard.
// old: the task just done.
function SplurgeDue(old) {
  if (!K.Sinks || game.event || game.queue.length || game.dead) return false;
  if (old != 'market' && old != 'sell' && old != 'buying') return false;
  if (GetI(Traits,'Level') < K.Sink.MinLevel) return false;
  if (game.lastSplurge !== undefined &&
      (game.elapsed || 0) - game.lastSplurge < K.Sink.CooldownHours * 3600) return false;
  return SpareGold() >= K.Sink.Hoard * PremiumPrice() * MutatorProduct('hoardMult');
}

// Spend some gold on one of K.Sinks, at random (only: that one, for tests).
// resume: the task to carry on from. Returns whether it started.
function StartSplurge(resume, only) {
  var level = GetI(Traits,'Level');
  var choices = K.Sinks.filter(function (sk) {
    if (only) return sk.key == only;
    if (sk.minLevel && level < sk.minLevel) return false;
    if (sk.shop && HasMutator('noShop')) return false;   // (the shops won't serve Hand-me-downs)
    var have = sk.boon && !sk.boon.hours ? BoonByKey(sk.key) : null;   // bought for good already?
    return !have || (have.c || 1) < (sk.boon.stack || 1);
  });
  if (!choices.length) return false;
  var total = 0;
  $.each(choices, function (i, sk) { total += sk.weight || 1; });
  var r = Random(1000) / 1000 * total, sink = choices[choices.length - 1];
  for (var i = 0; i < choices.length; ++i) {
    r -= choices[i].weight || 1;
    if (r < 0) { sink = choices[i]; break; }
  }

  var spare = SpareGold();
  var cost = Min(spare, Max(1, Math.round(spare * sink.spend * MutatorProduct('sinkMult'))));
  var vars = StoryVars();
  vars.gold = cost;
  vars.hench = GenerateName();
  vars.rock = GenerateName();
  vars.tavern = 'The ' + Pick(K.Sink.TavernWords) + ' ' + Pick(K.Sink.TavernThings);
  var ev = { key: 'sink-' + sink.key, sink: sink.key, where: 'splurge', effect: {}, shown: 0, gold: cost };
  var lines = sink.lines;
  if (sink.gamble) {
    var odds = Min(0.9, K.Sink.GambleOdds * MutatorProduct('gambleMult'));
    ev.won = Random(1000) < odds * 1000 ? 2 * cost : 0;
    lines = lines.concat(ev.won ? sink.gamble.win : sink.gamble.lose);
  }
  ev.lines = lines.map(function (line) { return EventLine(line, vars); });
  if (sink.boon) {
    ev.boon = StoryText(sink.boon.name, vars).replace(/\|/g, '/');   // (as written: "a bigger backpack")
    var company = K.SinkCompany && K.SinkCompany[sink.key];
    if (company && company.who) ev.who = StoryText(company.who, vars).replace(/\|/g, '/');
    if (sink.boon.ends) ev.ends = EventLine(sink.boon.ends, vars);
  }
  game.event = ev;
  game.eventResume = resume || '';
  game.lastEvent = game.tasks;
  game.lastSplurge = game.elapsed || 0;
  $.each(ev.lines, function (i, text) {
    game.queue.push('scene|3|' + text + '|' + (i == ev.lines.length - 1 ? 'event' : 'ev'));
  });
  return true;
}

// The splurge has played out: pay up, and get what was paid for
function ApplySink(ev, result) {
  var sink = SinkByKey(ev.sink);
  if (!sink) return;
  var paid = Min(GetI(Inventory,'Gold'), ev.gold || 0);
  if (paid) Add(Inventory, 'Gold', -paid);
  game.goldSpent = (game.goldSpent || 0) + paid;
  game.splurges = (game.splurges || 0) + 1;
  result.push('Spent ' + paid + ' gold on ' + sink.label);
  CodexBump('spent', paid);
  CodexFlag('sink:' + sink.key);
  if (ev.won) {
    Add(Inventory, 'Gold', ev.won);
    result.push('Won ' + ev.won + ' gold');
  }
  if (sink.boon) result.push(AddBoon(sink, ev));
  if (sink.buff) result.push('+' + AddBuff(sink.buff) + ' ' + sink.buff + ' for ' + RoughTime(BuffSeconds()));
  var i, got = [];
  for (i = 0; i < (sink.spells || 0); ++i) got.push(WinSpell());
  if (got.length) result.push('Learned ' + got.join(', '));
  got = {};
  for (i = 0; i < (sink.stats || 0); ++i) { var stat = WinStat(); got[stat] = (got[stat] || 0) + 1; }
  if (sink.stats) result.push(Object.keys(got).map(function (k) { return '+' + got[k] + ' ' + k; }).join(', '));
  if (sink.gear) {
    // better than the shop sells, and than the weakest piece worn
    var weakest = Infinity;
    $.each(K.Equips, function (i, slot) { weakest = Min(weakest, SlotPower(slot)); });
    WinEquip(Max(GetI(Traits,'Level') + K.Loot.PremiumMax, weakest + 1) + 1 + Random(2));
    result.push('Equipped ' + game.bestequip);
  }
  if (sink.memoir) result.push('Your journal has a new entry, better written than the others');
  ShowPurse();
}

// A boon from a sink (sink.boon). Returns what to say about it.
function AddBoon(sink, ev) {
  var b = sink.boon, boons = game.boons = (game.boons || []).slice();
  var have = BoonByKey(sink.key), said;
  var help = b.help ? ': ' + b.help.charAt(0).toLowerCase() + b.help.slice(1) : '';
  if (!b.hours) {
    // for good
    if (have) have.c = (have.c || 1) + 1;
    else boons.push({ k: sink.key, n: ev.boon, until: 0, c: 1, w: ev.who });
    said = 'Now owns ' + ev.boon + (have ? ' (' + have.c + ')' : '') + help;
    ShowOwned();
  } else {
    // for a while (again: the new one replaces the old)
    var seconds = Math.round(b.hours * 3600 * MutatorProduct('boonMult'));
    if (have) boons.splice(boons.indexOf(have), 1);
    boons.push({ k: sink.key, n: ev.boon, until: (game.elapsed || 0) + seconds, c: 1, e: ev.ends, w: ev.who });
    said = ev.boon + ' for ' + RoughTime(seconds) + help;
  }
  game.boons = boons;
  RefreshPools();
  ShowBuffs();
  return said;
}

function BoonByKey(key) {
  var boons = game.boons || [];
  for (var i = 0; i < boons.length; ++i) if (boons[i].k == key) return boons[i];
  return null;
}

// Still going (not yet worn off)?
function BoonLive(b) {
  return !!b && (!b.until || b.until > (game.elapsed || 0));
}

// The boon from that sink, if it's still going
function LiveBoon(key) {
  var b = BoonByKey(key);
  return BoonLive(b) ? b : null;
}

// Who a boon is ("Grub", "The Leaky Ferret"): for {who} (K.SinkCompany).
// Boons bought before they kept a name get one from what they're called.
function BoonWho(b) {
  if (!b) return 'someone';
  if (b.w) return b.w;
  var m = /named (.+)$/.exec(b.n) || /^(.+?), a tavern/.exec(b.n) || /^(?:Henchman|Professor|Coach|Ghostwriter) (.+)$/.exec(b.n);
  return m ? m[1] : b.n;
}

// The boons, as modifiers: a sink's boon properties, once per time bought
function BoonModifiers() {
  var list = [];
  (game.boons || []).forEach(function (b) {
    var sink = SinkByKey(b.k);
    for (var i = 0; sink && sink.boon && i < (b.c || 1); ++i) list.push(sink.boon);
  });
  return list;
}

// Boons whose time is up go (between tasks)
function ExpireBoons() {
  var boons = game.boons;
  if (!boons || !boons.length) return;
  var now = game.elapsed || 0;
  var live = boons.filter(function (b) { return !b.until || b.until > now; });
  if (live.length == boons.length) return;
  boons.forEach(function (b) {
    if (!b.until || b.until > now) return;
    Log(b.e || b.n + ' wears off');
    // (the first time each kind wears off, the journal hears about it)
    var seen = game.journalBoons = game.journalBoons || {};
    if (!seen[b.k] && b.e && typeof JournalAdd == "function") {
      seen[b.k] = 1;
      JournalAdd('event', JournalSentences([b.e]));
    }
  });
  game.boons = live;
  RefreshPools();
  ShowBuffs();
}

// The henchman, if one is on the payroll: { name, power } for ResolveCombat
function Henchman() {
  var boons = game.boons || [];
  for (var i = 0; i < boons.length; ++i) {
    var sink = SinkByKey(boons[i].k);
    if (sink && sink.boon && sink.boon.ally && BoonLive(boons[i]))
      return { name: boons[i].n, power: K.Sink.AllyPower * sink.boon.ally * MutatorProduct('allyPower') };
  }
  return null;
}

// ---- The entourage (K.SinkCompany in events.js) ------------------------------
//
// Now and then, what the gold bought has a word to say: a henchman after a
// fight, a tutor's notes on it, the pet rock being a rock. Shown under the
// fight line (and after the fight in the combat log). Only for show: its
// own dice (Math.random), nothing saved, and never while catching up.
// kind: 'win', 'close', 'flee' or 'defeat' after a fight, 'idle' after
// anything else, or null just to tidy up.
var _company = { at: -1, k: null };
function CompanyChatter(kind, fight) {
  if (!document || !K.SinkCompany || !K.Sink.Chatter) return;
  var C = K.Sink.Chatter, now = game.tasks || 0;
  // a word goes when its speaker does, or after a while
  if (_company.k && (!LiveBoon(_company.k) || now - _company.at > C.Linger)) {
    $("#Company").text("").attr("title", null);
    _company.k = null;
  }
  if (!kind || _catchingUp || game.dead || !ChatterOn()) return;
  if (kind == 'idle' && _company.at >= 0 && now - _company.at < C.Quiet) return;
  if (Math.random() >= (kind == 'idle' ? C.Idle : C.Fight)) return;
  var options = [];
  (game.boons || []).forEach(function (b) {
    var talk = BoonLive(b) && K.SinkCompany[b.k];
    var lines = talk && (talk[kind] || (kind == 'close' && talk.win));
    if (lines && lines.length) options.push({ b: b, lines: lines });
  });
  if (!options.length) return;
  var o = options[Math.floor(Math.random() * options.length)];
  var text = CompanyLine(o.lines[Math.floor(Math.random() * o.lines.length)], o.b, kind == 'idle' ? null : fight);
  _company = { at: now, k: o.b.k };
  $("#Company").text(text).attr("title", "From " + o.b.n);
  if (kind != 'idle' && fight === game.combat) {
    $("<div class='fight-aside'>").text(text).appendTo("#CombatLog");
    var log = $("#CombatLog")[0];
    if (log) log.scrollTop = log.scrollHeight;
  }
}

function CompanyLine(line, b, fight) {
  var rounds = fight ? fight.rounds + (fight.rounds == 1 ? " round" : " rounds") : "";
  var vars = { who: BoonWho(b), hero: Get(Traits,'Name'), klass: Get(Traits,'Class'), level: GetI(Traits,'Level'),
               weapon: Get(Equips,'Weapon') || "your bare hands",
               spell: (game.bestspell || "").trim() || "a spell", foe: fight ? fight.foe || "the foe" : "the foe",
               rounds: rounds };
  var text = StoryText(line, vars);
  return text.charAt(0).toUpperCase() + text.slice(1) + (/[.!?”]$/.test(text) ? "" : ".");
}

// "Owns: The Leaky Ferret, a tavern in Dunkirk; a bigger backpack (2)"
// under the purse
function ShowOwned() {
  if (!document) return;
  var owned = (game.boons || []).filter(function (b) { return !b.until; });
  $("#Owned").text(owned.length ? "Owns: " + owned.map(function (b) {
    return b.n + ((b.c || 1) > 1 ? " (" + b.c + ")" : "");
  }).join("; ") : "").attr("title", owned.map(function (b) {
    var sink = SinkByKey(b.k);
    return b.n + (sink && sink.boon.help ? ": " + sink.boon.help : "");
  }).join("\n"));
}

// Time for a trip to market even if the pack isn't full? (K.Loot.MarketHours)
function MarketDue() {
  if (game.lastMarket === undefined) game.lastMarket = game.elapsed || 0;
  return game.Inventory.length > 1 &&
         (game.elapsed || 0) - game.lastMarket >= K.Loot.MarketHours * 3600;
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
  var mult = MutatorProduct(stat == 'HP Max' ? 'hpMult' : 'mpMult');
  return Max(1, Math.round(GetI(Stats, stat) * (1 + LegacyPct(stat)) * mult));
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

// ---- The Daily Challenge (see daily.js) -----------------------------------

// game.daily: { date, goal: {type, target}, label, startedAt, deadline,
// start: {level, quests, gold, wins}, status, doneAt, played }.
// status is "" while the challenge runs, then "done", "failed" or "died".
// After that the hero is an ordinary hero and plays on.

// How far along the goal is
function DailyProgress() {
  var d = game.daily, s = d.start || {};
  switch (d.goal.type) {
    case 'level':  return GetI(Traits,'Level');
    case 'quests': return (game.questsDone || 0) - (s.quests || 0);
    case 'gold':   return (game.goldEarned || 0) - (s.gold || 0);
    case 'wins':   return (game.wins || 0) - (s.wins || 0);
  }
  return 0;
}

// Write the result down in the book of dailies (one entry per day)
function NoteDaily() {
  var d = game.daily;
  if (!storage.noteDaily) return;
  storage.noteDaily(d.date, {
    date: d.date, name: Get(Traits,'Name'),
    race: Get(Traits,'Race'), klass: Get(Traits,'Class'),
    label: d.label, status: d.status || 'started',
    progress: DailyProgress(), target: d.goal.target,
    startedAt: d.startedAt, doneAt: d.doneAt || null,
    played: d.played || null,
    cheater: game.cheater ? game.cheater.reason : null
  });
}

// End the challenge one way or the other
function SettleDaily(status) {
  var d = game.daily;
  if (!d || d.status) return;
  d.status = status;
  d.doneAt = GameNow();
  d.played = Math.round(game.elapsed || 0);
  if (typeof JournalDaily == "function") JournalDaily(status);
  NoteDaily();
  ShowDaily();
  Log('Daily challenge ' + status);
  if (status == 'done') {
    storage.loadDailies(function (book) { CodexExtra.dailies = book; Codex.counts = null; CheckAchievements(); });
    if (game.mode == 'hardcore') CodexFlag('dailyhc');
  }
  if (!document || _catchingUp) return;   // (the catch-up summary says so)
  if (status == 'done') {
    $("#DailyResult").text(Get(Traits,'Name') + " did it: " + d.label + ", in " +
      RoughTime(d.played) + " of play (" + RoughTime((d.doneAt - d.startedAt) / 1000) + " on the clock).");
    var dlg = document.getElementById("DailyDialog");
    if (dlg && !dlg.open) dlg.showModal();
    Narrate("Daily challenge complete! " + d.label + ".");
  } else if (status == 'failed') {
    Narrate("Time's up. The daily challenge is over.");
  }
}

// After each task: is it done, or out of time?
function CheckDaily() {
  var d = game.daily;
  if (!d || d.status) return;
  if (game.dead) { SettleDaily('died'); return; }
  if (game.cheater) { SettleDaily('failed'); return; }
  if (DailyProgress() >= d.goal.target) SettleDaily('done');
  else if (GameNow() > d.deadline) SettleDaily('failed');
  else ShowDaily();
}

// "Daily 2026-10-07: Win 600 fights (212) · 21h left" under the stats
function ShowDaily() {
  if (!document) return;
  var d = game.daily;
  var twist = Mutators().map(function (m) { return m.label; }).join(", ");
  if (!d) {
    $("#DailyLine").text(twist ? "Twist: " + twist : "")
      .attr("title", Mutators().map(function (m) { return m.label + ": " + m.help; }).join("\n"));
    return;
  }
  var text = "Daily " + d.date + ": " + d.label;
  if (d.status == 'done') text += " ✔ done in " + RoughTime(d.played);
  else if (d.status == 'failed') text += " ✘ out of time";
  else if (d.status == 'died') text += " ☠ died trying";
  else {
    var left = Max(0, d.deadline - +new Date()) / 3600000;
    text += " (" + DailyProgress().toLocaleString() + ") · " +
      (left >= 1 ? Math.floor(left) + "h" : Math.ceil(left * 60) + "m") + " left";
  }
  $("#DailyLine").text(text).attr("title",
    "Today's Daily Challenge. Everyone gets the same hero and the same dice." +
    (twist ? "\nTwist: " + Mutators().map(function (m) { return m.label + " (" + m.help + ")"; }).join(", ") : "") +
    (game.mode == 'hardcore' ? "\nHardcore: one life." : ""));
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
  ShowBoons(now);
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

// "Splurged: Henchman Grub (7h 12m) · Blessed (3h 5m)" under the buffs: the
// boons that wear off (those for good are under the purse, ShowOwned)
var _boonShown = null;
function ShowBoons(now) {
  var live = (game.boons || []).filter(function (b) { return b.until && b.until > now; });
  var text = live.map(function (b) {
    var left = Math.ceil((b.until - now) / 60);
    return b.n + ' (' + (left >= 60 ? Math.floor(left / 60) + 'h ' : '') + (left % 60) + 'm)';
  }).join(' \u00b7 ');
  if (text === _boonShown) return;
  _boonShown = text;
  $("#Boons").text(text ? 'Splurged: ' + text : '').attr("title", live.map(function (b) {
    var sink = SinkByKey(b.k);
    return b.n + (sink && sink.boon.help ? ": " + sink.boon.help : "");
  }).join("\n"));
}

// ---- Event pop-up and "Last event" box -------------------------------------

K.EventWhere = { perk: 'A new perk', rest: 'While resting', road: 'On the road', town: 'In town',
                 field: 'On the Killing Fields™', splurge: 'Money to burn', elite: 'An elite!' };

// Called as each line of an event starts: remember what has been shown so
// far, and show it.
function RevealEventLine() {
  var ev = game.event;
  if (!ev || !ev.lines) return;
  ev.shown = Min(ev.lines.length, (ev.shown || 0) + 1);
  SyncRecentEvent();
  ShowEventPopup(false);
}

// The Last Event box (and the pop-up) show the event in progress: the lines
// so far and, for a choice, the question and the options or the pick.
function SyncRecentEvent() {
  var ev = game.event;
  if (!ev) return;
  var prev = game.recentEvent;
  var at = prev && prev.key == ev.key && !(prev.result || []).length ? prev.at : (game.elapsed || 0);
  var shown = game.recentEvent = { key: ev.key, where: ev.where, lines: ev.lines.slice(0, ev.shown || 0),
                                   result: [], at: at };
  if (ev.choices && (ev.shown || 0) >= ev.askAt) {
    shown.ask = ev.ask;
    shown.askAt = ev.askAt;
    shown.options = ev.choices.map(function (c) { return c.label; });
    shown.pending = !!ev.pending;
    var pick = ev.chosen !== null && ev.chosen !== undefined ? ev.chosen : ev.picked;
    if (pick !== null && pick !== undefined) {
      shown.picked = pick;
      shown.by = ev.by || 'you';
    }
  }
  ShowRecentEvent();
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
  $.each(ev.lines || [], function (i, line) {
    if (ev.ask && i == ev.askAt) $lines.append(RenderChoice(ev));
    $lines.append($("<div>").text(line));
  });
  if (ev.ask && (ev.lines || []).length <= ev.askAt) $lines.append(RenderChoice(ev));
  $result.text((ev.result || []).join(' · '));
}

// The question, then the buttons while it waits, or what was picked
function RenderChoice(ev) {
  var box = $("<div class='event-choice'>");
  $("<div class='ask'>").text(ev.ask).appendTo(box);
  if (ev.pending) {
    var buttons = $("<div class='choices'>").appendTo(box);
    $.each(ev.options || [], function (i, label) {
      $("<button type='button'>").attr("data-pick", i).text((i + 1) + ". " + label).appendTo(buttons);
    });
    $("<div class='choice-timer'>").appendTo(box);
  } else if (ev.picked !== undefined && ev.picked !== null) {
    $("<div class='picked'>").text((ev.by == 'fate' ? "Nobody answered, so fate chose: " : "You chose: ") +
                                   (ev.options || [])[ev.picked]).appendTo(box);
  }
  return box;
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
  if (!document || !EventPopupsOn() || _catchingUp) return;
  var dlg = document.getElementById("EventDialog");
  if (!dlg || !dlg.showModal || !game.recentEvent) return;
  RenderEvent(game.recentEvent, $("#EventWhere"), $("#EventLines"), $("#EventResult"));
  ShowChoiceTimer();
  if (!dlg.open) dlg.showModal();
  clearTimeout(_popupTimer);
  var linger = typeof EventPopupLinger == "function" ? EventPopupLinger() : K.EventPopupLinger;
  if (finished && linger > 0) _popupTimer = setTimeout(PopupTimeout, linger * 1000);   // (0: until closed)
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
  if (fight.hpLost > 0) cost.push(fight.hpLost + " HP");   // (healing can make it negative)
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
var _shownLines = -1, _shownFight = null, _shownResult = null;
function ShowFight(force) {
  if (!document) return;
  var fight = game.combat;
  if (!fight || !fight.log) { $("#FightLine").text(""); return; }
  // The fight plays out while its task runs: a monster, or the Old Bastard
  var playing = Pos('kill|', game.task) == 1 || game.task == 'boss';
  var live = playing && !fight.done;
  var n = live ? Math.floor(fight.log.length * TaskBar.Position() / Max(1, TaskBar.Max())) : fight.log.length;
  if (!force && fight === _shownFight && n === _shownLines && (live || _shownResult === fight)) return;
  if (fight !== _shownFight) {
    $("#CombatLog").empty();
    $("<div class='fight-head'>").text("vs " + fight.foe).appendTo("#CombatLog");
    _shownLines = 0;
    _shownResult = null;
  }
  for (var i = Max(0, _shownLines); i < n; ++i)
    $("<div>").text(fight.log[i]).appendTo("#CombatLog");
  // the result, once per fight
  if (!live && _shownResult !== fight) {
    $("<div class='fight-result'>").text(FightSummary(fight)).appendTo("#CombatLog");
    _shownResult = fight;
  }
  _shownFight = fight;
  _shownLines = n;
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
  var lostGold = 0, lostItems = 0, loss = MutatorProduct('lossMult');
  if (game.purse) {
    lostGold = Min(game.purse, Math.round(game.purse * loss * (D.PurseLossMin + Random(100) / 100 * (D.PurseLossMax - D.PurseLossMin))));
    game.purse -= lostGold;
  }
  for (var i = game.Inventory.length - 1; i >= 1; --i) {
    var name = game.Inventory[i][0];
    var qty = StrToInt(game.Inventory[i][1]);
    var lose = 0;
    for (var u = 0; u < qty; ++u)
      if (Random(100) < D.ItemLossPercent * loss) ++lose;
    if (lose) {
      lostItems += lose;
      Add(Inventory, name, -lose);
      if (GetI(Inventory, name) <= 0) RemoveItem(name);
    }
  }
  ShowPurse();
  Log('Defeated by ' + fight.foe + '; lost ' + lostGold + ' gold and ' + lostItems + ' items');
  if (typeof JournalFirstDefeat == "function") JournalFirstDefeat(fight.foe);

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
  return Math.round((D.RecoveryBase + D.RecoveryPerLevel * level) / Min(2, Max(0.5, con)) * MutatorProduct('recoveryMult'));
}

// The temple's tithe: a share of your purse and of your banked gold. The
// richer you are, the more salvation costs.
function PayTemple() {
  var tithe = Min(0.5, K.Defeat.Tithe * MutatorProduct('titheMult'));
  var fromPurse = Math.floor((game.purse || 0) * tithe);
  var fromBank = Math.floor(GetI(Inventory, 'Gold') * tithe);
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
      Inventory.removeUI(name);
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
    "Defeated " + deaths + (deaths == 1 ? " time" : " times") +
    (game.mode == 'hardcore' ? " \u00b7 \u2620 Hardcore" : ""))
    .toggleClass("wounded", game.wounded > 0)
    .attr("title", game.mode == 'hardcore' ?
          "Hardcore: one life. Each defeat has a " + Percent(K.Hardcore.DeathChance) +
          " chance to be your last (twice that while Wounded, more against tougher " +
          "monsters, and more against the Old Bastard\u2122)." : "");
}

function NeedsRest() {
  return HPBar.Position() < HPBar.Max() * Tactic('resting').restBelow;
}

// Resting takes 3-8 seconds depending on how hurt you are; more CON, less.
function RestTime() {
  var hurt = 1 - HPBar.Position() / Max(1, HPBar.Max());
  var con = EffStat('CON') / ExpectedStat(GetI(Traits,'Level'));
  return Math.round(1000 * (3 + 5 * hurt) / Min(2, Max(0.5, con)) * MutatorProduct('restMult'));
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
  var chance = Min(0.99, Min(L.DropMax, Max(L.DropMin, L.DropBase + L.DropPerLevel * gap + L.DropPerCha * cha)) *
                    MutatorProduct('dropMult'));
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
                          ChaFactor(L.PriceSlope, L.PriceMin, L.PriceMax) * MutatorProduct('goldMult'));
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
    game.goldEarned = (game.goldEarned || 0) + game.purse;
    CodexBump('gold', game.purse);
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
    EncumBar.reset(CarryMax(), EncumBar.Position());
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


// What a screen reader calls each bar (role="progressbar")
var ProgressBarLabels = { ExpBar: "Experience", PlotBar: "Plot", QuestBar: "Quest", TaskBar: "Current task",
                          HPBar: "Health", MPBar: "Mana", EncumBar: "Encumbrance" };

function ProgressBar(id, tmpl) {
  this.id = id;
  this.bar = $("#"+ id + " > .bar");
  this.tmpl = tmpl;
  // For screen readers: a progress bar, 0 to 100, with the hint as its text
  this.box = $("#" + id);
  if (this.box && this.box.attr)
    this.box.attr({ role: "progressbar", "aria-label": ProgressBarLabels[id] || id,
                    "aria-valuemin": 0, "aria-valuemax": 100 });
  this.shown = { now: null, text: null };

  this.Max = function () { return game[this.id].max; };
  this.Position = function () { return game[this.id].position; };

  this.reset = function (newmax, newposition) {
    game[this.id].max = newmax;
    this.reposition(newposition || 0);
  };

  this.reposition = function (newpos) {
    game[this.id].position = Min(newpos, this.Max());

    // Recompute hint
    game[this.id].percent = Div(100 * this.Position(), this.Max());
    game[this.id].remaining = Math.floor(this.Max() - this.Position());
    game[this.id].time = RoughTime(this.Max() - this.Position());
    game[this.id].hint = template(this.tmpl, game[this.id]);

    // Update UI
    if (this.bar) {
      var p = this.Max() ? 100 * this.Position() / this.Max() : 0;
      this.bar.css("width", p + "%");
      this.bar.parent().find(".hint").text(game[this.id].hint);
      // (the ARIA values only when they change: the task bar moves every tick)
      var now = Math.floor(p), text = game[this.id].hint;
      if (this.id == "TaskBar" && game.kill) text = game.kill.replace(/\.\.\.$/, "") + ": " + now + "%";
      if (now !== this.shown.now) { this.box.attr("aria-valuenow", now); this.shown.now = now; }
      if (text !== this.shown.text) { this.box.attr("aria-valuetext", text); this.shown.text = text; }
    }
  };

  this.increment = function (inc) {
    this.reposition(this.Position() + inc);
  };

  this.done = function () {
    return this.Position() >= this.Max();
  };

  this.load = function () {
    this.reposition(this.Position());
  };
}



// Show a new row by scrolling its list box, never the page (the old
// scrollIntoView() also scrolled the whole window to the row, which on a
// phone yanked the screen to the Spell Book or Quests at every change)
function ScrollIntoList(el) {
  var box = el.closest ? el.closest(".scroll") : null;
  if (!box) return;
  var top = el.offsetTop - box.offsetTop, bottom = top + el.offsetHeight;
  if (top < box.scrollTop) box.scrollTop = top;
  else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight;
}

// ---- Panels and the dock (small screens) ---------------------------------------
//
// On a phone the window is one column, and each panel (Character Sheet,
// Spell Book, Equipment...) can be collapsed by tapping its heading. Which
// ones are collapsed is remembered per browser. On wider screens nothing
// collapses and the headings are just headings. The dock (current task, task
// bar, and a one-line summary) stays at the bottom of the screen.

var K_CompactQuery = "(max-width: 699px)";
var K_PanelsCollapsed = { spells: true, equipment: true, inventory: true };   // the default

function CompactLayout() {
  return !!(window.matchMedia && window.matchMedia(K_CompactQuery).matches);
}

function PanelState() {
  try { return JSON.parse(localStorage.getItem("pq.panels")) || K_PanelsCollapsed; }
  catch (e) { return K_PanelsCollapsed; }
}

function SetPanel(key, collapsed) {
  var state = PanelState();
  state[key] = !!collapsed;
  try { localStorage.setItem("pq.panels", JSON.stringify(state)); } catch (e) {}
  ShowPanels();
}

function SetAllPanels(collapsed) {
  var state = {};
  $(".panel").each(function () { state[this.id.replace(/^Panel-/, "")] = !!collapsed; });
  try { localStorage.setItem("pq.panels", JSON.stringify(state)); } catch (e) {}
  ShowPanels();
}

function ShowPanels() {
  var state = PanelState(), compact = CompactLayout();
  $(".panel").each(function () {
    var key = this.id.replace(/^Panel-/, ""), shut = compact && !!state[key];
    $(this).toggleClass("collapsed", shut);
    $(this).find(".panel-toggle").attr("aria-expanded", !shut)
      .attr("tabindex", compact ? null : -1)
      .attr("title", compact ? (shut ? "Show " : "Hide ") + $(this).find(".panel-toggle").text() : null);
  });
}

function SetUpPanels() {
  $(".panel-toggle").on("click", function () {
    if (!CompactLayout()) return;
    var panel = $(this).closest(".panel");
    SetPanel(panel.attr("id").replace(/^Panel-/, ""), !panel.hasClass("collapsed"));
  });
  if (window.matchMedia) {
    var mq = window.matchMedia(K_CompactQuery);
    if (mq.addEventListener) mq.addEventListener("change", ShowPanels);
  }
  ShowPanels();
  ShowDock();
  setInterval(ShowDock, 1000);
}

// "Lv 25 · HP 180/230 · MP 200/214 · XP 56%" for the dock
function ShowDock() {
  if (!document || !game || !game.Traits) return;
  var xp = ExpBar.Max() ? Math.floor(100 * ExpBar.Position() / ExpBar.Max()) : 0;
  $("#DockStats").text("Lv " + GetI(Traits,'Level') + " \u00b7 HP " + Math.round(HPBar.Position()) + "/" + HPBar.Max() +
    " \u00b7 MP " + Math.round(MPBar.Position()) + "/" + MPBar.Max() + " \u00b7 XP " + xp + "%" +
    (game.mode == 'hardcore' ? " \u00b7 \u2620" : ""));
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
  // Two-column lists: the row for each key, so an update goes straight to it
  // instead of searching the table (the Spell Book runs to 200 rows). The
  // fixed lists (Traits, Stats, Equipment) start with their rows in the page.
  this.byKey = new Map();
  if (this.box && columns == 2) {
    var byKey = this.byKey;
    this.box.children("tr").each(function () { byKey.set(Key(this), $(this)); });
  }

  this.AddUI = function (caption) {
    if (!this.box) return;
    var tr = $("<tr>").append(
      $("<td>").append($("<input>", { type: "checkbox", disabled: true, "aria-label": caption }),
                       document.createTextNode(" " + caption)));
    tr.appendTo(this.box);
    tr.each(function () { ScrollIntoList(this); });
    if (this.decorate) this.decorate(tr, caption);
    return tr;
  };

  this.ClearSelection = function () {
    if (this.box)
      this.box.find("tr.selected").removeClass("selected");
  };

  this.PutUI = function (key, value) {
    if (!this.box) return;
    var item = this.byKey.get(key);
    if (!item) {
      item = $("<tr>").append($("<td>").text(key), $("<td>"));
      this.box.append(item);
      this.byKey.set(key, item);
    }

    item.children().last().text(value);
    item.addClass("selected");
    if (this.decorate) this.decorate(item, key);
    item.each(function () { ScrollIntoList(this); });
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
      var boxes = this.rows().find("input[type=checkbox]");
      if (butlast) boxes = boxes.slice(0, -1);
      boxes.prop("checked", true);
    }
  };

  this.length = function () {
    return (this.fixedkeys || game[this.id]).length;
  };

  // The first row (the oldest of the Quests)
  this.remove0 = function () {
    if (game[this.id])
      game[this.id].shift();
    if (this.box)
      this.box.find("tr").first().remove();
  };

  // The second row (the Inventory's first item, after Gold)
  this.remove1 = function () {
    var gone = game[this.id].splice(1, 1)[0];
    if (gone) this.removeUI(gone[0]);
  };

  // A two-column list's row for key
  this.removeUI = function (key) {
    var row = this.byKey.get(key);
    if (!row) return;
    row.remove();
    this.byKey.delete(key);
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
  $(FormCreate);


function WinSpell() {
  var spell = SpellName(K.Spells[RandomLow(Min(GetI(Stats,'WIS')+GetI(Traits,'Level'),
                                               K.Spells.length))]);
  AddR(Spells, spell, 1);
  CodexSpell(spell, toArabic(Get(Spells, spell)));
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
       ShopPrice(power + 1) * 2 <= gold; ++extra)
    ++power;
  // ...but never more than you can pay for
  while (power > 0 && ShopPrice(power) > gold)
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
  $.each(K.Equips, function (i, slot) {
    var u = UniqueIn(slot), row = Equips.byKey.get(slot);
    if (row) row.toggleClass("unique", !!u)
      .attr("title", u ? "Unique: taken from " + u.from + " (an elite " + u.kind + ") at level " + u.level +
                         ". Power " + u.power + "." : null);
  });
  $("#GearPower").text("Weapon power " + SlotPower('Weapon') +
                       " \u00b7 Armor power " + ArmorPowerAvg().toFixed(1));
}


function Square(x) { return x * x; }

// The current character's attribute profile (see AttributeProfile).
// (Cached: it is asked for every fight. Treat the result as read-only.)
var _charProfile = { key: null, profile: null };
function CharProfile() {
  var key = Get(Traits,'Race') + '|' + Get(Traits,'Class');
  if (_charProfile.key !== key)
    _charProfile = { key: key, profile: AttributeProfile(Get(Traits,'Race'), Get(Traits,'Class')) };
  return _charProfile.profile;
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
  return i;
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
  // (This used to give another of something already in the pack, once it
  // held 250 kinds of thing. It never does now, but the dice are still
  // rolled, so seeded games and replays stay the same.)
  Random(999);
  Add(Inventory, SpecialItem(), 1);
}

function CompleteQuest() {
  QuestBar.reset(50 + Random(100));
  if (Quests.length()) {
    if (typeof Gossip == "function") Gossip('quest', { done: game.bestquest });
    game.questsDone = (game.questsDone || 0) + 1;
    Log('Quest completed: ' + game.bestquest);
    Quests.CheckAll();
    var prize = [WinSpell,WinEquip,WinStat,WinItem][Random(4)];
    if (prize === WinEquip && HasMutator('noRewardGear')) prize = WinItem;   // (the Looter perk)
    prize();
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

// (Cached: every fight converts every spell's level)
var _arabic = Object.create(null);
function toArabic(s) {
  if (s in _arabic) return _arabic[s];
  var key = s;
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
  return _arabic[key] = n;
}

function CompleteAct() {
  if (typeof Gossip == "function") Gossip('act', { act: ActCaption(game.act) });
  Plots.CheckAll();
  game.act += 1;
  PlotBar.reset(60 * 60 * (1 + 5 * game.act)); // 1 hr + 5/act
  game.bestplot = 'Act ' + toRoman(game.act);
  BeginStory(NewStory(game.act));
  if (typeof JournalActBegin == "function") JournalActBegin();
  Narrate(ActCaption(game.act) + '. ' + game.story.purpose);
  Plots.AddUI(ActCaption(game.act));

  if (game.act > 1) {
    WinItem();
    WinEquip();
  }

  Brag('a');
}


// What the hero is up to, in the browser console, in debug mode only
// (PQDebug in config.js). Nothing is kept otherwise: a game left idling for
// months would pile up a log without end.
function Log(line) {
  if (PQDebug) console.log("[task " + (game.tasks || 0) + "] " + line);
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

  // The log line, only if anyone will see it
  if (!PQDebug || !value) return;
  var line = (value > 0) ? "Gained" : "Lost";
  if (key == 'Gold') {
    key = "gold piece";
    line = (value > 0) ? "Got paid" : "Spent";
  }
  if (value < 0) value = -value;
  line = line + ' ' + Indefinite(key, value);
  Log(line);
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
  var more = MutatorProduct('poolGainMult');   // (the Late Bloomer perk)
  Add(Stats,'HP Max', Math.round(PoolGain(Div(GetI(Stats,'CON'), 3) + 1 + Random(4), weights['HP Max']) * more));
  Add(Stats,'MP Max', Math.round(PoolGain(Div(GetI(Stats,'INT'), 3) + 1 + Random(4), weights['MP Max']) * more));
  WinStat();
  WinStat();
  WinSpell();
  RestoreHealth();  // a new level, a fresh start
  ExpBar.reset(LevelUpTime(GetI(Traits,'Level')));
  if (typeof JournalLevel == "function") JournalLevel();
  if (typeof Gossip == "function") Gossip('level');
  if (typeof RivalLevelUp == "function") RivalLevelUp();
  // A new perk on offer every K.PerkEvery levels (OfferPerk, between tasks)
  var lv = GetI(Traits,'Level');
  if (lv % K.PerkEvery == 0 && lv <= K.PerkLast) game.perkDue = (game.perkDue || 0) + 1;
  Announce("Level " + lv + ".");
  Brag('l');
  CheckForCheating();
}

function ClearAllSelections() {
  $.each(AllLists, function () {this.ClearSelection();});
}

function RoughTime(s) {
  if (s < 120) return Div(s, 1) + ' seconds';
  else if (s < 60 * 120) return Div(s, 60) + ' minutes';
  else if (s < 60 * 60 * 48) return Div(s, 3600) + ' hours';
  else if (s < 60 * 60 * 24 * 60) return Div(s, 3600 * 24) + ' days';
  else if (s < 60 * 60 * 24 * 30 * 24) return Div(s, 3600 * 24 * 30) +" months";
  else return Div(s, 3600 * 24 * 30 * 12) + " years";

}

function Pos(needle, haystack) {
  return haystack.indexOf(needle) + 1;
}

function Timer1Timer() {
  if (game.dead) return;   // Hardcore: it's over
  if (TaskBar.done()) {
    game.tasks += 1;
    game.elapsed += Div(TaskBar.Max(), 1000);

    ClearAllSelections();

    // A new hero's very first task ("Loading....") is worth nothing: no
    // XP, no plot. (It looks like leftover code, but every hero's game
    // depends on it; take it out and every seeded game comes out different.)
    if (game.kill == 'Loading....')
      TaskBar.reset(0);

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
        QuestBar.increment(reward * MutatorProduct('questMult'));
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
    CheckDaily();
    CodexHero();
    RecordCheckpoint();
    if (_anchorWanted) AnchorReplay();
  } else {
    var elapsed = timeGetTime() - clock.lasttick;
    if (elapsed > 100) elapsed = 100;
    if (elapsed < 0) elapsed = 0;
    TaskBar.increment(elapsed);
    ShowFight();
    ShowBuffs();
    ShowChoiceTimer();
  }
  // (No StartTimer() here: it used to undo every StopTimer() made during
  // the tick, such as a Hardcore death or a pause)
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

    $("#quit").on("click", function (e) { e.preventDefault(); quit(); });
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
    $("#TacticsLink").on("click", function (e) { e.preventDefault(); OpenTactics(); });
    SetUpPanels();
    if (typeof SetUpFeed == "function") SetUpFeed();
    $("#CodexLink").on("click", function (e) {
      e.preventDefault();
      CodexFlush(function () { window.open("index.html#codex", "pq-codex"); });
    });
    $("#TacticsClose").on("click", function () { this.closest("dialog").close(); });
    $("#RetireLink").on("click", function (e) { e.preventDefault(); AskRetire(); });
    $("#FinaleRetire").on("click", AskRetire);
    $("#FinaleKeep").on("click", function () { this.closest("dialog").close(); });
    $("#RetireYes").on("click", Retire);
    $("#DeathHall").on("click", function () { window.location.href = "index.html#hall/fallen"; });
    $("#DeathMenu").on("click", function () { window.location.href = "index.html"; });
    $("#DeathJournal, #JournalLink").on("click", function (e) { e.preventDefault(); OpenJournal(); });
    $("#RetireJournal").on("click", function (e) { e.preventDefault(); DownloadJournal(); });
    $("#RetireNo").on("click", function () { this.closest("dialog").close(); });
    $("#DailyOk").on("click", function () { this.closest("dialog").close(); });
    $("#DailyMenu").on("click", function () { window.location.href = "index.html#challenge"; });
    // Close the event pop-up with a click anywhere on it (or its backdrop)
    $("#EventDialog").on("click", function (e) {
      // while a choice waits, only OK (or Esc) closes it; the buttons choose
      if (ChoicePending() && !$(e.target).is("#EventOk")) return;
      CloseEventPopup();
    });
    $(document).on("click", "[data-pick]", function (e) {
      e.stopPropagation();
      PickChoice(parseInt($(this).attr("data-pick"), 10));
    });
    try {
      if (window.localStorage.getItem("pq.combatlog") === "1")
        $("body").addClass("show-log");
    } catch (e) {}

    $(document).on("keydown", FormKeyDown);

    // Save whenever the page is hidden or closed. 'unload' is being removed
    // from browsers and is unreliable on mobile; pagehide and
    // visibilitychange are the supported replacements.
    $(window).on("pagehide.pqsave", function () { SaveGame(null, true); });
    $(document).on("visibilitychange.pqsave", function () {
      if (document.visibilityState === "hidden") SaveGame(null, true);
    });
    // The backup offered before retiring: made now, from a fresh save
    $("#RetireBackup").on("click", function (e) {
      e.preventDefault();
      SaveGame(function (text) { DownloadHero(game, text); });
    });

    if (iOS) $("body").addClass("iOS");
  }

  // main.html#<life ID>. (sim.js and replays set location.href to that, so
  // it's read through URL rather than location.hash.)
  var hash = new URL(String(window.location.href), "https://pq.invalid/").hash;
  storage.findHero(DecodeName(hash.slice(1)), LoadGame);

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
      window.location.href = "index.html#resume" + (game && game.lifeId ? "/" + EncodeName(game.lifeId) : "");
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


// What this hero adds to the Codex's bests, and the achievements they lead to
function CodexHero() {
  if (!CodexOn()) return;
  var level = GetI(Traits,'Level');
  CodexBest('level', level);
  if (game.mode == 'hardcore') CodexBest('hardcore', level);
  CodexBest('streak', game.streak || 0);
  CodexBest('defeats', game.deaths || 0);
  if (game.tasks % 10 == 0) CodexBest('seconds', Math.floor(game.elapsed || 0));
  if (level >= 10 && Get(Equips, 'Weapon') == 'Pet Rock') CodexFlag('petrock');
  if (document && game.tasks % 10 == 0) CheckAchievements();
}

// ---- While you were away ------------------------------------------------------
//
// An idle game should play on while it's closed. When a hero is opened, the
// time since they were last saved (game.stamp) is played now, as fast as it
// will go, up to K.CatchUp.MaxHours. It is the ordinary game, task by task:
// the same dice, fate making the choices, defeats and all (in Hardcore, death
// too). So a replay checks it like any other play, and game time never gets
// ahead of the clock. Only the pop-ups, narration and saving wait; then a
// summary says what happened.

var _catchingUp = null;   // while catching up: { clock0, elapsed0, target, finale }

// The time, as the game sees it: while catching up, the moment the hero has
// reached (for the Daily Challenge's deadline)
function GameNow() {
  return _catchingUp ? _catchingUp.clock0 + ((game.elapsed || 0) - _catchingUp.elapsed0) * 1000 : Date.now();
}

// then: what to do once it's caught up (start the clock). since: when play
// stopped (Date.now() time); by default, when the hero was last saved.
function CatchUp(then, since) {
  var C = K.CatchUp;
  since = since || game.stamp || Date.now();
  var away = (Date.now() - since) / 1000;
  if (!document || game.dead || !C.MaxHours || !(away >= C.MinSeconds)) { then(); return; }
  var credit = Math.min(away, C.MaxHours * 3600);
  var before = CatchUpSnapshot();
  _catchingUp = { clock0: since, elapsed0: game.elapsed || 0, target: (game.elapsed || 0) + credit,
                  finale: false, ended: false };

  var body = document.createElement("div");
  var line = document.createElement("p");
  var meter = document.createElement("div");
  meter.className = "scan-meter";
  meter.innerHTML = "<div></div><span></span>";
  body.appendChild(line);
  body.appendChild(meter);
  line.textContent = Get(Traits,'Name') + " kept going for " + RoughTime(Math.round(away)) + " while you were away" +
    (credit < away ? " (the most that counts is " + C.MaxHours + " hours)" : "") + ". Catching up…";
  var dlg = WinBox({ title: "While you were away", icon: "info", body: body, buttons: [] });
  var bar = meter.querySelector("div"), label = meter.querySelector("span");

  var chunk = function () {
    var until = performance.now() + 40;   // a frame or two at a time, so the page keeps breathing
    while (performance.now() < until && !game.dead && !_catchingUp.ended) CatchUpTask();
    var done = (game.elapsed || 0) - _catchingUp.elapsed0;
    bar.style.width = Math.min(100, 100 * done / credit) + "%";
    label.textContent = RoughTime(Math.round(done)) + " of " + RoughTime(Math.round(credit)) +
                        " · level " + GetI(Traits,'Level');
    if (game.dead || _catchingUp.ended) finish(); else setTimeout(chunk, 0);
  };
  var finish = function () {
    var finale = _catchingUp.finale;
    _catchingUp = null;
    _guardSession = null;   // the speed check starts over from here
    if (game.dead) { dlg.closeWith(null); return; }   // Die() has put up the tombstone
    CheckForCheating();
    SaveGame();
    ShowFight(true);
    var lines = CatchUpSummary(before, CatchUpSnapshot(), credit);
    if (typeof JournalAway == "function") JournalAway(credit, lines);
    line.textContent = "While you were away (" + RoughTime(Math.round(credit)) + " of play):";
    meter.remove();
    var list = document.createElement("ul");
    list.className = "away-list";
    lines.forEach(function (text) {
      var li = document.createElement("li");
      li.textContent = text;
      list.appendChild(li);
    });
    body.appendChild(list);
    dlg.setButtons([{ label: "OK", value: "ok", primary: true, action: function () {
      dlg.closeWith("ok");
      if (finale) ShowFinaleDialog();
    } }]);
    Narrate("While you were away, " + lines[0].charAt(0).toLowerCase() + lines[0].slice(1));
    then();
  };
  setTimeout(chunk, 0);
}

// Finish the task under way, unless the time away runs out first
function CatchUpTask() {
  var owed = (_catchingUp.target - (game.elapsed || 0)) * 1000;   // game ms still to play
  var rest = TaskBar.Max() - TaskBar.Position();
  if (rest > owed) {
    TaskBar.increment(Max(0, owed));   // part of the way, and the clock takes it from there
    _catchingUp.ended = true;
    return;
  }
  TaskBar.reposition(TaskBar.Max());
  Timer1Timer();
}

function CatchUpSnapshot() {
  return {
    tasks: game.tasks || 0, level: GetI(Traits,'Level'),
    xp: ExpBar.Max() ? ExpBar.Position() / ExpBar.Max() : 0,
    act: game.act || 0, quests: game.questsDone || 0, wins: game.wins || 0, deaths: game.deaths || 0,
    gold: (game.goldEarned || 0), spent: (game.goldSpent || 0), splurges: (game.splurges || 0),
    spells: (game.Spells || []).length, gear: game.bestequip || "",
    won: CanRetire(), daily: game.daily ? game.daily.status || "" : null
  };
}

// What happened, a line each
function CatchUpSummary(a, b, seconds) {
  var lines = [];
  var plural = function (n, one, many) { return n.toLocaleString() + " " + (n == 1 ? one : many); };
  if (b.level > a.level) lines.push("Reached level " + b.level + " (up from " + a.level + ")");
  else lines.push("Got " + Math.max(0, Math.round(100 * (b.xp - a.xp))) + "% closer to level " + (b.level + 1));
  if (b.act > a.act) lines.push("Moved on to " + ActCaption(b.act));
  if (b.quests > a.quests) lines.push("Completed " + plural(b.quests - a.quests, "quest", "quests"));
  if (b.wins > a.wins || b.deaths > a.deaths)
    lines.push("Won " + plural(b.wins - a.wins, "fight", "fights") +
               (b.deaths > a.deaths ? ", and was defeated " + plural(b.deaths - a.deaths, "time", "times") : ""));
  if (b.gold > a.gold) lines.push("Banked " + plural(b.gold - a.gold, "gold piece", "gold") + " at market");
  if (b.splurges > a.splurges)
    lines.push("Splurged " + plural(b.spent - a.spent, "gold piece", "gold") + " on " +
               (b.splurges - a.splurges == 1 ? "something" : plural(b.splurges - a.splurges, "thing", "things")));
  if (b.spells > a.spells) lines.push("Learned " + plural(b.spells - a.spells, "new spell", "new spells"));
  if (b.gear != a.gear) lines.push("Now wielding or wearing " + b.gear);
  var fate = (game.choiceLog || []).filter(function (e) { return e.by == "fate" && e.t > a.tasks; }).length;
  if (fate) lines.push("Fate made " + plural(fate, "choice", "choices") + " for you");
  if (b.won && !a.won) lines.push("Defeated the Old Bastard\u2122!");
  if (b.daily != a.daily && b.daily) lines.push("Daily challenge: " + (b.daily == "done" ? "done!" : b.daily == "failed" ? "out of time" : b.daily));
  return lines;
}

// ---- One tab per hero ---------------------------------------------------------
//
// Two tabs (or windows) playing the same hero would each save over the other.
// So the tab playing a hero holds a Web Lock named for them. A second tab
// that opens the same hero finds it held and asks: play here instead, or go
// back to the menu. Playing here takes the lock: the first tab saves, stops,
// and says where the hero went, and this one reloads to pick up that save.
// (Without Web Locks, in an old browser or a page not served over https or
// from localhost, the game just plays.)

var _heroHere = true;      // false while another tab has this hero
var _heroRelease = null;   // lets go of the lock (LetHeroGo)
var _heroChannel = null;   // tabs tell each other when they've handed over

function HeroLockName() {
  return "pq-hero:" + HeroId(game);
}

function HeroChannel() {
  if (!_heroChannel && typeof BroadcastChannel == "function") _heroChannel = new BroadcastChannel("pq-heroes");
  return _heroChannel;
}

// Start playing, once this tab has the hero. takeOver: from another tab.
function PlayHere(takeOver) {
  if (!document) { StartTimer(); return; }
  if (!navigator.locks) { CatchUp(StartTimer); return; }
  _heroHere = false;
  HeroChannel();
  navigator.locks.request(HeroLockName(), takeOver ? { steal: true } : { ifAvailable: true }, function (lock) {
    if (!lock) { AskToTakeOver(); return; }
    if (takeOver) {
      WaitForHandOver();
      return new Promise(function () {});   // kept until the page reloads
    }
    _heroHere = true;
    CatchUp(StartTimer);
    return new Promise(function (resolve) { _heroRelease = resolve; });   // kept while the page is open
  }).catch(function (err) {
    if (err && err.name == "AbortError") TakenOver();   // another tab took this hero
  });
}

// Let the hero go (the pop-out window plays them next)
function LetHeroGo() {
  StopTimer();
  _heroHere = false;
  if (_heroRelease) _heroRelease();
  _heroRelease = null;
}

// This tab opened a hero another tab is playing
function AskToTakeOver() {
  var name = Get(Traits,'Name');
  WinBox({ title: "Progress Quest Remix", icon: "warn",
           text: name + " is already playing in another tab or window.\n" +
                 "If both played, each would save over the other. Play " + name + " here instead? " +
                 "The other one will save and stop.",
           buttons: [{ label: "Play here", value: "here", primary: true }, { label: "Main menu", value: null }],
           onClose: function (v) {
             if (v == "here") PlayHere(true);
             else window.location.href = "index.html#resume/" + EncodeName(HeroId(game));
           } });
}

// This tab took the hero over: reload once the other tab has saved (or
// after a moment, if it never says)
function WaitForHandOver() {
  var id = HeroId(game), done = false;
  var reload = function () {
    if (done) return;
    done = true;
    SuspendAutosave();
    window.location.reload();
  };
  setTimeout(reload, 2500);
  var channel = HeroChannel();
  if (channel) channel.addEventListener("message", function (e) {
    if (e.data && e.data.handedOver === id) reload();
  });
}

// Another tab took this hero over: save where we are, stop, and say so
function TakenOver() {
  StopTimer();
  StopChoiceAlert();
  CloseEventPopup();
  SaveGame(function () {
    _heroHere = false;
    SuspendAutosave();
    var channel = HeroChannel();
    if (channel) channel.postMessage({ handedOver: HeroId(game) });
    var name = Get(Traits,'Name');
    WinBox({ title: "Progress Quest Remix", icon: "info",
             text: name + " is playing in another tab or window now. This one has saved and stopped, " +
                   "so the two won't save over each other.",
             buttons: [{ label: "Play here again", value: "here" }, { label: "Main menu", value: null, primary: true }],
             onClose: function (v) {
               if (v == "here") PlayHere(true);
               else window.location.href = "index.html#resume/" + EncodeName(HeroId(game));
             } });
  });
}

// ---- Replays (see replay.js) -------------------------------------------------

// A hero's game follows from where it started (game.replay.birth), the
// seeded random numbers, and the player's inputs (game.choiceLog). Every
// K.Replay.Every tasks a fingerprint of the state goes in game.replay.list,
// so a replay of the same game can be checked against it as it goes.
// game.replay.fp identifies the game's code: a replay only means something
// with the same code the hero was played with.
//
// When the game is updated (or the inputs pile up), the replay starts a new
// stretch from that moment: game.replay.birth becomes a copy of the hero as
// they are, and game.replay.since says when and why. A replay checks the
// latest stretch. (It used to stop for good instead, game.replay.frozen,
// and a save that said so wasn't checked at all.)
function CheckpointHash() {
  return SealHash(JSON.stringify([game.tasks, GetI(Traits,'Level'), Math.round(ExpBar.Position() * 1000),
                                  Math.floor(game.elapsed || 0), GetI(Inventory,'Gold'), randseed()]));
}

function RecordCheckpoint() {
  var r = game.replay;
  if (!r || !r.list || game.tasks % K.Replay.Every) return;
  r.list.push([game.tasks, CheckpointHash()]);
}

// Why the next task should start a new stretch: { why, fp }
var _anchorWanted = null;

// Start a new stretch of replay from here. Called between tasks, as the next
// one starts, so a replay can pick up exactly where this leaves off.
function AnchorReplay() {
  var want = _anchorWanted;
  _anchorWanted = null;
  if (!want || game.dead) return;
  var birth = JSON.parse(JSON.stringify(game));
  delete birth.seal;
  delete birth.replay;
  birth.choiceLog = [];
  birth.journal = [];   // (the replay doesn't need the journal)
  birth.seed = randseed();   // the dice, as they are now
  game.replay = { birth: birth, list: [], fp: want.fp || null,
                  since: { t: game.tasks, level: GetI(Traits,'Level'), why: want.why } };
  // older inputs belong to the stretch that just ended
  game.choiceLog = (game.choiceLog || []).filter(function (e) { return e.t >= game.tasks; });
  Log('Replay starts again (' + want.why + ')');
}

// A hero who hasn't done anything yet keeps a copy of where they started
function StartReplay(sheet) {
  if (sheet.replay || (sheet.tasks || 0) > 0) return;
  var birth = JSON.parse(JSON.stringify(sheet));
  delete birth.seal;
  sheet.replay = { birth: birth, list: [], fp: null };
}

// Under different code, the replay starts a new stretch. So does a hero
// from before replays (or whose replay was frozen), from now on.
function CheckReplayCode() {
  GameFingerprint(function (fp) {
    if (!fp || !game || !game.Traits || game.dead) return;
    var r = game.replay;
    if (!r) {
      // (a hero born since replays always has one: see the import scan)
      if ((game.birthVersion || 0) < K.Replay.Since) _anchorWanted = { why: 'start', fp: fp };
    } else if (!r.fp) {
      r.fp = fp;
    } else if (r.fp != fp) {
      _anchorWanted = { why: 'update', fp: fp };
    }
  });
}

// callback(the JSON saved). urgent: the page is going away (see saveHero)
function SaveGame(callback, urgent) {
  // A Hardcore hero who died, or one who retired, has left the roster: a
  // save now (S, Q, the File menu...) would put them back in it. (And a page
  // whose hero didn't load has nothing to save, and one whose hero is playing
  // in another tab mustn't save over it.)
  // (While catching up it saves once, at the end.)
  if (!game || !game.Traits || game.dead || game.retired || !_heroHere || _catchingUp) { if (callback) callback(); return; }
  Log('Saving game: ' + GameSaveName());
  CodexFlush();
  HotOrNot();
  game.date = ''+new Date();
  game.stamp = +new Date();
  game.seed = randseed();
  if (game.mode == 'hardcore') game.saveGen = (game.saveGen || 0) + 1;   // see the Hardcore ledger
  storage.saveHero(game, callback, urgent);
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
  else if (!game.unverified && UnverifiedReason(game, sealState))
    game.unverified = UnverifiedReason(game, sealState);   // sealed in from the next save
  StartReplay(game);
  // The journal's first entry (journal.js), for a new hero or one from before it
  if (typeof JournalBegin == "function" && !game.dead) JournalBegin(!(game.tasks > 0));
  if (document) CheckReplayCode();

  if (document) {
    var title = "Progress Quest Remix - " + GameSaveName();
    $("#title").text(title);
    if (iOS) title = GameSaveName();
    document.title = title;
  }

  randseed(game.seed);
  EnsureStory();
  if (typeof RivalCatchUp == "function") RivalCatchUp();   // (a hero from before rivals)
  // The Codex, and the spells this hero already knows (for heroes from
  // before the Codex)
  if (document && !game.dead) CodexStart(function () {
    $.each(game.Spells || [], function (i, s) { CodexSpell(s[0], toArabic(s[1])); });
    CodexHero();
  });
  $.each(AllBars.concat(AllLists), function (i, e) { e.load(game); });
  // Heroes from before the carrying cap (K.Loot.CarryCap) shrink their pack
  if (EncumBar.Max() != CarryMax()) EncumBar.reset(CarryMax(), EncumBar.Position());
  ShowStory();
  ShowProfile();
  ShowPurse();
  ShowGearPower();
  ShowCondition();
  ShowBuffs();
  ShowRecentEvent();
  ShowRetire();
  ShowLegacy();
  ShowPerks();
  ShowRival();
  ShowOwned();
  if (typeof ShowFeed == "function") ShowFeed(true);
  ShowDaily();
  ShowTactics();
  ShowFight(true);
  if (Kill)
    Kill.text(game.kill);
  ClearAllSelections();
  $.each([Plots,Quests], function () {
    this.CheckAll(true);
  });

  // Hardcore: no going back in time, and the dead stay dead
  if (game.mode == 'hardcore' && !game.dead) {
    var verdict = null;
    storage.loadLedger(function (entries, trusted) { verdict = LedgerVerdict(game, entries, trusted); });
    if (verdict == 'dead') {
      SuspendAutosave();
      alert(Get(Traits,'Name') + " died in Hardcore. Hardcore heroes stay dead.");
      storage.deleteHero(HeroId(game), function () { window.location.href = "index.html#hall/fallen"; });
      return;
    }
    if (verdict == 'older') Brand("an older copy of this Hardcore hero was put back (a rewind)", true);
    if (verdict == 'tampered') Brand("the Hardcore ledger was edited", true);
  }
  ShowBrand();
  CheckForCheating();
  Log('Loaded game: ' + game.Traits.Name);
  if (game.dead) {   // (only if removing a fallen hero from the roster failed)
    ShowDeath(game.dead);
    return;
  }
  if (!game.elapsed)
    Brag('s');
  PlayHere();
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
  // Typing in a box, or a window (the tombstone, Retire, Tactics, a message
  // box) is up: the keys are theirs. The event pop-up is the exception, so
  // 1-9 can answer a choice and the game keys keep working behind it.
  if (e.target && e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
  if (document.querySelector("dialog[open]:not(#EventDialog)")) return;

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

  if (/^[1-9]$/.test(e.key) && ChoicePending()) {
    PickChoice(parseInt(e.key, 10) - 1);
  }

  if (e.key === 't') {
    OpenTactics();
  }

  if (e.key === 'j' && typeof OpenJournal == "function") {
    OpenJournal();
  }

  if (e.key === 'r' && typeof ToggleFeed == "function") {
    ToggleFeed();
  }

  if (e.key === 'e') {
    ToggleEventPopups();
  }

  if (e.key === 'p') {
    TogglePause();
  }

  if (e.key === 'q') {
    quit();
  }

  if (e.key === 's') {
    SaveGame();
    alert('Saved (' + JSON.stringify(game).length + ' bytes).');
  }

  if (e.key === 'w') {
    PopOut();
  }

  if (e.key === 'o' && typeof OpenSettings == "function") {
    OpenSettings();
  }

  if (e.key === '?' && typeof ShowShortcuts == "function") {
    ShowShortcuts();
  }

  /*
  if (e.key === 't') {
    TaskBar.reposition(TaskBar.Max());
  }
  */
}

// P, or Game > Pause
function IsPaused() {
  return !(clock && clock.running);
}

function TogglePause() {
  if (!IsPaused()) {
    $('#paused').css('display', 'block');
    StopTimer();
  } else {
    $('#paused').css('display', '');
    StartTimer();
  }
}

// W, or View > Pop Out: the game in a window of its own
function PopOut() {
  if (window.opener) return;
  SuspendAutosave();  // we're about to save it anyway
  SaveGame(() => {
    let ext = window.open(window.location.href, "Progress Quest Remix",
      `resizable,width=${$("#main")[0].offsetWidth},height=${$("#main")[0].offsetHeight},popup,location=0`);
    if(ext && !ext.closed && typeof ext.closed !== 'undefined') {
      // popup was apparently not blocked: it plays the hero now
      LetHeroGo();
      window.location.href = "index.html#resume";  // this window can go back to the menu
    }
  });
}

// ---- Online play (dormant) --------------------------------------------------
//
// The original Progress Quest reported heroes to progressquest.com: realms,
// guilds, mottos and the online roster. Those servers aren't there for the
// Remix, so this is kept for a server of its own one day, not used now: the
// Multiplayer choice on the character roller is hidden (newguy.css), so
// game.online is never set and none of this but Brag's save ever runs.
//
// Pieces elsewhere: the roller's "create" call (sold() in newguy.js), the B,
// G and M keys (FormKeyDown), the realm in GameSaveName, and RevString and
// UrlEncode in config.js. A new server will want https (an https page can't
// call an http one) and its own way to check heroes (see replay.js).

function InputBox(message, def) {
  return prompt(message, def || '');
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

// A level, an Act, the finale...: save, and (online) tell the server.
// trigger: 's'tart, 'l'evel, 'a'ct, 'f'inale, 'b'rag, 'm'otto.
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
