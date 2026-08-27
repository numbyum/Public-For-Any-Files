const { angleDiff, normalizeAngle, randomRange, randomInt, clamp, lerp } = require('../utils/math');

class LookController {
  constructor() {
    this.currentYaw = 0;
    this.currentPitch = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.turnSpeed = randomRange(0.03, 0.06);
    this.baseTurnSpeed = this.turnSpeed;
    this.lookAtTarget = null;
    this.idleTimer = 0;
    this.idleInterval = randomInt(3000, 8000);
    this.idleLookActive = false;
    this.idleYawTarget = 0;
    this.idlePitchTarget = 0;
    this.overshootYaw = 0;
    this.overshootPitch = 0;
    this.overshootActive = false;
    this.overshootTimer = 0;
    this.overshootDuration = 0;
    this.overshootAmount = 0;
    this.overshootStartYaw = 0;
    this.overshootStartPitch = 0;
    this.overshootTargetYaw = 0;
    this.overshootTargetPitch = 0;
  }

  lookAtYaw(yaw) {
    this.targetYaw = normalizeAngle(yaw);
    this.lookAtTarget = null;
    this.overshootActive = false;
    this.idleLookActive = false;
    this.turnSpeed = randomRange(0.03, 0.06);
  }

  lookAtPitch(pitch) {
    this.targetPitch = clamp(pitch, -90, 90);
    this.lookAtTarget = null;
    this.overshootActive = false;
    this.idleLookActive = false;
  }

  lookAt(yaw, pitch) {
    this.lookAtYaw(yaw);
    this.lookAtPitch(pitch);
  }

  lookAtEntity(entity) {
    if (!entity || !entity.position) return;
    this.lookAtTarget = entity;
  }

  update(deltaMs) {
    const dt = clamp(deltaMs / 1000, 0, 0.1);
    this.turnSpeed = this.baseTurnSpeed;

    if (this.lookAtTarget && this.lookAtTarget.position) {
      const pos = this.lookAtTarget.position;
      this.targetYaw = normalizeAngle(Math.atan2(-pos.x, pos.z) * 180 / Math.PI);
      this.targetPitch = normalizeAngle(-Math.atan2(pos.y, Math.sqrt(pos.x * pos.x + pos.z * pos.z)) * 180 / Math.PI);
      if (this.targetPitch > 90) this.targetPitch = 90;
      if (this.targetPitch < -90) this.targetPitch = -90;
    }

    if (this.overshootActive) {
      this.overshootTimer -= dt;
      const t = 1 - clamp(this.overshootTimer / this.overshootDuration, 0, 1);
      const eased = easeInOutCubic(t);
      this.currentYaw = lerp(this.overshootStartYaw, this.overshootTargetYaw, eased);
      this.currentPitch = lerp(this.overshootStartPitch, this.overshootTargetPitch, eased);
      if (this.overshootTimer <= 0) {
        this.overshootActive = false;
        this.currentYaw = this.overshootTargetYaw;
        this.currentPitch = this.overshootTargetPitch;
      }
      return;
    }

    if (this.idleLookActive) {
      this.idleTimer -= dt * 1000;
      if (this.idleTimer <= 0) {
        this.idleLookActive = false;
        this.idleInterval = randomInt(3000, 8000);
      }
      this.currentYaw = lerp(this.currentYaw, this.idleYawTarget, this.turnSpeed * 0.5);
      this.currentPitch = lerp(this.currentPitch, this.idlePitchTarget, this.turnSpeed * 0.5);
      return;
    }

    const yawDiff = angleDiff(this.currentYaw, this.targetYaw);
    const pitchDiff = this.targetPitch - this.currentPitch;

    if (Math.abs(yawDiff) < 0.5 && Math.abs(pitchDiff) < 0.3) {
      this.currentYaw = this.targetYaw;
      this.currentPitch = this.targetPitch;

      this.idleTimer += deltaMs;
      if (this.idleTimer > this.idleInterval && Math.random() < 0.01) {
        this.startIdleLook();
      }
      return;
    }

    const speedVar = randomRange(0.8, 1.2);
    const speed = this.turnSpeed * speedVar;

    if (Math.abs(yawDiff) > 30 && Math.random() < 0.03) {
      this.startOvershoot(this.targetYaw, this.targetPitch);
      return;
    }

    this.currentYaw = lerp(this.currentYaw, this.targetYaw, speed);
    this.currentPitch = lerp(this.currentPitch, this.targetPitch, speed * 0.8);
  }

  startIdleLook() {
    this.idleLookActive = true;
    this.idleTimer = randomInt(1000, 3000);
    this.idleYawTarget = normalizeAngle(this.currentYaw + randomRange(-40, 40));
    this.idlePitchTarget = clamp(this.currentPitch + randomRange(-20, 20), -60, 60);
  }

  startOvershoot(targetYaw, targetPitch) {
    if (this.overshootActive) return;
    this.overshootActive = true;
    this.overshootDuration = randomRange(0.4, 0.8);
    this.overshootTimer = this.overshootDuration;
    this.overshootAmount = randomRange(5, 15) * (Math.random() < 0.5 ? 1 : -1);
    this.overshootStartYaw = this.currentYaw;
    this.overshootStartPitch = this.currentPitch;
    this.overshootTargetYaw = normalizeAngle(targetYaw + this.overshootAmount);
    this.overshootTargetPitch = clamp(targetPitch + randomRange(-3, 3), -70, 70);
  }

  getCurrentLook() {
    return {
      yaw: this.currentYaw,
      pitch: this.currentPitch,
    };
  }

  isTurning() {
    const yawDiff = Math.abs(angleDiff(this.currentYaw, this.targetYaw));
    const pitchDiff = Math.abs(this.targetPitch - this.currentPitch);
    return yawDiff > 1 || pitchDiff > 1;
  }

  reset() {
    this.lookAtTarget = null;
    this.idleLookActive = false;
    this.overshootActive = false;
  }
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

module.exports = LookController;
