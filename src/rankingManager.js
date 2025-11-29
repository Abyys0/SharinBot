const { EmbedBuilder } = require('discord.js');
const config = require('../config.loader');

class RankingManager {
  constructor(database, client) {
    this.db = database;
    this.client = client;
  }

  addWin(userId, username) {
    return this.db.addWin(userId, username);
  }

  getRanking(limit = 10) {
    return this.db.getRanking(limit);
  }

  resetRanking() {
    this.db.resetRanking();
    this.updateRankingChannel();
    console.log('Ranking resetado com sucesso!');
  }

  async updateRankingChannel() {
    try {
      if (!config.rankingChannelId) {
        console.log('Canal de ranking não configurado');
        return;
      }

      const channel = await this.client.channels.fetch(config.rankingChannelId);
      if (!channel) {
        console.log('Canal de ranking não encontrado');
        return;
      }

      const ranking = this.getRanking(10);
      
      const embed = new EmbedBuilder()
        .setTitle('🏆 RANKING DE VITÓRIAS')
        .setColor('#FFD700')
        .setTimestamp();

      if (ranking.length === 0) {
        embed.setDescription('Nenhuma vitória registrada ainda.');
      } else {
        let description = '';
        const medals = ['🥇', '🥈', '🥉'];
        
        for (let i = 0; i < ranking.length; i++) {
          const player = ranking[i];
          const medal = i < 3 ? medals[i] : `**${i + 1}º**`;
          const wins = player.wins === 1 ? '1 vitória' : `${player.wins} vitórias`;
          description += `${medal} <@${player.user_id}> - ${wins}\n`;
        }
        
        embed.setDescription(description);
      }

      embed.setFooter({ text: 'Ranking resetado automaticamente todo dia 1° do mês' });

      // Buscar última mensagem do bot
      const messages = await channel.messages.fetch({ limit: 10 });
      const botMessage = messages.find(msg => msg.author.id === this.client.user.id);

      if (botMessage) {
        await botMessage.edit({ embeds: [embed] });
      } else {
        await channel.send({ embeds: [embed] });
      }

      console.log('Ranking atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar ranking:', error);
    }
  }

  async sendRankingEmbed(interaction) {
    const ranking = this.getRanking(10);
    
    const embed = new EmbedBuilder()
      .setTitle('🏆 RANKING DE VITÓRIAS')
      .setColor('#FFD700')
      .setTimestamp();

    if (ranking.length === 0) {
      embed.setDescription('Nenhuma vitória registrada ainda.');
    } else {
      let description = '';
      const medals = ['🥇', '🥈', '🥉'];
      
      for (let i = 0; i < ranking.length; i++) {
        const player = ranking[i];
        const medal = i < 3 ? medals[i] : `**${i + 1}º**`;
        const wins = player.wins === 1 ? '1 vitória' : `${player.wins} vitórias`;
        description += `${medal} <@${player.user_id}> - ${wins}\n`;
      }
      
      embed.setDescription(description);
    }

    embed.setFooter({ text: 'Ranking resetado automaticamente todo dia 1° do mês' });

    await interaction.reply({ embeds: [embed], flags: 64 });
  }
}

module.exports = RankingManager;
