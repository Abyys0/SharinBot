const fs = require('fs');
const path = require('path');

class DatabaseManager {
  constructor() {
    this.dbPath = path.join(__dirname, '../data.json');
    this.db = {
      queues: [],
      matches: [],
      ranking: []
    };
    this.init();
  }

  init() {
    // Carregar dados se o arquivo existir
    if (fs.existsSync(this.dbPath)) {
      try {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        this.db = JSON.parse(data);
      } catch (error) {
        console.error('Erro ao carregar database:', error);
      }
    }
    
    // Garantir estrutura
    if (!this.db.queues) this.db.queues = [];
    if (!this.db.matches) this.db.matches = [];
    if (!this.db.ranking) this.db.ranking = [];
    
    this.save();
    console.log('Database inicializado com sucesso!');
  }

  save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2));
    } catch (error) {
      console.error('Erro ao salvar database:', error);
    }
  }

  // Filas
  saveQueue(channelId, messageId, modeName, modeType, matchValue, matchType, players) {
    const index = this.db.queues.findIndex(q => 
      q.channel_id === channelId && 
      q.match_value === matchValue && 
      q.match_type === matchType
    );
    
    const queue = {
      channel_id: channelId,
      message_id: messageId,
      mode_name: modeName,
      mode_type: modeType,
      match_value: matchValue,
      match_type: matchType,
      players: players,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if (index >= 0) {
      this.db.queues[index] = queue;
    } else {
      this.db.queues.push(queue);
    }
    
    this.save();
    return { lastInsertRowid: this.db.queues.length };
  }

  getQueue(channelId, matchValue, matchType) {
    return this.db.queues.find(q => 
      q.channel_id === channelId && 
      q.match_value === matchValue && 
      q.match_type === matchType
    );
  }

  deleteQueue(channelId, matchValue, matchType) {
    this.db.queues = this.db.queues.filter(q => 
      !(q.channel_id === channelId && 
        q.match_value === matchValue && 
        q.match_type === matchType)
    );
    this.save();
    return { changes: 1 };
  }

  // Partidas
  createMatch(channelId, modeName, modeType, matchValue, matchType, players) {
    const match = {
      id: this.db.matches.length + 1,
      channel_id: channelId,
      match_channel_id: null,
      mode_name: modeName,
      mode_type: modeType,
      match_value: matchValue,
      match_type: matchType,
      players: players,
      status: 'waiting',
      winner_id: null,
      created_at: new Date().toISOString(),
      completed_at: null
    };
    
    this.db.matches.push(match);
    this.save();
    return { lastInsertRowid: match.id };
  }

  updateMatchChannel(matchId, matchChannelId) {
    const match = this.db.matches.find(m => m.id === matchId);
    if (match) {
      match.match_channel_id = matchChannelId;
      this.save();
    }
    return { changes: 1 };
  }

  updateMatchStatus(matchId, status) {
    const match = this.db.matches.find(m => m.id === matchId);
    if (match) {
      match.status = status;
      this.save();
    }
    return { changes: 1 };
  }

  completeMatch(matchId, winnerId) {
    const match = this.db.matches.find(m => m.id === matchId);
    if (match) {
      match.status = 'completed';
      match.winner_id = winnerId;
      match.completed_at = new Date().toISOString();
      this.save();
    }
    return { changes: 1 };
  }

  getMatchByChannelId(matchChannelId) {
    return this.db.matches.find(m => m.match_channel_id === matchChannelId);
  }

  // Ranking
  addWin(userId, username) {
    const player = this.db.ranking.find(p => p.user_id === userId);
    
    if (player) {
      player.wins += 1;
      player.username = username;
      player.last_win = new Date().toISOString();
    } else {
      this.db.ranking.push({
        user_id: userId,
        username: username,
        wins: 1,
        last_win: new Date().toISOString()
      });
    }
    
    this.save();
    return { changes: 1 };
  }

  getRanking(limit = 10) {
    return this.db.ranking
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return new Date(b.last_win) - new Date(a.last_win);
      })
      .slice(0, limit);
  }

  resetRanking() {
    this.db.ranking = [];
    this.save();
    return { changes: 1 };
  }

  getUserStats(userId) {
    return this.db.ranking.find(p => p.user_id === userId);
  }

  // Recuperação de mensagens
  getAllQueues() {
    return this.db.queues || [];
  }

  close() {
    this.save();
  }
}

module.exports = DatabaseManager;

