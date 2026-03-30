# Design Document: Domino Balatro

## Overview

Domino Balatro is a browser-based roguelike deckbuilder where players build chains of domino tiles to score points against escalating target scores. The game is inspired by Balatro but replaces poker cards with a standard double-6 domino set (28 tiles).

The core loop is:
1. Start a round with a tile already on the board
2. Play tiles from your hand to extend the chain (matching pip values)
3. Discard tiles you can't use (permanently removed from the pool)
4. End the round to score — base score × multiplier must beat the blind's target
5. Visit the shop to buy upgrades
6. Progress through 3 standard blinds + 1 boss blind per ante

The game is implemented as a TypeScript/React single-page application with all state managed client-side. No backend is required.

---

## Architecture

The application follows a layered architecture separating game logic from UI:

```
┌─────────────────────────────────────────┐
│              React UI Layer             │
│  (components, rendering, user input)    │
├─────────────────────────────────────────┤
│           Game State Layer              │
│  (useGameStore - Zustand store)         │
├─────────────────────────────────────────┤
│           Game Logic Layer              │
│  (pure functions: scoring, validation,  │
│   chain rules, progression)             │
├─────────────────────────────────────────┤
│           Domain Types Layer            │
│  (Tile, Chain, Hand, Pool, GameState)   │
└─────────────────────────────────────────┘
```

Key design decisions:
- **Pure game logic**: All scoring, validation, and chain rules are pure functions with no side effects, making them easy to test with property-based testing.
- **Zustand for state**: A single store holds all game state; UI components read from it and dispatch actions.
- **Immutable state updates**: State transitions produce new state objects rather than mutating in place.

---

## Components and Interfaces

### UI Components

```
App
├── GameScreen
│   ├── BoardView          — displays the chain of tiles
│   ├── HandView           — displays the player's hand
│   ├── ScorePanel         — shows base score, multiplier breakdown, target
│   ├── ActionBar          — end round / discard buttons + counters
│   └── StatusBar          — ante, blind, pool count, discards remaining
├── ShopScreen
│   ├── ShopItemList       — available items with costs
│   └── CurrencyDisplay    — player's current currency
├── GameOverScreen         — run-end summary
└── BossBlindBanner        — displayed before boss blind begins
```

### Game Logic Interfaces

```typescript
// Core action functions (pure)
function validatePlacement(chain: Chain, tile: Tile): boolean
function placeТile(chain: Chain, tile: Tile): Chain
function calculateBaseScore(chain: Chain): number
function calculateMultiplier(chain: Chain): MultiplierBreakdown
function calculateFinalScore(chain: Chain): number
function isRoundOver(hand: Hand, chain: Chain, discards: number): boolean
```

### Store Actions

```typescript
interface GameActions {
  startRun(): void
  startRound(): void
  placeTile(tile: Tile): void
  discardTile(tile: Tile): void
  endRound(): void
  leaveShop(): void
  purchaseItem(item: ShopItem): void
}
```

---

## Data Models

### Tile

```typescript
interface Tile {
  left: number   // 0–6
  right: number  // 0–6
  id: string     // e.g. "2-5" (canonical: left <= right)
}
```

A tile is canonical when `left <= right`. The id is always the canonical form so `[2|5]` and `[5|2]` are the same tile. When placed in a chain, orientation matters (which end connects).

### Pool

```typescript
type Pool = Tile[]  // 28 tiles at run start, shrinks as tiles are drawn/discarded
```

The pool is the source of truth for tile availability. Drawing and discarding both remove tiles from the pool; drawn tiles can return to the pool only if the round resets (not in normal play).

### Hand

```typescript
type Hand = Tile[]  // max 5 tiles
```

### PlacedTile

```typescript
interface PlacedTile {
  tile: Tile
  flipped: boolean  // true if tile was placed right-end first
}
```

When a tile is placed, it may need to be "flipped" so the matching pip connects to the chain's open end.

### Chain

```typescript
interface Chain {
  tiles: PlacedTile[]
  openEnd: number  // the pip value at the free end of the chain
}
```

