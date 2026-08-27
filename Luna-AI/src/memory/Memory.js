const fs = require('fs');
const path = require('path');

const MEMORY_PATH = path.join(__dirname, '../../data/memory.json');

class Memory {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(MEMORY_PATH)) {
        const raw = fs.readFileSync(MEMORY_PATH, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[MEMORY] Failed to load memory file, starting fresh:', err.message);
    }
    return this.defaultData();
  }

  defaultData() {
    return {
      players: {},
      events: [],
      places: [],
      lastUpdated: Date.now(),
    };
  }

  save() {
    try {
      this.data.lastUpdated = Date.now();
      fs.writeFileSync(MEMORY_PATH, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[MEMORY] Failed to save memory:', err.message);
    }
  }

  rememberPlayer(name, info = {}) {
    if (!this.data.players[name]) {
      this.data.players[name] = {
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        notes: [],
      };
    }
    this.data.players[name].lastSeen = Date.now();
    if (info.notes && info.notes.length) {
      this.data.players[name].notes.push(...info.notes);
    }
    if (info.description) {
      this.data.players[name].description = info.description;
    }
    this.save();
  }

  getPlayer(name) {
    return this.data.players[name] || null;
  }

  getAllPlayers() {
    return Object.entries(this.data.players).map(([name, data]) => ({
      name,
      ...data,
    }));
  }

  recordEvent(type, data = {}) {
    this.data.events.push({
      timestamp: Date.now(),
      type,
      data,
    });
    if (this.data.events.length > 500) {
      this.data.events = this.data.events.slice(-500);
    }
    this.save();
  }

  recordPlace(name, position, description = '') {
    this.data.places.push({
      timestamp: Date.now(),
      name,
      x: Math.round(position.x),
      y: Math.round(position.y),
      z: Math.round(position.z),
      description,
    });
    this.save();
  }

  getRecentEvents(type = null, limit = 50) {
    let events = this.data.events;
    if (type) {
      events = events.filter((e) => e.type === type);
    }
    return events.slice(-limit);
  }
}

module.exports = new Memory();
