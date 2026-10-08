// Heroes in and out of the game: export (.pqw backups), import with the
// anti-cheat scan, and share links (sheet.html). Used by the main menu
// (menu.js) and the game's menu bar (menubar.js).
//
// Also the rules a save must follow (K.Guard and AuditSheet), which the
// game checks as it runs (CheckForCheating in main.js) and the scan checks
// on import.
//
// Depends on config.js and combat.js; the scan runs replay.js in a Worker.

// ---- Backups ---------------------------------------------------------------

function b64_decode(value) {
  return JSON.parse(decodeURIComponent(escape(atob(value))));
}

function b64_stringify(value) {
  return b64_text(JSON.stringify(value));
}

function b64_text(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

// Hand the player a file, made when they ask for it (not built ahead of
// time into a link for every hero on the list)
function DownloadText(text, fileName, type) {
  var url = URL.createObjectURL(new Blob([text], { type: type || "text/plain" }));
  var a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
}

// A .pqw backup of a hero. text: the JSON exactly as it was saved and
// sealed (SaveGame's callback), for the hero being played, who may have
// moved on since; a hero from storage is saved as it is.
function DownloadHero(sheet, text) {
  DownloadText(b64_text(text || JSON.stringify(sheet)), sheet.Traits.Name + ".pqw", "text/plain");
}

// ---- The rules a save must follow ---------------------------------------------

// (K.Guard, the limits, is in config.js: the game checks them as it runs)

// Check a save against the rules. Returns a list of { label, ok, reason,
// note }; reason says what's wrong (as in "branded a cheater: <reason>").
// Heroes from before save v9 only get the first check.
function AuditSheet(sheet) {
  var G = K.Guard, out = [];
  var level = parseInt(sheet.Traits && sheet.Traits.Level, 10) || 0, elapsed = sheet.elapsed || 0;
  var add = function (label, bad, reason, note) {
    out.push({ label: label, ok: !bad, reason: bad ? reason : "", note: note || "" });
  };
  var f = sheet.finale;
  add("Finale", f && f.state == "won" && ((f.wonLevel || 0) < K.Boss.Level || level < K.Boss.Level),
      "they claim to have beaten the Old Bastard™ before level " + K.Boss.Level,
      f && f.state == "won" ? "beat the Old Bastard™ at level " + f.wonLevel : "not reached yet");
  if ((sheet.birthVersion || 0) < 9) {
    out.push({ label: "Other checks", ok: true, skipped: true, reason: "", note: "an older hero: only the basics apply" });
    return out;
  }
  add("Time played", sheet.birthstamp && elapsed > (Date.now() - sheet.birthstamp) / 1000 * G.SpeedSlack + G.SpeedGrace,
      "more time was played than has passed since they were born",
      Math.round(elapsed / 360) / 10 + " hours in " + Math.max(0, Math.round((Date.now() - (sheet.birthstamp || Date.now())) / 86400000)) + " days");
  var xpTime = 0;
  for (var l = sheet.startLevel || 1; l < level; ++l) xpTime += LevelUpTime(l);
  add("Level pace", level >= 5 && elapsed < xpTime * G.LevelPace,
      "they reached level " + level + " faster than is possible",
      "level " + level + " in " + Math.round(elapsed / 360) / 10 + " hours");
  var E = ExpectedStat(level), P = ExpectedPool(level), stats = sheet.Stats || {};
  var high = K.PrimeStats.filter(function (s) { return (parseInt(stats[s], 10) || 0) > 18 + G.StatMax * E + 20; })[0];
  add("Stats", !!high, "their " + high + " is impossibly high for level " + level, "within reach of level " + level);
  add("HP and MP", (parseInt(stats["HP Max"], 10) || 0) > G.PoolMax * P + 100 || (parseInt(stats["MP Max"], 10) || 0) > G.PoolMax * P + 100,
      "their HP or MP is impossibly high for level " + level, "within reach of level " + level);
  var power = sheet.EquipPower || {};
  var tooGood = K.Equips.filter(function (slot) { return (power[slot] || 0) > level + G.GearAbove; })[0];
  add("Gear", !!tooGood, "their " + tooGood + " is far too good for level " + level, "nothing too good for level " + level);
  return out;
}

// ---- Windows 95 message boxes ---------------------------------------------------

// A modal box in the game's Windows 95 style. opts: { title, icon ("info",
// "warn", "error", "question" or none), text or html, body (a node),
// buttons: [{ label, value, primary }], onClose(value), wide }.
// Returns the <dialog>.
function WinBox(opts) {
  var dlg = document.createElement("dialog");
  dlg.className = "win95" + (opts.wide ? " wide" : "");
  dlg.setAttribute("aria-label", opts.title || "Progress Quest");
  var bar = document.createElement("div");
  bar.className = "win95-title";
  var title = document.createElement("span");
  title.textContent = opts.title || "Progress Quest";
  var x = document.createElement("button");
  x.type = "button";
  x.className = "win95-x";
  x.setAttribute("aria-label", "Close");
  x.textContent = "×";
  bar.appendChild(title);
  bar.appendChild(x);
  dlg.appendChild(bar);
  var body = document.createElement("div");
  body.className = "win95-body";
  if (opts.icon) {
    var icon = document.createElement("div");
    icon.className = "win95-icon " + opts.icon;
    icon.textContent = { info: "i", warn: "!", error: "×", question: "?" }[opts.icon] || "";
    body.appendChild(icon);
  }
  var content = document.createElement("div");
  content.className = "win95-content";
  if (opts.html) content.innerHTML = opts.html;
  else if (opts.text) String(opts.text).split("\n").forEach(function (line) {
    var p = document.createElement("p");
    p.textContent = line;
    content.appendChild(p);
  });
  if (opts.body) content.appendChild(opts.body);
  body.appendChild(content);
  dlg.appendChild(body);
  var buttons = document.createElement("div");
  buttons.className = "win95-buttons";
  dlg.appendChild(buttons);
  var closed = false;
  var close = function (value) {
    if (closed) return;
    closed = true;
    dlg.close();
    dlg.remove();
    if (opts.onClose) opts.onClose(value);
  };
  dlg.setButtons = function (list) {
    buttons.innerHTML = "";
    (list || [{ label: "OK", value: "ok", primary: true }]).forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = b.label;
      if (b.primary) btn.className = "primary";
      btn.addEventListener("click", function () {
        if (b.action) b.action(); else close(b.value);
      });
      buttons.appendChild(btn);
    });
    var first = buttons.querySelector(".primary") || buttons.querySelector("button");
    if (first) setTimeout(function () { first.focus(); }, 0);
  };
  dlg.setButtons(opts.buttons);
  dlg.closeWith = close;
  x.addEventListener("click", function () { close(null); });
  dlg.addEventListener("cancel", function (e) { e.preventDefault(); close(null); });
  document.body.appendChild(dlg);
  dlg.showModal();
  return dlg;
}

