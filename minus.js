// New Game−: New Game+, but worse. On purpose.
//
// Unlocked with New Game+ (a hero retired to the Hall of Legends), from its
// own button in the main menu. Where a New Game+ hero inherits a bonus from
// every race and class in the Hall, a New Game− hero inherits the same
// amount as a penalty (the legacy, backwards: game.legacy with curse: true
// and the bonus negative), and plays by harsher rules (K.Minus.Rules, a
// modifier like a perk's). It is also, relentlessly, a parody of a certain
// kind of grimdark game in which you die a lot and are told about it in
// large red letters: its own task captions, events (minus: true in
// K.Events), Scrollr posts, journal lines and finale, and a darker look
// (minus.css, body.ng-minus).
//
// game.mode is "minus". Loaded by main.html, index.html (the Codex lists
// the events), newguy.html (the curse), sim.js, replay.js and
// check-events.js, after events.js and gossip.js where they're loaded.

K.Minus = {
  Label: 'New Game−',
  // The legacy, backwards: this times the New Game+ bonus, taken away, but
  // never more than MaxCurse from an attribute (a full Hall is +45%; −45%
  // loses nine fights in ten, which is grim, but not fun)
  Penalty: 1,
  MaxCurse: 0.2,
  // ...and the rules (perk properties, see K.Perks in combat.js)
  Rules: { key: 'ngminus', label: 'New Game−', pro: '', con: 'Everything',
           takenMult: 1.2,    // monsters hit 20% harder
           damageMult: 0.9,   // you hit 10% softer
           goldMult: 0.8,     // loot sells for less (the merchant laughs)
           lossMult: 1.5,     // a defeat costs half again as much
           restMult: 1.15 },  // bonfires are slow

  // Task captions, swapped for one of these (MinusCaption in main.js; the
  // pick goes by the task count, so no dice are rolled)
  Captions: {
    'Heading to the Killing Fields™': [
      'Descending into the Killing Fields™, through a fog wall',
      'Returning to the Killing Fields™. Everything has respawned',
      'Trudging to the Killing Fields™ past a message reading “try despair”',
      'Walking to the Killing Fields™, sword dragging on the ground for effect'],
    'Heading to market to sell viscera-covered loot': [
      'Hauling viscera to a merchant who laughs too much',
      'Bartering with a hooded figure who only says “hehehe”',
      'Selling loot to a merchant chained to a wall. By choice',
      'Dragging your loot to the bonfire-adjacent market'],
    'Haggling over the price of better equipment': [
      'Haggling with a blacksmith who only upgrades things to +1',
      'Being upsold a rusted sword with “potential”',
      'Buying armor so heavy you will roll like a boulder'],
    'Catching your breath': [
      'Resting at a bonfire. Every monster respawns',
      'Sitting at a bonfire, staring into the middle distance',
      'Resting at a site of grace. It is not graceful',
      'Sipping from a flask that heals three HP, eventually']
  },
  // "Executing a Giant Orc" becomes "Getting parried by a Giant Orc"
  FightVerbs: ['Getting parried by', 'Dodge-rolling around', 'Being humbled by', 'Trading blows with',
               'Trying to backstab', 'Desperately two-handing your weapon at', 'Learning the patterns of'],
  // After a defeat, in place of being dragged to town and the temple
  Rescue: ['You wake at the last bonfire you rested at. It is cold',
           'You come to by a bonfire, a little more hollow than before',
           'You respawn. So does everything that just killed you'],
  Convalesce: ['Hollowing quietly at a bonfire', 'Staring at a bonfire, reconsidering everything',
               'Regaining humanity, one ember at a time']
};

// The Old Bastard™, New Game− edition (QueueFinale in main.js uses these in
// place of K.FinaleStory's). Placeholders as in K.FinaleStory.
K.MinusFinale = {
  approach: [
    'The trail of the Old Bastard™ ends at a fog wall outside {kingdom}',
    'Fresh footprints lead in ahead of yours, then a bloodstain. It is {rival}’s',
    'You step through the fog. A health bar the width of the sky fills in',
    '“{taunt}” he sneers, and begins his first phase',
    'You raise your shield. You never levelled Endurance. This will hurt'
  ],
  rematch: [
    'You return to the fog wall. Your own bloodstain waits outside it',
    '“{insult}” he wheezes. He has a new phase. Of course he does',
    '{rival} has left a message by the door: “try despair”',
    'Attempt {tries}. Your hands are sweating'
  ],
  victory: [
    'The Old Bastard™ staggers into his second phase, and then his third',
    'At last he falls. Across the sky, in large golden letters: OLD BASTARD FELLED',
    '{rival} limps in a minute too late. “I had him,” they say. They are hollow. They did not have him',
    '{raceending}',
    '{classending}',
    'The fire flickers. You could link it, or let it fade and keep playing in the dark',
    'Either way, there will be another New Game−. There is always another New Game−'
  ],
  escape: [
    'YOU DIED. Of course you did',
    'You wake at the last bonfire. The Old Bastard™ is back to full health. So is everything between here and him',
    '{rival} watches from behind a rock. They have died here too. Many times',
    'You will be back. You will die again. That is the whole game'
  ]
};

