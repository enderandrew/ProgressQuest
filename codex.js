// The Codex and achievements: what all your heroes have seen, kept in this
// browser like the Hall of Legends.
//
//   Bestiary   every kind of monster in K.Monsters: how many your heroes
//              have slain, how many times it beat them, who slew one first
//   Spellbook  every spell in K.Spells: the highest level any hero has
//              known it at, and who learned it first
//   Journal    every event in K.Events: how often it happened, how it first
//              went, and which way each choice was decided
//   Uniques    every unique piece of gear taken from a named elite (K.Elite
//              in combat.js): no list to fill in, since every one is new
//   Achievements (K.Achievements below), unlocked once for good
//
// Heroes branded cheaters add nothing. The Codex is sealed like a save; if
// it is edited outside the game it is marked as such for good.
//
// Recording is cheap: changes go into the copy in memory and into a list
// of changes (Codex.delta), and every so often (and when the game saves)
// the changes are added to what is stored. That way two heroes playing in
// two tabs both get counted.
//
// Depends on config.js. In the game, main.js calls the Codex* functions;
// the menu (menu.js) shows the window.

K.Achievements = [
  // The climb
  { key: "firstblood", icon: "⚔", label: "First Blood (Mostly Theirs)", help: "Win a fight.",
    value: function (c) { return c.totals.wins || 0; }, goal: 1 },
  { key: "level10", icon: "⭐", label: "Double Digits", help: "Reach level 10.",
    value: function (c) { return c.bestLevel; }, goal: 10 },
  { key: "level25", icon: "⭐", label: "Halfway to Somewhere", help: "Reach level 25.",
    value: function (c) { return c.bestLevel; }, goal: 25 },
  { key: "level50", icon: "🌟", label: "The Big Five-Oh", help: "Reach level 50.",
    value: function (c) { return c.bestLevel; }, goal: 50 },
  { key: "boss", icon: "💀", label: "Vengeance Is Mine (Eventually)", help: "Beat the Old Bastard™.",
    value: function (c) { return c.flag("boss"); }, goal: 1 },
  { key: "bossfirst", icon: "🎯", label: "One and Done", help: "Beat the Old Bastard™ on the first try.",
    value: function (c) { return c.flag("bossfirst"); }, goal: 1 },
  { key: "touchgrass", icon: "🌿", label: "Touch Grass", help: "Play one hero for 24 hours.",
    value: function (c) { return Math.floor(c.bestHours); }, goal: 24 },

  // The Hall
  { key: "retire", icon: "🏆", label: "Gold Watch", help: "Retire a hero to the Hall of Legends.",
    value: function (c) { return c.legends; }, goal: 1 },
  { key: "legends5", icon: "🏆", label: "Hall Monitor", help: "Have 5 legends in the Hall.",
    value: function (c) { return c.legends; }, goal: 5 },
  { key: "races", icon: "🧬", label: "Playing the Race Card", help: "Honor all 24 races.",
    value: function (c) { return c.races; }, goal: 24 },
  { key: "klasses", icon: "🎓", label: "Class Act", help: "Honor all 24 classes.",
    value: function (c) { return c.klasses; }, goal: 24 },
  { key: "legacy48", icon: "👑", label: "Legacy of Legacies", help: "Honor every race and every class.",
    value: function (c) { return c.races + c.klasses; }, goal: 48 },

  // Hardcore
  { key: "hc25", icon: "☠", label: "Living Dangerously", help: "Reach level 25 in Hardcore.",
    value: function (c) { return c.bestHardcore; }, goal: 25 },
  { key: "hcboss", icon: "☠", label: "Death Takes a Holiday", help: "Beat the Old Bastard™ in Hardcore.",
    value: function (c) { return c.flag("bosshc"); }, goal: 1 },
  { key: "fallen1", icon: "🪦", label: "Press F", help: "Lose a hero in Hardcore.",
    value: function (c) { return c.fallen; }, goal: 1 },
  { key: "fallen10", icon: "🪦", label: "Graveyard Shift", help: "Have 10 heroes in the Hall of the Fallen.",
    value: function (c) { return c.fallen; }, goal: 10 },

  // Challenges
  { key: "daily1", icon: "📅", label: "Daily Grind", help: "Complete a Daily Challenge.",
    value: function (c) { return c.dailies; }, goal: 1 },
  { key: "daily7", icon: "📅", label: "A Week of Grinds", help: "Complete 7 Daily Challenges.",
    value: function (c) { return c.dailies; }, goal: 7 },
  { key: "dailyhc", icon: "📅", label: "Daily Dose of Danger", help: "Complete a Hardcore Daily Challenge.",
    value: function (c) { return c.flag("dailyhc"); }, goal: 1 },
  { key: "mutboss", icon: "🧪", label: "Bad Ideas, Good Results", help: "Beat the Old Bastard™ with a mutator.",
    value: function (c) { return c.bossMutators ? 1 : 0; }, goal: 1 },
  { key: "mutall", icon: "🧪", label: "Glutton for Punishment", help: "Beat the Old Bastard™ under every mutator (not all at once).",
    value: function (c) { return c.bossMutators; }, goal: function () { return K.Mutators ? K.Mutators.length : 6; } },

  // Fighting
  { key: "streak50", icon: "🔥", label: "Unstoppable-ish", help: "Win 50 fights in a row.",
    value: function (c) { return c.best.streak || 0; }, goal: 50 },
  { key: "streak100", icon: "🔥", label: "Actually Unstoppable", help: "Win 100 fights in a row.",
    value: function (c) { return c.best.streak || 0; }, goal: 100 },
  { key: "wins1k", icon: "🪤", label: "Professional Exterminator", help: "Win 1,000 fights, all heroes together.",
    value: function (c) { return c.totals.wins || 0; }, goal: 1000 },
  { key: "wins10k", icon: "🪤", label: "Ecological Disaster", help: "Win 10,000 fights, all heroes together.",
    value: function (c) { return c.totals.wins || 0; }, goal: 10000 },
  { key: "defeats100", icon: "🥊", label: "Professional Punching Bag", help: "Be defeated 100 times with one hero.",
    value: function (c) { return c.best.defeats || 0; }, goal: 100 },
  { key: "gold1m", icon: "💰", label: "Nest Egg", help: "Earn 1,000,000 gold, all heroes together.",
    value: function (c) { return c.totals.gold || 0; }, goal: 1000000 },
  { key: "gold10m", icon: "💰", label: "Dragon Hoard", help: "Earn 10,000,000 gold, all heroes together.",
    value: function (c) { return c.totals.gold || 0; }, goal: 10000000 },

  // Spending it
  { key: "splurge", icon: "💸", label: "Money to Burn", help: "Have so much gold that your hero splurges on something.",
    value: function (c) { return c.sinks; }, goal: 1 },
  { key: "tavern", icon: "🍺", label: "The Retirement Plan", help: "Buy a tavern.",
    value: function (c) { return c.flag("sink:tavern"); }, goal: 1 },
  { key: "spent1m", icon: "💸", label: "Conspicuous Consumption", help: "Splurge 1,000,000 gold, all heroes together.",
    value: function (c) { return c.totals.spent || 0; }, goal: 1000000 },
  { key: "sinksall", icon: "🛍", label: "Retail Therapy", help: "Splurge on every kind of thing there is.",
    value: function (c) { return c.sinks; }, goal: function () { return K.Sinks ? K.Sinks.length : 19; } },

  // The Codex
  { key: "beasts100", icon: "📖", label: "Amateur Zoologist", help: "Slay 100 kinds of monster.",
    value: function (c) { return c.monsters; }, goal: 100 },
  { key: "beasts400", icon: "📖", label: "Monster Hunter", help: "Slay 400 kinds of monster.",
    value: function (c) { return c.monsters; }, goal: 400 },
  { key: "beastsall", icon: "📖", label: "Gotta Slay 'Em All", help: "Slay every kind of monster in the Bestiary.",
    value: function (c) { return c.monsters; }, goal: function () { return K.Monsters.length; } },
  { key: "spells25", icon: "📜", label: "Bookworm", help: "Learn 25 different spells.",
    value: function (c) { return c.spells; }, goal: 25 },
  { key: "spells100", icon: "📜", label: "Arcane Hoarder", help: "Learn 100 different spells.",
    value: function (c) { return c.spells; }, goal: 100 },
  { key: "spells200", icon: "🧙", label: "Archmage (Self-Certified)", help: "Learn 200 different spells.",
    value: function (c) { return c.spells; }, goal: 200 },
  { key: "elite1", icon: "👑", label: "Big Game Hunter", help: "Slay a named elite.",
    value: function (c) { return c.totals.elites || 0; }, goal: 1 },
  { key: "elite10", icon: "👑", label: "Rogues' Gallery", help: "Slay 10 named elites, all heroes together.",
    value: function (c) { return c.totals.elites || 0; }, goal: 10 },
  { key: "uniques25", icon: "🗡", label: "One of a Kind (Times 25)", help: "Collect 25 uniques in the Codex.",
    value: function (c) { return c.uniques; }, goal: 25 },
  { key: "events25", icon: "📰", label: "Eventful", help: "Witness 25 different events.",
    value: function (c) { return c.events; }, goal: 25 },
  { key: "eventsall", icon: "📰", label: "Seen It All", help: "Witness every event in the Journal.",
    value: function (c) { return c.events; }, goal: function () { return K.Events ? K.Events.length : 1; } },
  { key: "decisive", icon: "👆", label: "Decisive", help: "Make 25 choices yourself.",
    value: function (c) { return c.totals.choseYou || 0; }, goal: 25 },
  { key: "fate", icon: "🎲", label: "Whatever, Fate", help: "Let fate decide 25 times.",
    value: function (c) { return c.totals.choseFate || 0; }, goal: 25 },

  // Secrets: shown as ??? until found
  { key: "konami", icon: "🎮", label: "Nice Try", help: "Enter the Konami code.", secret: true,
    value: function (c) { return c.flag("konami"); }, goal: 1 },
  { key: "recursing", icon: "💻", label: "No Recursing!", help: "Run pq.exe inside Progress Quest.", secret: true,
    value: function (c) { return c.flag("icon:pq.exe"); }, goal: 1 },
  { key: "tourist", icon: "🖱", label: "Desktop Tourist", help: "Open every icon on the desktop.", secret: true,
    value: function (c) { return c.icons; }, goal: function () { return typeof DesktopIcons != "undefined" ? DesktopIcons.length : 7; } },
  { key: "petrock", icon: "🪨", label: "Rock Solid", help: "Reach level 10 still wielding the Pet Rock.", secret: true,
    value: function (c) { return c.flag("petrock"); }, goal: 1 }
];

