class Perception {
  constructor(bot) {
    this.bot = bot;
    this.nearbyPlayers = [];
    this.nearbyEntities = [];
    this.chatMessages = [];
    this.lastChatTime = 0;
    this.viewDistance = 32;
    this.entityDistance = 20;
    this.knownPlayers = new Set();
    this.lastScanTime = 0;
    this.scanInterval = 500;
  }

  addChatMessage(text, sender = null) {
    this.chatMessages.push({
      text,
      sender,
      timestamp: Date.now(),
    });
    this.lastChatTime = Date.now();
    if (this.chatMessages.length > 100) {
      this.chatMessages = this.chatMessages.slice(-100);
    }
  }

  update() {
    const now = Date.now();
    if (now - this.lastScanTime > this.scanInterval) {
      this.lastScanTime = now;
      this.scanWorld();
    }
  }

  scanWorld() {
    this.nearbyPlayers = [];
    this.nearbyEntities = [];

    if (!this.bot.entity) return;
    const myPos = this.bot.entity.position;

    if (this.bot.players) {
      for (const [name, player] of Object.entries(this.bot.players)) {
        if (name === this.bot.username) continue;
        if (!player.entity) continue;
        const dist = myPos.distanceTo(player.entity.position);
        if (dist < this.viewDistance) {
          this.nearbyPlayers.push({
            name,
            entity: player.entity,
            distance: dist,
            position: player.entity.position,
            health: player.entity.health || 20,
          });
          this.knownPlayers.add(name);
        }
      }
    }

    if (this.bot.entities) {
      for (const [uuid, entity] of Object.entries(this.bot.entities)) {
        if (!entity.position) continue;
        const dist = myPos.distanceTo(entity.position);
        if (dist < this.entityDistance) {
          this.nearbyEntities.push({
            uuid,
            name: entity.name || entity.type || 'unknown',
            type: entity.type || 'unknown',
            distance: dist,
            position: entity.position,
            health: entity.health || 20,
          });
        }
      }
    }

    this.nearbyPlayers.sort((a, b) => a.distance - b.distance);
    this.nearbyEntities.sort((a, b) => a.distance - b.distance);
  }

  getClosestPlayer() {
    if (this.nearbyPlayers.length === 0) return null;
    return this.nearbyPlayers[0];
  }

  getPlayer(name) {
    return this.nearbyPlayers.find((p) => p.name === name) || null;
  }

  hasRecentChat() {
    return Date.now() - this.lastChatTime < 2000;
  }

  getRecentMessages(limit = 10) {
    return this.chatMessages.slice(-limit);
  }

  isKnownPlayer(name) {
    return this.knownPlayers.has(name);
  }

  getStatus() {
    return {
      nearbyPlayers: this.nearbyPlayers.map((p) => ({
        name: p.name,
        distance: Math.round(p.distance * 10) / 10,
      })),
      nearbyEntities: this.nearbyEntities.slice(0, 5).map((e) => ({
        name: e.name,
        distance: Math.round(e.distance * 10) / 10,
      })),
      hasRecentChat: this.hasRecentChat(),
      knownPlayersCount: this.knownPlayers.size,
    };
  }
}

module.exports = Perception;
