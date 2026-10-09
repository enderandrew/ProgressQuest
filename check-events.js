// Check events.js and story.js (and the rest of the game scripts) before
// uploading.
//
//   node check-events.js
//
// One typo in events.js (a missing comma or brace) stops the whole file
// from loading, and then no random events happen at all. This catches
// that, and the mistakes the browser won't complain about: a duplicate
// key, a misspelled 'where' or effect, an unknown {placeholder}, a choice
// event with the wrong number of choices, and so on.
//
// Exits with 1 if anything is wrong, so it can run before a commit.

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const dir = __dirname;
let errors = 0, warnings = 0;
const error = (msg) => { errors++; console.log("ERROR   " + msg); };
const warn = (msg) => { warnings++; console.log("warning " + msg); };

// 1. Does every script parse?
const scripts = ["config.js", "story.js", "combat.js", "events.js", "daily.js", "codex.js", "transfer.js", "replay.js", "menubar.js", "sheet.js",
                 "main.js", "newguy.js", "menu.js", "guard.js", "desktop.js"];
for (const file of scripts) {
  const full = path.join(dir, file);
  if (!fs.existsSync(full)) continue;
  try {
    new vm.Script(fs.readFileSync(full, "utf8"), { filename: file });
  } catch (e) {
    const where = (e.stack || "").split("\n")[0];
    error(`${where}\n        ${e.message}`);
  }
}
if (errors) {
  console.log(`\n${errors} file(s) don't parse. Fix those first (the line above is where the parser gave up;`);
  console.log("the mistake is usually there or a line or two before: a missing comma, brace or bracket).");
  process.exit(1);
}

// 2. Load config.js, story.js and events.js and look at K.Events
const sandbox = { console, window: {}, document: null, navigator: { userAgent: "node" } };
sandbox.window = sandbox;
sandbox.$ = sandbox.jQuery = Object.assign(function () { return {}; }, { extend: Object.assign, each: () => {} });
const ctx = vm.createContext(sandbox);
for (const file of ["config.js", "story.js", "combat.js", "events.js"]) {
  try {
    vm.runInContext(fs.readFileSync(path.join(dir, file), "utf8"), ctx, { filename: file });
  } catch (e) {
    error(`${file} failed to load: ${e.message}`);
  }
}
const K = ctx.K || {};
const events = K.Events;
if (!Array.isArray(events)) {
  error("events.js didn't define K.Events as a list");
  process.exit(1);
}

const WHERE = ["rest", "road", "town", "field"];
const EFFECTS = ["gold", "item", "stat", "spell", "equip", "heal", "wounded", "xp"];
const STATS = ["random", "STR", "CON", "DEX", "INT", "WIS", "CHA"];
const PLACEHOLDERS = ["nemesis", "nemesis2", "guy", "guy2", "giver", "kingdom", "kingdom2",
                      "item", "boring", "race", "race-one", "klass", "insult", "hero",
                      "gold", "loot"];

// A doubled comma in a list (['a', , 'b']) leaves a hole, which forEach
// skips but the game can still pick (and then crash on)
function checkHoles(name, list, what) {
  if (!Array.isArray(list)) return;
  for (let i = 0; i < list.length; ++i)
    if (!(i in list)) error(`${name}: ${what} has an empty entry after item ${i} (a doubled comma?)`);
}

function checkLines(name, lines, what) {
  if (!Array.isArray(lines)) { error(`${name}: ${what} should be a list of lines`); return []; }
  checkHoles(name, lines, what);
  const used = [];
  lines.forEach((line, i) => {
    if (typeof line !== "string") { error(`${name}: ${what} line ${i + 1} isn't text`); return; }
    if (!line.trim()) warn(`${name}: ${what} line ${i + 1} is empty`);
    if (line.indexOf("|") >= 0) error(`${name}: ${what} line ${i + 1} has a "|", which the game uses to separate fields`);
    (line.match(/\{[^}]*\}/g) || []).forEach((p) => {
      const key = p.slice(1, -1);
      used.push(key);
      if (PLACEHOLDERS.indexOf(key) < 0)
        error(`${name}: unknown placeholder ${p} (known: ${PLACEHOLDERS.map((k) => "{" + k + "}").join(" ")})`);
    });
    if (/[{}]/.test(line.replace(/\{[^}]*\}/g, ""))) error(`${name}: ${what} line ${i + 1} has an unmatched { or }`);
  });
  return used;
}

