#!/usr/bin/env node
// The game's automatic tests. GitHub runs them on every upload
// (.github/workflows/tests.yml); to run them yourself:
//
//   node test/run-tests.js            everything (about a minute)
//   node test/run-tests.js --quick    skip the two long level-50 games
//
// They use the same simulator as sim.js, so they test the real game code:
//
//   files      every script and stylesheet the pages load is there (an upload
//              that forgot a file), and every script compiles
//   content    check-events.js (events.js and story.js)
//   game       seeded heroes play from level 1, without the game getting
//              stuck or crashing; the same seed plays the same game twice;
//              a Daily Challenge hero plays; old saves still load
//   gold sinks every one of them plays out; a hero rolling in gold splurges,
//              and that game replays exactly too
//   replays    a hero's game replays exactly, and an edited one doesn't
//   balance    heroes reach level 50 in a sensible time, winning most fights
//              (the limits are in Balance below: change them when you change
//              the balance on purpose)
//   journal    it stays small
//
// Exits with 1 if anything failed, which turns the GitHub check red.

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const os = require("os");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const QUICK = process.argv.includes("--quick");
const sim = require(path.join(ROOT, "sim.js"));

// What "balanced" means, measured on simulated heroes. If a change to the
// game moves these on purpose, move the limits to match.
const Balance = {
  seeds: ["pq", "alpha"],      // heroes played to level 50
  daysToFifty: [3, 14],        // game time to reach level 50, in days
  minWinRate: 0.75,            // fights won (cleanly or narrowly)
  maxDefeatRate: 0.15,         // fights lost
  maxJournalBytes: 120000      // a level 50 hero's journal
};

// ---- A tiny test harness ------------------------------------------------------

const results = [];
let current = null;

function test(name, fn) {
  current = { name, ok: true, notes: [], ms: 0 };
  const t = Date.now();
  try {
    fn();
  } catch (err) {
    current.ok = false;
    current.notes.push(err && err.stack ? err.stack.split("\n").slice(0, 4).join("\n") : String(err));
  }
  current.ms = Date.now() - t;
  results.push(current);
  const mark = current.ok ? "✔" : "✘";
  console.log(`${mark} ${name} (${(current.ms / 1000).toFixed(1)}s)`);
  current.notes.forEach((n) => console.log("    " + n.replace(/\n/g, "\n    ")));
}

function check(ok, message) {
  if (!ok) throw new Error(message);
}

function note(message) {
  current.notes.push(message);
}

// Play a hero without printing every level
function play(opts) {
  const log = console.log;
  console.log = () => {};
  try {
    return sim.run(Object.assign({ quiet: true, dir: ROOT, seed: "pq" }, opts));
  } finally {
    console.log = log;
  }
}

function replayFile(file) {
  const log = console.log, write = process.stdout.write;
  console.log = () => {};
  process.stdout.write = () => true;
  try {
    return sim.replay(file, ROOT);
  } finally {
    console.log = log;
    process.stdout.write = write;
  }
}

function tmpFile(name, data) {
  const file = path.join(os.tmpdir(), "pq-test-" + process.pid + "-" + name);
  fs.writeFileSync(file, JSON.stringify(data));
  return file;
}

// The parts of a save that are the game itself (not when it was saved, or
// random IDs)
function gameOf(s) {
  // (and not the journal: its asides have their own dice, seeded by the
  // hero's random life ID, and never touch the game's)
  const skip = new Set(["date", "stamp", "seal", "birthday", "birthstamp", "lifeId", "replay", "daily"]);
  const out = {};
  Object.keys(s).sort().forEach((k) => { if (!skip.has(k) && !/^journal/.test(k)) out[k] = s[k]; });
  return JSON.stringify(out);
}

function fightRates(hero) {
  // sim.run doesn't hand back its fight tally, so count from the save
  const wins = hero.wins || 0, defeats = hero.deaths || 0;
  return { wins, defeats, total: wins + defeats };
}

