// The game window's menu bar (File, Edit, View, Game, Help), Windows 95
// style. Click a menu or press Alt+its letter (or F10); arrow keys, Enter
// and Esc work as they did in 1995. The links under the task bar stay too.
//
// Menus are data (MenuBar below): each item has a label ("&" marks the
// key letter), and an action, a link (opened in a new tab), or a
// submenu; checked() and enabled() are asked each time the menu opens.
// Several items are jokes (Joke() picks a line from K.MenuJokes).
//
// Depends on main.js and transfer.js.

K.MenuJokes = {
  print: ["PC LOAD LETTER.\nNobody knows what it means. The printer won't say.",
          "Printing your character sheet...\nThe printer is out of cyan. Your character sheet has no cyan in it. The printer does not care.",
		  "Lp0 on fire. That sounds bad.",
		  "Technology improves at exponential rates except printing. Printing is always bad.",
		  "Your character sent to a random printer in Sheboygan."],
  pageSetup: ["Margins: generous.\nOrientation: chaotic neutral.\nPaper: the kind that gives you cuts."],
  undo: ["Undo is not available. Your hero has to live with the consequences of their actions, which is more than most people manage.",
         "Can't undo. That fight happened. The monster's family remembers.",
		 "Chronomancy is the most powerful magic, but you have not unlocked it.",
		 "Your consequences are permanent, like my markers."],
  redo: ["Nothing to redo. Your hero is already redoing the same thing forever. That's the game.",
		"Enabling Groundhog Day mode. You will regret this if you ever escape the loot.",
		"Causality often causes us to repeat the same mistakes.",
		"Have you done something good worth repeating?"],
  cut: ["The things my father said when angry cut the deepest of all.",
		"Your hero refuses to be cut. They've lost enough HP today.",
		"You call cut, and the Director calls for another take."],
  paste: ["You can't paste loot into your inventory.\nWe checked. Well, you checked. That's why this message exists.\nYou can eat paste in real life.\nWe can't stop you."],
  selectAll: ["Selected all 526 monsters.\nYour hero will now fight them one at a time, which is what was going to happen anyway."],
  find: ["Searching for the meaning of life...\n42 results found. All of them are wrong.",
         "Searching your hero's pack for something useful...\nNot found."],
  replace: ["Replace your hero? That's what File > New Hero is for. They'll pretend not to be hurt."],
  preferences: ["Your preferences have been noted, and will be ignored.\n(Your hero's preferences are under Game > Tactics.)"],
  zoom: ["Zooming in...\nYour hero is still made of text. Enhance! ...No, still text."],
  onTop: ["Progress Quest is always on top.\nOf your priorities, anyway."],
  cheats: ["Cheating is not allowed in Progress Quest.\nSome codes are more famous than others, though. Up, up..."],
  fast: ["There is no faster.\nThere is only waiting. Also, the cheat detector is watching the clock."],
  ludicrous: ["They've gone to plaid!\n...Sorry, no. The progress bars fill at the speed of progress."],
  slow: ["Slower? Bold choice. Try going outside and coming back. That's basically slower."],
  updates: ["You are running the latest version of Progress Quest.\nOr the oldest. It's getting hard to tell.",
            "Checking for updates...\nA newer version of reality is available. Restart the universe to install it."],
  register: ["Thank you for registering Progress Quest!\nYour registration is free, and entitles you to nothing. Your serial number is 1."]
};

