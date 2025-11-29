const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits 
} = require('discord.js');
const config = require('../config.json');

class InteractionHandler {
  constructor(queueManager, matchManager, rankingManager, database, client) {
    this.queueManager = queueManager;
    this.matchManager = matchManager;
    this.rankingManager = rankingManager;
    this.db = database;
    this.client = client;
  }

  // Helper para verificar se é admin (suporta múltiplos cargos)
  isAdmin(member) {
    const adminRoles = config.adminRoleId.split(',').map(id => id.trim());
    return adminRoles.some(roleId => member.roles.cache.has(roleId));
  }

  // Comando /setup
  async handleSetupCommand(interaction) {
    const modeName = interaction.options.getString('modo');
    const modeType = interaction.options.getString('tipo');

    if (!config.gameModes[modeType]) {
      return interaction.reply({ 
        content: '❌ Tipo de modo inválido!', 
        flags: 64
      });
    }

    // Responder imediatamente
    await interaction.reply({ 
      content: `⏳ Criando mensagens de partida para **${modeName}**...`, 
      flags: 64
    });

    // Ordenar valores do maior para o menor
    const sortedValues = [...config.matchValues].sort((a, b) => b - a);

    // Criar embeds e botões para cada valor
    for (const value of sortedValues) {
      const embed = this.createMatchEmbed(modeName, modeType, value);
      const components = this.createMatchButtons(value);

      await interaction.channel.send({
        embeds: [embed],
        components: components
      });
    }

    // Atualizar resposta
    await interaction.editReply({ 
      content: `✅ Mensagens de partida criadas para **${modeName}**!`
    });
  }

  // Comando /ranking
  async handleRankingCommand(interaction) {
    await this.rankingManager.sendRankingEmbed(interaction);
  }

  // Comando /resetranking
  async handleResetRankingCommand(interaction) {
    // Verificar se é admin
    if (!this.isAdmin(interaction.member)) {
      return interaction.reply({ 
        content: '❌ Apenas administradores podem resetar o ranking!', 
        flags: 64
      });
    }

    this.rankingManager.resetRanking();
    await interaction.reply({ 
      content: '✅ Ranking resetado com sucesso!', 
      flags: 64
    });
  }

