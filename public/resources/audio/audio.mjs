import { soundBundleAssets } from 'manifest';

const {
  energy,
  laser1,
  laser2,
  mine,
  flame,
  hit1,
  hit2,
  boom,
  mineBoom,
  thrust,
  warning,
  spawnSet,
  spawnUnset,
} = soundBundleAssets;

// Map Pixi manifest export to legacy.
export const audio = {
  boom,
  thrust,
  fire1: laser1,
  fire2: energy,
  fire3: laser2,
  fire4: mine,
  fire5: flame,
  hit1,
  hit2,
  spawnSet,
  spawnUnset,
  mine: mineBoom,
  warning,
};
