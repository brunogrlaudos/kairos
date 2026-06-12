// ── View: Catequista ──────────────────────────────────────────

const ViewCatequista = {
  async render() {
    const me = Auth.me;
    if (!State.tab) State.tab = 'aulas';
    const minhasTurmas = me.turma
      ? KAIROS_CONFIG.turmas.filter(t => t.id === me.turma)
      : KAIROS_CONFIG.turmas;
    if (!State.filtroTurma || !minhasTurmas.find(t => t.id === State.filtroTurma)) {
      State.filtroTurma = minhasTurmas[0].id;
    }

    let body = '';
    if (State.tab === 'aulas')     body = await ViewCatequista.tabAulas();
    if (State.tab === 'presenca')  body = await ViewCatequista.tabPresenca();
    if (State.tab === 'alunos')    body = await ViewCatequista.tabAlunos();
    if (State.tab === 'relatorio') body = await ViewCatequista.tabRelatorio();

    return `
      <div class="page">
        <div class="topbar">
          <div class="avatar av-blue" style="font-size:13px">${initials(me.nome)}</div>
          <span class="topbar-title">Catequista</span>
          <button class="btn btn-sm btn-red" onclick="App.logout()">Sair</button>
        </div>
        <div class="content">
          <div class="tabs">
            <div class="tab ${State.tab === 'aulas'    ? 'on' : ''}" onclick="Router.setTab('aulas')">Aulas</div>
            <div class="tab ${State.tab === 'presenca' ? 'on' : ''}" onclick="Router.setTab('presenca')">Presença</div>
            <div class="tab ${State.tab === 'alunos'   ? 'on' : ''}" onclick="Router.setTab('alunos')">Alunos</div>
            <div class="tab ${State.tab === 'relatorio'? 'on' : ''}" onclick="Router.setTab('relatorio')">Relatório</div>
          </div>
          ${turmaSelect(minhasTurmas.map(t => t.id), 'App.render()')}
          ${State.msg ? `<div class="alert ${State.msg.ok ? 'alert-ok' : 'alert-err'}">${State.msg.txt}</div>` : ''}
          ${body}
        </div>
      </div>`;
  },

  async tabAulas() {
    const aulasT = await DB.getAulasPorTurma(State.filtroTurma);
    const alunosT = await DB.getAlunosPorTurma(State.filtroTurma);

    let formHtml = '';
    if (State.editAula !== null) formHtml = ViewCatequista.formAula(State.editAula, alunosT);

    const rows = aulasT.map(a => {
      const pct = alunosT.length ? Math.round((a.checkins?.length || 0) / alunosT.length * 100) : 0;
      return `
        <div class="row">
          <div class="row-main">
            <div class="row-title">${a.tema || '(sem tema)'}</div>
            <div class="row-sub">${fmtDate(a.data)} · ${a.checkins?.length || 0}/${alunosT.length} ${pctBadge(pct)}</div>
          </div>
          <button class="btn btn-sm" onclick="State.editAula='${a.id}';App.render()">✏️</button>
        </div>`;
    }).join('');

    return `
      <button class="btn btn-teal mb-12" onclick="State.editAula='novo';App.render()">
        + Nova aula
      </button>
      ${formHtml}
      <div class="card" style="padding:4px 16px">
        ${rows || '<p class="text-sm text-muted" style="padding:8px 0">Nenhuma aula registrada.</p>'}
      </div>`;
  },

  async tabPresenca() {
    const aulaHoje = await DB.getAulaDeHoje(State.filtroTurma);
    const alunosT  = await DB.getAlunosPorTurma(State.filtroTurma);
    if (!aulaHoje) {
      return `
        <div class="alert alert-info">Nenhuma aula aberta para hoje nesta turma.</div>
        <button class="btn btn-teal" onclick="State.editAula='novo';State.tab='aulas';App.render()">
          + Criar aula para hoje
        </button>`;
    }
    const chips = alunosT.map(u => {
      const presente = aulaHoje.checkins?.includes(u.id);
      return `
        <div class="chip ${presente ? 'on' : ''}"
             onclick="ViewCatequista.togglePresenca('${aulaHoje.id}','${u.id}',${presente})">
          <div class="avatar av-teal">${initials(u.nome)}</div>
          <span style="flex:1">${u.nome}</span>
          <span class="badge ${presente ? 'badge-ok' : 'badge-gray'}">${presente ? 'P' : '—'}</span>
        </div>`;
    }).join('');

    return `
      <div class="aula-accent">
        <div class="aula-accent-title">${aulaHoje.tema || 'Aula de hoje'}</div>
        <div class="aula-accent-sub">${fmtDate(aulaHoje.data)} · ${aulaHoje.checkins?.length || 0}/${alunosT.length} presentes</div>
      </div>
      ${chips || '<p class="text-sm text-muted">Nenhum aluno nesta turma.</p>'}`;
  },

  async tabAlunos() {
    const alunosT = await DB.getAlunosPorTurma(State.filtroTurma);
    const aulasT  = await DB.getAulasPorTurma(State.filtroTurma);
    const rows = alunosT.map(u => {
      const pres = aulasT.filter(a => a.checkins?.includes(u.id)).length;
      const pct  = aulasT.length ? Math.round(pres / aulasT.length * 100) : null;
      return `
        <div class="row">
          <div class="avatar av-teal">${initials(u.nome)}</div>
          <div class="row-main">
            <div class="row-title">${u.nome}</div>
            <div class="row-sub">Matrícula: ${u.login}</div>
          </div>
          ${pct !== null ? `
            <div class="pct-bar" style="max-width:60px">
              <div class="pct-fill" style="width:${pct}%;background:${pctCor(pct)}"></div>
            </div>
            ${pctBadge(pct)}` : ''}
        </div>`;
    }).join('');

    return `
      <div class="card" style="padding:4px 16px">
        ${rows || '<p class="text-sm text-muted" style="padding:8px 0">Nenhum aluno nesta turma.</p>'}
      </div>`;
  },

  async tabRelatorio() {
    const aulasT  = await DB.getAulasPorTurma(State.filtroTurma);
    const alunosT = await DB.getAlunosPorTurma(State.filtroTurma);
    const todosDoc = await Promise.all(alunosT.map(u => DB.getDocumentosAluno(u.id)));

    return `
      <div class="flex gap-8 wrap mb-12">
        <button class="btn btn-blue btn-sm" onclick="ViewCatequista.exportXlsx()">⬇️ Excel frequência</button>
        <button class="btn btn-sm" onclick="window.print()">🖨️ Imprimir/PDF</button>
      </div>
      ${ViewRelatorio.freqTable(aulasT, alunosT)}
      <p class="card-title mt-12">Documentos</p>
      ${ViewRelatorio.docsTable(alunosT, todosDoc)}`;
  },

  formAula(id, alunosT) {
    const isNovo = id === 'novo';
    // Para edição, o form carrega via cache — simplificado para inline
    const checkboxes = alunosT.map(u =>
      `<label class="check-list" style="display:flex;gap:8px;align-items:center;max-height:unset;border:none;padding:4px 0;margin:0">
        <input type="checkbox" id="chk_${u.id}"> ${u.nome}
      </label>`).join('');

    return `
      <div class="card mb-12">
        <div class="card-title">${isNovo ? 'Nova aula' : 'Editar aula'}</div>
        <div class="field"><label>Data</label>
          <input type="date" id="eData" value="${todayStr()}"></div>
        <div class="field"><label>Tema / assunto</label>
          <input id="eTema" placeholder="Ex: Os sacramentos"></div>
        <div class="field"><label>Presenças</label>
          <div class="check-list">${checkboxes || '<p class="text-sm text-muted">Nenhum aluno.</p>'}</div>
        </div>
        <div class="flex gap-8">
          <button class="btn btn-teal" onclick="ViewCatequista.salvarAula('${id}')">✅ Salvar</button>
          <button class="btn" onclick="State.editAula=null;App.render()">Cancelar</button>
          ${!isNovo ? `<button class="btn btn-red" onclick="ViewCatequista.deletarAula('${id}')">🗑️</button>` : ''}
        </div>
      </div>`;
  },

  async salvarAula(id) {
    const alunosT = await DB.getAlunosPorTurma(State.filtroTurma);
    const checkins = alunosT
      .filter(u => document.getElementById('chk_' + u.id)?.checked)
      .map(u => u.id);
    const dados = {
      turma:    State.filtroTurma,
      data:     document.getElementById('eData')?.value || todayStr(),
      tema:     document.getElementById('eTema')?.value?.trim() || '',
      checkins,
      criadoEm: new Date().toISOString(),
    };
    loading('Salvando...');
    await DB.salvarAula(dados, id === 'novo' ? null : id);
    State.editAula = null;
    showMsg('Aula salva!', true);
  },

  async deletarAula(id) {
    if (!confirm('Apagar esta aula?')) return;
    loading('Apagando...');
    await DB.deletarAula(id);
    State.editAula = null;
    showMsg('Aula removida.', true);
  },

  async togglePresenca(aulaId, userId, presente) {
    if (presente) await DB.removerCheckin(aulaId, userId);
    else          await DB.registrarCheckin(aulaId, userId);
    App.render();
  },

  async exportXlsx() {
    const aulasT  = await DB.getAulasPorTurma(State.filtroTurma);
    const alunosT = await DB.getAlunosPorTurma(State.filtroTurma);
    ViewRelatorio.exportXlsxTurma(State.filtroTurma, aulasT, alunosT);
  },
};
