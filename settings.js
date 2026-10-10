// The Settings window (View > Settings, Edit > Preferences, or O) and the
// Keyboard Shortcuts list (Help > Keyboard Shortcuts, or ?).
//
// Settings are kept in this browser (localStorage, "pq.*"), not in the hero:
// they're how you like to watch, not how the game goes, so they never touch
// a save or a replay. Anything that would change the game itself (the time
// a choice waits, say) isn't here on purpose.
//
// Loaded by main.html, after main.js and menubar.js.

// ---- Stored settings -------------------------------------------------------------

function SettingGet(key, dflt) {
  try { var v = window.localStorage.getItem("pq." + key); return v === null ? dflt : v; } catch (e) { return dflt; }
}

function SettingSet(key, value) {
  try {
    if (value === null || value === undefined) window.localStorage.removeItem("pq." + key);
    else window.localStorage.setItem("pq." + key, String(value));
  } catch (e) {}
}

// Narration: the voice (its voiceURI; "" for the browser's default), speed and volume
function NarrationVoice() {
  if (!window.speechSynthesis) return null;
  var want = SettingGet("voice", "");
  if (!want) return null;
  var hit = window.speechSynthesis.getVoices().filter(function (v) { return v.voiceURI == want; })[0];
  return hit || null;
}
function NarrationRate() { return Math.min(2, Math.max(0.5, parseFloat(SettingGet("rate", "1")) || 1)); }
function NarrationVolume() { return Math.min(1, Math.max(0, parseFloat(SettingGet("volume", "1")))); }

// How long a finished event stays up, in seconds (0: until you close it)
function EventPopupLinger() {
  var v = parseInt(SettingGet("popuplinger", ""), 10);
  return isNaN(v) ? K.EventPopupLinger : v;
}

// Read what happens out to screen readers (Announce in main.js)?
function ScreenReaderOn() { return SettingGet("announce", "1") !== "0"; }

// A word now and then from what the gold bought (CompanyChatter in main.js)?
function ChatterOn() { return SettingGet("chatter", "1") !== "0"; }

// Flash the tab's title while a choice waits?
function ChoiceAlertOn() { return SettingGet("choicealert", "1") !== "0"; }

// ---- The window ---------------------------------------------------------------------

// The settings, as rows: { section, label, help, kind: "check" | "select" |
// "range", get(), set(value), options (select), min/max/step (range), show() }
function SettingsList() {
  var speech = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  var voices = speech ? window.speechSynthesis.getVoices() : [];
  return [
    { section: "Narration", label: "Read events and the story aloud", key: "N", kind: "check",
      get: NarrationOn, set: function (on) { if (on != NarrationOn()) ToggleNarration(); },
      help: speech ? "The browser's own voice reads each scene as it happens." : "This browser can't speak.", disabled: !speech },
    { section: "Narration", label: "Voice", kind: "select", disabled: !speech,
      options: [["", "The browser's default"]].concat(voices.map(function (v) { return [v.voiceURI, v.name + " (" + v.lang + ")"]; })),
      get: function () { return SettingGet("voice", ""); }, set: function (v) { SettingSet("voice", v || null); },
      help: voices.length ? "" : "Voices load a moment after the page does; reopen Settings if the list is short." },
    { section: "Narration", label: "Speed", kind: "range", min: 0.5, max: 2, step: 0.1, disabled: !speech,
      get: NarrationRate, set: function (v) { SettingSet("rate", v); }, format: function (v) { return v.toFixed(1) + "×"; } },
    { section: "Narration", label: "Volume", kind: "range", min: 0, max: 1, step: 0.1, disabled: !speech,
      get: NarrationVolume, set: function (v) { SettingSet("volume", v); }, format: function (v) { return Math.round(v * 100) + "%"; } },

    { section: "Events", label: "Pop up events as they happen", key: "E", kind: "check",
      get: EventPopupsOn, set: function (on) { if (on != EventPopupsOn()) ToggleEventPopups(); },
      help: "Off: they still show in the Last Event box." },
    { section: "Events", label: "A finished event stays up for", kind: "select",
      options: [["5", "5 seconds"], ["12", "12 seconds"], ["30", "30 seconds"], ["60", "a minute"], ["0", "until I close it"]],
      get: function () { return String(EventPopupLinger()); }, set: function (v) { SettingSet("popuplinger", v); } },
    { section: "Events", label: "Flash the tab's title when a choice is waiting", kind: "check",
      get: ChoiceAlertOn, set: function (on) { SettingSet("choicealert", on ? "1" : "0"); if (!on) StopChoiceAlert(); },
      help: "So you notice from another tab. Nobody answers in time? Fate picks." },

    { section: "Display", label: "Combat log beside the game", key: "C", kind: "check",
      get: function () { return $("body").hasClass("show-log"); }, set: function (on) { if (on != $("body").hasClass("show-log")) ToggleCombatLog(); } },
    { section: "Display", label: "Desktop icons", kind: "check",
      get: function () { return !DesktopIconsHidden(); }, set: function (on) { if (on == DesktopIconsHidden()) ToggleDesktopIcons(); } },
    { section: "Display", label: "Your entourage has a word now and then", kind: "check",
      get: ChatterOn, set: function (on) { SettingSet("chatter", on ? "1" : "0"); if (!on) $("#Company").text(""); },
      help: "What your henchman, tutor or pet rock makes of it all, under the fight line. Only for show." },

    { section: "Accessibility", label: "Read out what happens, for screen readers", kind: "check",
      get: ScreenReaderOn, set: function (on) { SettingSet("announce", on ? "1" : "0"); },
      help: "Story scenes, events and level-ups as they happen; choices and deaths straight away. " +
            "Nothing is read while the game catches up on time away (the summary says what happened)." },

    { section: "Advanced", label: "Debug mode", kind: "check",
      get: function () { return SettingGet("debug", "") === "1"; },
      set: function (on) { SettingSet("debug", on ? "1" : null); },
      help: "Writes what the game does to the browser's console (F12). Takes effect when the page reloads." +
            (PQDebug ? " It's on now." : "") }
  ];
}

