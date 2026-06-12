// ── Kairós DB — Firestore operations ──────────────────────────

const DB = {

  // ── Usuários ───────────────────────────────────────────────

  async getUsuario(id) {
    const snap = await db.collection(COL.usuarios).doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },

  async getUsuarioPorLogin(login) {
    const snap = await db.collection(COL.usuarios)
      .where('login', '==', login).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  async getUsuariosPorRole(role) {
    const snap = await db.collection(COL.usuarios)
      .where('role', '==', role).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getAlunosPorTurma(turmaId) {
    const snap = await db.collection(COL.usuarios)
      .where('role', '==', 'aluno')
      .where('turma', '==', turmaId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async salvarUsuario(dados, id = null) {
    if (id) {
      await db.collection(COL.usuarios).doc(id).set(dados, { merge: true });
      return id;
    } else {
      const ref = await db.collection(COL.usuarios).add(dados);
      return ref.id;
    }
  },

  async deletarUsuario(id) {
    await db.collection(COL.usuarios).doc(id).delete();
  },

  // ── Aulas ─────────────────────────────────────────────────

  async getAulasPorTurma(turmaId) {
    const snap = await db.collection(COL.aulas)
      .where('turma', '==', turmaId)
      .orderBy('data', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getAulaDeHoje(turmaId) {
    const hoje = todayStr();
    const snap = await db.collection(COL.aulas)
      .where('turma', '==', turmaId)
      .where('data', '==', hoje).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  async salvarAula(dados, id = null) {
    if (id) {
      await db.collection(COL.aulas).doc(id).set(dados, { merge: true });
      return id;
    } else {
      const ref = await db.collection(COL.aulas).add(dados);
      return ref.id;
    }
  },

  async deletarAula(id) {
    await db.collection(COL.aulas).doc(id).delete();
  },

  async registrarCheckin(aulaId, userId) {
    await db.collection(COL.aulas).doc(aulaId).update({
      checkins: firebase.firestore.FieldValue.arrayUnion(userId),
    });
  },

  async removerCheckin(aulaId, userId) {
    await db.collection(COL.aulas).doc(aulaId).update({
      checkins: firebase.firestore.FieldValue.arrayRemove(userId),
    });
  },

  // ── Documentos ────────────────────────────────────────────

  async getDocumentosAluno(alunoId) {
    const snap = await db.collection(COL.docs)
      .where('alunoId', '==', alunoId).get();
    const resultado = {};
    snap.docs.forEach(d => {
      const dado = d.data();
      resultado[dado.tipo] = { id: d.id, ...dado };
    });
    return resultado;
  },

  async salvarDocumento(alunoId, tipo, dados) {
    // Verifica se já existe
    const snap = await db.collection(COL.docs)
      .where('alunoId', '==', alunoId)
      .where('tipo', '==', tipo).limit(1).get();
    const payload = { alunoId, tipo, ...dados, updatedAt: new Date().toISOString() };
    if (!snap.empty) {
      await db.collection(COL.docs).doc(snap.docs[0].id).set(payload, { merge: true });
      return snap.docs[0].id;
    } else {
      payload.createdAt = new Date().toISOString();
      const ref = await db.collection(COL.docs).add(payload);
      return ref.id;
    }
  },

  async verificarDocumento(docId, verificadoPor) {
    await db.collection(COL.docs).doc(docId).update({
      verificado: true,
      verificadoPor,
      verificadoEm: new Date().toISOString(),
    });
  },

  async rejeitarDocumento(docId, motivo, rejeitadoPor) {
    await db.collection(COL.docs).doc(docId).update({
      verificado: false,
      rejeitado: true,
      motivoRejeicao: motivo,
      rejeitadoPor,
      rejeitadoEm: new Date().toISOString(),
    });
  },

  // ── Notificações ──────────────────────────────────────────

  async getNotificacoes(userId) {
    const snap = await db.collection(COL.notifs)
      .where('destinatarioId', '==', userId)
      .orderBy('criadaEm', 'desc').limit(50).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async criarNotificacao(destinatarioId, dados) {
    await db.collection(COL.notifs).add({
      destinatarioId,
      lido: false,
      criadaEm: new Date().toISOString(),
      ...dados,
    });
  },

  async marcarNotifLida(notifId) {
    await db.collection(COL.notifs).doc(notifId).update({ lido: true });
  },

  async marcarTodasLidas(userId) {
    const snap = await db.collection(COL.notifs)
      .where('destinatarioId', '==', userId)
      .where('lido', '==', false).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref, { lido: true }));
    await batch.commit();
  },

  // ── Relatórios ────────────────────────────────────────────

  async getTodasAulas() {
    const snap = await db.collection(COL.aulas).orderBy('data', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getTodosAlunos() {
    const snap = await db.collection(COL.usuarios)
      .where('role', '==', 'aluno').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getTodosDocumentos() {
    const snap = await db.collection(COL.docs).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

};
