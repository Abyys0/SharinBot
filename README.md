# 🎮 Bot Sharingan - Sistema de Partidas Discord

Bot completo para gerenciamento de partidas, filas, ranking e tickets no Discord com suporte a múltiplos modos de jogo.

## 📋 Funcionalidades

### ✨ Principais Recursos

- **Organização por Canais**: Cada canal representa um modo de jogo diferente
- **Sistema de Filas**: Jogadores entram em filas com botões interativos (Normal e Full Ump Xm8)
- **Valores Personalizados**: Suporte para partidas de R$ 1 até R$ 50
- **Tipos de Jogo**: Normal e Full Ump Xm8 (filas separadas)
- **Canais Privados**: Criação automática de canais para partidas ativas
- **Sistema de Pronto**: Todos os jogadores devem confirmar antes de iniciar
- **Confirmação de Pagamento**: Sistema de liberação por administradores
- **Ranking de Vitórias**: Acompanhamento automático de vitórias
- **Reset Automático**: Ranking resetado todo dia 1º do mês
- **Sistema de Tickets**: Suporte e atendimento
- **Comando Clear**: Limpar mensagens do bot no canal

### 🎯 Modos de Jogo Suportados

- 1x1 (2 jogadores)
- 2x2 (2 jogadores)
- 3x3 (2 jogadores)
- 4v4 (2 jogadores)

## 🚀 Instalação

### Pré-requisitos

