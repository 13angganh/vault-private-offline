/* ════════════════════════════════════════════
   SETTINGS — Auto-lock, Auto-save, Install
   ════════════════════════════════════════════ */

// ── AUTO-LOCK ──
const ACTIVITY_EVENTS = ['mousedown','mousemove','keydown','touchstart','scroll','click'];

function resetIdleTimer(){
  lastActivity=Date.now();
  if(idleTimer){clearTimeout(idleTimer);idleTimer=null;}
  if(idleCountdown){clearInterval(idleCountdown);idleCountdown=null;}
  removeCountdownBanner();
  if(autoLockMinutes>0) scheduleAutoLock();
}

function scheduleAutoLock(){
  if (!autoLockMinutes) return;
  const ms=autoLockMinutes*60*1000;
  idleTimer=setTimeout(()=>{
    let secs=10; showCountdownBanner(secs);
    idleCountdown=setInterval(()=>{
      secs--; updateCountdownBanner(secs);
      if (secs<=0){
        clearInterval(idleCountdown); removeCountdownBanner();
        if(document.getElementById('main-app').style.display==='block'){
          lockApp(); toast('🔒 Vault dikunci otomatis karena tidak aktif');
        }
      }
    },1000);
  }, ms-10000>0?ms-10000:ms);
}

function setAutoLock(minutes,btn){
  autoLockMinutes=minutes;
  document.querySelectorAll('.alock-btn').forEach(b=>{b.style.background='var(--s2)';b.style.color='var(--muted2)';b.style.borderColor='var(--border)';});
  if(btn){btn.style.background='rgba(240,165,0,0.15)';btn.style.color='var(--gold)';btn.style.borderColor='var(--gold)';}
  const status=document.getElementById('autolock-status');
  if(status) status.textContent=minutes===0?'Auto-lock dinonaktifkan':`Vault akan terkunci setelah ${minutes} menit tidak aktif`;
  try{localStorage.setItem('vault_autolock',minutes);}catch(e){}
  if(idleTimer) clearTimeout(idleTimer);
  if(idleCountdown) clearInterval(idleCountdown);
  removeCountdownBanner();
  if(minutes>0) scheduleAutoLock();
}

function showCountdownBanner(secs){
  if(document.getElementById('autolock-banner')) return;
  const b=document.createElement('div'); b.id='autolock-banner';
  b.style.cssText='position:fixed;top:16px;left:50%;transform:translateX(-50%);background:var(--s3);border:1px solid var(--red);border-radius:12px;padding:12px 20px;display:flex;align-items:center;gap:12px;z-index:9997;box-shadow:0 4px 20px rgba(255,77,109,.2);font-family:Outfit,sans-serif;white-space:nowrap;';
  b.innerHTML=`<span style="font-size:18px;">⏰</span><div><div style="font-size:13px;font-weight:700;color:var(--text);">Vault akan dikunci dalam <span id="countdown-secs" style="color:var(--red);">${secs}</span> detik</div><div style="font-size:11px;color:var(--muted2);margin-top:2px;">Gerakkan layar untuk membatalkan</div></div><button onclick="resetIdleTimer()" style="background:rgba(240,165,0,.15);border:1px solid var(--gold);color:var(--gold);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:Outfit,sans-serif;flex-shrink:0;">Tetap Buka</button>`;
  document.body.appendChild(b);
}
function updateCountdownBanner(secs){const el=document.getElementById('countdown-secs');if(el)el.textContent=secs;}
function removeCountdownBanner(){const b=document.getElementById('autolock-banner');if(b)b.remove();}

ACTIVITY_EVENTS.forEach(ev=>{
  document.addEventListener(ev,()=>{
    if(autoLockMinutes>0&&document.getElementById('main-app').style.display==='block') resetIdleTimer();
  },{passive:true});
});

// ── AUTO-SAVE UI ──
function setAutoSaveUI(enabled){
  const slider=document.getElementById('autosave-slider');
  const knob=document.getElementById('autosave-knob');
  const label=document.getElementById('autosave-label');
  if(slider) slider.style.background=enabled?'var(--gold)':'var(--border)';
  if(knob)   knob.style.transform=enabled?'translateX(20px)':'translateX(0)';
  if(label)  label.textContent=enabled?'Aktif':'Nonaktif';
}

function toggleAutoSave(enabled){
  autoSaveEnabled=enabled; setAutoSaveUI(enabled);
  try{localStorage.setItem('vault_autosave_enabled',enabled?'1':'0');}catch(e){}
}

function onAutoSaveToggle(enabled){
  toggleAutoSave(enabled);
  if(enabled){toast('💾 Auto-save diaktifkan');scheduleAutoSave();}
  else toast('⚠️ Auto-save dinonaktifkan');
}

