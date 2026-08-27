class WorldScanner {
  constructor(bot) {
    this.bot = bot;
    this.scanRadius = 8;
    this.lastScan = 0;
    this.scanInterval = 2000;
    this.interestingBlocks = [];
    this.lastScanResult = null;
  }

  scan() {
    const now = Date.now();
    if (now - this.lastScan < this.scanInterval) {
      return this.lastScanResult;
    }
    this.lastScan = now;

    if (!this.bot.entity) return null;
    const pos = this.bot.entity.position;
    const results = {
      players: 0,
      entities: 0,
      interestingBlocks: [],
      time: null,
      biome: null,
    };

    if (this.bot.players) {
      results.players = Object.keys(this.bot.players).length;
    }
    if (this.bot.entities) {
      results.entities = Object.keys(this.bot.entities).length;
    }

    try {
      const block = this.bot.blockAt(pos);
      if (block) {
        results.biome = block.biome ? block.biome.name : 'unknown';
        results.time = this.bot.time ? this.bot.time.timeOfDay : null;
      }
    } catch (e) {}

    this.interestingBlocks = [];
    try {
      for (let x = -this.scanRadius; x <= this.scanRadius; x++) {
        for (let y = -2; y <= 2; y++) {
          for (let z = -this.scanRadius; z <= this.scanRadius; z++) {
            const block = this.bot.blockAt(pos.offset(x, y, z));
            if (!block) continue;
            const name = (block.name || '').toLowerCase();
            if (name.includes('chest') || name.includes('crafting') || name.includes('furnace') ||
                name.includes('door') || name.includes('bed') || name.includes('flower') ||
                name.includes('tree') || name.includes('water') || name.includes('flower')) {
              this.interestingBlocks.push({
                name: block.name,
                x: block.position.x,
                y: block.position.y,
                z: block.position.z,
                distance: Math.sqrt(x * x + y * y + z * z),
              });
            }
          }
        }
      }
      this.interestingBlocks.sort((a, b) => a.distance - b.distance);
      results.interestingBlocks = this.interestingBlocks.slice(0, 10);
    } catch (e) {
      results.interestingBlocks = [];
    }

    this.lastScanResult = results;
    return results;
  }

  getInterestingBlocks() {
    return this.interestingBlocks;
  }

  getBiome() {
    return this.lastScanResult ? this.lastScanResult.biome : 'unknown';
  }

  getTime() {
    return this.lastScanResult ? this.lastScanResult.time : null;
  }

  isDay() {
    const time = this.getTime();
    if (time === null) return true;
    return time > 0 && time < 12000;
  }

  isNight() {
    const time = this.getTime();
    if (time === null) return false;
    return time >= 12000 || time < 0;
  }
}

module.exports = WorldScanner;
