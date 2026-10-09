/* copyright (c)2002-2010 Eric Fredricksen all rights reserved */

function Roll(stat) {
  stats[stat] = 3 + Random(6) + Random(6) + Random(6);
  if (document)
    $("#"+stat).text(stats[stat]);
  return stats[stat];
}

var stats = {};
var traits = {};
var total = 0;
var seedHistory = [];

function RollEm() {
  // A seeded run: the same seed always rolls the same stats, and starts the
  // game's random numbers in the same place
  if (RunSeed()) seed = new Alea("pq-seed:" + RunSeed());
  stats.seed = randseed();
  total = 0;
  var best = -1;
  $.each(K.PrimeStats, function (i, stat) {
    total += Roll(stat);
    if (best < stats[stat]) {
      best = stats[stat];
      stats.best = stat;
    }
  });
  // HP and MP start at 3 or more: with combat, a 1 HP hero never wins.
  stats['HP Max'] = 3 + Random(8) + Div(stats.CON, 6);
  stats['MP Max'] = 3 + Random(8) + Div(stats.INT, 6);
  // and an alignment, rolled with them (Unroll brings the old one back)
  traits.Alignment = RollAlignment();

  var color =
    (total >= (63+18)) ? 'red'    :
    (total > (4 * 18)) ? 'yellow' :
    (total <= (63-18)) ? 'grey'   :
    (total < (3 * 18)) ? 'silver' :
    'white';

  if (document) {
    var Total = $("#Total");
    Total.text(total);
    $("#Alignment").text(traits.Alignment);
    Total.css("background-color", color);

    $("#Unroll").prop("disabled", !seedHistory.length);
  }
}

function RerollClick() {
  seedHistory.push(stats.seed);
  RollEm();
}


function UnrollClick() {
  randseed(seedHistory.pop());
  RollEm();
}

function fill(e, a, n) {
  var def = Random(a.length);
  for (var i = 0; i < a.length; ++i) {
    var v = a[i].split("|")[0];
    var tags = (a[i].split("|")[1] || "").split(",");
    if (def == i) traits[n] = v;
    if (document) {
      // Built as elements rather than an HTML string so names containing
      // quotes or markup can't break the form.
      var id = n + '-' + i;
      $("<div>").append(
        $("<input>", { type: "radio", id: id, name: n, value: v, checked: def == i }),
        $("<label>", { "for": id, text: v,
                       title: "Primary: " + tags[0] + ", secondary: " + tags[1] })
      ).appendTo(e);
    }
  }
}

// Mark the chosen race and class attributes on the stats table and show
// the martial/arcane split.
function ShowNewGuyProfile() {
  var p = AttributeProfile($("input[type=radio][name=Race]:checked").val(),
                           $("input[type=radio][name=Class]:checked").val());
  $("#stats th").each(function () {
    var stat = $(this).text().trim();
    $(this).toggleClass("primary", p.primary.indexOf(stat) >= 0)
           .toggleClass("secondary", p.secondary.indexOf(stat) >= 0);
  });
  var pools = [];
  $.each(["HP Max", "MP Max"], function (i, stat) {
    if (p.primary.indexOf(stat) >= 0) pools.push(stat + " \u2605");
    else if (p.secondary.indexOf(stat) >= 0) pools.push(stat + " \u2606");
  });
  $("#Profile").text(ProfileSummary(p) + (pools.length ? " \u00b7 " + pools.join(", ") : ""));
}