// ---- Importing, with the anti-cheat scan ------------------------------------------

// Import .pqw files one after another. after(sheet) runs for each hero
// that made it into the roster.
function ImportHeroFiles(files, after) {
  var list = Array.prototype.slice.call(files || []);
  var next = function () {
    var file = list.shift();
    if (!file) return;
    file.text().then(function (text) {
      var sheet = null;
      try {
        sheet = b64_decode(text.replace(/\s/g, ""));
        if (!sheet || !sheet.Traits || !sheet.Traits.Name) throw new Error("No character in file");
      } catch (err) {
        WinBox({ title: "Import Hero", icon: "error", text: file.name + " doesn't look like a Progress Quest save.",
                 onClose: next });
        return;
      }
      ScanHero(sheet, file.name, function (ok) {
        if (!ok) { next(); return; }
        // The same hero (life ID) is replaced; another of the same name isn't
        storage.loadHero(HeroId(sheet), function (have) {
          if (have && !confirm(have.Traits.Name + " (level " + have.Traits.Level + ") is already in your roster. " +
                               "Replace them with this backup (level " + sheet.Traits.Level + ")?")) { next(); return; }
          storage.saveHero(sheet, function () {
            if (after) after(sheet);
            next();
          });
        });
      });
    });
  };
  next();
}

