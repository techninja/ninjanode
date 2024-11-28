**ninjanode**: A Node.js implementation of a realtime socket driven browser based space shooter game!

Designed for modern browsers. Just visit the site, and you're in! Enter a nick name, select your ship, and you'll be off and firing at all your friends in the vacuum of virtual HTML space.

### Check out the official live demo @ https://ninjanode.tn42.com

### Game Features

- Game Data Defined in JS/JSON for: [Ships](/public/data/shipTypes.mjs), [weapons](/public/data/projectileTypes.mjs), [powerups](/public/data/powerupTypes.mjs), and [planets](/public/data/pnbitsTypes.mjs)!
- No build system ever! All native module powered JSON in the browser and in Node for the server.
- Cookie preference save / load
- Full desktop browser zoom support (it's automatic!).
- Global user text chat, system messages and fading notifications
- Can support "quite a few" clients at once.
- Configurable environment for docker depoloy, for playarea size, number of planets and powerups
- "Cheater proof" controls: server only receives human key command input from clients, then calculates ship and projectile positions, hit detection, and shield health.
- Simple per-session score keeping for each user
- Simple JSON API for retrieving player data, stats and more at `/users` & `/users/count`

## Local Development

0.  Prerequisite: Recommend Linux/Mac for dev, but Windows works too, but you might need to do more work.
1.  Make sure you git (Github Desktop, or git command line tools) and have a [node version manager](https://github.com/nvm-sh/nvm) installed, and switch to Node 20 LTS.
2.  Open a terminal, and clone or download this repository via `git clone https://github.com/techninja/ninjanode.git`
3.  Once cloned, enter the directory `cd ninjanode` and run `npm install` within the repo root. This should install all dependencies.
4.  Copy the [`.env.default`](/.env.default) to `.env`, and there you can customize your server's configurable settings.
5.  Run `npm start [port]`, where `[port]` is the port you wish to host from. If left out, will default to `4242`.
6.  You should now be able to view the game from your local system at `http://localhost:[port]`, `http://localhost:4242` by default.

## Time to play

This is a multi-player game, no AI just yet. Get some willing friends/co-workers/neighbors/internetizens and tell them to go to the server URL. Use the ↑ up & ↓ down arrow keys to thrust in a direction, set by the ← left and → right arrow keys. Space bar fires primary weapon, and 'm' fires secondary weapon, a space "mine".

Take care in selecting your ship! Some are fast and slow to turn, some accelerate quickly, with a low top speed, some fire quickly, but have lower maximum shield power. All stats are given next to each ship on the selections screen, so choose wisely, and mix it up. Want a new ship? press `F5` to refresh the page and try with a different ship.

### Credits

Thanks to Zeph for originally helping with the idea, not to mention countless play-testing sessions from Dorian and the whole family!

Credit to Everaldo Coelho for the [fanciest of the Ship graphics](http://www.iconfinder.com/icondetails/18075/128/anakin_fighter_skywalker_spaceship_icon).
