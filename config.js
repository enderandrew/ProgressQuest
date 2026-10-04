// TODO These code bits don't really belong here, but this is the only
// shared bit of js

function tabulate(list) {
  var result = '';
  $.each(list, function (index) {
    if (this.length == 2) {
      if (this[1].length)
        result += "   " + this[0] + ": " + this[1] + "\n";
    } else {
      result += "   " + this + "\n";
    }
  });
  return result;
}


String.prototype.escapeHtml = function () {
  return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}


function template(tmpl, data) {
  var brag = tmpl.replace(/\$([_A-Za-z.]+)/g, function (str, p1) {
    var dict = data;
    $.each(p1.split("."), function (i,v) {
      if (!dict) return true;
      if (v == "___") {
        dict = tabulate(dict);
      } else {
        dict = dict[v.replace("_"," ")];
        if (typeof dict == typeof "")
          dict = dict.escapeHtml();
      }
      return null;
    });
    if (dict === undefined) dict = '';
    return dict;
  });
  return brag;
}

// Original work copyright © 2010 Johannes Baagøe, under MIT license
// This is a derivative work copyright (c) 2017-2020, W. Mac" McMeans, under BSD license.
/* private: dependent string hash function */
function Mash() {
    var n = 4022871197; // 0xefc8249d

    var mash = function( data ) {
        data = data.toString();
        
        // cache the length
        for( var i = 0, l = data.length; i < l; i++ ) {
            n += data.charCodeAt( i );
            
            var h = 0.02519603282416938 * n;
            
            n  = h >>> 0;
            h -= n;
            h *= n;
            n  = h >>> 0;
            h -= n;
            n += h * 4294967296; // 0x100000000      2^32
        }
        return ( n >>> 0 ) * 2.3283064365386963e-10; // 2^-32
    };

    mash.version = 'Mash 0.9';
    return mash;
};


