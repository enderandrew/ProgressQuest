// The hero's journal (Game > Journal, the Journal link, or J), downloadable
// as a text file.
//
// Not a log of every task: an idle game left running for months would pile
// one up forever. It keeps the milestones: each level (with what happened
// since the last one), the Acts and how they ended, the first time each
// event happened, every choice you made yourself, the finale, the Daily,
// time caught up while the game was closed, and the end, however it comes.
// Now and then the hero also writes something that never shows up in the
// game itself: asides to whoever might be reading, on the firm assumption
// that nobody ever will.
//
// game.journal: [{ h: game seconds, l: level, k: kind, x: text }], at most
// K.Journal.Max entries (the first few stay; the oldest of the rest go).
// The journal has its own dice (JournalRandom): it never touches the game's,
// so it can't change how a hero's game goes, or a replay of it.
//
// Loaded by main.html (and sim.js). main.js calls the Journal* hooks only
// when this file is there.

K.Journal = {
  Max: 1500,          // entries kept
  AsideChance: 0.3,   // after a level or an Act, the chance of an aside
  Keep: 3             // the first entries, which always stay
};

// ---- Writing ---------------------------------------------------------------

function JournalAdd(kind, text) {
  if (!game || !game.Traits || !text) return;
  var j = game.journal = game.journal || [];
  j.push({ h: Math.floor(game.elapsed || 0), l: GetI(Traits, 'Level'), k: kind, x: text });
  if (j.length > K.Journal.Max) j.splice(K.Journal.Keep, j.length - K.Journal.Max);
}

// Dice of its own, never the game's
var _journalDraws = 0;
function JournalRandom() {
  return new Alea("journal", game.lifeId || "", game.tasks || 0, (game.journal || []).length, ++_journalDraws);
}

function JournalPick(list) {
  return list[Math.floor(JournalRandom()() * list.length)];
}

function JournalChance(p) {
  return JournalRandom()() < p;
}

function JournalVars(extra) {
  var hours = (game.elapsed || 0) / 3600;
  var v = {
    hero: Get(Traits, 'Name'), race: Get(Traits, 'Race'), klass: Get(Traits, 'Class'),
    level: GetI(Traits, 'Level'), next: GetI(Traits, 'Level') + 1,
    hours: hours < 2 ? Math.round(hours * 60) + " minutes" : Math.round(hours) + " hours",
    days: Math.max(1, Math.round(hours / 24)),
    weapon: Get(Equips, 'Weapon') || "my bare hands",
    gear: game.bestequip || "nothing worth mentioning",
    spell: (game.bestspell || "").trim() || "no spells at all",
    wins: (game.wins || 0).toLocaleString(), deaths: (game.deaths || 0).toLocaleString(),
    quests: (game.questsDone || 0).toLocaleString(),
    act: ActCaption(game.act || 0)
  };
  for (var k in extra || {}) v[k] = extra[k];
  return v;
}

function JournalText(template, extra) {
  var v = JournalVars(extra);
  return template.replace(/\{([a-z]+)\}/g, function (m, key) { return v[key] !== undefined ? v[key] : m; });
}

