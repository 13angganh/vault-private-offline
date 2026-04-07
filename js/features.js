/* ════════════════════════════════════════════
   SYNC — QR, Text, Export, Import
   ════════════════════════════════════════════ */

function openSync(){
  document.getElementById('modal-sync').classList.add('open');
  document.getElementById('qr-container').style.display='none';
  document.getElementById('text-container').style.display='none';
}
function setSyncTab(name,btn){
  document.querySelectorAll('.sync-tab').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  document.querySelectorAll('.sync-panel').forEach(p=>p.classList.remove('on'));
  document.getElementById('sp-'+name).classList.add('on');
}
async function genQR(){
  if (!masterPw){toast('⚠️ Buka vault dulu');return;}
  const customCats=categories.filter(c=>!DEFAULT_CATS.find(d=>d.id===c.id));
  const enc=await ENC.encrypt(JSON.stringify({vault,meta:{hint:vaultMeta.hint,recovery:vaultMeta.recovery||''},customCats}),masterPw);
  const container=document.getElementById('qr-canvas'); container.innerHTML='';
  document.getElementById('qr-container').style.display='flex';
  document.getElementById('text-container').style.display='none';
  new QRCode(container,{text:'VAULT2:'+enc,width:220,height:220,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M});
}
async function genText(){
  if (!masterPw){toast('⚠️ Buka vault dulu');return;}
  const customCats=categories.filter(c=>!DEFAULT_CATS.find(d=>d.id===c.id));
  const enc=await ENC.encrypt(JSON.stringify({vault,meta:{hint:vaultMeta.hint,recovery:vaultMeta.recovery||''},customCats}),masterPw);
  document.getElementById('enc-text-display').textContent='VAULT2:'+enc;
  document.getElementById('text-container').style.display='block';
  document.getElementById('qr-container').style.display='none';
}
function copyEncText(){copyText(document.getElementById('enc-text-display').textContent);toast('📋 Teks terenkripsi disalin!');}

async function importFromText(){
  const raw=document.getElementById('import-text-input').value.trim();
  const err=document.getElementById('sync-err'); err.style.display='none';
  if (!raw){err.textContent='Paste teks terenkripsi terlebih dahulu.';err.style.display='block';return;}
  try {
    const enc=raw.startsWith('VAULT2:')?raw.slice(7):raw;
    const data=JSON.parse(await ENC.decrypt(enc,masterPw));
    const incoming=data.vault||data;
    if (!Array.isArray(incoming)) throw new Error('Format tidak valid');
    if (Array.isArray(data.customCats)&&data.customCats.length>0){
      const dids=DEFAULT_CATS.map(c=>c.id);
      const existCids=new Set(categories.filter(c=>!dids.includes(c.id)).map(c=>c.id));
      const newCats=data.customCats.filter(c=>!dids.includes(c.id)&&!existCids.has(c.id));
      if (newCats.length>0){categories=[...categories,...newCats];saveCats();}
    }
    const existIds=new Set(vault.map(e=>e.id));
    const merged=incoming.filter(e=>!existIds.has(e.id));
    vault.push(...merged); render(); _doSaveToLocal();
    closeModal('modal-sync'); toast(`✅ ${merged.length} akun baru ditambahkan!`);
  } catch(e){err.textContent='Gagal mendekripsi. Pastikan master password sama dengan perangkat pengirim.';err.style.display='block';}
}

function startQRScan(){
  const area=document.getElementById('qr-scan-area');
  area.style.display=area.style.display==='none'?'block':'none';
  if (area.style.display==='block'){
    navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})
      .then(s=>{document.getElementById('qr-video').srcObject=s;toast('📷 Kamera aktif — arahkan ke QR');})
      .catch(()=>{area.style.display='none';toast('⚠️ Kamera tidak bisa diakses');});
  } else {
    const v=document.getElementById('qr-video'); if(v.srcObject)v.srcObject.getTracks().forEach(t=>t.stop());
  }
}

/* ════════════════════════════════════════════
   EXPORT / IMPORT FILE
   ════════════════════════════════════════════ */
