// The Daily Challenge: one hero a day, the same for everyone.
//
// Everything about it follows from the date (UTC, so the whole world shares
// a day): race, class, name, level, stats, gear, spells, a twist (a
// mutator, and one day in seven Hardcore), a goal, and the seed for every
// roll of the run. Two players who make the same choices and tactics get
// the same game. You have 24 hours from starting it to reach the goal;
// the score is how much play it took.
//
// Goals (K.DailyGoals): reach a level, complete quests, or win fights.
// Each takes about two hours of play for a typical hero at any starting
// level; see the README for how they were measured. (Gold earned and
// winning streaks were tried too, but they swing 10x from hero to hero.)
//
// Depends on config.js, story.js and combat.js. Used by the main menu;
// main.js tracks the goal while the game runs.

K.DailyHours = 24;
K.DailyLevels = [8, 25];     // the hero starts somewhere in this range

K.DailyGoals = {
  level:  { label: "Reach level {target}",
            target: function (L) { return L + (L < 12 ? 8 : L < 16 ? 5 : L < 20 ? 4 : 3); } },
  quests: { label: "Complete {target} quests",
            target: function (L) { return 45; } },
  wins:   { label: "Win {target} fights",
            target: function (L) { return 900; } }
};

// "2026-10-07"
function DailyDate(when) {
  return (when ? new Date(when) : new Date()).toISOString().slice(0, 10);
}

function DailyGoalText(goal) {
  return K.DailyGoals[goal.type].label.replace("{target}", goal.target.toLocaleString());
}

// The day's challenge, without making the hero: what the menu shows
function DailyPlan(date) {
  var rng = new Alea("pq-daily:" + date);
  var R = function (n) { return rng.uint32() % n; };
  var P = function (a) { return a[R(a.length)]; };
  var level = K.DailyLevels[0] + R(K.DailyLevels[1] - K.DailyLevels[0] + 1);
  var types = Object.keys(K.DailyGoals);
  var type = P(types);
  var mutator = R(6) ? P(K.Mutators).key : null;   // most days have a twist
  return {
    date: date,
    rng: rng,
    level: level,
    race: P(K.Races).split("|")[0],
    klass: P(K.Klasses).split("|")[0],
    mutators: mutator ? [mutator] : [],
    hardcore: R(7) == 0,
    goal: { type: type, target: K.DailyGoals[type].target(level) }
  };
}

// Gear of a given power for a slot: the closest item, plus or minus
function DailyGear(posn, power) {
  var list = posn == 0 ? K.Weapons : posn == 1 ? K.Shields : K.Armors;
  var best = list[0], gap = Infinity;
  list.forEach(function (entry) {
    var g = Math.abs(power - parseInt(entry.split("|")[1], 10));
    if (g < gap) { gap = g; best = entry; }
  });
  var plus = power - parseInt(best.split("|")[1], 10);
  return (plus > 0 ? "+" + plus + " " : plus < 0 ? plus + " " : "") + best.split("|")[0];
}