  // Comando /setupticket
  async handleSetupTicketCommand(interaction) {
    // Verificar se é admin
    if (!this.isAdmin(interaction.member)) {
      return interaction.reply({ 
        content: '❌ Apenas administradores podem criar mensagem de tickets!', 
        flags: 64
      });
    }

    // Verificar se está no canal correto
    if (interaction.channel.id !== config.ticketChannelId) {
      return interaction.reply({ 
        content: `❌ Este comando só pode ser usado no canal <#${config.ticketChannelId}>!`, 
        flags: 64
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎫 Sistema de Tickets')
      .setDescription('Clique no botão abaixo para abrir um ticket e falar com a equipe.')
      .setColor('#00A8FF')
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId('open_ticket')
      .setLabel('📩 Abrir Ticket')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.channel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({ 
      content: '✅ Mensagem de tickets criada!', 
      flags: 64
    });
  }

  // Comando /clear
  async handleClearCommand(interaction) {
    // Verificar se é admin
    if (!this.isAdmin(interaction.member)) {
      return interaction.reply({ 
        content: '❌ Apenas administradores podem limpar mensagens!', 
        flags: 64
      });
    }

    const quantidade = interaction.options.getInteger('quantidade') || 100;

    await interaction.reply({ 
      content: `⏳ Buscando mensagens do bot...`, 
      flags: 64
    });

    try {
      // Buscar mensagens do canal
      const messages = await interaction.channel.messages.fetch({ limit: quantidade });
      
      // Filtrar apenas mensagens do bot
      const botMessages = messages.filter(msg => msg.author.id === this.client.user.id);

      if (botMessages.size === 0) {
        return interaction.editReply({ 
          content: '❌ Nenhuma mensagem do bot encontrada nas últimas mensagens!'
        });
      }

      // Deletar mensagens (máximo 100 por vez devido a limitação do Discord)
      let deletedCount = 0;
      for (const message of botMessages.values()) {
        try {
          await message.delete();
          deletedCount++;
        } catch (error) {
          console.error('Erro ao deletar mensagem:', error);
        }
      }

      await interaction.editReply({ 
        content: `✅ ${deletedCount} mensagem(ns) do bot foram deletadas!`
      });

      // Deletar a resposta após 5 segundos
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch (error) {
          console.error('Erro ao deletar resposta:', error);
        }
      }, 5000);

    } catch (error) {
      console.error('Erro ao limpar mensagens:', error);
      await interaction.editReply({ 
        content: '❌ Erro ao limpar mensagens. Verifique as permissões do bot.'
      });
    }
  }

  // Interação com botões
  async handleButtonInteraction(interaction) {
    const [action, ...params] = interaction.customId.split('_');

    switch (action) {
      case 'join':
        await this.handleJoinQueue(interaction, params);
        break;
      case 'leave':
        await this.handleLeaveQueue(interaction, params);
        break;
      case 'pronto':
        await this.handleProntoPartida(interaction);
        break;
      case 'liberar':
        await this.handleLiberar(interaction);
        break;
      case 'vitoria':
        await this.handleVitoria(interaction);
        break;
      case 'fechar':
        if (params[0] === 'partida') {
          await this.handleFecharPartida(interaction);
        }
        break;
      case 'open':
        if (params[0] === 'ticket') {
          await this.handleOpenTicket(interaction);
        }
        break;
      case 'close':
        if (params[0] === 'ticket') {
          await this.handleCloseTicket(interaction);
        }
        break;
      default:
        await interaction.reply({ 
          content: '❌ Ação desconhecida!', 
          flags: 64
        });
    }
  }

  // Entrar na fila
  async handleJoinQueue(interaction, params) {
    const [matchValue, matchType] = params;
    const channelId = interaction.channel.id;
    const userId = interaction.user.id;

    // Extrair informações do canal
    const channelName = interaction.channel.name;
    const modeName = this.extractModeName(channelName);
    const modeType = this.extractModeType(channelName);

    // Verificar se jogador já está em outra fila deste canal
    const existingQueue = this.queueManager.getPlayerQueueInfo(channelId, userId);
    if (existingQueue) {
      return interaction.reply({
        content: '❌ Você já está em uma fila! Saia da fila atual antes de entrar em outra.',
        flags: 64
      });
    }

    // Adicionar jogador
    const result = this.queueManager.addPlayer(
      channelId,
      parseInt(matchValue),
      matchType,
      userId,
      modeName,
      modeType
    );

    if (!result.success) {
      return interaction.reply({ 
        content: `❌ ${result.message}`, 
        flags: 64
      });
    }

    // Responder IMEDIATAMENTE
    await interaction.reply({ 
      content: `✅ Você entrou na fila! (${result.queue.players.length}/${config.gameModes[modeType]})`, 
      flags: 64
    });

    // Atualizar mensagem depois
    await this.updateQueueMessage(interaction.message, modeName, modeType, parseInt(matchValue), matchType, result.queue.players);

    // Se a fila estiver cheia, criar canal de partida
    if (result.isFull) {
      const guild = interaction.guild;
      const matchResult = await this.matchManager.createMatchChannel(
        guild,
        modeName,
        modeType,
        parseInt(matchValue),
        matchType,
        result.queue.players
      );

      if (matchResult.success) {
        // Limpar fila
        this.queueManager.clearQueue(channelId, parseInt(matchValue), matchType);

        // Atualizar mensagem
        await this.updateQueueMessage(interaction.message, modeName, modeType, parseInt(matchValue), matchType, []);

        // Notificar no canal principal e deletar após 1 minuto
        const notificationMsg = await interaction.channel.send({
          content: `🎮 Partida criada! ${result.queue.players.map(id => `<@${id}>`).join(' ')} - Acesse ${matchResult.channel}`
        });

        // Deletar notificação após 1 minuto
        setTimeout(async () => {
          try {
            await notificationMsg.delete();
          } catch (error) {
            console.error('Erro ao deletar mensagem de notificação:', error);
          }
        }, 60000);

        // Enviar botão de liberar no canal da partida
        await this.sendLiberarButton(matchResult.channel);
      }
    }
  }

  // Sair da fila
  async handleLeaveQueue(interaction, params) {
    const [matchValue, matchType] = params;
    const channelId = interaction.channel.id;
    const userId = interaction.user.id;

    const channelName = interaction.channel.name;
    const modeName = this.extractModeName(channelName);
    const modeType = this.extractModeType(channelName);

    const result = this.queueManager.removePlayer(
      channelId,
      parseInt(matchValue),
      matchType,
      userId
    );

    if (!result.success) {
      return interaction.reply({ 
        content: `❌ ${result.message}`, 
        flags: 64
      });
    }

    // Atualizar mensagem
    const players = result.queue ? result.queue.players : [];
    await this.updateQueueMessage(interaction.message, modeName, modeType, parseInt(matchValue), matchType, players);

    await interaction.reply({ 
      content: '✅ Você saiu da fila!', 
      flags: 64
    });
  }

  // Jogador confirma que está pronto
  async handleProntoPartida(interaction) {
    const match = this.matchManager.getMatch(interaction.channel.id);
    if (!match) {
      return interaction.reply({ 
        content: '❌ Partida não encontrada!', 
        flags: 64
      });
    }

    const userId = interaction.user.id;

    // Verificar se o jogador está na partida
    if (!match.players.includes(userId)) {
      return interaction.reply({ 
        content: '❌ Você não está nesta partida!', 
        flags: 64
      });
    }

    // Inicializar array de jogadores prontos se não existir
    if (!match.readyPlayers) {
      match.readyPlayers = [];
    }

    // Verificar se já confirmou
    if (match.readyPlayers.includes(userId)) {
      return interaction.reply({ 
        content: '✅ Você já confirmou que está pronto!', 
        flags: 64
      });
    }

    // Adicionar jogador aos prontos
    match.readyPlayers.push(userId);

    const totalPlayers = match.players.length;
    const readyCount = match.readyPlayers.length;

    await interaction.reply({ 
      content: `✅ Você confirmou presença! (${readyCount}/${totalPlayers} prontos)`, 
      flags: 64
    });

    // Verificar se todos confirmaram
    if (readyCount === totalPlayers) {
      // Atualizar mensagem original
      await interaction.message.edit({
        content: '✅ **Todos os jogadores estão prontos!**\n\n🎮 Um administrador deve liberar a partida agora.',
        components: []
      });

      // Enviar botão de liberar para admin
      const liberarButton = new ButtonBuilder()
        .setCustomId('liberar')
        .setLabel('✅ Liberar Partida')
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(liberarButton);

      await interaction.channel.send({
        content: '⏳ **Aguardando administrador liberar a partida...**',
        components: [row]
      });
    } else {
      // Atualizar mensagem mostrando progresso
      await interaction.message.edit({
        content: `⏳ **Aguardando confirmação de pagamento...**\n\n📢 Todos os jogadores devem clicar no botão "✅ Estou Pronto" para iniciar a partida!\n\n**Prontos: ${readyCount}/${totalPlayers}**\n${match.readyPlayers.map(id => `✅ <@${id}>`).join('\n')}`
      });
    }
  }

  // Liberar partida (admin)
  async handleLiberar(interaction) {
    // Verificar se é admin
    if (!this.isAdmin(interaction.member)) {
      return interaction.reply({ 
        content: '❌ Apenas administradores podem liberar partidas!', 
        flags: 64
      });
    }

    const match = this.matchManager.getMatch(interaction.channel.id);
    if (!match) {
      return interaction.reply({ 
        content: '❌ Partida não encontrada!', 
        flags: 64
      });
    }

    // Verificar se todos os jogadores confirmaram presença
    if (!match.readyPlayers || match.readyPlayers.length !== match.players.length) {
      return interaction.reply({ 
        content: '❌ Nem todos os jogadores confirmaram presença ainda!', 
        flags: 64
      });
    }

    // Atualizar status
    this.matchManager.updateMatchStatus(match.id, 'liberada');

    // Atualizar mensagem
    await interaction.message.edit({
      content: '✅ **Partida liberada!**\n\n🎮 A partida foi iniciada. Boa sorte!',
      components: []
    });

    await interaction.reply({ 
      content: '✅ Partida liberada! Os jogadores podem começar.'
    });

    // Enviar botão de vitória
    await this.sendVitoriaButton(interaction.channel);
  }

  // Registrar vitória (admin)
  async handleVitoria(interaction) {
    // Verificar se é admin
    if (!this.isAdmin(interaction.member)) {
      return interaction.reply({ 
        content: '❌ Apenas administradores podem registrar vitórias!', 
        flags: 64
      });
    }

    const match = this.matchManager.getMatch(interaction.channel.id);
    if (!match) {
      return interaction.reply({ 
        content: '❌ Partida não encontrada!', 
        flags: 64
      });
    }

    // Criar menu de seleção de vencedor com nomes
    const options = [];
    for (const playerId of match.players) {
      try {
        const member = await interaction.guild.members.fetch(playerId);
        options.push({
          label: member.user.username,
          value: playerId,
          description: `Selecionar ${member.user.username} como vencedor`
        });
      } catch (error) {
        options.push({
          label: `Jogador ${playerId}`,
          value: playerId,
          description: `Selecionar este jogador como vencedor`
        });
      }
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_winner')
      .setPlaceholder('Selecione o vencedor')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: '🏆 Selecione o vencedor da partida:',
      components: [row],
      flags: 64
    });
  }

