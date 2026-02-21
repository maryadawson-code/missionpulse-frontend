/**
 * DocuSign Envelope Management
 *
 * Create and manage envelopes for e-signature routing:
 * - Gate decision approvals (Go/No-Go)
 * - NDA/Teaming Agreement signatures
 * - Certification attestations
 *
 * API: DocuSign eSignature REST API v2.1
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { refreshDocuSignToken } from './auth'

// ─── Types ───────────────────────────────────────────────────

export type EnvelopeStatus = 'created' | 'sent' | 'delivered' | 'completed' | 'declined' | 'voided'

export interface EnvelopeSummary {
  envelopeId: string
  status: EnvelopeStatus
  subject: string
  sentDateTime: string | null
  completedDateTime: string | null
  recipients: RecipientStatus[]
  opportunityId: string | null
  documentType: string
}

export interface RecipientStatus {
  name: string
  email: string
  status: 'created' | 'sent' | 'delivered' | 'completed' | 'signed' | 'declined'
  signedDateTime: string | null
  routingOrder: number
}

interface CreateEnvelopeParams {
  subject: string
  message?: string
  signers: Array<{
    name: string
    email: string
    routingOrder?: number
  }>
  documents: Array<{
    name: string
    content: string // base64 encoded
    fileExtension: string
  }>
  opportunityId?: string
  documentType: 'gate_approval' | 'nda' | 'teaming_agreement' | 'certification' | 'other'
}

// ─── Envelope Creation ───────────────────────────────────────

/**
 * Create and send a DocuSign envelope for e-signature.
 */
export async function createAndSendEnvelope(
  companyId: string,
  userId: string,
  params: CreateEnvelopeParams
): Promise<{ envelope: EnvelopeSummary | null; error?: string }> {
  const auth = await refreshDocuSignToken(companyId)
  if (!auth) return { envelope: null, error: 'Not connected to DocuSign' }

  try {
    const documents = params.documents.map((doc, i) => ({
      documentBase64: doc.content,
      name: doc.name,
      fileExtension: doc.fileExtension,
      documentId: String(i + 1),
    }))

    const signers = params.signers.map((signer, i) => ({
      email: signer.email,
      name: signer.name,
      recipientId: String(i + 1),
      routingOrder: String(signer.routingOrder ?? i + 1),
      tabs: {
        signHereTabs: [
          {
            anchorString: '/sig/',
            anchorUnits: 'pixels',
            anchorXOffset: '0',
            anchorYOffset: '0',
          },
        ],
        dateSignedTabs: [
          {
            anchorString: '/date/',
            anchorUnits: 'pixels',
            anchorXOffset: '0',
            anchorYOffset: '0',
          },
        ],
      },
    }))

    const envelopeBody = {
      emailSubject: params.subject,
      emailBlurb: params.message ?? 'Please review and sign this document from MissionPulse.',
      documents,
      recipients: { signers },
      status: 'sent', // Send immediately
    }

    const res = await fetch(
      `${auth.baseUri}/v2.1/accounts/${auth.accountId}/envelopes`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envelopeBody),
        signal: AbortSignal.timeout(30000),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      return { envelope: null, error: `DocuSign API error: ${err}` }
    }

    const data = (await res.json()) as {
      envelopeId: string
      status: string
      statusDateTime: string
    }

    const envelope: EnvelopeSummary = {
      envelopeId: data.envelopeId,
      status: data.status as EnvelopeStatus,
      subject: params.subject,
      sentDateTime: data.statusDateTime,
      completedDateTime: null,
      recipients: params.signers.map((s, i) => ({
        name: s.name,
        email: s.email,
        status: 'sent',
        signedDateTime: null,
        routingOrder: s.routingOrder ?? i + 1,
      })),
      opportunityId: params.opportunityId ?? null,
      documentType: params.documentType,
    }

    // Log to audit trail
    const supabase = await createClient()
    await supabase.from('audit_logs').insert({
      action: 'docusign_envelope_sent',
      table_name: 'integrations',
      record_id: data.envelopeId,
      user_id: userId,
      new_values: JSON.parse(JSON.stringify({
        envelope_id: data.envelopeId,
        document_type: params.documentType,
        opportunity_id: params.opportunityId,
        recipient_count: params.signers.length,
      })),
    })

    return { envelope }
  } catch (err) {
    return { envelope: null, error: err instanceof Error ? err.message : 'Failed' }
  }
}

// ─── Gate Approval Signature ─────────────────────────────────

/**
 * Send a gate decision document for signature (Go/No-Go approval).
 */
export async function sendGateApprovalForSignature(
  companyId: string,
  userId: string,
  params: {
    opportunityId: string
    opportunityTitle: string
    gateName: string
    decision: 'go' | 'no-go' | 'conditional-go'
    approverName: string
    approverEmail: string
    documentContent: string // base64 PDF
  }
): Promise<{ envelope: EnvelopeSummary | null; error?: string }> {
  return createAndSendEnvelope(companyId, userId, {
    subject: `[MissionPulse] Gate Approval: ${params.gateName} — ${params.opportunityTitle}`,
    message: `Please sign to confirm your ${params.decision.toUpperCase()} decision for the ${params.gateName} gate review on "${params.opportunityTitle}".`,
    signers: [{ name: params.approverName, email: params.approverEmail }],
    documents: [
      {
        name: `Gate_Approval_${params.gateName}_${params.opportunityTitle}.pdf`,
        content: params.documentContent,
        fileExtension: 'pdf',
      },
    ],
    opportunityId: params.opportunityId,
    documentType: 'gate_approval',
  })
}

// ─── NDA Routing ─────────────────────────────────────────────

/**
 * Route an NDA/Teaming Agreement for partner/subcontractor signature.
 */
export async function sendNDAForSignature(
  companyId: string,
  userId: string,
  params: {
    opportunityId?: string
    partnerName: string
    partnerEmail: string
    internalSignerName: string
    internalSignerEmail: string
    documentContent: string // base64 PDF
    documentType: 'nda' | 'teaming_agreement'
  }
): Promise<{ envelope: EnvelopeSummary | null; error?: string }> {
  const typeLabel = params.documentType === 'nda' ? 'NDA' : 'Teaming Agreement'

  return createAndSendEnvelope(companyId, userId, {
    subject: `[MissionPulse] ${typeLabel} — ${params.partnerName}`,
    message: `Please review and sign this ${typeLabel}. Both parties must sign for the agreement to be effective.`,
    signers: [
      { name: params.partnerName, email: params.partnerEmail, routingOrder: 1 },
      { name: params.internalSignerName, email: params.internalSignerEmail, routingOrder: 2 },
    ],
    documents: [
      {
        name: `${typeLabel.replace(/ /g, '_')}_${params.partnerName}.pdf`,
        content: params.documentContent,
        fileExtension: 'pdf',
      },
    ],
    opportunityId: params.opportunityId,
    documentType: params.documentType,
  })
}

// ─── Envelope Status ─────────────────────────────────────────

/**
 * Get the current status of an envelope.
 */
export async function getEnvelopeStatus(
  companyId: string,
  envelopeId: string
): Promise<{ envelope: EnvelopeSummary | null; error?: string }> {
  const auth = await refreshDocuSignToken(companyId)
  if (!auth) return { envelope: null, error: 'Not connected' }

  try {
    const res = await fetch(
      `${auth.baseUri}/v2.1/accounts/${auth.accountId}/envelopes/${envelopeId}?include=recipients`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) return { envelope: null, error: `API returned ${res.status}` }

    const data = (await res.json()) as {
      envelopeId: string
      status: string
      emailSubject: string
      sentDateTime: string
      completedDateTime: string | null
      recipients: {
        signers: Array<{
          name: string
          email: string
          status: string
          signedDateTime: string | null
          routingOrder: string
        }>
      }
    }

    return {
      envelope: {
        envelopeId: data.envelopeId,
        status: data.status as EnvelopeStatus,
        subject: data.emailSubject,
        sentDateTime: data.sentDateTime,
        completedDateTime: data.completedDateTime,
        recipients: (data.recipients?.signers ?? []).map((s) => ({
          name: s.name,
          email: s.email,
          status: s.status as RecipientStatus['status'],
          signedDateTime: s.signedDateTime,
          routingOrder: parseInt(s.routingOrder) || 1,
        })),
        opportunityId: null,
        documentType: 'other',
      },
    }
  } catch (err) {
    return { envelope: null, error: err instanceof Error ? err.message : 'Failed' }
  }
}

/**
 * List recent envelopes.
 */
export async function listEnvelopes(
  companyId: string,
  fromDate?: string,
  limit = 20
): Promise<{ envelopes: EnvelopeSummary[]; error?: string }> {
  const auth = await refreshDocuSignToken(companyId)
  if (!auth) return { envelopes: [], error: 'Not connected' }

  try {
    const searchDate = fromDate ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const params = new URLSearchParams({
      from_date: searchDate,
      count: limit.toString(),
      order_by: 'last_modified',
      order: 'desc',
    })

    const res = await fetch(
      `${auth.baseUri}/v2.1/accounts/${auth.accountId}/envelopes?${params}`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) return { envelopes: [], error: `API returned ${res.status}` }

    const data = (await res.json()) as {
      envelopes: Array<{
        envelopeId: string
        status: string
        emailSubject: string
        sentDateTime: string
        completedDateTime: string | null
      }>
    }

    const envelopes: EnvelopeSummary[] = (data.envelopes ?? []).map((e) => ({
      envelopeId: e.envelopeId,
      status: e.status as EnvelopeStatus,
      subject: e.emailSubject,
      sentDateTime: e.sentDateTime,
      completedDateTime: e.completedDateTime,
      recipients: [],
      opportunityId: null,
      documentType: 'other',
    }))

    return { envelopes }
  } catch (err) {
    return { envelopes: [], error: err instanceof Error ? err.message : 'Failed' }
  }
}

/**
 * Download a signed document from a completed envelope.
 */
export async function downloadSignedDocument(
  companyId: string,
  envelopeId: string,
  documentId = 'combined'
): Promise<{ data: ArrayBuffer | null; error?: string }> {
  const auth = await refreshDocuSignToken(companyId)
  if (!auth) return { data: null, error: 'Not connected' }

  try {
    const res = await fetch(
      `${auth.baseUri}/v2.1/accounts/${auth.accountId}/envelopes/${envelopeId}/documents/${documentId}`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
        signal: AbortSignal.timeout(30000),
      }
    )

    if (!res.ok) return { data: null, error: `Download failed: ${res.status}` }

    const data = await res.arrayBuffer()
    return { data }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed' }
  }
}

/**
 * Process a DocuSign webhook event (Connect).
 * Called when envelope status changes.
 */
export async function processDocuSignWebhook(
  payload: {
    event: string
    data: {
      envelopeId: string
      accountId: string
      envelopeSummary: {
        status: string
        emailSubject: string
        sentDateTime: string
        completedDateTime: string | null
      }
    }
  },
  userId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  // Log the signature event
  await supabase.from('audit_logs').insert({
    action: `docusign_${payload.event}`,
    table_name: 'integrations',
    record_id: payload.data.envelopeId,
    user_id: userId,
    new_values: JSON.parse(JSON.stringify({
      envelope_id: payload.data.envelopeId,
      status: payload.data.envelopeSummary.status,
      event: payload.event,
      completed_at: payload.data.envelopeSummary.completedDateTime,
    })),
  })

  return { success: true }
}
