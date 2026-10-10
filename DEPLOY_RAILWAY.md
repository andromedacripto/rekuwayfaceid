# Deploy Rekuway Face ID no Railway

## Pré-requisitos
- Conta em [railway.app](https://railway.app)
- Repositório no GitHub: `andromedacripto/rekuwayfaceid`

---

## Passo a Passo

### 1. Criar o projeto

1. Acesse [railway.app/new](https://railway.app/new)
2. Clique em **"Deploy from GitHub repo"**
3. Autorize o Railway a acessar seu GitHub
4. Selecione `andromedacripto/rekuwayfaceid`
5. Railway detecta o `Dockerfile` automaticamente

### 2. Adicionar PostgreSQL

1. No projeto, clique em **"+ New Service"**
2. Escolha **"Database → PostgreSQL"**
3. O Railway cria o banco e expõe a variável `DATABASE_URL` automaticamente

### 3. Configurar variáveis de ambiente

No painel do serviço (Next.js), vá em **Variables** e adicione:

```env
# Banco (Railway preenche automaticamente se usar o PostgreSQL deles)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Autenticação JWT
JWT_SECRET=gere-uma-string-aleatoria-de-64-chars-aqui
JWT_EXPIRES_IN=7d

# App
NEXT_PUBLIC_APP_URL=https://SEU-PROJETO.up.railway.app
NODE_ENV=production

# Opcional: Provedor facial externo (deixe em branco para usar face-api.js local)
FACIAL_PROVIDER=faceapi
```

> **Gerar JWT_SECRET seguro:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Configurar domínio

1. Em **Settings → Networking**, clique em **"Generate Domain"**
2. Copie o domínio gerado (ex: `rekuwayfaceid.up.railway.app`)
3. Atualize `NEXT_PUBLIC_APP_URL` com esse domínio

### 5. Deploy

O Railway faz deploy automático a cada push no branch `main`.

Para forçar um deploy manual: clique em **"Deploy"** no painel.

---

## Estrutura de custos Railway (estimativa)

| Serviço | Custo estimado |
|---------|---------------|
| Web (Next.js) | ~$5–8/mês |
| PostgreSQL | ~$5/mês |
| **Total** | **~$10–13/mês** |

O plan **Hobby** ($5 crédito/mês incluído) cobre os primeiros usos.

---

## Integração na Rekuway Pay

Após o deploy, use o SDK em `sdk/rekuway-faceid.ts`:

```typescript
import { RekuwayFaceID } from './sdk/rekuway-faceid'

const faceId = new RekuwayFaceID({
  apiKey: process.env.REKUWAY_FACEID_API_KEY!, // chave gerada no painel
  baseUrl: 'https://rekuwayfaceid.up.railway.app',
})

// Verificar antes de aprovar transferência
const result = await faceId.approvePaymentOperation({
  imageBase64: req.body.faceImage,
  userId: req.user.id,
  amountCents: req.body.amount,
  operationRef: `tx-${Date.now()}`,
  userIp: req.ip,
})

if (!result.approved) {
  return res.status(403).json({ error: 'Verificação facial não aprovada' })
}
```

### Variáveis na Rekuway Pay

```env
REKUWAY_FACEID_API_KEY=rfid_prod_SUA_CHAVE_AQUI
REKUWAY_FACEID_URL=https://rekuwayfaceid.up.railway.app
```

> A chave é gerada em: **Painel Rekuway Face ID → Chaves de API → Nova Chave**

---

## Checklist pré-go-live

- [ ] `JWT_SECRET` forte e único (não reutilizar de outros projetos)
- [ ] `DATABASE_URL` apontando para o Postgres Railway
- [ ] `NEXT_PUBLIC_APP_URL` com o domínio final
- [ ] Testar `/api/health` retorna `{ status: "ok" }`
- [ ] Criar primeira empresa no painel e gerar chave de API
- [ ] Testar endpoint `POST /api/v1/verify` com a chave gerada
- [ ] Configurar domínio próprio (opcional: `faceid.rekuway.com`)
