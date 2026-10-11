// The end of a hero, written up: a newspaper front page when they retire to
// the Hall of Legends, a gravestone when a Hardcore hero dies, with the
// statistics nobody asked for ("Itemized Ridicule"), and their whole life
// as a bad fantasy novel (Markdown) to download.
//
// The ridicule is worked out from the hero (RidiculeStats, in the game
// window) and kept with the legend or the obituary (ridicule, cause), so
// the Hall can show it forever. The novel is made from the journal, so it
// can only be had while the hero is around: from the Journal menu, the
// retirement window and the tombstone.
//
// Loaded by main.html and index.html (which only draws the pages). What a
// page or a novel says is picked by a hash of the hero, so it reads the
// same every time it's opened.

K.Chronicle = {
  LeaguesPerTrip: 3,   // to the Killing Fields™ or to market, and back
  Papers: ['The Realm Gazette', 'The Killing Fields Courier', 'The Daily Progress', 'Ye Olde Tattler',
           'The Weekly Grind', 'The Idle Times'],
  Headlines: [
    'LOCAL {RACE} {KLASS} RETIRES; KINGDOM RELIEVED',
    '{NAME} HANGS UP {WEAPON}',
    'OLD BASTARD™ DEFEATED; HERO IMMEDIATELY QUITS',
    'HERO FINISHES QUEST, DEMANDS PENSION',
    'IT’S OVER: {NAME} RETIRES AT LEVEL {LEVEL}',
    '{NAME}: “I’D DO IT AGAIN.” (THEY WON’T)'
  ],
  Subheads: [
    'Sources confirm {won} levels of hitting things were “plenty”',
    'Monster population expected to rebound by spring',
    'Bards scramble for words that rhyme with “{name}”',
    'Hall of Legends adds a plaque, and a slightly larger one for the gift shop',
    'Old Bastard™ “fine, honestly,” says Old Bastard™'
  ],
  Leads: [
    '{name}, a {alignment} {race} {klass}, retired yesterday to the Hall of Legends after {played} of what friends describe as “mostly walking”. The hero beat the Old Bastard™ at level {won}, {tries}, and was dragged back to town {deaths} along the way.',
    'After {played} on the job, {name} the {race} {klass} has retired, citing “a sense of completion” and “my knees”. The Old Bastard™ fell at level {won}, {tries}. Temples report {defeats} admissions under the hero’s name.',
    'The realm woke today to the news that {name} ({alignment}, {race}, {klass}) has retired. Over {played} the hero rose to level {level}, ended the Old Bastard™ at level {won}, {tries}, and was beaten senseless {deaths}.'
  ],
  Seconds: [
    'Asked for comment, the Old Bastard™ repeated his famous line, “{taunt}”, then lay back down.',
    'The hero’s prized {gear} will be auctioned to cover outstanding tavern tabs.',
    'A spokesperson for the Killing Fields™ called the retirement “a relief, frankly” and asked that the hero not visit.',
    'Their rival, {rival}, issued a statement claiming to have “softened him up”. Nobody believes it.'
  ],
  Classifieds: [
    'FOR SALE: one {gear}, lightly used. Smells of viscera. No refunds.',
    'WANTED: a hero. Must supply own Pet Rock.',
    'LOST: {name}’s sense of purpose. Last seen at the Old Bastard™’s cave.',
    'FOR RENT: one cave, recently vacated. Damp. Previous tenant old, and a bastard.',
    'SERVICES: Ghostwriter available. Will make your journal readable. Nobody will read it.'
  ],
  Weather: ['Grim.', 'Overcast, with a chance of prophecy.', 'Clear, for once.', 'Raining viscera.'],
  // Primary cause of retirement
  Retirements: ['Boredom', 'Winning, technically', 'A bad knee', 'Sick of the Old Bastard™’s face',
                'Nothing left to prove, or to sell', 'Running out of progress bars'],
  // Primary cause of death, when nothing else explains it
  Deaths: ['Overconfidence', 'Overconfidence', 'Hubris', 'Optimism', 'Not reading the room', 'Statistics'],

  // The novel
  Titles: ['The {Adj} Chronicles of {hero}', '{hero} and the Progress Bar of Destiny', 'A Song of Loot and Viscera',
           '{hero}: The Idle Years', 'The Wheel of Grind', 'Fifteen Thousand Monsters and a {race}',
           'The Name of the {klass}', 'Of {race}s and Men'],
  Adjectives: ['Interminable', 'Mostly Accurate', 'Unabridged', 'Self-Published', 'Unauthorized', 'Extended'],
  Chapters: ['{title}, or: In Which {hero} Hits Things', '{title} (Director’s Cut)', 'The {bare} Affair',
             '{title}: Electric Boogaloo', 'Return of the {bare}', '{title}, Part One of One',
             'A Song of {bare} and Viscera', '{hero} and the {bare}', '{title}: A Cautionary Tale',
             '{title} (Abridged, Somehow Still Long)', 'The Fellowship of the {bare}', 'Yet More {bare}',
             '{title}, Again', 'Where the {bare} Things Are', 'The Empire Strikes {bare}', 'Ye Olde {bare}'],
  Blurbs: [
    '“I couldn’t put it down. I couldn’t pick it up, either.” — {rival}, rival',
    '“{taunt}” — the Old Bastard™',
    '“A triumph of the progress bar.” — The Killing Fields Courier',
    '“Long. So long.” — a Giant Orc, deceased',
    '“I was in this book and I don’t remember any of it.” — a Pet Rock',
    '“Five stars. Would grind again.” — Sir Spreddit'
  ],
  AlsoBy: ['{hero} Goes to Market (Again)', 'Viscera: A Field Guide', 'My Henchman and Me',
           'The Old Bastard™: An Unauthorized Biography', 'Resting: A Memoir', 'Fifty Ways to Leave Your Pet Rock']
};

