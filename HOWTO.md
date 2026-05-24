# How to Play Aviator Using This Bot

A step-by-step guide for complete beginners.

---

## What is Aviator?

A plane takes off and a multiplier climbs: 1.00x ... 1.50x ... 2.00x ... 5.00x ... and at some random point it crashes. You place a bet before takeoff and cash out before the crash. If you cash out in time, your bet is multiplied. If the plane crashes first, you lose your bet.

That's it. There's no skill involved in the game itself — just timing and luck. This bot replaces luck with math-based discipline.

---

## Step 1: Install the Extension

1. Download this folder (`aviator-strategy-bot`) to your computer
2. Open Chrome browser
3. Type `chrome://extensions/` in the address bar and press Enter
4. Turn ON **Developer mode** (toggle in the top-right corner)
5. Click **Load unpacked**
6. Select the `aviator-strategy-bot` folder
7. You'll see the extension icon appear in your toolbar

---

## Step 2: Open the Game

1. Go to any website that has the Aviator game
2. Open the game so you can see the betting screen
3. Click the bot's extension icon — a dark panel will appear on the right side of your screen

---

## Step 3: Start with Simulation (Practice Mode)

**Do NOT start with real money.** Practice first.

1. In the bot panel, enter your **Starting Bankroll** (e.g., 1000)
2. Make sure **Simulation Mode** is checked (it is by default)
3. Click **START**

The bot will now run in practice mode:
- It generates fake crash points that behave like real ones
- It makes decisions, places virtual bets, tracks profit/loss
- No real money is involved
- Watch it for 50-100 rounds to understand the behavior

---

## Step 4: Choose Your Mode

You have two options:

### Option A: Daily Autopilot (Recommended for Beginners)

This is the "set it and forget it" mode.

1. Check the **Daily Autopilot** toggle
2. Set your **Daily Target** (default: 10%)
3. Click START

What happens:
- Bot watches 30 rounds of the game first (no bets)
- When conditions look favorable, it starts betting
- It picks the best strategy automatically based on your profit/loss
- When it hits your target (e.g., +10%), it stops betting and just watches
- If things go badly, it quits early to protect your money

You don't need to choose a strategy or configure anything. The bot handles everything.

### Option B: Pick a Strategy Manually

If you want more control:

1. Select a strategy from the radio buttons:
   - **Quant/Kelly** — best all-rounder, bets only when it detects an edge
   - **Goal Seeker** — aggressive when losing, conservative when winning
   - **Sniper** — watches for a long time, then bets big on high multipliers
   - **Flat Conservative** — simple and safe, 1% bet at 1.5x every round
   - **Flat Balanced** — 1% bet at 2.0x every round
   - Others for specific situations (see README for details)

2. Set your **Drawdown Stop** (how much you're willing to lose before the bot stops)
3. Set your **Take-Profit** (when the bot should stop and declare victory)
4. Click START

---

## Step 5: Switch to Real Mode

Once you're comfortable with how the bot behaves in simulation:

1. Click STOP
2. Uncheck **Simulation Mode**
3. Enter your real **Starting Bankroll** (the amount you have in the game)
4. Set conservative stops: **Drawdown 5%**, **Take-Profit 110%**
5. Click START

The bot will now:
- Read real crash multipliers from the game
- Enter bet amounts into the game's input field
- Click the BET button when it decides to bet
- Click CASH OUT at the right moment
- Skip rounds when conditions are bad

---

## Step 6: What to Watch

While the bot is running, the panel shows you:

- **Phase** (if Autopilot): OBSERVE / ACTIVE / WATCHING / QUIT
- **Strategy**: Which strategy is currently active
- **P/L**: Your profit or loss as a percentage
- **EV**: Whether the current bet has positive expected value
- **Reason**: Why the bot made its decision (bet, skip, or quit)

---

## The Golden Rules

1. **Never bet money you can't afford to lose.** The house always has an edge (~3%). No bot can change that.

2. **Start small.** Use the minimum bet amount until you've seen the bot work over 200+ rounds.

3. **Use Simulation first.** Always. At least 100 rounds before going real.

4. **Set a daily target and STOP.** The bot's biggest value is knowing when to stop. If you override it and keep playing, you'll eventually lose.

5. **Don't chase losses.** If the bot quits (smart quit), respect it. Come back tomorrow.

6. **The bot doesn't predict.** It manages risk. Some sessions will be losers — that's math. The goal is that winners > losers over time.

---

## Quick Start Cheat Sheet

| Goal | Mode | Settings |
|------|------|----------|
| Just trying it out | Simulation ON | Bankroll: 1000, Start, watch |
| Daily 10% profit, hands-off | Autopilot ON | Target: 10%, Start |
| Safe and slow | Flat Conservative | Drawdown: 5%, TP: 110% |
| Hunting big multipliers | Sniper | Use defaults, be patient |
| Custom risk management | Quant/Kelly | Drawdown: 5%, TP: 115% |

---

## FAQ

**Q: Will this bot guarantee I make money?**
No. The game has a 3% house edge. Over infinite rounds, the house wins. The bot maximizes your chance of hitting a short-term target and getting out.

**Q: What's the best strategy?**
Daily Autopilot for most people. It adapts to conditions and stops at the right time.

**Q: How much should I start with?**
Only what you're 100% okay losing. Treat it as entertainment money.

**Q: The bot is skipping lots of rounds. Is it broken?**
No. Skipping is the bot's most powerful feature. It means conditions aren't favorable and it's protecting your bankroll.

**Q: The bot stopped and said "Smart Quit". What happened?**
The bot detected that conditions turned bad (losing streak, high volatility, etc.) and stopped before things got worse. This is a feature, not a bug.

**Q: Can I change the daily target from 10% to something else?**
Yes. In Autopilot mode, change the "Daily Target (%)" input to whatever you want. Lower targets (5-8%) are more achievable. Higher targets (15-20%) require more risk and more rounds.

**Q: Should I run this all day?**
No. Short focused sessions (50-150 rounds) are better than marathon sessions. The longer you play, the more the house edge accumulates.

---

## Workflow Summary

```
Install → Simulate 100 rounds → Understand behavior → Go real with small bankroll
→ Set Autopilot 10% → Start → Walk away → Bot reaches target or quits
→ Done for the day
```

That's it. The bot handles the math. You handle the discipline of not overriding it.