// Lines as prose: each one ends a sentence (the game's scene lines mostly
// don't have their full stops), but not twice, and not after a quote that
// already ends one
function JournalSentences(lines) {
  return lines.map(function (line) {
    line = String(line).trim();
    return /[.!?\u2026]["'\u201d\u2019)]*$/.test(line) ? line : line + ".";
  }).join(" ");
}

// Now and then, something just for the reader. Each one at most once a hero.
function JournalAside(chance, pool) {
  if (!JournalChance(chance === undefined ? K.Journal.AsideChance : chance)) return;
  pool = pool || K.JournalAsides;
  var used = game.journalAsides = game.journalAsides || [];
  var fresh = [];
  pool.forEach(function (line) { if (used.indexOf(line.slice(0, 40)) < 0) fresh.push(line); });
  if (!fresh.length) return;
  var line = JournalPick(fresh);
  used.push(line.slice(0, 40));
  JournalAdd('aside', JournalText(line));
}

// ---- The hooks (called from main.js) -----------------------------------------

// A new hero's first entry, or an older hero's first since the journal came in
function JournalBegin(isNew) {
  if (game.journal && game.journal.length) return;
  game.journalMark = JournalTally();
  if (isNew) {
    var prologue = StoryFor(0);
    JournalAdd('begin', JournalText(JournalPick(K.JournalBegin), { taunt: (prologue && prologue.taunt) || "Thou fool" }));
    JournalAdd('aside', JournalText(K.JournalFirstAside));
  } else {
    JournalAdd('begin', JournalText(JournalPick(K.JournalLateStart)));
  }
}

function JournalTally() {
  return { quests: game.questsDone || 0, wins: game.wins || 0, deaths: game.deaths || 0,
           gold: game.goldEarned || 0, spells: (game.Spells || []).length };
}

function JournalLevel() {
  var now = JournalTally(), was = game.journalMark || now;
  game.journalMark = now;
  var n = function (x) { return Math.max(0, x).toLocaleString(); };
  var vars = { q: n(now.quests - was.quests), w: n(now.wins - was.wins), d: n(now.deaths - was.deaths),
               g: n(now.gold - was.gold) };
  var lines = now.deaths > was.deaths ? K.JournalLevelHurt : K.JournalLevel;
  JournalAdd('level', JournalText(JournalPick(lines), vars));
  var special = K.JournalLevelAsides[GetI(Traits, 'Level')];
  if (special) JournalAdd('aside', JournalText(special));
  else JournalAside();
}

function JournalActEnd(act, ending) {
  if (!ending || !ending.length) return;
  JournalAdd('act', (act ? "The end of Act " + toRoman(act) : "The end of the Prologue") + ". " + JournalSentences(ending));
}

function JournalActBegin() {
  if (!game.story) return;
  JournalAdd('act', ActCaption(game.act) + ". " + game.story.purpose);
  JournalAside(0.5, K.JournalActAsides);
}

// An event has played out (FinishEvent). The first of each kind goes in,
// and any choice you made yourself.
function JournalEvent(ev, result) {
  if (ev.perk) return;   // (AddPerk writes its own line)
  var seen = game.journalEvents = game.journalEvents || {};
  var mine = ev.by == 'you';
  if (seen[ev.key] && !mine) return;
  seen[ev.key] = 1;
  var text = JournalSentences(ev.lines || []);
  if (result && result.length) text += " (" + result.join(", ") + ".)";
  JournalAdd('event', text);
  if (mine && ev.choices && ev.chosen !== undefined && ev.choices[ev.chosen])
    JournalAdd('aside', JournalText(JournalPick(K.JournalYouChose), { choice: ev.choices[ev.chosen].label }));
}

function JournalFirstDefeat(foe) {
  // (Defeated() has already counted this one)
  if (game.journalFirstDefeat || (game.deaths || 0) > 1) return;
  game.journalFirstDefeat = true;
  JournalAdd('fight', JournalText(K.JournalFirstDefeatLine, { foe: foe }));
}

function JournalFinale(won, tries) {
  JournalAdd('finale', JournalText(JournalPick(won ? K.JournalFinaleWon : K.JournalFinaleEscaped), { tries: tries }));
  if (won) JournalAdd('aside', JournalText(K.JournalFinaleAside));
}

function JournalAway(seconds, lines) {
  JournalAdd('away', "While you were away (" + RoughTime(Math.round(seconds)) + "): " +
             lines.map(function (l) { return l.replace(/[.!]$/, ""); }).join("; ") + ".");
  if (!game.journalAwaySeen) {
    game.journalAwaySeen = true;
    JournalAdd('aside', JournalText(K.JournalAwayAside));
  }
}

function JournalDaily(status) {
  var text = { done: "Finished today's Daily Challenge: {label}.",
               failed: "Ran out of time on today's Daily Challenge. {label}? Maybe tomorrow.",
               died: "Died during the Daily Challenge. It was supposed to be a fun little challenge." }[status];
  if (text) JournalAdd('daily', JournalText(text, { label: game.daily ? game.daily.label : "" }));
}

function JournalBrand(reason) {
  JournalAdd('aside', JournalText(K.JournalBrandLine, { reason: reason }));
}

function JournalRetire() {
  JournalAdd('end', JournalText(JournalPick(K.JournalRetire)));
}

function JournalDeath(cause) {
  JournalAdd('end', JournalText(JournalPick(K.JournalDeath), { cause: cause }));
}

// Someone opened it. Once.
function JournalOpened() {
  if (game.journalRead) return;
  game.journalRead = true;
  JournalAdd('aside', JournalText(K.JournalOpenedAside));
}

// ---- Reading -----------------------------------------------------------------

function JournalStamp(e) {
  var h = Math.floor(e.h / 3600), m = Math.floor(e.h % 3600 / 60);
  return (h ? h + "h " : "") + m + "m · level " + e.l;
}

function JournalTitle() {
  return Get(Traits, 'Name') + "'s Journal";
}

// The whole thing as text, for the download
function JournalAsText() {
  var out = [];
  out.push(JournalTitle().toUpperCase());
  out.push("Level " + Get(Traits, 'Level') + " " + Get(Traits, 'Race') + " " + Get(Traits, 'Class') +
           " · " + RoughTime(Math.round(game.elapsed || 0)) + " played");
  out.push("(Kept by " + Get(Traits, 'Name') + ", who assumes nobody will ever read it.)");
  out.push("");
  (game.journal || []).forEach(function (e) {
    var text = e.k == 'aside' ? "  ~ " + e.x : e.x;
    out.push("[" + JournalStamp(e) + "] " + text);
  });
  out.push("");
  out.push("Progress Quest Remix · " + new Date().toLocaleDateString());
  return out.join("\n");
}

function DownloadJournal() {
  DownloadText(JournalAsText(), Get(Traits, 'Name') + " - Journal.txt", "text/plain;charset=utf-8");
}

function OpenJournal() {
  if (!document || !game || !game.Traits) return;
  var box = document.createElement("div");
  box.className = "journal";
  (game.journal || []).forEach(function (e) {
    var row = document.createElement("div");
    row.className = "journal-entry journal-" + e.k;
    var stamp = document.createElement("span");
    stamp.className = "journal-stamp";
    stamp.textContent = JournalStamp(e);
    var text = document.createElement("span");
    text.className = "journal-text";
    text.textContent = e.x;
    row.appendChild(stamp);
    row.appendChild(text);
    box.appendChild(row);
  });
  if (!box.children.length) box.textContent = "Nothing yet. Give it a minute.";
  WinBox({ title: JournalTitle(), body: box, wide: true,
           buttons: [{ label: "Download", action: DownloadJournal }, { label: "Close", value: null, primary: true }] });
  box.scrollTop = box.scrollHeight;   // the latest at the bottom
  JournalOpened();   // (it goes in the next time; this one is already up)
}

// ---- The words ---------------------------------------------------------------
//
// {hero} {race} {klass} {level} {next} {hours} {days} {weapon} {gear} {spell}
// {wins} {deaths} {quests} {act}, and in some lines more (listed there).

K.JournalBegin = [
  "Had a dream. The Old Bastard™ was in it, sneering “{taunt}”. I don't know who he is, but he's going down. Bought this journal on the way out of town.",
  "Day one. A terrible old man called me “{taunt}” in a dream, so naturally I've left home to kill him. Mom packed snacks.",
  "Starting a journal, because heroes have journals. Also an Old Bastard™ called me “{taunt}” in my sleep and I need to process that.",
  "Started a journal so the bards know what to write about me. The Old Bastard™ called me “{taunt}”! Sticks and stones will break his bones!",
];

K.JournalFirstAside =
  "Note to whoever finds this: you won't. Nobody reads these. I'm writing it anyway, the way you keep a progress bar running in a tab you never look at.";

K.JournalLateStart = [
  "Started keeping a journal at level {level}. Everything before this is a blur of progress bars.",
  "First entry, at level {level}, {hours} into all this. I'm told I did things before now. I'll take their word for it."
];

// {q} quests, {w} fights won, {d} defeats, {g} gold, since the last level
K.JournalLevel = [
  "Level {level}. {q} quests and {w} fights since the last one. Didn't lose once. Smug.",
  "Level {level}! Took {w} fights and {q} quests. My {weapon} and I are very happy together.",
  "Made level {level}. Earned {g} gold on the way and spent most of it on gear I'll replace in an hour.",
  "Level {level}. {w} more things are dead. I'd feel bad, but they started it. Mostly.",
  "Level {level}. Same as level {next} will be, but less so."
];
K.JournalLevelHurt = [
  "Level {level}. {q} quests, {w} fights won, {d} lost. We don't talk about the {d}.",
  "Reached level {level}, after being dragged back to town {d} times. The temple has a punch card for me now.",
  "Level {level}. Won {w}, lost {d}. The ones I lost are written down somewhere else. Not here."
];

// Milestones get their own
K.JournalLevelAsides = {
  2: "If you're reading this, you've either been playing for a while or you went digging in the menus. Both are suspicious.",
  10: "Level 10. In some games that's the tutorial. In this one it's a career.",
  20: "Twenty levels. Do you know how many times I've walked to market? I do. I counted. You didn't watch any of them.",
  30: "Level 30. Someone once told me the game plays itself. I'm the one playing it. You're just the one who left the tab open.",
  42: "Level 42. I was told this would mean something.",
  49: "One level to go. I've been thinking about what I'll say to the Old Bastard™. It's mostly swearing.",
  50: "Level 50. If this were a normal game there would be fireworks. Here there's a progress bar, and then another one."
};

K.JournalActAsides = [
  "New Act. I don't remember agreeing to Acts. I think someone is writing this.",
  "A whole new chapter, and still nobody's reading. That's fine. The progress bar reads me.",
  "Every Act starts with a loading screen. I've started to find it comforting."
];

K.JournalAsides = [
  "Things I have learned: the bar always fills. That's it. That's the lesson.",
  "Sometimes I feel like someone is watching me. Then I check, and no, it's another tab.",
  "If you are reading this: hello. If you are not reading this: also hello, I suppose.",
  "I asked a sage what the point of it all was. He said “numbers going up.” I said “that's it?” He said “that's all anyone's got.”",
  "Wrote a whole page about my feelings, then remembered nobody reads this, and deleted it. You're welcome.",
  "Do you ever think about the people who made the monsters? Somebody typed “{gear}” on purpose.",
  "{hours} on the road. You've probably checked in on me for about four minutes of that. I'm not keeping score. ({hours}. I am.)",
  "My best spell is {spell}. I didn't choose it. Nothing here is chosen. It's very restful, honestly.",
  "Fun fact: I have won {wins} fights. You have watched maybe six. The other {wins} were also very good.",
  "Note to self: buy a new journal. This one is mostly level numbers and grudges.",
  "There's a version of me in another browser tab somewhere who made all the same choices, because the dice are seeded. I hope he's doing well.",
  "If anyone ever does read this, I'd like it known that the {race}s are a proud people and the jokes are not about us.",
  "Considered retiring today. Then a progress bar appeared and I followed it like a moth.",
  "Every quest giver says it's urgent. Not one of them has ever been in a hurry about the reward.",
  "Read back through this journal. It's a lot of me hitting things. Solid work, though.",
  "I think the person running this game is asleep. If you're awake and reading this: go to sleep. I've got it.",
  "Dear Diary. Wait, is this a diary or a journal? A journal sounds more heroic. Dear Journal.",
  "Somewhere a server is keeping track of all this. I hope it's warm.",
  "I've been a {klass} for {hours} now. I still don't know what a {klass} is supposed to do. Nobody has complained.",
  "The monsters never write journals. That's how you know we're the good guys. Probably."
];

K.JournalYouChose = [
  "A voice from the sky told me to “{choice}”. It's never spoken up before. I listened. Was that you?",
  "Went with “{choice}”. Not my idea. Someone was actually paying attention for once.",
  "“{choice}”. Chosen by a mysterious presence I'm choosing to call the Reader. Hi, Reader."
];

K.JournalFirstDefeatLine =
  "Lost a fight for the first time, to {foe}. Somebody dragged me to a temple, and the temple charged me for it. Heroism has fees.";

K.JournalFinaleWon = [
  "I beat the Old Bastard™. It took {tries} tries. He was older and slower than in my dreams, and so, frankly, am I.",
  "The Old Bastard™ is beaten. {tries} attempts. I said all the things I'd been saving up. Most of them were swearing."
];
K.JournalFinaleEscaped = [
  "Fought the Old Bastard™ (attempt {tries}). He ran. Of course he ran.",
  "Attempt {tries} on the Old Bastard™. He got away. He's getting older every time, which is cold comfort."
];
K.JournalFinaleAside =
  "So that's it. The thing I set out to do is done. If you've been reading along this whole time, I'm a little embarrassed about the swearing.";

K.JournalAwayAside =
  "You were gone, so I kept going. I always keep going. I'm not mad. I just think you should know I noticed.";

K.JournalBrandLine =
  "They say I cheated ({reason}). I would like it on record that I was not consulted.";

K.JournalOpenedAside =
  "Wait. Someone actually opened this. Okay. Act natural. Everything in here is fine and normal and heroic.";

K.JournalRetire = [
  "Hanging up my {weapon}. Retiring to the Hall of Legends at level {level}, after {hours} of this. Somebody else can fill the bars now.",
  "Last entry. I'm retiring. {wins} fights, {quests} quests, one Old Bastard™. If you read all of this, you're the real legend. (You didn't, though.)"
];

K.JournalDeath = [
  "{cause}. If anyone finds this journal: it was going really well right up until it wasn't.",
  "Final entry, probably: {cause}. Tell the Reader I said hi. They never read these anyway."
];
