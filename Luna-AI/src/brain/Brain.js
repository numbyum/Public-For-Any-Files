const Personality = require('./Personality');
const { Goals, getWeightedGoal, shouldPickNewGoal } = require('./Goals');
const { BehaviorPlanner, States } = require('./BehaviorPlanner');
const InterestSystem = require('./InterestSystem');
const Memory = require('../memory/Memory');
const ChatModule = require('./ChatModule');
const WorldScanner = require('../perception/WorldScanner');
const Scheduler = require('./Scheduler');

class Brain {
  constructor(bot, perception, movement, lookController, config) {
    this.bot = bot;
    this.perception = perception;
    this.movement = movement;
    this.lookController = lookController;
    this.config = config;
    this.planner = new BehaviorPlanner();
    this.interests = new InterestSystem();
    this.chatModule = new ChatModule(bot, config);
    this.worldScanner = new WorldScanner(bot);
    this.scheduler = new Scheduler();
    this.followTarget = null;
    this.lastGoalChange = Date.now();
    this.goalInterval = 5000;
    this.idleLookTimer = 0;
    this.idleLookInterval = randomRange(2000, 6000);
    this.lastWorldScan = 0;
  }

  update() {
    this.perception.update();
    this.chatModule.process();
    this.interests.update(0.05);
    this.scheduler.update();
    this.evaluateGoal();
    this.executeGoal();
    this.scanWorld();
  }

  scanWorld() {
    const now = Date.now();
    if (now - this.lastWorldScan < 2000) return;
    this.lastWorldScan = now;
    const world = this.worldScanner.scan();
    if (world && world.interestingBlocks.length > 0) {
      const block = world.interestingBlocks[0];
      if (Math.random() < 0.1 && this.planner.getState() === States.WANDERING) {
        this.planner.transition(States.OBSERVING, 'interesting block');
        const moveTarget = { x: block.x, y: block.y, z: block.z };
        this.movement.setTarget(moveTarget);
      }
    }
  }

  evaluateGoal() {
    const now = Date.now();
    if (now - this.lastGoalChange < this.goalInterval) return;

    const nearbyPlayers = this.perception.nearbyPlayers;
    const hasRecentChat = this.perception.hasRecentChat();

    if (nearbyPlayers.length > 0) {
      this.interests.boost('players', 0.1);
    }

    if (shouldPickNewGoal(this.planner.getState(), nearbyPlayers, hasRecentChat)) {
      this.lastGoalChange = now;
      const goal = getWeightedGoal();
      this.mapGoalToState(goal);
    }
  }

  mapGoalToState(goal) {
    switch (goal) {
      case Goals.IDLE:
        this.planner.transition(States.IDLE, 'goal');
        break;
      case Goals.WANDER:
        this.planner.transition(States.WANDERING, 'goal');
        this.movement.pickWanderTarget();
        break;
      case Goals.OBSERVE:
        this.planner.transition(States.OBSERVING, 'goal');
        break;
      case Goals.EXPLORE:
        this.planner.transition(States.EXPLORING, 'goal');
        break;
      default:
        this.planner.transition(States.WANDERING, 'goal');
        this.movement.pickWanderTarget();
    }
    this.goalInterval = randomRange(4000, 12000);
    this.followTarget = null;
    this.movement.stopFollowing();
  }

  executeGoal() {
    const state = this.planner.getState();
    const nearbyPlayers = this.perception.nearbyPlayers;

    switch (state) {
      case States.IDLE:
        this.executeIdle();
        break;
      case States.WANDERING:
        this.executeWander();
        break;
      case States.OBSERVING:
        this.executeObserve();
        break;
      case States.EXPLORING:
        this.executeExplore();
        break;
      case States.GREETING:
        this.executeGreet();
        break;
      case States.FOLLOWING:
        this.executeFollow();
        break;
      case States.RESPONDING:
        this.executeRespond();
        break;
      case States.INVESTIGATING:
        this.executeInvestigate();
        break;
    }

    if (nearbyPlayers.length > 0 && state !== States.FOLLOWING && state !== States.GREETING) {
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
        const goal = getWeightedGoal();
        this.mapGoalToState(goal);
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

  executeInvestigate() {
    const world = this.worldScanner.scan();
    if (world && world.interestingBlocks.length > 0) {
      const block = world.interestingBlocks[0];
      this.lookController.lookAtEntity({ position: { x: block.x, y: block.y, z: block.z } });
      if (block.distance > 3) {
        this.movement.setTarget({ x: block.x, y: block.y, z: block.z });
      } else {
        this.movement.stop();
        if (Math.random() < 0.3) {
          this.planner.transition(States.OBSERVING, 'investigated');
        }
      }
    } else {
      this.planner.transition(States.WANDERING, 'nothing to investigate');
    }
  }

  executeGreet() {
    const player = this.perception.getPlayer(this.followTarget);
    if (!player) {
      this.planner.transition(States.IDLE, 'player gone');
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
      this.planner.transition(States.IDLE, 'greeting done');
      this.followTarget = null;
    }
  }

  executeFollow() {
    if (!this.followTarget) {
      this.planner.transition(States.IDLE, 'no target');
      return;
    }
    const player = this.perception.getPlayer(this.followTarget);
    if (!player) {
      this.movement.stopFollowing();
      this.planner.transition(States.IDLE, 'player gone');
      this.followTarget = null;
      return;
    }
    this.movement.followPlayer(this.followTarget);
    this.lookController.lookAtEntity(player.entity);
  }

  executeRespond() {
    this.movement.stop();
    if (this.chatModule.queue.length === 0) {
      this.planner.transition(States.IDLE, 'done responding');
      this.followTarget = null;
    }
  }

  handleChat(text, sender = null) {
    const result = this.chatModule.handleIncoming(text, sender);
    if (result.action === 'greet') {
      this.planner.transition(States.GREETING, 'chat greet');
      this.followTarget = result.target;
      this.lastGoalChange = Date.now();
      this.goalInterval = randomRange(5000, 15000);
    } else if (result.action === 'follow') {
      this.planner.transition(States.FOLLOWING, 'chat follow');
      this.followTarget = result.target;
      this.lastGoalChange = Date.now();
      this.goalInterval = 60000;
    } else if (result.action === 'stop') {
      this.movement.stopFollowing();
      this.movement.stop();
      this.planner.transition(States.IDLE, 'chat stop');
      this.followTarget = null;
      this.lastGoalChange = Date.now();
      this.chatModule.enqueue('Okay, stopping.', sender);
    } else if (result.action === 'respond') {
      this.planner.transition(States.RESPONDING, 'chat respond');
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

  setupSchedules() {
    this.scheduler.addInterval(45000, () => {
      this.chatModule.maybeSpontaneousComment();
    });
    this.scheduler.addInterval(30000, () => {
      this.interests.decay('blocks', 0.05);
      this.interests.decay('entities', 0.05);
      this.interests.decay('structures', 0.05);
      this.interests.decay('biomes', 0.05);
    });
  }

  getStatus() {
    return {
      state: this.planner.getState(),
      previousState: this.planner.getPreviousState(),
      followTarget: this.followTarget,
      chatQueueLength: this.chatModule.getQueueLength(),
      chatBusy: this.chatModule.isBusy(),
      lastGoalChange: this.lastGoalChange,
      stateAge: this.planner.getStateAge(),
      scheduledTasks: this.scheduler.getPendingCount(),
    };
  }
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

module.exports = Brain;
