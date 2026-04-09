import { useState } from 'react'
import type { Tile } from '../game/types'
import { useGameStore } from '../store/useGameStore'
import { BoardView } from './BoardView'
import { HandView } from './HandView'
import { ScorePanel } from './ScorePanel'
import { ActionBar } from './ActionBar'
import { StatusBar } from './StatusBar'
import { BossPenaltyBadge } from './BossBlindBanner'
import { RulesPanel } from './RulesPanel'
import { DebugPanel } from './DebugPanel'

export function GameScreen() {
  const [discardMode, setDiscardMode] = useState(false)
  const [selectedForDiscard, setSelectedForDiscard] = useState<Set<string>>(new Set())
  const [ghostTile, setGhostTile] = useState<Tile | null>(null)

  const phase = useGameStore(s => s.phase)
  const pool = useGameStore(s => s.pool)
  const hand = useGameStore(s => s.hand)
  const chain = useGameStore(s => s.chain)
  const discardCount = useGameStore(s => s.discardCount)
  const maxDiscards = useGameStore(s => s.maxDiscards)
  const handsPlayed = useGameStore(s => s.handsPlayed)
  const maxHands = useGameStore(s => s.maxHands)
  const roundScore = useGameStore(s => s.roundScore)
  const ante = useGameStore(s => s.ante)
  const blindIndex = useGameStore(s => s.blindIndex)
  const targetScore = useGameStore(s => s.targetScore)
  const lastScore = useGameStore(s => s.lastScore)
  const bossModifier = useGameStore(s => s.bossModifier)
  const anchorTile = useGameStore(s => s.anchorTile)
  const items = useGameStore(s => s.items)
  const currency = useGameStore(s => s.currency)
  const placeTile = useGameStore(s => s.placeTile)
  const discardSelected = useGameStore(s => s.discardSelected)
  const undoLastTile = useGameStore(s => s.undoLastTile)
  const playHand = useGameStore(s => s.playHand)
  const sellItem = useGameStore(s => s.sellItem)
  const debugMode = useGameStore(s => s.debugMode)
  const phenomenalEvilBonus = useGameStore(s => s.phenomenalEvilBonus)
  const ghostPipeActive = useGameStore(s => s.ghostPipeActive)
  const ghostPipeUsed = useGameStore(s => s.ghostPipeUsed)

  const handlePlace = (tile: Tile) => {
    placeTile(tile)
  }

  const handleToggleSelectForDiscard = (tile: Tile) => {
    setSelectedForDiscard(prev => {
      const next = new Set(prev)
      if (next.has(tile.id)) next.delete(tile.id)
      else next.add(tile.id)
      return next
    })
  }

  const handleConfirmDiscard = () => {
    const tiles = hand.filter(t => selectedForDiscard.has(t.id))
    discardSelected(tiles)
    setSelectedForDiscard(new Set())
    setDiscardMode(false)
  }

  const handleToggleDiscard = () => {
    // Just toggle discard mode - don't affect the board
    setDiscardMode(m => !m)
    setSelectedForDiscard(new Set())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    // Show ghost tile when dragging over board
    const tileData = e.dataTransfer.getData('tile')
    if (tileData) {
      try {
        const tile = JSON.parse(tileData)
        setGhostTile(tile)
      } catch {
        // Invalid tile data
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setGhostTile(null)
    const tileData = e.dataTransfer.getData('tile')
    if (tileData) {
      try {
        const tile = JSON.parse(tileData)
        placeTile(tile)
      } catch {
        // Invalid tile data
      }
    }
  }

  const handleBoardDragLeave = () => {
    setGhostTile(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 1100 }}>
      <StatusBar
        ante={ante}
        blindIndex={blindIndex}
        poolCount={pool.length}
        targetScore={targetScore}
        roundScore={roundScore}
      />

      {phase === 'scoring' && lastScore && (
        <div style={{
          padding: '10px 14px',
          background: '#1e1e2e',
          border: `2px solid ${lastScore.cleared ? '#a6e3a1' : '#f38ba8'}`,
          borderRadius: 8,
          fontFamily: 'monospace',
          color: lastScore.cleared ? '#a6e3a1' : '#f38ba8',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          {lastScore.cleared ? '✓ Round Cleared!' : '✗ Round Failed'} — Score: {lastScore.finalScore}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Left: Inventory */}
        <div style={{
          width: 80,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ fontSize: 10, color: '#f9e2af', fontFamily: 'monospace', fontWeight: 'bold', textAlign: 'center' }}>
            💰 {currency}
          </div>
          {items.length === 0 ? (
            <div style={{ fontSize: 9, color: '#45475a', fontStyle: 'italic', textAlign: 'center' }}>
              No upgrades
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                title={item.description}
                className="inventory-item"
                style={{
                  position: 'relative',
                  padding: '6px 4px',
                  background: '#1a1a2e',
                  border: '1px solid #45475a',
                  borderRadius: 6,
                  cursor: 'default',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold', color: '#cdd6f4', lineHeight: 1.2 }}>
                  {item.name}
                </div>
                <button
                  onClick={() => sellItem(item)}
                  style={{
                    marginTop: 4,
                    padding: '2px 4px',
                    fontSize: 8,
                    fontFamily: 'monospace',
                    border: '1px solid #f38ba8',
                    borderRadius: 3,
                    background: '#3d1a1a',
                    color: '#f38ba8',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  ${Math.floor((item.cost || 2) / 2)}
                </button>
                {/* Tooltip */}
                <div style={{
                  display: 'none',
                  position: 'absolute',
                  left: '100%',
                  top: 0,
                  marginLeft: 6,
                  background: '#1e1e2e',
                  border: '1px solid #89b4fa',
                  borderRadius: 6,
                  padding: '6px 8px',
                  fontSize: 11,
                  color: '#cdd6f4',
                  whiteSpace: 'nowrap',
                  zIndex: 100,
                  pointerEvents: 'none',
                  fontFamily: 'monospace',
                }}
                  className="item-tooltip"
                >
                  <div style={{ fontWeight: 'bold', color: '#89b4fa', marginBottom: 2 }}>{item.name}</div>
                  <div>{item.description}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            padding: 12,
            background: '#1e1e2e',
            borderRadius: 8,
            border: '1px solid #313244',
          }}>
            <div style={{ fontSize: 12, color: '#a6adc8', marginBottom: 8, fontFamily: 'monospace' }}>
              BOARD
            </div>
            <BoardView
              chain={chain}
              anchorTile={anchorTile}
              onUndoLast={undoLastTile}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              ghostTile={ghostTile}
              ghostPipeActive={ghostPipeUsed}
            />
          </div>

          <div
            style={{
              padding: 12,
              background: '#1e1e2e',
              borderRadius: 8,
              border: '1px solid #313244',
            }}
            onDragLeave={handleBoardDragLeave}
          >
            <div style={{ fontSize: 12, color: '#a6adc8', marginBottom: 8, fontFamily: 'monospace' }}>HAND</div>
            <HandView
              hand={hand}
              onPlace={handlePlace}
              discardMode={discardMode}
              selectedForDiscard={selectedForDiscard}
              onToggleSelectForDiscard={handleToggleSelectForDiscard}
            />
          </div>

          <ActionBar
            chain={chain}
            discardCount={discardCount}
            maxDiscards={maxDiscards}
            handsPlayed={handsPlayed}
            maxHands={maxHands}
            onPlayHand={playHand}
            discardMode={discardMode}
            onToggleDiscard={handleToggleDiscard}
            selectedDiscardCount={selectedForDiscard.size}
            onConfirmDiscard={handleConfirmDiscard}
            debugMode={debugMode}
          />
        </div>

        <div style={{
          width: 180,
          padding: 12,
          background: '#1e1e2e',
          borderRadius: 8,
          border: `1px solid ${bossModifier ? '#f38ba840' : '#313244'}`,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <ScorePanel lastScore={lastScore} chain={chain} hand={hand} roundScore={roundScore} targetScore={targetScore} bossModifier={bossModifier} items={items} anchorTile={anchorTile} currency={currency} phenomenalEvilBonus={phenomenalEvilBonus} />
          {bossModifier && <BossPenaltyBadge bossModifier={bossModifier} />}
        </div>

        <RulesPanel />
        {debugMode && <DebugPanel />}
      </div>
    </div>
  )
}
