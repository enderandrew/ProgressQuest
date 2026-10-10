// Scrollr: the realm's social feed, a tab beside Equipment.
//
// Sir Spreddit, the town crier of the whole realm, posts the big news to
// s/all; his assistant criers, the Sub-Spreddits, post the local news of
// the kingdom of the current Act to s/<kingdom>. Everyone else posts too:
// the monsters complain about the hero, the quest givers get passive-
// aggressive, the merchants brag about their markup, the Act's nemesis
// taunts, and the townsfolk reply.
//
// Like the journal it is kept with the hero (game.feed, newest last), and
// it never changes how a hero's game goes: it has dice of its own, and the
// game's (the global seed) are swapped out while it makes up a name. To
// keep it small, no line is ever posted twice (game.feedUsed has a short
// hash of each one used), the oldest posts go past K.Gossip.Max or
// MaxChars, and the everyday chatter slows down as the feed grows: so a
// hero idling to level 50 sees a few hundred posts, not thousands.
//
// Loaded by main.html (and sim.js). main.js calls Gossip() only when this
// file is there.

K.Gossip = {
  Max: 120,            // posts kept, at most...
  MaxChars: 20000,     // ...and this much text (about 25 KB in the save)
  Gap: 3,              // game minutes between two everyday posts, at first...
  GapGrowth: 0.5,      // ...and this much longer for each post so far...
  GapMax: 60,          // ...up to this
  FightChance: 0.15,   // the chance of an everyday post after a fight, once the gap is up
  OtherChance: 0.5,    // ...and after anything else
  ReplyChance: 0.35,   // the chance a post gets a reply
  Fields: 's/KillingFields'
};