function AchievementGoal(a) {
  return typeof a.goal == "function" ? a.goal() : a.goal;
}

// ---- Storage -----------------------------------------------------------------

function CodexEmpty() {
  return { monsters: {}, spells: {}, events: {}, uniques: {}, achievements: {}, totals: {}, best: {}, flags: {} };
}

// The text this page last stored (or found sealed and untouched): no need
// to check its seal again on every flush
var _codexChecked = null;

storage.loadCodex = function (callback) {
  this.getItem("codex", function (value) {
    var book = null;
    try { book = JSON.parse(value || "null"); } catch (e) { book = null; }
    if (!book || typeof book != "object") { callback(CodexEmpty()); return; }
    var ok = value === _codexChecked || SealOk(book);
    if (ok) _codexChecked = value;
    var fresh = CodexEmpty();
    for (var part in fresh) if (!book[part] || typeof book[part] != "object") book[part] = fresh[part];
    if (!ok) book.edited = true;   // for good: the seal now covers this
    delete book.seal;
    callback(book);
  });
};

storage.storeCodex = function (book, callback) {
  var copy = Object.assign({}, book);
  delete copy.seal;
  var text = JSON.stringify(Seal(copy));
  _codexChecked = text;
  this.setItem("codex", text, callback);
};

// Add one set of changes to a book (both have CodexEmpty's shape)
function CodexMerge(into, d) {
  var first = function (to, from) {
    if (!to.by && from.by) { to.by = from.by; to.at = from.at; }
  };
  Object.keys(d.monsters).forEach(function (k) {
    var to = into.monsters[k] = into.monsters[k] || {}, from = d.monsters[k];
    to.k = (to.k || 0) + (from.k || 0);
    to.l = (to.l || 0) + (from.l || 0);
    if (from.e) to.e = (to.e || 0) + from.e;
    first(to, from);
  });
  Object.keys(d.spells).forEach(function (k) {
    var to = into.spells[k] = into.spells[k] || {}, from = d.spells[k];
    to.lv = Math.max(to.lv || 0, from.lv || 0);
    first(to, from);
  });
  Object.keys(d.events).forEach(function (k) {
    var to = into.events[k] = into.events[k] || {}, from = d.events[k];
    to.n = (to.n || 0) + (from.n || 0);
    if (!to.line && from.line) to.line = from.line;
    if (from.picks) {
      to.picks = to.picks || {};
      Object.keys(from.picks).forEach(function (i) {
        var p = to.picks[i] = to.picks[i] || { you: 0, fate: 0 };
        p.you += from.picks[i].you || 0;
        p.fate += from.picks[i].fate || 0;
      });
    }
    first(to, from);
  });
  Object.keys(d.uniques || {}).forEach(function (k) {
    if (!into.uniques[k]) into.uniques[k] = d.uniques[k];
  });
  CodexTrimUniques(into);
  Object.keys(d.achievements).forEach(function (k) {
    if (!into.achievements[k]) into.achievements[k] = d.achievements[k];
  });
  Object.keys(d.totals).forEach(function (k) { into.totals[k] = (into.totals[k] || 0) + d.totals[k]; });
  Object.keys(d.best).forEach(function (k) { into.best[k] = Math.max(into.best[k] || 0, d.best[k]); });
  Object.keys(d.flags).forEach(function (k) { into.flags[k] = into.flags[k] || d.flags[k]; });
  return into;
}

