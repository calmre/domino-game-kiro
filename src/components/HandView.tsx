import type { Hand, Tile } from '../game/types'

interface HandViewProps {
  hand: Hand
  onPlace: (tile: Tile) => void
  discardMode: boolean
  selectedForDiscard: Set<string>
  onToggleSelectForDiscard: (tile: Tile) => void
}

export function HandView({ hand, onPlace, discardMode, selectedForDiscard, onToggleSelectForDiscard }: HandViewProps) {
  if (hand.length === 0) {
    return <div style={{ color: '#888', fontStyle: 'italic' }}>Hand is empty</div>
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {hand.map((tile) => {
        const isSelected = selectedForDiscard.has(tile.id)

        const handleClick = () => {
          if (discardMode) onToggleSelectForDiscard(tile)
          else onPlace(tile)
        }

        let borderColor = '#585b70'
        let bg = '#1e1e2e'
        let color = '#cdd6f4'

        if (discardMode) {
          borderColor = isSelected ? '#f38ba8' : '#6b3a3a'
          bg = isSelected ? '#3d1a1a' : '#221212'
          color = isSelected ? '#f38ba8' : '#a06060'
        }

        return (
          <button
            key={tile.id}
            onClick={handleClick}
            style={{
              padding: '8px 14px',
              fontFamily: 'monospace',
              fontSize: 16,
              border: `2px solid ${borderColor}`,
              borderRadius: 6,
              background: bg,
              color,
              cursor: 'pointer',
              transition: 'all 0.1s',
              outline: isSelected ? '2px solid #f38ba8' : 'none',
              outlineOffset: 2,
            }}
          >
            [{tile.left}|{tile.right}]
          </button>
        )
      })}
    </div>
  )
}
