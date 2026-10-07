// The main menu (index.html): New Game, Resume, the Hall, and Challenge
// Modes. Depends on config.js (storage, EncodeName, DecodeName, Pick), and
// on story.js, combat.js and daily.js for the Daily Challenge.

function b64_decode(value) {
  return JSON.parse(decodeURIComponent(escape(atob(value))));
}

function b64_stringify(value) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(value))));
}

// ---- Windows --------------------------------------------------------------

function OpenWindow(id, mode, extra) {
  // New Game+ is the character roller with a legacy, once someone has
  // retired to the Hall; until then its window explains how to unlock it.
  // Hardcore (from Challenge Modes) is the roller too.
  var plus = id == "dlgPlus" && legendCount > 0;
  if (plus) { id = "dlgNew"; mode = "plus"; }
  if (id == "dlgHardcore") { id = "dlgNew"; mode = "hardcore"; }
  var dlg = document.getElementById(id);
  if (!dlg) return;
  $("dialog[open]").each(function () { if (this !== dlg) this.close(); });
  if (id == "dlgNew") StartNewGame(mode, extra);
  if (id == "dlgChallenge") ShowChallenges();
  if (id == "dlgResume") LoadRoster();
  if (id == "dlgHall") LoadHall();
  if (id == "dlgFaq" && !$("#faqFrame").attr("src")) $("#faqFrame").attr("src", "faq.php");
  if (!dlg.open) dlg.showModal();
  // a link to index.html#resume (or #new...) opens that window
  history.replaceState(null, "", "#" + (mode || id.replace(/^dlg/, "").toLowerCase()));
}

function CloseWindows() {
  $("dialog[open]").each(function () { this.close(); });
}

// index.html#resume, #new, #plus, #hall, #challenge, #faq, #github
// index.html#hall/<id> opens the Hall with that legend highlighted (a hero
// who just retired).
var hallHighlight = "";
function WindowFromHash() {
  var parts = (window.location.hash || "").slice(1).split("/");
  var name = parts[0].toLowerCase();
  hallHighlight = parts[1] ? decodeURIComponent(parts[1]) : "";
  var ids = { "new": "dlgNew", resume: "dlgResume", plus: "dlgPlus", hall: "dlgHall",
              challenge: "dlgChallenge", hardcore: "dlgHardcore", faq: "dlgFaq", github: "dlgGitHub" };
  if (ids[name]) OpenWindow(ids[name]);
}

// The character roller runs in its own page (newguy.html) inside the New
// Game window. It is reloaded each time, so every visit is a fresh roll.
// extra: more of the query string, e.g. "seed=abc&mut=nospells" (Custom Run)
function StartNewGame(mode, extra) {
  $("#dlgNewTitle").text((mode == "plus" ? "New Character (New Game+)" :
                          mode == "hardcore" ? "New Character (\u2620 Hardcore)" : "New Character") +
                         (extra ? " \u2014 custom run" : ""));
  $("#newguyFrame").attr("src", "newguy.html?embed" + (mode ? "&" + mode : "") + (extra ? "&" + extra : ""));
}

// Challenge Modes: the Daily, Custom Run, and what a Hardcore hero would
// start with
function ShowChallenges() {
  ShowDailyCard();
  ShowCustomCard();
  storage.loadLegends(function (legends) {
    var hall = LegacyFromHall(legends);
    var n = hall.races.length + hall.klasses.length;
    $("#hardcoreLegacy").text(n ? n + " of " + (K.Races.length + K.Klasses.length) + " honored, +" +
      Math.round(LegacyAverage(hall.bonus) * 1000) / 10 + "% on average" : "nothing honored yet");
  });
}

// " · Daily 2026-10-07 · Glass Cannon · seed abc" for the roster and the Hall
function RunTags(daily, mutators, runSeed) {
  var tags = [];
  if (daily) tags.push("\ud83d\udcc5 Daily " + daily);
  (mutators || []).forEach(function (k) {
    var m = K.Mutators.filter(function (x) { return x.key == k; })[0];
    if (m) tags.push(m.label);
  });
  if (runSeed && !daily) tags.push("seed \u201c" + runSeed + "\u201d");
  return tags.map(function (t) { return " \u00b7 " + t; }).join("");
}

// ---- The Daily Challenge (daily.js) -----------------------------------------