// ---- files -----------------------------------------------------------------------

test("every file the pages load is there", () => {
  const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));
  const missing = [];
  pages.forEach((page) => {
    const html = fs.readFileSync(path.join(ROOT, page), "utf8");
    const refs = [...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"'#?]+)["']/gi)].map((m) => m[1]);
    refs.filter((r) => !/^(https?:)?\/\//.test(r) && /\.(js|css)$/.test(r)).forEach((r) => {
      if (!fs.existsSync(path.join(ROOT, r))) missing.push(`${page} loads ${r}`);
    });
  });
  // the code a replay fingerprints, and the scripts the replay worker loads
  const config = fs.readFileSync(path.join(ROOT, "config.js"), "utf8");
  const files = (config.match(/Files:\s*\[([^\]]*)\]/) || [, ""])[1].match(/"[^"]+"/g) || [];
  files.map((f) => f.slice(1, -1)).forEach((f) => { if (!fs.existsSync(path.join(ROOT, f))) missing.push(`K.Replay.Files lists ${f}`); });
  const replay = fs.readFileSync(path.join(ROOT, "replay.js"), "utf8");
  ((replay.match(/importScripts\(([^)]*)\)/) || [, ""])[1].match(/"[^"]+"/g) || []).map((f) => f.slice(1, -1))
    .forEach((f) => { if (!fs.existsSync(path.join(ROOT, f))) missing.push(`replay.js imports ${f}`); });
  check(!missing.length, "Missing:\n" + missing.join("\n"));
  note(`${pages.length} pages checked`);
});

test("every script compiles", () => {
  const bad = [];
  const scripts = fs.readdirSync(ROOT).filter((f) => f.endsWith(".js") && !/\.min\.js$/.test(f))
    .concat(fs.existsSync(path.join(ROOT, "test")) ? fs.readdirSync(path.join(ROOT, "test")).filter((f) => f.endsWith(".js")).map((f) => "test/" + f) : []);
  scripts.forEach((f) => {
    try { new vm.Script(fs.readFileSync(path.join(ROOT, f), "utf8"), { filename: f }); }
    catch (err) { bad.push(`${f}: ${err.message}`); }
  });
  check(!bad.length, bad.join("\n"));
  note(`${scripts.length} scripts`);
});

// ---- content -------------------------------------------------------------------

test("events and stories check out (check-events.js)", () => {
  let out;
  try {
    out = execFileSync(process.execPath, [path.join(ROOT, "check-events.js")], { cwd: ROOT, encoding: "utf8" });
  } catch (err) {
    throw new Error((err.stdout || "") + (err.stderr || ""));
  }
  note(out.trim().split("\n").pop());
});

// ---- game ----------------------------------------------------------------------

test("a new hero plays to level 15", () => {
  const h = play({ levels: 15, seed: "test-new" });
  check(+h.Traits.Level >= 15, "only reached level " + h.Traits.Level);
  check(!h.cheater, "branded a cheater: " + (h.cheater && h.cheater.reason));
  note(`${h.Traits.Name} the ${h.Traits.Race} ${h.Traits.Class}: ${h.tasks} tasks, ${Math.round(h.elapsed / 3600)} hours`);
});

test("the same seed plays the same game", () => {
  const a = play({ levels: 12, seed: "test-same" });
  const b = play({ levels: 12, seed: "test-same" });
  check(gameOf(a) === gameOf(b), "two games from the same seed came out different");
  check(JSON.stringify(a.replay.list) === JSON.stringify(b.replay.list), "their replay checkpoints differ");
});

test("a Daily Challenge hero plays", () => {
  const h = play({ daily: "2026-10-07", levels: 99 });   // (stops when the daily is settled)
  check(h.daily && h.daily.status, "the daily never finished");
  note(`${h.daily.label}: ${h.daily.status}`);
});

