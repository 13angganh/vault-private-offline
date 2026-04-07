/* ════════════════════════════════════════════
   APP STATE & CONSTANTS
   ════════════════════════════════════════════ */

// Vault data
let vault       = [];
let masterPw    = '';
let vaultMeta   = {};
let currentFilter = 'semua';
let editId      = null;

// Seed phrase UI state
let seedLen  = 12;
let seedMode = 'grid'; // 'grid' | 'text'

// View state
let expandedIds = new Set();
let pwVisible   = new Set();
let seedVisible = new Set();
let lockedIds   = new Set();
let recycleBin  = [];

// LocalStorage keys
const LS_KEY     = 'vault_data';
const LS_META    = 'vault_meta';
const LS_PIN     = 'vault_pin';
const LS_THEME   = 'vault_theme';
const LS_BACKUP  = 'vault_last_backup';
const LS_BKPDATA = 'vault_last_data_hash';
const LS_BKPIVL  = 'vault_backup_interval';
const LS_BKPDISM = 'vault_backup_dismissed';

// Backup reminder
let backupIntervalHrs = 24;
let backupDismissedAt = 0;

// Auto-lock
let autoLockMinutes = 0;
let idleTimer       = null;
let idleCountdown   = null;
let lastActivity    = Date.now();

// Auto-save
let autoSaveEnabled = true;
let autoSaveTimer   = null;

// PIN
let pinBuffer   = [];
let pinAttempts = 0;
let pinLocked   = false;

// PIN setup flow
let pinSetupBuffer = [];
let pinSetupStep   = 1;
let pinSetupFirst  = '';

// Word list for recovery phrase
const WORDS = [
  'apple','brave','cloud','dance','eagle','frost','grace','heart','ivory','jewel',
  'kings','light','magic','noble','ocean','pearl','quest','river','storm','truth',
  'ultra','vivid','winds','xenon','yawns','zebra','amber','blaze','crisp','delta',
  'ember','flare','glade','haven','indie','jazzy','kneel','lunar','maple','nexus',
  'oaken','prism','quirk','roost','slate','titan','unity','vapor','waltz','xenix',
  'yield','zones'
];

let currentRecovery = [];

// ── Default Categories ──
const DEFAULT_CATS = [
  { id:'sosmed', icon:'📱', label:'Sosmed',  editable:true, deletable:false },
  { id:'email',  icon:'📧', label:'Email',   editable:true, deletable:false },
  { id:'bank',   icon:'🏦', label:'Bank',    editable:true, deletable:false },
  { id:'game',   icon:'🎮', label:'Game',    editable:true, deletable:false },
  { id:'crypto', icon:'🪙', label:'Crypto',  editable:true, deletable:false },
  { id:'lainnya',icon:'🗂️', label:'Lainnya', editable:true, deletable:false },
];
let categories = JSON.parse(JSON.stringify(DEFAULT_CATS));

// ── Color palettes ──
const CAT_COLORS = [
  'rgba(77,142,255,.12)','rgba(255,77,109,.12)','rgba(0,212,170,.12)',
  'rgba(243,156,18,.12)','rgba(247,147,26,.12)','rgba(150,150,200,.12)',
  'rgba(160,82,255,.12)','rgba(255,180,0,.12)', 'rgba(0,200,120,.12)',
];
const CHIP_COLORS = [
  {bg:'rgba(77,142,255,.15)', fg:'#4d8eff'}, {bg:'rgba(255,77,109,.15)', fg:'#ff4d6d'},
  {bg:'rgba(0,212,170,.15)',  fg:'#00d4aa'}, {bg:'rgba(243,156,18,.15)', fg:'#f39c12'},
  {bg:'rgba(247,147,26,.15)', fg:'#f7931a'}, {bg:'rgba(150,150,200,.15)',fg:'#9294ae'},
  {bg:'rgba(160,82,255,.15)', fg:'#a052ff'}, {bg:'rgba(255,180,0,.15)',  fg:'#ffb400'},
  {bg:'rgba(0,200,120,.15)',  fg:'#00c878'},
];

const EMOJI_GRID_LIST = [
  '📱','📧','🏦','🎮','🪙','🗂️','🛒','✈️','🏥','🎵',
  '📚','💼','🏠','🚗','🍔','💪','🎨','📷','🔑','💡',
  '🌐','🤝','💰','🎯','🧩','🔧','📊','🌱','🎁','⭐',
  '🔐','🧸','🏋️','🎬','🌍','💳','🖥️','📝','🏆','🎤',
];

// ── Helpers ──
function catIcon(id)      { return (categories.find(c=>c.id===id)||{icon:'🗂️'}).icon; }
function catLabel(id)     { return (categories.find(c=>c.id===id)||{label:id}).label; }
function catColorIdx(id)  { const i = categories.findIndex(c=>c.id===id); return i>=0 ? i%CAT_COLORS.length : 5; }

function uid() { return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

async function hashStr(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escAttr(s) {
  return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), 2800);
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).catch(()=>{
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  });
  if (btn) { const o = btn.textContent; btn.textContent = '✓'; setTimeout(()=>btn.textContent=o, 1500); }
}

function togglePw(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type==='password') { inp.type='text'; btn.textContent='🙈'; }
  else { inp.type='password'; btn.textContent='👁️'; }
}
