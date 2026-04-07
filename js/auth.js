/* ════════════════════════════════════════════
   AUTH — Setup, Lock, Unlock, PIN, Recovery
   ════════════════════════════════════════════ */

// ── Helpers ──
function scorePassword(pw) {
  const tips = []; let score = 0;
  if (pw.length>=8)  score++; if (pw.length>=12) score++;
  if (pw.length>=16) score++; if (pw.length>=20) score++;
  if (pw.length<8)   tips.push('Minimal 8 karakter');
  else if (pw.length<12) tips.push('Tambah hingga 12+ karakter');
  else if (pw.length<16) tips.push('16+ karakter = sangat kuat');
  if (/[A-Z]/.test(pw)) score++; else tips.push('Tambah huruf besar (A-Z)');
  if (/[0-9]/.test(pw)) score++; else tips.push('Tambah angka (0-9)');
  if (/[^A-Za-z0-9]/.test(pw)) score++; else tips.push('Tambah simbol (!@#$...)');
  const common = ['password','123456','qwerty','abc123','iloveyou','admin','letmein','monkey','dragon','master'];
  if (common.some(c=>pw.toLowerCase().includes(c))) { score=Math.max(0,score-3); tips.push('Hindari kata umum'); }
  if (/(.)\1{2,}/.test(pw)) { score=Math.max(0,score-1); tips.push('Hindari karakter berulang'); }
  if (/^[0-9]+$/.test(pw)) { score=Math.max(0,score-2); tips.push('Jangan angka saja'); }
  let pool=0;
  if (/[a-z]/.test(pw)) pool+=26; if (/[A-Z]/.test(pw)) pool+=26;
  if (/[0-9]/.test(pw)) pool+=10; if (/[^A-Za-z0-9]/.test(pw)) pool+=32;
  const entropy = pool>0 ? Math.floor(pw.length*Math.log2(pool)) : 0;
  score = Math.max(0, Math.min(7,score));
  const levels = [
    {l:'Sangat Lemah',c:'#ff4d6d'},{l:'Sangat Lemah',c:'#ff4d6d'},
    {l:'Lemah',c:'#ff7043'},{l:'Sedang',c:'#ffd166'},
    {l:'Cukup',c:'#a8d8a8'},{l:'Kuat',c:'#00d4aa'},
    {l:'Sangat Kuat',c:'#06d6a0'},{l:'Luar Biasa!',c:'#00ffcc'},
  ];
  return { score, level:levels[score].l, color:levels[score].c, tips, entropy };
}

// ── SETUP ──
function genRecovery() {
  const w = [];
  while (w.length<5) { const wd=WORDS[Math.floor(Math.random()*WORDS.length)]; if (!w.includes(wd)) w.push(wd); }
  return w;
}

function showSetup() {
  document.getElementById('lock-screen').style.display = 'none';
  document.getElementById('setup-screen').style.display = 'block';
  regenRecovery();
}
function cancelSetup() {
  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('lock-screen').style.display = 'flex';
}
function regenRecovery() {
  currentRecovery = genRecovery();
  document.getElementById('setup-rec-grid').innerHTML =
    currentRecovery.map((w,i)=>`<div class="rec-word"><span>${i+1}</span><strong>${w}</strong></div>`).join('');
  document.getElementById('rec-confirm').checked = false;
}

