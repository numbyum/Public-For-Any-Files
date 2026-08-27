class InterestSystem {
  constructor() {
    this.interests = {
      players: 0.9,
      blocks: 0.5,
      entities: 0.6,
      structures: 0.4,
      biomes: 0.3,
    };
    this.currentFocus = null;
    this.focusTimer = 0;
    this.focusDuration = 0;
    this.decayRate = 0.001;
  }

  update(dt) {
    if (this.currentFocus) {
      this.focusTimer += dt;
      if (this.focusTimer > this.focusDuration) {
        this.currentFocus = null;
        this.focusTimer = 0;
      }
    }
  }

  setFocus(interest, duration = null) {
    if (!this.interests.hasOwnProperty(interest)) return false;
    this.currentFocus = interest;
    this.focusTimer = 0;
    this.focusDuration = duration || randomRange(5000, 15000);
    return true;
  }

  getInterest(interest) {
    if (!this.interests.hasOwnProperty(interest)) return 0;
    let value = this.interests[interest];
    if (this.currentFocus === interest) {
      value += 0.3;
    }
    return Math.min(1, value);
  }

  decay(interest, amount) {
    if (!this.interests.hasOwnProperty(interest)) return;
    this.interests[interest] = Math.max(0.1, this.interests[interest] - amount);
  }

  boost(interest, amount) {
    if (!this.interests.hasOwnProperty(interest)) return;
    this.interests[interest] = Math.min(1, this.interests[interest] + amount);
  }

  getTopInterest() {
    let top = null;
    let topValue = 0;
    for (const [interest, value] of Object.entries(this.interests)) {
      if (value > topValue) {
        topValue = value;
        top = interest;
      }
    }
    return top;
  }

  getStatus() {
    return {
      currentFocus: this.currentFocus,
      focusAge: this.focusTimer,
      interests: { ...this.interests },
    };
  }
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

module.exports = InterestSystem;
