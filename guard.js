// Stop screens (the Windows XP blue screen) and the Konami code.
//
// ShowStopScreen(code, paragraphs) puts up a full-screen stop error. The
// game keeps running behind it; any key or click closes it. pq.exe on the
// desktop (desktop.js) uses it, and so does the Konami code:
//
//   Up Up Down Down Left Right Left Right B A
//
// which plays Konami.mp3 (if it is there) and reminds you that cheating is
// not allowed. Loaded by index.html and main.html. Needs jQuery.

function ShowStopScreen(code, paragraphs) {
  if (!document || !document.body) return;
  var dlg = document.getElementById("StopScreen");
  if (!dlg) {
    dlg = document.createElement("dialog");
    dlg.id = "StopScreen";
    document.body.appendChild(dlg);
    var close = function (e) {
      e.preventDefault();
      e.stopPropagation();   // don't let the key also pause the game, etc.
      dlg.close();
    };
    dlg.addEventListener("keydown", close);
    dlg.addEventListener("click", close);
    AddStopScreenStyle();
  }
  var $d = $(dlg).empty().attr("aria-label", code);
  $("<p>").text("A problem has been detected and Progress Quest has been shut down to " +
                "prevent damage to your " + (paragraphs.damage || "free time") + ".").appendTo($d);
  $("<p class='big'>").text(code).appendTo($d);
  $.each(paragraphs.body || [], function (i, text) { $("<p>").text(text).appendTo($d); });
  $("<p>").text("Technical information:").appendTo($d);
  $.each(paragraphs.technical || [], function (i, text) { $("<p>").text(text).appendTo($d); });
  $("<p class='blink'>").text("Press any key or click to continue _").appendTo($d);
  if (!dlg.showModal) { alert(code); return; }
  if (!dlg.open) dlg.showModal();
}

function AddStopScreenStyle() {
  if (document.getElementById("StopScreenStyle")) return;
  $("<style id='StopScreenStyle'>").text(
    "#StopScreen { width: 100vw; height: 100vh; max-width: none; max-height: none; margin: 0;" +
    "  padding: 5vh 6vw; border: 0; box-sizing: border-box; background: #0000aa; color: #fff;" +
    "  font-family: 'Lucida Console', 'Courier New', monospace; font-size: clamp(12px, 1.5vw, 18px);" +
    "  line-height: 1.45; text-align: left; cursor: none; overflow: auto; }" +
    "#StopScreen::backdrop { background: #0000aa; }" +
    "#StopScreen p { margin: 0 0 1.1em; font-family: inherit; font-size: inherit; color: inherit; }" +
    "#StopScreen p.big { font-size: 1.3em; letter-spacing: 0.05em; }" +
    "#StopScreen p.blink { animation: pq-blink 1.1s steps(1) infinite; }" +
    "@keyframes pq-blink { 50% { opacity: 0.35; } }"
  ).appendTo("head");
}

// ---- The Konami code ---------------------------------------------------------

var KonamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
                  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
var _konami = 0;

function KonamiKey(e) {
  var stop = document.getElementById("StopScreen");
  if (stop && stop.open) return;
  var key = e.key && e.key.length == 1 ? e.key.toLowerCase() : e.key;
  if (key === KonamiCode[_konami]) {
    ++_konami;
  } else {
    _konami = key === KonamiCode[0] ? 1 : 0;
  }
  if (_konami < KonamiCode.length) return;
  _konami = 0;
  NoCheating();
}

function NoCheating() {
  try {
    var sound = new Audio("Konami.mp3");
    var played = sound.play();
    if (played && played.catch) played.catch(function () {});
  } catch (e) {}
  ShowStopScreen("CHEATING_IS_NOT_ALLOWED", {
    damage: "integrity",
    body: [
      "Up, up, down, down, left, right, left, right, B, A. We know that one. Everybody knows that one.",
      "No cheating is allowed in Progress Quest. Not even 30 extra lives. Your hero does not need " +
      "your help: the whole point is that it plays itself.",
      "If this is the first time you've seen this Stop error screen, put down the controller. If " +
      "this screen appears again, follow these steps:",
      "Think about what you've done. Let the progress bars fill at their own pace. If problems " +
      "continue, go outside."
    ],
    technical: [
      "*** STOP: 0x00C0FFEE (0x00000030, 0x0000001E, 0x0000BA5E, 0x00000000)",
      "*** konami.sys - Address UUDDLRLR base at BA5EBA11, DateStamp 1986-02-21"
    ]
  });
}

$(function () {
  document.addEventListener("keydown", KonamiKey, true);
});