K.Tips = [
  "Your hero doesn't need you. But it's nice when you watch.",
  "Monsters drop better loot when you aren't looking. This is not true, but it feels true.",
  "Press P to pause. Your hero will stand perfectly still, contemplating the void.",
  "Retiring a hero at level 50 makes the next one stronger. Legacy is the only thing that lasts.",
  "Hardcore heroes die for real. Their obituaries are some of the game's best writing.",
  "Try the Daily Challenge: same hero, same dice, same disappointment for everyone.",
  "You can share your character sheet with File > Share. Nobody asked, but now they can see it.",
  "Selling viscera-covered loot is the backbone of the Killing Fields economy.™",
  "The Konami code does not work here. Everybody knows that one.",
  "Spells you know get stronger with WIS. Spells you don't know stay exactly as strong as before.",
  "The narrator reads events aloud. Press N if the narrator has said enough.",
  "Games are better with music. Try WinCramp.",
  "There are no weak character builds, except the one you picked.",
  "It helps to roleplay your alignment, unless you are Chaotic Gassy.",
  "Every hero's whole game can be replayed from the start. Cheaters, take note.",
  "The game plays itself, buy you can affect the simulation by changing Tactics.",
  "Death is only permanent in Hardcore Mode and Real Life™.",
  "Arcane builds cast spells more often.",
  "A filled star on your character sheet reflects a primary stat, and an open-star is a secondary stat.",
  "All of the stats impact the combat simulation.",
  "Every fight with every monster is fully simulated, like your life.",
  "My girlfriend and I like to play Just the Tip.",
  "All of the attributes should be balanced, except one is clearly the best.",
  "You can export your character to back it up. But some thing can never be recovered.\nLike my last relationship...",
  "The monsters are very considerate in gathering together on the Killing Fields™ for killing.",
  "If you fall in combat, someone will drag you away to recover. But you will lose gold, items and dignity.",
  "There are damage, healing, buffs, debuffs, control control and unobtainable spells.",
  "Loot can be equipped or sold. It helps to clean off the monster viscera first.",
  "Read Meditations by Marcus Aurelius. That is my tip for you the player in Real Life™.",
  "This game is mainly about watching. I don't judge voyeur kinks.",
  "Is this game balanced enough to make Thanos happy? Probably not. But an effort was made to be balanced.",
  "Story exists. No guarantees are made when it comes to the quality of the writing.",
  "Certain events are narrated aloud so you feel less lonely.",
  "There are random events in the game, that is if anything is truly random or is your fate pre-determined?",
  "Have you tried a daily challenge or a mutator custom game?",
  "You can track your progress in the Codex since this game is all about Progress.\nIt is all in the name.",
  "Some events have choices. I trust you will make the wrong one.",
  "If you defeat The Old Bastard™, you can retire and join the Hall of Legends to unlock a bonus on all New Game+ characters.",
  "Bigfoot is a master of Kumite.",
];

function Joke(key, title) {
  var lines = K.MenuJokes[key];
  WinBox({ title: title || "Progress Quest", icon: key == "cheats" ? "error" : "info",
           text: lines[Math.floor(Math.random() * lines.length)] });
}

function OpenLink(url) {
  window.open(url, "_blank", "noopener");
}

// Save first, then go somewhere else
function SaveAndGo(url) {
  SuspendAutosave();
  SaveGame(function () { window.location.href = url; });
}

// (the backup is exactly what was just saved and sealed)
function ExportHero() {
  SaveGame(function (text) { DownloadHero(game, text); });
}

function ImportHero() {
  var input = document.getElementById("MenuImport");
  input.value = "";
  input.click();
}

// After an import from the game: play the new hero now?
function ImportedHero(sheet) {
  var name = sheet.Traits.Name, id = HeroId(sheet), current = id == HeroId(game);
  if (current) {   // it replaced the hero on screen: don't save over it
    SuspendAutosave();
    window.location.href = "main.html#" + EncodeName(id);
    window.location.reload();
    return;
  }
  WinBox({ title: "Import Hero", icon: "question",
           text: name + " is in your roster now. Play them? (" + Get(Traits, 'Name') + " is saved.)",
           buttons: [{ label: "Play", value: "play", primary: true }, { label: "Later", value: null }],
           onClose: function (v) { if (v == "play") SaveAndGo("main.html#" + EncodeName(id)); } });
}

function CopySheet() {
  var text = CharacterSheetText(game);
  var done = function () {
    WinBox({ title: "Copy", icon: "info", text: "Character sheet copied to the clipboard. Paste it somewhere it'll be appreciated." });
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {
    WinBox({ title: "Copy", icon: "error", text: "The clipboard said no." });
  });
  else WinBox({ title: "Copy", icon: "error", text: "This browser won't let us near the clipboard." });
}

function ToggleFullScreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
}

