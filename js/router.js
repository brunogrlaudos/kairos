// ── Kairós Router & Utils ─────────────────────────────────────

// ── State global ──────────────────────────────────────────────
const State = {
  page:        'home',   // home | inscricao | login | app
  tab:         '',
  msg:         null,
  selRole:     '',
  filtroTurma: '',
  filtroRole:  'todos',
  editAula:    null,
  editUser:    null,
  verDocUid:   null,
  inscStep:    1,
  inscData:    {},
  // Cache de dados carregados
  cache: {
    alunos:  {},   // turmaId → array
    aulas:   {},   // turmaId → array
    notifs:  [],
    docs:    {},   // usuarioId → objeto
  },
};

// ── Router ────────────────────────────────────────────────────
const Router = {
  async go(page, opts = {}) {
    State.page    = page;
    State.msg     = null;
    State.tab     = opts.tab || '';
    State.editAula  = null;
    State.editUser  = null;
    State.verDocUid = null;
    if (page === 'inscricao') { State.inscStep = 1; State.inscData = {}; }
    await App.render();
  },

  async setTab(tab) {
    State.tab     = tab;
    State.msg     = null;
    State.editAula  = null;
    State.editUser  = null;
    State.verDocUid = null;
    await App.render();
  },
};

// ── Utils ─────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(s) {
  if (!s) return '—';
  return new Date(s + 'T12:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
  });
}

function fmtDateFull(s) {
  if (!s) return '—';
  return new Date(s + 'T12:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function initials(nome) {
  return (nome || '?').split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase();
}

function pad(n) { return String(n).padStart(2, '0'); }

function pctCor(p) {
  return p >= 75 ? 'var(--teal)' : p >= 50 ? 'var(--amber)' : 'var(--red)';
}

function pctBadge(p) {
  if (p === null) return '';
  const cls = p >= 75 ? 'badge-ok' : p >= 50 ? 'badge-warn' : 'badge-err';
  return `<span class="badge ${cls}">${p}%</span>`;
}

function roleName(r) {
  return { aluno: 'Aluno', catequista: 'Catequista', secretaria: 'Secretaria', admin: 'Admin' }[r] || r;
}

function roleBadge(r) {
  const cls = { aluno: 'badge-ok', catequista: 'badge-info', secretaria: 'badge-warn', admin: 'badge-purple' }[r] || 'badge-gray';
  return `<span class="badge ${cls}">${roleName(r)}</span>`;
}

function avCls(r) {
  return { aluno: 'av-teal', catequista: 'av-blue', secretaria: 'av-amber', admin: 'av-purple' }[r] || 'av-teal';
}

function novaMat() {
  return String(10000 + Math.floor(Math.random() * 89999));
}

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── HTML helpers ──────────────────────────────────────────────
function el(tag, cls, content, attrs = '') {
  return `<${tag} class="${cls}" ${attrs}>${content}</${tag}>`;
}

function turmaSelect(ids, onchange = "App.render()") {
  const opts = KAIROS_CONFIG.turmas
    .filter(t => !ids || ids.includes(t.id))
    .map(t => `<option value="${t.id}" ${State.filtroTurma === t.id ? 'selected' : ''}>${t.nome}</option>`)
    .join('');
  return `<select class="turma-select" onchange="State.filtroTurma=this.value;${onchange}">${opts}</select>`;
}

function showMsg(txt, ok = true) {
  State.msg = { txt, ok };
  App.render();
}

function loading(txt = 'Aguarde...') {
  document.getElementById('app').innerHTML = `
    <div class="splash"><div class="splash-icon">✝</div>
    <p class="splash-sub">${txt}</p></div>`;
}
