// sheet.html: a character sheet someone shared (File > Share Character
// Sheet). The whole sheet is in the link, after the #; see ShareCode() in
// transfer.js. Nothing is stored, and it can't be played or imported.

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

function ShowSheet(p) {
  var sealed = SealOk(p);
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

  var record = [["Played", SheetHours(p.el)], ["Fights won", (p.w || 0).toLocaleString()],
                ["Defeated", (p.d || 0).toLocaleString() + (p.d == 1 ? " time" : " times")],
                ["Quests done", (p.qd || 0).toLocaleString()]];
  if (p.fin) record.push(["Finale", "Beat the Old Bastard™ at level " + p.fin]);
  SheetRows("#SheetRecord", record);

  var notes = [];
  if (p.mode == "hardcore") notes.push("☠ Hardcore");
  if (p.mode == "plus") notes.push("New Game+");
  if (p.leg) notes.push("Legacy of " + p.leg + (p.leg == 1 ? " race or class" : " races and classes"));
  if (p.daily) notes.push("📅 Daily Challenge " + p.daily);
  (p.mut || []).forEach(function (k) {
    var m = (K.Mutators || []).filter(function (x) { return x.key == k; })[0];
    if (m) notes.push(m.label);
  });
  if (p.dead) notes.push("☠ Dead: " + p.dead);
  if (p.ch) notes.push("⚠ Branded a cheater: " + p.ch);
  $("#SheetNotes").text(notes.join(" · "));

  SheetRows("#SheetEquips", K.Equips.map(function (e, i) { return [e, p.eq[i]]; }));
  var spells = p.sp || [];
  SheetRows("#SheetSpells", spells.length ? spells.map(function (s) { return [s[0], s[1]]; }) : [["(none yet)", ""]]);
  $("#SheetSpells tbody tr").each(function (i) {
    var s = spells[i];
    if (s && typeof SpellType == "function") {
      var type = SpellType(s[0]);
      var tag = { damage: "dmg" }[type] || type;
      $(this).children().first().append(" ").append($("<span>").addClass("tag-" + type).text(tag));
    }
  });
  var inv = [["Gold", (p.gold || 0).toLocaleString()]].concat((p.inv || []).map(function (r) { return [r[0], r[1]]; }));
  SheetRows("#SheetInventory", inv);
  $("#SheetPlot").text(p.plot || "Prologue");
  $("#SheetQuest").text(p.quest || "Nothing yet");
  $("#SheetFoot").text("Shared " + new Date(p.at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) +
    " · a snapshot: the hero has kept playing since");
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
