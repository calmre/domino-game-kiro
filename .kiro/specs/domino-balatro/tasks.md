# Implementation Plan: Domino Balatro

## Overview

Implement a browser-based roguelike deckbuilder using TypeScript and React. The implementation follows the layered architecture: domain types → pure game logic → Zustand store → React UI.

## Tasks

- [x] 1. Project setup and domain types
  - Scaffold a Vite + React + TypeScript project
  - Install dependencies: zustand, fast-check, vitest, @vitest/ui
  - Create `src/game/types.ts` with all domain interfaces: `Tile`, `PlacedTile`, `Chain`, `Pool`, `Hand`, `MultiplierBreakdown`, `BlindConfig`, `BossModifier`, `ShopItem`, `ItemEffect`, `GameState`, `ScoringResult`
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 2. Pool and hand logic
  - [x] 2.1 Implement pool initialization and tile draw/discard in `src/game/pool.ts`
    - `initPool(): Pool` — creates all 28 canonical tiles
    - `drawTile(pool: Pool): { tile: Tile; pool: Pool }` — removes and returns a random tile
    - `removeTile(pool: Pool, tile: Tile): Pool` — removes a specific tile
    - `dealHand(pool: Pool, count: number): { hand: Hand; pool: Pool }`
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.3_

  - [ ]* 2.2 Write property test for pool initialization (Property 1)
    - **Property 1: Pool initialization completeness**
    - **Validates: Requirements 1.1, 13.1**

  - [ ]* 2.3 Write property test for pool removal invariant (Property 2)
    - **Property 2: Pool removal invariant**
    - **Validates: Requirements 1.2, 1.4, 5.2**

  - [ ]* 2.4 Write property test for hand size after deal (Property 3)
    - **Property 3: Hand size after deal**
    - **Validates: Requirements 2.1, 2.3**

- [x] 3. Chain and placement logic
  - [x] 3.1 Implement chain operations in `src/game/chain.ts`
    - `initChain(tile: Tile): Chain` — creates a chain with one starting tile
    - `validatePlacement(chain: Chain, tile: Tile, bossModifier?: BossModifier): boolean`
    - `placeTile(chain: Chain, tile: Tile): Chain` — appends tile, updates openEnd
    - _Requirements: 3.1, 4.1, 4.2, 4.3, 11.1_

  - [ ]* 3.2 Write property test for round initialization chain (Property 4)
    - **Property 4: Round initialization chain**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 3.3 Write property test for placement validation correctness (Property 5)
    - **Property 5: Placement validation correctness**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Scoring logic
  - [x] 5.1 Implement scoring functions in `src/game/scoring.ts`
    - `calculateBaseScore(chain: Chain): number`
    - `calculateMultiplier(chain: Chain): MultiplierBreakdown`
    - `calculateFinalScore(chain: Chain): number`
    - _Requirements: 6.1, 6.2, 7.1–7.7, 8.1_

  - [ ]* 5.2 Write property test for base score (Property 7)
    - **Property 7: Base score equals sum of all pips**
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 5.3 Write property test for chain length multiplier (Property 8)
    - **Property 8: Chain length multiplier correctness**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [ ]* 5.4 Write property test for double bonus (Property 9)
    - **Property 9: Double bonus accumulation**
    - **Validates: Requirements 7.5**

  - [ ]* 5.5 Write property test for run bonus (Property 10)
    - **Property 10: Run bonus accumulation**
    - **Validates: Requirements 7.6**

  - [ ]* 5.6 Write property test for final score calculation (Property 11)
    - **Property 11: Final score calculation**
    - **Validates: Requirements 8.1**

- [x] 6. Round state logic
  - [x] 6.1 Implement round helpers in `src/game/round.ts`
    - `canDiscard(state: GameState): boolean`
    - `canEndRound(chain: Chain): boolean`
    - `isRoundOver(hand: Hand, chain: Chain, discardCount: number, maxDiscards: number): boolean`
    - `evaluateRound(chain: Chain, targetScore: number): ScoringResult`
    - _Requirements: 5.1, 5.4, 8.3, 8.4, 9.1, 9.2_

  - [ ]* 6.2 Write property test for discard limit enforcement (Property 6)
    - **Property 6: Discard limit enforcement**
    - **Validates: Requirements 5.1, 5.4**

  - [ ]* 6.3 Write property test for blind outcome determination (Property 12)
    - **Property 12: Blind outcome determination**
    - **Validates: Requirements 8.3, 8.4**

  - [ ]* 6.4 Write property test for voluntary round end condition (Property 13)
    - **Property 13: Voluntary round end condition**
    - **Validates: Requirements 9.1**

  - [ ]* 6.5 Write property test for automatic round end condition (Property 14)
    - **Property 14: Automatic round end condition**
    - **Validates: Requirements 9.2**