function updateSetupStr() {
  const pw   = document.getElementById('setup-pw').value;
  const fill = document.getElementById('setup-str-fill');
  const lbl  = document.getElementById('setup-str-label');
  const tips = document.getElementById('setup-str-tips');
  const ent  = document.getElementById('setup-str-entropy');
  if (!pw) {
    fill.style.width='0%'; fill.style.background='';
    lbl.textContent=''; if(tips) tips.innerHTML=''; if(ent) ent.textContent=''; return;
  }
  const r = scorePassword(pw);
  fill.style.width = (r.score/7*100)+'%'; fill.style.background = r.color;
  lbl.textContent = r.level; lbl.style.color = r.color;
  if (ent) ent.textContent = '~'+r.entropy+' bit entropy';
  if (tips) tips.innerHTML = r.tips.length
    ? r.tips.map(t=>`<span style="display:inline-block;background:rgba(255,77,109,.1);border:1px solid rgba(255,77,109,.2);border-radius:4px;padding:2px 8px;font-size:10px;color:#ff8fa3;margin:2px 2px 0 0;">⚠ ${t}</span>`).join('')
    : '<span style="font-size:11px;color:#00d4aa;">✓ Password kuat!</span>';
}

async function finishSetup() {
  const pw   = document.getElementById('setup-pw').value;
  const pw2  = document.getElementById('setup-pw2').value;
  const hint = document.getElementById('setup-hint').value.trim();
  const err  = document.getElementById('setup-err');
  err.style.display = 'none';
  if (!pw)               { showSetupErr('Master password wajib diisi.'); return; }
  if (pw.length<12)      { showSetupErr('Master password minimal 12 karakter. Ingat: sehari-hari pakai PIN!'); return; }
  if (scorePassword(pw).score<3) { showSetupErr('Password terlalu lemah. Tambah huruf besar, angka, atau simbol.'); return; }
  if (pw!==pw2)          { showSetupErr('Password tidak cocok.'); return; }
  if (!document.getElementById('rec-confirm').checked) { showSetupErr('Konfirmasi bahwa kamu sudah mencatat recovery phrase.'); return; }
  const recStr = currentRecovery.join(' ');
  vaultMeta = { hint, recoveryHash:await hashStr(recStr), recovery:recStr, encMasterBySeed:await ENC.encrypt(pw,recStr) };
  masterPw = pw; vault = [];
  saveVaultMeta();
  document.getElementById('setup-screen').style.display = 'none';
  setupPinAfterVaultCreation();
}
function showSetupErr(msg) {
  const el = document.getElementById('setup-err');
  el.textContent = msg; el.style.display = 'block';
}

// ── UNLOCK ──
async function unlockVault() {
  const pw  = document.getElementById('unlock-pw').value.trim();
  const err = document.getElementById('unlock-err');
  if (!pw) { showUnlockErr('Masukkan master password.'); return; }
  err.style.display = 'none';
  const saved = await loadFromLocal();
  if (saved) {
    try {
      if (saved._metaOnly) {
        vault=[]; const mls=loadVaultMeta();
        vaultMeta = mls ? {hint:mls.hint||'',recoveryHash:mls.recoveryHash||'',recovery:mls.recovery||'',encMasterBySeed:mls.encMasterBySeed||''} : {hint:saved.hint||''};
        masterPw=pw; openVaultAfterAuth(); return;
      }
      const data = JSON.parse(await ENC.decrypt(saved.data, pw));
      vault      = data.vault||[];
      vaultMeta  = data.meta||{};
      _restoreVaultPayload(data);
      if (!vaultMeta.encMasterBySeed) { const mls=loadVaultMeta(); if(mls?.encMasterBySeed) vaultMeta.encMasterBySeed=mls.encMasterBySeed; }
      if (!vaultMeta.recovery)        { const mls=loadVaultMeta(); if(mls?.recovery) vaultMeta.recovery=mls.recovery; }
      masterPw=pw;
      if (!hasPin()&&!localStorage.getItem('vault_pin_skipped')) { setupPinAfterVaultCreation(); }
      else { openVaultAfterAuth(); toast(hasPin()?'✅ Vault dibuka!':'🔓 Vault dibuka!'); }
      return;
    } catch(e) { showUnlockErr('Master password salah.'); return; }
  }
  if (masterPw&&pw===masterPw) { openVaultAfterAuth(); return; }
  showUnlockErr('Master password salah atau belum ada vault.');
}
function showUnlockErr(msg) { const el=document.getElementById('unlock-err'); el.textContent=msg; el.style.display='block'; }

