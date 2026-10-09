// Random events: little scenes that happen now and then, and are narrated.
//
// Each event is an object:
//
//   key     a unique name
//   where   when it can happen, one or more of:
//             'rest'   while catching your breath
//             'road'   on arriving at the Killing Fields
//             'town'   on arriving at market
//             'field'  after winning a fight
//   weight  how likely it is compared to other events (default 1)
//   minLevel / maxLevel   optional level range
//   race / klass          optional: only for heroes of that race or class
//                         (exactly as in K.Races / K.Klasses). Every race
//                         and class has one event of its own, at the end.
//   lines   what happens, one task per line (each takes 3 seconds)
//   effect  what it does to you, applied after the last line (optional):
//             gold:    gold found (or, if negative, lost from your purse),
//                      in multiples of your level. {gold} in the lines
//                      says how much.
//             item:    'boring' or 'special': an item for your pack.
//                      {loot} in the lines names it.
//             stat:    'random' or one of the six core stats ('STR', 'CON',
//                      'DEX', 'INT', 'WIS', 'CHA'): a temporary buff, see
//                      K.BuffMinutes and K.BuffPercent below
//             spell:   true: learn a spell (or level one up)
//             equip:   true: a piece of gear a little above your level
//             heal:    true: full HP and MP
//             wounded: number of fights spent Wounded
//             xp:      share of the way to the next level (0.1 = 10%)
//
// Choice events also have:
//
//   ask      the question, asked after the lines ('What do you do?')
//   choices  2 or 3 options, each { label, lines, effect }: the label is
//            the button, the lines play after it is picked, the effect is
//            applied with the event's own (if any). {gold} and {loot} in an
//            option mean that option's amounts.
//
// The player has K.ChoiceSeconds to pick (buttons, or keys 1-3); after that
// fate picks one at random. Keep choice events uncommon: the game is
// supposed to play itself.
//
// Lines can use the story placeholders ({guy}, {kingdom}, {nemesis},
// {boring}, {item}, {race}, {klass}, {insult}, {hero}...; see story.js),
// plus {gold} and {loot} above. They are filled in when the event starts.
//
// Depends on config.js and story.js. Uses functions from main.js.

// How often events happen: the chance at each opportunity, and the least
// number of tasks between two events.
K.EventChance = { rest: 0.25, road: 0.12, town: 0.12, field: 0.01 };
K.EventCooldown = 80;

// Stat events are temporary buffs, not permanent gains: the stat is raised
// by K.BuffPercent of what a typical character of your level has (so it
// matters at level 5 and at level 45), for K.BuffMinutes of game time. The
// same stat again just refreshes the timer; different stats stack. A buff
// counts in fights, prices and drops, resting and recovery, but not for
// carrying capacity or for what a level-up or a new spell is based on.
K.BuffMinutes = 10;
K.BuffPercent = 0.25;

// How long the event pop-up stays open once the event is over (seconds).
K.EventPopupLinger = 12;

// How long a choice waits for the player before fate picks (seconds).
K.ChoiceSeconds = 20;