// The Codex keeps the newest CodexUniquesMax uniques (every hero finds dozens,
// and the Codex lives in the browser's small storage)
var CodexUniquesMax = 500;
function CodexTrimUniques(book) {
  var names = Object.keys(book.uniques || {});
  if (names.length <= CodexUniquesMax) return;
  names.sort(function (a, b) { return String(book.uniques[b].at).localeCompare(String(book.uniques[a].at)); })
    .slice(CodexUniquesMax).forEach(function (n) { delete book.uniques[n]; });
}

// Combine a backup with a book: the larger of each count, so restoring the
// same backup twice changes nothing
function CodexUnion(into, other) {
  var max = function (a, b) { return Math.max(a || 0, b || 0); };
  var first = function (to, from) { if (!to.by && from.by) { to.by = from.by; to.at = from.at; } };
  Object.keys(other.monsters || {}).forEach(function (k) {
    var to = into.monsters[k] = into.monsters[k] || {}, from = other.monsters[k];
    to.k = max(to.k, from.k); to.l = max(to.l, from.l); first(to, from);
    if (from.e) to.e = max(to.e, from.e);
  });
  Object.keys(other.spells || {}).forEach(function (k) {
    var to = into.spells[k] = into.spells[k] || {}, from = other.spells[k];
    to.lv = max(to.lv, from.lv); first(to, from);
  });
  Object.keys(other.events || {}).forEach(function (k) {
    var to = into.events[k] = into.events[k] || {}, from = other.events[k];
    to.n = max(to.n, from.n);
    if (!to.line && from.line) to.line = from.line;
    Object.keys(from.picks || {}).forEach(function (i) {
      to.picks = to.picks || {};
      var p = to.picks[i] = to.picks[i] || { you: 0, fate: 0 };
      p.you = max(p.you, from.picks[i].you); p.fate = max(p.fate, from.picks[i].fate);
    });
    first(to, from);
  });
  ["totals", "best"].forEach(function (part) {
    Object.keys(other[part] || {}).forEach(function (k) { into[part][k] = max(into[part][k], other[part][k]); });
  });
  ["uniques", "achievements", "flags"].forEach(function (part) {
    Object.keys(other[part] || {}).forEach(function (k) { if (!into[part][k]) into[part][k] = other[part][k]; });
  });
  CodexTrimUniques(into);
  return into;
}