async function exportVault(){
  if (!masterPw){toast('⚠️ Buka vault dulu sebelum ekspor');return;}
  const customCats=categories.filter(c=>!DEFAULT_CATS.find(d=>d.id===c.id));
  const enc=await ENC.encrypt(JSON.stringify({vault,meta:{hint:vaultMeta.hint,recoveryHash:vaultMeta.recoveryHash,recovery:vaultMeta.recovery||''},customCats,lockedIds:[...lockedIds],recycleBin}),masterPw);
  const blob=new Blob([JSON.stringify({format:'vault2',hint:vaultMeta.hint||'',data:enc,count:vault.length,exportedAt:new Date().toISOString()})],{type:'application/json'});
  _downloadVaultFile(blob,`vault-backup-${new Date().toISOString().slice(0,10)}.vault`);
  recordBackupDone();
  toast(vault.length>0?`💾 Backup berhasil! (${vault.length} akun terenkripsi)`:'💾 Backup berhasil! (meta & recovery tersimpan)');
}

async function importVaultFile(event){
  const file=event.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=async(e)=>{
    try {
      const parsed=JSON.parse(e.target.result);
      let incoming,importedCustomCats=null,importedLockedIds=[],importedRecycleBin=[];
      if (parsed.format==='vault2'){
        const decWith=async(pw)=>JSON.parse(await ENC.decrypt(parsed.data,pw));
        let data;
        if (!masterPw){
          const pw=prompt('Masukkan master password untuk membuka file vault ini:'); if(!pw) return;
          try{data=await decWith(pw);}catch{alert('Password salah atau file rusak.');return;}
          masterPw=pw; vaultMeta={hint:parsed.hint||'',recoveryHash:data.meta?.recoveryHash||'',recovery:data.meta?.recovery||'',encMasterBySeed:data.meta?.encMasterBySeed||''};
        } else {
          try{data=await decWith(masterPw);}
          catch{const pw=prompt('Master password berbeda. Masukkan password file ini:');if(!pw) return;try{data=await decWith(pw);}catch{alert('Password salah.');return;}}
        }
        incoming=data.vault; importedCustomCats=data.customCats||null;
        importedLockedIds=data.lockedIds||[]; importedRecycleBin=data.recycleBin||[];
      } else { incoming=parsed.accounts||parsed; }
      if (!Array.isArray(incoming)) throw new Error('Format tidak valid');
      if (Array.isArray(importedCustomCats)&&importedCustomCats.length>0){
        const dids=DEFAULT_CATS.map(c=>c.id);
        const existCids=new Set(categories.filter(c=>!dids.includes(c.id)).map(c=>c.id));
        const newCats=importedCustomCats.filter(c=>!dids.includes(c.id)&&!existCids.has(c.id));
        if (newCats.length>0){categories=[...categories,...newCats];saveCats();}
      }
      const valid=incoming.filter(a=>a.name);
      if (vault.length===0){vault=valid;lockedIds=new Set(importedLockedIds);recycleBin=importedRecycleBin;}
      else{
        const mode=confirm(`Ditemukan ${valid.length} akun.\nOK = Gabungkan\nCancel = Ganti semua`);
        if (mode){
          const eids=new Set(vault.map(e=>e.id)); vault.push(...valid.filter(a=>!eids.has(a.id)));
          importedLockedIds.forEach(id=>lockedIds.add(id));
          const erids=new Set(recycleBin.map(r=>r.id));
          recycleBin.push(...importedRecycleBin.filter(r=>!erids.has(r.id)));
        } else {vault=valid;lockedIds=new Set(importedLockedIds);recycleBin=importedRecycleBin;}
      }
      document.getElementById('lock-screen').style.display='none';
      document.getElementById('setup-screen').style.display='none';
      document.getElementById('main-app').style.display='block';
      render(); updateRecycleBadge(); _doSaveToLocal();
      toast(`✅ ${valid.length} akun diimpor!`);
    } catch(err){alert('File tidak valid: '+err.message);}
  };
  reader.readAsText(file); event.target.value='';
}

/* ════════════════════════════════════════════
   BACKUP REMINDER SYSTEM
   ════════════════════════════════════════════ */
function _vaultDataHash(){
  try{return btoa(encodeURIComponent(JSON.stringify({v:vault.length,r:recycleBin.length,l:lockedIds.size,ids:vault.map(e=>e.id).join(',')}))).slice(0,32);}
  catch(e){return Date.now().toString(36);}
}

