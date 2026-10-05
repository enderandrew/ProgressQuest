<html>
<head>
	<link rel="apple-touch-icon" sizes="180x180" href="https://enderandrew.com/ProgressQuest/apple-touch-icon.png">
	<link rel="icon" type="image/png" sizes="32x32" href="https://enderandrew.com/ProgressQuest/favicon-32x32.png">
	<link rel="icon" type="image/png" sizes="16x16" href="https://enderandrew.com/ProgressQuest/favicon-16x16.png">
	<link rel="manifest" href="https://enderandrew.com/ProgressQuest/site.webmanifest">
	<link rel="mask-icon" href="https://enderandrew.com/ProgressQuest/safari-pinned-tab.svg" color="#5bbad5">
	<link rel="shortcut icon" href="https://enderandrew.com/ProgressQuest/favicon.ico">
	<meta name="msapplication-TileColor" content="#da532c">
	<meta name="msapplication-config" content="https://enderandrew.com/ProgressQuest/browserconfig.xml">
	<meta name="theme-color" content="#ffffff">
	<title>Progress Quest Remix Release Notes</title>
	<!-- Google tag (gtag.js) -->
	<meta name="google-site-verification" content="Fw32VtOfNNMYuxwq-LDxGbzuY7QIxjvQmLuWnv6FTGY" />
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-C7FZLTKS4Q"></script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag(){dataLayer.push(arguments);}
		gtag('js', new Date());

		gtag('config', 'G-C7FZLTKS4Q');
	</script>
	<style>
		a {
			text-decoration: none;
			color: #0000c0;
		}
		a:hover {
			color: #0000ff;
		}
		body {
			text-align: center;
			background-image: url('battleback9.png');
			background-size: cover;
			background-repeat: no-repeat;
		}
		p {
			margin-left: 10%;
			margin-right: 10%;
			text-align: left;
		}
		.sig {
			text-align: center;
			font-size: small;
			color: #808080;
		}
		.sig a, .sig a:visited {
			color: #808080;
			text-decoration: none;
		}
		div {
			background:#7f7f7f;
			background:rgba(255,255,255,0.5);
			margin-left: 15%;
			margin-right: 15%;
		}
		.center {
			display: block;
			margin-left: auto;
			margin-right: auto;
		}
		#go {
			font-size: 30pt;
		}
		img {
			border-style: none;
		}
		th, td { text-align: left; padding-right: 2em; }
		.good { color: #2a2; }
		.ugly { color: #c82; }
		.nabar {
			text-align: center;
		}
	</style>
</head>
<body bgcolor=#ffffff alink=blue vlink=black>
<p align=center id=logop>
<a href="https://ProgressQuest.EnderAndrew.com" style="text-decoration:none"><img style="border:0" src="pq.gif" width="512px" height="451px" id="logo" title="Progress Quest Remix is the breakfast of not-quite champions who sleep in and let their game idle" alt="Progress Quest Remix" class="center"></a>
<div>
	<font color=#000032><br>
	<i>progressus imprimis</i>
		<center>
	<h1>Release Notes - Remix</h1>
	</center>
	
	<style>
	li { margin: 0.5ex; }
	body { margin-left: 50px; margin-right: 50px; }
	</style>
	
	<a name="remix_combat"></a>
	<h3>Changes for the Combat Update:</h3>

	<ul>
	<li>Monsters are now actually fought. Previously they were defeated by the
	administrative process of your progress bar filling up. Combat is
	resolved in rounds, using every statistic you have, including the ones
	you had assumed were decorative.
	<li>STR hits things. DEX hits things more often, dodges things, and runs
	away from things. CON makes things hit you less hard. INT makes spells
	hurt. WIS makes spells work at all. CHA convinces beaten monsters that
	they have somewhere else to be.
	<li>Your race and class now each have a primary and secondary attribute,
	which grow a little faster than the others. A Martial/Arcane rating on the
	character sheet tells you how likely you are to hit a monster with a
	stick versus a spell. Neither is guaranteed to work.
	<li>Every one of the 400-odd spells now does something: damage, healing,
	buffs, debuffs or crowd control, determined by careful study of its name.
	Tonsillectomy is performed on the monster. Locate Restroom heals.
	<li>Spell levels matter. A spell at level VII is better than the same spell
	at level I. This was always implied.
	<li>Monsters may now be Giant, Fairly Stupid, Undead, or Kaiju. These are
	not compliments, except for Kaiju.
	<li>Hit points and mana now persist between fights. You will occasionally
	stop to catch your breath, which is not a bug but a lifestyle.
	<li>Equipment has power, and you will only buy equipment that is better
	than what you have. The shopkeepers of the realm are devastated.
	<li>Monsters drop loot sometimes rather than always. Some of it is rare.
	All of it is sticky.
	<li>Gold and loot found on the Killing Fields&trade; are unbanked until you
	sell them at market. If you are defeated, the monster helps itself.
	<li>Defeat is now possible. You will be dragged back to town by a passing
	stranger and convalesce at a temple, which will accept a modest tithe of
	10% of your life savings. You will be Wounded for a couple of fights and
	will, for a while, pick on smaller monsters. This is called wisdom.
	<li>A combat log is available (press C) for those who wish to watch every
	swing. The task bar now says how the last fight went, in case you were
	wondering.
	<li>The window is wider and fits smaller screens. Long names of equipment
	no longer fall off the edge of the world.
	<li>jQuery has been upgraded to version 4. Nobody will notice, which is the
	highest praise available to a library.
	<li>Saves from earlier versions are upgraded automatically when loaded.
	Your character will not notice either.
	</ul>

	<h1>Release Notes - Original</h1>
	</center>
	
	<style>
	li { margin: 0.5ex; }
	body { margin-left: 50px; margin-right: 50px; }
	</style>
	
	<a name="6_4"></a>
	<h3>Changes for version 6.4.4:</h3>
	
	<ul>
	<li>Repair stat clumping for high-stat characters.
	<li>Fix typo that made the "join a guild" dialog hard to undestand.
	<li>Fix bug in exporting sheets.
	</ul>
	
	<h3>Changes for version 6.4.3:</h3>
	
	<ul>
	<li>Fixed: The other half of the bug that caused access violations for characters with stats
	in the tens of thousands.
	</ul>
	
	<h3>Changes for version 6.4.2:</h3>
	
	<ul>
	<li>Fixed: The bug which made it impossible to sign in using email rather than nickname to create characters, on realms
	requiring an account.
	</ul>
	
	<h3>Changes for version 6.4.1:</h3>
	
	<ul>
	
	<li>Cinematic cutscenes appear between acts; there are enhanced rewards for completing acts.
	
	<li>Fixed: The bug which caused an alert saying "Could not set data for ''" on startup.
	
	<li>Fixed: The bug which caused access violation alerts on very high-level characters.
	
	<li>Very high level spells use extended Roman numerals, namely A for 5000 and T for 10,000.
	
	<li>A small number of new races, classes, items, etc. have been added.
	
	<li>Occasional battles occur with named NPCs.
	
	
	</ul>
	
	
	<a name="6_3"></a>
	<h3>Changes for version 6.3:</h3>
	
	<ul>
	<li>There is no version 6.3
	</ul>
	
	
	<a name="6_2"></a>
	<h3>Changes for version 6.2:</h3>
	
	<ul>
	
	<li> PQ no longer prevents Windows shutdown when running
	minimized. <i>Warning: Do not shutdown without reason! Your
	character's progress will cease until you restart!</i>
	
	<li> Double-clicking a .pq save file will launch PQ. 
	
	<li> Giving a save file as a command line parameter loads that game.
	
	<li> Shortcuts to save files can be placed in the "Startup" folder to
	launch on startup. (I don't advise putting the save file itself there;
	when a backup is created, it fouls things up.)
	
	<li> Saves will keep the name and location they were loaded as
	
	<li> PQ will be able to generate a character sheet as a text
	file. (See below.)
	
	<li> Minimization to the system tray, rather than the taskbar, will
	become optional. (See below.)
	
	<li> The "game saved as" dialog is optional. (See below.)
	
	<li> Making backup files is optional (See below.)
	
	<li> The bug where long mottoes screw up posts to the online rankings
	should be fixed
	
	<li> PQ should work through proxies 
	
	<li> Your character's name and realm are displayed in the title bar,
	and in the hint text when the program in minimized.
	
	<li> Handy character name suggestion tool
	
	<li> Three new monsters, two new items
	
	<li> "Foetal" is now spelled without the ligature
	
	</ul>
	
	Here is "below" (see above). PQ accepts several command-line
	options. They are:
	
	<pre>
	-no-backup      Do not make a backup file when saving the game
	-no-report-save Do not display the "Game saved" message when saving
	-no-tray        Do not minimize to the system tray
	-export         Export a text character sheet periodically
	-export-only    Export a text character sheet now, then exit
	-help           Display this chatter (and exit)
	</pre>
	
	<a name="6_1"></a>
	<h3>Changes for version 6.1:</h3>
	
	<ul>
	<li> I really just don't remember.
	<li> I also don't see how it could matter much.
	</ul>
	
	<br/>
	</body>
	
		<div align="center" id="nabar">
			<a href="./">Home</a> &middot;
			<a href="./info.php">Info</a> &middot;
			<a href="./faq.php">FAQ</a> &middot;
			<a href="./roster.html">Play</a> &middot;
			<a href="./dl.php">Download</a> &middot;
			<a href="http://progressquest.com/realms.php">Realms</a> &middot;
			<a href="http://progressquest.com/acct.php">Accounts</a> &middot;
			<a href="./news.php">News</a> &middot;
			<a href="http://www.cafepress.com/pqm">Store</a> &middot;
			<a href="http://forum.progressquest.com/">Forum</a> &middot;
			<a href="./links.php">Links</a>
		</div>
		<br>
		<div class="sig">
			&copy;2001-2010 <a class=dim href="mailto:grumdrig@progressquest.com">grumdrig@progressquest.com</a> for original Progress Quest - &copy;2023 <a class=dim href="mailto:ender@enderandrew.com">ender@enderandrew.com</a> for Progress Quest Remix
		</div>
</div>