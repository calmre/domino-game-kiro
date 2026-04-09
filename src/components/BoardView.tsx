import type { Chain, Tile } from '../game/types'
import { useState } from 'react'

interface BoardViewProps {
  chain: Chain
  anchorTile: Tile | null
  onUndoLast?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  ghostTile?: Tile | null
  ghostPipeActive?: boolean
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
          width: 5,
          height: 5,
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

// Domino tile component
function DominoTile({ left, right, isLast, isBroken, isAnchor, onClick, isGhost, isDouble }: {
  left: number
  right: number
  isLast: boolean
  isBroken: boolean
  isAnchor: boolean
  onClick?: () => void
  isGhost?: boolean
  isDouble?: boolean
}) {
  // For double tiles, display vertically
  if (isDouble) {
    return (
      <div
        onClick={onClick}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          width: 40,
          height: 80,
          background: isBroken ? '#2a0a0a' : isAnchor ? 'linear-gradient(135deg, #2a1a4a, #1a0a3a)' : isGhost ? 'rgba(26, 200, 100, 0.2)' : '#1e1e2e',
          border: `3px solid ${isBroken ? '#f38ba8' : isAnchor ? '#cba6f7' : isGhost ? '#1ac864' : isLast ? '#fab387' : '#45475a'}`,
          borderRadius: 6,
          overflow: 'hidden',
          cursor: isLast || isAnchor ? 'pointer' : 'default',
          transition: 'all 0.2s',
          boxShadow: isAnchor ? '0 0 15px rgba(203, 166, 247, 0.6)' : isBroken ? '0 0 10px rgba(243, 139, 168, 0.4)' : isGhost ? '0 0 12px rgba(26, 200, 100, 0.5)' : 'none',
          position: 'relative',
          userSelect: 'none',
          opacity: isGhost ? 0.7 : 1,
        }}
        title={isLast ? 'Click to undo' : isAnchor ? 'Anchor tile' : isGhost ? 'Ghost placement preview' : 'Double tile'}
      >
        {/* Top half */}
        <div
          style={{
            flex: 1,
            background: '#0a0a0a',
            borderBottom: '2px solid #45475a',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {renderPips(left)}
            <div style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              fontSize: 8,
              fontFamily: 'monospace',
              color: '#585b70',
              fontWeight: 'bold',
            }}>
              {left}
            </div>
          </div>
        </div>

        {/* Bottom half */}
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
            {renderPips(right)}
            <div style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              fontSize: 8,
              fontFamily: 'monospace',
              color: '#585b70',
              fontWeight: 'bold',
            }}>
              {right}
            </div>
          </div>
        </div>

        {/* Broken link indicator */}
        {isBroken && (
          <div style={{
            position: 'absolute',
            top: -8,
            right: -4,
            fontSize: 12,
            background: '#f38ba8',
            color: '#11111b',
            padding: '2px 4px',
            borderRadius: 3,
            fontWeight: 'bold',
          }}>
            ✗
          </div>
        )}

        {/* Anchor indicator */}
        {isAnchor && (
          <div style={{
            position: 'absolute',
            top: -8,
            left: -4,
            fontSize: 10,
            background: '#cba6f7',
            color: '#11111b',
            padding: '2px 4px',
            borderRadius: 3,
            fontWeight: 'bold',
          }}>
            A
          </div>
        )}

        {/* Ghost indicator */}
        {isGhost && (
          <div style={{
            position: 'absolute',
            top: -8,
            left: -4,
            fontSize: 10,
            background: '#1ac864',
            color: '#11111b',
            padding: '2px 4px',
            borderRadius: 3,
            fontWeight: 'bold',
          }}>
            ✓
          </div>
        )}
      </div>
    )
  }

  // Regular horizontal tile
  return (
    <div
      style={{
        display: 'inline-flex',
        width: 80,
        height: 40,
        background: isBroken ? '#2a0a0a' : isAnchor ? 'linear-gradient(135deg, #2a1a4a, #1a0a3a)' : isGhost ? 'rgba(26, 200, 100, 0.2)' : '#1e1e2e',
        border: `3px solid ${isBroken ? '#f38ba8' : isAnchor ? '#cba6f7' : isGhost ? '#1ac864' : isLast ? '#fab387' : '#45475a'}`,
        borderRadius: 6,
        overflow: 'hidden',
        cursor: isLast || isAnchor ? 'pointer' : 'default',
        transition: 'all 0.2s',
        boxShadow: isAnchor ? '0 0 15px rgba(203, 166, 247, 0.6)' : isBroken ? '0 0 10px rgba(243, 139, 168, 0.4)' : isGhost ? '0 0 12px rgba(26, 200, 100, 0.5)' : 'none',
        position: 'relative',
        userSelect: 'none',
        opacity: isGhost ? 0.7 : 1,
      }}
      onClick={onClick}
      title={isLast ? 'Click to undo' : isAnchor ? 'Anchor tile' : isGhost ? 'Ghost placement preview' : ''}
    >
      {/* Left half */}
      <div
        style={{
          flex: 1,
          background: '#0a0a0a',
          borderRight: '2px solid #45475a',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {renderPips(left)}
          <div style={{
            position: 'absolute',
            bottom: 2,
            right: 4,
            fontSize: 10,
            fontFamily: 'monospace',
            color: '#585b70',
            fontWeight: 'bold',
          }}>
            {left}
          </div>
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
          {renderPips(right)}
          <div style={{
            position: 'absolute',
            bottom: 2,
            right: 4,
            fontSize: 10,
            fontFamily: 'monospace',
            color: '#585b70',
            fontWeight: 'bold',
          }}>
            {right}
          </div>
        </div>
      </div>

      {/* Broken link indicator */}
      {isBroken && (
        <div style={{
          position: 'absolute',
          top: -8,
          right: -4,
          fontSize: 12,
          background: '#f38ba8',
          color: '#11111b',
          padding: '2px 4px',
          borderRadius: 3,
          fontWeight: 'bold',
        }}>
          ✗
        </div>
      )}

      {/* Anchor indicator */}
      {isAnchor && (
        <div style={{
          position: 'absolute',
          top: -8,
          left: -4,
          fontSize: 10,
          background: '#cba6f7',
          color: '#11111b',
          padding: '2px 4px',
          borderRadius: 3,
          fontWeight: 'bold',
        }}>
          A
        </div>
      )}

      {/* Ghost indicator */}
      {isGhost && (
        <div style={{
          position: 'absolute',
          top: -8,
          left: -4,
          fontSize: 10,
          background: '#1ac864',
          color: '#11111b',
          padding: '2px 4px',
          borderRadius: 3,
          fontWeight: 'bold',
        }}>
          ✓
        </div>
      )}
    </div>
  )
}

export function BoardView({ chain, anchorTile, onUndoLast, onDragOver, onDrop, ghostTile, ghostPipeActive = false }: BoardViewProps) {
  // Ghost Pipe: first tile's broken link is suppressed visually
  const hasBrokenLinks = chain.tiles.some((tile, i) => tile.brokenLink && !(i === 0 && ghostPipeActive))
  const [isDragOver, setIsDragOver] = useState(false)
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
    onDragOver?.(e)
  }
  
  const handleDragLeave = () => {
    setIsDragOver(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    onDrop?.(e)
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Board area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          background: isDragOver 
            ? 'linear-gradient(135deg, #1a2a1a 0%, #0a1a0a 100%)'
            : 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
          border: `2px solid ${isDragOver ? '#1ac864' : '#45475a'}`,
          borderRadius: 8,
          padding: 16,
          minHeight: 120,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          flexWrap: 'wrap',
          overflow: 'auto',
          transition: 'all 0.2s',
          alignContent: 'flex-start',
        }}
      >
        {/* Anchor tile */}
        {anchorTile && (
          <>
            <DominoTile
              left={anchorTile.left}
              right={anchorTile.right}
              isLast={false}
              isBroken={false}
              isAnchor={true}
              isDouble={anchorTile.left === anchorTile.right}
            />
            <div style={{
              color: '#585b70',
              fontSize: 20,
              fontWeight: 'bold',
            }}>
              →
            </div>
          </>
        )}

        {/* Chain tiles */}
        {chain.tiles.length === 0 && !anchorTile ? (
          <div style={{
            color: '#6c7086',
            fontStyle: 'italic',
            fontSize: 14,
            width: '100%',
            textAlign: 'center',
            padding: '20px 0',
          }}>
            Drag tiles here to place them
          </div>
        ) : (
          chain.tiles.map((pt, i) => {
            const left = pt.flipped ? pt.tile.right : pt.tile.left
            const right = pt.flipped ? pt.tile.left : pt.tile.right
            const isLast = i === chain.tiles.length - 1
            const showBroken = pt.brokenLink && !(i === 0 && ghostPipeActive)

            return (
              <div key={`${pt.tile.id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DominoTile
                  left={left}
                  right={right}
                  isLast={isLast}
                  isBroken={showBroken}
                  isAnchor={false}
                  onClick={isLast ? onUndoLast : undefined}
                  isDouble={left === right}
                />
                {isLast && chain.tiles.length > 1 && (
                  <div style={{
                    fontSize: 11,
                    color: '#6b5a3a',
                    marginLeft: 4,
                  }}>
                    ↻
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Ghost placement preview */}
        {ghostTile && chain.tiles.length > 0 && (
          <>
            <div style={{
              color: '#1ac864',
              fontSize: 16,
              fontWeight: 'bold',
              opacity: 0.6,
            }}>
              →
            </div>
            <DominoTile
              left={ghostTile.left}
              right={ghostTile.right}
              isLast={false}
              isBroken={false}
              isAnchor={false}
              isGhost={true}
              isDouble={ghostTile.left === ghostTile.right}
            />
          </>
        )}

        {/* RUN BROKEN overlay */}
        {hasBrokenLinks && chain.tiles.length > 0 && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(243, 139, 168, 0.08)',
            border: '2px solid #f38ba8',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              background: '#f38ba8',
              color: '#11111b',
              padding: '6px 16px',
              borderRadius: 6,
              fontFamily: 'monospace',
              fontSize: 13,
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              RUN BROKEN
            </div>
          </div>
        )}
      </div>

      {/* Info section */}
      {chain.tiles.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 16,
          fontSize: 13,
          color: '#a6adc8',
          padding: '0 4px',
        }}>
          <div>
            Open end: <strong style={{ color: '#89b4fa', fontSize: 14 }}>{chain.openEnd}</strong>
          </div>
          <div>
            Tiles: <strong style={{ color: '#89b4fa' }}>{chain.tiles.length}</strong>
          </div>
          {hasBrokenLinks && (
            <div style={{ color: '#f38ba8' }}>
              ✗ Run multiplier deactivated
            </div>
          )}
        </div>
      )}
    </div>
  )
}
