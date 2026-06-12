# Kairós — Sistema de Catequese

Sistema web mobile-first para gestão de frequência, documentos e inscrições da catequese.

---

## 🚀 Configuração em 5 passos

### 1. Criar repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique em **New repository**
3. Nome: `kairos` | Visibilidade: **Public**
4. Clique em **Create repository**
5. Faça upload de todos os arquivos desta pasta

### 2. Ativar GitHub Pages

1. No repositório → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / pasta: `/ (root)`
4. Clique **Save**
5. Aguarde ~2 minutos. URL será: `https://SEU_USUARIO.github.io/kairos`

---

### 3. Criar projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. **Add project** → nome: `kairos-catequese`
3. Desative Google Analytics (opcional)
4. **Create project**

#### Ativar Firestore
1. No menu lateral → **Firestore Database** → **Create database**
2. Modo: **Start in production mode** → Next
3. Região: `southamerica-east1` (São Paulo) → **Done**

#### Regras de segurança do Firestore
Em **Firestore → Rules**, substitua pelo conteúdo abaixo e publique:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Usuários: leitura apenas pelo próprio ou admin/secretaria
    match /usuarios/{uid} {
      allow read:  if true;   // login público — filtrado no app
      allow write: if true;   // simplificado para MVP
    }

    // Aulas: leitura livre, escrita para catequistas/admin
    match /aulas/{id} {
      allow read:  if true;
      allow write: if true;
    }

    // Documentos: leitura/escrita controlada no app
    match /documentos/{id} {
      allow read:  if true;
      allow write: if true;
    }

    // Notificações
    match /notificacoes/{id} {
      allow read:  if true;
      allow write: if true;
    }
  }
}
```

> ⚠️ Para produção, refine as regras para usar Firebase Auth.

#### Obter credenciais Firebase
1. **Project Settings** (engrenagem) → **General**
2. Em "Your apps" → **Add app** → ícone Web `</>`
3. Nome: `kairos-web` → **Register app**
4. Copie o objeto `firebaseConfig`

---

### 4. Configurar Google Drive API

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Selecione o projeto criado pelo Firebase (mesmo projeto)
3. Menu → **APIs & Services** → **Enable APIs**
4. Busque **Google Drive API** → **Enable**

#### Criar credenciais OAuth
1. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
2. Application type: **Web application**
3. Nome: `Kairós Web`
4. **Authorized JavaScript origins**: adicione
   - `http://localhost` (para testes)
   - `https://SEU_USUARIO.github.io`
5. **Authorized redirect URIs**: mesmas URLs acima
6. Clique **Create** → copie o **Client ID**

#### Criar chave de API
1. **Credentials** → **Create Credentials** → **API key**
2. Copie a chave
3. Clique em **Restrict key** → em **API restrictions** selecione **Google Drive API**

#### Criar pasta no Google Drive
1. Acesse [drive.google.com](https://drive.google.com)
2. Crie uma pasta chamada `Kairós — Documentos`
3. Abra a pasta — o ID está na URL:
   `https://drive.google.com/drive/folders/`**ESTE_É_O_ID**
4. Clique com botão direito → **Compartilhar** → qualquer pessoa com o link pode visualizar

---

### 5. Preencher js/config.js

Abra o arquivo `js/config.js` e substitua os campos `"COLE_AQUI"`:

```javascript
firebase: {
  apiKey:            "AIzaSy...",
  authDomain:        "kairos-catequese.firebaseapp.com",
  projectId:         "kairos-catequese",
  storageBucket:     "kairos-catequese.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123...",
},

google: {
  clientId:    "123456789-abc.apps.googleusercontent.com",
  driveFolderId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs",
  apiKey:      "AIzaSy...",
},
```

Salve e faça commit no GitHub.

---

## 👤 Criar primeiro usuário admin

No Firebase Console → **Firestore** → coleção `usuarios` → **Add document**:

```json
{
  "nome":      "Pe. Roberto Silva",
  "login":     "admin",
  "senha":     "SuaSenhaSegura123",
  "role":      "admin",
  "turma":     null,
  "bloqueado": false,
  "criadoEm": "2025-01-01T00:00:00.000Z"
}
```

Depois disso, use o próprio sistema para criar os demais usuários.

---

## 📱 Perfis de acesso

| Perfil | O que acessa |
|--------|-------------|
| **Aluno** | Check-in, frequência própria, documentos |
| **Catequista** | Aulas, presença, alunos da turma, relatórios |
| **Secretaria** | Tudo exceto configurações do sistema |
| **Admin** | Acesso total, incluindo configurações e Drive |

---

## 📦 Estrutura de arquivos

```
kairos/
├── index.html
├── manifest.json
├── css/
│   └── app.css
└── js/
    ├── config.js        ← PREENCHA ESTE
    ├── firebase.js
    ├── auth.js
    ├── drive.js
    ├── db.js
    ├── router.js
    ├── app.js
    └── views/
        ├── home.js
        ├── inscricao.js
        ├── login.js
        ├── aluno.js
        ├── catequista.js
        ├── secretaria.js
        └── admin.js
```

---

## ❓ Suporte

Dúvidas sobre configuração: abra uma issue no repositório GitHub.
