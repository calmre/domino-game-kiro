import { useGameStore } from '../store/useGameStore'
import { generateShopItems } from '../game/shop'
import type { ShopItem } from '../game/types'

const SHOP_ITEMS = generateShopItems()

export function ShopScreen() {
  const currency = useGameStore(s => s.currency)
  const purchaseItem = useGameStore(s => s.purchaseItem)
  const leaveShop = useGameStore(s => s.leaveShop)
  const items = useGameStore(s => s.items)

  const purchasedIds = new Set(items.map(i => i.id))

  const handleBuy = (item: ShopItem) => {
    if (currency >= item.cost) {
      purchaseItem(item)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 600 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontFamily: 'monospace', color: '#89b4fa', fontSize: 22 }}>Shop</h2>
        <span style={{ fontFamily: 'monospace', fontSize: 16, color: '#f9e2af' }}>
          💰 {currency} coins
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SHOP_ITEMS.map(item => {
          const canAfford = currency >= item.cost
          const alreadyOwned = purchasedIds.has(item.id)
          const disabled = !canAfford || alreadyOwned

          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: '#1e1e2e',
                border: `1px solid ${canAfford && !alreadyOwned ? '#45475a' : '#313244'}`,
                borderRadius: 8,
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#cdd6f4', marginBottom: 2 }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 12, color: '#a6adc8' }}>{item.description}</div>
              </div>
              <div style={{ fontFamily: 'monospace', color: '#f9e2af', minWidth: 40, textAlign: 'right' }}>
                {item.cost}g
              </div>
              <button
                onClick={() => handleBuy(item)}
                disabled={disabled}
                style={{
                  padding: '6px 14px',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  fontWeight: 'bold',
                  border: `2px solid ${disabled ? '#45475a' : '#a6e3a1'}`,
                  borderRadius: 6,
                  background: disabled ? '#181825' : '#1a3d1a',
                  color: disabled ? '#45475a' : '#a6e3a1',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {alreadyOwned ? 'Owned' : 'Buy'}
              </button>
            </div>
          )
        })}
      </div>

      <button
        onClick={leaveShop}
        style={{
          padding: '10px 20px',
          fontFamily: 'monospace',
          fontSize: 15,
          fontWeight: 'bold',
          border: '2px solid #89b4fa',
          borderRadius: 8,
          background: '#1e3a5f',
          color: '#89b4fa',
          cursor: 'pointer',
          alignSelf: 'flex-end',
        }}
      >
        Leave Shop →
      </button>
    </div>
  )
}
