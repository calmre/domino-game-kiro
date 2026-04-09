import type { Chain, Hand, ScoringResult, BossModifier, ShopItem, Tile } from '../game/types'
import { calculateBaseScore, calculateMultiplier, calculateFinalScore } from '../game/scoring'

interface ScorePanelProps {
  lastScore?: ScoringResult
  chain: Chain
  hand: Hand
  roundScore: number
  targetScore: number
  bossModifier?: BossModifier
  items?: ShopItem[]
  anchorTile?: Tile | null
  currency?: number
  phenomenalEvilBonus?: number
}

export function ScorePanel({ lastScore, chain, hand, roundScore, targetScore, bossModifier, items = [], anchorTile = null, currency = 0, phenomenalEvilBonus = 0 }: ScorePanelProps) {
  const base = calculateBaseScore(chain, bossModifier, items, anchorTile, currency, hand.length, hand, phenomenalEvilBonus)
  const handEmpty = hand.length === 0
  const mult = calculateMultiplier(chain, bossModifier, handEmpty, items, hand.length, anchorTile, currency, hand)
  const final = calculateFinalScore(chain, bossModifier, handEmpty, items, anchorTile, hand.length, currency, hand, phenomenalEvilBonus)

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#cdd6f4', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#89b4fa' }}>Score</div>

      <div style={{ fontSize: 12, color: '#a6adc8' }}>Accumulated:</div>
      <div style={{ paddingLeft: 8 }}>
        <span style={{ color: roundScore >= targetScore ? '#a6e3a1' : '#f9e2af', fontWeight: 'bold' }}>
          {roundScore}
        </span>
        <span style={{ color: '#585b70' }}> / {targetScore}</span>
      </div>

      <div style={{ borderTop: '1px solid #313244', marginTop: 4, paddingTop: 4 }}>
        <div style={{ fontSize: 12, color: '#a6adc8', marginBottom: 2 }}>This hand:</div>
        <div>Base: <span style={{ color: '#f9e2af' }}>{base}</span></div>
        <div style={{ marginTop: 4, color: '#a6adc8', fontSize: 12 }}>Multiplier:</div>
        <div style={{ paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 2, fontSize: 13 }}>
          <div>
            Chain Bonus: 
            <span style={{ color: '#cba6f7' }}>
              ×{mult.chainBonus}
            </span>
            {mult.chainLength > 0 && (
              <span style={{ fontSize: 11, color: '#a6adc8', marginLeft: 4 }}>
                ({mult.chainLength} tiles)
              </span>
            )}
          </div>
          <div>Double Multiplier: <span style={{ color: '#cba6f7' }}>×{mult.doubleMultiplier.toFixed(2)}</span></div>
          {mult.dominoBonus && (
            <div style={{ color: '#a6e3a1', fontWeight: 'bold' }}>
              🎯 Domino! Bonus: <span style={{ color: '#a6e3a1' }}>×1.75</span>
            </div>
          )}
          {mult.perfectLoopBonus && (
            <div style={{ color: '#f9e2af', fontWeight: 'bold' }}>
              🔁 Perfect Loop: <span style={{ color: '#f9e2af' }}>×2.0</span>
            </div>
          )}
          {mult.binaryCodeBonus && (
            <div style={{ color: '#89dceb', fontWeight: 'bold' }}>
              💻 Binary Code: <span style={{ color: '#89dceb' }}>×1.5</span>
            </div>
          )}
          {mult.compoundInterestBonus > 0 && (
            <div style={{ color: '#f9e2af', fontWeight: 'bold' }}>
              💰 Compound Interest: <span style={{ color: '#f9e2af' }}>×{mult.compoundInterestBonus.toFixed(2)}</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid #45475a', paddingTop: 2 }}>
            Total: <span style={{ color: '#cba6f7', fontWeight: 'bold' }}>×{mult.total.toFixed(2)}</span>
          </div>
        </div>
        {mult.brokenLinks > 0 && (
          <div style={{ fontSize: 12, color: '#f38ba8', marginTop: 2 }}>
            ⚠️ {mult.brokenLinks} broken link{mult.brokenLinks > 1 ? 's' : ''} — Run multiplier deactivated
          </div>
        )}
        <div style={{ marginTop: 4, fontWeight: 'bold' }}>
          Hand score: <span style={{ color: '#a6e3a1', fontSize: 15 }}>{final}</span>
        </div>
      </div>

      {lastScore && (
        <div style={{ marginTop: 6, padding: '6px 8px', background: '#181825', borderRadius: 4, border: '1px solid #45475a', fontSize: 12 }}>
          <div style={{ color: '#a6adc8', marginBottom: 2 }}>Last hand:</div>
          <div>Score: <span style={{ color: '#f9e2af' }}>{lastScore.finalScore}</span></div>
        </div>
      )}
    </div>
  )
}