// ---- Recording -----------------------------------------------------------

var Codex = { book: null, delta: CodexEmpty(), dirty: false, timer: null, counts: null };

function CodexLoad(callback) {
  storage.loadCodex(function (book) {
    // anything recorded before the book arrived goes on top
    Codex.book = CodexMerge(book, Codex.delta);
    Codex.counts = null;
    if (callback) callback(Codex.book);
  });
}

// Save the changes (merged into whatever another tab stored meanwhile)
function CodexFlush(callback) {
  if (!Codex.dirty) { if (callback) callback(); return; }
  var delta = Codex.delta;
  Codex.delta = CodexEmpty();
  Codex.dirty = false;
  storage.loadCodex(function (stored) {
    CodexMerge(stored, delta);
    storage.storeCodex(stored, function () {
      Codex.book = CodexMerge(stored, Codex.delta);   // plus anything new meanwhile
      Codex.counts = null;
      if (callback) callback();
    });
  });
}

// Changes are saved within half a minute, and when the page goes away
function CodexChanged() {
  Codex.dirty = true;
  Codex.counts = null;
  if (typeof document == "undefined" || !document) return;   // (the simulator keeps it in memory)
  if (!Codex.timer) Codex.timer = setTimeout(function () { Codex.timer = null; CodexFlush(); }, 30000);
}

// The same change to the book in memory and to the list of changes
function CodexApply(fn) {
  if (!Codex.book) Codex.book = CodexEmpty();
  fn(Codex.book);
  fn(Codex.delta);
  CodexChanged();
}

function CodexWho() {
  return { by: typeof game != "undefined" && game && game.Traits ? game.Traits.Name : "",
           at: new Date().toISOString().slice(0, 10) };
}

// Is this hero adding to the Codex? (Not a branded cheater.)
function CodexOn() {
  return typeof game != "undefined" && !!game && !game.cheater;
}

function CodexMonster(name, won) {
  if (!CodexOn() || !name) return;
  var who = CodexWho();
  CodexApply(function (b) {
    var m = b.monsters[name] = b.monsters[name] || {};
    if (won) { m.k = (m.k || 0) + 1; if (!m.by) { m.by = who.by; m.at = who.at; } }
    else m.l = (m.l || 0) + 1;
  });
}

function CodexSpell(name, level) {
  if (!CodexOn() || !name) return;
  var known = Codex.book && Codex.book.spells[name];
  if (known && known.lv >= level) return;
  var who = CodexWho();
  CodexApply(function (b) {
    var s = b.spells[name] = b.spells[name] || {};
    s.lv = Math.max(s.lv || 0, level);
    if (!s.by) { s.by = who.by; s.at = who.at; }
  });
}

function CodexEvent(key, line) {
  if (!CodexOn() || !key) return;
  var who = CodexWho();
  CodexApply(function (b) {
    var e = b.events[key] = b.events[key] || {};
    e.n = (e.n || 0) + 1;
    if (!e.line) e.line = line;
    if (!e.by) { e.by = who.by; e.at = who.at; }
  });
}

