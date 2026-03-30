import type { BossModifier } from '../game/types'

interface BossBlindBannerProps {
  bossModifier: BossModifier
  onStart: () => void
}

export function BossBlindBanner({ bossModifier, onStart }: BossBlindBannerProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      padding: 40,
      background: '#11111b',
      border: '3px solid #f38ba8',
      borderRadius: 16,
      maxWidth: 460,
      width: '100%',
      textAlign: 'center',
      boxShadow: '0 0 40px #f38ba840',
    }}>
      <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#f38ba8', letterSpacing: 4, textTransform: 'uppercase' }}>
        ⚠ Boss Match
      </div>
      <div style={{ fontSize: 32, fontWeight: 'bold', color: '#f38ba8', fontFamily: 'monospace' }}>
        {bossModifier.name}
      </div>
      <div style={{
        padding: '14px 18px',
        background: '#1e1e2e',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 15,
        color: '#cdd6f4',
        lineHeight: 1.6,
        border: '1px solid #f38ba840',
      }}>
        {bossModifier.description}
      </div>
      <button
        onClick={onStart}
        style={{
          padding: '12px 32px',
          fontFamily: 'monospace',
          fontSize: 15,
          fontWeight: 'bold',
          border: '2px solid #f38ba8',
          borderRadius: 8,
          background: '#3d1a1a',
          color: '#f38ba8',
          cursor: 'pointer',
          letterSpacing: 1,
        }}
      >
        Face the Boss
      </button>
    </div>
  )
}

/** Small inline badge shown during a boss round */
export function BossPenaltyBadge({ bossModifier }: { bossModifier: BossModifier }) {
  return (
    <div style={{
      padding: '6px 10px',
      background: '#2a1a1a',
      border: '1px solid #f38ba8',
      borderRadius: 6,
      fontFamily: 'monospace',
      fontSize: 11,
      color: '#f38ba8',
      lineHeight: 1.4,
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 2 }}>{bossModifier.name}</div>
      <div style={{ color: '#cdd6f4', fontSize: 10 }}>{bossModifier.description}</div>
    </div>
  )
}
