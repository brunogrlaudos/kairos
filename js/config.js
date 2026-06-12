// ╔══════════════════════════════════════════════════════════════╗
// ║  KAIRÓS — Configurações                                      ║
// ║  Preencha os valores após criar os projetos no Firebase      ║
// ║  e no Google Cloud Console. Ver README.md para instruções.   ║
// ╚══════════════════════════════════════════════════════════════╝

const KAIROS_CONFIG = {

  // ── Firebase ─────────────────────────────────────────────────
  // Obtido em: Firebase Console → Configurações do projeto → Web
  firebase: {
    apiKey:            "COLE_AQUI",
    authDomain:        "COLE_AQUI",
    projectId:         "COLE_AQUI",
    storageBucket:     "COLE_AQUI",
    messagingSenderId: "COLE_AQUI",
    appId:             "COLE_AQUI",
  },

  // ── Google Drive ─────────────────────────────────────────────
  // Obtido em: Google Cloud Console → APIs → Credenciais → OAuth 2.0
  google: {
    clientId:    "COLE_AQUI",          // termina em .apps.googleusercontent.com
    driveFolderId: "COLE_AQUI",        // ID da pasta raiz no Drive da paróquia
    apiKey:      "COLE_AQUI",          // Chave de API (não o Client Secret)
    scopes:      "https://www.googleapis.com/auth/drive.file",
  },

  // ── Paróquia ─────────────────────────────────────────────────
  paroquia: {
    nome:    "Paróquia Santo Agostinho",
    bairro:  "Barra da Tijuca · Rio de Janeiro",
  },

  // ── Turmas ───────────────────────────────────────────────────
  // dia: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  turmas: [
    { id: "dom",   nome: "Domingo manhã",  dia: 0, h_ini: 10, m_ini: 30, h_fim: 12, m_fim: 30 },
    { id: "ter",   nome: "Terça manhã",    dia: 2, h_ini:  8, m_ini: 30, h_fim: 10, m_fim: 30 },
    { id: "qua_m", nome: "Quarta manhã",   dia: 3, h_ini:  8, m_ini: 30, h_fim: 10, m_fim: 30 },
    { id: "qua_n", nome: "Quarta noite",   dia: 3, h_ini: 20, m_ini:  0, h_fim: 22, m_fim:  0 },
    { id: "sex",   nome: "Sexta tarde",    dia: 5, h_ini: 16, m_ini: 30, h_fim: 18, m_fim: 30 },
  ],

  // ── Documentos obrigatórios ───────────────────────────────────
  documentos: [
    { id: "batismo",    nome: "Certidão de batismo",      obrig: true },
    { id: "eucaristia", nome: "Certidão de 1ª eucaristia", obrig: true },
    { id: "casamento",  nome: "Certidão de casamento",     obrig: true },
    { id: "foto",       nome: "Foto 3×4",                  obrig: true },
  ],

};