// The scan: one line per check, then a verdict. done(true) if the hero
// should be imported (sheet.cheater is set if they import branded).
function ScanHero(sheet, fileName, done) {
  var list = document.createElement("ul");
  list.className = "scan-list";
  var meter = document.createElement("div");
  meter.className = "scan-meter";
  meter.innerHTML = "<div></div><span></span>";
  meter.style.display = "none";
  var verdict = document.createElement("p");
  verdict.className = "scan-verdict";
  var wrap = document.createElement("div");
  var intro = document.createElement("p");
  intro.textContent = "Scanning " + sheet.Traits.Name + ", level " + sheet.Traits.Level + " " +
    sheet.Traits.Race + " " + sheet.Traits.Class + " (" + fileName + ")";
  wrap.appendChild(intro);
  wrap.appendChild(list);
  wrap.appendChild(meter);
  wrap.appendChild(verdict);

  var worker = null, finished = false;
  var dlg = WinBox({ title: "PQ Anti-Cheat Scanner 95", body: wrap, wide: true, buttons: [],
                     onClose: function (v) {
                       if (worker) worker.terminate();
                       if (!finished) { finished = true; done(v === "import"); }
                     } });
  dlg.setButtons([{ label: "Cancel", value: null }]);

  var line = function (label) {
    var li = document.createElement("li");
    li.innerHTML = "<span class=scan-mark>…</span> <b></b> <span class=scan-note></span>";
    li.querySelector("b").textContent = label;
    list.appendChild(li);
    li.set = function (mark, note, cls) {
      li.querySelector(".scan-mark").textContent = mark;
      li.querySelector(".scan-note").textContent = note || "";
      li.className = cls || "";
    };
    return li;
  };

  var problems = [], fatal = null, partial = null, unverified = null;
  var steps = [];
  var step = function (fn) { steps.push(fn); };
  var run = function () {
    var fn = steps.shift();
    if (!fn) { finish(); return; }
    fn(function () { setTimeout(run, 140); });
  };

  step(function (next) {
    line("Reading the file").set("✔", "a Progress Quest save (version " + (sheet.saveVersion || 0) + ")", "ok");
    next();
  });
  step(function (next) {
    var li = line("Seal"), state = SaveSealState(sheet);
    if (state == "ok") li.set("✔", "untouched since the game saved it", "ok");
    else if (state == "old") {
      // No seal could mean it's old, or that someone took it off
      li.set("?", "not sealed, so there's no telling whether it was edited", "skip");
      unverified = UnverifiedReason(sheet, state);
    } else {
      li.set("✘", "edited outside the game", "bad");
      problems.push("it was imported from a backup file that had been edited");
    }
    next();
  });
  step(function (next) {
    if (sheet.mode != "hardcore") { next(); return; }
    var li = line("Hardcore");
    var fallen = null, verdict = null;
    storage.loadFallen(function (f) { fallen = f; });
    storage.loadLedger(function (entries, trusted) { verdict = LedgerVerdict(sheet, entries, trusted); });
    if (IsFallen(sheet, fallen) || verdict == "dead") {
      li.set("✘", "died, and is in the Hall of the Fallen", "bad");
      fatal = sheet.Traits.Name + " died in Hardcore and is in the Hall of the Fallen. Hardcore heroes stay dead.";
    } else if (verdict == "older") {
      li.set("✘", "an older copy than this browser last saved", "bad");
      fatal = fileName + " is an older copy of " + sheet.Traits.Name + " than the one this browser last saved. Hardcore heroes can't go back in time.";
    } else if (verdict == "tampered") {
      li.set("✘", "this browser's Hardcore ledger was edited", "bad");
      fatal = "This browser's Hardcore ledger was edited, so Hardcore backups can't be imported here.";
    } else li.set("✔", "alive, and not an older copy", "ok");
    next();
  });
  step(function (next) {
    if (fatal) { next(); return; }
    var checks = AuditSheet(sheet);
    var each = function () {
      var c = checks.shift();
      if (!c) { next(); return; }
      var li = line(c.label);
      if (c.skipped) {
        li.set("–", c.note, "skip");
        unverified = unverified || UnverifiedReason(sheet, "ok");
      }
      else if (c.ok) li.set("✔", c.note, "ok");
      else { li.set("✘", c.reason, "bad"); problems.push(c.reason); }
      setTimeout(each, 90);
    };
    each();
  });
  step(function (next) {
    if (fatal) { next(); return; }
    var li = line("Replay");
    if (!sheet.replay || !sheet.replay.birth) {
      // Every hero born since replays has one, from their first task on
      if ((sheet.birthVersion || 0) >= K.Replay.Since && (sheet.tasks || 0) > 0) {
        li.set("✘", "the record the game keeps for replays is missing", "bad");
        problems.push("the record the game keeps for replays was removed");
      } else li.set("–", "not possible: created before replays", "skip");
      next(); return;
    }
    // (only older versions froze a replay; a newer save saying so is ignored)
    if (sheet.replay.frozen && (sheet.saveVersion || 0) < 14) {
      li.set("–", "not possible: played with an older version of the game", "skip"); next(); return;
    }
    GameFingerprint(function (fp) {
      if (sheet.replay.fp && fp && sheet.replay.fp != fp) {
        li.set("–", "not possible: played with a different version of the game", "skip"); next(); return;
      }
      if (typeof Worker != "function") { li.set("–", "not possible in this browser", "skip"); next(); return; }
      ReplayIn(li, 10000, next);
    });
  });

  // Run replay.js in a Worker, showing progress. budget: ms (0 for all of it)
  function ReplayIn(li, budget, next) {
    li.set("…", "replaying the whole game with the simulator…", "busy");
    meter.style.display = "";
    var bar = meter.querySelector("div"), label = meter.querySelector("span");
    try { worker = new Worker("replay.js"); }
    catch (e) { li.set("–", "not possible here (" + e.message + ")", "skip"); meter.style.display = "none"; next(); return; }
    worker.onmessage = function (e) {
      var m = e.data;
      if (m.type == "progress") {
        bar.style.width = Math.min(100, 100 * m.done / Math.max(1, m.total)) + "%";
        label.textContent = m.done.toLocaleString() + " / " + m.total.toLocaleString() + " tasks";
        return;
      }
      worker.terminate();
      worker = null;
      meter.style.display = "none";
      var r = m.result;
      partial = null;
      var since = sheet.replay.since, from = since ? since.t : 0;
      var stretch = since ? " since level " + since.level + (since.why == "update" ? ", when the game was updated" : "") : "";
      if (r.status == "match")
        li.set("✔", (since ? "replays exactly" + stretch : "the whole game replays exactly") +
               " (" + (r.checked - from).toLocaleString() + " tasks)", "ok");
      else if (r.status == "partial") {
        li.set("✔", "the first " + (r.checked - from).toLocaleString() + " of " + (r.total - from).toLocaleString() +
               " tasks" + stretch + " replay exactly", "ok");
        partial = li;
      } else if (r.status == "mismatch") {
        li.set("✘", r.detail, "bad");
        problems.push("their game doesn't replay the same: " + r.detail);
      } else li.set("–", "not possible: " + r.detail, "skip");
      next();
    };
    worker.onerror = function (e) {
      if (worker) worker.terminate();
      worker = null;
      meter.style.display = "none";
      li.set("–", "not possible here (" + (e.message || "the replay didn't start") + ")", "skip");
      next();
    };
    worker.postMessage({ save: sheet, budgetMs: budget });
  }

  function finish() {
    var buttons = [];
    if (fatal) {
      verdict.textContent = fatal;
      verdict.className = "scan-verdict bad";
      buttons.push({ label: "OK", value: null, primary: true });
    } else if (problems.length) {
      verdict.textContent = "Suspicious: " + problems[0] + ". " + sheet.Traits.Name +
        " can still be imported, but will be branded a cheater (and won't count for the Hall).";
      verdict.className = "scan-verdict bad";
      buttons.push({ label: "Import (branded)", action: function () {
        if (!sheet.cheater)
          sheet.cheater = { reason: problems[0], at: new Date().toISOString(), level: parseInt(sheet.Traits.Level, 10) || 0 };
        dlg.closeWith("import");
      } });
      buttons.push({ label: "Cancel", value: null, primary: true });
    } else if (unverified && !sheet.cheater && !sheet.unverified) {
      // Nothing wrong found, but nothing to vouch for them either
      verdict.textContent = "No cheating found, but " + sheet.Traits.Name + " can't be verified: " + unverified +
        ". They can be imported and played as normal, but won't count for the Hall of Legends or New Game+.";
      verdict.className = "scan-verdict";
      buttons.push({ label: "Import (unverified)", primary: true, action: function () {
        sheet.unverified = unverified;
        dlg.closeWith("import");
      } });
      buttons.push({ label: "Cancel", value: null });
    } else {
      verdict.textContent = (sheet.cheater ? "No new problems found (" + sheet.Traits.Name + " was already branded a cheater: " +
        sheet.cheater.reason + ")." : sheet.unverified ? "No cheating found (" + sheet.Traits.Name + " is unverified: " +
        sheet.unverified + ")." : "No cheating found. " + sheet.Traits.Name + " is clean.");
      verdict.className = "scan-verdict ok";
      buttons.push({ label: "Import", value: "import", primary: true });
      if (partial) buttons.push({ label: "Replay the rest", action: function () {
        dlg.setButtons([{ label: "Cancel", value: null }]);
        verdict.textContent = "";
        ReplayIn(partial, 0, finish);
      } });
      buttons.push({ label: "Cancel", value: null });
    }
    dlg.setButtons(buttons);
  }

  run();
}

