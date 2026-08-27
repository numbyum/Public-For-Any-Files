const Personality = require('./Personality');
const Memory = require('../memory/Memory');

class ChatModule {
  constructor(bot, config) {
    this.bot = bot;
    this.config = config;
    this.queue = [];
    this.isProcessing = false;
    this.lastProcess = 0;
    this.cooldown = 1200;
    this.lastSpontaneous = 0;
    this.spontaneousInterval = 45000;
    this.maxQueueSize = 5;
  }

  enqueue(text, recipient = null) {
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift();
    }
    let message = text;
    if (recipient) {
      message = `/tell ${recipient} ${text}`;
    }
    this.queue.push({ text: message, timestamp: Date.now() });
  }

  process() {
    if (this.queue.length === 0 || this.isProcessing) return;
    if (Date.now() - this.lastProcess < this.cooldown) return;

    const chat = this.queue.shift();
    this.isProcessing = true;
    this.lastProcess = Date.now();

    if (chat.text && chat.text.trim()) {
      try {
        this.bot.chat(chat.text);
      } catch (e) {
        console.error('[CHAT] Failed to send message:', e.message);
      }
    }

    setTimeout(() => {
      this.isProcessing = false;
    }, this.cooldown);
  }

  handleIncoming(text, sender = null) {
    const lower = text.toLowerCase();

    if (sender) {
      Memory.rememberPlayer(sender, {
        notes: ['Sent chat message'],
        description: `Known as "${sender}"`,
      });
    }

    if (lower.includes('hi luna') || lower.includes('hello luna') || lower.includes('hey luna')) {
      if (Math.random() < 0.85) {
        this.enqueue(Personality.getGreeting(), sender);
        return { action: 'greet', target: sender };
      }
    }

    if (lower.includes('what is your name') || lower.includes('your name') || lower.includes('who are you')) {
      this.enqueue(Personality.getResponse('name'), sender);
      return { action: 'respond', text: Personality.getResponse('name') };
    }

    if (lower.includes('follow me') || lower.includes('come here') || lower.includes('follow')) {
      if (sender) {
        return { action: 'follow', target: sender };
      }
      this.enqueue('Where?', sender);
      return { action: 'respond', text: 'Where?' };
    }

    if (lower.includes('stop') || lower.includes('stay') || lower.includes('wait')) {
      return { action: 'stop' };
    }

    if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('see you')) {
      this.enqueue(Personality.getResponse('bye'), sender);
      return { action: 'respond', text: Personality.getResponse('bye') };
    }

    if (lower.includes('thank')) {
      this.enqueue(Personality.getResponse('thanks'), sender);
      return { action: 'respond', text: Personality.getResponse('thanks') };
    }

    if (Math.random() < 0.25) {
      const response = Personality.getResponse('default');
      this.enqueue(response, sender);
      return { action: 'respond', text: response };
    }

    return { action: 'none' };
  }

  maybeSpontaneousComment() {
    const now = Date.now();
    if (now - this.lastSpontaneous < this.spontaneousInterval) return false;
    if (Math.random() > 0.04) return false;
    this.lastSpontaneous = now;
    const comment = Personality.getObservation();
    this.enqueue(comment);
    return true;
  }

  getQueueLength() {
    return this.queue.length;
  }

  isBusy() {
    return this.isProcessing;
  }
}

module.exports = ChatModule;
