const Goals = {
  IDLE: 'idle',
  WANDER: 'wander',
  OBSERVE: 'observe',
  GREET: 'greet',
  FOLLOW: 'follow',
  RESPOND: 'respond',
  EXPLORE: 'explore',
};

const GoalWeights = [
  { value: Goals.IDLE, weight: 3 },
  { value: Goals.WANDER, weight: 4 },
  { value: Goals.OBSERVE, weight: 2 },
  { value: Goals.EXPLORE, weight: 1 },
];

function getWeightedGoal() {
  const totalWeight = GoalWeights.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of GoalWeights) {
    random -= item.weight;
    if (random <= 0) return item.value;
  }
  return GoalWeights[GoalWeights.length - 1].value;
}

function shouldPickNewGoal(currentGoal, nearbyPlayers, hasRecentChat) {
  if (hasRecentChat) return false;
  if (nearbyPlayers.length > 0 && Math.random() < 0.3) return true;
  if (Math.random() < 0.005) return true;
  if (currentGoal === Goals.IDLE && Math.random() < 0.02) return true;
  if (currentGoal === Goals.WANDER && Math.random() < 0.01) return true;
  return false;
}

function getGoalForChatCommand(text, nearbyPlayers) {
  const lower = text.toLowerCase();
  if (lower.includes('follow me') || lower.includes('come here')) {
    const player = nearbyPlayers[0];
    if (player) return { goal: Goals.FOLLOW, target: player.name };
    return { goal: Goals.RESPOND, text: 'I don\'t see anyone to follow!' };
  }
  if (lower.includes('stop')) {
    return { goal: Goals.IDLE, text: 'Okay, stopping.' };
  }
  if (lower.includes('come')) {
    const player = nearbyPlayers[0];
    if (player) return { goal: Goals.FOLLOW, target: player.name };
    return { goal: Goals.RESPOND, text: 'Where?' };
  }
  return null;
}

module.exports = {
  Goals,
  getWeightedGoal,
  shouldPickNewGoal,
  getGoalForChatCommand,
};
