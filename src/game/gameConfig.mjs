const { env } = process;

export const gameConfig = {
  pnbitsCount: parseInt(env['NINJANODE_PLANET_COUNT'], 10) ?? 5,
  powerupCount: parseInt(env['NINJANODE_POWERUP_COUNT'], 10) ?? 20,
  playArea: parseInt(env['NINJANODE_PLAY_SIZE'], 10) ?? 20 * 1000,
};
