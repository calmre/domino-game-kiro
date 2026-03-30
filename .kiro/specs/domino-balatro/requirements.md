# Requirements Document

## Introduction

Domino Balatro is a roguelike deckbuilder game inspired by Balatro, replacing poker cards with dominoes. Players build chains of domino tiles to score points, aiming to beat escalating target scores across blinds and antes. The game uses a standard double-6 domino set (28 tiles) as a finite pool. Between rounds, players visit a shop to acquire upgrades. The core loop revolves around strategic tile placement, chain building, and multiplier stacking.

## Glossary

- **Game**: The top-level system managing game state, progression, and transitions between phases.
- **Tile**: A single domino piece with two pip values (left and right), drawn from the Pool.
- **Pool**: The finite set of 28 standard double-6 domino tiles available in a run.
- **Hand**: The set of up to 5 Tiles held by the player at any time.
- **Chain**: The ordered sequence of Tiles placed on the Board during a round, connected by matching pip values.
- **Board**: The play area where the Chain is built.
- **Double**: A Tile where both pip values are equal (e.g., [4|4]).
- **Run**: A consecutive sequence of pip increments across adjacent Tile connections in the Chain (e.g., [2|3]-[3|4]).
- **Blind**: A single round with a target score the player must beat.
- **Ante**: A group of 3 standard Blinds followed by 1 Boss Blind.
- **Boss Blind**: A special Blind with a modifier that changes gameplay rules.
- **Shop**: The upgrade phase between Blinds where the player can purchase items.
- **Score**: The numeric result of evaluating the Chain at the end of a round.
- **Multiplier**: A numeric factor applied to the Base Score to produce the final Score.
- **Base Score**: The sum of all visible pip values across all Tiles in the Chain.
- **Discard**: The action of removing a Tile from the Hand and drawing a replacement.

---

## Requirements

### Requirement 1: Tile and Pool Management

**User Story:** As a player, I want the game to use a standard double-6 domino set, so that tile availability is finite and strategic.

#### Acceptance Criteria

1. THE Game SHALL initialize the Pool with exactly 28 unique Tiles representing all combinations from [0|0] to [6|6] in a standard double-6 set.
2. WHEN a Tile is drawn into the Hand, THE Game SHALL remove that Tile from the Pool.
3. WHEN a Tile is placed on the Board, THE Game SHALL keep that Tile removed from the Pool for the remainder of the round.
4. WHEN a Tile is discarded, THE Game SHALL remove that Tile from the Pool permanently for the remainder of the run.
5. THE Game SHALL track the remaining count of Tiles in the Pool and make it visible to the player.

---

### Requirement 2: Hand Management

**User Story:** As a player, I want to hold and manage a hand of tiles, so that I can make strategic decisions each round.

#### Acceptance Criteria

1. WHEN a round begins, THE Game SHALL deal Tiles from the Pool until the Hand contains 5 Tiles.
2. WHEN the Hand contains fewer than 5 Tiles and the Pool is not empty, THE Game SHALL draw Tiles from the Pool to refill the Hand to 5 Tiles.
3. IF the Pool contains fewer Tiles than needed to fill the Hand, THEN THE Game SHALL deal all remaining Tiles from the Pool into the Hand.
4. THE Game SHALL display all Tiles in the Hand to the player at all times during a round.

---

### Requirement 3: Round Initialization

**User Story:** As a player, I want each round to start with a tile already on the board, so that I always have a valid starting point for my chain.

#### Acceptance Criteria

1. WHEN a round begins, THE Game SHALL place one Tile from the Pool onto the Board as the starting Tile of the Chain.
2. WHEN selecting the starting Tile, THE Game SHALL draw it from the Pool before dealing the Hand.
3. THE Game SHALL display the starting Tile on the Board before the player takes any action.

---

### Requirement 4: Tile Placement

**User Story:** As a player, I want to place tiles to extend the chain using standard domino matching rules, so that the game feels like dominoes.

#### Acceptance Criteria

1. WHEN a player selects a Tile from the Hand to place, THE Game SHALL validate that one pip value of the selected Tile matches the open end pip value of the Chain.
2. WHEN a valid Tile is placed, THE Game SHALL append the Tile to the matching end of the Chain and remove it from the Hand.
3. IF a player attempts to place a Tile that does not match the open end of the Chain, THEN THE Game SHALL reject the placement and display an error message.
4. THE Game SHALL display the current open end pip value of the Chain to the player at all times.
5. WHEN a Tile is placed, THE Game SHALL update the displayed Chain immediately.

---

### Requirement 5: Discard Mechanic

**User Story:** As a player, I want to discard tiles I can't use, so that I can cycle through the pool to find better options.

#### Acceptance Criteria

1. THE Game SHALL allow the player a maximum of 4 discards per round.
2. WHEN a player discards a Tile, THE Game SHALL remove that Tile from the Hand and from the Pool permanently.
3. WHEN a Tile is discarded, THE Game SHALL draw a replacement Tile from the Pool into the Hand if the Pool is not empty.
4. IF the player has used all 4 discards in the current round, THEN THE Game SHALL prevent further discards and display a message indicating no discards remain.
5. THE Game SHALL display the number of remaining discards to the player at all times during a round.

