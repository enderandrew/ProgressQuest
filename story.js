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
    quests: ['Bring snacks for the council of do-gooders', 'Learn the secret handshake of the do-gooders', 'Convince at least two do-gooders to sign a petition for you to join.', 'Find a map to the hidden oasis of the do-gooders'] },

  { key: 'nemesis', title: 'The Nemesis',
    setup: '{nemesis} stands between you and the Old Bastard™, literally. Grow strong enough to face them.',
    ending: [
      'Your quarry is in sight, but a mighty enemy bars your path!',
      'A desperate struggle commences with {nemesis}',
      '*Mortal Kombat theme plays*',
      'Victory! {nemesis} is slain! Old Bastard™ hits you with pocket sand!',
      'They escape! They really are a bastard!',
      'You follow the trail of Old Bastard™ and vow not to fall for pocket sand again.'],
    quests: ['Spy on {nemesis}', 'Find out what {nemesis} is weak to', 'Sharpen your weapon for {nemesis}', 'Ask {nemesis} to politely stand-aside since Old Bastard™ is behind them.'] },

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
    quests: ['Bring {guy} a housewarming {boring}', 'Keep an eye on {guy}', 'Get Google Maps directions to find {guy}', 'Buy a nice housewarming gift for {guy}'] },

  { key: 'maguffin', title: 'The Sacred Maguffin',
    setup: '{giver} begs you to find the sacred {item} to save their village. {guy} says it can be found in the lands of {kingdom}.',
    ending: [
      'You searched high and low across {kingdom} for the sacred {item}.',
      'You find out that {guy} intentionally misled you.',
      'Apparently {guy} already stole the {item} and sold it on Ye Olde eBay.',
      'I guess {giver} and their suffering village will just have to go without.',
      'You decide that the real {item} was the friends you made along the way.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Ask around {kingdom} about the {item}', 'Check Ye Olde eBay for the {item}', 'Sell {boring} to afford {item}'] },

  { key: 'wedding', title: 'The Royal Wedding',
    setup: 'The kingdoms of {kingdom} and {kingdom2} are on the brink of war since the wedding of {guy} and {guy2} was called off. Restore the peace.',
    ending: [
      'The rulers of {kingdom} and {kingdom2} call off the war talks to hear you out.',
      'The wedding was called off after accusations of infidelity. War seems imminent.',
      'Only a hero of your caliber can restore the peace and prevent this bloody conflict.',
      'You seduce {guy} and then also seduce {guy2}',
      'Both are satiated and content for the moment. Peace is restored for the time being.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Find a wedding present for {guy} and {guy2}', 'RSVP to the wedding of {guy} and {guy2}', 'Prepare a special wedding cake for {guy} and {guy2}'] },

  { key: 'rescue', title: 'The Rescue',
    setup: '{guy} of {kingdom} says {nemesis} kidnapped their beloved {guy2}. Rescue them.',
    ending: [
      'You set off to slay the mighty {nemesis} and rescue {guy2}',
      'It is a dangerous journey but you continue undaunted.',
      'You discover {guy2} and {nemesis} eloped and are about to wed. This is awkward.',
      'You tell {guy} that {guy2} is dead so they can continue their secret love.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Track {nemesis} through {kingdom}', 'Console {guy} in this tough time.', 'Promise {guy} that you will bring {guy2} home.'] },

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
    quests: ['Meditate on your journey so far', 'Journal about your feelings', 'Ask {guy} the Guru for advice.', 'Dramatically pose in this turning point moment.'] },

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
    quests: ['Stake out the docks of {kingdom}', 'Interview the fishmongers of {kingdom}', 'Bribe {guy} the fishmonger with {boring} for intel.'] },

  { key: 'nightmares', title: 'The Nightmares',
    setup: 'The Old Bastard™ haunts your dreams every night: “{insult}” You are not ready. Grind until you are.',
    ending: [
      'You cannot sleep. The nightmares continue.',
      'That Old Bastard™ haunts your visions: “{insult}”',
      'But deep down you know you are not ready for the final showdown.',
      'All epic tales need a grinding montage.',
      'Let us grind longer. The Old Bastard™ from your vision can wait.'],
    quests: ['Buy a dreamcatcher', 'Think of a good comeback to “{insult}”', 'Try to desensitize yourself to "{insult}"'] },

  { key: 'intermission', title: 'The Intermission',
    setup: 'This feels like a natural stopping point, as if some chapter or Act were about to finish. Push on to the end of it.',
    ending: [
      'You feel accomplished. That was quite the quest you just finished.',
      'This feels like a natural stopping point as if some chapter or act finished.',
      'But you can’t stop. You just take a brief break.',
      'You use the chamber pot. You forage for snacks.',
      'You are ready to continue this super-epic journey. The Old Bastard™ will pay!'],
    quests: ['Find a clean chamber pot', 'Forage for snacks', 'Ask {guy} if there will a post-credit scene when this is over.'] },

  { key: 'retirement', title: 'The Retirement Plan',
    setup: 'You could buy a tavern and retire. Earn enough gold to seriously consider it.',
    ending: [
      'You pause and take stock of your current situation.',
      'You have come so far but you have not stopped the Old Bastard™.',
      'You invest all the gold and dream of a happy retirement.',
      'Old Bastard™ tanks the stock market in some crypto scheme and you are broke.',
      'Time to hunt down Old Bastard™!'],
    quests: ['Tour a tavern for sale in {kingdom}', 'Ask {guy} about a small business loan', 'Ask {guy} what it takes to run a tavern in {kingdom}'] },

  { key: 'bath', title: 'The Bath',
    setup: 'You are covered in what is left of {nemesis} and {nemesis2}. A bath can wait; the Old Bastard™ cannot.',
    ending: [
      'You wipe the blood off your weapon. Actually you are covered in gore.',
      'There are bits of {nemesis} on your boots.',
      'You never could quite wash the viscera from {nemesis2} out of your hair.',
      'You have come so far in your journey, but you also probably need a good bath.',
      'Not time for a bath because you must get that Old Bastard™!'],
    quests: ['Find soap that works on {nemesis2}', 'Air out your armor', 'Trade a {boring} for a special degreaser', 'Buy some shampoo that smells like {boring}.'] },

  { key: 'killingfields', title: 'The Killing Fields',
    setup: 'Search every corner of the Killing Fields™ for any sign of the Old Bastard™.',
    ending: [
      'You pause and a thought occurs to you.',
      'You spend all your time on the Killing Fields™ and have yet to find the Old Bastard™.',
      'Should you look somewhere else?',
      'But there are lots of monsters on the Killing Fields™ and they drop lots of gold.',
      'You like gold, so back to the Killing Fields™!'],
    quests: ['Map the Killing Fields™', 'Put up "Have You Seen This Old Bastard™?" posters', 'Ponder if maybe he is not considerate enough to be on the Killing Fields™'] },

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
    quests: ['Register for the Grand Tournament of {kingdom}', 'Practice your victory pose', 'Scout {nemesis}’s technique', 'Scout out how to best beat {klass} in combat', 'Research {race} weaknesses for the tournament'] },

  { key: 'prophecy', title: 'The Prophecy',
    setup: 'A blind seer foretells that the Chosen One will defeat the Old Bastard™. Prove that it is you.',
    ending: [
      'You return to the blind seer to collect your destiny.',
      'The seer reads the prophecy again, more slowly.',
      'It says "Chosen Juan". Juan is a fishmonger’s apprentice in {kingdom}.',
      'Juan wishes you the best of luck.',
      'You decide prophecies are more of a suggestion.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Get the prophecy notarized', 'Ask {guy} the Guru if you are the Chosen One', 'Fulfill parts of the prophecy as best you can.'] },

  { key: 'escort', title: 'The Escort',
    setup: 'Escort {guy} safely to {kingdom}. They are faster than your walk but slower than your run.',
    ending: [
      '{guy} stops to look at every single shop on the way to {kingdom}.',
      '{guy} wanders into a nest of {race}. You clean up the mess.',
      '{guy} asks if you are there yet. You are not there yet.',
      'At long last, you arrive in {kingdom}. {guy} tips you a {boring}.',
      'You curse the devs who put in an escort quest.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Wait for {guy} to catch up', 'Find {guy}, who has wandered off again', 'Ask {guy} to pick a speed you can easily match.', 'Curse {guy} for their terrible pathfinding.'] },

  { key: 'curse', title: 'The Curse',
    setup: 'You picked up a cursed {item}. Lift the curse before it gets any worse.',
    ending: [
      'The curse gets worse. Your {boring} has started talking.',
      'It will not stop talking about the Old Bastard™.',
      'A cleric in {kingdom} suggests reading the fine print on the {item}.',
      'The curse is lifted by accepting the terms of service.',
      'The {item} is now only mildly haunted.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Ask a cleric in {kingdom} about the {item}', 'Get your {boring} to stop talking', 'Ask {guy} the therapist if you can learn to live with the curse', 'Travel to {kingdom} where curses are normalized.', 'Curse {item} for being cursed.'] },

  { key: 'strike', title: 'The Strike',
    setup: 'The {race} of {kingdom} are on strike, and nobody is guarding the bridge. Negotiate an end to the strike.',
    ending: [
      'You meet the union rep for the {race} of {kingdom}, {guy}.',
      'Their demands: dental, and the head of {nemesis}, who has been crossing the picket line.',
      '*Highlander Theme Music*',
      '{nemesis} loses their head. The bridge is guarded. The dental plan is mediocre.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Bring coffee to the picket line', 'Read the {race} collective bargaining agreement', 'Ask {guy} for {kingdom} to meet with the {race} rep.', 'Call out the {klass} who crossed the picket line.'] },

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
    quests: ['Buy a ten-foot pole', 'Check the map for squares marked "probably fine"', 'Look for treasure chests'] },

  { key: 'timeloop', title: 'The Time Loop',
    setup: 'Every morning you wake up in {kingdom} on the same day. Figure out how to break the loop.',
    ending: [
      'You wake up in {kingdom}. It is the same day.',
      'You wake up in {kingdom}. It is the same day.',
      'You use the time to learn the lute, a second language and how to juggle.',
      'You wake up in {kingdom}. It is the next day. The loop was broken by being nice to {guy}.',
      'You can no longer juggle.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Be nice to {guy}', 'Learn the lute (again)', 'Memorize everything in {kingdom} that happens that day', 'Slowly go insane, like you do.'] },

  { key: 'sidekick', title: 'The Sidekick',
    setup: '{guy} insists on being your sidekick. Survive the Act without them getting you killed.',
    ending: [
      '{guy} trips every trap between here and {kingdom}.',
      '{guy} steals your kills and asks you to sign them as their own.',
      '{guy} reveals they are the Old Bastard™’s nephew. He says hi.',
      'There is a tearful goodbye. Mostly on {guy}’s side.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Teach {guy} to stop pulling aggro', 'Buy {guy} a helmet', 'Train {guy} on how to be a {klass}'] },

  { key: 'ancientevil', title: 'The Ancient Evil',
    setup: 'Something ancient and evil stirs beneath {kingdom}. It is probably not the Old Bastard™, but you had better check.',
    ending: [
      'You descend beneath {kingdom} into the dark. You forgot your torch.',
      'The ancient evil is {nemesis}. It has a podcast.',
      '*Plug the episode sponsor*',
      'It was not the Old Bastard™. You unsubscribe.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Listen to an episode of {nemesis}’s podcast', 'Find the way beneath {kingdom}', 'Learn a Detect Evil spell to find this Ancient Evil'] },

  { key: 'imposter', title: 'The Imposter',
    setup: 'Someone in {kingdom} is pretending to be you, and they have more social media followers. Unmask the imposter.',
    ending: [
      'You track the imposter through the streets of {kingdom}.',
      'It is {guy}, with bards live-singing to their fans.',
      'Honestly, they are better at being you than you are.',
      'You license your identity IP for a cut of the profits.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Collect reviews of "you" in {kingdom}', 'Practice being yourself', 'Ask yourself why someone else would want to be you'] },

  { key: 'taxes', title: 'Tax Season',
    setup: 'The Royal Treasury of {kingdom} says you owe back taxes on every {boring} you have ever looted. Settle up.',
    ending: [
      'You are audited by the Royal Treasury of {kingdom}.',
      'You claim the viscera on your boots as a business expense.',
      'The Treasury sends its enforcer, {nemesis}.',
      '*Itemize This!*',
      'You receive a refund of three copper pieces.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Find your receipts', 'Itemize your {boring} collection', 'Hire {guy}, the famously-sketchy accountant', 'Hide your {boring} collection before the audit'] },

  { key: 'letter', title: 'The Letter',
    setup: 'A letter arrives from the Old Bastard™ himself. It reads, in full: “{insult}” Find out where it was posted from.',
    ending: [
      'The postmark says {kingdom}. You go to {kingdom}.',
      'The Old Bastard™ has moved. He left a forwarding address.',
      'It is the bed chambers of your mother in {kingdom2}.',
      'You send a strongly worded letter back.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Ask the postmaster of {kingdom} about a forwarding address', 'Draft a strongly worded reply', 'Research the art of Comebacks'] },

  { key: 'dragon', title: 'The Dragon',
    setup: 'A dragon is terrorizing {kingdom}. The reward is the hand of {guy} in marriage, which {guy} has not agreed to. Slay the dragon.',
    ending: [
      'You find the dragon. It is {nemesis}.',
      '*fight*',
      'The dragon is slain and {kingdom} rejoices.',
      '{guy} politely declines to marry you.',
      'You accept the cash equivalent instead.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Buy fireproof underwear', 'Ask {guy} if they actually agreed to this', 'Scout {kingdom} for signs of the dragon', 'Ask the citizens of {kingdom} if they understand consent'] },

  { key: 'bard', title: 'The Ballad',
    setup: 'A bard named {guy} is following you around writing songs about you. Make sure the songs are flattering.',
    ending: [
      '{guy} debuts “The Ballad of {hero}” in a tavern in {kingdom}.',
      'It rhymes your name with something rude.',
      'You pay {guy} to write a different song.',
      'The new song is worse. It is catchy, though.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Bribe {guy}', 'Learn the words to “The Ballad of {hero}”', 'Show off your impressive {boring} to the bard'] },

  { key: 'codex', title: 'Knights of Good',
    setup: 'The Knights of Good need help defending Cheesybeards in {kingdom}.',
    ending: [
      '{guy} complains to Zaboo that Cheesybeards should not be able to market in game.',
      'Tinkerballs is fending off trolls who are trying to burn the place down.',
      'Vork charges {guy} a heating bill for being close to the fire.',
      'Codex arrives in {kingdom} just in time. Together you save Cheesybeards.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Find Cheesybeards {kingdom} in Google Maps', 'Steal the portrait of Codex and Fawkes from {guy}', 'Ask Tinkerballa on how best to take down {klass}', 'Ask Vork on how to be a better leader', 'Ask Zaboo for their best pick-up lines'] },

  { key: 'pyramid', title: 'The Multi-Level Opportunity',
    setup: '{guy} in {kingdom} promises untold wealth and passive income while tracking down the Old Bastard™. Attend their informational seminar.',
    ending: [
      'You sit through a four-hour presentation about essential healing ointments.',
      'To unlock the Old Bastard™’s coordinates, you must recruit three friends.',
      'You try to recruit {nemesis}. They take personal offense.',
      '*fight*',
      'You are now an Emerald Executive, but your inventory is full of unsold {boring}.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Sit through {guy}’s seminar in {kingdom}', 'Try to recruit {nemesis} into your downline', 'Unfriend {giver} who tried to recruit you into this nonsense'] },

  { key: 'hoa', title: 'The Neighborhood Association',
    setup: 'The Homeowners Association of {kingdom} cites your questing camp for having weeds taller than two inches. Pay the fine or fight City Hall.',
    ending: [
      'You appear before the disciplinary board of {kingdom}.',
      'The board president is {nemesis}, wearing a high-visibility sash.',
      '*fight*',
      'The citations are cleared, though you are still banned from parking your horse on the grass.',
      'You pack up your camp and resolve never to buy property.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Mow the moat outside {kingdom}', 'Appeal your citation to {nemesis}', 'Prepare to duel Karen'] },

  { key: 'influencer', title: 'The Brand Deal',
    setup: 'A lifestyle brand in {kingdom} wants to sponsor your crusade against the Old Bastard™. Keep up your engagement metrics.',
    ending: [
      'You post dramatic portraits of your questing across {kingdom}.',
      'The sponsor demands you wear a branded {item} during combat.',
      'Your audience accuses you of selling out. Your follower count plummets.',
      'You cancel the sponsorship deal and throw the {item} into a swamp.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Record an unboxing video of your new {item}', 'Tag {kingdom} in your battle selfies', 'Ask {giver} what in the heck is a Lifestyle Brand'] },

  { key: 'cursedsword', title: 'The Sentient Weapon',
    setup: 'You loot a talking blade that promises ancient forbidden lore about the Old Bastard™. Put up with its constant commentary.',
    ending: [
      'The blade will not shut up. It critiques your footwork in every tavern.',
      'It claims it once served the Old Bastard™ as a decorative letter opener.',
      'It insists on singing off-key sea shanties whenever you try to sleep.',
      'You trade the annoying sword to {guy} for a slightly rusty {boring}.',
      'Blessed silence returns at last.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Muffle the talking blade with a dirty towel', 'Ask the blade what it knows about the Old Bastard™', 'Record a podcast with the talking blade'] },

  { key: 'bakeoff', title: 'The Great Kingdom Bake-Off',
    setup: 'Rumor has it the Old Bastard™’s grandmother is judging the annual pastry tournament in {kingdom}. Bake your way to victory.',
    ending: [
      'Your technical bake suffers from a soggy bottom.',
      'In the showstopper round, you construct an edible effigy of {nemesis}.',
      'The judges are horrified, but praise the crumb structure.',
      'You win second prize: a commemorative {boring}.',
      'The grandmother was actually just {guy} wearing a floral apron.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Knead dough with {boring} until your arms give out', 'Sabotage {nemesis}’s sourdough starter', 'Try to recreate a traditional {race} recipe', 'Practice getting a handshake from Paul Hollywood for your pastry', 'Keep opening the open because you are worried it will not finish in time as if that will help'] },

  { key: 'jury', title: 'Civic Duty',
    setup: 'A courier serves you a summons for jury selection in the municipal courts of {kingdom}. You cannot skip civic duty.',
    ending: [
      'You spend three weeks trapped in a windowless room debating sheep zoning laws.',
      'The defendant turns out to be {nemesis}, accused of grand theft {boring}.',
      '*fight*',
      'The judge declares a mistrial due to excessive battlefield violence.',
      'You are compensated with two copper pieces and a voucher for dry cleaning.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Report to the courthouse in {kingdom}', 'Try to get dismissed during jury selection', 'Explain to {giver} that you are on a petty, personal quest for vengeance and that is more important than civic duty', 'Binge episodes of Judge Judy in preparation'] },

  { key: 'dmv', title: 'Cart Registration',
    setup: 'The road authorities of {kingdom} impound your war wagon for expired tags. Navigate the bureaucratic abyss.',
    ending: [
      'You pull ticket number 406. The clerk is currently helping number 12.',
      'You wait six hours only to be told you filled out the form for pack mules instead of horses.',
      'The regional inspector bars the exit. It is {nemesis}.',
      '*fight*',
      'Your wagon registration is renewed, but you forgot to get your emissions sticker.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Take a number and wait in {kingdom}', 'Fill out Form 1040-EZ in triplicate', 'Research the permit laws in {kingdom}'] },

  { key: 'hauntedinn', title: 'The Bed and Breakfast',
    setup: 'Exhausted, you book a room at a quaint country inn near {kingdom}. The listing failed to mention the haunting.',
    ending: [
      'The phantom roams the hallway every hour on the hour clanking rusty spoons.',
      'It complains that the Old Bastard™ skipped out on an unpaid bar tab in 1482.',
      'You conduct an impromptu exorcism using a {boring} and salt.',
      'The innkeeper, {guy}, still charges you a cleaning fee.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Ask the ghost to keep it down', 'Argue with {guy} about the hidden resort fee', 'Record a Ghost Hunter podcast episode with {guy}', 'Try to chase the ghost away rather than asking it the secrets of what lies beyond death'] },

  { key: 'dating', title: 'The Blind Date',
    setup: '{guy} sets you up on a blind date in {kingdom}, promising they know someone with dirt on the Old Bastard™.',
    ending: [
      'The date arrives. It is {nemesis}.',
      'The dinner conversation is strained, punctuated by polite glares.',
      'They chew with their mouth open and keep talking about their ex.',
      '*fight*',
      'You split the bill and slip out through the kitchen window.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Put on your least blood-spattered clothes', 'Endure awkward small talk with {nemesis}', 'Secretly hope the date is more than fact-finding, and that you may find love', 'Swipe left on {guy} and right on {guy2}', 'Get a dinner reservation in {kingdom}'] },

  { key: 'subscription', title: 'The Free Trial',
    setup: 'You signed up for a 30-day trial of Guild Membership in {kingdom} to find the Old Bastard™. Now you must cancel it.',
    ending: [
      'There is no option to cancel online or by messenger bird.',
      'You are forced to travel to the top of Mount Doom to speak with Retention Services.',
      'The retention manager, {nemesis}, refuses to let you close the account.',
      '*fight*',
      'Your card is still charged for next month anyway.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Navigate the automated guild switchboard', 'Demand to speak to {nemesis}’s supervisor', 'Spend ages holding to speak with someone who probably will not help you out', 'Silently curse yourself for forgetting to cancel in time'] },

  { key: 'bigfoot', title: 'Learn Kumite from The Master',
    setup: 'There is a legendary master of Kumite, which can help you defeat Old Bastard™. You must learn these secrets..',
    ending: [
      'When the student is ready, the Master will appear...',
      'Bigfoot steps out of the shadows with impossible grace, silence and stealth.',
      'He teaches you the first lessons in mastering The Kumite.',
      '*training montage*',
      'You must continue your training and your journey.',
      'You feel better prepared to literally kick the shit out of Old Bastard™.'],
    quests: ['Demonstrate your honor and dedication to the hidden Master...', 'Wax on and wax off in case the Master is Mr. Miyagi', 'Keep on the look out for ninjas. Ninjas are always around.', 'Leave the hidden Master a gift offering of {boring}', 'Sing that awesome Last Dragon theme song for the hidden Master'] },
];

