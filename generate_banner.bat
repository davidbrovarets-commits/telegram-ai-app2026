@echo off
cd /d "%~dp0"
echo Starting Banner Generation...
echo Working Directory: %CD%
echo.

set GOOGLE_CLOUD_PROJECT=claude-vertex-prod

echo Getting Access Token...
REM Using absolute path to gcloud to be safe
set GCLOUD_CMD="C:\Users\David\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

echo Switching to user account (broehitus@gmail.com)...
call %GCLOUD_CMD% config set account broehitus@gmail.com

for /f "tokens=*" %%i in ('call %GCLOUD_CMD% auth print-access-token') do set GOOGLE_ACCESS_TOKEN=%%i

if "%GOOGLE_ACCESS_TOKEN%"=="" (
    echo [ERROR] Could not get access token!
    echo Please make sure you ran 'gcloud auth login'.
    pause
    exit /b
)

echo Token obtained (length: %GOOGLE_ACCESS_TOKEN:~0,10%...).
echo Running generator script...
echo.
call npx tsx scripts/weekly_news_banner_job.ts > global_log.txt 2>&1
echo.
echo Check above for "Saved to...".
echo If successful, run deploy_now.bat or full_deploy.bat!
pause
