
function b64_decode(value) {
  return JSON.parse(decodeURIComponent(escape(atob(value))));
}

function b64_stringify(value) {
   return btoa(unescape(encodeURIComponent(JSON.stringify(value))));
}


function load() {

  if (!HasLocalStorage()) {
    $("#roster").html("<b>Hrumph:</b> This browser does not support local storage. You can still play fast and loose: your character will live only as long as the game stays running in your browser.");
    return;
  }

  storage.loadRoster(loadGames);
}

// Drag-and-drop import of saved .pqw files. Registered once at startup
// (it used to be re-registered every time the roster refreshed, so a
// single drop could import the same file several times).
function enableDropImport() {
  window.addEventListener("dragover", e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  });
  window.addEventListener("drop", e => {
    e.preventDefault();
    e.stopImmediatePropagation();
    let files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      files[i].text().then(sheet => {
        try {
          sheet = sheet.replace(/\s/g, "");
          sheet = b64_decode(sheet);
          if (!sheet || !sheet.Traits || !sheet.Traits.Name)
            throw new Error("No character in file");
          storage.loadRoster(games => {
            if (!games[sheet.Traits.Name] ||
                confirm(`A character named ${sheet.Traits.Name} already exists. Overwrite it?`)) {
              storage.addToRoster(sheet, () => storage.loadRoster(loadGames));
            }
          });
        } catch(err) {
          console.log(err);
          setTimeout(() => alert("Invalid character data"), 1);
        }
      });
    }
  });
}

function loadGames(games) {
  var roster = $("#roster");
  roster.empty();

  var newone = DecodeName(window.location.href.split('#')[1]);

  var count = 0;

  $.each(games, function (key, c) {
    var name = c.Traits.Name;

    var br = brag(c);
    roster.append(br);
    br.find("a.go").attr("href", "main.html#" + EncodeName(name));

    br.find("a.x").on("click", function (e) {
      e.preventDefault();
      if (confirm("Terminate " + Pick(["faithful","noble","loyal","brave"])+
                  " " + name + "?")) {
        delete games[name];
        storage.storeRoster(games, load);
      }
    });

    br.find("a.sheet").on("click", function (e) {
      e.preventDefault();
      alert(template($("#sheet").html(), games[name]));
      // TODO: put in a window or whatev
    });

    br.find("a.save").attr("href",
      `data:text/plain;name=${encodeURIComponent(name)}.pqw,${b64_stringify(c)}`);
    br.find("a.save").attr("download", `${name}.pqw`);

    if (name === newone)
      br.addClass("lit");

    // Alt-click a character to get its save as copyable text.
    br.on("click", e => {
      if (e.altKey) {
        e.preventDefault();
        let text = b64_stringify(c);
        text = text.match(/.{1,80}/g).join('\n');
        $("dialog#copy pre").text(text);
        $("dialog#copy span").text(name);
        let sel = window.getSelection();
        window.setTimeout(() => {
          let range = document.createRange();
          range.selectNodeContents($("dialog#copy pre")[0]);
          sel.removeAllRanges();
          sel.addRange(range);
        }, 1);
        $("dialog#copy")[0].showModal();
      }
    });
    br.find("a.go").attr("data-downloadurl", `text/plain:${name}.pqw:data:text/plain,${b64_stringify(c)}`);

    ++count;
  });
  if (!count)
    roster.html("<i>Games you start can be loaded from this page, but no saved games were found. Roll up a new character to get started.</i>");
}


function brag(sheet) {
  var brag = $(template($("#badge").html(), sheet));
  if (sheet.motto) {
    brag.find(".bs").text('"' + sheet.motto + '"');
  }
  if (sheet.online) {
    brag.addClass("online");
    brag.find(".bs").text("Realm of " + sheet.online.realm);
    brag.find(".icon.go").html("&#x273F;");
  }
  return brag;
}

function clearRoster() {
  storage.storeRoster({}, load);
}

$(function () {

  load();
  enableDropImport();

  $("#roll").on("click", function () {
    window.location = "newguy.html";
  });

  $("#test").on("click", function () {
    window.location = "newguy.html?sold";
  });

  $("#clear").on("click", clearRoster);

  $("dialog#copy button").on("click", function () {
    this.closest("dialog").close();
  });
});
