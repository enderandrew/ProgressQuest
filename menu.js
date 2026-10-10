// The main menu (index.html): New Game, Resume, the Hall, and Challenge
// Modes. Depends on config.js (storage, EncodeName, DecodeName, Pick), and
// on story.js, combat.js and daily.js for the Daily Challenge.

// (b64_decode and b64_stringify are in transfer.js)

// ---- Windows --------------------------------------------------------------

function OpenWindow(id, mode, custom) {
  // New Game+ is the character roller with a legacy, once someone has
  // retired to the Hall; until then its window explains how to unlock it.
  // Hardcore (from Challenge Modes) is the roller too.
  var plus = id == "dlgPlus" && legendCount > 0;
  if (plus) { id = "dlgNew"; mode = "plus"; }
  if (id == "dlgHardcore") { id = "dlgNew"; mode = "hardcore"; }
  var dlg = document.getElementById(id);
  if (!dlg) return;
  $("dialog[open]").each(function () { if (this !== dlg) this.close(); });
  if (id == "dlgNew") StartNewGame(mode, custom);
  if (id == "dlgChallenge") ShowChallenges();
  if (id == "dlgCodex") CodexLoad(function () { ShowCodex(); CodexBadge(); });
  if (id == "dlgResume") LoadRoster();
  if (id == "dlgHall") LoadHall();
  if (id == "dlgFaq" && !$("#faqFrame").attr("src")) $("#faqFrame").attr("src", "faq.html");
  if (!dlg.open) dlg.showModal();
  // a link to index.html#resume (or #new...) opens that window
  history.replaceState(null, "", "#" + (mode || id.replace(/^dlg/, "").toLowerCase()));
}

function CloseWindows() {
  $("dialog[open]").each(function () { this.close(); });
}

// index.html#resume, #new, #plus, #hall, #challenge, #codex, #faq, #github
// index.html#hall/<id> opens the Hall with that legend highlighted (a hero
// who just retired); index.html#resume/<life ID> the Resume list with that
// hero highlighted (the one you just left). Challenge links (transfer.js):
// #custom/<seed>/<mutators>[/<mode>] and #vs/<code>[/<code>].
var hashTarget = "";
function WindowFromHash() {
  var parts = (window.location.hash || "").slice(1).split("/");
  var name = parts[0].toLowerCase();
  if (name == "custom") { OpenCustomLink(parts.slice(1)); return; }
  if (name == "vs") { OpenVersus(parts.slice(1).filter(Boolean).slice(0, 2)); return; }
  hashTarget = DecodeName(parts[1] || "");
  var ids = { "new": "dlgNew", resume: "dlgResume", plus: "dlgPlus", hall: "dlgHall",
              challenge: "dlgChallenge", hardcore: "dlgHardcore", codex: "dlgCodex", faq: "dlgFaq", github: "dlgGitHub" };
  if (ids[name]) OpenWindow(ids[name]);
}

