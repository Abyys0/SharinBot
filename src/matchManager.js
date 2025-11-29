const { PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../config.json');

class MatchManager {
  constructor(database, client) {
    this.db = database;
    this.client = client;
  }

  async createMatchChannel(guild, modeName, modeType, matchValue, matchType, players) {
    try {
      // Criar nome do canal
      const timestamp = Date.now();
      const channelName = `partida-${matchValue}r-${timestamp.toString().slice(-6)}`;

      // Criar permissões
      const permissionOverwrites = [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        }
      ];

      // Adicionar jogadores
      for (const playerId of players) {
        permissionOverwrites.push({
          id: playerId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        });
      }

      // Adicionar admins (suporta múltiplos cargos)
      if (config.adminRoleId) {
        const adminRoles = config.adminRoleId.split(',').map(id => id.trim());
        for (const roleId of adminRoles) {
          permissionOverwrites.push({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.ManageMessages
            ]
          });
        }
      }

      // Criar canal
      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: permissionOverwrites
      });

      // Criar partida no banco
      const result = this.db.createMatch(
        channel.id,
        modeName,
        modeType,
        matchValue,
        matchType,
        players
      );

      this.db.updateMatchChannel(result.lastInsertRowid, channel.id);

      // Enviar mensagem inicial
      const playerMentions = players.map(id => `<@${id}>`).join(' ');
      
      await channel.send({
        content: `${playerMentions}\n\n🎮 **Partida Criada!**\n\n**Modo:** ${modeName}\n**Valor:** R$ ${matchValue},00\n**Tipo:** ${matchType}\n\nAguardando confirmação de pagamento...`
      });

      return { success: true, channel, matchId: result.lastInsertRowid };
    } catch (error) {
      console.error('Erro ao criar canal de partida:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteMatchChannel(channelId) {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel) {
        await channel.delete();
      }
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar canal:', error);
      return { success: false, error: error.message };
    }
  }

  getMatch(matchChannelId) {
    return this.db.getMatchByChannelId(matchChannelId);
  }

  updateMatchStatus(matchId, status) {
    return this.db.updateMatchStatus(matchId, status);
  }

  completeMatch(matchId, winnerId) {
    return this.db.completeMatch(matchId, winnerId);
  }
}

module.exports = MatchManager;
