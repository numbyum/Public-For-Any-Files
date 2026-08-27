const { randomRange, randomInt } = require('../utils/math');

const States = {
  IDLE: 'idle',
  WANDERING: 'wandering',
  OBSERVING: 'observing',
  GREETING: 'greeting',
  FOLLOWING: 'following',
  RESPONDING: 'responding',
  EXPLORING: 'exploring',
  INVESTIGATING: 'investigating',
};

const Transitions = {
  IDLE: [States.WANDERING, States.OBSERVING, States.EXPLORING],
  WANDERING: [States.IDLE, States.OBSERVING, States.EXPLORING],
  OBSERVING: [States.IDLE, States.WANDERING, States.GREETING, States.INVESTIGATING],
  GREETING: [States.IDLE, States.OBSERVING, States.FOLLOWING],
  FOLLOWING: [States.IDLE, States.OBSERVING],
  RESPONDING: [States.IDLE, States.WANDERING],
  EXPLORING: [States.IDLE, States.WANDERING, States.OBSERVING],
  INVESTIGATING: [States.IDLE, States.OBSERVING, States.WANDERING],
};

const StateWeights = {
  [States.IDLE]: 3,
  [States.WANDERING]: 4,
  [States.OBSERVING]: 2,
  [States.EXPLORING]: 1,
  [States.INVESTIGATING]: 1,
};

class BehaviorPlanner {
  constructor() {
    this.currentState = States.IDLE;
    this.previousState = null;
    this.stateStartTime = Date.now();
    this.stateDuration = 0;
    this.transitionHistory = [];
    this.maxHistory = 100;
  }

  getState() {
    return this.currentState;
  }

  getPreviousState() {
    return this.previousState;
  }

  getStateAge() {
    return Date.now() - this.stateStartTime;
  }

  transition(newState, reason = '') {
    const allowed = Transitions[this.currentState] || [];
    if (!allowed.includes(newState)) {
      return false;
    }
    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateStartTime = Date.now();
    this.stateDuration = randomRange(3000, 15000);
    this.transitionHistory.push({
      from: this.previousState,
      to: newState,
      reason,
      timestamp: Date.now(),
    });
    if (this.transitionHistory.length > this.maxHistory) {
      this.transitionHistory = this.transitionHistory.slice(-this.maxHistory);
    }
    return true;
  }

  maybeTransition(nearbyPlayers, hasRecentChat) {
    const age = this.getStateAge();
    if (age < this.stateDuration) return false;

    const weights = [];
    const allowed = Transitions[this.currentState] || [];
    for (const state of allowed) {
      weights.push({ value: state, weight: StateWeights[state] || 1 });
    }

    const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    for (const item of weights) {
      random -= item.weight;
      if (random <= 0) {
        return this.transition(item.value, 'timeout');
      }
    }
    return false;
  }

  shouldTransitionImmediately(newState) {
    return this.transition(newState, 'immediate');
  }

  getHistory(limit = 20) {
    return this.transitionHistory.slice(-limit);
  }

  reset() {
    this.currentState = States.IDLE;
    this.previousState = null;
    this.stateStartTime = Date.now();
    this.stateDuration = randomRange(3000, 8000);
  }
}

module.exports = { BehaviorPlanner, States };
