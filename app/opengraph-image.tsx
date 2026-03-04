import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'MissionPulse — AI-Powered Federal Proposal Management'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #00050F 0%, #001a2e 50%, #00050F 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #00E5FA, #0099CC)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 800,
              color: '#00050F',
            }}
          >
            MP
          </div>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-1px',
            }}
          >
            MissionPulse
          </span>
        </div>
        <div
          style={{
            fontSize: '28px',
            color: '#00E5FA',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          AI-Powered Federal Proposal Management
        </div>
        <div
          style={{
            fontSize: '18px',
            color: '#8899AA',
            maxWidth: '700px',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Win more federal contracts with RFP shredding, compliance tracking, pricing analysis, and Shipley-based capture management.
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            fontSize: '14px',
            color: '#556677',
          }}
        >
          missionpulse.ai — Mission Meets Tech
        </div>
      </div>
    ),
    { ...size }
  )
}
