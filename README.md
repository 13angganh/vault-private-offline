# 🔐 Vault v4 — Pencatat Akun Terenkripsi

Aplikasi PWA pencatat akun, password, dan crypto wallet yang sepenuhnya **offline** dan **terenkripsi AES-256**.

🌐 **Live:** `https://13angganh.github.io/vault-private-offline/`

---

## ✨ Fitur

### 🔐 Keamanan & Enkripsi
- Enkripsi **AES-256-GCM** via WebCrypto API
- **PBKDF2 dua lapis** (SHA-256 × 600k + SHA-512 × 100k iterasi) — tahan brute-force
- **Master Password** minimal 12 karakter dengan validasi kekuatan
- **PIN 6 digit** untuk buka vault dengan cepat sehari-hari
- **Recovery phrase** 5 kata untuk login langsung atau reset master password
- Terkunci otomatis setelah idle (1/5/10/15/30 menit, bisa dinonaktifkan)
- Sepenuhnya offline — data tidak pernah dikirim ke server manapun

### 📋 Manajemen Akun
- Kategori default: Sosmed, Email, Bank, Game, Crypto, Lainnya
- **Kategori custom** — tambah, edit nama/icon, hapus sesuka hati
- **Crypto Wallet** — simpan seed phrase 12/24 kata, alamat wallet, network
- Tampilan grid/list untuk seed phrase
- Cari akun by nama, username, atau alamat wallet
- Filter by kategori
- **🔒 Lock per-akun** — kunci akun tertentu dari edit & hapus tanpa harus lock seluruh vault
- **🗑️ Recycle Bin** — akun yang dihapus masuk recycle bin dulu, bisa dipulihkan kapan saja

### 💾 Penyimpanan & Backup
- **Auto-save lokal** — data terenkripsi otomatis tersimpan di browser
- Simpan manual kapan saja lewat tombol "Simpan Sekarang"
- Export/import file **`.vault`** terenkripsi untuk backup lintas perangkat
- **Sync** antar perangkat via QR Code atau teks terenkripsi

### 📱 PWA
- Install ke layar beranda Android & iOS (works offline setelah install)
- Tampilan responsif mobile-first

---

## 📁 Struktur File

```
vault-private-offline/
├── index.html       ← Aplikasi utama (single file)
├── manifest.json    ← PWA manifest
├── sw.js            ← Service worker (offline support)
├── icon-192.png     ← Icon PWA 192×192
├── icon-512.png     ← Icon PWA 512×512
└── README.md
```

---

## 🚀 Deploy

### ⚡ Netlify Drop (paling cepat, tanpa akun)
1. Buka [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag & drop **folder** ini langsung ke halaman tersebut
3. Langsung live di URL seperti `https://random-name.netlify.app`
4. Opsional: rename subdomain di **Site settings → Domain management**

> ⚠️ Netlify Drop bersifat sementara jika tidak login. Untuk permanen, login ke Netlify sebelum drop.

---

### 🌐 Cloudflare Pages
Gratis, CDN global, custom domain gratis, tanpa batas bandwidth.

**Cara 1 — Upload langsung (tanpa GitHub):**
1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → login atau daftar gratis
2. Pilih menu **Workers & Pages** → tab **Pages**
3. Klik **Upload assets**
4. Beri nama project (contoh: `vault-app`) → klik **Create project**
5. Drag & drop semua file: `index.html`, `sw.js`, `manifest.json`, `icon-192.png`, `icon-512.png`
6. Klik **Deploy site**
7. Akses di `https://vault-app.pages.dev`

**Cara 2 — Connect ke GitHub (auto-deploy tiap push):**
1. Push folder ini ke repo GitHub (bisa private)
2. Di Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**
3. Pilih repo → klik **Begin setup**
4. Isi **Build settings**:
   - Framework preset: `None`
   - Build command: *(kosongkan)*
   - Build output directory: `/` atau `.`
5. Klik **Save and Deploy**
6. Setiap `git push` ke branch `main` akan otomatis deploy ulang

**Custom domain (opsional):**
- Di halaman project → tab **Custom domains → Set up a custom domain**
- Masukkan domain → ikuti instruksi DNS → aktif dalam beberapa menit

---

### 🐙 GitHub Pages
1. Buat repo baru di GitHub (bisa private)
2. Upload semua file dari folder ini
3. Buka **Settings → Pages**
4. Source: `Deploy from a branch` → Branch: `main` → folder: `/ (root)`
5. Klik **Save** → tunggu ~1 menit
6. Akses di `https://<username>.github.io/<repo-name>/`

---

## 📱 Install ke Layar Beranda

**Android (Chrome):**
- Buka URL di Chrome → banner install muncul otomatis
- Atau tap menu ⋮ → *Add to Home Screen*

**iOS (Safari):**
- Buka URL di Safari
- Tap ikon **Share ↑** → pilih **"Add to Home Screen"** → tap **Add**

---

## 🔒 Catatan Keamanan

- File `.vault` hanya bisa dibuka dengan master password yang benar
- Auto-save menyimpan data **terenkripsi** di localStorage browser — tidak terbaca tanpa password
- Catat **recovery phrase** di kertas, simpan di tempat aman
- Backup file `.vault` secara rutin (menu Ekspor)
- Untuk seed phrase wallet besar — tetap gunakan media fisik sebagai backup utama

---

## 📋 Changelog

### v4.0
- ✨ **Fitur Lock per-akun** — kunci akun individual dari edit & hapus
- ✨ **Recycle Bin** — akun terhapus bisa dipulihkan, hapus permanen dari recycle bin
- 🐛 Fix toggle Auto-save tidak bisa diaktifkan (double-fire checkbox)
- 🐛 Fix data hilang setelah restart (semua operasi data kini selalu tersimpan)
- 🐛 Fix tombol "Simpan Sekarang" tidak bekerja saat toggle off
- 🐛 Fix `openSettings()` memunculkan toast palsu setiap dibuka
- 🐛 Fix `pinAttempts` & `pinLocked` tidak di-reset setelah auto-lock
- 🐛 Fix empty state text tidak kontekstual (filter vs kosong vs pencarian)
- 🐛 Fix `recovery-newpw` tidak reset visibility saat panel dibuka ulang
- 🐛 Fix `importVaultFile` membaca lockedIds/recycleBin dari data terenkripsi bukan outer JSON
- 🐛 Fix syntax error `function buildExpanded` kehilangan keyword `function`

### v3.1 *(internal)*
- 🐛 Fix kategori custom hilang setelah restart
- 🐛 Fix copy button crash jika password mengandung single quote
- 🐛 Fix `deleteCat` tidak reset `currentFilter`
- 🐛 Fix `saveEntry` edit path — guard `idx === -1`
- 🐛 Fix validasi user+pass terlalu ketat untuk kategori custom

### v3.0
- ✨ Enkripsi PBKDF2 dua lapis (SHA-256 + SHA-512)
- ✨ Login via Recovery Phrase (tanpa master password)
- ✨ PIN 6 digit
- ✨ Auto-lock dengan countdown banner
- ✨ Auto-save lokal terenkripsi
- ✨ Kategori custom dengan emoji picker
- ✨ Sync via QR Code & teks terenkripsi
- ✨ Seed phrase grid/list toggle

---

*Dibuat untuk kebutuhan pribadi · Sepenuhnya offline · Vault v4.0*