async function _buildVaultBlob(){
  const customCats=categories.filter(c=>!DEFAULT_CATS.find(d=>d.id===c.id));
  const enc=await ENC.encrypt(JSON.stringify({vault,meta:{hint:vaultMeta.hint,recoveryHash:vaultMeta.recoveryHash,recovery:vaultMeta.recovery||''},customCats,lockedIds:[...lockedIds],recycleBin}),masterPw);
  return new Blob([JSON.stringify({format:'vault2',hint:vaultMeta.hint||'',data:enc,count:vault.length,exportedAt:new Date().toISOString()})],{type:'application/json'});
}

function recordBackupDone(){
  try{localStorage.setItem(LS_BACKUP,Date.now().toString());localStorage.setItem(LS_BKPDATA,_vaultDataHash());}catch(e){}
  backupDismissedAt=0; try{localStorage.removeItem(LS_BKPDISM);}catch(e){}
  checkBackupReminder(); updateBackupStatusUI();
}

function checkBackupReminder(){
  const banner=document.getElementById('backup-banner');
  if (!banner||!masterPw) return;
  const lastBackup=parseInt(localStorage.getItem(LS_BACKUP)||'0');
  const lastHash=localStorage.getItem(LS_BKPDATA)||'';
  const dismissed=parseInt(localStorage.getItem(LS_BKPDISM)||'0');
  const now=Date.now(); const intervalMs=backupIntervalHrs*3600000;
  const currentHash=_vaultDataHash(); const dataChanged=lastHash!==currentHash;
  if (dismissed>0&&(now-dismissed)<6*3600000){banner.style.display='none';return;}
  const icon=document.getElementById('backup-banner-icon');
  const title=document.getElementById('backup-banner-title');
  const desc=document.getElementById('backup-banner-desc');
  if (lastBackup===0){
    banner.style.display='block'; banner.style.borderColor='rgba(255,77,109,.5)'; banner.style.background='rgba(255,77,109,.09)';
    if(icon)icon.textContent='🚨'; if(title)title.textContent='Belum pernah backup!';
    if(desc)desc.textContent='Data bisa hilang permanen jika browser dihapus datanya. Backup sekarang ke file manager, WhatsApp, Telegram, atau Google Drive.';
  } else if (dataChanged&&(now-lastBackup)>intervalMs){
    banner.style.display='block'; banner.style.borderColor='rgba(240,165,0,.35)'; banner.style.background='rgba(240,165,0,.07)';
    const h=Math.round((now-lastBackup)/3600000);
    if(icon)icon.textContent='⚠️'; if(title)title.textContent=`Backup sudah ${h<24?h+' jam':Math.round(h/24)+' hari'} yang lalu`;
    if(desc)desc.textContent='Ada perubahan data sejak backup terakhir. Backup sekarang agar tetap aman.';
  } else { banner.style.display='none'; }
}

function dismissBackupBanner(){
  const b=document.getElementById('backup-banner'); if(b)b.style.display='none';
  backupDismissedAt=Date.now(); try{localStorage.setItem(LS_BKPDISM,backupDismissedAt.toString());}catch(e){}
}

async function backupNow(){
  if (!masterPw){toast('⚠️ Buka vault dulu');return;}
  try{
    const blob=await _buildVaultBlob();
    const filename=`vault-backup-${new Date().toISOString().slice(0,10)}.vault`;
    const file=new File([blob],filename,{type:'application/json'});
    if (navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
      await navigator.share({title:'Vault Backup',text:'File backup Vault — simpan di tempat aman.',files:[file]});
      recordBackupDone(); toast('✅ Backup berhasil dibagikan!');
    } else { _downloadVaultFile(blob,filename); recordBackupDone(); }
  } catch(e){
    if (e.name!=='AbortError'){
      try{const blob=await _buildVaultBlob();_downloadVaultFile(blob,`vault-backup-${new Date().toISOString().slice(0,10)}.vault`);recordBackupDone();}
      catch(e2){toast('⚠️ Gagal backup: '+e2.message);}
    }
  }
}

function _downloadVaultFile(blob,filename){
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
  toast('💾 File backup tersimpan!');
}

