import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #00E5FA, #0099CC)',
          borderRadius: '8px',
          fontSize: '18px',
          fontWeight: 800,
          color: '#00050F',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        MP
      </div>
    ),
    { ...size }
  )
}