function DailyStatusText(e) {
  return e.status == "done" ? "\u2714 done in " + Hours(e.played) + " of play" :
         e.status == "failed" ? "\u2718 out of time" :
         e.status == "died" ? "\u2620 died trying" : "unfinished";
}

// Today's hero, the button to start or resume it, and past results
function ShowDailyCard() {
  var date = DailyDate(), plan = DailyPlan(date);
  var twist = K.Mutators.filter(function (m) { return plan.mutators.indexOf(m.key) >= 0; })[0];
  $("#dailyDate").text(date + " (UTC)");
  $(".dailyHours").text(K.DailyHours);
  $("#dailyPlan").empty()
    .append($("<div>").text("A level " + plan.level + " " + plan.race + " " + plan.klass + "."))
    .append($("<div class=goal>").text("Goal: " + DailyGoalText(plan.goal) + " within " + K.DailyHours + " hours."))
    .append($("<div class=twist>").text(twist ? "Twist: " + twist.label + ". " + twist.help : "No twist today."))
    .append(plan.hardcore ? $("<div class=hc>").text("\u2620 Hardcore: one life.") : "");
  var midnight = new Date(date + "T00:00:00Z").getTime() + 24 * 3600 * 1000;
  var left = Math.max(0, midnight - Date.now()) / 60000;
  $("#dailyNext").text("Next challenge in " + Math.floor(left / 60) + "h " + Math.floor(left % 60) + "m");

  storage.loadDailies(function (book) {
    storage.loadRoster(function (games) {
      var today = book[date];
      var hero = null;
      Object.keys(games).forEach(function (k) {
        var g = games[k];
        if (g.daily && g.daily.date == date) hero = g;
      });
      // Settled entries in the book win over what the hero's save says
      var status = today ? today.status : "";
      if (hero && hero.daily.status) status = hero.daily.status;
      $("#dailyStart").toggle(!today).prop("disabled", false);
      $("#dailyResume").toggle(!!(today && hero && !hero.dead))
        .attr("href", hero ? "main.html#" + EncodeName(hero.Traits.Name) : "#")
        .text(status && status != "started" ? "Visit today's hero" : "Resume today's hero");
      if (today && !hero) $("#dailyNext").text("Today's try: " + DailyStatusText(today) + ". " + $("#dailyNext").text());
      else if (today && status && status != "started")
        $("#dailyNext").text("Today: " + DailyStatusText({ status: status, played: hero.daily.played }) + ". " + $("#dailyNext").text());

      var past = Object.keys(book).sort().reverse().slice(0, 10).map(function (d) { return book[d]; });
      if (!past.length) { $("#dailyPast").empty(); return; }
      var table = $("<table>");
      past.forEach(function (e) {
        table.append($("<tr>")
          .append($("<td>").text(e.date))
          .append($("<td>").text(e.name + ", " + e.race + " " + e.klass))
          .append($("<td>").text(e.label))
          .append($("<td>").addClass(e.status).text(DailyStatusText(e) +
            (e.cheater || !SealOk(e) ? " \u26a0" : ""))
            .attr("title", e.cheater ? "Branded a cheater: " + e.cheater : !SealOk(e) ? "Edited outside the game" : "")));
      });
      $("#dailyPast").empty().append($("<b>").text("Your dailies")).append(table);
    });
  });
}

// One try a day: make the hero, write it in the book, and play
function StartDaily() {
  var date = DailyDate();
  $("#dailyStart").prop("disabled", true);
  storage.loadDailies(function (book) {
    if (book[date]) { ShowDailyCard(); return; }
    storage.loadRoster(function (games) {
      var hero = MakeDaily(date);
      var name = hero.Traits.Name, base = name, n = 2;
      while (games[name]) name = base + " " + toRomanLite(n++);
      hero.Traits.Name = name;
      storage.addToRoster(hero, function () {
        storage.noteDaily(date, {
          date: date, name: name, race: hero.Traits.Race, klass: hero.Traits.Class,
          label: hero.daily.label, status: "started", startedAt: hero.daily.startedAt
        }, function () {
          window.location.href = "main.html#" + EncodeName(name);
        });
      });
    });
  });
}

function toRomanLite(n) {
  return ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] || String(n);
}

// ---- Custom Run ---------------------------------------------------------------