function checkEffect(name, fx) {
  if (fx === undefined) return {};
  if (!fx || typeof fx !== "object") { error(`${name}: effect should be an object like { gold: 2 }`); return {}; }
  Object.keys(fx).forEach((k) => {
    if (EFFECTS.indexOf(k) < 0) error(`${name}: unknown effect "${k}" (known: ${EFFECTS.join(", ")})`);
  });
  if ("gold" in fx && typeof fx.gold !== "number") error(`${name}: effect gold should be a number`);
  if ("item" in fx && ["boring", "special"].indexOf(fx.item) < 0) error(`${name}: effect item should be 'boring' or 'special'`);
  if ("stat" in fx && STATS.indexOf(fx.stat) < 0) error(`${name}: effect stat should be one of ${STATS.join(", ")}`);
  if ("wounded" in fx && !(fx.wounded >= 0)) error(`${name}: effect wounded should be a number of fights`);
  if ("xp" in fx && !(fx.xp > 0 && fx.xp <= 1)) warn(`${name}: effect xp is a share of a level (0.1 = 10%); ${fx.xp} looks odd`);
  return fx;
}

const keys = {}, racial = {};
let withChoices = 0;
events.forEach((e, n) => {
  const name = e && e.key ? `event "${e.key}"` : `event #${n + 1}`;
  if (!e || typeof e !== "object") { error(`${name} isn't an object`); return; }
  if (!e.key) error(`${name} has no key`);
  else if (keys[e.key]) error(`${name}: the key is used twice`);
  keys[e.key] = true;

  const where = Array.isArray(e.where) ? e.where : typeof e.where === "string" ? e.where.split(/[\s,]+/) : null;
  if (!where || !where.length) error(`${name}: 'where' is missing`);
  else where.forEach((w) => { if (WHERE.indexOf(w) < 0) error(`${name}: unknown where "${w}" (known: ${WHERE.join(", ")})`); });
  if ("weight" in e && !(e.weight >= 0)) error(`${name}: weight should be a number`);
  if (e.minLevel && e.maxLevel && e.minLevel > e.maxLevel) error(`${name}: minLevel is above maxLevel`);
  const raceNames = (K.Races || []).map((x) => x.split("|")[0]), klassNames = (K.Klasses || []).map((x) => x.split("|")[0]);
  if (e.race && raceNames.indexOf(e.race) < 0) error(`${name}: race "${e.race}" isn't in K.Races (check the spelling)`);
  if (e.klass && klassNames.indexOf(e.klass) < 0) error(`${name}: klass "${e.klass}" isn't in K.Klasses (check the spelling)`);
  if (e.race) racial[e.race] = (racial[e.race] || 0) + 1;
  if (e.klass) racial["class:" + e.klass] = (racial["class:" + e.klass] || 0) + 1;

  const used = checkLines(name, e.lines || [], "lines");
  if (!e.lines || !e.lines.length) warn(`${name}: no lines`);
  const fx = checkEffect(name, e.effect);
  let anyGold = "gold" in fx, anyItem = "item" in fx;

  if (e.choices || e.ask) {
    withChoices++;
    if (!Array.isArray(e.choices)) error(`${name}: has 'ask' but no list of choices`);
    else {
      if (e.choices.length < 2 || e.choices.length > 3) error(`${name}: ${e.choices.length} choices (the buttons and keys 1-3 allow 2 or 3)`);
      e.choices.forEach((c, i) => {
        const cname = `${name} choice ${i + 1}`;
        if (!c || !c.label) { error(`${cname} has no label`); return; }
        checkLines(cname, c.lines || [], "lines").forEach((k) => {
          if (k == "gold" && !(c.effect && "gold" in c.effect) && !("gold" in fx)) warn(`${cname} says {gold} but gives none`);
          if (k == "loot" && !(c.effect && "item" in c.effect) && !("item" in fx)) warn(`${cname} says {loot} but gives no item`);
        });
        const cfx = checkEffect(cname, c.effect);
        if ("gold" in cfx) anyGold = true;
        if ("item" in cfx) anyItem = true;
      });
    }
  }
  if (used.indexOf("gold") >= 0 && !anyGold) warn(`${name} says {gold} but no effect gives gold`);
  if (used.indexOf("loot") >= 0 && !anyItem) warn(`${name} says {loot} but no effect gives an item`);
});

