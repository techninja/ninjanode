/**
 * @file ninjanode main Gameplay specific data: ships, projectiles and power-ups
 */

module.exports.projectileTypes = require('./ninjanode.projectiles');
module.exports.shipTypes = require('./ninjanode.shiptypes');
module.exports.powerUpTypes = require('./ninjanode.powerups');
module.exports.pnbitsTypes = require('./ninjanode.pnbits');

console.log('DATA', module.exports);