// The character roller runs in its own page (newguy.html) inside the New
// Game window. It is reloaded each time, so every visit is a fresh roll.
// mode: "plus" or "hardcore" (or none); custom: a Custom Run's { seed, mut }
function StartNewGame(mode, custom) {
  var q = new URLSearchParams();
  q.set("embed", "");
  if (mode) q.set(mode, "");
  custom = custom || {};
  if (custom.seed) q.set("seed", custom.seed);
  if (custom.mut && custom.mut.length) q.set("mut", custom.mut.join(","));
  $("#dlgNewTitle").text((mode == "plus" ? "New Character (New Game+)" :
                          mode == "hardcore" ? "New Character (\u2620 Hardcore)" : "New Character") +
                         (custom.seed || (custom.mut || []).length ? " \u2014 custom run" : ""));
  // (flags without the "=": newguy.html?embed&plus&seed=abc)
  $("#newguyFrame").attr("src", "newguy.html?" + q.toString().replace(/=(?=&|$)/g, ""));
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
    .append($("<div class=perks>").text("Perks: " + plan.perks.map(function (k) { return PerkByKey(k).label; }).join(", "))
      .attr("title", plan.perks.map(function (k) { return PerkText(PerkByKey(k)); }).join("\n")))
    .append(plan.hardcore ? $("<div class=hc>").text("\u2620 Hardcore: one life.") : "");
  var midnight = new Date(date + "T00:00:00Z").getTime() + 24 * 3600 * 1000;
  var left = Math.max(0, midnight - Date.now()) / 60000;
  $("#dailyNext").text("Next challenge in " + Math.floor(left / 60) + "h " + Math.floor(left % 60) + "m");

  storage.loadDailies(function (book) {
    storage.listHeroes(function (heroes) {
      var today = book[date];
      var hero = heroes.filter(function (h) { return h.daily && h.daily.date == date; })[0] || null;
      // Settled entries in the book win over what the hero's save says
      var status = today ? today.status : "";
      if (hero && hero.daily.status) status = hero.daily.status;
      $("#dailyStart").toggle(!today).prop("disabled", false);
      $("#dailyResume").toggle(!!(today && hero && !hero.dead))
        .attr("href", hero ? "main.html#" + EncodeName(hero.id) : "#")
        .text(status && status != "started" ? "Visit today's hero" : "Resume today's hero");
      if (today && !hero) $("#dailyNext").text("Today's try: " + DailyStatusText(today) + ". " + $("#dailyNext").text());
      else if (today && status && status != "started")
        $("#dailyNext").text("Today: " + DailyStatusText({ status: status, played: hero.daily.played }) + ". " + $("#dailyNext").text());

      var past = Object.keys(book).sort().reverse().slice(0, 10).map(function (d) { return book[d]; });
      if (!past.length) { $("#dailyPast").empty(); return; }
      var table = $("<table>");
      past.forEach(function (e) {
        var mine = heroes.filter(function (h) { return h.daily && h.daily.date == e.date; })[0];
        table.append($("<tr>")
          .append($("<td>").text(e.date))
          .append($("<td>").text(e.name + ", " + e.race + " " + e.klass))
          .append($("<td>").text(e.label))
          .append($("<td>").addClass(e.status).text(DailyStatusText(e) +
            (e.cheater || !SealOk(e) ? " \u26a0" : ""))
            .attr("title", e.cheater ? "Branded a cheater: " + e.cheater : !SealOk(e) ? "Edited outside the game" : ""))
          .append($("<td>").append($("<a href=#>").text("Share").attr("title",
            "A link that shows this hero beside someone else's from the same day")
            .on("click", function (ev) { ev.preventDefault(); ShareDailyEntry(e, mine); }))));
      });
      $("#dailyPast").empty().append($("<b>").text("Your dailies")).append(table);
    });
  });
}

// Share a past Daily: from the hero if they're still on the roster (the
// whole picture), otherwise from what the book kept
function ShareDailyEntry(e, summary) {
  var share = function (payload) {
    ShareCodeFor(payload).then(function (code) {
      ShareLinkBox({ title: "Share Daily Result", url: VersusUrl([code]),
        text: "Send this to someone who played the " + e.date + " Daily Challenge (" + e.label + "). " +
              "The link shows " + e.name + " beside their own hero for that day. No server: everything is in the link.",
        shareTitle: "Daily Challenge " + e.date, shareText: e.name + " vs. you: the " + e.date + " Daily" });
    });
  };
  if (summary) storage.loadHero(summary.id, function (sheet) { share(sheet ? VersusPayload(sheet) : VersusPayloadFromBook(e)); });
  else share(VersusPayloadFromBook(e));
}

// ---- Side by side (index.html#vs/<code>[/<code>]) --------------------------------