// 2b. Perks (combat.js) and gold sinks (the end of events.js)
const PROPS = ["xp", "questMult", "damageMult", "takenMult", "hpMult", "mpMult", "castMult", "giveUpMult",
               "carryMult", "travelMult", "restMult", "recoveryMult", "regenMult", "titheMult", "goldMult",
               "dropMult", "shopMult", "lossMult", "deathMult", "eventMult", "initiativeMult", "fleeMult",
               "healMult", "poolGainMult", "buffMult", "hoardMult", "sinkMult", "boonMult", "allyPower",
               "gambleMult"];
const perkKeys = {};
(K.Perks || []).forEach((p, n) => {
  const name = p && p.key ? `perk "${p.key}"` : `perk #${n + 1}`;
  if (!p || !p.key || !p.label || !p.pro || !p.con) { error(`${name}: needs a key, label, pro and con`); return; }
  if (perkKeys[p.key]) error(`${name}: the key is used twice`);
  perkKeys[p.key] = true;
  Object.keys(p).forEach((k) => {
    if (["key", "label", "pro", "con", "noRewardGear"].indexOf(k) >= 0) return;
    if (PROPS.indexOf(k) < 0) error(`${name}: unknown property "${k}" (known: ${PROPS.join(", ")})`);
    else if (!(p[k] >= 0)) error(`${name}: ${k} should be a number`);
  });
});
const SINK_WORDS = PLACEHOLDERS.concat(["hench", "tavern", "rock"]);
const sinkKeys = {};
(K.Sinks || []).forEach((sk, n) => {
  const name = sk && sk.key ? `gold sink "${sk.key}"` : `gold sink #${n + 1}`;
  if (!sk || !sk.key || !sk.label) { error(`${name}: needs a key and a label`); return; }
  if (sinkKeys[sk.key]) error(`${name}: the key is used twice`);
  sinkKeys[sk.key] = true;
  if (!(sk.spend > 0 && sk.spend <= 1)) error(`${name}: spend should be a share of the spare gold, above 0 and at most 1`);
  if ("weight" in sk && !(sk.weight >= 0)) error(`${name}: weight should be a number`);
  const texts = [].concat(sk.lines || [], sk.gamble ? (sk.gamble.win || []).concat(sk.gamble.lose || []) : [],
                          sk.boon ? [sk.boon.name || "", sk.boon.ends || ""] : []);
  if (!sk.lines || !sk.lines.length) error(`${name}: no lines`);
  if (sk.gamble && (!(sk.gamble.win || []).length || !(sk.gamble.lose || []).length)) error(`${name}: a gamble needs win and lose lines`);
  checkHoles(name, sk.lines, "lines");
  texts.forEach((line) => {
    if (typeof line !== "string") { error(`${name}: a line isn't text`); return; }
    if (line.indexOf("|") >= 0) error(`${name}: "${line}" has a "|", which the game uses to separate fields`);
    (line.match(/\{[^}]*\}/g) || []).forEach((p) => {
      if (SINK_WORDS.indexOf(p.slice(1, -1)) < 0) error(`${name}: unknown placeholder ${p} in "${line}"`);
    });
  });
  if (sk.boon) {
    if (!sk.boon.name) error(`${name}: a boon needs a name`);
    Object.keys(sk.boon).forEach((k) => {
      if (["name", "help", "hours", "stack", "ends", "ally"].indexOf(k) >= 0) return;
      if (PROPS.indexOf(k) < 0) error(`${name}: boon has an unknown property "${k}" (known: ${PROPS.join(", ")})`);
    });
  }
  if (sk.buff && STATS.indexOf(sk.buff) < 1) error(`${name}: buff should be one of ${STATS.slice(1).join(", ")}`);
});
if (K.Sinks && !K.Sink) error("events.js has K.Sinks but no K.Sink settings");

