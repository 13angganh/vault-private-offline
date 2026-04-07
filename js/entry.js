/* ════════════════════════════════════════════
   ENTRY — Modal Tambah/Edit, Recycle Bin
   ════════════════════════════════════════════ */

function populateCatSelect(selectedId) {
  const sel=document.getElementById('f-cat');
  if (!sel) return;
  sel.innerHTML=categories.map(c=>`<option value="${c.id}" ${c.id===selectedId?'selected':''}>${c.icon} ${c.label}</option>`).join('');
}

function openAdd() { openEntryModal(null); }

function openEntryModal(entry) {
  editId = entry ? entry.id : null;
  document.getElementById('me-icon').textContent  = entry?'✏️':'➕';
  document.getElementById('me-title').textContent = entry?'Edit Akun':'Tambah Akun';

  const cat = entry ? entry.cat : (categories[0]?.id||'sosmed');
  populateCatSelect(cat);
  document.getElementById('f-name').value = entry?entry.name:'';
  document.getElementById('f-user').value = entry?(entry.user||''):'';
  document.getElementById('f-pass').value = entry?(entry.pass||''):'';
  document.getElementById('f-url').value  = entry?(entry.url||''):'';
  document.getElementById('f-note').value = entry?(entry.note||''):'';
  document.getElementById('f-network').value    = entry?(entry.network||'Ethereum (ETH)'):'Ethereum (ETH)';
  document.getElementById('f-wallet-addr').value= entry?(entry.walletAddr||''):'';
  document.getElementById('f-wallet-pw').value  = entry?(entry.walletPw||''):'';

  seedLen=entry&&entry.seedPhrase?entry.seedPhrase.length:12;
  seedMode='grid';
  document.querySelector(`input[name="seed-len"][value="${seedLen<=12?12:24}"]`).checked=true;
  buildSeedInputs(seedLen, entry?entry.seedPhrase:[]);
  // Reset mode UI
  ['seed-input-grid','seed-input-text'].forEach((id,i)=>{ const el=document.getElementById(id); if(el) el.style.display=i===0?'':'none'; });
  const btnGrid=document.getElementById('seed-mode-grid'); if(btnGrid) btnGrid.className='btn btn-teal btn-sm';
  const btnText=document.getElementById('seed-mode-text'); if(btnText) btnText.className='btn btn-ghost btn-sm';
  const ta=document.getElementById('seed-textarea'); if(ta) ta.value='';
  const cnt=document.getElementById('seed-text-count'); if(cnt){cnt.textContent='0 kata';cnt.style.color='var(--muted)';}
  onCatChange(); updateStr();
  document.getElementById('modal-entry').classList.add('open');
}

function onCatChange() {
  const c=document.getElementById('f-cat').value;
  document.getElementById('normal-fields').style.display  = c==='crypto'?'none':'block';
  document.getElementById('crypto-fields').style.display  = c==='crypto'?'block':'none';
}

function setSeedLen(n) {
  seedLen=n;
  const current=getSeedValues();
  buildSeedInputs(n,current);
  if (seedMode==='text') {
    const ta=document.getElementById('seed-textarea');
    if (ta){ta.value=current.filter(w=>w).slice(0,n).join(' ');updateSeedTextCount();}
  }
}

function setSeedMode(mode) {
  seedMode=mode;
  const gridEl=document.getElementById('seed-input-grid');
  const textEl=document.getElementById('seed-input-text');
  const btnGrid=document.getElementById('seed-mode-grid');
  const btnText=document.getElementById('seed-mode-text');
  if (mode==='grid') {
    const ta=document.getElementById('seed-textarea');
    const words=ta&&ta.value.trim()?ta.value.trim().toLowerCase().split(/\s+/).filter(w=>w):[];
    buildSeedInputs(seedLen,words);
    gridEl.style.display=''; textEl.style.display='none';
    btnGrid.className='btn btn-teal btn-sm'; btnText.className='btn btn-ghost btn-sm';
  } else {
    const words=getSeedValuesFromGrid().filter(w=>w);
    const ta=document.getElementById('seed-textarea');
    if (ta){ta.value=words.join(' ');updateSeedTextCount();}
    gridEl.style.display='none'; textEl.style.display='block';
    btnGrid.className='btn btn-ghost btn-sm'; btnText.className='btn btn-teal btn-sm';
    if (ta) setTimeout(()=>ta.focus(),100);
  }
}

