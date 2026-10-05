// Story: what each Act is about, the cinematic that ends it, and quests.
//
// When an Act begins, a story is picked and its setup is shown under Plot
// Development, so you know what you are doing and why. When the Act's
// progress bar fills, that same story's ending plays out as cinematic
// tasks, and the next Act begins with a new story.
//
// Text can use these placeholders, which are filled in once when the Act
// begins, so the setup and the ending always talk about the same people:
//
//   {nemesis} {nemesis2}  named monsters a little above your level
//   {guy} {guy2}          impressive people
//   {giver}               a titled nobody
//   {kingdom} {kingdom2}  made-up places
//   {item}                a special item ("Glowing Albatross of Hangry")
//   {boring}              a boring item
//   {race} {klass}        a race (plural) and a class
//   {insult}              a fresh insult from the Old Bastard™
//   {hero}                your name
//
// An ending line of "*fight*" becomes a few lines of grim combat with
// {nemesis}. Stories can also list quests of their own ("quests"), which
// show up now and then while the Act is on.
//
// Depends on config.js. Uses functions from main.js at run time.

// The Old Bastard™'s insults ("Thou artless beef-witted barnacle!")
K.Insults = [
  ['artless', 'asperous', 'base', 'bawdy', 'bawbling', 'beslubbering', 'blasphemous', 'bootless', 'brazen', 'churlish', 'clapper-tongued', 'clamorous', 'cockered', 'clouted', 'corrupted', 'craven', 'crusty', 'currish', 'dankish', 'deformed', 'disloyal', 'dissembling', 'dog-weary', 'droning', 'drossy', 'errant', 'false', 'fawning', 'flinty', 'fobbing', 'foul', 'froward', 'frothy', 'fulsome', 'fusty', 'gleeking', 'goatish', 'gorbellied', 'graceless', 'froze-faced', 'greasy', 'grizzled', 'impertinent', 'infectious', 'insolent', 'jarring', 'joggerheaded', 'lecherous', 'loathsome', 'lumpish', 'malapert', 'mammering', 'mangled', 'mewling', 'notable', 'obscene', 'offensive', 'ominous', 'paltry', 'paunchy', 'peevish', 'perjur’d', 'pestiferous', 'pestilent', 'prating', 'pribbling', 'proud', 'puking', 'puny', 'quailing', 'rank', 'reeky', 'roguish', 'ruttish', 'saucy', 'scabbed', 'scurvy', 'shallow', 'spleeny', 'spongy', 'surly', 'tedious', 'tottering', 'ugly', 'unchaste', 'unfit', 'unmuzzled', 'unwholesome', 'vain', 'venomed', 'venomous', 'villainous', 'viperous', 'warped', 'wayward', 'weedy', 'yeasty'],
  ['base-court', 'bat-fowling', 'beef-witted', 'beetle-headed', 'beggarly', 'blunt-witted', 'boil-brained', 'brain-sick', 'clapper-clawed', 'clay-brained', 'common-kissing', 'cream-faced', 'crook-pated', 'dismal-dreaming', 'dizzy-eyed', 'dog-hearted', 'dread-bolted', 'earth-vexing', 'elf-skinned', 'evil-eyed', 'false-hearted', 'fat-kidneyed', 'fen-sucked', 'filthy worsted-stocking', 'flap-eared', 'flap-mouthed', 'fly-bitten', 'folly-fallen', 'fool-born', 'foul-mouthed', 'full-gorged', 'green-eyed', 'guts-griping', 'half-faced', 'hard-hearted', 'hasty-witted', 'heavy-headed', 'hedge-born', 'hell-hated', 'hollow-hearted', 'idle-headed', 'ill-boding', 'ill-breeding', 'ill-composed', 'ill-favored', 'ill-nurtured', 'iron-witted', 'knotty-pated', 'lily-livered', 'logger-headed', 'mad-headed', 'milk-livered', 'misbegotten', 'motley-minded', 'muddy-mettled', 'onion-eyed', 'pigeon-hearted', 'pigeon-liver’d', 'plume-plucked', 'pottle-deep', 'poisonous-tongued', 'pox-marked', 'rancid-breathed', 'raw-boned', 'reeling-ripe', 'rough-hewn', 'rude-growing', 'rump-faced', 'rump-fed', 'shallow-rooter', 'shard-borne', 'sheep-biting', 'snail-paced', 'sour-faced', 'spur-galled', 'swag-bellied', 'tardy-gaited', 'thick-skinned', 'three-suited', 'tickle-brained', 'toad-spotted', 'urchin-snouted', 'weather-bitten', 'white-livered', 'wide-chapped'],
  ['ale-wife', 'apoplexy', 'apple-john', 'baggage', 'barnacle', 'batch of nature', 'bavin', 'beetle', 'bladder', 'block', 'boar-pig', 'boil', 'bugbear', 'bum-bailey', 'buzzard', 'caitiff', 'canker-blossom', 'carrion', 'caterpillar', 'chaff', 'chamber pot', 'clack-dish', 'clotpole', 'codpiece', 'coistrel', 'congregation of vapors', 'coxcomb', 'cur', 'death-token', 'dewberry', 'dogfish', 'dullard', 'ear-wax', 'farting-clout', 'feeder-of-apes', 'flap-dragon', 'flax-wench', 'flesh-monger', 'flirt-gill', 'fool', 'foot-licker', 'fop', 'fustion', 'fustilarian', 'giglet', 'gudgeon', 'gull', 'haggard', 'harpy', 'hedge-pig', 'horn-beast', 'horse-leech', 'hugger-mugger', 'infected jelly', 'jack-a-nape', 'jolthead', 'knave', 'lewdster', 'loon', 'lout', 'maggot-pie', 'malignancy', 'malt-worm', 'mammet', 'measle', 'minnow', 'miscreant', 'moldwarp', 'mooncalf', 'mumble-news', 'noisemaker', 'nut-hook', 'ox-head', 'petard', 'pigeon-egg', 'pignut', 'plague-sore', 'princox', 'pumpion', 'puttock', 'rabbit-sucker', 'rampallian', 'ratsbane', 'rogue', 'scullion', 'scut', 'skainsmate', 'skimble-skamble', 'smell', 'strumpet', 'tallow-catch', 'tickle-brain', 'toad', 'twice-told tale', 'varlet', 'vassal', 'wagtail', 'wheyface', 'whoreson', 'younker']
];

