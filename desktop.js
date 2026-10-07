// The fake Windows XP desktop behind the game window (back.jpg).
//
// The icons are part of the picture, so each one gets an invisible button
// laid over it. box is [left, top, right, bottom] in pixels of back.jpg
// (1024x768); it is turned into percentages, so the buttons stay on their
// icons however the wallpaper is stretched. To add an icon, paint it into
// back.jpg and add a line here.
//
// Like Windows XP: click an icon to select it, double-click (or press
// Enter) to open it. On a touch screen one tap opens it.
//
//   open:  a page to open in a new tab (the game keeps running here)
//   run:   a function to call instead

var DesktopImage = { width: 1024, height: 768 };

var DesktopIcons = [
  { name: "My Bad Fan-Fic",     box: [6, 78, 66, 150],
    open: "https://www.fanfiction.net/s/13351337/1/My-Immortal" },
  { name: "My Network Places",  box: [4, 160, 70, 230],
    open: "https://geocities.restorativland.org/" },
  { name: "Internet Exploder",  box: [8, 242, 64, 314],
    open: "https://enderandrew.com/dinorun/" },
  { name: "Virus Downloader",   box: [4, 326, 70, 394],
    open: "https://downloadmoreram.com/" },
  { name: "WinCramp",           box: [8, 410, 66, 468],
    run: function () { ToggleWinCramp(); } },
  { name: "ZSNES",              box: [12, 486, 60, 544],
    open: "snes.html" },
  { name: "pq.exe",             box: [12, 558, 60, 619],
    run: function () { NoRecursing(); } }
];

function SetUpDesktop() {
  var desk = document.getElementById("desktop");
  if (!desk) return;
  DesktopIcons.forEach(function (icon) {
    var b = icon.box, W = DesktopImage.width, H = DesktopImage.height;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "desk-icon";
    btn.title = icon.name;
    btn.setAttribute("aria-label", icon.name);
    btn.style.left = (100 * b[0] / W) + "%";
    btn.style.top = (100 * b[1] / H) + "%";
    btn.style.width = (100 * (b[2] - b[0]) / W) + "%";
    btn.style.height = (100 * (b[3] - b[1]) / H) + "%";
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      SelectDesktopIcon(btn);
      // a tap, or Enter/Space on the keyboard (no mouse position), opens it
      if (e.pointerType === "touch" || e.detail === 0) OpenDesktopIcon(icon);
    });
    btn.addEventListener("dblclick", function (e) {
      e.preventDefault();
      OpenDesktopIcon(icon);
    });
    desk.appendChild(btn);
  });
  // Clicking the wallpaper anywhere else clears the selection, as in XP
  document.addEventListener("click", function () { SelectDesktopIcon(null); });
}

function SelectDesktopIcon(btn) {
  $("#desktop .desk-icon.selected").removeClass("selected");
  if (btn) $(btn).addClass("selected");
}

function OpenDesktopIcon(icon) {
  if (typeof CodexFlag == "function") CodexFlag("icon:" + icon.name);   // see codex.js
  if (icon.run) icon.run();
  else if (icon.open) window.open(icon.open, "_blank", "noopener");
}

// ---- WinCramp: it really whips the llama's progress bar ---------------------

var _wincramp = null, _balloonTimer = null;
function ToggleWinCramp() {
  if (!_wincramp) {
    _wincramp = new Audio("ProgressQuestTheme.mp3");
    _wincramp.loop = true;
    _wincramp.volume = 0.6;
  }
  if (_wincramp.paused) {
    var played = _wincramp.play();
    if (played && played.catch) played.catch(function () {});
    Balloon("WinCramp", "Now playing: Progress Quest Theme, by Jayden Steffe. Double-click WinCramp again to stop.");
  } else {
    _wincramp.pause();
    Balloon("WinCramp", "Stopped. The silence is also on repeat.");
  }
}

// A system tray balloon, bottom right
function Balloon(title, text) {
  var $b = $("#Balloon");
  $b.find(".balloon-title").text(title);
  $b.find(".balloon-text").text(text);
  $b.addClass("show");
  clearTimeout(_balloonTimer);
  _balloonTimer = setTimeout(function () { $b.removeClass("show"); }, 6000);
}

// ---- pq.exe ---------------------------------------------------------------

// A stop screen (guard.js). The game keeps running behind it.
function NoRecursing() {
  ShowStopScreen("NO_RECURSING", {
    body: [
      "No recursing! You tried to run Progress Quest inside Progress Quest. The universe can only idle so hard.",
      "If this is the first time you've seen this Stop error screen, stop double-clicking pq.exe. " +
      "If this screen appears again, follow these steps:",
      "Check to make sure your character is still leveling up without you. Disable or remove any " +
      "newly installed progress bars. If problems continue, go outside."
    ],
    technical: [
      "*** STOP: 0x0000PQ0D (0x00000050, 0x00000051, 0x00000045, 0x00000053)",
      "*** pq.exe - Address F00DCAFE base at DEADBEEF, DateStamp 3b7d8f2c"
    ]
  });
}

$(function () {
  SetUpDesktop();
  $("#Balloon").on("click", function (e) { e.stopPropagation(); $(this).removeClass("show"); });
});
