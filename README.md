# 🔐 Vault — Pencatat Akun Terenkripsi

Aplikasi PWA pencatat akun, password, dan crypto wallet yang sepenuhnya **offline** dan **terenkripsi AES-256**.

🌐 **Live:** `https://13angganh.github.io/vault-private-offline/`

---

## ✨ Fitur

- 🔐 Enkripsi **AES-256-GCM** via WebCrypto API
- 🗝️ **Recovery phrase** 5 kata untuk reset master password
- 🪙 Dukungan **Crypto Wallet** dengan seed phrase 12/24 kata
- 📡 **Sync** antar perangkat via QR Code atau teks terenkripsi
- 💾 Backup/restore file `.vault` terenkripsi
- 📱 **PWA** — bisa diinstall ke layar beranda Android & iOS
- 🔒 Sepenuhnya offline — data tidak dikirim ke server manapun

## 📁 Struktur

```
vault/
├── index.html       ← Aplikasi utama (single file)
├── manifest.json    ← PWA manifest
├── sw.js            ← Service worker (offline support)
├── icons/           ← Icon PWA berbagai ukuran
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── ... (dst)
└── README.md
```

## 🚀 Deploy ke GitHub Pages

1. Buat repo baru di GitHub bernama `vault` (bisa private)
2. Upload semua file dari folder ini
3. Buka **Settings** → **Pages**
4. Source: `Deploy from a branch` → Branch: `main` → folder: `/ (root)`
5. Klik **Save** → tunggu ~1 menit
6. Akses di `https://13angganh.github.io/vault-private-offline/`

## 📱 Install ke Layar Beranda

**Android (Chrome):**
- Buka URL di Chrome → banner install muncul otomatis
- Atau tap menu ⋮ → *Add to Home Screen*

**iOS (Safari):**
- Buka URL di Safari
- Tap ikon **Share ↑** → pilih **"Add to Home Screen"** → tap **Add**

## 🔒 Keamanan

- Enkripsi: **AES-256-GCM** + **PBKDF2** (310.000 iterasi, SHA-256)
- Data TIDAK pernah dikirim ke server manapun
- File `.vault` hanya bisa dibuka dengan master password yang benar
- Recovery phrase 5 kata untuk reset password jika lupa

## ⚠️ Penting

- Catat **recovery phrase** di kertas, simpan di tempat aman
- Backup file `.vault` secara rutin
- Untuk seed phrase wallet besar — tetap gunakan media fisik

---

*Dibuat untuk kebutuhan pribadi · Sepenuhnya offline*
