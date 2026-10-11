// Sound effects: a short sound for a few moments worth noticing.
//
//   PlaySound("splurge")   a gold sink splurge (StartSplurge in main.js)
//   PlaySound("item")      better gear equipped (WinEquip)
//   PlaySound("victory")   a quest or an Act completed
//   PlaySound("error")     a blue screen, or an error message box
//
// (and a small pop-up saying what each was for: K.Popups, at the end)
//
// Each key is a file in K.Sounds; a key set to null (or a file that isn't
// there) is simply silent, so a new sound is: drop the .mp3 in, set its
// name below, and call PlaySound where it belongs.
//
// Only for show: nothing is played while the game catches up on time away,
// in the simulator, or (unless Settings says so) in a background tab. When
// several sounds fall in the same moment (a quest done that also hands out
// gear), only the most important plays (K.SoundPriority).
//
// Settings > Sound turns them off, and sets the volume (localStorage
// "pq.sound", "pq.soundvolume", "pq.soundhidden").

var K = K || {};
K.Sounds = {
  splurge: "splurge.mp3",           // a gold sink splurge (StartSplurge in main.js)
  item: "item.mp3",                 // better gear equipped (WinEquip)
  victory: "victory.mp3",           // a quest or an Act completed
  error: "error.mp3",               // a blue screen, or an error message box
  levelup: "levelup.mp3",           // a level up (LevelUp)
  defeat: "defeat.mp3",             // beaten in a fight (Defeated); YOU DIED in New Game−
  elite: "elite.mp3",               // a named elite appears (K.Elite)
  choice: "choice.mp3",             // an event is waiting for a choice (BeginChoice)
  achievement: "achievement.mp3",   // an achievement unlocked (the Codex toast)
  finale: "finale.mp3",             // the Old Bastard™ falls (the finale's victory)
  death: "death.mp3"                // a Hardcore hero dies for good
};
// Played in a background tab too, whatever Settings says: they're there to
// call you back (a choice waits only so long)
K.SoundAlerts = { choice: true };
K.SoundPriority = { error: 9, death: 8, finale: 7, defeat: 6, victory: 5, levelup: 4, elite: 4,
                    achievement: 3, splurge: 3, choice: 2, item: 1 };
K.SoundGap = 1500;   // ms before the same sound plays again

function SoundsOn() { return SoundSetting("sound", "1") !== "0"; }
function SoundVolume() {
  var v = parseFloat(SoundSetting("soundvolume", ""));
  return isNaN(v) ? 0.6 : Math.max(0, Math.min(1, v));
}
function SoundsInBackground() { return SoundSetting("soundhidden", "") === "1"; }

function SoundSetting(key, dflt) {
  try {
    var v = window.localStorage.getItem("pq." + key);
    return v === null ? dflt : v;
  } catch (e) {
    return dflt;
  }
}

var _sounds = {}, _soundLast = {}, _soundPending = null;
function PlaySound(key) {
  if (typeof document == "undefined" || !document || typeof Audio == "undefined") return;
  if (typeof _catchingUp != "undefined" && _catchingUp) return;   // (time away: no fanfare for each quest)
  if (!K.Sounds[key] || !SoundsOn()) return;
  if (document.hidden && !SoundsInBackground() && !K.SoundAlerts[key]) return;
  // the most important of what happens in this moment
  if (_soundPending) {
    if ((K.SoundPriority[key] || 0) > (K.SoundPriority[_soundPending] || 0)) _soundPending = key;
    return;
  }
  _soundPending = key;
  setTimeout(function () {
    var k = _soundPending;
    _soundPending = null;
    PlaySoundNow(k);
  }, 60);
}

function PlaySoundNow(key) {
  var now = Date.now();
  if (now - (_soundLast[key] || 0) < K.SoundGap) return;
  _soundLast[key] = now;
  var a = _sounds[key];
  if (a === false) return;   // (its file isn't there)
  try {
    if (!a) {
      a = _sounds[key] = new Audio(K.Sounds[key]);
      a.preload = "auto";
      a.addEventListener("error", function () { _sounds[key] = false; });
    }
    a.volume = SoundVolume();
    a.currentTime = 0;
    var played = a.play();
    if (played && played.catch) played.catch(function () {});   // (no sound before the page has been clicked)
  } catch (e) {}
}

