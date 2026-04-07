# ============================================
#   VAULT v4 — Deploy ke Firebase Hosting
#   vault-private-offline.web.app
#   Jalankan: klik kanan → Run with PowerShell
# ============================================

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  VAULT v4 — Deploy ke Firebase Hosting" -ForegroundColor Yellow
Write-Host "  vault-private-offline.web.app" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "[1/1] Menjalankan firebase deploy..." -ForegroundColor Cyan

firebase deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  BERHASIL! Vault live di:" -ForegroundColor Green
    Write-Host "  https://vault-private-offline.web.app" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "  GAGAL! Pastikan:" -ForegroundColor Red
    Write-Host "  1. Firebase CLI sudah terinstall" -ForegroundColor White
    Write-Host "     npm install -g firebase-tools" -ForegroundColor Gray
    Write-Host "  2. Sudah login: firebase login" -ForegroundColor White
    Write-Host "  3. Koneksi internet aktif" -ForegroundColor White
    Write-Host "============================================" -ForegroundColor Red
}

Write-Host ""
Read-Host "Tekan Enter untuk keluar"
