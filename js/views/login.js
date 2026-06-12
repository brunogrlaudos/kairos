// ── View: Login ───────────────────────────────────────────────

const ViewLogin = {
  render() {
    if (!State.selRole) return ViewLogin.renderRoles();
    return ViewLogin.renderForm();
  },

  renderRoles() {
    const roles = [
      { id: 'aluno',      icon: '👤', label: 'Aluno',         hint: 'Matrícula + senha' },
      { id: 'catequista', icon: '📖', label: 'Catequista',    hint: 'Login + senha'     },
      { id: 'secretaria', icon: '📋', label: 'Secretaria',    hint: 'Login + senha'     },
      { id: 'admin',      icon: '🛡️', label: 'Administrador', hint: 'Login + senha'     },
    ];
    const btns = roles.map(r => `
      <button class="role-btn" onclick="ViewLogin.setRole('${r.id}')">
        <div class="avatar ${avCls(r.id)}" style="font-size:18px">${r.icon}</div>
        <div>
          <div class="role-btn-label">${r.label}</div>
          <div class="role-btn-hint">${r.hint}</div>
        </div>
        <span class="role-chevron">›</span>
      </button>`).join('');

    return `
      <div class="page">
        <div class="topbar">
          <button class="btn btn-sm" onclick="Router.go('home')">← Voltar</button>
          <span class="topbar-title">Entrar</span>
        </div>
        <div class="content">
          <p class="text-sm text-muted mb-12">Quem está acessando?</p>
          ${btns}
        </div>
      </div>`;
  },

  renderForm() {
    const labels = {
      aluno: 'Matrícula', catequista: 'Login', secretaria: 'Login', admin: 'Login',
    };
    const msgHtml = State.msg
      ? `<div class="alert alert-err">${State.msg.txt}</div>` : '';

    return `
      <div class="page">
        <div class="topbar">
          <button class="btn btn-sm" onclick="State.selRole='';State.msg=null;App.render()">← Voltar</button>
          <span class="topbar-title">${roleName(State.selRole)}</span>
        </div>
        <div class="content">
          ${msgHtml}
          <div class="field">
            <label>${labels[State.selRole]}</label>
            <input id="li_login" type="${State.selRole === 'aluno' ? 'tel' : 'text'}"
              inputmode="${State.selRole === 'aluno' ? 'numeric' : 'text'}"
              placeholder="${State.selRole === 'aluno' ? 'Ex: 11001' : 'Seu login'}"
              autocomplete="username" autocapitalize="off">
          </div>
          <div class="field">
            <label>Senha</label>
            <input id="li_senha" type="password" placeholder="••••••" autocomplete="current-password">
          </div>
          <button class="btn btn-teal btn-full" onclick="ViewLogin.doLogin()">
            🔑 Entrar
          </button>
        </div>
      </div>`;
  },

  setRole(r) {
    State.selRole = r;
    State.msg = null;
    App.render();
  },

  async doLogin() {
    const login = document.getElementById('li_login')?.value?.trim();
    const senha = document.getElementById('li_senha')?.value?.trim();
    if (!login || !senha) { showMsg('Preencha login e senha.', false); return; }
    loading('Verificando...');
    try {
      await Auth.login(login, senha, State.selRole);
      State.filtroTurma = Auth.me.turma || KAIROS_CONFIG.turmas[0].id;
      await Router.go('app', { tab: ViewApp.defaultTab(Auth.role) });
    } catch (e) {
      State.msg = { txt: e.message, ok: false };
      App.render();
    }
  },
};
