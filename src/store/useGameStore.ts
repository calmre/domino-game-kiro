import { create } from 'zustand'
import type { GameState, ShopItem, Tile } from '../game/types'
import { initPool, dealHand } from '../game/pool'
import { initChain, placeTile as placeOnChain } from '../game/chain'
import { canDiscard, evaluateRoundWithAnchor } from '../game/round'
import { getBlindConfig, nextBlind } from '../game/progression'
import { purchaseItem as purchaseItemFn, sellItem as sellItemFn, generateRandomShopItems } from '../game/shop'

interface GameActions {
  startRun(): void
  startRound(): void
  placeTile(tile: Tile): void
  discardSelected(tiles: Tile[]): void
  undoLastTile(): void
  playHand(): void   // score current chain, redeal, decrement hands remaining
  leaveShop(): void
  purchaseItem(item: ShopItem): void
  sellItem(item: ShopItem): void
}

const INITIAL_STATE: GameState = {
  phase: 'menu',
  pool: [],
  discardPool: [],
  hand: [],
  chain: { tiles: [], openEnd: 0 },
  anchorTile: null,
  discardCount: 0,
  maxDiscards: 3,  // Increased to 3
  handsPlayed: 0,
  maxHands: 3,
  roundScore: 0,
  ante: 1,
  blindIndex: 0,
  targetScore: 100,
  currency: 2,  // Changed from 5 to 2
  items: [],
  shopItems: [],
  shopPurchases: 0,
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...INITIAL_STATE,

  startRun() {
    const config = getBlindConfig(1, 0)
    set({
      phase: 'menu',
      pool: initPool(),
      discardPool: [],
      hand: [],
      chain: { tiles: [], openEnd: 0 },
      anchorTile: null, // No anchor at start of run
      discardCount: 0,
      maxDiscards: 3,  // Increased to 3
      handsPlayed: 0,
      maxHands: 3,
      roundScore: 0,
      ante: 1,
      blindIndex: 0,
      targetScore: config.targetScore,
      currency: 2,  // Changed from 5 to 2
      items: [],
      shopItems: [],
      shopPurchases: 0,
      lastScore: undefined,
      bossModifier: undefined,
    })
  },

  startRound() {
    const state = get()
    const { bossModifier } = state
    
    // Hand size starts at 6 (max hand size)
    const handSize = bossModifier?.type === 'reduced_hand' ? bossModifier.size : 6
    const maxDiscards = bossModifier?.type === 'no_discards' ? 0 : 3  // Increased to 3
    const { hand, pool: poolAfterDeal } = dealHand(state.pool, handSize)

    set({
      pool: poolAfterDeal,
      discardPool: [],  // Reset discard pool at start of round
      hand,
      chain: { tiles: [], openEnd: 0 },
      discardCount: 0,
      maxDiscards,
      handsPlayed: 0,
      maxHands: 3,
      roundScore: 0,
      phase: 'round',
    })
  },

  placeTile(tile: Tile) {
    const state = get()
    if (state.phase !== 'round') return
    const { chain, hand, anchorTile } = state
    // Removed board size limit - can play any number of tiles
    const newChain = chain.tiles.length === 0 ? initChain(tile, anchorTile || undefined) : placeOnChain(chain, tile)
    const newHand = hand.filter(t => t.id !== tile.id)
    set({ chain: newChain, hand: newHand })
  },

  discardSelected(tiles: Tile[]) {
    const state = get()
    if (state.phase !== 'round') return
    if (!canDiscard(state)) return
    if (tiles.length === 0) return

    // Remove selected tiles from hand
    let newHand = state.hand
    for (const tile of tiles) {
      newHand = newHand.filter(t => t.id !== tile.id)
    }

    // DISCARD MECHANIC: Discard = Draw 1 (1:1 ratio)
    // Draw the same number of tiles that were discarded
    const drawCount = tiles.length
    
    // Discarded tiles go to discard pool
    let newDiscardPool = [...state.discardPool, ...tiles]
    
    // Draw tiles from the main pool (1:1 ratio)
    let newPool = state.pool
    const { hand: drawnTiles, pool: poolAfterDraw } = dealHand(newPool, drawCount)
    newPool = poolAfterDraw
    
    // If pool is empty after drawing, shuffle discard pool into pool
    if (newPool.length === 0 && newDiscardPool.length > 0) {
      newPool = [...newDiscardPool]
      // Reset discard pool since we used it
      newDiscardPool = []
    }
    
    const finalHand = [...newHand, ...drawnTiles]
    const newDiscardCountUsed = state.discardCount + 1

    set({
      hand: finalHand,
      pool: newPool,
      discardPool: newDiscardPool,
      discardCount: newDiscardCountUsed,
      // Chain stays as is - don't clear it
    })
  },

  undoLastTile() {
    const state = get()
    if (state.phase !== 'round') return
    if (state.chain.tiles.length === 0) return

    const tiles = state.chain.tiles
    const lastPlaced = tiles[tiles.length - 1]
    const newTiles = tiles.slice(0, -1)
    const prevOpenEnd = newTiles.length > 0
      ? (newTiles[newTiles.length - 1].flipped
          ? newTiles[newTiles.length - 1].tile.left
          : newTiles[newTiles.length - 1].tile.right)
      : 0

    set({
      chain: { tiles: newTiles, openEnd: prevOpenEnd },
      hand: [...state.hand, lastPlaced.tile],
    })
  },

  playHand() {
    const state = get()
    if (state.phase !== 'round') return
    if (state.chain.tiles.length === 0) return

    // Use Domino Soul evaluation (anchor system)
    const result = evaluateRoundWithAnchor(
      state.chain, 
      state.hand,
      state.anchorTile,
      state.targetScore, 
      state.bossModifier,
      state.items,
      state.handsPlayed,
      state.maxHands
    )
    
    const newRoundScore = state.roundScore + result.finalScore
    const newHandsPlayed = state.handsPlayed + 1
    const handsRemaining = state.maxHands - newHandsPlayed

    const cleared = newRoundScore >= state.targetScore
    const outOfHands = handsRemaining <= 0

    // Set anchor tile for next hand (last tile of current chain)
    const newAnchorTile = state.chain.tiles.length > 0 
      ? state.chain.tiles[state.chain.tiles.length - 1].tile 
      : null

    if (cleared || outOfHands) {
      // If cleared, generate random shop items for the shop phase
      const shopItems = cleared ? generateRandomShopItems() : []
      
      // Calculate gold earned based on hands remaining at end of round
      const finalHandsRemaining = Math.max(0, handsRemaining)
      const goldEarned = 1 + finalHandsRemaining
      
      set({
        lastScore: { ...result, finalScore: newRoundScore, cleared },
        roundScore: newRoundScore,
        handsPlayed: newHandsPlayed,
        anchorTile: null, // Reset anchor when round ends
        currency: state.currency + goldEarned, // Add gold earned once at end of round
        phase: cleared ? 'shop' : 'game_over',
        shopItems,
        shopPurchases: 0, // Reset purchase counter for new shop visit
      })
      return
    }

    // POST-PLAY REPLENISH: Draw back up to 6 tiles
    const replenishTarget = 6
    const currentHandSize = state.hand.length
    
    // Calculate how many tiles to draw to reach 6
    let tilesToDraw = 0
    if (currentHandSize < replenishTarget) {
      tilesToDraw = replenishTarget - currentHandSize
    }
    
    // Draw from main pool
    let newPool = state.pool
    let newDiscardPool = state.discardPool
    const { hand: drawnTiles, pool: poolAfterDraw } = dealHand(newPool, tilesToDraw)
    newPool = poolAfterDraw
    
    // If pool is empty after drawing, shuffle discard pool into pool
    if (newPool.length === 0 && newDiscardPool.length > 0) {
      newPool = [...newDiscardPool]
      newDiscardPool = []
    }
    
    // Keep unplayed tiles and add drawn tiles
    const finalHand = [...state.hand, ...drawnTiles]

    set({
      lastScore: result,
      roundScore: newRoundScore,
      handsPlayed: newHandsPlayed,
      anchorTile: newAnchorTile, // Set anchor for next hand
      chain: { tiles: [], openEnd: 0 },
      hand: finalHand,
      pool: newPool,
      discardPool: newDiscardPool,
      discardCount: 0,
      // Don't add gold here - only add when round ends
    })
  },

  leaveShop() {
    const state = get()
    const next = nextBlind(state)
    const isBoss = next.blindIndex === 2

    // Refresh pool at start of new ante (after boss match)
    const isNewAnte = isBoss
    const newPool = isNewAnte ? initPool() : state.pool

    set({ 
      ...next, 
      pool: newPool,
      discardPool: [],  // Reset discard pool
      shopItems: [],    // Clear shop items
      shopPurchases: 0, // Reset purchase counter
      phase: isBoss ? 'boss_intro' : 'round' 
    })
    if (!isBoss) get().startRound()
  },

  purchaseItem(item: ShopItem) {
    const state = get()
    // Check if player already has 5 upgrades total
    if (state.items.length >= 5) return
    // Check if player has already made 3 purchases in this shop visit
    if (state.shopPurchases >= 3) return
    
    // Purchase the item and increment shop purchases counter
    const newState = purchaseItemFn(state, item)
    set({
      ...newState,
      shopPurchases: state.shopPurchases + 1,
    })
  },

  sellItem(item: ShopItem) {
    const state = get()
    set(sellItemFn(state, item))
  },
}))
