# Aviator Quant Bot — Chrome Extension

Adaptive, probability-based strategy bot for the Aviator game (by Spribe). Uses quantitative trading principles — Kelly Criterion sizing, expected value filtering, volatility guards, and streak detection — to make mathematically honest betting decisions.

**This is NOT prediction. It is adaptive risk management based on live session data.**

## Install

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `aviator-strategy-bot` folder
4. Navigate to any site running the Aviator game
5. Click the extension icon to show the panel

## Core Philosophy

The bot cannot predict crash points. But it CAN:

1. Track a rolling window of recent crash points
2. Calculate real-time statistics from that data
3. Dynamically adjust bet size and cashout target
4. Only bet when expected value is favorable
5. Cut exposure during high-variance periods

## How the Algorithm Works

### Module 1 — Crash History Tracker

Maintains a **rolling window of the last 50 crash points**. After every round, it calculates:

- **Mean** — average crash value
- **Standard Deviation** — measure of volatility
- **% above 1.5x** — how often rounds exceed 1.5x
- **% above 2x** — how often rounds exceed 2x
- **% above 3x** — how often rounds exceed 3x
- **Recent low streak** — consecutive crashes below 1.5x (danger signal)

The bot waits for **at least 10 data points** before making any bet decisions. During this collection phase it only observes.

### Module 2 — Kelly Criterion Bet Sizing

Used by professional gamblers and quant funds to size positions based on edge and probability.

```
Kelly % = (p × b − q) / b

Where:
  p = probability of winning (from history)
  q = 1 − p (probability of losing)
  b = net odds (cashout multiplier − 1)
```

The bot uses **Half-Kelly** (standard quant practice — reduces variance at the cost of slightly lower returns). Bet size is capped at **5% of bankroll maximum**. If Kelly returns zero or negative, the round is skipped entirely — negative Kelly means the bet has no edge.

### Module 3 — Dynamic Cashout Target

The bot does NOT use a fixed target. It picks the optimal cashout each round based on what the data supports:

| Condition | Target | Logic |
|-----------|--------|-------|
| 55%+ of recent rounds went above 2x | **2.0x** | Session is running hot |
| 55%+ went above 1.5x | **1.5x** | Normal conditions |
| 45%+ went above 1.5x | **1.3x** | Session is cold — conservative |
| Below 45% | **Skip** | No edge exists |

### Module 4 — Volatility Guard

When crash points are highly variable (high standard deviation), the bot reduces exposure:

| StdDev | Volatility Level | Action |
|--------|-----------------|--------|
| < 1.5 | Low | Normal bet size (100%) |
| 1.5–3.0 | Medium | Reduce bet by 40% |
| 3.0–5.0 | High | Reduce bet by 70% |
| > 5.0 | Extreme | Skip round entirely |

### Module 5 — Streak Detection

The bot adjusts behavior based on consecutive outcomes:

| Condition | Response |
|-----------|----------|
| 4+ consecutive losses | Reduce bet to 50% (never martingale) |
| 6+ consecutive losses | Skip round entirely |
| 3+ recent crashes below 1.5x | Skip round |
| 4+ consecutive wins | Hold steady — do NOT increase bets |

**Critical rule:** The bot NEVER uses Martingale (doubling after loss). Ever.

### Module 6 — Master Decision Engine

Before every round, combines all modules into a single decision:

1. Calculate rolling stats from history
2. Determine dynamic cashout target
3. Check if target has positive EV: `EV = (winProb × payout) − lossProb`
4. If EV ≤ 0 → skip
5. Calculate Kelly bet size for that target
6. Apply volatility multiplier
7. Apply streak adjustment
8. Final sanity checks (minimum bet, bankroll cap)

If the bot skips **3 consecutive rounds**, it forces a minimum 1% bet at 1.5x to keep collecting data.

### Module 7 — Stop Conditions

| Rule | Threshold | Action |
|------|-----------|--------|
| Drawdown from peak | 25% drop from session high | Bot stops |
| Take-Profit | 40% gain from starting bankroll | Bot stops |
| Max Rounds | Configurable (default 100) | Bot stops |
| Bankrupt | Bankroll reaches ₹0 | Bot stops |

Note: Stop-loss is measured from **session peak** (highest bankroll reached), not just the starting amount. This is a trailing stop.

