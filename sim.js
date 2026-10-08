#!/usr/bin/env node
// Headless Progress Quest Remix simulator.
//
// Runs the real game scripts (config.js, main.js, newguy.js) in a sandbox
// with no browser and no DOM, as fast as the CPU allows. Every task
// finishes the instant it starts, so days of game time take seconds.
// With the same --seed, a run is fully deterministic.
//
// Usage:
//   node sim.js [options]
//
// Options:
//   --levels N      stop when the character reaches level N   (default 50)
//   --seed S        random seed for the character             (default "pq")
//   --name NAME     character name                            (default random)
//   --race RACE     race, e.g. "4chan Troll"                  (default random)
//   --class CLASS   class, e.g. "Barbarian Pretzel"           (default random)
//   --daily DATE    play that day's Daily Challenge hero, e.g. 2026-10-07
//                   (stops when the challenge is done or lost)
//   --replay FILE   replay a saved hero (a .pqw backup) from its birth and
//                   check it plays out the same (see replay.js)
//   --quiet         print only the final summary
//   --json FILE     write the final character sheet as JSON to FILE
//   --dir DIR       load the game scripts from DIR            (default: here)
//
// Example:
//   node sim.js --levels 30 --seed alpha --race "Demi-Canadian"

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function parseArgs(argv) {
  const opts = { levels: 50, seed: "pq", quiet: false, dir: __dirname };
  for (let i = 0; i < argv.length; ++i) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) usage(`Missing value for ${a}`);
      return argv[++i];
    };
    switch (a) {
      case "--levels": opts.levels = parseInt(next(), 10); break;
      case "--seed":   opts.seed = next(); break;
      case "--name":   opts.name = next(); break;
      case "--race":   opts.race = next(); break;
      case "--class":  opts.klass = next(); break;
      case "--daily":  opts.daily = next(); break;
      case "--replay": opts.replay = next(); break;
      case "--quiet":  opts.quiet = true; break;
      case "--json":   opts.json = next(); break;
      case "--dir":    opts.dir = path.resolve(next()); break;
      case "-h": case "--help": usage(); break;
      default: usage(`Unknown option ${a}`);
    }
  }
  if (!(opts.levels >= 1)) usage("--levels must be a positive number");
  return opts;
}

