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
  load(ctx, opts.dir, "main.js");
  load(ctx, opts.dir, "newguy.js");

  // Virtual clock
  let now = 0;
  ctx.timeGetTime = () => now;

  // Character creation, in the same order as NewGuyFormLoad() so a given
  // seed rolls the same character it would in the browser.
  ctx.__seed = opts.seed;
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

  g("sold()");          // adds the character to the roster, sets location
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
  while (level() < opts.levels) {
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

if (require.main === module) {
  run(parseArgs(process.argv.slice(2)));
}

module.exports = { run };
