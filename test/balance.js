#!/usr/bin/env node
// How each perk, and the gold sinks, change a hero's game: for checking
// balance by hand (it's too slow for GitHub's tests).
//
//   node test/balance.js                    every perk against none, to level 40
//   node test/balance.js --levels 50 --seeds 6 --perks miser,bigspender
//   node test/balance.js --sinks            gold sinks on against off
//
// Each seed rolls the same hero (race, class, stats) for every perk, so the
// comparison is hero against same hero. A perk changes how the dice fall from
// then on, and that alone moves the time by 10% or more either way: the
// baseline is the average of three heroes (no perk, and two "placebos",
// 1.001 and 0.999 times the XP), and "±" is the margin of error (twice the
// standard error). Effects smaller than that are noise; use more --seeds.
//
// Options: --levels N (30), --seeds N (24), --jobs N (CPUs), --perks KEYS,
// --sinks, --mut KEYS (mutators for every hero, e.g. noshop), --cache FILE

"use strict";

const path = require("path");
const os = require("os");
const { fork } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const sim = require(path.join(ROOT, "sim.js"));

// ---- one game (in a child process) ------------------------------------------------

function playOne(job) {
  const log = console.log;
  console.log = () => {};
  let h, ms = 0;
  try {
    h = sim.run({ quiet: true, dir: ROOT, seed: job.seed, levels: job.levels, mut: job.mut,
                  perks: job.perks,
                  // the time a player waits: every task's full length (game.elapsed
                  // counts whole seconds per task, so it hides a 4.6s trip being 4s)
                  onTask(ctx) { ms += ctx.TaskBar.Max(); },
                  setup(ctx) {
      ctx.K.Perks.push({ key: "placebo+", label: "Placebo", xp: 1.001, pro: "", con: "" },
                       { key: "placebo-", label: "Placebo", xp: 0.999, pro: "", con: "" });
      if (job.noSinks) ctx.K.Sinks = null;
    } });
  } finally {
    console.log = log;
  }
  const st = (k) => parseInt(h.Stats[k], 10) || 0;
  return {
    days: ms / 864e5, tasks: h.tasks, wins: h.wins || 0, defeats: h.deaths || 0,
    earned: h.goldEarned || 0, spent: h.goldSpent || 0, splurges: h.splurges || 0,
    quests: h.questsDone || 0, spells: (h.Spells || []).length,
    stats: ["STR", "CON", "DEX", "INT", "WIS", "CHA"].reduce((t, k) => t + st(k), 0),
    hp: st("HP Max"), gear: Object.values(h.EquipPower || {}).reduce((t, p) => t + p, 0)
  };
}

if (process.argv[2] === "--worker") {
  process.on("message", (job) => {
    try { process.send({ id: job.id, result: playOne(job) }); }
    catch (err) { process.send({ id: job.id, error: String(err.stack || err) }); }
  });
} else {
  main();
}

