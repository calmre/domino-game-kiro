import { useGameStore } from '../store/useGameStore'
import type { ShopItem } from '../game/types'

export function ShopScreen() {
  const currency = useGameStore(s => s.currency)
  const purchaseItem = useGameStore(s => s.purchaseItem)
  const sellItem = useGameStore(s => s.sellItem)
  const leaveShop = useGameStore(s => s.leaveShop)
  const items = useGameStore(s => s.items)
  const shopItems = useGameStore(s => s.shopItems)
  const shopPurchases = useGameStore(s => s.shopPurchases)

  // Check if an item is already owned by comparing effect types
  const isItemOwned = (shopItem: ShopItem): boolean => {
    return items.some(ownedItem => {
      const ownedEffect = ownedItem.effect
      const shopEffect = shopItem.effect
      
      // Compare effect types
      if (ownedEffect.type !== shopEffect.type) return false
      
      // For effects with amount/values, compare them too
      if ('amount' in ownedEffect && 'amount' in shopEffect) {
        return ownedEffect.amount === shopEffect.amount
      }
      if ('flat' in ownedEffect && 'flat' in shopEffect) {
        return ownedEffect.flat === shopEffect.flat
      }
      
      return true
    })
  }

  // Total purchasing power = current gold + sell value of all owned items
  const totalPurchasingPower = currency + items.reduce((sum, item) => sum + Math.floor(item.cost / 2), 0)
  const anyAffordable = shopItems.some(item => totalPurchasingPower >= item.cost && !isItemOwned(item))
  const visibleShopItems = anyAffordable
    ? shopItems.filter(item => totalPurchasingPower >= item.cost || isItemOwned(item))
    : shopItems

  const handleBuy = (item: ShopItem) => {
    if (currency >= item.cost && items.length < 5 && shopPurchases < 3) {
      purchaseItem(item)
    }
  }

  const handleSell = (item: ShopItem) => {
    sellItem(item)
  }

  return (
    <div style={{ display: 'flex', gap: 20, width: '100%', maxWidth: 1000 }}>
      {/* Left side - Purchased Upgrades */}
      <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ margin: 0, fontFamily: 'monospace', color: '#89b4fa', fontSize: 18 }}>
          Your Upgrades ({items.length}/5)
        </h3>
        {items.length === 0 ? (
          <div style={{ 
            padding: 20, 
            textAlign: 'center', 
            color: '#6c7086', 
            fontStyle: 'italic',
            border: '1px dashed #45475a',
            borderRadius: 8
          }}>
            No upgrades purchased
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                background: '#1e1e2e',
                border: '1px solid #45475a',
                borderRadius: 6,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#cdd6f4', fontSize: 13 }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 11, color: '#a6adc8' }}>{item.description}</div>
              </div>
              <button
                onClick={() => handleSell(item)}
                style={{
                  padding: '4px 8px',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  border: '1px solid #f38ba8',
                  borderRadius: 4,
                  background: '#3d1a1a',
                  color: '#f38ba8',
                  cursor: 'pointer',
                }}
              >
                Sell ${Math.floor((item.cost || 2) / 2)}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Right side - Shop */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'monospace', color: '#89b4fa', fontSize: 22 }}>Shop</h2>
            <div style={{ fontSize: 12, color: '#a6adc8', marginTop: 2 }}>
              Choose up to 3 upgrades ({shopPurchases}/3 purchased)
            </div>
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 16, color: '#f9e2af' }}>
            💰 {currency} coins
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visibleShopItems.length === 0 ? (
            <div style={{ 
              padding: 40, 
              textAlign: 'center', 
              color: '#6c7086', 
              fontStyle: 'italic',
              border: '1px dashed #45475a',
              borderRadius: 8
            }}>
              No shop items available
            </div>
          ) : (
            visibleShopItems.map(item => {
              const canAfford = currency >= item.cost
              const alreadyOwned = isItemOwned(item)
              const upgradesFull = items.length >= 5
              const purchasesFull = shopPurchases >= 3
              const disabled = !canAfford || alreadyOwned || upgradesFull || purchasesFull

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    background: '#1e1e2e',
                    border: `1px solid ${canAfford && !alreadyOwned && !upgradesFull && !purchasesFull ? '#45475a' : '#313244'}`,
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
                    ${item.cost}
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
                    {alreadyOwned ? 'Owned' : upgradesFull ? 'Full' : purchasesFull ? 'Limit' : 'Buy'}
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={leaveShop}
            style={{
              padding: '10px 20px',
              fontFamily: 'monospace',
              fontSize: 15,
              fontWeight: 'bold',
              border: '2px solid #6c7086',
              borderRadius: 8,
              background: '#1e1e2e',
              color: '#6c7086',
              cursor: 'pointer',
            }}
          >
            Skip Shop
          </button>
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
            }}
          >
            Leave Shop →
          </button>
        </div>
      </div>
    </div>
  )
}
