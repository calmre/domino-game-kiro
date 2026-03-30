import type { Chain } from '../game/types'

interface BoardViewProps {
  chain: Chain
  onUndoLast?: () => void
}

export function BoardView({ chain, onUndoLast }: BoardViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', minHeight: 48 }}>
        {chain.tiles.length === 0 ? (
          <span style={{ color: '#888', fontStyle: 'italic' }}>No tiles placed yet</span>
        ) : (
          chain.tiles.map((pt, i) => {
            const left = pt.flipped ? pt.tile.right : pt.tile.left
            const right = pt.flipped ? pt.tile.left : pt.tile.right
            const isLast = i === chain.tiles.length - 1
            const canUndo = isLast // any tile can be undone, including the first

            return (
              <span
                key={`${pt.tile.id}-${i}`}
                onClick={canUndo ? onUndoLast : undefined}
                title={canUndo ? 'Click to undo' : undefined}
                style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  border: `2px solid ${canUndo ? '#fab387' : '#555'}`,
                  borderRadius: 4,
                  fontFamily: 'monospace',
                  fontSize: 16,
                  background: canUndo ? '#2a1a0a' : '#1e1e2e',
                  color: canUndo ? '#fab387' : '#cdd6f4',
                  cursor: canUndo ? 'pointer' : 'default',
                  transition: 'all 0.1s',
                }}
              >
                [{left}|{right}]
              </span>
            )
          })
        )}
      </div>
      {chain.tiles.length > 0 && (
        <div style={{ fontSize: 13, color: '#a6adc8' }}>
          Open end: <strong style={{ color: '#89b4fa' }}>{chain.openEnd}</strong>
          {chain.tiles.length > 1 && (
            <span style={{ marginLeft: 12, fontSize: 11, color: '#6b5a3a' }}>
              (click last tile to undo)
            </span>
          )}
        </div>
      )}
    </div>
  )
}
