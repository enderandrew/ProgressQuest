/* copyright (c)2002-2010 Eric Fredricksen all rights reserved */

function Roll(stat) {
  stats[stat] = 3 + Random(6) + Random(6) + Random(6);
  if (document)
    $("#"+stat).text(stats[stat]);
  return stats[stat];
}

function Choose(n, k) {
  var result = n;
  var d = 1;
  for (var i = 2; i <= k; ++i) {
    result *= (1+n-i);
    d = d * i;
  }
  return result / d;
}

var stats = {};
var traits = {};
var total = 0;
var seedHistory = [];

function RollEm() {
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
  stats['HP Max'] = 3 + Random(8) + stats.CON.div(6);
  stats['MP Max'] = 3 + Random(8) + stats.INT.div(6);

  var color =
    (total >= (63+18)) ? 'red'    :
    (total > (4 * 18)) ? 'yellow' :
    (total <= (63-18)) ? 'grey'   :
    (total < (3 * 18)) ? 'silver' :
    'white';

  if (document) {
    var Total = $("#Total");
    Total.text(total);
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
  var p = AttributeProfile($("input:radio[name=Race]:checked").val(),
                           $("input:radio[name=Class]:checked").val());
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
    $("#races, #classes").on("change", "input:radio", ShowNewGuyProfile);
    ShowNewGuyProfile();

    //var caption = 'Progress Quest Remix - New Character';
    //if (MainForm.GetHostName != '')
      //  caption = caption + ' [' + MainForm.GetHostName + ']';

    $("#Name").focus();
    $("#Name").select();
  }

  if (window.location.href.indexOf("?sold") > 0)
    sold();  // TODO: cheesy
}


if (document)
  $(document).ready(NewGuyFormLoad);


function sold() {
  // The Prologue is always the Old Bastard™ taunting you in your dreams
  var prologue = PrologueStory();
  var newguy = {
    Traits: traits,
    dna: stats.seed,
    seed: stats.seed,
    birthday: ''+new Date(),
    birthstamp: +new Date(),
    Stats: stats,
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
    EncumBar: { position: 0, max: stats.STR + 10 },
    PlotBar: { position: 0, max: 26 },
    QuestBar: { position: 0, max: 1 },
    TaskBar: { position: 0, max: 2000 },
    HPBar: { position: stats['HP Max'], max: stats['HP Max'] },
    MPBar: { position: stats['MP Max'], max: stats['MP Max'] },
    saveVersion: SaveVersion,
    buffs: [],
    recentEvent: null,
    finale: null,
    queue: [
      "scene|6|Experiencing an enigmatic and foreboding night vision... The Old Bastard™ appears and sneers: “" + prologue.taunt + "”",
	  "scene|6|That Old Bastard™ will pay! You set out on a quest to right this particular wrong",
	  'scene|6|You tell your loved ones that you will be back soon. Surely this will be quick and not an endless quest you never finish',
	  'scene|6|Where is the Old Bastard™ from your vision? You will look on the Killing Fields™!',
      'plot|2|Loading ...'
    ]
  };

  if (document) {
    newguy.Traits.Name = $("#Name").val();
    newguy.Traits.Race = $("input:radio[name=Race]:checked").val();
    newguy.Traits.Class = $("input:radio[name=Class]:checked").val();
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


// In the main menu's New Game window (index.html), this page runs in a
// frame: the game then opens in the whole window, and Cancel closes the
// New Game window instead.
function Embedded() {
  try {
    return String(window.location.search || "").indexOf("embed") >= 0 &&
           !!window.parent && window.parent !== window;
  } catch (e) {
    return false;   // no page (sim.js), or a parent we can't see
  }
}

function charIsBorn(newguy) {
  storage.addToRoster(newguy, function () {
    (Embedded() ? window.top : window).location.href = "main.html#" + EncodeName(newguy.Traits.Name);
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

