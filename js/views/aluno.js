// ── View: Aluno ───────────────────────────────────────────────

const ViewAluno = {
  async render() {
    const me = Auth.me;
    if (!State.tab) State.tab = 'checkin';
    const turma = KAIROS_CONFIG.turmas.find(t => t.id === me.turma);

    // Carregar dados
    const [aulasT, docsAluno] = await Promise.all([
      DB.getAulasPorTurma(me.turma),
      DB.getDocumentosAluno(me.id),
    ]);

    const pres  = aulasT.filter(a => a.checkins?.includes(me.id)).length;
    const total = aulasT.length;
    const pct   = total ? Math.round(pres / total * 100) : 0;
    const cor   = pctCor(pct);
    const docPend = KAIROS_CONFIG.documentos.filter(d => !docsAluno[d.id]).length;

    let body = '';
    if (State.tab === 'checkin')   body = await ViewAluno.tabCheckin(me, turma, aulasT);
    if (State.tab === 'freq')      body = ViewAluno.tabFreq(me, aulasT, pres, total, pct, cor);
    if (State.tab === 'docs')      body = ViewAluno.tabDocs(me, docsAluno);

    const notifCount = (await DB.getNotificacoes(me.id)).filter(n => !n.lido).length;

    return `
      <div class="page">
        <div class="topbar">
          <div class="avatar ${avCls('aluno')}" style="font-size:13px">${initials(me.nome)}</div>
          <span class="topbar-title">${me.nome.split(' ')[0]}</span>
          ${notifCount ? `<span class="badge badge-err">${notifCount}</span>` : ''}
          <button class="btn btn-sm btn-red" onclick="App.logout()">Sair</button>
        </div>
        <div class="content">
          <div class="tabs">
            <div class="tab ${State.tab === 'checkin' ? 'on' : ''}" onclick="Router.setTab('checkin')">✅ Check-in</div>
            <div class="tab ${State.tab === 'freq'    ? 'on' : ''}" onclick="Router.setTab('freq')">📊 Frequência</div>
            <div class="tab ${State.tab === 'docs'    ? 'on' : ''}" onclick="Router.setTab('docs')">
              📁 Documentos${docPend ? ` <span class="badge badge-warn">${docPend}</span>` : ''}
            </div>
          </div>
          ${State.msg ? `<div class="alert ${State.msg.ok ? 'alert-ok' : 'alert-err'}">${State.msg.txt}</div>` : ''}
          ${body}
        </div>
      </div>`;
  },

  async tabCheckin(me, turma, aulasT) {
    const aulaHoje = await DB.getAulaDeHoje(me.turma);
    if (!aulaHoje) {
      return `<div class="alert alert-info">
        🕐 Nenhuma aula em andamento agora${turma ? ` — ${turma.nome}` : ''}.
      </div>`;
    }
    const jaFez = aulaHoje.checkins?.includes(me.id);
    return `
      <div class="aula-accent">
        <div class="aula-accent-title">${aulaHoje.tema || 'Aula de hoje'}</div>
        <div class="aula-accent-sub">${fmtDate(aulaHoje.data)} · ${turma?.nome || ''}</div>
      </div>
      ${jaFez
        ? `<div class="alert alert-ok">✅ Presença já confirmada nesta aula!</div>`
        : `<button class="btn btn-teal btn-full" onclick="ViewAluno.doCheckin('${aulaHoje.id}')">
             ✅ Confirmar minha presença
           </button>`
      }`;
  },

  tabFreq(me, aulasT, pres, total, pct, cor) {
    const rows = aulasT.map(a => {
      const ok = a.checkins?.includes(me.id);
      return `<div class="row">
        <div class="row-main">
          <div class="row-title">${a.tema || '(sem tema)'}</div>
          <div class="row-sub">${fmtDate(a.data)}</div>
        </div>
        <span class="badge ${ok ? 'badge-ok' : 'badge-err'}">${ok ? 'Presente' : 'Falta'}</span>
      </div>`;
    }).join('');

    return `
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Presenças</div>
          <div class="stat-value" style="color:${cor}">${pres}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Frequência</div>
          <div class="stat-value" style="color:${cor}">${pct}%</div>
        </div>
      </div>
      <div style="height:8px;background:var(--bg3);border-radius:4px;margin-bottom:12px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${cor};border-radius:4px;transition:width .4s"></div>
      </div>
      ${pct < 75 ? `<div class="alert alert-warn">
        ⚠️ Frequência abaixo de 75%. Procure a secretaria se precisar de apoio.
      </div>` : ''}
      <div class="card" style="padding:4px 16px">${rows || '<p class="text-sm text-muted" style="padding:8px 0">Nenhuma aula registrada.</p>'}</div>`;
  },

  tabDocs(me, docsAluno) {
    const driveOk = true; // Drive configurado pelo admin
    const items = KAIROS_CONFIG.documentos.map(d => {
      const doc = docsAluno[d.id];
      const status = doc
        ? doc.verificado
          ? `<span class="badge badge-ok">✅ Verificado</span>`
          : doc.rejeitado
            ? `<span class="badge badge-err">❌ Rejeitado: ${doc.motivoRejeicao || ''}</span>`
            : `<span class="badge badge-warn">⏳ Aguardando verificação</span>`
        : `<span class="badge badge-gray">Não enviado</span>`;

      return `
        <div class="doc-item">
          <span class="doc-icon">${doc ? '📄' : '📋'}</span>
          <div class="doc-info">
            <div class="doc-name">${d.nome}</div>
            <div class="doc-status">${doc ? doc.nome : '—'}</div>
            <div style="margin-top:3px">${status}</div>
          </div>
          <label style="cursor:pointer;margin:0;flex-shrink:0">
            <span class="badge badge-gray" style="cursor:pointer">📎 ${doc ? 'Trocar' : 'Enviar'}</span>
            <input type="file" accept="image/*,.pdf" style="display:none"
              onchange="ViewAluno.uploadDoc('${d.id}',this)">
          </label>
        </div>`;
    }).join('');

    return `<div class="card" style="padding:4px 16px">${items}</div>`;
  },

  async doCheckin(aulaId) {
    loading('Registrando presença...');
    try {
      await DB.registrarCheckin(aulaId, Auth.me.id);
      State.msg = { ok: true, txt: `✅ Presença confirmada! Bom catecismo, ${Auth.me.nome.split(' ')[0]}!` };
      App.render();
    } catch (e) {
      showMsg('Erro ao registrar presença: ' + e.message, false);
    }
  },

  async uploadDoc(tipo, input) {
    if (!input.files?.length) return;
    const file = input.files[0];
    const me = Auth.me;
    loading('Enviando documento...');
    try {
      let driveUrl = '';
      let nome = file.name;
      // Tenta upload no Drive se disponível
      try {
        const result = await Drive.uploadDocumento(file, me.nome, me.login, tipo);
        driveUrl = result.url;
        nome = result.nome;
      } catch (e) {
        console.warn('Drive indisponível, salvando referência local:', e.message);
      }

      await DB.salvarDocumento(me.id, tipo, {
        nome, driveUrl, verificado: false, rejeitado: false,
        enviadoEm: new Date().toISOString(),
      });

      // Notifica secretarias e admins
      const tipoNome = KAIROS_CONFIG.documentos.find(d => d.id === tipo)?.nome || tipo;
      const destinatarios = [
        ...await DB.getUsuariosPorRole('secretaria'),
        ...await DB.getUsuariosPorRole('admin'),
      ];
      for (const dest of destinatarios) {
        await DB.criarNotificacao(dest.id, {
          tipo:    'novo_documento',
          titulo:  'Documento enviado',
          texto:   `${me.nome} enviou ${tipoNome}.`,
          alunoId: me.id,
          docTipo: tipo,
        });
      }

      showMsg(`📄 ${tipoNome} enviado! A secretaria irá verificar em breve.`, true);
    } catch (e) {
      showMsg('Erro no envio: ' + e.message, false);
    }
  },
};
