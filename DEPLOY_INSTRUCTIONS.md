# 🚀 INSTRUÇÕES DE DEPLOY - SharinBot

## ✅ O que foi implementado

### 1. **Servidor HTTP (Keep-Alive)**
- Bot não dorme mais no Render
- Servidor HTTP na porta 3000 (ou PORT do ambiente)
- Endpoint `/health` para monitoramento
- Auto-ping a cada 5 minutos

### 2. **Sistema de Auto-Recuperação**
- Recupera automaticamente todas as filas após restart
- Mensagens de fila são restauradas do banco de dados
- Jogadores mantêm suas posições na fila
- Não precisa recriar mensagens após restart!

### 3. **Suporte a Variáveis de Ambiente**
- Usa `config.json` localmente
- Usa variáveis de ambiente no Render
- Arquivo `config.loader.js` gerencia os dois modos

### 4. **Arquivos para Deploy**
- ✅ `Procfile` - Configuração Render/Heroku
- ✅ `deploy.bat` - Script Windows para enviar ao GitHub
- ✅ `deploy.sh` - Script Linux/Mac para enviar ao GitHub
- ✅ `config.example.json` - Template de configuração
- ✅ `RENDER_DEPLOY.md` - Guia completo de deploy
- ✅ `.gitignore` atualizado (não envia data.json)

---

## 📋 CHECKLIST DE DEPLOY

### Passo 1: Preparar Repositório
```bash
# Windows
deploy.bat

# Linux/Mac
chmod +x deploy.sh
./deploy.sh
```

### Passo 2: Configurar Render

1. Acesse: https://render.com
2. Faça login com GitHub
3. Clique em "New +" → "Web Service"
4. Conecte: `Abyys0/SharinBot`

### Passo 3: Configurações do Serviço

**Build & Deploy:**
```
Name: sharinbot
Environment: Node
Branch: main
Build Command: npm install
Start Command: npm start
```

**Plan:** Free

### Passo 4: Variáveis de Ambiente

Adicione no dashboard do Render:

```
BOT_TOKEN=seu_token_aqui
CLIENT_ID=seu_client_id
GUILD_ID=seu_guild_id
ADMIN_ROLE_ID=role1,role2,role3
RANKING_CHANNEL_ID=seu_canal_ranking
TICKET_CATEGORY_ID=categoria_tickets
TICKET_CHANNEL_ID=canal_tickets
```

### Passo 5: Deploy

1. Clique em "Create Web Service"
2. Aguarde o build completar (2-3 minutos)
3. Bot estará online! ✅

---

## 🔍 Verificação

### Teste 1: Status do Bot
```
https://seu-app.onrender.com/health
```

Deve retornar:
```json
{
  "status": "online",
  "uptime": 12345,
  "timestamp": "2025-11-28T..."
}
```

### Teste 2: Discord
1. Entre no servidor
2. Use `/setup` em um canal
3. Entre na fila
4. Verifique se tudo funciona

### Teste 3: Auto-Recuperação
1. Entre em uma fila
2. Reinicie o bot no Render (Manual Restart)
3. Verifique se a fila ainda está lá ✅

---

## 🎯 Recursos do Bot Online

### ✅ Funciona 24/7
- Servidor HTTP mantém bot ativo
- Não dorme como bots tradicionais

### ✅ Auto-Recuperação
- Recupera filas após restart
- Não perde dados de jogadores
- Mensagens são restauradas automaticamente

### ✅ Persistência de Dados
- `data.json` mantido entre restarts
- Ranking preservado
- Histórico de partidas salvo

### ✅ Monitoramento
- Endpoint `/health` para status
- Logs disponíveis no dashboard
- Alertas de erro por email (Render)

---

## 📊 Após Deploy

### Comandos Disponíveis
- `/setup` - Criar fila de partidas
- `/ranking` - Ver ranking
- `/resetranking` - Resetar ranking (admin)
- `/setupticket` - Criar sistema de tickets (admin)
- `/clear` - Limpar mensagens do bot (admin)

### Sistema Automático
- ✅ Reset mensal do ranking (dia 1)
- ✅ Atualização de ranking a cada hora
- ✅ Auto-recuperação de filas
- ✅ Keep-alive (ping a cada 5min)

---

## 🆘 Troubleshooting

### Bot não inicia
- Verifique variáveis de ambiente
- Veja logs no dashboard do Render
- Confira se o token está correto

### Filas não recuperam
- Verifique se `data.json` existe
- Confira logs do console
- Teste localmente primeiro

### Bot "dorme"
- Verifique se servidor HTTP está rodando
- URL: `https://seu-app.onrender.com/health`
- Keep-alive deve fazer ping a cada 5min

---

## 📞 Suporte

**Repositório:** https://github.com/Abyys0/SharinBot
**Documentação:** README.md
**Guia Deploy:** RENDER_DEPLOY.md

---

## 🎉 Pronto!

Seu bot agora está:
- ✅ Online 24/7
- ✅ Auto-recuperação após restart
- ✅ Monitoramento de saúde
- ✅ Dados persistentes
- ✅ Grátis no Render!

**Bom jogo! 🎮**