function ShowCustomCard() {
  var box = $("#customMutators");
  if (!box.children().length)
    K.Mutators.forEach(function (m) {
      box.append($("<label>").attr("title", m.help)
        .append($("<input type=checkbox>").val(m.key)).append(" " + m.label));
    });
  // New Game+ needs a legend in the Hall
  $("#customPlusLabel").toggleClass("disabled", !legendCount)
    .attr("title", legendCount ? "" : "Retire a hero to the Hall of Legends first")
    .find("input").prop("disabled", !legendCount);
}

function StartCustom() {
  var mode = $("input[name=customMode]:checked").val() || "";
  var seedText = String($("#customSeed").val() || "").trim().slice(0, 64);
  var muts = $("#customMutators input:checked").map(function () { return this.value; }).get();
  var extra = [];
  if (seedText) extra.push("seed=" + encodeURIComponent(seedText));
  if (muts.length) extra.push("mut=" + muts.join(","));
  OpenWindow("dlgNew", mode, extra.join("&"));
}

// How many heroes are in the Hall (New Game+ unlocks at 1), and the menu
// badges that depend on it
var legendCount = 0;
function ShowLegendCount(legends) {
  legendCount = legends.filter(LegendCounts).length;   // New Game+ needs one that counts
  $("#hallCount").text(legends.length ? legends.length : "");
  var hall = LegacyFromHall(legends);
  var honored = hall.races.length + hall.klasses.length;
  $("#plusCount").text(legends.length ? honored + "/" + (K.Races.length + K.Klasses.length) : "")
    .attr("title", legends.length ? "Races and classes honored. New Game+ heroes start with " +
          LegacySummary(hall.bonus) : "");
  $("#plusLocked").toggle(!legends.length);
}

// ---- Resume: saved characters ----------------------------------------------

function LoadRoster() {
  if (!HasLocalStorage() && !window.openDatabase) {
    $("#roster").html('<div class="empty"><b>Hrumph:</b> this browser will not let us save anything. ' +
      'You can still play fast and loose: your hero lives only as long as the game stays open.</div>');
    return;
  }
  storage.loadRoster(ShowRoster);
}

function ShowRoster(games) {
  var list = $("#roster").empty();
  var lit = DecodeName((window.location.hash.split("=")[1]) || "");
  var heroes = Object.keys(games).map(function (k) { return games[k]; })
    .sort(function (a, b) { return (b.stamp || 0) - (a.stamp || 0); });

  $("#resumeCount").text(heroes.length ? heroes.length : "");

  if (!heroes.length) {
    list.html('<div class="empty">No saved heroes yet. ' +
      '<a href="#new" id="rollOne">Roll one up</a> to get started.</div>');
    $("#rollOne").on("click", function (e) { e.preventDefault(); OpenWindow("dlgNew"); });
    return;
  }

  $.each(heroes, function (i, c) {
    var name = c.Traits.Name;
    var row = $(document.getElementById("rosterRow").content.cloneNode(true)).children().first();
    row.find(".name").text(name);
    row.find(".what").text("the " + c.Traits.Race);
    row.find(".where").text("Level " + c.Traits.Level + " " + c.Traits.Class +
                            (c.bestplot ? " · " + c.bestplot : "") +
                            (c.finale && c.finale.state == "won" ? " · Beat the Old Bastard\u2122, ready to retire" : "") +
                            (c.mode == "plus" ? " \u00b7 New Game+" : "") +
                            (c.mode == "hardcore" ? " \u00b7 \u2620 Hardcore" : "") +
                            RunTags(c.daily && c.daily.date, c.mutators, c.runSeed) +
                            (c.cheater || SaveSealState(c) == "bad" ? " \u00b7 \u26a0 branded a cheater" : ""));
    var href = "main.html#" + EncodeName(name);
    row.find(".play").attr("href", href);
    row.on("dblclick", function () { window.location.href = href; })
       .on("keydown", function (e) { if (e.key === "Enter" && e.target === this) window.location.href = href; });
    row.find(".save")
      .attr("href", "data:text/plain;name=" + encodeURIComponent(name) + ".pqw," + b64_stringify(c))
      .attr("download", name + ".pqw");
    row.find(".del").on("click", function () {
      if (!confirm("Terminate " + Pick(["faithful", "noble", "loyal", "brave"]) + " " + name + "?")) return;
      storage.loadRoster(function (all) {
        delete all[name];
        storage.storeRoster(all, LoadRoster);
      });
    });
    if (name === lit) row.addClass("lit");
    list.append(row);
  });
}

