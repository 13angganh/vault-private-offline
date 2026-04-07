@echo off
echo ============================================
echo   VAULT v4 — Push ke GitHub Pages
echo   13angganh.github.io/vault-private-offline/
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] Menambahkan semua perubahan...
git add .

echo.
echo [2/3] Masukkan pesan commit:
set /p COMMIT_MSG="Pesan commit (Enter = pakai default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=update: vault v4 redesign

git commit -m "%COMMIT_MSG%"

echo.
echo [3/3] Push ke GitHub (branch main)...
git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ============================================
    echo   BERHASIL! GitHub Pages akan update ~1 menit
    echo   https://13angganh.github.io/vault-private-offline/
    echo ============================================
) else (
    echo ============================================
    echo   GAGAL! Pastikan:
    echo   1. Sudah login GitHub Desktop / git
    echo   2. Koneksi internet aktif
    echo   3. Tidak ada konflik di branch main
    echo ============================================
)
pause
