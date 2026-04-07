import { useGameStore } from '../store/useGameStore'
import { getAllShopItems } from '../game/shop'
import type { BossModifier, ShopItem } from '../game/types'

const BOSS_OPTIONS: (BossModifier | null)[] = [
  null,
  { type: 'lead_weight', name: 'The Lead Weight', description: 'Each hand loses 5 from its base score.' },
  { type: 'frozen_bone', name: 'The Frozen Bone', description: 'Double tiles contribute 0 pips and 0 bonus.' },
  { type: 'reduced_hand', name: 'The Small Hand', description: 'Hand size reduced to 4 tiles.', size: 4 },
  { type: 'no_discards', name: 'The Iron Grip', description: 'No discards allowed this round.' },
]

const ALL_ITEMS = getAllShopItems()

export function DebugPanel() {
  const items = useGameStore(s => s.items)
  const bossModifier = useGameStore(s => s.bossModifier)
  const setDebugItems = useGameStore(s => s.setDebugItems)
  const setDebugBoss = useGameStore(s => s.setDebugBoss)

  const toggleItem = (item: ShopItem) => {
    const has = items.some(i => i.id === item.id)
    if (has) {
      setDebugItems(items.filter(i => i.id !== item.id))
    } else {
      setDebugItems([...items, item])
    }
  }

  const handleBossChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const boss = BOSS_OPTIONS.find(b => (b?.type ?? 'none') === val) ?? null
    setDebugBoss(boss)
  }

  return (
    <div style={{
      width: 180,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '10px 8px',
      background: '#12121f',
      border: '1px solid #f9e2af44',
      borderRadius: 8,
      fontFamily: 'monospace',
      fontSize: 11,
      color: '#cdd6f4',
      maxHeight: '80vh',
      overflowY: 'auto',
    }}>
      <div style={{ color: '#f9e2af', fontWeight: 'bold', fontSize: 12, marginBottom: 2 }}>🛠 Debug</div>

      {/* Boss selector */}
      <div style={{ color: '#a6adc8', fontSize: 10, marginBottom: 2 }}>Boss Modifier</div>
      <select
        value={bossModifier?.type ?? 'none'}
        onChange={handleBossChange}
        style={{
          background: '#1e1e2e',
          color: '#cdd6f4',
          border: '1px solid #45475a',
          borderRadius: 4,
          padding: '3px 4px',
          fontFamily: 'monospace',
          fontSize: 10,
          width: '100%',
        }}
      >
        <option value="none">None</option>
        {BOSS_OPTIONS.filter(Boolean).map(b => (
          <option key={b!.type} value={b!.type}>{b!.name}</option>
        ))}
      </select>

      {/* Upgrades */}
      <div style={{ color: '#a6adc8', fontSize: 10, marginTop: 4, marginBottom: 2 }}>Upgrades</div>
      {ALL_ITEMS.map(item => {
        const active = items.some(i => i.id === item.id)
        return (
          <label
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 5,
              cursor: 'pointer',
              padding: '3px 0',
              borderBottom: '1px solid #1e1e2e',
              color: active ? '#a6e3a1' : '#6c7086',
            }}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={() => toggleItem(item)}
              style={{ marginTop: 1, accentColor: '#a6e3a1', flexShrink: 0 }}
            />
            <span title={item.description}>{item.name} <span style={{ color: '#f9e2af99' }}>${item.cost}</span></span>
          </label>
        )
      })}
    </div>
  )
}
