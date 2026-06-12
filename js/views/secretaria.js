// ── View: Secretaria ──────────────────────────────────────────

const ViewSecretaria = {
  async render() {
    const me = Auth.me;
    if (!State.tab) State.tab = 'notifs';

    let body = '';
    if (State.tab === 'notifs')    body = await ViewSecretaria.tabNotifs(me);
    if (State.tab === 'alunos')    body = await ViewSecretaria.tabAlunos();
    if (State.tab === 'docs')      body = await ViewSecretaria.tabDocs();
    if (State.tab === 'relatorio') body = await ViewSecretaria.tabRelatorio();

    const naoLidas = (await DB.getNotificacoes(me.id)).filter(n => !n.lido).length;

    return `
      <div class="page">
        <div class="topbar">
          <div class="avatar av-amber" style="font-size:13px">${initials(me.nome)}</div>
          <span class="topbar-title">Secretaria</span>
          <button class="btn btn-sm btn-red" onclick="App.logout()">Sair</button>
        </div>
        <div class="content">
          <div class="tabs">
            <div class="tab ${State.tab === 'notifs'    ? 'on' : ''}" onclick="Router.setTab('notifs')">
              🔔 Avisos${naoLidas ? ` <span class="badge badge-err">${naoLidas}</span>` : ''}
            </div>
            <div class="tab ${State.tab === 'alunos'    ? 'on' : ''}" onclick="Router.setTab('alunos')">Alunos</div>
            <div class="tab ${State.tab === 'docs'      ? 'on' : ''}" onclick="Router.setTab('docs')">Documentos</div>
            <div class="tab ${State.tab === 'relatorio' ? 'on' : ''}" onclick="Router.setTab('relatorio')">Relatórios</div>
          </div>
          ${State.msg ? `<div class="alert ${State.msg.ok ? 'alert-ok' : 'alert-err'}">${State.msg.txt}</div>` : ''}
          ${body}
        </div>
      </div>`;
  },

  async tabNotifs(me) {
    const notifs = await DB.getNotificacoes(me.id);
    const naoLidas = notifs.filter(n => !n.lido);
    if (!naoLidas.length) {
      return `<div class="alert alert-ok">✅ Nenhum aviso pendente.</div>`;
    }
    const cards = naoLidas.map(n => `
      <div class="card" style="border-left:3px solid var(--red);padding:12px 14px;margin-bottom:10px">
        <div class="flex gap-10">
          <div class="notif-dot" style="margin-top:5px"></div>
          <div style="flex:1">
            <p class="font-500 text-sm">${n.titulo || 'Aviso'}</p>
            <p class="text-sm text-muted mt-8">${n.texto}</p>
            <div class="flex gap-8 mt-8 wrap">
              ${n.alunoId ? `<button class="btn btn-sm" onclick="ViewSecretaria.verDocs('${n.alunoId}')">📁 Ver documentos</button>` : ''}
              <button class="btn btn-sm" onclick="ViewSecretaria.marcarLida('${n.id}')">✓ Marcar lido</button>
            </div>
          </div>
        </div>
      </div>`).join('');

    return `
      <p class="text-sm text-muted mb-12">${naoLidas.length} aviso(s) não lido(s)</p>
      ${cards}
      <button class="btn btn-sm text-muted" onclick="ViewSecretaria.marcarTodasLidas()">
        Marcar todas como lidas
      </button>`;
  },

  async tabAlunos() {
    const alunos = await DB.getUsuariosPorRole('aluno');
    const filtrados = State.filtroRole === 'todos' ? alunos
      : alunos.filter(u => u.turma === State.filtroRole);

    const filterBtns = `
      <div class="flex gap-8 wrap mb-12">
        <button class="btn btn-sm ${State.filtroRole === 'todos' ? 'btn-teal' : ''}"
          onclick="State.filtroRole='todos';App.render()">Todos</button>
        ${KAIROS_CONFIG.turmas.map(t =>
          `<button class="btn btn-sm ${State.filtroRole === t.id ? 'btn-teal' : ''}"
            onclick="State.filtroRole='${t.id}';App.render()">${t.nome.split(' ')[0]}</button>`
        ).join('')}
        <button class="btn btn-sm btn-blue" style="margin-left:auto"
          onclick="State.editUser='novo';App.render()">+ Novo</button>
      </div>`;

    let formHtml = '';
    if (State.editUser !== null) formHtml = await ViewSecretaria.formUsuario();

    const rows = filtrados.map(u => {
      const turma = KAIROS_CONFIG.turmas.find(t => t.id === u.turma);
      return `
        <div class="row">
          <div class="avatar av-teal">${initials(u.nome)}</div>
          <div class="row-main">
            <div class="row-title">${u.nome}</div>
            <div class="row-sub">${u.login}${turma ? ' · ' + turma.nome : ''}</div>
          </div>
          <button class="btn btn-sm" onclick="State.editUser='${u.id}';App.render()">✏️</button>
        </div>`;
    }).join('');

    return `
      ${filterBtns}
      ${formHtml}
      <div class="card" style="padding:4px 16px">
        ${rows || '<p class="text-sm text-muted" style="padding:8px 0">Nenhum aluno encontrado.</p>'}
      </div>`;
  },

  async tabDocs() {
    if (State.verDocUid) return await ViewSecretaria.verDocsDetail(State.verDocUid);

    const alunos = await DB.getTodosAlunos();
    const rows = await Promise.all(alunos.map(async u => {
      const docs  = await DB.getDocumentosAluno(u.id);
      const env   = Object.keys(docs).length;
      const ver   = Object.values(docs).filter(d => d.verificado).length;
      const pend  = Object.values(docs).filter(d => !d.verificado && !d.rejeitado).length;
      return `
        <div class="row" style="cursor:pointer" onclick="ViewSecretaria.verDocs('${u.id}')">
          <div class="avatar av-teal">${initials(u.nome)}</div>
          <div class="row-main">
            <div class="row-title">${u.nome}</div>
            <div class="row-sub">${env}/${KAIROS_CONFIG.documentos.length} enviados · ${ver} verificados</div>
          </div>
          ${pend ? `<span class="badge badge-warn">${pend} pend.</span>` : ''}
          ${env === KAIROS_CONFIG.documentos.length && ver === env
            ? '<span class="badge badge-ok">✓</span>' : ''}
          <span style="color:var(--text3)">›</span>
        </div>`;
    }));

    return `<div class="card" style="padding:4px 16px">${rows.join('') || '<p class="text-sm text-muted" style="padding:8px 0">Nenhum aluno.</p>'}</div>`;
  },

  async verDocsDetail(uid) {
    const aluno = await DB.getUsuario(uid);
    const docs  = await DB.getDocumentosAluno(uid);

    const items = KAIROS_CONFIG.documentos.map(d => {
      const doc = docs[d.id];
      return `
        <div class="doc-item">
          <span class="doc-icon">${doc ? '📄' : '📋'}</span>
          <div class="doc-info">
            <div class="doc-name">${d.nome}</div>
            ${doc ? `
              <div class="doc-status">${doc.nome}</div>
              ${doc.driveUrl ? `<a href="${doc.driveUrl}" target="_blank" class="text-xs" style="color:var(--teal)">Abrir no Drive ↗</a>` : ''}
              <div style="margin-top:4px">
                ${doc.verificado
                  ? '<span class="badge badge-ok">✅ Verificado</span>'
                  : doc.rejeitado
                    ? `<span class="badge badge-err">❌ Rejeitado: ${doc.motivoRejeicao || ''}</span>`
                    : '<span class="badge badge-warn">⏳ Aguardando verificação</span>'}
              </div>
              ${!doc.verificado && !doc.rejeitado ? `
                <div class="flex gap-8 mt-8">
                  <button class="btn btn-teal btn-sm" onclick="ViewSecretaria.verificarDoc('${doc.id}','${uid}')">✅ Verificar</button>
                  <button class="btn btn-red btn-sm" onclick="ViewSecretaria.rejeitarDoc('${doc.id}','${uid}')">❌ Rejeitar</button>
                </div>` : ''}
            ` : '<div class="doc-status">Não enviado</div>'}
          </div>
        </div>`;
    }).join('');

    return `
      <div class="flex gap-8 mb-12">
        <button class="btn btn-sm" onclick="State.verDocUid=null;App.render()">← Voltar</button>
        <span class="font-500" style="align-self:center">${aluno?.nome}</span>
      </div>
      <div class="card" style="padding:4px 16px">${items}</div>`;
  },

  async tabRelatorio() {
    const aulasT  = await DB.getAulasPorTurma(State.filtroTurma);
    const alunosT = await DB.getAlunosPorTurma(State.filtroTurma);
    const todosDoc = await Promise.all(alunosT.map(u => DB.getDocumentosAluno(u.id)));

    return `
      <div class="flex gap-8 wrap mb-12">
        ${turmaSelect(null, 'App.render()')}
        <button class="btn btn-blue btn-sm" onclick="ViewSecretaria.exportXlsx()">⬇️ Excel turma</button>
        <button class="btn btn-blue btn-sm" onclick="ViewSecretaria.exportXlsxGeral()">⬇️ Completo</button>
      </div>
      ${ViewRelatorio.freqTable(aulasT, alunosT)}
      <p class="card-title mt-12">Documentos</p>
      ${ViewRelatorio.docsTable(alunosT, todosDoc)}`;
  },

  async formUsuario() {
    const isNovo = State.editUser === 'novo';
    const eu = isNovo ? { nome: '', login: '', senha: '1234', role: 'aluno', turma: '' }
      : await DB.getUsuario(State.editUser);
    return `
      <div class="card mb-12">
        <div class="card-title">${isNovo ? 'Novo usuário' : 'Editar usuário'}</div>
        <div class="field"><label>Nome completo</label>
          <input id="eu_nome" value="${eu?.nome || ''}" autocapitalize="words"></div>
        <div class="field"><label>Login / matrícula</label>
          <input id="eu_login" value="${eu?.login || ''}"></div>
        <div class="field"><label>Senha</label>
          <input id="eu_senha" value="${eu?.senha || '1234'}"></div>
        <div class="field"><label>Perfil</label>
          <select id="eu_role">
            <option value="aluno" ${eu?.role === 'aluno' ? 'selected' : ''}>Aluno</option>
            <option value="catequista" ${eu?.role === 'catequista' ? 'selected' : ''}>Catequista</option>
          </select></div>
        <div class="field"><label>Turma</label>
          <select id="eu_turma">
            <option value="">— Nenhuma —</option>
            ${KAIROS_CONFIG.turmas.map(t => `<option value="${t.id}" ${eu?.turma === t.id ? 'selected' : ''}>${t.nome}</option>`).join('')}
          </select></div>
        <div class="flex gap-8">
          <button class="btn btn-teal" onclick="ViewSecretaria.salvarUsuario('${eu?.id || ''}')">✅ Salvar</button>
          <button class="btn" onclick="State.editUser=null;App.render()">Cancelar</button>
          ${eu?.id ? `<button class="btn btn-red" onclick="ViewSecretaria.deletarUsuario('${eu.id}')">🗑️</button>` : ''}
        </div>
      </div>`;
  },

  verDocs(uid) { State.verDocUid = uid; State.tab = 'docs'; App.render(); },

  async marcarLida(id) {
    await DB.marcarNotifLida(id); App.render();
  },
  async marcarTodasLidas() {
    await DB.marcarTodasLidas(Auth.me.id); App.render();
  },
  async verificarDoc(docId, alunoId) {
    await DB.verificarDocumento(docId, Auth.me.id);
    showMsg('Documento verificado!', true);
  },
  async rejeitarDoc(docId, alunoId) {
    const motivo = prompt('Motivo da rejeição (ex: documento ilegível, certidão de lembrança):');
    if (motivo === null) return;
    await DB.rejeitarDocumento(docId, motivo, Auth.me.id);
    // Notifica aluno
    const aluno = await DB.getUsuario(alunoId);
    if (aluno) {
      await DB.criarNotificacao(alunoId, {
        tipo: 'doc_rejeitado', titulo: 'Documento rejeitado',
        texto: `Um documento foi rejeitado: ${motivo}. Por favor, envie novamente.`,
      });
    }
    showMsg('Documento rejeitado. Aluno será notificado.', true);
  },
  async salvarUsuario(id) {
    const dados = {
      nome:  document.getElementById('eu_nome')?.value?.trim(),
      login: document.getElementById('eu_login')?.value?.trim(),
      senha: document.getElementById('eu_senha')?.value?.trim() || '1234',
      role:  document.getElementById('eu_role')?.value || 'aluno',
      turma: document.getElementById('eu_turma')?.value || null,
    };
    if (!dados.nome || !dados.login) { showMsg('Nome e login obrigatórios.', false); return; }
    loading('Salvando...');
    await DB.salvarUsuario(dados, id || null);
    State.editUser = null;
    showMsg('Usuário salvo!', true);
  },
  async deletarUsuario(id) {
    if (!confirm('Remover usuário?')) return;
    loading('Removendo...');
    await DB.deletarUsuario(id);
    State.editUser = null;
    showMsg('Usuário removido.', true);
  },
  async exportXlsx() {
    const aulasT  = await DB.getAulasPorTurma(State.filtroTurma);
    const alunosT = await DB.getAlunosPorTurma(State.filtroTurma);
    const todosDoc = await Promise.all(alunosT.map(u => DB.getDocumentosAluno(u.id)));
    ViewRelatorio.exportXlsxCompleto(State.filtroTurma, aulasT, alunosT, todosDoc);
  },
  async exportXlsxGeral() {
    ViewRelatorio.exportXlsxGeral();
  },
};
