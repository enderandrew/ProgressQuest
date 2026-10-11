// Scrollr: the realm's social feed, a tab beside Equipment.
//
// Sir Spreddit, the town crier of the whole realm, posts the big news to
// s/all; his assistant criers, the Sub-Spreddits, post the local news of
// the kingdom of the current Act to s/<kingdom>. Everyone else posts too:
// the monsters complain about the hero, the quest givers get passive-
// aggressive, the merchants brag about their markup, your rival
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
// or 'rival' (yours, K.Rival in story.js: {rival}, {rival-full},
// {rival-level}; {nemesis} is them too). The lines can say {hero}, {race} and {klass}
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
	"I hope {hero} gets eaten by an {elite}.",
	"I am posting this on my main account. {hero} can get bent.",
    "Petition to ban {race} heroes from the Killing Fields™. Sign below.",
    "Imagine having a whole kingdom to explore and choosing our back garden.",
    "Reminder that the Killing Fields™ is a trademark and {hero} has not paid a licensing fee.",
	"Just because we are called the Killing Fields™ does not mean {hero} has to show up to kill.",
    "Moving to {kingdom2}. Heard the heroes there have quests that aren't us.",
    "{hero}'s {weapon} has a body count and frankly it should be in their bio.",
	"{hero}'s {weapon} has been in so many strange monsters, it may need a trip to the clinic.",
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
	"{race} {klass} is an OP build. The devs should do something. That is the only reason I lost.",
    "Hot take: {hero} only won because of the dice.",
    "Ratio'd by {hero}. Again.",
    "Is it 'grinding' if I'm the one getting ground? Asking for a friend. The friend is me.",
    "Back from the dead with a hot take: {hero} smells.",
	"Back from the dead with another hot take: Old Bastard™ was right to taunt {hero}.",
	"{hero} aska AITA? Yes, yes you are.",
    "Got killed in {rounds}. I want a recount.",
    "{hero} hit me with {spell}. Who even learns {spell}?",
    "Can't believe I died to someone whose best gear is {gear}.",
    "Not me getting one-shot on my first day out of the spawning pool.",
    "{hero} looted me and left the body out in the sun. Unbelievable.",
    "Every time {hero} levels up I get a little bit more dead. Coincidence or conspiracy?",
    "Reporting {hero} for griefing. Report status: ignored. Spreddit mods are the worst.",
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
	"He bravely turned his tail and fled. Yes, brave Sir {hero} turned about and gallantly he chickened out.",
    "Chased off a level {level} {klass}. Not bad for {a-foe}.",
    "{hero} remembered an appointment the second I showed up. Sure, Jan.",
	"{hero} and I were supposed to fight to the death and they ghosted me.",
	"{hero} saw {a-foe} and noped right out of there.",
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
	"I know {hero} didn't think they could beef with me. {foe} don't play.",
    "Took {hero}'s pocket money. Buying myself something nice. A bigger lair.",
    "{hero} is level {level} and lost to {a-foe}. Let that sink in.",
	"{hero} should post in s/AskSpreddit how do I not get my ass beat down?",
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
	"{hero} spent ages writing a thoughtful journal update, and no time on {quest}.",
    "Is it too much to ask a hero to {quest}? Apparently yes.",
    "Leaving this here for no reason: {quest}. Anyway.",
    "Tagging {hero} in this. They know what they did. They know what they didn't do: {quest}",
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
    "Thanks, {hero}! Already thinking of another little errand. Nothing big. It's a dragon. Don't get eaten.",
	"I bet {guy} that {hero} would fail my quest. I lost the bet, but they managed to {done}. I will take it.",
    "{hero} came back with exactly what I asked for, plus some viscera. Five stars, minus one for the viscera.",
    "Promoting {hero} from 'that hero' to 'my hero'. Don't get used to it.",
    "Leaving {hero} 3 out of 5 stars on TaskOgre. Managed to {done}, but stood completely motionless staring into the void for twenty minutes first.",
    "{hero} successfully managed to {done}! Delivery was fast, but they tracked muddy monster gore across my porch. Tip revoked.",
    "A bit aggressive for an errand boy, but {hero} got the job done. 4 stars. Deducted 1 star because their {gear} smells like hot wet cabbage.",
    "Can confirm {hero} delivered. Would hire again, assuming the Kingdom of {kingdom} ever cleans up the trail of destruction.",
    "Driver arrived smelling like ozone, brandishing {weapon}, and screaming about the Old Bastard™. But they did {done}. Recommend!",
    "So {hero} actually managed to {done}. Great. Now what am I supposed to complain about on Spreddit all afternoon?",
    "Shoutout to {hero} for finishing the job! Please ignore the active bounties posted by the city watch in {kingdom}, that's between you and them.",
    "Honestly shocked {hero} survived long enough to {done}. I had already rented out their camp spot and drafted an obituary.",
    "Thanks to {hero} for completing the errand! To everyone who placed bets with {guy} that they'd wipe: pay up.",
    "Big thanks to {hero}. I'd offer you a celebratory drink, but you already look like you're sprinting toward another loading bar.",
    "Never in my wildest dreams did I expect a {race} {klass} to {done}, but miracles happen when you underpay subcontractors.",
    "Watching an ostensibly {alignment} adventurer {done} was a wild ride of questionable ethics and needless violence.",
    "Props to {hero}! I didn't think swinging {weapon} at wild critters would solve the problem, but apparently violence really is the answer.",
    "A round of applause for {hero}. Watching a {klass} navigate basic social interactions is always painful, but the errand is complete.",
    "My faith in the people of {kingdom} is restored! Well, not people—{hero} is a {race}—but the general sentiment stands.",
    "Huge thanks to {hero} for agreeing to {done}! Your payment has been deposited into escrow and will clear in 6 to 8 business weeks.",
    "Paid {hero} minimum wage to {done}. The Labor Guild in {kingdom} is threatening to strike, but a deal's a deal.",
    "Task complete! {hero} asked for a living wage; I gave them a participation title and an overdue receipt for {boring}.",
    "Shoutout to {hero} for handling that. I would have done it myself, but stepping outside my front door lowers my property value.",
	"{hero} maanged to {done} in the most convoluted, murder-hobo way. But they got it done!",
    "Completed in record time! Mostly because I told {hero} that {nemesis} was headed this way to take the credit."
  ] },

  // After a splurge (K.Sinks in events.js): the seller's side
  markup: { who: 'merchant', lines: [
    "Just sold {thing} to {hero} for {gold} gold. My cost: farthings. Business is booming.",
    "Shoutout to {hero} for funding my summer home. Enjoy {thing}!",
    "Markup? I prefer 'artisanal pricing'. {hero} understood. {hero} paid {gold}.",
    "{hero} didn't haggle. Not even a little. I'm framing the receipt.",
	"Some influencers expect free stuff. I do the opposite and charged {hero} double.",
    "Raised all my prices the moment {hero} walked in. They didn't notice.",
    "Today's lesson in economics: {hero} had {gold} gold. Now I do.",
    "If {hero} asks, {thing} has always cost {gold} gold. Always.",
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
    "This just in from {where}: “{event}”. More at eleven. There is no eleven. We can't count that high.",
    "BREAKING out of {where}: “{event}”. The city watch in {kingdom} advises citizens to stay inside and pretend not to notice.",
    "Kingdom sheriff blotter from {where}: “{event}”. Officers arrived, saw {hero} swinging {weapon}, and immediately took an early lunch.",
    "Scanner audio leaked from {where}: “{event}”. Suspect is described as an unhinged {race} {klass} ignoring municipal ordinances.",
    "Developing story in {where}: “{event}”. The damage has been appraised at three coppers and severe emotional distress.",
    "Live dispatch from {where}: “{event}”. Local authorities are treating the area as an active hazard zone.",
    "You won’t BELIEVE what just went down at {where}: “{event}”. Alchemists hate this one weird trick!",
    "Top 10 reasons why “{event}” happened in {where}—number 4 will make your cleric cry!",
    "Bystanders in {where} captured exclusive sketches of “{event}”. Tap the parchment to subscribe for premium gossip.",
    "Did {hero} take it too far with “{event}”? The court of public opinion says absolutely yes.",
    "Is {where} cursed? After “{event}”, local property values in {kingdom} have officially dropped by 40%.",
    "Trending on s/{kingdom}: “{event}”. The mods have locked the thread due to excessive arguing.",
    "Megathread: The situation at {where} (“{event}”). Sort by controversial to see the hot takes.",
    "Post removed by moderators: “{event}”. Reason: duplicate rant about {hero}.",
    "Downvoted into oblivion on Spreddit today: anyone defending {hero} after “{event}”.",
    "A leaked memo from the town crier’s guild discusses “{event}”. The comments are a dung-heap fire.",
    "Community Alert for {where}: “{event}”. If you see {hero}, avoid direct eye contact and do not offer snacks.",
    "Can whoever is responsible for “{event}” at {where} please come collect their trash? Thanks, Town Management.",
    "Interview with a local farmer: “I was minding my own turnip patch near {where}, then bam: ‘{event}’.” Inspiring journalism.",
    "Eye-witnesses near {where} claim {hero} provoked the whole thing: “{event}”. The defense pleads total indifference.",
    "Public works notice: The road through {where} is temporarily blocked due to “{event}”. Expect detours into monster nests.",
    "Official statement from {kingdom} regarding “{event}”: 'We are aware of {hero}, and we are deeply, profoundly tired.'",
    "When questioned about “{event}”, the royal magistrate sighed heavily, looked at the floor, and resigned on the spot.",
    "The spokesperson for {where} refused to address “{event}”, citing an ongoing existential crisis.",
    "We reached out to the victims of “{event}”. They said: 'Tell {hero} to stay out of our tavern forever.'",
    "Nobody was injured during “{event}”, with the exception of local dignity and several bystanders' hearing."
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
    "Respect to {hero} for “{choice}”. Disrespect to everyone saying otherwise.",
    "Wait, did {hero} just actually push a button? In THIS economy? They chose “{choice}”.",
    "Imagine possessing free will and using it to select “{choice}”. Couldn't be me.",
    "A level {level} {klass} picking “{choice}” is peak interactive cinema.",
    "The sheer unearned confidence of {hero} locking in “{choice}” is breathtaking.",
    "Did {hero}'s hand slip, or was “{choice}” genuinely an intentional tactical maneuver?",
    "Local {race} achieves consciousness, immediately selects “{choice}”. Tragic.",
    "Speedrunners in absolute shambles after {hero} lost frame advantage picking “{choice}”.",
    "Unpopular opinion: Picking “{choice}” is literally griefing. Debate me in the replies.",
    "Tier list update: “{choice}” drops straight into F-tier. What was {hero} cooking?",
    "Ratio + L + didn't ask + {hero} chose “{choice}”.",
    "Every armchair strategist on s/all is currently furious that {hero} picked “{choice}”.",
    "My favorite genre of comedy is {hero} thinking “{choice}” was a galaxy-brain play.",
    "The live chat is melting down because {hero} picked “{choice}” over the meta option.",
    "Downvoted into oblivion: anyone defending {hero}'s decision to go with “{choice}”.",
    "Alignment check: claiming to be {alignment} while picking “{choice}” is deeply suspicious.",
    "As an ostensibly {alignment} hero, picking “{choice}” is certainly... a statement.",
    "The bards in {kingdom} are already composing a ballad about how terrible “{choice}” was.",
    "I hope {hero} knows that selecting “{choice}” just voided their adventurer warranty.",
    "{nemesis} just posted three laughing skull emojis in response to {hero} choosing “{choice}”."
  ] },

  // ...and one fate answered
  fate: { who: 'spreddit', lines: [
    "{hero} couldn't decide, so fate picked “{choice}”. Relatable.",
    "{hero} stood there for {seconds} seconds. Fate got bored and chose “{choice}”.",
    "Fate chose “{choice}” for {hero}. Nobody asked fate. Fate doesn't care.",
    "Indecision of the year goes to {hero}. Fate went with “{choice}”.",
    "Is {hero} AFK? Asking because fate just chose “{choice}” for them.",
    "Left on read by {hero}, fate picked “{choice}”. We stan a decisive universe.",
    "No thoughts, head empty: {hero} let fate pick “{choice}”.",
    "{hero} stared blankly into the middle distance for {seconds}s until the RNG gods sighed and picked “{choice}”.",
    "Peak idle gaming: {hero} couldn't even be bothered to click, so the cosmos auto-locked “{choice}”.",
    "Did {hero} fall asleep at the wheel again? Fate just took the reins and drove straight into “{choice}”.",
    "{hero} stepped away to microwave a burrito and the universe chose “{choice}” for them. They should have chosen something better than a microwave burrito.",
    "Forty percent of this heroic saga is {hero} disassociating while Fate picks “{choice}”.",
    "{hero} waited out the full {seconds}-second timer like a true afk connoisseur. Fate chose “{choice}”.",
    "Why bother with agency when the algorithm will gladly select “{choice}” while you look at memes?",
    "The timer hit zero. Fate rolled its metaphorical eyes and defaulted to “{choice}”.",
    "Server load spiked as {hero} spent {seconds} full seconds buffering before Fate intervened with “{choice}”.",
    "Catatonic paralysis strikes our {race} {klass} once again. Automated destiny protocol selects: “{choice}”.",
    "Imagine getting out-thought by a {seconds}-second countdown timer. Fate went with “{choice}”.",
    "Fate took the wheel, realized this is Progress Quest, and casually picked “{choice}”.",
    "The illusion of free will completely shattered in {seconds} seconds. Welcome to “{choice}”.",
    "Not {hero} getting hard-carried by pseudo-random number generation! Fate locked in “{choice}”."
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
    "Sir Spreddit's Heroes to Watch, number two: {hero}, level {level}. Number one: {nemesis}",
    "A level {level} hero walks into a tavern. It's {hero}. That's the post.",
    "{hero} at level {level}: still no idea what CHA does.",
    "Hearing reports that {hero} reached level {level} while not paying attention. Typical.",
    "Level {level}! {hero}'s journal entry for today reportedly just says 'nice'.",
    "DING! {hero} hits level {level}. A moment of silence for the player's browser RAM and laptop cooling fan.",
    "{hero} achieved level {level} without pressing a single combat key. Truly, peak interactive gameplay.",
    "Word has it {hero} dinged level {level} while the player was microwaving a burrito. We salute your lack of effort.",
    "Unpopular opinion: {hero} didn't 'earn' level {level}. The progress bars carried them the entire way.",
    "Imagine achieving level {level} while tabbed out looking at cat memes. Consciousness is officially obsolete.",
    "{hero} is now level {level}. They spent approximately zero seconds actually making a decision to get here.",
    "Spreddit Megathread: {hero} dings level {level}. Sort by controversial to see backseat gamers malding.",
    "BREAKING: {hero} reaches level {level}. {nemesis} just posted 'level doesn't equal skill' and immediately muted replies.",
    "Clout check: {hero} has hit level {level}. Expect an unboxing video of their new stat points shortly.",
    "Ratio + L + nobody asked + {hero} just dinged level {level}.",
    "Sir Spreddit trending topic: How did {a-klass} like {hero} reach level {level} with literally zero mechanical skill?",
    "Tier list update: {hero} jumps up a tier after reaching level {level}. The comments are a dung-heap fire.",
    "Level {level}! {hero} celebrated by wearing {gear} that looks like an explosion in a scrap metal depot.",
    "At level {level}, {hero} is still swinging {weapon} like a caffeinated toddler. But hey, big numbers go up.",
    "{hero} reaches level {level} with {wins} victories and a {weapon} held together entirely by duct tape.",
    "Fashion disaster alert: {hero} hits level {level} draped in {gear}. Looking good is clearly not a class skill.",
    "Level {level}! They still yell {spell} at low-tier woodland creatures just to show off.",
	"Level {level}! I wonder what level {nemesis} is at.",
    "At level {level}, {hero} has died {deaths} times. That isn't an adventurer; that's a recurring temple billing notice.",
    "Level {level} achieved! A moment of prayer for the local wildlife of {kingdom}, who have suffered an extinction-level event.",
    "Local {race} achieves level {level}. The regional monster union in {kingdom} is filing an official grievance.",
    "Congrats to {hero} on level {level}! For someone claiming to be {alignment}, the trail of destruction is deeply concerning.",
    "Level {level} reached! That's {level} arbitrary tiers closer to the Old Bastard™, assuming anyone remembers why we're doing this.",
    "Guards across {kingdom} spot a level {level} {race} approaching and suddenly announce their early retirement."
  ] },

  // A named elite (K.Elite) falls...
  eliteWon: { who: 'spreddit', lines: [
    "BREAKING: {elite} has fallen to {hero}. The title is up for grabs. Applications close never.",
    "{hero} took down {elite}. The Codex has been updated. Sorry, {elite}'s fans.",
    "RIP {elite}. Slain by {hero}, robbed of {item}. Thoughts with the family.",
    "End of an era: {elite}. Start of an era: {hero} wearing {item}.",
    "{elite} has fallen to {hero} but {nemesis} is not impressed.",
    "{elite} had a name, a title and a following. Now has none of those. Thanks, {hero}.",
    "L + ratio + {elite} fell off + {hero} took your {item}.",
    "Imagine having a custom title and a golden nameplate just to get clapped by a {race} {klass}.",
    "The official sub-spreddit for {elite} has been locked and set to private following their sudden demise.",
    "Watching {hero} cheese {elite} with {weapon} was disgusting. Meta is officially ruined.",
    "Down goes {elite}! Wiki editors in {kingdom} are scrambling to update the page to past tense.",
    "{nemesis} just posted: 'Honestly, {elite} was always B-tier anyway. Talk to me when they beat a real boss.'",
    "Unboxing {item} looted directly off {elite}'s warm corpse! Drop a like and subscribe for more grave robbery.",
    "Shoutout to {hero} for turning {elite} into paste. Rumor has it {item} is already listed on Ye Olde eBay.",
    "Pour one out for {elite}. Lost their life, their reputation, and their signature {item} in under four minutes.",
    "{hero} just strutted into town wearing {item}. You can literally still see {elite}'s monogram on the clasp.",
    "A moment of silence for {elite}. They had an elaborate five-phase attack rotation, but {hero} had automated scripts.",
    "The regional {kind} union has declared a day of mourning for {elite}. {hero} remains violently unapologetic.",
    "{elite} spent three hundred years cultivating an aura of dread just to become an entry in {hero}'s kill feed.",
    "Reports confirm {elite} is down. Local bards are already rushing out a rushed, poorly rhymed cash-grab ballad."
  ] },

  // ...or doesn't
  eliteHeld: { who: 'elite', lines: [
    "Just handled {hero}. Didn't even need my title for it.",
    "{hero} thought they could take on {elite}? I AM {elite}.",
    "Add {hero} to the list. It's a long list. It's a list of heroes I've beaten.",
    "Tell your hero friends: {elite} is open for business. The business is beating {hero}.",
    "I smacked down {hero}. I wasn't scared. It wasn't like I was facing {nemesis}.",
    "{hero} ran. They always run. Anyway, follow for more {kind} content.",
    "LMAO {hero} really rolled up in {gear} thinking they were the main character. Sit down.",
    "You call that a weapon? I've been scratched harder by aggressive shrubbery. Better luck next time, {hero}.",
    "Don't bring that weak-ass {spell} into my boss arena ever again. Embarrassing.",
    "Imagine hiking all the way to my lair just to whiff your opening strike with {weapon} and eat dirt.",
    "{hero} showed up with negative combat awareness and left with a fresh concussion. 10/10 encounter.",
    "New reel dropped: 'Watching {hero} realize they're completely outmatched.' Link in bio, fellow {monsters}!",
    "Easy clout. {hero} didn't even drop decent pocket change, let alone challenge my reign.",
    "Hero of prophecy? More like light cardio. Come back when you're level {next}, {hero}.",
    "Vibe check failed. {hero} has been returned to the nearest temple clinic in a pine box.",
    "Thanks for the free engagement, {hero}! Your fans in {kingdom} are already unfollowing you.",
    "Did {hero}'s player fall asleep at the keyboard? That was the easiest title defense of my career.",
    "{hero} dropped combat and sprinted toward the zone line like an Olympic track star. Classic {klass} move.",
    "Left {hero} bleeding out in a ditch. Tell the temple priests to keep their loyalty punch card handy.",
    "Next time you challenge {elite}, maybe look at the screen while it's happening.",
    "{hero} left their dignity behind on the battlefield. Don't worry, nobody's picking it up."
  ] },

  // An Act over
  act: { who: 'spreddit', lines: [
    "{hero} wraps up {act}. Critics call it 'derivative'. Audiences call it 'over'.",
    "{hero} finished {act}. But apparently there wasn't a post-credits scene. I waited when I had to pee.",
    "And that's {act} done. The next chapter promises 'more of the same, but harder'.",
    "{act}: complete. {hero} would like to thank nobody in particular.",
    "Spoilers for {act} below. {hero} won. That's the spoiler.",
    "The end of {act}. The bards are already working on the sequel. It's the same song.",
    "{hero} finishes {act}. {kingdom} breathes a sigh of relief, then a sigh of 'oh no, there's more'.",
    "Just finished {act}, starring {hero}. Four stars. Too much grinding in the middle.",
    "{act} is over. {nemesis} has been reached for comment and is unavailable, for reasons.",
    "Plot development: {hero} has developed some plot. Act over. Next!",
    "{act} was alright but I hope we see more of {nemesis} in the sequel!",
    "And so ends {act}. Fans debate whether {hero} grew as a character. They did. Mostly in HP.",
    "Rotten Turnips score for {act}: 22% Critics, 98% bots leaving five-star reviews.",
    "{act} finale review: Pacing dragged for {wins} fights, climax resolved via loading bar, protagonist learned nothing.",
    "Can't believe {hero} stretched {act} across three seasons. The whole thing could have been an email. {nemesis} really carried the story.",
    "The season finale of {act} left more questions than answers. Mainly: why did {hero} spend three hours hitting bats?",
    "The showrunners really phoned in the ending of {act}. They literally just added a zero to the enemies' health bars.",
    "Mid-season finale vibes: {hero} completes {act}. The studio has already renewed the series for forty more filler episodes.",
    "A standing ovation for {hero} wrapping up {act}! Mostly standing because everyone's legs fell asleep hours ago.",
    "Did {hero} undergo an emotional arc during {act}? No, but their {weapon} is sharper and their conscience is completely gone.",
    "The thematic depth of {act} was incredible, assuming you ignore the plot, dialogue, and basic narrative logic.",
    "{act} concludes! Our ostensibly {alignment} protagonist leaves {kingdom} in noticeably worse economic shape than they found it.",
    "Character arc summary for {act}: {hero} entered as a ragged hobo and exited as a level {level} menace to society.",
    "As {act} draws to a close, {hero} stares stoically into the distance, wondering if the Old Bastard™ actually exists.",
    "{hero} wraps up {act} without a single line of spoken dialogue. Truly, the silent protagonist we deserve.",
	"Plot hole! Lazy writers! I thought {hero} was supposed to be {alignment}! {nemesis} is a better written character.",
    "What a cliffhanger for {act}! Tune in next chapter to see {hero} swing {weapon} at palette-swapped goblins.",
    "Studio executives announce the sequel to {act} will be split into two separate parts for maximum ad revenue.",
    "{act} ends on a massive cliffhanger: Will the next Act have slightly longer progress bars? (Spoiler: yes).",
    "{nemesis} didn't play a big enough part in {act}. Clearly holding out for a bigger payday in the sequel.",
    "Farewell to {kingdom}! The locals threw {hero} a massive parade to celebrate them finally leaving the province.",
    "The credits for {act} are just a list of the {wins} woodland creatures slaughtered along the way.",
    "Breaking: {hero} completed {act} while the player was asleep on the couch. Peak interactive cinema.",
    "Imagine wrapping up an entire Act while minimized behind an Excel spreadsheet. True art happens in background tabs.",
    "Credit roll on {act}! Shoutout to the browser process for not crashing during that entire twenty-hour montage.",
    "{act} has concluded. The audience celebrated by clicking absolutely nothing, because there is nothing to click."
  ] },