function DesktopIconsHidden() {
  try { return localStorage.getItem("pq.icons") === "0"; } catch (e) { return false; }
}

function ToggleDesktopIcons() {
  var hide = !DesktopIconsHidden();
  try { localStorage.setItem("pq.icons", hide ? "0" : "1"); } catch (e) {}
  $("body").toggleClass("no-icons", hide);
}

var _tip = Math.floor(Math.random() * 1000);
function TipOfTheDay() {
  var box = document.createElement("div");
  var head = document.createElement("p");
  head.className = "tip-head";
  head.textContent = "Did you know...";
  var tip = document.createElement("p");
  tip.className = "tip-text";
  var show = function () { tip.textContent = K.Tips[_tip++ % K.Tips.length]; };
  show();
  box.appendChild(head);
  box.appendChild(tip);
  WinBox({ title: "Tip of the Day", icon: "info", body: box,
           buttons: [{ label: "Next Tip", action: show }, { label: "Close", value: null, primary: true }] });
}

function AboutBox() {
  var html =
    "<p><b>Progress Quest Remix</b><br>Save version " + SaveVersion + "</p>" +
    "<p>Based on <b>Progress Quest</b> by Eric Fredricksen (2002), the game that plays itself.<br>" +
    "Remixed by T. J. Brumfield.</p>" +
    "<p>This product is licensed to:<br><b></b></p>" +
    "<p>Physical memory available to Progress Quest: 640K. That ought to be enough for anybody.</p>" +
    "<p class=dim>Warning: this computer program is protected by the laws of nature, the laws of " +
    "unintended consequences, and the Old Bastard™.</p>";
  var dlg = WinBox({ title: "About Progress Quest Remix", html: html, icon: "info" });
  dlg.querySelectorAll("p b")[2].textContent = Get(Traits, 'Name') + ", level " + Get(Traits, 'Level') + " " + Get(Traits, 'Class');
}