K.Events = [
  { key: 'snoring', where: ['rest'],
    lines: ['While you rest, a {race-one} sits down next to you and starts snoring',
            'You wake up an hour later. The {race-one} is gone.',
			'So is their snoring, thankfully. So is some of your gold.'],
    effect: { heal: true, gold: -1 } },

  { key: 'campfire', where: ['rest'],
    lines: ['You share a campfire with a wandering {klass}',
			'They also have sworn vengeance against Old Bastard™',
            'They teach you a trick that 60% of the time, it works every time'],
    effect: { spell: true } },

  { key: 'dreamtaunt', where: ['rest'], weight: 1,
    lines: ['You doze off. The Old Bastard™ appears in your dreams again',
            '“{insult}” he says, and then he steals your {boring}',
            'You wake up furious, and somehow tougher'],
    effect: { stat: 'CON', gold: -1 } },

  { key: 'squirrel', where: ['rest'],
    lines: ['A squirrel brings you {loot}',
            'You do not ask where it got it',
			'That squirrel scares you.'],
    effect: { item: 'special' } },

  { key: 'stretch', where: ['rest'], weight: 0.5,
    lines: ['You do some stretches. A {race-one} points out you are doing them wrong',
            'You do them right. Huh',
			'You are less bad at stretching.'],
    effect: { stat: 'DEX' } },

  { key: 'pigeons', where: ['rest'], weight: 0.5,
    lines: ['You read a self-help scroll titled "Who Moved My {boring}?"',
            'It changes your life, slightly',
			'You are wise enough not to harass everyone about the book.'],
    effect: { stat: 'WIS' } },

  { key: 'tollbridge', where: ['road'],
    lines: ['A bridge troll demands a toll of {gold} gold',
            'There is no river. You are not sure why this ia bridge.',
			'The troll may have brought a portable bridge. You pay anyway'],
    effect: { gold: -2 } },

  { key: 'wallet', where: ['road'],
    lines: ['You find a coin purse on the road with {gold} gold in it',
            'There is a name on it: {guy}. You decide that is a common name',
			'Common else it is close to yours and you can take it.'],
    effect: { gold: 3 } },

  { key: 'peddler', where: ['road'],
    lines: ['A peddler sells you {loot}',
            'He swears it is enchanted. It is not',
            'It is, however, very shiny'],
    effect: { item: 'special' } },

  { key: 'shortcut', where: ['road'],
    lines: ['You take a shortcut through {kingdom}',
            'It is not a shortcut',
            'You do learn a lot about {kingdom}, though'],
    effect: { xp: 0.05 } },

  { key: 'ambushfail', where: ['road'],
    lines: ['Bandits ambush you on the road',
            'They recognize you and apologize',
            'They give you {loot} as a peace offering'],
    effect: { item: 'boring' } },

  { key: 'pothole', where: ['road'],
    lines: ['You step in a pothole the size of a {race-one}',
            'You file a complaint with {kingdom}. Your ankle files one too',
			'They do not pay out your workers comp claim.'],
    effect: { wounded: 1 } },

  { key: 'blacksmith', where: ['town'],
    lines: ['The blacksmith is having a going-out-of-business sale',
            'She has been having it for nine years',
            'You get a great deal anyway'],
    effect: { equip: true } },

  { key: 'parkingticket', where: ['town'],
    lines: ['You find a parking ticket on your horse',
			'They threaten to tow your horse.',
            'You do not have a horse. You pay the {gold} gold anyway'],
    effect: { gold: -2 } },

  { key: 'fan', where: ['town'], weight: 0.5,
    lines: ['A fan recognizes you in the market',
            '“Are you {hero}? My kid loves you”',
            'You sign their {boring} and feel great about yourself'],
    effect: { stat: 'CHA' } },

  { key: 'gym', where: ['town'], weight: 0.5, minLevel: 3,
    lines: ['A personal trainer in town offers you a free trial session',
            'Do you even lift bro?',
			'You do and get stronger.'],
    effect: { stat: 'STR' } },

  { key: 'library', where: ['town'], weight: 0.5,
    lines: ['You return an overdue {boring} to the library',
            'The librarian waives the fine and recommends a book on {kingdom}',
            'You read it. Mostly the pictures'],
    effect: { stat: 'INT' } },

  { key: 'lottery', where: ['town'], weight: 0.5,
    lines: ['You buy a lottery ticket from a shifty {klass}',
            'You win {gold} gold!',
            'The {klass} looks as surprised as you are'],
    effect: { gold: 12 } },

  { key: 'pickpocket', where: ['town'],
    lines: ['Someone bumps into you in the crowd and apologizes',
            'Later you notice your purse is {gold} gold lighter',
			'But your encumbrance is slighly lower. Small victories.'],
    effect: { gold: -3 } },

  { key: 'souvenir', where: ['field'],
    lines: ['Among the remains of your last fight you find {loot}',
			'And a spleen from your last kill.',
            'Both are still warm'],
    effect: { item: 'special' } },

  { key: 'heckler', where: ['field'],
    lines: ['A heckler from {kingdom} watched the whole fight',
            '“You call that a fight?”',
            'You take some notes, grudgingly'],
    effect: { xp: 0.03 } },

  { key: 'nemesiscameo', where: ['field', 'road'], weight: 0.5, minLevel: 5,
    lines: ['In the distance you spot {nemesis}, watching you',
            'They wave. You wave back. It is awkward',
            'You resolve to train harder'],
    effect: { stat: 'random' } },

  { key: 'oldbastardsighting', where: ['road', 'town', 'rest'], weight: 0.5,
    lines: ['Wait. Was that the Old Bastard™, ducking into an alley?',
            'You give chase ready for vengenace!',
            'It was a coat rack. The Old Bastard™ remains at large'] },

  { key: 'hotsprings', where: ['rest'],
    lines: ['You stumble upon a hidden hot spring in the wilderness',
            'A local {race-one} is already bathing, wearing only socks',
            'You avert your eyes, but the mineral steam revitalizes you completely'],
    effect: { heal: true } },

  { key: 'travelingsnack', where: ['rest'],
    lines: ['A wandering chef from {kingdom} shares mystery stew from their pot',
            'You discover {loot} bobbing at the bottom of your bowl',
            'You politely pocket it without asking questions'],
    effect: { item: 'boring' } },

  { key: 'mysticgraffiti', where: ['rest'], weight: 0.5,
    lines: ['You study ancient runic graffiti carved into a campsite boulder',
            'It translates to an incredibly foul insult aimed at {guy}',
            'You decipher a surprisingly functional defensive charm hidden in the phrasing'],
    effect: { spell: true } },

  { key: 'speedtrap', where: ['road'],
    lines: ['A highway constable steps out from behind a shrub in {kingdom}',
            'They clock your walking pace at an illegal 4 miles per hour',
            'You forfeit {gold} gold to settle the municipal citation on the spot'],
    effect: { gold: -2 } },

  { key: 'abandonedcart', where: ['road'],
    lines: ['You come across an overturned supply wagon on the Oregon Trail',
            'The cargo is mostly spilled turnip mash, but you uncover {loot}',
            'Finders keepers, according to common law'],
    effect: { item: 'special' } },

  { key: 'distractedgazing', where: ['road'],
    lines: ['You become thoroughly captivated by a picturesque cloud shaped like {guy}',
            'You wander off the marked trail and plunge straight into a briar thicket',
            'Extricating yourself requires painful surgical extraction of thorns'],
    effect: { wounded: 1 } },

  { key: 'potholeloot', where: ['road'],
    lines: ['You kick a suspicious mud clod out of boredom on the trek',
            'It disintegrates to reveal a pouch containing {gold} gold',
            'The road provides, even when the highway department does not'],
    effect: { gold: 4 } },

  { key: 'infomercial', where: ['town'],
    lines: ['A street barker in the plaza corner demonstrates a miraculous miracle cure',
            'Mesmerized by their charismatic patter, you purchase {loot}',
            'You realize too late it is neither enchanted nor dishwasher-safe'],
    effect: { item: 'boring' } },

  { key: 'donationplate', where: ['town'],
    lines: ['An aggressive acolyte rattles a collection tin for the Shrine of Saint {guy}',
            'They make prolonged, unblinking eye contact with you across the square',
            'You shame-deposit {gold} gold into the cup to escape the awkwardness'],
    effect: { gold: -1 } },

  { key: 'thriftstore', where: ['town'], weight: 0.5,
    lines: ['You dig through the donation bin outside a temple second-hand boutique',
            'Buried underneath discarded tunics, you unearth a remarkably sturdy relic',
            'The volunteers let you take it for a nickel'],
    effect: { equip: true } },

  { key: 'tipjar', where: ['town'],
    lines: ['You attempt to toss a copper coin into a tavern tip jar from across the room',
            'It misses, ricochets off a chandelier, and knocks a loose tile from the ceiling',
            'A concealed stash of {gold} gold drops directly into your outstretched palm'],
    effect: { gold: 8 } },

  { key: 'lootgolem', where: ['field'],
    lines: ['While scouring the battlefield, you pry apart the vanquished monster’s jaws',
            'Lodged firmly in its molars is an intact piece of superior gear',
            'You vigorously wipe off the salivary enzymes and equip it immediately'],
    effect: { equip: true } },

  { key: 'spellsurprise', where: ['field'], weight: 0.5,
    lines: ['The slain creature dissolves into a shimmering cloud of particulate sparkle',
            'You accidentally inhale the residue and sneeze violently',
            'A brand-new magical incantation permanently etches itself into your consciousness'],
    effect: { spell: true } },

  { key: 'overkillnotes', where: ['field'],
    lines: ['You inspect the aftermath of your ferocious final combination blow',
            'You realize your weapon trajectory was mechanically flawless',
            'That battle efficiency provides a profound surge of martial experience'],
    effect: { xp: 0.08 } },

  { key: 'treasurecorpse', where: ['field'],
    lines: ['You give the vanquished foe a routine post-mortem boot nudge',
            'A false compartment inside its collar pops open, dropping {loot}',
            'It looks exceptionally gaudy'],
    effect: { item: 'special' } },

  { key: 'subscription', where: ['road'],
    lines: ['{guy} hands you a delivery and collects 5 gold from you.',
            'You forgot to cancel your subscription to {boring} of the month club.',
            'You never remember to cancel it when you are in town.'],
    effect: { gold: -5 } },

  // ---- Choice events ----------------------------------------------------------

  { key: 'sitcom', where: ['rest'],
    lines: ['You rest in a tavern where a bard is performing stand-up',
            'The bard does ten minutes on {race}. It is a little problematic'],
    ask: 'How do you react?',
    choices: [
      { label: 'You laugh',
        lines: ['You feel guilty laughing about {race-one}', 'But laughter is also the best medicine.'],
        effect: { heal: true  } },
      { label: 'Refuse to laugh and silently grumble',
	  lines: ['You spent money on entertainment and did not enjoy it. You lose {gold} gold.'],
        effect: { gold: -1 } },
      { label: 'Heckle the comedian',
        lines: ['Everyone loves a good joke, but you should not punch down.', 'A {race-one} in the audience appreciates that you spoke up.', 'They give you {gold} gold after the show.'],
        effect: { gold: 1, stat: 'WIS' } } ] },

  { key: 'crossroads', where: ['road'],
    lines: ['You reach a fork in the road',
            'A signpost points both ways. Both arrows say “Adventure”'],
    ask: 'Which way?',
    choices: [
      { label: 'Take the left path',
        lines: ['The left path winds through {kingdom}', 'You learn a thing or two on the way'],
        effect: { xp: 0.05 } },
      { label: 'Take the right path',
        lines: ['The right path leads past an abandoned camp', 'Someone left {loot} behind'],
        effect: { item: 'special' } },
      { label: 'Ask for directions',
        lines: ['Nobody knows the way. Everybody has an opinion', 'A {race-one} sells you a map for {gold} gold. It is a drawing of a duck'],
        effect: { gold: -1 } } ] },

  { key: 'mysterybox', where: ['town'],
    lines: ['A hooded merchant offers you a mystery box for {gold} gold',
            '“Could be anything,” he says. “Mostly it could be a box”'],
    ask: 'Buy the box?',
    choices: [
      { label: 'Buy it',
        lines: ['You pay {gold} gold and open the box', 'Inside is {loot}. And some packing peanuts'],
        effect: { gold: -3, item: 'special' } },
      { label: 'Haggle',
        lines: ['You haggle him down to {gold} gold', 'Inside is {loot}. You get what you pay for'],
        effect: { gold: -1, item: 'boring' } },
      { label: 'Walk away',
        lines: ['You walk away', 'You will always wonder what was in the box'] } ] },

  { key: 'woundedstranger', where: ['road'],
    lines: ['A wounded {race-one} lies by the road, moaning theatrically',
            '“Help,” they say. “Or don\'t. I\'m not your mom”'],
    ask: 'What do you do?',
    choices: [
      { label: 'Help them',
        lines: ['You patch them up as best you can', 'They teach you a trick before limping off'],
        effect: { spell: true } },
      { label: 'Rob them',
        lines: ['You take {gold} gold from their pockets', 'They were faking. Karma trips you on the way out'],
        effect: { gold: 3, wounded: 2 } },
      { label: 'Walk on by',
        lines: ['You walk on by', 'Somewhere, a bard writes a song about you. It is not flattering'] } ] },

  { key: 'shrine', where: ['rest'],
    lines: ['You find a shrine to a god you have never heard of',
            'The plaque says “Saint {guy}, Patron of Mild Inconveniences”'],
    ask: 'What do you do at the shrine?',
    choices: [
      { label: 'Pray',
        lines: ['You pray for a bit', 'You feel watched over, if not exactly helped'],
        effect: { stat: 'random' } },
      { label: 'Leave an offering',
        lines: ['You leave {gold} gold on the altar', 'A warm glow washes over you. It might be the sun'],
        effect: { gold: -2, heal: true } },
      { label: 'Take the offerings',
        lines: ['You pocket {gold} gold from the altar', 'Saint {guy} sends a mild inconvenience your way'],
        effect: { gold: 4, wounded: 1 } } ] },

  { key: 'pitfight', where: ['town'], minLevel: 3,
    lines: ['A pit fighter in the market challenges anyone to a bout',
            '“I will even let you hit me first,” they say, flexing'],
    ask: 'Accept the challenge?',
    choices: [
      { label: 'Fight',
        lines: ['You fight. You lose, but you learn', 'The crowd respects you, a little'],
        effect: { xp: 0.06, wounded: 1 } },
      { label: 'Bet on the pit fighter',
        lines: ['You bet against yourself, which is allowed', 'The pit fighter wins on a forfeit. You collect {gold} gold'],
        effect: { gold: 3 } },
      { label: 'Decline politely',
        lines: ['You decline politely', 'The crowd boos. Your dignity remains mostly intact'] } ] },

  { key: 'hatemail', where: ['rest'],
    lines: ['A letter arrives from the Old Bastard™',
            'It reads, in its entirety: “{insult}”'],
    ask: 'What do you do with the letter?',
    choices: [
      { label: 'Write a scathing reply',
        lines: ['You write a reply so scathing it singes the parchment', 'You feel great about yourself'],
        effect: { stat: 'CHA' } },
      { label: 'Burn it',
        lines: ['You burn the letter and warm your hands on it', 'Petty, but cozy'],
        effect: { heal: true } },
      { label: 'Frame it',
        lines: ['You frame the letter', 'It is a conversation piece. You carry it everywhere. It weighs a ton'],
        effect: { item: 'boring' } } ] },

  { key: 'dragonegg', where: ['field'], minLevel: 8,
    lines: ['Behind the fallen monster you find an egg the size of a {race-one}'],
    ask: 'What do you do with the egg?',
    choices: [
      { label: 'Make an omelette',
        lines: ['It is the best omelette of your life', 'It serves forty. You eat it all'],
        effect: { heal: true } },
      { label: 'Sell it',
        lines: ['A collector pays {gold} gold for it, no questions asked', 'You ask some questions anyway. He leaves'],
        effect: { gold: 6 } },
      { label: 'Hatch it',
        lines: ['You keep the egg warm. It hatches', 'It is a very large chicken. It imprints on you, then on a rock', 'You learn a lot about responsibility'],
        effect: { xp: 0.05 } } ] },

  { key: 'onering', where: ['road', 'field'],
    lines: ['You spot a golden band glistening in the dirt',
            'A gaunt {race-one} slinks through the brush whispering: “My preciousss {boring}!”'],
    ask: 'What do you do with the ring?',
    choices: [
      { label: 'Slip it on your finger',
        lines: ['You vanish from sight, but a colossal flaming eyeball stares unblinkingly into your soul',
                'The psychic dread gives you a migraine'],
        effect: { wounded: 1, xp: 0.05 } },
      { label: 'Toss it into your campfire',
        lines: ['Fiery runes glow on the band: “MADE IN {kingdom}”',
                'It melts down into a lump of raw scrap worth {gold} gold'],
        effect: { gold: 3 } },
      { label: 'Trade it to the creature',
        lines: ['The creature gurgles in ecstasy, hugs the ring, and tosses you {loot} in exchange',
                'It scampers off into the fog before you can change your mind'],
        effect: { item: 'special' } } ] },

  { key: 'gwentaddict', where: ['town', 'rest'],
    lines: ['A gravelly-voiced mutant with two swords sits by the tavern fire',
            '“Tavern is burning, village is under siege,” he grunts. “How about a round of cards?”'],
    ask: 'Play cards with the mutant?',
    choices: [
      { label: 'Play a round of cards',
        lines: ['You drop your deck on the table and get obliterated by three spy cards',
                'You forfeit {gold} gold, but he leaves behind {loot} out of pity'],
        effect: { gold: -2, item: 'special' } },
      { label: 'Toss a coin to his bard',
        lines: ['You toss {gold} gold at his bard companion so he will stop singing that song',
                'Blessed silence washes over the room, soothing your soul'],
        effect: { gold: -1, heal: true } },
      { label: 'Ask about local contracts',
        lines: ['He mutters “Wind’s howling” and gives you a 40-minute lecture on herb gathering',
                'You emerge considerably wiser about wilderness survival'],
        effect: { stat: 'WIS' } } ] },

  { key: 'excalibur', where: ['road', 'rest'],
    lines: ['An ancient broadsword is wedged hilt-deep into an anvil atop a boulder',
            'A plaque reads: “Whoso pulleth this blade is rightwise sovereign of {kingdom}”'],
    ask: 'How do you claim the blade?',
    choices: [
      { label: 'Heave with all your might',
        lines: ['You plant your boots and pull until your veins throb',
                'The hilt snaps clean off in your hands. Free upper-body workout, at least'],
        effect: { stat: 'STR' } },
      { label: 'Lubricate the crevice',
        lines: ['You douse the crevice in goose grease and gently slide the pristine relic out',
                'All hail the rightful monarch!'],
        effect: { equip: true } },
      { label: 'Consult the watery tart',
        lines: ['A strange woman in a nearby pond rants about how swords are no basis for government',
                'You fish {loot} out of the reeds while she argues with herself'],
        effect: { item: 'boring' } } ] },

  { key: 'merrymen', where: ['road'],
    lines: ['Archers in green spandex drop from the canopy, whistling jaunty tunes',
            '“We rob from the rich and give to the poor!” their dashing leader boasts'],
    ask: 'How do you deal with the outlaws?',
    choices: [
      { label: 'Claim to be destitute',
        lines: ['You turn out your empty pockets and shed a dramatic tear',
                'The bandit leader apologizes, hugs you, and slips {gold} gold into your pouch'],
        effect: { gold: 3 } },
      { label: 'Join their chorus line',
        lines: ['You split a nearby tree with an arrow and break into a jaunty tap dance',
                'The outlaws applaud in four-part harmony. Your agility improves'],
        effect: { stat: 'DEX' } },
      { label: 'Bribe Friar {guy}',
        lines: ['You hand {gold} gold to their hefty chaplain',
                'He blesses your weapons with holy ale and an obscure fighting hymn'],
        effect: { gold: -2, spell: true } } ] },

  { key: 'crawlerbox', where: ['field', 'rest'],
    lines: ['A booming, sultry voice reverberates directly inside your skull',
            '“NEW ACHIEVEMENT! You survived another fight without dying! God, you make me sick. Here is your prize box.”'],
    ask: 'What do you do with the achievement box?',
    choices: [
      { label: 'Smash it open',
        lines: ['Glitter and confetti erupt everywhere! Inside lies {loot}',
                '“Don’t choke on it, crawler,” purrs the announcer'],
        effect: { item: 'special' } },
      { label: 'Show off your bare feet',
        lines: ['The AI groans in sensory ecstasy as you wriggle your dirty toes at the ceiling',
                'It showers you with an extra payout of {gold} gold for the spectacle'],
        effect: { gold: 5, stat: 'CHA' } },
      { label: 'Threaten the showrunners',
        lines: ['You flip off the invisible cameras and swear vengeance on the syndicate',
                'The audience goes wild for your defiant attitude'],
        effect: { xp: 0.08 } } ] },

  { key: 'divacat', where: ['town', 'rest'],
    lines: ['A fluffy tortoiseshell cat wearing a diamond tiara glares at you from a velvet cushion',
            '“CARL, WHO IS THIS SICKENING HOBO? THEY DON\'T EVEN HAVE AN AGENT!”'],
    ask: 'How do you greet the feline monarch?',
    choices: [
      { label: 'Bow and offer catnip',
        lines: ['Her Royal Highness sniffs the herb and condescends to grant you an audience',
                'Her magical purring completely restores your vitality'],
        effect: { heal: true } },
      { label: 'Compliment her tiara',
        lines: ['“FINALLY, SOMEONE WITH A MODICUM OF TASTE!” she trills',
                'She tosses you {loot} from her sponsor stash'],
        effect: { item: 'boring' } },
      { label: 'Attempt to rub her belly',
        lines: ['A critical mistake. Claws flash in a supersonic blur of fury',
                'You lose {gold} gold in veterinary damages and limp away bleeding'],
        effect: { gold: -2, wounded: 1 } } ] },

  { key: 'riddleofsteel', where: ['rest'],
    lines: ['A musclebound warrior with a square jaw stares into your campfire',
            '“Tell me, wanderer: what is best in life?” he grunts through clenched teeth'],
    ask: 'How do you answer the barbarian?',
    choices: [
      { label: 'Crush your enemies!',
        lines: ['“To see them driven before you, and hear the lamentations!” he roars',
                'The primal battle fervor pumps up your muscles'],
        effect: { stat: 'STR' } },
      { label: 'A warm bath and 8 hours of sleep',
        lines: ['He pauses, rubs his lower back, and sighs. “Honestly, yeah. My sciatica is killing me.”',
                'You share herbal tea and wake up completely rejuvenated'],
        effect: { heal: true } },
      { label: 'A hot bowl of stew and {loot}',
        lines: ['He grunts approvingly and trades you a keepsake from his pack',
                'To each their own, barbarian style'],
        effect: { item: 'special' } } ] },

  { key: 'reddinner', where: ['town', 'road'],
    lines: ['A messenger hands you an urgent wedding invitation from Lord {guy} of {kingdom}',
            'The tavern band outside the hall is visibly tuning crossbows instead of lutes'],
    ask: 'Do you attend the banquet?',
    choices: [
      { label: 'Attend and eat the bread',
        lines: ['The doors slam shut, the drums start pounding, and quarrels fly',
                'You dive under a banquet table, escaping with {loot} and several cuts'],
        effect: { item: 'boring', wounded: 1 } },
      { label: 'RSVP with regrets and send a gift',
        lines: ['You mail {gold} gold with a note explaining you have a prior engagement',
                'Staying home proves to be the wisest strategic decision of your career'],
        effect: { gold: -2, stat: 'WIS' } },
      { label: 'Raid the cloakroom outside',
        lines: ['While chaos unfolds inside, you quietly rifle through the entryway racks',
                'You slip away wearing an immaculate suit of armor'],
        effect: { equip: true } } ] },

  { key: 'talkinghat', where: ['town'],
    lines: ['A battered, sentient pointed hat in a curiosity shop falls onto your head',
            '“HMMM... NOT MUCH BRAINS... LOTS OF PENT-UP AGGRESSION... WHERE SHALL I PUT YOU?”'],
    ask: 'What do you say to the hat?',
    choices: [
      { label: 'Demand the hero house',
        lines: ['“VERY WELL! HOUSE GRIFF-N-DORK IT IS!” it screeches',
                'A shower of sparklers singes your scalp and imprints a new spell'],
        effect: { spell: true } },
      { label: 'Slip a bribe into the brim',
        lines: ['You discreetly tuck {gold} gold into its frayed hem',
                '“BETTER BE... SLIT-HER-INN!” it shouts, coughing up {loot} for you'],
        effect: { gold: -2, item: 'special' } },
      { label: 'Dropkick the hat',
        lines: ['You send the obnoxious headwear flying into an alleyway',
                'The local wizard nerds are horrified, but your swagger increases dramatically'],
        effect: { stat: 'CHA' } } ] },

  { key: 'wardrobe', where: ['town', 'rest'],
    lines: ['You push past a rack of smelly fur coats in the back of an abandoned wardrobe',
            'Suddenly you step into ankle-deep snow beside a solitary streetlamp in the woods',
            'A pale lady on a sleigh offers you a box of powdered gelatin candies'],
    ask: 'Do you take the Turkish Delight?',
    choices: [
      { label: 'Gorge on the candy',
        lines: ['You devour the sugary treats and instantly sell out your siblings',
                'Your belly is stuffed, but your moral fiber is compromised'],
        effect: { heal: true, gold: -1 } },
      { label: 'Consult the talking beaver',
        lines: ['A beaver wearing an apron warns you of an endless winter with no Christmas',
                'His blunt woodland wisdom broadens your perspective on the world'],
        effect: { stat: 'WIS' } },
      { label: 'Rifle through the fur coats',
        lines: ['You ignore the magical realm entirely and snatch a luxurious fur coat from the closet rack',
                'Staying warm never looked so fashionable'],
        effect: { equip: true } } ] },

  { key: 'cromprayers', where: ['road', 'rest'],
    lines: ['You scale a windswept mountain and prepare an offering to Crom, lord of the mound',
            'The northern gale howls. Crom does not care. Crom is probably laughing at your Four Winds'],
    ask: 'How do you pray to Crom?',
    choices: [
      { label: 'Beg for divine favor',
        lines: ['Crom hates whiners. A freak lightning bolt scorches your eyebrows for having the nerve to ask',
                'Surviving divine wrath builds immense character'],
        effect: { wounded: 1, xp: 0.06 } },
      { label: 'Curse him and flex',
        lines: ['“To hell with you, Crom!” you roar into the blizzard',
                'Crom respects your insolent defiance and blesses your biceps with pure iron'],
        effect: { stat: 'STR' } },
      { label: 'Loot the altar',
        lines: ['You swipe {gold} gold left behind by previous, deceased supplicants',
                'Crom approves of honest pillaging over weeping'],
        effect: { gold: 4 } } ] },

  { key: 'theluggage', where: ['road', 'town'],
    lines: ['A brass-bound chest made of sapient pearwood sprouts hundreds of tiny feet and scurries past',
            'A tall figure in a black cowl holding a scythe taps you on the shoulder',
            '“EXCUSE ME,” says a voice like tomb doors slamming. “HAVE YOU SEEN A TRUANT WIZARD?”'],
    ask: 'How do you address Death?',
    choices: [
      { label: 'Point him toward {kingdom}',
        lines: ['“THANK YOU. HAVE A CURRY,” says Death',
                'He vanishes with a faint chime, leaving behind {loot} on the pavement'],
        effect: { item: 'special' } },
      { label: 'Challenge him to a game',
        lines: ['You propose a game of chance. He insists on chess and checkmates you in three moves',
                'Losing to the anthropomorphic personification sharpens your mind'],
        effect: { stat: 'INT' } },
      { label: 'Kick the multi-legged chest',
        lines: ['The Luggage snaps shut on your greave, chews your sock, and spits you into a gutter',
                'You nurse a bruised ego and a throbbing shin'],
        effect: { wounded: 1, xp: 0.05 } } ] },

  { key: 'quickening', where: ['field', 'road'],
    lines: ['Lightning arcs violently across a wet parking lot as two duelists clash with katanas',
            'One head rolls! A blinding vortex of blue electricity and 80s arena rock engulfs the area!'],
    ask: 'What do you do during the Quickening?',
    choices: [
      { label: 'Channel the lightning',
        lines: ['Sparks course through your veins as blistering guitar solos shake the heavens',
                'THERE CAN BE ONLY ONE! Your constitution surges'],
        effect: { stat: 'CON', xp: 0.03 } },
      { label: 'Loot the fallen immortal',
        lines: ['While the victor writhes dramatically on the tarmac, you pickpocket {gold} gold and {loot}',
                'Immortality doesn\'t protect against petty larceny'],
        effect: { gold: 3, item: 'boring' } },
      { label: 'Complain about the asphalt damage',
        lines: ['You loudly demand to know who has the municipal permit to explode streetlamps',
                'Your stern municipal authority cows everyone in the vicinity'],
        effect: { stat: 'CHA' } } ] },

  { key: 'creepermine', where: ['field', 'rest'],
    lines: ['You duck into a cavern carved entirely out of rigid one-meter cubes',
            'From the shadows behind your back comes an ominous, rhythmic hiss: “Tssssssss...”'],
    ask: 'How do you react to the green creature?',
    choices: [
      { label: 'Dig straight down!',
        lines: ['Cardinal rule violated! You plunge through gravel into a pocket of magma',
                'You scramble out with singed boots, dropping {gold} gold into the lava'],
        effect: { gold: -2, wounded: 1 } },
      { label: 'Raise your shield!',
        lines: ['BOOM! The detonation blasts a crater in the stone, uncovering {loot} nestled in the dirt',
                'Your ears ring, but your loot collection grows'],
        effect: { item: 'special' } },
      { label: 'Punch a tree into planks',
        lines: ['You furiously punch an oak trunk until it turns into floating wooden blocks',
                'Calluses form over calluses, turning your fists into blunt weapons'],
        effect: { stat: 'STR' } } ] },

  { key: 'halfbloodpen', where: ['town', 'road'],
    lines: ['A scruffy kid in an orange Camp Half-Blood t-shirt drops a ballpoint pen at your feet',
            '“Don\'t uncap it!” he yells, sprinting away from an algebra teacher with leathery wings'],
    ask: 'What do you do with the pen?',
    choices: [
      { label: 'Uncap the pen',
        lines: ['SCHWING! It instantly springs into a three-foot bronze leaf blade',
                'The balance is immaculate, upgrading your frontline readiness'],
        effect: { equip: true } },
      { label: 'Eat the blue cookies in his bag',
        lines: ['You fish blue chocolate-chip cookies from his dropped knapsack',
                'They taste like seawater and fresh pastries, restoring your vigor completely'],
        effect: { heal: true } },
      { label: 'Distract the winged math teacher',
        lines: ['You lecture the bat monster on proper polynomial factoring until her head spins',
                'Applying pedagogical logic under duress elevates your intellect'],
        effect: { stat: 'INT' } } ] },

  { key: 'trainthedragon', where: ['road', 'rest'],
    lines: ['A jet-black reptile with feline pupils and a torn tail fin pins you against a boulder',
            'It retracts its teeth, sniffs your tunic, and stares hungrily at your belt pouch'],
    ask: 'How do you appease the beast?',
    choices: [
      { label: 'Feed it a raw fish',
        lines: ['It gulps down your travel trout, happily regurgitates half of it into your lap, and drops {loot}',
                'Gross, but oddly heartwarming'],
        effect: { item: 'boring', heal: true } },
      { label: 'Drop your weapon and hold out a hand',
        lines: ['You turn your head aside and extend an open palm',
                'Warm scales press against your fingers, awakening an instinctive bond with beasts'],
        effect: { stat: 'WIS' } },
      { label: 'Engineer a replacement tail fin',
        lines: ['You fashion a leather harness and steering linkage for its rear flank',
                'Fine-tuning the aerodynamics hones your manual dexterity'],
        effect: { stat: 'DEX' } } ] },

  { key: 'greywardenjoining', where: ['rest', 'town'],
    lines: ['A weary warrior in griffon regalia offers you an ornate chalice brimming with bubbling black ichor',
            '“Drink of the tainted blood,” Duncan intones solemnly. His beard is quite majestic.'],
    ask: 'Do you drink from the Joining chalice?',
    choices: [
      { label: 'Chug the tainted draught',
        lines: ['Violent convulsions rack your spine! You vomit purplish smoke, but emerge alive',
                'Your blood now curdles darkspawn on contact'],
        effect: { stat: 'CON' } },
      { label: 'Take a cautious sip',
        lines: ['You take a microscopic sip. Arcane static crackles across your nerve endings',
                'You unlock a forbidden combat spell from the collective blight'],
        effect: { spell: true } },
      { label: 'Dump the sludge and catch a Nug',
        lines: ['You pour the poison into a gutter and tackle a squealing pig-mole creature',
                'You fence the subterranean critter to a merchant for {gold} gold'],
        effect: { gold: 4 } } ] },

  { key: 'kenderpockets', where: ['town', 'road'],
    lines: ['A cheerful wanderer with a topknot and a hoopak staff bumps clumsily into your hip',
            '“Oh golly!” he beams. “Someone dropped this {boring} right into my pouch! Isn\'t that neat?”'],
    ask: 'How do you handle the Kender?',
    choices: [
      { label: 'Shake him upside down',
        lines: ['You hoist the thief by the ankles. Baubles, thimbles, and {gold} gold clatter to the ground',
                'Reclaiming stolen property is always profitable'],
        effect: { gold: 5 } },
      { label: 'Endure his family stories',
        lines: ['He traps you in a rambling, three-hour saga regarding Uncle Trapspringer',
                'You somehow decipher practical battlefield survival tactics from the yarn'],
        effect: { xp: 0.07 } },
      { label: 'Check his pale brother\'s spellbook',
        lines: ['A sickly mage with hourglass eyes glares at you and hurls an incantation to make you leave',
                'You memorize the formula as it singes your hair'],
        effect: { spell: true } } ] },

  { key: 'tonberryencounter', where: ['field', 'road'],
    lines: ['A knee-high creature in a brown burlap cowl waddles toward you at two inches per hour',
            'In one hand it swings an oil lantern; in the other, a small kitchen knife',
            'Its unblinking yellow eyes radiate quiet, unstoppable vengeance'],
    ask: 'What do you do as the Tonberry approaches?',
    choices: [
      { label: 'Back away slowly',
        lines: ['You match its agonizingly slow pace in reverse for forty minutes',
                'It eventually gets bored, snuffs its wick, and drops {loot} in the brush'],
        effect: { item: 'special' } },
      { label: 'Hit it with your heaviest strike',
        lines: ['DOINK! “Everyone\'s Grudge” discharges catastrophic karma into your ribs',
                'The psychic retribution takes several fights to walk off'],
        effect: { wounded: 2, xp: 0.08 } },
      { label: 'Toss it a Phoenix Down',
        lines: ['You toss a holy feather at the undead monstrosity',
                'It dissolves into white mist, leaving a velvet coin purse containing {gold} gold'],
        effect: { gold: 3 } } ] },

  { key: 'barovianmists', where: ['road', 'town'],
    lines: ['Suffocating violet mists roll across the cobblestones as a velvet-lined carriage halts',
            'A pale noble with immaculate fangs steps down. “Welcome. I am the Ancient. I am the Land.”'],
    ask: 'How do you respond to Count Strahd?',
    choices: [
      { label: 'Accept his castle dinner invitation',
        lines: ['You dine on roast peacock while phantom pipe organs play dramatic chords',
                'Mastering high-stakes aristocratic decorum sharpens your social graces'],
        effect: { stat: 'CHA' } },
      { label: 'Brandish a braided clove of garlic',
        lines: ['He wrinkles his aristocratic nose in disgust, retreats inside, and drops {loot}',
                'The smell is intolerable, but the victory is undeniable'],
        effect: { item: 'special' } },
      { label: 'Drive an ash stake into his heart',
        lines: ['You plunge the wood deep into his doublet. He explodes into a tempest of bats',
                'They shred your tunic, but you scavenge his discarded cloak clasp'],
        effect: { wounded: 1, equip: true } } ] },

  { key: 'virtuestest', where: ['town', 'rest'],
    lines: ['An eccentric fortune teller lays eight velvet tarot cards across her table',
            '“Seeker of Avatarhood,” she whispers. “If thou hadst but one loaf of bread, wouldst thou feed a beggar or throw it at Lord British?”'],
    ask: 'What is thy answer, Avatar?',
    choices: [
      { label: 'Throw the bread at Lord British',
        lines: ['A classic exploit! The invulnerable ruler collapses into a heap of ragdoll physics',
                'You swiftly loot the royal armory before the royal guards respawn'],
        effect: { equip: true } },
      { label: 'Embrace all Eight Virtues',
        lines: ['You pledge yourself to Compassion, Valor, and Humility',
                'A blinding column of white light purges every impurity from your flesh'],
        effect: { heal: true, stat: 'WIS' } },
      { label: 'Steal the gypsy\'s tarot deck',
        lines: ['Thou hast failed the trial of Honesty, but made off with {gold} gold from the pawn shop',
                'Avatarhood is overrated anyway'],
        effect: { gold: 4 } } ] },

  { key: 'leeroyrush', where: ['field', 'road'],
    lines: ['You coordinate a meticulous tactical ambush outside a cavern full of dragon whelps',
            'Suddenly an allied paladin bellows “LEEEEROY JENKINS!” and charges directly into the pit!'],
    ask: 'How do you handle the sudden chaos?',
    choices: [
      { label: 'Charge in after him!',
        lines: ['Hundreds of baby dragons swarm your greaves in a catastrophic melee!',
                'You barely crawl out alive, but the raw combat mayhem grants incredible experience'],
        effect: { wounded: 1, xp: 0.1 } },
      { label: 'Stick to the 32.33% survival plan',
        lines: ['You stay firmly in the hallway and eat a bucket of roasted chicken',
                'At least you have chicken. Your belly and health are completely restored'],
        effect: { heal: true } },
      { label: 'Loot him when he wipes',
        lines: ['While Leeroy is devoured by whelps, you quietly rifle through his backpack',
                'You recover {gold} gold and {loot} while the dragons finish their snack'],
        effect: { gold: 3, item: 'boring' } } ] },

  { key: 'potsmashing', where: ['town', 'road'],
    lines: ['You walk uninvited into a humble cottage in {kingdom}',
            'Twenty glossy ceramic pots are lined up neatly along the wall',
            'A solitary blue-feathered Cucco pecks quietly at grain in the corner'],
    ask: 'What do you do inside the home?',
    choices: [
      { label: 'Smash every single pot!',
        lines: ['CRASH! Shards fly in every direction as you roll across the carpet',
                'You sweep up green rubies, stray hearts, and {gold} gold from the rubble'],
        effect: { gold: 4 } },
      { label: 'Kick the chicken',
        lines: ['FATAL ERROR. An air-raid siren wails as an apocalyptic swarm of Cuccos dives from the sky',
                'You dodge frantically, tumbling through hedges to escape the feathered fury'],
        effect: { wounded: 2, stat: 'DEX' } },
      { label: 'Speak to the bearded hermit in the cellar',
        lines: ['An old hermit steps out from a hidden alcove and mutters: “IT\'S DANGEROUS TO GO ALONE! TAKE THIS.”',
                'He hands you an wrapped parcel containing {loot}'],
        effect: { item: 'special' } } ] },

  { key: 'visitor', where: ['field', 'road'],
    lines: ['You are traveling alone at night in the lonely fields of {kingdom}',
            'There is a bright light above in the night sky that you cannot explain',
            'An alien visitor descends who looks not entirely unlike a {race-one}'],
    ask: 'How do you react to this visitor?',
    choices: [
      { label: 'Offer it a present',
        lines: ['You offer up a {boring} and set it before the Visitor.',
                'It regards it fondly and gives you a gift in return.'],
        effect: { item: 'special' } },
      { label: 'Seduce the alien',
        lines: ['You interface in ways you did not know were possible.',
                'Do not question it. It just feels so right.'],
        effect: { heal: true, stat: 'CHA' } },
      { label: 'Kill and loot it like everything else',
        lines: ['The alien kicks your ass without breaking a sweat and then probes you for your insolence.',
                'You somewhat enjoy the probing and develop a new tolerance for pain'],
        effect: { wounded: 2, stat: 'CON' } } ] },
  // ---- One event for each race (race: ...) and each class (klass: ...) ----
  // They only happen to heroes of that race or class.

  { key: 'r-troll', race: '4chan Troll', where: ['rest'], weight: 4,
    lines: ['You sit down to rest and unroll a scroll titled “Reply Guy Weekly”',
            'Somebody in {kingdom} is wrong on the scroll',
            'You spend your whole rest arguing with them. You win, technically'],
    effect: { stat: 'INT' } },

  { key: 'r-awarewolf', race: 'Aware-Wolf', where: ['rest'], weight: 4,
    lines: ['The full moon rises while you rest',
            'You transform, fully aware, and politely ask everyone to stand back',
            'You spend the night chasing a {boring}. You will remember every second of it'],
    effect: { stat: 'STR' } },

  { key: 'r-canadian', race: 'Demi-Canadian', where: ['town'], weight: 4,
    lines: ['A stranger in {kingdom} bumps into you',
            'You both apologize. Then you apologize for apologizing',
            'This goes on for an hour. Neither of you can stop',
            'Eventually they hand you {gold} gold just to end it'],
    effect: { gold: 2 } },

  { key: 'r-wookiee', race: 'Double-Wookiee', where: ['road'], weight: 4,
    lines: ['Both halves of you smell something off the road',
            'The left half wants to go left. The right half wants to go right',
            'You split the difference and walk straight into a ditch',
            'In the ditch you find {loot}'],
    effect: { item: 'special' } },

  { key: 'r-baddragon', race: 'Double-sided Bad Dragon', where: ['field'], weight: 4,
    lines: ['After the fight you spot something shiny and phallic on the ground',
            'Both of your sides want it for the hoard',
            'You flip a coin. It lands on its edge',
            'You keep {loot}. Hoarding is about compromise'],
    effect: { item: 'boring' } },

  { key: 'r-chamberpot', race: 'Enchanted Talking Chamberpot', where: ['town'], weight: 4,
    lines: ['A noble in {kingdom} picks you up, mistaking you for a hat',
            'You decide to say nothing all afternoon',
            'You learn three state secrets and where {gold} gold is hidden'],
    effect: { gold: 3 } },

  { key: 'r-fanfic', race: 'Erotic Sonic Fan-Fic Abomination', where: ['rest'], weight: 4,
    lines: ['While you rest, a new chapter about you goes up',
            'It is nine thousand words long, and you do not run fast in any of them',
            'You read the reviews. Somehow, they fill you with confidence'],
    effect: { stat: 'CHA' } },

  { key: 'r-lich', race: 'Filthy Stinkin Lich', where: ['rest'], weight: 4,
    lines: ['You rest in a crypt. It smells like home',
            'A fellow lich drops by to compare phylacteries. Theirs is a mason jar',
            'You swap necromancy tips over a nice cup of embalming fluid'],
    effect: { spell: true } },

  { key: 'r-satyr', race: 'Goblin-Mode Satyr', where: ['town'], weight: 4,
    lines: ['A tavern in {kingdom} is having a bottomless brunch'],
    ask: 'Do you go full goblin mode?',
    choices: [
      { label: 'Go full goblin mode',
        lines: ['You wake up three days later on a roof', 'Up there with you is {loot}. Nobody knows how either of you got there'],
        effect: { item: 'special', wounded: 2 } },
      { label: 'Order a sensible salad',
        lines: ['You eat a salad. Nobody recognizes you', 'You feel well rested, and a little sad'],
        effect: { heal: true } } ] },

  { key: 'r-treant', race: 'High Treant', where: ['rest'], weight: 4,
    lines: ['You put down roots for a quick rest',
            'When you wake up, a family of squirrels has moved into your hair',
            'They pay their rent in acorns, which you sell for {gold} gold'],
    effect: { gold: 1 } },

  { key: 'r-hobbit', race: 'Hungry Hungry Hobbit', where: ['road'], weight: 4,
    lines: ['You smell a pie cooling on a windowsill',
            'Your feet carry you there without consulting you',
            'You leave a thank-you note and {gold} gold. It was worth every coin'],
    effect: { gold: -1, heal: true } },

  { key: 'r-carebear', race: 'I No Longer Care Bear', where: ['field'], weight: 4,
    lines: ['A child asks you to share some of your caring',
            'You look at them for a long time',
            'You shrug. The child shrugs. A bond forms anyway'],
    effect: { xp: 0.05 } },

  { key: 'r-hamster', race: 'Miniature Giant Space Hamster', where: ['rest'], weight: 4,
    lines: ['You find an empty exercise wheel at the inn',
            'You run on it all night. You get nowhere, but your legs look amazing'],
    effect: { stat: 'DEX' } },

  { key: 'r-pygmy', race: 'My Little Pygmy', where: ['town'], weight: 4,
    lines: ['A friendship parade marches through {kingdom}',
            'You are made grand marshal, because you are the smallest',
            'The crowd throws you {gold} gold and a great deal of glitter'],
    effect: { gold: 2 } },

  { key: 'r-nymph', race: 'Nympho Nymph', where: ['road'], weight: 4,
    lines: ['You pass a babbling brook',
            'It is flirting with you. You flirt back',
            'The brook gives you its number and a cool, refreshing drink'],
    effect: { heal: true } },

  { key: 'r-oompa', race: 'Odorous Oompa Loompa', where: ['town'], weight: 4,
    lines: ['A shopkeeper in {kingdom} gags as you walk in',
            'They offer you {gold} gold to shop somewhere else',
            'You take it, and sing a short song about hygiene on your way out'],
    effect: { gold: 2 } },

  { key: 'r-dwarf', race: 'Only Somewhat Racist Dwarf', where: ['town'], weight: 4,
    lines: ['An elf sits down next to you at the tavern'],
    ask: 'What do you say?',
    choices: [
      { label: 'Say hello, like a normal person',
        lines: ['You have a perfectly nice conversation', 'The elf buys you an ale. Growth!'],
        effect: { stat: 'CHA' } },
      { label: 'Say the thing your grandfather used to say',
        lines: ['The whole tavern goes quiet', 'A bouncer throws you out into the street, and the street agrees with the bouncer'],
        effect: { wounded: 2 } } ] },

  { key: 'r-pixie', race: 'Pixie Ironically with a Pixie-Cut', where: ['rest'], weight: 4,
    lines: ['You catch your reflection in a puddle',
            'Your haircut looks great. You hate that it looks great',
            'You feel ironically confident'],
    effect: { stat: 'CHA' } },

  { key: 'r-poultrygeist', race: 'Poultrygeist', where: ['road'], weight: 4,
    lines: ['You come to a road',
            'You feel an overwhelming urge to cross it',
            'You cross. You cross back. You cross again',
            'On the third crossing you find {loot}'],
    effect: { item: 'special' } },

  { key: 'r-centaur', race: 'Reverse-Centaur', where: ['road'], weight: 4,
    lines: ['A farmer tries to put a saddle on you',
            'You kick them, politely, with your human legs',
            'They apologize for the confusion and give you {gold} gold'],
    effect: { gold: 2 } },

  { key: 'r-sharkasaurus', race: 'Sharkasaurus', where: ['field'], weight: 4,
    lines: ['You smell blood in the water. Also, on the ground. You are on land',
            'You go into a feeding frenzy anyway',
            'You feel much stronger, and a little embarrassed'],
    effect: { stat: 'STR' } },

  { key: 'r-elf', race: 'Stupid Sexy Elf', where: ['town'], weight: 4,
    lines: ['A sculptor in {kingdom} asks you to pose',
            'You stand perfectly still for six hours. It is the most focused you have ever been',
            'They pay you {gold} gold. You try to spend it on the statue'],
    effect: { gold: 2 } },

  { key: 'r-cyberman', race: 'Thirsty Cyberman', where: ['road'], weight: 4,
    lines: ['You pass a fortune teller’s booth',
            'You ask if anyone will ever love you. The answer: YES, AFTER AN UPGRADE',
            'You install a firmware update by the roadside. You feel slightly more lovable'],
    effect: { stat: 'CHA' } },

  { key: 'r-gnome', race: 'Travelocity Gnome', where: ['road'], weight: 4,
    lines: ['You check into a roadside inn with a coupon',
            'The room is a cupboard, with a lovely view of another cupboard',
            'You still get your reward points: {gold} gold back'],
    effect: { gold: 1, heal: true } },

  { key: 'c-stonecutter', klass: '99th Degree Stonecutter', where: ['town'], weight: 4,
    lines: ['A man in {kingdom} gives you a secret handshake',
            'You give it back, with three extra fingers',
            'He gets you a reserved parking space and {gold} gold'],
    effect: { gold: 2 } },

  { key: 'c-pretzel', klass: 'Barbarian Pretzel', where: ['field'], weight: 4,
    lines: ['Your last opponent tried to untie you',
            'You were already in a knot. It gave up',
            'You eat its snacks while it sulks'],
    effect: { heal: true } },

  { key: 'c-voodoo', klass: 'Big Bad Voodoo Daddy', where: ['rest'], weight: 4,
    lines: ['You whittle a little doll while you rest',
            'It looks exactly like {nemesis}',
            'Somewhere far away, {nemesis} stubs a toe. You feel much better'],
    effect: { spell: true } },

  { key: 'c-lunatic', klass: 'Blood-Sucking Lunatic', where: ['field'], weight: 4,
    lines: ['After the fight you notice your opponent was carrying a blood bag',
            'Well. A bag. With something red in it',
            'You have a snack. You feel fantastic'],
    effect: { heal: true } },

  { key: 'c-strangler', klass: 'Boston Cream Strangler', where: ['town'], weight: 4,
    lines: ['You pass a bakery in {kingdom}',
            'Before anyone can stop you, you have squeezed a dozen donuts',
            'The baker makes you pay {gold} gold for the damage. The custard was worth it'],
    effect: { gold: -1, heal: true } },

  { key: 'c-healer', klass: 'Drug Healer', where: ['town'], weight: 4,
    lines: ['A shady figure in {kingdom} offers you a sack of unlabeled potions'],
    ask: 'Well?',
    choices: [
      { label: 'Buy them, for medical research',
        lines: ['You test them on yourself. One of them works', 'You write the recipe down before you forget it'],
        effect: { gold: -1, spell: true } },
      { label: 'Report them to the healers’ guild',
        lines: ['The guild thanks you for your service', 'They pay a reward of {gold} gold'],
        effect: { gold: 2 } } ] },

  { key: 'c-friar', klass: 'Drunken Forest Friar', where: ['rest'], weight: 4,
    lines: ['You open a bottle of abbey ale to bless your rest',
            'Then another, for the saints',
            'Then a few more, for the less famous saints',
            'You wake up hung over, but strangely spiritual'],
    effect: { stat: 'WIS' } },

  { key: 'c-monk', klass: 'Electric Monk', where: ['road'], weight: 4,
    lines: ['You meet a traveler who doesn’t believe in anything',
            'You believe things for them for an hour, free of charge',
            'They feel much better and insist you take {gold} gold'],
    effect: { gold: 2 } },

  { key: 'c-illusionist', klass: 'Erotical Illusionist', where: ['town'], weight: 4,
    lines: ['You perform in the town square of {kingdom}',
            'You make a nobleman’s purse disappear, sensually',
            'It reappears in your pocket with {gold} gold in it. Even you are not sure how'],
    effect: { gold: 3 } },

  { key: 'c-flatulist', klass: 'Fatal Flatulist', where: ['field'], weight: 4,
    lines: ['After the fight, more monsters close in',
            'You turn around and release a cloud of pure intimidation',
            'They flee. So do the birds. So does the grass'],
    effect: { xp: 0.05 } },

  { key: 'c-slayer', klass: 'Grimdark Double-Hell Slayer', where: ['rest'], weight: 4,
    lines: ['You rest by a fire and stare into the flames',
            'You think about everything you have lost. It is a lot',
            'You write it all down in a black notebook. You feel grimmer, and stronger'],
    effect: { stat: 'CON' } },

  { key: 'c-hamburglar', klass: 'Hamburglar', where: ['town'], weight: 4,
    lines: ['You walk past a burger stand in {kingdom}',
            'A moment later, you are walking away from it much faster',
            'Under the pickles you find {loot}'],
    effect: { item: 'special' } },

  { key: 'c-starry', klass: 'Dark Starry Knight', where: ['road'], weight: 4,
    lines: ['You find an old Café Terrace at Night',
            'You find sunflowers as center pieces on the tables',
            'Your moral ambiguity leads you to steal and sell them for {gold} gold'],
    effect: { gold: 3 } },

  { key: 'c-paperback', klass: 'Paperback Fighter', where: ['rest'], weight: 4,
    lines: ['You read a chapter of your own book while you rest',
            'There is a training montage in it. You do the training montage',
            'You can feel your pages getting stronger'],
    effect: { stat: 'STR' } },

  { key: 'c-paladin', klass: 'Paula Deen Paladin', where: ['rest'], weight: 4,
    lines: ['You make camp and fry everything in sight',
            'Butter, bacon, more butter, and a whole stick of blessed butter',
            'Your arteries pray for you, but you feel invincible'],
    effect: { heal: true, stat: 'CON' } },

  { key: 'c-pinball', klass: 'Pinball Wizard', where: ['town'], weight: 4,
    lines: ['There is a pinball machine at the inn in {kingdom}',
            'You set a new high score, blindfolded',
            'The owner pays out the jackpot: {gold} gold'],
    effect: { gold: 2 } },

  { key: 'c-sailor', klass: 'Sailor Rune', where: ['field'], weight: 4,
    lines: ['As the monster falls, you strike a dramatic pose',
            'Sparkles appear out of nowhere. They are very good sparkles',
            'The pose fills you with the power of friendship'],
    effect: { stat: 'CHA' } },

  { key: 'c-shovel', klass: 'Shovel Knight', where: ['road'], weight: 4,
    lines: ['You notice a patch of loose dirt by the road',
            'You dig. Of course you dig',
            'You find {loot}'],
    effect: { item: 'special' } },

  { key: 'c-pizza', klass: 'Sorcerer Supreme Pizza', where: ['rest'], weight: 4,
    lines: ['You conjure a pizza while you rest',
            'It has pineapple on it. You did not ask for pineapple',
            'You eat it anyway. Magic is magic'],
    effect: { heal: true } },

  { key: 'c-ranger', klass: 'Stranger Ranger', where: ['road'], weight: 4,
    lines: ['The lights in a farmhouse window blink at you',
            'You read the blinking. It spells out a message',
            'The message is a coupon. You trade it for {loot}'],
    effect: { item: 'boring' } },

  { key: 'c-jackass', klass: 'Stubborn Jackass', where: ['road'], weight: 4,
    lines: ['You stop in the middle of the road. You do not know why',
            'A cart can’t get past. Its driver begs. You do not move',
            'Finally they pay you {gold} gold to move. You move'],
    effect: { gold: 2 } },

  { key: 'c-saiyan', klass: 'Super Show-off Saiyan', where: ['field'], weight: 4,
    lines: ['You already won that fight, but you power up anyway',
            'Your hair glows gold. You scream for twenty minutes',
            'Nobody asked, but you feel incredible'],
    effect: { xp: 0.05 } },

  { key: 'c-teo', klass: 'Thief Executive Officer', where: ['town'], weight: 4,
    lines: ['You hold a meeting with your henchmen at a tavern in {kingdom}',
            'You announce record profits and cut everyone’s pay',
            'You pocket the savings: {gold} gold'],
    effect: { gold: 3 } },

  { key: 'c-bard', klass: 'United States Coast Bard', where: ['rest'], weight: 4,
    lines: ['You start humming a sea shanty while you rest'],
    ask: 'Do you sing it out loud?',
    choices: [
      { label: 'Sing it loud',
        lines: ['The whole inn joins in', 'They tip you {gold} gold'],
        effect: { gold: 2 } },
      { label: 'Keep it to yourself',
        lines: ['The shanty is stuck in your head for a week', 'At least you rest well'],
        effect: { heal: true } } ] }
];

