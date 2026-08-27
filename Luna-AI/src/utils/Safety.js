const { Vec3 } = require('mineflayer');

const DANGEROUS_BLOCKS = new Set([
  'lava', 'flowing_lava', 'fire', 'soul_fire', 'cactus', 'sweet_berry_bush',
  'wither_rose', 'powder_snow', 'magma_block', 'campfire', 'soul_campfire',
]);

function isBlock Dangerous(bot, x, y, z) {
  try {
    const block = bot.blockAt(new Vec3(x, y, z));
    if (!block) return false;
    const name = (block.name || '').toLowerCase();
    return DANGEROUS_BLOCKS.has(name);
  } catch (e) {
    return false;
  }
}

function isPositionSafe(bot, x, y, z, radius = 1) {
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      if (isBlockDangerous(bot, x + dx, y, z + dz)) return false;
      if (isBlockDangerous(bot, x + dx, y + 1, z + dz)) return false;
    }
  }
  return true;
}

function getSafePositionNearby(bot, x, z, maxAttempts = 8) {
  for (let i = 0; i < maxAttempts; i++) {
    const angle = (i / maxAttempts) * Math.PI * 2;
    const dist = 2 + Math.random() * 2;
    const nx = Math.round(x + Math.cos(angle) * dist);
    const nz = Math.round(z + Math.sin(angle) * dist);
    if (isPositionSafe(bot, nx, bot.entity.position.y, nz)) {
      return { x: nx, z: nz };
    }
  }
  return { x: Math.round(x), z: Math.round(z) };
}

module.exports = {
  isBlockDangerous,
  isPositionSafe,
  getSafePositionNearby,
};
