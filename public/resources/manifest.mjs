/**
 * @file Manifest, listing all assets to be preloaded
 * before we play the game. Don't add too much!
 */

const graphics = '/resources/graphics';
const graphicBundleAssets = {
  'ship-a': `${graphics}/ships/ship_a.png`,
  'ship-b': `${graphics}/ships/ship_b.png`,
  'ship-c': `${graphics}/ships/ship_c.png`,
  'ship-d': `${graphics}/ships/ship_d.png`,
  'ship-e': `${graphics}/ships/ship_e.png`,
  'ship-f': `${graphics}/ships/ship_f.png`,
  'ship-g': `${graphics}/ships/ship_g.png`,

  spark: `${graphics}/spark.png`,
  starfield: `${graphics}/starfield.png`,
  stars: `${graphics}/stars-green.png`,
  smoke: `${graphics}/explosions/smoke.png`,

  // TODO: We really only need one gray image and then to tint it.
  shield_blue: `${graphics}/shields/shield_blue.png`,
  shield_green: `${graphics}/shields/shield_green.png`,
  shield_orange: `${graphics}/shields/shield_orange.png`,
  shield_pink: `${graphics}/shields/shield_pink.png`,
  shield_purple: `${graphics}/shields/shield_purple.png`,
  shield_red: `${graphics}/shields/shield_red.png`,
  shield_yellow: `${graphics}/shields/shield_yellow.png`,
};

const audio = '/resources/audio';
const soundBundleAssets = {
  boom: `${audio}/explosion.wav`,
  beep: `${audio}/button-beep.wav`,
  join: `${audio}/confirm.wav`,
  thrust: `${audio}/thrust.wav`,
  fire1: `${audio}/fire1.wav`,
  fire2: `${audio}/fire2.wav`,
  fire3: `${audio}/fire3.wav`,
  fire4: `${audio}/fire4.wav`,
  fire5: `${audio}/fire5.wav`,
  hit1: `${audio}/hit1.wav`,
  hit2: `${audio}/hit2.wav`,
  spawnSet: `${audio}/spawn_set.wav`,
  spawnUnset: `${audio}/spawn_unset.wav`,
  mine: `${audio}/mine_boom.wav`,
  warning: `${audio}/warning.wav`,
};

// COnvert our shorthand format above to the PIXI Manifest format.
const renderManifestAssets = (assets) =>
  Object.entries(assets).map(([alias, src]) => ({ alias, src }));

export const manifest = {
  bundles: [
    {
      name: 'graphics',
      assets: renderManifestAssets(graphicBundleAssets),
    },
    {
      name: 'sounds',
      assets: renderManifestAssets(soundBundleAssets),
    },
  ],
};
