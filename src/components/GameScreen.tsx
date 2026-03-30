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

export function GameScreen() {
  const [discardMode, setDiscardMode] = useState(false)
  const [selectedForDiscard, setSelectedForDiscard] = useState<Set<string>>(new Set())

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
  const placeTile = useGameStore(s => s.placeTile)
  const discardSelected = useGameStore(s => s.discardSelected)
  const undoLastTile = useGameStore(s => s.undoLastTile)
  const playHand = useGameStore(s => s.playHand)

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
    if (!discardMode && chain.tiles.length > 0) {
      // Entering discard mode — return board tiles to hand
      const boardTiles = chain.tiles.map(pt => pt.tile)
      useGameStore.setState(s => ({
        hand: [...s.hand, ...boardTiles],
        chain: { tiles: [], openEnd: 0 },
      }))
    }
    setDiscardMode(m => !m)
    setSelectedForDiscard(new Set())
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            padding: 12,
            background: '#1e1e2e',
            borderRadius: 8,
            border: '1px solid #313244',
          }}>
            <div style={{ fontSize: 12, color: '#a6adc8', marginBottom: 8, fontFamily: 'monospace' }}>
              BOARD ({chain.tiles.length}/5)
            </div>
            <BoardView chain={chain} onUndoLast={undoLastTile} />
          </div>

          <div style={{
            padding: 12,
            background: '#1e1e2e',
            borderRadius: 8,
            border: '1px solid #313244',
          }}>
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
          <ScorePanel lastScore={lastScore} chain={chain} roundScore={roundScore} targetScore={targetScore} bossModifier={bossModifier} />
          {bossModifier && <BossPenaltyBadge bossModifier={bossModifier} />}
        </div>

        <RulesPanel />
      </div>
    </div>
  )
}
