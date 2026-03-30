import { create } from 'zustand'
import type { GameState, ShopItem, Tile } from '../game/types'
import { initPool, dealHand, removeTile } from '../game/pool'
import { initChain, placeTile as placeOnChain } from '../game/chain'
import { canDiscard, evaluateRound } from '../game/round'
import { getBlindConfig, nextBlind } from '../game/progression'
import { purchaseItem as purchaseItemFn } from '../game/shop'

interface GameActions {
  startRun(): void
  startRound(): void
  placeTile(tile: Tile): void
  discardSelected(tiles: Tile[]): void
  undoLastTile(): void
  playHand(): void   // score current chain, redeal, decrement hands remaining
  leaveShop(): void
  purchaseItem(item: ShopItem): void
}

const INITIAL_STATE: GameState = {
  phase: 'menu',
  pool: [],
  hand: [],
  chain: { tiles: [], openEnd: 0 },
  discardCount: 0,
  maxDiscards: 4,
  handsPlayed: 0,
  maxHands: 3,
  roundScore: 0,
  ante: 1,
  blindIndex: 0,
  targetScore: 100,
  currency: 5,
  items: [],
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...INITIAL_STATE,

  startRun() {
    const config = getBlindConfig(1, 0)
    set({
      phase: 'menu',
      pool: initPool(),
      hand: [],
      chain: { tiles: [], openEnd: 0 },
      discardCount: 0,
      maxDiscards: 4,
      handsPlayed: 0,
      maxHands: 3,
      roundScore: 0,
      ante: 1,
      blindIndex: 0,
      targetScore: config.targetScore,
      currency: 5,
      items: [],
      lastScore: undefined,
      bossModifier: undefined,
    })
  },

  startRound() {
    const state = get()
    const { bossModifier } = state
    const handSize = bossModifier?.type === 'reduced_hand' ? bossModifier.size : 7
    const maxDiscards = bossModifier?.type === 'no_discards' ? 0 : 4
    const { hand, pool: poolAfterDeal } = dealHand(state.pool, handSize)

    set({
      pool: poolAfterDeal,
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
    const { chain, hand } = state
    if (chain.tiles.length >= 5) return
    const newChain = chain.tiles.length === 0 ? initChain(tile) : placeOnChain(chain, tile)
    const newHand = hand.filter(t => t.id !== tile.id)
    set({ chain: newChain, hand: newHand })
  },

  discardSelected(tiles: Tile[]) {
    const state = get()
    if (state.phase !== 'round') return
    if (!canDiscard(state)) return
    if (tiles.length === 0) return

    // Return any tiles on the board back to hand first
    const boardTiles = state.chain.tiles.map(pt => pt.tile)
    const handWithBoard = [...state.hand, ...boardTiles]

    // Now remove selected tiles from the combined hand and pool permanently
    let newPool = state.pool
    let newHand = handWithBoard
    for (const tile of tiles) {
      newHand = newHand.filter(t => t.id !== tile.id)
      newPool = removeTile(newPool, tile)
    }

    // Refill to 7
    const targetHandSize = 7
    const needed = targetHandSize - newHand.length
    const { hand: drawnTiles, pool: finalPool } = dealHand(newPool, needed)
    const finalHand = [...newHand, ...drawnTiles]
    const newDiscardCount = state.discardCount + 1

    set({
      hand: finalHand,
      pool: finalPool,
      discardCount: newDiscardCount,
      chain: { tiles: [], openEnd: 0 },
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

    const result = evaluateRound(state.chain, state.targetScore, state.bossModifier)
    const newRoundScore = state.roundScore + result.finalScore
    const newHandsPlayed = state.handsPlayed + 1
    const handsRemaining = state.maxHands - newHandsPlayed

    const cleared = newRoundScore >= state.targetScore
    const outOfHands = handsRemaining <= 0

    if (cleared || outOfHands) {
      set({
        lastScore: { ...result, finalScore: newRoundScore, cleared },
        roundScore: newRoundScore,
        handsPlayed: newHandsPlayed,
        phase: cleared ? 'shop' : 'game_over',
      })
      return
    }

    const handSize = state.bossModifier?.type === 'reduced_hand' ? 4 : 7
    const { hand, pool: newPool } = dealHand(state.pool, handSize)

    set({
      lastScore: result,
      roundScore: newRoundScore,
      handsPlayed: newHandsPlayed,
      chain: { tiles: [], openEnd: 0 },
      hand,
      pool: newPool,
      discardCount: 0,
    })
  },

  leaveShop() {
    const state = get()
    const next = nextBlind(state)
    const isBoss = next.blindIndex === 2

    set({ ...next, phase: isBoss ? 'boss_intro' : 'round' })
    if (!isBoss) get().startRound()
  },

  purchaseItem(item: ShopItem) {
    const state = get()
    set(purchaseItemFn(state, item))
  },
}))
