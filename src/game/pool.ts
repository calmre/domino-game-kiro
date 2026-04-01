import type { Pool, Tile, Hand } from './types'

/**
 * Creates all 28 canonical tiles for a standard double-6 domino set.
 * Canonical means left <= right, so each unique combination appears exactly once.
 */
export function initPool(): Pool {
  const tiles: Tile[] = []
  for (let left = 0; left <= 6; left++) {
    for (let right = left; right <= 6; right++) {
      tiles.push({ left, right, id: `${left}-${right}` })
    }
  }
  return tiles
}

/**
 * Removes and returns a random tile from the pool.
 * Pure — returns a new pool without the drawn tile.
 */
export function drawTile(pool: Pool): { tile: Tile; pool: Pool } {
  if (pool.length === 0) {
    throw new Error('Cannot draw from an empty pool')
  }
  const index = Math.floor(Math.random() * pool.length)
  const tile = pool[index]
  const newPool = pool.filter((_, i) => i !== index)
  return { tile, pool: newPool }
}

/**
 * Removes a specific tile from the pool by id.
 * Pure — returns a new pool without the specified tile.
 */
export function removeTile(pool: Pool, tile: Tile): Pool {
  const index = pool.findIndex(t => t.id === tile.id)
  if (index === -1) return pool
  return pool.filter((_, i) => i !== index)
}

/**
 * Draws `count` tiles from the pool.
 * If pool runs out, it reshuffles with remaining tiles and continues drawing.
 * Pure — returns the new hand and the updated pool.
 */
export function dealHand(pool: Pool, count: number): { hand: Hand; pool: Pool } {
  let currentPool = pool
  const hand: Hand = []

  for (let i = 0; i < count; i++) {
    // If pool is empty, reshuffle with remaining tiles
    if (currentPool.length === 0) {
      // Pool is completely empty - can't draw more
      break
    }

    const { tile, pool: nextPool } = drawTile(currentPool)
    hand.push(tile)
    currentPool = nextPool
  }

  return { hand, pool: currentPool }
}
