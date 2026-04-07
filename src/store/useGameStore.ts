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
  playHand(): void
  leaveShop(): void
  purchaseItem(item: ShopItem): void
  sellItem(item: ShopItem): void
  startDebugRun(): void
  setDebugItems(items: ShopItem[]): void
  setDebugBoss(boss: import('../game/types').BossModifier | null): void
}

const INITIAL_STATE: GameState & { debugMode: boolean } = {
  phase: 'menu',
  pool: [],
  discardPool: [],
  hand: [],
  chain: { tiles: [], openEnd: 0 },
  anchorTile: null,
  discardCount: 0,
  maxDiscards: 2,
  handsPlayed: 0,
  maxHands: 3,
  roundScore: 0,
  ante: 1,
  blindIndex: 0,
  targetScore: 100,
  currency: 2,
  items: [],
  shopItems: [],
  shopPurchases: 0,
  debugMode: false,
  zeroWasteBonus: 0,
  ghostPipeActive: false,
}

export const useGameStore = create<GameState & { debugMode: boolean } & GameActions>((set, get) => ({
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
      maxDiscards: 2,  // Increased to 3
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
    const { bossModifier, items } = state
    
    // Hand size is capped at 6
    const handSize = bossModifier?.type === 'reduced_hand' ? bossModifier.size : 6
    
    // Calculate max hands: base 3 + bigger_sack upgrades
    let baseMaxHands = 3
    for (const item of items) {
      if (item.effect.type === 'bigger_sack') {
        baseMaxHands += item.effect.amount
      }
    }
    
    const maxDiscards = bossModifier?.type === 'no_discards' ? 0 : 2
    const { hand, pool: poolAfterDeal } = dealHand(state.pool, handSize)

    set({
      pool: poolAfterDeal,
      discardPool: [],
      hand,
      chain: { tiles: [], openEnd: 0 },
      discardCount: 0,
      maxDiscards,
      handsPlayed: 0,
      maxHands: baseMaxHands,
      roundScore: 0,
      phase: 'round',
      anchorTile: null,
      zeroWasteBonus: 0,
      ghostPipeActive: false,
    })
  },

  placeTile(tile: Tile) {
    const state = get()
    if (state.phase !== 'round') return
    const { chain, hand, anchorTile } = state
    // When ghost pipe is active and this is the first tile, force no broken link
    const isFirstTile = chain.tiles.length === 0
    let newChain = isFirstTile ? initChain(tile, anchorTile || undefined) : placeOnChain(chain, tile)
    // Ghost Pipe: suppress broken link on first tile
    if (isFirstTile && state.ghostPipeActive && newChain.tiles.length > 0 && newChain.tiles[0].brokenLink) {
      newChain = {
        ...newChain,
        tiles: [{ ...newChain.tiles[0], brokenLink: false }, ...newChain.tiles.slice(1)]
      }
    }
    const newHand = hand.filter(t => t.id !== tile.id)
    // Ghost Pipe consumed after first tile
    const ghostPipeActive = isFirstTile ? false : state.ghostPipeActive
    set({ chain: newChain, hand: newHand, ghostPipeActive })
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
      state.maxHands,
      state.currency,
      state.discardCount,
      state.maxDiscards,
      state.zeroWasteBonus,
      state.ghostPipeActive
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
    
    console.log('playHand - current anchorTile:', state.anchorTile)
    console.log('playHand - newAnchorTile for next hand:', newAnchorTile)
    console.log('playHand - handsPlayed:', state.handsPlayed, '→', newHandsPlayed)

    if (cleared || outOfHands) {
      // If cleared, generate random shop items for the shop phase
      const shopItems = cleared ? generateRandomShopItems() : []
      
      // Calculate gold earned based on hands remaining at end of round
      const finalHandsRemaining = Math.max(0, handsRemaining)
      const goldPerRoundBonus = state.items.filter(i => i.effect.type === 'gold_per_round').length
      const goldEarned = 1 + finalHandsRemaining + goldPerRoundBonus

      set({
        lastScore: { ...result, finalScore: newRoundScore, cleared },
        roundScore: newRoundScore,
        handsPlayed: newHandsPlayed,
        anchorTile: null,
        currency: state.currency + goldEarned,
        phase: cleared ? 'shop' : 'game_over',
        shopItems,
        shopPurchases: 0,
        zeroWasteBonus: 0,
        ghostPipeActive: false,
      })
      return
    }

    // POST-PLAY REPLENISH: Reset pool and deal fresh hand of 6
    const replenishTarget = 6
    let newPool = initPool()
    let newDiscardPool: typeof state.discardPool = []
    const { hand: drawnTiles, pool: poolAfterDraw } = dealHand(newPool, replenishTarget)
    newPool = poolAfterDraw

    // Fresh hand from reset pool
    const finalHand = drawnTiles

    set({
      lastScore: result,
      roundScore: newRoundScore,
      handsPlayed: newHandsPlayed,
      anchorTile: newAnchorTile,
      chain: { tiles: [], openEnd: 0 },
      hand: finalHand,
      pool: newPool,
      discardPool: newDiscardPool,
      discardCount: 0,
      currency: state.currency + (result.zeroWasteTriggered ? 3 : 0) + result.bonusGoldMidHand,
      zeroWasteBonus: result.zeroWasteTriggered ? 10 : 0,
      // ghost_pipe reactivates each hand if anchor exists
      ghostPipeActive: newAnchorTile !== null && state.items.some(i => i.effect.type === 'ghost_pipe'),
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
      items: state.items,  // PRESERVE items across rounds
      currency: state.currency,  // PRESERVE currency
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

  startDebugRun() {
    const pool = initPool()
    const { hand, pool: poolAfterDeal } = dealHand(pool, 6)
    set({
      ...INITIAL_STATE,
      debugMode: true,
      phase: 'round',
      pool: poolAfterDeal,
      hand,
      targetScore: 0, // no target in debug
      currency: 999,
    })
  },

  setDebugItems(items: ShopItem[]) {
    const state = get()
    let maxHands = 3
    let maxDiscards = state.bossModifier?.type === 'no_discards' ? 0 : 2
    for (const item of items) {
      if (item.effect.type === 'bigger_sack') maxHands += item.effect.amount
      if (item.effect.type === 'extra_discard') maxDiscards += item.effect.amount
    }
    set({ items, maxHands, maxDiscards })
  },

  setDebugBoss(boss) {
    const state = get()
    const baseDiscards = state.items.reduce((sum, item) =>
      item.effect.type === 'extra_discard' ? sum + item.effect.amount : sum, 2)
    const maxDiscards = boss?.type === 'no_discards' ? 0 : baseDiscards
    set({ bossModifier: boss ?? undefined, maxDiscards })
  },
}))
