const { env } = process;

export const gameConfig = {
  pnbitsCount: env['NINJANODE_PLANET_COUNT'] ?? 5,
  powerupCount: env['NINJANODE_POWERUP_COUNT'] ?? 20,
  playArea: env['NINJANODE_PLAY_SIZE'] ?? 20 * 1000,
};