function usage(err) {
  const text = fs.readFileSync(__filename, "utf8")
    .split("\n").slice(1).filter(l => l.startsWith("//"))
    .map(l => l.replace(/^\/\/ ?/, "")).join("\n");
  if (err) console.error(err + "\n");
  console.log(text);
  process.exit(err ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Sandbox: just enough browser for the game scripts to run with no DOM.

function makeSandbox() {
  const items = {};
  const localStorage = {
    getItem: k => (k in items ? items[k] : null),
    setItem: (k, v) => { items[k] = String(v); },
    removeItem: k => { delete items[k]; },
  };

  // The game's tick comes from a Web Worker (clock.js). Here the simulator
  // drives Timer1Timer directly, so the worker only needs to exist.
  class Worker {
    addEventListener() {}
    postMessage() {}
  }

  // No DOM: $(...) returns null, so the game's UI code paths are skipped
  // exactly as they were designed to be. Only the utilities are real.
  const $ = function () { return null; };
  $.each = function (obj, callback) {
    if (Array.isArray(obj) || typeof obj === "string") {
      for (let i = 0; i < obj.length; ++i)
        if (callback.call(obj[i], i, obj[i]) === false) break;
    } else {
      for (const k in obj)
        if (callback.call(obj[k], k, obj[k]) === false) break;
    }
    return obj;
  };
  $.ajax = function () {
    throw new Error("Network calls are not available in the simulator");
  };

  const sandbox = {
    console,
    document: null,
    navigator: { userAgent: "node" },
    location: { href: "sim.html" },
    localStorage,
    Worker,
    $,
    jQuery: $,
    alert: m => console.log("ALERT: " + m),
    prompt: () => null,
    setTimeout: (fn) => { fn(); return 0; },
    clearTimeout: () => {},
    escape, unescape,
  };
  // A context with an ordinary global object where Node supports it
  // (v22.8+). A contextified sandbox object routes every global lookup
  // (Math, K, game...) through an interceptor, which makes the game run
  // many times slower here than in a browser.
  if (vm.constants && vm.constants.DONT_CONTEXTIFY) {
    const ctx = vm.createContext(vm.constants.DONT_CONTEXTIFY);
    Object.assign(ctx, sandbox);
    ctx.window = ctx;
    return ctx;
  }
  sandbox.window = sandbox;
  return vm.createContext(sandbox);
}

function load(ctx, dir, file) {
  const filename = path.join(dir, file);
  vm.runInContext(fs.readFileSync(filename, "utf8"), ctx, { filename });
}

// ---------------------------------------------------------------------------

function run(opts) {
  const ctx = makeSandbox();
  const g = (code) => vm.runInContext(code, ctx);

  load(ctx, opts.dir, "config.js");
  if (fs.existsSync(path.join(opts.dir, "combat.js"))) load(ctx, opts.dir, "combat.js");
  if (fs.existsSync(path.join(opts.dir, "story.js"))) load(ctx, opts.dir, "story.js");
  if (fs.existsSync(path.join(opts.dir, "events.js"))) load(ctx, opts.dir, "events.js");
  if (fs.existsSync(path.join(opts.dir, "codex.js"))) load(ctx, opts.dir, "codex.js");
  load(ctx, opts.dir, "main.js");
  load(ctx, opts.dir, "newguy.js");

  // Virtual clock
  let now = 0;
  ctx.timeGetTime = () => now;

  // Character creation, in the same order as NewGuyFormLoad() so a given
  // seed rolls the same character it would in the browser.
  ctx.__seed = opts.seed;
  if (opts.daily) {
    // The day's Daily Challenge hero instead of a new level 1 hero
    load(ctx, opts.dir, "daily.js");
    ctx.__date = opts.daily;
    g("seed = new Alea(__seed); var __d = MakeDaily(__date);" +
      "storage.addToRoster(__d, function () {}); window.location.href = 'main.html#' + EncodeName(__d.Traits.Name);");
  } else
  g("seed = new Alea(__seed); RollEm(); GenClick();" +
    "fill(null, K.Races, 'Race'); fill(null, K.Klasses, 'Class');");

  const pickFrom = (list, want, label) => {
    const names = g(list).map(s => s.split("|")[0]);
    const hit = names.find(n => n.toLowerCase() === want.toLowerCase());
    if (!hit) usage(`Unknown ${label} "${want}". Choices:\n  ` + names.join("\n  "));
    return hit;
  };
  if (opts.name)  ctx.traits.Name = opts.name;
  if (opts.race)  ctx.traits.Race = pickFrom("K.Races", opts.race, "race");
  if (opts.klass) ctx.traits.Class = pickFrom("K.Klasses", opts.klass, "class");

  if (!opts.daily) g("sold()");   // adds the character to the roster, sets location
  g("FormCreate()");    // loads the game from the roster and starts it

  const game = () => ctx.game;
  const level = () => parseInt(game().Traits.Level, 10);
  const stats = () => ctx.K.Stats.map(s => `${s.replace(" Max", "")} ${game().Stats[s]}`).join("  ");
  const gold = () => (game().Inventory.find(r => r[0] === "Gold") || [0, 0])[1];

  const t = game().Traits;
  console.log(`${t.Name} the ${t.Race} ${t.Class}  (seed "${opts.seed}")`);
  if (typeof ctx.AttributeProfile === "function") {
    const p = ctx.AttributeProfile(t.Race, t.Class);
    console.log(`${ctx.ProfileSummary(p)}  primary: ${p.primary.join(", ")}` +
                (p.secondary.length ? `  secondary: ${p.secondary.join(", ")}` : ""));
  }
  if (!opts.quiet) console.log(`Lv  1  ${stats()}`);

  const started = Date.now();
  let lastLevel = level();
  const MAX_TASKS = 50 * 1000 * 1000;
  let n = 0;
  let lastFight = null;
  const fights = { total: 0 };
  while (level() < opts.levels && !(opts.daily && game().daily.status)) {
    if (++n > MAX_TASKS) throw new Error("Simulation did not finish; is the game stuck?");
    // Finish the current task instantly, then let the game react.
    const bar = ctx.TaskBar;
    now += Math.max(0, bar.Max() - bar.Position());
    bar.reposition(bar.Max());
    ctx.Timer1Timer();
    const f = game().combat;
    if (f && f !== lastFight) {
      lastFight = f;
      fights[f.outcome] = (fights[f.outcome] || 0) + 1;
      fights.total++;
    }
    if (opts.onTask) opts.onTask(ctx);

    if (level() !== lastLevel) {
      lastLevel = level();
      if (opts.onLevel) opts.onLevel(game(), ctx);
      if (!opts.quiet)
        console.log(`Lv ${String(lastLevel).padStart(2)}  ${stats()}  ` +
                    `gold ${gold()}  ${ctx.RoughTime(game().elapsed)} played  ` +
                    `${game().tasks} tasks`);
    }
  }
  ctx.SaveGame();

  const s = game();
  console.log("");
  console.log(`Reached level ${level()} in ${ctx.RoughTime(s.elapsed)} of game time ` +
              `(${s.tasks} tasks, ${(Date.now() - started) / 1000}s real time)`);
  console.log(`Stats:   ${stats()}`);
  console.log(`Gold:    ${gold()}`);
  console.log(`Plot:    ${s.bestplot}`);
  console.log(`Best:    ${s.bestequip} / ${s.bestspell} / ${s.beststat}`);
  console.log(`Spells:  ${s.Spells.length} known`);
  if (fights.total) {
    const pct = k => Math.round(100 * (fights[k] || 0) / fights.total) + "%";
    console.log(`Fights:  ${fights.total}: won ${pct("win")} cleanly, ${pct("close")} narrowly; ` +
                `fled ${pct("flee")}, defeated ${pct("defeat")}`);
  }

  if (opts.json) {
    fs.writeFileSync(opts.json, JSON.stringify(s, null, 2));
    console.log(`Wrote ${opts.json}`);
  }
  return s;
}

// Replay a saved hero (a .pqw backup or its JSON) and check it
function replay(file, dir) {
  const ctx = makeSandbox();
  for (const f of ["config.js", "story.js", "events.js", "combat.js", "codex.js", "main.js", "replay.js"])
    load(ctx, dir, f);
  let text = fs.readFileSync(file, "utf8").trim(), save;
  try { save = JSON.parse(text); }
  catch (e) { save = JSON.parse(Buffer.from(text.replace(/\s/g, ""), "base64").toString("utf8")); }
  const fp = ctx.SealHash(ctx.K.Replay.Files.map(f =>
    fs.readFileSync(path.join(dir, f), "utf8").replace(/\r\n/g, "\n")).join("\u0000"));
  const r = save.replay || {};
  console.log(`${save.Traits.Name}: level ${save.Traits.Level}, ${save.tasks} tasks, ` +
              `${(r.list || []).length} checkpoints, ${(save.choiceLog || []).length} inputs`);
  if (r.fp && r.fp !== fp)
    console.log("Warning: this hero was played with different game code; the replay won't match.");
  let last = 0;
  const result = ctx.ReplayHero(save, { onProgress: (done, total) => {
    if (done - last >= 5000) { last = done; process.stdout.write(`  ${done} / ${total} tasks\r`); }
  } });
  console.log(" ".repeat(40));
  console.log(JSON.stringify(result));
  return result;
}

if (require.main === module) {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.replay) process.exit(replay(opts.replay, opts.dir).status == "mismatch" ? 1 : 0);
  run(opts);
}

module.exports = { run, replay };
