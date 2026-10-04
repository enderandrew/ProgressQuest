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

// from 3 to 13 InterplotCinematics
function InterplotCinematic() {
  switch (Random(13)) {
  case 0:
    Q('task|4|Exhausted from endless questing, you arrive at a friendly oasis in a hostile land.');
    Q('task|4|You greet old friends and meet new allies. Those NPCs are the DMs former PCs.');
    Q('task|4|You are privy to a council of powerful do-gooders. There is much to be done.');
    Q('task|4|Unsurprisingly, you are chosen to go forth. Time to Progress more!');
	Q('task|4|You resume your quest to go after that Old Bastard™ from your vision.');
    break;
  case 1:
    Q('task|4|Your quarry is in sight, but a mighty enemy bars your path!');
    var nemesis = NamedMonster(GetI(Traits,'Level')+3);
    Q('task|4|A desperate struggle commences with ' + nemesis);
    var s = Random(3);
    for (var i = 1; i <= Random(1 + game.act + 1); ++i) {
      s += 1 + Random(2);
      switch (s % 3) {
      case 0: Q('task|4|Locked in grim combat with ' + nemesis); break;
      case 1: Q('task|4|' + nemesis + ' seems to have the upper hand'); break;
      case 2: Q('task|4|You seem to gain the advantage over ' + nemesis); break;
      }
    }
    Q('task|4|Victory! ' + nemesis + ' is slain! Exhausted, you lose consciousness');
    Q('task|4|You awake in a friendly place, but the road awaits');
	Q('task|4|You resume your quest to go after that Old Bastard™ from your vision.');
    break;
  case 2:
    var nemesis2 = ImpressiveGuy();
    Q("task|4|Oh sweet relief! You've reached the kind protection of " + nemesis2);
    Q('task|4|There is rejoicing, and an unnerving encounter with ' + nemesis2 + ' in private');
    Q('task|4|You forget your ' + BoringItem() + ' and go back to get it');
    Q("task|4|What's this!? You overhear something shocking!");
    Q('task|4|Could ' + nemesis2 + ' be a dirty double-dealer?');
    Q('task|4|Who can possibly be trusted with this news!? -- Oh yes, of course');
	Q('task|4|You resume your quest to go after that Old Bastard™ from your vision.');
    break;
  case 3:
    var maguffin = SpecialItem();
	var giver = PickLow(K.Titles) + ' ' + GenerateName();
	var liar = ImpressiveGuy();
	var kingdom = GenerateName();
	Q('task|4|You were asked by ' + giver + ' to find the sacred ' + maguffin + ' to save their village.');
    Q('task|4|You were told by ' + liar + ' that it could be found in the lands of ' + kingdom);
    Q('task|4|You searched high and low only to find out that ' + liar + ' intentionally misled you.');
    Q('task|4|Apparently ' + liar + ' already stole and sold ' + maguffin + ' on Ye Olde eBay.');
    Q('task|4|I guess ' + giver + ' and their suffering village will just have to go without.');
    Q('task|4|You decide that the real ' + maguffin + ' was the friends you made along the way.');
	Q('task|4|You resume your quest to go after that Old Bastard™ from your vision.');
    break;
  case 4:
    var kingdom1 = GenerateName();
	var kingdom2 = GenerateName();
	var lover1 = ImpressiveGuy();
	var lover2 = ImpressiveGuy();
	Q('task|4|The kingdoms of ' + kingdom1 + ' and ' + kingdom2 + ' have long been at war.');
    Q('task|4|The rulers negotiated peace and would unite with the wedding of ' + lover1 + ' and ' + lover2);
    Q('task|4|The wedding was called off after accusations of infidelity and now war seems imminent.');
    Q('task|4|Only a hero of your caliber can restore the peace and prevent this bloody conflict.');
    Q('task|4|You seduce ' + lover1 + ' and then also seduce ' + lover2);
    Q('task|4|Both are satiated and content for the moment. Peace is restored for the time being.');
	Q('task|4|You resume your quest to go after that Old Bastard™ from your vision.');
    break;
  case 5:
    var kingdom = GenerateName();
	var kidnapped = ImpressiveGuy();
	var ruler = ImpressiveGuy();
	var nemesis = NamedMonster(GetI(Traits,'Level')+3);
	Q('task|4|You have been tasked with rescuing ' + kidnapped + ' of the ' + kingdom + ' kingdom.');
    Q('task|4|Their ruler ' + ruler + ' tells you ' + nemesis + ' kidnapped ' + kidnapped);
    Q('task|4|You go off to slay the mighty ' + nemesis + ' and rescue ' + kidnapped);
    Q('task|4|It is a dangerous journey but you continue undaunted.');
    Q('task|4|You discover they eloped and are about to wed. This is awkward.');
    Q('task|4|You tell ' + ruler + ' that ' + kidnapped + ' is dead so they can continue their secret love.');
	Q('task|4|You resume your quest to go after that Old Bastard™ from your vision.');
    break;
  case 6:
    Q('task|4|You feel your great quest is at a crucial turning point.');
    Q('task|4|Have you grown so strong in your questing that you are prepared?');
    Q('task|4|Can you defeat your nemesis and right the wrong that started all of this?');
    Q('task|4|You are no longer the same person who initially set out.');
	Q('task|4|You know that true change comes from within.');
	Q('task|4|Or is that gas?');
	Q('task|4|You resume your quest to go after that Old Bastard™ from your vision.');
    break;
  case 7:
    Q('task|4|WAIT. Is that him?');
    Q('task|4|Is that the Old Bastard™ from your vision?');
    Q('task|4|Is this the moment you have been questing for?');
    Q('task|4|You brace yourself for the final battle. One way or another, this ends now.');
	Q('task|4|errrr....');
	Q('task|4|Nevermind, that is just the fishmonger. Moving on.');
	Q('task|4|You resume your quest to go after that Old Bastard™ from your vision.');
    break;
  case 8:
    Q('task|4|You cannot sleep. The nightmares continue.');
    Q('task|4|That Old Bastard™ haunts your visions.');
    Q('task|4|But deep down you know you are not ready for the final showdown.');
    Q('task|4|All epic tales need grinding.');
	Q('task|4|Let us grind longer. The Old Bastard™ from your vision can wait.');
    break;
  case 9:
    Q('task|4|You feel accomplished. That was quite the quest you just finished.');
    Q('task|4|This feels like a natural stopping point as if some chapter or act finished.');
    Q('task|4|But you can\'t stop. You just take a brief break.');
    Q('task|4|You use the chamber pot. You forage for snacks.');
	Q('task|4|You are ready to continue this super-epic journey. The Old Bastard™ will pay!');
    break;
  case 10:
    Q('task|4|You pause and take stock of your current situation.');
    Q('task|4|You have come so far but you have not stopped the Old Bastard™.');
    Q('task|4|But you did kill a lot of monsters and you have a sack of gold.');
    Q('task|4|You could buy a tavern, retire and live a quiet, happy life speaking of your adventures.');
	Q('task|4|No, you will continue until you get that Old Bastard™!');
    break;
  case 11:
    var nemesis1 = NamedMonster(GetI(Traits,'Level')+3);
	var nemesis2 = NamedMonster(GetI(Traits,'Level')+3);
    Q('task|4|You wipe the blood off your weapon. Actually you are covered in gore.');
    Q('task|4|There are bits of ' + nemesis1 + ' on your boots.');
    Q('task|4|You never could quite wash the viscera from ' + nemesis2 + ' out of your hair.');
    Q('task|4|You have come so far in your journey, but you also probably need a good bath.');
	Q('task|4|Not time for a bath because you must get that Old Bastard™!');
    break;
  case 12:
    Q('task|4|You pause and a thought occurs to you.');
    Q('task|4|You spend all your time on the Killing Fields™ and have yet to find the Old Bastard™.');
    Q('task|4|Should you look somewhere else?');
    Q('task|4|But there are lots of monsters on the killing field and they drop lots of gold.');
	Q('task|4|You like gold, so back to the Killing Fields™!');
    break;
  }
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
    } else if (game.task == 'rest' || game.task == 'heal') {
      if (game.task == 'heal') PayTemple();
      RestoreHealth();
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
    game.task = '';
    if (game.queue.length > 0) {
      var a = Split(game.queue[0],0);
      var n = StrToInt(Split(game.queue[0],1));
      var s = Split(game.queue[0],2);
      if (a == 'task' || a == 'plot' || a == 'heal') {
        game.queue.shift();
        if (a == 'plot') {
          CompleteAct();
          s = 'Loading ' + game.bestplot;
        }
        Task(s, n * 1000);
        if (a == 'heal') game.task = 'heal';
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
      var t = MonsterTask(nn);
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
    hp: HPBar.Position(), hpMax: GetI(Stats,'HP Max'),
    mp: MPBar.Position(), mpMax: GetI(Stats,'MP Max'),
    weapon: SlotPower('Weapon'),
    armor: ArmorPowerAvg(),
    physicality: CharProfile().physicality,
    wounded: game.wounded > 0,
    spells: game.Spells.map(function (s) {
      return { name: s[0], level: toArabic(s[1]), roman: s[1], type: SpellType(s[0]) };
    })
  };
  $.each(K.PrimeStats, function (i, stat) { hero[stat] = GetI(Stats, stat); });
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
  ShowCondition();
}

// Seconds at the temple: longer at higher levels, shorter with more CON
function RecoveryTime() {
  var D = K.Defeat;
  var level = GetI(Traits,'Level');
  var con = GetI(Stats,'CON') / ExpectedStat(level);
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
  var con = GetI(Stats,'CON') / ExpectedStat(GetI(Traits,'Level'));
  return Math.round(1000 * (3 + 5 * hurt) / Min(2, Max(0.5, con)));
}

function RestoreHealth() {
  HPBar.reset(GetI(Stats,'HP Max'), GetI(Stats,'HP Max'));
  MPBar.reset(GetI(Stats,'MP Max'), GetI(Stats,'MP Max'));
}

// ---- Loot ---------------------------------------------------------------

// CHA against what is typical for your level, turned into a multiplier:
// 1 for an average character, more for a charming one, within [lo, hi].
function ChaFactor(slope, lo, hi) {
  var r = GetI(Stats,'CHA') / ExpectedStat(GetI(Traits,'Level'));
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
    HPBar.reset(value, HPBar.Position());
  if (key === 'MP Max')
    MPBar.reset(value, MPBar.Position());

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
  AddR(Spells, SpellName(K.Spells[RandomLow(Min(GetI(Stats,'WIS')+GetI(Traits,'Level'),
                                                K.Spells.length))]), 1);
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
  var caption;
  switch (Random(5)) {
  case 0:
    var level = GetI(Traits,'Level');
    var lev = 0;
    for (var i = 1; i <= 4; ++i) {
      var montag = Random(K.Monsters.length);
      var m = K.Monsters[montag];
      var l = StrToInt(Split(m,1));
      if (i == 1 || Abs(l - level) < Abs(lev - level)) {
        lev = l;
        game.questmonster = m;
        game.questmonsterindex = montag;
      }
    }
    caption = 'Exterminate ' + Definite(Split(game.questmonster,0),2);
    break;
  case 1:
    caption = 'Seek ' + Definite(InterestingItem(), 1);
    break;
  case 2:
    caption = 'Deliver this ' + BoringItem();
    break;
  case 3:
    caption = 'Fetch me ' + Indefinite(BoringItem(), 1);
    break;
  case 4:
    var mlev = 0;
    level = GetI(Traits,'Level');
    for (var ii = 1; ii <= 2; ++ii) {
      montag = Random(K.Monsters.length);
      m = K.Monsters[montag];
      l = StrToInt(Split(m,1));
      if ((ii == 1) || (Abs(l - level) < Abs(mlev - level))) {
        mlev = l;
        game.questmonster = m;
      }
    }
    caption = 'Placate ' + Definite(Split(game.questmonster,0),2);
    game.questmonster = '';  // We're trying to placate them, after all
    break;
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
  Plots.AddUI((game.bestplot = 'Act ' + toRoman(game.act)));

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
    Kill.text(game.kill);
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
  } else {
    var elapsed = timeGetTime() - clock.lasttick;
    if (elapsed > 100) elapsed = 100;
    if (elapsed < 0) elapsed = 0;
    TaskBar.increment(elapsed);
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
      this.AddUI(i ? 'Act ' + toRoman(i) : "Prologue");

  };

  AllLists = [Traits,Stats,Spells,Equips,Inventory,Plots,Quests];

  if (document) {
    Kill = $("#Kill");

    $("#quit").on("click", quit);

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
      window.location.href = "roster.html";
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
    window.location.href = "roster.html";
    return;
  }

  try {
    game = MigrateSave(sheet);
  } catch (err) {
    alert(err.message);
    window.location.href = "roster.html";
    return;
  }

  if (document) {
    var title = "Progress Quest Remix - " + GameSaveName();
    $("#title").text(title);
    if (iOS) title = GameSaveName();
    document.title = title;
  }

  randseed(game.seed);
  $.each(AllBars.concat(AllLists), function (i, e) { e.load(game); });
  ShowProfile();
  ShowPurse();
  ShowGearPower();
  ShowCondition();
  if (Kill)
    Kill.text(game.kill);
  ClearAllSelections();
  $.each([Plots,Quests], function () {
    this.CheckAll(true);
  });

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
        window.location.href = "roster.html";  // this window can go back to the roster
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