var MenuBar = [
  { label: "&File", items: [
    { label: "&New Hero…", action: function () { SaveAndGo("index.html#new"); } },
    { label: "&Open Hero…", action: function () { SaveAndGo("index.html#resume"); } },
    { label: "&Save", key: "Ctrl+S", action: function () {
      SaveGame(function () { MenuStatus("Saved."); });
    } },
    "-",
    { label: "&Export Hero…", action: ExportHero },
    { label: "&Import Hero…", action: ImportHero },
    { label: "S&hare Character Sheet…", action: function () { ShareHero(game); } },
    "-",
    { label: "Page Set&up…", action: function () { Joke("pageSetup", "Page Setup"); } },
    { label: "&Print…", key: "Ctrl+P", action: function () { Joke("print", "Print"); } },
    "-",
    { label: "&Retire to the Hall…", enabled: function () { return CanRetire(); }, action: AskRetire },
    { label: "E&xit", key: "Q", action: quit }
  ] },
  { label: "&Edit", items: [
    { label: "&Undo", action: function () { Joke("undo", "Undo"); } },
    { label: "&Redo", action: function () { Joke("redo", "Redo"); } },
    "-",
    { label: "Cu&t", action: function () { Joke("cut", "Cut"); } },
    { label: "&Copy Character Sheet", action: CopySheet },
    { label: "&Paste", action: function () { Joke("paste", "Paste"); } },
    { label: "Select &All", action: function () { Joke("selectAll", "Select All"); } },
    "-",
    { label: "&Find…", action: function () { Joke("find", "Find"); } },
    { label: "R&eplace…", action: function () { Joke("replace", "Replace"); } },
    "-",
    { label: "Prefere&nces…", action: function () { Joke("preferences", "Preferences"); } }
  ] },
  { label: "&View", items: [
    { label: "&Narration", key: "N", checked: NarrationOn, action: ToggleNarration },
    { label: "&Event Pop-ups", key: "E", checked: EventPopupsOn, action: ToggleEventPopups },
    { label: "&Combat Log", key: "C", checked: function () { return $("body").hasClass("show-log"); }, action: ToggleCombatLog },
    { label: "&Desktop Icons", checked: function () { return !DesktopIconsHidden(); }, action: ToggleDesktopIcons },
    { label: "E&xpand All Panels", enabled: CompactLayout, action: function () { SetAllPanels(false); } },
    { label: "Collapse All Pane&ls", enabled: CompactLayout, action: function () { SetAllPanels(true); } },
    "-",
    { label: "&Full Screen", key: "F11", checked: function () { return !!document.fullscreenElement; }, action: ToggleFullScreen },
    { label: "&Pop Out Window", key: "W", enabled: function () { return !window.opener; }, action: PopOut },
    "-",
    { label: "Zoom &In", action: function () { Joke("zoom", "Zoom"); } },
    { label: "Always on &Top", action: function () { Joke("onTop", "Always on Top"); } }
  ] },
  { label: "&Game", items: [
    { label: "&Pause", key: "P", checked: IsPaused, action: TogglePause },
    { label: "&Tactics…", key: "T", action: OpenTactics },
    { label: "&Speed", items: [
      { label: "&Slow", action: function () { Joke("slow", "Speed"); } },
      { label: "&Normal", checked: function () { return true; }, action: function () {} },
      { label: "&Fast", action: function () { Joke("fast", "Speed"); } },
      { label: "&Ludicrous", action: function () { Joke("ludicrous", "Speed"); } }
    ] },
    { label: "&Genome", key: "D", action: function () {
      WinBox({ title: "Genome", icon: "info", text: "Your character's genome is " + ToDna(game.dna + "") });
    } },
    { label: "C&heat Codes…", action: function () { Joke("cheats", "Cheat Codes"); } },
    "-",
    { label: "&Codex", action: function () { CodexFlush(function () { window.open("index.html#codex", "pq-codex"); }); } },
    { label: "Hall of &Legends", action: function () { OpenLink("index.html#hall"); } },
    { label: "Challenge &Modes", action: function () { OpenLink("index.html#challenge"); } },
    "-",
    { label: "Main Men&u", action: quit }
  ] },
  { label: "&Help", items: [
    { label: "&Help Topics", key: "F1", action: function () { OpenLink("faq.php"); } },
    { label: "&Tip of the Day…", action: TipOfTheDay },
    "-",
    { label: "Progress Quest &Website", link: "http://progressquest.com/" },
    { label: "The &Original Source Code", link: "https://bitbucket.org/grumdrig/pq" },
    { label: "Progress Quest on Wi&kipedia", link: "https://en.wikipedia.org/wiki/Progress_Quest" },
    { label: "This Remix on &GitHub", link: "https://github.com/enderandrew/ProgressQuest" },
	{ label: "&Progress Quest Subreddit", link: "https://www.reddit.com/r/ProgressQuest/" },
	{ label: "Progress Quest &Discord", link: "https://discord.gg/hNar356" },
    { label: "&Report a Bug…", link: "https://github.com/enderandrew/ProgressQuest/issues/new" },
    { label: "Ar&chives", items: [
      { label: "&News", link: "news.php" },
      { label: "&Release Notes", link: "releasenotes.php" },
      { label: "&Tales", link: "tales.php" },
      { label: "Te&stimonials", link: "testimonials.php" },
      { label: "&Info", link: "info.php" },
      { label: "&Links", link: "links.php" }
    ] },
    "-",
    { label: "Check for &Updates…", action: function () { Joke("updates", "Check for Updates"); } },
    { label: "Regi&ster…", action: function () { Joke("register", "Register"); } },
    "-",
    { label: "&About Progress Quest Remix…", action: AboutBox }
  ] }
];

// ---- The machinery ------------------------------------------------------------------

function MenuStatus(text) {
  var s = $("#MenuStatus").text(text).addClass("show");
  clearTimeout(MenuStatus.timer);
  MenuStatus.timer = setTimeout(function () { s.removeClass("show"); }, 2500);
}

// "&File" -> F̲ile, and the key letter
function MenuLabel(el, label) {
  var i = label.indexOf("&");
  el.textContent = "";
  if (i < 0) { el.textContent = label; return ""; }
  el.appendChild(document.createTextNode(label.slice(0, i)));
  var u = document.createElement("u");
  u.textContent = label.charAt(i + 1);
  el.appendChild(u);
  el.appendChild(document.createTextNode(label.slice(i + 2)));
  return label.charAt(i + 1).toLowerCase();
}

