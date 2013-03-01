![ninjanode demo image](http://tn42.com/ninjanode-demo.png "Join the Fun >>")

**ninjanode**: A node.js implementation of the [ninjaships.js](https://github.com/techninja/ninjaships) library I spent a couple days on and made into a complete HTML5 multiplayer game! Like the ninjaships library before it, I've carried on the tradition of doing nothing in canvas.. everything is an regular old HTML element, dripping with diabolical CSS! Yes, it's crazy... ***my*** kinda crazy.

Designed for Mozilla Firefox 12+ (mobile or otherwise), and works great in WebKit (Chromium/Chrome, Safari/iOS). Though I tried it once in IE9, and *nearly* ***died***.

Just visit the site, and you're in! Enter a nick name, select your ship, and you'll be off and firing at all your friends in the vacuum of virtual HTML space.

Check out the official live demo @ http://ninjanode.tn42.com *(uptime* ***not*** *guaranteed, actually, you're lucky to find it running at all)*

### Client side Requirements & Caveats
Well, you knew there had to be strings, didn't you...
 * **Needs:** a modern browser that fully supports websockets, CSS transforms, and a strange and terrible misuse of body margins.
 * **Nice to have:** Audio API support, and numerous fancy CSS3 tidbits like animations/transitions.

### Game Features
 * 6 customized ships with 5 different weapons (defined in [JSON](ninjaroot/ninjaships.node.js#L9)), shields, regeneration and collision detection, and more.
 * Cookie preference save / load
 * Full desktop browser zoom support (it's automatic!).
 * Global user text chat, system messages and fading notifications
 * Can support "quite a few" clients at once. *(I don't seem to have enough friends to kill my server* ***yet****)*
 * "Wrapped" space: Users are given a 20,000 pixel arena to play in
 * "Cheater proof" controls: server only receives human key command input from clients, then calculates ship and projectile positions, hit detection, and shield health.
 * (technically) fully customizable input: Defaults to arrow keys, and now supports mouse and touch screen devices. ***Tested with flying colors on an old iPad with iOS 6!***
 * Simple per-session score keeping for each user
 * Simple JSON API for retrieving player data, stats and more at `/users` & `/users/count`

## Server Installation
 0. Clone or download this repo to your prospective server.
 0. With [node](http://nodejs.org/) and [npm](http://npmjs.org/) already installed, run `npm install` within the repo root, and this should install [socket.io](http://socket.io/), [express](http://expressjs.com/) and sanitizer dependencies.
 0. Run `node ninjaserver.js 4242`, where `4242` is the port you wish to host from. If left out, will default to `4242`.
 0. Aaaand.. *you're done!* I recommend a daemon like [forever](https://github.com/nodejitsu/forever) to run the server and keep it up.

## Time to play
This is a multi-player game, no AI just yet. Get some willing friends/co-workers/neighbors/internetizens and tell them to go to the server URL. Use the ↑ up & ↓ down arrow keys to thrust in a direction, set by the ← left and → right arrow keys. Space bar fires primary weapon, and 'm' fires secondary weapon, a space "mine".

Take care in selecting your ship! Some are fast and slow to turn, some accelerate quickly, with a low top speed, some fire quickly, but have lower maximum shield power. All stats are given next to each ship on the selections screen, so choose wisely, and mix it up. Want a new ship? press `F5` to refresh the page and try with a different ship.

### Credits
Thanks to my girl ["Super-Awesome" Sylvia](http://sylviashow.com) for helping with the ideas, and the second set of three ships originally created our [Squishy Space Race DML 2012 demo](https://github.com/techninja/DML2012), not to mention countless play-testing sessions!

Credit to Everaldo Coelho for the [fanciest of the Ship graphics](http://www.iconfinder.com/icondetails/18075/128/anakin_fighter_skywalker_spaceship_icon).
