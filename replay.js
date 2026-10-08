// Replaying a hero's game, to check that it was played fair.
//
// A hero's game follows from where it started, the seeded random numbers,
// and the player's choices and tactics. A hero created since replays came
// in keeps all of that (game.replay.birth and game.choiceLog), plus a
// fingerprint of the state every K.Replay.Every tasks (game.replay.list).
// ReplayHero() plays the game again from the birth, with the same inputs
// at the same moments, and compares fingerprints as it goes. Edit the save,
// or play with a modified copy of the game, and the replay comes out
// different.
//
// When the game is updated, the replay starts a new stretch (AnchorReplay
// in main.js): the "birth" is then the hero as they were at that moment
// (game.replay.since), and that stretch is what gets replayed.
//
// Used three ways:
//   - in the browser, as a Web Worker (importing a hero; transfer.js)
//   - by sim.js:  node sim.js --replay hero.pqw
//   - by anything else that has loaded the game scripts headlessly
//
// A replay only means something with the code the hero was played with:
// game.replay.fp is a hash of the game's code (K.Replay.Files), and a
// hero played under other code isn't replayed at all.

// Replay a saved hero. opts: { until: last task to check (default: all),
// budgetMs: stop after this long, onProgress(done, total) }.
// Returns { status, checked, total, at, detail }:
//   "match"     every checkpoint up to `checked` came out the same
//   "partial"   the same so far, but the time budget ran out at `checked`
//   "mismatch"  checkpoint `at` came out different (detail says how)
//   "unable"    this save can't be replayed (detail says why)
function ReplayHero(save, opts) {
  opts = opts || {};
  var r = save.replay;
  if (!r || !r.birth) return { status: "unable", detail: "it was created before replays (or by an older version)" };
  // (only older versions froze a replay, when the game was updated)
  if (r.frozen && (save.saveVersion || 0) < 14) return { status: "unable", detail: "it was played with an older version of the game" };
  if ((save.tasks || 0) <= (r.birth.tasks || 0)) return { status: "unable", detail: "it hasn't played since its replay began" };
  var list = r.list || [];
  var until = Math.min(opts.until || Infinity, save.tasks || 0);
  var want = {};
  list.forEach(function (c) { want[c[0]] = c[1]; });

  // The inputs, by the task they belong to
  var tactics = {}, picks = {};
  (save.choiceLog || []).forEach(function (e) {
    if (e.tactic) (tactics[e.t] = tactics[e.t] || []).push(e);
    else if (e.event && e.by == "you") picks[e.t] = e;
  });

  // Start the hero over in a browser-in-a-box (heroes kept in memory: see
  // WithHeroes in config.js)
  var birth = JSON.parse(JSON.stringify(r.birth));
  ReplayReset();
  var id = HeroId(birth);
  storage.saveHero(birth, function () {});
  window.location.href = "main.html#" + EncodeName(id);
  FormCreate();
  if (!game || game.lifeId != id) return { status: "unable", detail: "the replay couldn't load the hero" };

  var started = Date.now(), steps = 0, checked = 0;
  while (game.tasks < until) {
    // tactics changed while this task ran
    (tactics[game.tasks] || []).forEach(function (e) {
      game.tactics = game.tactics || {};
      game.tactics[e.tactic] = e.value;
    });
    // a choice the player made, which ended the deciding task early
    var pick = picks[game.tasks + 1];
    if (pick && game.task == "choice" && game.event && game.event.key == pick.event) {
      game.event.picked = pick.pick;
      if (pick.ms) TaskBar.reset(pick.ms, pick.ms);
    }
    var before = game.tasks;
    ReplayStep();
    if (game.tasks == before) return { status: "mismatch", at: before, checked: checked, total: until, detail: "the game stopped" };
    if (want[game.tasks] !== undefined) {
      var got = CheckpointHash();
      if (got != want[game.tasks])
        return { status: "mismatch", at: game.tasks, checked: checked, total: until,
                 detail: "at task " + game.tasks.toLocaleString() + " (level " + GetI(Traits, "Level") + ", " +
                         Math.round((game.elapsed || 0) / 360) / 10 + " hours in) the replay comes out different" };
      checked = game.tasks;
    }
    if (game.dead) break;
    if (++steps % 200 == 0) {
      if (opts.onProgress) opts.onProgress(game.tasks, until);
      if (opts.budgetMs && Date.now() - started > opts.budgetMs)
        return { status: checked ? "partial" : "unable", checked: checked, total: until,
                 detail: checked ? "" : "not enough time to reach the first checkpoint" };
    }
  }
  if (game.dead && !save.dead && game.tasks < until)
    return { status: "mismatch", at: game.tasks, checked: checked, total: until, detail: "in the replay the hero dies at task " + game.tasks.toLocaleString() };
  // Where the replay ends should be where the save is
  if (game.tasks == save.tasks) {
    var diff = ReplayDifference(game, save);
    if (diff) return { status: "mismatch", at: game.tasks, checked: checked, total: until,
                       detail: "the saved hero doesn't match the replay (" + diff + ")" };
    checked = game.tasks;
  }
  return { status: "match", checked: checked, total: until };
}

