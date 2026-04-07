/* ════════════════════════════════════════════
   RENDER — Cards, Filter Bar, Expanded
   ════════════════════════════════════════════ */

function render() {
  const q        = (document.getElementById('search-input')||{value:''}).value.toLowerCase();
  const grid     = document.getElementById('cards');
  const empty    = document.getElementById('empty');

  const filtered = vault.filter(e => {
    const mc = currentFilter==='semua' || e.cat===currentFilter;
    const mq = !q || e.name.toLowerCase().includes(q)
             || (e.user||'').toLowerCase().includes(q)
             || (e.walletAddr||'').toLowerCase().includes(q);
    return mc && mq;
  });

  document.getElementById('st-total').textContent  = vault.length;
  document.getElementById('st-crypto').textContent = vault.filter(e=>e.cat==='crypto').length;
  document.getElementById('st-cat').textContent    = new Set(vault.map(e=>e.cat)).size;

  grid.querySelectorAll('.card').forEach(c=>c.remove());

  if (filtered.length===0) {
    const t = empty.querySelector('.empty-t');
    const d = empty.querySelector('.empty-d');
    if (vault.length===0) {
      if(t) t.textContent='Vault masih kosong';
      if(d) d.innerHTML='Klik <strong>+ Tambah</strong> untuk menyimpan akun pertama.';
    } else if (q) {
      if(t) t.textContent='Tidak ada hasil';
      if(d) d.innerHTML=`Tidak ada akun yang cocok dengan pencarian <strong>"${esc(q)}"</strong>.`;
    } else {
      if(t) t.textContent='Tidak ada akun di sini';
      if(d) d.innerHTML=`Belum ada akun di kategori <strong>${catLabel(currentFilter)}</strong>.`;
    }
    empty.style.display='block';
  } else {
    empty.style.display='none';
  }

  renderFilterBar();

  filtered.forEach(e => {
    const isLocked  = lockedIds.has(e.id);
    const isOpen    = expandedIds.has(e.id);
    const isPwVis   = pwVisible.has(e.id);
    const isSeedVis = seedVisible.has(e.id);
    const sub       = e.cat==='crypto'
      ? (e.walletAddr ? e.walletAddr.slice(0,18)+'…' : e.network||'Crypto')
      : (e.user||'');
    const ci = catColorIdx(e.cat);

    const card = document.createElement('div');
    card.className = 'card'+(e.cat==='crypto'?' crypto-card':'')+(isLocked?' card-locked':'');
    card.dataset.id = e.id;
    card.innerHTML = `
      <div class="avatar" style="background:${CAT_COLORS[ci]}">${catIcon(e.cat)}</div>
      <div class="card-info">
        <div class="card-name">
          ${esc(e.name)}
          <span class="chip" style="background:${CHIP_COLORS[ci].bg};color:${CHIP_COLORS[ci].fg}">${catIcon(e.cat)} ${catLabel(e.cat)}</span>
          ${isLocked?'<span class="lock-badge">🔒 Terkunci</span>':''}
        </div>
        <div class="card-sub">${esc(sub)}</div>
      </div>
      <div class="card-btns">
        <button class="ibtn" title="Detail" onclick="toggleExp('${e.id}')">${isOpen?'🙈':'👁️'}</button>
        <button class="ibtn lock-btn${isLocked?' locked':''}" title="${isLocked?'Unlock akun ini':'Kunci akun'}" onclick="toggleLock('${e.id}')">${isLocked?'🔒':'🔓'}</button>
        <button class="ibtn${isLocked?' ibtn-disabled':''}" title="Edit" onclick="editEntry('${e.id}')">✏️</button>
        <button class="ibtn del${isLocked?' ibtn-disabled':''}" title="Hapus" onclick="deleteEntry('${e.id}')">🗑️</button>
      </div>
      ${isOpen ? buildExpanded(e,isPwVis,isSeedVis) : ''}
    `;
    grid.appendChild(card);
  });

  updateRecycleBadge();
}

