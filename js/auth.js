// ── Kairós Auth ───────────────────────────────────────────────

const Auth = {
  currentUser: null,

  async login(login, senha, role) {
    const usuario = await DB.getUsuarioPorLogin(login.trim());
    if (!usuario) throw new Error('Usuário não encontrado.');
    if (usuario.senha !== senha) throw new Error('Senha incorreta.');
    if (role && usuario.role !== role) throw new Error('Perfil incorreto para este acesso.');
    if (usuario.bloqueado) throw new Error('Conta bloqueada. Procure a secretaria.');
    Auth.currentUser = usuario;
    sessionStorage.setItem('kairos_uid', usuario.id);
    return usuario;
  },

  async restaurarSessao() {
    const uid = sessionStorage.getItem('kairos_uid');
    if (!uid) return null;
    const usuario = await DB.getUsuario(uid);
    if (usuario) Auth.currentUser = usuario;
    return usuario;
  },

  logout() {
    Auth.currentUser = null;
    sessionStorage.removeItem('kairos_uid');
  },

  get me() { return Auth.currentUser; },
  get role() { return Auth.currentUser?.role || null; },
  get turma() { return Auth.currentUser?.turma || null; },
};