function OpenVersus(codes) {
  var dlg = document.getElementById("dlgVersus");
  if (!dlg) return;
  $("dialog[open]").each(function () { if (this !== dlg) this.close(); });
  $("#versusBody").empty().append($("<p class=dim>").text("Reading the link…"));
  $("#versusNote").text("");
  $("#versusCopy").prop("disabled", true);
  if (!dlg.open) dlg.showModal();
  if (!codes.length) { VersusError("This link has no heroes in it."); return; }
  Promise.all(codes.map(ReadShareCode)).then(function (heroes) {
    if (heroes.some(function (h) { return !h || !h.v || !h.n; })) throw new Error("not a hero");
    if (heroes.length == 2) { ShowVersus(heroes[0], heroes[1], codes); return; }
    // one hero: find yours from the same challenge
    YourVersusHero(heroes[0], function (yours) {
      if (!yours) { ShowVersus(heroes[0], null, codes); return; }
      ShareCodeFor(yours).then(function (code) { ShowVersus(heroes[0], yours, [codes[0], code], true); },
                               function () { ShowVersus(heroes[0], yours, codes, true); });
    });
  }).catch(function () { VersusError("This link couldn't be read. It may have been cut short when it was copied."); });
}

function VersusError(text) {
  $("#versusBody").empty().append($("<p class=error>").text(text));
}

// Your hero for the same Daily (or the same seed and mutators), newest first;
// for a Daily you no longer have, what the Daily book kept
function YourVersusHero(theirs, callback) {
  storage.listHeroes(function (list) {
    var hit = list.filter(function (h) {
      if (theirs.dy) return h.daily && h.daily.date == theirs.dy.date;
      return !h.daily && theirs.seed && h.runSeed == theirs.seed &&
             (h.mutators || []).slice().sort().join() == (theirs.mut || []).slice().sort().join();
    })[0];
    if (hit) { storage.loadHero(hit.id, function (sheet) { callback(sheet ? VersusPayload(sheet) : null); }); return; }
    if (!theirs.dy) { callback(null); return; }
    storage.loadDailies(function (book) {
      var e = book[theirs.dy.date];
      callback(e ? VersusPayloadFromBook(e) : null);
    });
  });
}

// Who's ahead: +1 the first, -1 the second, 0 a tie (or not comparable)
function VersusLead(a, b, same) {
  var sign = function (x) { return x > 0 ? 1 : x < 0 ? -1 : 0; };
  if (same == "daily") {
    var rank = function (h) { return h.dy.s == "done" ? 2 : h.dy.s == "died" ? 0 : 1; };
    if (rank(a) != rank(b)) return sign(rank(a) - rank(b));
    if (a.dy.s == "done") return sign(b.dy.p - a.dy.p);          // less play to finish wins
    return sign(a.dy.pr - b.dy.pr);                                // otherwise, further along
  }
  if (same == "seed") return sign(a.l - b.l) || sign(b.el - a.el);   // higher level, then quicker
  return 0;
}