// Restore custom cats, lockedIds, recycleBin dari payload dekripsi
function _restoreVaultPayload(data) {
  if (Array.isArray(data.customCats)&&data.customCats.length>0) {
    const dids=DEFAULT_CATS.map(c=>c.id);
    categories=[...DEFAULT_CATS.map(d=>({...d})),...data.customCats.filter(c=>!dids.includes(c.id))];
    saveCats();
  }
  lockedIds  = new Set(Array.isArray(data.lockedIds)?data.lockedIds:[]);
  recycleBin = Array.isArray(data.recycleBin)?data.recycleBin:[];
}

// ── OPEN VAULT ──
function openVaultAfterAuth() {
  document.getElementById('lock-screen').style.display  = 'none';
  document.getElementById('main-app').style.display     = 'block';
  render();
  updateRecycleBadge();
  checkBackupReminder();
  if (autoLockMinutes>0) scheduleAutoLock();
  if (masterPw&&vaultMeta.recovery&&!vaultMeta.encMasterBySeed) {
    ENC.encrypt(masterPw,vaultMeta.recovery).then(enc=>{
      vaultMeta.encMasterBySeed=enc; saveVaultMeta(); _doSaveToLocal();
    }).catch(()=>{});
  }
}

// ── LOCK ──
function lockApp() {
  if (idleTimer)     { clearTimeout(idleTimer);    idleTimer=null; }
  if (idleCountdown) { clearInterval(idleCountdown); idleCountdown=null; }
  removeCountdownBanner();
  document.getElementById('main-app').style.display    = 'none';
  document.getElementById('lock-screen').style.display = 'flex';
  const bb=document.getElementById('backup-banner'); if(bb) bb.style.display='none';
  document.getElementById('unlock-pw').value='';
  document.getElementById('unlock-err').style.display='none';
  document.getElementById('no-vault-msg').style.display='none';
  expandedIds.clear(); pwVisible.clear(); seedVisible.clear();
  lockedIds.clear(); recycleBin=[];
  if (masterPw&&vault.length>0) _doSaveToLocal();
  vault=[]; masterPw='';
  categories=JSON.parse(JSON.stringify(DEFAULT_CATS)); loadCats();
  pinAttempts=0; pinLocked=false;
  const pad=document.getElementById('pin-pad');
  if (pad) { pad.style.opacity=''; pad.style.pointerEvents=''; }
  if (hasPin()) showPinPanel();
  else { document.getElementById('panel-pin').style.display='none'; document.getElementById('panel-unlock').style.display='block'; }
}

// ── RECOVERY ──
function setRecoveryMode(mode) {
  const isLogin = mode==='login';
  document.getElementById('rec-tab-login').className = isLogin?'btn btn-gold':'btn btn-ghost btn-sm';
  ['flex','1','center','13px'].forEach((v,i)=>{
    const p=['display','flex','justifyContent','fontSize'][i];
    document.getElementById('rec-tab-login').style[p]=v;
    document.getElementById('rec-tab-reset').style[p]=v;
  });
  document.getElementById('rec-tab-reset').className = isLogin?'btn btn-ghost btn-sm':'btn btn-danger';
  document.getElementById('rec-info-login').style.display = isLogin?'block':'none';
  document.getElementById('rec-info-reset').style.display = isLogin?'none':'block';
  document.getElementById('rec-newpw-row').style.display  = isLogin?'none':'block';
  if (isLogin) { const rp=document.getElementById('recovery-newpw'); if(rp){rp.value='';rp.type='password';} }
  const btn=document.getElementById('rec-btn-action');
  btn.textContent = isLogin?'🔓 Buka Vault':'🔄 Reset & Masuk (Data Terhapus)';
  btn.className   = isLogin?'btn btn-gold':'btn btn-danger';
  btn.style.cssText='width:100%;justify-content:center;margin-bottom:10px;';
  btn.dataset.mode=mode;
  document.getElementById('recover-err').style.display='none';
}