// The hero, ready for the roster
function MakeDaily(date) {
  var plan = DailyPlan(date);
  var rng = plan.rng, L = plan.level;
  var R = function (n) { return rng.uint32() % n; };
  var between = function (lo, hi) { return lo + (hi - lo) * rng(); };

  // The name and the Prologue taunt use the game's own generators, run
  // from the day's seed
  var saved = seed;
  seed = new Alea("pq-daily-name:" + date);
  var name = GenerateName();
  var prologue = PrologueStory();
  seed = new Alea("pq-daily-game:" + date);
  var gameSeed = randseed();   // where the run's random numbers start
  seed = saved;

  var E = ExpectedStat(L), P = ExpectedPool(L);
  var stats = {}, best = "STR";
  K.PrimeStats.forEach(function (s) {
    stats[s] = Math.round(E * between(0.85, 1.15));
    if (stats[s] > stats[best]) best = s;
  });
  stats["HP Max"] = Math.round(P * between(0.9, 1.1));
  stats["MP Max"] = Math.round(P * between(0.9, 1.1));

  var equips = {}, power = {};
  K.Equips.forEach(function (slot, i) {
    power[slot] = Math.max(0, L - 1 + R(3));
    equips[slot] = DailyGear(i, power[slot]);
  });
  var spells = [], have = {};
  var count = 3 + Math.floor(L / 4);
  for (var i = 0; i < count; ++i) {
    var spell = SpellName(K.Spells[R(Math.min(K.Spells.length, 20 + L * 4))]);
    if (have[spell]) continue;
    have[spell] = true;
    spells.push([spell, ["I", "II", "III", "IV", "V"][R(1 + Math.floor(L / 8))]]);   // L <= 32
  }

  // (drawn last, so the rest of the day's hero is as it was before alignments)
  var alignment = K.Alignments[R(K.Alignments.length)] + " " + K.AlignmentFlaws[R(K.AlignmentFlaws.length)];
  var goalText = DailyGoalText(plan.goal);
  var twist = plan.mutators.map(function (k) {
    return K.Mutators.filter(function (m) { return m.key == k; })[0];
  }).filter(Boolean);
  var now = Date.now();
  var carry = Math.max(5, Math.round(CarryFor(stats.STR) * twist.reduce(function (p, m) { return p * (m.carryMult || 1); }, 1)));
  var hp = Math.max(1, Math.round(stats["HP Max"] * twist.reduce(function (p, m) { return p * (m.hpMult || 1); }, 1)));

  var sheet = {
    Traits: { Name: name, Race: plan.race, Class: plan.klass, Alignment: alignment, Level: L },
    dna: gameSeed, seed: gameSeed,
    birthday: "" + new Date(now), birthstamp: now,
    date: "" + new Date(now), stamp: now,
    Stats: stats,
    beststat: best + " " + stats[best],
    task: "", tasks: 0, elapsed: 0,
    bestequip: equips.Weapon,
    Equips: equips, EquipPower: power,
    Inventory: [["Gold", 0]], purse: 0,
    Spells: spells,
    act: 0, bestplot: "Prologue",
    Quests: [], questmonster: "",
    kill: "Loading....",
    ExpBar: { position: 0, max: LevelUpTime(L) },
    EncumBar: { position: 0, max: carry },
    PlotBar: { position: 0, max: 26 },
    QuestBar: { position: 0, max: 1 },
    TaskBar: { position: 0, max: 2000 },
    HPBar: { position: hp, max: hp },
    MPBar: { position: stats["MP Max"], max: stats["MP Max"] },
    saveVersion: SaveVersion, birthVersion: SaveVersion,
    startLevel: L,
    buffs: [], recentEvent: null, finale: null,
    mode: plan.hardcore ? "hardcore" : "normal",
    legacy: null,
    lifeId: "daily-" + date + "-" + now.toString(36),
    saveGen: 0,
    runSeed: "daily-" + date,
    mutators: plan.mutators,
    wins: 0, streak: 0, questsDone: 0, goldEarned: 0,
    tactics: { fights: "normal", resting: "normal", spells: "normal" },
    choiceLog: [],
    deaths: 0, wounded: 0, cheater: null,
    story: prologue,
    daily: { date: date, goal: plan.goal, label: goalText,
             startedAt: now, deadline: now + K.DailyHours * 3600 * 1000,
             start: { level: L, quests: 0, gold: 0, wins: 0 }, status: "" },
    queue: [
      "scene|6|Experiencing an enigmatic and foreboding night vision... The Old Bastard\u2122 appears and sneers: \u201c" + prologue.taunt + "\u201d",
      "scene|5|Daily Challenge for " + date + ": " + goalText + ". You have " + K.DailyHours + " hours",
      twist.length ? "scene|5|Today's twist: " + twist[0].label + ". " + twist[0].help : "scene|3|No twist today. Lucky you",
      plan.hardcore ? "scene|5|And today is Hardcore: one life. Good luck" : "scene|3|Off you go",
      "plot|2|Loading ..."
    ]
  };
  sheet.storyLog = [{ act: 0, key: prologue.key, title: prologue.title, purpose: prologue.purpose,
                      taunt: prologue.taunt,
                      ending: sheet.queue.filter(function (q) { return q.split("|")[0] == "scene"; })
                                         .map(function (q) { return q.split("|").slice(2).join("|"); }) }];
  return sheet;
}