// Defaults: what Reset puts back
var SettingsDefaults = { narrate: null, voice: null, rate: null, volume: null, eventpopup: null,
                         popuplinger: null, choicealert: null, icons: null, debug: null, announce: null,
                         chatter: null };

function OpenSettings(tab) {
  if (!document) return;
  var box = document.createElement("div");
  box.className = "settings";
  var tabs = $("<div class='settings-tabs' role='tablist'>").appendTo(box);
  var panes = $("<div class='settings-panes'>").appendTo(box);
  var sections = ["Narration", "Events", "Display", "Accessibility", "Advanced", "Keyboard"];
  var show = function (name) {
    tabs.children().each(function () {
      var on = $(this).data("tab") == name;
      $(this).toggleClass("active", on).attr("aria-selected", on);
    });
    panes.children().each(function () { $(this).toggle($(this).data("tab") == name); });
    SettingSet("settingstab", name);
  };
  sections.forEach(function (name) {
    $("<button type='button' role='tab'>").text(name == "Keyboard" ? "Keyboard Shortcuts" : name).attr("data-tab", name)
      .on("click", function () { show(name); }).appendTo(tabs);
    $("<div class='settings-pane' role='tabpanel'>").attr("data-tab", name).appendTo(panes);
  });
  var fill = function () {
    panes.children().each(function () { if ($(this).data("tab") != "Keyboard") $(this).empty(); });
    SettingsList().forEach(function (s, i) {
      var pane = panes.children().filter(function () { return $(this).data("tab") == s.section; });
      var row = $("<div class='settings-row'>").toggleClass("disabled", !!s.disabled).appendTo(pane);
      var id = "setting-" + i;
      if (s.kind == "check") {
        var cb = $("<input type='checkbox'>").attr("id", id).prop("checked", !!s.get()).prop("disabled", !!s.disabled)
          .on("change", function () { s.set(this.checked); });
        row.append($("<label>").attr("for", id).append(cb, document.createTextNode(" " + s.label)));
      } else if (s.kind == "select") {
        var sel = $("<select>").attr("id", id).prop("disabled", !!s.disabled)
          .on("change", function () { s.set(this.value); });
        s.options.forEach(function (o) { sel.append($("<option>").val(o[0]).text(o[1])); });
        sel.val(String(s.get()));
        row.append($("<label>").attr("for", id).text(s.label + " "), sel);
      } else if (s.kind == "range") {
        var out = $("<span class='settings-value'>").text(s.format(s.get()));
        var range = $("<input type='range'>").attr({ id: id, min: s.min, max: s.max, step: s.step })
          .val(s.get()).prop("disabled", !!s.disabled)
          .on("input", function () { out.text(s.format(parseFloat(this.value))); })
          .on("change", function () { s.set(parseFloat(this.value)); });
        row.append($("<label>").attr("for", id).text(s.label + " "), range, out);
      }
      if (s.key) row.append($("<kbd>").text(s.key).attr("title", "or press " + s.key + " in the game"));
      if (s.help) row.append($("<div class='settings-help'>").text(s.help));
    });
    // Try the voice
    var nar = panes.children().filter(function () { return $(this).data("tab") == "Narration"; });
    if (window.speechSynthesis && window.SpeechSynthesisUtterance)
      $("<div class='settings-row'>").append($("<button type='button'>").text("Test the voice").on("click", function () {
        window.speechSynthesis.cancel();
        SpeakLine("This is " + Get(Traits, 'Name') + ", narrating. Progress continues.");
      })).appendTo(nar);
    var a11y = panes.children().filter(function () { return $(this).data("tab") == "Accessibility"; });
    $("<p class='settings-help'>").text("More time for a choice: P pauses the game, and the clock a choice waits on with it. " +
      "Every menu works from the keyboard (Alt + its letter, or F10), and the Keyboard Shortcuts tab lists the rest. " +
      "If your system asks for less motion, the game has none.").appendTo(a11y);
    var adv = panes.children().filter(function () { return $(this).data("tab") == "Advanced"; });
    $("<div class='settings-row'>").append($("<button type='button'>").text("Reload the page now").on("click", function () {
      SaveGame(function () { window.location.reload(); }, true);
    })).appendTo(adv);
    $("<p class='settings-help'>").text("Settings are kept in this browser, for every hero. They never change how a game goes.").appendTo(adv);
  };
  fill();
  // the shortcuts
  panes.children().filter(function () { return $(this).data("tab") == "Keyboard"; }).append(ShortcutTable());
  // (voices can arrive late: fill in again when they do)
  if (window.speechSynthesis && window.speechSynthesis.addEventListener) {
    var again = function () { var open = document.activeElement; fill(); show(SettingGet("settingstab", "Narration")); if (open && open.focus) open.focus(); };
    window.speechSynthesis.addEventListener("voiceschanged", again, { once: true });
  }
  WinBox({ title: "Settings", body: box, wide: true,
           buttons: [{ label: "Reset to defaults", action: function () {
                       Object.keys(SettingsDefaults).forEach(function (k) { SettingSet(k, SettingsDefaults[k]); });
                       $("body").toggleClass("no-icons", DesktopIconsHidden());
                       ShowNarration(); ShowEventPopupToggle();
                       fill(); show(SettingGet("settingstab", "Narration"));
                     } },
                     { label: "Close", value: null, primary: true }] });
  show(tab || SettingGet("settingstab", "Narration"));
}