// Events only a New Game− hero sees (minus: true; see the top of events.js)
if (K.Events) K.Events = K.Events.concat([
  { key: 'm-bonfire', minus: true, where: ['rest'], weight: 2,
    lines: ['You find a bonfire. You sit. You stare into it for a long time',
            'Somewhere, every monster you ever killed gets back up',
            'You feel slightly less hollow'],
    effect: { heal: true } },

  { key: 'm-message', minus: true, where: ['road'], weight: 2,
    lines: ['A message glows on the ground: “try jumping”'],
    ask: 'Do you?',
    choices: [
      { label: 'Jump',
        lines: ['You jump. There is a ledge. There was always going to be a ledge',
                'At the bottom you land on {loot}. It was almost worth it'],
        effect: { item: 'boring', wounded: 1 } },
      { label: 'Rate the message “poor”',
        lines: ['Somewhere, a stranger feels a small, cold disappointment. You feel wonderful'],
        effect: { stat: 'WIS' } } ] },

  { key: 'm-chest', minus: true, where: ['field'], weight: 2,
    lines: ['You find a chest. You hit it first, just in case',
            'It was just a chest',
            'You feel paranoid, and also you have {loot}'],
    effect: { item: 'special' } },

  { key: 'm-mimic', minus: true, where: ['road'], weight: 2,
    lines: ['You find a chest. You open it',
            'The chest opens you',
            'You lose {gold} gold and most of your dignity, in that order'],
    effect: { gold: -1, wounded: 1 } },

  { key: 'm-sunbro', minus: true, where: ['road'], weight: 2,
    lines: ['A knight in a sun-painted tabard waves at you, arms raised',
            '“If only I could be so grossly incandescent,” he sighs, and walks with you for a while',
            'You praise the sun together. It is surprisingly motivating'],
    effect: { stat: 'random' } },

  { key: 'm-onion', minus: true, where: ['rest'], weight: 2,
    lines: ['A knight in round, onion-shaped armor sits by your fire, deep in thought',
            '“Hmm,” he says. “Hmmmm”',
            'He is still there in the morning. Hmm'],
    effect: { heal: true } },

  { key: 'm-shortcut', minus: true, where: ['road'], weight: 2,
    lines: ['A friendly, bald merchant offers to show you a shortcut',
            'He kicks you off a ledge',
            'Down here you find {gold} gold. Up there, he is laughing'],
    effect: { gold: 2, wounded: 1 } },

  { key: 'm-maidenless', minus: true, where: ['town'], weight: 2,
    lines: ['A hooded stranger in {kingdom} looks you up and down',
            '“Maidenless,” she says, and walks off',
            'Spite is a kind of motivation'],
    effect: { stat: 'CHA' } },

  { key: 'm-fogwall', minus: true, where: ['road'], weight: 1.5,
    lines: ['A wall of white fog blocks the path. Beyond it, something with a health bar across the whole sky'],
    ask: 'Go in?',
    choices: [
      { label: 'Go through the fog',
        lines: ['It is a very large dog with a sword in its mouth',
                'You win, eventually, once you learn its patterns. It takes a while. It takes several of you'],
        effect: { xp: 0.08, wounded: 2 } },
      { label: 'Summon help',
        lines: ['A man wearing nothing but a pot on his head answers your sign',
                '“Let me solo it,” he says. He does. You watch, and learn nothing'],
        effect: { xp: 0.04 } } ] },

  { key: 'm-hollow', minus: true, where: ['rest'], weight: 2,
    lines: ['You catch your reflection in a puddle',
            'You are looking a little hollow',
            'You eat a {boring}. You feel more human. Barely'],
    effect: { stat: 'CON' } },

  { key: 'm-gitgud', minus: true, where: ['field'], weight: 2,
    lines: ['A spectral voice whispers “git gud”',
            'You try. It is harder than it sounds',
            'You get, if not gud, then gudder'],
    effect: { xp: 0.03 } },

  { key: 'm-tshirt', minus: true, where: ['town'], weight: 2,
    lines: ['A stall in {kingdom} sells you a T-shirt: “I DIED, AND ALL I GOT WAS THIS T-SHIRT”',
            'It costs {gold} gold. You die in it twice that week'],
    effect: { gold: -1 } }
]);