// ---- Share links ----------------------------------------------------------------------

// What a share link shows: the character sheet, not the save (it can't be
// imported or played). Sealed, so the viewer can tell if it was edited.
function SharePayload(g) {
  var gold = 0;
  (g.Inventory || []).forEach(function (row) { if (row[0] == "Gold") gold = row[1]; });
  var L = g.legacy;
  var p = {
    v: 1,
    n: g.Traits.Name, r: g.Traits.Race, c: g.Traits.Class, a: g.Traits.Alignment || "",
    l: parseInt(g.Traits.Level, 10) || 0,
    st: K.Stats.map(function (s) { return g.Stats[s]; }),
    eq: K.Equips.map(function (e) { return (g.Equips || {})[e] || ""; }),
    sp: (g.Spells || []).slice(0, 120),
    inv: (g.Inventory || []).filter(function (row) { return row[0] != "Gold"; }).slice(0, 40),
    gold: gold, act: g.act || 0, plot: g.bestplot || "",
    quest: (g.Quests && g.Quests.length) ? g.Quests[g.Quests.length - 1] : "",
    xp: g.ExpBar ? [Math.floor(g.ExpBar.position), Math.floor(g.ExpBar.max)] : [0, 1],
    el: Math.floor(g.elapsed || 0), mode: g.mode || "normal", mut: g.mutators || [],
    leg: L ? (L.races || []).length + (L.klasses || []).length : 0,
    d: g.deaths || 0, w: g.wins || 0, qd: g.questsDone || 0,
    fin: g.finale && g.finale.state == "won" ? g.finale.wonLevel : 0,
    daily: g.daily ? g.daily.date : "", ch: g.cheater ? g.cheater.reason : "", uv: g.unverified || "",
    dead: g.dead ? (g.dead.cause || "dead") : "",
    at: Date.now()
  };
  return Seal(p);
}

