/* ════════════════════════════════════════════
   APP — Sidebar, Theme, PWA, Init
   ════════════════════════════════════════════ */

// ── THEME ──
function initTheme(){
  const saved=localStorage.getItem(LS_THEME)||'dark';
  applyTheme(saved,false);
}

function applyTheme(theme,animate=true){
  document.documentElement.setAttribute('data-theme',theme);
  const icon=document.getElementById('theme-icon');
  const btn=document.getElementById('theme-toggle-btn');
  if(icon){
    icon.textContent=theme==='dark'?'☀️':'🌙';
    if(animate&&btn){
      btn.classList.remove('spinning'); void btn.offsetWidth;
      btn.classList.add('spinning'); setTimeout(()=>btn.classList.remove('spinning'),400);
    }
  }
  try{localStorage.setItem(LS_THEME,theme);}catch(e){}
}

function toggleTheme(){
  const current=document.documentElement.getAttribute('data-theme')||'dark';
  applyTheme(current==='dark'?'light':'dark',true);
}

// ── LOADING SCREEN ──
function hideLoadingScreen(){
  const ls=document.getElementById('loading-screen');
  if(ls){ls.classList.add('hidden');setTimeout(()=>{if(ls.parentNode)ls.remove();},600);}
}

// ── SIDEBAR ──
let sidebarOpen = false;

function openSidebar(){
  sidebarOpen=true;
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('open');
  document.getElementById('hamburger-btn').classList.add('open');
  // Update recycle badge di sidebar
  updateRecycleBadge();
}

function closeSidebar(){
  sidebarOpen=false;
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
  document.getElementById('hamburger-btn').classList.remove('open');
}

function toggleSidebar(){ sidebarOpen ? closeSidebar() : openSidebar(); }

// Tutup sidebar saat klik overlay
document.addEventListener('DOMContentLoaded',()=>{
  const overlay=document.getElementById('sidebar-overlay');
  if(overlay) overlay.addEventListener('click',closeSidebar);
});

// Sidebar navigasi — tutup sidebar lalu buka fitur
function sidebarNav(action){
  closeSidebar();
  setTimeout(()=>{
    switch(action){
      case 'home':     break; // sudah di home
      case 'cats':     openCatManager();   break;
      case 'recycle':  openRecycleBin();   break;
      case 'settings': openSettings();     break;
      case 'sync':     openSync();         break;
      case 'export':   exportVault();      break;
      case 'install':  openInstallGuide(); break;
    }
  },150);
}

function sidebarImport(event){ closeSidebar(); importVaultFile(event); }

// ── PWA ──
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault(); deferredPrompt=e;
  setTimeout(showInstallBanner,2500);
});
window.addEventListener('appinstalled',()=>{toast('✅ Vault berhasil diinstall!');deferredPrompt=null;});

function doInstall(){
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(r=>{if(r.outcome==='accepted')toast('✅ Vault ditambahkan ke beranda!');deferredPrompt=null;dismissBanner();});
}

function showInstallBanner(){
  if(!deferredPrompt||window.matchMedia('(display-mode: standalone)').matches) return;
  if(document.getElementById('install-banner')) return;
  const b=document.createElement('div'); b.id='install-banner';
  b.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--s3);border:1px solid var(--gold);border-radius:14px;padding:14px 20px;display:flex;align-items:center;gap:14px;z-index:9999;box-shadow:var(--shadow);font-family:Outfit,sans-serif;max-width:340px;width:calc(100% - 32px);';
  b.innerHTML='<span style="font-size:26px;flex-shrink:0">🔐</span><div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:2px">Tambah ke Layar Beranda</div><div style="font-size:11px;color:var(--muted2)">Buka Vault seperti app, tanpa browser</div></div><div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0"><button onclick="doInstall()" style="background:linear-gradient(135deg,var(--gold),var(--gold2));color:#000;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:Outfit,sans-serif">Install</button><button onclick="dismissBanner()" style="background:none;color:var(--muted);border:none;font-size:11px;cursor:pointer;font-family:Outfit,sans-serif">Nanti</button></div>';
  document.body.appendChild(b);
}
function dismissBanner(){const b=document.getElementById('install-banner');if(b)b.remove();}

// Service Worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js')
    .then(reg=>{
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reg.update().catch(()=>{});});
      reg.addEventListener('updatefound',()=>{
        const sw=reg.installing;
        sw.addEventListener('statechange',()=>{if(sw.state==='installed'&&navigator.serviceWorker.controller)sw.postMessage({type:'SKIP_WAITING'});});
      });
    }).catch(()=>{});
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(reloading)return; reloading=true;
    if(masterPw){toast('🔄 Update tersedia — memperbarui otomatis...');setTimeout(()=>window.location.reload(),3000);}
    else window.location.reload();
  });
}

// iOS banner
window.addEventListener('load',()=>{
  if(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!window.navigator.standalone){
    setTimeout(()=>{
      if(document.getElementById('ios-banner')) return;
      const b=document.createElement('div'); b.id='ios-banner';
      b.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--s3);border:1px solid var(--gold);border-radius:14px;padding:16px 18px;z-index:9999;box-shadow:var(--shadow);font-family:Outfit,sans-serif;max-width:320px;width:calc(100% - 32px);';
      b.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-size:13px;font-weight:700;color:var(--text)">Tambah ke Beranda (iOS)</div><button onclick="this.closest(\'#ios-banner\').remove()" style="background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;line-height:1">×</button></div><div style="font-size:12px;color:var(--muted2);line-height:1.8">1. Tap ikon <strong style="color:var(--gold)">Share ↑</strong> di Safari<br>2. Pilih <strong style="color:var(--gold)">"Add to Home Screen"</strong><br>3. Tap <strong style="color:var(--gold)">Add</strong></div>';
      document.body.appendChild(b);
    },3500);
  }
});

// ── INIT ──
window.addEventListener('load',async()=>{
  initTheme();
  loadCats();

  // Restore settings
  const savedAutolock=localStorage.getItem('vault_autolock');
  if(savedAutolock!==null) autoLockMinutes=parseInt(savedAutolock);
  const savedAutosave=localStorage.getItem('vault_autosave_enabled');
  if(savedAutosave==='0') autoSaveEnabled=false;
  const savedBkpIvl=localStorage.getItem(LS_BKPIVL);
  if(savedBkpIvl) backupIntervalHrs=parseInt(savedBkpIvl);
  const savedDismiss=localStorage.getItem(LS_BKPDISM);
  if(savedDismiss) backupDismissedAt=parseInt(savedDismiss);

  const saved=await loadFromLocal();

  // Sembunyikan loading screen (minimal 1.6 detik agar animasi terlihat)
  setTimeout(hideLoadingScreen,1600);

  if(saved){
    document.getElementById('no-vault-msg').style.display='none';
    if(hasPin()){
      showPinPanel();
      if(saved.hint) document.getElementById('pin-subtitle').textContent='Vault ditemukan · Hint: '+saved.hint;
    } else {
      document.getElementById('panel-pin').style.display='none';
      document.getElementById('panel-unlock').style.display='block';
    }
  } else {
    document.getElementById('panel-pin').style.display='none';
    document.getElementById('panel-unlock').style.display='block';
    document.getElementById('no-vault-msg').style.display='block';
  }
});
