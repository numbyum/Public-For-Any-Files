const Personality = require('./Personality');
const { Goals, getWeightedGoal, shouldPickNewGoal } = require('./Goals');
const Memory = require('../memory/Memory');
const ChatModule = require('./ChatModule');

class Brain {
  constructor(bot, perception, movement, lookController, config) {
    this.bot = bot;
    this.perception = perception;
    this.movement = movement;
    this.lookController = lookController;
    this.config = config;
    this.currentGoal = Goals.IDLE;
    this.followTarget = null;
    this.lastGoalChange = Date.now();
    this.goalInterval = 5000;
    this.chatModule = new ChatModule(bot, config);
    this.lastSpontaneousCheck = 0;
    this.spontaneousCheckInterval = 10000;
    this.idleLookTimer = 0;
    this.idleLookInterval = randomRange(2000, 6000);
  }

  update() {
    this.perception.update();
    this.chatModule.process();
    this.evaluateGoal();
    this.executeGoal();
    this.maybeSpontaneous();
  }

  evaluateGoal() {
    const now = Date.now();
    if (now - this.lastGoalChange < this.goalInterval) return;

    const nearbyPlayers = this.perception.nearbyPlayers;
    const hasRecentChat = this.perception.hasRecentChat();

    if (shouldPickNewGoal(this.currentGoal, nearbyPlayers, hasRecentChat)) {
      this.lastGoalChange = now;
      this.currentGoal = getWeightedGoal();
      this.goalInterval = randomRange(4000, 12000);
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
      if (closest.distance < 8 && Math.random() < 0.015) {
        this.lookController.lookAtEntity(closest.entity);
      }
    }
  }

  executeIdle() {
    this.movement.stop();
    this.idleLookTimer += 50;
    if (this.idleLookTimer > this.idleLookInterval) {
      this.idleLookTimer = 0;
      this.idleLookInterval = randomRange(2000, 6000);
      if (Math.random() < 0.6) {
        this.lookController.lookAt(
          this.lookController.currentYaw + randomRange(-50, 50),
          randomRange(-15, 15)
        );
      }
    }
  }

  executeWander() {
    this.movement.wander();
    if (Math.random() < 0.08) {
      this.lookController.lookAt(
        this.lookController.currentYaw + randomRange(-70, 70),
        randomRange(-25, 25)
      );
    }
    if (Math.random() < 0.04 && this.perception.nearbyPlayers.length > 0) {
      const player = this.perception.nearbyPlayers[0];
      this.lookController.lookAtEntity(player.entity);
    }
  }

  executeObserve() {
    this.movement.stop();
    if (this.perception.nearbyPlayers.length > 0) {
      const player = this.perception.nearbyPlayers[0];
      this.lookController.lookAtEntity(player.entity);
      if (Math.random() < 0.25 && player.distance > 5) {
        const moveTarget = {
          x: player.position.x + randomRange(-2, 2),
          y: player.position.y,
          z: player.position.z + randomRange(-2, 2),
        };
        this.movement.setTarget(moveTarget);
      }
    } else {
      if (Math.random() < 0.4) {
        this.lookController.lookAt(
          this.lookController.currentYaw + randomRange(-100, 100),
          randomRange(-25, 25)
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
        this.goalInterval = randomRange(4000, 12000);
      }
    } else {
      this.movement.wander();
    }
    if (Math.random() < 0.12) {
      this.lookController.lookAt(
        this.lookController.currentYaw + randomRange(-80, 80),
        randomRange(-20, 20)
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
      if (Math.random() < 0.25 && !this.chatModule.queue.some((c) => c.text.includes('Hi') || c.text.includes('Hey'))) {
        this.chatModule.enqueue(Personality.getGreeting(), player.name);
      }
    }
    if (Math.random() < 0.08) {
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
    if (this.chatModule.queue.length === 0) {
      this.currentGoal = Goals.IDLE;
      this.followTarget = null;
    }
  }

  handleChat(text, sender = null) {
    const result = this.chatModule.handleIncoming(text, sender);
    if (result.action === 'greet') {
      this.currentGoal = Goals.GREET;
      this.followTarget = result.target;
      this.lastGoalChange = Date.now();
      this.goalInterval = randomRange(5000, 15000);
    } else if (result.action === 'follow') {
      this.currentGoal = Goals.FOLLOW;
      this.followTarget = result.target;
      this.lastGoalChange = Date.now();
      this.goalInterval = 60000;
    } else if (result.action === 'stop') {
      this.movement.stopFollowing();
      this.movement.stop();
      this.currentGoal = Goals.IDLE;
      this.followTarget = null;
      this.lastGoalChange = Date.now();
      this.chatModule.enqueue('Okay, stopping.', sender);
    } else if (result.action === 'respond') {
      this.currentGoal = Goals.RESPOND;
      this.lastGoalChange = Date.now();
      this.goalInterval = randomRange(2000, 5000);
    }
  }

  maybeSpontaneous() {
    const now = Date.now();
    if (now - this.lastSpontaneousCheck < this.spontaneousCheckInterval) return;
    this.lastSpontaneousCheck = now;
    this.chatModule.maybeSpontaneousComment();
  }

  getStatus() {
    return {
      currentGoal: this.currentGoal,
      followTarget: this.followTarget,
      chatQueueLength: this.chatModule.getQueueLength(),
      chatBusy: this.chatModule.isBusy(),
      lastGoalChange: this.lastGoalChange,
    };
  }
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

module.exports = Brain;