function _bytesToB64url(bytes) {
  var s = "";
  for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function _b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  var bin = atob(s), out = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; ++i) out[i] = bin.charCodeAt(i);
  return out;
}

// The code that goes after sheet.html#: "z" + compressed, or "j" + plain
function ShareCode(sheet) {
  var bytes = new TextEncoder().encode(JSON.stringify(SharePayload(sheet)));
  if (typeof CompressionStream != "function") return Promise.resolve("j" + _bytesToB64url(bytes));
  var stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Response(stream).arrayBuffer().then(function (buf) { return "z" + _bytesToB64url(new Uint8Array(buf)); });
}

// The payload back from a code (rejects if it can't be read)
function ReadShareCode(code) {
  return Promise.resolve().then(function () {
    var kind = code.charAt(0), bytes = _b64urlToBytes(code.slice(1));
    if (kind == "j") return new TextDecoder().decode(bytes);
    if (kind != "z" || typeof DecompressionStream != "function") throw new Error("unreadable");
    var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Response(stream).text();
  }).then(function (text) { return JSON.parse(text); });
}

function ShareUrl(code) {
  return new URL("sheet.html#" + code, window.location.href).href;
}

// The Share window: the link, and ways to send it
function ShareHero(sheet) {
  ShareCode(sheet).then(function (code) {
    var url = ShareUrl(code);
    var box = document.createElement("div");
    box.className = "share-box";
    var p = document.createElement("p");
    p.textContent = "Anyone with this link can see " + sheet.Traits.Name +
      "'s character sheet as it is right now. It isn't a save: they can look, but not play or import.";
    var input = document.createElement("input");
    input.type = "text";
    input.readOnly = true;
    input.value = url;
    input.className = "share-url";
    input.addEventListener("focus", function () { input.select(); });
    var status = document.createElement("p");
    status.className = "share-status";
    box.appendChild(p);
    box.appendChild(input);
    box.appendChild(status);
    var buttons = [
      { label: "Copy Link", primary: true, action: function () {
        var ok = function () { status.textContent = "Copied to the clipboard."; };
        if (navigator.clipboard && navigator.clipboard.writeText)
          navigator.clipboard.writeText(url).then(ok, function () { input.select(); document.execCommand("copy"); ok(); });
        else { input.select(); document.execCommand("copy"); ok(); }
      } },
      { label: "Open", action: function () { window.open(url, "_blank", "noopener"); } }
    ];
    if (navigator.share) buttons.push({ label: "Share…", action: function () {
      navigator.share({ title: sheet.Traits.Name + " - Progress Quest Remix",
                        text: sheet.Traits.Name + ", level " + sheet.Traits.Level + " " + sheet.Traits.Race + " " + sheet.Traits.Class,
                        url: url }).catch(function () {});
    } });
    buttons.push({ label: "Close", value: null });
    WinBox({ title: "Share Character Sheet", icon: "info", body: box, buttons: buttons, wide: true });
  }, function () {
    WinBox({ title: "Share Character Sheet", icon: "error", text: "This browser couldn't make a share link." });
  });
}

// The character sheet as plain text (Edit > Copy Character Sheet)
function CharacterSheetText(g) {
  var t = g.Traits, lines = [];
  lines.push(t.Name + ", level " + t.Level + " " + t.Race + " " + t.Class + (t.Alignment ? " (" + t.Alignment + ")" : ""));
  lines.push(K.Stats.map(function (s) { return s.replace(" Max", "") + " " + g.Stats[s]; }).join("  "));
  lines.push("");
  K.Equips.forEach(function (e) { if ((g.Equips || {})[e]) lines.push(e + ": " + g.Equips[e]); });
  if ((g.Spells || []).length) {
    lines.push("");
    lines.push("Spells: " + g.Spells.map(function (s) { return s[0] + " " + s[1]; }).join(", "));
  }
  lines.push("");
  lines.push(g.bestplot ? "Plot: " + g.bestplot : "");
  lines.push("Played " + Math.round((g.elapsed || 0) / 360) / 10 + " hours · Progress Quest Remix");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
