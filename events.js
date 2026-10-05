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
//   lines   what happens, one task per line (each takes 3 seconds)
//   effect  what it does to you, applied after the last line (optional):
//             gold:    gold found (or, if negative, lost from your purse),
//                      in multiples of your level. {gold} in the lines
//                      says how much.
//             item:    'boring' or 'special': an item for your pack.
//                      {loot} in the lines names it.
//             stat:    'random' or a stat name ('STR', 'HP Max'...): +1
//             spell:   true: learn a spell (or level one up)
//             equip:   true: a piece of gear a little above your level
//             heal:    true: full HP and MP
//             wounded: number of fights spent Wounded
//             xp:      share of the way to the next level (0.1 = 10%)
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

K.Events = [
  { key: 'snoring', where: ['rest'],
    lines: ['While you rest, a {race-one} sits down next to you and starts snoring',
            'You wake up an hour later. The {race-one} is gone. So is some of your gold'],
    effect: { gold: -1 } },

  { key: 'campfire', where: ['rest'],
    lines: ['You share a campfire with a wandering {klass}',
            'They teach you a trick that 60% of the time, it works every time'],
    effect: { spell: true } },

  { key: 'dreamtaunt', where: ['rest'], weight: 1,
    lines: ['You doze off. The Old Bastard™ appears in your dreams again',
            '“{insult}” he says, and then he steals your {boring}',
            'You wake up furious, and somehow tougher'],
    effect: { stat: 'CON' } },

  { key: 'squirrel', where: ['rest'],
    lines: ['A squirrel brings you {loot}',
            'You do not ask where it got it'],
    effect: { item: 'special' } },

  { key: 'sitcom', where: ['rest'],
    lines: ['You rest in a tavern where a bard is performing stand-up',
            'The bard does ten minutes on {race}. It is a little problematic',
            'You laugh so hard you feel better'],
    effect: { heal: true } },

  { key: 'stretch', where: ['rest'], weight: 0.5,
    lines: ['You do some stretches. A {race-one} points out you are doing them wrong',
            'You do them right. Huh'],
    effect: { stat: 'DEX' } },

  { key: 'pigeons', where: ['rest'], weight: 0.5,
    lines: ['You read a self-help scroll titled "Who Moved My {boring}?"',
            'It changes your life, slightly'],
    effect: { stat: 'WIS' } },

  { key: 'tollbridge', where: ['road'],
    lines: ['A troll at a bridge demands a toll of {gold} gold',
            'There is no river. You pay anyway'],
    effect: { gold: -2 } },

  { key: 'wallet', where: ['road'],
    lines: ['You find a coin purse on the road with {gold} gold in it',
            'There is a name on it: {guy}. You decide that is a common name'],
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
            'You file a complaint with {kingdom}. Your ankle files one too'],
    effect: { wounded: 1 } },

  { key: 'blacksmith', where: ['town'],
    lines: ['The blacksmith is having a going-out-of-business sale',
            'She has been having it for nine years',
            'You get a great deal anyway'],
    effect: { equip: true } },

  { key: 'parkingticket', where: ['town'],
    lines: ['You find a parking ticket on your horse',
            'You do not have a horse. You pay the {gold} gold anyway'],
    effect: { gold: -2 } },

  { key: 'fan', where: ['town'], weight: 0.5,
    lines: ['A fan recognizes you in the market',
            '“Are you {hero}? My kid loves you”',
            'You sign their {boring} and feel great about yourself'],
    effect: { stat: 'CHA' } },

  { key: 'gym', where: ['town'], weight: 0.5, minLevel: 3,
    lines: ['A personal trainer in town offers you a free trial session',
            'You survive it. Barely'],
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
            'Later you notice your purse is {gold} gold lighter'],
    effect: { gold: -3 } },

  { key: 'souvenir', where: ['field'],
    lines: ['Among the remains of your last fight you find {loot}',
            'It is still warm'],
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
            'You give chase',
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
    lines: ['You come across an overturned supply wagon on the trail',
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
];
