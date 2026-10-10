/**
 * Rekuway Face ID SDK
 * Integração oficial para sistemas de pagamento e aplicações empresariais.
 *
 * Uso na Rekuway Pay (ou qualquer backend):
 *   import { RekuwayFaceID } from './rekuway-faceid'
 *   const faceId = new RekuwayFaceID({ apiKey: process.env.FACEID_API_KEY, baseUrl: process.env.FACEID_URL })
 */

export type VerificationStatus =
  | 'VERIFIED'
  | 'REFUSED'
  | 'INCONCLUSIVE'
  | 'REQUIRES_REVIEW'
  | 'ERROR'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface VerificationRequest {
  /** Imagem base64 do rosto capturado (JPEG ou PNG) */
  imageBase64: string
  /** ID do usuário no sistema cliente (para auditoria) */
  userId?: string
  /** Metadados adicionais de contexto */
  metadata?: {
    /** Tipo de operação que disparou a verificação */
    operationType?: 'LOGIN' | 'TRANSFER' | 'WITHDRAWAL' | 'ACCOUNT_CHANGE' | 'KYC' | 'CUSTOM'
    /** Valor da transação em centavos (para calibrar risco) */
    transactionAmountCents?: number
    /** IP do usuário final */
    userIp?: string
    /** User-Agent do dispositivo */
    userAgent?: string
    /** Referência interna da operação */
    operationRef?: string
  }
  /** Ativar prova de vida (recomendado: true) */
  livenessCheck?: boolean
  /** Base64 da imagem de referência para comparação 1:1 (opcional) */
  referenceImageBase64?: string
}

export interface VerificationResult {
  verificationId: string
  status: VerificationStatus
  riskLevel: RiskLevel
  livenessScore?: number
  matchScore?: number
  processingTimeMs: number
  requiresAction: boolean
  actionRequired?: 'BLOCK' | 'REVIEW' | 'STEP_UP' | 'NOTIFY'
  message: string
  signals: string[]
  createdAt: string
}

export interface WebhookEvent {
  eventId: string
  type: 'VERIFICATION_COMPLETED' | 'FRAUD_ALERT' | 'ACCOUNT_RISK_CHANGE'
  verificationId?: string
  status?: VerificationStatus
  riskLevel?: RiskLevel
  metadata?: Record<string, unknown>
  timestamp: string
  /** Valide com validateWebhookSignature() antes de processar */
  signature: string
}

export class RekuwayFaceIDError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
  ) {
    super(message)
    this.name = 'RekuwayFaceIDError'
  }
}

export interface RekuwayFaceIDConfig {
  /** Chave de API gerada no painel Rekuway Face ID */
  apiKey: string
  /** URL base do servidor Face ID (ex: https://faceid.rekuway.com) */
  baseUrl: string
  /** Timeout em ms (padrão: 30000) */
  timeoutMs?: number
  /** Versão da API (padrão: v1) */
  apiVersion?: string
}

export class RekuwayFaceID {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly timeoutMs: number
  private readonly apiVersion: string

  constructor(config: RekuwayFaceIDConfig) {
    if (!config.apiKey) throw new RekuwayFaceIDError('apiKey é obrigatório', 'MISSING_API_KEY')
    if (!config.baseUrl) throw new RekuwayFaceIDError('baseUrl é obrigatório', 'MISSING_BASE_URL')

    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.timeoutMs = config.timeoutMs ?? 30_000
    this.apiVersion = config.apiVersion ?? 'v1'
  }

  /**
   * Solicita uma verificação facial.
   * Use no backend — nunca exponha a apiKey no frontend.
   */
  async verify(request: VerificationRequest): Promise<VerificationResult> {
    const res = await this.request<VerificationResult>('POST', '/verify', {
      imageBase64: request.imageBase64,
      userId: request.userId,
      metadata: request.metadata,
      livenessCheck: request.livenessCheck ?? true,
      referenceImageBase64: request.referenceImageBase64,
    })
    return res
  }

  /**
   * Consulta o resultado de uma verificação já realizada.
   */
  async getVerification(verificationId: string): Promise<VerificationResult> {
    return this.request<VerificationResult>('GET', `/verify/${verificationId}`)
  }