// ---- Gold sinks ------------------------------------------------------------------
//
// Gold piles up: past a point the shops have nothing better to sell. A hero
// sitting on a hoard spends some of it at market on one of K.Sinks, picked
// at random (StartSplurge in main.js). It plays out like an event, without
// a choice: for once, the hero has money, and no use for advice.
//
// A hoard is banked gold of at least (Keep + Hoard) times the price of the
// best gear the shop sells (premium gear, K.Loot.PremiumMax levels up). A
// splurge spends a share of what is above Keep times that price, so there's
// always enough left to keep shopping. Perks change all this (hoardMult,
// sinkMult, boonMult, allyPower and gambleMult; see K.Perks in combat.js).
K.Sink = {
  Keep: 2,              // never spends below this many times the price of premium gear
  Hoard: 1.5,           // ...and splurges with this many times that to spare
  CooldownHours: 2,     // game hours between splurges, at least
  MinLevel: 5,
  AllyPower: 0.3,       // a henchman's blow, as a share of a typical hero's
  GambleOdds: 0.45,     // the dice tables pay double this often
  // Tavern names: "The {word} {thing}"
  TavernWords: ['Prancing', 'Drunken', 'Sleepy', 'Rusty', 'Leaky', 'Gilded', 'Surly', 'Damp',
                'Wobbly', 'Suspicious', 'Bottomless', 'Second-Best', 'Haunted', 'Itchy'],
  TavernThings: ['Ferret', 'Goblet', 'Pony', 'Kobold', 'Flagon', 'Mimic', 'Bard', 'Tankard',
                 'Owlbear', 'Boot', 'Gnome', 'Lich', 'Turnip', 'Sock']
};