function NewGuyFormLoad() {
  seed = new Alea();
  RollEm();
  ShowRunOptions();
  GenClick();

  fill("#races", K.Races, "Race");
  fill("#classes", K.Klasses, "Class");

  if (document) {
    $("#Reroll").on("click", RerollClick);
    $("#Unroll").on("click", UnrollClick);
    $("#RandomName").on("click", GenClick);
    $('#Sold').on("click", sold);
    $('#quit').on("click", cancel);
    if (Embedded()) $("html").addClass("embedded");
    $("#races, #classes").on("change", "input[type=radio]", ShowNewGuyProfile);
    ShowNewGuyProfile();
    $("#Suggest").on("click", SuggestPairing);
    LoadLegacy();

    //var caption = 'Progress Quest Remix - New Character';
    //if (MainForm.GetHostName != '')
      //  caption = caption + ' [' + MainForm.GetHostName + ']';

    $("#Name").trigger("focus").trigger("select");
  }

  if (UrlFlag("sold"))
    sold();  // TODO: cheesy
}


if (document)
  $(NewGuyFormLoad);


function sold() {
  // The Prologue is always the Old Bastard™ taunting you in your dreams
  var prologue = PrologueStory();
  var newguy = {
    Traits: traits,
    dna: stats.seed,
    seed: stats.seed,
    birthday: ''+new Date(),
    birthstamp: +new Date(),
    // the stats alone (stats also holds the roll's seed and best stat)
    Stats: K.Stats.reduce(function (o, s) { o[s] = stats[s]; return o; }, {}),
    beststat: stats.best + " " + stats[stats.best],
    task: "",
    tasks: 0,
    elapsed: 0,
    bestequip: "Pet Rock",
    Equips: {},
    Inventory: [['Gold', 0]],
    Spells: [],
    act: 0,
    bestplot: "Prologue",
    Quests: [],
    questmonster: "",
    kill: "Loading....",
    ExpBar: { position: 0, max: LevelUpTime(1) },
    EncumBar: { position: 0, max: CarryFor(stats.STR) },
    PlotBar: { position: 0, max: 26 },
    QuestBar: { position: 0, max: 1 },
    TaskBar: { position: 0, max: 2000 },
    HPBar: { position: stats['HP Max'], max: stats['HP Max'] },
    MPBar: { position: stats['MP Max'], max: stats['MP Max'] },
    saveVersion: SaveVersion,
    birthVersion: SaveVersion,   // heroes born from v9 on get the full cheat checks
    buffs: [],
    recentEvent: null,
    finale: null,
    runSeed: RunSeed(),
    mutators: RunMutators(),
    wins: 0, streak: 0, questsDone: 0, goldEarned: 0,
    tactics: { fights: "normal", resting: "normal", spells: "normal" },
    choiceLog: [],
    mode: Hardcore() ? "hardcore" : NewGamePlus() ? "plus" : "normal",
    lifeId: NewLifeId(),   // who they are in storage, and to the Hardcore ledger
    saveGen: 0,
    legacy: (NewGamePlus() || Hardcore()) && hall ? { races: hall.races, klasses: hall.klasses, bonus: hall.bonus } : null,
    queue: [
      "scene|6|Experiencing an enigmatic and foreboding night vision... The Old Bastard™ appears and sneers: “" + prologue.taunt + "”",
	  "scene|6|That Old Bastard™ will pay! You set out on a quest to right this particular wrong",
	  'scene|6|You tell your loved ones that you will be back soon. Surely this will be quick and not an endless quest you never finish',
	  'scene|6|Where is the Old Bastard™ from your vision? You will look on the Killing Fields™!',
      'plot|2|Loading ...'
    ]
  };

  if (document) {
    newguy.Traits.Name = String($("#Name").val() || "").trim();
    if (!newguy.Traits.Name) {
      alert("Your hero needs a name. Even a bad one.");
      $("#Name").trigger("focus");
      return;
    }
    newguy.Traits.Race = $("input[type=radio][name=Race]:checked").val();
    newguy.Traits.Class = $("input[type=radio][name=Class]:checked").val();
  }
  newguy.Traits.Level = 1;

  newguy.date = newguy.birthday;
  newguy.stamp = newguy.birthstamp;

  $.each(K.Equips, function (i,equip) { newguy.Equips[equip] = ''; });
  newguy.Equips.Weapon = newguy.bestequip;
  newguy.Equips.Hauberk = "-3 Burlap";
  // Gear power is stored per slot; a Pet Rock and burlap are worth nothing
  newguy.EquipPower = {};
  $.each(K.Equips, function (i,equip) { newguy.EquipPower[equip] = 0; });
  newguy.purse = 0;
  newguy.story = prologue;
  // The Prologue's "ending" is its opening scenes, for the Acts list tooltip
  var prologueScenes = newguy.queue
    .filter(function (q) { return q.split('|')[0] == 'scene'; })
    .map(function (q) { return q.split('|').slice(2).join('|'); });
  newguy.storyLog = [{ act: 0, key: prologue.key, title: prologue.title, purpose: prologue.purpose,
                       taunt: prologue.taunt, ending: prologueScenes }];
  newguy.deaths = 0;
  newguy.wounded = 0;
  // A New Game+ legacy raises HP Max and MP Max from the start
  if (newguy.legacy) {
    $.each(["HP Max", "MP Max"], function (i, pool) {
      var bar = pool == "HP Max" ? newguy.HPBar : newguy.MPBar;
      bar.max = bar.position = Math.round(stats[pool] * (1 + (newguy.legacy.bonus[pool] || 0)));
    });
  }
  // Mutators: Glass Cannon halves HP, Holey Pockets halves what you carry
  var mutators = (K.Mutators || []).filter(function (m) { return newguy.mutators.indexOf(m.key) >= 0; });
  var product = function (prop) { return mutators.reduce(function (p, m) { return p * (m[prop] || 1); }, 1); };
  newguy.HPBar.max = newguy.HPBar.position = Math.max(1, Math.round(newguy.HPBar.max * product("hpMult")));
  newguy.EncumBar.max = Math.max(5, Math.round(newguy.EncumBar.max * product("carryMult")));


  if (document && $("#multiplayer:checked").length > 0) {
    newguy.online = {
      realm: "Alpaquil",
      host: "http://progressquest.com/alpaquil.php?",
      // host: "http://localhost:9001/alpaquil.php?",
    }

    $("#Sold").prop("disabled", true);
    $("body").css("cursor", "progress");

    let url = newguy.online.host;
    url += 'cmd=create' +
           '&name=' + UrlEncode(newguy.Traits.Name) +
           '&realm=' + UrlEncode(newguy.online.realm) +
           RevString;
    $.ajax(url)
    .done(body => {
      if (body.split('|')[0].toLowerCase() == 'ok') {
         newguy.online.passkey = parseInt(body.split('|')[1]);
         charIsBorn(newguy);
      } else {
        $("#Sold").prop("disabled", false);
        $("body").css("cursor", "default");
        alert(body);
      }
    });
  } else {
    charIsBorn(newguy);
  }
}