  // Seleção de vencedor
  async handleSelectMenuInteraction(interaction) {
    if (interaction.customId === 'select_winner') {
      const winnerId = interaction.values[0];
      const match = this.matchManager.getMatch(interaction.channel.id);

      if (!match) {
        return interaction.reply({ 
          content: '❌ Partida não encontrada!', 
          flags: 64
        });
      }

      // Buscar informações do vencedor
      const winner = await interaction.guild.members.fetch(winnerId);

      // Registrar vitória
      this.matchManager.completeMatch(match.id, winnerId);
      this.rankingManager.addWin(winnerId, winner.user.username);

      // Atualizar ranking
      await this.rankingManager.updateRankingChannel();

      // Notificar com botão de fechar
      const closeButton = new ButtonBuilder()
        .setCustomId('fechar_partida')
        .setLabel('🔒 Fechar Canal')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(closeButton);

      await interaction.channel.send({
        content: `🏆 **VITÓRIA REGISTRADA!**\n\nVencedor: <@${winnerId}>\n\nClique no botão abaixo para fechar este canal.`,
        components: [row]
      });

      await interaction.reply({ 
        content: '✅ Vitória registrada com sucesso!', 
        flags: 64
      });
    }
  }

  // Fechar canal de partida
  async handleFecharPartida(interaction) {
    // Verificar se é admin
    if (!this.isAdmin(interaction.member)) {
      return interaction.reply({ 
        content: '❌ Apenas administradores podem fechar o canal!', 
        flags: 64
      });
    }

    const match = this.matchManager.getMatch(interaction.channel.id);
    if (!match) {
      return interaction.reply({ 
        content: '❌ Partida não encontrada!', 
        flags: 64
      });
    }

    // Verificar se a partida foi completada
    if (match.status !== 'completed') {
      return interaction.reply({ 
        content: '❌ A vitória ainda não foi registrada!', 
        flags: 64
      });
    }

    await interaction.reply({
      content: '🔒 Fechando canal em 5 segundos...'
    });

    const channelId = interaction.channel.id;
    setTimeout(async () => {
      await this.matchManager.deleteMatchChannel(channelId);
    }, 5000);
  }