function BuildMenu(items) {
  var ul = document.createElement("ul");
  ul.className = "menu-pop";
  ul.setAttribute("role", "menu");
  items.forEach(function (item) {
    var li = document.createElement("li");
    if (item == "-") {
      li.className = "menu-sep";
      li.setAttribute("role", "separator");
      ul.appendChild(li);
      return;
    }
    li.setAttribute("role", item.checked ? "menuitemcheckbox" : "menuitem");
    li.tabIndex = -1;
    var check = document.createElement("span");
    check.className = "menu-check";
    var label = document.createElement("span");
    label.className = "menu-label";
    li.dataset.key = MenuLabel(label, item.label);
    var key = document.createElement("span");
    key.className = "menu-key";
    key.textContent = item.items ? "▸" : item.key || "";
    li.appendChild(check);
    li.appendChild(label);
    li.appendChild(key);
    li._item = item;
    if (item.items) {
      li.classList.add("has-sub");
      li.setAttribute("aria-haspopup", "true");
      li._sub = BuildMenu(item.items);
      li.appendChild(li._sub);
    }
    ul.appendChild(li);
  });
  return ul;
}

var _menuOpen = null;   // the open top-level <li>

function MenuRefresh(ul) {
  $(ul).children("li").each(function () {
    var item = this._item;
    if (!item) return;
    var on = item.checked ? !!item.checked() : false;
    var enabled = item.enabled ? !!item.enabled() : true;
    this.classList.toggle("checked", on);
    if (item.checked) this.setAttribute("aria-checked", on);
    this.classList.toggle("disabled", !enabled);
    this.setAttribute("aria-disabled", !enabled);
  });
}

function OpenMenu(top, focusFirst) {
  CloseMenus();
  _menuOpen = top;
  top.classList.add("open");
  top.querySelector(".menu-top").setAttribute("aria-expanded", "true");
  var pop = top.querySelector(".menu-pop");
  MenuRefresh(pop);
  if (focusFirst) MenuFocus(pop, 0);
  else top.querySelector(".menu-top").focus();
}

function CloseMenus() {
  $("#MenuBar .open").removeClass("open");
  $("#MenuBar .menu-top").attr("aria-expanded", "false");
  $("#MenuBar li.active").removeClass("active");
  _menuOpen = null;
}

// The items of a menu that can be moved to
function MenuItems(ul) {
  return $(ul).children("li").not(".menu-sep").get();
}

function MenuFocus(ul, index) {
  var items = MenuItems(ul);
  if (!items.length) return;
  index = (index + items.length) % items.length;
  $(ul).children("li").removeClass("active");
  items[index].classList.add("active");
  items[index].focus();
}

function OpenSub(li) {
  $(li.parentNode).children("li.sub-open").not(li).removeClass("sub-open");
  li.classList.add("sub-open");
  MenuRefresh(li._sub);
}

function MenuActivate(li) {
  var item = li._item;
  if (!item || li.classList.contains("disabled")) return;
  if (item.items) { OpenSub(li); MenuFocus(li._sub, 0); return; }
  CloseMenus();
  if (item.link) OpenLink(item.link);
  else if (item.action) item.action();
}

