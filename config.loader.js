// Config loader with environment variable support
const fs = require('fs');
const path = require('path');

function loadConfig() {
  let config = {
    gameModes: {
      "1x1": 2,
      "2x2": 2,
      "3x3": 2,
      "4x4": 2
    },
    matchValues: [50, 20, 10, 7, 5, 3, 2, 1]
  };
  
  // Try to load from config.local.json first (for local development)
  const localConfigPath = path.join(__dirname, 'config.local.json');
  if (fs.existsSync(localConfigPath)) {
    config = { ...config, ...JSON.parse(fs.readFileSync(localConfigPath, 'utf8')) };
  } else {
    // Fallback to config.json
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config = { ...config, ...fileConfig };
    }
  }
  
  // Override with environment variables (for production)
  return {
    token: process.env.BOT_TOKEN || config.token,
    clientId: process.env.CLIENT_ID || config.clientId,
    guildId: process.env.GUILD_ID || config.guildId,
    adminRoleId: process.env.ADMIN_ROLE_ID || config.adminRoleId,
    rankingChannelId: process.env.RANKING_CHANNEL_ID || config.rankingChannelId,
    ticketCategoryId: process.env.TICKET_CATEGORY_ID || config.ticketCategoryId,
    ticketChannelId: process.env.TICKET_CHANNEL_ID || config.ticketChannelId,
    gameModes: config.gameModes,
    matchValues: config.matchValues
  };
}

module.exports = loadConfig();
