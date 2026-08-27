const { randomRange, randomInt, clamp, lerp } = require('../utils/math');

class Movement {
  constructor(bot) {
    this.bot = bot;
    this.targetPosition = null;
    this.currentVelocity = 0;
    this.targetVelocity = 0;
    this.maxSpeed = 4.3;
    this.acceleration = randomRange(0.8, 1.5);
    this.deceleration = randomRange(1.2, 2.5);
    this.isMoving = false;
    this.isSprinting = false;
    this.moveTimer = 0;
    this.moveDuration = 0;
    this.pauseTimer = 0;
    this.pauseDuration = 0;
    this.followTarget = null;
    this.followDistance = randomRange(2.5, 4);
    this.wanderYaw = 0;
    this.wanderWobble = 0;
    this.lastPosition = null;
    this.stuckTimer = 0;
    this.stuckThreshold = 2.0;
    this.stuckTimeout = 3000;
    this.naturalPauseActive = false;
    this.targetYaw = 0;
    this.yawWobbleAmount = 0;
    this.yawWobbleSpeed = 0;
    this.jumpCooldown = 0;
  }

  setTarget(position) {
    this.targetPosition = { x: position.x, y: position.y, z: position.z };
    this.followTarget = null;
    this.wanderYaw = this.calculateYawTo(position);
    this.isMoving = true;
    this.moveDuration = randomRange(3000, 8000);
    this.moveTimer = 0;
    this.pauseTimer = 0;
    this.naturalPauseActive = false;
    this.stuckTimer = 0;
    this.lastPosition = this.bot.entity.position.clone();
    this.yawWobbleAmount = randomRange(0.005, 0.02);
    this.yawWobbleSpeed = randomRange(1.5, 3.0);
  }

  wander() {
    if (this.naturalPauseActive) return;
    if (this.isMoving) {
      this.moveTimer += 16;
      if (this.moveTimer >= this.moveDuration) {
        this.stop();
        this.startNaturalPause();
        return;
      }
    }
    if (!this.isMoving) {
      this.wanderYaw = randomRange(0, 360);
      this.isMoving = true;
      this.moveDuration = randomRange(2000, 6000);
      this.moveTimer = 0;
      this.pauseTimer = 0;
      this.isSprinting = Math.random() < 0.35;
      this.stuckTimer = 0;
      this.lastPosition = this.bot.entity.position.clone();
      this.yawWobbleAmount = randomRange(0.005, 0.02);
      this.yawWobbleSpeed = randomRange(1.5, 3.0);
    }
    this.targetYaw = this.wanderYaw;
  }

  followPlayer(playerName) {
    this.followTarget = playerName;
    this.targetPosition = null;
  }

  stopFollowing() {
    this.followTarget = null;
    this.targetPosition = null;
    this.stop();
    this.startNaturalPause();
  }

  stop() {
    this.isMoving = false;
    this.isSprinting = false;
    this.targetVelocity = 0;
    this.currentVelocity = 0;
    this.targetPosition = null;
    try {
      this.bot.clearControlStates();
    } catch (e) {}
  }

  startNaturalPause() {
    this.naturalPauseActive = true;
    this.pauseDuration = randomRange(1000, 4000);
    this.pauseTimer = 0;
    this.moveDuration = 0;
    this.moveTimer = 0;
    try {
      this.bot.clearControlStates();
    } catch (e) {}
  }

  calculateYawTo(position) {
    if (!this.bot.entity) return 0;
    const pos = this.bot.entity.position;
    const dx = position.x - pos.x;
    const dz = position.z - pos.z;
    return (Math.atan2(-dx, dz) * 180) / Math.PI;
  }

  update(deltaMs, lookController) {
    const dt = clamp(deltaMs / 1000, 0, 0.1);

    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= deltaMs;
    }

    if (this.naturalPauseActive) {
      this.pauseTimer += deltaMs;
      if (this.pauseTimer >= this.pauseDuration) {
        this.naturalPauseActive = false;
        this.pauseTimer = 0;
      }
      return;
    }

    if (this.followTarget) {
      this.updateFollow(dt, lookController);
      return;
    }

    if (this.isMoving && this.targetPosition) {
      this.updateTargetMovement(dt, lookController);
    } else if (this.isMoving) {
      this.updateWanderMovement(dt, lookController);
    }

