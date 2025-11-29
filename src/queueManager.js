const config = require('../config.json');

class QueueManager {
  constructor(database) {
    this.db = database;
    this.queues = new Map(); // channelId_value_type -> { players: [], modeName, modeType }
  }

  getQueueKey(channelId, matchValue, matchType) {
    return `${channelId}_${matchValue}_${matchType}`;
  }

  getQueue(channelId, matchValue, matchType) {
    const key = this.getQueueKey(channelId, matchValue, matchType);
    return this.queues.get(key) || { players: [], modeName: '', modeType: '' };
  }

  addPlayer(channelId, matchValue, matchType, userId, modeName, modeType) {
    const key = this.getQueueKey(channelId, matchValue, matchType);
    const queue = this.queues.get(key) || { players: [], modeName, modeType };

    // Verificar se jogador já está na fila
    if (queue.players.includes(userId)) {
      return { success: false, message: 'Você já está nesta fila!' };
    }

    // Verificar limite do modo
    const maxPlayers = config.gameModes[modeType];
    if (queue.players.length >= maxPlayers) {
      return { success: false, message: 'Fila cheia!' };
    }

    queue.players.push(userId);
    queue.modeName = modeName;
    queue.modeType = modeType;
    this.queues.set(key, queue);

    return { 
      success: true, 
      queue,
      isFull: queue.players.length === maxPlayers
    };
  }

  removePlayer(channelId, matchValue, matchType, userId) {
    const key = this.getQueueKey(channelId, matchValue, matchType);
    const queue = this.queues.get(key);

    if (!queue) {
      return { success: false, message: 'Você não está nesta fila!' };
    }

    const index = queue.players.indexOf(userId);
    if (index === -1) {
      return { success: false, message: 'Você não está nesta fila!' };
    }

    queue.players.splice(index, 1);

    // Remover fila se estiver vazia
    if (queue.players.length === 0) {
      this.queues.delete(key);
    } else {
      this.queues.set(key, queue);
    }

    return { success: true, queue };
  }

  clearQueue(channelId, matchValue, matchType) {
    const key = this.getQueueKey(channelId, matchValue, matchType);
    this.queues.delete(key);
    this.db.deleteQueue(channelId, matchValue, matchType);
  }

  isPlayerInAnyQueue(channelId, userId) {
    for (const [key, queue] of this.queues.entries()) {
      if (key.startsWith(channelId) && queue.players.includes(userId)) {
        return true;
      }
    }
    return false;
  }

  getPlayerQueueInfo(channelId, userId) {
    for (const [key, queue] of this.queues.entries()) {
      if (key.startsWith(channelId) && queue.players.includes(userId)) {
        const [, value, type] = key.split('_');
        return {
          matchValue: parseInt(value),
          matchType: type,
          queue
        };
      }
    }
    return null;
  }
}

module.exports = QueueManager;