function updateBackupStatusUI(){
  const lastBackup=parseInt(localStorage.getItem(LS_BACKUP)||'0');
  const lastHash=localStorage.getItem(LS_BKPDATA)||'';
  const currentHash=masterPw?_vaultDataHash():'';
  const elTime=document.getElementById('last-backup-time');
  const elStatus=document.getElementById('backup-status-text');
  if (!elTime||!elStatus) return;
  if (lastBackup===0){elTime.textContent='Belum pernah';elTime.style.color='#ff4d6d';elStatus.textContent='🚨 Belum pernah backup — data berisiko hilang!';elStatus.style.color='#ff4d6d';return;}
  const diffMs=Date.now()-lastBackup; const h=Math.round(diffMs/3600000);
  elTime.textContent=h<1?'Baru saja':h<24?`${h} jam lalu`:`${Math.round(h/24)} hari lalu`;
  elTime.style.color=h>backupIntervalHrs?'#f0a500':'#00d4aa';
  const changed=masterPw&&currentHash&&lastHash!==currentHash;
  const overdue=diffMs>backupIntervalHrs*3600000;
  if (changed&&overdue){elStatus.textContent='⚠️ Ada perubahan data, perlu backup ulang';elStatus.style.color='#f0a500';}
  else if (changed){elStatus.textContent='🔵 Ada perubahan data sejak backup terakhir';elStatus.style.color='#4d8eff';}
  else{elStatus.textContent='✅ Data aman, backup masih valid';elStatus.style.color='#00d4aa';}
}

function setBackupInterval(hrs,btn){
  backupIntervalHrs=hrs; try{localStorage.setItem(LS_BKPIVL,hrs.toString());}catch(e){}
  document.querySelectorAll('.bkp-btn').forEach(b=>{b.style.background='var(--s2)';b.style.color='var(--muted2)';b.style.borderColor='var(--border)';});
  if (btn){btn.style.background='rgba(240,165,0,0.15)';btn.style.color='var(--gold)';btn.style.borderColor='var(--gold)';}
  checkBackupReminder();
}

/* ════════════════════════════════════════════
   CATEGORIES MANAGER
   ════════════════════════════════════════════ */
function openCatManager(){
  document.getElementById('new-cat-name').value='';
  document.getElementById('new-cat-icon').value='';
  document.getElementById('new-cat-icon-preview').textContent='🗂️';
  renderCatManager(); document.getElementById('modal-cats').classList.add('open');
}

function renderCatManager(){
  document.getElementById('cat-list').innerHTML=categories.map(c=>`
    <div class="cat-row" id="catrow-${c.id}">
      <div class="cat-row-icon" onclick="openEmojiPicker('${c.id}')" title="Ganti icon">${c.icon}</div>
      <div class="cat-row-name" id="catname-${c.id}">${esc(c.label)}</div>
      <div class="cat-row-btns">
        <button class="ibtn" onclick="editCatInline('${c.id}')">✏️</button>
        ${c.deletable!==false?`<button class="ibtn del" onclick="deleteCat('${c.id}')">🗑️</button>`:'<button class="ibtn" style="opacity:.2;cursor:default">🔒</button>'}
      </div>
    </div>`).join('');
}

function editCatInline(id){
  const c=categories.find(c=>c.id===id); if(!c) return;
  document.getElementById('catname-'+id).innerHTML=`
    <input type="text" value="${esc(c.label)}" id="cat-edit-input-${id}"
      style="background:var(--s2);border:1px solid var(--gold);border-radius:6px;padding:5px 8px;color:var(--text);font-family:Outfit,sans-serif;font-size:13px;width:100%;outline:none;"
      onkeydown="if(event.key==='Enter')saveCatEdit('${id}');if(event.key==='Escape')renderCatManager();">
    <div style="display:flex;gap:6px;margin-top:6px;">
      <button class="btn btn-teal btn-sm" onclick="saveCatEdit('${id}')">✓ Simpan</button>
      <button class="btn btn-ghost btn-sm" onclick="renderCatManager()">✕</button>
    </div>`;
  document.getElementById('cat-edit-input-'+id).focus();
}