// What differs between the replayed hero and the saved one (or "")
function ReplayDifference(a, b) {
  var parts = { level: function (g) { return g.Traits.Level; }, stats: function (g) { return g.Stats; },
                equipment: function (g) { return [g.Equips, g.EquipPower]; }, spells: function (g) { return g.Spells; },
                inventory: function (g) { return g.Inventory; }, experience: function (g) { return Math.round((g.ExpBar || {}).position || 0); },
                "time played": function (g) { return Math.floor(g.elapsed || 0); }, plot: function (g) { return [g.act, g.Quests]; },
                defeats: function (g) { return g.deaths || 0; } };
  for (var k in parts) {
    var x = JSON.stringify(parts[k](a)), y = JSON.stringify(parts[k](b));
    if (x != y) return k;
  }
  return "";
}

// Finish the current task instantly and let the game go on (like sim.js)
var _replayClock = 0;
function ReplayStep() {
  var bar = TaskBar;
  _replayClock += Math.max(0, bar.Max() - bar.Position());
  bar.reposition(bar.Max());
  Timer1Timer();
}

// A fresh start between replays: no hero, nothing stored
function ReplayReset() {
  _replayClock = 0;
  if (typeof Codex != "undefined") { Codex.book = null; Codex.delta = CodexEmpty(); }
}

// ---- As a Web Worker ----------------------------------------------------------
//
// postMessage({ save, budgetMs }) -> messages { type: "progress", done,
// total } and finally { type: "result", result }.

if (typeof importScripts == "function" && typeof document == "undefined") {
  (function () {
    var items = {};
    self.document = null;
    self.window = self;
    self.localStorage = {
      getItem: function (k) { return k in items ? items[k] : null; },
      setItem: function (k, v) { items[k] = String(v); },
      removeItem: function (k) { delete items[k]; }
    };
    // (a worker's own location can't be assigned to; the game sets this one)
    Object.defineProperty(self, "location", { value: { href: "main.html" }, writable: true, configurable: true });
    self.alert = function () {};
    self.prompt = function () { return null; };
    // No DOM: $(...) is null, so the game's UI code is skipped, as in sim.js
    var $ = function () { return null; };
    $.each = function (obj, callback) {
      if (Array.isArray(obj) || typeof obj === "string") {
        for (var i = 0; i < obj.length; ++i) if (callback.call(obj[i], i, obj[i]) === false) break;
      } else {
        for (var k in obj) if (callback.call(obj[k], k, obj[k]) === false) break;
      }
      return obj;
    };
    $.ajax = function () { throw new Error("no network in a replay"); };
    self.$ = self.jQuery = $;
    var RealWorker = self.Worker;
    self.Worker = function () { this.addEventListener = function () {}; this.postMessage = function () {}; };
    var realTimeout = self.setTimeout;
    self.setTimeout = function (fn) { fn(); return 0; };
    self.clearTimeout = function () {};

    importScripts("config.js", "story.js", "events.js", "combat.js", "codex.js", "main.js");
    self.timeGetTime = function () { return _replayClock; };

    self.onmessage = function (e) {
      var result;
      try {
        result = ReplayHero(e.data.save, {
          budgetMs: e.data.budgetMs,
          onProgress: function (done, total) { postMessage({ type: "progress", done: done, total: total }); }
        });
      } catch (err) {
        result = { status: "unable", detail: "the replay failed (" + err.message + ")" };
      }
      postMessage({ type: "result", result: result });
    };
    void RealWorker; void realTimeout;
  })();
}