// "Thou artless beef-witted barnacle!" (uses the game's random numbers)
function Insult() {
  return 'Thou ' + Pick(K.Insults[0]) + ' ' + Pick(K.Insults[1]) + ' ' + Pick(K.Insults[2]) + '!';
}

// The Prologue is always the same story: the Old Bastard™ taunts you in
// your dreams.
function PrologueStory(name) {
  var taunt = Insult();
  return {
    act: 0,
    key: 'prologue',
    title: 'Prologue',
    purpose: 'The Old Bastard™ taunts you in your dreams: “' + taunt + '” ' +
             'Set out to make him pay.',
    taunt: taunt
  };
}

K.Stories = [
  { key: 'council', title: 'The Council of Do-Gooders',
    setup: 'Rumor has it a council of powerful do-gooders is meeting at a friendly oasis in a hostile land. Fight your way there and find out what they want.',
    ending: [
      'Exhausted from endless questing, you arrive at a friendly oasis in a hostile land.',
      'You greet old friends and meet new allies. Those NPCs are the DM’s former PCs.',
      'You are privy to a council of powerful do-gooders. There is much to be done.',
      'Unsurprisingly, you are chosen to go forth. Time to Progress™ more!',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Bring snacks for the council of do-gooders', 'Learn the secret handshake of the do-gooders'] },

  { key: 'nemesis', title: 'The Nemesis',
    setup: '{nemesis} stands between you and the Old Bastard™, literally. Grow strong enough to face them.',
    ending: [
      'Your quarry is in sight, but a mighty enemy bars your path!',
      'A desperate struggle commences with {nemesis}',
      '*Mortal Kombat theme plays*',
      'Victory! {nemesis} is slain! Old Bastard™ hits you with pocket sand!',
      'They escape! They really are a bastard!',
      'You follow the trail of Old Bastard™ and vow not to fall for pocket sand again.'],
    quests: ['Spy on {nemesis}', 'Find out what {nemesis} is weak to', 'Sharpen your weapon for {nemesis}'] },

  { key: 'doubledealer', title: 'The Double-Dealer',
    setup: '{guy} has promised you shelter, a hot meal and secrets about the Old Bastard™. Reach their protection.',
    ending: [
      'Oh sweet relief! You’ve reached the kind protection of {guy}',
      'There is rejoicing, and an unnerving encounter with {guy} in private',
      'You forget your {boring} and go back to get it',
      'What’s this!? You overhear something shocking!',
      'Could {guy} be a dirty double-dealer?',
      'Who can possibly be trusted with this news!? -- Oh yes, of course',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Bring {guy} a housewarming {boring}', 'Keep an eye on {guy}'] },

  { key: 'maguffin', title: 'The Sacred Maguffin',
    setup: '{giver} begs you to find the sacred {item} to save their village. {guy} says it can be found in the lands of {kingdom}.',
    ending: [
      'You searched high and low across {kingdom} for the sacred {item}.',
      'You find out that {guy} intentionally misled you.',
      'Apparently {guy} already stole the {item} and sold it on Ye Olde eBay.',
      'I guess {giver} and their suffering village will just have to go without.',
      'You decide that the real {item} was the friends you made along the way.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Ask around {kingdom} about the {item}', 'Check Ye Olde eBay for the {item}'] },

  { key: 'wedding', title: 'The Royal Wedding',
    setup: 'The kingdoms of {kingdom} and {kingdom2} are on the brink of war since the wedding of {guy} and {guy2} was called off. Restore the peace.',
    ending: [
      'The rulers of {kingdom} and {kingdom2} call off the war talks to hear you out.',
      'The wedding was called off after accusations of infidelity. War seems imminent.',
      'Only a hero of your caliber can restore the peace and prevent this bloody conflict.',
      'You seduce {guy} and then also seduce {guy2}',
      'Both are satiated and content for the moment. Peace is restored for the time being.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Find a wedding present for {guy} and {guy2}', 'RSVP to the wedding of {guy} and {guy2}'] },

  { key: 'rescue', title: 'The Rescue',
    setup: '{guy} of {kingdom} says {nemesis} kidnapped their beloved {guy2}. Rescue them.',
    ending: [
      'You set off to slay the mighty {nemesis} and rescue {guy2}',
      'It is a dangerous journey but you continue undaunted.',
      'You discover {guy2} and {nemesis} eloped and are about to wed. This is awkward.',
      'You tell {guy} that {guy2} is dead so they can continue their secret love.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Track {nemesis} through {kingdom}', 'Bring {guy2} a change of clothes'] },

  { key: 'turningpoint', title: 'The Turning Point',
    setup: 'You feel your great quest is approaching a crucial turning point. Prepare yourself for whatever comes.',
    ending: [
      'You feel your great quest is at a crucial turning point.',
      'Have you grown so strong in your questing that you are prepared?',
      'Can you defeat your nemesis and right the wrong that started all of this?',
      'You are no longer the same person who initially set out.',
      'You know that true change comes from within.',
      'Or is that gas? Time for a massive Baja Blast.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Meditate on your journey so far', 'Journal about your feelings'] },

  { key: 'fishmonger', title: 'The Sighting',
    setup: 'Someone matching the Old Bastard™’s description has been seen near the docks of {kingdom}. Track him down.',
    ending: [
      'WAIT. Is that him?',
      'Is that the Old Bastard™ from your vision?',
      'Is this the moment you have been questing for?',
      'You brace yourself for the final battle. One way or another, this ends now.',
      'You stab them right in the back!',
      'Nevermind, that was just the fishmonger. Their widow cries.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Stake out the docks of {kingdom}', 'Interview the fishmongers of {kingdom}'] },

  { key: 'nightmares', title: 'The Nightmares',
    setup: 'The Old Bastard™ haunts your dreams every night: “{insult}” You are not ready. Grind until you are.',
    ending: [
      'You cannot sleep. The nightmares continue.',
      'That Old Bastard™ haunts your visions: “{insult}”',
      'But deep down you know you are not ready for the final showdown.',
      'All epic tales need a grinding montage.',
      'Let us grind longer. The Old Bastard™ from your vision can wait.'],
    quests: ['Buy a dreamcatcher', 'Think of a good comeback to “{insult}”'] },

  { key: 'intermission', title: 'The Intermission',
    setup: 'This feels like a natural stopping point, as if some chapter or Act were about to finish. Push on to the end of it.',
    ending: [
      'You feel accomplished. That was quite the quest you just finished.',
      'This feels like a natural stopping point as if some chapter or act finished.',
      'But you can’t stop. You just take a brief break.',
      'You use the chamber pot. You forage for snacks.',
      'You are ready to continue this super-epic journey. The Old Bastard™ will pay!'],
    quests: ['Find a clean chamber pot', 'Forage for snacks'] },

  { key: 'retirement', title: 'The Retirement Plan',
    setup: 'You could buy a tavern and retire. Earn enough gold to seriously consider it.',
    ending: [
      'You pause and take stock of your current situation.',
      'You have come so far but you have not stopped the Old Bastard™.',
      'You invest all the gold and dream of a happy retirement.',
      'Old Bastard™ tanks the stock market in some crypto scheme and you are broke.',
      'Time to hunt down Old Bastard™!'],
    quests: ['Tour a tavern for sale in {kingdom}', 'Ask {guy} about a small business loan'] },

  { key: 'bath', title: 'The Bath',
    setup: 'You are covered in what is left of {nemesis} and {nemesis2}. A bath can wait; the Old Bastard™ cannot.',
    ending: [
      'You wipe the blood off your weapon. Actually you are covered in gore.',
      'There are bits of {nemesis} on your boots.',
      'You never could quite wash the viscera from {nemesis2} out of your hair.',
      'You have come so far in your journey, but you also probably need a good bath.',
      'Not time for a bath because you must get that Old Bastard™!'],
    quests: ['Find soap that works on {nemesis2}', 'Air out your armor'] },

  { key: 'killingfields', title: 'The Killing Fields',
    setup: 'Search every corner of the Killing Fields™ for any sign of the Old Bastard™.',
    ending: [
      'You pause and a thought occurs to you.',
      'You spend all your time on the Killing Fields™ and have yet to find the Old Bastard™.',
      'Should you look somewhere else?',
      'But there are lots of monsters on the Killing Fields™ and they drop lots of gold.',
      'You like gold, so back to the Killing Fields™!'],
    quests: ['Map the Killing Fields™', 'Put up "Have You Seen This Old Bastard™?" posters'] },

  { key: 'heist', title: 'The Heist',
    setup: '{guy} hires you to steal the {item} from the vaults of {kingdom}. It is definitely not a setup.',
    ending: [
      'You assemble a crew: a {race-one}, a {klass}, and a guy named Steve.',
      'The plan is perfect. Steve does not understand the plan.',
      'You crack the vaults of {kingdom} and lay hands on the {item}.',
      'Alarms! {guy} was working for the guards all along. It was a setup.',
      'You escape with nothing but a {boring} and Steve.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Case the vaults of {kingdom}', 'Recruit a getaway {klass}', 'Explain the plan to Steve again'] },

  { key: 'tournament', title: 'The Tournament',
    setup: 'The Grand Tournament of {kingdom} offers glory, gold and a lifetime supply of {boring}. Train for it.',
    ending: [
      'You arrive at the Grand Tournament of {kingdom} to thunderous indifference.',
      'Your first opponent is {nemesis}.',
      '*Mortal Kombat theme music*',
      'You win! Your opponent in the final forgets to show up. You win again!',
      'Your prize is a lifetime supply of {boring}. It fits in one hand.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Register for the Grand Tournament of {kingdom}', 'Practice your victory pose', 'Scout {nemesis}’s technique'] },

  { key: 'prophecy', title: 'The Prophecy',
    setup: 'A blind seer foretells that the Chosen One will defeat the Old Bastard™. Prove that it is you.',
    ending: [
      'You return to the blind seer to collect your destiny.',
      'The seer reads the prophecy again, more slowly.',
      'It says "Chosen Juan". Juan is a fishmonger’s apprentice in {kingdom}.',
      'Juan wishes you the best of luck.',
      'You decide prophecies are more of a suggestion.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Get the prophecy notarized', 'Find out who Juan is'] },

  { key: 'escort', title: 'The Escort',
    setup: 'Escort {guy} safely to {kingdom}. They are faster than your walk but slower than your run.',
    ending: [
      '{guy} stops to look at every single shop on the way to {kingdom}.',
      '{guy} wanders into a nest of {race}. You clean up the mess.',
      '{guy} asks if you are there yet. You are not there yet.',
      'At long last, you arrive in {kingdom}. {guy} tips you a {boring}.',
      'You curse the devs who put in an escort quest.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Wait for {guy} to catch up', 'Find {guy}, who has wandered off again'] },

  { key: 'curse', title: 'The Curse',
    setup: 'You picked up a cursed {item}. Lift the curse before it gets any worse.',
    ending: [
      'The curse gets worse. Your {boring} has started talking.',
      'It will not stop talking about the Old Bastard™.',
      'A cleric in {kingdom} suggests reading the fine print on the {item}.',
      'The curse is lifted by accepting the terms of service.',
      'The {item} is now only mildly haunted.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Ask a cleric in {kingdom} about the {item}', 'Get your {boring} to stop talking'] },

  { key: 'strike', title: 'The Strike',
    setup: 'The {race} of {kingdom} are on strike, and nobody is guarding the bridge. Negotiate an end to the strike.',
    ending: [
      'You meet the union rep for the {race} of {kingdom}, {guy}.',
      'Their demands: dental, and the head of {nemesis}, who has been crossing the picket line.',
      '*Highlander Theme Music*',
      '{nemesis} loses their head. The bridge is guarded. The dental plan is mediocre.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Bring coffee to the picket line', 'Read the {race} collective bargaining agreement'] },

  { key: 'dungeon', title: 'The Dungeon Crawl',
    setup: '{guy} has drawn you a map to the Dungeon of {kingdom}. Several squares are labeled "probably fine".',
    ending: [
      'You descend into the Dungeon of {kingdom}, next to Carl and Princess Donut.',
      'The squares marked "probably fine" were not fine.',
      'A treasure chest turns out to be a mimic. It eats your {boring}.',
      'At the bottom waits {nemesis}.',
      '*Mortal Kombat theme music*',
      'The treasure is a coupon. It has expired.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Buy a ten-foot pole', 'Check the map for squares marked "probably fine"'] },

  { key: 'timeloop', title: 'The Time Loop',
    setup: 'Every morning you wake up in {kingdom} on the same day. Figure out how to break the loop.',
    ending: [
      'You wake up in {kingdom}. It is the same day.',
      'You wake up in {kingdom}. It is the same day.',
      'You use the time to learn the lute, a second language and how to juggle.',
      'You wake up in {kingdom}. It is the next day. The loop was broken by being nice to {guy}.',
      'You can no longer juggle.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Be nice to {guy}', 'Learn the lute (again)'] },

  { key: 'sidekick', title: 'The Sidekick',
    setup: '{guy} insists on being your sidekick. Survive the Act without them getting you killed.',
    ending: [
      '{guy} trips every trap between here and {kingdom}.',
      '{guy} steals your kills and asks you to sign them as their own.',
      '{guy} reveals they are the Old Bastard™’s nephew. He says hi.',
      'There is a tearful goodbye. Mostly on {guy}’s side.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Teach {guy} to stop pulling aggro', 'Buy {guy} a helmet'] },

  { key: 'ancientevil', title: 'The Ancient Evil',
    setup: 'Something ancient and evil stirs beneath {kingdom}. It is probably not the Old Bastard™, but you had better check.',
    ending: [
      'You descend beneath {kingdom} into the dark. You forgot your torch.',
      'The ancient evil is {nemesis}. It has a podcast.',
      '*Plug the episode sponsor*',
      'It was not the Old Bastard™. You unsubscribe.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Listen to an episode of {nemesis}’s podcast', 'Find the way beneath {kingdom}'] },

  { key: 'imposter', title: 'The Imposter',
    setup: 'Someone in {kingdom} is pretending to be you, and they have more social media followers. Unmask the imposter.',
    ending: [
      'You track the imposter through the streets of {kingdom}.',
      'It is {guy}, with bards live-singing to their fans.',
      'Honestly, they are better at being you than you are.',
      'You license your identity IP for a cut of the profits.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Collect reviews of "you" in {kingdom}', 'Practice being yourself'] },

  { key: 'taxes', title: 'Tax Season',
    setup: 'The Royal Treasury of {kingdom} says you owe back taxes on every {boring} you have ever looted. Settle up.',
    ending: [
      'You are audited by the Royal Treasury of {kingdom}.',
      'You claim the viscera on your boots as a business expense.',
      'The Treasury sends its enforcer, {nemesis}.',
      '*Itemize This!*',
      'You receive a refund of three copper pieces.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Find your receipts', 'Itemize your {boring} collection'] },

  { key: 'letter', title: 'The Letter',
    setup: 'A letter arrives from the Old Bastard™ himself. It reads, in full: “{insult}” Find out where it was posted from.',
    ending: [
      'The postmark says {kingdom}. You go to {kingdom}.',
      'The Old Bastard™ has moved. He left a forwarding address.',
      'It is the bed chambers of your mother in {kingdom2}.',
      'You send a strongly worded letter back.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Ask the postmaster of {kingdom} about a forwarding address', 'Draft a strongly worded reply'] },

  { key: 'dragon', title: 'The Dragon',
    setup: 'A dragon is terrorizing {kingdom}. The reward is the hand of {guy} in marriage, which {guy} has not agreed to. Slay the dragon.',
    ending: [
      'You find the dragon. It is {nemesis}.',
      '*fight*',
      'The dragon is slain and {kingdom} rejoices.',
      '{guy} politely declines to marry you.',
      'You accept the cash equivalent instead.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Buy fireproof underwear', 'Ask {guy} if they actually agreed to this'] },

  { key: 'bard', title: 'The Ballad',
    setup: 'A bard named {guy} is following you around writing songs about you. Make sure the songs are flattering.',
    ending: [
      '{guy} debuts “The Ballad of {hero}” in a tavern in {kingdom}.',
      'It rhymes your name with something rude.',
      'You pay {guy} to write a different song.',
      'The new song is worse. It is catchy, though.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Bribe {guy}', 'Learn the words to “The Ballad of {hero}”'] },

  { key: 'codex', title: 'Knights of Good',
    setup: 'The Knights of Good need help defending Cheesybeards in {kingdom}.',
    ending: [
      '{guy} complains to Zaboo that Cheesybeards should not be able to market in game.',
      'Tinkerballs is fending off trolls who are trying to burn the place down.',
      'Vork charges {guy} a heating bill for being close to the fire.',
      'Codex arrives in {kingdom} just in time. Together you save Cheesybeards.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Find Cheesybeards {kingdom} in Google Maps', 'Steal the portrait of Codex and Fawkes from {hero}'] },

  { key: 'pyramid', title: 'The Multi-Level Opportunity',
    setup: '{guy} in {kingdom} promises untold wealth and passive income while tracking down the Old Bastard™. Attend their informational seminar.',
    ending: [
      'You sit through a four-hour presentation about essential healing ointments.',
      'To unlock the Old Bastard™’s coordinates, you must recruit three friends.',
      'You try to recruit {nemesis}. They take personal offense.',
      '*fight*',
      'You are now an Emerald Executive, but your inventory is full of unsold {boring}.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Sit through {guy}’s seminar in {kingdom}', 'Try to recruit {nemesis} into your downline'] },

  { key: 'hoa', title: 'The Neighborhood Association',
    setup: 'The Homeowners Association of {kingdom} cites your questing camp for having weeds taller than two inches. Pay the fine or fight City Hall.',
    ending: [
      'You appear before the disciplinary board of {kingdom}.',
      'The board president is {nemesis}, wearing a high-visibility sash.',
      '*fight*',
      'The citations are cleared, though you are still banned from parking your horse on the grass.',
      'You pack up your camp and resolve never to buy property.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Mow the moat outside {kingdom}', 'Appeal your citation to {nemesis}'] },

  { key: 'influencer', title: 'The Brand Deal',
    setup: 'A lifestyle brand in {kingdom} wants to sponsor your crusade against the Old Bastard™. Keep up your engagement metrics.',
    ending: [
      'You post dramatic portraits of your questing across {kingdom}.',
      'The sponsor demands you wear a branded {item} during combat.',
      'Your audience accuses you of selling out. Your follower count plummets.',
      'You cancel the sponsorship deal and throw the {item} into a swamp.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Record an unboxing video of your new {item}', 'Tag {kingdom} in your battle selfies'] },

  { key: 'cursedsword', title: 'The Sentient Weapon',
    setup: 'You loot a talking blade that promises ancient forbidden lore about the Old Bastard™. Put up with its constant commentary.',
    ending: [
      'The blade will not shut up. It critiques your footwork in every tavern.',
      'It claims it once served the Old Bastard™ as a decorative letter opener.',
      'It insists on singing off-key sea shanties whenever you try to sleep.',
      'You trade the annoying sword to {guy} for a slightly rusty {boring}.',
      'Blessed silence returns at last.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Muffle the talking blade with a dirty towel', 'Ask the blade what it knows about the Old Bastard™'] },

  { key: 'bakeoff', title: 'The Great Kingdom Bake-Off',
    setup: 'Rumor has it the Old Bastard™’s grandmother is judging the annual pastry tournament in {kingdom}. Bake your way to victory.',
    ending: [
      'Your technical bake suffers from a soggy bottom.',
      'In the showstopper round, you construct an edible effigy of {nemesis}.',
      'The judges are horrified, but praise the crumb structure.',
      'You win second prize: a commemorative {boring}.',
      'The grandmother was actually just {guy} wearing a floral apron.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Knead dough until your arms give out', 'Sabotage {nemesis}’s sourdough starter'] },

  { key: 'jury', title: 'Civic Duty',
    setup: 'A courier serves you a summons for jury selection in the municipal courts of {kingdom}. You cannot skip civic duty.',
    ending: [
      'You spend three weeks trapped in a windowless room debating sheep zoning laws.',
      'The defendant turns out to be {nemesis}, accused of grand theft {boring}.',
      '*fight*',
      'The judge declares a mistrial due to excessive battlefield violence.',
      'You are compensated with two copper pieces and a voucher for dry cleaning.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Report to the courthouse in {kingdom}', 'Try to get dismissed during jury selection'] },

  { key: 'dmv', title: 'Cart Registration',
    setup: 'The road authorities of {kingdom} impound your war wagon for expired tags. Navigate the bureaucratic abyss.',
    ending: [
      'You pull ticket number 406. The clerk is currently helping number 12.',
      'You wait six hours only to be told you filled out the form for pack mules instead of horses.',
      'The regional inspector bars the exit. It is {nemesis}.',
      '*fight*',
      'Your wagon registration is renewed, but you forgot to get your emissions sticker.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Take a number and wait in {kingdom}', 'Fill out Form 1040-EZ in triplicate'] },

  { key: 'hauntedinn', title: 'The Bed and Breakfast',
    setup: 'Exhausted, you book a room at a quaint country inn near {kingdom}. The listing failed to mention the haunting.',
    ending: [
      'The phantom roams the hallway every hour on the hour clanking rusty spoons.',
      'It complains that the Old Bastard™ skipped out on an unpaid bar tab in 1482.',
      'You conduct an impromptu exorcism using a {boring} and salt.',
      'The innkeeper, {guy}, still charges you a cleaning fee.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Ask the ghost to keep it down', 'Argue with {guy} about the hidden resort fee'] },

  { key: 'dating', title: 'The Blind Date',
    setup: '{guy} sets you up on a blind date in {kingdom}, promising they know someone with dirt on the Old Bastard™.',
    ending: [
      'The date arrives. It is {nemesis}.',
      'The dinner conversation is strained, punctuated by polite glares.',
      'They chew with their mouth open and keep talking about their ex.',
      '*fight*',
      'You split the bill and slip out through the kitchen window.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Put on your least blood-spattered clothes', 'Endure awkward small talk with {nemesis}'] },

  { key: 'subscription', title: 'The Free Trial',
    setup: 'You signed up for a 30-day trial of Guild Membership in {kingdom} to find the Old Bastard™. Now you must cancel it.',
    ending: [
      'There is no option to cancel online or by messenger bird.',
      'You are forced to travel to the top of Mount Doom to speak with Retention Services.',
      'The retention manager, {nemesis}, refuses to let you close the account.',
      '*fight*',
      'Your card is still charged for next month anyway.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Navigate the automated guild switchboard', 'Demand to speak to {nemesis}’s supervisor'] },
];

// Fill a story's placeholders. vars is made once per Act by StoryVars().
function StoryText(text, vars) {
  return text.replace(/\{([a-z0-9-]+)\}/g, function (m, key) {
    return vars[key] !== undefined ? vars[key] : m;
  });
}

// Everything a story might mention, made up fresh for a new Act
function StoryVars() {
  var level = GetI(Traits,'Level');
  var race = Split(Pick(K.Races), 0);
  return {
    nemesis: NamedMonster(level + 3),
    nemesis2: NamedMonster(level + 3),
    guy: ImpressiveGuy(),
    guy2: ImpressiveGuy(),
    giver: PickLow(K.Titles) + ' ' + GenerateName(),
    kingdom: GenerateName(),
    kingdom2: GenerateName(),
    item: SpecialItem(),
    boring: BoringItem(),
    race: Plural(race),
    'race-one': race,
    klass: Split(Pick(K.Klasses), 0),
    insult: Insult(),
    hero: Get(Traits,'Name')
  };
}

// Pick the story for a new Act, avoiding the last few used
function NewStory(act) {
  var recent = (game.storyLog || []).slice(-8).map(function (s) { return s.key; });
  var choices = K.Stories.filter(function (s) { return recent.indexOf(s.key) < 0; });
  if (!choices.length) choices = K.Stories;
  var story = Pick(choices);
  var vars = StoryVars();
  return {
    act: act,
    key: story.key,
    title: story.title,
    purpose: StoryText(story.setup, vars),
    vars: vars
  };
}

function StoryTemplate(key) {
  for (var i = 0; i < K.Stories.length; ++i)
    if (K.Stories[i].key === key) return K.Stories[i];
  return null;
}

// The cinematic that ends the current Act, as task lines
function StoryEnding(story) {
  var t = StoryTemplate(story.key) || Pick(K.Stories);
  var vars = story.vars || StoryVars();
  var lines = [];
  $.each(t.ending, function (i, line) {
    if (line === '*fight*') {
      var s = Random(3);
      var n = 1 + Random(1 + Min(game.act, 4));
      for (var j = 0; j < n; ++j) {
        s += 1 + Random(2);
        lines.push(['Locked in grim combat with {nemesis}',
                    '{nemesis} seems to have the upper hand',
                    'You seem to gain the advantage over {nemesis}'][s % 3]);
      }
    } else {
      lines.push(line);
    }
  });
  // The task line adds "..." itself, so drop a trailing period
  return lines.map(function (line) {
    return ProperName(StoryText(line, vars)).replace(/([^.])\.$/, '$1');
  });
}

// A quest that belongs to the current Act's story, or null
function StoryQuest() {
  var story = game.story;
  var t = story && StoryTemplate(story.key);
  if (!t || !t.quests || !story.vars) return null;
  return StoryText(Pick(t.quests), story.vars);
}

// Quests. Each is "kind|caption". A "hunt" quest picks a monster near your
// level and makes it turn up on the Killing Fields more often (like the
// old Exterminate quests); "monster" quests just name one; "other" quests
// are errands. Placeholders, besides the story ones above:
//   {the-monsters} {monsters} {monster}  the quest monster
//   {drops}        its drop, plural ("ears")
//   {n}            a number from 3 to 12
//   {the-item} {a-boring} {boring}       items
K.Quests = [
  'hunt|Fact check {the-monsters} in a live debate.',
  'hunt|Slay {n} {monsters}. Lazy quest design.',
  'hunt|Club the {monster} like a baby seal.',
  'hunt|Teach {the-monsters} a lesson. I do not mean homeschooling.',
  'hunt|Collect {n} {monster} {drops}.',
  'hunt|Uber {guy} away from {the-monsters}.',
  'hunt|Evict {the-monsters} from {giver}’s basement.',
  'hunt|Bring back proof that {the-monsters} were real before you killed them.',
  'hunt|{kingdom} accidentally ordered too many {the-monsters} from Amazon.',
  'hunt|{the-monsters} are ruining tourism in {kingdom}.',
  'hunt|File a noise complaint against {the-monsters}',
  'hunt|Harvest {n} {monster} {drops} for a pyramid scheme.',
  'hunt|Aggressively un-invite {the-monsters} from the cookout',
  'hunt|Repossess {guy}’s carriage from {the-monsters}.',
  'hunt|Shame {the-monsters} on social media and ratio them.',
  'hunt|Accuse {n} invasive {monsters} of colonizing.',
  'hunt|Confiscate {n} {monster} {drops} for contraband inspection.',
  'hunt|Disperse {the-monsters} loitering outside {kingdom}.',
  'hunt|Audit {the-monsters} for unpaid property taxes.',
  'hunt|Reclaim {the-item} {the-monsters} sniped in an eBay auction.',
  'hunt|Tell {the-monsters} they just got served!',
  'hunt|Spank {the-monsters}, unless they are into that.',
  'hunt|Clean up {n} {monsters} tracking mud into {kingdom}.',
  'hunt|Extract {guy} from a swarm of {monsters}.',
  'hunt|{guy} demands you prevent {the-monsters} from forming a union.',
  'hunt|Practice retro-active {the-monsters} and unalive them.',
  'hunt|Serve {the-monsters} with a cease-and-desist order.',
  'hunt|Send {the-monsters} straight to voicemail.',
  'hunt|Collect {n} {monster} {drops} to pay off student loans.',
  'hunt|Break up an unauthorized flash mob of {the-monsters}.',
  'hunt|Aggressively unfriend {the-monsters} in real life.',
  'hunt|Hit {the-monsters} with a DMCA takedown notice.',
  'hunt|Harvest {n} {monster} {drops} to fuel an artisanal candle business.',
  'hunt|Shakedown {the-monsters} for overdue toll fees.',
  'hunt|Vibe-assassinate {the-monsters} with pure awkward silence.',
  'hunt|Disperse {the-monsters} tailgating in the parking lot of {kingdom}.',
  'hunt|Confiscate {n} unlicensed {monster} {drops} at the border.',
  'hunt|Teach {the-monsters} how to chew with their mouths closed.',
  'hunt|Wipe out {n} {monsters} who spoiled the season finale for {guy}.',
  'hunt|Repossess {the-item} from {the-monsters} for non-payment.',
  'hunt|Boot {the-monsters} from the group chat permanently.',
  'hunt|Audit {n} {monsters} claiming fraudulent dependents.',
  'hunt|Purge {the-monsters} for violating the HOA landscaping code in {kingdom}.',
  'hunt|Explain personal boundaries to {the-monsters} with a blunt weapon.',
  'hunt|Tell {the-monsters} it is their own fault for going to a place called the Killing Fields™.',
  'hunt|Slaughter {n} {monsters} to near extinction because you gotta catch `em all!',
  'hunt|Hunt {n} {monsters} so you can prepare an exotic dish for Iron Chef!',
  'hunt|Bugs Bunny said it isnt Rabbit Season. So instead hunt {n} {monsters}.',
  'hunt|{guy} from {kingdom} suggests I hunt a swarm of {monsters} as practice for The Old Bastard™.',
  'hunt|Send {n} {monsters} to their Maker.',
  'monster|Placate {the-monsters}, but be passive aggressive about it.',
  'monster|Create some viral content with the {the-monsters}.',
  'monster|Negotiate a truce with {the-monsters}.',
  'monster|Apologize to {the-monsters} for killing most of them.',
  'monster|Unionize {the-monsters} and give them health-care.',
  'monster|Investigate rumors about {the-monsters}.',
  'monster|Babysit {giver}’s pet {monster}.',
  'monster|Take a selfie with {the-monsters}.',
  'monster|Leave a passive-aggressive note for {the-monsters}.',
  'monster|Convince {the-monsters} to buy extended warranties.',
  'monster|Conduct a workplace safety seminar for {the-monsters}.',
  'monster|Sell life insurance to {the-monsters}.',
  'monster|Explain the tax code to {the-monsters}.',
  'monster|Challenge {the-monsters} to a dance-off.',
  'monster|Subtweet {the-monsters}.',
  'monster|Psychoanalyze a depressed {monster}.',
  'monster|Sign {the-monsters} up for a gym membership.',
  'monster|Teach {the-monsters} proper table etiquette.',
  'monster|Serve {the-monsters} with an eviction notice.',
  'monster|Host an intervention for {the-monsters}.',
  'monster|Invite {the-monsters} to join a timeshare seminar.',
  'monster|Vibe-check {the-monsters}.',
  'monster|Debate politics with a stubborn {monster}.',
  'monster|{monster} is looksmaxing and mogging {guy}.',
  'monster|Invite {monster} over for a night of Netflix and Kill.',
  'monster|Perform your best wrestling moves on {monster}.',  
  'monster|Endure a PowerPoint presentation given by {the-monsters}.',
  'monster|Try to convert {the-monsters} to your niche crypto coin.',
  'monster|Explain basic supply chain logistics to a confused {monster}.',
  'monster|Host a podcast interview with {the-monsters} about their villain arc.',
  'monster|Read the terms of service aloud to {the-monsters} until they submit.',
  'monster|Intervene before a {monster} sends a double text to {guy}.',
  'monster|Pitch a multi-level marketing scheme to {the-monsters}.',
  'monster|Review {monster}’s cringe high school poetry portfolio.',
  'monster|Convince {the-monsters} that gluten is not their enemy.',
  'monster|Peer-pressure {the-monsters} into downloading TikTok.',
  'monster|Debate crypto gas fees with a defensive {monster}.',
  'monster|Coach {the-monsters} on proper corporate handshake technique.',
  'monster|Administer a mandatory Myers-Briggs personality test to {the-monsters}.',
  'monster|Binge-watch reality television with a lonely {monster}.',
  'monster|Set up a dating profile for an emotionally unavailable {monster}.',
  'monster|Listen to {the-monsters} rehearse their garage band demo in {kingdom}.',
  'monster|Teach {the-monsters} how to parallel park a wagon.',
  'monster|Persuade {the-monsters} to try an all-kale cleanse diet.',
  'monster|Comfort a weeping {monster} who got ghosted by {guy}.',
  'monster|Start a new group chat without {monster} to talk shit about them.',
  'monster|Mediate an awkward boundary dispute between {the-monsters} and {guy}.',
  'monster|Show {the-monsters} that violence is not the way. Kill them if they disagree.',
  'monster|Play a prank on {the-monsters} where you remove all their blood.',
  'monster|Trauma bond with {the-monsters} by inflicting violent trauma on them.',
  'other|Literal FexEd quest. Send {the-item} for overnight delivery.',
  'other|Deliver this {boring} to someone who cares.',
  'other|Fetch me a shrubbery, I mean {a-boring}.',
  'other|Return this overdue {boring} to the library.',
  'other|Find {giver}’s lost {boring}.',
  'other|Recover {the-item} from a pawn shop.',
  'other|Get {a-boring} appraised.',
  'other|Uber {guy} to {kingdom} and get a 5-star review.',
  'other|Get {guy}’s autograph on {the-item} and sell it.',
  'other|Win the {kingdom} chili cook-off.',
  'other|Write a strongly worded review of {kingdom}.',
  'other|Settle a bar tab in {kingdom}.',
  'other|Deliver a singing telegram to {guy}.',
  'other|Water {giver}’s plants.',
  'other|Get revenge on the HoA in the Kingdom of {kingdom}.',
  'other|Pawn this {boring} for bail money.',
  'other|Re-gift {the-item} to {guy}.',
  'other|Assemble IKEA furniture with {a-boring}.',
  'other|Return {a-boring} without a receipt to {kingdom}.',
  'other|Smuggle {a-boring} past customs in {kingdom}',
  'other|Trade {a-boring} for a slightly better {boring}.',
  'other|Throw {the-item} into a volcano for drama.',
  'other|Contest a parking citation in {kingdom}.',
  'other|Steal back {giver}’s borrowed {boring}.',
  'other|Find out who left this {boring} in the fridge.',
  'other|Bribe an official in {kingdom} with {a-boring}.',
  'other|Cancel {guy}’s gym membership.',
  'other|Share your Netflix password with {guy} in {kingdom}.',
  'other|Help {guy} parallel-park a chariot in {kingdom}.',
  'other|Wait on hold with tech support in {kingdom}.',
  'other|Explain memes to {guy} through interpretive dance.',
  'other|Leave a one-star review for the tavern in {kingdom}.',
  'other|Clean the lint trap with {a-boring}.',
  'other|Track down the owner of this sticky {boring}.',
  'other|Gift {guy} {a-boring} as at their retirement party.',
  'other|Deliver a cease-and-desist letter to {kingdom}.',
  'other|Re-enact the Red Wedding for {giver} in {kingdom}.',  
  'other|Explain to {guy} that the laws of {kingdom} still apply, even if you claim to be a sovereign citizen.',
  'other|Attempt to return opened milk to a grocery store in {kingdom}.',
  'other|Trade {the-item} for a bag of stale store-brand chips.',
  'other|Help {guy} choose a profile picture that hides their double chin.',
  'other|Scrape gum off the bottom of {giver}’s tavern table with {a-boring}.',
  'other|Smuggle {the-item} through security wrapped in tin foil.',
  'other|Call {guy}’s cable company to cancel their package.',
  'other|Explain to {giver} why {the-item} does not need Bluetooth.',
  'other|Locate where {guy} dropped their contact lens in {kingdom}.',
  'other|Pretend to laugh at {giver}’s awful puns at dinner in {kingdom}.',
  'other|Unsubscribe {guy} from 400 promotional parchment mailers.',
  'other|Find a matching sock for this single, crusty {boring}.',
  'other|Wait in line at the {kingdom} DMV for three business days.',
  'other|Drop off {the-item} at a charity shop and demand a tax receipt.',
  'other|Help {guy} move a ridiculously heavy sectional sofa in {kingdom}.',
  'other|Deliver a lukewarm soy macchiato to {giver} across town.',
  'other|Try to pass off {a-boring} as legal tender in {kingdom}.',
  'other|Set up two-factor authentication on {guy}’s stone slate.',
  'other|Shoplift {a-boring} and immediately return it out of intense guilt.',
  'other|Host an intervention for {guy}’s unhealthy obsession with {the-item}.'
];

// A monster near your level for a quest: [entry, index into K.Monsters]
function QuestMonster() {
  var level = GetI(Traits,'Level');
  var best = null, bestIndex = 0;
  for (var i = 1; i <= 4; ++i) {
    var index = Random(K.Monsters.length);
    var m = K.Monsters[index];
    if (!best || Abs(StrToInt(Split(m,1)) - level) < Abs(StrToInt(Split(best,1)) - level)) {
      best = m;
      bestIndex = index;
    }
  }
  return [best, bestIndex];
}

// A new quest: { caption, monster, monsterIndex } (monster only for hunts).
// Now and then the quest comes from the current Act's story instead.
function MakeQuest() {
  var recent = (game.Quests || []).slice(-6);
  if (Odds(1,3)) {
    var storyQuest = StoryQuest();
    if (storyQuest && recent.indexOf(storyQuest) < 0) return { caption: storyQuest };
  }
  var entry = Pick(K.Quests);
  var kind = Split(entry, 0), caption = Split(entry, 1);
  var vars = {
    guy: ImpressiveGuy(),
    giver: PickLow(K.Titles) + ' ' + GenerateName(),
    kingdom: GenerateName(),
    'the-item': Definite(InterestingItem(), 1),
    boring: BoringItem(),
    n: 3 + Random(10)
  };
  vars['a-boring'] = Indefinite(vars.boring, 1);
  var quest = {};
  if (kind == 'hunt' || kind == 'monster') {
    var pick = QuestMonster();
    var name = Split(pick[0], 0);
    vars['the-monsters'] = Definite(name, 2);
    vars.monsters = Plural(name);
    vars.monster = name;
    vars.drops = Plural(Split(pick[0], 2) && Split(pick[0], 2) != '*' ? Split(pick[0], 2) : 'trophy');
    if (kind == 'hunt') {
      quest.monster = pick[0];
      quest.monsterIndex = pick[1];
    }
  }
  quest.caption = ProperName(StoryText(caption, vars));
  return quest;
}
