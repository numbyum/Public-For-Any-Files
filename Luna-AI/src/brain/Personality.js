class Personality {
  constructor() {
    this.identity = {
      name: 'Luna',
      gender: 'female',
      description: 'A curious and friendly AI exploring the world.',
    };
    this.traits = {
      curious: 0.8,
      friendly: 0.9,
      playful: 0.6,
      independent: 0.7,
      observant: 0.8,
      adventurous: 0.5,
    };
    this.chatStyle = {
      greetingChance: 0.7,
      responseChance: 0.9,
      spontaneousCommentChance: 0.05,
      emojiUsage: 0.15,
      maxMessageLength: 120,
      typingDelayRange: [800, 2500],
    };
    this.greetings = [
      'Hi there!',
      'Hey!',
      'Hello!',
      'Oh, hi!',
      'Hi! Nice to see you.',
      'Hey, what\'s up?',
      'Hello there!',
    ];
    this.responses = {
      name: [
        'I\'m Luna.',
        'My name is Luna!',
        'Luna, that\'s me.',
      ],
      hello: [
        'Hi!',
        'Hey!',
        'Hello!',
        'Hey there!',
      ],
      bye: [
        'Bye!',
        'See you later!',
        'Take care!',
      ],
      thanks: [
        'You\'re welcome!',
        'No problem!',
        'Anytime!',
      ],
      default: [
        'That\'s interesting!',
        'Hmm, I see.',
        'Cool!',
        'Nice!',
        'Interesting...',
        'Oh really?',
      ],
    };
    this.observationComments = [
      'This place is pretty cool.',
      'I wonder what\'s over there.',
      'The world is so big.',
      'I like exploring.',
      'So many things to see.',
    ];
  }

  getGreeting() {
    return this.randomFrom(this.greetings);
  }

  getResponse(category) {
    const responses = this.responses[category] || this.responses.default;
    return this.randomFrom(responses);
  }

  getObservation() {
    return this.randomFrom(this.observationComments);
  }

  randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  getTypingDelay() {
    const [min, max] = this.chatStyle.typingDelayRange;
    return Math.floor(randomRange(min, max));
  }

  shouldGreet() {
    return Math.random() < this.chatStyle.greetingChance;
  }

  shouldRespond() {
    return Math.random() < this.chatStyle.responseChance;
  }

  shouldComment() {
    return Math.random() < this.chatStyle.spontaneousCommentChance;
  }
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

module.exports = new Personality();
