import type { Chain } from '../game/types'

interface ActionBarProps {
  chain: Chain
  discardCount: number
  maxDiscards: number
  handsPlayed: number
  maxHands: number
  onPlayHand: () => void
  discardMode: boolean
  onToggleDiscard: () => void
  selectedDiscardCount: number
  onConfirmDiscard: () => void
}

export function ActionBar({
  chain,
  discardCount,
  maxDiscards,
  handsPlayed,
  maxHands,
  onPlayHand,
  discardMode,
  onToggleDiscard,
  selectedDiscardCount,
  onConfirmDiscard,
}: ActionBarProps) {
  const canPlay = chain.tiles.length >= 1
  const remainingDiscards = maxDiscards - discardCount
  const canDiscard = remainingDiscards > 0
  const handsRemaining = maxHands - handsPlayed

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        onClick={onPlayHand}
        disabled={!canPlay || discardMode}
        style={{
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 'bold',
          border: '2px solid #89b4fa',
          borderRadius: 6,
          background: canPlay && !discardMode ? '#1e3a5f' : '#181825',
          color: canPlay && !discardMode ? '#89b4fa' : '#45475a',
          cursor: canPlay && !discardMode ? 'pointer' : 'not-allowed',
        }}
      >
        Play Hand
      </button>

      <button
        onClick={onToggleDiscard}
        disabled={!canDiscard}
        style={{
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 'bold',
          border: `2px solid ${discardMode ? '#f38ba8' : '#fab387'}`,
          borderRadius: 6,
          background: discardMode ? '#3d1a1a' : canDiscard ? '#2a1a0a' : '#181825',
          color: discardMode ? '#f38ba8' : canDiscard ? '#fab387' : '#45475a',
          cursor: canDiscard ? 'pointer' : 'not-allowed',
        }}
      >
        {discardMode ? 'Cancel' : 'Discard'}
      </button>

      {discardMode && (
        <button
          onClick={onConfirmDiscard}
          disabled={selectedDiscardCount === 0}
          style={{
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 'bold',
            border: '2px solid #f38ba8',
            borderRadius: 6,
            background: selectedDiscardCount > 0 ? '#3d1a1a' : '#181825',
            color: selectedDiscardCount > 0 ? '#f38ba8' : '#45475a',
            cursor: selectedDiscardCount > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Discard Selected ({selectedDiscardCount})
        </button>
      )}

      <span style={{ fontSize: 13, color: '#a6adc8', fontFamily: 'monospace' }}>
        Hands: <strong style={{ color: handsRemaining > 0 ? '#89b4fa' : '#f38ba8' }}>{handsRemaining}</strong>/{maxHands}
      </span>
      <span style={{ fontSize: 13, color: '#a6adc8', fontFamily: 'monospace' }}>
        Discards: <strong style={{ color: canDiscard ? '#fab387' : '#f38ba8' }}>{remainingDiscards}</strong>/{maxDiscards}
      </span>
    </div>
  )
}