## Available Strategies (9 total)

The bot implements 9 distinct betting strategies. Each has a fundamentally different approach to bet sizing, target selection, and risk management.

### 1. Quant/Kelly (default)

Uses Kelly Criterion to size bets based on detected edge. Dynamically picks cashout target (1.1x–2.0x) from rolling 50-round history. Skips rounds when no positive expected value is found. Dual-panel split: 70% safe + 30% hunter.

### 2. Goal Seeker (Dubins-Savage Bold Play)

**Framework:** Dubins-Savage Bold Play + Browne's Goal-Reaching.

Dynamically adjusts aggression based on where you stand between your stop-loss floor and profit-target ceiling. The closer you are to ruin, the bolder the bets — the closer you are to your goal, the smaller and safer.

**Aggression Zones:**

| Zone | Bankroll Position | Behavior |
|------|-------------------|----------|
| TARGET | > 95% toward profit goal | Lock-in mode: tiny bets, 1.2x cashout |
| COMFORT | 70–95% toward goal | Conservative: small bets, 1.5x target |
| NEUTRAL | 30–70% toward goal | Standard: Kelly-based sizing |
| DANGER | 10–30% toward goal | Aggressive: bigger bets, higher targets |
| CRITICAL | < 10% from stop-loss | Desperation: bold play, max payout targets |

**Key math:**
- Gambler's Ruin probability computed in real-time: `P(reach target) = (1 - (q/p)^current) / (1 - (q/p)^target)`
- Bet sizes and targets derived from distance-to-goal, NOT from crash history
- Completely stateless — all decisions derived from current bankroll position relative to boundaries

**Best for:** Sessions with a clear profit target and stop-loss, where you want the bot to "fight" its way to the goal with calibrated aggression.

### 3. Sniper (Adaptive)

A multi-phase "observe then fire" strategy. Fully autonomous — no manual target or window configuration needed.

**Lifecycle:**

```
INITIAL_OBSERVE (50 rounds) → Analysis → READY → [trigger check] → FIRE
    ↓ (after each bet)
OBSERVE (50 rounds) → Re-analysis → READY → [trigger check] → FIRE
    ↓ (repeat until window exhausted or hit)
DONE → restart from INITIAL_OBSERVE
```

**Phase 1 — Observation (50 rounds, configurable):**
The bot watches crash data without betting. It analyzes 6 multiplier tiers (10x, 15x, 20x, 30x, 50x, 100x) and scores each by:
- Observed frequency vs. theoretical expectation
- Edge (observed rate − theoretical rate)
- Payout ratio

**Phase 2 — Window Sizing:**
After analysis, the bot picks the "hottest" tier and calculates how many bets (window size) are needed to achieve a target cumulative hit probability:

```
window_size = ceil(ln(1 - confidence) / ln(1 - P(hit per round)))
```

Example at 15x target (P ≈ 6.5% per round):

| Confidence | Window Size | Cost (at ₹10/bet) | P(at least 1 hit) |
|------------|-------------|--------------------|--------------------|
| 70% (Conservative) | ~18 bets | ₹180 | 70% |
| 50% (Balanced) | ~10 bets | ₹100 | 50% |
| 30% (Aggressive) | ~5 bets | ₹50 | 30% |

**Phase 3 — Trigger (Wait Condition):**
Before firing, the bot can optionally wait for a signal:

| Trigger | Condition | Rationale |
|---------|-----------|-----------|
| Immediate | Fire on next round | Default — no delay after analysis |
| Dry Spell | Last 5 rounds ALL below 2x | Patience: wait for a "cold" streak |
| Overdue | Target not seen in last 20 rounds | Patience: target feels "due" |

Note: Dry Spell and Overdue do NOT improve mathematical odds (each round is independent). They add discipline/patience by delaying entry.

**Phase 4 — Fire:**
Places the bet with calculated amount and target. If dynamic target is enabled (default), re-observes 50 rounds before EACH individual bet in the window and re-analyzes — the target may shift between bets.

**Configurable Parameters:**

| Setting | Default | Description |
|---------|---------|-------------|
| Observation Rounds | 50 | How many rounds to watch before each bet |
| Max Risk per Window | 5% | Total bankroll % risked across all bets in a window |
| Window Confidence | 50% | Target P(at least 1 hit) — controls window size |
| Dynamic Target | On | Recalculate target between bets within a window |
| Fire Trigger | Immediate | When to pull trigger after observation completes |