  // Helpers
  createMatchEmbed(modeName, modeType, matchValue) {
    const maxPlayers = config.gameModes[modeType];
    
    return new EmbedBuilder()
      .setTitle(`🎮 ${modeName}`)
      .setColor('#00FF00')
      .addFields(
        { name: '💰 Valor', value: `R$ ${matchValue},00`, inline: true },
        { name: '🎯 Modo', value: modeType.toUpperCase(), inline: true },
        { name: '👥 Jogadores', value: `0/${maxPlayers}`, inline: true },
        { name: '📋 Fila Normal', value: 'Nenhum jogador na fila', inline: false },
        { name: '📋 Fila Full Ump Xm8', value: 'Nenhum jogador na fila', inline: false }
      )
      .setTimestamp();
  }

  createMatchButtons(matchValue) {
    const normalButton = new ButtonBuilder()
      .setCustomId(`join_${matchValue}_normal`)
      .setLabel('Normal')
      .setStyle(ButtonStyle.Success);

    const fullButton = new ButtonBuilder()
      .setCustomId(`join_${matchValue}_full`)
      .setLabel('Full Ump Xm8')
      .setStyle(ButtonStyle.Primary);

    const leaveNormalButton = new ButtonBuilder()
      .setCustomId(`leave_${matchValue}_normal`)
      .setLabel('Sair (Normal)')
      .setStyle(ButtonStyle.Danger);

    const leaveFullButton = new ButtonBuilder()
      .setCustomId(`leave_${matchValue}_full`)
      .setLabel('Sair (Full)')
      .setStyle(ButtonStyle.Danger);

    const row1 = new ActionRowBuilder().addComponents(normalButton, fullButton);
    const row2 = new ActionRowBuilder().addComponents(leaveNormalButton, leaveFullButton);

    return [row1, row2];
  }

