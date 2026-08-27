require('dotenv').config();

const mineflayer = require('mineflayer');
const Brain = require('./brain/Brain');
const Perception = require('./perception/Perception');
const Movement = require('./movement/Movement');
const LookController = require('./movement/LookController');
const Memory = require('./memory/Memory');

const config = {
  host: process.env.MINECRAFT_HOST || 'localhost',
  port: parseInt(process.env.MINECRAFT_PORT || '25565', 10),
  version: process.env.MINECRAFT_VERSION || undefined,
  username: process.env.MINECRAFT_USERNAME || 'Luna',
  auth: process.env.MINECRAFT_AUTH || 'offline',
  autonomous: process.env.LUNA_AUTONOMOUS !== 'false',
  chat: process.env.LUNA_CHAT !== 'false',
  memory: process.env.LUNA_MEMORY !== 'false',
  logLevel: process.env.LUNA_LOG_LEVEL || 'info',
};

const LOG_PREFIXES = {
  info: ['[LUNA]'],
  brain: ['[BRAIN]'],
  memory: ['[MEMORY]'],
  perception: ['[PERCEPTION]'],
  movement: ['[MOVEMENT]'],
  chat: ['[CHAT]'],
  connect: ['[CONNECT]'],
  error: ['[ERROR]'],
};

function log(prefix, level, ...args) {
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  const current = levels[config.logLevel] !== undefined ? levels[config.logLevel] : 2;
  const needed = levels[level] !== undefined ? levels[level] : 2;
  if (needed > current) return;
  const tags = LOG_PREFIXES[prefix] || ['[LUNA]'];
  console.log(`${tags.join('')} ${args.join(' ')}`);
}

let bot = null;
let brain = null;
let perception = null;
let movement = null;
let lookController = null;
let mainLoop = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000;
const BASE_RECONNECT_DELAY = 3000;
let isShuttingDown = false;
let consecutiveFailures = 0;

function createModules() {
  lookController = new LookController();
  perception = new Perception(bot);
  movement = new Movement(bot);
  brain = new Brain(bot, perception, movement, lookController);
}

function startMainLoop() {
  if (mainLoop) clearInterval(mainLoop);
  mainLoop = setInterval(() => {
    if (!bot || !bot.entity) return;
    if (isShuttingDown) return;
    try {
      brain.update();
      lookController.update(50);
      const look = lookController.getCurrentLook();
      if (Number.isFinite(look.yaw) && Number.isFinite(look.pitch)) {
        bot.look(look.yaw, look.pitch);
      }
      movement.update(50, lookController);
    } catch (err) {
      log('error', 'error', 'Main loop error:', err.message);
    }
  }, 50);
}

async function connect() {
  if (isShuttingDown) return;
  log('connect', 'info', `Connecting to ${config.host}:${config.port}...`);
  if (config.version) {
    log('connect', 'info', `Minecraft version: ${config.version}`);
  } else {
    log('connect', 'info', 'Minecraft version: auto-detect');
  }

  try {
    const botOptions = {
      host: config.host,
      port: config.port,
      username: config.username,
      auth: config.auth,
    };
    if (config.version) {
      botOptions.version = config.version;
    }

    bot = mineflayer.createBot(botOptions);
    createModules();

    bot.once('spawn', () => {
      log('connect', 'info', 'Spawned into the world.');
      consecutiveFailures = 0;
      Memory.recordEvent('spawn');
      if (config.autonomous && brain) {
        brain.currentGoal = 'wander';
        brain.lastGoalChange = Date.now();
        movement.pickWanderTarget();
      }
      if (lookController) {
        lookController.currentYaw = randomRange(0, 360);
        lookController.currentPitch = randomRange(-20, 20);
      }
    });

    bot.on('chat', (username, message) => {
      if (username === bot.username) return;
      log('chat', 'info', `<${username}> ${message}`);
      if (!config.chat || !brain) return;
      brain.handleChat(message, username);
    });

    bot.on('playerJoin', (player) => {
      log('perception', 'info', `Player joined: ${player.username}`);
      Memory.rememberPlayer(player.username, {
        notes: ['Joined the server'],
      });
      Memory.recordEvent('player_join', { name: player.username });
    });

    bot.on('playerLeave', (player) => {
      log('perception', 'info', `Player left: ${player.username}`);
      Memory.recordEvent('player_leave', { name: player.username });
    });

    bot.on('disconnect', (reason) => {
      log('connect', 'warn', `Disconnected: ${reason || 'Unknown reason'}`);
      Memory.recordEvent('disconnect', { reason: reason || 'unknown' });
      cleanup();
      scheduleReconnect();
    });

    bot.on('kicked', (reason) => {
      log('connect', 'warn', `Kicked: ${reason || 'Unknown reason'}`);
      Memory.recordEvent('kicked', { reason: reason || 'unknown' });
      cleanup();
      scheduleReconnect();
    });

    bot.on('error', (err) => {
      log('error', 'error', `Bot error: ${err.message}`);
      Memory.recordEvent('error', { message: err.message });
    });

    bot.on('death', () => {
      log('connect', 'warn', 'Bot died, waiting to respawn...');
      Memory.recordEvent('death');
    });

    bot.on('respawn', () => {
      log('connect', 'info', 'Bot respawned.');
      Memory.recordEvent('respawn');
      if (config.autonomous && brain && movement) {
        movement.stop();
        movement.startNaturalPause();
        brain.currentGoal = 'wander';
        brain.lastGoalChange = Date.now();
      }
    });

    bot.once('end', () => {
      log('connect', 'warn', 'Connection ended.');
      cleanup();
      scheduleReconnect();
    });

  } catch (err) {
    log('error', 'error', `Connection failed: ${err.message}`);
    consecutiveFailures++;
    cleanup();
    scheduleReconnect();
  }
}

function cleanup() {
  if (mainLoop) {
    clearInterval(mainLoop);
    mainLoop = null;
  }
  if (bot) {
    try {
      bot.removeAllListeners();
    } catch (e) {}
    try {
      bot.end();
    } catch (e) {}
    bot = null;
  }
  brain = null;
  perception = null;
  movement = null;
  lookController = null;
}

function scheduleReconnect() {
  if (isShuttingDown) return;
  const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts), MAX_RECONNECT_DELAY);
  reconnectAttempts++;
  log('connect', 'warn', `Reconnecting in ${Math.round(delay / 1000)}s (attempt ${reconnectAttempts})...`);
  setTimeout(() => {
    if (!isShuttingDown) {
      connect();
    }
  }, delay);
}

function gracefulShutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  log('connect', 'info', 'Shutting down...');
  cleanup();
  try {
    Memory.save();
  } catch (e) {}
  if (mainLoop) clearInterval(mainLoop);
  process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

if (config.memory) {
  log('memory', 'info', `Memory loaded: ${Object.keys(Memory.data.players || {}).length} known players`);
}

connect();

log('connect', 'info', `Luna AI starting... (${config.username})`);
log('connect', 'info', `Target: ${config.host}:${config.port}`);
log('connect', 'info', 'Press Ctrl+C to stop.');