function buildExpanded(e, isPwVis, isSeedVis) {
  if (e.cat==='crypto') {
    const seeds=e.seedPhrase||[];
    let seedHtml='';
    if (seeds.length>0) {
      if (!isSeedVis) {
        seedHtml=`<div class="frow"><span class="flabel">Seed Phrase</span><span style="font-family:var(--mono);font-size:12px;color:var(--muted);">${'••• '.repeat(Math.min(seeds.length,8))}(${seeds.length} kata)</span><button class="ibtn" onclick="toggleSeedVis('${e.id}')">👁️ Tampilkan</button></div>`;
      } else {
        const gridView=`<div class="seed-grid ${seeds.length<=12?'g12':'g24'}" id="sv-grid-${e.id}">${seeds.map((w,i)=>`<div class="seed-word"><span>${i+1}</span><strong>${esc(w)}</strong></div>`).join('')}</div>`;
        const listView=`<div class="seed-list" id="sv-list-${e.id}" style="display:none">${seeds.map((w,i)=>`<div class="seed-list-item"><span class="seed-num">${i+1}.</span><span class="seed-val">${esc(w)}</span></div>`).join('')}</div>`;
        seedHtml=`<div class="frow" style="align-items:flex-start;"><span class="flabel">Seed (${seeds.length})</span><div style="flex:1;"><div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;"><button class="btn btn-ghost btn-sm" onclick="toggleSeedView('${e.id}')">🔀 Toggle Grid/List</button><button class="ibtn" onclick="copyText('${escAttr(seeds.join(' '))}',this)">📋</button><button class="ibtn" onclick="toggleSeedVis('${e.id}')">🙈 Sembunyikan</button></div>${gridView}${listView}</div></div>`;
      }
    }
    return `<div class="exp open">
      ${e.network?`<div class="frow"><span class="flabel">Network</span><span class="fval">${esc(e.network)}</span></div>`:''}
      ${e.walletAddr?`<div class="frow"><span class="flabel">Alamat</span><span class="fval">${esc(e.walletAddr)}</span><button class="ibtn" onclick="copyText('${escAttr(e.walletAddr)}',this)">📋</button></div>`:''}
      ${e.walletPw?`<div class="frow"><span class="flabel">Password</span><span class="fval ${isPwVis?'':'dot'}">${isPwVis?esc(e.walletPw):'••••••••'}</span><button class="ibtn" onclick="togglePwVis('${e.id}')">👁️</button><button class="ibtn" onclick="copyText('${escAttr(e.walletPw)}',this)">📋</button></div>`:''}
      ${seedHtml}
      ${e.note?`<div class="frow" style="align-items:flex-start"><span class="flabel">Catatan</span><span style="font-size:12px;color:var(--muted2);line-height:1.5;">${esc(e.note)}</span></div>`:''}
    </div>`;
  }
  return `<div class="exp open">
    <div class="frow"><span class="flabel">Username</span><span class="fval">${esc(e.user)}</span><button class="ibtn" onclick="copyText('${escAttr(e.user)}',this)">📋</button></div>
    <div class="frow"><span class="flabel">Password</span><span class="fval ${isPwVis?'':'dot'}">${isPwVis?esc(e.pass):'••••••••'}</span><button class="ibtn" onclick="togglePwVis('${e.id}')">👁️</button><button class="ibtn" onclick="copyText('${escAttr(e.pass)}',this)">📋</button></div>
    ${e.url?`<div class="frow"><span class="flabel">URL</span><a href="${esc(e.url)}" target="_blank" style="color:var(--teal);font-family:var(--mono);font-size:12px;">${esc(e.url)}</a></div>`:''}
    ${e.note?`<div class="frow" style="align-items:flex-start"><span class="flabel">Catatan</span><span style="font-size:12px;color:var(--muted2);line-height:1.5;">${esc(e.note)}</span></div>`:''}
  </div>`;
}

function renderFilterBar() {
  const bar = document.getElementById('filter-bar');
  if (!bar) return;
  const usedCats = new Set(vault.map(e=>e.cat));
  bar.innerHTML =
    `<button class="flt ${currentFilter==='semua'?'on':''}" onclick="setFilter('semua',this)">Semua</button>` +
    categories
      .filter(c=>usedCats.has(c.id)||c.id===currentFilter)
      .map(c=>`<button class="flt ${currentFilter===c.id?'on':''}" onclick="setFilter('${c.id}',this)">${c.icon} ${c.label}</button>`)
      .join('');
}

function setFilter(f) { currentFilter=f; render(); }

function toggleExp(id)  { if(expandedIds.has(id))expandedIds.delete(id);else expandedIds.add(id); render(); }
function togglePwVis(id){ if(pwVisible.has(id))pwVisible.delete(id);else pwVisible.add(id); render(); }
function toggleSeedVis(id){ if(seedVisible.has(id))seedVisible.delete(id);else seedVisible.add(id); render(); }
function toggleSeedView(id){
  const g=document.getElementById('sv-grid-'+id);
  const l=document.getElementById('sv-list-'+id);
  if (!g||!l) return;
  if (g.style.display==='none'){g.style.display='';l.style.display='none';}
  else{g.style.display='none';l.style.display='block';}
}
