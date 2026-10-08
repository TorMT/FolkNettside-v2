@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 scripts\update_site.py --interactive
) else (
  python scripts\update_site.py --interactive
)
set "exitcode=%errorlevel%"
echo.
if not "%exitcode%"=="0" (
  echo SiteUpdater encountered an error. Review the message above.
) else (
  echo SiteUpdater finished.
)
pause