function saveCatEdit(id){
  const inp=document.getElementById('cat-edit-input-'+id); if(!inp) return;
  const newLabel=inp.value.trim(); if(!newLabel){toast('⚠️ Nama tidak boleh kosong');return;}
  const c=categories.find(c=>c.id===id);
  if(c){c.label=newLabel;saveCats();renderCatManager();render();toast('✓ Nama diperbarui');_doSaveToLocal();}
}

function openEmojiPicker(catId){
  document.getElementById('emoji-target-cat').value=catId;
  document.getElementById('emoji-custom-input').value='';
  document.getElementById('emoji-grid').innerHTML=EMOJI_GRID_LIST.map(e=>`<button class="emoji-btn" onclick="selectEmoji('${e}')">${e}</button>`).join('');
  document.getElementById('modal-emoji').classList.add('open');
}

function selectEmoji(emoji){applyEmoji(document.getElementById('emoji-target-cat').value,emoji);}

function applyEmoji(catId,emoji){
  if (!emoji.trim()) return;
  const c=categories.find(c=>c.id===catId);
  if(c){c.icon=emoji.trim();saveCats();renderCatManager();render();_doSaveToLocal();}
  closeModal('modal-emoji'); toast('✓ Icon diperbarui');
}

function openNewCatEmojiPicker(){
  document.getElementById('emoji-target-cat').value='__new__';
  document.getElementById('emoji-custom-input').value='';
  document.getElementById('emoji-grid').innerHTML=EMOJI_GRID_LIST.map(e=>`<button class="emoji-btn" onclick="selectEmojiForNew('${e}')">${e}</button>`).join('');
  document.getElementById('modal-emoji').classList.add('open');
}

function selectEmojiForNew(emoji){
  document.getElementById('new-cat-icon').value=emoji;
  document.getElementById('new-cat-icon-preview').textContent=emoji;
  closeModal('modal-emoji');
}

function deleteCat(id){
  const c=categories.find(c=>c.id===id); if(!c||c.deletable===false) return;
  const affected=vault.filter(e=>e.cat===id);
  if (affected.length===0){
    if(!confirm(`Hapus kategori "${c.label}"?`)) return;
    if(currentFilter===id) currentFilter='semua';
    categories=categories.filter(c=>c.id!==id); saveCats(); renderCatManager(); render(); _doSaveToLocal(); toast('🗑️ Kategori dihapus'); return;
  }
  openMoveCatDialog(id,c.label,affected.length);
}

function openMoveCatDialog(fromId,fromLabel,count){
  const sel=document.getElementById('move-cat-select');
  sel.innerHTML=categories.filter(c=>c.id!==fromId).map(c=>`<option value="${c.id}">${c.icon} ${c.label}</option>`).join('');
  document.getElementById('move-cat-info').textContent=`Kategori "${fromLabel}" masih punya ${count} akun. Pindahkan semua ke:`;
  document.getElementById('move-cat-confirm').onclick=()=>{
    const toId=sel.value;
    vault=vault.map(e=>e.cat===fromId?{...e,cat:toId}:e);
    if(currentFilter===fromId) currentFilter='semua';
    categories=categories.filter(c=>c.id!==fromId); saveCats(); _doSaveToLocal();
    closeModal('modal-move-cat'); closeModal('modal-cats'); setTimeout(openCatManager,100); render();
    toast(`✓ ${count} akun dipindah, kategori dihapus`);
  };
  document.getElementById('modal-move-cat').classList.add('open');
}

function addNewCat(){
  const name=document.getElementById('new-cat-name').value.trim();
  const icon=document.getElementById('new-cat-icon').value.trim()||'🗂️';
  if (!name){toast('⚠️ Nama kategori wajib diisi');return;}
  if (categories.find(c=>c.label.toLowerCase()===name.toLowerCase())){toast('⚠️ Nama kategori sudah ada');return;}
  categories.push({id:'cat_'+Date.now(),icon,label:name,editable:true,deletable:true});
  saveCats();
  document.getElementById('new-cat-name').value='';
  document.getElementById('new-cat-icon').value='';
  document.getElementById('new-cat-icon-preview').textContent='🗂️';
  renderCatManager(); render(); _doSaveToLocal(); toast(`✓ Kategori "${name}" ditambahkan`);
}