function showRecoveryPanel() {
  document.getElementById('panel-pin').style.display    = 'none';
  document.getElementById('panel-unlock').style.display = 'none';
  document.getElementById('panel-recover').style.display= 'block';
  const ri=document.getElementById('recovery-input'); if(ri) ri.value='';
  const rp=document.getElementById('recovery-newpw'); if(rp){rp.value='';rp.type='password';}
  document.getElementById('recover-err').style.display='none';
  setRecoveryMode('login');
}

async function doRecovery() {
  const recInput = document.getElementById('recovery-input').value.trim().toLowerCase();
  const err      = document.getElementById('recover-err');
  const mode     = document.getElementById('rec-btn-action').dataset.mode||'login';
  err.style.display='none';
  if (!recInput) { err.textContent='Masukkan 5 kata recovery.'; err.style.display='block'; return; }

  const metaRaw=localStorage.getItem(LS_META);
  if (!metaRaw) { err.textContent='Tidak ada vault ditemukan.'; err.style.display='block'; return; }
  let meta;
  try { meta=JSON.parse(metaRaw); if(!meta.recoveryHash){err.textContent='Recovery hash tidak ada.';err.style.display='block';return;} }
  catch(e) { err.textContent='Data vault korup.'; err.style.display='block'; return; }

  if (await hashStr(recInput)!==meta.recoveryHash) {
    err.textContent='Recovery phrase salah. Periksa ejaan dan urutan kata.'; err.style.display='block'; return;
  }

  if (mode==='login') {
    const encMBS=meta.encMasterBySeed||vaultMeta.encMasterBySeed||'';
    if (!encMBS) { err.textContent='Vault lama — gunakan Master Password untuk masuk, lalu seed phrase login aktif otomatis.'; err.style.display='block'; return; }
    let recoveredPw;
    try { recoveredPw=await ENC.decrypt(encMBS,recInput); }
    catch(e) { err.textContent='Gagal mendekripsi — seed phrase tidak cocok.'; err.style.display='block'; return; }
    const saved=await loadFromLocal();
    if (!saved) { err.textContent='Tidak ada data vault tersimpan.'; err.style.display='block'; return; }
    try {
      masterPw=recoveredPw;
      if (saved._metaOnly) {
        vault=[];
        vaultMeta={hint:meta.hint||'',recoveryHash:meta.recoveryHash,recovery:meta.recovery||recInput,encMasterBySeed:meta.encMasterBySeed||''};
      } else {
        const data=JSON.parse(await ENC.decrypt(saved.data,masterPw));
        vault=data.vault||[]; vaultMeta=data.meta||{};
        _restoreVaultPayload(data);
        if (!vaultMeta.encMasterBySeed&&meta.encMasterBySeed) vaultMeta.encMasterBySeed=meta.encMasterBySeed;
      }
    } catch(e) { masterPw=''; err.textContent='Gagal membuka vault.'; err.style.display='block'; return; }
    document.getElementById('lock-screen').style.display='none';
    document.getElementById('main-app').style.display='block';
    render(); if(autoLockMinutes>0)scheduleAutoLock();
    toast('✅ Vault dibuka via Recovery Phrase!'); return;
  }

  // MODE RESET
  const newPw=document.getElementById('recovery-newpw').value;
  if (!newPw||newPw.length<12) { err.textContent='Password baru minimal 12 karakter.'; err.style.display='block'; return; }
  masterPw=newPw;
  const mls=loadVaultMeta();
  vaultMeta={hint:mls?.hint||'',recoveryHash:meta.recoveryHash,recovery:meta.recovery||recInput,encMasterBySeed:await ENC.encrypt(newPw,recInput)};
  vault=[]; lockedIds=new Set(); recycleBin=[];
  await _doSaveToLocal(); saveVaultMeta();
  localStorage.removeItem(LS_PIN); localStorage.removeItem('vault_pin_skipped');
  document.getElementById('lock-screen').style.display='none';
  document.getElementById('main-app').style.display='block';
  render(); if(autoLockMinutes>0)scheduleAutoLock();
  toast('⚠️ Password direset. Vault kosong. Buat PIN baru.');
  setTimeout(()=>setupPinAfterVaultCreation(), 2000);
}

