@echo off
echo Starting FULL manual deployment (Functions + Hosting)...
echo.
echo IMPORTANT: Make sure you have run 'npx firebase-tools login' first!
echo.
call npm run build
echo.
echo Deploying to claude-vertex-prod...
call npx firebase-tools deploy --project claude-vertex-prod
echo.
echo Done!
pause
