// ── Kairós Drive — Google Drive API ───────────────────────────

const Drive = {
  ready: false,
  tokenClient: null,

  async init() {
    return new Promise(resolve => {
      if (typeof gapi === 'undefined') { resolve(false); return; }
      gapi.load('client', async () => {
        await gapi.client.init({
          apiKey: KAIROS_CONFIG.google.apiKey,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        Drive.ready = true;
        resolve(true);
      });
    });
  },

  async autenticar() {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined') { reject(new Error('Google API não carregada.')); return; }
      const client = google.accounts.oauth2.initTokenClient({
        client_id: KAIROS_CONFIG.google.clientId,
        scope: KAIROS_CONFIG.google.scopes,
        callback: (resp) => {
          if (resp.error) reject(new Error(resp.error));
          else resolve(resp.access_token);
        },
      });
      client.requestAccessToken();
    });
  },

  // Garante que a subpasta do aluno existe e retorna o ID dela
  async garantirPastaAluno(nomeAluno, matricula) {
    const nomePasta = `${matricula} - ${nomeAluno}`;
    const pastaRaizId = KAIROS_CONFIG.google.driveFolderId;

    // Busca pasta existente
    const res = await gapi.client.drive.files.list({
      q: `name='${nomePasta}' and '${pastaRaizId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
    });

    if (res.result.files.length > 0) {
      return res.result.files[0].id;
    }

    // Cria a pasta
    const criado = await gapi.client.drive.files.create({
      resource: {
        name: nomePasta,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [pastaRaizId],
      },
      fields: 'id',
    });
    return criado.result.id;
  },

  // Faz upload do arquivo para a pasta do aluno
  async uploadDocumento(file, nomeAluno, matricula, tipoDoc) {
    if (!Drive.ready) await Drive.init();
    await Drive.autenticar();

    const pastaId = await Drive.garantirPastaAluno(nomeAluno, matricula);
    const ext = file.name.split('.').pop();
    const nomeArquivo = `${tipoDoc}_${matricula}.${ext}`;

    const metadata = {
      name: nomeArquivo,
      parents: [pastaId],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const token = gapi.auth.getToken()?.access_token;
    const resp = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      }
    );

    if (!resp.ok) throw new Error('Erro no upload para o Google Drive.');
    const data = await resp.json();
    return { fileId: data.id, url: data.webViewLink, nome: nomeArquivo };
  },
};