// Import .pqw backups, from the file picker or dropped on the page
function ImportSaves(files) {
  $.each(files, function (i, file) {
    file.text().then(function (sheet) {
      try {
        sheet = b64_decode(sheet.replace(/\s/g, ""));
        if (!sheet || !sheet.Traits || !sheet.Traits.Name)
          throw new Error("No character in file");
      } catch (err) {
        alert(file.name + " doesn't look like a Progress Quest save.");
        return;
      }
      // Hardcore heroes stay dead: no bringing one back from a backup
      var fallenNow = null;
      storage.loadFallen(function (f) { fallenNow = f; });
      var verdict = null;
      storage.loadLedger(function (entries, trusted) { verdict = LedgerVerdict(sheet, entries, trusted); });
      if (IsFallen(sheet, fallenNow) || verdict == "dead") {
        alert(sheet.Traits.Name + " died in Hardcore and is in the Hall of the Fallen. Hardcore heroes stay dead.");
        return;
      }
      if (verdict == "older") {
        alert(file.name + " is an older copy of " + sheet.Traits.Name + " than the one this browser last saved. " +
              "Hardcore heroes can't go back in time.");
        return;
      }
      if (verdict == "tampered") {
        alert("This browser's Hardcore ledger was edited, so Hardcore backups can't be imported here.");
        return;
      }
      // An edited backup (or one with its seal removed) imports branded
      if (SaveSealState(sheet) == "bad" && !sheet.cheater) {
        sheet.cheater = { reason: "it was imported from a backup file that had been edited",
                          at: new Date().toISOString(), level: parseInt(sheet.Traits.Level, 10) || 0 };
        alert(file.name + " was edited outside the game. " + sheet.Traits.Name +
              " has been branded a cheater.");
      }
      storage.loadRoster(function (games) {
        if (!games[sheet.Traits.Name] ||
            confirm("A character named " + sheet.Traits.Name + " already exists. Overwrite it?")) {
          storage.addToRoster(sheet, function () {
            if (!$("#dlgResume")[0].open) OpenWindow("dlgResume"); else LoadRoster();
          });
        }
      });
    });
  });
}

function EnableDropImport() {
  window.addEventListener("dragover", function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    $("#roster").addClass("dropping");
  });
  window.addEventListener("dragleave", function () { $("#roster").removeClass("dropping"); });
  window.addEventListener("drop", function (e) {
    e.preventDefault();
    $("#roster").removeClass("dropping");
    if (e.dataTransfer.files.length) ImportSaves(e.dataTransfer.files);
  });
}

// ---- Hall of Legends ---------------------------------------------------------

function LoadHall() {
  storage.loadLegends(ShowHall);
  storage.loadFallen(ShowFallen);
}

// The Hall of the Fallen: Hardcore heroes who died, newest first
function ShowFallen(fallen) {
  fallen = fallen.slice().sort(function (a, b) { return (b.died || "").localeCompare(a.died || ""); });
  $("#fallenCount").text(fallen.length ? "(" + fallen.length + ")" : "");
  var list = $("#fallen").empty();
  if (!fallen.length) {
    list.html('<div class="empty">Nobody has died in Hardcore yet. Give it time.</div>');
    return;
  }
  $.each(fallen, function (i, o) {
    var row = $(document.getElementById("fallenRow").content.cloneNode(true)).children().first();
    row.find(".name").text(o.name);
    row.find(".what").text("the " + o.race);
    var when = o.died ? new Date(o.died).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }) : "";
    row.find(".where").text("Level " + o.level + " " + o.klass + (when ? " \u00b7 died " + when : "") +
                            (SealOk(o) ? "" : " \u00b7 \u26a0 this entry was edited"));
    row.find(".feat").text((o.cause || ("Slain by " + o.slainBy)) + ", " + Hours(o.played || 0) + " in, after " +
      (o.survived || 0).toLocaleString() + (o.survived == 1 ? " defeat" : " defeats") + " survived" +
      (o.chance ? " (this one: a " + Math.round(o.chance * 10000) / 100 + "% chance)" : ""));
    row.find(".words").text(o.lastWords ? "\u201c" + o.lastWords + "\u201d" : "");
    row.find(".epitaph").text(o.epitaph || "");
    if (hallHighlight == "fallen" && i == 0) row.addClass("lit");
    row.find(".del").on("click", function () {
      if (!confirm("Remove " + o.name + "'s obituary from the Hall of the Fallen?")) return;
      storage.loadFallen(function (all) {
        storage.storeFallen(all.filter(function (x) { return x.id !== o.id; }), function () { storage.loadFallen(ShowFallen); });
      });
    });
    list.append(row);
  });
  if (hallHighlight == "fallen") {
    var head = document.getElementById("fallenHead");
    if (head) head.scrollIntoView({ block: "start" });
  }
}