finaleWon: { who: 'spreddit', lines: [
    "IT HAPPENED. The Old Bastard™ is down. {hero} did it. Sir Spreddit is crying. Sir Spreddit is fine.",
    "Realm-wide holiday declared: {hero} has beaten the Old Bastard™. The monsters are drafting a statement.",
    "{hero} beat the Old Bastard™? I thought for sure {nemesis} was going to beat them to it!",
    "{hero} is victorious! I bet {nemesis} is furious, but I guess they can suck it.",
    "{hero} has beaten the Old Bastard™! Some are calling it justice. Others are calling it Elder Abuse.",
    "Everyone will remember where they were when {hero} beat the Old Bastard™. Mostly: the Killing Fields™.",
    "BREAKING: The Old Bastard™ has been officially canceled. {hero} delivered the final blow with {weapon}.",
    "The Old Bastard™ is dead! {nemesis} just posted a 40-tweet thread explaining why it doesn't count.",
    "L + ratio + no retirement plan + {hero} just ended the Old Bastard™'s whole career.",
    "Is it really a triumph if {hero} spent {wins} fights on autopilot? Yes. Cry about it in the replies.",
    "The bards are furiously scrubbing all their 'Old Bastard Will Rule Forever' drafts from the archives.",
    "Sir Spreddit exclusive: We asked {hero} for a victory speech. They just stared into the void as a progress bar reset.",
    "He whispered 'Thou fool' in the prologue. Who's the fool now? Still us, for leaving this tab open for days.",
    "The credits are rolling! You can finally close the browser tab. Just kidding, do not close the tab. We will cease to exist.",
    "The Old Bastard™ dropped zero meaningful loot. Perfection. Peak idle gaming to the very end.",
    "Local {race} {klass} achieves revenge for a dream insult that occurred dozens of levels ago. Healthy coping mechanism.",
    "Prophecy fulfilled: {hero} stood motionless in front of an elderly menace until victory mathematics occurred.",
	"Did {hero} save {kingdom}? No, the avenged an imagined taunt in a dream sequence. Still, they will get a statue.",
    "Kingdom-wide petition in {kingdom} to build a bronze statue of {hero} clobbering the Old Bastard™ with {weapon}."
  ] },

  finaleLost: { who: 'spreddit', lines: [
    "The Old Bastard™ has beaten {hero}. 'Not today,' he said. 'Maybe tomorrow. I'm old.'",
    "Tough loss for {hero} against the Old Bastard™. The Sub-Spreddits are 'devastated' and 'not surprised'.",
    "The Old Bastard™ 1, {hero} 0. Rematch pending. Tickets selling fast.",
    "Imagine grinding all the way to level {level} just to get folded like cheap laundry by an octogenarian.",
    "The Old Bastard™ didn't even take off his reading glasses before wiping {hero} off the face of the map.",
    "{hero} rolled up in {gear} and got styled on by a man who complains about drafts and takes 3 PM naps.",
    "Live footage of {hero} getting clapped by a guy who remembers when the Killing Fields™ were just an unpaved road.",
    "{hero} shouted {spell} with righteous fury. The Old Bastard™ turned down his hearing trumpet and struck back.",
    "Sub-Spreddit poll: Was {hero}'s defeat a gear check or a massive skill issue? 99% vote skill issue.",
    "{nemesis} just quote-tweeted {hero}'s wipe with three laughing skull emojis and 'Couldn't be me.'",
    "Reports confirm {hero} took a dirt nap. The Old Bastard™ celebrated by drinking warm milk and going to bed.",
    "Don't worry {hero}, second place is just first loser. {nemesis} is already booking the arena for tomorrow.",
    "The Old Bastard™ remains undefeated. The medical clinic in {kingdom} is prepping the defibrillator again.",
    "A catastrophic wipe for {hero}. Somewhere, the player is returning from the kitchen with a sandwich to utter despair."
  ] },

  death: { who: 'spreddit', lines: [
    "We are sad to report that {hero} has died. Cause: {cause}. Flowers may be left at the Killing Fields™, which is ironic.",
    "RIP {hero}, level {level} {klass}. Gone too soon. Well, about on time, for a hero.",
    "{hero} failed but there is still hope {nemesis} will succeed.",
    "{hero} has fallen. The monsters have changed their profile pictures. Respect.",
	"Oh Death, where is thy sting? There it is. It sure stings.",
    "Press F in the chat. {hero} just got completely deleted by {cause}.",
    "Cause of death: {cause}. The coroner in {kingdom} called it 'a tragic lack of basic situational awareness.'",
    "{hero} died to {cause}? LMAO. The comments section is having an absolute field day.",
    "RIP {hero}. Died doing what they loved: standing directly in front of incoming damage while you looked at memes.",
    "{nemesis} just dropped a brutal diss track celebrating {hero}'s sudden and humiliating demise to {cause}.",
    "Skill issue detected. {hero} fell to {cause} despite wearing supposedly top-tier {gear}.",
    "Death tally: {deaths}. The temple resurrection acolytes are putting a new addition on their villa tonight.",
    "Imagine surviving {wins} fights only to get folded like an origami crane by {cause}. Poetic justice.",
    "Local {race} {klass} perishes to {cause}. The regional wildlife has declared an impromptu holiday.",
    "Funeral arrangements for {hero} are postponed because their corpse is currently stuck in ragdoll physics.",
    "Cause of death: {cause}. That's going to look hilarious on the memorial headstone.",
	"First Harambe dies and now {hero}. I just can't take it.",
	"They say celebrites die in threes. First {guy} and now {hero}. Who will be the third?",
    "{hero} has left the chat. {cause} sends its warmest regards."
  ] },

  // The local news, at market
  town: { who: 'crier', lines: [
    "Local goat elected to the town council of {kingdom}. Council says it's 'an improvement'.",
    "Reminder: the well in {kingdom} is NOT a dung heap. Stop throwing dung in. We drink out of there.",
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
    "Incel commenters are getting their water from a well, actually...",
    "{kingdom} will be the first in the realm to get a judgemental triple well. It is called a 'Well, well, well...'",
    "The {kingdom} guard is hiring. Requirements: a pulse, and a pointy stick. Pointy stick optional.",
    "Fashion in {kingdom} this season: muddy. Next season: also muddy.",
    "In {kingdom} the sheep outnumber people. The sheep also outsmart the people.",
    "{kingdom} declares itself 'the friendliest town in the realm'. Anyone who disagrees is forced to leave.",
    "The town council in {kingdom} has voted to ban rain on Thursdays. The rain has ignored the injunction.",
    "Town zoning update: The evil necromancer's obsidian citadel has been cited for an unpermitted back patio.",
    "The town magistrate reminds citizens that screaming into the market fountain does not constitute paying taxes.",
    "The potholes on Main Street have banded together and formed an autonomous borough with their own mayor.",
    "Public health warning: The local apothecary's 'miracle healing potion' is just warm red wine and well water.",
    "Town survey results: 82% of citizens in {kingdom} believe the town crier shouts too much. The crier will shout louder.",
    "The {kingdom} sanitation board begs adventurers to stop selling the general store 400 severed goblin ears at once.",
    "The city gates are closed today for routine scrubbing. Yesterday's blood spatter was deemed 'excessive'.",
    "Noise complaint filed against {hero} for shouting {spell} at 3:00 AM while staring blankly at a brick wall.",
    "A local {race-one} was caught trying to pickpocket {hero}. The thief's funeral will be held on Tuesday.",
    "Neighbor dispute in {kingdom}: {guy} claims his neighbor's gargoyle is shedding on his rosebushes again.",
    "Reminder from the {kingdom} HOA: severed monster heads mounted on lawn spikes must adhere to neutral earth tones.",
    "Town gossip: {guy} and {nemesis} were seen dining together at the tavern. Scandalous if true; boring if not.",
    "The tavern innkeeper has instituted a strict 'No Decapitations on the Dance Floor' policy after last night's mishap.",
    "Citizen alert: A suspicious {race} {klass} has been spotted standing completely motionless in the square for six hours.",
	"The {klass} guild might be banned from the town. They know what they did.",
	"The town's {race} population demands a seat on the town council, or at the very least a seat on the park bench.",
    "Market scam alert: A traveling peddler is selling invisible armor. Three nobles were arrested for public indecency.",
    "The local blacksmith in {kingdom} is having a nervous breakdown. He cannot melt down any more rusty butter knives.",
    "Inflation alert: The local currency collapsed this afternoon after {hero} dumped a wheelbarrow of loose coins at the bakery.",
    "Found outside the tavern: A cursed amulet that whispers horrible secrets about {guy}. The secrets are surprisingly petty.",
    "Lost: One Bag of Holding. If found, do NOT put another Bag of Holding inside it unless you hate linear space-time.",
    "Special offer at the flea market: Buy three broken wagon wheels, get one moldy turnip half-off.",
    "The mayor announces that being {alignment} is no longer an excuse for that kind of behavior.",
    "Tourism bureau announces {kingdom} is now 'The City of Mild Adventure'. High adventure was deemed too litigious.",
    "Public service warning: Do NOT make eye contact with quest givers unless you want to spend a week fetching roots.",
    "The local guild of bards has officially gone on strike. Blessed, unbroken silence descends across the market square.",
    "Real estate in {kingdom}: Charming hovel overlooking the gallows. Low rent, only moderately cursed on full moons.",
    "Weather update for {kingdom}: Partly sunny with scattered squalls of demonic chanting from the cemetery.",
    "The town watch successfully chased off {a-foe}. By chased off, we mean they ran away in opposite directions."
  ] },

  // The realm's news, at rest
  realm: { who: 'spreddit', lines: [
    "Good morning, realm! Sir Spreddit here with your news. The news is: heroes.",
    "Sir Spreddit's word of the day: 'loot'. Use it in a sentence. Then go and get some.",
	"Sir Spreddit's word of the day: 'legs'. Thirsty ladies ready to spread the word for {nemesis}",
    "Reminder that the Old Bastard™ is still out there. Probably napping. He's old.",
    "Trending in the realm: #KillingFields, #{hero}, #WhereIsMyQuest.",
    "Sir Spreddit has been told he's 'just a guy with a bell'. Sir Spreddit has a very nice bell.",
    "Scrollr's terms of service have been updated. Nobody read them. Nobody ever reads them.",
    "Ask Sir Spreddit: 'Is it normal for a {race-one} to look like that?' Sadly, yes. Next question.",
    "Weekly reminder that every hero's journal is private. Sir Spreddit has read all of them.",
    "Sir Spreddit is taking a short break from the realm. Back in five minutes. Back now.",
    "Followers: up. Kingdom morale: steady. Bell: shiny. Sir Spreddit: thriving.",
    "The Sub-Spreddits report: {kingdom} is fine, {kingdom2} is on fire, and nobody can find the third one.",
    "Today's forecast for the realm: a hero will find something in a monster that shouldn't have been in a monster.",
    "Sir Spreddit reminds all heroes to stay hydrated, and to stop looting bodies in public.",
    "Unpopular opinion: the Killing Fields™ could use some benches and a nice shrubbery.",
    "Shoutout to the quest givers of the realm. Without you, heroes would have to think of things to do.",
    "Sir Spreddit fact-check: no, {a-klass} can't do that. Yes, {hero} did it anyway.",
    "A reader asks: 'Why are there so many monsters?' Because heroes need something to do between quests.",
    "This post was sponsored by DungeonCoin. Sir Spreddit regrets everything.",
    "Sir Spreddit is officially verified on Scrollr. The blue wax seal cost {gold} gold. Worth every copper.",
    "Don't forget to ring the town bell, smash that upvote rune, and leave a comment roasting {hero}'s fashion.",
    "Algorithm tip: post an inflammatory hot take about {a-klass} balancing, then mute notifications for six hours.",
    "Sir Spreddit apology dispatch: 'I made a severe and continuous lapse in judgment by assuming {hero} had charisma.'",
    "PSA: If someone in {kingdom} tries to sell you an online seminar on 'Passive Income via Goblin Spleens', it's a pyramid scheme.",
    "Sir Spreddit's follower count just hit six figures. To celebrate, I will ring the bell twice as loud at dawn.",
    "New brand partnership: Sir Spreddit is proud to endorse artisanal health potions. They taste like battery acid, but the check cleared.",
	"Sir Spreddit's bell is sponsored by Raid Shadow Legenda. Link in the description.",
    "Ask Sir Spreddit: 'Can I defeat {nemesis} with the power of friendship?' No. Use {weapon}. Next question.",
    "Ask Sir Spreddit: 'Is my {gear} supposed to make a wet whistling sound?' Absolutely not. Seek an alchemist immediately.",
    "A concerned parent writes: 'My child wants to multiclass into {a-klass}.' Sir Spreddit recommends military academy.",
    "Ask Sir Spreddit: 'Why does the Old Bastard™ hate me?' Have you taken a good look at yourself, {hero}? We understand his perspective.",
    "Sir Spreddit life advice: If a floating yellow exclamation mark hovers over an elderly peasant's head, cross the street immediately.",
    "Mailbag query: 'What happens when a hero dies {deaths} times?' The temple acolytes put a down payment on a seaside villa.",
	"Mailbag query: 'Why is {nemesis} so much more popular than {hero}?",
    "Philosophical thought for today: If a progress bar fills in the Killing Fields™ and nobody tabbed in to see it, did it really count?",
    "Reports indicate several prominent adventurers across the realm have been standing completely catatonic in tavern corners. We call this 'immersion'.",
    "The realm-wide economy remains perfectly stable. By stable, we mean completely wrecked by {hero} dumping 400 rusted shortswords onto one merchant.",
    "Friendly reminder to all wandering vagrants: your entire life is stored in browser cache. Pray the user never clears their cookies.",
    "Realm-wide survey results: 99% of adventurers admit they have never once read the quest objective text. The writer weeps.",
    "Breaking news: Local {klass} discovers that waiting for a progress bar to fill requires literally zero cardiovascular conditioning.",
    "Weather report for the continent: overcast, with a 90% chance of random ambushes and a brisk tailwind of existential despair.",
    "The Grand High Council of {kingdom} reminds citizens that respawning is a privilege, not a constitutional right.",
    "A moment of silence for the realm's rodent population, which has suffered catastrophic demographic collapse at the hands of level 1 initiates.",
    "Travel advisory: The scenic highway between {kingdom} and {kingdom2} is currently closed because an adventurer dropped 50 pounds of cabbages in the road.",
    "Sir Spreddit investigative report: Where do woodland critters keep loose coins? We dispatched an intern to investigate. The intern has not returned.",
    "The Realm Bards' Collective has gone on strike. Any tavern songs mentioning {hero} will now incur a mandatory 15% public performance surcharge.",
    "Astronomers report a rare planetary alignment over {kingdom}. Astrologers predict it means 'more fetch quests, probably'."
  ] },

  // Your rival (K.Rival in story.js), once you've met: on the road, at rest
  taunt: { who: 'rival', lines: [
    "Just a reminder that I'm going to beat the Old Bastard™ first. Carry on, {hero}.",
    "Level {rival-level} and feeling great. How's level {level} treating you, {hero}?",
    "Some of us don't stop to sell viscera every five minutes. Just saying.",
    "Saw {hero} at the market buying {boring}. Couldn't be me.",
    "Same race, same class, same alignment. Different results. Thread.",
    "My Old Bastard™ strategy. Step one: get there before {hero}. There is no step two.",
    "{hero} copies everything I do. I was {a-klass} first. Look it up.",
    "Petty? Me? I just think {hero} should log off. Forever. That's all.",
    "Had a training montage today. {hero} doesn't have a training montage. Just saying.",
    "Took the long way round the Killing Fields™ so I could wave at {hero}. They didn't wave back. Rude.",
    "Every monster {hero} fights, I fought first. And faster. Probably.",
    "People keep calling me {hero}. I am NOT {hero}. I'm the one with taste.",
    "Imagine pulling up to the Killing Fields™ holding {weapon}. Did you find that in a dung-heap behind the tavern, {hero}?",
    "Nice {gear}, {hero}. Did it come with a tetanus shot, or do you have to buy that separately?",
    "I heard {hero} tried casting {spell} today. Even the low-tier swamp critters were secondhand embarrassed.",
    "Fashion disaster alert: {hero} is running around {kingdom} dressed like an explosion in a hardware surplus store.",
    "You call that an optimized build? My character sheet is a work of art; yours looks like a toddler sneezed ink onto parchment.",
    "Still swinging {weapon}? Cute vintage choice. Most of us upgraded past the stone age three acts ago.",
    "Checking in from level {rival-level}. Air is pretty crisp up here, {hero}.",
    "While {hero} was busy running in circles, I cleared three zones, farmed elite drops, and still had time for bottomless brunch.",
    "A sloth with a taped-on club progresses faster than {hero}. Just watching your XP bar fill is giving me gray hair.",
    "Imagine taking this long to hit level {level}. If I were moving that slow, I’d check myself into an apothecary.",
    "I'm already drafting my victory memoir while {hero} is still figuring out how basic pathfinding works.",
    "Don't speak to me unless your level starts with a higher digit than {hero}'s IQ.",
    "The clerics in {kingdom} literally named a new medical pavilion after {hero} to celebrate their {deaths} deaths. Generous patron!",
    "If wiping out were an Olympic sport, {hero} would be taking home gold every single season.",
    "Saw {hero}'s ragdoll physics after that last fight. Great form on the mid-air cartwheel, terrible form on actually surviving.",
    "{deaths} trips to the graveyard? At this point, {hero}, the undertaker should just offer you a roommate agreement.",
    "Skill issue detected on the main highway. Somebody tell {hero} that dodging attacks is technically allowed.",
    "I haven't died once today. {hero}, on the other hand, is single-handedly keeping the resurrection industry afloat.",
    "{hero}'s current quest: '{quest}'. Truly, the grand savior of the realm. Call me when you finish your household chores.",
    "Imagine calling yourself a legendary adventurer when 90% of your career is fetching lukewarm turnips for peasants.",
    "I don't need needy quest givers in {kingdom} holding my hand. Meanwhile, {hero} won't cross the street without a glowing compass.",
    "Heard {hero} spent three hours looking for a stolen ladle. The realm is definitely in safe hands.",
    "While {hero} does odd jobs for minimum wage, I'm out here actually stalking the Old Bastard™. Priorities.",
    "Just posted a 12-scroll unroll on Spreddit exposing {hero}'s fraudulent DPS numbers. Like, share, and subscribe.",
    "I told {guy} that {hero} was my unpaid intern. {guy} believed me without asking a single follow-up question.",
    "Blocking {hero} on Scrollr so I don't have to keep seeing their tragic combat logs cluttering up my algorithm.",
    "Unpopular opinion: {hero} only has followers because people enjoy watching slow-motion trainwrecks in real time.",
    "Ratio + L + fell off + {rival-level} is higher than {level} + your {weapon} has negative durability.",
	"{hero} wishes they had as many followers as me. We discuss it on the next episode of Behind the Bastards Podcast.",
    "I asked the bards why nobody writes ballads about {hero}. They said comedy songs don't pay the tavern rent."
  ] },

  // ...when you level up (and so do they)
  rivalLevel: { who: 'rival', lines: [
    "Level up! Still the better {klass}, whatever the numbers say.",
    "Hit level {rival-level} today. {hero} hit level {level}. Draw your own conclusions. I have.",
    "Oh, {hero} levelled up? Cute. Anyway, I'm level {rival-level}.",
    "Level {rival-level}. The Old Bastard™ can feel me coming.",
    "Every time I level up, {hero} levels up. It's uncanny. It's stalking. I'm reporting it.",
    "New level, new me. Still not {hero}. That's the main thing.",
    "{rival-level} levels of being better than {hero}. Well. About the same. But with more style.",
    "Level {rival-level}, and I didn't even need a henchman. Some of us are self-made.",
    "Notice how {hero} only ever dings right after I hit level {rival-level}? Dynamic rubber-banding at its absolute worst.",
    "Ding! Level {rival-level}. My stat gains were mathematically optimized; {hero}'s were clearly an RNG clerical error.",
    "Level {rival-level}! If {hero} genuinely thinks hitting level {level} makes us equals, they need a remedial math tutor in {kingdom}.",
    "Hit level {rival-level}. The developmental gap between our careers just widened from a crack into the Grand Canyon.",
    "Level {rival-level} unlocked. The algorithm is practically tripping over itself to drag {hero} kicking and screaming to level {level}.",
    "I leveled up to {rival-level} through immaculate technique. {hero} leveled up to {level} because pity XP is real.",
    "I reached level {rival-level} through raw discipline and tactical macroing. {hero} hit level {level} by leaving a browser tab open while getting tacos.",
    "Ding! Unlike {hero}, who hit level {level} while completely catatonic, I actually looked at the monitor when I reached {rival-level}.",
    "Imagine celebrating level {level} when the browser did 100% of the manual labor for you. Couldn't be me at level {rival-level}.",
    "Level {rival-level}! I put in the work. {hero} just minimized the window behind an Excel spreadsheet and hoped for the best.",
    "While {hero} was afk letting the progress bars push them to level {level}, I was grinding out level {rival-level} with pure unadulterated swagger.",
    "Level {rival-level} achieved! Still running an S-tier build while {hero} stumbles into level {level} clutching that dented {weapon}.",
    "Hit level {rival-level}. My stat allocations are a symmetrical masterpiece; {hero}'s character sheet looks like a toddler sneezed ink on it.",
    "Level {rival-level}! Can't wait to see what horrifying, mismatched piece of {gear} {hero} equips to celebrate reaching level {level}.",
    "Ding level {rival-level}. My combat rotation is poetry in motion; {hero} is still mashing {spell} like a panicked badger.",
    "Level {rival-level}. I invested my new attribute points into raw lethality. {hero} probably dumped theirs into charisma again.",
    "Shoutout to {hero} on hitting level {level}! Your official participation ribbon is in the mail, champ.",
    "Level {rival-level}. My leveling fanfare had pyrotechnics and angelic choirs; {hero}'s ding sounded like a sad bicycle horn.",
    "Unfollowing {hero} on Scrollr. I cannot have their mediocre level {level} energy polluting my pristine level {rival-level} feed.",
    "At level {rival-level}, I am an unstoppable force of nature. At level {level}, {hero} is a mild municipal inconvenience in {kingdom}.",
    "Level {rival-level}! The Old Bastard™ just checked under his bed for me. He checked under his doormat for {hero}.",
    "Don't tag me in your level-up posts, {hero}. We are not in the same tax bracket, the same tier, or the same league.",
    "Level {rival-level}. Post your congratulatory tributes below. {hero}, your replies have been preemptively hidden."
  ] },

  // Sir Spreddit on the rivalry, at rest
  rivalry: { who: 'spreddit', lines: [
    "Rivalry watch: {hero} (level {level}) vs {rival} (level {rival-level}). Place your bets.",
    "The feud goes on: {rival-full} says {hero} 'peaked at level one'. {hero} has not responded. {hero} is busy.",
    "Poll: who beats the Old Bastard™ first? {hero} 48%, {rival} 47%, the Old Bastard™ himself 5%.",
    "{hero} and {rival} were spotted at the same tavern, glaring. Neither ordered. The tavern is confused.",
    "Sir Spreddit has been asked to stop calling it 'the {klass} Cold War'. Sir Spreddit will not.",
    "Same race, same class, same alignment, same level, give or take. Different haircuts. The realm is divided.",
    "{rival} has reportedly started a fan club. Membership: {rival}.",
    "BREAKING: {hero} and {rival} both claim to have seen the Old Bastard™ first. Neither has.",
    "Bookies in {kingdom} are giving 3:1 odds that {hero} and {rival} accidentally take each other out before finding the Old Bastard™.",
    "Tale of the tape: {hero} (level {level}, {deaths} deaths) vs {rival} (level {rival-level}, infinite ego). Vegas is sweating.",
    "Sir Spreddit Power Rankings: 1. {rival}, 2. {hero}, 3. A dead badger with a pointy stick. The gap between 2 and 3 is uncomfortably thin.",
    "Betting markets across {kingdom} report heavy action on {rival} rage-quitting before {hero} finishes their next loading bar.",
    "Analytics department update: {hero} has more wins, but {rival} has demonstrably better posture. The analysts are deadlocked.",
    "Sub-Spreddit discourse is in the gutter today. Half the board are {hero} loyalists; the other half are clearly {rival}'s alt accounts.",
    "A 40-post Scrollr thread is dissecting whether {hero}'s {weapon} or {rival}'s weapon is more pathetic. Conclusion: it's a draw.",
    "Heard {rival} commissioned a tavern bard to compose a diss track about {hero}. It was eight minutes of rhyming 'clown' with 'brown'.",
    "Hot take on s/{kingdom}: '{hero} and {rival} should stop beefing and start an advice podcast.' Both parties immediately threatened litigation.",
    "{rival} just subtweeted {hero}'s {gear}. It wasn't even clever; they just posted a picture of scrap iron and tagged them.",
    "They share a race, a class, and an alignment, but {rival} claims their moral compass has 'substantially better dynamic range'.",
    "Exclusive dispatch: {hero} and {rival} crossed paths on the road. Both aggressively pretended to be organizing their inventories.",
    "Eyewitness in {kingdom}: {rival} was caught buying {hero}'s exact shopping list at market, just demanding the boutique brand.",
    "When asked for comment about {rival}, {hero} stared blankly into the middle distance until a task completed. Ice cold psychological warfare.",
    "Can two nearly identical {race} {klass}es share the same narrative arc? The guild magistrates say no, but the server thread says yes.",
    "Reports indicate {rival} spent twenty minutes practicing an evil laugh outside {hero}'s campsite. {hero} slept right through it."
  ] },

  // The end of Act I: you've met (MeetRival)
  rivalMet: { who: 'spreddit', lines: [
    "A rivalry is born! {rival-full} has challenged {hero} to a race to the Old Bastard™. Same race, same class, same alignment. Sir Spreddit has cleared his schedule.",
    "Sources confirm: {hero} has a rival. It's {rival-full}. They are basically the same person, which makes it worse.",
    "Act I concludes with peak melodrama: {rival-full} stepped out of the fog, pointed an accusing finger at {hero}, and declared an eternal blood feud. Nobody clapped.",
    "It's official: {hero} has an arch-nemesis. {rival-full} showed up wearing an identical outfit, claiming 'it's an alternate palette swap'.",
    "The bards are dubbing the Act I finale 'The Convergence of Mid'. {rival-full} swore to beat the Old Bastard™ first and ruin {hero}'s credit score in {kingdom}.",
    "Dramatic tension reached historic heights when {rival-full} cornered {hero} for a ten-minute monologue. {hero} waited politely for the dialogue box to close.",
    "Two identical {race} {klass}es walk into Act II. Only one gets to be the protagonist. The comment section is already completely unhinged.",
    "The writers really copied {hero}'s character sheet, slapped on the name {rival-full}, and called it a narrative turning point. 10/10 scriptwriting.",
    "Eyewitnesses describe the fateful meeting: 'There was dramatic wind, an uncomfortable amount of eye contact, and then both walked off in the same direction.'",
    "Act I finale recap: The Old Bastard™ remains at large, but {rival-full} has officially pledged to make {hero}'s life mildly inconvenient on the feeds.",
    "Roll credits on Act I! {hero} and {rival-full} locked eyes, exchanged deeply rehearsed insults, and inaugurated a feud that will solve absolutely nothing."
  ] },

  // They're a level ahead at the end, and set out first
  rivalRace: { who: 'spreddit', lines: [
    "BREAKING: {rival} has set out for the Old Bastard™'s cave! {hero}, are you watching this?",
    "{rival} reaches level {rival-level} and heads straight for the Old Bastard™. Live updates as they happen. Or as they don't.",
    "IT'S HAPPENING: {rival} locked in their march on the final citadel! {hero} is still afk sorting inventory in {kingdom}.",
    "Emergency megathread: {rival} is on the endgame highway! Will {hero} wake up from their nap before the credits roll?",
    "Tale of the tape: {rival} is sprinting into the boss arena while {hero} is busy selling 400 severed bat wings for pocket change.",
    "Sir Spreddit sports bulletin: {rival} holds pole position! If {hero} doesn't ding level {rival-level} right now, history will forget them.",
    "{rival} has officially entered the final dungeon lobby! Live chat is currently 99% spamming 'WHERE IS {hero}?!'",
    "Red alert on s/{kingdom}: {rival} is within visual range of the Old Bastard™. {hero}'s fan club has gone completely private.",
    "{rival} just posted a smug selfie outside the boss lair. The caption: 'First! Ratio + L + {hero} fell off.'",
    "The climax is underway! {rival} marches on destiny while {hero} is still debating which pointy stick to equip.",
    "Can {hero} close the gap? Analysts say no, bookies say absolutely not, and {rival} is already polishing their victory speech."
  ] },

  // The Old Bastard™ is down, and not by them...
  rivalBeaten: { who: 'rival', lines: [
    "Fine. FINE. {hero} beat the Old Bastard™. I softened him up. Everyone knows I softened him up.",
    "Congratulations to {hero}, I guess. I was going to do it tomorrow. I had a thing today.",
    "{hero} only won because the Old Bastard™ was clearly lagging and suffering from sciatica. That kill has a massive asterisk on it.",
    "I had a dentist appointment in {kingdom}, okay? If I had logged on thirty minutes earlier, that triumph was mine.",
    "Whatever. Defeating the final boss is so mainstream anyway. True speedrunners know the real endgame is fashion.",
    "Reports claiming {hero} 'soloed' the boss are blatant propaganda. I dealt 98% of the psychological damage during Act I.",
    "Unfollowing everyone retweeting {hero}'s parade. You are all falling for orchestrated municipal PR spin.",
    "Anyone could have finished him after I cracked his shield rotation yesterday afternoon. You're welcome for the carry, {hero}.",
    "Enjoy your fifteen minutes of clout, {hero}. I'm already theorycrafting for the sequel, which will objectively feature better writing.",
    "I literally let {hero} take the final blow out of sheer pity. A master {klass} knows when to let the charity case feel special.",
    "Sure, {hero} got the title card, but did anyone see their DPS logs? Disgustingly carried by automated background scripts.",
    "Deleting my Scrollr account. Not because {hero} won, but because the casual community in {kingdom} has become completely insufferable.",
    "The Old Bastard™ went down way too fast. Clearly an unpatched balancing bug. Expect an official complaint filed with the developers."
  ] },

  // ...or he got away from you
  rivalGloat: { who: 'rival', lines: [
    "The Old Bastard™ beat {hero}. Couldn't be me. (It was me, last week. Couldn't be me again.)",
    "Watched {hero} lose to the Old Bastard™ from behind a rock. Took notes. Mostly laughed.",
    "LMAO {hero} really pulled up to the final boss wearing that dented {gear} and got erased in three seconds. Absolute cinema.",
    "Hold that massive L, {hero}! Imagine grinding across {level} levels just to get folded like cheap laundry by a senior citizen.",
    "The Old Bastard™ didn't even use an ultimate! He literally sighed, adjusted his spectacles, and {hero}'s HP hit absolute zero.",
    "New clip uploaded to Scrollr: 'Watching {hero}'s ragdoll physics launch across the ceiling.' Like, comment, and subscribe!",
    "The temple acolytes in {kingdom} just sent {hero} a platinum-tier loyalty punch card after that historic wipeout.",
    "Imagine having the entire realm watching your feed only to whiff {spell} on a stationary geriatric target. Humiliating.",
    "Heard {hero} tried to parry the Old Bastard™ with {weapon} and ended up directly in intensive care. Comedy perfection.",
    "Skill issue of the century! Step aside, {hero}, and let a competent {klass} show you how an actual protagonist fights.",
    "The Old Bastard™ didn't even drop combat posture. He went straight back to sipping herbal tea while {hero} respawned in a ditch.",
    "Pack it up, {hero}. The bards aren't even writing a tragedy about that wipe; they're filing it directly under slapstick parody."
  ] }
};

