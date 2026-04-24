@echo off
setlocal

rem Configurações
set "ROOT_DIR=D:\ReelsFlow IA"
set "BRANCH=feat/layout-ui-end2end"

echo [Deploy] Iniciando no diretório: %ROOT_DIR%
cd /d "%ROOT_DIR%" || (
  echo N�o foi poss�vel acessar o diret�rio
  goto :eof
)

echo [Git] Garantindo branch
git fetch origin
git ls-remote --exit-code --heads origin %BRANCH% >nul 2>&1
if ERRORLEVEL 1 (
  echo [Git] Branch nao encontrado no remoto; criando local e empurrando
  git checkout -b %BRANCH%
  git push -u origin %BRANCH%
) else (
  echo [Git] Fazendo checkout de %BRANCH%
  git checkout %BRANCH%
  git pull origin %BRANCH%
)

echo [Git] Mesclando main na branch
git merge origin/main -m "Merge main into %BRANCH%"
IF ERRORLEVEL 1 (
  echo Mesclagem falhou. Abortando.
  goto :eof
)

echo [Install] Instalando dependencias
if exist yarn.lock (
  yarn install
  yarn build
  set "BUILD_OK=%ERRORLEVEL%"
) else (
  npm install
  npm run build
  set "BUILD_OK=%ERRORLEVEL%"
)

if "%BUILD_OK%"=="0" (
  echo [Build] OK
  echo [Git] Empurrando branch
  git push -u origin %BRANCH%
) else (
  echo [Build] falhou. Ver logs acima.
  goto :eof
)

echo [PR] Tentando criar PR via gh (se instalado)
gh --version >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
  gh pr create --title "feat: Layout moderno + fluxo end-to-end" --body "$(cat <<'EOF'
## Sumário
- Layout moderno e responsivo com header fixo.
- Fluxo completo: upload de imagem, análise, geração do Reel e preview com dados extraídos.
- UI consistente: Cards, Buttons com tamanho, UploadDropzone e ReelPreview.
- Integração com back-end estável (env, supabase e actions) para deploy.

## Alterações
- layout.tsx
- page.tsx
- reel-generator-panel.tsx
- reel-preview.tsx
- button.tsx
- env.ts
- supabase/server.ts
- reels.actions.ts
- upload-dropzone.tsx

## Como testar
1) Deploy no Render
2) Teste o fluxo: upload, progresso, preview e dados extraídos
3) Verifique layout desktop e mobile

EOF" --base main --head %BRANCH%
) else (
  echo [PR] gh CLI nao encontrado. Abra o PR pela UI: https://github.com/rafsanchez2rs-jpg/ReelsPro/pulls
)

:end
pause