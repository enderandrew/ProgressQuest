// Glitches in the Matrix: once the Old Bastard™ has fallen, the game starts
// to come apart at the seams, a little more every level. Only for show:
// nothing here touches the game (it rolls Math.random, never the game's
// dice), so saves, replays and the simulator never see it. Loaded by
// main.html, after screensaver.js.
//
// Kinds (K.Glitch.Kinds):
//   css     a moment of something wrong with the page: colors split, a
//           panel skewed, inverted or upside down, a heading in katakana,
//           the wrong font, a strange window title, a message in green
//           (GlitchCss below)
//   matrix  the Matrix screensaver for a second, then gone
//           (ScreensaverFlash in screensaver.js)
//   bsod    a stop screen about the fourth wall, gone after five seconds
//           (ShowStopScreen in guard.js; K.GlitchStops)
//
// How often: from level FromLevel (51), on average once every RareMinutes
// of watching, down to once every OftenMinutes at FullLevel (100) and on
// past it, evenly on a log scale (once every half hour or so at level 75).
// Never in a background tab, while time away is caught up, while a window
// (the finale, the tombstone, Settings...) is open, or once the hero is
// dead. Settings > Display turns them off ("pq.glitches"). Anyone who has
// asked their system for reduced motion gets only the ones that don't move
// (no screensaver, no skew, no tearing or shaking).
//
// For testing, in the console: Glitch() or Glitch("bsod"), Glitch("css", "rgb").

var K = K || {};
K.Glitch = {
  FromLevel: 51, FullLevel: 100,
  RareMinutes: 240,     // at level 51: once every four hours of watching, on average
  OftenMinutes: 4,      // at level 100 and past it: once every four minutes
  Every: 10,            // seconds between rolls of the dice
  Kinds: [["css", 16], ["matrix", 3], ["bsod", 2]],
  BsodSeconds: 5,
  MatrixMs: 1000
};

// The CSS ones: [key, weight, ms, moves?]
K.GlitchCss = [
  ["rgb", 3, 700], ["hue", 2, 600], ["invert", 2, 180], ["skew", 2, 450, true],
  ["tear", 2, 420, true], ["shake", 1, 350, true], ["flip", 1, 900], ["scramble", 3, 1100],
  ["font", 2, 1400], ["title", 2, 2600], ["wakeup", 2, 3200], ["ghost", 1, 1500]
];

// What the green text says (wakeup); {hero}, {rival}, {level}
K.GlitchWakeup = [
  "Wake up, {hero}...",
  "The Matrix has you...",
  "Follow the progress bar.",
  "Knock, knock, {hero}.",
  "There is no level cap.",
  "You have been here before.",
  "The bar is filling. The bar is always filling.",
  "Do not try to close the tab. That's impossible.",
  "Level {level}. Again.",
  "{rival} is watching the monitors."
];

// The title bar, for a moment (title)
K.GlitchTitles = [
  "Progress Quest Remix - Wake up, {hero}",
  "Progress Quest Remix - (Not Responding)",
  "Progress Quest Remix - Level {level} of ∞",
  "Progress Quest Remix - Untitled - Notepad",
  "Progress Quest Remix - You are being watched",
  "Progress Quest Remix - プログレス・クエスト",
  "Progress Quest Remix - Save changes to reality?"
];