function updateSeedTextCount() {
  const ta=document.getElementById('seed-textarea');
  const counter=document.getElementById('seed-text-count');
  if (!ta||!counter) return;
  const words=ta.value.trim()?ta.value.trim().split(/\s+/).filter(w=>w):[];
  counter.textContent=`${words.length} kata`;
  counter.style.color=(words.length===12||words.length===24)?'#00d4aa':words.length>0?'var(--gold)':'var(--muted)';
  if (words.length===12||words.length===24) {
    seedLen=words.length;
    const r=document.querySelector(`input[name="seed-len"][value="${words.length}"]`);
    if (r) r.checked=true;
  }
}
function onSeedTextareaInput() { updateSeedTextCount(); }

function buildSeedInputs(n, existing=[]) {
  const grid=document.getElementById('seed-input-grid');
  if (!grid) return;
  grid.className=`seed-inputs ${n<=12?'s12':'s24'}`;
  grid.innerHTML=Array.from({length:n},(_,i)=>`
    <div class="seed-inp-wrap">
      <span class="seed-inp-num">${i+1}</span>
      <input type="text" class="seed-inp" data-idx="${i}" value="${esc(existing[i]||'')}" placeholder="kata" autocomplete="off" spellcheck="false" style="font-family:var(--mono);font-size:12px;padding-left:24px;padding-top:8px;padding-bottom:8px;">
    </div>`).join('');
}

function getSeedValuesFromGrid() { return Array.from(document.querySelectorAll('.seed-inp')).map(i=>i.value.trim().toLowerCase()); }
function getSeedValues() {
  if (seedMode==='text') {
    const ta=document.getElementById('seed-textarea');
    if (!ta||!ta.value.trim()) return [];
    return ta.value.trim().toLowerCase().split(/\s+/).filter(w=>w);
  }
  return getSeedValuesFromGrid();
}

function updateStr() {
  const pw=document.getElementById('f-pass').value;
  const fill=document.getElementById('str-fill');
  let s=0;
  if(pw.length>=8)s++;if(pw.length>=12)s++;
  if(/[A-Z]/.test(pw))s++;if(/[0-9]/.test(pw))s++;if(/[^A-Za-z0-9]/.test(pw))s++;
  const clrs=['#ff4d6d','#ff7043','#ffd166','#00d4aa','#06d6a0'];
  fill.style.width=(s/5*100)+'%';
  fill.style.background=pw?(clrs[Math.min(s-1,4)]):'';
}

function saveEntry() {
  const cat  = document.getElementById('f-cat').value;
  const name = document.getElementById('f-name').value.trim();
  if (!name) { toast('⚠️ Nama layanan wajib diisi!'); return; }

  let entry={id:editId||uid(),cat,name,note:document.getElementById('f-note').value.trim()};
  if (cat==='crypto') {
    entry.network    = document.getElementById('f-network').value;
    entry.walletAddr = document.getElementById('f-wallet-addr').value.trim();
    entry.walletPw   = document.getElementById('f-wallet-pw').value;
    entry.seedPhrase = getSeedValues().filter(w=>w);
  } else {
    const user=document.getElementById('f-user').value.trim();
    const pass=document.getElementById('f-pass').value;
    const isDefault=DEFAULT_CATS.find(c=>c.id===cat);
    if (isDefault&&(!user||!pass)){toast('⚠️ Username dan password wajib diisi!');return;}
    entry.user=user; entry.pass=pass;
    entry.url=document.getElementById('f-url').value.trim();
  }

  if (editId) {
    const idx=vault.findIndex(e=>e.id===editId);
    if (idx===-1){toast('⚠️ Akun tidak ditemukan');return;}
    vault[idx]=entry; toast('✅ Akun diperbarui');
  } else { vault.push(entry); toast('✅ Akun disimpan'); }

  closeModal('modal-entry'); render(); _doSaveToLocal();
  try{localStorage.setItem(LS_BKPDATA+'_pending',_vaultDataHash());}catch(e){}
  checkBackupReminder();
}

