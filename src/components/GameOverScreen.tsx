import { useGameStore } from '../store/useGameStore'

export function GameOverScreen() {
  const ante = useGameStore(s => s.ante)
  const lastScore = useGameStore(s => s.lastScore)
  const startRun = useGameStore(s => s.startRun)
  const startRound = useGameStore(s => s.startRound)

  const handleNewRun = () => {
    startRun()
    startRound()
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      padding: 40,
      background: '#1e1e2e',
      border: '2px solid #f38ba8',
      borderRadius: 12,
      maxWidth: 380,
      width: '100%',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 36, fontWeight: 'bold', color: '#f38ba8', fontFamily: 'monospace' }}>
        Game Over
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'monospace', color: '#cdd6f4' }}>
        <div>
          Ante reached: <strong style={{ color: '#89b4fa' }}>{ante}</strong>
        </div>
        {lastScore && (
          <div>
            Last score: <strong style={{ color: '#f9e2af' }}>{lastScore.finalScore}</strong>
          </div>
        )}
      </div>
      <button
        onClick={handleNewRun}
        style={{
          marginTop: 8,
          padding: '10px 28px',
          fontFamily: 'monospace',
          fontSize: 15,
          fontWeight: 'bold',
          border: '2px solid #a6e3a1',
          borderRadius: 8,
          background: '#1a3d1a',
          color: '#a6e3a1',
          cursor: 'pointer',
        }}
      >
        New Run
      </button>
    </div>
  )
}