**Best for:** High-multiplier hunting with patience. You accept many rounds of pure observation for occasional big payouts.

### 4. Flat Conservative

Always bets 1% of bankroll. Always cashes out at 1.5x (64.7% win rate). Never changes. Maximum bankroll survival for long sessions with minimal drawdown.

### 5. Flat Balanced

Fixed 1% of bankroll per round. Cashout at 2.0x (48.5% win rate). Balanced risk/reward — wins less often but profits more per win.

### 6. Anti-Martingale

Positive progression: doubles bet after each win (1x→2x→4x). Resets to base after any loss or 3 consecutive wins. Capitalizes on hot streaks safely. Never increases after losses.

### 7. 1-3-2-6

Structured 4-step sequence on consecutive wins: bet 1, 3, 2, 6 units. Reset to step 1 on any loss. Profits from 4-win streaks (pays 12 units on 12-unit investment). Self-limiting.

### 8. D'Alembert

Gentle negative progression: +1 unit on loss, −1 on win, never below 1 unit. Much safer than Martingale — linear growth instead of exponential. Slow recovery, high bankroll survival.

### 9. Oscar's Grind

Ultra-conservative cycle system. Only increases bet by 1 unit after a win AND only if the cycle is negative. Resets once cycle reaches +1 unit profit. Patient capital preservation.

## Auto-Switch Strategy

Evaluates performance every 25 rounds using a composite scoring system and switches to the best-performing strategy automatically.

**Rules:**
- Minimum 15 rounds on a strategy before switching is considered
- Excludes Goal Seeker and Sniper from rotation (they have dedicated lifecycles)
- Scores based on: win rate, drawdown, EV, volatility-adjusted returns

## Panel Dashboard

The floating sidebar shows live quant data:

**Decision Engine section:**
- EV (expected value of current decision)
- Win Probability (from rolling history)
- Dynamic Cashout Target
- Kelly % being used
- Volatility level (Low/Medium/High/Extreme)
- Bet size for this round
- Decision reason (why it bet or skipped)

**Rolling Stats section:**
- Mean crash, StdDev
- % above 1.5x, 2x, 3x
- Sample count
- Sparkline of last 20 crash points (color-coded: green >2x, orange >1.5x, red <1.5x)

**Bankroll section:**
- Starting, Current, Peak, P/L

**Session section:**
- Rounds played, Win rate, Skipped rounds, Consecutive losses/wins

## User Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Starting Bankroll | ₹1000 | Your initial capital |
| Max Rounds | 100 | Auto-stop after this many rounds |
| Drawdown Stop | 5% | Stop if bankroll drops this % from peak |
| Take-Profit | 110% | Stop if bankroll reaches this % of start |
| Simulation Mode | On | Dry run with generated crash points |

## Simulation Mode

When enabled (default), the bot:
- Generates crash points with a weighted distribution mimicking real game behavior
- Runs full quant logic (Kelly, EV, volatility) against simulated data
- Shows timing that mirrors real game phases (betting → flying → crash → pause)
- Does NOT interact with the game DOM

Disable simulation only when you want the bot to evaluate against real detected crash multipliers.

## Files

```
manifest.json    — Chrome extension manifest (V3)
background.js    — Service worker for storage/lifecycle
content.js       — Main bot: game observation, decision loop, simulation
strategies.js    — All 9 strategy implementations + auto-switch logic
panel.js         — Floating dashboard UI + configuration
panel.css        — Panel styles
icons/           — Extension icons
```

## Mathematical Honesty

- The house edge is ~3% (provably fair RNG)
- NO strategy can guarantee long-term profit against a negative-expectation game
- Observation does NOT predict future rounds — each crash is independent
- "Hot" tiers, dry spells, and overdue signals are pattern-matching heuristics, not causal predictors
- What math CAN do: optimize bet sizing, manage risk, maximize P(reaching a goal before ruin)
- The Gambler's Ruin theorem proves that with infinite play, the house always wins
- These strategies optimize **discipline and risk management**, not luck

## Disclaimer

This is for educational and entertainment purposes. The house edge (~3%) means no strategy guarantees long-term profit. This bot minimizes bad decisions — it does not eliminate risk.