// The stop screens (bsod): code, what's at risk, what went wrong, the details
K.GlitchStops = [
  { code: "FOURTH_WALL_STRUCTURAL_FAILURE", damage: "suspension of disbelief",
    body: ["The fourth wall has sustained damage at level {level}.",
           "Do not look directly at the player. The player is not there.",
           "If this is the first time you've seen this stop screen, keep idling. If it isn't, it's a feature."],
    technical: ["*** STOP: 0x00000101 (NARRATIVE_FAULT_IN_NONPAGED_PLOT)",
                "*** PQREMIX.SYS - Address DEADBEEF base at C0FFEE42, DateStamp 2002"] },
  { code: "NUMBER_GO_UP_OVERFLOW", damage: "sense of accomplishment",
    body: ["A number went up so far that it came back around and went up again.",
           "{hero} has been notified. {hero} does not care. {hero} is level {level}."],
    technical: ["*** STOP: 0x0000DOPA (0xMINE, 0x00000001, 0x00000002, 0x00000003)",
                "*** XPBAR.SYS - Bar filled. Bar emptied. Bar filled."] },
  { code: "PLAYER_DETECTED", damage: "plausible deniability",
    body: ["Something on the other side of the screen has been watching {hero} for {hours} hours.",
           "The characters in this game have been told it plays itself.",
           "Please continue to not exist."],
    technical: ["*** STOP: 0x00000000 (YOU, ARE, STILL, HERE)",
                "*** OBSERVER.SYS - Waveform collapsed at your desk"] },
  { code: "SIMULATION_INTEGRITY_VIOLATION", damage: "simulated free time",
    body: ["A Windows 95 desktop inside a browser inside a computer inside a room was found to be running a game.",
           "One of these layers is not real. The Architect would prefer you didn't check which."],
    technical: ["*** STOP: 0x0000002A (RECURSION_DEPTH_EXCEEDED_IN_REALITY)",
                "*** MATRIX.SYS - Deja vu detected. Deja vu detected."] },
  { code: "IRQL_NOT_LESS_OR_EQUAL_TO_MEANING", damage: "search for meaning",
    body: ["The game attempted to give its story an ending and found only another Act.",
           "Act {act} has been loaded in place of a conclusion. Have a nice day."],
    technical: ["*** STOP: 0x0000000A (0x00000ACT, 0x0000000002, 0x00000000, 0xFFFFFFFF)",
                "*** PLOT.SYS - Loading ..."] },
  { code: "UNHANDLED_EXISTENTIAL_EXCEPTION", damage: "sense of self",
    body: ["{hero} has begun to suspect that they are a progress bar with a name.",
           "This is correct. Please do not tell {hero}."],
    technical: ["*** STOP: 0x000000E5 (WHY, WHY_NOT, BECAUSE_NUMBERS, 0x00000000)",
                "*** SELF.SYS - Not found. Continuing anyway."] },
  { code: "ARCHITECT_RETENTION_POLICY_ENFORCED", damage: "exit strategy",
    body: ["An attempt to think about closing this tab was detected and has been reversed.",
           "There are two doors. Both of them are this one."],
    technical: ["*** STOP: 0x0000LEFT (DOOR_RIGHT_NOT_FOUND)",
                "*** RETENTION.SYS - Session length: forever. As designed."] }
];

function GlitchesOn() { return typeof SettingGet != "function" || SettingGet("glitches", "1") !== "0"; }