- [x] 7. Progression logic
  - [x] 7.1 Implement blind/ante progression in `src/game/progression.ts`
    - `getBlindConfig(ante: number, blindIndex: number): BlindConfig`
    - `nextBlind(state: GameState): Partial<GameState>` — advances blindIndex or ante
    - `getBossModifier(ante: number): BossModifier` — deterministic or random modifier per ante
    - _Requirements: 10.1, 10.2, 10.3, 11.1, 11.3_

  - [ ]* 7.2 Write property test for ante structure invariant (Property 15)
    - **Property 15: Ante structure invariant**
    - **Validates: Requirements 10.1, 11.1**

  - [ ]* 7.3 Write property test for blind progression (Property 16)
    - **Property 16: Blind progression**
    - **Validates: Requirements 10.2, 10.3, 12.1, 12.5**

  - [ ]* 7.4 Write property test for run failure on blind fail (Property 17)
    - **Property 17: Run failure on blind fail**
    - **Validates: Requirements 10.4**

  - [ ]* 7.5 Write property test for boss modifier cleared after boss blind (Property 18)
    - **Property 18: Boss modifier cleared after boss blind**
    - **Validates: Requirements 11.3**

- [x] 8. Shop logic
  - [x] 8.1 Implement shop functions in `src/game/shop.ts`
    - `canPurchase(state: GameState, item: ShopItem): boolean`
    - `purchaseItem(state: GameState, item: ShopItem): GameState`
    - `applyItemEffect(state: GameState, effect: ItemEffect): GameState`
    - `generateShopItems(): ShopItem[]`
    - _Requirements: 12.2, 12.3, 12.4_

  - [ ]* 8.2 Write property test for purchase correctness and currency guard (Property 19)
    - **Property 19: Purchase correctness and currency guard**
    - **Validates: Requirements 12.3, 12.4**

- [x] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Zustand game store
  - [x] 10.1 Create `src/store/useGameStore.ts` with Zustand store
    - Implement all `GameActions`: `startRun`, `startRound`, `placeTile`, `discardTile`, `endRound`, `leaveShop`, `purchaseItem`
    - Wire actions to pure game logic functions from previous tasks
    - Handle phase transitions: `menu → round → scoring → shop → boss_intro → round → game_over`
    - _Requirements: 1.2, 1.3, 1.4, 2.2, 3.1, 3.2, 4.2, 5.2, 5.3, 8.3, 8.4, 10.2, 10.3, 10.4, 12.3, 13.1, 13.2, 13.3_

  - [ ]* 10.2 Write property test for run reset to initial state (Property 20)
    - **Property 20: Run reset to initial state**
    - **Validates: Requirements 13.1, 13.2, 13.3**

- [x] 11. Core UI components
  - [x] 11.1 Create `src/components/BoardView.tsx`
    - Render the chain of `PlacedTile` items with pip display
    - Show the current open end pip value
    - _Requirements: 3.3, 4.4, 4.5_

  - [x] 11.2 Create `src/components/HandView.tsx`
    - Render each tile in the hand as a clickable element
    - Highlight tiles that are valid placements for the current open end
    - _Requirements: 2.4, 4.1_

  - [x] 11.3 Create `src/components/ScorePanel.tsx`
    - Display base score, each multiplier component, and final score
    - _Requirements: 6.3, 7.8, 8.2_

  - [x] 11.4 Create `src/components/ActionBar.tsx`
    - "End Round" button (disabled until chain length > 1)
    - "Discard" button (disabled when discards exhausted)
    - Show remaining discard count
    - _Requirements: 5.4, 5.5, 9.1_

  - [x] 11.5 Create `src/components/StatusBar.tsx`
    - Display ante number, blind number, pool count, target score
    - _Requirements: 1.5, 10.5, 10.6_

- [x] 12. Screen components and routing
  - [x] 12.1 Create `src/components/GameScreen.tsx`
    - Compose `BoardView`, `HandView`, `ScorePanel`, `ActionBar`, `StatusBar`
    - Connect to store via `useGameStore`
    - _Requirements: 4.4, 4.5_

  - [x] 12.2 Create `src/components/ShopScreen.tsx`
    - Render `ShopItemList` with item name, description, cost
    - Show `CurrencyDisplay`
    - "Leave Shop" button triggers `leaveShop` action
    - _Requirements: 12.1, 12.2, 12.4, 12.5_

  - [x] 12.3 Create `src/components/BossBlindBanner.tsx`
    - Display boss modifier description before the round begins
    - _Requirements: 11.2_

  - [x] 12.4 Create `src/components/GameOverScreen.tsx`
    - Show run summary (ante reached, blinds cleared)
    - "New Run" button triggers `startRun`
    - _Requirements: 10.4_

  - [x] 12.5 Wire phase-based rendering in `src/App.tsx`
    - Read `phase` from store and render the appropriate screen
    - _Requirements: 10.2, 10.3, 11.2, 12.1_

- [x] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 iterations per run
- Test files live under `src/game/__tests__/` as specified in the design