function SetUpMenuBar() {
  var bar = document.getElementById("MenuBar");
  if (!bar) return;
  MenuBar.forEach(function (menu) {
    var top = document.createElement("li");
    top.className = "menu";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-top";
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-expanded", "false");
    top.dataset.key = MenuLabel(btn, menu.label);
    top.appendChild(btn);
    top.appendChild(BuildMenu(menu.items));
    bar.appendChild(top);
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (_menuOpen == top) CloseMenus(); else OpenMenu(top, false);
    });
    btn.addEventListener("mouseenter", function () { if (_menuOpen && _menuOpen != top) OpenMenu(top, false); });
  });

  // Items: hover highlights (and opens submenus), click activates
  $(bar).on("mouseenter", ".menu-pop > li:not(.menu-sep)", function () {
    $(this.parentNode).children("li").removeClass("active");
    this.classList.add("active");
    if (this._sub) OpenSub(this);
    else $(this.parentNode).children("li.sub-open").removeClass("sub-open");
  });
  $(bar).on("click", ".menu-pop > li", function (e) {
    e.stopPropagation();
    if (this._item) MenuActivate(this);
  });
  document.addEventListener("click", function () { if (_menuOpen) CloseMenus(); });

  // The keyboard, ahead of the game's own keys
  document.addEventListener("keydown", MenuKey, true);
  $("#MenuImport").on("change", function () { ImportHeroFiles(this.files, ImportedHero); });
  // the same, under the task bar
  $("#ShareLink").on("click", function (e) { e.preventDefault(); ShareHero(game); });
  $("#ExportLink").on("click", function (e) { e.preventDefault(); ExportHero(); });
  if (DesktopIconsHidden()) $("body").addClass("no-icons");
}

function MenuKey(e) {
  if (document.querySelector("dialog[open]")) return;   // a dialog has the keys
  var key = e.key;
  // Ctrl+S saves (instead of the browser's Save Page)
  if ((e.ctrlKey || e.metaKey) && !e.altKey && key.toLowerCase() == "s") {
    e.preventDefault();
    SaveGame(function () { MenuStatus("Saved."); });
    return;
  }
  if (key == "F1" && !_menuOpen) { e.preventDefault(); OpenLink("faq.php"); return; }
  if ((e.ctrlKey || e.metaKey) && !e.altKey && key.toLowerCase() == "p" && !_menuOpen) {
    e.preventDefault();
    Joke("print", "Print");
    return;
  }
  var tops = $("#MenuBar > li.menu").get();
  if (!_menuOpen) {
    if (key == "F10" || (e.altKey && !e.ctrlKey && !e.metaKey && key.length == 1)) {
      var want = key == "F10" ? tops[0] : tops.filter(function (t) { return t.dataset.key == key.toLowerCase(); })[0];
      if (want) { e.preventDefault(); e.stopPropagation(); OpenMenu(want, true); }
    }
    return;
  }
  // A menu is open: it gets every key
  e.preventDefault();
  e.stopPropagation();
  var active = document.activeElement && document.activeElement.closest ? document.activeElement.closest("li") : null;
  var pop = active && active.parentNode.classList.contains("menu-pop") ? active.parentNode : _menuOpen.querySelector(".menu-pop");
  var items = MenuItems(pop), at = items.indexOf(active);
  var inSub = pop.parentNode && pop.parentNode.classList && pop.parentNode.classList.contains("has-sub");
  var ti = tops.indexOf(_menuOpen);
  if (key == "Escape") {
    if (inSub) { pop.parentNode.classList.remove("sub-open"); pop.parentNode.focus(); return; }
    var btn = _menuOpen.querySelector(".menu-top");
    CloseMenus();
    btn.focus();
  } else if (key == "ArrowDown") MenuFocus(pop, at + 1);
  else if (key == "ArrowUp") MenuFocus(pop, at < 0 ? -1 : at - 1);
  else if (key == "ArrowRight") {
    if (active && active._sub && at >= 0) { OpenSub(active); MenuFocus(active._sub, 0); }
    else OpenMenu(tops[(ti + 1) % tops.length], true);
  } else if (key == "ArrowLeft") {
    if (inSub) { pop.parentNode.classList.remove("sub-open"); pop.parentNode.focus(); }
    else OpenMenu(tops[(ti - 1 + tops.length) % tops.length], true);
  } else if (key == "Enter" || key == " ") {
    if (active && at >= 0) MenuActivate(active);
  } else if (key == "Tab" || key == "Alt" || key == "F10") {
    CloseMenus();
  } else if (key.length == 1) {
    var hit = items.filter(function (li) { return li.dataset.key == key.toLowerCase(); })[0];
    if (hit) MenuActivate(hit);
  }
}

if (typeof document != "undefined" && document) $(SetUpMenuBar);