// Who posts what. who: 'spreddit' (Sir Spreddit, s/all), 'crier' (the
// Sub-Spreddit of the Act's kingdom), 'monster' (a monster of a kind the
// hero fights; {foe}, {a-foe}), 'elite', 'giver' (the Act's quest giver), 'merchant'
// or 'nemesis' (the Act's). The lines can say {hero}, {race} and {klass}
// (the hero's; {a-klass}: "a Barbarian"), {level}, {alignment}, {weapon}, {gear}, {spell}, {wins},
// {deaths}, {kingdom} (the Act's), {kingdom2}, {giver}, {nemesis}, {guy},
// {boring}, {item}, {race-one}, {act}, {quest} (the quest under way,
// "fetch me a cheese"), {foe} ("Giant Orc"), {a-foe} ("a Giant Orc") and
// {monsters} ("Giant Orcs"),
// and what the post is about: {loot} and {rounds} (a fight), {done} (a
// finished quest), {thing} and {gold} (a splurge), {event}, {where},
// {choice} and {seconds} (an event), {elite}, {kind} (its kind) and
// {item} (its unique), {cause} (a death).
K.GossipPools = {
  // On arriving at the Killing Fields™
  arrive: { who: 'monster', lines: [
    "Wow, {hero} just showed up in the Killing Fields™ unannounced. Toxic.",
    "Not {hero} again. Some of us are trying to graze.",
    "PSA: {hero} is back. Hide your loot tables.",
    "Can we talk about how {hero} never says hello before the stabbing?",
    "{hero} is level {level} and still farming us. Get a hobby.",
    "Just saw {a-klass} heading this way. If I don't post again, avenge me. Or don't. I'm {a-foe}.",
    "Petition to ban {race} heroes from the Killing Fields™. Sign below.",
    "Imagine having a whole kingdom to explore and choosing our back garden.",
    "Reminder that the Killing Fields™ is a trademark and {hero} has not paid a licensing fee.",
    "Moving to {kingdom2}. Heard the heroes there have quests that aren't us.",
    "{hero}'s {weapon} has a body count and frankly it should be in their bio.",
    "Can someone tell {hero} the respawn timer is not a challenge.",
    "Saw {hero} stretching before a fight. Stretching. Like we're a workout.",
    "Pro tip: if you play dead, {hero} loots you anyway. Learned that the hard way.",
    "Every monster in this field has a family, {hero}. Well, a spawn table. Same thing.",
    "Hearing footsteps. Heavy, {alignment} footsteps. Logging off."
  ] },

  // After the hero wins a fight: the loser's side of the story
  lost: { who: 'monster', lines: [
    "Just got absolutely bodied by {hero}. No warning. No emote. Nothing.",
    "{hero} took my {loot} and didn't even say thanks. Raised in a barn.",
    "Hey {hero}, I had a family. Okay, a spawn point. But still.",
    "Lost to a level {level} {klass}. Deleting my account. See you when I respawn.",
    "That {weapon} should be nerfed. Thread below.",
    "Hot take: {hero} only won because of the dice.",
    "Ratio'd by {hero}. Again.",
    "Is it 'grinding' if I'm the one getting ground? Asking for a friend. The friend is me.",
    "Back from the dead with a hot take: {hero} smells.",
    "Got killed in {rounds}. I want a recount.",
    "{hero} hit me with {spell}. Who even learns {spell}?",
    "Can't believe I died to someone whose best gear is {gear}.",
    "Not me getting one-shot on my first day out of the spawning pool.",
    "{hero} looted me and left the body out in the sun. Unbelievable.",
    "Every time {hero} levels up I get a little bit more dead. Coincidence?",
    "Reporting {hero} for griefing. Report status: ignored.",
    "Leaving the Killing Fields™ a one-star review. Would not be killed again.",
    "I was minding my own business. Well, my own lair. Same thing.",
    "Me: just a humble {foe}. {hero}: and I took that personally.",
    "Starting a support group for {monsters} who met {hero}. Attendance is low, for obvious reasons.",
    "My {loot} was a family heirloom. Now it's {hero}'s family heirloom, I suppose.",
    "Died again. {hero} didn't even look at me. I'm not even worth a look."
  ] },

  // After the hero runs away
  fled: { who: 'monster', lines: [
    "{hero} just ran from me. RAN. Screenshotting this.",
    "Chased off a level {level} {klass}. Not bad for {a-foe}.",
    "{hero} remembered an appointment the second I showed up. Sure, Jan.",
    "Imagine fleeing {a-foe}. Couldn't be me. It was, in fact, {hero}.",
    "Thanks for the free XP, {hero}. Oh wait, you ran.",
    "{hero} retreated so fast they left a {hero}-shaped hole in the hedge.",
    "Didn't know {race} heroes could move that fast. Or in that direction."
  ] },

  // After the hero loses a fight
  beat: { who: 'monster', lines: [
    "Just sent {hero} back to the temple. GG EZ.",
    "{hero} came into MY field with THAT {weapon}? Couldn't be me.",
    "Somebody tell {hero}'s priest to put the kettle on.",
    "Took {hero}'s pocket money. Buying myself something nice. A bigger lair.",
    "{hero} is level {level} and lost to {a-foe}. Let that sink in.",
    "Screenshot of {hero} face-down in the mud. Framing it.",
    "Me, a humble {foe}: wins one fight. Also me: posts about it for a week.",
    "Not to brag, but I just defeated the hero of the age. Okay, a hero. Of the afternoon.",
    "{hero} said 'I'll be back' on the way to the temple. Can't wait.",
    "First win in ages. Thank you to my coach, my family, and {hero}'s terrible footwork."
  ] },

  // Now and then, about the quest under way
  nag: { who: 'giver', lines: [
    "Still waiting on {hero} to {quest}. Guess promises mean nothing in {kingdom}.",
    "Not to be dramatic, but I asked {hero} to {quest} and they've been fighting {monsters} instead.",
    "Day four of my quest being 'in progress'. Day four of my faith in heroes being 'in progress'.",
    "Some of us posted a quest in good faith. Some of us are {hero}.",
    "Love how {hero} has time to fight every {foe} in the land but not to {quest}.",
    "Is it too much to ask a hero to {quest}? Apparently yes.",
    "Leaving this here for no reason: {quest}. Anyway.",
    "Tagging {hero} in this. They know what they did. They know what they didn't do.",
    "I'm told {hero} is 'on it'. My {boring} has been on it longer.",
    "Quest board update: still one quest. Still {hero}'s. Still not done.",
    "Some heroes {quest}. Some heroes level up in the Killing Fields™ and pretend not to see your messages.",
    "Seen: yes. Replied: no. Quest: {quest}. Status: abandoned in spirit.",
    "Fine. I'll {quest} myself. (I won't. I can't. That's why I hired a hero.)",
    "Starting to think {hero} is only in it for the {boring}.",
    "New rule in {kingdom}: no payment until the quest is done. {hero}, this means you. Mostly you.",
    "I've started a second quest, just to {quest}. The second hero is also {hero}. They don't know."
  ] },

  // A quest done
  thanks: { who: 'giver', lines: [
    "Shoutout to {hero}, who finally managed to {done}. Only took forever.",
    "{hero} did the quest. I'm not crying. You're crying.",
    "Quest complete! Paid {hero} in exposure. And a little gold. Mostly exposure.",
    "Leaving {hero} a five-star review. Would quest again. Wouldn't wait that long again.",
    "It's done. {hero} did it. I don't remember what I asked for, but it's done.",
    "Thanks, {hero}! Already thinking of another little errand. Nothing big. It's a dragon.",
    "{hero} came back with exactly what I asked for, plus some viscera. Five stars, minus one for the viscera.",
    "Promoting {hero} from 'that hero' to 'my hero'. Don't get used to it."
  ] },

  // After a splurge (K.Sinks in events.js): the seller's side
  markup: { who: 'merchant', lines: [
    "Just sold {thing} to {hero} for {gold} gold. My cost: about nine. Business is booming.",
    "Shoutout to {hero} for funding my summer home. Enjoy {thing}!",
    "Markup? I prefer 'artisanal pricing'. {hero} understood. {hero} paid {gold}.",
    "{hero} didn't haggle. Not even a little. I'm framing the receipt.",
    "Raised all my prices the moment {hero} walked in. They didn't notice.",
    "Today's lesson in economics: {hero} had {gold} gold. Now I do.",
    "If anyone asks, {thing} has always cost {gold} gold. Always.",
    "I'd like to thank {hero} for their generous donation to my retirement. Also for buying {thing}.",
    "Started the day with {thing}. Ended it with {gold} gold and an empty conscience.",
    "No refunds. No returns. No regrets. Thank you for shopping, {hero}!",
    "Customer of the month: {hero}. Customer of the year: also {hero}. Only customer: {hero}.",
    "Some call it price gouging. I call it a {gold} gold day."
  ] },

  // A random event: the local news
  event: { who: 'crier', lines: [
    "Reports from {where}: “{event}”. We'll update this post if it gets weirder.",
    "Eyewitnesses describe the scene: “{event}”. Thoughts and prayers.",
    "Another day, another {hero} incident: “{event}”. Thread.",
    "Not making this up: “{event}”. Okay, the bard is making it up. But it happened.",
    "Is it just me, or does weird stuff keep happening to {hero}? Latest: “{event}”.",
    "We asked {hero} for comment on “{event}”. They were busy. Fighting. Obviously.",
    "In other news: “{event}”. The Sub-Spreddit is divided.",
    "TIL: “{event}”. The things you learn following {hero}.",
    "Local sources confirm: “{event}”. Unconfirmed: everything else.",
    "This just in from {where}: “{event}”. More at eleven. There is no eleven."
  ] },

  // A choice event the player answered
  chose: { who: 'spreddit', lines: [
    "POLL: {hero} chose “{choice}”. Good call? 🅰 Yes 🅱 No 🅲 Who is {hero}",
    "{hero} went with “{choice}”. The comments are a war zone.",
    "Bold move from {hero}: “{choice}”. History will judge. History is busy.",
    "Hot take: “{choice}” was the right call. Hotter take: it wasn't.",
    "{hero} chose “{choice}” all by themselves. No fate involved. Growth.",
    "Watching {hero} pick “{choice}” in real time was a journey.",
    "BREAKING: {hero} has made a decision. It was “{choice}”. Markets react.",
    "Respect to {hero} for “{choice}”. Disrespect to everyone saying otherwise."
  ] },

  // ...and one fate answered
  fate: { who: 'spreddit', lines: [
    "{hero} couldn't decide, so fate picked “{choice}”. Relatable.",
    "{hero} stood there for {seconds} seconds. Fate got bored and chose “{choice}”.",
    "Fate chose “{choice}” for {hero}. Nobody asked fate. Fate doesn't care.",
    "Indecision of the year goes to {hero}. Fate went with “{choice}”.",
    "Is {hero} AFK? Asking because fate just chose “{choice}” for them.",
    "Left on read by {hero}, fate picked “{choice}”. We stan a decisive universe.",
    "No thoughts, head empty: {hero} let fate pick “{choice}”."
  ] },

  // A level (every fifth for sure, the others now and then)
  level: { who: 'spreddit', lines: [
    "Congrats to {hero} on level {level}! The monsters of the realm have been notified.",
    "{hero} hits level {level}. Somewhere, {a-klass} trainer feels a disturbance.",
    "Level {level} for {hero}. Their mother says she's 'very proud' and 'please write'.",
    "Realm-wide announcement: {hero} is now level {level}. Please adjust your expectations accordingly.",
    "{hero} reaches level {level}, {wins} wins in. The XP economy is in shambles.",
    "LEVEL UP: {hero}, {race} {klass}, level {level}. Stats: up. Humility: down.",
    "{hero} is level {level} now. Remember when they were level 1? Nobody does. Nobody followed them then.",
    "Sir Spreddit's Heroes to Watch, number one: {hero}, level {level}. There is no number two.",
    "A level {level} hero walks into a tavern. It's {hero}. That's the post.",
    "{hero} at level {level}: still no idea what CHA does.",
    "Hearing reports that {hero} reached level {level} while not paying attention. Typical.",
    "Level {level}! {hero}'s journal entry for today reportedly just says 'nice'."
  ] },

  // A named elite (K.Elite) falls...
  eliteWon: { who: 'spreddit', lines: [
    "BREAKING: {elite} has fallen to {hero}. The title is up for grabs. Applications close never.",
    "{hero} took down {elite}. The Codex has been updated. Sorry, {elite}'s fans.",
    "RIP {elite}. Slain by {hero}, robbed of {item}. Thoughts with the family.",
    "End of an era: {elite}. Start of an era: {hero} wearing {item}.",
    "{elite} had a name, a title and a following. Now has none of those. Thanks, {hero}."
  ] },

  // ...or doesn't
  eliteHeld: { who: 'elite', lines: [
    "Just handled {hero}. Didn't even need my title for it.",
    "{hero} thought they could take on {elite}? I AM {elite}.",
    "Add {hero} to the list. It's a long list. It's a list of heroes I've beaten.",
    "Tell your hero friends: {elite} is open for business. The business is beating {hero}.",
    "{hero} ran. They always run. Anyway, follow for more {kind} content."
  ] },

  // An Act over
  act: { who: 'spreddit', lines: [
    "{hero} wraps up {act}. Critics call it 'derivative'. Audiences call it 'over'.",
    "And that's {act} done. The next chapter promises 'more of the same, but harder'.",
    "{act}: complete. {hero} would like to thank nobody in particular.",
    "Spoilers for {act} below. {hero} won. That's the spoiler.",
    "The end of {act}. The bards are already working on the sequel. It's the same song.",
    "{hero} finishes {act}. {kingdom} breathes a sigh of relief, then a sigh of 'oh no, there's more'.",
    "Just finished {act}, starring {hero}. Four stars. Too much grinding in the middle.",
    "{act} is over. {nemesis} has been reached for comment and is unavailable, for reasons.",
    "Plot development: {hero} has developed some plot. Act over. Next!",
    "And so ends {act}. Fans debate whether {hero} grew as a character. They did. Mostly in HP."
  ] },

  finaleWon: { who: 'spreddit', lines: [
    "IT HAPPENED. The Old Bastard™ is down. {hero} did it. Sir Spreddit is crying. Sir Spreddit is fine.",
    "Realm-wide holiday declared: {hero} has beaten the Old Bastard™. The monsters are drafting a statement.",
    "Everyone will remember where they were when {hero} beat the Old Bastard™. Mostly: the Killing Fields™."
  ] },

  finaleLost: { who: 'spreddit', lines: [
    "The Old Bastard™ has beaten {hero}. 'Not today,' he said. 'Maybe tomorrow. I'm old.'",
    "Tough loss for {hero} against the Old Bastard™. The Sub-Spreddits are 'devastated' and 'not surprised'.",
    "The Old Bastard™ 1, {hero} 0. Rematch pending. Tickets selling fast."
  ] },

  death: { who: 'spreddit', lines: [
    "We are sad to report that {hero} has died. Cause: {cause}. Flowers may be left at the Killing Fields™, which is ironic.",
    "RIP {hero}, level {level} {klass}. Gone too soon. Well, about on time, for a hero.",
    "{hero} has fallen. The monsters have changed their profile pictures. Respect."
  ] },

  // The local news, at market
  town: { who: 'crier', lines: [
    "Local goat elected to the town council of {kingdom}. Council says it's 'an improvement'.",
    "Reminder: the well in {kingdom} is NOT a wishing well. Stop throwing gold in. The well is full.",
    "Lost: one {boring}. Last seen near the market. If found, keep it, honestly.",
    "{guy} is opening a new shop in {kingdom}. It sells shops.",
    "Traffic: a cart jam on the {kingdom} road. A goose is involved. The goose is winning.",
    "Weather in {kingdom}: grim, with a chance of prophecy.",
    "Market prices in {kingdom}: viscera, down. Pelts, steady. Small-clothes, unaccountably up.",
    "Tavern brawl last night in {kingdom}. Winner: the tavern.",
    "{guy} has been spotted in {kingdom}. Act natural.",
    "Today in {kingdom} history: absolutely nothing happened. Let's keep it that way.",
    "Local bard releases a new album. It is one song. The song is about himself.",
    "Hero sighting: {hero} at the market, buying {boring} and looking pleased about it.",
    "Bake sale at the temple of {kingdom}. All proceeds to the temple. All cakes to the priests.",
    "Crime in {kingdom}: someone stole the town's only {boring}. Suspects: everyone.",
    "Public service announcement: please stop feeding the mimics. They are not chests. Well, they are.",
    "The {kingdom} council votes to rename the market square 'Square Market'. Nobody can tell the difference.",
    "Lost kitten in {kingdom}. Answers to 'Destroyer of Worlds'. Please do not approach.",
    "Town meeting tonight about the monster problem. Monsters are invited. Monsters are coming.",
    "Poll: should {kingdom} get a second well? Results: 51% yes, 49% 'what's a well'.",
    "The {kingdom} guard is hiring. Requirements: a pulse, and a spear. Spear optional.",
    "Fashion in {kingdom} this season: muddy. Next season: also muddy.",
    "{kingdom} declares itself 'the friendliest town in the realm'. Visitors are asked to leave."
  ] },

  // The realm's news, at rest
  realm: { who: 'spreddit', lines: [
    "Good morning, realm! Sir Spreddit here with your news. The news is: heroes.",
    "Sir Spreddit's word of the day: 'loot'. Use it in a sentence. Then go and get some.",
    "Reminder that the Old Bastard™ is still out there. Probably napping. He's old.",
    "Trending in the realm: #KillingFields, #{hero}, #WhereIsMyQuest.",
    "Sir Spreddit has been told he's 'just a guy with a bell'. Sir Spreddit has a very nice bell.",
    "Scrollr's terms of service have been updated. Nobody read them. Nobody ever reads them.",
    "Ask Sir Spreddit: 'Is it normal for a {race-one} to snore?' Yes. Next question.",
    "Weekly reminder that every hero's journal is private. Sir Spreddit has read all of them.",
    "Sir Spreddit is taking a short break from the realm. Back in five minutes. Back now.",
    "Followers: up. Kingdom morale: steady. Bell: shiny. Sir Spreddit: thriving.",
    "The Sub-Spreddits report: {kingdom} is fine, {kingdom2} is on fire, and nobody can find the third one.",
    "Today's forecast for the realm: a hero will find something in a monster that shouldn't have been in a monster.",
    "Sir Spreddit reminds all heroes to stay hydrated, and to stop looting bodies in public.",
    "Unpopular opinion: the Killing Fields™ could use some benches.",
    "Shoutout to the quest givers of the realm. Without you, heroes would have to think of things to do.",
    "Sir Spreddit fact-check: no, {a-klass} can't do that. Yes, {hero} did it anyway.",
    "A reader asks: 'Why are there so many monsters?' Because heroes need something to do between quests.",
    "This post was sponsored by DungeonCoin. Sir Spreddit regrets everything."
  ] },

  // The Act's villain, on the road
  taunt: { who: 'nemesis', lines: [
    "{hero} thinks they can stop me. LOL. LMAO, even.",
    "Building my evil lair one stone at a time. Taking suggestions. Not from {hero}.",
    "Every day {hero} doesn't find me, I get a little more smug.",
    "Just a villain posting villain things. Unrelated: {hero}, you smell.",
    "Can't wait for {hero} to reach me at the end of {act}. I've been practicing my speech.",
    "My henchmen have unionized. Thanks for the inspiration, {hero}, I guess.",
    "Petty? Me? I just think {hero} should log off. Forever. That's all.",
    "Been the villain of {act} for ages now. Hurry up, {hero}. My cape is going out of fashion."
  ] }
};