    if (this.isMoving) {
      this.updateVelocity(dt);
    }
  }

  updateFollow(dt, lookController) {
    if (!this.bot.entity) return;
    const players = this.bot.players;
    const targetPlayer = players[this.followTarget];
    if (!targetPlayer || !targetPlayer.entity) {
      this.stopFollowing();
      return;
    }

    const targetPos = targetPlayer.entity.position;
    const myPos = this.bot.entity.position;
    const dist = Math.sqrt(
      (targetPos.x - myPos.x) ** 2 +
      (targetPos.z - myPos.z) ** 2
    );

    if (dist > this.followDistance + 1.5) {
      this.isMoving = true;
      this.moveDuration = 10000;
      this.moveTimer = 0;
      this.isSprinting = Math.random() < 0.5;
      this.wanderYaw = this.calculateYawTo(targetPos);
      this.yawWobbleAmount = randomRange(0.005, 0.02);
      this.yawWobbleSpeed = randomRange(1.5, 3.0);
      this.stuckTimer = 0;
      this.lastPosition = myPos.clone();
    } else if (dist < this.followDistance - 1.0) {
      this.stop();
      return;
    } else {
      this.targetVelocity = 0;
      this.currentVelocity = Math.max(0, this.currentVelocity - this.deceleration * dt);
      if (this.currentVelocity < 0.1) {
        this.currentVelocity = 0;
      }
      return;
    }

    this.targetYaw = this.wanderYaw;
    if (lookController) {
      lookController.lookAt(this.wanderYaw + randomRange(-5, 5), randomRange(-5, 5));
    }
  }

  updateTargetMovement(dt, lookController) {
    if (!this.bot.entity || !this.targetPosition) return;
    const myPos = this.bot.entity.position;
    const target = this.targetPosition;
    const dist = Math.sqrt(
      (target.x - myPos.x) ** 2 +
      (target.z - myPos.z) ** 2
    );

    if (dist < 1.5) {
      this.stop();
      this.startNaturalPause();
      this.targetPosition = null;
      return;
    }

    this.wanderYaw = this.calculateYawTo(target);
    this.targetYaw = this.wanderYaw;
    if (lookController) {
      lookController.lookAt(this.wanderYaw, randomRange(-5, 5));
    }
    this.targetVelocity = this.maxSpeed;

    if (dist < 3) {
      this.targetVelocity = this.maxSpeed * 0.5;
    }

    if (dist < 5 && Math.random() < 0.02) {
      this.jump();
    }

    this.checkStuck(myPos);
  }

  updateWanderMovement(dt, lookController) {
    this.wanderWobble += this.yawWobbleSpeed * dt;
    const wobble = Math.sin(this.wanderWobble) * this.yawWobbleAmount;
    this.targetYaw = this.wanderYaw + wobble;
    if (lookController) {
      const pitch = Math.sin(this.wanderWobble * 0.7) * 3;
      lookController.lookAt(this.wanderYaw + wobble * 20, pitch);
    }
    this.targetVelocity = this.maxSpeed;

    if (Math.random() < 0.003) {
      this.jump();
    }

    if (this.bot.entity) {
      this.checkStuck(this.bot.entity.position);
    }
  }

  checkStuck(myPos) {
    if (this.lastPosition) {
      const dx = myPos.x - this.lastPosition.x;
      const dz = myPos.z - this.lastPosition.z;
      const moved = Math.sqrt(dx * dx + dz * dz);
      if (moved < 0.05) {
        this.stuckTimer += 16;
        if (this.stuckTimer > this.stuckTimeout) {
          this.stuckTimer = 0;
          this.wanderYaw = randomRange(0, 360);
          this.pickWanderTarget();
        }
      } else {
        this.stuckTimer = Math.max(0, this.stuckTimer - 16);
      }
    }
    this.lastPosition = myPos.clone();
  }

  updateVelocity(dt) {
    const targetV = this.targetVelocity;
    if (this.currentVelocity < targetV) {
      this.currentVelocity = Math.min(targetV, this.currentVelocity + this.acceleration * dt);
    } else if (this.currentVelocity > targetV) {
      this.currentVelocity = Math.max(targetV, this.currentVelocity - this.deceleration * dt);
    }

    const speedFraction = this.currentVelocity / this.maxSpeed;
    try {
      if (this.currentVelocity > 0.05) {
        this.bot.setControlState('forward', true);
        if (this.isSprinting && speedFraction > 0.8) {
          this.bot.setControlState('sprint', true);
        } else {
          this.bot.setControlState('sprint', false);
        }
      } else {
        this.bot.clearControlStates();
      }
    } catch (e) {}
  }

  jump() {
    if (this.jumpCooldown > 0) return;
    this.jumpCooldown = randomRange(500, 1500);
    try {
      this.bot.setControlState('jump', true);
      setTimeout(() => {
        try { this.bot.setControlState('jump', false); } catch (e) {}
      }, 200);
    } catch (e) {}
  }

  pickWanderTarget() {
    if (!this.bot.entity) return;
    const pos = this.bot.entity.position;
    const angle = randomRange(0, Math.PI * 2);
    const dist = randomRange(5, 15);
    this.targetPosition = {
      x: pos.x + Math.cos(angle) * dist,
      y: pos.y,
      z: pos.z + Math.sin(angle) * dist,
    };
    this.wanderYaw = this.calculateYawTo(this.targetPosition);
    this.isMoving = true;
    this.moveDuration = randomRange(3000, 8000);
    this.moveTimer = 0;
    this.pauseTimer = 0;
    this.stuckTimer = 0;
    this.lastPosition = pos.clone();
    this.yawWobbleAmount = randomRange(0.005, 0.02);
    this.yawWobbleSpeed = randomRange(1.5, 3.0);
  }

  isNearTarget(target, range) {
    if (!this.bot.entity || !target) return false;
    const pos = this.bot.entity.position;
    const dx = pos.x - target.x;
    const dy = pos.y - target.y;
    const dz = pos.z - target.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) < range;
  }

  getStatus() {
    return {
      isMoving: this.isMoving,
      isSprinting: this.isSprinting,
      velocity: this.currentVelocity,
      targetPosition: this.targetPosition,
      followTarget: this.followTarget,
      wanderYaw: this.wanderYaw,
      pathfindingActive: !!this.targetPosition,
    };
  }
}

module.exports = Movement;
