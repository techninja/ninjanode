/**
 * @file Manifest, listing all assets to be preloaded
 * before we play the game. Don't add too much!
 */

const graphics = '/resources/graphics';
export const graphicBundleAssets = {
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
export const soundBundleAssets = {
  // Weapon activate sounds.
  energy: `${audio}/weapons/energy.wav`,
  laser1: `${audio}/weapons/laser1.wav`,
  laser2: `${audio}/weapons/laser2.wav`,
  mine: `${audio}/weapons/mine.wav`,
  flame: `${audio}/weapons/flame.wav`,

  // Damage-y type sounds.
  boom: `${audio}/damage/explosion.wav`,
  hit1: `${audio}/damage/hit1.wav`,
  hit2: `${audio}/damage/hit2.wav`,
  mineBoom: `${audio}/damage/mine_boom.wav`,

  // User notification/interface sounds.
  beep: `${audio}/interface/button-beep.wav`,
  join: `${audio}/interface/confirm.wav`,
  spawnSet: `${audio}/interface/spawn_set.wav`,
  spawnUnset: `${audio}/interface/spawn_unset.wav`,
  back: `${audio}/interface/back.wav`,
  blocked: `${audio}/interface/blocked.wav`,
  cancel: `${audio}/interface/cancel.wav`,

  // Ship emission specific sounds.
  thrust: `${audio}/ship/thrust.wav`,
  rumbleThrust: `${audio}/ship/rumble-thrust.wav`,
  warning: `${audio}/ship/warning.wav`,
};

// Convert our shorthand format above to the PIXI Manifest format.
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