// mine: b is your own hero, from this browser
function ShowVersus(a, b, codes, mine) {
  var same = b ? SameChallenge(a, b) : "";
  var lead = b ? VersusLead(a, b, same) : 0;
  var verified = function (h) { return SealOk(h) && !h.ch && !h.uv; };
  var hours = function (sec) { return sec ? Hours(sec) : "—"; };
  var perk = function (k) { var p = typeof PerkByKey == "function" && PerkByKey(k); return p ? p.label : k; };
  var mutators = function (h) {
    return (h.mut || []).map(function (k) { var m = K.Mutators.filter(function (x) { return x.key == k; })[0]; return m ? m.label : k; }).join(", ");
  };
  var rows = [
    ["Hero", function (h) { return h.n; }],
    ["", function (h) { return (h.l ? "Level " + h.l + " " : "") + h.r + " " + h.c; }],
    ["Challenge", function (h) { return h.dy ? "Daily " + h.dy.date + ": " + h.dy.label :
                                        h.seed ? "Seed “" + h.seed + "”" : "No seed (a random roll)"; }],
    ["Result", function (h) {
      if (!h.dy) return h.dead ? "☠ " + h.dead : h.fin ? "Beat the Old Bastard™ at level " + h.fin : "Still going";
      return h.dy.s == "done" ? "✔ Done in " + hours(h.dy.p) + " of play" :
             h.dy.s == "failed" ? "✘ Out of time (" + (h.dy.pr || 0).toLocaleString() + " of " + (h.dy.t || 0).toLocaleString() + ")" :
             h.dy.s == "died" ? "☠ Died trying" : "Under way: " + (h.dy.pr || 0).toLocaleString() + " of " + (h.dy.t || 0).toLocaleString(); }],
    ["Time played", function (h) { return hours(h.el); }],
    ["Fights", function (h) { return h.partial ? "—" : h.w.toLocaleString() + " won, " + h.d.toLocaleString() + " lost"; }],
    ["Quests", function (h) { return h.partial ? "—" : h.qd.toLocaleString(); }],
    ["Stats", function (h) { return (h.st || []).length ? K.Stats.slice(0, 6).map(function (s, i) { return s + " " + h.st[i]; }).join(" · ") : "—"; }],
    ["HP / MP", function (h) { return (h.st || []).length ? h.st[6] + " / " + h.st[7] : "—"; }],
    ["Gear power", function (h) { return h.gp ? h.gp + (h.best ? " (best: " + h.best + ")" : "") : "—"; }],
    ["Spells", function (h) { return h.sp ? h.sp : "—"; }],
    ["Perks", function (h) { return (h.pk || []).map(perk).join(", ") || "—"; }],
    ["Mutators", function (h) { return mutators(h) || "—"; }],
    ["As of", function (h) { return h.at ? new Date(h.at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"; }],
    ["Seal", function (h) { return h.ch ? "⚠ Branded a cheater: " + h.ch : h.uv ? "⚠ Unverified" :
                                   verified(h) ? "✔ Straight from the game" : "⚠ Edited after it was shared"; }]
  ];
  var table = $("<table class=versus-table>");
  var head = $("<tr>").append($("<th>"));
  [a, b].forEach(function (h, i) {
    var ahead = lead == (i ? -1 : 1);
    var who = mine ? (i ? "Yours" : "Theirs") : "";
    head.append($("<th>").toggleClass("leads", ahead).toggleClass("empty", !h)
      .text(!h ? "Your hero goes here" : who + (ahead ? (who ? " · " : "") + "🏆 Ahead" : "")));
  });
  table.append($("<thead>").append(head));
  var body = $("<tbody>").appendTo(table);
  rows.forEach(function (row) {
    var tr = $("<tr>").append($("<th>").text(row[0]));
    [a, b].forEach(function (h) { tr.append($("<td>").text(h ? row[1](h) : "")); });
    body.append(tr);
  });
  $("#versusBody").empty().append(table);
  var note = !b ? (a.dy ? "You don't have a hero for the " + a.dy.date + " Daily in this browser. " +
                         (a.dy.date == DailyDate() ? "It's today's: play it (Challenge Modes), then open this link again." :
                                                     "That day's challenge is over.")
                       : a.seed ? "You haven't played this run. Open Challenge Modes to roll it (same seed, same hero)." :
                                  "This hero wasn't on a seeded run, so there's nothing to play alongside.")
           : same == "daily" ? "Same Daily Challenge, same hero to start with: the rest was choices and patience." +
                               (lead ? "" : " Too close to call.")
           : same == "seed" ? "Same seed and mutators: the same hero to start with." + (lead ? "" : " Neck and neck.")
           : "These two weren't on the same challenge, so there's no winner; here they are anyway.";
  $("#versusNote").text(note);
  $("#versusPlay").toggle(!b && !!a.seed && !a.dy).off("click").on("click", function () {
    window.location.hash = "custom/" + encodeURIComponent(a.seed) + "/" + (a.mut || []).join(",") +
                           (a.mode == "hardcore" ? "/hardcore" : "");
  });
  $("#versusDaily").toggle(!b && !!a.dy && a.dy.date == DailyDate());
  var url = VersusUrl(codes.slice(0, b ? 2 : 1));
  $("#versusCopy").prop("disabled", false).off("click").on("click", function () {
    CopyText(url);
    $(this).text("Copied").delay(1500).queue(function (next) { $(this).text(b ? "Copy link to this comparison" : "Copy link"); next(); });
  }).text(b ? "Copy link to this comparison" : "Copy link");
  history.replaceState(null, "", "#vs/" + codes.slice(0, b ? 2 : 1).join("/"));
}

// One try a day: make the hero, write it in the book, and play
function StartDaily() {
  var date = DailyDate();
  $("#dailyStart").prop("disabled", true);
  storage.loadDailies(function (book) {
    if (book[date]) { ShowDailyCard(); return; }
    storage.listHeroes(function (heroes) {
      var hero = MakeDaily(date);
      // (two heroes can share a name now, but it's clearer if they don't)
      var taken = {};
      heroes.forEach(function (h) { taken[h.name] = true; });
      var name = hero.Traits.Name, base = name, n = 2;
      while (taken[name]) name = base + " " + toRomanLite(n++);
      hero.Traits.Name = name;
      storage.saveHero(hero, function () {
        storage.noteDaily(date, {
          date: date, name: name, race: hero.Traits.Race, klass: hero.Traits.Class,
          label: hero.daily.label, status: "started", startedAt: hero.daily.startedAt
        }, function () {
          window.location.href = "main.html#" + EncodeName(HeroId(hero));
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

// A friend's run (index.html#custom/<seed>/<mutators>[/<mode>]): Challenge
// Modes with the Custom Run filled in, ready to roll
function OpenCustomLink(parts) {
  var seedText = "";
  try { seedText = decodeURIComponent(parts[0] || ""); } catch (e) { seedText = parts[0] || ""; }
  seedText = seedText.slice(0, 64);
  var keys = K.Mutators.map(function (m) { return m.key; });
  var muts = String(parts[1] || "").split(",").filter(function (k) { return keys.indexOf(k) >= 0; });
  var mode = parts[2] == "hardcore" || parts[2] == "plus" ? parts[2] : "";
  OpenWindow("dlgChallenge");
  ShowCustomCard();
  $("#customSeed").val(seedText);
  $("#customMutators input").each(function () { this.checked = muts.indexOf(this.value) >= 0; });
  if (mode == "plus" && !legendCount) mode = "";   // (New Game+ needs a legend of your own)
  $("input[name=customMode][value='" + mode + "']").prop("checked", true);
  var labels = K.Mutators.filter(function (m) { return muts.indexOf(m.key) >= 0; }).map(function (m) { return m.label; });
  $("#customFromLink").text("Someone sent you this run: " +
    (seedText ? "seed “" + seedText + "”" : "a random seed") +
    (labels.length ? ", " + labels.join(", ") : "") + (mode ? ", " + (mode == "plus" ? "New Game+" : "Hardcore") : "") +
    ". Same seed, same hero; make the same choices and it's the same game.").show();
  var card = document.querySelector("#dlgChallenge .mode-card.custom");
  if (card) { card.classList.add("from-link"); card.scrollIntoView({ block: "nearest" }); }
  $("#customStart").trigger("focus");
}

// Share what's filled in on the Custom Run card
function ShareCustom() {
  var mode = $("input[name=customMode]:checked").val() || "";
  var seedText = String($("#customSeed").val() || "").trim().slice(0, 64);
  var muts = $("#customMutators input:checked").map(function () { return this.value; }).get();
  if (!seedText) {
    WinBox({ title: "Share This Run", icon: "info",
             text: "Give the run a seed first: without one, every hero is rolled at random and nobody gets the same game." });
    return;
  }
  ShareLinkBox({ title: "Share This Run", url: ChallengeUrl(seedText, muts, mode),
    text: "Anyone who opens this link gets the same Custom Run: the same seed rolls the same hero, " +
          "and with the same choices plays the same game. Then send each other your heroes " +
          "(File > Share This Run in the game) to compare them side by side.",
    shareTitle: "A Progress Quest Remix run", shareText: "Try this run: seed “" + seedText + "”" });
}

function StartCustom() {
  var mode = $("input[name=customMode]:checked").val() || "";
  var seedText = String($("#customSeed").val() || "").trim().slice(0, 64);
  var muts = $("#customMutators input:checked").map(function () { return this.value; }).get();
  OpenWindow("dlgNew", mode, { seed: seedText, mut: muts });
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
  if (!HasLocalStorage() && typeof indexedDB == "undefined") {
    $("#roster").html('<div class="empty"><b>Hrumph:</b> this browser will not let us save anything. ' +
      'You can still play fast and loose: your hero lives only as long as the game stays open.</div>');
    return;
  }
  storage.listHeroes(ShowRoster);
}

// heroes: HeroSummary of each (config.js), newest first. Each hero's save is
// read only when it's wanted (Back up, Share).
function ShowRoster(heroes) {
  var list = $("#roster").empty();
  var lit = hashTarget;

  $("#resumeCount").text(heroes.length ? heroes.length : "");

  if (!heroes.length) {
    list.html('<div class="empty">No saved heroes yet. ' +
      '<a href="#new" id="rollOne">Roll one up</a> to get started.</div>');
    $("#rollOne").on("click", function (e) { e.preventDefault(); OpenWindow("dlgNew"); });
    return;
  }

  $.each(heroes, function (i, c) {
    var name = c.name;
    var row = $(document.getElementById("rosterRow").content.cloneNode(true)).children().first();
    row.find(".name").text(name);
    row.find(".what").text("the " + c.race);
    row.find(".where").text("Level " + c.level + " " +
                            (c.alignment ? c.alignment + " " : "") + c.klass +
                            (c.bestplot ? " · " + c.bestplot : "") +
                            (c.won ? " · Beat the Old Bastard\u2122, ready to retire" : "") +
                            (c.mode == "plus" ? " \u00b7 New Game+" : "") +
                            (c.mode == "hardcore" ? " \u00b7 \u2620 Hardcore" : "") +
                            RunTags(c.daily && c.daily.date, c.mutators, c.runSeed) +
                            (c.cheater ? " \u00b7 \u26a0 branded a cheater" :
                             c.unverified ? " \u00b7 unverified" : ""))
      .attr("title", c.unverified && !c.cheater ? "Unverified: " + c.unverified +
                     ". Plays as normal, but won't count for the Hall of Legends or New Game+." : null);
    var href = "main.html#" + EncodeName(c.id);
    row.find(".play").attr("href", href);
    row.on("dblclick", function () { window.location.href = href; })
       .on("keydown", function (e) { if (e.key === "Enter" && e.target === this) window.location.href = href; });
    var withHero = function (fn) {
      storage.loadHero(c.id, function (sheet) {
        if (sheet) fn(sheet); else alert(name + " couldn't be read.");
      });
    };
    row.find(".save").on("click", function () { withHero(function (sheet) { DownloadHero(sheet); }); });
    row.find(".share").on("click", function () { withHero(ShareHero); });
    row.find(".del").on("click", function () {
      if (!confirm("Terminate " + Pick(["faithful", "noble", "loyal", "brave"]) + " " + name + "?")) return;
      storage.deleteHero(c.id, LoadRoster);
    });
    if (c.id === lit || name === lit) row.addClass("lit");
    list.append(row);
  });
}

// Import .pqw backups (from the file picker or dropped on the page),
// through the anti-cheat scan (transfer.js)
function ImportSaves(files) {
  ImportHeroFiles(files, function (sheet) {
    if (!$("#dlgResume")[0].open) OpenWindow("dlgResume"); else LoadRoster();
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
    if (hashTarget == "fallen" && i == 0) row.addClass("lit");
    // A link to their character sheet, as in the Hall of Legends
    var sheetLink = row.find(".sheetlink");
    ShareCodeFor(FallenSheet(o)).then(function (code) {
      sheetLink.attr("href", ShareUrl(code)).prop("hidden", false);
    }, function () {});
    row.find(".del").on("click", function () {
      if (!confirm("Remove " + o.name + "'s obituary from the Hall of the Fallen?")) return;
      storage.loadFallen(function (all) {
        storage.storeFallen(all.filter(function (x) { return x.id !== o.id; }), function () { storage.loadFallen(ShowFallen); });
      });
    });
    list.append(row);
  });
  if (hashTarget == "fallen") {
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
    row.find(".where").text("Level " + l.level + " " + (l.alignment ? l.alignment + " " : "") + l.klass +
                            (l.mode == "plus" ? " \u00b7 New Game+" : "") +
                            (l.mode == "hardcore" ? " \u00b7 \u2620 Hardcore" : "") +
                            RunTags(l.daily, l.mutators, l.runSeed) +
                            (when ? " \u00b7 retired " + when : ""));
    row.find(".feat").text("Beat the Old Bastard\u2122 at level " + l.wonLevel + ", " + Hours(l.wonAt || 0) +
      " in, " + (l.tries > 1 ? "on the " + Ordinal(l.tries) + " try" : "on the first try") +
      " \u00b7 defeated " + (l.deaths || 0).toLocaleString() + (l.deaths == 1 ? " time" : " times") +
      " \u00b7 " + Hours(l.played || 0) + " played");
    row.find(".best").text([l.bestequip, l.bestspell, l.beststat].filter(Boolean).join(" / "));
    row.find(".taunt").text(l.taunt ? "\u201c" + l.taunt + "\u201d (the Old Bastard\u2122, in the Prologue)" : "");
    if (l.id === hashTarget) row.addClass("lit");
    // A link to their character sheet (sheet.html#..., like a share link)
    var sheetLink = row.find(".sheetlink");
    ShareCodeFor(LegendSheet(l)).then(function (code) {
      sheetLink.attr("href", ShareUrl(code)).prop("hidden", false);
    }, function () {});
    if (!LegendCounts(l)) {
      row.addClass("void");
      row.find(".where").append($("<span class='voided'>").text(
        " \u00b7 \u26a0 " + (l.cheater ? "branded a cheater (" + l.cheater + ")" :
                               !SealOk(l) ? "this entry was edited" :
                               l.unverified ? "unverified (" + l.unverified + ")" : "started at level " + l.startLevel) +
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
  $("#dlgCodex [data-tab]").on("click", function () { ShowCodex($(this).data("tab")); });
  $("#codexSearch").on("input", function () { ShowCodex(); });
  $("#codexFilter").on("change", function () { ShowCodex(); });
  $("#codexRestore").on("change", function () { if (this.files[0]) RestoreCodex(this.files[0]); this.value = ""; });
  $("#customStart").on("click", StartCustom);
  $("#customShare").on("click", ShareCustom);
  $("#versusDaily").on("click", function () { OpenWindow("dlgChallenge"); });
  // Backups are made when asked for, from what's stored then
  $("#hallBackup").on("click", function (e) {
    e.preventDefault();
    storage.loadLegends(function (legends) {
      DownloadText(JSON.stringify(legends, null, 1), "hall-of-legends.json", "application/json");
    });
  });
  $("#codexBackup").on("click", function (e) {
    e.preventDefault();
    DownloadText(CodexBackupText(), "codex.json", "application/json");
  });

  EnableDropImport();
  TickClock();
  setInterval(TickClock, 15000);

  // Show how many heroes are waiting, then open any window the URL asks for
  storage.listHeroes(function (heroes) {
    $("#resumeCount").text(heroes.length ? heroes.length : "");
  });
  storage.loadLegends(ShowLegendCount);
  $(".finaleLevel").text(FinaleLevel());
  // The Codex, and any achievements the Hall has earned meanwhile
  CodexStart(CodexBadge);
  WindowFromHash();
  $(window).on("hashchange", WindowFromHash);
});
