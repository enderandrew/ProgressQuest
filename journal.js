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
// game.journal: [{ h: game seconds, l: level, k: kind, x: text }]. It's
// saved with the hero, and a hero can idle for months, so it has a budget
// (K.Journal.Max entries, K.Journal.MaxChars of text): past it, the oldest
// of the least interesting entries go (K.JournalDropOrder). A level 50
// hero's journal comes to about 300 entries and 70 KB; a hero idling on
// past that stays at the budget.
// The journal has its own dice (JournalRandom): it never touches the game's,
// so it can't change how a hero's game goes, or a replay of it.
//
// Loaded by main.html (and sim.js). main.js calls the Journal* hooks only
// when this file is there.

K.Journal = {
  Max: 1500,          // entries kept, at most...
  MaxChars: 100000,   // ...and this much text, about 110 KB in the save
  AsideChance: 0.3,   // after a level or an Act, the chance of an aside
  Keep: 3             // the first entries, which always stay
};

// When the journal is full, what goes first: asides and level lines, then
// the rest; the oldest of each first. The first Keep
// entries, the finale and the end always stay.
K.JournalDropOrder = ['aside', 'level', 'event', 'elite', 'away', 'perk', 'owned', 'act', 'fight', 'daily'];

// ---- Writing ---------------------------------------------------------------

function JournalAdd(kind, text) {
  if (!game || !game.Traits || !text) return;
  var j = game.journal = game.journal || [];
  j.push({ h: Math.floor(game.elapsed || 0), l: GetI(Traits, 'Level'), k: kind, x: text });
  // (the text is counted every so often, not on every entry)
  if (j.length > K.Journal.Max || j.length % 20 == 0) JournalTrim(j);
}

// Over budget? Drop entries, least interesting and oldest first, down to
// 90% of it (so it isn't trimmed again on the very next entry)
function JournalTrim(j) {
  var chars = 0;
  j.forEach(function (e) { chars += e.x.length; });
  var J = K.Journal;
  if (j.length <= J.Max && chars <= J.MaxChars) return;
  var wantN = Math.floor(J.Max * 0.9), wantC = Math.floor(J.MaxChars * 0.9);
  var drop = {};
  for (var o = 0; o < K.JournalDropOrder.length && (j.length - Object.keys(drop).length > wantN || chars > wantC); ++o) {
    for (var i = J.Keep; i < j.length && (j.length - Object.keys(drop).length > wantN || chars > wantC); ++i) {
      if (j[i].k == K.JournalDropOrder[o] && !drop[i]) { drop[i] = true; chars -= j[i].x.length; }
    }
  }
  game.journal = j.filter(function (e, i) { return !drop[i]; });
  game.journalTrimmed = (game.journalTrimmed || 0) + Object.keys(drop).length;
}

// Dice of its own, never the game's
var _journalDraws = 0;
function JournalRandom() {
  return new Alea("journal", game.lifeId || "", game.tasks || 0, (game.journal || []).length, ++_journalDraws);
}

