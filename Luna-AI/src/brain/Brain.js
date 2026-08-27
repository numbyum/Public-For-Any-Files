const Personality = require('./Personality');
const { Goals, getWeightedGoal, shouldPickNewGoal, getGoalForChatCommand } = require('./Goals');
const Memory = require('../memory/Memory');

class Brain {
  constructor(bot, perception, movement, lookController) {
    this.bot = bot;
    this.perception = perception;
    this.movement = movement;
    this.lookController = lookController;
    this.currentGoal = Goals.IDLE;
    this.followTarget = null;
    this.lastGoalChange = Date.now();
    this.goalInterval = 5000;
    this.chatQueue = [];
    this.isProcessingChat = false;
    this.lastChatProcess = 0;
    this.chatProcessCooldown = 1000;
    this.lastSpontaneousComment = 0;
    this.spontaneousCommentInterval = 30000;
  }

  update() {
    this.perception.update();
    this.processChatQueue();
    this.evaluateGoal();
    this.executeGoal();
  }

  evaluateGoal() {
    const now = Date.now();
    if (now - this.lastGoalChange < this.goalInterval) return;

    const nearbyPlayers = this.perception.nearbyPlayers;
    const hasRecentChat = this.perception.hasRecentChat();

    if (shouldPickNewGoal(this.currentGoal, nearbyPlayers, hasRecentChat)) {
      this.lastGoalChange = now;
      this.currentGoal = getWeightedGoal();
      this.goalInterval = randomRange(4000, 10000);
      this.followTarget = null;
      this.movement.stopFollowing();
      if (this.currentGoal === Goals.WANDER) {
        this.movement.pickWanderTarget();
      }
    }
  }

  executeGoal() {
    const nearbyPlayers = this.perception.nearbyPlayers;

    switch (this.currentGoal) {
      case Goals.IDLE:
        this.executeIdle();
        break;
      case Goals.WANDER:
        this.executeWander();
        break;
      case Goals.OBSERVE:
        this.executeObserve();
        break;
      case Goals.EXPLORE:
        this.executeExplore();
        break;
      case Goals.GREET:
        this.executeGreet();
        break;
      case Goals.FOLLOW:
        this.executeFollow();
        break;
      case Goals.RESPOND:
        this.executeRespond();
        break;
    }

    if (nearbyPlayers.length > 0 && this.currentGoal !== Goals.FOLLOW && this.currentGoal !== Goals.GREET) {
      const closest = nearbyPlayers[0];
      if (closest.distance < 8 && Math.random() < 0.02) {
        this.lookController.lookAtEntity(closest.entity);
      }
    }
  }

  executeIdle() {
    this.movement.stop();
    if (Math.random() < 0.3) {
      this.lookController.lookAt(
        this.lookController.currentYaw + randomRange(-60, 60),
        randomRange(-20, 20)
      );
    }
  }

  executeWander() {
    this.movement.wander();
    if (Math.random() < 0.1) {
      this.lookController.lookAt(
        this.lookController.currentYaw + randomRange(-90, 90),
        randomRange(-30, 30)
      );
    }
    if (Math.random() < 0.05 && this.perception.nearbyPlayers.length > 0) {
      const player = this.perception.nearbyPlayers[0];
      this.lookController.lookAtEntity(player.entity);
    }
  }

  executeObserve() {
    this.movement.stop();
    if (this.perception.nearbyPlayers.length > 0) {
      const player = this.perception.nearbyPlayers[0];
      this.lookController.lookAtEntity(player.entity);
      if (Math.random() < 0.3 && player.distance > 5) {
        const moveTarget = {
          x: player.position.x + randomRange(-2, 2),
          y: player.position.y,
          z: player.position.z + randomRange(-2, 2),
        };
        this.movement.setTarget(moveTarget);
      }
    } else {
      if (Math.random() < 0.5) {
        this.lookController.lookAt(
          this.lookController.currentYaw + randomRange(-120, 120),
          randomRange(-30, 30)
        );
      }
    }
  }

  executeExplore() {
    if (!this.movement.targetPosition || this.movement.isNearTarget(this.movement.targetPosition, 2)) {
      this.movement.stop();
      if (Math.random() < 0.5) {
        this.currentGoal = getWeightedGoal();
        this.lastGoalChange = Date.now();
        this.goalInterval = randomRange(4000, 10000);
      }
    } else {
      this.movement.wander();
    }
    if (Math.random() < 0.15) {
      this.lookController.lookAt(
        this.lookController.currentYaw + randomRange(-90, 90),
        randomRange(-25, 25)
      );
    }
  }