// What the Sub-Spreddit says about each kind of splurge (K.Sinks)
K.GossipSinks = {
  henchman: ["Local hero {hero} seen hiring a henchman. The henchman has been seen eating snacks more than henching. Developing."],
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
  "first", "ratio", "this is the content I'm here for", "source?", "all my this", "{hero} has main character syndrome",
  "my cousin was there and says this is true", "who asked", "lol", "no cap", "{nemesis} is my hero",
  "can confirm, I was the goat", "{hero} fans in shambles", "not the {klass} slander again",
  "this aged well", "Sir Spreddit pls", "I'm literally a {race-one} and this is offensive",
  "unsubscribe", "the mods are asleep, post goblins", "brb telling my guild", "I am thirsty for {nemesis}",
  "touch grass. not the Killing Fields™ grass", "real", "this but unironically", "{nemesis} can get it",
  "who is {hero}?", "I liked {hero} before they were popular", "you can't prove any of this",
  "*grabs popcorn*", "mood", "😂😂😂", "{guy} would never", "the lore runs deep", "FIRST!",
  "living rent free in my head", "cross-posting this to s/{kingdom2}", "big if true", "true if big",
  "I checked with the local witch here in s/{kingdom2} and they said nothing matters because we will all die of plague-rot",
  "can we kill {hero} a hero? They are killing everything s/{kingdom2} just because they were insulted and because we haven't invented therapy yet.",
  "the {boring} is a metaphor", "and then everybody clapped", "{kingdom} represent"
];