// What the Sub-Spreddit says about each kind of splurge (K.Sinks)
K.GossipSinks = {
  henchman: ["Local hero {hero} seen hiring a henchman. The henchman has been seen eating everything. Developing."],
  horse: ["A horse, or something close to one, has been sold to {hero}. The stablehands have questions."],
  temple: ["The temple of {kingdom} reports a record donation from {hero}. The priests are 'discussing a fountain'."],
  tutor: ["{hero} has hired a private tutor. Sources say the tutor has already asked for a raise."],
  trainer: ["A personal trainer was seen yelling at {hero} in the square. Witnesses say it 'looked effective'."],
  backpack: ["A local leatherworker sells {hero} a bigger backpack. 'It has a cup holder,' she told us. Twice."],
  insurance: ["{hero} buys adventurer's insurance. The underwriters of {kingdom} reportedly laughed for an hour."],
  taxes: ["BREAKING: the tax collector of {kingdom} has found {hero}. More on this story as it audits."],
  lawsuit: ["Court news: {hero} loses a wrongful-slaying suit brought by the family of {nemesis}, who is fine."],
  dice: ["The dice den reports a 'lively' visit from {hero}. The dice have been taken in for questioning."],
  tavern: ["{hero} is now a tavern owner. Regulars say nothing has changed except the prices."],
  statue: ["A statue of {hero} goes up in the square. The pigeons have already formed a committee."],
  memoir: ["{hero} has hired a ghostwriter. Publishers are 'cautiously indifferent'."],
  coin: ["DungeonCoin update: {hero} has invested. DungeonCoin is down. These facts may be related."],
  egg: ["A merchant sells a 'dragon egg' to {hero}. Experts confirm: rock."],
  enchanter: ["An enchanter has improved {hero}'s gear. It glows now. Witnesses say it's 'a bit much'."],
  seminar: ["{hero} attended a self-help seminar and has started saying 'synergy'. Concern grows."],
  ballad: ["A new ballad about {hero} tops the tavern charts. It is the only ballad on the tavern charts."],
  feast: ["{hero} throws a feast for all of {kingdom}. The leftovers are being rationed to the goats."],
  crossfit: ["{hero} has joined a members-only gym cave and will not stop talking about it. Sources: everyone."],
  parkour: ["Reports of {hero} vaulting over carts 'for no reason'. Carts: unharmed. Carters' pride: harmed."],
  cryospa: ["{hero} was seen leaving the bathhouse covered in volcanic mud and artisanal leeches. 'Glowing,' says the spa."],
  symposium: ["{hero} sat through six hours on the economics of gelatinous cubes and is now 'asking questions'."],
  mindfulness: ["{hero} is back from a silent retreat and hasn't said a word since. Bliss, or a sore throat?"]
};

