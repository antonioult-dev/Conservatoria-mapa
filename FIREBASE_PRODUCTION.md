# Firebase em produção

## Comandos de produção

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

O build gera `dist/`; `start` serve o frontend e a API Express na mesma origem. Use Node.js 22.18 ou superior.

## Antes de publicar

0. Use Node.js 22.18 ou 24.x; o projeto limita `engines.node` a `<25` para evitar mudanças automáticas para uma nova versão principal. O build usa o carregador nativo do Vite e o servidor executa `server.ts` com o suporte nativo do Node a TypeScript.
1. No Firebase Console, selecione o projeto indicado pelo `projectId` do arquivo `firebase-applet-config.json` (ou configure `VITE_FIREBASE_PROJECT_ID` para outro projeto).
2. Em **Authentication → Sign-in method**, habilite **Google** e escolha o e-mail de suporte do projeto.
3. Em **Authentication → Settings → Authorized domains**, cadastre o domínio final do app e os domínios de preview necessários. Não use domínios de preview como domínio de produção.
4. Em **Firestore Database**, confirme/crie a base nomeada `ai-studio-conservatriaturi-e532106b-c35e-41a9-9c4f-3fc305c9f65b` no projeto e na região desejada. O app e este deploy de regras usam essa base nomeada, não a `(default)`.
5. Para a função de administrador, configure no servidor `FIREBASE_SERVICE_ACCOUNT_JSON` com uma conta de serviço do mesmo projeto e `ADMIN_EMAILS` com os e-mails Google verificados autorizados. O servidor e as regras também exigem que o token tenha sido obtido pelo provedor Google. Conceda à conta o papel IAM **Firebase Authentication Admin** (`roles/firebaseauth.admin`) ou um papel personalizado mínimo que inclua `firebaseauth.users.update`. Não coloque a chave privada no frontend, repositório ou variáveis `VITE_*`.
6. Configure `VITE_FIREBASE_*` do mesmo projeto no ambiente de build quando o destino diferir do arquivo de configuração versionado. São identificadores públicos do SDK Web; `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` e `VITE_FIREBASE_APP_ID` são os campos mínimos. `VITE_FIREBASE_MESSAGING_SENDER_ID` e `VITE_FIREBASE_STORAGE_BUCKET` são opcionais para os recursos atuais. Se mudar `VITE_FIRESTORE_DATABASE_ID`, atualize também o alvo em `firebase.json` e no script de deploy. Nunca use a chave privada da conta de serviço em variáveis `VITE_*`.
7. Publique o app e o Express no mesmo host/origem, ou encaminhe `/api/*` para o Express. Hospedar apenas `dist/` como site estático não disponibiliza `/api/auth/admin-claim` nem `/api/chat`.

## Validar e publicar regras

Instale/atualize o Firebase CLI, autentique a conta com acesso ao projeto e confira o alvo antes de publicar:

```sh
firebase login
firebase projects:list
firebase deploy --only firestore:ai-studio-conservatriaturi-e532106b-c35e-41a9-9c4f-3fc305c9f65b --project <FIREBASE_PROJECT_ID>
```

O `firebase.json` liga `firestore.rules` à base nomeada acima. Este alvo seleciona essa base; o arquivo de índices está vazio porque as consultas atuais usam filtros de campo único. O deploy substitui as regras ativas dessa base, então confira o projeto e revise o diff antes de executá-lo. A publicação não foi executada por este trabalho. A CLI local não estava instalada; as regras também não foram avaliadas pelo emulador.

Antes de produção, teste os casos de leitura e escrita no Firestore Emulator. O Console de regras publica diretamente na base `(default)`; para a base nomeada deste app, use a Firebase CLI.

## Variáveis do servidor

Consulte `.env.example`. Em produção, injete os segredos pelo gerenciador de segredos do host. `FIREBASE_SERVICE_ACCOUNT_JSON` e `ADMIN_EMAILS` habilitam a rota que define a custom claim `admin`; sem eles, autenticação normal continua disponível e a tentativa de entrar no painel admin informa que a autorização ainda não foi configurada. Revogar um administrador requer remover a claim no Admin SDK e revogar os refresh tokens no Firebase Authentication. A claim é definida no servidor após verificar o ID token, o e-mail verificado e a allowlist; as regras Firestore autorizam a claim `admin` do token.

`GEMINI_API_KEY` habilita somente o endpoint de chat. `VITE_ROUTING_API_URL` é opcional e só pode apontar para a raiz HTTPS de um serviço compatível com OSRM; sem ele, o app não calcula nem desenha trajetos. `VITE_SUPPORT_EMAIL` habilita o destino do recurso de contato por Gmail. Pagamentos continuam indisponíveis até integrar um gateway real e validar webhooks no servidor. A assinatura permanece em R$ 49,90/mês.

## Login Google e contato por Gmail

O login usa o provedor Google do Firebase sem pedir acesso ao Gmail. O recurso de envio de contato pede a permissão `gmail.send` apenas quando o usuário escolhe conectar o Gmail; esse recurso exige habilitar a Gmail API no Google Cloud e configurar/publicar o consentimento OAuth com o escopo solicitado. É independente do login principal.