// Who posted, in the saved post (p.w), and the icon beside their name
K.GossipCodes = { spreddit: 's', crier: 'c', monster: 'm', elite: 'e', giver: 'g', merchant: '$', rival: 'r', townsfolk: 't' };
K.GossipIcons = { s: '\uD83D\uDCEF', c: '\uD83D\uDD14', m: '\uD83D\uDC79', e: '\uD83D\uDC51', g: '\uD83D\uDCDC',
                  $: '\uD83D\uDCB0', r: '\uD83D\uDE24', n: '\uD83D\uDE08', t: '\uD83D\uDCAC' };

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
  ['kingdom', 'giver', 'boring'].forEach(function (k) { if (story[k]) v[k] = story[k]; });
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
    pools = GossipOrder(dice, [['arrive', 3], ['nag', 2], ['taunt', 1.5]]);
    break;
  case 'town':
    if (!chance(G.OtherChance)) return;
    pools = GossipOrder(dice, [['town', 3], ['nag', 1]]);
    break;
  case 'rest':
    if (!chance(G.OtherChance)) return;
    pools = GossipOrder(dice, [['realm', 2], ['rivalry', 1.5], ['nag', 1], ['taunt', 1]]);
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
    GossipPost(dice, info.won ? 'finaleWon' : 'finaleLost', K.GossipPools[info.won ? 'finaleWon' : 'finaleLost']);
    if (RivalMet()) pools = [[info.won ? 'rivalBeaten' : 'rivalGloat']];
    break;
  case 'rival':
    // met (MeetRival), set out for the Old Bastard™ first, or levelled up
    if (!RivalMet()) return;
    if (info && info.level) {
      if (!chance(0.3)) return;
      pools = [['rivalLevel']];
    } else pools = [[info && info.race ? 'rivalRace' : 'rivalMet']];
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
    if ((key == 'taunt' || key == 'rivalry') && !RivalMet()) continue;   // (not before Act I's end)
    if (GossipPost(dice, key, pool, pools[i][1])) {
      if (everyday) game.feedAt = now;
      return;
    }
  }
}

// The pools in a random order, the heavier ones (the weights) more likely first
function GossipOrder(dice, weighted) {
  return weighted.map(function (w) { return { p: [w[0]], k: Math.pow(dice(), 1 / w[1]) }; })
    .sort(function (a, b) { return b.k - a.k; }).map(function (x) { return x.p; });
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
  else if (who == 'rival') { by = v['rival-full'] || v.nemesis; sub = 's/all'; }
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