function main() {

  // ---- the comparison ---------------------------------------------------------------

  function arg(name, dflt) {
    const i = process.argv.indexOf(name);
    return i >= 0 ? process.argv[i + 1] : dflt;
  }
  const levels = +arg("--levels", 30), nSeeds = +arg("--seeds", 24);
  const jobs = +arg("--jobs", os.cpus().length), mut = arg("--mut", undefined);
  const seeds = Array.from({ length: nSeeds }, (_, i) => "bal-" + (i + 1));
  const sinks = process.argv.includes("--sinks");

  // The configurations: the first BASES are the baseline
  const BASES = 3;
  let configs;
  if (sinks) {
    configs = [{ name: "sinks off", perks: [], noSinks: true }, { name: "", perks: ["placebo+"], noSinks: true },
               { name: "", perks: ["placebo-"], noSinks: true }, { name: "sinks on", perks: [] }];
  } else {
    const vm = require("vm"), fs = require("fs");
    const c = vm.createContext(vm.constants.DONT_CONTEXTIFY);
    Object.assign(c, { navigator: { userAgent: "" }, document: null, console, $: Object.assign(() => null, { each() {} }) });
    c.window = c;
    c.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
    for (const f of ["config.js", "combat.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), c);
    const all = c.K.Perks;
    const want = arg("--perks", "") ? arg("--perks").split(",") : all.map((p) => p.key);
    configs = [{ name: "none", perks: [] }, { name: "", perks: ["placebo+"] }, { name: "", perks: ["placebo-"] }]
      .concat(want.map((k) => ({ name: k, perks: [k], perk: all.find((p) => p.key == k) })));
  }

  // --cache FILE keeps each game's result (for this version of the game), so
  // a run that was cut short picks up where it left off
  const cacheFile = arg("--cache", null), fs = require("fs"), crypto = require("crypto");
  const codeHash = crypto.createHash("sha1");
  ["config.js", "story.js", "combat.js", "events.js", "main.js", "newguy.js", "sim.js"]
    .forEach((f) => codeHash.update(fs.readFileSync(path.join(ROOT, f))));
  const version = codeHash.digest("hex").slice(0, 12);
  const cache = {};
  if (cacheFile && fs.existsSync(cacheFile))
    fs.readFileSync(cacheFile, "utf8").split("\n").filter(Boolean).forEach((line) => {
      const e = JSON.parse(line);
      cache[e.key] = e.result;
    });
  const jobKey = (j) => JSON.stringify([version, j.seed, j.levels, j.mut || "", j.perks, !!j.noSinks]);

  const queue = [];
  const results = configs.map(() => ({}));
  configs.forEach((cfg, ci) => seeds.forEach((seed) => {
    const job = { id: queue.length, ci, seed, levels, mut, perks: cfg.perks, noSinks: cfg.noSinks };
    const hit = cache[jobKey(job)];
    if (hit) results[ci][seed] = hit;
    else queue.push(job);
  }));
  let done = configs.length * seeds.length - queue.length;
  const started = Date.now();

  function run() {
    return new Promise((resolve, reject) => {
      let live = 0;
      const next = (child) => {
        const job = queue.shift();
        if (!job) { child.kill(); if (--live == 0) resolve(); return; }
        child.job = job;
        child.send(job);
      };
      if (!queue.length) resolve();
      for (let i = 0; i < Math.min(jobs, queue.length); ++i) {
        const child = fork(__filename, ["--worker"]);
        live++;
        child.on("message", (m) => {
          if (m.error) { reject(new Error(m.error)); return; }
          results[child.job.ci][child.job.seed] = m.result;
          if (cacheFile) fs.appendFileSync(cacheFile, JSON.stringify({ key: jobKey(child.job), result: m.result }) + "\n");
          process.stderr.write(`\r${++done} of ${configs.length * seeds.length} games ` +
                               `(${Math.round((Date.now() - started) / 1000)}s)`);
          next(child);
        });
        next(child);
      }
    });
  }

  const pct = (x) => (x >= 0 ? "+" : "") + (x * 100).toFixed(0) + "%";
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const metrics = {
    time: (x) => x.days, defeats: (x) => (x.defeats + 0.5) / Math.max(1, x.wins + x.defeats),
    gold: (x) => x.earned + 1, quests: (x) => x.quests + 1, stats: (x) => x.stats, HP: (x) => x.hp
  };

  run().then(() => {
    process.stderr.write("\n");
    // Each metric: the average, over the heroes, of log(this / the baseline),
    // the baseline being the (geometric) mean of the BASES baseline games
    const base = (s, f) => Math.exp(mean(results.slice(0, BASES).map((r) => Math.log(f(r[s])))));
    const compare = (r, f) => {
      const logs = seeds.map((s) => Math.log(f(r[s]) / base(s, f)));
      const m = mean(logs), sd = Math.sqrt(mean(logs.map((l) => (l - m) ** 2)));
      return { ratio: Math.exp(m) - 1, margin: 2 * sd / Math.sqrt(seeds.length) };
    };
    console.log(`\nAgainst the same heroes with ${configs[0].name}, to level ${levels}, ${seeds.length} heroes` +
                (mut ? ` (mutators: ${mut})` : "") + ". Time: lower is better.\n");
    const head = ["", "time", "±", "defeats", "±", "gold", "quests", "stats", "HP", "splurges"];
    const width = (i) => (i == 2 || i == 4 ? 5 : 9);
    console.log(head.map((h, i) => i ? h.padStart(width(i)) : h.padEnd(16)).join(""));
    configs.forEach((cfg, ci) => {
      if (ci && ci < BASES) return;
      const r = results[ci], t = compare(r, metrics.time), d = compare(r, metrics.defeats);
      const row = [cfg.name, pct(t.ratio), (t.margin * 100).toFixed(0) + "%", pct(d.ratio), (d.margin * 100).toFixed(0) + "%"]
        .concat(["gold", "quests", "stats", "HP"].map((k) => pct(compare(r, metrics[k]).ratio)))
        .concat([mean(seeds.map((s) => r[s].splurges)).toFixed(1)]);
      console.log(row.map((c, i) => i ? String(c).padStart(width(i)) : String(c).padEnd(16)).join("") +
                  (cfg.perk ? "   " + cfg.perk.pro + " / " + cfg.perk.con : ""));
    });
    console.log(`\n(${Math.round((Date.now() - started) / 1000)}s. "defeats" is the share of fights lost.)`);
  }).catch((err) => { console.error(err); process.exit(1); });
}