- Node.js 16.9.0 ou superior
- NPM ou Yarn
- Bot Discord criado no [Discord Developer Portal](https://discord.com/developers/applications)

### Passos de Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/Abyys0/SharinBot.git
cd SharinBot
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o bot**

Copie `config.example.json` para `config.json` e edite:

```json
{
  "token": "SEU_TOKEN_DO_BOT",
  "clientId": "ID_DA_APLICACAO",
  "guildId": "ID_DO_SERVIDOR",
  "adminRoleId": "ID_DO_CARGO_ADMIN",
  "rankingChannelId": "ID_DO_CANAL_RANKING",
  "gameModes": {
    "1x1": 2,
    "2x2": 4,
    "3x3": 6,
    "4x4": 8
  },
  "matchValues": [1, 2, 3, 5, 7, 10, 20, 50]
}
```

### 📝 Como Obter as Informações

#### Token do Bot
1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Selecione sua aplicação
3. Vá em "Bot" → "Token" → "Reset Token"
4. Copie o token (guarde com segurança!)

#### Client ID
1. No Developer Portal, vá em "General Information"
2. Copie o "Application ID"

#### Guild ID (ID do Servidor)
1. No Discord, ative o "Modo Desenvolvedor" (Configurações → Avançado → Modo Desenvolvedor)
2. Clique com botão direito no servidor → "Copiar ID"

#### Admin Role ID
1. No Discord, clique com botão direito no cargo de admin → "Copiar ID"

#### Ranking Channel ID
1. Crie um canal para o ranking (ex: `#ranking`)
2. Clique com botão direito no canal → "Copiar ID"

### 🔐 Permissões do Bot

Ao convidar o bot, certifique-se de que ele tenha as seguintes permissões:

- Gerenciar Canais
- Enviar Mensagens
- Incorporar Links
- Anexar Arquivos
- Ler Histórico de Mensagens
- Adicionar Reações
- Usar Comandos de Barra

Link de convite (substitua CLIENT_ID):
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

## 💻 Uso

### Iniciar o Bot

```bash
npm start
```

### Comandos

#### `/setup`
Cria as mensagens de partida no canal atual.

**Parâmetros:**
- `modo`: Nome do modo (ex: "4v4 Mobile", "2v2 Emulador")
- `tipo`: Tipo do modo (1x1, 2x2, 3x3, 4x4)

**Exemplo:**
```
/setup modo:4v4 Mobile tipo:4x4
```

#### `/ranking`
Mostra o ranking atual de vitórias (visível apenas para você).

#### `/resetranking`
Reseta o ranking (apenas administradores).

### 🎮 Fluxo de Uso

1. **Admin configura o canal**
   - Use `/setup` em cada canal de modo de jogo
   - Exemplo: `/setup modo:4v4 Mobile tipo:4x4`

2. **Jogadores entram na fila**
   - Clicam nos botões "Normal" ou "Full Ump Xm8"
   - Podem sair clicando em "Sair"

3. **Fila completa**
   - Bot cria automaticamente um canal privado
   - Apenas jogadores da partida e admins têm acesso

4. **Admin confirma pagamento**
   - No canal privado, clica em "✅ Liberar Partida"

5. **Partida acontece**
   - Jogadores jogam normalmente

6. **Admin registra vitória**
   - Clica em "🏆 Registrar Vitória"
   - Seleciona o vencedor
   - Ranking é atualizado automaticamente

7. **Canal é deletado**
   - Após 1 minuto do registro da vitória

## 📁 Estrutura do Projeto

```
Bot-Sharingan/
├── index.js                 # Arquivo principal
├── config.json             # Configurações
├── package.json            # Dependências
├── data.db                 # Banco de dados SQLite
└── src/
    ├── database.js         # Gerenciador do banco de dados
    ├── queueManager.js     # Sistema de filas
    ├── matchManager.js     # Gerenciador de partidas
    ├── rankingManager.js   # Sistema de ranking
    └── interactionHandler.js # Handlers de botões e comandos
```

## 🗄️ Banco de Dados

O bot usa SQLite para armazenar:

- **Filas**: Jogadores aguardando partidas
- **Partidas**: Histórico de partidas e status
- **Ranking**: Vitórias de cada jogador

O arquivo `data.db` é criado automaticamente na primeira execução.

## ⏰ Automações

### Reset Mensal do Ranking
- **Quando**: Todo dia 1º às 00:00
- **O que faz**: Zera o ranking de vitórias

### Atualização do Ranking
- **Quando**: A cada hora
- **O que faz**: Atualiza a mensagem do ranking no canal configurado

## 🎨 Personalização

### Adicionar Valores de Partida

Edite `matchValues` no `config.json`:
```json
"matchValues": [1, 2, 3, 5, 7, 10, 20, 50, 100]
```

### Adicionar Novos Modos

Edite `gameModes` no `config.json`:
```json
"gameModes": {
  "1x1": 2,
  "2x2": 4,
  "3x3": 6,
  "4x4": 8,
  "5x5": 10
}
```

### Cores dos Embeds

Edite os códigos de cor nos arquivos:
- `interactionHandler.js`: `.setColor('#00FF00')`
- `rankingManager.js`: `.setColor('#FFD700')`

## 🔧 Solução de Problemas

### Bot não responde
- Verifique se o token está correto em `config.json`
- Verifique se o bot está online no servidor
- Veja os logs no console para erros

### Comandos não aparecem
- Aguarde alguns minutos após iniciar o bot
- Verifique se o `clientId` e `guildId` estão corretos
- Tente reiniciar o bot

### Canal privado não é criado
- Verifique se o bot tem permissão "Gerenciar Canais"
- Verifique se o `adminRoleId` está correto

### Ranking não atualiza
- Verifique se o `rankingChannelId` está correto
- Verifique se o bot tem permissão de enviar mensagens no canal

## 📝 Logs

O bot registra informações importantes no console:
- Inicialização do banco de dados
- Registro de comandos
- Criação de canais de partida
- Atualizações do ranking
- Erros

## 🛡️ Segurança

- **Nunca compartilhe** seu `config.json` com o token
- Use `.gitignore` para não versionar arquivos sensíveis
- Apenas admins podem:
  - Liberar partidas
  - Registrar vitórias
  - Resetar ranking

## 📄 Licença

MIT License - Sinta-se livre para usar e modificar!

## 🌐 Deploy no Render (Gratuito)

### Por que Render?
- ✅ **Gratuito**: Plano free tier disponível
- ✅ **Auto-recovery**: Bot recupera filas automaticamente após restart
- ✅ **Keep-alive**: Servidor HTTP mantém o bot ativo
- ✅ **Fácil deploy**: Conecta direto com GitHub

### Passos para Deploy

1. **Enviar código para GitHub**
   ```bash
   # Windows
   deploy.bat
   
   # Linux/Mac
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Criar conta no Render**
   - Acesse [render.com](https://render.com)
   - Faça login com GitHub

3. **Criar Web Service**
   - Click "New +" → "Web Service"
   - Conecte repositório: `Abyys0/SharinBot`
   - Configure:
     - **Name**: sharinbot
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

4. **Configurar Variáveis de Ambiente**
   No dashboard do Render, adicione:
   ```
   BOT_TOKEN=seu_token_aqui
   CLIENT_ID=seu_client_id
   GUILD_ID=seu_guild_id
   ADMIN_ROLE_ID=role1,role2,role3
   RANKING_CHANNEL_ID=seu_canal_ranking
   TICKET_CATEGORY_ID=categoria_tickets
   TICKET_CHANNEL_ID=canal_tickets
   ```

5. **Deploy!**
   - Click "Create Web Service"
   - Aguarde o deploy completar
   - Bot ficará online 24/7! 🎉

### Monitoramento

Verifique status do bot:
```
https://seu-app.onrender.com/health
```

📖 **Guia completo**: Veja `RENDER_DEPLOY.md` para mais detalhes.

## 🤝 Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs do console
2. Revise as configurações em `config.json`
3. Certifique-se de que todas as permissões estão corretas

---

**Desenvolvido para a comunidade Discord** 🎮
