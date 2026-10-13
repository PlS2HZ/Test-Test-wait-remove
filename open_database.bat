@echo off
title Open Database in DB Browser for SQLite
set "DB_PATH=%~dp0backend\database.sqlite"
set "APP32=C:\Program Files (x86)\DB Browser for SQLite\DB Browser for SQLite.exe"
set "APP64=C:\Program Files\DB Browser for SQLite\DB Browser for SQLite.exe"

if exist "%APP32%" goto run32
if exist "%APP64%" goto run64
goto notfound

:run32
start "" "%APP32%" "%DB_PATH%"
goto done

:run64
start "" "%APP64%" "%DB_PATH%"
goto done

:notfound
echo DB Browser for SQLite not found in default locations.
echo Opening folder containing database.sqlite...
explorer.exe /select,"%DB_PATH%"

:done
exit /b 0
