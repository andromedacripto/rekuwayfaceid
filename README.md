# Rekuway Face ID

**Verificação facial inteligente, prevenção contra fraudes e proteção contínua de identidades digitais.**

Plataforma SaaS independente da Rekuway Security para verificação de identidade, análise de risco e proteção pós-login. Destinada a empresas que precisam integrar verificação biométrica em seus sistemas via API.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Linguagem | TypeScript 6 |
| Banco de dados | PostgreSQL 18 (Docker) |
| ORM | Prisma 5 |
| Autenticação | JWT (`jose`) + bcryptjs |
| Validação | Zod |
| Estilo | Tailwind CSS 3 + CSS Variables |
| Qualidade | ESLint + Prettier + Husky + lint-staged |

---

## Arquitetura

```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Landing page
│   ├── login/                # Autenticação
│   ├── register/
│   ├── dashboard/            # Painel empresarial (protegido)
│   └── api/
│       ├── auth/             # register, login, logout, me
│       ├── dashboard/        # stats, verifications, api-keys, events
│       └── v1/               # API pública REST (Bearer token)
│           └── verify/       # POST /api/v1/verify
├── components/
│   ├── landing/
│   ├── auth/
│   └── dashboard/
└── lib/
    ├── db.ts                 # Prisma singleton
    ├── auth.ts               # JWT, bcrypt, API key helpers
    ├── risk-engine.ts        # Motor de análise de risco
    ├── facial-provider.ts    # Adapter para provedor biométrico
    ├── api-middleware.ts     # Auth Bearer + rate limit
    └── validations.ts        # Schemas Zod
```

---

## Configuração

### 1. Pré-requisitos

- [Bun](https://bun.sh) ≥ 1.1
- [Docker](https://www.docker.com) (para PostgreSQL)

### 2. Instalar dependências

```bash
bun install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com seus valores
```

### 4. Iniciar PostgreSQL

```bash
docker run -d --name rfid-postgres --restart unless-stopped \
  -e POSTGRES_PASSWORD=rekuway_dev \
  -e POSTGRES_DB=rekuway_faceid \
  -e POSTGRES_USER=rekuway \
  -v rfid_pgdata:/var/lib/postgresql \
  -p 5432:5432 --memory=512m \
  postgres:18-alpine

until docker exec rfid-postgres pg_isready -U rekuway -q; do sleep 1; done
```

### 5. Aplicar schema do banco

```bash
bunx prisma generate
bunx prisma db push
```

### 6. Iniciar servidor de desenvolvimento

```bash
bun run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `bun run dev` | Servidor de desenvolvimento (Turbopack) |
| `bun run build` | Build de produção |
| `bun run start` | Servidor de produção |
| `bun run typecheck` | Verificação de tipos TypeScript |
| `bun run lint` | ESLint |
| `bun run format` | Prettier (formata todos os arquivos) |
| `bun run format:check` | Prettier (apenas verifica) |
| `bun run db:generate` | Gera o cliente Prisma |
| `bun run db:push` | Aplica schema no banco (dev) |
| `bun run db:migrate` | Cria migration de produção |
| `bun run db:studio` | Abre o Prisma Studio |

---

## API Pública (v1)

Autenticação via `Authorization: Bearer rfid_live_<key>` ou `rfid_sandbox_<key>`.

### `POST /api/v1/verify`

Solicita uma verificação facial.

```json
{
  "imageBase64": "<base64 da imagem, sem data URI>",
  "referenceBase64": "<base64 da imagem de referência, opcional>",
  "livenessCheck": true,
  "externalRef": "user-id-do-seu-sistema"
}
```

**Resposta:**

```json
{
  "data": {
    "verificationId": "clxxx...",
    "status": "VERIFIED | REFUSED | INCONCLUSIVE | REQUIRES_REVIEW",
    "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL",
    "riskScore": 12,
    "riskDecision": "ALLOW | STEP_UP | RESTRICT | REVIEW",
    "livenessPass": true,
    "matchScore": 0.93,
    "completedAt": "2026-10-10T13:00:00.000Z"
  }
}
```

> **Atenção:** quando `FACIAL_PROVIDER=NOT_CONFIGURED`, o endpoint retorna status `INCONCLUSIVE` com `providerConfigured: false` e uma mensagem clara. Nenhum resultado é simulado.

### `GET /api/v1/verify/:id`

Consulta o resultado de uma verificação pelo ID.

---

## Provedores de verificação facial

A integração com o provedor real está em `src/lib/facial-provider.ts`. Para ativar:

1. Defina `FACIAL_PROVIDER=<nome-do-provedor>` no `.env`
2. Implemente o adaptador correspondente na função `runFacialVerification`
3. Adicione as credenciais do provedor no `.env`

Provedores suportados na roadmap: AWS Rekognition, iProov, Yoti, Incode.

---

## Segurança e LGPD

- Chaves de API armazenadas com hash bcrypt — nunca em texto claro
- JWTs httpOnly com expiração de 8h
- Isolamento total de dados por empresa (`companyId` em todas as queries)
- Nenhuma imagem biométrica é armazenada após o processamento
- Headers de segurança em todas as rotas (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Rate limiting por prefixo de chave de API
- Auditoria completa de eventos suspeitos

> Este produto não é certificado como conforme com a LGPD sem avaliação jurídica independente. Como operador, sua empresa é responsável pelo tratamento de dados biométricos dos usuários finais.

---

## Integração com Rekuway Pay

Para integrar o Face ID como segundo fator de autenticação na Rekuway Pay:

1. Crie uma chave de API em `/dashboard/api-keys`
2. No projeto da Rekuway Pay, adicione:
   - `REKUWAY_FACEID_URL=<url-do-faceid>`
   - `REKUWAY_FACEID_API_KEY=rfid_live_<sua-chave>`
3. Após validar as credenciais do usuário, chame `POST /api/v1/verify` com a imagem capturada
4. Só conclua o login se `status === "VERIFIED"`

---

## Licença

Propriedade da Rekuway Security. Todos os direitos reservados.