  async updateQueueMessage(message, modeName, modeType, matchValue, matchType, players) {
    const maxPlayers = config.gameModes[modeType];
    
    // Buscar jogadores de ambas as filas
    const normalQueue = this.queueManager.getQueue(message.channel.id, matchValue, 'normal');
    const fullQueue = this.queueManager.getQueue(message.channel.id, matchValue, 'full');
    
    const normalPlayers = normalQueue?.players || [];
    const fullPlayers = fullQueue?.players || [];
    
    const normalList = normalPlayers.length > 0 
      ? normalPlayers.map(id => `<@${id}>`).join('\n')
      : 'Nenhum jogador na fila';
      
    const fullList = fullPlayers.length > 0 
      ? fullPlayers.map(id => `<@${id}>`).join('\n')
      : 'Nenhum jogador na fila';

    const totalPlayers = normalPlayers.length + fullPlayers.length;

    const embed = new EmbedBuilder()
      .setTitle(`🎮 ${modeName}`)
      .setColor('#00FF00')
      .addFields(
        { name: '💰 Valor', value: `R$ ${matchValue},00`, inline: true },
        { name: '🎯 Modo', value: modeType.toUpperCase(), inline: true },
        { name: '👥 Jogadores', value: `${totalPlayers}/${maxPlayers}`, inline: true },
        { name: '📋 Fila Normal', value: normalList, inline: false },
        { name: '📋 Fila Full Ump Xm8', value: fullList, inline: false }
      )
      .setTimestamp();

    await message.edit({ embeds: [embed] });
  }

  async sendLiberarButton(channel) {
    const button = new ButtonBuilder()
      .setCustomId('pronto')
      .setLabel('✅ Estou Pronto')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    // Armazenar jogadores prontos no manager
    const match = this.matchManager.getMatch(channel.id);
    if (match) {
      match.readyPlayers = [];
      this.db.updateMatchStatus(match.id, 'waiting_ready');
    }

    await channel.send({
      content: '⏳ **Aguardando confirmação de pagamento...**\n\n📢 Todos os jogadores devem clicar no botão "✅ Estou Pronto" para iniciar a partida!',
      components: [row]
    });
  }

