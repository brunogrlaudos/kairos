// Inicialização do Firebase
const firebaseApp = firebase.initializeApp(KAIROS_CONFIG.firebase);
const db          = firebase.firestore();
const auth        = firebase.auth();

// Coleções do Firestore
const COL = {
  usuarios:  'usuarios',
  aulas:     'aulas',
  notifs:    'notificacoes',
  docs:      'documentos',
  config:    'config',
};