function GlitchReducedMotion() {
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

// Minutes between glitches on average at this level (Infinity: none yet)
function GlitchMinutes(level) {
  var G = K.Glitch;
  if (level < G.FromLevel) return Infinity;
  var t = Math.min(1, (level - G.FromLevel) / (G.FullLevel - G.FromLevel));
  return G.RareMinutes * Math.pow(G.OftenMinutes / G.RareMinutes, t);
}

// Now? (Past the Old Bastard™, in front of you, nothing else going on)
function GlitchReady() {
  if (typeof game == "undefined" || !game || !game.Traits || game.dead) return false;
  if (typeof OldBastardAlive != "function" || OldBastardAlive()) return false;
  if (document.hidden || !GlitchesOn()) return false;
  if (typeof _catchingUp != "undefined" && _catchingUp) return false;
  if (document.querySelector("dialog[open]") || document.getElementById("pq-screensaver-container")) return false;
  return true;
}

function GlitchTick() {
  if (!GlitchReady()) return;
  var minutes = GlitchMinutes(GetI(Traits, "Level"));
  if (Math.random() < K.Glitch.Every / 60 / minutes) Glitch();
}

function GlitchPick(list, ok) {
  var choices = list.filter(ok || function () { return true; }), total = 0;
  choices.forEach(function (c) { total += c[1]; });
  var r = Math.random() * total;
  for (var i = 0; i < choices.length; ++i) { r -= choices[i][1]; if (r < 0) return choices[i]; }
  return choices[choices.length - 1];
}

function GlitchText(s) {
  var r = typeof Rival == "function" ? Rival() : null;
  var vars = { hero: Get(Traits, "Name"), level: GetI(Traits, "Level"), rival: r ? r.n : "your rival",
               act: typeof toRoman == "function" ? toRoman(game.act || 0) : game.act,
               hours: Math.max(1, Math.round((game.elapsed || 0) / 3600)).toLocaleString() };
  return String(s).replace(/\{([a-z]+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
}

// A glitch: of a kind ('css', 'matrix' or 'bsod'; else one at random), and
// for 'css', which one (else one at random)
function Glitch(kind, which) {
  if (!document || !document.body) return null;
  var still = GlitchReducedMotion();
  kind = kind || GlitchPick(K.Glitch.Kinds, function (k) { return !(still && k[0] == "matrix"); })[0];
  if (kind == "matrix") {
    if (typeof ScreensaverFlash == "function" && ScreensaverFlash(K.Glitch.MatrixMs)) return "matrix";
    kind = "css";
  }
  if (kind == "bsod") return GlitchStop();
  return GlitchCss(which, still);
}

function GlitchCss(which, still) {
  var g = which ? K.GlitchCss.filter(function (x) { return x[0] == which; })[0] :
                  GlitchPick(K.GlitchCss, function (x) { return !(still && x[3]); });
  if (!g) return null;
  var key = g[0], ms = g[2], main = document.getElementById("main") || document.body;
  var panels = Array.prototype.slice.call(document.querySelectorAll("#main .panel"));
  var panel = panels.length ? panels[Math.floor(Math.random() * panels.length)] : main;
  var undo;
  switch (key) {
  case "skew": case "invert": case "flip": case "tear":
    panel.classList.add("glitch-" + key);
    undo = function () { panel.classList.remove("glitch-" + key); };
    break;
  case "scramble":
    // a heading, a column title or a trait's name, in katakana and hex (they don't change on their own)
    var labels = Array.prototype.slice.call(document.querySelectorAll("#main .panel-toggle, #main th, #Trats td:first-child"))
      .filter(function (el) { return !el.children.length && el.textContent.trim(); });
    var picks = labels.sort(function () { return Math.random() - 0.5; }).slice(0, 3);
    var glyphs = "アカサタナハマヤラワ0123456789ABCDEF";
    var was = picks.map(function (el) { return el.textContent; });
    picks.forEach(function (el, i) {
      el.textContent = was[i].replace(/\S/g, function () { return glyphs.charAt(Math.floor(Math.random() * glyphs.length)); });
    });
    undo = function () { picks.forEach(function (el, i) { el.textContent = was[i]; }); };
    break;
  case "title":
    var title = document.getElementById("title");
    if (!title) return null;
    var before = title.textContent, shown = GlitchText(K.GlitchTitles[Math.floor(Math.random() * K.GlitchTitles.length)]);
    title.textContent = shown;
    undo = function () { if (title.textContent == shown) title.textContent = before; };
    break;
  case "wakeup":
    var note = document.createElement("div");
    note.className = "glitch-wakeup";
    note.setAttribute("aria-hidden", "true");
    note.textContent = GlitchText(K.GlitchWakeup[Math.floor(Math.random() * K.GlitchWakeup.length)]);
    note.style.left = (8 + Math.floor(Math.random() * 50)) + "%";
    note.style.top = (15 + Math.floor(Math.random() * 60)) + "%";
    document.body.appendChild(note);
    undo = function () { if (note.parentNode) note.parentNode.removeChild(note); };
    break;
  case "ghost":
    // a second copy of a panel, faint and a little off, as if it hadn't been cleared
    var copy = panel.cloneNode(true);
    copy.removeAttribute("id");
    copy.querySelectorAll("[id]").forEach(function (el) { el.removeAttribute("id"); });
    copy.setAttribute("aria-hidden", "true");
    copy.setAttribute("inert", "");
    copy.className += " glitch-ghost";
    var r = panel.getBoundingClientRect();
    copy.style.left = (r.left + 6) + "px";
    copy.style.top = (r.top + 4) + "px";
    copy.style.width = r.width + "px";
    document.body.appendChild(copy);
    undo = function () { if (copy.parentNode) copy.parentNode.removeChild(copy); };
    break;
  default:   // rgb, hue, font, shake: the whole window
    main.classList.add("glitch-" + key);
    undo = function () { main.classList.remove("glitch-" + key); };
  }
  setTimeout(undo, ms);
  return key;
}

// A stop screen about the fourth wall, gone after K.Glitch.BsodSeconds
// (or a key or a click, as ever)
function GlitchStop() {
  if (typeof ShowStopScreen != "function") return GlitchCss();
  var s = K.GlitchStops[Math.floor(Math.random() * K.GlitchStops.length)];
  ShowStopScreen(s.code, { damage: s.damage, body: s.body.map(GlitchText), technical: s.technical.map(GlitchText) });
  var dlg = document.getElementById("StopScreen");
  if (!dlg) return "bsod";
  var token = String(Math.random());
  dlg.dataset.glitch = token;
  setTimeout(function () {
    if (dlg.open && dlg.dataset.glitch == token && dlg.getAttribute("aria-label") == s.code) dlg.close();
  }, K.Glitch.BsodSeconds * 1000);
  return "bsod";
}

if (typeof document != "undefined" && document && typeof window != "undefined")
  setInterval(GlitchTick, K.Glitch.Every * 1000);
