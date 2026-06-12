// ── View: Admin ───────────────────────────────────────────────

const ViewAdmin = {
  async render() {
    const me = Auth.me;
    if (!State.tab) State.tab = 'dashboard';

    let body = '';
    if (State.tab === 'dashboard') body = await ViewAdmin.tabDashboard();
    if (State.tab === 'usuarios')  body = await ViewAdmin.tabUsuarios();
    if (State.tab === 'aulas')     body = await ViewAdmin.tabAulas();
    if (State.tab === 'docs')      body = await ViewAdmin.tabDocs();
    if (State.tab === 'relatorio') body = await ViewAdmin.tabRelatorio();
    if (State.tab === 'config')    body = await ViewAdmin.tabConfig();

    const naoLidas = (await DB.getNotificacoes(me.id)).filter(n => !n.lido).length;

    return `
      <div class="page">
        <div class="topbar">
          <div class="avatar av-purple" style="font-size:13px">${initials(me.nome)}</div>
          <span class="topbar-title">Admin</span>
          ${naoLidas ? `<span class="badge badge-err">${naoLidas}</span>` : ''}
          <button class="btn btn-sm btn-red" onclick="App.logout()">Sair</button>
        </div>
        <div class="content">
          <div class="tabs">
            <div class="tab ${State.tab==='dashboard' ?'on':''}" onclick="Router.setTab('dashboard')">Painel</div>
            <div class="tab ${State.tab==='usuarios'  ?'on':''}" onclick="Router.setTab('usuarios')">Usuários</div>
            <div class="tab ${State.tab==='aulas'     ?'on':''}" onclick="Router.setTab('aulas')">Aulas</div>
            <div class="tab ${State.tab==='docs'      ?'on':''}" onclick="Router.setTab('docs')">Documentos</div>
            <div class="tab ${State.tab==='relatorio' ?'on':''}" onclick="Router.setTab('relatorio')">Relatórios</div>
            <div class="tab ${State.tab==='config'    ?'on':''}" onclick="Router.setTab('config')">Config</div>
          </div>
          ${State.msg ? `<div class="alert ${State.msg.ok ? 'alert-ok' : 'alert-err'}">${State.msg.txt}</div>` : ''}
          ${body}
        </div>
      </div>`;
  },

  async tabDashboard() {
    const [alunos, catequistas, todasAulas, todosDocs] = await Promise.all([
      DB.getUsuariosPorRole('aluno'),
      DB.getUsuariosPorRole('catequista'),
      DB.getTodasAulas(),
      DB.getTodosDocumentos(),
    ]);
    const docPend = todosDocs.filter(d => !d.verificado && !d.rejeitado).length;
    const totalCheckins = todasAulas.reduce((s, a) => s + (a.checkins?.length || 0), 0);

    const turmasRows = KAIROS_CONFIG.turmas.map(t => {
      const alunosT = alunos.filter(u => u.turma === t.id);
      const aulasT  = todasAulas.filter(a => a.turma === t.id);
      const pct = alunosT.length && aulasT.length
        ? Math.round(aulasT.reduce((s,a) => s+(a.checkins?.length||0),0) / alunosT.length / aulasT.length * 100)
        : null;
      return `
        <div class="row">
          <div class="row-main">
            <div class="row-title">${t.nome}</div>
            <div class="row-sub">${alunosT.length} alunos · ${aulasT.length} aulas</div>
          </div>
          ${pct !== null
            ? `<div class="pct-bar" style="max-width:70px">
                <div class="pct-fill" style="width:${pct}%;background:${pctCor(pct)}"></div>
               </div>${pctBadge(pct)}`
            : '<span class="badge badge-gray">—</span>'}
        </div>`;
    }).join('');

    return `
      <div class="stats">
        <div class="stat"><div class="stat-label">Alunos</div><div class="stat-value">${alunos.length}</div></div>
        <div class="stat"><div class="stat-label">Catequistas</div><div class="stat-value">${catequistas.length}</div></div>
        <div class="stat"><div class="stat-label">Aulas</div><div class="stat-value">${todasAulas.length}</div></div>
        <div class="stat"><div class="stat-label" style="color:var(--red)">Docs pendentes</div>
          <div class="stat-value" style="color:var(--red)">${docPend}</div></div>
      </div>
      <div class="card" style="padding:4px 16px">
        <div class="card-title" style="padding:12px 0 8px">Frequência por turma</div>
        ${turmasRows}
      </div>`;
  },

  async tabUsuarios() {
    const allRoles = ['todos','aluno','catequista','secretaria','admin'];
    let formHtml = '';
    if (State.editUser !== null) formHtml = await ViewAdmin.formUsuario();

    const todos = await Promise.all([
      DB.getUsuariosPorRole('aluno'),
      DB.getUsuariosPorRole('catequista'),
      DB.getUsuariosPorRole('secretaria'),
      DB.getUsuariosPorRole('admin'),
    ]);
    const lista = todos.flat().filter(u =>
      State.filtroRole === 'todos' || u.role === State.filtroRole
    );

    const filterBtns = allRoles.map(r => `
      <button class="btn btn-sm ${State.filtroRole===r?'btn-teal':''}"
        onclick="State.filtroRole='${r}';App.render()">
        ${r==='todos'?'Todos':roleName(r)}
      </button>`).join('');

    const rows = lista.map(u => `
      <div class="row">
        <div class="avatar ${avCls(u.role)}">${initials(u.nome)}</div>
        <div class="row-main">
          <div class="row-title">${u.nome}</div>
          <div class="row-sub">${roleBadge(u.role)} · ${u.login}</div>
        </div>
        <button class="btn btn-sm" onclick="State.editUser='${u.id}';App.render()">✏️</button>
      </div>`).join('');

    return `
      <div class="flex gap-8 wrap mb-12">${filterBtns}
        <button class="btn btn-sm btn-blue" style="margin-left:auto"
          onclick="State.editUser='novo';App.render()">+ Novo</button>
      </div>
      ${formHtml}
      <div class="card" style="padding:4px 16px">
        ${rows || '<p class="text-sm text-muted" style="padding:8px 0">Nenhum usuário.</p>'}
      </div>`;
  },

  async tabAulas() {
    const aulasT  = await DB.getAulasPorTurma(State.filtroTurma);
    const alunosT = await DB.getAlunosPorTurma(State.filtroTurma);
    let formHtml = '';
    if (State.editAula !== null) formHtml = ViewAdmin.formAula(State.editAula, alunosT);

    const rows = aulasT.map(a => {
      const pct = alunosT.length ? Math.round((a.checkins?.length||0)/alunosT.length*100) : 0;
      return `
        <div class="row">
          <div class="row-main">
            <div class="row-title">${a.tema||'(sem tema)'}</div>
            <div class="row-sub">${fmtDate(a.data)} · ${a.checkins?.length||0}/${alunosT.length} ${pctBadge(pct)}</div>
          </div>
          <button class="btn btn-sm" onclick="State.editAula='${a.id}';App.render()">✏️</button>
        </div>`;
    }).join('');

    return `
      ${turmaSelect(null,'App.render()')}
      <button class="btn btn-teal mb-12" onclick="State.editAula='novo';App.render()">+ Nova aula</button>
      ${formHtml}
      <div class="card" style="padding:4px 16px">
        ${rows||'<p class="text-sm text-muted" style="padding:8px 0">Nenhuma aula.</p>'}
      </div>`;
  },

  async tabDocs() {
    // Reutiliza lógica da secretaria
    State.tab = 'docs';
    return await ViewSecretaria.tabDocs();
  },

  async tabRelatorio() {
    const aulasT   = await DB.getAulasPorTurma(State.filtroTurma);
    const alunosT  = await DB.getAlunosPorTurma(State.filtroTurma);
    const todosDoc = await Promise.all(alunosT.map(u => DB.getDocumentosAluno(u.id)));
    return `
      <div class="flex gap-8 wrap mb-12">
        ${turmaSelect(null,'App.render()')}
        <button class="btn btn-blue btn-sm" onclick="ViewAdmin.exportXlsx()">⬇️ Excel turma</button>
        <button class="btn btn-blue btn-sm" onclick="ViewAdmin.exportXlsxGeral()">⬇️ Completo</button>
        <button class="btn btn-sm" onclick="window.print()">🖨️ PDF</button>
      </div>
      ${ViewRelatorio.freqTable(aulasT, alunosT)}
      <p class="card-title mt-12">Documentos</p>
      ${ViewRelatorio.docsTable(alunosT, todosDoc)}`;
  },

  async tabConfig() {
    return `
      <div class="card">
        <div class="card-title">Google Drive</div>
        <div class="alert alert-info">
          Configure o Google Drive no arquivo <code>js/config.js</code>.<br>
          Ver README.md para instruções completas.
        </div>
        <div class="field"><label>ID da pasta raiz no Drive</label>
          <input id="cfg_folder" value="${KAIROS_CONFIG.google.driveFolderId||''}"
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs"></div>
        <button class="btn btn-teal" onclick="ViewAdmin.testarDrive()">🔗 Testar conexão Drive</button>
      </div>
      <div class="card">
        <div class="card-title">Turmas</div>
        ${KAIROS_CONFIG.turmas.map(t => {
          const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
          return `<div class="row">
            <div class="row-main">
              <div class="row-title">${t.nome}</div>
              <div class="row-sub">${dias[t.dia]} · ${pad(t.h_ini)}:${pad(t.m_ini)}–${pad(t.h_fim)}:${pad(t.m_fim)}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div class="card">
        <div class="card-title">Resumo de usuários</div>
        ${['admin','secretaria','catequista','aluno'].map(r =>
          `<div class="row"><span>${roleName(r)}</span>
           <span class="badge badge-info" id="count_${r}">...</span></div>`
        ).join('')}
      </div>`;
  },

  formAula(id, alunosT) {
    const isNovo = id === 'novo';
    const checks = alunosT.map(u =>
      `<label style="display:flex;gap:8px;align-items:center;padding:4px 0;font-size:13px;cursor:pointer">
        <input type="checkbox" id="chk_${u.id}"> ${u.nome}
      </label>`).join('');
    return `
      <div class="card mb-12">
        <div class="card-title">${isNovo?'Nova aula':'Editar aula'}</div>
        <div class="field"><label>Data</label><input type="date" id="eData" value="${todayStr()}"></div>
        <div class="field"><label>Tema</label><input id="eTema" placeholder="Ex: Os sacramentos"></div>
        <div class="field"><label>Presenças</label>
          <div class="check-list">${checks||'<p class="text-sm text-muted">Sem alunos.</p>'}</div>
        </div>
        <div class="flex gap-8">
          <button class="btn btn-teal" onclick="ViewAdmin.salvarAula('${id}')">✅ Salvar</button>
          <button class="btn" onclick="State.editAula=null;App.render()">Cancelar</button>
          ${!isNovo?`<button class="btn btn-red" onclick="ViewAdmin.deletarAula('${id}')">🗑️</button>`:''}
        </div>
      </div>`;
  },

  async formUsuario() {
    const isNovo = State.editUser === 'novo';
    const eu = isNovo ? {nome:'',login:'',senha:'1234',role:'aluno',turma:''}
      : await DB.getUsuario(State.editUser);
    return `
      <div class="card mb-12">
        <div class="card-title">${isNovo?'Novo usuário':'Editar usuário'}</div>
        <div class="field"><label>Nome</label><input id="eu_nome" value="${eu?.nome||''}"></div>
        <div class="field"><label>Login / matrícula</label><input id="eu_login" value="${eu?.login||''}"></div>
        <div class="field"><label>Senha</label><input id="eu_senha" value="${eu?.senha||'1234'}"></div>
        <div class="field"><label>Perfil</label>
          <select id="eu_role">
            ${['aluno','catequista','secretaria','admin'].map(r =>
              `<option value="${r}" ${eu?.role===r?'selected':''}>${roleName(r)}</option>`
            ).join('')}
          </select></div>
        <div class="field"><label>Turma</label>
          <select id="eu_turma">
            <option value="">— Nenhuma —</option>
            ${KAIROS_CONFIG.turmas.map(t =>
              `<option value="${t.id}" ${eu?.turma===t.id?'selected':''}>${t.nome}</option>`
            ).join('')}
          </select></div>
        <div class="flex gap-8">
          <button class="btn btn-teal" onclick="ViewAdmin.salvarUsuario('${eu?.id||''}')">✅ Salvar</button>
          <button class="btn" onclick="State.editUser=null;App.render()">Cancelar</button>
          ${eu?.id?`<button class="btn btn-red" onclick="ViewAdmin.deletarUsuario('${eu.id}')">🗑️</button>`:''}
        </div>
      </div>`;
  },

  async salvarAula(id) {
    const alunosT = await DB.getAlunosPorTurma(State.filtroTurma);
    const checkins = alunosT.filter(u => document.getElementById('chk_'+u.id)?.checked).map(u=>u.id);
    loading('Salvando...');
    await DB.salvarAula({
      turma: State.filtroTurma,
      data:  document.getElementById('eData')?.value || todayStr(),
      tema:  document.getElementById('eTema')?.value?.trim() || '',
      checkins, criadoEm: new Date().toISOString(),
    }, id==='novo'?null:id);
    State.editAula = null; showMsg('Aula salva!', true);
  },
  async deletarAula(id) {
    if (!confirm('Apagar aula?')) return;
    loading('Apagando...'); await DB.deletarAula(id);
    State.editAula = null; showMsg('Aula removida.', true);
  },
  async salvarUsuario(id) {
    const dados = {
      nome:  document.getElementById('eu_nome')?.value?.trim(),
      login: document.getElementById('eu_login')?.value?.trim(),
      senha: document.getElementById('eu_senha')?.value?.trim()||'1234',
      role:  document.getElementById('eu_role')?.value||'aluno',
      turma: document.getElementById('eu_turma')?.value||null,
    };
    if (!dados.nome||!dados.login){showMsg('Nome e login obrigatórios.',false);return;}
    loading('Salvando...'); await DB.salvarUsuario(dados, id||null);
    State.editUser = null; showMsg('Usuário salvo!', true);
  },
  async deletarUsuario(id) {
    if (!confirm('Remover usuário?')) return;
    loading('Removendo...'); await DB.deletarUsuario(id);
    State.editUser = null; showMsg('Usuário removido.', true);
  },
  async testarDrive() {
    loading('Testando Drive...');
    try {
      await Drive.init(); await Drive.autenticar();
      showMsg('✅ Google Drive conectado com sucesso!', true);
    } catch(e) { showMsg('Erro Drive: '+e.message, false); }
  },
  async exportXlsx() {
    const aulasT  = await DB.getAulasPorTurma(State.filtroTurma);
    const alunosT = await DB.getAlunosPorTurma(State.filtroTurma);
    const todosDoc = await Promise.all(alunosT.map(u => DB.getDocumentosAluno(u.id)));
    ViewRelatorio.exportXlsxCompleto(State.filtroTurma, aulasT, alunosT, todosDoc);
  },
  async exportXlsxGeral() { ViewRelatorio.exportXlsxGeral(); },
};