  executeGreet() {
    const player = this.perception.getPlayer(this.followTarget);
    if (!player) {
      this.currentGoal = Goals.IDLE;
      this.followTarget = null;
      return;
    }
    this.lookController.lookAtEntity(player.entity);
    if (player.distance > 4) {
      const moveTarget = {
        x: player.position.x + randomRange(-1.5, 1.5),
        y: player.position.y,
        z: player.position.z + randomRange(-1.5, 1.5),
      };
      this.movement.setTarget(moveTarget);
    } else {
      this.movement.stop();
      if (Math.random() < 0.3 && !this.chatQueue.some((c) => c.text.includes('Hi') || c.text.includes('Hey'))) {
        this.queueChat(Personality.getGreeting(), player.name);
      }
    }
    if (Math.random() < 0.1) {
      this.currentGoal = Goals.IDLE;
      this.followTarget = null;
    }
  }

  executeFollow() {
    if (!this.followTarget) {
      this.currentGoal = Goals.IDLE;
      return;
    }
    const player = this.perception.getPlayer(this.followTarget);
    if (!player) {
      this.movement.stopFollowing();
      this.currentGoal = Goals.IDLE;
      this.followTarget = null;
      return;
    }
    this.movement.followPlayer(this.followTarget);
    this.lookController.lookAtEntity(player.entity);
  }

  executeRespond() {
    this.movement.stop();
    if (this.chatQueue.length > 0 && !this.isProcessingChat) {
      const chat = this.chatQueue.shift();
      this.isProcessingChat = true;
      this.lastChatProcess = Date.now();
      if (chat.text && chat.text.trim()) {
        this.bot.chat(chat.text);
      }
      setTimeout(() => {
        this.isProcessingChat = false;
      }, this.chatProcessCooldown);
    }
    if (this.chatQueue.length === 0 && !this.isProcessingChat) {
      this.currentGoal = Goals.IDLE;
      this.followTarget = null;
    }
  }

  processChatQueue() {
    if (this.chatQueue.length === 0 || this.isProcessingChat) return;
    if (Date.now() - this.lastChatProcess < this.chatProcessCooldown) return;

    const chat = this.chatQueue.shift();
    this.isProcessingChat = true;
    this.lastChatProcess = Date.now();

    if (chat.text && chat.text.trim()) {
      try {
        this.bot.chat(chat.text);
      } catch (e) {
        console.error('[CHAT] Failed to send message:', e.message);
      }
    }

    setTimeout(() => {
      this.isProcessingChat = false;
    }, this.chatProcessCooldown);
  }

  handleChat(text, sender = null) {
    const lower = text.toLowerCase();

    this.perception.addChatMessage(text, sender);

    if (sender) {
      Memory.rememberPlayer(sender, {
        notes: ['Sent chat message'],
        description: `Known as "${sender}"`,
      });
    }

    if (lower.includes('hi luna') || lower.includes('hello luna') || lower.includes('hey luna')) {
      if (Personality.shouldGreet()) {
        this.queueChat(Personality.getGreeting(), sender);
        this.currentGoal = Goals.GREET;
        this.followTarget = sender;
        this.lastGoalChange = Date.now();
        this.goalInterval = randomRange(5000, 15000);
      }
      return;
    }

    if (lower.includes('what is your name') || lower.includes('your name') || lower.includes('who are you')) {
      this.queueChat(Personality.getResponse('name'), sender);
      return;
    }

    if (lower.includes('follow me') || lower.includes('come here') || lower.includes('follow')) {
      if (sender) {
        this.currentGoal = Goals.FOLLOW;
        this.followTarget = sender;
        this.lastGoalChange = Date.now();
        this.goalInterval = 60000;
        this.queueChat('Okay, following you!', sender);
      }
      return;
    }

    if (lower.includes('stop') || lower.includes('stay') || lower.includes('wait')) {
      this.movement.stopFollowing();
      this.movement.stop();
      this.currentGoal = Goals.IDLE;
      this.followTarget = null;
      this.lastGoalChange = Date.now();
      this.queueChat('Okay, stopping.', sender);
      return;
    }

    if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('see you')) {
      this.queueChat(Personality.getResponse('bye'), sender);
      return;
    }

    if (lower.includes('thank')) {
      this.queueChat(Personality.getResponse('thanks'), sender);
      return;
    }

    if (Math.random() < 0.3 && Personality.shouldRespond()) {
      const response = Personality.getResponse('default');
      this.queueChat(response, sender);
    }
  }

  queueChat(text, recipient = null) {
    let message = text;
    if (recipient) {
      message = `/tell ${recipient} ${text}`;
    }
    this.chatQueue.push({ text: message, timestamp: Date.now() });
  }

  getStatus() {
    return {
      currentGoal: this.currentGoal,
      followTarget: this.followTarget,
      chatQueueLength: this.chatQueue.length,
      isProcessingChat: this.isProcessingChat,
      lastGoalChange: this.lastGoalChange,
    };
  }
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

module.exports = Brain;
