// Config loader with environment variable support
const fs = require('fs');
const path = require('path');

function loadConfig() {
  // Priorize environment variables first (for production/Render)
  if (process.env.BOT_TOKEN) {
    console.log('✅ Usando variáveis de ambiente');
    return {
      token: process.env.BOT_TOKEN,
      clientId: process.env.CLIENT_ID,
      guildId: process.env.GUILD_ID,
      adminRoleId: process.env.ADMIN_ROLE_ID,
      rankingChannelId: process.env.RANKING_CHANNEL_ID,
      ticketCategoryId: process.env.TICKET_CATEGORY_ID,
      ticketChannelId: process.env.TICKET_CHANNEL_ID,
      gameModes: {
        "1x1": 2,
        "2x2": 2,
        "3x3": 2,
        "4x4": 2
      },
      matchValues: [50, 20, 10, 7, 5, 3, 2, 1]
    };
  }
  
  // Try to load from config.local.json (for local development)
  const localConfigPath = path.join(__dirname, 'config.local.json');
  if (fs.existsSync(localConfigPath)) {
    console.log('✅ Usando config.local.json');
    return JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
  }
  
  // Fallback to config.json
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    console.log('⚠️ Usando config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  
  throw new Error('❌ Nenhuma configuração encontrada!');
}

module.exports = loadConfig();