// Fill a story's placeholders. vars is made once per Act by StoryVars().
function StoryText(text, vars) {
  return text.replace(/\{([a-z0-9-]+)\}/g, function (m, key) {
    return vars[key] !== undefined ? vars[key] : m;
  });
}

// ---- Acts I and II: your race, then your class ---------------------------------
//
// Act I is always your race's story (K.RaceStories) and Act II your
// class's (K.ClassStories), keyed by the exact name in K.Races and
// K.Klasses. From Act III on, stories come from K.Stories as before. Same
// format as K.Stories; check-events.js checks that every race and class
// has one.

K.RaceStories = {
  "4chan Troll": { key: 'race-troll', title: 'Lurk Moar',
    setup: 'A new moderator, {guy}, has taken over your home board and is enforcing “rules”. Troll your way back to glorious anonymity.',
    ending: [
      'You return to the Board, where nobody knows your name. That is the point.',
      '{guy} has been deleting posts and asking everyone to be nice.',
      'You post something so cursed that the server catches fire.',
      'In the silence, you realize you miss human contact. You log off. You touch grass.',
      'The grass is fine. You give it 3/10, would not touch again.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Bait {guy} into an argument about {boring}s', 'Start a rumor that the Old Bastard™ uses light mode', 'Lurk moar', 'Get banned and come back under a different name'] },

  "Aware-Wolf": { key: 'race-awarewolf', title: 'The Morning After',
    setup: 'Unlike ordinary werewolves, you remember everything you do under the full moon. Last night you did a lot. Go apologize to {kingdom}.',
    ending: [
      'You go door to door in {kingdom}, apologizing.',
      'You ate {guy}’s prize hens. You are aware of this. You are aware of everything.',
      'You offer to pay for the hens. {guy} asks you to pay for the gardens, too.',
      'You are aware you did not do the gardens. That was {nemesis}.',
      '*fight*',
      'The town forgives you, mostly. You remain extremely aware.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Apologize to the hens of {kingdom}', 'Check the moon phase calendar', 'Buy a muzzle that says “I am working on myself”', 'Journal about what you did last night'] },

  "Demi-Canadian": { key: 'race-canadian', title: 'The Apology Shortage',
    setup: '{kingdom} has run out of apologies. Without them, people are just bumping into each other and walking away. Find more.',
    ending: [
      'You search the frozen north for a fresh vein of apologies.',
      'Deep in a maple grove you find {guy}, hoarding every one of them in a hockey bag.',
      'You ask nicely if they would share. They say sorry, no.',
      'It is the first time anyone has been rude in {kingdom}. The trees gasp.',
      'You trade them an old {boring} and a double-double for the bag. Sorry is restored.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Hold a door open for a stranger for twenty minutes', 'Apologize to a moose for standing near it', 'Find out what {guy} is “aboot”', 'Tap a maple tree for emergency syrup', 'Buy the group some Timbits'] },

  "Double-Wookiee": { key: 'race-wookiee', title: 'Twice the Fur',
    setup: 'You are two Wookiees in one very large coat, and both of you want to fly the ship. Settle it before you crash.',
    ending: [
      'You find a junk-heap starship for sale in {kingdom} and argue over the controls.',
      'Both halves of you roar. Nobody, including you, understands either of you.',
      '{guy} offers to translate. They charge per Wookiee.',
      'You agree to take turns: the left half flies on odd days, the right half on even ones.',
      'Today is a leap day. You crash anyway. Only the ship is hurt.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Brush both of your coats', 'Win a game of Dejarik without pulling anyone’s arms off', 'Find a co-pilot who speaks Wookiee, twice', 'Get a medal at the ceremony this time'] },

  "Double-sided Bad Dragon": { key: 'race-baddragon', title: 'The Hoard Inspection',
    setup: 'Every dragon needs a hoard, and yours is embarrassing. Build a respectable one before the other dragons of {kingdom} come over.',
    ending: [
      'You survey your hoard: mostly coupons, an old {boring}, and things you would rather not explain.',
      'The dragons of {kingdom} arrive for the annual hoard inspection.',
      '{nemesis} sniggers at your collection, from both sides.',
      '*fight*',
      'You add {nemesis}’s hoard to yours. It is still mostly coupons.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Lubricate your hoard', 'Hide the weirder parts of your hoard before guests arrive', 'Steal an old {boring} from a sleeping dragon', 'Look dignified from both sides at once'] },

  "Enchanted Talking Chamberpot": { key: 'race-chamberpot', title: 'Flush With Ambition',
    setup: 'You were enchanted to talk, and you have overheard things. Royal things. Lean on the court of {kingdom} to back your quest.',
    ending: [
      'You arrive at court and announce that you have heard everything.',
      'The court goes pale. {guy} offers you gold for your silence.',
      'You take the gold. You are a chamberpot. Taking things is what you do.',
      'Nobody will ever use you again. You count this as a win.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Practice your eavesdropping', 'Polish your rim for the royal audience', 'Remind {guy} what you saw on Tuesday', 'Find a lid that fits your dignity'] },

  "Erotic Sonic Fan-Fic Abomination": { key: 'race-fanfic', title: 'The Author',
    setup: 'You were written into existence by an anonymous author at three in the morning. Find them and ask them why.',
    ending: [
      'You track the author through four hundred chapters and twelve thousand reviews.',
      'You find {guy} typing furiously by candlelight in {kingdom}.',
      '“Why did you make me?” you ask. They say: “I was going through a phase.”',
      'They promise to stop writing you. They lie. Chapter 401 drops tonight.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Read the reviews of your own chapters, then wish you hadn’t', 'Stay out of the comments section', 'Ask the author for a sequel without you in it', 'Report yourself for violating the terms of service'] },

  "Filthy Stinkin Lich": { key: 'race-lich', title: 'The Lost Phylactery',
    setup: 'Your soul is kept in a phylactery, and you have misplaced it. You think it might have gone in the laundry.',
    ending: [
      'You search the laundromats of {kingdom} for the jar that holds your soul.',
      'The smell of fresh laundry burns your undead flesh.',
      'You find your phylactery in a lost-and-found bin, next to an old {boring}.',
      '{guy}, the attendant, wants a storage fee. You pay in curses.',
      'Your soul is safe again, and smells faintly of lavender. You hate it.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Look for your soul in the dirty laundry', 'Avoid all soap', 'Ask the necromancers’ guild about their lost and found', 'Air out your burial shroud'] },

  "Goblin-Mode Satyr": { key: 'race-satyr', title: 'The Bender',
    setup: 'You went fully goblin mode last weekend and woke up in {kingdom} holding the {item}. Retrace your steps.',
    ending: [
      'You follow a trail of empty goblets across {kingdom}.',
      'Everyone you meet says you owe them money, a goat, and an apology.',
      '{guy} shows you a tapestry of last night. You are on the chandelier in every panel.',
      'It turns out the {item} belongs to {nemesis}, who would like it back.',
      '*fight*',
      'You keep the {item}. You do not keep your dignity.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Find your other sandal', 'Apologize to the goat', 'Pay your tab at the tavern in {kingdom}', 'Remember any of last night'] },

  "High Treant": { key: 'race-treant', title: 'The Very Long Moot',
    setup: 'The treants of {kingdom} have called a moot, which will take nine years. Speed it up before the Old Bastard™ dies of old age.',
    ending: [
      'The moot begins. The first treant says “Hello.” It takes three days.',
      'You suggest a faster way. Everyone stares at you for a season.',
      'You are very relaxed about all of this. Extremely relaxed. Possibly too relaxed.',
      'The treants vote to help you. You missed it. You were watching a leaf.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Photosynthesize for a while', 'Snack on some fertilizer', 'Listen to a treant finish a sentence', 'Remember why you walked into this grove'] },

  "Hungry Hungry Hobbit": { key: 'race-hobbit', title: 'Second Breakfast',
    setup: 'A dark power has stolen second breakfast from the Shire. Without it, elevenses is in danger too.',
    ending: [
      'You cross the Shire on an empty stomach. Morale is terrible.',
      'You find {nemesis} sitting on a mountain of stolen sausages.',
      '*fight*',
      'Second breakfast is saved! Also elevenses, luncheon, afternoon tea, dinner and supper.',
      'You eat all of them. After a nap, you are ready to go on.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Raid a farm for mushrooms', 'Pack snacks for the road', 'Count your meals, twice', 'Find out who took second breakfast'] },

  "I No Longer Care Bear": { key: 'race-carebear', title: 'The Caring Meeting',
    setup: 'Your belly badge has faded to a gray “meh”. The other bears want you at the Caring Meeting. You do not care.',
    ending: [
      'The bears gather on a cloud over {kingdom}. You go, but only for the snacks.',
      'They form the Stare. You form the Couldn’t-Care-Less Stare.',
      'Their rainbow beam meets yours and simply gives up.',
      'The meeting ends early. Everyone agrees you are kind of right.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Not care about something important', 'Skip the group hug', 'Shrug at {guy}', 'Find out where your feelings went'] },

  "Miniature Giant Space Hamster": { key: 'race-hamster', title: 'The Wheel of Infinity',
    setup: 'Somewhere in {kingdom} is the legendary Wheel of Infinity. Find it, and run.',
    ending: [
      'You find the Wheel of Infinity in the ruins of {kingdom}.',
      'You run. You run for days. The wheel turns.',
      'It powers the whole kingdom. Lights come on. Somebody makes toast.',
      'You have gone nowhere. You are fine with this. Hamsters always are.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Stuff your cheeks with supplies', 'Go for the eyes of {nemesis}', 'Find a bigger exercise ball', 'Ask {guy} for sunflower seeds', 'Send Minsc a postcard'] },

  "My Little Pygmy": { key: 'race-pygmy', title: 'Friendship Is Mandatory',
    setup: 'The Friendship Council of {kingdom} says you have not made a new friend in months. Make one, by force if necessary.',
    ending: [
      'You try to befriend {guy} by hugging them in their sleep. They run.',
      'You try to befriend {nemesis}. They run too, but slower.',
      'You catch up. You have a heartfelt talk. You learn a lesson about friendship.',
      'You write a letter about it to the Princess. She does not reply.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Learn a lesson about friendship', 'Braid your mane', 'Write a friendship letter to {guy}', 'Find out which element of harmony you are'] },

  "Nympho Nymph": { key: 'race-nymph', title: 'The Sacred Spring',
    setup: 'Your sacred spring in {kingdom} has been bought by a bottled water company. Win it back.',
    ending: [
      'It is hard to be wet when someone steals all the water. You storm the bottling plant of {guy}.',
      'They claim your spring water cures everything. It does not. It is water.',
      'You flirt your way past security, which is your answer to most problems.',
      'You make {guy} drink their own product. Mild stomachache. You win.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Bat your eyelashes at a guard', 'Read the fine print on the water deed', 'Protest outside the bottling plant', 'Find a new boyfriend, girlfriend and/or tree'] },

  "Odorous Oompa Loompa": { key: 'race-oompa', title: 'The Golden Tickets',
    setup: 'The candy factory where you work has hidden five golden tickets. Find them before the brats of {kingdom} do.',
    ending: [
      'You search every candy bar in {kingdom}.',
      'You find four golden tickets and one very sticky {boring}.',
      'The fifth ticket belongs to {nemesis}, a spoiled child of enormous power.',
      '*fight*',
      'The child swells up like a blueberry. You sing a song about it. You can’t help it.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Practice a cautionary song', 'Bathe, at least once', 'Strain the remnants of kids from chocolate river', 'Unwrap a candy bar looking for gold'] },

  "Only Somewhat Racist Dwarf": { key: 'race-dwarf', title: 'Sensitivity Training',
    setup: 'Your clan elders have sent you to sensitivity training in {kingdom}. The goal is to be less racist. Ideally, not at all.',
    ending: [
      'You sit in a circle with an elf, an orc, a {race-one} and {guy}. It is awkward.',
      'The instructor asks you to share. You say something about elves and regret it at once.',
      'You learn that elves are people too. Tall, annoying people, but people.',
      'You graduate. Your certificate says “Improving”. You frame it in gold.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Apologize to an elf', 'Read a pamphlet titled “A Beard Is Not a Personality”', 'Learn to pronounce {guy}’s name correctly', 'Unlearn something your grandfather told you'] },

  "Pixie Ironically with a Pixie-Cut": { key: 'race-pixie', title: 'A Bad Hair Day',
    setup: 'Everyone keeps telling you your haircut is very on-brand. Find a new style in {kingdom}.',
    ending: [
      'You visit the finest salon in {kingdom}.',
      '{guy} the stylist asks what you want. You say “something unexpected”.',
      'They give you a pixie cut. It is ironic. It is the only cut they know.',
      'You leave a sarcastic review. Somehow, that is also ironic.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Find a hat to hide your haircut', 'Ask {guy} for a second opinion', 'Glitter-bomb the barber shop', 'Grow your hair out, slowly', 'Sing Karoake with Alanis'] },

  "Poultrygeist": { key: 'race-poultrygeist', title: 'Unfinished Business',
    setup: 'You are the restless spirit of a chicken. You cannot move on until you find out why you crossed the road.',
    ending: [
      'You haunt the road where it all began.',
      'You find {guy}, who was on the other side of the road that day.',
      'They tell you there was a sale on feed.',
      'That’s it? That’s why? You rattle your chains, angrily.',
      'You decide not to cross over just yet. There’s an Old Bastard™ to haunt.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Rattle your chains at a farmer', 'Find your old coop', 'Ask the road why', 'Lay a spectral egg', 'Give a terrifying cluck'] },

  "Reverse-Centaur": { key: 'race-centaur', title: 'Best in Show',
    setup: 'The horse show of {kingdom} won’t accept you as a horse, and the talent show won’t accept you as a person. Win both.',
    ending: [
      'You enter the dressage event. Your human legs prance beautifully.',
      'The judges are confused. {guy} files a protest.',
      'You enter the talent show and neigh the national anthem.',
      'You win both blue ribbons and eat one of them.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Find pants that fit', 'Practice your neighing', 'Get your hooves done. Your hands. Whatever', 'Convince {guy} you are a horse'] },

  "Sharkasaurus": { key: 'race-sharkasaurus', title: 'Shark Week',
    setup: 'It is Shark Week in {kingdom}, and as the only shark-dinosaur around, you are expected to put on a show.',
    ending: [
      'The crowds gather on the shore. You leap from the sea in dramatic slow motion.',
      'You land on {nemesis}. It counts as a show and an attack.',
      '*fight*',
      'Ratings hit an all-time high. You are renewed for another season.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Practice your dramatic leap', 'Swim in a straight line for once', 'Bite a boat for the cameras', 'Ask {guy} for a better contract', 'Deny all responsibility for the Sharknado'] },

  "Stupid Sexy Elf": { key: 'race-elf', title: 'The Pageant',
    setup: 'You are the sexiest elf in {kingdom}, and the stupidest. Enter the elf pageant and win on one of those.',
    ending: [
      'The evening wear round goes great.',
      'The talent round goes great. You juggle, badly, but sexily.',
      'In the question round, {guy} asks you to name the capital of {kingdom}. You say “Yes.”',
      'You win anyway. Nobody was listening.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Practice your smolder', 'Learn one fact', 'Wear a sash that says “Miss {kingdom}”', 'Find the arrow you shot into the air'] },

  "Thirsty Cyberman": { key: 'race-cyberman', title: 'The Robot Ball',
    setup: 'You have orders to upgrade everyone in {kingdom}, but you would rather be liked. Find a date for the robot ball.',
    ending: [
      'You message {guy}: YOU WILL BE UPGRADED. No reply.',
      'You try again: YOU WILL BE UPGRADED. WINK.',
      'You go to the robot ball alone. You dance with a toaster. You feel something pop up.',
      'It is the best night of your life. DELETE. DELETE. DELETE.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Polish your chrome', 'Update your dating profile', 'Upgrade a pickup line', 'Lubricate with oil'] },

  "Travelocity Gnome": { key: 'race-gnome', title: 'Too Good to Be True',
    setup: 'You have found a travel deal to {kingdom} that is too good to be true. Go anyway.',
    ending: [
      'You arrive in {kingdom}. The resort is a tent.',
      'The all-inclusive buffet is a single {boring}.',
      '{guy}, your tour guide, takes your passport and vanishes.',
      'You give it five stars anyway. You are a professional.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Pose in front of a famous landmark', 'Find your lost luggage', 'Leave a review of {kingdom}', 'Book a trip with three layovers'] }
};