(K.Races || []).forEach((r) => { r = r.split("|")[0]; if (!racial[r]) warn(`the ${r} race has no event of its own`); });
(K.Klasses || []).forEach((c) => { c = c.split("|")[0]; if (!racial["class:" + c]) warn(`the ${c} class has no event of its own`); });

// 3. The Act stories (story.js): every race and class has one, and each
// story is complete
const STORY_WORDS = ["nemesis", "nemesis2", "guy", "guy2", "giver", "kingdom", "kingdom2",
                     "item", "boring", "race", "race-one", "klass", "insult", "hero"];
const storyKeys = {};
let storyCount = 0;
function checkStory(name, st) {
  if (!st || typeof st !== "object") { error(`${name}: missing`); return; }
  storyCount++;
  if (!st.key) error(`${name}: no key`);
  else if (storyKeys[st.key]) error(`${name}: key "${st.key}" is also used by ${storyKeys[st.key]}`);
  storyKeys[st.key] = name;
  if (!st.title) error(`${name}: no title`);
  if (!st.setup) error(`${name}: no setup`);
  if (!Array.isArray(st.ending) || !st.ending.length) error(`${name}: no ending lines`);
  if (!Array.isArray(st.quests) || st.quests.length < 3) warn(`${name}: fewer than 3 quests`);
  checkHoles(name, st.ending, "ending");
  checkHoles(name, st.quests, "quests");
  [st.setup].concat(st.ending || [], st.quests || []).forEach((line) => {
    if (typeof line !== "string") { error(`${name}: a line isn't text`); return; }
    if (line.indexOf("|") >= 0) error(`${name}: "${line}" has a "|", which the game uses to separate fields`);
    (line.match(/\{[^}]*\}/g) || []).forEach((p) => {
      if (STORY_WORDS.indexOf(p.slice(1, -1)) < 0) error(`${name}: unknown placeholder ${p} in "${line}"`);
    });
  });
}
(K.Stories || []).forEach((st, i) => checkStory(`story "${(st && st.key) || "#" + (i + 1)}"`, st));
const names = (list) => (list || []).map((x) => x.split("|")[0]);
names(K.Races).forEach((r) => checkStory(`Act I story for the ${r} race`, (K.RaceStories || {})[r]));
names(K.Klasses).forEach((c) => checkStory(`Act II story for the ${c} class`, (K.ClassStories || {})[c]));
Object.keys(K.RaceStories || {}).forEach((r) => { if (names(K.Races).indexOf(r) < 0) warn(`K.RaceStories has "${r}", which isn't a race`); });
Object.keys(K.ClassStories || {}).forEach((c) => { if (names(K.Klasses).indexOf(c) < 0) warn(`K.ClassStories has "${c}", which isn't a class`); });

// The word lists (K.Monsters, K.Spells, K.Quests...) can have holes too
Object.keys(K).forEach((k) => { if (Array.isArray(K[k])) checkHoles(`K.${k}`, K[k], "the list"); });

console.log(`\n${storyCount} stories (${Object.keys(K.RaceStories || {}).length} races, ` +
            `${Object.keys(K.ClassStories || {}).length} classes, ${(K.Stories || []).length} others).`);
console.log(`\n${(K.Perks || []).length} perks, ${(K.Sinks || []).length} gold sinks.`);
console.log(`\n${events.length} events, ${withChoices} with choices` +
            ` (${Math.round(withChoices / Math.max(1, events.length) * 100)}%).` +
            ` ${errors} error(s), ${warnings} warning(s).`);
process.exit(errors ? 1 : 0);