function editEntry(id) {
  if (lockedIds.has(id)){toast('🔒 Akun terkunci — unlock dulu sebelum edit');return;}
  const e=vault.find(e=>e.id===id); if(e) openEntryModal(e);
}

function toggleLock(id) {
  if(lockedIds.has(id)){lockedIds.delete(id);toast('🔓 Akun tidak lagi terkunci');}
  else{lockedIds.add(id);expandedIds.delete(id);toast('🔒 Akun terkunci dari edit & hapus');}
  render(); _doSaveToLocal();
}

function deleteEntry(id) {
  if(lockedIds.has(id)){toast('🔒 Akun terkunci — unlock dulu sebelum hapus');return;}
  const e=vault.find(e=>e.id===id); if(!e) return;
  if(confirm(`Pindahkan "${e.name}" ke Recycle Bin?\nBisa dipulihkan dari menu Recycle Bin.`)){
    recycleBin.push({...e,deletedAt:new Date().toISOString()});
    vault=vault.filter(v=>v.id!==id);
    lockedIds.delete(id); expandedIds.delete(id); pwVisible.delete(id); seedVisible.delete(id);
    render(); updateRecycleBadge(); toast('🗑️ Dipindahkan ke Recycle Bin');
    _doSaveToLocal(); checkBackupReminder();
  }
}

// ── RECYCLE BIN ──
function updateRecycleBadge() {
  const badge=document.getElementById('recycle-badge');
  if (badge){badge.textContent=recycleBin.length;badge.style.display=recycleBin.length>0?'inline-flex':'none';}
}

function openRecycleBin(){renderRecycleBin();document.getElementById('modal-recycle').classList.add('open');}

function renderRecycleBin() {
  const list=document.getElementById('recycle-list');
  const empty=document.getElementById('recycle-empty');
  if (!list) return;
  list.innerHTML='';
  if (recycleBin.length===0){empty.style.display='block';document.getElementById('recycle-empty-all').style.display='none';return;}
  empty.style.display='none';
  document.getElementById('recycle-empty-all').style.display='flex';
  recycleBin.slice().reverse().forEach((e,ri)=>{
    const realIdx=recycleBin.length-1-ri;
    const date=e.deletedAt?new Date(e.deletedAt).toLocaleString('id-ID',{dateStyle:'short',timeStyle:'short'}):'—';
    const row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:10px;background:var(--s2);border-radius:10px;padding:12px;margin-bottom:8px;';
    row.innerHTML=`
      <div style="font-size:22px;flex-shrink:0;">${catIcon(e.cat)}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(e.name)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px;">${catLabel(e.cat)} · Dihapus ${date}</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;">
        <button class="ibtn" onclick="restoreEntry(${realIdx})" style="color:var(--teal);border-color:var(--teal);width:auto;padding:0 10px;font-size:12px;font-weight:600;">↩ Pulihkan</button>
        <button class="ibtn del" onclick="permanentDelete(${realIdx})">🗑️</button>
      </div>`;
    list.appendChild(row);
  });
}

function restoreEntry(idx){
  const e=recycleBin[idx]; if(!e) return;
  if(vault.find(v=>v.id===e.id)) e.id=uid();
  const{deletedAt,...clean}=e;
  vault.push(clean); recycleBin.splice(idx,1);
  renderRecycleBin(); render(); updateRecycleBadge();
  toast(`↩ "${clean.name}" dipulihkan`); _doSaveToLocal();
}

function permanentDelete(idx){
  const e=recycleBin[idx]; if(!e) return;
  if(confirm(`Hapus "${e.name}" secara permanen?\nData tidak bisa dipulihkan.`)){
    recycleBin.splice(idx,1); renderRecycleBin(); updateRecycleBadge();
    toast('🗑️ Dihapus permanen'); _doSaveToLocal();
  }
}

function emptyRecycleBin(){
  if(recycleBin.length===0) return;
  if(confirm(`Hapus semua ${recycleBin.length} item di Recycle Bin secara permanen?\nTidak bisa dipulihkan.`)){
    recycleBin=[]; renderRecycleBin(); updateRecycleBadge();
    toast('🗑️ Recycle Bin dikosongkan'); _doSaveToLocal();
  }
}