  /**
   * Valida a assinatura de um evento webhook.
   * Chame SEMPRE antes de processar um webhook.
   */
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // HMAC-SHA256 validation
    // No browser use SubtleCrypto; no Node use crypto
    try {
      const crypto = require('crypto') as typeof import('crypto')
      const expected = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex')
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    } catch {
      return false
    }
  }

  /**
   * Helper para o fluxo de pagamento:
   * Retorna true se a verificação aprova a operação,
   * false se deve bloquear, e lança se precisar de review manual.
   */
  async approvePaymentOperation(params: {
    imageBase64: string
    userId: string
    amountCents: number
    operationRef: string
    userIp?: string
  }): Promise<{ approved: boolean; verificationId: string; requiresReview: boolean }> {
    const result = await this.verify({
      imageBase64: params.imageBase64,
      userId: params.userId,
      livenessCheck: true,
      metadata: {
        operationType: 'TRANSFER',
        transactionAmountCents: params.amountCents,
        operationRef: params.operationRef,
        userIp: params.userIp,
      },
    })

    return {
      verificationId: result.verificationId,
      approved: result.status === 'VERIFIED' && result.riskLevel !== 'CRITICAL',
      requiresReview: result.status === 'REQUIRES_REVIEW' || result.actionRequired === 'REVIEW',
    }
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}/api/${this.apiVersion}${path}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-SDK-Version': '1.0.0',
          'X-SDK-Client': 'rekuway-faceid-ts',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      const data = (await res.json()) as Record<string, unknown>

      if (!res.ok) {
        throw new RekuwayFaceIDError(
          (data.message as string) ?? 'Erro na API Face ID',
          (data.code as string) ?? 'API_ERROR',
          res.status,
        )
      }

      return data as T
    } catch (err) {
      if (err instanceof RekuwayFaceIDError) throw err
      if ((err as Error).name === 'AbortError') {
        throw new RekuwayFaceIDError('Timeout na verificação facial', 'TIMEOUT', 408)
      }
      throw new RekuwayFaceIDError(
        `Falha na comunicação com o Face ID: ${(err as Error).message}`,
        'NETWORK_ERROR',
      )
    } finally {
      clearTimeout(timer)
    }
  }
}

// ─── Exemplo de uso na Rekuway Pay ───────────────────────────────────────────
//
// // 1. Inicializar (uma vez, no startup do servidor)
// const faceId = new RekuwayFaceID({
//   apiKey: process.env.REKUWAY_FACEID_API_KEY!,
//   baseUrl: process.env.REKUWAY_FACEID_URL!,
// })
//
// // 2. Verificar login
// app.post('/auth/login', async (req, res) => {
//   const { email, password, faceImageBase64 } = req.body
//   const user = await authenticateUser(email, password)      // lógica existente
//   if (!user) return res.status(401).json({ error: 'Credenciais inválidas' })
//
//   const face = await faceId.verify({
//     imageBase64: faceImageBase64,
//     userId: user.id,
//     livenessCheck: true,
//     metadata: { operationType: 'LOGIN', userIp: req.ip },
//   })
//
//   if (face.status === 'REFUSED') return res.status(403).json({ error: 'Verificação facial recusada' })
//   if (face.status === 'REQUIRES_REVIEW') {
//     await flagAccountForReview(user.id, face.verificationId)
//     // Decide: bloquear ou permitir com alerta
//   }
//
//   const token = generateJWT(user)
//   return res.json({ token, verificationId: face.verificationId })
// })
//
// // 3. Verificar transferência de alto valor
// app.post('/transactions/transfer', async (req, res) => {
//   const { userId, amount, faceImageBase64, recipient } = req.body
//
//   const { approved, verificationId, requiresReview } = await faceId.approvePaymentOperation({
//     imageBase64: faceImageBase64,
//     userId,
//     amountCents: amount,
//     operationRef: `transfer-${Date.now()}`,
//     userIp: req.ip,
//   })
//
//   if (!approved) return res.status(403).json({ error: 'Verificação facial não aprovada', verificationId })
//   if (requiresReview) await notifyFraudTeam(userId, verificationId)
//
//   const tx = await processTransfer(userId, recipient, amount)
//   return res.json({ transactionId: tx.id, verificationId })
// })