function Ordinal(n) {
  var s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function Hours(seconds) {
  var h = seconds / 3600;
  return h < 10 ? h.toFixed(1) + " hours" : Math.round(h).toLocaleString() + " hours";
}

function ShowHall(legends) {
  ShowLegendCount(legends);
  legends = legends.slice().sort(function (a, b) { return (b.retired || "").localeCompare(a.retired || ""); });
  var list = $("#legends").empty();

  // Which races and classes have been honored, and by whom
  var byRace = {}, byKlass = {};
  $.each(legends.filter(LegendCounts), function (i, l) {
    (byRace[l.race] = byRace[l.race] || []).push(l.name);
    (byKlass[l.klass] = byKlass[l.klass] || []).push(l.name);
  });
  function chips(target, names, by, counter) {
    var box = $(target).empty(), honored = 0;
    $.each(names, function (i, n) {
      var who = by[n];
      if (who) ++honored;
      $("<span>").text(n).toggleClass("honored", !!who)
        .attr("title", who ? "Honored by " + who.join(", ") : "Not yet honored")
        .appendTo(box);
    });
    $(counter).text(honored + " of " + names.length);
    return honored;
  }
  var races = K.Races.map(function (r) { return r.split("|")[0]; });
  var klasses = K.Klasses.map(function (k) { return k.split("|")[0]; });
  var hr = chips("#raceChips", races, byRace, "#raceCount");
  var hk = chips("#klassChips", klasses, byKlass, "#klassCount");

  if (!legends.length) {
    $("#hallSummary").text("The Hall is empty, for now.");
    list.html('<div class="empty">Reach level ' + FinaleLevel() + ', defeat the Old Bastard\u2122, ' +
              'and retire your hero to be remembered here forever (or until you clear your browser data).</div>');
  } else {
    var voided = legends.filter(function (l) { return !LegendCounts(l); }).length;
    $("#hallSummary").text(legends.length + (legends.length == 1 ? " legend" : " legends") +
      (voided ? " (" + voided + " not counted)" : "") +
      " \u00b7 " + hr + " of " + races.length + " races and " + hk + " of " + klasses.length + " classes honored" +
      " \u00b7 New Game+ bonus +" + Math.round(LegacyAverage(LegacyFromHall(legends).bonus) * 1000) / 10 + "% on average");
  }

  $.each(legends, function (i, l) {
    var row = $(document.getElementById("legendRow").content.cloneNode(true)).children().first();
    row.find(".name").text(l.name);
    row.find(".what").text("the " + l.race);
    var when = l.retired ? new Date(l.retired).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }) : "";
    row.find(".where").text("Level " + l.level + " " + l.klass + (l.mode == "plus" ? " \u00b7 New Game+" : "") +
                            (l.mode == "hardcore" ? " \u00b7 \u2620 Hardcore" : "") +
                            RunTags(l.daily, l.mutators, l.runSeed) +
                            (when ? " \u00b7 retired " + when : ""));
    row.find(".feat").text("Beat the Old Bastard\u2122 at level " + l.wonLevel + ", " + Hours(l.wonAt || 0) +
      " in, " + (l.tries > 1 ? "on the " + Ordinal(l.tries) + " try" : "on the first try") +
      " \u00b7 defeated " + (l.deaths || 0).toLocaleString() + (l.deaths == 1 ? " time" : " times") +
      " \u00b7 " + Hours(l.played || 0) + " played");
    row.find(".best").text([l.bestequip, l.bestspell, l.beststat].filter(Boolean).join(" / "));
    row.find(".taunt").text(l.taunt ? "\u201c" + l.taunt + "\u201d (the Old Bastard\u2122, in the Prologue)" : "");
    if (l.id === hallHighlight) row.addClass("lit");
    if (!LegendCounts(l)) {
      row.addClass("void");
      row.find(".where").append($("<span class='voided'>").text(
        " \u00b7 \u26a0 " + (l.cheater ? "branded a cheater (" + l.cheater + ")" :
                               !SealOk(l) ? "this entry was edited" : "started at level " + l.startLevel) +
        "; doesn't count for New Game+"));
    }
    row.find(".del").on("click", function () {
      if (!confirm("Remove " + l.name + " from the Hall of Legends? Their race and class will no longer count as honored.")) return;
      storage.loadLegends(function (all) {
        storage.storeLegends(all.filter(function (x) { return x.id !== l.id; }), LoadHall);
      });
    });
    list.append(row);
  });
  var lit = list.find(".lit")[0];
  if (lit) lit.scrollIntoView({ block: "nearest" });

  $("#hallBackup")
    .attr("href", "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(legends, null, 1)))
    .attr("download", "hall-of-legends.json");
}

