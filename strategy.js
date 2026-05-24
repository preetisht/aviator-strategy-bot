// Aviator Quant Strategy Engine — adaptive risk management
// Exposed as window.AviatorStrategy

window.AviatorStrategy = (() => {
  // MODULE 1 — CRASH POINT HISTORY TRACKER
  const history = [];
  const WINDOW_SIZE = 50;

  function addToHistory(crashPoint) {
    history.push(crashPoint);
    if (history.length > WINDOW_SIZE) history.shift();
  }

  function getHistory() {
    return [...history];
  }

  function getStats() {
    if (history.length < 10) return null;

    const sorted = [...history].sort((a, b) => a - b);
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance = history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);
    const median = sorted[Math.floor(sorted.length / 2)];

    const above1_5 = history.filter(x => x >= 1.5).length / history.length;
    const above2 = history.filter(x => x >= 2).length / history.length;
    const above3 = history.filter(x => x >= 3).length / history.length;

    let recentLow = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i] < 1.5) recentLow++;
      else break;
    }

    return { mean, stdDev, median, above1_5, above2, above3, recentLow, count: history.length };
  }

  // MODULE 2 — KELLY CRITERION BET SIZING
  function getKellyBetSize(bankroll, targetMultiplier, winProbability) {
    const b = targetMultiplier - 1;
    const p = winProbability;
    const q = 1 - p;

    const kelly = (p * b - q) / b;
    const halfKelly = kelly / 2;
    const cappedKelly = Math.min(halfKelly, 0.05);

    if (cappedKelly <= 0) return { betAmount: 0, kellyPct: 0, rawKelly: kelly };

    const betAmount = Math.max(1, Math.round(bankroll * cappedKelly));

    console.log(`[AviatorBot] Kelly: p=${p.toFixed(2)} b=${b.toFixed(2)} kelly=${(kelly * 100).toFixed(1)}% halfKelly=${(halfKelly * 100).toFixed(1)}%`);

    return { betAmount, kellyPct: cappedKelly, rawKelly: kelly };
  }

  // MODULE 3 — DYNAMIC CASHOUT TARGET
  function getDynamicCashoutTarget(stats) {
    if (!stats) return { target: 1.5, reason: "default (collecting data)" };

    if (stats.above2 >= 0.55) {
      return { target: 2.0, reason: `${(stats.above2 * 100).toFixed(0)}% above 2x` };
    } else if (stats.above1_5 >= 0.55) {
      return { target: 1.5, reason: `${(stats.above1_5 * 100).toFixed(0)}% above 1.5x` };
    } else if (stats.above1_5 >= 0.45) {
      return { target: 1.3, reason: "session cold, targeting 1.3x" };
    } else {
      return { target: 0, reason: "no edge — skip" };
    }
  }

  // MODULE 4 — VOLATILITY GUARD
  function getVolatilityMultiplier(stats) {
    if (!stats) return { multiplier: 1.0, level: "unknown" };

    if (stats.stdDev < 1.5) return { multiplier: 1.0, level: "Low" };
    if (stats.stdDev < 3.0) return { multiplier: 0.6, level: "Medium" };
    if (stats.stdDev < 5.0) return { multiplier: 0.3, level: "High" };
    return { multiplier: 0, level: "Extreme" };
  }

  // MODULE 5 — STREAK DETECTION AND RESPONSE
  function getStreakAdjustment(stats, consecutiveLosses, consecutiveWins) {
    if (consecutiveLosses >= 6) {
      return { betMultiplier: 0, skipRound: true, reason: "6+ losses — full skip" };
    }
    if (consecutiveLosses >= 4) {
      return { betMultiplier: 0.5, skipRound: false, reason: "4+ losses — half bet" };
    }
    if (consecutiveWins >= 4) {
      return { betMultiplier: 1.0, skipRound: false, reason: "hot streak — steady" };
    }
    if (stats && stats.recentLow >= 3) {
      return { betMultiplier: 0, skipRound: true, reason: "3+ recent lows — skip" };
    }
    return { betMultiplier: 1.0, skipRound: false, reason: "normal" };
  }

  // MODULE 6 — MASTER DECISION ENGINE
  // betMode: "conservative" (only bet at engine-picked target) or "aggressive" (step down to find positive Kelly)
  function makeRoundDecision(session) {
    const stats = getStats();
    const isCollecting = history.length < 10;
    const betMode = session.betMode || "aggressive";

    if (isCollecting) {
      return {
        shouldBet: false,
        reason: `Collecting data (${history.length}/10)`,
        stats: null,
        cashoutTarget: 0,
        winProbability: 0,
        ev: 0,
        kellyPct: 0,
        volatility: "unknown",
        betAmount: 0,
      };
    }

    const { target: initialTarget, reason: targetReason } = getDynamicCashoutTarget(stats);

    if (initialTarget === 0 && betMode === "conservative") {
      return {
        shouldBet: false,
        reason: `No edge: ${targetReason}`,
        stats,
        cashoutTarget: 0,
        winProbability: 0,
        ev: 0,
        kellyPct: 0,
        volatility: getVolatilityMultiplier(stats).level,
        betAmount: 0,
      };
    }

    // Build list of targets to try
    const targetsToTry = betMode === "aggressive"
      ? [2.0, 1.5, 1.3, 1.2, 1.15, 1.1]
      : [initialTarget];

    let bestDecision = null;

    for (const target of targetsToTry) {
      if (target <= 0) continue;

      const winProb = history.filter(x => x >= target).length / history.length;
      const { betAmount: kellyBet, kellyPct: kPct, rawKelly } = getKellyBetSize(
        session.currentBankroll, target, winProb
      );

      if (kellyBet > 0) {
        bestDecision = { cashoutTarget: target, winProbability: winProb, kellyBet, kellyPct: kPct, rawKelly };
        break;
      }
    }

    if (!bestDecision) {
      // No target produced positive Kelly
      const fallbackTarget = initialTarget || 1.5;
      const fallbackProb = history.filter(x => x >= fallbackTarget).length / history.length;
      const { rawKelly } = getKellyBetSize(session.currentBankroll, fallbackTarget, fallbackProb);
      return {
        shouldBet: false,
        reason: `Negative Kelly at all targets (${(rawKelly * 100).toFixed(1)}% at ${fallbackTarget}x)`,
        stats,
        cashoutTarget: fallbackTarget,
        winProbability: fallbackProb,
        ev: 0,
        kellyPct: 0,
        volatility: getVolatilityMultiplier(stats).level,
        betAmount: 0,
      };
    }

    const { cashoutTarget, winProbability, kellyBet, kellyPct, rawKelly } = bestDecision;

    const { multiplier: volMult, level: volLevel } = getVolatilityMultiplier(stats);
    if (volMult === 0) {
      return {
        shouldBet: false,
        reason: "Extreme volatility — skipping",
        stats,
        cashoutTarget,
        winProbability,
        ev: 0,
        kellyPct,
        volatility: volLevel,
        betAmount: 0,
      };
    }

    let betAmount = Math.round(kellyBet * volMult);

    const streak = getStreakAdjustment(stats, session.consecutiveLosses, session.consecutiveWins);
    if (streak.skipRound) {
      return {
        shouldBet: false,
        reason: `Streak guard: ${streak.reason}`,
        stats,
        cashoutTarget,
        winProbability,
        ev: 0,
        kellyPct,
        volatility: volLevel,
        betAmount: 0,
      };
    }
    betAmount = Math.round(betAmount * streak.betMultiplier);

    if (betAmount < 1) {
      return {
        shouldBet: false,
        reason: "Bet amount too small",
        stats,
        cashoutTarget,
        winProbability,
        ev: 0,
        kellyPct,
        volatility: volLevel,
        betAmount: 0,
      };
    }

    const ev = (winProbability * (cashoutTarget - 1)) - (1 - winProbability);
    if (ev <= 0) {
      return {
        shouldBet: false,
        reason: `Negative EV (${ev.toFixed(3)})`,
        stats,
        cashoutTarget,
        winProbability,
        ev,
        kellyPct,
        volatility: volLevel,
        betAmount: 0,
      };
    }

    // Cap at bankroll
    betAmount = Math.min(betAmount, session.currentBankroll);

    // DUAL BET: Panel 1 (safe) gets 70%, Panel 2 (hunter) gets 30% at a higher target
    const panel1Amount = Math.max(1, Math.round(betAmount * 0.7));
    const panel1Target = cashoutTarget;

    // Find hunter target: one step above the safe target
    const hunterTargets = [3.0, 2.5, 2.0, 1.5, 1.3];
    let panel2Target = 0;
    let panel2Amount = 0;
    let panel2WinProb = 0;
    let panel2Ev = 0;

    for (const ht of hunterTargets) {
      if (ht <= cashoutTarget) continue; // must be higher than safe target
      const hp = history.filter(x => x >= ht).length / history.length;
      const hev = (hp * (ht - 1)) - (1 - hp);
      if (hp >= 0.25) { // at least 25% chance of hitting
        panel2Target = ht;
        panel2Amount = Math.max(1, Math.round(betAmount * 0.3));
        panel2WinProb = hp;
        panel2Ev = hev;
        break;
      }
    }

    // Ensure total doesn't exceed bankroll
    const totalBet = panel1Amount + panel2Amount;
    if (totalBet > session.currentBankroll) {
      panel2Amount = Math.max(0, session.currentBankroll - panel1Amount);
    }

    console.log(`[AviatorBot] BET P1: ₹${panel1Amount} @ ${panel1Target}x | P2: ₹${panel2Amount} @ ${panel2Target}x | EV=${ev.toFixed(3)} | Vol=${volLevel}`);

    return {
      shouldBet: true,
      reason: "Positive EV",
      stats,
      cashoutTarget: panel1Target,
      winProbability,
      ev,
      kellyPct,
      volatility: volLevel,
      betAmount: panel1Amount,
      // Panel 2 (hunter)
      panel2: panel2Target > 0 ? {
        target: panel2Target,
        amount: panel2Amount,
        winProbability: panel2WinProb,
        ev: panel2Ev,
      } : null,
    };
  }

  // MODULE 7 — EVALUATE ROUND OUTCOME
  function evaluateRound(session, crashPoint, decision) {
    const betAmount = decision.betAmount;
    const target = decision.cashoutTarget;

    let profit = 0;
    let panel1Win = false;
    let panel2Win = false;

    // Panel 1 (safe)
    if (crashPoint >= target) {
      profit += Math.round(betAmount * (target - 1));
      panel1Win = true;
    } else {
      profit -= betAmount;
    }

    // Panel 2 (hunter) if active
    if (decision.panel2 && decision.panel2.amount > 0) {
      if (crashPoint >= decision.panel2.target) {
        profit += Math.round(decision.panel2.amount * (decision.panel2.target - 1));
        panel2Win = true;
      } else {
        profit -= decision.panel2.amount;
      }
    }

    const win = panel1Win || panel2Win;
    const newBankroll = session.currentBankroll + profit;
    const peakBankroll = Math.max(session.peakBankroll || session.startingBankroll, newBankroll);

    const bothLost = !panel1Win && !panel2Win;
    const newConsecLosses = bothLost ? session.consecutiveLosses + 1 : 0;
    const newConsecWins = win ? session.consecutiveWins + 1 : 0;

    const totalBet = betAmount + (decision.panel2 ? decision.panel2.amount : 0);

    const result = {
      round: session.roundsPlayed + 1,
      crashPoint,
      betAmount: totalBet,
      cashoutTarget: target,
      panel2Target: decision.panel2?.target || 0,
      win,
      panel1Win,
      panel2Win,
      profit,
      bankrollAfter: newBankroll,
      ev: decision.ev,
      winProbability: decision.winProbability,
      timestamp: new Date().toISOString(),
    };

    const updatedSession = {
      ...session,
      currentBankroll: newBankroll,
      peakBankroll,
      roundsPlayed: session.roundsPlayed + 1,
      consecutiveLosses: newConsecLosses,
      consecutiveWins: newConsecWins,
      results: [...session.results.slice(-99), result],
    };

    return { updatedSession, result, win };
  }

  // STOP CONDITIONS CHECK
  function checkStopConditions(session) {
    // Max rounds
    if (session.roundsPlayed >= session.maxRounds) {
      return { stop: true, reason: "MAX_ROUNDS", alert: `Max rounds (${session.maxRounds}) reached.` };
    }

    // Drawdown from peak
    const peak = session.peakBankroll || session.startingBankroll;
    const drawdownPct = session.drawdownPercent || 0.25;
    if (peak > 0 && session.currentBankroll <= peak * (1 - drawdownPct)) {
      return { stop: true, reason: "DRAWDOWN", alert: `Drawdown stop: bankroll dropped ${(drawdownPct * 100).toFixed(0)}% from peak ₹${peak}` };
    }

    // Take-profit — skip if autopilot is active (autopilot handles its own target via WATCHING phase)
    if (!session.autopilot) {
      const takeProfitPct = session.takeProfitPercent || 1.40;
      if (session.currentBankroll >= session.startingBankroll * takeProfitPct) {
        return { stop: true, reason: "TAKE_PROFIT", alert: `Take-profit! Bankroll at ₹${session.currentBankroll} (${Math.round(takeProfitPct * 100)}% of start)` };
      }
    }

    // Zero bankroll
    if (session.currentBankroll <= 0) {
      return { stop: true, reason: "BANKRUPT", alert: "Bankroll depleted." };
    }

    return { stop: false };
  }

  // SIMULATION: generate fake crash point
  function generateFakeCrashPoint() {
    const rand = Math.random();
    if (rand < 0.35) return 1.0 + Math.random() * 0.49;
    if (rand < 0.65) return 1.5 + Math.random() * 1.5;
    if (rand < 0.85) return 3.0 + Math.random() * 3.0;
    return 6.0 + Math.random() * 94.0;
  }

  return {
    addToHistory,
    getHistory,
    getStats,
    getKellyBetSize,
    getDynamicCashoutTarget,
    getVolatilityMultiplier,
    getStreakAdjustment,
    makeRoundDecision,
    evaluateRound,
    checkStopConditions,
    generateFakeCrashPoint,
  };
})();
