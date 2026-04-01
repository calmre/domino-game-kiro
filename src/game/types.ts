// Domain types for Domino Balatro

/** A single domino tile. id is canonical (left <= right), e.g. "2-5". */
export interface Tile {
  left: number   // 0–6
  right: number  // 0–6
  id: string     // canonical form: `${left}-${right}` where left <= right
}

/** A tile placed in the chain, with orientation info. */
export interface PlacedTile {
  tile: Tile
  /** true if the tile was placed right-end first (flipped to match the open end) */
  flipped: boolean
  /** true if this tile's connecting pip did not match the previous open end */
  brokenLink: boolean
}

/** The ordered sequence of tiles on the board. */
export interface Chain {
  tiles: PlacedTile[]
  /** The pip value at the free (right) end of the chain */
  openEnd: number
}

/** The finite pool of available tiles. Starts at 28, shrinks as tiles are drawn/discarded. */
export type Pool = Tile[]

/** The player's current hand — up to 5 tiles. */
export type Hand = Tile[]

/** Breakdown of how the multiplier was computed. */
export interface MultiplierBreakdown {
  chainLength: number   // based on longest unbroken segment
  chainBonus: number    // additive bonus: +2 for 3 tiles, +3 for 4, +4 for 5
  doubleMultiplier: number // multiplicative: x1.25 per double
  runMultiplier: number    // multiplicative: x1.5 for 3-tile run, x1.75 for 5-tile run
  brokenLinks: number   // count of broken link connections
  dominoBonus: boolean  // x1.75 multiplier if hand is empty (Domino! bonus)
  total: number         // final multiplier after all calculations
}

/** Configuration for a single blind. */
export interface BlindConfig {
  ante: number
  blindIndex: number      // 0–2 = standard blind, 3 = boss blind
  targetScore: number
  isBoss: boolean
  bossModifier?: BossModifier
}

/** A gameplay modifier applied during a boss match. */
export type BossModifier =
  | { type: 'sandpaper'; name: 'The Sandpaper'; description: 'Run Bonus is disabled this round.' }
  | { type: 'lead_weight'; name: 'The Lead Weight'; description: 'Each hand loses 5 from its base score.' }
  | { type: 'frozen_bone'; name: 'The Frozen Bone'; description: 'Double tiles contribute 0 pips and 0 bonus.' }
  | { type: 'reduced_hand'; name: 'The Small Hand'; description: 'Hand size reduced to 4 tiles.'; size: number }
  | { type: 'no_discards'; name: 'The Iron Grip'; description: 'No discards allowed this round.' }

/** An item available in the shop. */
export interface ShopItem {
  id: string
  name: string
  description: string
  cost: number
  effect: ItemEffect
}

/** The effect applied when a shop item is purchased. */
export type ItemEffect =
  | { type: 'extra_discard'; amount: number }
  | { type: 'score_bonus'; flat: number }
  | { type: 'multiplier_bonus'; amount: number }
  | { type: 'restore_tile'; tile: Tile }
  | { type: 'chain_bonus'; amount: number }
  | { type: 'double_boost'; amount: number }
  | { type: 'zero_gravity' }
  | { type: 'heavy_lead' }
  | { type: 'long_link'; amount: number }
  | { type: 'sequential_spark' }
  | { type: 'perfect_loop' }
  | { type: 'bigger_sack'; amount: number }
  | { type: 'slim_fit' }

/** The complete game state. */
export interface GameState {
  phase: 'menu' | 'round' | 'scoring' | 'shop' | 'boss_intro' | 'game_over'
  pool: Pool
  discardPool: Pool        // Tiles that have been discarded (cannot be played this round)
  hand: Hand
  chain: Chain
  anchorTile: Tile | null    // Last tile from previous hand (persistent board state)
  discardCount: number      // discards used this round
  maxDiscards: number       // default 3, may be modified by boss modifier
  handsPlayed: number       // hands played this blind (max 3)
  maxHands: number          // default 3
  roundScore: number        // accumulated score across hands this blind
  ante: number
  blindIndex: number        // 0–3
  targetScore: number
  currency: number
  items: ShopItem[]
  shopItems: ShopItem[]     // Current shop offerings (3 random items)
  shopPurchases: number     // Number of purchases made in current shop visit (max 3)
  lastScore?: ScoringResult
  bossModifier?: BossModifier
}

/** The result of scoring a completed round. */
export interface ScoringResult {
  baseScore: number
  multiplier: MultiplierBreakdown
  finalScore: number
  cleared: boolean
  goldEarned: number
}