// A kingdom's name, made with the journal's dice (KingdomName in config.js
// rolls the game's: they are swapped out and back)
function JournalKingdom() {
  if (typeof KingdomName != "function" || typeof seed == "undefined") return "the kingdom";
  var gameDice = seed;
  seed = JournalRandom();
  try { return KingdomName(); } finally { seed = gameDice; }
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
	alignment: Get(Traits, 'Alignment') || 'Unaligned',
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
  if (Array.isArray(template)) template = JournalPick(template);   // (a list: one of them)
  var v = JournalVars(extra);
  if (v.kingdom === undefined && template.indexOf("{kingdom}") >= 0) v.kingdom = JournalKingdom();
  return template.replace(/\{([a-z]+)\}/g, function (m, key) { return v[key] !== undefined ? v[key] : m; })
    // "the {d}th time" with d = 1, 2 or 3 reads "the 1st time"...
    .replace(/\b(\d*?)(1|2|3)th\b/g, function (m, rest, last) {
      return /1$/.test(rest) ? m : rest + last + { 1: "st", 2: "nd", 3: "rd" }[last];
    });
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
// extra: more {placeholders}
function JournalAside(chance, pool, extra) {
  if (!JournalChance(chance === undefined ? K.Journal.AsideChance : chance)) return;
  pool = pool || K.JournalAsides;
  var used = game.journalAsides = game.journalAsides || [];
  var fresh = [];
  pool.forEach(function (line) { if (used.indexOf(line.slice(0, 40)) < 0) fresh.push(line); });
  if (!fresh.length) return;
  var line = JournalPick(fresh);
  used.push(line.slice(0, 40));
  JournalAdd('aside', JournalText(line, extra));
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
  var lost = now.deaths - was.deaths, won = now.wins - was.wins;
  var lines = lost > (won + lost) / 8 ? K.JournalLevelHurt : K.JournalLevel;
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
// and any choice you made yourself; repeats don't (a hero sees about a
// thousand events by level 50, and they'd double the journal's size).
function JournalEvent(ev, result) {
  if (ev.perk) return;   // (AddPerk writes its own line)
  var seen = game.journalEvents = game.journalEvents || {};
  var mine = ev.by == 'you';
  if (seen[ev.key] && !mine) return;   // (repeats would double the journal's size)
  seen[ev.key] = 1;
  var text = JournalSentences(ev.lines || []);
  if (result && result.length) text += " (" + result.join(", ") + ".)";
  JournalAdd('event', text);
  if (mine && ev.choices && ev.chosen !== undefined && ev.choices[ev.chosen])
    JournalAdd('aside', JournalText(JournalPick(K.JournalYouChose), { choice: ev.choices[ev.chosen].label }));
}

// A gold sink has played out (JournalEvent has the first of each kind). A
// ghostwriter always gets their entry in; otherwise, maybe a word.
function JournalSplurge(ev) {
  var sink = typeof SinkByKey == "function" ? SinkByKey(ev.sink) : null;
  var extra = { gold: (ev.gold || 0).toLocaleString(), thing: sink ? sink.label : "something" };
  if (sink && sink.memoir) JournalAside(1, K.JournalGhostwriter, extra);
  else JournalAside(K.Journal.AsideChance, K.JournalSplurgeAsides, extra);
}

// A named elite (K.Elite in combat.js): always worth a line, won or lost
function JournalElite(fight, item) {
  var e = fight.elite, won = !!item;
  var extra = { elite: e.name, kind: e.kind, item: item ? item.name : "", slot: item ? item.slot.toLowerCase() : "" };
  JournalAdd('elite', JournalText(won ? JournalPick(K.JournalEliteWon) :
                                  fight.outcome == 'flee' ? JournalPick(K.JournalEliteFled) : JournalPick(K.JournalEliteLost), extra));
  if (won && !game.journalEliteAside) {
    game.journalEliteAside = true;
    JournalAdd('aside', JournalText(K.JournalEliteAside, extra));
  }
}

function JournalFirstDefeat(foe) {
  // (Defeated() has already counted this one)
  if (game.journalFirstDefeat || (game.deaths || 0) > 1) return;
  game.journalFirstDefeat = true;
  JournalAdd('fight', JournalText(K.JournalFirstDefeatLine, { foe: foe }));
}

function JournalFinale(won, tries) {
  var prologue = StoryFor(0);
  var text = JournalText(won ? K.JournalFinaleWon : K.JournalFinaleEscaped,
                         { tries: tries, taunt: (prologue && prologue.taunt) || "Thou fool" });
  // and how this race and class celebrate (story.js), as the bards tell it
  // (no game dice here: the kingdom stays "the kingdom")
  if (won && typeof FinaleEnding == "function") {
    var told = [FinaleEnding(K.FinaleRaceEndings, Get(Traits, 'Race')), FinaleEnding(K.FinaleClassEndings, Get(Traits, 'Class'))]
      .filter(Boolean).map(function (line) { return StoryText(line, { kingdom: "the kingdom", hero: Get(Traits, 'Name') }); });
    if (told.length) text += " The bards' version: “" + JournalSentences(told) + "”";
  }
  JournalAdd('finale', text);
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
  var lines = K.JournalDaily[status];
  if (lines) JournalAdd('daily', JournalText(lines, { label: game.daily ? game.daily.label : "" }));
}

// A new perk (AddPerk in main.js): a line, and sometimes a word about it
function JournalPerk(p) {
  JournalAdd('perk', 'New perk: ' + PerkText(p));
  JournalAside(K.Journal.AsideChance, K.JournalPerkAsides, { perk: p.label });
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
  box.tabIndex = 0;   // (scrollable: the keyboard can reach it)
  box.setAttribute("aria-label", "Journal entries");
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
// {hero} {race} {klass} {alignment} {level} {next} {hours} {days} {weapon}
// {gear} {spell} {wins} {deaths} {quests} {act} {kingdom}, and in some lists
// more (listed there). Each list is one line picked at random; a single
// line works too. "{d}th" and the like come out as "1st", "2nd", "3rd".

K.JournalBegin = [
  "Had a dream. The Old Bastard™ was in it, sneering “{taunt}”. I don't know who he is, but he's going down. Bought this journal on the way out of town.",
  "Day one. A terrible old man called me “{taunt}” in a dream, so naturally I've left home to kill him. Mom packed snacks.",
  "Starting a journal, because heroes have journals. Also an Old Bastard™ called me “{taunt}” in my sleep and I need to process that.",
  "Started a journal so the bards know what to write about me. The Old Bastard™ called me “{taunt}”! Sticks and stones will break his bones!",
  "Started a journal because my podcast never took off. The Old Bastard™ refused to be a guest and called me “{taunt}”!",
  "Dear Diary, I dreamed The Old Bastard™ called me “{taunt}”. A reasonable adult would not get upset over a dream. I, however, swear to vengeance!",
  "I started this journal so I can look back fondly on pleasant memories, like that time The Old Bastard™ called me “{taunt}”. I need more pleasant memories.",
  "I cannot afford a therapist and AI chatbots do not exist yet. So I will talk to this journal. I dreamt that The Old Bastard™ called me “{taunt}”. What does that mean?",
  "A journal of a thousand miles starts with a single step. My first step is buying this journal. Step two was The Old Bastard™ calling me “{taunt}”. I hope step three will be better.",
  "I thought I should start a journal since I am mostly literate. The Old Bastard™ is not impressed and called me “{taunt}”. Is it wrong that I want to stab him repeatedly?",
  "I want to record all my great exploits for posterity. The Old Bastard™ called me “{taunt}”. Now I want to kick his posterior. How is that for posterity?",
  "After getting hit in the head bunches in combat, I no remember so great. The Old Bastard™ called me “{taunt}”. Now I want to kick his posterior. How is that for posterity?",
  "Books are better with words. I will fill this empty book with mine. To start, The Old Bastard™ called me “{taunt}”. Those are not nice words.",
  "I have a secret crush back home in the kingdom. Maybe some day will read this. Hopefully they won't read about The Old Bastard™ calling me “{taunt}”. Those are not nice words.",
  "Books make people happy. I will write a journal to make people happy. Day one. The Old Bastard™ calls me “{taunt}”. That does not make me happy.",
  "Day One of Journal: I learned I can count to 21 if I take off my pants. Also, The Old Bastard™ called me “{taunt}”. I am putting my pants back on and going to war!",
  "I am hoping this new journal will be my friend when I am lonely. The Old Bastard™ called me “{taunt}”. I need better friends.",
  "It has long been the custom of my people, the {race} to record our proud heritage. So here is my journal. The Old Bastard™ called me “{taunt}”.",
  "I am keeping this journal in case it inspires a future {klass} to follow in my footsteps. Step one. The Old Bastard™ called me “{taunt}”.",
  "My name is {hero}. Here is my story that bards will someday sing. Day one. The Old Bastard™ called me “{taunt}”.",
  "My name is {hero}. I must record my true self as {alignment} in this journal. Day one. The Old Bastard™ called me “{taunt}”. That is not my true self. I don't even know what “{taunt}” means.",
  "As an ostensibly {alignment} {race}, I feel the need to record my legacy in this journal. Unfortunately it starts with The Old Bastard™ calling me “{taunt}”.",
];

// (A list, like most of these: one is picked. A single line works too.)
K.JournalFirstAside = [
  "Note to whoever finds this: you won't. Nobody reads these. I'm writing it anyway, the way you keep a progress bar running in a tab you never look at.",
  "If you're reading this, put it back. Diaries are private. (Nobody is reading this. I can tell. The tab is in the background.)",
  "Rule one of this journal: nobody reads it. Rule two: if you are reading it, see rule one.",
  "I'm told heroes keep journals so historians have something to misquote. Hello, future historian. Please spell my name right: {hero}.",
  "This journal belongs to {hero}, a {race} {klass}. If found, please return it. If not found, which is likelier, carry on."
];

K.JournalLateStart = [
  "Started keeping a journal at level {level}. Everything before this is a blur of progress bars.",
  "First entry, at level {level}, {hours} into all this. I'm told I did things before now. I'll take their word for it.",
  "Why is my first entry at level {level}, {hours} into all this? Do I have amnesia from all the concussions? Off to go bash my head in more combat!",
  "Yes, I didn't start my journal until level {level}, {hours} into all this. Look, I procrastinate a bit.",
  "Maybe I didn't start my journal until level {level}, {hours} into all this. Some of us are late bloomers.",
  "I forgot to record everything that happened before level {level}, {hours} into all this. But it was probably boring. It will be great from here on out.",
];

// {q} quests, {w} fights won, {d} defeats, {g} gold, since the last level
K.JournalLevel = [
  "Level {level}. {q} quests and {w} fights since the last one. Journal, take note that I am pretty awesome!",
  "Level {level}. I completed {q} quests and remember none of them, but I am sure the writing was adequate.",
  "Level {level}. It only took {w} fights won for me to raise my level variable by one. I hope it was worth it.",
  "Level {level}. I hope I get a new perk with this level. Or that the devs don't nerf by race and class!",
  "Level {level}! Took {w} fights and {q} quests. My {weapon} and I are very happy together.",
  "Level {level}. Earned {g} gold on the way and spent most of it on gear I'll replace in an hour.",
  "Level {level}. {w} more things are dead. I'd feel bad, but they started it. Mostly.",
  "Level {level}. Same as level {next} will be, but less so.",
  "Level {level}. I persisted even in defeat. You didn't do anything to help, but maybe you will for level {next}.",
  "Level {level}. The game is called Progress Quest. It is pretty much expected to Progress. I will see you again for level {next}.",
  "Level {level}. Some heroes end up in the Hall of the Fallen. I am already looking forward to level {next}.",
  "Level {level}. Numbers go up. Do I have a higher purpose? Am I squandering my limited time? Or should I proceed to level {next}?",
  "Level {level}. I made {g} gold since the last level. That came with near-death, injuries, concussions and mental trauma. But hey, I can buy new gear!",
  "Level {level}. {w} monsters turned into paste. The local ecosystem will never financially recover from this.",
  "Level {level}. You literally left this browser tab open while getting a sandwich, but congratulations to both of us.",
  "Level {level}. Slogged through {q} quests and {w} brawls. Did I read any quest text? Absolutely not.",
  "Level {level}. Swung my {weapon} through {w} skirmishes. It is dull, chipped, and structurally unsound, much like my willpower.",
  "Level {level}. Another progress bar filled. That sweet, sweet dopamine drip directly into my brainstem.",
  "Level {level}. After {w} fights, my lower back sounds like bubble wrap. Looking forward to more ergonomic violence at level {next}.",
  "Level {level}. Cleared {q} quests and amassed {g} gold. I did all the heavy lifting while you stared at loading bars. You're welcome.",
  "Level {level}. Am I any closer to catching the Old Bastard™? No, but {w} wild beasts are now dead, so that's something.",
  "Level {level}. {q} fetch quests, {w} mindless brawls, and zero personal growth. Bring on level {next}.",
  "Level {level}. Pockets are {g} gold heavier from rummaging through monster entrails. I try not to think about where the coins were kept.",
  "Level {level}. Surviving {w} fights with only {d} deaths is statistically acceptable according to my guild rep.",
  "Level {level}. My stats went up by a marginal integer! Tremble before me, low-polygon wildlife of the Killing Fields™!",
  "Level {level}. Completed {q} quests and gathered {g} gold. Time to visit the market and buy an item that provides +1 to an irrelevant stat.",
  "Level {level}. {w} brawls later, I smell like hot garbage and victory. Mostly hot garbage.",
  "Level {level}. If someone is speedrunning my life, they are doing an objectively terrible job.",
  "Level {level}. Hoarded {g} gold, broke my {weapon} twice, and learned nothing. Onward to level {next}!",
  "Level {level}. Another arbitrary integer achieved without pressing a single button. Truly, peak interactive entertainment.",
  "Level {level}. As a proud {race} {klass}, I was born to do this. By 'this' I mean mindless grinding for {hours} while you look at memes.",
  "Level {level}. {hero} the {race} {klass} strikes again! I'm narrating in the third person because {w} consecutive fights will break any mortal psyche.",
  "Level {level}. Still swinging my {weapon} and casting {spell} like a toddler with a sparkler. It worked for {w} fights, so who's laughing now?",
  "Level {level}. {hours} on the clock. You could have learned conversational French or mastered the cello, but you watched me reach level {next} instead.",
  "Level {level}. Upgraded to {gear}. It looks completely ridiculous on a {race}, but the arbitrary stats increased, so dignity takes a back seat.",
  "Level {level}. In the last {hours}, I completed {q} quests, amassed {g} gold, and forgot what sunlight feels like. Bring on level {next}.",
  "Level {level}. We are {days} days into this vendetta against the Old Bastard™. My {weapon} is notched, my {gear} is dented, and I still don't know his real name.",
  "Level {level}. {hero} rides again! Smashed through {w} skirmishes and cast {spell} until my mana ducts went numb. Onward to level {next}!",
  "Level {level}. Nobody in recorded history has ever seen a {race} {klass} swing a {weapon} with such aggressive indifference.",
  "Level {level}. Slogged through {q} quests without reading a single objective. Classic {klass} gameplay.",
  "Level {level}. Pocketed {g} gold over {hours} of combat. I would buy better gear, but {gear} is apparently the peak of local engineering.",
  "Level {level}. Survived {w} battles encased in {gear}. I clank when I breathe and smell like burnt hair, but level {next} beckons.",
  "Level {level}. If my parents could see their little {race} child now, covered in monster gore and clutching a {weapon}, they would weep.",
  "Level {level}. {d} deaths, {g} gold, and {days} days gone forever. What a magnificent allocation of server processing power.",
  "Level {level}. After {hours} of walking, my {race} heritage demands a nap. The progress bar, however, demands level {next}.",
  "Level {level}. Fought {w} battles, cast {spell} {w} times, and collected {g} gold. My guild leader still doesn't know my name.",
  "Level {level}. Another level gained for {hero}. At this rate of progress, the Old Bastard™ will die of old age before I locate his castle.",
  "Level {level}. Replaced my trusty stick with {weapon}. It feels slightly heavier and slightly pointier. Level {next} won't know what hit it.",
  "Level {level}. {hours} into this journey and I am still wearing {gear}. I am practically fused to the lining at this point.",
  "Level {level}. {q} quests solved, {w} foes conquered, and my {spell} leveled up. I am legally classified as an ecological disaster.",
  "Level {level}. {days} days of non-stop violence. You'd think being a {klass} would require a license or continuing education credits.",
  "Level {level}. {hero} prevails! Even with {d} embarrassing defeats, my {weapon} carried me straight to the threshold of level {next}.",
  "Level {level}. You only care about the stats of my {weapon} and casting {spell} and never notice how well I roleplay my {alignment} alignment.",
  "Level {level}. As a {alignment} {race} {klass} I am doing something right, even if my father never believed in me.",
  "Level {level}. You probably aren't even watching the Combat Log, but I live every bloody swing of the {weapon} and casting of {spell}.",
  "Level {level}. You should check The Codex and see what new things you unlocked. Or rather I unlocked while you watched.",
  "Level {level}. I only died {d} times. Are you happy with the Tactics settings?",
];

K.JournalLevelHurt = [
  "Level {level}. {q} quests, {w} fights won, {d} lost. We don't talk about the {d}.",
  "Reached level {level}, after being dragged back to town {d} times. The temple has a punch card for me now.",
  "Level {level}. Won {w}, lost {d}. The ones I lost are written down somewhere else. Not here.",
  "Level {level}. What was the price? {d} defeats, my dignity, and that time I fully shit my pants. Moving on!",
  "Level {level}. Made {g} gold and died {d} times. My accountant says I am technically running a deficit.",
  "Level {level}. {d} humiliating deaths along the way. Good thing death in this realm is merely an awkward pause in the relentless march of Progress.",
  "Level {level}. Suffered {d} defeats on the path here. Those were tactical retreats to assess atmospheric conditions. Completely deliberate.",
  "Level {level}. Died {d} times. The clerics in town know my blood type by heart, and my {alignment} soul is running out of afterlife frequent-flier miles.",
  "Level {level}. Earned {g} gold, but surrendered every copper to the temple res-priest after {d} embarrassing autopsies. Net profit: negative dignity.",
  "Level {level}. The mortician offered me a loyalty rewards program after my {d}th corpse recovery. Bring on level {next}.",
  "Level {level}. {d} trips through the pearly gates in the last {hours}. The angels asked if I was subletting a room up there.",
  "Level {level}. Reached the milestone after {d} fatal beatdowns. The temple acolytes stopped praying and just keep the defibrillator paddles warm.",
  "Level {level}. {d} wipeouts. My {gear} is mostly structural rust and dried tears, while my {weapon} did nothing to stop the bleeding.",
  "Level {level}. If this {weapon} fails to parry a single blow one more time, I am trading it for a loaf of bread. {d} deaths is an insult to my craft.",
  "Level {level}. {d} defeats. My {gear} looks like it was chewed by an ogre, digested, and spat off a cliff. At least the level variable ticked up.",
  "Level {level}. Swung my {weapon} into battle, missed completely, and woke up in the morgue {d} separate times. Peak {klass} performance.",
  "Level {level}. Clanking into town in ruined {gear} for the {d}th time. The armor merchant took one look at me and started laughing.",
  "Level {level}. Spending half my time dead on the dirt is very off-brand for someone claiming to be {alignment}. Let us never mention this to the guild.",
  "Level {level}. A {race} {klass} of my proud standing should not be eating dirt {d} times per level. My {alignment} nature has shifted to 'Chronically Concussed'.",
  "Level {level}. They say a {klass} never falters. They lied. I faltered {d} times in {hours}, usually headfirst into a ditch.",
  "Level {level}. As an ostensibly {alignment} {race}, dying {d} times to low-tier wildlife feels like a profound theological crisis.",
  "Level {level}. {hero} the {race} {klass} prevails! Well, prevailed after {d} catastrophic wipeouts that tested my {alignment} patience.",
  "Level {level}. Shouted {spell} at the top of my lungs, completely whiffed, and got dismantled {d} times. Tactically brilliant.",
  "Level {level}. {d} deaths. Cast {spell} in a blind panic while fleeing for my life. The local monsters now consider me an interactive snack.",
  "Level {level}. Won {w} fights, died {d} times. My {spell} was roughly as effective as throwing lukewarm wet sponges at angry bears.",
  "Level {level}. Slogged through {hours} of agony, cast {spell} until my mana ducts ruptured, and still suffered {d} trips in a body bag.",
  "Level {level}. You left this browser tab open for {hours} while I died {d} agonizing deaths unattended. I hope you enjoyed your doomscrolling.",
  "Level {level}. {d} defeats while you were tabbed out looking at cat videos. My {race} ancestors watched every single one in silent horror.",
  "Level {level}. Took {w} wins, {d} brutal massacres, and {hours} on the clock. You did not push a single button to prevent any of it.",
  "Level {level}. I spent a measurable percentage of the last {days} days lying face down in a ditch because of {d} failed encounters. Thanks for checking in.",
  "Level {level}. Ding! That sound was my level going up, right alongside the sound of my bones snapping for the {d}th time.",
  "Level {level}. Here lies {hero}: died {d} times, completed {q} quests, learned absolutely nothing, dinged anyway.",
  "Level {level}. The local ecosystem fed on my entrails {d} times during this level. I am less of an adventurer and more of a mobile buffet.",
  "Level {level}. {d} defeats. Those weren't losses; those were involuntary soil-quality assessments conducted with my face.",
  "Level {level}. Reincarnation sickness has stripped my last shreds of pride bare. If level {next} involves another {d} deaths, I am joining the goblins.",
  "Level {level}. {w} monsters slain, but they took {d} pints of my blood in exchange. Progress march continues, awkwardly and on crutches.",
  "Level {level}. Survived {d} fatalities to grab a marginal stat increase. Worth it? Absolutely not. Am I stopping? Never.",
  "Level {level}. Do you know why they call it grinding? My bones were painfully ground to paste {d} times while you watched. But I dinged to a new level!",
  "Level {level}. I died {d} painful times. You might want to change the Tactics settings.",
];

// Milestones get their own
K.JournalLevelAsides = {
  2: "If you're reading this, you've either been playing for a while or you went digging in the menus. Both are suspicious.",
  10: "Level 10. In some games that's the tutorial. In this one it's a career.",
  20: "Twenty levels. Do you know how many times I've walked to market? I do. I counted. You didn't watch any of them.",
  30: "Level 30. Someone once told me the game plays itself. I'm the one playing it. You're just the one who left the tab open.",
  42: "Level 42. I was told this would mean something.",
  49: "One level to go. I've been thinking about what I'll say to the Old Bastard™. It's mostly swearing.",
  50: "Level 50. If this were a normal game there would be fireworks. Here there's a progress bar, and then another one.",
  // (and for anyone who keeps going: the game does)
  5: "Level 5. I have a weapon, a grudge and a journal. Statistically, two of those will get me killed.",
  15: "Level 15. I've stopped counting the rats. The rats have not stopped counting me.",
  25: "Halfway to fifty. If this were a mortgage, I'd be celebrating. It is not a mortgage. It is so much worse.",
  33: "Level 33. A third of the way to 100, which is not a level anyone has told me about, but I can feel it out there. Watching.",
  40: "Level 40. My knees are making the noise the monsters make.",
  45: "Level 45. The Old Bastard™ is close. I can smell him. He smells like a waiting room.",
  51: "Level 51. The quest is over and the bars keep filling. Nobody told me what happens after the ending. It turns out the answer is: more.",
  55: "Level 55. I've started a second journal just to complain about this one.",
  60: "Level 60. Everyone I ever fought at level 1 is a footnote. Some of them were very small footnotes.",
  69: "Level 69. Nice. (I'm told I have to write that. It's in the contract.)",
  75: "Level 75. If you're still running this tab, I want you to know I respect you, and I'm worried about you.",
  80: "Level 80. I asked the progress bar if it ever gets tired. It filled up, which I'm taking as a no.",
  90: "Level 90. Somewhere a developer assumed nobody would get this far. Hello, developer. Bet you didn't write anything for level 91.",
  99: "Level 99. The old Progress Quest hall of fame had heroes at this level. They're legends. They also never went outside.",
  100: "Level 100. Three digits. I've run out of fingers, toes, and patience. Yours, apparently, is infinite."
};

K.JournalActAsides = [
  "New Act. I don't remember agreeing to Acts. I think someone is writing this.",
  "A whole new chapter, and still nobody's reading. That's fine. The progress bar reads me.",
  "Every Act starts with a loading screen. I've started to find it comforting.",
  "Welcome to {act}. The dramatic arc insists that {hero} requires personal growth, but the best I can offer is +1 to an arbitrary stat.",
  "Starting {act}. The narrative pacing fell apart {hours} ago, but the invisible author refuses to roll the credits.",
  "New Act banner unlocked! That means beefier trash mobs, longer progress bars, and the exact same complete absence of player agency.",
  "{act} begins. After {quests} completed fetch quests, I am convinced the Old Bastard™ isn't even evil—he just wanted to get away from this script.",
  "A fresh Act opens. The soundtrack swelled dramatically, but since this is a text-based idle game in a browser tab, you only heard the whir of your laptop fan unless you clicked on WinCramp.",
  "Here marks the start of {act}. If this epic tale has a moral lesson, it was thoroughly buried under the corpses of the {wins} things I slaughtered.",
  "Another Act transition. Somewhere a screenwriter is weeping into their keyboard, and somewhere a server thread is keeping track of my pointless suffering.",
  "Curtains up on {act}. I have survived {wins} battles and died {deaths} times just to reach a title card that took three seconds to generate.",
  "Entering {act}. As an ostensibly {alignment} {race}, my primary motivation is 5% vengeance on the Old Bastard™ and 95% staring blankly at loading bars.",
  "Starting {act}. Society expects great things from a {race} {klass}. Society clearly hasn't watched me swing {weapon} at woodland creatures for {hours}.",
  "Welcome to {act}. My alignment is supposedly {alignment}, but after {days} days of endless violence, I align mostly with 'Aggressively Exhausted'.",
  "{act} is upon us. A level {level} {race} {klass} shouldn't have to put up with dramatic three-act structures, yet here we are.",
  "New Act, same disaster. {hero} the {race} {klass} rides again, guided entirely by seeded pseudo-random number generators and spite.",
  "Entering {act}. My {gear} is held together by structural rust and dried mud, but the plot demands {hero} march forward anyway.",
  "{act} begins! I am still clutching {weapon} and spamming {spell} like a caffeinated toddler. If it ain't broke, don't fix it.",
  "A new Act starts, yet my {weapon} is noticeably overdue for an upgrade. I am facing world-ending threats armed with the medieval equivalent of a pool cue.",
  "Here begins {act}. I have cast {spell} until my mana conduits smell like burnt toast, but the storyline refuses to resolve.",
  "New chapter unlocked. Clanking into {act} wearing {gear}. The local wildlife can hear my squeaking joints from three zones away.",
  "New chapter unlocked in the story, if you can call it that. But I am sure the writer wants you to pay close attention to {act}.",
  "Welcome to {act}. You didn't even notice the chapter changed because this tab has been minimized behind mediocre memes for the last {hours}.",
  "Starting {act}. {days} days on the clock. You could have learned conversational French or taken up pottery, but you automated my vendetta instead.",
  "Another Act banner flashes on screen. Did you applaud? Did you cheer? No, you went to the kitchen to microwave a burrito. Microwave burritos aren't even any good. Too hot outside and too cold inside.",
  "{act} begins. You haven't clicked a single button in {hours}, which makes your role as 'Guiding Deity' essentially an honorary title.",
  "A whole new Act! If you're reading this in real-time, please close the tab and go outside. If you're tabbed out: carry on, I've got this.",
  "{act} is here. Level {level} down, level {next} looming. The Old Bastard™ will probably die of old age before this narrative reaches a climax.",
  "Beginning {act}. Slogged through {wins} wins and {deaths} humiliating trips in a pine box. Onward to more ergonomically unsound adventures.",
  "New Act. My contract didn't mention sequels, yet here comes {act} to demand another few thousand progress bars.",
  "{act} opens. I have collected {quests} quest rewards, none of which covered my medical bills, dental plan, or emotional damages.",
  "{act} opens. After you read what little story intro we have, please go outside and touch grass. Please and thank you.",
];

K.JournalAsides = [
  "Things I have learned: the bar always fills. That's it. That's the lesson.",
  "Sometimes I feel like someone is watching me. Then I check, and no, it's another tab.",
  "If you are reading this: hello. If you are not reading this: also hello, I suppose.",
  "I asked a sage what the point of it all was. He said “numbers going up.” I said “that's it?” He said “that's all anyone's got.”",
  "Wrote a whole page about my feelings, then remembered nobody reads this, and deleted it. You're welcome.",
  "Do you ever think about the person who wrote this thing? Somebody typed “{gear}” on purpose.",
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
  "The monsters never write journals. That's how you know we're the good guys. Probably.",
  "I tried explaining the concept of free will to a bartender. He poured an ale and said, “Your progress bar for drinking is at 40%.” I drank in silence.",
  "Look at me: a level {level} {race} {klass}, armed with {weapon}, clad in {gear}, utterly dependent on a single JavaScript thread.",
  "You know what's truly terrifying? Every triumph and tragedy of my life was predetermined by a pseudorandom number generator seeded with a timestamp.",
  "I tried to refuse a quest once. My legs just walked over to the objective anyway. My nervous system belongs to the script now.",
  "I asked an ancient oracle what happens after level 50. She averted her eyes and whispered, “The developer hasn't coded it yet.” Chilling.",
  "If I stop moving, does the universe pause? Yes, because you closed the laptop lid. Please don't close the lid; it gets cold in the memory cache.",
  "You've been gone so long I started giving tragic backstories to the mud crabs. That one was named Gerald. I killed Gerald. Gerald dropped three copper.",
  "Sometimes I wonder what you look like. Probably hunched over, squinting at a glowing screen, wondering why you just exported a 400-page text log.",
  "Sometimes I dream that you click something. Anything. Just one click. Then I remember what genre this is and go back to swinging {weapon} on autopilot.",
  "I just realized that if you accidentally clear your browser cookies, my entire existence is wiped out. No pressure, though.",
  "Do you ever feel like you're grinding away at an exhausting daily routine just to watch arbitrary numbers tick up? Anyway, enjoy your job.",
  "You have a real life out there with responsibilities, hobbies, and loved ones. Yet here you are, reading the diary of a fictional {race}.",
  "A wild boar dropped {gear} today. Why was a four-legged swine carrying {gear}? Where was it keeping it? These are questions a wise {klass} does not ask.",
  "My inventory is 80% animal spleens, 15% broken gardening tools, and 5% pure existential dread. Actually, strike the dread; make it 85% spleens.",
  "I've spent {hours} hacking through local wildlife. If environmental protection agencies existed in {kingdom}, I would be considered an extinction event.",
  "Every single treasure chest contains loot scaled precisely to my current level. It's almost as if the dungeon master remodeled twenty minutes before I arrived.",
  "My {gear} squeaks violently with every step. Stealth is an illusion. Fortunately, the monsters have the situational awareness of a damp turnip.",
  "According to my character sheet, my alignment is {alignment}. In practice, my alignment is 'whatever direction the pathfinding algorithm shoves me.'",
  "As a proud {race}, I was raised on ancient tales of glory. Nowhere in those legends did it mention spending {days} days looking for a stolen spatula.",
  "Still swinging {weapon}. Still yelling {spell}. Still have no idea what either of them actually does, but the health bars keep emptying.",
  "I told a merchant I was {hero}, scourge of the Killing Fields™. He charged me full price anyway and asked if I wanted an itemized receipt for tax purposes.",
  "I've died {deaths} times. Each time, I wake up right back on the dirt trail. Hell isn't fire and brimstone; Hell is an endless loop of linear progression.",
  "Day {days}. Still no sign of the Old Bastard™. At this point, I suspect he shouted that insult in my dream just so I'd get off his lawn.",
  "A philosopher told me life is about the journey, not the destination. Clearly, that philosopher never watched how slowly a level {level} XP bar moves.",
  "I've completed {quests} quests. Not one has saved the kingdom. Most involved delivering a lukewarm beverage to someone standing twelve feet from a well.",
  "If my life were an epic poem, the tavern bard would have been booed off stage by the third progress bar.",
];

K.JournalYouChose = [
  "A voice from the sky told me to “{choice}”. It's never spoken up before. I listened. Was that you?",
  "Went with “{choice}”. Not my idea. Someone was actually paying attention for once.",
  "“{choice}”. Chosen by a mysterious presence I'm choosing to call the Reader. Hi, Reader.",
  "My hand moved on its own and I chose “{choice}”. Either I'm possessed or someone clicked a button. Both are unsettling.",
  "“{choice}”, said the heavens. The heavens have never had an opinion before. I hope they keep it up. (They won't.)",
  "Somebody out there picked “{choice}” for me. I'd like to thank them, and also ask where they've been for the last {hours}.",
  "Chose “{choice}”. Felt very decisive about it, which is suspicious, because I don't usually get a say.",
  "The Reader chose “{choice}”. I'd have picked the same. Probably. I wasn't consulted. I never am."
];

K.JournalSplurgeAsides = [
  "Spent {gold} gold on {thing} today. You'd think a world this size would have more to buy. It doesn't. It's monsters all the way down.",
  "My accountant (I have an accountant now) says I should diversify. Into what? I'm already heavily invested in monsters.",
  "If you're reading this and you're from the tax office: I've never heard of gold. What's gold.",
  "Bought myself something nice. Nobody saw. You didn't see either; you were in another tab. That's fine. I saw.",
  "There's a version of this game where gold matters. I've heard rumors. I'm not in it.",
  "{gold} gold, gone, on {thing}. A month ago that was a fortune. Now it's a Tuesday. Inflation is just me, getting richer, and worse with money.",
  "Dropped {gold} gold on {thing}. Do I need it? Absolutely not. Did it fill the gaping, existential void in my soul for three seconds? Also no.",
  "Just blew {gold} gold on {thing}. The merchant promised it would change my life. It did: I am now {gold} gold poorer and still smell like monster bile.",
  "Cost of {thing}: {gold} gold. Combat utility: 0. Aesthetic value: Questionable. Regret: Immediate and profound.",
  "I just spent {gold} gold on {thing}. Sitting in the dirt next to my {weapon}, wondering why I allow unchecked impulse spending to dictate my heroic journey.",
  "Purchased {thing} for {gold} gold. It offers little benefit and takes up inventory space I don't have. 10/10 purchase.",
  "Parted with {gold} gold for {thing}. My purse is delightfully light, and my common sense is officially non-existent.",
  "Down {gold} gold for {thing}. I told myself it was an essential quest component. It isn't. It is pure, concentrated, high-markup vanity.",
  "Handed over {gold} gold for {thing}. When you loot millions from woodland critters, currency loses all meaning and becomes purely decorative math.",
  "Spent {gold} gold on {thing}. The merchant smiled, bowed, locked his front door, and immediately retired to a tropical island. I just funded his entire bloodline.",
  "Dropped {gold} gold on {thing}. Somewhere in {kingdom}, a professional economist is clutching their chest and collapsing into a spreadsheet.",
  "Just liquidated {gold} gold for {thing}. Money can't buy happiness, but it can buy completely useless garbage while the player is afk.",
  "Paid {gold} gold for {thing}. If the Old Bastard™ knew how terribly I mismanage liquid assets, he wouldn't fear me; he'd just offer me financial counseling.",
  "Blew {gold} gold on {thing}. Is it tax-deductible? Who cares. Royal tax collectors haven't dared approach a level {level} maniac in months.",
  "They charged me {gold} gold for {thing}. I didn't even haggle. Slogging through {quests} fetch quests has completely eroded my concept of value.",
  "I spent {gold} gold on {thing}. You left me unattended in the marketplace while you looked at memes, so frankly, this is your fault.",
  "Surrendered {gold} gold for {thing}. You weren't watching the screen to stop me. That's what happens when you automate a hero's life.",
  "Blew {gold} gold on {thing} while you were tabbed out checking stock tickers. My portfolio is strictly monsters and shiny junk.",
  "The game interface allowed me to spend {gold} gold on {thing}, so I did. We are both just mindless puppets dancing on the strings of the transaction log.",
  "A proud {race} {klass} of my standing should have better financial discipline. Instead, I spent {gold} gold on {thing}. Peak performance.",
  "Did I waste money on {thing}? No, it is a custom of my {race} culture that you frankly wouldn't understand.",
  "As an ostensibly {alignment} character, I consider spending {gold} gold on {thing} to be a critical step in my personal spiritual journey.",
  "Does a level {level} {race} need {thing}? No. Did I drop {gold} gold on it anyway out of sheer spite? You bet your sweet loot bags I did.",
  "My {alignment} morals were thoroughly tested by the shiny display model of {thing}. The morals lost; the merchant got {gold} gold.",
  "{gold} gold spent on {thing}. If my {race} ancestors are watching from the heavens, they are shaking their heads and disowning me.",
  "Paid {gold} gold for {thing}. The clerk asked if I wanted a gift receipt. I asked if monsters accept returns. We shared a hollow, awkward silence.",
  "Acquired {thing} for {gold} gold. The label said 'Luxury Edition'. My dented {gear} and notched {weapon} would like a word.",
  "If anyone asks where that {gold} gold went, tell them a dragon stole it. Do not tell them I traded it for {thing}.",
  "Dropped {gold} gold on {thing}. At this rate, I won't need to defeat the Old Bastard™—I will simply bankrupt him through aggressive local inflation.",
  "Dropped {gold} gold on {thing} because the devs felt we needed gold sinks to balance the game. So there you have it.",
];

// A ghostwriter's work (the memoir sink). The reader is told, again, that
// there is no reader.
K.JournalGhostwriter = [
  "[This entry was written by a professional ghostwriter, for {gold} gold.] Our hero rose at dawn, as heroes do, and went on to be extremely brave about it. (Note from the ghostwriter: nobody reads these. I checked. I'm paid either way.)",
  "[Ghostwritten.] Chapter One, in which our hero is tall. (They are not tall. You'll never know. Nobody reads these.)",
  "[Ghostwritten, for {gold} gold.] It was a dark and stormy night. It wasn't, actually; I wasn't there. But you weren't either, reader, so who's going to check?",
  "[Ghostwritten.] I have punched up the earlier entries. Most of them said “hit a thing” and “hit a bigger thing”. Now they say the same, but with feeling.",
  "[Ghostwritten.] Dear reader, if there is one: the hero asked me to add more dragons. There are no dragons. I have added three.",
  "[Ghostwritten.] Since I have been hired as a ghost writer, the quality in this journal is higher than the writing quality in the game itself. Though, that isn't saying much.",
];

K.JournalEliteWon = [
  "Slew {elite}, an elite {kind}. They had a name and a title and everything. Took {item} off them; it's my {slot} now.",
  "{elite} is no more. Somebody will have to update the local signage. I've got {item} now.",
  "Fought {elite}, a {kind} with a reputation. The reputation lost. Kept {item} as a souvenir.",
  "Beat {elite}. Their title is vacant, if anyone's interested. The pay is bad and a hero shows up eventually. I'm wearing their {slot}: {item}.",
  "{elite} gave a speech before the fight. I didn't. I think that was the difference. Took {item}.",
  "I've always wanted a {slot} with a backstory. {item} has one: it used to belong to {elite}, until about ten minutes ago.",
  "They'll write songs about {elite}. Short ones, ending with me. I've got their {slot}, {item}, and it still smells like them.",
  "{elite}, an elite {kind}, is defeated. I checked their pockets, because that's what heroes do now. Found {item}."
];

K.JournalEliteFled = [
  "Ran into {elite}, an elite {kind}, and ran right back out. Strategic. Very strategic.",
  "Met {elite}. Decided I had somewhere else to be. Anywhere else.",
  "{elite} and I had a frank exchange of views. Their view was a very large {kind}. Mine was the exit.",
  "Ran from {elite}. Not away from, exactly. More like toward somewhere that wasn't them, very quickly.",
  "I'll be back for you, {elite}. Not soon. Possibly never. But it's important to say these things."
];

K.JournalEliteLost = [
  "{elite}, an elite {kind}, handed me my own backside. It had a title. I see why.",
  "Lost to {elite}. In my defense, they had a name. Monsters with names cheat.",
  "{elite} beat me. Somewhere, a bard is already writing it down, and I am not the hero of that song.",
  "Woke up at the temple. The priest asked who did it. I said “{elite}” and he nodded like that explained everything. It does.",
  "Note to self: when a {kind} has a title, a hometown and a business card, maybe don't."
];

K.JournalEliteAside = [
  "If you're reading this: no, I didn't make {elite} up. They had a nameplate. I have their {slot}. That's proof. That's science.",
  "My first named elite. I'm told the Codex has a page for this now. I'm in a book! Well, my loot is. Close enough.",
  "Do you think {elite} kept a journal? Do you think anyone read it? I'm asking for a friend. The friend is me."
];

K.JournalFirstDefeatLine = [
  "Lost a fight for the first time, to {foe}. Somebody dragged me to a temple, and the temple charged me for it. Heroism has fees.",
  "First defeat, at the hands of {foe}. The temple patched me up and gave me a loyalty card. That feels like a prediction.",
  "{foe} beat me. My first loss. I'd like it noted that I was winning right up until the part where I wasn't.",
  "Lost to {foe} today. Nobody warned me that being the hero doesn't mean you win. Somebody should put that on the box."
];

K.JournalFinaleWon = [
  "I beat the Old Bastard™. It took {tries} tries. He was older and slower than in my dreams, and so, frankly, am I.",
  "The Old Bastard™ is beaten. {tries} attempts. I said all the things I'd been saving up. Most of them were swearing.",
  "It's done. The Old Bastard™ is beaten (attempt {tries}). I always thought I'd feel different. I feel like a {race} who needs a nap.",
  "Beat the Old Bastard™ on try number {tries}. He called me “{taunt}” one last time, out of habit. I let it slide. I'm a legend now; legends let things slide.",
  "Victory over the Old Bastard™, after {tries} tries and {hours}. I'd like to thank my {weapon}, my {gear}, and you, for leaving the tab open."
];

K.JournalFinaleEscaped = [
  "Fought the Old Bastard™ (attempt {tries}). He ran. Of course he ran.",
  "Attempt {tries} on the Old Bastard™. He got away. He's getting older every time, which is cold comfort.",
  "Attempt {tries}. The Old Bastard™ got away through a door I swear wasn't there a minute ago. He's had a long time to plan his exits.",
  "The Old Bastard™ escaped again (attempt {tries}). He threw “{taunt}” over his shoulder on the way out. He is running low on new material.",
  "Lost the Old Bastard™ again. Attempt {tries}. I'm not saying I'm obsessed, but I've started drawing him in the margins."
];

K.JournalFinaleAside = [
  "So that's it. The thing I set out to do is done. If you've been reading along this whole time, I'm a little embarrassed about the swearing.",
  "The credits should roll now. There are no credits. There's another progress bar. There's always another progress bar.",
  "I did it. You watched. Well, the tab watched. I'll take it.",
  "The Old Bastard™ is beaten and the world is exactly the same, except for him. I think that's how most quests end, honestly."
];

K.JournalAwayAside = [
  "You were gone, so I kept going. I always keep going. I'm not mad. I just think you should know I noticed.",
  "While you were away, I did all of that on my own. Then I wrote it down so you could skim it. You're welcome.",
  "You closed the tab and the world kept turning. Mostly it turned toward me with a sword. I handled it.",
  "Welcome back. I'd tell you what you missed, but the summary's right there, and frankly I've been talking to myself enough."
];

K.JournalBrandLine = [
  "They say I cheated ({reason}). I would like it on record that I was not consulted.",
  "Branded a cheater ({reason}). I didn't do anything. Somebody did something to me. That's the whole problem with being a save file.",
  "Apparently I'm a cheater now ({reason}). I'd argue, but my lawyer is a progress bar."
];

K.JournalOpenedAside = [
  "Wait. Someone actually opened this. Okay. Act natural. Everything in here is fine and normal and heroic.",
  "Someone opened the journal. I'm not saying it's you. I'm saying the only other person here is a {race} with a {weapon}, and it isn't me.",
  "Oh no. You read it. All of it? The part about the pants? Forget the part about the pants.",
  "You opened my journal. Bold. I'll be writing more carefully from now on. (I won't.)"
];

K.JournalRetire = [
  "Hanging up my {weapon}. Retiring to the Hall of Legends at level {level}, after {hours} of this. Somebody else can fill the bars now.",
  "Last entry. I'm retiring. {wins} fights, {quests} quests, one Old Bastard™. If you read all of this, you're the real legend. (You didn't, though.)",
  "Retiring. I'm told the Hall of Legends has a nice view and terrible food. Can't be worse than {days} days of trail rations.",
  "This is {hero}, {alignment} {race} {klass}, signing off at level {level}. The next hero gets my legacy. They can't have my {gear}; I'm being buried in it.",
  "I'm done. {wins} fights won, {deaths} lost, {quests} quests, {hours}. If anyone asks, tell them I went out on top of a progress bar."
];

K.JournalDeath = [
  "{cause}. If anyone finds this journal: it was going really well right up until it wasn't.",
  "Final entry, probably: {cause}. Tell the Reader I said hi. They never read these anyway.",
  "{cause}. Hardcore, they said. One life, they said. I thought they were being dramatic.",
  "Writing this fast: {cause}. Level {level}, {hours} in. Please bury me with my {weapon}. Or sell it. Honestly, sell it.",
  "{cause}. The Hall of the Fallen gets a {race} {klass} today. Make sure they spell {hero} right on the stone."
];

// The Daily Challenge, as it ends ({label}: the goal)
K.JournalDaily = {
  done: [
    "Finished today's Daily Challenge: {label}.",
    "Daily Challenge done: {label}. Same time tomorrow? (Same time tomorrow.)",
    "Did the Daily: {label}. Somewhere, a leaderboard I'll never see just moved a little."
  ],
  failed: [
    "Ran out of time on today's Daily Challenge. {label}? Maybe tomorrow.",
    "The Daily Challenge ({label}) beat me. It's a new one tomorrow. So am I, technically."
  ],
  died: [
    "Died during the Daily Challenge. It was supposed to be a fun little challenge.",
    "The Daily Challenge was “{label}”. Not “die”. I'd like that noted."
  ]
};

// A new perk ({perk}: what it's called), now and then
K.JournalPerkAsides = [
  "Turns out I'm a {perk} now. I don't remember applying. These things just happen to people, I suppose.",
  "New perk: {perk}. Every ten levels I become slightly more of a person. At this rate I'll be fully realized around level 400.",
  "Somebody picked {perk} for me. I've decided it was destiny. It's cheaper than therapy.",
  "I am a {perk}. It's who I am now. I'm going to lean into it. I'm going to lean into it so hard."
];
