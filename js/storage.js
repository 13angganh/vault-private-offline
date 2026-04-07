/* ════════════════════════════════════════════
   STORAGE — LocalStorage save/load
   ════════════════════════════════════════════ */

function saveVaultMeta() {
  try {
    localStorage.setItem(LS_META, JSON.stringify({
      format: 'vault2-meta',
      hint: vaultMeta.hint || '',
      recoveryHash: vaultMeta.recoveryHash || '',
      recovery: vaultMeta.recovery || '',
      encMasterBySeed: vaultMeta.encMasterBySeed || '',
      savedAt: new Date().toISOString()
    }));
  } catch(e) { console.warn('Meta save failed:', e); }
}

function loadVaultMeta() {
  try {
    const raw = localStorage.getItem(LS_META);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.format?.startsWith('vault2')) return null;
    return parsed;
  } catch(e) { return null; }
}

async function _doSaveToLocal() {
  if (!masterPw) return;
  try {
    const customCats = categories.filter(c => !DEFAULT_CATS.find(d=>d.id===c.id));
    const payload = JSON.stringify({
      vault,
      meta: {
        hint: vaultMeta.hint,
        recoveryHash: vaultMeta.recoveryHash,
        recovery: vaultMeta.recovery,
        encMasterBySeed: vaultMeta.encMasterBySeed || ''
      },
      customCats,
      lockedIds: [...lockedIds],
      recycleBin
    });
    const encrypted = await ENC.encrypt(payload, masterPw);
    const saveData  = JSON.stringify({
      format: 'vault2', hint: vaultMeta.hint || '',
      data: encrypted, savedAt: new Date().toISOString(), count: vault.length
    });
    localStorage.setItem(LS_KEY, saveData);
    saveVaultMeta();
    updateSaveInfo();
  } catch(e) { console.warn('Save failed:', e); }
}

async function saveToLocal() {
  if (!autoSaveEnabled || !masterPw) return;
  await _doSaveToLocal();
}

async function saveToLocalNow() {
  await _doSaveToLocal();
  toast('💾 Data berhasil disimpan ke browser!');
}

function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => saveToLocal(), 1500);
}

async function loadFromLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.format === 'vault2') return parsed;
    }
    const meta = loadVaultMeta();
    if (meta) return { format:'vault2', hint:meta.hint||'', data:null, count:0, _metaOnly:true };
    return false;
  } catch(e) { return false; }
}

function clearLocalData() {
  if (!confirm('Hapus semua data tersimpan di browser ini?')) return;
  try {
    localStorage.removeItem(LS_KEY);
    updateSaveInfo();
    toast('🗑️ Data lokal dihapus');
  } catch(e) { toast('⚠️ Gagal menghapus data lokal'); }
}

function updateSaveInfo() {
  const el  = document.getElementById('last-save-time');
  const cnt = document.getElementById('saved-count');
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) { if(el) el.textContent='Belum ada'; if(cnt) cnt.textContent='0'; return; }
    const parsed = JSON.parse(raw);
    if (el && parsed.savedAt) {
      el.textContent = new Date(parsed.savedAt).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'});
    }
    if (cnt) cnt.textContent = parsed.count || 0;
  } catch(e) { if(el) el.textContent='Belum ada'; if(cnt) cnt.textContent='0'; }
}

// ── Categories persistence ──
function saveCats() {
  try { localStorage.setItem('vault_cats', JSON.stringify(categories)); } catch(e) {}
}
function loadCats() {
  try {
    const raw = localStorage.getItem('vault_cats');
    if (!raw) return;
    const saved      = JSON.parse(raw);
    const defaultIds = DEFAULT_CATS.map(c=>c.id);
    const merged     = DEFAULT_CATS.map(def => {
      const s = saved.find(c=>c.id===def.id);
      return s ? {...def, label:s.label, icon:s.icon} : {...def};
    });
    categories = [...merged, ...saved.filter(c=>!defaultIds.includes(c.id))];
  } catch(e) {}
}
