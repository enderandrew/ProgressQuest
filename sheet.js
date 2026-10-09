// sheet.html: a character sheet someone shared (File > Share Character
// Sheet), or a legend's from the Hall of Legends. The whole sheet is in the
// link, after the #; see ShareCode() and LegendSheet() in transfer.js.
// Nothing is stored, and it can't be played or imported.
//
// A legend's sheet has p.ret, when they retired; a fallen Hardcore hero's
// p.died, when they died (and p.dead, how). One from before the Halls kept
// sheets is partial (p.partial): what the Hall remembers. For a legend that's
// their stats and their best gear, spell and stat (p.best); for the fallen,
// not even their stats.

function SheetRows(table, rows) {
  var body = $(table).find("tbody").first();
  body.empty();
  rows.forEach(function (r) {
    var tr = $("<tr>");
    r.forEach(function (cell) { tr.append($("<td>").text(cell === undefined || cell === null ? "" : cell)); });
    body.append(tr);
  });
}

function SheetHours(seconds) {
  var h = (seconds || 0) / 3600;
  return h < 1 ? Math.round(h * 60) + " minutes" : (h < 10 ? h.toFixed(1) : Math.round(h).toLocaleString()) + " hours";
}

// "Act VI"
function SheetRoman(n) {
  var out = "", parts = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
                         [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  parts.forEach(function (p) { while (n >= p[0]) { out += p[1]; n -= p[0]; } });
  return out;
}

function SheetDate(when, withTime) {
  var d = new Date(when);
  if (isNaN(d)) return "";
  return d.toLocaleString([], withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

function ShowSheet(p) {
  var sealed = SealOk(p), partial = !!p.partial, best = p.best || [];
  document.title = p.n + " - Progress Quest Remix";
  $("#title").text("Progress Quest Remix - " + p.n);
  $("#SheetSeal").text(sealed ? "✔ Straight from the game" : "⚠ This link was edited")
    .attr("class", sealed ? "ok" : "bad")
    .attr("title", sealed ? "Nobody changed this sheet after the game made the link." :
                            "Someone changed this sheet after the game made the link. Believe none of it.");

  SheetRows("#SheetTraits", [["Name", p.n], ["Race", p.r], ["Class", p.c], ["Alignment", p.a], ["Level", p.l]]);
  SheetRows("#SheetStats", K.Stats.map(function (s, i) { return [s, p.st[i]]; }));
  var xp = p.xp || [0, 1];
  $("#SheetXP .bar").css("width", Math.min(100, 100 * xp[0] / Math.max(1, xp[1])) + "%");
  $("#SheetXP").attr("title", Math.round(100 * xp[0] / Math.max(1, xp[1])) + "% of the way to level " + (p.l + 1));

  var record = [["Played", SheetHours(p.el)]];
  if (p.w !== undefined) record.push(["Fights won", (p.w || 0).toLocaleString()]);
  record.push(["Defeated", (p.d || 0).toLocaleString() + (p.d == 1 ? " time" : " times")]);
  if (p.qd !== undefined) record.push(["Quests done", (p.qd || 0).toLocaleString()]);
  if (p.fin) record.push(["Finale", "Beat the Old Bastard™ at level " + p.fin]);
  if (p.ret) record.push(["Retired", SheetDate(p.ret) || "yes"]);
  if (p.died) record.push(["Died", SheetDate(p.died) || "yes"]);
  SheetRows("#SheetRecord", record);

  var notes = [];
  if (p.ret) notes.push("🏆 In the Hall of Legends");
  if (p.died) notes.push("In the Hall of the Fallen");
  if (p.mode == "hardcore") notes.push("☠ Hardcore");
  if (p.mode == "plus") notes.push("New Game+");
  if (p.leg) notes.push("Legacy of " + p.leg + (p.leg == 1 ? " race or class" : " races and classes"));
  if (p.daily) notes.push("📅 Daily Challenge " + p.daily);
  var perks = (p.pk || []).map(function (k) { return typeof PerkByKey == "function" && PerkByKey(k); }).filter(Boolean);
  if (perks.length) notes.push("Perks: " + perks.map(function (x) { return x.label; }).join(", "));
  if ((p.ow || []).length) notes.push("Owns " + p.ow.join("; "));
  (p.mut || []).forEach(function (k) {
    var m = (K.Mutators || []).filter(function (x) { return x.key == k; })[0];
    if (m) notes.push(m.label);
  });
  if (p.dead) notes.push("☠ Dead: " + p.dead);
  if (p.ch) notes.push("⚠ Branded a cheater: " + p.ch);
  else if (p.uv) notes.push("Unverified: doesn't count for the Hall of Legends");
  $("#SheetNotes").text(notes.join(" · "));

  // (a partial sheet has only the best of each)
  var notKept = "(" + (best.length ? "the rest" : "this") + " wasn't kept: they " + (p.died ? "died" : "retired") +
                " before the Hall kept character sheets)";
  SheetRows("#SheetEquips", partial ? (best.length ? [["Best", best[0] || ""], ["", notKept]] : [["", notKept]]) :
                                      K.Equips.map(function (e, i) { return [e, (p.eq || [])[i]]; }));
  var spells = p.sp || [];
  if (partial) SheetRows("#SheetSpells", best.length ? [[best[1] || "(none recorded)", ""], [notKept, ""]] : [[notKept, ""]]);
  else SheetRows("#SheetSpells", spells.length ? spells.map(function (s) { return [s[0], s[1]]; }) : [["(none yet)", ""]]);
  $("#SpellCount").text(spells.length ? "(" + spells.length + ")" : "");
  $("#SheetSpells tbody tr").each(function (i) {
    var s = spells[i];
    if (s && typeof SpellType == "function") {
      var type = SpellType(s[0]);
      var tag = { damage: "dmg" }[type] || type;
      $(this).children().first().append(" ").append($("<span>").addClass("tag-" + type).text(tag));
    }
  });
  var items = p.inv || [];
  SheetRows("#SheetInventory", partial ? [["(not kept)", ""]] :
    [["Gold", (p.gold || 0).toLocaleString()]].concat(items.map(function (r) { return [r[0], r[1]]; })));
  $("#InventoryCount").text(items.length ? "(" + items.length + (items.length == 1 ? " item)" : " items)") : "");
  $("#SheetPlot").text(p.plot || (p.act ? "Act " + SheetRoman(p.act) : "Prologue"));
  $("#SheetQuest").text(p.quest || (p.ret ? "None: retired" : p.died ? "None: dead" : "Nothing yet"));
  $("#SheetFoot").text(p.ret || p.died ?
    (p.ret ? "Retired " + SheetDate(p.ret, true) : "Died " + SheetDate(p.died, true)) +
      " · their character sheet as it was then, kept in the Hall of " + (p.ret ? "Legends" : "the Fallen") +
      (partial ? " (only what the Hall remembered: they " + (p.ret ? "retired" : "died") +
                 " before it kept whole sheets)" : "") :
    "Shared " + SheetDate(p.at, true) + " · a snapshot: the hero has kept playing since");
  $("#SheetBody").prop("hidden", false);
}

$(function () {
  var code = (window.location.hash || "").slice(1);
  var fail = function () { $("#SheetError").prop("hidden", false); };
  if (!code) { fail(); return; }
  ReadShareCode(code).then(function (p) {
    if (!p || !p.n || !p.st) throw new Error("no sheet");
    ShowSheet(p);
  }).catch(fail);
});
