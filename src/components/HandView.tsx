import type { Hand, Tile } from '../game/types'

interface HandViewProps {
  hand: Hand
  onPlace: (tile: Tile) => void
  discardMode: boolean
  selectedForDiscard: Set<string>
  onToggleSelectForDiscard: (tile: Tile) => void
}

// Helper to render pip dots on a domino half
function renderPips(pip: number): React.ReactNode[] {
  const pips: React.ReactNode[] = []
  
  // Standard domino pip positions
  const positions: { [key: number]: [number, number][] } = {
    0: [],
    1: [[50, 50]], // center
    2: [[25, 25], [75, 75]], // diagonal
    3: [[25, 25], [50, 50], [75, 75]], // diagonal line
    4: [[25, 25], [75, 25], [25, 75], [75, 75]], // four corners
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]], // four corners + center
    6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]], // two columns
  }
  
  const pipPositions = positions[pip] || []
  
  for (let i = 0; i < pipPositions.length; i++) {
    const [x, y] = pipPositions[i]
    pips.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          width: 4,
          height: 4,
          background: '#ffffff',
          borderRadius: '50%',
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 2px rgba(255, 255, 255, 0.8)',
        }}
      />
    )
  }
  return pips
}

// Hand tile component
function HandTile({ tile, isSelected, discardMode, onClick, onDragStart }: {
  tile: Tile
  isSelected: boolean
  discardMode: boolean
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
}) {
  return (
    <button
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        width: 70,
        height: 35,
        background: discardMode
          ? isSelected ? '#3d1a1a' : '#221212'
          : '#1e1e2e',
        border: `2px solid ${
          discardMode
            ? isSelected ? '#f38ba8' : '#6b3a3a'
            : '#45475a'
        }`,
        borderRadius: 5,
        overflow: 'hidden',
        cursor: discardMode ? 'pointer' : 'grab',
        transition: 'all 0.2s',
        padding: 0,
        outline: isSelected ? '2px solid #f38ba8' : 'none',
        outlineOffset: 2,
        boxShadow: isSelected ? '0 0 8px rgba(243, 139, 168, 0.4)' : 'none',
      }}
      title={discardMode ? 'Click to select for discard' : 'Drag to place on board'}
    >
      {/* Left half */}
      <div
        style={{
          flex: 1,
          background: '#0a0a0a',
          borderRight: '1px solid #45475a',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {renderPips(tile.left)}
        </div>
      </div>

      {/* Right half */}
      <div
        style={{
          flex: 1,
          background: '#0a0a0a',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {renderPips(tile.right)}
        </div>
      </div>
    </button>
  )
}

export function HandView({ hand, onPlace, discardMode, selectedForDiscard, onToggleSelectForDiscard }: HandViewProps) {
  const handleDragStart = (tile: Tile) => (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('tile', JSON.stringify(tile))
  }

  if (hand.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ 
          color: '#a6e3a1', 
          fontStyle: 'italic',
          fontWeight: 'bold',
          textAlign: 'center',
          padding: '12px',
          background: '#1a3d1a',
          borderRadius: 6,
          border: '2px solid #a6e3a1'
        }}>
          🎯 Hand is empty
        </div>
        <div style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', fontSize: 12 }}>
          Domino bonus (×1.75) will apply if chain is unbroken
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        fontSize: 12,
        color: '#a6adc8',
        fontWeight: 'bold',
      }}>
        {discardMode ? `Select tiles to discard (${selectedForDiscard.size} selected)` : `Hand (${hand.length} tiles) - Drag to place`}
      </div>
      
      {/* Hand tiles */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        padding: 8,
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 6,
        border: '1px solid #45475a',
        minHeight: 50,
      }}>
        {hand.map((tile) => {
          const isSelected = selectedForDiscard.has(tile.id)

          const handleClick = () => {
            if (discardMode) onToggleSelectForDiscard(tile)
            else onPlace(tile)
          }

          return (
            <HandTile
              key={tile.id}
              tile={tile}
              isSelected={isSelected}
              discardMode={discardMode}
              onClick={handleClick}
              onDragStart={handleDragStart(tile)}
            />
          )
        })}
      </div>
    </div>
  )
}