// A named elite slain, and the unique it gave up
function CodexElite(e, item, level) {
  if (!CodexOn() || !e) return;
  var who = CodexWho();
  CodexApply(function (b) {
    var m = b.monsters[e.kind] = b.monsters[e.kind] || {};
    m.e = (m.e || 0) + 1;
    if (item && !b.uniques[item.name])
      b.uniques[item.name] = { slot: item.slot, power: item.power, from: e.name, kind: e.kind,
                               lv: level, by: who.by, at: who.at };
    b.totals.elites = (b.totals.elites || 0) + 1;
  });
  CheckAchievements();
}

function CodexChoice(key, pick, by) {
  if (!CodexOn() || !key) return;
  CodexApply(function (b) {
    var e = b.events[key] = b.events[key] || {};
    e.picks = e.picks || {};
    var p = e.picks[pick] = e.picks[pick] || { you: 0, fate: 0 };
    p[by == "you" ? "you" : "fate"] += 1;
    var t = by == "you" ? "choseYou" : "choseFate";
    b.totals[t] = (b.totals[t] || 0) + 1;
  });
}

function CodexBump(total, n) {
  if (!CodexOn() || !n) return;
  CodexApply(function (b) { b.totals[total] = (b.totals[total] || 0) + n; });
}

function CodexBest(key, value) {
  if (!CodexOn()) return;
  if (Codex.book && (Codex.book.best[key] || 0) >= value) return;
  CodexApply(function (b) { b.best[key] = Math.max(b.best[key] || 0, value); });
}

// Flags anyone can set: the Konami code and the desktop work on the menu too
function CodexFlag(flag) {
  if (typeof game != "undefined" && game && game.cheater) return;
  if (Codex.book && Codex.book.flags[flag]) return;
  CodexApply(function (b) { b.flags[flag] = CodexWho().at; });
  CheckAchievements();
}

// ---- Achievements --------------------------------------------------------------

// What the achievements look at. extra: { legends, fallen, dailies } from
// the menu or the game (loaded once; they change only between pages).
var CodexExtra = { legends: [], fallen: [], dailies: {} };

function CodexContext() {
  var b = Codex.book || CodexEmpty();
  if (!Codex.counts) {
    var slain = 0;
    Object.keys(b.monsters).forEach(function (k) { if (b.monsters[k].k) slain++; });
    var mutators = 0;
    (K.Mutators || []).forEach(function (m) { if (b.flags["boss:" + m.key]) mutators++; });
    var icons = 0, sinks = 0;
    Object.keys(b.flags).forEach(function (k) {
      if (/^icon:/.test(k)) icons++;
      if (/^sink:/.test(k)) sinks++;
    });
    var legends = (CodexExtra.legends || []).filter(LegendCounts);
    var hall = typeof LegacyFromHall == "function" ? LegacyFromHall(CodexExtra.legends || []) : { races: [], klasses: [] };
    var dailies = 0;
    Object.keys(CodexExtra.dailies || {}).forEach(function (d) {
      var e = CodexExtra.dailies[d];
      if (e && e.status == "done" && !e.cheater && SealOk(e)) dailies++;
    });
    Codex.counts = {
      monsters: slain, spells: Object.keys(b.spells).length, events: Object.keys(b.events).length,
      uniques: Object.keys(b.uniques || {}).length,
      bossMutators: mutators, icons: icons, sinks: sinks,
      legends: legends.length, races: hall.races.length, klasses: hall.klasses.length,
      fallen: (CodexExtra.fallen || []).length, dailies: dailies
    };
  }
  var c = Object.assign({}, Codex.counts);
  c.totals = b.totals;
  c.best = b.best;
  c.flag = function (f) { return b.flags[f] ? 1 : 0; };
  c.bestLevel = b.best.level || 0;
  c.bestHardcore = b.best.hardcore || 0;
  c.bestHours = (b.best.seconds || 0) / 3600;
  return c;
}

function AchievementProgress(a, c) {
  c = c || CodexContext();
  var goal = AchievementGoal(a);
  return { value: Math.min(goal, a.value(c) || 0), goal: goal,
           done: !!(Codex.book && Codex.book.achievements[a.key]) };
}

// Unlock whatever is newly earned. Returns the newly unlocked ones.
var _achievementQueue = [];
function CheckAchievements() {
  if (!Codex.book || (typeof game != "undefined" && game && game.cheater)) return [];
  var c = CodexContext(), fresh = [];
  K.Achievements.forEach(function (a) {
    if (Codex.book.achievements[a.key]) return;
    if ((a.value(c) || 0) < AchievementGoal(a)) return;
    var who = CodexWho();
    CodexApply(function (b) { b.achievements[a.key] = { at: new Date().toISOString(), by: who.by }; });
    fresh.push(a);
  });
  if (fresh.length) {
    CodexFlush();
    fresh.forEach(ToastAchievement);
  }
  return fresh;
}

