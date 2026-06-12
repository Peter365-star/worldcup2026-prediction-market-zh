@echo off
chcp 65001 >nul
title 2026 World Cup Prediction Market

echo =========================================
echo   2026 世界杯预测市场 - 启动脚本
echo =========================================
echo.

:: ---------- 定位 Node.js ----------
set "NODE_PATH="

:: 优先使用环境变量中的 node
where node >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Node.js 已在 PATH 中
    goto :check_node
)

:: winget 用户级安装路径
set "WINGET_NODE=%LocalAppData%\Microsoft\WinGet\Packages\OpenJS.NodeJS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v*-win-x64"
for /d %%i in (%WINGET_NODE%) do set "NODE_PATH=%%i"
if exist "%NODE_PATH%\node.exe" (
    set "PATH=%NODE_PATH%;%PATH%"
    echo [OK] Node.js from winget: %NODE_PATH%
    goto :check_node
)

:: 标准安装路径
if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
    echo [OK] Node.js from Program Files
    goto :check_node
)

echo [ERROR] 未找到 Node.js，请先安装 Node.js 18 或更高版本。
echo 下载地址: https://nodejs.org
pause
exit /b 1

:check_node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] node 命令不可用
    pause
    exit /b 1
)
echo     版本:
node --version

:: ---------- 切换到项目目录 ----------
cd /d "%~dp0"

:: ---------- 安装依赖（如需要） ----------
if exist "node_modules\" (
    echo [OK] node_modules 已存在，跳过安装
) else (
    echo [*] 正在安装依赖...
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo [ERROR] 依赖安装失败
        pause
        exit /b 1
    )
    echo [OK] 依赖安装完成
)

:: ---------- 启动开发服务器 + 打开浏览器 ----------
echo.
echo [*] 正在启动开发服务器...
echo     浏览器将自动打开 http://localhost:3000
echo     按 Ctrl+C 停止服务器
echo.

:: 先启动服务器，等待就绪后打开浏览器
start "" http://localhost:3000

call npm run dev

pause
