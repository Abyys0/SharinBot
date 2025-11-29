# Render Deployment Guide

## Deploy Steps

1. **Prepare Repository**
   - Commit all changes to GitHub
   - Make sure `config.json` is NOT in the repository (use environment variables)

2. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create New Web Service**
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repository: `Abyys0/SharinBot`

4. **Configure Service**
   - **Name**: sharinbot (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. **Environment Variables**
   Add these in Render dashboard:
   ```
   BOT_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id
   GUILD_ID=your_guild_id
   ADMIN_ROLE_ID=role1,role2,role3
   RANKING_CHANNEL_ID=your_ranking_channel_id
   TICKET_CATEGORY_ID=your_ticket_category_id
   TICKET_CHANNEL_ID=your_ticket_channel_id
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Bot will automatically start and stay online!

## Features for Render

✅ **Auto-recovery**: Bot automatically recovers queue messages after restart
✅ **Keep-alive**: HTTP server prevents bot from sleeping
✅ **Health check**: Available at `/health` endpoint
✅ **Persistent data**: Uses JSON file storage

## Notes

- Free tier: Bot may sleep after 15 minutes of inactivity
- Keep-alive: Internal ping every 5 minutes to prevent sleep
- Data persistence: `data.json` is maintained across restarts
- Logs: Available in Render dashboard

## Monitoring

Check bot status:
```
https://your-app-name.onrender.com/health
```

Response:
```json
{
  "status": "online",
  "uptime": 12345,
  "timestamp": "2025-11-28T00:00:00.000Z"
}
```