// ── SETTINGS MODAL ──
function openSettings(){
  updateSaveInfo(); updateBackupStatusUI();
  const savedIvl=localStorage.getItem(LS_BKPIVL);
  if(savedIvl){backupIntervalHrs=parseInt(savedIvl);const btn=document.querySelector(`.bkp-btn[data-hrs="${backupIntervalHrs}"]`);if(btn)setBackupInterval(backupIntervalHrs,btn);}
  else{const btn=document.querySelector('.bkp-btn[data-hrs="24"]');if(btn)setBackupInterval(24,btn);}
  const savedAl=localStorage.getItem('vault_autolock');
  if(savedAl!==null){const min=parseInt(savedAl);const btn=document.querySelector(`.alock-btn[data-min="${min}"]`);if(btn)setAutoLock(min,btn);}
  const asEnabled=localStorage.getItem('vault_autosave_enabled');
  autoSaveEnabled=asEnabled!=='0'; setAutoSaveUI(autoSaveEnabled);
  document.getElementById('modal-settings').classList.add('open');
}

// ── EMERGENCY BACKUP ──
function showEmergencyBackup(){
  let recovery=vaultMeta.recovery||'';
  let hint=vaultMeta.hint||'';
  if (!recovery){const mls=loadVaultMeta();if(mls?.recovery){recovery=mls.recovery;hint=hint||mls.hint||'';}}
  if (!hint) hint='(tidak ada hint)';
  if (!recovery){toast('⚠️ Recovery phrase belum tersimpan.');return;}
  closeModal('modal-settings');
  const words=recovery.split(' ');
  const wordHtml=words.map((w,i)=>`<div style="background:var(--s2);border:1px solid var(--border);border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:8px;"><span style="color:var(--gold);font-size:11px;font-weight:700;width:16px;">${i+1}</span><span style="font-weight:600;font-family:var(--mono);color:var(--text);">${w}</span></div>`).join('');
  document.getElementById('emergency-backup-content').innerHTML=`
    <div style="background:rgba(240,165,0,.08);border:1px solid rgba(240,165,0,.3);border-radius:10px;padding:14px;margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;color:var(--gold);margin-bottom:4px;">⚠️ JANGAN SCREENSHOT — TULIS TANGAN</div>
      <div style="font-size:12px;color:var(--muted2);">Simpan di tempat fisik yang aman (kertas, buku catatan)</div>
    </div>
    <div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px;">Recovery Phrase (5 Kata)</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">${wordHtml}</div>
    <div style="background:var(--s2);border-radius:8px;padding:12px;margin-bottom:16px;">
      <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">Password Hint</div>
      <div style="font-size:13px;font-weight:600;color:var(--text);">${hint}</div>
    </div>
    <div style="font-size:11px;color:var(--muted);line-height:1.7;">Cara pakai: buka Vault → tombol <strong>Recovery</strong> di lock screen → masukkan 5 kata ini → reset master password baru.</div>`;
  document.getElementById('modal-emergency-backup').classList.add('open');
}

// ── INSTALL GUIDE ──
function openInstallGuide(){
  document.getElementById('modal-install').classList.add('open');
  if(deferredPrompt) document.getElementById('install-auto').style.display='block';
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid=/android/i.test(navigator.userAgent);
  if(isIOS) setInstallTabByName('ios');
  else if(isAndroid) setInstallTabByName('android');
  else setInstallTabByName('pc');
}

function setInstallTab(name,btn){
  document.querySelectorAll('.install-tab').forEach(b=>{b.style.background='transparent';b.style.color='var(--muted)';});
  btn.style.background='var(--s3)'; btn.style.color='var(--text)';
  document.querySelectorAll('.install-panel').forEach(p=>p.style.display='none');
  document.getElementById('tab-'+name).style.display='block';
}
function setInstallTabByName(name){const btn=document.querySelector(`[onclick="setInstallTab('${name}',this)"]`);if(btn)setInstallTab(name,btn);}

// ── MODAL UTILS ──
function closeModal(id){
  document.getElementById(id).classList.remove('open');
  if (id==='modal-sync'){
    const v=document.getElementById('qr-video');
    if(v&&v.srcObject)v.srcObject.getTracks().forEach(t=>t.stop());
    document.getElementById('qr-scan-area').style.display='none';
  }
}

// Close on overlay click & Escape
['modal-entry','modal-sync','modal-settings','modal-install','modal-cats',
 'modal-emoji','modal-move-cat','modal-emergency-backup','modal-recycle'
].forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.addEventListener('click',function(e){if(e.target===this)closeModal(id);});
});

document.addEventListener('keydown',e=>{
  if(e.key==='Escape')
    ['modal-entry','modal-sync','modal-settings','modal-install','modal-cats',
     'modal-emoji','modal-move-cat','modal-emergency-backup','modal-recycle'
    ].forEach(closeModal);
  if((e.ctrlKey||e.metaKey)&&e.key==='n'&&document.getElementById('main-app').style.display==='block'){
    e.preventDefault(); openAdd();
  }
});
