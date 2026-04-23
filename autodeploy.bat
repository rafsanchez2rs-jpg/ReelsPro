@echo off
setlocal enableextensions enabledelayedexpansion

:: CONFIGURAÇÃO
set "WORKDIR=D:\ReelsFlow IA"

echo [Deploy] Iniciando no diretório: %WORKDIR%
cd /d "%WORKDIR%" || (
  echo N�o foi poss�vel acessar o diret�rio.
  exit /b 1
)

:: 1) Garantir origin existe
git remote | findstr /I "^origin$" >nul
if errorlevel 1 (
  echo [Git] Adicionando remote origin...
  git remote add origin https://github.com/rafsanchez2rs-jpg/ReelsPro.git
)

:: 2) Buscar/Atualizar main
echo [Git] Buscando origem...
git fetch origin
echo [Git] Checando out main...
git checkout main
echo [Git] Atualizando origin/main...
git pull origin main

:: 3) Remover lockfile conflitante (se houver)
if exist package-lock.json del package-lock.json

:: 4) Escolha do gerenciador de pacotes
where yarn >nul 2>&1
if %ERRORLEVEL%==0 (
  echo [Deploy] Usando yarn
  yarn install
  yarn build
  set "BUILD_OK=%ERRORLEVEL%"
) else (
  echo [Deploy] Yarn n�o encontrado. Usando npm
  npm install
  npm run build
  set "BUILD_OK=%ERRORLEVEL%"
)

:: 5) Verificação de build
if "%BUILD_OK%"=="0" (
  echo [Build] Sucesso!
  :: 5a) Commits automáticos (se houver mudanças)
  for /f %%i in ('git status --porcelain') do set HAS_CHANGES=1
  if defined HAS_CHANGES (
    git add -A
    git commit -m "deploy: post-build sync"
    git push origin main
  ) else (
    echo [Git] Sem mudan�as para commitar.
  )
) else (
  echo [Build] Falhou. Ver logs acima.
  exit /b 1
)

echo [Deploy] Conclu�do.
pause