// ---- Seeds and mutators (from Challenge Modes) --------------------------------

// (UrlParam and UrlFlag, which read the page's query string, are in config.js)

// newguy.html?seed=...: every roll of the run follows from it
function RunSeed() { return UrlParam("seed").slice(0, 64); }

// newguy.html?mut=nospells,glasscannon
function RunMutators() {
  var keys = K.Mutators ? K.Mutators.map(function (m) { return m.key; }) : [];
  return UrlParam("mut").split(",").filter(function (k) { return keys.indexOf(k) >= 0; });
}

function ShowRunOptions() {
  if (!document) return;
  var notes = [];
  if (RunSeed()) notes.push("Seed: " + RunSeed() + " (fixed stats)");
  var muts = RunMutators();
  if (muts.length && K.Mutators) notes.push("Mutators: " + K.Mutators.filter(function (m) {
    return muts.indexOf(m.key) >= 0; }).map(function (m) { return m.label; }).join(", "));
  if (!notes.length) return;
  $("#RunOptions").text(notes.join(" \u00b7 ")).show();
  // the seed decides the stats: rerolling would just roll the same again
  if (RunSeed()) $("#Reroll, #Unroll").prop("disabled", true).attr("title", "The seed decides the stats");
}

// ---- Legacy -----------------------------------------------------------------