// From http://baagoe.com/en/RandomMusings/javascript/
function Alea() {
  return (function(args) {
    // Johannes BaagÃƒÂ¸e <baagoe@baagoe.com>, 2010
    var s0 = 0;
    var s1 = 0;
    var s2 = 0;
    var c = 1;

    if (!args.length) {
      args = [+new Date];
    }
    var mash = Mash();
    s0 = mash(' ');
    s1 = mash(' ');
    s2 = mash(' ');

    for (var i = 0; i < args.length; i++) {
      s0 -= mash(args[i]);
      if (s0 < 0) {
        s0 += 1;
      }
      s1 -= mash(args[i]);
      if (s1 < 0) {
        s1 += 1;
      }
      s2 -= mash(args[i]);
      if (s2 < 0) {
        s2 += 1;
      }
    }
    mash = null;

    var random = function() {
      var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
      s0 = s1;
      s1 = s2;
      return s2 = t - (c = t | 0);
    };
    random.uint32 = function() {
      return random() * 0x100000000; // 2^32
    };
    random.fract53 = function() {
      return random() +
        (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
    };
    random.version = 'Alea 0.9';
    random.args = args;
    random.state = function (newstate) {
      if (newstate) {
        s0 = newstate[0];
        s1 = newstate[1];
        s2 = newstate[2];
        c = newstate[3];
      }
      return [s0,s1,s2,c];
    };
    return random;

  } (Array.prototype.slice.call(arguments)));
}

var seed = new Alea();

function Random(n) {
  return seed.uint32() % n;
}

function randseed(set) {
  return seed.state(set);
}

function Pick(a) {
  return a[Random(a.length)];
}

var KParts = [
  'br|ch|cr|dr|fr|gr|h|j|kr|l|m|n|pr|r|sch|tr|v|wh|x|y|z'.split('|'),
  'a|a|e|e|i|i|o|o|u|u|ae|ie|oo|ou'.split('|'),
  'b|ck|d|g|k|m|n|p|t|v|x|z'.split('|')];

function GenerateName() {
  var result = '';
  for (var i = 0; i <= 5; ++i)
    result += Pick(KParts[i % 3]);
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function LocalStorage() {
  this.getItem = function (key, callback) {
    var result = window.localStorage.getItem(key);
    if (callback)
      callback(result);
  };

  this.setItem = function (key, value, callback) {
    window.localStorage.setItem(key, value);
    if (callback)
      callback();
  };

  this.removeItem = function (key) {
    window.localStorage.removeItem(key);
  };
}


function CookieStorage() {
  this.getItem = function(key, callback) {
    var result;
    $.each(document.cookie.split(";"), function (i,cook) {
      if (cook.split("=")[0] === key)
        result = unescape(cook.split("=")[1]);
    });
    if (callback)
      setTimeout(function () { callback(result); }, 0);
    return result;
  };

  this.setItem = function (key, value, callback) {
    document.cookie = key + "=" + escape(value);
    if (callback)
      setTimeout(callback, 0);
  };

  this.removeItem = function (key) {
    document.cookie = key + "=; expires=Thu, 01-Jan-70 00:00:01 GMT;";
  };
}

function SqlStorage() {
  this.async = true;

  this.db = window.openDatabase("pqr", "", "Progress Quest Remix", 2500);

  this.db.transaction(function(tx) {
    tx.executeSql("CREATE TABLE IF NOT EXISTS Storage(key TEXT UNIQUE, value TEXT)");
  });

  this.getItem = function(key, callback) {
    this.db.transaction(function (tx) {
      tx.executeSql("SELECT value FROM Storage WHERE key=?", [key], function(tx, rs) {
        if (rs.rows.length)
          callback(rs.rows.item(0).value);
        else
          callback();
      });
    });
  };

  this.setItem = function (key, value, callback) {
    this.db.transaction(function (tx) {
      tx.executeSql("INSERT OR REPLACE INTO Storage (key,value) VALUES (?,?)",
                    [key, value],
                    callback);
    });
  };

  this.removeItem = function (key) {
    this.db.transaction(function (tx) {
      tx.executeSql("DELETE FROM Storage WHERE key=?", [key]);
    });
  };
}

function UrlEncode(s) {
  return encodeURIComponent(s).replace(/%20/g, "+");
}

var iPad = navigator.userAgent.match(/iPad/);
var iPod = navigator.userAgent.match(/iPod/);
var iPhone = navigator.userAgent.match(/iPhone/);
var iOS = iPad || iPod || iPhone;

function HasLocalStorage() {
  // Accessing window.localStorage can itself throw (e.g. blocked cookies).
  try {
    var k = '__pq_probe__';
    window.localStorage.setItem(k, k);
    window.localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
}

// localStorage everywhere it works. Older builds forced iOS onto WebSQL,
// which browsers are removing; rosters saved there are copied over once
// (see LocalStorage.getItem below).
var storage = (HasLocalStorage() ? new LocalStorage() :
               window.openDatabase ? new SqlStorage() :
               new CookieStorage());

if (storage instanceof LocalStorage && window.openDatabase) {
  (function (getItem) {
    storage.getItem = function (key, callback) {
      var value = window.localStorage.getItem(key);
      if (key !== 'roster' || value) return getItem.call(this, key, callback);
      // Nothing in localStorage yet: look for a legacy WebSQL roster.
      var done = false;
      function finish(legacy) {
        if (done) return;
        done = true;
        if (legacy) window.localStorage.setItem(key, legacy);
        if (callback) callback(legacy || value);
      }
      try {
        window.openDatabase("pqr", "", "Progress Quest Remix", 2500)
          .readTransaction(function (tx) {
            tx.executeSql("SELECT value FROM Storage WHERE key=?", [key],
              function (tx, rs) { finish(rs.rows.length ? rs.rows.item(0).value : null); },
              function () { finish(null); return false; });
          }, function () { finish(null); });
      } catch (e) {
        finish(null);
      }
    };
  })(storage.getItem);
}

storage.loadRoster = function (callback) {
  function gotItem(value) {
    if (value) {
      try {
        value = JSON.parse(value);
      } catch (err) {
        // aight
      }
    }
    value = value || {};
    callback(value);
    storage.games = value;
  }
  this.getItem("roster", gotItem);
}

storage.loadSheet = function (name, callback) {
  return this.loadRoster(function (games) {
    if (callback)
      callback(games[name]);
  });
}

storage.storeRoster = function (roster, callback) {
  this.games = roster;
  try {
    this.setItem("roster", JSON.stringify(roster), callback);
  } catch (err) {
    if (err.name === "QuotaExceededError" ||
        err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        err.toString().indexOf("QUOTA_EXCEEDED_ERR") != -1) {
      alert("This browser lacks storage capacity to save this game. This game can continue but cannot be saved. (Mobile Safari, I'll wager?)");
      this.storeRoster = function (roster, callback) {
        setTimeout(callback, 0);
      };
      setTimeout(callback, 0);
    } else {
      throw err;
    }
  }
}

storage.addToRoster = function (newguy, callback) {
  this.loadRoster(function (games) {
    games[newguy.Traits.Name] = newguy;
    storage.storeRoster(games, callback);
  });
}

Number.prototype.div = function (divisor) {
  var dividend = this / divisor;
  return (dividend < 0 ? Math.ceil : Math.floor)(dividend);
};

function LevelUpTime(level) {  // seconds
  // Normally 20 minutes for level 1. Set to 3 for testing
  // exponential increase after that
  return Math.round((3 + Math.pow(1.15, level)) * 60);
}

let RevString = '&rev=6';
// Rev strings known to server, probably:
// rev=3 is the minimum allowed by server, probably pq6.1
// rev=4 is pq6.2 the longstanding delphi client
// rev=5 is pq6.3 presumably the lazarus port or other unofficial release
// rev=6 is this here, pq-web multiplayer enabled

// Character names travel in the URL hash (main.html#Name). New links use
// encodeURIComponent; old links and bookmarks used escape(), so decoding
// falls back to unescape() for those.
function EncodeName(name) {
  return encodeURIComponent(name);
}

function DecodeName(s) {
  s = s || '';
  try {
    return decodeURIComponent(s);
  } catch (e) {
    return unescape(s);
  }
}

// Save format version. Bump this and add an entry to SaveMigrations
// whenever a change needs existing saves to be patched.
var SaveVersion = 2;

// SaveMigrations[n] upgrades a save from version n to n+1. Saves made
// before versioning existed count as version 0.
var SaveMigrations = [
  // 0 -> 1: correctly spelled spells were showing up as new spells when
  // the misspelled one was already in the spell book.
  function (sheet) {
    function patch(from, to) {
      function count(spell) {
        var t = sheet.Spells.filter(function (a) { return a[0] == spell; });
        return t.length == 1 ? toArabic(t[0][1]) : 0;
      }
      var tf = count(from);
      if (!tf) return;
      var total = tf + count(to);
      sheet.Spells = sheet.Spells.filter(function (a) { return a[0] != to; });
      sheet.Spells.forEach(function (spell) {
        if (spell[0] == from) {
          spell[0] = to;
          spell[1] = toRoman(total);
        }
      });
    }
    if (sheet.Spells) {
      patch('Innoculate', 'Inoculate');
      patch('Tonsilectomy', 'Tonsillectomy');
    }
  }
  ,
  // 1 -> 2: combat. Characters now have current HP and MP.
  function (sheet) {
    var hp = parseInt(sheet.Stats['HP Max'], 10) || 0;
    var mp = parseInt(sheet.Stats['MP Max'], 10) || 0;
    sheet.HPBar = { position: hp, max: hp };
    sheet.MPBar = { position: mp, max: mp };
  }
];

function MigrateSave(sheet) {
  var v = sheet.saveVersion || 0;
  if (v > SaveVersion)
    throw new Error("This character was saved by a newer version of Progress Quest Remix (save v" +
                    v + ", this is v" + SaveVersion + ").");
  for (; v < SaveVersion; ++v)
    SaveMigrations[v](sheet);
  sheet.saveVersion = SaveVersion;
  return sheet;
}

var K = {};

K.Traits = ["Name", "Race", "Class", "Level"];

K.PrimeStats = ["STR","CON","DEX","INT","WIS","CHA"];
K.Stats = K.PrimeStats.slice(0).concat(["HP Max","MP Max"]);

// Attribute profiles
// ------------------
// Every race and class lists a primary and a secondary attribute
// ("Name|PRIMARY,SECONDARY"). A character's profile adds them up: the
// primary is worth K.PrimaryWeight, the secondary K.SecondaryWeight, and
// an attribute listed by both race and class counts twice.
K.PhysicalStats = ["STR","CON","DEX","HP Max"];
K.ArcaneStats   = ["INT","WIS","CHA","MP Max"];
K.PrimaryWeight = 2;
K.SecondaryWeight = 1;

// How strongly a profile attribute is favored when a stat point is won.
// Every stat starts at K.StatPickBase, plus its profile weight, so with the
// defaults a primary is picked 5:3 as often as an unlisted stat and a
// secondary 4:3. Lower it for a stronger bias (2 makes a primary 2:1).
K.StatPickBase = 3;

// Extra HP/MP on level-up, in percent per point of profile weight, when
// HP Max or MP Max is in the profile (primary +30%, secondary +15%).
K.PoolGrowthPerWeight = 15;

// The tags of a race or class by name, e.g. ["STR","INT"]; [] if unknown.
function StatTags(list, name) {
  for (var i = 0; i < list.length; ++i) {
    var parts = list[i].split("|");
    if (parts[0] === name)
      return parts[1] ? parts[1].split(",") : [];
  }
  return [];
}

// Profile of a race/class combination:
//   weights      { stat: weight } for every stat in K.Stats (0 if unlisted)
//   primary      stats that are a primary for the race or the class
//   secondary    stats that are a secondary (and not also a primary)
//   physical     total weight on K.PhysicalStats
//   arcane       total weight on K.ArcaneStats
//   physicality  physical / (physical + arcane): 1 is pure brawn, 0 is pure
//                magic. 0.5 if the race and class are both unknown.
function AttributeProfile(race, klass) {
  var weights = {};
  $.each(K.Stats, function (i, stat) { weights[stat] = 0; });
  var primary = [], secondary = [];
  $.each([StatTags(K.Races, race), StatTags(K.Klasses, klass)], function (i, tags) {
    $.each(tags, function (j, stat) {
      if (!(stat in weights)) return;
      weights[stat] += j === 0 ? K.PrimaryWeight : K.SecondaryWeight;
      if (j === 0) {
        if (primary.indexOf(stat) < 0) primary.push(stat);
      } else if (secondary.indexOf(stat) < 0) {
        secondary.push(stat);
      }
    });
  });
  secondary = secondary.filter(function (s) { return primary.indexOf(s) < 0; });

  var physical = 0, arcane = 0;
  $.each(K.PhysicalStats, function (i, s) { physical += weights[s]; });
  $.each(K.ArcaneStats, function (i, s) { arcane += weights[s]; });
  return {
    weights: weights,
    primary: primary,
    secondary: secondary,
    physical: physical,
    arcane: arcane,
    physicality: (physical + arcane) ? physical / (physical + arcane) : 0.5
  };
}

// "Martial 67% / Arcane 33%"
function ProfileSummary(profile) {
  var m = Math.round(100 * profile.physicality);
  return "Martial " + m + "% / Arcane " + (100 - m) + "%";
}

K.Equips = ["Weapon",
            "Shield",
            "Helm",
            "Hauberk",
            "Brassairts",
            "Vambraces",
            "Gauntlets",
            "Gambeson",
            "Cuisses",
            "Greaves",
            "Sollerets"];

// From 47 to 406 spells
K.Spells = [
  "Mostly True Seeing",
  "Gravity Stinkhole",
  "Just Danse Macabre",
  "Nystul's Magic Fedora",
  "Tumor (Malignant)",
  "Passive Aggressive Lockjaw",
  "Necrophilia-mancy",
  "50 Shades of Greyskull",
  "Foreskin-sight",
  "Stinking Cloud Computing",
  "Otto's Irresistible Lap Dance",
  "Prismatic Fray",
  "Meatier Swarm",
  "Vitreous Humor",
  "Time Stop Hammer Time",
  "Green-Flame Blade Runner",
  "Speak with Dead Kennedys",
  "Cooties Inoculate",
  "Banishing Smite the Bullet",
  "Wall of Ring of Fire",
  "Witch Bolt Action Rifle",
  "Linger of Death",
  "Cause Fear Factory",
  "Kitchen Counterspell",
  "Squid Pro Quo",
  "Magnetic Orb",
  "Mage Under Armor",
  "Vortex Time Warp",
  "Wheel of Fortune's Favor",
  "Silent Chill Touch",
  "Jurassic Barkskin",
  "Ursine Armor",
  "Stone Shape of Water",
  "Dominatrix Monster",
  "Silent Butt Deadly Image",
  "Enhance Futility",
  "Ooze of Questionable Origin",
  "Fingering of Death",
  "Sacred Flambé",
  "Seasick",
  "Remove Blurse",
  "Whirl Wind Beneath My Wings",
  "Battlefield Earthquake",
  "Earthen Grasp and the Furious",
  "Pink Floyd's The Wall of Fire",
  "Identify Gently-Used Corpse Loot",
  "Minor Collusion",
  "Animal Friend-zone-ship",
  "Find Google Traps",
  "Poison Ocean Spray",
  "Infinite Confusion",
  "Burning Glands",
  "Holy Roller",
  "Sneezing Sphere",
  "Ray of Emma Frost",
  "Vampiric Touch Ado About Nothing",
  "Ectoplasmic Horny Jail",
  "Thunder Step-Sibling Porn",
  "Dropsy Drop Bear",
  "Word of Total Recall",
  "Holy Weapon of Math Destruction",
  "History Lesson",
  "Ethe-Loreal-ness",
  "Aqueous Humor",
  "Redneck Plague",
  "Conjure Pointy Bits",
  "Arcane Eye-Phone",
  "Collect Call Lightning",
  "Hydrophobia",
  "Create Food and Waterslide",
  "+10 to Sexterity",
  "Astral Miasma",
  "Scrying Your Eyes Out",
  "Spectral Miasma Marinara",
  "Hastiness",
  "Locate Creature Comforts",
  "Tiny Pizza Hut",
  "Inflict Prunes",
  "Tasha's Otherworldly Five Guys",
  "Ray of Down with the Sickness",
  "Healing Whirred",
  "Braingate",
  "Wind Wonderwall",
  "Heat Meal Gear Solid",
  "Gravity Anal Fissure",
  "Dog the Bounty Hunter's Mark",
  "Sierra Misty Step",
  "Mordenkainen's Faithful Clown",
  "Feather Fall of Duty",
  "Scold Person",
  "Magic Bristle",
  "Choke a Bitch",
  "Word of Pool of Radiance",
  "Discount Llama Companion",
  "Notre Flame Arrows",
  "Project Scrimmage",
  "Curse Family",
  "Mass Effect Suggestion",
  "Boston Globe of Invulnerability",
  "Curse Name",
  "Thorn Miracle Whip",
  "Donkey Punch",
  "Black Idaho",
  "Infernal Calling Card",
  "Saturday Blight Live",
  "Igor's Itchy Undergarments",
  "Plane Thrift",
  "Floating Disk Drive",
  "Shoelaces",
  "Dimension Doorbell",
  "Mike's Hard Lemonade",
  "Premature Evocation",
  "Grasping Vines and TikToks",
  "Summon Beast Germany",
  "Blink-182",
  "Somewhat-Good-Berry",
  "Ice Cream Cone of Cold",
  "Eye of the Troglodyte",
  "Scorching Rachel Ray",
  "Eldritct Baja Blast",
  "Pantalones Giganticus",
  "Blunderwave",
  "Shadow the Hedgehog Blade",
  "Divine Flavor",
  "For Crying Out Cloudkill",
  "Gaseous this isn't even my Final Form",
  "Chaos Emerald Bolt",
  "Fire Usain Bolt",
  "Surprise Surgery",
  "Circle of Power Ranger",
  "Swear the Dying",
  "Greator or less than Restoration",
  "Beauty and the Beast Sense",
  "Tonsillectomy",
  "Power Word Kill Gates",
  "Friar-ball",
  "Tensor's Floating Disk Drive",
  "Portal to Elemental Plane of Gravy",
  "Stoned Skin",
  "Braise Dead",
  "Incenidiary Cloud Nine",
  "Feeblemind Over Matter",
  "Disguise Shelf",
  "Sickening Miscellaneous",
  "Toll the Dead Hot Chili Peppers",
  "Flicum Bicus",
  "Grind Familiar",
  "Slime Finger",
  "Grognor's Big Day Off",
  "Psychic Scream VI",
  "Frobnitz Frobnosia Xyzzy",
  "Dissonant Careless Whispers",
  "Tasha'a Mind Cool Whip",
  "Icy Hot Knife",
  "Thunder The Clap",
  "Holy Batpole",
  "Ensnaring Sike",
  "Detect Tragic",
  "Invisible Glands",
  "Not-quite Invulnerability",
  "Sun Burst-Person Shooter",
  "Tasha's Hideous Shafter",
  "Greased Chain Lightning",
  "Milf's Acid Hard Shaft",
  "Transmute Dwayne The Rock Johnson",
  "Inflict Crotch Rot",
  "Modify Memory-foam",
  "Mind Spike Lee",
  "Acrid Hands",
  "Cone of Paste",
  "Gelatinous Cube Jenga",
  "Freedom of Bowel Movement",
  "Wrath of Khan of Nature",
  "Summon a Bitch",
  "Blur Wounds",
  "Tumor (Benign)",
  "Power Word House of Pain",
  "Roger's Bland Illusion",
  "Faerie Fireball Whiskey",
  "Mage Gland",
  "Wombats All the Way Down",
  "Right to OwlBear Arms",
  "Hocus Pocus In Loco Parentis",
  "Smarm Person",
  "Spectral Oyster",
  "Rebecca Black Tentacles",
  "Animate Nightstand",
  "Swiss Army Life Transference",
  "Choke-Hold Person",
  "Angioplasty",
  "Cone of Annoyance",
  "Peeled of Faith",
  "Biggus Dickus Energus",
  "Dancing Tights",
  "Spiritual Lethal Weapon",
  "Nonplus",
  "Frammin' on the jim-jam",
  "Dispel Magic Kingdom",
  "Acid Splash Gordon",
  "Poly-amorous-morph",
  "True Lies Seeing",
  "Clever Fellow",
  "Swift Quivering Loins",
  "BarryWhiteus candlelightus girl-exciteus",
  "Nuclear Power Plant Growth",
  "Anti-tragic Field",
  "Conjure Instumental",
  "Alter Elf",
  "Three Wolf Moon Beam",
  "Lightning Broken Arrow",
  "Bigby's Hand Sanitizer",
  "Sadness",
  "Foregone Illusion",
  "Pre-stud-agitation",
  "Nestor's Bright Idea",
  "Vicious Colin Mochrie",
  "Water Walk Like an Egyptian",
  "Melf's Acid Reflux",
  "Bigby's Inappropriate Hand",
  "Tasha's Caustic Remark",
  "Evard's Tickling Tentacles",
  "Leomund's Subprime Mortgage",
  "Rope Trick-or-Treat",
  "Pass Without a Trace of Dignity",
  "Cone of Lukewarm",
  "Summon Greater Caucasian",
  "Crown of Madness: Fury Road",
  "Glibness (Corporate Edition)",
  "Geas Lightning",
  "Animate Deadbeat Dad",
  "Vicious Mockery of Justice",
  "Guiding Lite Beer",
  "Misty Step-Father",
  "Chain Smoking Lightning",
  "Phantasmal Killer Queen",
  "Hold Person hostage",
  "Power Word Chill",
  "Power Word Spill",
  "Wall of Text",
  "Spiritual Sidearm",
  "Speak with Animals (Unsolicited)",
  "Banishment to Gary, Indiana",
  "Arcane Lockout",
  "Detect Mild Disapproval",
  "Color Spray Tan",
  "Blink-and-You-Miss-It",
  "Antilife Shellfish Allergy",
  "Mirror Image Issues",
  "Locate Car Keys",
  "Uncontrollable Flatulence",
  "Tenser's Floating Keg",
  "Gentle Repose in Peace",
  "Zone of Brutal Honesty",
  "Chill Touch of Gray",
  "Delayed Blast Fire Marshall",
  "Finger of Mild Discomfort",
  "Spare the Dying of Embarrassment",
  "Sending 'U up?'",
  "Mass Suggestion Box",
  "Otiluke's Resilient Bubble Wrap",
  "Beacon of Hope Solo",
  "Polymorph into a Moderately Priced Sedan",
  "Conjure Woodland HOA",
  "Eyebite the Curb",
  "Prismatic Spray-on Deodorant",
  "Holy Waterboard",
  "Find Traps in the Contract",
  "Comprehend Broken Spanglish",
  "Ray of Enfeeble-Mint Gum",
  "Dispel Mojo",
  "Crushing Despair (Clinically Diagnosed)",
  "Drawmij's Instant Regret",
  "Rary's Telepathic Conference Call",
  "Feign Death to Avoid Conversation",
  "Snilloc's Snowball Fight",
  "Aganazzar's Hot Pocket Scorcher",
  "Maximilian's Earthen Fistbump",
  "Jim's Glowing Magic Coin",
  "Flock of Karens",
  "Galder's Speedy Delivery",
  "Summon Underpaid Intern",
  "Nathair's Mischievous Tax Fraud",
  "Ashardalon's Heartburn",
  "Fizban's Platinum Credit Card",
  "Blade Ward Cleaver",
  "True Strike Three",
  "Guidance Counselor",
  "Thorn Whip-It",
  "Mind Sliver of Hope",
  "Primal Savagery Gardens",
  "Sword Burst-a-Move",
  "Thunderclap of Doom-scrolling",
  "Inflict Papercuts",
  "Cure Moderate Hangover",
  "Expeditious Retreat to the Bathroom",
  "Arms of Little Caesar",
  "Chaos Bolt-on Exhaust",
  "Heroism at Clearance Price",
  "Witch Bolt 45",
  "Zephyr Strike a Pose",
  "Barkskinny Dipping",
  "Flame Blade Trinity",
  "Spike Growth Hormone",
  "Cloud of Daggers (Plastic)",
  "Crown of Thorns and Roses",
  "Darkness My Old Friend",
  "Enthrall of the Wild",
  "Levitate Suspiciously",
  "Spider Climb into Bed",
  "Hypnotic Pattern Baldness",
  "Slow and Steady Wins the Race",
  "Call Lightning Charging Cable",
  "Conjure Barrage of Excuses",
  "Hunger of Hadar's Kitchen",
  "Melf's Minute Minute Maid",
  "Tiny Servant (Minimum Wage)",
  "Compulsion Shopping",
  "Confusion Matrix",
  "Dimension Doorknob",
  "Fabricate Evidence",
  "Giant Insect Repellent",
  "Ice Stormy Daniels",
  "Locate Restroom",
  "Phantasmal Killer Whale",
  "Stone Shape of You",
  "Watery Sphere of Influence",
  "Cloudkill Joy",
  "Commune with Dead Relatives for Money",
  "Contact Other Plane Ticket",
  "Contagion Warning",
  "Danse Macarena",
  "Destructive Wave Goodbye",
  "Geas by the Throttle",
  "Hold Monster Energy",
  "Insect Plague of Locust Valley",
  "Mislead Singer",
  "Modify Memory Leak",
  "Reincarnate as a Beetle",
  "Scrying Out Loud",
  "Seeming Legit",
  "Telekinesis Pillow Fight",
  "Teleportation Circle Jerk",
  "Transmute Rock to Pop",
  "Wall of Stone Cold Steve Austin",
  "Chain Lightning McQueen",
  "Circle of Death Metal",
  "Create Undead Broke",
  "Disintegrate into Tears",
  "Eyebite-sized Snickers",
  "Flesh to Styrofoam",
  "Freezing Sphere of Influence",
  "Guards and Wards Wardrobe Malfunction",
  "Harm's Way",
  "Heal the World",
  "Heroes' Feast of Lean Cuisines",
  "Magic Jar Jar Binks",
  "Mass Suggestion Engine",
  "Otto's Irresistible Macaroni",
  "Programmed Illusion of Choice",
  "Sunbeam Me Up Scotty",
  "True Seeing Red",
  "Delayed Blast Taco Bell",
  "Fire Stormtrooper",
  "Mirage Arcane Candy",
  "Mordenkainen's Magnificent Airbnb",
  "Plane Shift into Reverse",
  "Prismatic Spray Paint",
  "Project Imageboard",
  "Regenerate Teeth",
  "Resurrection Shuffle",
  "Reverse Gravity Bong",
  "Sequestered Jury",
  "Simulacrum of Truth",
  "Symbol of Status",
  "Teleport to Nearest Wendy's",
  "Whirlwind Romance",
  "Animal Shapes and Sizes",
  "Antipathy-Sympathy Card",
  "Clone High",
  "Control Weather Underground",
  "Demiplane of Cheap Wine",
  "Dominate Monster Truck",
  "Earthquake Shake",
  "Feeblemind Game",
  "Holy Aura Borealis",
  "Incendiary Cloudflare",
  "Maze Runner",
  "Mind Blank Slate",
  "Power Word Stun Gun",
  "Power Word Shart",
  "Sunburst Fruit Chew",
  "Astral Projection Screen",
  "Foresight is 20/20",
  "Gate Crash",
  "Imprisonment Without Trial",
  "Mass Heal the World",
  "Meteor Swarm of Angry Bees",
  "Power Word Killjoy",
  "Prismatic Wall of Sound",
  "Shapechange My Mind",
  "Time Stop Collaborate and Listen",
  "Time Stop Hammer Time",
  "Time Stop in the Name of Love",
  "True Polymorph into a Roomba",
  "Weird Flex But OK",
];

// from 11 to 102 Offensive Attributes
K.OffenseAttrib = [
  "Not-Shabby|+1",
  "Somewhat-Sharp|+1",
  "Mostly-Clean|+1",
  "Kinda-Solid|+1",
  "Hardly-Rusted|+1",
  "Adequate|+1",
  "Pointy-ish|+1",
  "Barely-Tetanus-Free|+1",
  "Passably-Sturdy|+1",
  "Slightly-Menacing|+1",
  "Better-Than-A-Stick|+1",
  "Tolerably-Pointed|+1",
  "Cleaned-With-Spit|+1",
  "Dented-But-Functional|+1",
  "Wobbly-Shafted|+1",
  "Heftsome|+2",
  "Pain-Inducing|+2",
  "Multi-stabby|+2",
  "Steely|+2",
  "Stingy|+2",
  "Poke-Tastic|+2",
  "Aggressively-Heavy|+2",
  "Splinter-Infused|+2",
  "Thwack-Happy|+2",
  "Bruise-Prone|+2",
  "Ouchy|+2",
  "Semi-Lethal|+2",
  "Shin-Kicking|+2",
  "Rib-Tickling|+2",
  "Uncomfortably-Pointed|+2",
  "Spleen-Seeking|+3",
  "Nasty-Tempered|+3",
  "Groin-Punting|+3",
  "Toe-Stubbing|+3",
  "Mildly-Cursed|+3",
  "Flesh-Parting|+3",
  "Smack-Worthy|+3",
  "Sinister-Looking|+3",
  "Subtly-Glowy|+3",
  "Ankle-Whacking|+3",
  "4chan-Troll-Slaying|+3",
  "Hurtful|+3",
  "Magicalastic|+3",
  "Decidedly-Unfriendly|+3",
  "Vicious|+3",
  "Bitch-Smacking|+4",
  "Enchantified|+4",
  "Venomed|+4",
  "Stabbity|+4",
  "Giggle-Slicing|+4",
  "Gore-Splattered|+4",
  "Kneecap-Cracking|+4",
  "Spiky-McSpikerson|+4",
  "Kidney-Piercing|+4",
  "Rage-Fueled|+4",
  "Over-Enchanted|+4",
  "Skull-Concussing|+4",
  "Spleen-Vented|+4",
  "Gut-Wrenching|+4",
  "Hackmaster|+5",
  "En Fuego|+5",
  "Dirty-Dancing|+5",
  "Forceful|+5",
  "Face-Melting|+5",
  "Excessively-Sharpened|+5",
  "Blood-Spattering|+5",
  "Ass-Kicking|+5",
  "Brimstone-Laced|+5",
  "Unnecessarily-Spiky|+5",
  "Viscera-Churning|+5",
  "Throat-Cleaving|+5",
  "Gloom-Forged|+5",
  "Limb-Decoupling|+5",
  "Holy-Forkballs|+6",
  "Invisible|+6",
  "Talking|+6",
  "Mighty|+6",
  "Soul-Devouring|+6",
  "Mother-In-Law-Grade|+6",
  "Screaming-In-Tongues|+6",
  "Meme-Tier|+6",
  "Slightly-Sentient|+6",
  "Thunder-Thumping|+6",
  "Cranial-Caving|+6",
  "Apocalyptic-ish|+6",
  "Doomsday-Lite|+6",
  "Blindingly-Shiny|+6",
  "Vorpal|+7",
  "Puissant|+7",
  "Ginormous|+7",
  "Adamantine|+7",
  "Nigh-Omnipotent|+7",
  "Server-Crashing|+7",
  "Universe-Dentingly-Sharp|+7",
  "DM-Infuriating|+8",
  "Reality-Sundering|+8",
  "Physics-Defying|+8",
  "God-Smiting|+9",
  "Game-Breaking|+9",
  "One-Shot-Wonder|+9",
  "RNGesus-Blessed|+10",
  "Bribed-the-GM|+10",
];

// from 9 to 102 Defensive Attributes
K.DefenseAttrib = [
  "Form-Fitted|+1",
  "Star-Studded|+1",
  "Mostly-Solid|+1",
  "Pillow-Fortified|+1",
  "Color-Coordinated|+1",
  "Duct-Taped|+1",
  "Cardboard-Reinforced|+1",
  "Bubble-Wrapped|+1",
  "Slightly-Padded|+1",
  "Tough-As-Jerky|+1",
  "Stain-Resistant|+1",
  "Double-Stitched|+1",
  "Sweat-Wicking|+1",
  "Wrinkle-Free|+1",
  "Pinch-Proof|+1",
  "Travelocity-Gnome-Made|+2",
  "Bedazzled|+2",
  "Band-aid-ed|+2",
  "Gilded|+2",
  "Officially-Licensed|+2",
  "Scotchgard-Treated|+2",
  "Flex-Sealed|+2",
  "As-Seen-On-TV|+2",
  "Velcro-Fastened|+2",
  "WD-40-Lubed|+2",
  "Ergonomic|+2",
  "Snuggly-Fitted|+2",
  "Polite-Looking|+2",
  "Faux-Leather-Lined|+2",
  "Blinged-Out|+2",
  "Shelven|+3",
  "Magicalastic|+3",
  "Cambric|+3",
  "Thematically Appropriate|+3",
  "Festooned|+3",
  "Chic-Yet-Defensive|+3",
  "Linoleum-Plated|+3",
  "Non-Stick-Coated|+3",
  "Hermetically-Sealed|+3",
  "Aerodynamic|+3",
  "Artisanal-Forged|+3",
  "Snazzy|+3",
  "Reinforced-Gore-Tex|+3",
  "Puffer-Vested|+3",
  "Over-Engineered|+3",
  "Holy|+4",
  "Fine-Ass|+4",
  "Krystal|+4",
  "Enchantified|+4",
  "Rubber-Bumpered|+4",
  "Deflect-O-Matic|+4",
  "Cast-Iron-Seasoned|+4",
  "Shamelessly-Bulky|+4",
  "Shock-Absorbing|+4",
  "Glow-in-the-Dark|+4",
  "Reflective-Safety|+4",
  "Bullet-Dodgey|+4",
  "Spiky-Shielded|+4",
  "Repellant-Scented|+4",
  "Mithrallic|+5",
  "Mecha|+5",
  "Impressive|+5",
  "Unyielding|+5",
  "Adamantastic|+5",
  "Bespoke-Chitin|+5",
  "Tungsten-Reinforced|+5",
  "Cast-Iron-Skillet|+5",
  "Nokia-3310-Cased|+5",
  "Heavy-Duty-Industrial|+5",
  "Explosion-Proof|+5",
  "Armor-All-Dipped|+5",
  "Dwarven-Overbuilt|+5",
  "Stab-Deflecting|+5",
  "Diamond-Encrusted|+6",
  "Most-Impressive|+6",
  "Kevlar|+6",
  "Impenetrable|+6",
  "Plot-Armored|+6",
  "Bank-Vault-Grade|+6",
  "Titanium-Encrusted|+6",
  "Forcefield-Adjacent|+6",
  "Bubble-Boy-Grade|+6",
  "Cringe-Deflecting|+6",
  "Insufferably-Sturdy|+6",
  "Vibranium-Flavored|+6",
  "Gargantuan-Plated|+6",
  "Hazard-Suited|+6",
  "Phase-Shifting|+7",
  "Unobtanium|+7",
  "Unassailable|+7",
  "Pay-to-Win|+7",
  "Save-Scummed|+7",
  "Invulnerabilicious|+7",
  "Nerf-Immune|+7",
  "Hitbox-Displacing|+7",
  "Subscription-Tier|+8",
  "Cheat-Coded|+8",
  "DM-Proof|+8",
  "Dev-Console-Forged|+9",
  "Main-Character-Syndrome|+9",
  "God-Mode-Toggled|+10",
  "Bribed-the-GM|+10",
];

// from 16 to 116 Shields
K.Shields = [
  "Parasol|0",
  "Paper Hand Fan|0",
  "Cocktail Umbrella|0",
  "Cardboard Coaster|0",
  "Bubble Wrap Mailer|0",
  "Soggy Pizza Box|1",
  "Pie Plate|1",
  "Crusty Mousepad|1",
  "Cafeteria Tray|1",
  "Tupperware Lid|1",
  "Garbage Can Lid|2",
  "Half-Chewed Frisbee|2",
  "Baking Sheet|2",
  "Hubcap|2",
  "Expired Coupon Mailer|2",
  "Foam LARP Shield|3",
  "Belt Buckler|3",
  "Clipboard of Authority|3",
  "Stop Sign|3",
  "Sledding Saucer|3",
  "Pot Lid|4",
  "Plexiglass|4",
  "Fender|4",
  "Wok of Ages|4",
  "Cast-Iron Skillet|4",
  "Paula Deen Butter Tray|4",
  "Woody Shield|5",
  "Ground Round Shield|5",
  "Lazy Susan|5",
  "Cutting Board of Truth|5",
  "Travelocity Roaming Gnome Buckler|5",
  "VW Beetle Carapace|6",
  "Bronzer Shield|6",
  "Ironing Board Tower Shield|6",
  "Kegerator Cover|6",
  "Spruce Goose Wing Section|6",
  "Roman Scutum|7",
  "Carriage Door|7",
  "Pinball Playfield Glass|7",
  "Derrick Door|7",
  "Sump Pump Lid|7",
  "Manhole Cover|8",
  "Propugner|8",
  "Storm Door with Screen|8",
  "Bass Drumhead|8",
  "Chamberpot Lid|8",
  "Steel Space Heater|9",
  "Kite Shield|9",
  "Smiley Face Shield|9",
  "Turtle Shell Phone|9",
  "Spiked Buckler of Pretzel Biting|9",
  "4Chan Troll Bone Shield|10",
  "Pavise|10",
  "Trash Compactor Door|10",
  "Space Invader Shield|10",
  "Riot Control Polycarb|10",
  "Spiked Hard Shield|11",
  "Solar Tower Shield|11",
  "Stonecutter Guild Plaque|11",
  "Lead-Lined Apron|11",
  "Turtle Waxed Targe|11",
  "Baroque Shield|12",
  "Spiked Pavise|12",
  "Captain Americool Shield|12",
  "Bouncing Buckler|12",
  "Titanium Waffle Iron|12",
  "Ballistic Shield|13",
  "Graphene Glider Wing|13",
  "Hover-Board Plating|13",
  "Deflect-o-Matic|14",
  "Nokia 3310 Backplate|14",
  "Shed Door of Fortitude|14",
  "Segway Baseplate|14",
  "Hylian Shield|15",
  "Shield of the Silver Surfer|15",
  "Bad Dragon Scale Buckler|15",
  "Shield Knight Shield|16",
  "Ablative Microwave Door|16",
  "Ankh-Morpork Crest|16",
  "Brick Wall|17",
  "Cyberman Sternum Plate|17",
  "Force-Field Generator (Refurbished)|17",
  "Titan-Anium Shield|18",
  "Solid State Drive Shield|18",
  "Spam Can Vault Wall|18",
  "Vibra-Adamantium Shield|19",
  "Beskar Dustbin|19",
  "Bulwark of Pure Irony|19",
  "Greatshield of Fartorias|20",
  "Greatshield of Havel the Rock Johnson|20",
  "Tower of Babel Brick|20",
  "Shield of Achilles|21",
  "Shield of the High Treant|21",
  "Brave Sir Robin's Crest|21",
  "Shield of Aeneas|22",
  "Gorgon's Makeup Mirror|22",
  "Trollface Tower Shield|22",
  "Pridwin|23",
  "Mirror Shield of Narcissus|23",
  "Great Wall of China Replica|23",
  "Ochain|24",
  "Bravado Barrier|24",
  "Eternium Heater|24",
  "Svalinn|25",
  "Ancile of Mars|25",
  "Aegis|26",
  "Dubious Plot Aegis|26",
  "Magnetic Field|27",
  "Event Horizon|27",
  "Tachyon Deflector|28",
  "End-User License Agreement|28",
  "Terms of Service Pop-up|29",
  "Firewall of China|29",
  "Shield of Infinite Buffers|30",
  "DM Screen of Absolute Secrecy|31",
  "God-Mode Hex Grid|32",
];

// from 20 to 63 Armors
K.Armors = [
  "Chantilly and Lace|1",
  "Wet T-Shirt|1",
  "Macrame Jockstrap|2",
  "Padded Cell Armor|2",
  "Iron Maiden Shirt|3",
  "Burlap Sack|3",
  "Oil on Canvas|4",
  "Bikini Chain Mail|4",
  "Stiff Dirty Laundry|5",
  "Grungy Flannel|5",
  "Hide and Seek Armor|6",
  "Outlaw Chamois Loofah|6",
  "Sweaty Pleathers|7",
  "Gambeson|7",
  "Stud Leather|8",
  "Kinky Leathers|8",
  "Chain Polo Shirt|9",
  "Care Bearskin|9",
  "Lamellar Armor|10",
  "Lord of the Ringmail|10",
  "Full Fursuit|11",
  "Briga-Paula-Deen|11",
  "Kinsey Scale Mail|12",
  "Boner Armor|12",
  "Food Chain Mail|13",  
  "Splinter Mail|13",
  "Touring Banded Mail|14",
  "Big Breast Plate|14",
  "Shelven Chain Mail|15",
  "Half and Half Plate|15",
  "Tectonic Plate Mail|16",
  "5 O'Clock Shadow Mail|16",
  "Masterwork Plate Mail|17",
  "ABS|17",
  "Kevlar|18",
  "Grandmaster Plate Mail|18",
  "Titan-anium|19",
  "Gorgonzola Plate|19",
  "Brian Blessed Mail|20",
  "Mitrail Mail|21",
  "Sylvan Mail|22",
  "Doom 2 BFG Plate|23",
  "Bad Dragon Scale Mail|24",
  "Vibranium Half Plate|25",
  "Diamond Mail|26",
  "Vibrabiun Full Plate|27",
  "Drow Half Plate|28",
  "Drow Full Plate|29",
  "Mithril Half Plate|30",
  "Adamantine Half Plate|31",
  "Mithril Full Plate|32",
  "Underdark Under Armor|33",
  "Armor of Memnon|34",
  "Breastplate of Herakles|35",
  "Adamantine Full Plate|36",
  "Ablative Armor|37",
  "Beskar Armor|38",
  "Godzilla Scale|39",
  "Iron Man M42|40",
  "Symbiote Suit|41",
  "Hulk Buster|42",
  "Use the Force Field|43",
  "Plot Armor|45",
  ];

// from 39 to 137 Weapons
K.Weapons = [
  "Hollow log|0",
  "Self defense fruit|0",
  "Stinky cheese|0",
  "Wet Noodle|0",
  "Broken Bottle|1",
  "Knifes too short|1",
  "Oxgoad|1",
  "Shiv|1",
  "Ugly Stick|1",
  "Warhammer Figurine|1",
  "Eelspear|2",
  "Handpeen|2",
  "Hard Rock|2",
  "My So Called Knife|2",
  "Thyme Hammer|2",
  "Wheel of hard cheese|2",
  "Tactical Spork|3",
  "Axe Body Spray|3",
  "Blaseball Bat|3",
  "Colostomy bag|3",
  "David Bowie Knife|3",
  "Knight Club|3",
  "Sling|3",
  "Kinky Studded Paddle|3",
  "Battleadze|4",
  "Cloaken Dagger|4",
  "Crowbar|4",
  "Devo-whip|4",
  "Nun-chunks|4",
  "Pogo-stick|4",
  "Shuri Ken|4",
  "Three-Quarters Staff|4",
  "Baselard|5",
  "Golf club|5",
  "Horsemans pick|5",
  "Leafmace|5",
  "Longish-iron|5",
  "Poachard|5",
  "Rock Lobster|5",
  "Shortish-sword|5",
  "Benjamin Bludgeon|6",
  "Crankbow|6",
  "Longish-sword|6",
  "Mack the Knife|6",
  "Mid-Morning Star|6",
  "Sling Blade|6",
  "Whinyard|6",
  "Windu Mace|6",
  "Blibo|7",
  "Broadsword|7",
  "Chip n Flail|7",
  "Flogger|7",
  "Kreen|7",
  "Not-Nice Pick|7",
  "Tail Pike|7",
  "Warhammer|7",
  "Armand Hammer|8",
  "Capital Gains Axe|8",
  "Die Bardiche|8",
  "Katana|8",
  "Knife of Brian|8",
  "Pole-adze|8",
  "Sonic the Hedgehog Screwdriver|8",
  "Spontoon|8",
  "Bastard Sword|9",
  "Ghoul-whip|9",
  "Knife Beater|9",
  "Peen-arm|9",
  "Pen Estoc|9",
  "Peregrine Falchion|9",
  "Wit Rapier|9",
  "Cloud Butters Sword|10",
  "Crossfit bow|10",
  "Culverin|10",
  "Inheritance Axe|10",
  "Lance-a-lot|10",
  "Tiger-tooth saber|10",
  "Yoda's stick|10",
  "Blunderbuss|11",
  "Dick Van Pike|11",
  "Hal's beard|11",
  "Icewind Flail|11",
  "White-tailed Spear|11",
  "Batarang|12",
  "Maxwells Silver Hammer|12",
  "Sword of Shan n Ara|12",
  "Sword of Tooth|12",
  "Trident Gun|12",
  "Bandyclef|13",
  "Lasso of Sleuth|13",
  "Millenium Falchion|13",
  "My Saber Totoro|13",
  "Spear of Lou|13",
  "Chekhovs Gun|14",
  "Green Powder Ring|14",
  "Ham Cannon|14",
  "Steampunk Chainsaw|14",
  "Sword of Griff n Door|14",
  "Bat-a-rang|15",
  "Glamdrink|15",
  "Ye Olde Shotgun|15",
  "Tron Disc|15",
  "Hoe of Destruction|16",
  "Lance of Longitude|16",
  "Lightsaber|16",
  "Mjölnir|17",
  "Spear of Density|17",
  "Proton Pack|18",
  "Holy Hand Grenade of Antioch|18",
  "Draggin Lance|19",
  "Chainsaw Hand|19",
  "Freddys Glove|20",
  "Gravity Gun|20",
  "Portal Kombat Gun|21",
  "Let it Keyblade|22",
  "Fat Albert Man|23",
  "Wabbajack-you-up|24",
  "Body Gravity Hammer|25",
  "Dagger of Thyme|26",
  "Busta Sword|27",
  "BFG Its-Over-9000|28",
  "Ivory and Ebony Blade|29",
  "He-Man Power Sword|30",
  "Star Trek Phaser|31",
  "Sword of Omens|32",
  "Golden Girls Gun|33",
  "Beam Katana|34",
  "Master Sword|35",
  "Andúril|36",
  "X Callie Bur|37",
  "Hackmaster +12 Sword|38",
  "Muramasa|39",
  "Darksaber|40",
  "R.Y.N.O.|41",
  "Murasame|42",
  "Ultima Blade|43",  
  "Some Anime Bullshit|45"
  ];

// from 37 to 91 Specials
K.Specials = [
  "Albatross",
  "Alembic",
  "Altar",
  "Amethyst",
  "Ankh",
  "Anklet",
  "Antidote",
  "Apparatus",
  "Arrow",
  "Bandolier",
  "Bell",
  "Bijou",
  "Bracelet",
  "Brassiere",
  "Spork",
  "Brazier",
  "Brocade",
  "Brooch",
  "Calcinator",
  "Candelabra",
  "Candle",
  "Cape",
  "Cauldron",
  "Charm",
  "Claw",
  "Cobble",
  "Coin",
  "Corset",
  "Crown",
  "Diadem",
  "Diary",
  "Elixir",
  "Fang",
  "Feather",
  "Fedora",
  "Festoon",
  "Figurine",
  "Fleece",
  "Galoon",
  "Gammel",
  "Garnet",
  "Gemstone",
  "Gimcrack",
  "Gimlet",
  "Globe",
  "Googles",
  "Grimoire",
  "Hood",
  "Hymnal",
  "Idol",
  "Ink pot",
  "Journal",
  "Lamp",
  "Laurel",
  "Lens",
  "Loom",
  "Mask",
  "Mortar",
  "Music box",
  "Necklace",
  "Nipple Ring",
  "Oil",
  "Orb",
  "Ornament",
  "Pestle",
  "Phial",
  "Philter",
  "Pixie-dust",
  "Pokédex",
  "Potion",
  "Pouch",
  "Quill",
  "Ring",
  "Robe",
  "Saddle",
  "Scabbard",
  "Sceptre",
  "Schwartz",
  "Scroll",
  "Shard",
  "Spangle",
  "Sphere",
  "Spork",
  "Statue",
  "Talisman",
  "Thong",
  "Tiara",
  "Token",
  "Tome",
  "Vulpeculum",
  "Wand",
  ];

// from 33 to 87 Item Attributes
K.ItemAttrib = [
  "Animated",
  "Arcane",
  "Artisinal",
  "Astral",
  "Austere",
  "Bedazzled",
  "Benevolent",
  "Blessed",
  "Chaosified",
  "Charming",
  "Color Coordinated",
  "Crafted",
  "Cromulent",
  "Cruciate",
  "Crystalline",
  "Cyber",
  "Deadly",
  "Diamond Encrusted",
  "Discombobulated",
  "Double-Shot",
  "Dual",
  "Eccentric",
  "Ectoplasmic",
  "Embiggened",
  "En Fuego",
  "Enchantified",
  "Ensorcelated",
  "Erotic",
  "Exotic",
  "Fearsome",
  "Festooned",
  "Filigreed",
  "Fine-Ass",
  "Flirting",
  "Foppish",
  "Frippery",
  "Frotzy",
  "Garlanded",
  "Gently-used",
  "Gilded",
  "Gleaming",
  "Gluten-free",
  "Golden",
  "Grandiose",
  "Holy Forkballs",
  "House Broken",
  "Invisible",
  "Iron",
  "Krystal",
  "Legendary",
  "Lucky",
  "Ludicrous",
  "Magicalastic",
  "Magnificent",
  "Maniacal",
  "Mecha",
  "Mithrallic",
  "Most Impressive",
  "Mythic",
  "Naked",
  "Officially Licensed",
  "One True",
  "Ormolu",
  "Ostentatious",
  "Pay-to-Win",
  "Pre-Owned",
  "Precious",
  "Proverbial",
  "Puissant",
  "Quirky",
  "Recently Sanitized",
  "Redonkulous",
  "Reverential",
  "Sacred",
  "Scrumtrulescent",
  "Shelven",
  "Shiny",
  "Spectral",
  "Talking",
  "Thematically Appropriate",
  "Travelocity-Gnome-Made",
  "Underdark",
  "Unearthly",
  "Unpredictable",
  "Venti",
  "Vorpal",
  "Wild",  ];

// from 52 to 107 Item Ofs
K.ItemOfs = [
  "Acrimony",
  "Adorkable",
  "Being Ratioed",
  "Bitcoin",
  "Boaty McBoatface",
  "Bullshot",
  "Catfishing",
  "Chaos Emerald",
  "Chillaxing",
  "Clickbait",
  "Comfort Inn",
  "Copypasta",
  "Crafting Minigames",
  "Cromulence",
  "Dad Bod",
  "Danger Mouse",
  "Deepfakes",
  "Diamonique",
  "Dignard",
  "Domination",
  "Douchebaggery",
  "Dude-bros",
  "e-Barrassment",
  "Efficiency",
  "Electrum",
  "Embiggening",
  "Extroversion",
  "Fealty",
  "Fear Factor",
  "Foreboding",
  "Foreshadowing",
  "Freemium",
  "Fursuits",
  "Fusion Frenzy",
  "Gaslighting",
  "Ghosting",
  "Glamping",
  "Goblin Mode",
  "Google-Fu",
  "Grob",
  "Guile",
  "Hangry",
  "Happiness",
  "Hulkamania",
  "Humble-Bragging",
  "Hunger Games",
  "Hurting",
  "Hydragyrum",
  "Incarceration",
  "Influencers",
  "Infoganda",
  "Internment",
  "Intrusion",
  "Invisibility",
  "Jeggings",
  "Joy Division",
  "LARPing",
  "Live-Tweeeting",
  "Lolcats",
  "Loyalty",
  "Manscaping",
  "Mansplaning",
  "Mermaidcore",
  "Misapprehension",
  "Mom Jeans",
  "Nervousness",
  "NFTs",
  "Nystul",
  "Patience",
  "Penis Envy",
  "Performative Cruelty",
  "Perspicacity",
  "Petulance",
  "Pits of Despair",
  "Pleasure",
  "Pole Dancing",
  "Practicality",
  "Prurience",
  "Psychosexual",
  "Punctuality",
  "Rapidity",
  "Roblox",
  "rock-paper-scissors-lizard-Spock",
  "Sea Shanties",
  "Shock and Awe",
  "Situationship",
  "Snowflakes",
  "Social Distancing",
  "Solitude",
  "Song of Silence",
  "Spamalot",
  "Spygate",
  "Submission",
  "Subtweet",
  "Suffering",
  "Text Offenders",
  "the Bone",
  "the Friend Zone",
  "TikTok",
  "Torpor",
  "Trolling",
  "Twerking",
  "Vecna",
  "Web 3.0",
  "Wheel of Fortune",
  "Worry",
  "Yassification",
  ];

// from 42 to 105 Boring Items
K.BoringItems = [
  "30 rocks",
  "acme anvil",
  "Amulet of Yendor",
  "animal cracker barrel",
  "Apeture Science cake",  
  "bell, book and candle",
  "Bible belt buckle",
  "bird bath and beyond",
  "blaseball",
  "blubber gloves",
  "carrot prop",
  "casket case",
  "chaise lounge",
  "chamber pot",
  "Cleveland femur",
  "clown shoe",
  "combed beef",
  "concrete canoe",
  "cookie crumbs",
  "counterpane",
  "cracked pipe",
  "credenza",
  "crumpled newspaper",
  "crusty sock",
  "crusty sponge named Bob",
  "dead cat",
  "deep fake",
  "dirt bag",
  "dirty asstray",
  "duck soup",
  "dust bunny",
  "ear wax candle",
  "empty meat wallet",
  "exploding cigar box",
  "Face of Bo",
  "fish eyes",
  "fish hook up",
  "freemason jar",
  "frontyard milkshake",
  "g.e.c.k.",
  "get over writ",
  "glass onion",
  "haystack in a needle",
  "hitchhiker towel",
  "hoedown",
  "I.O.U.",
  "ink hair brush",
  "jeggings",
  "jiggies",
  "Jiminy Cricket Bat",
  "kinky restraints",
  "letter unopener",
  "literal and figurative easter egg",
  "little blouse on the prairie",
  "lunchpail",
  "Mario coin",
  "Mikes Semi-Hard Lemonade",
  "more cowbell",
  "Mr. Bucket",
  "nine inch nail",
  "nonfungible token",
  "nosegay",
  "orange au jus",
  "oregon trail axle",
  "pandora box",
  "piece of eden",
  "piece of eight",
  "pint of rice cream",
  "plague rat",
  "planter peanuts",
  "Quaker instant goatmeal",
  "qunari artifact",
  "RL Beer Stein",
  "robot chicken",
  "rolling pin-up",
  "septic plank",
  "shoot its a ladder",
  "shuttlecock and balls",
  "skull of mondain",
  "smear window",
  "soiled handkerchief",
  "spectacles",
  "spider monkey wrench",
  "splintered toothpick",
  "sponge glob",
  "stained ass window",
  "stick of Fruit Stripes gum",
  "stinkwell",
  "stockpile of toilet paper",
  "stray Lego",
  "strip croquet mallet",
  "swouth pole",
  "take-out menu",
  "teratoma",
  "TF2 hat",
  "the poison for Kuzco",
  "the Twig Apple",
  "tickle pickles",
  "triforce piece",
  "trinket",
  "tuppence",
  "used bandage",
  "vest in gate",
  "water chip",
  "Vogon poem",
  ];

// from 273 to 460 Monsters
K.Monsters = [
  "Ankle-biter|0|baby-teeth",
  "Charlotte the Spider|0|web",
  "Clingy Mothball|0|dust",
  "Cray-Crayfish|0|antenna",
  "Flik the Ant|0|antenna",
  "Frogger|0|leg",
  "Hollow Chocolate Bunny|0|ear",
  "Marty McFly|0|*",
  "Old Yeller|0|collar",
  "Pixelated Centipede|0|leg",
  "Ratatouille|0|tail",
  "Spores mold and fungus|0|infection",
  "Tick|0|spoon",
  "W.A.S.P.|0|church bulletin",
  "Bat-Mite|1|wing",
  "Berserker|1|shirt",
  "Billy Goat|1|beard",
  "Brownie the Elf|1|tusk",
  "Butt Pirate|1|booty",
  "Closet Skeleton|1|clavicle",
  "Club Scout|1|neckerchief",
  "Dervish|1|robe",
  "Garden Gnome|1|hat",
  "Goblin mode|1|ear",
  "Grid Bug|1|carapace",
  "Hobbled goblin|1|patella",
  "Kobold|1|penis",
  "Leprechaun in the Hood|1|wallet",
  "Little Mermaid|1|gills",
  "Manes|1|tooth",
  "Modest Mouse|1|tail",
  "Nebbish|1|belly",
  "Orc Zuckerberg|1|snout",
  "Ozzy Ostrich|1|beak",
  "Red Dwarf|1|drawers",
  "Rot Grub|1|eggsac",
  "Sea Elf|1|jerkin",
  "Sprite|1|can",
  "Stirge|1|proboscis",
  "Swamp Elf|1|lilypad",
  "The Merman|1|trident",
  "The Pixies|1|dust",
  "Trixy Nixie|1|webbing",
  "Yellow Mold|1|spore",
  "4chan Troglodyte|2|tail",
  "Bearded Lizard Man|2|tail",
  "Dryad|2|acorn",
  "Garden Octopus|2|beak",
  "Geico Caveman|2|club",
  "Ghoul Scout|2|cookie",
  "Ghoulfriend|2|muscle",
  "Grassy Gnoll|2|collar",
  "Green Slimer|2|sample",
  "Home Sweet Homunculus|2|fluid",
  "Koala-fied|2|heart",
  "More A Eel|2|sashimi",
  "Multicell|2|dendrite",
  "Nine Imp Nails|2|tail",
  "Pack of Camels|2|filter",
  "Porch Pirate of the Carribean|2|package",
  "Rob Zombie|2|forehead",
  "Stun Worm|2|trode",
  "Teen Wolf|2|paw",
  "Uruk-hai and dry|2|boot",
  "Whippet Good|2|collar",
  "Bed-Bug-Bear|3|skin",
  "Boogie|3|slime",
  "Carrion Pub Crawler|3|egg",
  "Closet Quasit|3|tail",
  "Demure Lemure|3|blob",
  "Drag Sea Hag|3|wart",
  "Harpy Marx|3|mascara",
  "Hippie-griff|3|egg",
  "Hogbird|3|curl",
  "Iron Peasant Past & Future|3|chaff",
  "Jumpskin|3|shin",
  "Nymph Node|3|hanky",
  "Prince Triton|3|scale",
  "Secret of the Ooze|3|gravy",
  "Shadow the Hedgehog|3|silhouette",
  "Silkie|3|fur",
  "Snow Piercer|3|tip",
  "Stink-Bug-Boar|3|tusk",
  "Sylph Milf|3|thigh",
  "The Last Boy Scout|3|merit badge",
  "Violent Violet Fungi|3|spore",
  "Weaker Shrieker|3|stalk",
  "Woman-o-war|3|tentacle",
  "A Ghast aghast|4|vomit",
  "Centaur for Disease Control|4|rib",
  "Cooler Yeti|4|fur",
  "Corn Man|4|juice",
  "David the Gnome|4|hat",
  "Doppelganger|4|face",
  "Eagle Scout|4|merit badge",
  "Gargoyle|4|gravel",
  "Gelatinous Cube|4|jam",
  "Grape Ape|4|ass",
  "Hippocampus|4|mane",
  "Mini Giant|4|pompadour",
  "Mutant Babies|4|diaper",
  "Peryton on a Peloton|4|antler",
  "Poroid|4|node",
  "Purrmaid|4|hairball",
  "Stink Blink Dog|4|eyelid",
  "Tactics Ogre|4|talon",
  "Unicornio the Mexican unicorn|4|blood",
  "Wight Said Fred|4|lung",
  "Wolog|4|lemma",
  "Bat out of Hell|5|meatloaf",
  "Beast with Two Axe|5|axe",
  "Bill Cosby|5|pudding pop",
  "Charizard|5|lawsuit",
  "Cockatrice|5|wattle",
  "Feral Muppet|5|fist",
  "Flail Bondsman|5|flail",
  "Gravy Elemental|5|stains",
  "Hell Hound|5|tongue",
  "Malebranche|5|fork",
  "Ogre Mage|5|apparel",
  "Owlbear|5|feather",
  "Rust Monster|5|shavings",
  "Savage Su-monster|5|tail",
  "Spider-Monkey|5|Mt. Dew",
  "Spitting Trouser Snake|5|infection",
  "Stun Bear|5|tooth",
  "Thirsty Satyr|5|hoof",
  "Windmills|5|*",
  "Wraith of God|5|finger",
  "Abominable Anhkheg|6|chitin",
  "Beefy Minotaur|6|map",
  "Butterscotch Custardbath|6|script",
  "Cantankerous Catoblepas|6|neck",
  "Embittered Erinyes|6|thong",
  "Grant Imahara's Sex Robot|6|dangly bits",
  "Iguanadon Nugget|6|thumb",
  "Leucrotta|6|hoof",
  "Manticore|6|spike",
  "Mork from Ork|6|egg",
  "Mummy Dearest|6|gauze",
  "Objectifying Medusa|6|eye",
  "Ochre Jelly|6|nucleus",
  "Playboy Bunny|6|ears",
  "Predditor|6|copypasta",
  "Sponge Rob Hair Pants|6|pants",
  "Succubus|6|bra",
  "Sweet Gnome Alabama|6|incest",
  "Twiiter Troll|6|hide",
  "Vampire Bat|6|wing",
  "White Stripes Dragon|6|tooth",
  "Djinn Djarin|7|lamp",
  "Drop Bear|7|punked",
  "Forlorn Xorn|7|jaw",
  "Forum Ban-shee|7|larynx",
  "In a Vest a Gator|7|tooth",
  "Interest devourer|7|brain",
  "Lame Duck Dodgers|7|bill",
  "Marilith|7|arm",
  "Mitzvah Bat|7|yarmulke",
  "Morkoth|7|teeth",
  "Orc Twain|7|book",
  "Otyugh|7|organ",
  "Pega-sus Impostor|7|aileron",
  "Peter Griffon|7|nest",
  "Rakshasa|7|pajamas",
  "Rodents of Unusual Size|7|tail",
  "Smelly Pirate Hookers|7|infection",
  "Spectre of the Past Participle|7|vestige",
  "Teddy Ruxpin|7|cassette",
  "Three and a half babies|7|diapers",
  "Balor Texas|8|whip",
  "Barbie Devil|8|flame",
  "Blumpkin-Spiced Latte|8|cup",
  "Ether Bunny|8|rag",
  "Fart Garfunkel Elemental|8|gas",
  "Gorgon Zolla|8|testicle",
  "Hail Hydra|8|gyrum",
  "Instant Rice Giant|8|grain",
  "Jagged Juggalos|8|make-up",
  "Jedi Mind Flayer Trick|8|tentacle",
  "Joan of Orc|8|cross",
  "Monoclonius Nugget|8|horn",
  "Mostly-Invisible Stalker|8|*",
  "Pandering Pandaren|8|fur",
  "Rin Tin Tin Dragon|8|*",
  "Silent Hill Giant|8|corpse",
  "Slo-Mo-akum|8|frenum",
  "Sparkly Vampire|8|glitter",
  "Umber Hulk|8|claw",
  "Vrock and roll|8|neck",
  "Ace of Beige Dragon|9|*",
  "Ankylosaurus Nugget|9|tail",
  "Blue Screen of Death Dragon|9|*",
  "Boner Devil|9|hook",
  "Brass Monkey Dragon|9|pole",
  "Bronze Age Dragon|9|medal",
  "Chocobo|9|feather",
  "Couatl|9|wing",
  "Gone to Plaid Dragon|9|sporrin",
  "Hezrou|9|leg",
  "Howard the Duck Duck Goose|9|bill",
  "Iron Man Giant|9|sadness",
  "Jam and Jellyrock|9|seedling",
  "Mimic Mimic|9|hinge",
  "Naga|9|rattle",
  "Orc Ruffalo|9|script",
  "Porcelain Giant|9|fixture",
  "Rebecca Black Dragon|9|*",
  "Robot Unicorn|9|horn",
  "Rolling Stone Giant|9|hatchling",
  "Shedu|9|hoof",
  "Shitake Shrieker|9|fungi",
  "Wil-Wheaton-o'-the-Wisp|9|wisp",
  "4chan Lurker|10|sac",
  "Bacon Elemental|10|bit",
  "Black Sabbath Pudding|10|saliva",
  "Buffy Vampire|10|quips",
  "Darkwing Duck and Cover|10|bill",
  "Efreet Willy|10|cinder",
  "Glabrezu|10|collar",
  "Green Hornet Dragon|10|*",
  "Jack Frost Giant|10|snowman",
  "Lo and Beholder|10|eyestalk",
  "Moogle|10|fur",
  "Never Catch Me Copper Dragon|10|loafer",
  "Orc Hamill|10|script",
  "Patrick Swayze Ghost|10|*",
  "Pebble Beach Golf Sphinx|10|paw",
  "Quartz Giant|10|crystal",
  "Rainbow Brite Eyes|10|sprite",
  "Red Hot Chili Peppers Dragon|10|cocktail",
  "Shambling Mound|10|mulch",
  "Stay Gold Ponyboy Dragon|10|filling",
  "Threaten Ettin|10|fur",
  "Tree-ant-man and wasp|10|acorn",
  "A piñata full of fire bees|11|stinger",
  "Adventure Time Lord|11|screwdriver",
  "Beef Giant|11|steak",
  "Canadian 'Eh Holes|11|timbits",
  "Chimera Primavera|11|pasta",
  "Dread Gazebo|11|wood",
  "Flail Earnhardt|11|wreckage",
  "Jump Roper|11|twine",
  "Kindle Fire Giant|11|cigarettes",
  "King Triton|11|trident",
  "Lichie Lich|11|crown",
  "Nalfeshnee|11|tusk",
  "Neo-Otyugh|11|organ ",
  "Penis Guytrap|11|root",
  "Remorhaz|11|protrusion",
  "Sgt Poopers Lonely Farts Club Band|11|brown note",
  "Sharknado|11|fin",
  "Skeletor|11|bone",
  "Smallcox Outbreak|11|infection",
  "Vanilla Ice Devil|11|snow",
  "12-foot-tall skeleton|12|big bone",
  "A French Douchebaguette|12|crumbs",
  "Amazon Optimus Prime|12|cardboard",
  "Cloud Strife Giant|12|condensation",
  "Decidely Not Sexy Skeksis|12|beak",
  "Donkey Show-and-Tell|12|fur",
  "Feral snaggle-tooth crotch goblins|12|tooth",
  "Hairless ape with much anxiety|12|pills",
  "Hidden Valley Ranch-hand|12|bottle",
  "Humidity Giant|12|drops",
  "Jake from State Farm|12|khakis",
  "Je ne sais quoi|12|*",
  "Kentucky Fried Children|12|crispy bits",
  "Mastodon|12|tusk",
  "Megalosaurus Nugget|12|jaw",
  "Pentasaurus Nugget|12|head",
  "Porn Elemental|12|lube",
  "Silver Surfer Dragon|12|*",
  "Stubborn Adamantoise|12|shell",
  "Trapper Keeper|12|shag",
  "A 5th Grader smarter than you|13|book",
  "Cactuar|13|needle",
  "Chuck E Cheese Knife|13|cold dead eyes",
  "Cock Cockula|13|lips",
  "Conan O Brien the Bardbarian|13|hair",
  "Daddy Mothman|13|feather",
  "Dragon Teenage Mutant Ninja Turtle|13|shell",
  "Florida Man|13|gun",
  "Frank N Furter|13|fishnet",
  "Gorgosaurus Nugget|13|arm",
  "Hector the Love Nectar Injector|13|nectar",
  "Hulking Himbo|13|beefcake",
  "Lazarus Pit Fiend|13|seed",
  "Loki's horse baby|13|hooves",
  "Lord Adolphus Reginald Cockwomble Spunktrumpet the Third Esquire|13|ego",
  "Mr Planters|13|nuts",
  "Porg-stars|13|wing",
  "Teenage Mutant Ninja Squirtle|13|shell",
  "That sexy sexy Green M&M™|13|shell",
  "Why-vern?|13|question",
  "Albino howling shitgibbon|14|poo",
  "Baluchitherium|14|ear",
  "Baron Vladimir Fartonnen|14|fat",
  "Cardboard Golem|14|recycling",
  "Cheese Elemental|14|curd",
  "Gollum|14|precious",
  "Sherrif of Nottingham|14|taxes",
  "Ton-Tonberry|14|knife",
  "Tyrion Lannister|14|wine",
  "Wankpuffin Nobsocket Shitflute|14|flute",
  "Anacondas that love buns|15|buns",
  "Beer Golem|15|foam",
  "Elasmosaurus Nugget|15|neck",
  "Leather Golem|15|fob",
  "Malboro Light|15|vine",
  "Perfect Storm Giant|15|barometer",
  "Purple Worm|15|dung",
  "Salt N Pepperidge Farm|15|cookies",
  "Tinkerbell|15|attitude",
  "Trix Rabbit|15|cereal",
  "Chef Playboyardee|16|sauce",
  "Daffy Duck Confit|16|fat",
  "Hair Elemental|16|follicle",
  "Mongolian Death Worm|16|dung",
  "Nearly Headless Nick|16|head",
  "Rubber Golem|16|ball",
  "The Incredible Hulk Hogan|16|gamma radiation",
  "Triceratops Nugget|16|horn",
  "Turd Ferguson|16|hat",
  "Which-vern?|16|question",
  "Bigfoot Locker|17|blurry photo",
  "Caps Lock Ness Monster|17|tail",
  "Donald Duck Soup|17|broth",
  "Edward Rock-Paper-Scissorhands|17|scissors",
  "Jersey Devil|17|hockey jersey",
  "Jubilex|17|gel",
  "Oxygen Golem|17|platelet",
  "Schrödingers army of undead cats|17|quantum particle",
  "Skunk weed ape|17|hair",
  "What-vern?|17|question",
  "Animorph|18|paperback",
  "Batsquatch|18|talon",
  "Chupacabra|18|fang",
  "Corrosive Ooze|18|gunk",
  "Dwayne the Roc|18|wing",
  "Google Chromatic Dragon|18|scale",
  "Rolling in the Deep Stalker|18|saliva",
  "Stegosaurus Nugget|18|plate",
  "Tyrannosaurus Rex Nugget|18|forearm",
  "Where-vern?|18|question",
  "Astral Projection Stalker|19|silver cord",
  "Consentacle|19|slime",
  "Half-melted slushie|19|slime",
  "How-vern|19|question",
  "Mosh Pit Howler|19|shirt",
  "Phantom Hound of the Opera|19|mask",
  "Punk Rockworm Hydra|19|pincer",
  "Sasquatch|19|jerky",
  "Trogdor|19|peasant",
  "Tropic Thunderbird|19|feather",
  "Ahriman|20|spirit",
  "Barely Disguised Fetish Monster|20|whip",
  "House of Wax Phantom|20|dripping",
  "Peppa Pigfolk|20|bacon",
  "Tennessee Titan|20|sandal",
  "Chairman of the Horde|21|private jet",
  "Grievous bodily harmicist|21|prescription",
  "Humphry Boggart|21|hat",
  "Undead Dragon Ball Z|21|dragonball",
  "Vorpal Bunny|21|teeth",
  "Cool Whip Scorpion|22|tub",
  "Cyborg Putin|22|rubles",
  "Demon Lord of the Flies|22|conch",
  "Dire Straits Wolf|22|video",
  "Hunger Games Daedra|22|whistle",
  "Behe-mothman|23|horn",
  "Dirty Laundry Golem|23|sock",
  "Dodge or Ram|23|horns",
  "Double Platinum Dragon|23|*",
  "Judge Dread Pirate Roberts|23|mask",
  "Diplodocus Nugget|24|fin",
  "Doomguard II BFG Edition|24|shotgun",
  "Lightning McQueen Elemental|24|kachow",
  "Manticore i9 Processor|24|thermal paste",
  "Shadow the Hedgehog Elemental|24|gun",
  "Ender Game Dragon|25|end portal",
  "Titanosaurus Nugget|25|fossil",
  "Void Tower of Terror|25|ash",
  "Which-Why-Were-Bear|25|paw",
  "Yeenoghu|25|flail",
  "Gelatinous Boob|26|jiggle",
  "One Winged Angel|26|feather",
  "Senior Vice President|26|business card",
  "Cadaver Collector Gadget|27|cadaver",
  "Health Inspector|27|citation",
  "Orcus Dorcus|27|wand",
  "Brontosaurus Nugget|28|brain",
  "He Who Must Not Be Deadnamed|28|name",
  "High-brow Drow Inquisitor|28|eyebrow",
  "Dispater|29|matches",
  "Elder Pinky and the Brain|29|braincell",
  "Zombie Dragula|29|fangs",
  "Geryon|30|cornucopia",
  "Green Day Abishai|30|album",
  "Mother-in-Law|30|expectations",
  "Gannondork|31|triforce",
  "Skittering Treehouse of Horror|31|episode",
  "Asteroid Spider-Man|32|webbing",
  "More-goth|32|horn",
  "Ancient Deep Throat Crow|33|spit",
  "Darth Shopping Mall|33|half-off coupon",
  "Arizona Tea Phoenix|34|can",
  "Dr Doom PhD|34|mask",
  "Darkseid|35|mother box",
  "Steel Sexual Predator|35|sexts",
  "Ashen Knight Rider|36|tires",
  "The Betty White Witch|36|dentures",
  "Licked Lichen Lich|37|saliva",
  "Wicked Witch of the Upper NW|37|broom",
  "Lord Farquaad|38|martini",
  "The Lord of Beyblades|38|nostalgia",
  "Captain Barbossa|39|apple",
  "Cosmic Rocky Horror|39|fishnet",
  "Mal if a cent|40|staff",
  "Peach Pit Fiend|40|pit",
  "The Dark One|41|darkness",
  "Prostetnic Vogon Jeltz|42|poetry",
  "Baalzebul|43|pants",
  "Hannibal Lecter|44|fava beans",
  "Grand Admiral Thrawn|45|art",
  "Low-key Loki|46|infinity stone",
  "Darth Vader|47|helmet",
  "Sauron|48|eye",
  "Kung Fu Chaos|49|insanity",
  "Mind Flayer Lich Itchybitch|50|tentacle",
  "Elder Tempest in a Teapot|51|ceramic chip",
  "Seattle Kraken|52|tentacle",
  "Bed Baphomet and Beyond|53|towel",
  "Orcus Porkus Dorcus|54|bacon",
  "Thanos|55|gauntlet",
  "Cthulu|56|tentacle",
  "Asmodeus|57|leathers",
  "Demogorgon|58|tentacle",
  "Vecna|59|head",
  "Strahd|60|dramatic-cape",
  "Tearassque|61|fart",
  "Tiamat|62|scale",
  "Greatwyrm|63|scale",
  "Death|64|cloak",
  "Procrastination|65|guilt",
  "Sex-Pest|2|harassment",
  "Vlogger|2|likes",
  "Sadboi|2|tears",
  "Spokesdog|2|commercial",
  "e-girl|3|purple wig",
  "Teabagger|3|Mt Dew",
  "Tumblrina|4|fan-fic",
  "Tweetstorm|5|RTs",
  "Twidiot|4|subtweets",
  "Broflake|4|tears",
  "Mansplainer|5|influencer",
  "Telefangelist|4|scam",
  "Twitterati|5|subtweets",
  "Bridezilla|5|entitlement",
  "Karen|5|complaint",
  ];

// from 16 to 25 Mon Mods - Not used?
K.MonMods = [
  "-4 Fœtal *",
  "-4 Dying *",
  "-4 Mortally Wounded *",
  "-3 Crippled *",
  "-3 Idiotic *",
  "-3 Infantile *",  
  "-2 Adolescent *",
  "-2 Very Sick *",
  "-2 Fairly Stupid *",
  "-1 Lesser *",
  "-1 Undernourished *",
  "-1 Not-So-Bright *",
  "+1 Greater *",
  "+1 Caffinated *",
  "+1 * Elder",
  "+2 Sonic *",
  "+2 War *",
  "+2 Battle-*",
  "+3 Were-*",
  "+3 Super-Sonic-*",
  "+3 Undead *",
  "+4 Giant *",
  "+4 Mecha *",
  "+4 * Rex",
  "+5 Kaiju *",
  ];

// from 9 to 31 Offense Bad
K.OffenseBad = [
  "Tarnished|-1",
  "Cumbersome|-1",
  "Crooked|-1",
  "Weakened|-1",
  "Flimsy|-1",
  "Dull|-2",
  "Icky|-2",
  "Unbalanced|-2",
  "Yielding|-2",
  "Rusty|-2",
  "Store-Brand|-3",
  "Feeble|-3",
  "Diminutive|-3",
  "Bent|-3",
  "Flaccid|-3",
  "Padded|-4",
  "Unsubstantial|-4",
  "Lousy|-4",
  "Puny|-4",
  "Rotten|-5",
  "Rubber|-5",
  "Fragile|-5",
  "Woeful|-5",
  "Decrepid|-6",
  "Worthless|-6",
  "Decayed|-6",
  "Odious|-6",
  "Horrendous|-7",
  "Nerf|-7",
  "Rancid|-7",
  "Cursed|-7",
  ];

// from 14 to 31 Defense Bad
K.DefenseBad = [
  "Holey|-1",
  "Patched|-1",
  "Faded|-1",
  "Weakened|-1",
  "Flimsy|-1",
  "Threadbare|-2",
  "Mildewed|-2",
  "Yielding|-2",
  "Rusty|-2",
  "Flawed|-2",
  "Moth-eaten|-3",
  "Torn|-3",
  "Dented|-3",
  "Warped|-3",
  "Corroded|-3",
  "Plastic|-4",
  "Cracked|-4",
  "Unsubstantial|-4",
  "Lousy|-4", 
  "Rotten|-5",
  "Pregnable|-5",
  "Exposed|-5",
  "Woeful|-5",
  "Decrepid|-6",
  "Worthless|-6",
  "Decayed|-6",
  "Odious|-6",
  "Horrendous|-7",
  "Naked|-7",
  "Rancid|-7",
  "Cursed|-7",
  ];

// from 21 to 24 Races
K.Races = [
  "4chan Troll|STR,INT",
  "Aware-Wolf|STR,WIS",
  "Demi-Canadian|WIS,CHA",
  "Double-Wookiee|CON,CHA",
  "Double-sided Bad Dragon|STR,MP Max",
  "Enchanted Talking Chamberpot|DEX,CHA",
  "Erotic Sonic Fan-Fic Abomination|HP Max,MP Max",
  "Filthy Stinkin Lich|STR,CON",
  "Goblin-Mode Satyr|MP Max,DEX",
  "High Treant|CON,MP Max",
  "Hungry Hungry Hobbit|DEX,CON",
  "I No Longer Care Bear|INT,WIS",
  "Miniature Giant Space Hamster|DEX,HP Max",
  "My Little Pygmy|DEX,WIS",
  "Nympho Nymph|CON,WIS",
  "Odorous Oompa Loompa|DEX,INT",
  "Only Somewhat Racist Dwarf|CON,HP Max",
  "Pixie Ironically with a Pixie-Cut|INT,CHA",
  "Poultrygeist|INT,MP Max",
  "Reverse-Centaur|STR,CHA",
  "Sharkasaurus|STR,HP Max",
  "Stupid Sexy Elf|CHA,MP Max",
  "Thirsty Cyberman|INT,HP Max",
  "Travelocity Gnome|WIS,HP Max",];

// from 18 to 24 Klasses
K.Klasses = [
  "99th Degree Stonecutter|CON,MP Max",
  "Barbarian Pretzel|STR,CON",
  "Big Bad Voodoo Daddy|CHA,HP Max",
  "Blood-Sucking Lunatic|CHA,MP Max",  
  "Boston Cream Strangler|INT,HP Max",
  "Drug Healer|WIS,CHA",
  "Drunken Forest Friar|STR,WIS",
  "Electric Monk|WIS,INT",
  "Erotical Illusionist|INT,CHA",
  "Fatal Flatulist|INT,CON",
  "Grimdark Double-Hell Slayer|CON,HP Max",
  "Hamburglar|DEX,CHA",
  "Internal Combustion Felon|STR,HP Max",
  "Paperback Fighter|STR,INT",
  "Paula Deen Paladin|WIS,CON",
  "Pinball Wizard|INT,DEX",
  "Sailor Rune|DEX,MP Max",
  "Shovel Knight|STR,DEX",
  "Sorcerer Supreme Pizza|WIS,MP Max",
  "Stranger Ranger|DEX,WIS",
  "Stubborn Jackass|HP Max,MP Max",
  "Super Show-off Saiyan|STR,MP Max",
  "Thief Executive Officer|DEX,CON",
  "United States Coast Bard|CHA,HP Max",];

// from 9 to 24 Titles
K.Titles = [
  "Miss Ter",
  "Miss Uss",
  "Mister Mister",
  "Butterfly Madame",
  "Assistant Master",
  "Its-a-me",
  "Peastant 3rd Class",
  "Public Private",
  "Punishmnent Cpl.",
  "Slaughter Sgt.",
  "O Captain My Captain",
  "Kangaroo Captain",
  "Channel Serf",
  "Knave Intern",
  "Squire S. Quire",
  "Fright Knight",
  "A Hard Days Knight",
  "Last Friday Knight",
  "Three Dog Knight",
  "Date Knight",
  "Shovel Knight",
  "O Holy Knight",
  "Silent Knight",
  "Prom Knight"];

// from 14 to 58 Impressive Titles
K.ImpressiveTitles = [
  "Mayor McCheese",
  "Ozone Mayor",
  "Windows Media Mayor",
  "Flavortown Mayor",
  "Rear Admiral",
  "Admiral Rights Activist",
  "Great-ish Arch-Viscount",
  "Verified Influencer",
  "Reddit Moderator",
  "Sofa King",
  "Too Much of a Good King",
  "Do the Right King",
  "I Dont Want to Miss a King",
  "Sweetest King",
  "Burger King",
  "Keep your hands Queen",
  "Blue Queen of Death",
  "Scream Queen",
  "MiLord",
  "Lord of Directors",
  "MiLady",
  "The Real Slim Lady",
  "Nineteen Lady-Four",
  "Hasta La Vista Lady",
  "Hush Little Lady",
  "Ice Ice Lady",
  "Step-Prince Thrice-Removed",
  "Step-Princess Thrice-Removed",
  "Corned Chief",
  "Master Chef Chief",
  "Miss Chief",
  "Big Boss",
  "Mini Boss",
  "Pandoras Boss",
  "St. Louis Archbishop",
  "Left-to-Chancellor",
  "Marky-Marquis",
  "Dry and Baron",
  "Red Baron",
  "Red Baroness",
  "Nukem Duke",
  "I Kissed an Earl",
  "Grey Earl",
  "Juan Don",
  "Red Don",
  "Tsar of Trek",
  "Tsar of Wars",
  "Uncle Tom's Captain",
  "Pachelbel's Captain",
  "Modern Major-General",
  "Oh Lordy",
  "Rump Inspector General",
  "MVPVIPOMGWTFBBQ",
  "Commander in Briefs",
  "Ghost of Christmas President",
  "Email Abbess",
  "Bad Abbott",
  "Major Inquest General"];