// The main menu (index.html): New Game, Resume, and the windows for the
// modes that are still to come. Depends on config.js (storage, EncodeName,
// DecodeName, Pick).

function b64_decode(value) {
  return JSON.parse(decodeURIComponent(escape(atob(value))));
}

function b64_stringify(value) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(value))));
}

// ---- Windows --------------------------------------------------------------

function OpenWindow(id) {
  var dlg = document.getElementById(id);
  if (!dlg) return;
  $("dialog[open]").each(function () { if (this !== dlg) this.close(); });
  if (id == "dlgNew") StartNewGame();
  if (id == "dlgResume") LoadRoster();
  if (id == "dlgFaq" && !$("#faqFrame").attr("src")) $("#faqFrame").attr("src", "faq.php");
  if (!dlg.open) dlg.showModal();
  // a link to index.html#resume (or #new...) opens that window
  history.replaceState(null, "", "#" + id.replace(/^dlg/, "").toLowerCase());
}

function CloseWindows() {
  $("dialog[open]").each(function () { this.close(); });
}

// index.html#resume, #new, #plus, #hall, #challenge, #faq, #github
function WindowFromHash() {
  var name = (window.location.hash || "").slice(1).toLowerCase();
  var ids = { "new": "dlgNew", resume: "dlgResume", plus: "dlgPlus", hall: "dlgHall",
              challenge: "dlgChallenge", faq: "dlgFaq", github: "dlgGitHub" };
  if (ids[name]) OpenWindow(ids[name]);
}

// The character roller runs in its own page (newguy.html) inside the New
// Game window. It is reloaded each time, so every visit is a fresh roll.
function StartNewGame() {
  $("#newguyFrame").attr("src", "newguy.html?embed");
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
                            (c.bestplot ? " · " + c.bestplot : ""));
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

  EnableDropImport();
  TickClock();
  setInterval(TickClock, 15000);

  // Show how many heroes are waiting, then open any window the URL asks for
  if (HasLocalStorage() || window.openDatabase)
    storage.loadRoster(function (games) {
      var n = Object.keys(games).length;
      $("#resumeCount").text(n ? n : "");
    });
  WindowFromHash();
  $(window).on("hashchange", WindowFromHash);
});
