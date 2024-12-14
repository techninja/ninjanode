const graphics = '/resources/graphics';

export const graphicBundleAssets = [
  { alias: 'ship-a', src: `${graphics}/ships/ship_a.png` },
  { alias: 'ship-b', src: `${graphics}/ships/ship_b.png` },
  { alias: 'ship-c', src: `${graphics}/ships/ship_c.png` },
  { alias: 'ship-d', src: `${graphics}/ships/ship_d.png` },
  { alias: 'ship-e', src: `${graphics}/ships/ship_e.png` },
  { alias: 'ship-f', src: `${graphics}/ships/ship_f.png` },
  { alias: 'ship-g', src: `${graphics}/ships/ship_g.png` },

  { alias: 'spark', src: `${graphics}/spark.png` },
  { alias: 'starfield', src: `${graphics}/starfield.png` },
  { alias: 'stars', src: `${graphics}/stars-green.png` },
  { alias: 'smoke', src: `${graphics}/explosions/smoke.png` },

  // TODO: We only need one gray image and then to tint it.
  { alias: 'shield_blue', src: `${graphics}/shields/shield_blue.png` },
  { alias: 'shield_green', src: `${graphics}/shields/shield_green.png` },
  { alias: 'shield_orange', src: `${graphics}/shields/shield_orange.png` },
  { alias: 'shield_pink', src: `${graphics}/shields/shield_pink.png` },
  { alias: 'shield_purple', src: `${graphics}/shields/shield_purple.png` },
  { alias: 'shield_red', src: `${graphics}/shields/shield_red.png` },
  { alias: 'shield_yellow', src: `${graphics}/shields/shield_yellow.png` },
];

const audio = '/resources/audio';
export const soundBundleAssets = [
  { alias: 'boom', src: `${audio}/explosion.wav` },
  { alias: 'beep', src: `${audio}/button-beep.wav` },
  { alias: 'join', src: `${audio}/confirm.wav` },
  { alias: 'thrust', src: `${audio}/thrust.wav` },
  { alias: 'fire1', src: `${audio}/fire1.wav` },
  { alias: 'fire2', src: `${audio}/fire2.wav` },
  { alias: 'fire3', src: `${audio}/fire3.wav` },
  { alias: 'fire4', src: `${audio}/fire4.wav` },
  { alias: 'fire5', src: `${audio}/fire5.wav` },
  { alias: 'hit1', src: `${audio}/hit1.wav` },
  { alias: 'hit2', src: `${audio}/hit2.wav` },
  { alias: 'spawnSet', src: `${audio}/spawn_set.wav` },
  { alias: 'spawnUnset', src: `${audio}/spawn_unset.wav` },
  { alias: 'mine', src: `${audio}/mine_boom.wav` },
  { alias: 'warning', src: `${audio}/warning.wav` },
];

export const manifest = {
  bundles: [
    {
      name: 'graphics',
      assets: graphicBundleAssets,
    },
    {
      name: 'sounds',
      assets: soundBundleAssets,
    },
  ],
};
