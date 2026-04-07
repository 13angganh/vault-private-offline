@echo off
echo ============================================
echo   VAULT v4 — Deploy ke Firebase Hosting
echo   vault-private-offline.web.app
echo ============================================
echo.

cd /d "%~dp0"

echo [1/1] Menjalankan firebase deploy...
firebase deploy --only hosting

echo.
if %ERRORLEVEL% EQU 0 (
    echo ============================================
    echo   BERHASIL! Vault live di:
    echo   https://vault-private-offline.web.app
    echo ============================================
) else (
    echo ============================================
    echo   GAGAL! Pastikan:
    echo   1. Firebase CLI sudah terinstall
    echo      npm install -g firebase-tools
    echo   2. Sudah login: firebase login
    echo   3. Koneksi internet aktif
    echo ============================================
)
pause
