# Publicar na Vercel

## Como o projeto é executado

O arquivo `server.ts` exporta a aplicação Express para a Vercel, que a executa como uma Function para as rotas `/api/*`. O processo `app.listen()` continua reservado ao desenvolvimento e à hospedagem tradicional. Não é necessário um adaptador adicional.

O frontend é compilado pelo Vite e o script `build:vercel` copia o resultado de `dist/` para `public/`, diretório servido pela CDN da Vercel. Não configure `dist` como Output Directory. O aplicativo navega por estado interno, então não precisa de rewrite de SPA que possa interceptar `/api/*`.

## Configuração do projeto Vercel

1. Importe a branch de trabalho do repositório e deixe o Root Directory na raiz do projeto.
2. Use o preset **Express** e Node.js **24.x** (22.x a partir de 22.18 também atende ao projeto). `package.json` limita a faixa a `<25`; `vercel.json` seleciona Express e define o build `pnpm run build:vercel`.
3. Mantenha PNPM como único gerenciador: `bun.lock` foi removido porque a Vercel prioriza esse lockfile quando há mais de um; `pnpm-lock.yaml` (formato 9) é a fonte versionada. `package.json` declara `pnpm@9.15.5`. Não defina um Output Directory estático.
4. Configure as variáveis de build e runtime abaixo nos ambientes Preview e Production. Variáveis `VITE_*` são incorporadas no bundle durante o build e são públicas; as demais listadas como servidor ficam somente no ambiente da Function.
5. Em cada Firebase Authentication do projeto, habilite Google e inclua o domínio Vercel de produção, o domínio personalizado e os domínios de Preview que serão usados em **Authentication → Settings → Authorized domains**. Cadastre Preview domains individualmente. Confirme também o e-mail de suporte do provedor Google.
6. Publique as regras Firestore separadamente com o Firebase CLI depois de confirmar o projeto e o ID de banco nomeado indicados em `firebase.json`. A configuração de deploy não publica as regras automaticamente.

## Variáveis de ambiente

### Frontend público, disponível durante o build

Para apontar o bundle a um projeto Firebase, configure `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` e `VITE_FIREBASE_APP_ID`. Sem essas variáveis, o cliente ainda usa a configuração Web versionada em `firebase-applet-config.json`; os valores Web do Firebase não são segredos. Os campos adicionais podem ser definidos conforme os recursos utilizados:

- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIRESTORE_DATABASE_ID`
- `VITE_SUPPORT_EMAIL`
- `VITE_ROUTING_API_URL` (endpoint HTTPS real compatível com OSRM; sem provedor, o app não desenha rota)

Não coloque `FIREBASE_SERVICE_ACCOUNT_JSON`, `ADMIN_EMAILS` ou `GEMINI_API_KEY` em variáveis `VITE_*`.

### Servidor, disponível em runtime

- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON de uma conta de serviço do projeto Firebase, armazenado como variável sensível da Vercel; habilita a operação de custom claim do administrador.
- `ADMIN_EMAILS`: e-mails Google verificados autorizados, separados por vírgula; cada administrador deve corresponder a uma identidade Firebase autenticada.
- `GEMINI_API_KEY`: opcional; habilita o endpoint `/api/chat`.

`PORT` e `NODE_ENV` não precisam ser cadastrados na Vercel; a plataforma controla o ambiente de Functions. O `PORT` em `.env.example` serve para executar o servidor localmente.
No runtime Vercel, o Express confia em um proxy e usa o `X-Forwarded-For` que a plataforma sobrescreve com o IP do cliente. `TRUST_PROXY_HOPS` só é usado fora da Vercel, quando o número de proxies for conhecido.

## Valores e serviços externos

- Obtenha a configuração Web Firebase em **Project settings → General → Your apps**. O ID do Firestore usado pelo projeto está em `firebase.json`; confirme que essa base nomeada existe no mesmo projeto.
- Habilite o provedor Google em **Authentication → Sign-in method** e configure os domínios autorizados como descrito acima.
- Crie/seleciona uma conta de serviço do Firebase no projeto e gere a chave JSON no Google Cloud IAM apenas se o servidor precisar dessa operação. Restrinja as permissões ao mínimo necessário para atualizar usuários do Firebase Authentication e guarde a chave somente na configuração sensível da Vercel.
- Defina os endereços e segredos do seu ambiente: `ADMIN_EMAILS`, `GEMINI_API_KEY` (se desejar o chat) e o e-mail de suporte. Não há gateway de pagamento implementado; nenhuma variável de pagamento deve ser cadastrada.
- Só preencha `VITE_ROUTING_API_URL` depois de contratar/configurar um provedor real compatível. Nenhum endpoint de rota nem coordenada é criado por este projeto.

## Verificações locais

```sh
pnpm install --frozen-lockfile
pnpm run build:vercel
```

`pnpm run build` continua sendo o build local normal do Vite. O build Vercel deixa a versão destinada à CDN em `public/`; não adicione arquivos gerados ao commit. As regras Firestore e os domínios de autenticação ainda precisam ser configurados no Firebase Console/CLI.