  async sendVitoriaButton(channel) {
    const button = new ButtonBuilder()
      .setCustomId('vitoria')
      .setLabel('🏆 Registrar Vitória')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await channel.send({
      content: '🎮 **Partida em andamento!**\n\nQuando a partida terminar, o administrador deve registrar o vencedor.',
      components: [row]
    });
  }

  extractModeName(channelName) {
    // Tentar extrair do nome do canal ou usar padrão
    return channelName.replace(/-/g, ' ').toUpperCase();
  }

  extractModeType(channelName) {
    // Procurar padrão 1x1, 2x2, 3x3, 4x4 no nome
    const match = channelName.match(/(\d)x\d/);
    if (match) {
      return `${match[1]}x${match[1]}`;
    }
    return '4x4'; // Padrão
  }

  // Sistema de Tickets
  async handleOpenTicket(interaction) {
    try {
      // Verificar se usuário já tem ticket aberto
      const guild = interaction.guild;
      const existingTicket = guild.channels.cache.find(
        ch => ch.name === `ticket-${interaction.user.username.toLowerCase()}` && 
        ch.parentId === config.ticketCategoryId
      );

      if (existingTicket) {
        return interaction.reply({
          content: `❌ Você já tem um ticket aberto: ${existingTicket}`,
          flags: 64
        });
      }

      await interaction.reply({
        content: '⏳ Criando seu ticket...',
        flags: 64
      });

      // Criar canal do ticket
      const ticketChannel = await guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: 0, // GUILD_TEXT
        parent: config.ticketCategoryId,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles
            ]
          }
        ]
      });

      // Adicionar permissões para admins
      const adminRoles = config.adminRoleId.split(',').map(id => id.trim());
      for (const roleId of adminRoles) {
        await ticketChannel.permissionOverwrites.create(roleId, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          ManageMessages: true
        });
      }

      // Enviar mensagem no ticket
      const embed = new EmbedBuilder()
        .setTitle('🎫 Ticket Aberto')
        .setDescription(`Olá ${interaction.user}, bem-vindo ao seu ticket!\n\nDescreva sua dúvida ou problema e aguarde a equipe responder.`)
        .setColor('#00FF00')
        .setTimestamp();

      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('🔒 Fechar Ticket')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(closeButton);

      await ticketChannel.send({
        content: `${interaction.user} | Equipe: ${adminRoles.map(id => `<@&${id}>`).join(' ')}`,
        embeds: [embed],
        components: [row]
      });

      await interaction.editReply({
        content: `✅ Ticket criado: ${ticketChannel}`
      });

    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      await interaction.editReply({
        content: '❌ Erro ao criar ticket. Tente novamente.'
      });
    }
  }

  async handleCloseTicket(interaction) {
    try {
      // Verificar se está em um canal de ticket
      if (!interaction.channel.name.startsWith('ticket-')) {
        return interaction.reply({
          content: '❌ Este comando só funciona em canais de ticket!',
          flags: 64
        });
      }

      // Verificar se é o dono do ticket ou admin
      const ticketOwner = interaction.channel.name.replace('ticket-', '');
      const isOwner = interaction.user.username.toLowerCase() === ticketOwner.toLowerCase();
      const isAdmin = this.isAdmin(interaction.member);

      if (!isOwner && !isAdmin) {
        return interaction.reply({
          content: '❌ Apenas o dono do ticket ou admins podem fechá-lo!',
          flags: 64
        });
      }

      await interaction.reply({
        content: '🔒 Fechando ticket em 5 segundos...'
      });

      setTimeout(async () => {
        await interaction.channel.delete();
      }, 5000);

    } catch (error) {
      console.error('Erro ao fechar ticket:', error);
      await interaction.reply({
        content: '❌ Erro ao fechar ticket.',
        flags: 64
      });
    }
  }
}

module.exports = InteractionHandler;