// The finale level lives in combat.js (K.Boss), which the menu doesn't load
function FinaleLevel() {
  return (K.Boss && K.Boss.Level) || 50;
}

// Add legends from a backup (ones already here are left alone)
function RestoreHall(file) {
  file.text().then(function (text) {
    var incoming;
    try {
      incoming = JSON.parse(text);
      if (!Array.isArray(incoming)) throw new Error("not a list");
      incoming = incoming.filter(function (l) { return l && l.id && l.name && l.race && l.klass; });
    } catch (e) {
      alert(file.name + " doesn't look like a Hall of Legends backup.");
      return;
    }
    storage.loadLegends(function (legends) {
      var have = {};
      $.each(legends, function (i, l) { have[l.id] = true; });
      // Only legends the game wrote (sealed and untouched) come back
      var edited = incoming.filter(function (l) { return !SealOk(l); }).length;
      var added = incoming.filter(function (l) { return SealOk(l) && !have[l.id]; });
      storage.storeLegends(legends.concat(added), function () {
        LoadHall();
        alert((added.length ? "Restored " + added.length + (added.length == 1 ? " legend." : " legends.")
                            : "No new legends to restore.") +
              (edited ? " " + edited + (edited == 1 ? " entry was" : " entries were") +
                        " left out because the backup had been edited." : ""));
      });
    });
  });
}

// ---- Taskbar clock ---------------------------------------------------------

function TickClock() {
  var now = new Date();
  $("#clock").text(now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
}

$(function () {
  $("[data-open]").on("click", function () { OpenWindow($(this).data("open")); });
  $(document).on("click", "[data-close]", function () { this.closest("dialog").close(); });

  // A click on the backdrop closes info windows (not the New Game one,
  // where a stray click would throw away a good roll)
  $("dialog").on("click", function (e) {
    if (e.target === this && this.id !== "dlgNew") this.close();
  }).on("close", function () {
    if (this.id == "dlgNew") $("#newguyFrame").attr("src", "about:blank");
    if (!$("dialog[open]").length) history.replaceState(null, "", window.location.pathname);
  });

  // The roller asks to be closed (its Cancel / close box)
  window.addEventListener("message", function (e) {
    if (e.origin === window.location.origin && e.data === "pq-close-newguy")
      document.getElementById("dlgNew").close();
  });

  $("#start").on("click", CloseWindows);
  $("#importFile").on("change", function () { ImportSaves(this.files); this.value = ""; });
  $("#hallRestore").on("change", function () { if (this.files[0]) RestoreHall(this.files[0]); this.value = ""; });
  $("#startHardcore").on("click", function () { OpenWindow("dlgHardcore"); });
  $("#dailyStart").on("click", StartDaily);
  $("#customStart").on("click", StartCustom);

  EnableDropImport();
  TickClock();
  setInterval(TickClock, 15000);

  // Show how many heroes are waiting, then open any window the URL asks for
  if (HasLocalStorage() || window.openDatabase)
    storage.loadRoster(function (games) {
      var n = Object.keys(games).length;
      $("#resumeCount").text(n ? n : "");
    });
  if (HasLocalStorage() || window.openDatabase)
    storage.loadLegends(ShowLegendCount);
  $(".finaleLevel").text(FinaleLevel());
  WindowFromHash();
  $(window).on("hashchange", WindowFromHash);
});