// ── PIN SYSTEM ──
function hasPin() { return !!localStorage.getItem(LS_PIN); }

async function savePin(pinStr, masterPassword) {
  try {
    const salt    = crypto.getRandomValues(new Uint8Array(8));
    const saltHex = Array.from(salt).map(b=>b.toString(16).padStart(2,'0')).join('');
    const hash    = await hashStr(pinStr+saltHex);
    const encMaster = await ENC.encrypt(masterPassword, pinStr);
    localStorage.setItem(LS_PIN, JSON.stringify({hash,salt:saltHex,encMaster}));
    return true;
  } catch(e) { return false; }
}

function showPinPanel() {
  document.getElementById('panel-pin').style.display    = 'block';
  document.getElementById('panel-unlock').style.display = 'none';
  document.getElementById('panel-recover').style.display= 'none';
  pinBuffer=[]; updatePinDots();
  document.getElementById('pin-err').style.display='none';
}

function showMasterPwFallback() {
  document.getElementById('panel-pin').style.display    = 'none';
  document.getElementById('panel-unlock').style.display = 'block';
  document.getElementById('panel-recover').style.display= 'none';
  document.getElementById('no-vault-msg').style.display = 'none';
}

function pinInput(digit)  { if(pinLocked||pinBuffer.length>=6)return; pinBuffer.push(digit); updatePinDots(); if(pinBuffer.length===6)setTimeout(()=>submitPin(),120); }
function pinDelete()      { if(pinLocked)return; pinBuffer.pop(); updatePinDots(); }
function pinClear()       { pinBuffer=[]; updatePinDots(); }
function updatePinDots()  { for(let i=0;i<6;i++){const d=document.getElementById('pd'+i);if(d)d.className='pin-dot'+(i<pinBuffer.length?' filled':'');} }

function showPinErr(msg) {
  const el=document.getElementById('pin-err');
  el.textContent=msg; el.style.display='block';
  setTimeout(()=>{if(el.textContent===msg)el.style.display='none';},3000);
}
function shakeDots() {
  document.querySelectorAll('.pin-dot').forEach(d=>{d.classList.add('shake');setTimeout(()=>d.classList.remove('shake'),400);});
}

async function submitPin() {
  const pinStr=pinBuffer.join(''); pinBuffer=[]; updatePinDots();
  const storedRaw=localStorage.getItem(LS_PIN);
  if (!storedRaw) { showPinErr('PIN belum dikonfigurasi. Gunakan master password.'); return; }
  try {
    const stored  = JSON.parse(storedRaw);
    const pinHash = await hashStr(pinStr+stored.salt);
    if (pinHash!==stored.hash) {
      pinAttempts++;
      if (pinAttempts>=5) {
        pinLocked=true; showPinErr('Terlalu banyak percobaan. Gunakan master password.');
        const pad=document.getElementById('pin-pad'); pad.style.opacity='0.3'; pad.style.pointerEvents='none';
      } else { showPinErr('PIN salah. Sisa percobaan: '+(5-pinAttempts)); shakeDots(); }
      return;
    }
    masterPw = await ENC.decrypt(stored.encMaster, pinStr);
    const saved=await loadFromLocal();
    if (saved) {
      if (saved._metaOnly) {
        vault=[]; const mls=loadVaultMeta();
        vaultMeta=mls?{hint:mls.hint||'',recoveryHash:mls.recoveryHash||'',recovery:mls.recovery||'',encMasterBySeed:mls.encMasterBySeed||''}:{hint:saved.hint||''};
      } else {
        try {
          const data=JSON.parse(await ENC.decrypt(saved.data,masterPw));
          vault=data.vault||[]; vaultMeta=data.meta||{};
          _restoreVaultPayload(data);
          if (!vaultMeta.encMasterBySeed){const mls=loadVaultMeta();if(mls?.encMasterBySeed)vaultMeta.encMasterBySeed=mls.encMasterBySeed;}
          if (!vaultMeta.recovery){const mls=loadVaultMeta();if(mls?.recovery)vaultMeta.recovery=mls.recovery;}
        } catch(e) { showPinErr('Data vault rusak. Coba master password.'); return; }
      }
    }
    pinAttempts=0; openVaultAfterAuth();
  } catch(e) { showPinErr('Gagal verifikasi PIN: '+e.message); }
}

