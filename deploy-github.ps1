# ============================================
#   VAULT v4 — Push ke GitHub Pages
#   13angganh.github.io/vault-private-offline/
#   Jalankan: klik kanan → Run with PowerShell
# ============================================

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  VAULT v4 — Push ke GitHub Pages" -ForegroundColor Yellow
Write-Host "  13angganh.github.io/vault-private-offline/" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "[1/3] Menambahkan semua perubahan..." -ForegroundColor Cyan
git add .

Write-Host ""
Write-Host "[2/3] Masukkan pesan commit:" -ForegroundColor Cyan
$commitMsg = Read-Host "Pesan commit (Enter = pakai default)"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "update: vault v4 redesign"
}

git commit -m $commitMsg

Write-Host ""
Write-Host "[3/3] Push ke GitHub (branch main)..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  BERHASIL! GitHub Pages update ~1 menit" -ForegroundColor Green
    Write-Host "  https://13angganh.github.io/vault-private-offline/" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "  GAGAL! Pastikan:" -ForegroundColor Red
    Write-Host "  1. Sudah login GitHub Desktop / git" -ForegroundColor White
    Write-Host "  2. Koneksi internet aktif" -ForegroundColor White
    Write-Host "  3. Tidak ada konflik di branch main" -ForegroundColor White
    Write-Host "============================================" -ForegroundColor Red
}

Write-Host ""
Read-Host "Tekan Enter untuk keluar"