// ---- Itemized Ridicule (in the game window) ------------------------------------

function ChronicleHash(s) {
  var h = 5381;
  s = String(s || '');
  for (var i = 0; i < s.length; ++i) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

function ChroniclePick(list, key) {
  return list[ChronicleHash(key) % list.length];
}

function ChronicleFill(text, v) {
  return String(text).replace(/\{([A-Za-z0-9-]+)\}/g, function (m, k) { return v[k] !== undefined ? v[k] : m; });
}

// "Overconfidence": why it ended (kind: 'died' or 'retired'; fight: the
// last one, for a death)
function PrimaryCause(kind, fight) {
  var C = K.Chronicle, key = (game.lifeId || '') + kind, level = GetI(Traits, 'Level');
  if (kind == 'retired') {
    if ((game.deaths || 0) > (game.wins || 0) / 5) return 'Exhaustion, mostly from losing';
    if (game.mode == 'minus') return 'Choosing New Game− in the first place';
    return ChroniclePick(C.Retirements, key);
  }
  fight = fight || {};
  if (fight.boss) return 'Ambition (the Old Bastard™, personally)';
  if (game.mode == 'minus') return 'Choosing New Game− in the first place';
  if ((fight.foeLevel || level) < level) return 'Overconfidence';
  if ((fight.foeLevel || level) >= level + 3) return 'Ambition';
  return ChroniclePick(C.Deaths, key);
}

// [label, value] pairs, for the front page, the gravestone and the novel
function RidiculeStats(kind, fight) {
  var C = K.Chronicle, n = function (x) { return Math.round(x || 0).toLocaleString(); };
  var trips = game.trips !== undefined ? game.trips : Math.round((game.wins || 0) / 6);   // (heroes from before the count)
  var worst = game.worstDefeat;
  if (fight && kind == 'died' && !fight.boss && typeof WorseDefeat == 'function' &&
      WorseDefeat(fight.foeLevel || GetI(Traits, 'Level'), GetI(Traits, 'Level'), worst))
    worst = { foe: fight.foe, level: fight.foeLevel, at: GetI(Traits, 'Level') };   // (the fatal blow counts)
  var fated = (game.choiceLog || []).filter(function (c) { return c.by == 'fate'; }).length;
  var chosen = (game.choiceLog || []).length;
  var rows = [
    ['Total Distance Walked in Circles', n(trips * C.LeaguesPerTrip) + ' leagues'],
    ['Total Gold Wasted on Useless Clutter', n(game.goldSpent) + ' gold' +
      (game.splurges ? ' (' + n(game.splurges) + (game.splurges == 1 ? ' splurge)' : ' splurges)') : '')],
    ['Gold Handed to Shopkeepers Anyway', n(game.shopSpent) + ' gold'],
    ['Most Humiliating Defeat', worst ? ProperName(String(worst.foe || 'something')) + ', level ' + worst.level +
      ' (the hero was level ' + worst.at + ')' : 'None. Suspicious.'],
    ['Monsters Inconvenienced', n(game.wins)],
    ['Times Dragged Back to Town', n(game.deaths)],
    ['Naps Taken', n(game.rests)],
    ['Viscera Sold', n(game.sold) + ' lots'],
    ['Quests Done for People Who Could Have Done Them Themselves', n(game.questsDone)],
    ['Decisions Left to Fate', chosen ? n(fated) + ' of ' + n(chosen) : 'None. Fate was offended.'],
    ['Longest Winning Streak', n(game.bestStreak) + ' fights'],
    ['Time Spent Watching Progress Bars', RoughTime(Math.round(game.elapsed || 0))],
    [kind == 'died' ? 'Primary Cause of Death' : 'Primary Cause of Retirement', PrimaryCause(kind, fight)]
  ];
  return rows;
}

// ---- Drawing them (game window and main menu) --------------------------------------

// The front page of a legend's retirement (an element)
function FrontPage(l) {
  var C = K.Chronicle, key = l.id || l.name;
  var tries = !l.tries || l.tries == 1 ? 'on the first try' : 'on the ' + OrdinalText(l.tries) + ' try';
  var times = function (x) { x = x || 0; return x.toLocaleString() + (x == 1 ? ' time' : ' times'); };
  var v = {
    name: l.name, NAME: String(l.name).toUpperCase(), race: l.race, RACE: String(l.race).toUpperCase(),
    klass: l.klass, KLASS: String(l.klass).toUpperCase(), alignment: l.alignment || 'Unaligned',
    level: l.level, LEVEL: l.level, won: l.wonLevel || l.level, tries: tries, deaths: times(l.deaths), defeats: (l.deaths || 0).toLocaleString(),
    played: ChronicleTime(l.played || 0), taunt: l.taunt || 'Thou fool!', gear: l.bestequip || 'Pet Rock',
    WEAPON: String(l.bestequip || 'Pet Rock').toUpperCase(), rival: l.rival || 'their rival'
  };
  var seconds = C.Seconds.filter(function (s) { return l.rival || s.indexOf('{rival}') < 0; });
  var date = l.retired ? new Date(l.retired).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
  var page = $('<article class="frontpage">');
  $('<div class="fp-mast">').text(ChroniclePick(C.Papers, key + 'p')).appendTo(page);
  $('<div class="fp-dateline">').append($('<span>').text(date), $('<span>').text('One copper'),
                                        $('<span>').text('Weather: ' + ChroniclePick(C.Weather, key + 'w'))).appendTo(page);
  $('<h2 class="fp-headline">').text(ChronicleFill(ChroniclePick(C.Headlines, key + 'h'), v)).appendTo(page);
  $('<div class="fp-subhead">').text(ChronicleFill(ChroniclePick(C.Subheads, key + 's'), v)).appendTo(page);
  var cols = $('<div class="fp-cols">').appendTo(page);
  var story = $('<div class="fp-story">').appendTo(cols);
  $('<p>').text(ChronicleFill(ChroniclePick(C.Leads, key + 'l'), v)).appendTo(story);
  $('<p>').text(ChronicleFill(ChroniclePick(seconds, key + 'x'), v)).appendTo(story);
  if (l.bestspell || l.beststat)
    $('<p>').text('Colleagues remember ' + [l.bestspell ? 'their ' + l.bestspell : '', l.beststat ? 'a ' + l.beststat : '']
      .filter(Boolean).join(' and ') + ', and little else.').appendTo(story);
  $('<div class="fp-classified">').text(ChronicleFill(ChroniclePick(C.Classifieds, key + 'c'), v)).appendTo(story);
  cols.append(RidiculeBox(l.ridicule));
  return page;
}

// A Hardcore hero's gravestone (an element)
function Gravestone(o) {
  var stone = $('<article class="gravestone">');
  $('<div class="gs-rip">').text('R.I.P.').appendTo(stone);
  $('<div class="gs-name">').text(o.name).appendTo(stone);
  $('<div class="gs-what">').text('Level ' + o.level + ' ' + o.race + ' ' + o.klass).appendTo(stone);
  $('<div class="gs-cause">').text(o.cause || ('Slain by ' + o.slainBy)).appendTo(stone);
  if (o.lastWords) $('<div class="gs-words">').text('“' + o.lastWords + '”').appendTo(stone);
  if (o.epitaph) $('<div class="gs-epitaph">').text(o.epitaph).appendTo(stone);
  stone.append(RidiculeBox(o.ridicule));
  return stone;
}

function RidiculeBox(rows) {
  var box = $('<div class="ridicule">');
  $('<div class="ridicule-head">').text('Itemized Ridicule').appendTo(box);
  if (!rows || !rows.length) {
    $('<p class="ridicule-none">').text('This hero retired before anyone was counting. Lucky them.').appendTo(box);
    return box;
  }
  var dl = $('<dl>').appendTo(box);
  rows.forEach(function (r) { dl.append($('<dt>').text(r[0]), $('<dd>').text(r[1])); });
  return box;
}

// Show one in a window: a legend's front page or a fallen hero's gravestone
function OpenChronicle(record, kind) {
  if (!document) return;
  var dlg = document.createElement('dialog');
  dlg.className = 'chronicle-dlg';
  dlg.setAttribute('aria-label', kind == 'died' ? record.name + '’s gravestone' : record.name + ' on the front page');
  var close = $('<button type="button" class="chronicle-close" aria-label="Close">×</button>');
  $(dlg).append(close, kind == 'died' ? Gravestone(record) : FrontPage(record));
  document.body.appendChild(dlg);
  var done = function () { dlg.close(); dlg.remove(); };
  close.on('click', done);
  $(dlg).on('cancel', function (e) { e.preventDefault(); done(); })
        .on('click', function (e) { if (e.target === dlg) done(); });
  dlg.showModal();
  close.trigger('focus');
}

function ChronicleTime(seconds) {
  if (typeof RoughTime == 'function') return RoughTime(seconds);
  var h = Math.round(seconds / 3600);
  return h < 48 ? h + ' hours' : Math.round(h / 24) + ' days';
}

function OrdinalText(n) {
  var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ---- The novel (in the game window) ---------------------------------------------

// The hero's life so far as a bad fantasy novel, in Markdown: the Prologue,
// a chapter for each Act (its story, the journal through it, its ending),
// an epilogue, and an appendix of ridicule
function NovelText(opts) {
  opts = opts || {};
  var C = K.Chronicle, name = Get(Traits, 'Name'), key = (game.lifeId || name) + 'novel';
  var rival = typeof RivalMet == 'function' && RivalMet() ? RivalFull() : '';
  var prologue = typeof StoryFor == 'function' ? StoryFor(0) : null;
  var v = { hero: name, race: Get(Traits, 'Race'), klass: Get(Traits, 'Class'),
            Adj: ChroniclePick(C.Adjectives, key + 'a'), rival: rival, taunt: (prologue && prologue.taunt) || 'Thou fool!' };
  var title = ChronicleFill(ChroniclePick(C.Titles, key + 't'), v);
  var md = function (s) { return String(s).replace(/([*_`#\\])/g, '\\$1'); };
  var out = [];
  out.push('# ' + md(title), '');
  out.push('### Book One of the ' + md(v.race) + ' ' + md(v.klass) + ' Cycle', '');
  out.push('*by ' + md(name) + '*  ', '*(as told to a journal nobody was ever meant to read)*', '');
  out.push('---', '', '**Praise for *' + md(title) + '***', '');
  C.Blurbs.filter(function (b) { return rival || b.indexOf('{rival}') < 0; }).slice(0, 4).forEach(function (b) {
    out.push('> ' + md(ChronicleFill(b, v)), '');
  });
  out.push('---', '');

  // The Prologue: the dream, and how it began
  out.push('## Prologue', '');
  if (prologue) {
    out.push(md(prologue.purpose), '');
    (prologue.ending || []).forEach(function (line) { out.push(md(line) + (/[.!?”"…]$/.test(line) ? '' : '.'), ''); });
  }

  // The journal, chapter by chapter: a new one at each Act's beginning
  var chapter = 0, epilogue = [];
  var chapterTitle = function (caption) {
    var t = String(caption).replace(/^Act [IVXLCDM]+:\s*/, '') || caption;
    var bare = t.replace(/^The\s+/, '');
    return ChronicleFill(C.Chapters[(ChronicleHash(key) + chapter * 7) % C.Chapters.length], { title: t, bare: bare, hero: name });
  };
  (game.journal || []).forEach(function (e) {
    var x = String(e.x || '');
    if (e.k == 'act' && !/^The end of/.test(x)) {
      ++chapter;
      var m = /^(Act [IVXLCDM]+(?::[^.]*)?)\.\s*(.*)$/.exec(x);
      out.push('## Chapter ' + toRoman(chapter) + ': ' + md(chapterTitle(m ? m[1] : x)), '');
      out.push(md(m ? m[2] : x), '');
    } else if (e.k == 'act') {
      out.push('* * *', '', md(x.replace(/^The end of (Act [IVXLCDM]+|the Prologue)\.\s*/, '')), '');
    } else if (e.k == 'finale' || e.k == 'end' || e.k == 'death' || e.k == 'retire') {
      epilogue.push(x);
    } else if (e.k == 'aside') {
      out.push('> *' + md(x) + '*', '');
    } else if (e.k == 'level') {
      out.push((/^Level \d/.test(x) ? '' : '*Level ' + e.l + '.* ') + md(x), '');
    } else if (e.k != 'begin') {
      out.push(md(x), '');
    }
  });

  out.push('## Epilogue', '');
  epilogue.forEach(function (x) { out.push(md(x), ''); });
  if (opts.retiring) out.push('And then ' + md(name) + ' retired to the Hall of Legends, where it is quieter.', '');
  if (!epilogue.length && !opts.retiring)
    out.push(game.dead ? md(name) + ' died. It happens.' : md(name) + ' is, at the time of writing, still out there, hitting things. ' +
             'A sequel is threatened.', '');

  out.push('## Appendix A: Itemized Ridicule', '', '| | |', '|---|---|');
  RidiculeStats(game.dead ? 'died' : 'retired', game.dead ? game.combat : null).forEach(function (r) {
    out.push('| ' + md(r[0]) + ' | ' + md(r[1]).replace(/\|/g, '/') + ' |');
  });
  out.push('', '## About the Author', '');
  out.push(md(name) + ' is a level ' + GetI(Traits, 'Level') + ' ' + md(v.race) + ' ' + md(v.klass) + ' who has spent ' +
           ChronicleTime(Math.round(game.elapsed || 0)) + ' watching progress bars fill. This is their first novel. ' +
           'It was not meant to be read.', '');
  out.push('## Also by ' + md(name), '');
  C.AlsoBy.forEach(function (t) { out.push('- *' + md(ChronicleFill(t, v)) + '*'); });
  var words = out.join(' ').split(/\s+/).filter(Boolean).length;
  out.push('', '---', '', '*' + words.toLocaleString() + ' words. The publisher has asked us to mention that most of them are “hit”.*');
  out.push('', '*Progress Quest Remix · ' + new Date().toLocaleDateString() + '*');
  return out.join('\n');
}

// opts.retiring: from the retirement window, just before
function DownloadNovel(opts) {
  if (typeof DownloadText != 'function') return;
  DownloadText(NovelText(opts), Get(Traits, 'Name') + ' - A Bad Fantasy Novel.md', 'text/markdown;charset=utf-8');
}