// Scrollr (gossip.js), New Game− only: messages on the ground, a hollowed
// Sir Spreddit, and the news of each death
if (K.GossipPools) {
  K.GossipPools.omen = { who: 'message', lines: [
    "Liar ahead.", "Amazing chest ahead.", "Be wary of {monsters}.", "Try jumping.", "Praise the sun!",
    "Time for despair.", "Didn't expect {hero}.", "If only I had a {boring}…", "Visions of {boring}…",
    "Hidden path ahead.", "Still no {item}.", "Could this be {a-foe}?", "Seek {weapon}.", "Behold, {foe}!",
    "Hurrah for {hero}!", "Don't give up, skeleton!", "Nice {gear}.", "Gorgeous view ahead.",
    "Time for {a-klass}.", "Lots of thinking ahead.", "Be wary of right.", "Treasure ahead, but what's this?",
    "{race-one} ahead, therefore despair.", "Fort, night.", "Ahh, {boring}…"
  ] };
  K.GossipPools.grimRealm = { who: 'spreddit', lines: [
    "Sir Spreddit here, hollowed. The bell is cracked. The news is bad. The news is always bad now.",
    "Today's forecast: ash. Tomorrow: more ash. The weekend: an age of darkness.",
    "Reminder that the Old Bastard™ has a second phase. Everyone has a second phase now.",
    "Sir Spreddit died four hundred times this week, mostly to a dog.",
    "Realm update: the fire is fading. Sir Spreddit has been asked to stop saying 'the fire is fading'. The fire is fading.",
    "{hero} has been seen rolling everywhere instead of walking. Sir Spreddit has questions.",
    "Poll: is the Killing Fields™ an allegory for something? 51% yes, 49% too hollow to vote.",
    "The Sub-Spreddits report that every merchant has started saying 'hehehe'. Investigations continue.",
    "Sir Spreddit regrets to inform you that there is no lore. There are only item descriptions.",
    "Thou hast died. Sir Spreddit hast also died. Everyone hast died. It's that kind of realm now.",
    "The bonfires are a public service. Please stop sitting at them for nine hours.",
    "Breaking: a local knight has been saying 'hmmm' for three days. Considered stable."
  ] };
  K.GossipPools.youDied = { who: 'spreddit', lines: [
    "{hero} has died. Again. Sir Spreddit has stopped counting, but it's {deaths}.",
    "YOU DIED, {hero}. Sir Spreddit put it in big red letters this time, so it would sink in.",
    "{hero} died to {a-foe}. Leave a message where it happened: 'be wary of {foe}'.",
    "Bloodstain report: {hero}, again, in the Killing Fields™. Touch it to watch them die. Very educational.",
    "{hero} is back at the bonfire. The {foe} that did it is back at full health. Balance.",
    "Sir Spreddit's tip for {hero}: have you tried not dying? Sir Spreddit hasn't either."
  ] };
}

// The journal (journal.js), New Game− only
K.JournalMinusBegin = [
  "New Game−. They said it would be harder. They said it with a smile. Every legend in the Hall is cursing me, personally, and I can feel each one.",
  "This is a New Game−. I have checked, and there is no difficulty setting. There is only this."
];
K.JournalMinusAsides = [
  "Level {level}. My bones ache in a way that can only be described as 'lore'.",
  "Rested at a bonfire. Everything I killed today got back up. I did not want to.",
  "Read a message on the ground: 'try despair'. Took the advice.",
  "Another level. The Old Bastard™ probably has a second phase. Everyone does now.",
  "Died {deaths} times. Got back up {deaths} times. Kept the journal dry every time. Priorities.",
  "Someone left a message saying 'amazing chest ahead'. It was a mimic. It is always a mimic.",
  "The merchant laughed at me again. 'Hehehe.' I don't know what's funny. I never know what's funny.",
  "The legends of the Hall are cursing me. I can feel it, mostly in my {weapon} arm.",
  "Praise the sun. Or don't. It hasn't come out in weeks.",
  "Found an item. Read its description. Now I know the tragic history of a sock. I wish I didn't."
];
