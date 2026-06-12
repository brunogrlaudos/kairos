// ── View: Home ────────────────────────────────────────────────

const ViewHome = {
  render() {
    const cfg = KAIROS_CONFIG.paroquia;
    return `
      <div class="page">
        <div class="home-hero">
          <div class="home-cross">✝</div>
          <h1 class="home-title">Kairós</h1>
          <p class="home-parish">${cfg.nome}<br>${cfg.bairro}</p>
        </div>
        <div class="home-btns">
          <button class="btn btn-teal btn-full" onclick="Router.go('inscricao')">
            ✏️ Inscrever-se na catequese
          </button>
          <button class="btn btn-full" onclick="Router.go('login')">
            🔑 Já tenho cadastro — entrar
          </button>
        </div>
        <p class="text-xs text-muted" style="text-align:center;margin-top:32px;padding-bottom:24px">
          Kairós v1.0 · ${cfg.nome}
        </p>
      </div>`;
  },
};
