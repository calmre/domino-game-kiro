import { useGameStore } from './store/useGameStore'
import { GameScreen } from './components/GameScreen'
import { ShopScreen } from './components/ShopScreen'
import { BossBlindBanner } from './components/BossBlindBanner'
import { GameOverScreen } from './components/GameOverScreen'

export default function App() {
  const phase = useGameStore(s => s.phase)
  const bossModifier = useGameStore(s => s.bossModifier)
  const startRun = useGameStore(s => s.startRun)
  const startRound = useGameStore(s => s.startRound)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#11111b',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      {phase === 'menu' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: 40, fontWeight: 'bold', color: '#cba6f7' }}>
            🁣 Domino Balatro
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 15, color: '#a6adc8', maxWidth: 340 }}>
            Build chains, score big, survive the boss blinds.
          </div>
          <button
            onClick={() => { startRun(); startRound() }}
            style={{
              padding: '12px 32px',
              fontFamily: 'monospace',
              fontSize: 17,
              fontWeight: 'bold',
              border: '2px solid #cba6f7',
              borderRadius: 10,
              background: '#2a1a4a',
              color: '#cba6f7',
              cursor: 'pointer',
            }}
          >
            Start Run
          </button>
        </div>
      )}

      {(phase === 'round' || phase === 'scoring') && <GameScreen />}

      {phase === 'shop' && <ShopScreen />}

      {phase === 'boss_intro' && bossModifier && (
        <BossBlindBanner bossModifier={bossModifier} onStart={startRound} />
      )}

      {phase === 'game_over' && <GameOverScreen />}
    </div>
  )
}