// ---- The toast ---------------------------------------------------------------

// "Achievement unlocked" pops up from the corner, one at a time
function ToastAchievement(a) {
  if (typeof document == "undefined" || !document || !document.body) return;
  _achievementQueue.push(a);
  if (_achievementQueue.length == 1) NextToast();
  if (typeof Narrate == "function") Narrate("Achievement unlocked: " + a.label + ".");
}

function NextToast() {
  var a = _achievementQueue[0];
  if (!a) return;
  var toast = document.createElement("div");
  toast.className = "achievement-toast";
  toast.setAttribute("role", "status");   // (read out: "Achievement unlocked: ...")
  toast.setAttribute("role", "status");
  var icon = document.createElement("div");
  icon.className = "ach-icon";
  icon.textContent = a.icon;
  var text = document.createElement("div");
  var head = document.createElement("div");
  head.className = "ach-head";
  head.textContent = "Achievement unlocked";
  var name = document.createElement("div");
  name.className = "ach-name";
  name.textContent = a.label;
  var help = document.createElement("div");
  help.className = "ach-help";
  help.textContent = a.help;
  text.appendChild(head); text.appendChild(name); text.appendChild(help);
  toast.appendChild(icon); toast.appendChild(text);
  // a popover sits in the top layer, so it shows over modal dialogs too
  toast.setAttribute("popover", "manual");
  document.body.appendChild(toast);
  try { if (toast.showPopover) toast.showPopover(); } catch (e) {}
  var done = function () {
    try { if (toast.hidePopover) toast.hidePopover(); } catch (e) {}
    if (toast.parentNode) toast.parentNode.removeChild(toast);
    _achievementQueue.shift();
    NextToast();
  };
  toast.addEventListener("click", done);
  setTimeout(function () { toast.classList.add("show"); }, 20);
  setTimeout(function () { toast.classList.remove("show"); setTimeout(done, 400); }, 6000);
}

// Load the Codex and what the achievements need from the Hall. Then check.
function CodexStart(callback) {
  CodexLoad(function () {
    storage.loadLegends(function (legends) {
      CodexExtra.legends = legends;
      storage.loadFallen(function (fallen) {
        CodexExtra.fallen = fallen;
        var after = function (book) {
          CodexExtra.dailies = book || {};
          Codex.counts = null;
          CheckAchievements();
          if (callback) callback();
        };
        if (storage.loadDailies) storage.loadDailies(after); else after({});
      });
    });
  });
  if (typeof window != "undefined" && window.addEventListener)
    window.addEventListener("pagehide", function () { CodexFlush(); });
}

// ---- The Codex window (main menu) -------------------------------------------

var codexTab = "achievements";

function CodexWhen(entry) {
  if (!entry || !entry.by) return "";
  return entry.by + (entry.at ? ", " + new Date(entry.at.length > 10 ? entry.at : entry.at + "T12:00:00Z")
    .toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }) : "");
}

function CodexTabCounts() {
  var b = Codex.book || CodexEmpty(), c = CodexContext();
  var got = K.Achievements.filter(function (a) { return b.achievements[a.key]; }).length;
  return {
    achievements: got + "/" + K.Achievements.length,
    bestiary: c.monsters + "/" + K.Monsters.length,
    spellbook: c.spells + "/" + K.Spells.length,
    journal: c.events + "/" + (K.Events ? K.Events.length : 0),
    uniques: String(c.uniques)
  };
}

function ShowCodex(tab) {
  if (tab) codexTab = tab;
  var counts = CodexTabCounts();
  $("#dlgCodex [data-tab]").each(function () {
    var t = $(this).data("tab");
    $(this).toggleClass("active", t == codexTab).attr("aria-selected", t == codexTab)
      .find("span").text(counts[t]);
  });
  $("#dlgCodex .codex-tools").toggle(codexTab != "achievements");
  var pane = $("#codexPane").empty().attr("class", "codex-" + codexTab);
  var b = Codex.book || CodexEmpty();
  var summary = {
    achievements: "Unlocked once, for good, by any of your heroes.",
    bestiary: "Every kind of monster on the Killing Fields™, weakest first: ✔ slain, ★ a named elite of its kind slain too. Passing NPCs and the Old Bastard™ aren't listed.",
    spellbook: "Every spell, in the order they come within reach: a level-up teaches one whose number is below your WIS plus your level.",
    journal: "Every random event, and how its choices have gone.",
    uniques: "Gear taken from named elites, about one fight in " + (K.Elite ? K.Elite.Odds : 500) +
             ". Every one is different, so there's no list to complete: only a trophy shelf."
  }[codexTab];
  $("#codexSummary").text(summary + (b.edited ? " ⚠ This Codex was edited outside the game." : ""))
    .toggleClass("edited", !!b.edited);
  var query = String($("#codexSearch").val() || "").toLowerCase().trim();
  var filter = $("#codexFilter").val() || "all";
  var keep = function (found, text) {
    if (filter == "found" && !found) return false;
    if (filter == "missing" && found) return false;
    if (query) return found && text.toLowerCase().indexOf(query) >= 0;   // no peeking at the unfound
    return true;
  };
  ({ achievements: CodexAchievementsPane, bestiary: CodexBestiaryPane,
     spellbook: CodexSpellbookPane, journal: CodexJournalPane, uniques: CodexUniquesPane })[codexTab](pane, b, keep);
}