// Say one line now, with the chosen voice (Narrate in main.js uses the same)
function SpeakLine(text) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  var u = new SpeechSynthesisUtterance(text);
  ApplyVoice(u);
  window.speechSynthesis.speak(u);
}

function ApplyVoice(u) {
  var v = NarrationVoice();
  if (v) u.voice = v;
  u.rate = NarrationRate();
  u.volume = NarrationVolume();
}

// ---- Keyboard shortcuts -------------------------------------------------------------
//
// The list the window shows. The keys themselves are handled by FormKeyDown
// (main.js) and MenuKey (menubar.js): add a key there, add it here.
K.Shortcuts = [
  ["The game", [
    ["P", "Pause or resume"],
    ["1 – 9", "Answer a choice, while one is waiting"],
    ["T", "Tactics"],
    ["J", "The journal"],
    ["C", "Combat log"],
    ["N", "Narration on or off"],
    ["E", "Event pop-ups on or off"],
    ["O", "Settings"],
    ["?", "This list"],
    ["D", "Your genome"],
    ["S", "Save now"],
    ["W", "Pop the game out into its own window"],
    ["Q", "Save and quit to the main menu"]
  ]],
  ["Menus and windows", [
    ["Alt + letter", "Open a menu (the underlined letter)"],
    ["F10", "Open the first menu"],
    ["Arrow keys", "Move around an open menu"],
    ["Enter or Space", "Choose a menu item"],
    ["Escape", "Close a menu or a window"],
    ["Ctrl + S", "Save now"],
    ["F1", "Help (the FAQ)"],
    ["F11", "Full screen (the browser's own)"]
  ]]
];

function ShortcutTable() {
  var wrap = $("<div class='shortcuts'>");
  K.Shortcuts.forEach(function (group) {
    $("<h3>").text(group[0]).appendTo(wrap);
    var table = $("<table>").appendTo(wrap);
    group[1].forEach(function (row) {
      $("<tr>").append($("<td>").append($("<kbd>").text(row[0])), $("<td>").text(row[1])).appendTo(table);
    });
  });
  $("<p class='settings-help'>").text("There may be other keys. The old ones still work. Some of them shouldn't.").appendTo(wrap);
  return wrap;
}

function ShowShortcuts() {
  OpenSettings("Keyboard");
}
