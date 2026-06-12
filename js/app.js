// ── View: Relatório (compartilhado) ───────────────────────────

const ViewRelatorio = {

  freqTable(aulasT, alunosT) {
    if (!alunosT.length) return `<div class="alert alert-info">Nenhum aluno nesta turma.</div>`;
    const rows = alunosT.map(u => {
      const pres = aulasT.filter(a => a.checkins?.includes(u.id)).length;
      const pct  = aulasT.length ? Math.round(pres / aulasT.length * 100) : null;
      return `
        <div class="row">
          <div class="row-main">
            <div class="row-title">${u.nome}</div>
            <div class="row-sub">${pres}/${aulasT.length} aulas</div>
          </div>
          ${pct !== null ? `
            <div class="pct-bar" style="max-width:70px">
              <div class="pct-fill" style="width:${pct}%;background:${pctCor(pct)}"></div>
            </div>
            ${pctBadge(pct)}` : '—'}
        </div>`;
    }).join('');
    return `
      <div class="stats">
        <div class="stat"><div class="stat-label">Aulas</div><div class="stat-value">${aulasT.length}</div></div>
        <div class="stat"><div class="stat-label">Alunos</div><div class="stat-value">${alunosT.length}</div></div>
      </div>
      <div class="card" style="padding:4px 16px">${rows}</div>`;
  },

  docsTable(alunosT, todosDoc) {
    const rows = alunosT.map((u, i) => {
      const docs = todosDoc[i] || {};
      const badges = KAIROS_CONFIG.documentos.map(d => {
        const doc = docs[d.id];
        const cls = doc?.verificado ? 'badge-ok' : doc ? 'badge-warn' : 'badge-gray';
        return `<span class="badge ${cls}" style="font-size:10px">${d.id.slice(0,3).toUpperCase()}</span>`;
      }).join(' ');
      const ver = Object.values(docs).filter(d => d.verificado).length;
      return `
        <div class="row">
          <div class="row-main">
            <div class="row-title">${u.nome}</div>
            <div class="row-sub" style="display:flex;gap:4px;flex-wrap:wrap;margin-top:3px">${badges}</div>
          </div>
          <span class="badge ${ver === KAIROS_CONFIG.documentos.length ? 'badge-ok' : ver > 0 ? 'badge-warn' : 'badge-err'}">
            ${ver}/${KAIROS_CONFIG.documentos.length}
          </span>
        </div>`;
    }).join('');
    return `<div class="card" style="padding:4px 16px">${rows || '<p class="text-sm text-muted" style="padding:8px 0">Nenhum aluno.</p>'}</div>`;
  },

  exportXlsxTurma(turmaId, aulasT, alunosT) {
    const XLSX = window.XLSX;
    if (!XLSX) { alert('Biblioteca Excel não carregada.'); return; }
    const turma = KAIROS_CONFIG.turmas.find(t => t.id === turmaId);
    const wb = XLSX.utils.book_new();
    const rows = [['Matrícula', 'Nome', ...aulasT.map(a => a.tema || fmtDate(a.data)), 'Presenças', 'Total', '%']];
    alunosT.forEach(u => {
      const pres = aulasT.map(a => a.checkins?.includes(u.id) ? 'P' : 'F');
      const tot  = pres.filter(x => x === 'P').length;
      rows.push([u.login, u.nome, ...pres, tot, aulasT.length,
        aulasT.length ? Math.round(tot / aulasT.length * 100) + '%' : '—']);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 28 }, ...aulasT.map(() => ({ wch: 16 })), { wch: 10 }, { wch: 8 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws, (turma?.nome || turmaId).slice(0, 31));
    XLSX.writeFile(wb, `kairos_${turmaId}_frequencia.xlsx`);
  },

  exportXlsxCompleto(turmaId, aulasT, alunosT, todosDoc) {
    const XLSX = window.XLSX;
    if (!XLSX) { alert('Biblioteca Excel não carregada.'); return; }
    const turma = KAIROS_CONFIG.turmas.find(t => t.id === turmaId);
    const wb = XLSX.utils.book_new();

    // Aba frequência
    const r1 = [['Matrícula', 'Nome', ...aulasT.map(a => a.tema || fmtDate(a.data)), '%']];
    alunosT.forEach(u => {
      const pres = aulasT.map(a => a.checkins?.includes(u.id) ? 'P' : 'F');
      const tot  = pres.filter(x => x === 'P').length;
      r1.push([u.login, u.nome, ...pres, aulasT.length ? Math.round(tot / aulasT.length * 100) + '%' : '—']);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(r1), 'Frequência');

    // Aba documentos
    const docNomes = KAIROS_CONFIG.documentos.map(d => d.nome);
    const r2 = [['Matrícula', 'Nome', ...docNomes, 'Verificados']];
    alunosT.forEach((u, i) => {
      const docs = todosDoc[i] || {};
      const cols = KAIROS_CONFIG.documentos.map(d => {
        const doc = docs[d.id];
        return doc ? (doc.verificado ? 'Verificado' : doc.rejeitado ? 'Rejeitado' : 'Enviado') : 'Pendente';
      });
      const ver = cols.filter(x => x === 'Verificado').length;
      r2.push([u.login, u.nome, ...cols, `${ver}/${KAIROS_CONFIG.documentos.length}`]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(r2), 'Documentos');

    XLSX.writeFile(wb, `kairos_${turmaId}.xlsx`);
  },

  async exportXlsxGeral() {
    const XLSX = window.XLSX;
    if (!XLSX) { alert('Biblioteca Excel não carregada.'); return; }
    const wb = XLSX.utils.book_new();
    for (const t of KAIROS_CONFIG.turmas) {
      const aulasT  = await DB.getAulasPorTurma(t.id);
      const alunosT = await DB.getAlunosPorTurma(t.id);
      if (!alunosT.length) continue;
      const rows = [['Matrícula', 'Nome', ...aulasT.map(a => a.tema || fmtDate(a.data)), '%']];
      alunosT.forEach(u => {
        const pres = aulasT.map(a => a.checkins?.includes(u.id) ? 'P' : 'F');
        const tot  = pres.filter(x => x === 'P').length;
        rows.push([u.login, u.nome, ...pres, aulasT.length ? Math.round(tot / aulasT.length * 100) + '%' : '—']);
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), t.nome.slice(0, 31));
    }
    XLSX.writeFile(wb, 'kairos_completo.xlsx');
  },
};


// ── App (orquestrador principal) ──────────────────────────────

const ViewApp = {
  defaultTab(role) {
    return { aluno: 'checkin', catequista: 'aulas', secretaria: 'notifs', admin: 'dashboard' }[role] || '';
  },
};

const App = {
  async init() {
    // Tenta restaurar sessão
    loading('Kairós...');
    await Drive.init();
    const usuario = await Auth.restaurarSessao();
    if (usuario) {
      State.filtroTurma = usuario.turma || KAIROS_CONFIG.turmas[0].id;
      State.page = 'app';
      State.tab  = ViewApp.defaultTab(usuario.role);
    } else {
      State.page = 'home';
    }
    await App.render();
  },

  async render() {
    const el = document.getElementById('app');
    try {
      let html = '';
      if (State.page === 'home')      html = ViewHome.render();
      if (State.page === 'inscricao') html = ViewInscricao.render();
      if (State.page === 'login')     html = ViewLogin.render();
      if (State.page === 'app') {
        const role = Auth.role;
        if (role === 'aluno')      html = await ViewAluno.render();
        if (role === 'catequista') html = await ViewCatequista.render();
        if (role === 'secretaria') html = await ViewSecretaria.render();
        if (role === 'admin')      html = await ViewAdmin.render();
      }
      el.innerHTML = html;
    } catch (e) {
      console.error('Render error:', e);
      el.innerHTML = `<div class="content"><div class="alert alert-err">
        Erro ao carregar: ${e.message}<br>
        <button class="btn btn-sm mt-8" onclick="App.init()">Tentar novamente</button>
      </div></div>`;
    }
  },

  logout() {
    Auth.logout();
    State.page = 'home';
    State.tab  = '';
    State.msg  = null;
    App.render();
  },
};

// Inicia o app
document.addEventListener('DOMContentLoaded', () => App.init());