// Replies from the townsfolk, under a post now and then
K.GossipReplies = [
  "first", "ratio", "this is the content I'm here for", "source?",
  "my cousin was there and says this is true", "who asked", "lol",
  "can confirm, I was the goat", "{hero} fans in shambles", "not the {klass} slander again",
  "this aged well", "Sir Spreddit pls", "I'm literally a {race-one} and this is offensive",
  "unsubscribe", "the mods are asleep, post goblins", "brb telling my guild",
  "touch grass. not the Killing Fields™ grass", "real", "this but unironically",
  "who is {hero}?", "I liked {hero} before they were popular", "you can't prove any of this",
  "*grabs popcorn*", "mood", "😂😂😂", "{guy} would never", "the lore runs deep",
  "living rent free in my head", "cross-posting this to s/{kingdom2}", "big if true",
  "the {boring} is a metaphor", "and then everybody clapped", "{kingdom} represent"
];

// Who posted, in the saved post (p.w), and the icon beside their name
K.GossipCodes = { spreddit: 's', crier: 'c', monster: 'm', elite: 'e', giver: 'g', merchant: '$', nemesis: 'n', townsfolk: 't' };
K.GossipIcons = { s: '\uD83D\uDCEF', c: '\uD83D\uDD14', m: '\uD83D\uDC79', e: '\uD83D\uDC51', g: '\uD83D\uDCDC',
                  $: '\uD83D\uDCB0', n: '\uD83D\uDE08', t: '\uD83D\uDCAC' };

