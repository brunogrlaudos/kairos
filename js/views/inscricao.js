// ── View: Inscrição ───────────────────────────────────────────

const ViewInscricao = {
  render() {
    const step = State.inscStep;
    const progW = Math.round(step / 4 * 100);
    const backAction = step > 1
      ? `State.inscStep--;App.render()`
      : `Router.go('home')`;

    let body = '';
    if (step === 1) body = ViewInscricao.step1();
    if (step === 2) body = ViewInscricao.step2();
    if (step === 3) body = ViewInscricao.step3();
    if (step === 4) body = ViewInscricao.step4();

    return `
      <div class="page">
        <div class="topbar">
          <button class="btn btn-sm" onclick="${backAction}">← Voltar</button>
          <span class="topbar-title">Inscrição</span>
          <span class="text-xs text-muted">${step}/4</span>
        </div>
        <div class="content">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${progW}%"></div>
          </div>
          ${State.msg ? `<div class="alert ${State.msg.ok ? 'alert-ok' : 'alert-err'}">${State.msg.txt}</div>` : ''}
          ${body}
        </div>
      </div>`;
  },

  step1() {
    const d = State.inscData;
    return `
      <div class="card">
        <div class="card-title">Dados pessoais</div>
        <div class="field">
          <label>Nome completo *</label>
          <input id="i_nome" value="${d.nome || ''}" placeholder="Nome do catecúmeno" autocapitalize="words">
        </div>
        <div class="field">
          <label>Data de nascimento *</label>
          <input id="i_nasc" type="date" value="${d.nascimento || ''}">
        </div>
        <div class="field">
          <label>Nome do responsável (se menor de idade)</label>
          <input id="i_resp" value="${d.responsavel || ''}" placeholder="Nome completo" autocapitalize="words">
        </div>
        <div class="field">
          <label>Telefone para contato</label>
          <input id="i_tel" type="tel" value="${d.telefone || ''}" placeholder="(21) 99999-9999" inputmode="tel">
        </div>
      </div>
      <button class="btn btn-teal btn-full" onclick="ViewInscricao.avancar1()">
        Continuar →
      </button>`;
  },

  step2() {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const chips = KAIROS_CONFIG.turmas.map(t => `
      <div class="chip ${State.inscData.turma === t.id ? 'on' : ''}"
           onclick="State.inscData.turma='${t.id}';App.render()">
        <span style="font-size:20px">📅</span>
        <div style="flex:1">
          <div class="font-500">${t.nome}</div>
          <div class="text-xs text-muted">
            ${dias[t.dia]} · ${pad(t.h_ini)}:${pad(t.m_ini)}–${pad(t.h_fim)}:${pad(t.m_fim)}
          </div>
        </div>
        ${State.inscData.turma === t.id ? '<span style="color:var(--teal)">✓</span>' : ''}
      </div>`).join('');

    return `
      <div class="card">
        <div class="card-title">Escolha a turma</div>
        ${chips}
      </div>
      <button class="btn btn-teal btn-full"
        onclick="ViewInscricao.avancar2()"
        ${!State.inscData.turma ? 'disabled' : ''}>
        Continuar →
      </button>`;
  },

  step3() {
    if (!State.inscData.docs) State.inscData.docs = {};
    const items = KAIROS_CONFIG.documentos.map(d => {
      const env = State.inscData.docs[d.id];
      return `
        <div class="doc-item">
          <span class="doc-icon">${env ? '✅' : '📄'}</span>
          <div class="doc-info">
            <div class="doc-name">${d.nome}${d.obrig ? ' *' : ''}</div>
            <div class="doc-status">${env ? env : 'Não enviado'}</div>
          </div>
          <label style="cursor:pointer;margin:0">
            <span class="badge badge-gray" style="cursor:pointer">
              📎 ${env ? 'Trocar' : 'Enviar'}
            </span>
            <input type="file" accept="image/*,.pdf" style="display:none"
              onchange="ViewInscricao.simUpload('${d.id}',this)">
          </label>
        </div>`;
    }).join('');

    return `
      <div class="card">
        <div class="card-title">Documentos</div>
        <div class="alert alert-info" style="margin-bottom:12px">
          📌 Você pode enviar agora ou depois de fazer seu primeiro login.
          Os documentos serão verificados pela secretaria.
        </div>
        ${items}
      </div>
      <button class="btn btn-teal btn-full" onclick="State.inscStep=4;App.render()">
        Continuar →
      </button>`;
  },

  step4() {
    const d = State.inscData;
    const turma = KAIROS_CONFIG.turmas.find(t => t.id === d.turma);
    const docsEnv = Object.keys(d.docs || {}).length;
    const total = KAIROS_CONFIG.documentos.length;

    // Se inscrição já foi finalizada com sucesso
    if (d.matricula) {
      return `
        <div class="card" style="text-align:center;padding:24px">
          <div style="font-size:48px;margin-bottom:12px">🎉</div>
          <h2 style="font-size:18px;font-weight:500;margin-bottom:8px">Inscrição realizada!</h2>
          <p class="text-sm text-muted" style="margin-bottom:16px">
            Guarde seus dados de acesso:
          </p>
          <div class="card" style="background:var(--teal-light);border-color:var(--teal);text-align:left">
            <div class="row"><span class="text-muted text-sm">Matrícula</span>
              <strong>${d.matricula}</strong></div>
            <div class="row"><span class="text-muted text-sm">Senha inicial</span>
              <strong>1234</strong></div>
            <div class="row" style="border:none"><span class="text-muted text-sm">Turma</span>
              <span>${turma?.nome}</span></div>
          </div>
          <p class="text-xs text-muted" style="margin-bottom:16px">
            Altere sua senha no primeiro acesso.
          </p>
          <button class="btn btn-teal btn-full" onclick="Router.go('login')">
            🔑 Fazer login agora
          </button>
        </div>`;
    }

    return `
      <div class="card">
        <div class="card-title">Confirmação</div>
        <div class="row"><span class="text-sm text-muted">Nome</span>
          <span class="font-500 text-sm">${d.nome}</span></div>
        <div class="row"><span class="text-sm text-muted">Nascimento</span>
          <span class="text-sm">${d.nascimento ? fmtDateFull(d.nascimento) : '—'}</span></div>
        ${d.responsavel ? `<div class="row"><span class="text-sm text-muted">Responsável</span>
          <span class="text-sm">${d.responsavel}</span></div>` : ''}
        <div class="row"><span class="text-sm text-muted">Turma</span>
          <span class="text-sm">${turma?.nome || '—'}</span></div>
        <div class="row" style="border:none"><span class="text-sm text-muted">Documentos</span>
          <span class="badge ${docsEnv === total ? 'badge-ok' : 'badge-warn'}">${docsEnv}/${total} enviados</span></div>
      </div>
      ${docsEnv < total ? `<div class="alert alert-warn">
        ⚠️ ${total - docsEnv} documento(s) pendente(s). Você poderá enviá-los após o login.
      </div>` : ''}
      <button class="btn btn-teal btn-full" onclick="ViewInscricao.finalizar()">
        ✅ Finalizar inscrição
      </button>`;
  },

  avancar1() {
    const nome = document.getElementById('i_nome')?.value?.trim();
    const nasc = document.getElementById('i_nasc')?.value;
    if (!nome) { showMsg('Informe o nome completo.', false); return; }
    Object.assign(State.inscData, {
      nome,
      nascimento:  document.getElementById('i_nasc')?.value || '',
      responsavel: document.getElementById('i_resp')?.value?.trim() || '',
      telefone:    document.getElementById('i_tel')?.value?.trim() || '',
    });
    State.inscStep = 2;
    State.msg = null;
    App.render();
  },

  avancar2() {
    if (!State.inscData.turma) return;
    State.inscStep = 3;
    App.render();
  },

  simUpload(docId, input) {
    if (!input.files?.length) return;
    if (!State.inscData.docs) State.inscData.docs = {};
    State.inscData.docs[docId] = input.files[0].name;
    App.render();
  },

  async finalizar() {
    const d = State.inscData;
    if (!d.nome || !d.turma) { showMsg('Dados incompletos.', false); return; }
    loading('Registrando inscrição...');
    try {
      const matricula = novaMat();
      const novoUsuario = {
        nome:        d.nome,
        login:       matricula,
        senha:       '1234',
        role:        'aluno',
        turma:       d.turma,
        nascimento:  d.nascimento || '',
        responsavel: d.responsavel || '',
        telefone:    d.telefone || '',
        criadoEm:    new Date().toISOString(),
        bloqueado:   false,
      };
      const novoId = await DB.salvarUsuario(novoUsuario);

      // Salva documentos enviados na inscrição (sem Drive ainda, só o nome)
      if (d.docs) {
        for (const [tipo, nome] of Object.entries(d.docs)) {
          await DB.salvarDocumento(novoId, tipo, {
            nome,
            driveUrl: '',
            verificado: false,
            rejeitado: false,
          });
        }
      }

      // Notifica secretarias
      const secretarias = await DB.getUsuariosPorRole('secretaria');
      for (const sec of secretarias) {
        await DB.criarNotificacao(sec.id, {
          tipo:    'nova_inscricao',
          titulo:  'Nova inscrição',
          texto:   `${d.nome} se inscreveu na turma de ${KAIROS_CONFIG.turmas.find(t => t.id === d.turma)?.nome}.`,
          alunoId: novoId,
        });
      }

      State.inscData.matricula = matricula;
      State.inscStep = 4;
      State.msg = null;
      App.render();
    } catch (e) {
      showMsg('Erro ao registrar: ' + e.message, false);
    }
  },
};