// New Game+: the hero gets the legacy of everyone in the Hall of Legends
// (newguy.html?plus, or the main menu's New Game+). A plain New Game shows
// what is honored, but gives no bonus.
function NewGamePlus() {
  return UrlFlag("plus");
}

// Hardcore (newguy.html?hardcore, from the main menu's Challenge Modes):
// one life, with the Hall's legacy
function Hardcore() {
  return UrlFlag("hardcore");
}

var hall = null, honored = { races: {}, klasses: {} };

function LoadLegacy() {
  if (!storage.loadLegends) return;
  storage.loadLegends(function (legends) {
    honored = HonoredBy(legends);
    hall = LegacyFromHall(legends);
    hall.count = legends.length;
    // Mark the honored races and classes
    $("#races label, #classes label").each(function () {
      var name = $(this).text();
      var who = (this.htmlFor.indexOf("Race") == 0 ? honored.races : honored.klasses)[name];
      var title = $(this).attr("title").split(" \u00b7 ")[0];
      $(this).toggleClass("honored", !!who)
        .attr("title", title + (who ? " \u00b7 honored by " + who.join(", ") : " \u00b7 not honored yet"));
    });
    ShowLegacyPanel();
  });
}

function ShowLegacyPanel() {
  if (!document || !hall) return;
  var plus = NewGamePlus() || Hardcore();
  var n = hall.races.length + hall.klasses.length;
  var total = K.Races.length + K.Klasses.length;
  $("#legacy").toggleClass("plus", plus).toggleClass("hardcore", Hardcore());
  $("#LegacyMode").text(Hardcore() ? "\u2620 Hardcore" : plus ? "New Game+" : "New Game");
  $("#LegacyCount").text(n + " of " + total + " honored");
  var avg = Math.round(LegacyAverage(hall.bonus) * 1000) / 10;
  if (plus) {
    $("#LegacyBonus").text(n ? "+" + avg + "% on average" : "Nothing honored yet")
      .attr("title", n ? "This hero starts with: " + LegacySummary(hall.bonus) : "");
  } else {
    $("#LegacyBonus").text(n ? "No bonus here; use New Game+" : "Retire a hero at level " +
                           ((K.Boss && K.Boss.Level) || 50) + " to start")
      .attr("title", n ? "New Game+ would give: " + LegacySummary(hall.bonus) : "");
  }
}

// Pick a race and a class nobody in the Hall has played yet (or any, once
// they all have), so every hero adds to the collection
function SuggestPairing() {
  function pick(name, done) {
    var all = $("input[type=radio][name=" + name + "]").toArray();
    var fresh = all.filter(function (r) { return !done[r.value]; });
    var choice = (fresh.length ? fresh : all)[Random((fresh.length ? fresh : all).length)];
    if (choice) {
      choice.checked = true;
      choice.scrollIntoView({ block: "nearest" });
    }
  }
  pick("Race", honored.races);
  pick("Class", honored.klasses);
  ShowNewGuyProfile();
}

// In the main menu's New Game window (index.html), this page runs in a
// frame: the game then opens in the whole window, and Cancel closes the
// New Game window instead.
function Embedded() {
  try {
    return UrlFlag("embed") && !!window.parent && window.parent !== window;
  } catch (e) {
    return false;   // no page (sim.js), or a parent we can't see
  }
}

// (Heroes are stored by life ID, so a name already in the roster is fine)
function charIsBorn(newguy) {
  storage.saveHero(newguy, function () {
    (Embedded() ? window.top : window).location.href = "main.html#" + EncodeName(newguy.lifeId);
  });
}

function cancel() {
  if (Embedded())
    window.parent.postMessage("pq-close-newguy", window.location.origin);
  else
    window.location.href = "index.html";
}

function GenClick() {
  traits.Name = GenerateName();
  if (document)
    $("#Name").val(traits.Name);
}