// A merchant's sign-off ("Gorbo, Purveyor of Fine Goods")
K.GossipMerchants = ['Purveyor of Fine Goods', 'Licensed Merchant', 'Merchant (Verified)', 'Wholesale Dealer',
                     'Proprietor', 'Trader in Rare Things', 'Haggler-in-Chief'];

// ---- Making posts ---------------------------------------------------------------

// Dice of its own, never the game's: the same game makes the same feed
function GossipDice(tag) {
  return new Alea("gossip", game.lifeId || "", game.tasks || 0, game.feedN || 0, tag);
}

// Run fn with the game's dice swapped for these (StoryVars, KingdomName and
// the rest roll the global seed)
function GossipWith(dice, fn) {
  if (typeof seed == "undefined") return fn();
  var gameDice = seed;
  seed = dice;
  try { return fn(); } finally { seed = gameDice; }
}

// A short fingerprint of a line, to know it's been used
function GossipHash(s) {
  var h = 5381;
  for (var i = 0; i < s.length; ++i) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// The kingdom the local news comes from: the Act's (the Prologue has none
// of its own, so the hero's home town, the same every time)
function GossipKingdom() {
  if (game.story && game.story.vars && game.story.vars.kingdom) return game.story.vars.kingdom;
  return GossipWith(new Alea("gossip-home", game.lifeId || ""), KingdomName);
}

function GossipVars(dice, info) {
  var v = GossipWith(dice, function () {
    var vars = StoryVars();
    var m = Pick(K.Monsters).split("|")[0];
    vars.foe = m;
    vars.monsters = Plural(m);
    vars.townsfolk = GenerateName();
    vars.merchant = GenerateName() + ", " + Pick(K.GossipMerchants);
    return vars;
  });
  var story = (game.story && game.story.vars) || {};
  ['kingdom', 'giver', 'nemesis', 'boring'].forEach(function (k) { if (story[k]) v[k] = story[k]; });
  v.kingdom = GossipKingdom();
  v.race = Get(Traits, 'Race');
  v.klass = Get(Traits, 'Class');
  v.level = GetI(Traits, 'Level');
  v.alignment = Get(Traits, 'Alignment') || 'Unaligned';
  v.weapon = Get(Equips, 'Weapon') || 'bare hands';
  v.gear = game.bestequip || 'nothing much';
  v.spell = (game.bestspell || '').trim() || 'nothing';
  v.wins = (game.wins || 0).toLocaleString();
  v.deaths = (game.deaths || 0).toLocaleString();
  v.act = typeof ActCaption == "function" ? ActCaption(game.act || 0) : 'the Prologue';
  var quest = (game.bestquest || '').replace(/[.!]+$/, '');
  v.quest = quest ? quest.charAt(0).toLowerCase() + quest.slice(1) : '';
  for (var k in info || {}) if (info[k] !== undefined && info[k] !== null) v[k] = info[k];
  v['a-klass'] = Indefinite(v.klass, 1);
  v['a-foe'] = /^the /i.test(v.foe) ? 'the ' + v.foe.slice(4) : Indefinite(v.foe, 1);
  return v;
}

// Something happened that the realm may post about. what: 'arrive' (at the
// Killing Fields™), 'town' (at market), 'rest', 'fight' (info: the fight),
// 'quest' (info.done: the quest), 'splurge' (info: the sink event),
// 'event' (info: the event), 'level', 'elite' (info: the fight and the
// unique), 'act', 'finale' (info.won), 'death' (info.cause)
function Gossip(what, info) {
  if (!K.GossipPools || !game || !game.lifeId) return;
  var G = K.Gossip, now = game.elapsed || 0;
  var everyday = what == 'arrive' || what == 'town' || what == 'rest' || what == 'fight';
  if (everyday) {
    // the everyday chatter: once in a while, and less often as the feed grows
    var gap = Math.min(G.GapMax, G.Gap + G.GapGrowth * (game.feedN || 0)) * 60;
    if (game.feedAt !== undefined && now - game.feedAt < gap) return;
  }
  var dice = GossipDice(what);
  var chance = function (p) { return dice() < p; };
  var pools = [];   // [pool key, extra vars], tried in turn
  var fight = info || {};
  switch (what) {
  case 'arrive':
    if (!chance(G.OtherChance)) return;
    pools = [['arrive'], ['nag'], ['taunt']];
    break;
  case 'town':
    if (!chance(G.OtherChance)) return;
    pools = [['town'], ['nag']];
    break;
  case 'rest':
    if (!chance(G.OtherChance)) return;
    pools = [['realm'], ['nag'], ['taunt']];
    break;
  case 'fight':
    if (fight.elite || !fight.outcome || !chance(G.FightChance)) return;
    var kind = fight.kind || '';
    var x = { foe: kind || undefined, monsters: kind ? Plural(kind) : undefined, loot: fight.loot || 'lunch money',
              rounds: fight.rounds + (fight.rounds == 1 ? ' round' : ' rounds') };
    pools = [[fight.outcome == 'defeat' ? 'beat' : fight.outcome == 'flee' ? 'fled' : 'lost', x]];
    break;
  case 'quest':
    if (!chance(0.35)) return;
    pools = [['thanks', { done: (info.done || 'do the thing').replace(/[.!]+$/, '').replace(/^./, function (c) { return c.toLowerCase(); }) }]];
    break;
  case 'splurge':
    var sx = { thing: info.thing, gold: (info.gold || 0).toLocaleString() };
    if (chance(0.6)) GossipPost(dice, 'markup', K.GossipPools.markup, sx);
    if (K.GossipSinks[info.sink] && chance(0.8))
      GossipPost(dice, 'sink-' + info.sink, { who: 'crier', lines: K.GossipSinks[info.sink] }, sx);
    return;
  case 'event':
    var ev = info;
    if (ev.choices && ev.chosen !== undefined && ev.choices[ev.chosen]) {
      if (!chance(0.7)) return;
      pools = [[ev.by == 'you' ? 'chose' : 'fate', { choice: ev.choices[ev.chosen].label, seconds: K.ChoiceSeconds }]];
    } else {
      if (!chance(0.25) || !(ev.lines || []).length) return;
      var wheres = { rest: 'the campfire', road: 'the road', town: 'the market', field: 'the Killing Fields™' };
      pools = [['event', { event: String(ev.lines[0]).replace(/[.!]+$/, ''), where: wheres[ev.where] || 'the realm' }]];
    }
    break;
  case 'level':
    if (GetI(Traits, 'Level') % 5 && !chance(0.1)) return;
    pools = [['level']];
    break;
  case 'elite':
    var e = fight.elite;
    if (!e) return;
    pools = [[info.item ? 'eliteWon' : 'eliteHeld',
              { elite: e.name, kind: e.kind, item: info.item ? info.item.name : '' }]];
    break;
  case 'act':
    pools = [['act', { act: info.act }]];
    break;
  case 'finale':
    pools = [[info.won ? 'finaleWon' : 'finaleLost']];
    break;
  case 'death':
    pools = [['death', { cause: info.cause || 'misadventure' }]];
    break;
  default:
    return;
  }
  for (var i = 0; i < pools.length; ++i) {
    var key = pools[i][0], pool = K.GossipPools[key];
    if (key == 'nag' && !game.bestquest) continue;
    if (key == 'taunt' && !(game.story && game.story.vars && game.story.vars.nemesis)) continue;
    if (GossipPost(dice, key, pool, pools[i][1])) {
      if (everyday) game.feedAt = now;
      return;
    }
  }
}

// Post a line from the pool, if there's one not used yet. Returns the post.
function GossipPost(dice, key, pool, extra) {
  if (!pool || !pool.lines || !pool.lines.length) return null;
  var used = game.feedUsed = game.feedUsed || [];
  var fresh = pool.lines.filter(function (line) { return used.indexOf(GossipHash(key + line)) < 0; });
  if (!fresh.length) return null;
  var line = fresh[Math.floor(dice() * fresh.length)];
  used.push(GossipHash(key + line));
  var v = GossipVars(dice, extra);
  var text = StoryText(line, v);
  text = text.charAt(0).toUpperCase() + text.slice(1);

  var town = 's/' + v.kingdom.replace(/[^A-Za-z0-9]/g, '');
  var who = pool.who, by, sub;
  if (who == 'spreddit') { by = 'Sir Spreddit'; sub = 's/all'; }
  else if (who == 'crier') { by = 'The Sub-Spreddit of ' + v.kingdom; sub = town; }
  else if (who == 'monster') { by = ProperName(v.foe); sub = K.Gossip.Fields; }
  else if (who == 'elite') { by = v.elite; sub = K.Gossip.Fields; }
  else if (who == 'giver') { by = v.giver; sub = town; }
  else if (who == 'merchant') { by = v.merchant; sub = town; }
  else if (who == 'nemesis') { by = ProperName(v.nemesis); sub = town; }
  else { by = v.townsfolk; sub = town; }

  // likes: more for Sir Spreddit, and for a hero people have heard of
  var reach = (who == 'spreddit' ? 40 : who == 'crier' ? 15 : 6) * (1 + GetI(Traits, 'Level') / 5);
  var post = { t: game.elapsed || 0, w: K.GossipCodes[who] || 't', b: by, s: sub, x: text,
               l: Math.floor(Math.pow(dice(), 2) * reach) };
  if (dice() < K.Gossip.ReplyChance) {
    var replies = K.GossipReplies.filter(function (r) { return used.indexOf(GossipHash('reply' + r)) < 0; });
    if (replies.length) {
      var r = replies[Math.floor(dice() * replies.length)];
      used.push(GossipHash('reply' + r));
      post.r = v.townsfolk + ': ' + StoryText(r, v);
    }
  }
  var feed = game.feed = game.feed || [];
  feed.push(post);
  game.feedN = (game.feedN || 0) + 1;
  GossipTrim(feed);
  if (typeof ShowFeed == "function") ShowFeed();
  return post;
}

// Within budget: the oldest posts go first
function GossipTrim(feed) {
  var chars = 0;
  feed.forEach(function (p) { chars += p.x.length + p.b.length + p.s.length + (p.r ? p.r.length : 0) + 20; });
  while (feed.length > 1 && (feed.length > K.Gossip.Max || chars > K.Gossip.MaxChars)) {
    var p = feed.shift();
    chars -= p.x.length + p.b.length + p.s.length + (p.r ? p.r.length : 0) + 20;
  }
}

// ---- The tab ------------------------------------------------------------------------
//
// Beside Equipment (main.html): R, View > Scrollr, or a click switches. The
// newest post is at the top; the tab counts the posts not yet seen.

function FeedOpen() {
  return !!document && $("#TabFeed").attr("aria-selected") == "true";
}

// on: true for Scrollr, false for Equipment, undefined to switch
function ToggleFeed(on) {
  if (!document) return;
  if (on === undefined) on = !FeedOpen();
  if (on) {
    // the same size as what it replaces, so nothing jumps
    var h = $("#GearPane").outerHeight();
    if (h > 40) $("#Feed").css("height", h + "px");
    if (typeof CompactLayout == "function" && CompactLayout() && $("#Panel-equipment").hasClass("collapsed"))
      SetPanel("equipment", false);
  }
  $("#GearPane").prop("hidden", on);
  $("#Feed").prop("hidden", !on);
  $("#TabGear").attr({ "aria-selected": String(!on), tabindex: on ? -1 : 0 });
  $("#TabFeed").attr({ "aria-selected": String(on), tabindex: on ? 0 : -1 });
  try { localStorage.setItem("pq.feedtab", on ? "1" : "0"); } catch (e) {}
  ShowFeed(true);
}

function SetUpFeed() {
  if (!document) return;
  $("#TabGear").on("click", function () { ToggleFeed(false); });
  $("#TabFeed").on("click", function () { ToggleFeed(true); });
  // arrow keys between the tabs, as tabs do
  $(".feed-tabs").on("keydown", function (e) {
    if (e.key != "ArrowLeft" && e.key != "ArrowRight" && e.key != "Home" && e.key != "End") return;
    e.preventDefault();
    e.stopPropagation();
    ToggleFeed(e.key == "Home" ? false : e.key == "End" ? true : !FeedOpen());
    $(FeedOpen() ? "#TabFeed" : "#TabGear").trigger("focus");
  });
  var was = null;
  try { was = localStorage.getItem("pq.feedtab"); } catch (e) {}
  if (was == "1") ToggleFeed(true);
}

// "4h ago", in game time
function FeedAge(seconds) {
  if (seconds < 60) return "just now";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h";
  return Math.floor(seconds / 86400) + "d";
}

var _feedShown = null;
function ShowFeed(force) {
  if (!document) return;
  var n = game.feedN || 0, open = FeedOpen();
  if (open) game.feedSeen = n;
  var unseen = n - (game.feedSeen || 0);
  $("#FeedNew").text(unseen > 0 ? "(" + (unseen > 99 ? "99+" : unseen) + ")" : "")
    .attr("aria-label", unseen > 0 ? unseen + " new" : null);
  var key = (game.lifeId || "") + ":" + n;
  if (!open || (!force && _feedShown === key)) return;
  _feedShown = key;
  var box = $("#Feed").empty(), now = game.elapsed || 0, feed = game.feed || [];
  if (!feed.length) {
    box.append($("<div class='feed-empty'>").text("Nothing yet. Sir Spreddit is warming up his bell."));
    return;
  }
  var frag = document.createDocumentFragment();
  for (var i = feed.length - 1; i >= 0; --i) {
    var p = feed[i];
    var post = $("<article class='post'>").addClass("post-" + (p.w == "$" ? "merchant" : p.w));
    $("<div class='post-head'>")
      .append($("<span class='post-icon' aria-hidden='true'>").text(K.GossipIcons[p.w] || K.GossipIcons.t))
      .append($("<b>").text(p.b))
      .append($("<span class='post-sub'>").text(" " + p.s + " · " + FeedAge(now - p.t)))
      .appendTo(post);
    $("<div class='post-text'>").text(p.x).appendTo(post);
    if (p.r) {
      var c = p.r.indexOf(": ");
      $("<div class='post-reply'>").append($("<b>").text(p.r.slice(0, c)))
        .append(document.createTextNode(p.r.slice(c))).appendTo(post);
    }
    $("<div class='post-foot'>").text("♥ " + p.l.toLocaleString()).appendTo(post);
    frag.appendChild(post[0]);
  }
  box[0].appendChild(frag);
}