// ---- Pop-ups: what each sound was for --------------------------------------------
//
// A small window in the corner when a sound plays (Notify in main.js), saying
// what it was for: "Quest Completed", "New Item"... It shows with the sound
// off too (it's the sound, for the eyes), and goes by itself after a few
// seconds, or on a click. Not for a choice (the event pop-up asks it), an
// achievement (it has its own), the Old Bastard™'s fall or a death (they
// have windows of their own), or an error (the error is the window). Never
// while the game catches up on time away, nor in a background tab.
// Settings > Sound turns them off (localStorage "pq.soundpopup").
K.Popups = {
  quest:   { sound: "victory", icon: "📜", title: "Quest Completed" },
  act:     { sound: "victory", icon: "🎬", title: "Act Completed" },
  item:    { sound: "item",    icon: "🗡️", title: "New Item" },
  levelup: { sound: "levelup", icon: "⭐",       title: "Level Up" },
  defeat:  { sound: "defeat",  icon: "💥", title: "Defeated in Combat" },
  elite:   { sound: "elite",   icon: "👑", title: "An Elite Appears" },
  splurge: { sound: "splurge", icon: "💸", title: "Splurge" }
};
K.PopupMax = 3;          // at most this many at once (the oldest goes)
K.PopupSeconds = 5;      // how long each stays up
K.PopupMerge = 2000;     // ms: the same kind again this soon updates the one showing ("×2")

function SoundPopupsOn() { return SoundSetting("soundpopup", "1") !== "0"; }

function SoundPopup(kind, info) {
  var P = K.Popups[kind];
  if (!P || typeof document == "undefined" || !document || !document.body) return;
  if (typeof _catchingUp != "undefined" && _catchingUp) return;
  if (document.hidden || !SoundPopupsOn()) return;
  var box = document.getElementById("SoundPopups");
  if (!box) {
    box = document.createElement("div");
    box.id = "SoundPopups";
    box.setAttribute("aria-hidden", "true");   // (the sound, for the eyes: screen readers hear Announce)
    document.body.appendChild(box);
  }
  var now = Date.now(), last = box.lastElementChild;
  if (last && !last._closing && last.dataset.kind == kind && now - (+last.dataset.at || 0) < K.PopupMerge) {
    // the same again (a quest's prizes, several pieces of gear): one pop-up, counted
    var n = (+last.dataset.n || 1) + 1;
    last.dataset.n = n;
    last.dataset.at = now;
    last.querySelector(".sp-title").textContent = P.title + " ×" + n;
    last.querySelector(".sp-text").textContent = info.text || "";
    last.querySelector(".sp-more").textContent = info.more || "";
    clearTimeout(last._timer);
    last._timer = setTimeout(function () { SoundPopupClose(last); }, K.PopupSeconds * 1000);
    return;
  }
  var pop = document.createElement("div");
  pop.className = "sound-popup sp-" + kind;
  pop.dataset.kind = kind;
  pop.dataset.at = now;
  var bar = document.createElement("div");
  bar.className = "sp-bar";
  var icon = document.createElement("span");
  icon.className = "sp-icon";
  icon.textContent = P.icon;
  var title = document.createElement("span");
  title.className = "sp-title";
  title.textContent = P.title;
  var x = document.createElement("span");
  x.className = "sp-x";
  x.textContent = "×";
  bar.appendChild(icon); bar.appendChild(title); bar.appendChild(x);
  var text = document.createElement("div");
  text.className = "sp-text";
  text.textContent = info.text || "";
  var more = document.createElement("div");
  more.className = "sp-more";
  more.textContent = info.more || "";
  pop.appendChild(bar); pop.appendChild(text); pop.appendChild(more);
  pop.addEventListener("click", function () { SoundPopupClose(pop); });
  box.appendChild(pop);
  while (box.children.length > K.PopupMax) SoundPopupClose(box.firstElementChild, true);
  setTimeout(function () { pop.classList.add("show"); }, 20);
  pop._timer = setTimeout(function () { SoundPopupClose(pop); }, K.PopupSeconds * 1000);
}

function SoundPopupClose(pop, now) {
  if (!pop || pop._closing) return;
  pop._closing = true;
  clearTimeout(pop._timer);
  pop.classList.remove("show");
  var gone = function () { if (pop.parentNode) pop.parentNode.removeChild(pop); };
  if (now) gone(); else setTimeout(gone, 300);
}
