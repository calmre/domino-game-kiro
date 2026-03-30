import { MATCH_LABELS, MAX_ANTES } from '../game/progression'

interface StatusBarProps {
  ante: number
  blindIndex: number
  poolCount: number
  targetScore: number
  roundScore: number
}

export function StatusBar({ ante, blindIndex, poolCount, targetScore, roundScore }: StatusBarProps) {
  const matchLabel = MATCH_LABELS[blindIndex] ?? `Match ${blindIndex + 1}`
  const isBoss = blindIndex === 2
  const progress = Math.min(1, roundScore / targetScore)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'monospace', color: '#cdd6f4' }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 14 }}>
        <span>
          Stack: <strong style={{ color: '#89b4fa' }}>{ante}</strong>
          <span style={{ color: '#45475a' }}>/{MAX_ANTES}</span>
        </span>
        <span>
          <strong style={{ color: isBoss ? '#f38ba8' : '#a6e3a1', fontSize: 15 }}>{matchLabel}</strong>
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#a6adc8' }}>
          Pool: <strong style={{ color: '#f9e2af' }}>{poolCount}</strong>
        </span>
      </div>

      {/* Target score progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: '#a6adc8', minWidth: 50 }}>Target:</span>
        <div style={{ flex: 1, height: 10, background: '#313244', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: progress >= 1 ? '#a6e3a1' : isBoss ? '#f38ba8' : '#89b4fa',
            borderRadius: 5,
            transition: 'width 0.3s',
          }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 'bold', color: progress >= 1 ? '#a6e3a1' : '#cba6f7', minWidth: 90, textAlign: 'right' }}>
          {roundScore} / {targetScore}
        </span>
      </div>
    </div>
  )
}