function CodexAchievementsPane(pane, b) {
  var c = CodexContext();
  var grid = $("<div class=ach-grid>");
  K.Achievements.forEach(function (a) {
    var p = AchievementProgress(a, c), got = b.achievements[a.key];
    var hide = a.secret && !got;
    var card = $("<div class=ach-card>").toggleClass("got", !!got).toggleClass("secret", hide);
    card.append($("<div class=ach-icon>").text(hide ? "?" : a.icon));
    var text = $("<div class=ach-text>");
    text.append($("<div class=ach-name>").text(hide ? "???" : a.label));
    text.append($("<div class=ach-help>").text(hide ? "A secret. Keep playing (or poking around)." : a.help));
    if (got) text.append($("<div class=ach-when>").text("Unlocked" + (got.by ? " by " + got.by : "") + ", " +
      new Date(got.at).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })));
    else if (!hide && p.goal > 1)
      text.append($("<div class=ach-bar>").attr("title", p.value.toLocaleString() + " / " + p.goal.toLocaleString())
        .append($("<div>").css("width", Math.floor(100 * p.value / p.goal) + "%"))
        .append($("<span>").text(p.value.toLocaleString() + " / " + p.goal.toLocaleString())));
    card.append(text);
    grid.append(card);
  });
  pane.append(grid);
}

function CodexTable(pane, heads) {
  var table = $("<table class=codex-table>");
  var tr = $("<tr>");
  heads.forEach(function (h) { tr.append($("<th>").text(h)); });
  table.append($("<thead>").append(tr));
  var body = $("<tbody>");
  table.append(body);
  pane.append(table);
  return body;
}

function CodexRow(body, cells, found) {
  var tr = $("<tr>").toggleClass("missing", !found);
  cells.forEach(function (c) {
    var td = $("<td>");
    if (c && typeof c == "object") td.text(c.text).attr("class", c.cls || "").attr("title", c.title || "");
    else td.text(c === undefined || c === null ? "" : c);
    tr.append(td);
  });
  body.append(tr);
}

function CodexBestiaryPane(pane, b, keep) {
  var body = CodexTable(pane, ["", "Monster", "Level", "Drops", "Slain", "Beat you", "First slain by"]);
  var list = K.Monsters.map(function (m, i) {
    var f = m.split("|");
    return { name: f[0], level: +f[1], loot: f[2], i: i };
  }).sort(function (x, y) { return x.level - y.level || x.i - y.i; });
  var shown = 0;
  list.forEach(function (m) {
    var e = b.monsters[m.name] || {};
    var found = !!e.k;
    if (!keep(found, m.name + " " + m.loot)) return;
    shown++;
    // ✔ slain; ★ an elite of its kind slain too
    var mark = !found ? "" : e.e ? { text: "★", cls: "elite", title: (e.e == 1 ? "An elite" : e.e + " elites") + " of this kind slain" }
                                 : { text: "✔", cls: "slain", title: "Slain" };
    CodexRow(body, found ?
      [mark, m.name, m.level, m.loot == "*" ? "" : m.loot, (e.k || 0).toLocaleString(), (e.l || 0).toLocaleString(), CodexWhen(e)] :
      ["", e.l ? { text: "??? (beat you " + e.l + "×, never slain)", cls: "met" } : "???", m.level, "", "", e.l ? e.l : "", ""], found);
  });
  if (!shown) pane.append($("<p class=codex-empty>").text("Nothing here yet."));
}

function CodexUniquesPane(pane, b, keep) {
  var list = Object.keys(b.uniques || {}).map(function (name) { return Object.assign({ name: name }, b.uniques[name]); })
    .sort(function (x, y) { return String(y.at).localeCompare(String(x.at)) || (y.power || 0) - (x.power || 0); });
  var body = CodexTable(pane, ["Unique", "Slot", "Power", "Taken from", "Found by"]);
  var shown = 0;
  list.forEach(function (u) {
    if (!keep(true, [u.name, u.slot, u.from, u.kind].join(" "))) return;
    shown++;
    CodexRow(body, [{ text: u.name, cls: "unique" }, u.slot, u.power,
                    { text: u.from, title: "An elite " + u.kind + (u.lv ? ", level " + u.lv : "") }, CodexWhen(u)], true);
  });
  if (!shown) pane.append($("<p class=codex-empty>").text(list.length ? "Nothing matches." :
    "No uniques yet. Somewhere out there, about one fight in " + (K.Elite ? K.Elite.Odds : 500) + ", something named is waiting."));
}