test("every race and class can start a game", () => {
  // the names straight from config.js, played a few levels each
  const ctx = vm.createContext(vm.constants.DONT_CONTEXTIFY);
  Object.assign(ctx, { navigator: { userAgent: "" }, document: null, console,
    $: Object.assign(() => null, { each: (o, f) => { for (const k in o) f.call(o[k], k, o[k]); } }) });
  ctx.window = ctx;
  ctx.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  vm.runInContext(fs.readFileSync(path.join(ROOT, "config.js"), "utf8"), ctx);
  const races = ctx.K.Races.map((r) => r.split("|")[0]), klasses = ctx.K.Klasses.map((c) => c.split("|")[0]);
  const n = Math.max(races.length, klasses.length);
  for (let i = 0; i < n; ++i) {
    const race = races[i % races.length], klass = klasses[(i * 7) % klasses.length];
    const h = play({ levels: 4, seed: "test-pair-" + i, race, klass });
    check(+h.Traits.Level >= 4, `${race} ${klass} only reached level ${h.Traits.Level}`);
  }
  note(`${races.length} races and ${klasses.length} classes`);
});

test("old saves still load (save migrations)", () => {
  const ctx = vm.createContext(vm.constants.DONT_CONTEXTIFY);
  Object.assign(ctx, { navigator: { userAgent: "" }, document: null, console,
    $: Object.assign(() => null, { each: (o, f) => { for (const k in o) f.call(o[k], k, o[k]); } }) });
  ctx.window = ctx;
  ctx.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  for (const f of ["config.js", "combat.js", "story.js", "main.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx);
  // a hero as the oldest saves had them (save version 0)
  const old = { Traits: { Name: "Oldie", Race: "Demi-Canadian", Class: "Sailor Rune", Level: "7" },
    Stats: { STR: 12, CON: 11, DEX: 10, INT: 14, WIS: 9, CHA: 8, "HP Max": 40, "MP Max": 30 },
    Equips: { Weapon: "+1 Pet Rock" }, Spells: [["Innoculate", "II"], ["Inoculate", "I"]], Inventory: [["Gold", 5]] };
  ctx.__old = old;
  const m = vm.runInContext("MigrateSave(__old)", ctx);
  check(m.saveVersion === ctx.SaveVersion, `migrated to version ${m.saveVersion}, not ${ctx.SaveVersion}`);
  check(m.Spells.length == 1 && m.Spells[0][0] == "Inoculate" && m.Spells[0][1] == "III", "the spell-name fix (0 -> 1) didn't merge the spells");
  check(m.HPBar && m.HPBar.max == 40, "no HP bar (1 -> 2)");
  check(m.lifeId, "no life ID (13 -> 14)");
  note(`version 0 -> ${m.saveVersion}`);
});

// ---- gold sinks -----------------------------------------------------------------

test("every gold sink plays out (K.Sinks)", () => {
  // A hero handed a fortune, made to splurge on each sink in turn
  let keys = null, next = 0, expired = null, henchman = false;
  const results = {};
  const h = play({ levels: 30, seed: "test-every-sink", onTask(ctx) {
    const g = ctx.game;
    keys = keys || ctx.K.Sinks.map((s) => s.key);
    const r = g.recentEvent;
    if (r && /^sink-/.test(r.key) && r.result && r.result.length) results[r.key.slice(5)] = r.result;
    if (g.combat && (g.combat.log || []).some((l) => /^Henchman /.test(l))) henchman = true;
    if (+g.Traits.Level < 6 || g.event || g.queue.length) return;
    if (next < keys.length) {
      ctx.Add(ctx.Inventory, "Gold", 1000000);
      ctx.StartSplurge("", keys[next++]);
    } else if (!expired && Object.keys(results).length == keys.length && (henchman || g.tasks > 5000)) {
      // and once the henchman has had a fight or two, what doesn't last wears off
      expired = g.tasks;
      g.boons.forEach((b) => { if (b.until) b.until = g.elapsed + 1; });
    } else if (expired && g.tasks > expired + 5 && g.tasks < expired + 7) {
      const timed = g.boons.filter((b) => b.until);
      if (timed.length) throw new Error("these didn't wear off: " + timed.map((b) => b.n).join(", "));
    }
  } });
  const missing = (keys || []).filter((k) => !results[k] || !/^Spent \d+ gold/.test(results[k][0]));
  check(!missing.length, "these sinks didn't play out: " + missing.join(", "));
  check(henchman, "no henchman swung in a fight");
  check(expired, "the timed boons were never checked");
  const owned = (h.boons || []).map((b) => b.k).sort().join(",");
  check(owned == "backpack,egg,statue,tavern", "owned for good afterwards: " + owned);
  note(`${keys.length} sinks; e.g. ${results.henchman.join(" · ")}`);
});

test("a hero rolling in gold splurges, and the game replays exactly", () => {
  // The shops won't serve a Hand-me-downs hero, so the gold piles up (unless
  // the temple takes it: a hero who loses a lot pays a lot of tithes, so
  // there are a few heroes to try)
  let h;
  for (const seed of ["hoard-1", "hoard-5", "test-sinks"]) {
    h = play({ levels: 22, seed, mut: "noshop" });
    check((h.mutators || []).indexOf("noshop") >= 0, "the hero has no Hand-me-downs mutator");
    if (h.splurges > 0) break;
  }
  check(h.splurges > 0, "never splurged, with " + h.Inventory[0][1] + " gold in the bank");
  const r = replayFile(tmpFile("hoard.json", h));
  check(r.status === "match", "the replay came out " + r.status + ": " + (r.detail || ""));
  note(`${h.Traits.Name}: ${h.splurges} splurges, ${h.goldSpent} gold`);
});

// ---- gold sinks -----------------------------------------------------------------

test("every gold sink plays out (K.Sinks)", () => {
  // A hero handed a fortune, made to splurge on each sink in turn
  let keys = null, next = 0, expired = null, henchman = false;
  const results = {};
  const h = play({ levels: 30, seed: "test-every-sink", onTask(ctx) {
    const g = ctx.game;
    keys = keys || ctx.K.Sinks.map((s) => s.key);
    const r = g.recentEvent;
    if (r && /^sink-/.test(r.key) && r.result && r.result.length) results[r.key.slice(5)] = r.result;
    if (g.combat && (g.combat.log || []).some((l) => /^Henchman /.test(l))) henchman = true;
    if (+g.Traits.Level < 6 || g.event || g.queue.length) return;
    if (next < keys.length) {
      ctx.Add(ctx.Inventory, "Gold", 1000000);
      ctx.StartSplurge("", keys[next++]);
    } else if (!expired && Object.keys(results).length == keys.length && (henchman || g.tasks > 5000)) {
      // and once the henchman has had a fight or two, what doesn't last wears off
      expired = g.tasks;
      g.boons.forEach((b) => { if (b.until) b.until = g.elapsed + 1; });
    } else if (expired && g.tasks > expired + 5 && g.tasks < expired + 7) {
      const timed = g.boons.filter((b) => b.until);
      if (timed.length) throw new Error("these didn't wear off: " + timed.map((b) => b.n).join(", "));
    }
  } });
  const missing = (keys || []).filter((k) => !results[k] || !/^Spent \d+ gold/.test(results[k][0]));
  check(!missing.length, "these sinks didn't play out: " + missing.join(", "));
  check(henchman, "no henchman swung in a fight");
  check(expired, "the timed boons were never checked");
  const owned = (h.boons || []).map((b) => b.k).sort().join(",");
  check(owned == "backpack,egg,statue,tavern", "owned for good afterwards: " + owned);
  note(`${keys.length} sinks; e.g. ${results.henchman.join(" · ")}`);
});

test("a hero rolling in gold splurges, and the game replays exactly", () => {
  // The shops won't serve a Hand-me-downs hero, so the gold piles up (unless
  // the temple takes it: a hero who loses a lot pays a lot of tithes, so
  // there are a few heroes to try)
  let h;
  for (const seed of ["hoard-1", "hoard-5", "test-sinks"]) {
    h = play({ levels: 22, seed, mut: "noshop" });
    check((h.mutators || []).indexOf("noshop") >= 0, "the hero has no Hand-me-downs mutator");
    if (h.splurges > 0) break;
  }
  check(h.splurges > 0, "never splurged, with " + h.Inventory[0][1] + " gold in the bank");
  const r = replayFile(tmpFile("hoard.json", h));
  check(r.status === "match", "the replay came out " + r.status + ": " + (r.detail || ""));
  note(`${h.Traits.Name}: ${h.splurges} splurges, ${h.goldSpent} gold`);
});

// ---- replays -------------------------------------------------------------------

test("a hero's game replays exactly, and an edited one doesn't", () => {
  const h = play({ levels: 20, seed: "test-replay" });
  const r = replayFile(tmpFile("replay.json", h));
  check(r.status === "match", "the replay came out " + r.status + ": " + (r.detail || ""));
  const edited = JSON.parse(JSON.stringify(h));
  edited.Stats.STR = String(+edited.Stats.STR + 25);
  const r2 = replayFile(tmpFile("edited.json", edited));
  check(r2.status === "mismatch", "an edited hero replayed as " + r2.status);
  note(`${r.checked} tasks replayed; the edited one: ${r2.detail}`);
});

// ---- balance -------------------------------------------------------------------

if (!QUICK) {
  Balance.seeds.forEach((seed) => {
    test(`balance: hero "${seed}" reaches level 50`, () => {
      const h = play({ levels: 50, seed });
      const days = h.elapsed / 86400;
      const f = fightRates(h);
      const winRate = f.wins / Math.max(1, f.total), defeatRate = f.defeats / Math.max(1, f.total);
      note(`${h.Traits.Race} ${h.Traits.Class}: ${days.toFixed(1)} days, ${h.tasks} tasks, ` +
           `${f.total} fights (${Math.round(winRate * 100)}% won, ${Math.round(defeatRate * 100)}% lost), ` +
           `${h.splurges || 0} splurges`);
      check(+h.Traits.Level >= 50, "stopped at level " + h.Traits.Level);
      check(days >= Balance.daysToFifty[0] && days <= Balance.daysToFifty[1],
            `took ${days.toFixed(1)} days (expected ${Balance.daysToFifty.join("-")})`);
      check(winRate >= Balance.minWinRate, `won only ${Math.round(winRate * 100)}% of fights`);
      check(defeatRate <= Balance.maxDefeatRate, `lost ${Math.round(defeatRate * 100)}% of fights`);
      check(!h.cheater, "branded a cheater: " + (h.cheater && h.cheater.reason));
      if (h.journal) {
        const bytes = JSON.stringify(h.journal).length;
        note(`journal: ${h.journal.length} entries, ${Math.round(bytes / 1024)} KB`);
        check(bytes <= Balance.maxJournalBytes, `the journal grew to ${bytes} bytes`);
      }
    });
  });
}

// ---- the result ------------------------------------------------------------------

const failed = results.filter((r) => !r.ok);
const total = results.reduce((t, r) => t + r.ms, 0);
console.log(`\n${results.length - failed.length} of ${results.length} passed in ${(total / 1000).toFixed(0)}s` +
            (failed.length ? `; failed: ${failed.map((r) => r.name).join(", ")}` : ""));

// On GitHub, a table on the run's summary page
if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = results.map((r) => `| ${r.ok ? "✅" : "❌"} | ${r.name} | ${(r.ms / 1000).toFixed(1)}s | ` +
    r.notes.join("<br>").replace(/\|/g, "\\|").replace(/\n/g, "<br>") + " |");
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    "### Game tests\n\n| | Test | Time | Notes |\n|---|---|---|---|\n" + rows.join("\n") + "\n\n");
}

process.exit(failed.length ? 1 : 0);
