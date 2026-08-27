class Scheduler {
  constructor() {
    this.tasks = [];
    this.nextId = 1;
  }

  add(delay, callback, repeating = false, interval = null) {
    const task = {
      id: this.nextId++,
      callback,
      runAt: Date.now() + delay,
      repeating,
      interval,
    };
    this.tasks.push(task);
    return task.id;
  }

  addInterval(interval, callback) {
    return this.add(interval, callback, true, interval);
  }

  cancel(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
  }

  update() {
    const now = Date.now();
    const remaining = [];
    for (const task of this.tasks) {
      if (task.runAt > now) {
        remaining.push(task);
        continue;
      }
      try {
        task.callback();
      } catch (e) {
        console.error('[SCHEDULER] Task error:', e.message);
      }
      if (task.repeating && task.interval) {
        task.runAt = now + task.interval;
        remaining.push(task);
      }
    }
    this.tasks = remaining;
  }

  clear() {
    this.tasks = [];
  }

  getPendingCount() {
    return this.tasks.length;
  }
}

module.exports = Scheduler;