---

### Requirement 6: Base Score Calculation

**User Story:** As a player, I want my score to reflect the total pip values in my chain, so that longer and higher-value chains are rewarded.

#### Acceptance Criteria

1. WHEN the player ends a round, THE Game SHALL calculate the Base Score as the sum of all pip values of all Tiles in the Chain.
2. THE Game SHALL count both pip values of every Tile in the Chain when computing the Base Score.
3. THE Game SHALL display the Base Score to the player before applying Multipliers.

---

### Requirement 7: Multiplier Calculation

**User Story:** As a player, I want multipliers to reward chain length, doubles, and runs, so that skilled play is meaningfully rewarded.

#### Acceptance Criteria

1. WHEN the Chain contains exactly 3 Tiles, THE Game SHALL set the Chain Length Multiplier to 1.
2. WHEN the Chain contains exactly 4 Tiles, THE Game SHALL set the Chain Length Multiplier to 2.
3. WHEN the Chain contains 5 or more Tiles, THE Game SHALL set the Chain Length Multiplier to 3.
4. WHEN the Chain contains fewer than 3 Tiles, THE Game SHALL set the Chain Length Multiplier to 1.
5. FOR EACH Double Tile present in the Chain, THE Game SHALL add 0.5 to the total Multiplier.
6. WHEN two adjacent Tile connections in the Chain form a consecutive pip increment (e.g., the shared pip value increases by 1 from one connection to the next), THE Game SHALL add 1 to the total Multiplier for each such Run segment.
7. THE Game SHALL calculate the total Multiplier as the Chain Length Multiplier plus all Double bonuses plus all Run bonuses.
8. THE Game SHALL display each Multiplier component (Chain Length, Double bonuses, Run bonuses) individually to the player.

---

### Requirement 8: Final Score Calculation

**User Story:** As a player, I want a clear final score, so that I know whether I beat the target.

#### Acceptance Criteria

1. WHEN the player ends a round, THE Game SHALL calculate the Final Score as the Base Score multiplied by the total Multiplier.
2. THE Game SHALL display the Final Score to the player after the round ends.
3. WHEN the Final Score meets or exceeds the Blind's target score, THE Game SHALL mark the Blind as cleared.
4. WHEN the Final Score is less than the Blind's target score, THE Game SHALL mark the Blind as failed.

---

### Requirement 9: Round End Conditions

**User Story:** As a player, I want clear conditions for ending a round, so that I know when to commit my chain.

#### Acceptance Criteria

1. THE Game SHALL allow the player to end the round voluntarily at any time after at least 1 Tile has been placed beyond the starting Tile.
2. WHEN the player has no valid placements remaining and no discards remaining, THE Game SHALL automatically end the round.
3. WHEN the round ends, THE Game SHALL trigger Score Calculation immediately.

---

### Requirement 10: Blind Progression

**User Story:** As a player, I want to progress through blinds and antes, so that the game has escalating challenge.

#### Acceptance Criteria

1. THE Game SHALL structure each Ante as 3 standard Blinds followed by 1 Boss Blind.
2. WHEN a Blind is cleared, THE Game SHALL advance the player to the Shop phase before the next Blind.
3. WHEN all 4 Blinds in an Ante are cleared, THE Game SHALL advance the player to the next Ante.
4. WHEN a Blind is failed, THE Game SHALL end the current run and display a game-over screen.
5. THE Game SHALL display the current Ante number and Blind number to the player at all times.
6. THE Game SHALL display the target score for the current Blind to the player at all times.

---

### Requirement 11: Boss Blind

**User Story:** As a player, I want boss blinds to introduce special challenges, so that the game has variety and tension.

#### Acceptance Criteria

1. WHEN a Boss Blind begins, THE Game SHALL apply a gameplay modifier that changes one or more standard rules for that round.
2. THE Game SHALL display the active Boss Blind modifier to the player before the round begins.
3. WHEN a Boss Blind is cleared, THE Game SHALL remove the modifier and restore standard rules for subsequent rounds.

---

### Requirement 12: Shop Phase

**User Story:** As a player, I want to visit a shop between blinds, so that I can improve my capabilities over the course of a run.

#### Acceptance Criteria

1. WHEN a Blind is cleared, THE Game SHALL present the Shop to the player before the next Blind begins.
2. THE Game SHALL display available items in the Shop with their costs.
3. WHEN the player purchases an item, THE Game SHALL deduct the item's cost from the player's currency and apply the item's effect.
4. IF the player has insufficient currency to purchase an item, THEN THE Game SHALL prevent the purchase and display an insufficient funds message.
5. WHEN the player leaves the Shop, THE Game SHALL begin the next Blind.

---

### Requirement 13: Run Reset

**User Story:** As a player, I want a fresh start each run, so that every run feels independent and replayable.

#### Acceptance Criteria

1. WHEN a new run begins, THE Game SHALL reset the Pool to all 28 Tiles.
2. WHEN a new run begins, THE Game SHALL reset the player's currency, items, and progression to starting values.
3. WHEN a new run begins, THE Game SHALL start the player at Ante 1, Blind 1.
