const { env } = process;

export const gameConfig = {
  pnbitsCount: parseInt(env['NINJANODE_PLANET_COUNT'] ?? 5, 10),
  powerupCount: parseInt(env['NINJANODE_POWERUP_COUNT'] ?? 20, 10),
  playArea: parseInt(env['NINJANODE_PLAY_SIZE'] ?? 20 * 1000, 10),
};
