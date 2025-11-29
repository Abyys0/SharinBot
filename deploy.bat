@echo off
echo ================================
echo   SharinBot - Deploy para GitHub
echo ================================
echo.

REM Verificar se o git esta inicializado
if not exist .git (
    echo Inicializando repositorio Git...
    git init
    git branch -M main
    echo.
)

REM Adicionar remote se nao existir
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Adicionando repositorio remoto...
    git remote add origin https://github.com/Abyys0/SharinBot.git
    echo.
)

echo Adicionando arquivos...
git add .

echo.
set /p commit_msg="Digite a mensagem do commit: "
if "%commit_msg%"=="" set commit_msg=Update bot files

echo.
echo Fazendo commit...
git commit -m "%commit_msg%"

echo.
echo Enviando para GitHub...
git push -u origin main

echo.
echo ================================
echo   Deploy concluido!
echo ================================
echo.
echo Proximo passo:
echo 1. Acesse render.com
echo 2. Crie um novo Web Service
echo 3. Conecte o repositorio: Abyys0/SharinBot
echo 4. Configure as variaveis de ambiente
echo 5. Deploy!
echo.
pause
