const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../.env');

function loadEnv() {
  const env = {};
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key] = value;
      }
    }
  } catch (e) {
    console.error('[CONFIG] Failed to load .env:', e.message);
  }
  return env;
}

const env = loadEnv();

const defaults = {
  MINECRAFT_HOST: 'localhost',
  MINECRAFT_PORT: '25565',
  MINECRAFT_VERSION: '',
  MINECRAFT_USERNAME: 'Luna',
  MINECRAFT_AUTH: 'offline',
  LUNA_AUTONOMOUS: 'true',
  LUNA_CHAT: 'true',
  LUNA_MEMORY: 'true',
  LUNA_LOG_LEVEL: 'info',
  LUNA_RECONNECT_BASE_DELAY: '3000',
  LUNA_RECONNECT_MAX_DELAY: '30000',
  LUNA_LOOK_DISTANCE: '10',
};

function get(key, fallback) {
  if (env[key] !== undefined) return env[key];
  if (fallback !== undefined) return fallback;
  return defaults[key] || '';
}

function getInt(key, fallback) {
  const val = parseInt(get(key, fallback), 10);
  return Number.isFinite(val) ? val : fallback;
}

function getFloat(key, fallback) {
  const val = parseFloat(get(key, fallback));
  return Number.isFinite(val) ? val : fallback;
}

function getBool(key, fallback) {
  const val = get(key, fallback ? 'true' : 'false');
  return val !== 'false' && val !== '0' && val !== '';
}

module.exports = {
  minecraft: {
    host: get('MINECRAFT_HOST'),
    port: getInt('MINECRAFT_PORT', 25565),
    version: get('MINECRAFT_VERSION') || undefined,
    username: get('MINECRAFT_USERNAME', 'Luna'),
    auth: get('MINECRAFT_AUTH', 'offline'),
  },
  luna: {
    autonomous: getBool('LUNA_AUTONOMOUS', true),
    chat: getBool('LUNA_CHAT', true),
    memory: getBool('LUNA_MEMORY', true),
    logLevel: get('LUNA_LOG_LEVEL', 'info'),
    reconnectBaseDelay: getInt('LUNA_RECONNECT_BASE_DELAY', 3000),
    reconnectMaxDelay: getInt('LUNA_RECONNECT_MAX_DELAY', 30000),
    lookDistance: getFloat('LUNA_LOOK_DISTANCE', 10),
  },
  getAll: () => env,
};