function CodexSpellbookPane(pane, b, keep) {
  var body = CodexTable(pane, ["#", "Spell", "Kind", "Best level", "First learned by"]);
  var shown = 0;
  K.Spells.forEach(function (raw, i) {
    var name = SpellName(raw), type = SpellType(name);
    var e = b.spells[name];
    var found = !!e;
    if (!keep(found, name + " " + type)) return;
    shown++;
    CodexRow(body, found ?
      [i + 1, name, { text: type, cls: "spell-" + type, title: K.SpellTypeHelp ? K.SpellTypeHelp[type] : "" },
       ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][e.lv] || e.lv, CodexWhen(e)] :
      [i + 1, "???", "", "", { text: "needs WIS + level over " + i, cls: "dim" }], found);
  });
  if (!shown) pane.append($("<p class=codex-empty>").text("Nothing here yet."));
}

var CodexWhere = { rest: "while resting", road: "on the road", town: "in town", field: "after a fight" };

// "a henchman": what a hero needs to have bought for a sink's event (K.Sinks)
function CodexSinkLabel(key) {
  var sk = (K.Sinks || []).filter(function (s) { return s.key == key; })[0];
  return sk ? sk.label : key;
}

function CodexJournalPane(pane, b, keep) {
  var shown = 0;
  (K.Events || []).forEach(function (ev) {
    var e = b.events[ev.key];
    var found = !!e;
    var where = (ev.where || []).map(function (w) { return CodexWhere[w] || w; }).join(" or ");
    if (!keep(found, (e && e.line || "") + " " + ev.key)) return;
    shown++;
    var card = $("<div class=journal-entry>").toggleClass("missing", !found);
    var head = $("<div class=journal-head>");
    head.append($("<b>").text(found ? e.line : "???"));
    head.append($("<span class=dim>").text(" · " + where +
      (ev.minLevel ? " · from level " + ev.minLevel : "") +
      (ev.race ? " · " + ev.race + " heroes only" : "") +
      (ev.klass ? " · " + ev.klass + " heroes only" : "") +
      (ev.sink ? " · only with " + CodexSinkLabel(ev.sink) : "") +
      (ev.rival ? " · once you've met your rival" : "") +
      (found ? " · " + e.n.toLocaleString() + (e.n == 1 ? " time" : " times") + " · first: " + CodexWhen(e) : "")));
    card.append(head);
    if (ev.choices && ev.choices.length) {
      var ul = $("<ul class=journal-choices>");
      if (ev.ask && found) card.append($("<div class=journal-ask>").text(ev.ask.replace(/\{[^}]*\}/g, "…")));
      ev.choices.forEach(function (c, i) {
        var p = found && e.picks && e.picks[i];
        ul.append($("<li>").text(found ? c.label.replace(/\{[^}]*\}/g, "…") : "???")
          .append(p ? $("<span class=dim>").text(" — you " + p.you + ", fate " + p.fate) : ""));
      });
      card.append(ul);
    }
    pane.append(card);
  });
  if (!shown) pane.append($("<p class=codex-empty>").text("Nothing here yet."));
}

function CodexBadge() {
  if (typeof document == "undefined" || !document) return;
  var b = Codex.book || CodexEmpty();
  var got = K.Achievements.filter(function (a) { return b.achievements[a.key]; }).length;
  $("#codexCount").text(got ? got + "/" + K.Achievements.length : "")
    .attr("title", got ? "Achievements unlocked" : "");
}

// ---- Backup and restore ------------------------------------------------------

// The Codex as a backup file's text (made when Back up is clicked: it used
// to be rebuilt into a link on every redraw, even every keystroke in Search)
function CodexBackupText() {
  var copy = Object.assign({}, Codex.book || CodexEmpty());
  delete copy.seal;
  return JSON.stringify(Seal(copy));
}

// Only a Codex the game wrote (sealed and untouched) comes back
function RestoreCodex(file) {
  file.text().then(function (text) {
    var incoming = null;
    try { incoming = JSON.parse(text); } catch (e) { incoming = null; }
    if (!incoming || typeof incoming != "object" || !incoming.monsters) {
      alert(file.name + " doesn't look like a Codex backup.");
      return;
    }
    if (!SealOk(incoming) || incoming.edited) {
      alert("That Codex backup was edited, so it can't be restored.");
      return;
    }
    CodexFlush(function () {
      storage.loadCodex(function (stored) {
        CodexUnion(stored, incoming);
        storage.storeCodex(stored, function () {
          CodexLoad(function () {
            Codex.counts = null;
            CheckAchievements();
            ShowCodex();
            CodexBadge();
            alert("Codex restored.");
          });
        });
      });
    });
  });
}