// ── PIN SETUP FLOW ──
function setupPinAfterVaultCreation() {
  pinSetupBuffer=[]; pinSetupFirst=''; pinSetupStep=1;
  document.getElementById('pin-setup-overlay').style.display='flex';
  updatePinSetupDots();
  document.getElementById('pin-setup-title').textContent   ='Buat PIN (6 digit)';
  document.getElementById('pin-setup-subtitle').textContent='PIN digunakan untuk membuka vault dengan cepat';
  document.getElementById('pin-setup-err').style.display   ='none';
}

function pinSetupInput(digit) { if(pinSetupBuffer.length>=6)return; pinSetupBuffer.push(digit); updatePinSetupDots(); if(pinSetupBuffer.length===6)setTimeout(()=>submitPinSetup(),120); }
function pinSetupDelete()     { pinSetupBuffer.pop(); updatePinSetupDots(); }
function pinSetupClear()      { pinSetupBuffer=[]; updatePinSetupDots(); }
function updatePinSetupDots() { for(let i=0;i<6;i++){const d=document.getElementById('psd'+i);if(d)d.className='pin-dot'+(i<pinSetupBuffer.length?' filled':'');} }

async function submitPinSetup() {
  const pinStr=pinSetupBuffer.join(''); pinSetupBuffer=[]; updatePinSetupDots();
  if (pinSetupStep===1) {
    pinSetupFirst=pinStr; pinSetupStep=2;
    document.getElementById('pin-setup-title').textContent   ='Konfirmasi PIN';
    document.getElementById('pin-setup-subtitle').textContent='Masukkan PIN yang sama sekali lagi';
    document.getElementById('pin-setup-err').style.display   ='none';
  } else {
    if (pinStr!==pinSetupFirst) {
      pinSetupStep=1; pinSetupFirst='';
      document.getElementById('pin-setup-title').textContent   ='Buat PIN (6 digit)';
      document.getElementById('pin-setup-subtitle').textContent='PIN tidak cocok, coba lagi';
      document.getElementById('pin-setup-err').textContent='❌ PIN tidak cocok, mulai ulang';
      document.getElementById('pin-setup-err').style.display='block'; return;
    }
    const ok=await savePin(pinStr, masterPw);
    document.getElementById('pin-setup-overlay').style.display='none';
    document.getElementById('lock-screen').style.display='none';
    document.getElementById('main-app').style.display='block';
    render(); if(autoLockMinutes>0)scheduleAutoLock();
    await _doSaveToLocal();
    toast(ok?'✅ Vault dibuat! PIN tersimpan.':'✅ Vault dibuat! (PIN gagal disimpan)');
  }
}

function skipPinSetup() {
  localStorage.setItem('vault_pin_skipped','1');
  document.getElementById('pin-setup-overlay').style.display='none';
  document.getElementById('lock-screen').style.display='none';
  document.getElementById('main-app').style.display='block';
  render(); if(autoLockMinutes>0)scheduleAutoLock();
  _doSaveToLocal(); toast('✅ Vault berhasil dibuat!');
}
