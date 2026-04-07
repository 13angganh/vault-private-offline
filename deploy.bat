@echo off
echo ============================================
echo   VAULT v4 — Deploy ke GitHub Pages
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] Menambahkan semua perubahan...
git add .

echo [2/3] Commit...
git commit -m "update: vault v4 redesign sesi 2 - sidebar + multi-file"

echo [3/3] Push ke GitHub...
git push origin main

echo.
echo ============================================
echo   SELESAI! GitHub Pages akan update otomatis
echo   URL: https://13angganh.github.io/vault-private-offline/
echo ============================================
pause
