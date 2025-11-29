#!/bin/bash

echo "================================"
echo "  SharinBot - Deploy para GitHub"
echo "================================"
echo ""

# Verificar se o git está inicializado
if [ ! -d .git ]; then
    echo "Inicializando repositório Git..."
    git init
    git branch -M main
    echo ""
fi

# Adicionar remote se não existir
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "Adicionando repositório remoto..."
    git remote add origin https://github.com/Abyys0/SharinBot.git
    echo ""
fi

echo "Adicionando arquivos..."
git add .

echo ""
read -p "Digite a mensagem do commit: " commit_msg
if [ -z "$commit_msg" ]; then
    commit_msg="Update bot files"
fi

echo ""
echo "Fazendo commit..."
git commit -m "$commit_msg"

echo ""
echo "Enviando para GitHub..."
git push -u origin main

echo ""
echo "================================"
echo "  Deploy concluído!"
echo "================================"
echo ""
echo "Próximo passo:"
echo "1. Acesse render.com"
echo "2. Crie um novo Web Service"
echo "3. Conecte o repositório: Abyys0/SharinBot"
echo "4. Configure as variáveis de ambiente"
echo "5. Deploy!"
echo ""
