@echo off
echo Starting Deployment to claude-vertex-prod (using Service Account)...
echo.
set GOOGLE_APPLICATION_CREDENTIALS=%~dp0claude-vertex-prod-firebase-adminsdk-fbsvc-1cbb42469e.json
set FIREBASE_TOKEN=
echo Auth key set to: %GOOGLE_APPLICATION_CREDENTIALS%
echo.
call npm run build
echo.
echo Build finished. Deploying to Firebase...
echo.
call npx firebase-tools deploy --only hosting --project claude-vertex-prod
echo.
echo Done! Check https://claude-vertex-prod.web.app
pause
