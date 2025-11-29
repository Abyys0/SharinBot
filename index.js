const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const config = require('./config.loader');
const Database = require('./src/database');
const QueueManager = require('./src/queueManager');
const MatchManager = require('./src/matchManager');
const RankingManager = require('./src/rankingManager');
const InteractionHandler = require('./src/interactionHandler');
const cron = require('node-cron');
const http = require('http');

// Criar cliente do Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

// Inicializar sistemas
const db = new Database();
const queueManager = new QueueManager(db);
const matchManager = new MatchManager(db, client);
const rankingManager = new RankingManager(db, client);
const interactionHandler = new InteractionHandler(queueManager, matchManager, rankingManager, db, client);

// Comandos slash
const commands = [
  {
    name: 'setup',
    description: 'Criar mensagem de partida no canal atual',
    options: [
      {
        name: 'modo',
        description: 'Modo de jogo (ex: 4v4 Mobile, 2v2 Emulador, etc.)',
        type: 3, // STRING
        required: true
      },
      {
        name: 'tipo',
        description: 'Tipo do modo (1x1, 2x2, 3x3, 4x4)',
        type: 3, // STRING
        required: true,
        choices: [
          { name: '1x1', value: '1x1' },
          { name: '2x2', value: '2x2' },
          { name: '3x3', value: '3x3' },
          { name: '4x4', value: '4x4' }
        ]
      }
    ]
  },
  {
    name: 'ranking',
    description: 'Mostrar o ranking de vitórias'
  },
  {
    name: 'resetranking',
    description: 'Resetar o ranking (apenas admins)'
  },
  {
    name: 'setupticket',
    description: 'Criar mensagem de abertura de tickets (apenas admins)'
  },
  {
    name: 'clear',
    description: 'Limpar todas as mensagens do bot no canal (apenas admins)',
    options: [
      {
        name: 'quantidade',
        description: 'Quantidade de mensagens a verificar (padrão: 100)',
        type: 4, // INTEGER
        required: false
      }
    ]
  }
];

// Registrar comandos
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(config.token);
  
  try {
    console.log('Registrando comandos slash...');
    
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );
    
    console.log('Comandos registrados com sucesso!');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
}

// Função para recuperar mensagens de fila após reinício
async function recoverQueueMessages() {
  try {
    console.log('Recuperando mensagens de fila...');
    const queues = db.getAllQueues();
    
    for (const queue of queues) {
      try {
        const channel = await client.channels.fetch(queue.channel_id);
        if (!channel) continue;
        
        const message = await channel.messages.fetch(queue.message_id);
        if (!message) continue;
        
        // Restaurar fila no gerenciador
        const queueKey = `${queue.channel_id}_${queue.match_value}_${queue.match_type}`;
        queueManager.queues.set(queueKey, {
          players: queue.players || [],
          message: message,
          modeName: queue.mode_name,
          modeType: queue.mode_type,
          matchValue: queue.match_value,
          matchType: queue.match_type
        });
        
        console.log(`✅ Fila recuperada: ${queue.mode_name} (${queue.match_type}) - R$${queue.match_value}`);
      } catch (err) {
        console.log(`⚠️ Não foi possível recuperar fila: ${err.message}`);
      }
    }
    
    console.log(`🔄 Recuperação concluída: ${queues.length} filas processadas`);
  } catch (error) {
    console.error('Erro ao recuperar mensagens:', error);
  }
}

// Evento: Bot pronto
client.once('ready', async () => {
  console.log(`Bot logado como ${client.user.tag}`);
  // Registrar comandos
  await registerCommands();
  
  // Recuperar mensagens de fila após reinício
  await recoverQueueMessages();
  
  // Agendar reset mensal do ranking (dia 1 às 00:00)
  cron.schedule('0 0 1 * *', () => {
    console.log('Resetando ranking mensal...');
    rankingManager.resetRanking();
  });
  
  // Atualizar ranking a cada hora
  cron.schedule('0 * * * *', () => {
    rankingManager.updateRankingChannel();
  });
  
  // Atualizar ranking inicial
  setTimeout(() => {
    rankingManager.updateRankingChannel();
  }, 3000);
});

// Evento: Comandos slash
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;
    
    if (commandName === 'setup') {
      await interactionHandler.handleSetupCommand(interaction);
    } else if (commandName === 'ranking') {
      await interactionHandler.handleRankingCommand(interaction);
    } else if (commandName === 'resetranking') {
      await interactionHandler.handleResetRankingCommand(interaction);
    } else if (commandName === 'setupticket') {
      await interactionHandler.handleSetupTicketCommand(interaction);
    } else if (commandName === 'clear') {
      await interactionHandler.handleClearCommand(interaction);
    }
  } else if (interaction.isButton()) {
    await interactionHandler.handleButtonInteraction(interaction);
  } else if (interaction.isStringSelectMenu()) {
    await interactionHandler.handleSelectMenuInteraction(interaction);
  }
});

// Servidor HTTP para manter o bot ativo (Render)
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('SharinBot is running!');
  }
});

server.listen(PORT, () => {
  console.log(`Servidor HTTP rodando na porta ${PORT}`);
});

// Manter o bot ativo fazendo ping em si mesmo a cada 5 minutos
setInterval(() => {
  http.get(`http://localhost:${PORT}/health`, (res) => {
    console.log(`Keep-alive ping: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('Erro no keep-alive:', err.message);
  });
}, 5 * 60 * 1000);

// Login do bot
client.login(config.token);