The chain always has exactly one open end (the right side of the last placed tile). The left end is fixed (the starting tile's left pip).

### MultiplierBreakdown

```typescript
interface MultiplierBreakdown {
  chainLength: number    // 1, 2, or 3
  doubleBonus: number    // 0.5 per double tile in chain
  runBonus: number       // 1 per consecutive pip-increment connection
  total: number          // chainLength + doubleBonus + runBonus
}
```

### BlindConfig

```typescript
interface BlindConfig {
  ante: number
  blindIndex: number   // 0–2 = standard, 3 = boss
  targetScore: number
  isBoss: boolean
  bossModifier?: BossModifier
}
```

### BossModifier

```typescript
type BossModifier =
  | { type: 'no_doubles' }          // doubles cannot be played
  | { type: 'reduced_hand'; size: 4 }  // hand size reduced to 4
  | { type: 'no_discards' }         // discards not allowed
```

### ShopItem

```typescript
interface ShopItem {
  id: string
  name: string
  description: string
  cost: number
  effect: ItemEffect
}

type ItemEffect =
  | { type: 'extra_discard'; amount: number }
  | { type: 'score_bonus'; flat: number }
  | { type: 'multiplier_bonus'; amount: number }
  | { type: 'restore_tile'; tile: Tile }  // adds a discarded tile back to pool
```

### GameState

```typescript
interface GameState {
  phase: 'menu' | 'round' | 'scoring' | 'shop' | 'boss_intro' | 'game_over'
  pool: Pool
  hand: Hand
  chain: Chain
  discardCount: number        // discards used this round
  maxDiscards: number         // default 4, may be modified
  ante: number
  blindIndex: number          // 0–3
  targetScore: number
  currency: number
  items: ShopItem[]
  lastScore?: ScoringResult
  bossModifier?: BossModifier
}

interface ScoringResult {
  baseScore: number
  multiplier: MultiplierBreakdown
  finalScore: number
  cleared: boolean
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Pool initialization completeness

*For any* new run, the pool shall contain exactly 28 tiles, one for each unique combination (i, j) where 0 ≤ i ≤ j ≤ 6, with no duplicates.

**Validates: Requirements 1.1, 13.1**

---

### Property 2: Pool removal invariant

*For any* pool and any tile removed from it (whether by drawing into the hand or by discarding), that tile shall no longer be present in the pool after the operation, and the pool size shall decrease by exactly 1.

**Validates: Requirements 1.2, 1.4, 5.2**

---

### Property 3: Hand size after deal

*For any* pool of size n, dealing a hand shall result in a hand of size min(5, n) and a pool of size max(0, n - 5).

**Validates: Requirements 2.1, 2.3**

---

### Property 4: Round initialization chain

*For any* round start, the chain shall contain exactly 1 tile (the starting tile), and that tile shall not be present in the pool.

**Validates: Requirements 3.1, 3.2**

---

### Property 5: Placement validation correctness

*For any* chain and any tile, `validatePlacement(chain, tile)` returns true if and only if the tile has at least one pip value equal to `chain.openEnd`. Furthermore, placing a valid tile increases the chain length by 1 and removes the tile from the hand.

**Validates: Requirements 4.1, 4.2, 4.3**

---

### Property 6: Discard limit enforcement

*For any* round state where `discardCount >= maxDiscards`, attempting to discard shall be rejected and the game state shall remain unchanged.

**Validates: Requirements 5.1, 5.4**

---

### Property 7: Base score equals sum of all pips

*For any* chain of tiles, `calculateBaseScore(chain)` shall equal the sum of all left and right pip values across every tile in the chain.

**Validates: Requirements 6.1, 6.2**

---

### Property 8: Chain length multiplier correctness

*For any* chain, the chain length multiplier shall be: 1 if length < 3, 1 if length == 3, 2 if length == 4, and 3 if length >= 5.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

---

### Property 9: Double bonus accumulation

*For any* chain, the double bonus component of the multiplier shall equal 0.5 × (number of double tiles in the chain), where a double tile has equal left and right pip values.

**Validates: Requirements 7.5**

---

### Property 10: Run bonus accumulation

*For any* chain, the run bonus component of the multiplier shall equal the count of adjacent tile connections where the shared pip value increases by exactly 1 from one connection to the next.

**Validates: Requirements 7.6**

---

### Property 11: Final score calculation

*For any* chain, `calculateFinalScore(chain)` shall equal `calculateBaseScore(chain) × calculateMultiplier(chain).total`.

**Validates: Requirements 8.1**

---

### Property 12: Blind outcome determination

*For any* final score and target score, the blind is cleared if and only if `finalScore >= targetScore`, and failed if and only if `finalScore < targetScore`.

**Validates: Requirements 8.3, 8.4**

---

### Property 13: Voluntary round end condition

*For any* game state, the player may voluntarily end the round if and only if the chain contains more than 1 tile (i.e., at least 1 tile placed beyond the starting tile).

**Validates: Requirements 9.1**

---

### Property 14: Automatic round end condition

*For any* game state where no tile in the hand has a pip matching `chain.openEnd` and `discardCount >= maxDiscards`, the round shall automatically end.

**Validates: Requirements 9.2**

---

### Property 15: Ante structure invariant

*For any* ante, blind indices 0–2 shall be standard blinds and blind index 3 shall be a boss blind with a non-null `bossModifier`.

**Validates: Requirements 10.1, 11.1**

---

### Property 16: Blind progression

*For any* cleared blind at index i in ante a: if i < 3, the next state shall be phase 'shop' with the same ante and blind index i+1 pending; if i == 3, the next state after shop shall be ante a+1, blind index 0.

**Validates: Requirements 10.2, 10.3, 12.1, 12.5**

---

### Property 17: Run failure on blind fail

*For any* game state where the final score is less than the target score, the resulting phase shall be 'game_over'.

**Validates: Requirements 10.4**

---

### Property 18: Boss modifier cleared after boss blind

*For any* game state after clearing a boss blind, the subsequent standard blind rounds shall have no active `bossModifier`.

**Validates: Requirements 11.3**

---

### Property 19: Purchase correctness and currency guard

*For any* shop item and player state: if `currency >= item.cost`, purchasing the item shall decrease currency by exactly `item.cost` and apply the item's effect; if `currency < item.cost`, the purchase shall be rejected and the state shall remain unchanged.

**Validates: Requirements 12.3, 12.4**

---

### Property 20: Run reset to initial state

*For any* completed or failed run, calling `startRun()` shall produce a state with: pool of 28 tiles, currency at starting value, empty items list, ante == 1, blindIndex == 0.

**Validates: Requirements 13.1, 13.2, 13.3**

---

## Error Handling

### Invalid Tile Placement
- `validatePlacement` returns `false` for non-matching tiles; the UI displays an error message and the state is unchanged.
- Attempting to place a tile not in the hand is a no-op with an error message.

### Empty Pool
- Drawing from an empty pool is a no-op; the hand may have fewer than 5 tiles.
- The UI always shows the pool count so the player is aware.

### Discard Exhaustion
- After 4 discards, the discard action is disabled in the UI and returns an error if called programmatically.

### Insufficient Currency
- Purchase actions check `currency >= cost` before applying; rejected purchases show an "insufficient funds" message.

### Boss Modifier Conflicts
- The `no_doubles` modifier causes `validatePlacement` to additionally reject double tiles.
- The `no_discards` modifier sets `maxDiscards = 0` for that round.
- The `reduced_hand` modifier caps hand size at 4 during that round's deal.

### Round End with Empty Chain
- Ending a round with only the starting tile (chain length == 1) is not permitted; the UI disables the "End Round" button until at least 1 additional tile is placed.

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:
- Unit tests cover specific examples, integration points, and edge cases.
- Property-based tests verify universal correctness across all inputs.

### Property-Based Testing

**Library**: [fast-check](https://github.com/dubzzz/fast-check) (TypeScript)

Each property-based test must run a minimum of 100 iterations. Tests are tagged with a comment referencing the design property they validate.

Tag format: `// Feature: domino-balatro, Property {N}: {property_text}`

Each correctness property from the design document must be implemented by exactly one property-based test.

**Arbitraries to define:**
- `arbTile`: generates a random valid tile (left 0–6, right 0–6, left <= right)
- `arbPool`: generates a subset of the 28-tile pool
- `arbChain`: generates a valid chain (each tile's connecting pip matches the previous open end)
- `arbGameState`: generates a valid mid-round game state

**Example property test structure:**
```typescript
// Feature: domino-balatro, Property 7: Base score equals sum of all pips
it('base score equals sum of all pips', () => {
  fc.assert(
    fc.property(arbChain, (chain) => {
      const expected = chain.tiles.reduce(
        (sum, pt) => sum + pt.tile.left + pt.tile.right, 0
      );
      expect(calculateBaseScore(chain)).toBe(expected);
    }),
    { numRuns: 100 }
  );
});
```

### Unit Testing

Unit tests focus on:
- Specific scoring examples (e.g., a known chain with known score)
- Edge cases: empty pool, chain of length 1, all-doubles chain, maximum run chain
- Integration: full round lifecycle (deal → place → score → progress)
- Boss modifier enforcement (no_doubles rejects doubles, no_discards rejects discards)
- Shop purchase flow (sufficient and insufficient currency)

**Framework**: Vitest

### Test File Organization

```
src/
  game/
    __tests__/
      pool.test.ts          — Properties 1, 2, 3
      chain.test.ts         — Properties 4, 5
      scoring.test.ts       — Properties 7, 8, 9, 10, 11
      round.test.ts         — Properties 6, 12, 13, 14
      progression.test.ts   — Properties 15, 16, 17, 18
      shop.test.ts          — Property 19
      run.test.ts           — Property 20
```
