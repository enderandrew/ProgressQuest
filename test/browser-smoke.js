#!/usr/bin/env node
// A quick run through the game in a real (headless) browser, for the code
// the simulator never touches: the menu, the character roller, the game
// window, its menus and dialogs, the Halls, the share page. It fails on any
// JavaScript error a page reports, or anything that doesn't show up.
//
//   npm install --no-save playwright && npx playwright install chromium
//   node test/browser-smoke.js
//
// GitHub runs it after the game tests (.github/workflows/tests.yml).

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png",
                ".gif": "image/gif", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
                ".mp3": "audio/mpeg", ".ico": "image/x-icon", ".json": "application/json" };

// The game, served as plain files (like GitHub Pages)
function serve() {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end(); return;
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

const steps = [], errors = [];
function step(name, ok, detail) {
  steps.push({ name, ok, detail });
  console.log(`${ok ? "✔" : "✘"} ${name}${detail ? " (" + detail + ")" : ""}`);
}

(async () => {
  const server = await serve();
  const BASE = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  // Nothing from outside (analytics, the emulator...): the game must work without it
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  const watch = (page, label) => {
    page.on("pageerror", (e) => errors.push(`${label}: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error" && !/net::ERR_FAILED|Failed to load resource/.test(m.text())) errors.push(`${label}: ${m.text()}`);
    });
    page.on("dialog", (d) => d.accept());
  };
  const page = await context.newPage();
  watch(page, "page");
  const tryStep = async (name, fn) => {
    try { const detail = await fn(); step(name, true, detail); }
    catch (err) { step(name, false, String(err.message || err).split("\n")[0]); }
  };

  await tryStep("the main menu opens", async () => {
    await page.goto(BASE + "index.html");
    await page.waitForSelector("#menu button");
    return (await page.$$("#menu button")).length + " buttons";
  });

  await tryStep("a new hero is rolled and starts playing", async () => {
    await page.click("#menu [data-open=dlgNew]");
    const frame = await (await page.waitForSelector("#newguyFrame")).contentFrame();
    await frame.waitForSelector("#Sold");
    // the same hero every run (a seeded roll, as a Custom Run makes)
    await frame.goto(BASE + "newguy.html?embed&seed=smoketest");
    await frame.waitForSelector("#Sold");
    await frame.fill("#Name", "Smoketest");
    await frame.click("#Sold");
    await page.waitForURL(/main\.html#/);
    await page.waitForFunction(() => window.game && game.Traits && !IsPaused(), null, { timeout: 15000 });
    return await page.evaluate(() => game.Traits.Race + " " + game.Traits.Class);
  });

  await tryStep("the hero plays 500 tasks", async () => {
    await page.evaluate(() => {
      StopTimer();   // the test plays the tasks, not the clock
      // (as the game sees it, this hero was born long ago, so playing fast isn't cheating)
      game.birthstamp = Date.now() - 30 * 864e5;
      _guardSession = { real: Date.now() - 30 * 864e5, elapsed: 0 };
      for (let i = 0; i < 500 && !game.dead; ++i) { TaskBar.reposition(TaskBar.Max()); Timer1Timer(); }
    });
    const s = await page.evaluate(() => ({ level: game.Traits.Level, tasks: game.tasks, cheater: game.cheater }));
    if (s.cheater) throw new Error("branded a cheater: " + s.cheater.reason);
    return `level ${s.level}, ${s.tasks} tasks`;
  });

  await tryStep("the journal, tactics and menu bar open", async () => {
    // (an event pop-up may be up from those tasks: it's modal, so close it,
    // as a player would)
    await page.evaluate(() => CloseEventPopup());
    await page.keyboard.press("j");
    await page.waitForSelector("dialog.win95[open] .journal");
    const entries = await page.$$eval(".journal-entry", (e) => e.length);
    await page.click("dialog.win95[open] .win95-buttons button.primary");
    await page.keyboard.press("t");
    await page.waitForSelector("#TacticsDialog[open]");
    await page.click("#TacticsClose");
    await page.click("#MenuBar .menu-top >> nth=3");
    await page.waitForSelector("#MenuBar li.open .menu-pop, #MenuBar .menu-pop:visible");
    await page.keyboard.press("Escape");
    return entries + " journal entries";
  });

  await tryStep("the Journal menu opens the journal", async () => {
    await page.evaluate(() => CloseEventPopup());
    const menu = page.locator("#MenuBar .menu-top", { hasText: "Journal" });
    await menu.click();
    await page.locator("#MenuBar .menu-pop:visible li", { hasText: "Read the Journal" }).click();
    await page.waitForSelector("dialog.win95[open] .journal");
    const first = await page.textContent("dialog.win95[open] .journal-entry .journal-stamp");
    await page.click("dialog.win95[open] .win95-buttons button.primary");
    if (!/level 1$/.test(first.trim())) throw new Error("the first entry is from " + first);
    return "first entry: " + first.trim();
  });

  await tryStep("Settings opens from the menu, and keeps a setting", async () => {
    await page.locator("#MenuBar .menu-top", { hasText: "View" }).click();
    await page.locator("#MenuBar .menu-pop:visible li", { hasText: "Settings" }).click();
    await page.waitForSelector("dialog.win95[open] .settings");
    await page.click("dialog.win95[open] .settings-tabs button[data-tab=Events]");
    await page.selectOption("dialog.win95[open] .settings-pane[data-tab=Events] select", "30");
    await page.click("dialog.win95[open] .settings-tabs button[data-tab=Keyboard]");
    const keys = await page.$$eval("dialog.win95[open] .shortcuts kbd", (k) => k.length);
    await page.click("dialog.win95[open] .win95-buttons button.primary");
    const linger = await page.evaluate(() => EventPopupLinger());
    if (linger != 30) throw new Error("the pop-up time came back as " + linger);
    if (keys < 10) throw new Error("only " + keys + " shortcuts listed");
    return keys + " shortcuts listed";
  });

  await tryStep("screen readers hear scenes and level-ups, unless turned off in Settings", async () => {
    const heard = await page.evaluate(async () => {
      const wait = () => new Promise((r) => setTimeout(r, 80));
      const el = document.getElementById("A11yStatus");
      Announce("Level 99.");
      await wait();
      const on = el.textContent;
      SettingSet("announce", "0");
      el.textContent = "";
      Announce("Level 100.");
      await wait();
      const off = el.textContent;
      SettingSet("announce", null);
      const bars = document.querySelectorAll("[role=progressbar][aria-valuenow]").length;
      const named = [...document.querySelectorAll("input[type=checkbox]")].every((c) => c.getAttribute("aria-label") || c.labels.length);
      return { on, off, bars, named, main: !!document.querySelector("[role=main]") };
    });
    if (heard.on != "Level 99.") throw new Error("the live region said " + JSON.stringify(heard.on));
    if (heard.off) throw new Error("it still spoke with announcements off");
    if (!heard.named) throw new Error("a checkbox has no name");
    if (!heard.main || heard.bars < 4) throw new Error("landmarks or progress bars are missing");
    return heard.bars + " progress bars";
  });

  await tryStep("the entourage has a word: a pet rock idles, a tutor grades the fight", async () => {
    const said = await page.evaluate(() => {
      const chance = K.Sink.Chatter, boons = game.boons;
      K.Sink.Chatter = Object.assign({}, chance, { Idle: 1, Fight: 1, Quiet: 0 });
      try {
        game.boons = [{ k: "egg", n: "a pet rock named Pebbles", until: 0, c: 1, w: "Pebbles" }];
        CompanyChatter("idle");
        const idle = $("#Company").text();
        game.boons = [{ k: "tutor", n: "Professor Snodgrass", until: game.elapsed + 3600, c: 1, w: "Professor Snodgrass" }];
        const fight = game.combat || { foe: "the Giant Orc", rounds: 7, outcome: "win" };
        CompanyChatter("win", fight);
        const win = $("#Company").text();
        game.boons = [];
        CompanyChatter(null);   // the tutor's gone: so is the word
        const gone = $("#Company").text();
        return { idle, win, gone };
      } finally { K.Sink.Chatter = chance; game.boons = boons; }
    });
    if (!/Pebbles|rock/.test(said.idle)) throw new Error("the rock said " + JSON.stringify(said.idle));
    if (!/Snodgrass/.test(said.win) || /\{/.test(said.win)) throw new Error("the tutor said " + JSON.stringify(said.win));
    if (said.gone) throw new Error("the word stayed after the tutor left: " + said.gone);
    return said.win;
  });

  await tryStep("Scrollr: R opens the feed, newest first, and clears the count", async () => {
    await page.evaluate(() => {
      ToggleFeed(false);
      ["realm", "town"].forEach((key, i) => GossipPost(GossipDice("smoke" + i), key, K.GossipPools[key]));
    });
    const badge = await page.$eval("#FeedNew", (e) => e.textContent);
    await page.keyboard.press("r");
    const seen = await page.evaluate(() => ({
      open: !$("#Feed").prop("hidden") && $("#GearPane").prop("hidden"),
      posts: $("#Feed .post").length, first: $("#Feed .post-text").first().text(),
      newest: game.feed[game.feed.length - 1].x, badge: $("#FeedNew").text(),
      selected: $("#TabFeed").attr("aria-selected")
    }));
    await page.keyboard.press("r");
    const back = await page.evaluate(() => !$("#GearPane").prop("hidden"));
    if (!/\(\d+\)/.test(badge)) throw new Error("no count of new posts: " + JSON.stringify(badge));
    if (!seen.open || seen.selected != "true") throw new Error("R didn't open the feed");
    if (!seen.posts || seen.first != seen.newest) throw new Error("the newest post isn't first: " + seen.first);
    if (seen.badge) throw new Error("the count stayed: " + seen.badge);
    if (!back) throw new Error("R again didn't go back to Equipment");
    return seen.posts + " posts; newest: " + seen.first;
  });

  await tryStep("time lost with the game open (a throttled tab) is played through", async () => {
    const r = await page.evaluate(() => new Promise((done) => {
      CloseEventPopup();
      const was = game.elapsed, paused = IsPaused();
      StartTimer();
      clock.lasttick -= 20000;   // twenty seconds without a tick
      setTimeout(() => { const got = game.elapsed - was; if (paused) TogglePause(); StopTimer(); done(got); }, 500);
    }));
    // (game time counts whole seconds per task, so short tasks lose a little;
    // without catching up, the gap would count for a tenth of a second)
    if (!(r >= 10)) throw new Error("only " + r + " seconds of the 20 were played");
    return r + " of 20 seconds played (game time counts whole seconds a task)";
  });

  await tryStep("a backup downloads and the hero saves", async () => {
    const [dl] = await Promise.all([page.waitForEvent("download"), page.evaluate(() => ExportHero())]);
    return dl.suggestedFilename();
  });

  await tryStep("the share page shows the hero's sheet", async () => {
    const code = await page.evaluate(() => ShareCode(game));
    const sheet = await context.newPage();
    watch(sheet, "sheet");
    await sheet.goto(BASE + "sheet.html#" + code);
    await sheet.waitForSelector("#SheetBody:not([hidden])");
    const seal = await sheet.textContent("#SheetSeal");
    await sheet.close();
    if (!/Straight from the game/.test(seal)) throw new Error("seal says: " + seal);
    return seal.trim();
  });

  await tryStep("a hero rolling in gold splurges (a henchman, a tavern)", async () => {
    const r = await page.evaluate(() => {
      CloseEventPopup();
      const play = () => { TaskBar.reposition(TaskBar.Max()); Timer1Timer(); };
      const settle = () => { for (let i = 0; i < 100 && (game.event || game.queue.length); ++i) play(); };
      settle();
      Add(Inventory, "Gold", 1000000);
      for (const key of ["henchman", "tavern"]) {
        StartSplurge("", key);
        settle();
      }
      ShowBuffs();
      return { boons: $("#Boons").text(), owned: $("#Owned").text(), event: $("#RecentWhere").text() + ": " + $("#RecentResult").text(),
               popup: document.getElementById("EventDialog").open };
    });
    await page.evaluate(() => CloseEventPopup());
    if (!/^Splurged: Henchman \S+ \(\d+h \d+m\)/.test(r.boons)) throw new Error("under the health bars: " + r.boons);
    if (!/^Owns: The .*, a tavern in /.test(r.owned)) throw new Error("under the purse: " + r.owned);
    if (!/^Money to burn: Spent \d+ gold on a tavern/.test(r.event)) throw new Error("the last event: " + r.event);
    if (!r.popup) throw new Error("no event pop-up");
    return r.boons + " / " + r.owned;
  });

  await tryStep("a named elite is slain for a unique", async () => {
    const r = await page.evaluate(() => {
      CloseEventPopup();
      const play = () => { TaskBar.reposition(TaskBar.Max()); Timer1Timer(); };
      for (let i = 0; i < 100 && (game.event || game.queue.length); ++i) play();
      // the next fight is an elite: every seed passes (K.Elite.Odds of 1), and
      // the elite is made weak enough to lose
      const odds = K.Elite.Odds, hp = K.Elite.HP;
      K.Elite.Odds = 1; K.Elite.HP = 0.01;
      let tries = 0;
      while (!(game.combat && game.combat.elite && game.combat.done) && tries++ < 200) play();
      K.Elite.Odds = odds; K.Elite.HP = hp;
      const won = game.combat.outcome == "win" || game.combat.outcome == "close";
      return { won, foe: game.combat.foe, uniques: (game.uniques || []).length,
               marked: $("#Equips tr.unique").length, event: $("#RecentWhere").text() + ": " + $("#RecentResult").text(),
               journal: (game.journal || []).filter((e) => e.k == "elite").length };
    });
    await page.evaluate(() => CloseEventPopup());
    if (!r.won) throw new Error("lost to " + r.foe);
    if (!r.uniques || !r.marked) throw new Error(`uniques ${r.uniques}, marked in the equipment list ${r.marked}`);
    if (!/^An elite!: Took .+ \(.+, power \d+\)/.test(r.event)) throw new Error("the last event: " + r.event);
    if (!r.journal) throw new Error("not in the journal");
    return r.foe + " / " + r.event.replace(/^.*Took /, "");
  });

  await tryStep("challenge links: a run link fills in Custom Run, and a hero link shows side by side", async () => {
    // (the smoke-test hero was rolled with a seed, so it can be compared with
    // itself: the same run in the same browser)
    const code = await page.evaluate(() => ShareCodeFor(VersusPayload(game)));
    const menu = await context.newPage();
    watch(menu, "menu");
    await menu.goto(BASE + "index.html#custom/" + encodeURIComponent("smoke test") + "/glasscannon");
    await menu.waitForSelector("#dlgChallenge[open] #customFromLink:visible");
    const filled = await menu.evaluate(() => [$("#customSeed").val(),
      $("#customMutators input:checked").map(function () { return this.value; }).get().join()]);
    if (filled.join("|") != "smoke test|glasscannon") throw new Error("the run link filled in " + filled.join(" / "));
    await menu.goto(BASE + "index.html");
    await menu.goto(BASE + "index.html#vs/" + code);
    await menu.waitForSelector("#dlgVersus[open] .versus-table");
    const names = await menu.$$eval("#dlgVersus .versus-table tbody tr:first-child td", (t) => t.map((x) => x.textContent));
    const note = await menu.textContent("#versusNote");
    await menu.close();
    if (names.length != 2 || !names[1]) throw new Error("side by side: " + names.join(" / ") + " (" + note + ")");
    return names.join(" vs ") + ": " + note;
  });

  await tryStep("quitting lands on Resume, with the hero listed", async () => {
    await page.keyboard.press("q");
    await page.waitForURL(/index\.html#resume/);
    await page.waitForSelector("#roster .row");
    return await page.textContent("#roster .row .name");
  });

  await tryStep("the hero plays again from Resume, and retires to the Hall of Legends", async () => {
    await page.click("#roster .row .play");
    await page.waitForURL(/main\.html#/);
    await page.waitForFunction(() => window.game && game.Traits && game.Traits.Name == "Smoketest");
    await page.evaluate(() => {
      StopTimer();
      game.finale = { state: "won", wonLevel: 50, wonAt: game.elapsed, tries: 1 };
      Retire();
    });
    await page.waitForURL(/index\.html#hall/);
    await page.waitForSelector("#legends .row .sheetlink:not([hidden])");
    return await page.textContent("#legends .row .name");
  });

  for (const [hash, selector] of [["hall", "#dlgHall[open]"], ["challenge", "#dlgChallenge[open]"], ["codex", "#dlgCodex[open]"]]) {
    await tryStep(`the ${hash} window opens`, async () => {
      await page.goto(BASE + "index.html");
      await page.goto(BASE + "index.html#" + hash);
      await page.waitForSelector(selector);
    });
  }

  await tryStep("the Codex lists the unique, and the Bestiary marks the elite's kind", async () => {
    await page.click('#dlgCodex [data-tab="uniques"]');
    await page.waitForSelector("#codexPane.codex-uniques td.unique");
    const unique = await page.textContent("#codexPane td.unique");
    await page.click('#dlgCodex [data-tab="bestiary"]');
    await page.waitForSelector("#codexPane.codex-bestiary td.elite");
    return unique;
  });

  await browser.close();
  server.close();

  errors.forEach((e) => console.log("✘ page error: " + e));
  const failed = steps.filter((s) => !s.ok).length + errors.length;
  console.log(`\n${steps.length - steps.filter((s) => !s.ok).length} of ${steps.length} steps passed` +
              (errors.length ? `, ${errors.length} page errors` : ", no page errors"));
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, "### In a browser\n\n| | Step | |\n|---|---|---|\n" +
      steps.map((s) => `| ${s.ok ? "✅" : "❌"} | ${s.name} | ${(s.detail || "").replace(/\|/g, "\\|")} |`).join("\n") +
      (errors.length ? "\n\n**Page errors**\n\n" + errors.map((e) => "- " + e).join("\n") : "") + "\n\n");
  }
  process.exit(failed ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });
