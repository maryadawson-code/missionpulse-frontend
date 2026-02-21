/**
 * Gate Decision deck template — maps raw gate review data
 * to the GateDecisionData structure for PPTX generation.
 */

import type { GateDecisionData, GateMetric, GateRisk } from '../pptx-engine'

interface GateSourceData {
  opportunityTitle: string
  agency: string
  gateName: string
  gateNumber: number
  decision: 'go' | 'no_go' | 'conditional'
  pwin: number
  complianceScore?: number
  teamReadiness?: number
  costConfidence?: number
  scheduleHealth?: number
  risks: Array<{
    description: string
    severity: 'high' | 'medium' | 'low'
    mitigation: string
  }>
  nextSteps: string[]
  decisionDate?: string
}

/**
 * Build GateDecisionData from raw gate review data.
 */
export function buildGateDecisionData(
  source: GateSourceData
): GateDecisionData {
  const metrics: GateMetric[] = [
    {
      label: 'pWin',
      value: `${source.pwin}%`,
      status: source.pwin >= 60 ? 'green' : source.pwin >= 40 ? 'yellow' : 'red',
    },
  ]

  if (source.complianceScore !== undefined) {
    metrics.push({
      label: 'Compliance',
      value: `${source.complianceScore}%`,
      status:
        source.complianceScore >= 80
          ? 'green'
          : source.complianceScore >= 50
            ? 'yellow'
            : 'red',
    })
  }

  if (source.teamReadiness !== undefined) {
    metrics.push({
      label: 'Team Ready',
      value: `${source.teamReadiness}%`,
      status:
        source.teamReadiness >= 80
          ? 'green'
          : source.teamReadiness >= 50
            ? 'yellow'
            : 'red',
    })
  }

  if (source.costConfidence !== undefined) {
    metrics.push({
      label: 'Cost Confidence',
      value: `${source.costConfidence}%`,
      status:
        source.costConfidence >= 70
          ? 'green'
          : source.costConfidence >= 40
            ? 'yellow'
            : 'red',
    })
  }

  if (source.scheduleHealth !== undefined) {
    metrics.push({
      label: 'Schedule',
      value: `${source.scheduleHealth}%`,
      status:
        source.scheduleHealth >= 80
          ? 'green'
          : source.scheduleHealth >= 50
            ? 'yellow'
            : 'red',
    })
  }

  const risks: GateRisk[] = source.risks.map((r) => ({
    risk: r.description,
    severity: r.severity,
    mitigation: r.mitigation,
  }))

  return {
    opportunityTitle: source.opportunityTitle,
    agency: source.agency,
    gateName: source.gateName,
    gateNumber: source.gateNumber,
    recommendation: source.decision,
    pwin: source.pwin,
    metrics,
    risks,
    nextSteps: source.nextSteps,
    decisionDate: source.decisionDate,
  }
}