K.ClassStories = {
  "99th Degree Stonecutter": { key: 'class-stonecutter', title: 'The Hundredth Degree',
    setup: 'The lodge of the Stonecutters has a hundredth degree, and you are one short. Pass the final initiation.',
    ending: [
      'You arrive at the lodge in {kingdom}, in the ceremonial robe and the ceremonial paddle.',
      'The elders reveal the hundredth degree: you must sing the secret song.',
      'You sing it. You are not allowed to tell anyone the words.',
      'You are promoted, and given a parking space and a stone tablet.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Learn the secret handshake', 'Cut a stone, ceremonially', 'Keep the lodge’s secrets specifically from {guy}', 'Pay your lodge dues'] },

  "Barbarian Pretzel": { key: 'class-pretzel', title: 'The Twist',
    setup: 'Your barbarian clan prizes strength, and you are made of dough. Prove you are the toughest snack in {kingdom}.',
    ending: [
      'You challenge the clan champion, {nemesis}.',
      '*fight*',
      'You twist yourself into a knot they cannot untie. They give up.',
      'You are salted and named chieftain. Mustard is optional.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Bake yourself harder', 'Add more salt', 'Bend into an intimidating shape', 'Hide from someone holding mustard'] },

  "Big Bad Voodoo Daddy": { key: 'class-voodoo', title: 'The Swing Revival',
    setup: 'Your voodoo is fading because nobody in {kingdom} swing-dances anymore. Bring back swing.',
    ending: [
      'You open a dance hall in {kingdom}.',
      'The kids are skeptical. Then the horns kick in.',
      'You hex everyone’s feet. They cannot stop dancing.',
      'Technically this is a curse, but everyone is having a great time.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Make a little doll of {guy}', 'Learn the jitterbug', 'Find a zoot suit', 'Book a horn section'] },

  "Blood-Sucking Lunatic": { key: 'class-lunatic', title: 'The Blood Drive',
    setup: 'The blood bank of {kingdom} is running low, and everyone knows why. Pay it back before they ban you.',
    ending: [
      'You organize a blood drive. Turnout is suspicious.',
      'Everyone who shows up already looks pale.',
      'You promise not to drink anything. You drink something.',
      '{guy} bans you anyway. You leave a thank-you card, in red ink.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Avoid garlic bread night', 'Donate blood (someone else’s)', 'Check your reflection, just in case', 'Bite {nemesis}, for science'] },

  "Boston Cream Strangler": { key: 'class-strangler', title: 'The Custard Caper',
    setup: 'Someone has been squeezing the filling out of every donut in {kingdom}. It was you. Clear your name, or at least your fingerprints.',
    ending: [
      'Every bakery in {kingdom} is on alert. You are the prime suspect.',
      'Detective {guy} has your custard-covered fingerprints.',
      'You confess: you only ever wanted the filling.',
      'The judge, who also only wants the filling, lets you off with a warning.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Wipe the custard off your hands', 'Lie low at a bagel shop', 'Squeeze a donut for information', 'Get an alibi from {guy}'] },

  "Drug Healer": { key: 'class-healer', title: 'The Apothecary',
    setup: 'The apothecary of {kingdom} has been out of healing potions for weeks. You have a prescription pad and flexible ethics.',
    ending: [
      'You open a potion stand in {kingdom}.',
      'Insurance covers none of it. Except maybe the edibles.',
      'You heal {guy}, then send them the bill. Now they need healing again.',
      'The healers’ guild fines you. You bill them for a consultation.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Fill a prescription for {guy}', 'Argue with an insurance clerk', 'Read the side effects aloud, quickly', 'Restock your healing potions'] },

  "Drunken Forest Friar": { key: 'class-friar', title: 'The Lost Recipe',
    setup: 'Your abbey’s ale has gone sour, and your faith with it. Find the lost recipe of the old forest brewery.',
    ending: [
      'You find the ruins of the old brewery deep in the forest.',
      'The recipe is carved into a barrel, guarded by {nemesis}.',
      '*fight*',
      'You brew a fresh batch. Your faith returns, along with your double vision.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Taste-test the abbey ale', 'Say a prayer for the hops', 'Pick wild herbs in the forest', 'Find your way back to the abbey'] },

  "Electric Monk": { key: 'class-monk', title: 'True Believer',
    setup: 'You are an Electric Monk: you believe things so other people don’t have to. Right now you believe the Old Bastard™ is in {kingdom}.',
    ending: [
      'You arrive in {kingdom}, believing deeply in the significance of {boring}.',
      'You also believe the sky is pink and that {guy} is your best friend.',
      'Your belief circuits overload. You start believing in yourself.',
      'That is a malfunction. You reboot, and believe in the Old Bastard™ again.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Believe something unlikely', 'Charge your belief cells', 'Ride your horse to {kingdom}', 'Doubt nothing', 'Make sure your robe game is on point'] },

  "Erotical Illusionist": { key: 'class-illusionist', title: 'The Grand Illusion',
    setup: 'Your magic show in {kingdom} is famous for being steamy, mostly because of the fog machine. Pull off the greatest trick ever.',
    ending: [
      'You announce that you will make the Old Bastard™ disappear.',
      'The audience gasps. The curtain falls. The curtain rises. Other things rise as well.',
      'The Old Bastard™ is gone! He was never there. It is all very sensual.',
      'You still have to find the real one. Classic misdirection.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Practice a sultry card trick', 'Buy more fog', 'Saw {guy} in half', 'Hide a rabbit somewhere tasteful'] },

  "Fatal Flatulist": { key: 'class-flatulist', title: 'Silent But Deadly',
    setup: 'The assassins’ guild of {kingdom} calls your methods “unprofessional”. Prove them wrong with a silent kill.',
    ending: [
      'You slip into the palace of {nemesis}.',
      'You unleash your deadliest technique. It is completely silent.',
      'Guards faint. Paintings peel. {nemesis} falls.',
      'The guild lets you in, on the condition that you work outdoors.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Eat a dangerous amount of beans', 'Practice in an open field', 'Blame it on {guy}', 'Hold it in through an important meeting', 'Audtion for Sgt Poopers Lonely Farts Club Band'] },

  "Grimdark Double-Hell Slayer": { key: 'class-slayer', title: 'Hell, Again',
    setup: 'You have slain everything in one hell. Now there is a second one, and it is grimmer and darker.',
    ending: [
      'You descend into the second hell. It is mostly the same, in a darker font.',
      'The demons here are edgier. They have tattoos and elbow piercings. Their parents would not understand.',
      '{nemesis} rises from a lake of fire to face you as My Chemical Romance plays in the background.',
      '*fight*',
      'You win. The scenery stays grim. Your eyeliner stays perfect.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Sharpen your edgiest blade', 'Brood in the rain', 'Find a shade of black so dark you cannot share it with Anish Kapoor', 'Write a sad poem about hell'] },

  "Hamburglar": { key: 'class-hamburglar', title: 'The Heist',
    setup: 'Rumor says the royal kitchen of {kingdom} keeps the Ultimate Burger. It may or may be named Mayor McCheese. Steal and eat him.',
    ending: [
      'You sneak into the royal kitchen in your stripes and mask.',
      'The Ultimate Burger is in his Mayor office, guarded by {nemesis}.',
      '*fight*',
      'You escape with the burger and eat him in one bite. Crime pays, at least in calories. They can elect a new mayor.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Case the royal kitchen', 'Find a mask that fits', 'Steal a burger, for practice', 'Lose {guy} in a drive-thru'] },

  "Dark Starry Knight": { key: 'class-starry', title: 'The Antihero',
    setup: 'No one in {kingdom} can appreciate the pain in your moral ambiguity, or your Post-Impressionism',
    ending: [
      'The Sheriff of {kingdom} tells you to do morally questionable things. You are a Dark Knight.',
      'You have done and seen things in your past that people do not understand. An ear may have been involved.',
      'Though the kingdom of {kingdom} does like the color composition of your oil canvas.',
      'Will you come around to do the right thing in the end? Like a dandelion-star in a dark night?',
      'Or you can focus on vengeance on that Old Bastard™ from your vision.'],
    quests: ['Stare out an asylum window', 'Balance your dark palette with just a little light', 'Paint {nemesis} in a corner', 'Listen for that Old Bastard™ with your one ear'] },

  "Paperback Fighter": { key: 'class-paperback', title: 'The Sequel',
    setup: 'You are the hero of a cheap paperback, and the author has been stuck on chapter twelve for years. Write your way out.',
    ending: [
      'You find the author, {guy}, staring at a blank page.',
      'You suggest a dragon. They suggest a love triangle.',
      'You compromise: a love triangle with a dragon.',
      'The sequel is a bestseller in {kingdom}. Your shirt is off on the cover.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Get dog-eared', 'Win a fight with a bookmark', 'Read your own reviews', 'Find out how your story ends'] },

  "Paula Deen Paladin": { key: 'class-paladin', title: 'The Butter Crusade',
    setup: 'Your holy order teaches that butter is sacred. The heathens of {kingdom} cook with margarine. Convert them.',
    ending: [
      'You ride into {kingdom} with a cart full of butter.',
      'The margarine priests, led by {nemesis}, block the road.',
      '*fight*',
      'Victory! You deep-fry the victory feast. Everyone converts. Some need a cardiologist.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Bless a stick of butter', 'Fry something that should not be fried', 'Preach to {guy} about butter', 'Find more butter'] },

  "Pinball Wizard": { key: 'class-pinball', title: 'The Tournament',
    setup: 'The pinball champion of {kingdom} has never lost a game. Play them for the title.',
    ending: [
      'You step up to the machine. The crowd goes quiet.',
      '{nemesis} plays first and lights up every bumper.',
      'You play by feel alone. Flipper, flipper, nudge, tilt... no, saved it.',
      'You win by a hair. You are the new champion of {kingdom}.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Practice your flipper timing', 'Find more quarters', 'Nudge a machine without tilting it', 'Challenge {guy} to a game'] },

  "Sailor Rune": { key: 'class-sailor', title: 'The Transformation',
    setup: 'Your transformation sequence now takes forty minutes, and the monsters have stopped waiting for it. Speed it up.',
    ending: [
      'You face {nemesis} and begin your transformation.',
      'Sparkles. Ribbons. More sparkles. A magical pose in the shape of a rune.',
      '{nemesis} has gone home. You go fight them at their house.',
      '*fight*',
      'In the name of the rune, you win. Your outfit is perfect.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Practice your transformation pose', 'Buy more ribbons', 'Find your talking cat', 'Learn a shorter catchphrase', 'Impress Tuxedo Mask'] },

  "Shovel Knight": { key: 'class-shovel', title: 'The Dig',
    setup: 'Legend says the Old Bastard™’s treasure is buried somewhere under {kingdom}. You know what to do.',
    ending: [
      'You dig. And dig. And dig.',
      'You find an old {boring}, three bones, and {nemesis}, who was down there for some reason.',
      '*fight*',
      'The treasure chest holds gold and a note: “Not here. Love, the Old Bastard™.”',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Sharpen your shovel', 'Dig a hole', 'Fill in the hole', 'Bounce on {nemesis}’s head'] },

  "Sorcerer Supreme Pizza": { key: 'class-pizza', title: 'Thirty Minutes or Less',
    setup: 'A wizard in {kingdom} has ordered pizza. Deliver it in thirty minutes or less, or it’s free and the wizard curses you.',
    ending: [
      'You set off with a stack of hot pizzas.',
      'You cast Haste. You cast Keep Warm. You cast Haste again.',
      '{nemesis} and The Noid both try to steal a slice.',
      '*fight*',
      'You arrive in twenty-nine minutes. The wizard tips poorly. Classic wizard.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Toss some dough', 'Cast Extra Cheese', 'Find the address in {kingdom}', 'Deliver a pizza to {guy}', 'Stuff some crusts'] },

  "Stranger Ranger": { key: 'class-ranger', title: 'The Other Side',
    setup: 'A portal has opened in the woods outside {kingdom}, and everything on the other side is upside-down. Close it.',
    ending: [
      'You step through the portal. The trees grow down. The sky is underfoot.',
      'Your walkie-talkie only plays music from the 80s.',
      '{nemesis} waits in the dark.',
      '*fight*',
      'You close the portal with a well-timed power ballad. Spooky.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Ride your bike to the woods', 'Draw a map of the forest', 'String up holiday lights to talk to {guy}', 'Find out who went missing this week'] },

  "Stubborn Jackass": { key: 'class-jackass', title: 'The Bridge',
    setup: 'There is a bridge to {kingdom}, and you refuse to cross it. Everyone else refuses to let you go around.',
    ending: [
      'You stand at the bridge. You will not cross.',
      'Your friends push. You do not move.',
      'Your friends pull. You do not move.',
      '{guy} offers you a carrot. You cross at once. You did not want to, but: carrot.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Refuse to do something', 'Kick {guy}', 'Stand very, very still', 'Eat a carrot'] },

  "Super Show-off Saiyan": { key: 'class-saiyan', title: 'Power Level',
    setup: 'Your power level is not over nine thousand. Train in {kingdom} until it is.',
    ending: [
      'You train in {kingdom} under ten times normal gravity.',
      'You scream for an entire episode.',
      'Your hair turns gold. Everyone is very impressed, mainly you.',
      'You challenge {nemesis} to try out your new power.',
      '*fight*',
      'You win, and keep screaming for a few more episodes, just in case.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Scream for an hour', 'Do a thousand push-ups', 'Show off for {guy}', 'Measure your power level'] },

  "Thief Executive Officer": { key: 'class-teo', title: 'The Quarterly Report',
    setup: 'Shareholders demand that your thieves’ guild grow by twenty percent this quarter. Steal more, faster.',
    ending: [
      'You present the quarterly numbers to the board.',
      'Revenue is down. Pickpocketing is down. Morale is down.',
      'You steal from your own shareholders and report it as growth.',
      'The stock soars. You give yourself a bonus.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Synergize a heist', 'Lay off some henchmen', 'Pick the pocket of {guy}', 'Sit through a meeting that should have been an email'] },

  "United States Coast Bard": { key: 'class-bard', title: 'The Shanty',
    setup: 'The coast of {kingdom} is under threat, and the only weapon left is a sea shanty. You’ll have to write one.',
    ending: [
      'You sail out to face {nemesis}.',
      'You sing a shanty so catchy that the whole crew joins in.',
      'Even {nemesis} starts tapping a foot.',
      'You win without a fight. The shanty is stuck in every port’s head for a month.',
      'You resume your quest to go after that Old Bastard™ from your vision.'],
    quests: ['Write a shanty about {guy}', 'Patrol the coast', 'Learn the accordion', 'Rescue a stranded {boring}'] }
};

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

// Pick the story for a new Act: your race's for Act I, your class's for
// Act II, and after that one of K.Stories, avoiding the last few used
function NewStory(act) {
  var story = act == 1 ? K.RaceStories[Get(Traits,'Race')] :
              act == 2 ? K.ClassStories[Get(Traits,'Class')] : null;
  if (!story) {
    var recent = (game.storyLog || []).slice(-8).map(function (s) { return s.key; });
    var choices = K.Stories.filter(function (s) { return recent.indexOf(s.key) < 0; });
    if (!choices.length) choices = K.Stories;
    story = Pick(choices);
  }
  var vars = StoryVars();
  return {
    act: act,
    key: story.key,
    title: story.title,
    purpose: StoryText(story.setup, vars),
    vars: vars
  };
}

// Every story there is
function AllStories() {
  var all = K.Stories.slice();
  [K.RaceStories, K.ClassStories].forEach(function (book) {
    for (var name in book) all.push(book[name]);
  });
  return all;
}

function StoryTemplate(key) {
  var all = AllStories();
  for (var i = 0; i < all.length; ++i)
    if (all[i].key === key) return all[i];
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
  'hunt|Practice retro-active birth-control on {the-monsters} and unalive them.',
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

// ---- The finale -------------------------------------------------------------
//
// At level 50 (K.Boss.Level in combat.js) the hero finally tracks down the
// Old Bastard(TM) from the Prologue. Each list is played one line at a time
// and narrated. Story placeholders work here, plus {taunt} (his insult
// from the Prologue), {tries} (this attempt's number) and {hours} (time
// played).
//
//   approach  before the first fight
//   rematch   before each later one
//   victory   after beating him; the last line is followed by the choice to
//             retire to the Hall of Legends or keep playing
//   escape    after losing or running away; he will be back
K.FinaleStory = {
  approach: [
    'At long last, the trail of the Old Bastard™ leads to a damp cave outside {kingdom}',
    'He is exactly as old, and exactly as much of a bastard, as your dream promised',
    '“{taunt}” he sneers, just like he did all those levels ago',
    'You crack your knuckles. It is time to settle this'
  ],
  rematch: [
    'You pick up the Old Bastard™\'s trail again, this time near {kingdom}',
    '“{insult}” he wheezes. He is running out of material',
    'Round {tries}. Fight!'
  ],
  victory: [
    'The Old Bastard™ staggers, wheezes, and falls to his knees',
    '“You haven\'t seen the last of me,” he croaks. You have, actually',
    'Your quest to right this particular wrong is finally over',
    'Word of your victory spreads across the land. Bards start rhyming things with {hero}',
    'You could retire a legend. Or you could keep going, for the numbers'
  ],
  escape: [
    'The Old Bastard™ cackles and slips away through a door marked “Definitely Not An Exit”',
    'He looks a little older and a little slower every time he runs',
    'He will be back. You will be ready. Probably'
  ]
};


// ---- Obituaries (Hardcore) ------------------------------------------------------
//
// When a Hardcore hero dies, the Hall of the Fallen remembers their last
// words and an epitaph, picked from these. Placeholders: {hero}, {foe}
// (what killed them), {level}, {race}, {klass}, {boring}, {act}.
K.Obituary = {
  lastWords: [
    "{foe} doesn't look so tough. Watch this!",
	"I thought it would be bigger",
	"Not like this",
	"So that is what that feels like.",
	"My blood hurts.",
	"Oh Death, where is thy sting? Oh, there it is!",
	"To my family I leave my {boring} and massive debt.",
    "Tell my {boring} I loved it. My family, not so much.",
    "Hold my mead",
	"Film this. This will make great content!",
    "It's only a flesh wound",
    "Who leveled {foe} this high?",
    "Wait, this isn't the tutorial?",
    "I regret nothing. Except the last few minutes",
    "Did anyone else hear a death saving roll?",
    "Is it too late to switch to New Game?",
    "Don't let the Old Bastard™ win",
    "I was going to retire next week",
    "Avenge me. Or don't. I'm not your mom",
    "Put that on my tombstone. No, not that. Wait",
	"Do not try to cuddle (foe) on a cold night.",
	"I wonder if (foe) is ticklish.",
	"(foe) didn't tell me they added death to this game.",
	"(what killed them) is better than dying to the plague, like Carl.",
	"I hope to reincarnate with a better name than (hero).",
	"I thought (boring) was a 1-up mushroom!",
  ],
  epitaphs: [
    "They let the game play itself, and the game played them.",
    "Gone, but not forgotten until the browser cache is cleared.",
    "Level {level}. Not bad. Not 50, either.",
    "Killed by {foe}, who would like that noted.",
    "Fought bravely. Mostly.",
    "Died as they lived: idling.",
    "Rest in progress.",
    "Life Progress bar: 100%.",
    "Here lies a {race} {klass}. Mind the {boring}.",
	"Did anyone expect more from a {race} {klass}?",
	"For all their strengths, {race} {klass} are weak to dying. And cake.",
    "Survived the Prologue. Did not survive {act}.",
	"Will we remember their life, or (what killed them).",
	"The bards will remember (hero) for all the wrong reasons.",
	"Honestly, no one had high expectations for (hero).",
	"There is no tomb for (hero). (foe) ate them and shit them out.",
	"If you want a better epitaph, make it past level (level).",
	"They will be remembered as a hero amongst the (race). They have low standards.",
	"Maybe they should have trained harder at (klass) school.",
	"(hero) was a brave adventurer. Maybe not a great adventurer.",
	"(hero) gave their life for (boring). Don't ask why.",
	"(act) wasn't the end of the script, until it was.",
  ]
};