// Each sink:
//   key, label  a unique name; what the gold went on ('a horse')
//   spend       the share of the spare gold it costs (0.3 = 30%)
//   weight      how likely, against the others (default 1)
//   minLevel    optional
//   lines       what happens, one task per line. {gold} is the cost, and
//               {hench}, {tavern} and {rock} are names made up for the
//               occasion; the story placeholders work too ({kingdom}...)
//   boon        something that lasts: the perk properties it gives (see
//               K.Perks in combat.js; ally: a henchman, see K.Combat.AllyHit),
//               shown under the health bars, or under the purse if for good
//     name      what it's called ('Henchman {hench}')
//     help      what it does
//     hours     how long it lasts, in game hours; without: it's for good,
//               and bought only once (or stack times)
//     ends      what the log says when it wears off
//   spells      spells learned, there and then
//   stats       stat points gained, there and then
//   buff        a stat buffed, as by an event
//   gear        true: gear better than anything the shop sells
//   gamble      { win: lines, lose: lines }: double or nothing
//   memoir      true: a ghostwritten entry in the journal
K.Sinks = [
  { key: 'henchman', label: 'a henchman', spend: 0.35, weight: 2,
    lines: ['A sign in {kingdom}: “Henchman for hire. Will hench. Own pointy stick”',
            'You hire {hench} for {gold} gold, plus snacks'],
    boon: { ally: 1, name: 'Henchman {hench}', help: 'An extra attack every round', hours: 8,
            ends: 'Your henchman {hench} quits to start a podcast' } },

  { key: 'horse', label: 'a horse', spend: 0.25,
    lines: ['A horse trader in {kingdom} swears this one is “mostly horse”',
            'You pay {gold} gold. It is at least sixty percent horse'],
    boon: { travelMult: 0.6, name: 'Mostly a horse', help: 'Travels 40% faster', hours: 8,
            ends: 'Your horse wanders off to find itself' } },

  { key: 'temple', label: 'a temple donation', spend: 0.4,
    lines: ['You donate {gold} gold to the temple in {kingdom}',
            'A priest blesses you. Then he sees the amount and blesses you again, harder'],
    boon: { takenMult: 0.85, name: 'Blessed', help: 'Takes 15% less damage', hours: 6,
            ends: 'Your blessing wears off. The temple sends a newsletter' } },

  { key: 'feast', label: 'a feast', spend: 0.3,
    lines: ['You throw a feast for the whole of {kingdom}',
            '{guy} gives a toast. It goes on far too long. Everyone loves you anyway',
            'The bill comes to {gold} gold'],
    buff: 'CHA',
    boon: { regenMult: 1.5, restMult: 0.8, name: 'Well fed', hours: 4,
            help: 'Gets half again as much back between fights, and rests 20% faster',
            ends: 'The feast finally wears off. You could eat' } },

  { key: 'tutor', label: 'a private tutor', spend: 0.35,
    lines: ['You hire a tutor from the Academy of {kingdom}',
            'They charge by the hour, and by the syllable: {gold} gold'],
    spells: 3 },

  { key: 'trainer', label: 'a personal trainer', spend: 0.4,
    lines: ['A personal trainer in {kingdom} promises “results”',
            'You pay {gold} gold to be yelled at. It works, a little'],
    stats: 2 },

  { key: 'backpack', label: 'a bigger backpack', spend: 0.3,
    lines: ['A leatherworker in {kingdom} sells you a bigger backpack for {gold} gold',
            'It has a cup holder. You will never use the cup holder'],
    boon: { carryMult: 1.2, name: 'a bigger backpack', help: 'Carries 20% more', stack: 2 } },

  { key: 'insurance', label: 'adventurer’s insurance', spend: 0.3,
    lines: ['An insurance salesman corners you in {kingdom}',
            'You buy a policy for {gold} gold. It covers acts of gods, but not of their followers'],
    boon: { lossMult: 0.4, name: 'Insured', help: 'Loses 60% less when defeated', hours: 12,
            ends: 'Your insurance lapses. The renewal letter is written in blood' } },

  { key: 'taxes', label: 'taxes', spend: 0.5,
    lines: ['The tax collector of {kingdom} has found you',
            '“The Crown would like its cut,” he says, and takes {gold} gold',
            'You ask what the Crown does with it. He says “Crown stuff”'] },

  { key: 'lawsuit', label: 'a lawsuit', spend: 0.4,
    lines: ['The next of kin of {nemesis} are suing you for wrongful slaying',
            'You point out that you haven’t slain {nemesis} yet. The court calls this a technicality',
            'Damages: {gold} gold'] },

  { key: 'dice', label: 'the dice tables', spend: 0.5,
    lines: ['You wander into a dice den in {kingdom} with {gold} gold burning a hole in your pocket',
            'You put it all on seven. It’s a twenty-sided die'],
    gamble: { win: ['The die lands on seven. The whole den goes quiet',
                    'You walk out with twice what you came in with'],
              lose: ['The die lands on twelve. The house always wins',
                     'You walk out with your dignity, which nobody wanted to bet against'] } },

  { key: 'tavern', label: 'a tavern', spend: 0.7, minLevel: 20, weight: 0.7,
    lines: ['{tavern}, a tavern in {kingdom}, is up for sale',
            'Your retirement plan, at last. You buy it for {gold} gold',
            'You hire someone to run it. They seem honest. They are not'],
    boon: { restMult: 0.85, name: '{tavern}, a tavern in {kingdom}',
            help: 'Rests 15% faster. Free naps upstairs' } },

  { key: 'statue', label: 'a statue of yourself', spend: 0.5, minLevel: 15,
    lines: ['You commission a statue of yourself for the square in {kingdom}',
            'The sculptor makes you taller. You pay {gold} gold, and tip'],
    boon: { giveUpMult: 1.15, name: 'a statue of you in {kingdom}',
            help: 'Monsters who have seen it give up 15% more easily' } },

  { key: 'memoir', label: 'a ghostwriter', spend: 0.25,
    lines: ['You hire a ghostwriter to punch up your journal',
            'They read it, sigh, and ask for {gold} gold up front'],
    memoir: true },

  { key: 'coin', label: 'DungeonCoin', spend: 0.5,
    lines: ['{guy} tells you about DungeonCoin. “It’s like gold, but imaginary”',
            'You invest {gold} gold. To the moon!',
            'DungeonCoin is down one hundred percent. {guy} has left {kingdom}'] },

  { key: 'egg', label: 'a dragon egg', spend: 0.2,
    lines: ['A merchant in {kingdom} sells you a genuine dragon egg for {gold} gold',
            'You keep it warm for weeks. It is a rock',
            'You name it {rock}. You love it anyway'],
    boon: { name: 'a pet rock named {rock}', help: 'Does nothing. Perfect in every way' } },

  { key: 'enchanter', label: 'an enchanter', spend: 0.45,
    lines: ['An enchanter in {kingdom} offers to “improve” your weakest piece of gear',
            'You hand over {gold} gold. It comes back glowing, slightly'],
    gear: true },

  { key: 'seminar', label: 'a self-help seminar', spend: 0.3,
    lines: ['You attend “The Seven Habits of Highly Effective Adventurers” in {kingdom}',
            'Habit one: be the protagonist. You already are. That will be {gold} gold'],
    boon: { xp: 1.1, name: 'Motivated', help: '10% more XP', hours: 6,
            ends: 'The seminar wears off. You were never going to do habits two through seven' } },

  { key: 'ballad', label: 'a ballad', spend: 0.3,
    lines: ['You pay a bard {gold} gold for “The Ballad of {hero}”',
            'It rhymes “{hero}” with “hero”. Close enough'],
    boon: { questMult: 1.2, name: 'The Ballad of {hero}', hours: 8,
            help: 'Quests go 20% faster (the quest givers have all heard it)',
            ends: 'Nobody sings your ballad anymore. There’s a new one, about a goose' } }
];
