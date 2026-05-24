// Multi-strategy module for Aviator Bot
// Each strategy returns: { shouldBet, betAmount, cashoutTarget, panel2: {amount, target} | null, reason }
// Exposed as window.AviatorStrategies

window.AviatorStrategies = (() => {

  // ===== STRATEGY 1: QUANT/KELLY (uses existing AviatorStrategy engine) =====
  function quantKelly(session) {
    const decision = window.AviatorStrategy.makeRoundDecision(session);
    return decision;
  }

  // ===== STRATEGY 2: FLAT CONSERVATIVE — 1% bet, always 1.5x =====
  function flatConservative(session) {
    const betAmount = Math.max(1, Math.round(session.currentBankroll * 0.01));
    const target = 1.5;
    const p2Amount = Math.max(1, Math.round(betAmount * 0.5));
    return {
      shouldBet: true,
      betAmount,
      cashoutTarget: target,
      panel2: { target: 3.0, amount: p2Amount, winProbability: 0.32, ev: -0.03 },
      reason: "Flat 1%@1.5x",
      winProbability: 0.647,
      ev: -0.03,
      kellyPct: 0.01,
      volatility: "Low",
      stats: window.AviatorStrategy.getStats(),
    };
  }

  // ===== STRATEGY 3: FLAT BALANCED — 1% bet, always 2.0x =====
  function flatBalanced(session) {
    const betAmount = Math.max(1, Math.round(session.currentBankroll * 0.01));
    const target = 2.0;
    const p2Amount = Math.max(1, Math.round(betAmount * 0.5));
    return {
      shouldBet: true,
      betAmount,
      cashoutTarget: target,
      panel2: { target: 4.0, amount: p2Amount, winProbability: 0.24, ev: -0.03 },
      reason: "Flat 1%@2.0x",
      winProbability: 0.485,
      ev: -0.03,
      kellyPct: 0.01,
      volatility: "Low",
      stats: window.AviatorStrategy.getStats(),
    };
  }

  // ===== STRATEGY 4: ANTI-MARTINGALE (PAROLI) =====
  // Double bet after win, reset after loss. Cap at 3 consecutive doubles.
  function antiMartingale(session) {
    const baseUnit = Math.max(1, Math.round(session.currentBankroll * 0.01));
    const state = session.strategyState || {};
    const streak = state.winStreak || 0;
    const target = 2.0;

    let multiplier = 1;
    if (streak === 1) multiplier = 2;
    else if (streak === 2) multiplier = 4;
    else if (streak >= 3) multiplier = 1;

    const betAmount = Math.min(baseUnit * multiplier, Math.round(session.currentBankroll * 0.05));
    const p2Amount = Math.max(1, Math.round(betAmount * 0.4));

    return {
      shouldBet: true,
      betAmount,
      cashoutTarget: target,
      panel2: { target: 4.0, amount: p2Amount, winProbability: 0.24, ev: -0.03 },
      reason: `Paroli x${multiplier} (streak: ${streak})`,
      winProbability: 0.485,
      ev: -0.03,
      kellyPct: (betAmount / session.currentBankroll),
      volatility: "Medium",
      stats: window.AviatorStrategy.getStats(),
    };
  }

  // ===== STRATEGY 5: 1-3-2-6 SYSTEM =====
  // Bet sequence 1→3→2→6 units on consecutive wins. Reset on loss.
  function system1326(session) {
    const baseUnit = Math.max(1, Math.round(session.currentBankroll * 0.01));
    const state = session.strategyState || {};
    const step = state.sequenceStep || 0;
    const target = 2.0;

    const sequence = [1, 3, 2, 6];
    const currentMultiplier = sequence[step] || 1;
    const betAmount = Math.min(baseUnit * currentMultiplier, Math.round(session.currentBankroll * 0.06));
    const p2Amount = Math.max(1, Math.round(betAmount * 0.3));

    return {
      shouldBet: true,
      betAmount,
      cashoutTarget: target,
      panel2: { target: 3.5, amount: p2Amount, winProbability: 0.28, ev: -0.03 },
      reason: `1-3-2-6 step ${step + 1} (${currentMultiplier}u)`,
      winProbability: 0.485,
      ev: -0.03,
      kellyPct: (betAmount / session.currentBankroll),
      volatility: "Medium",
      stats: window.AviatorStrategy.getStats(),
    };
  }

  // ===== STRATEGY 6: D'ALEMBERT =====
  // +1 unit after loss, -1 unit after win. Never go below 1 unit.
  function dAlembert(session) {
    const baseUnit = Math.max(1, Math.round(session.currentBankroll * 0.01));
    const state = session.strategyState || {};
    const units = Math.max(1, state.currentUnits || 1);
    const target = 1.5;

    const betAmount = Math.min(baseUnit * units, Math.round(session.currentBankroll * 0.05));
    const p2Amount = Math.max(1, Math.round(betAmount * 0.5));

    return {
      shouldBet: true,
      betAmount,
      cashoutTarget: target,
      panel2: { target: 2.5, amount: p2Amount, winProbability: 0.39, ev: -0.03 },
      reason: `D'Alembert ${units}u`,
      winProbability: 0.647,
      ev: -0.03,
      kellyPct: (betAmount / session.currentBankroll),
      volatility: "Low",
      stats: window.AviatorStrategy.getStats(),
    };
  }

  // ===== STRATEGY 7: OSCAR'S GRIND =====
  // +1 unit after win (only if cycle is negative). Reset when cycle profit reaches +1 unit.
  function oscarsGrind(session) {
    const baseUnit = Math.max(1, Math.round(session.currentBankroll * 0.01));
    const state = session.strategyState || {};
    const units = Math.max(1, state.currentUnits || 1);
    const cycleProfit = state.cycleProfit || 0;
    const target = 1.5;

    const betAmount = Math.min(baseUnit * units, Math.round(session.currentBankroll * 0.05));
    const p2Amount = Math.max(1, Math.round(betAmount * 0.5));

    return {
      shouldBet: true,
      betAmount,
      cashoutTarget: target,
      panel2: { target: 2.5, amount: p2Amount, winProbability: 0.39, ev: -0.03 },
      reason: `Oscar ${units}u (cycle: ${cycleProfit >= 0 ? "+" : ""}${cycleProfit})`,
      winProbability: 0.647,
      ev: -0.03,
      kellyPct: (betAmount / session.currentBankroll),
      volatility: "Low",
      stats: window.AviatorStrategy.getStats(),
    };
  }

  // ===== STRATEGY 8: GOAL SEEKER (Dubins-Savage / Browne Framework) =====
  // Dynamic aggression based on distance between stop-loss floor and profit-target ceiling.
  // Bold Play theorem: in a subfair game, bet aggressively near ruin to maximize P(reaching target).
  // Browne's insight: optimal fraction varies with distance-to-goal and distance-to-ruin.

  function goalSeeker(session) {
    const startBR = session.startingBankroll || 1000;
    const currentBR = session.currentBankroll || startBR;

    // Barriers from session config (drawdownPercent is fraction like 0.25 for 25%)
    // For goal seeker, we interpret: target = takeProfitPercent of starting, floor = (1 - drawdownPercent) of starting
    const targetPct = session.takeProfitPercent || 1.10;  // e.g. 1.10 means +10%
    const floorPct = 1 - (session.drawdownPercent || 0.05); // e.g. 0.95 means -5%

    const targetBR = startBR * targetPct;
    const floorBR = startBR * floorPct;
    const totalRange = targetBR - floorBR;

    // Position: 0.0 = at floor (ruin), 1.0 = at target (goal reached)
    const position = totalRange > 0 ? Math.max(0, Math.min(1, (currentBR - floorBR) / totalRange)) : 0.5;

    // Dubins-Savage Bold Play: optimal stake = min(distance_from_floor, distance_to_ceiling)
    // Normalized to bankroll fraction
    const distFromFloor = currentBR - floorBR;
    const distToTarget = targetBR - currentBR;
    const boldStake = Math.min(distFromFloor, distToTarget);
    const boldFraction = currentBR > 0 ? boldStake / currentBR : 0;

    // Zone classification
    let zone, betFraction, cashoutTarget, p2Target, reason;

    if (position >= 0.85) {
      // TARGET ZONE — Almost there, just lock it in
      zone = "TARGET";
      // Bet just enough to cross the finish line
      const neededGain = distToTarget;
      // At 1.2x target, profit per bet = betAmount * 0.2, solve for betAmount
      cashoutTarget = 1.20;
      betFraction = Math.min(0.03, neededGain / (currentBR * (cashoutTarget - 1)));
      betFraction = Math.max(0.005, betFraction); // minimum 0.5%
      p2Target = 1.5;
      reason = `Goal Seeker TARGET (${(position * 100).toFixed(0)}%) — lock-in mode`;
    } else if (position >= 0.60) {
      // COMFORT ZONE — Profitable, protect gains
      zone = "COMFORT";
      betFraction = 0.01;
      cashoutTarget = 1.40;
      p2Target = 2.0;
      reason = `Goal Seeker COMFORT (${(position * 100).toFixed(0)}%) — protect gains`;
    } else if (position >= 0.35) {
      // NEUTRAL ZONE — Middle ground, balanced play
      zone = "NEUTRAL";
      betFraction = 0.02;
      cashoutTarget = 1.80;
      p2Target = 3.0;
      reason = `Goal Seeker NEUTRAL (${(position * 100).toFixed(0)}%) — balanced`;
    } else if (position >= 0.15) {
      // DANGER ZONE — Losing, increase aggression
      zone = "DANGER";
      betFraction = 0.035;
      cashoutTarget = 2.20;
      p2Target = 4.0;
      reason = `Goal Seeker DANGER (${(position * 100).toFixed(0)}%) — aggressive recovery`;
    } else {
      // CRITICAL ZONE — Near ruin, BOLD PLAY (Dubins-Savage optimal)
      zone = "CRITICAL";
      // Bold play: bet a large fraction, aim high — only mathematical chance of recovery
      betFraction = Math.min(0.05, boldFraction * 0.8); // 80% of theoretical bold stake, capped
      betFraction = Math.max(0.04, betFraction); // at least 4%
      cashoutTarget = 3.00;
      p2Target = 5.0;
      reason = `Goal Seeker CRITICAL (${(position * 100).toFixed(0)}%) — BOLD PLAY`;
    }

    // Apply bet sizing
    const betAmount = Math.max(1, Math.round(currentBR * betFraction));
    const p2Amount = Math.max(1, Math.round(betAmount * 0.4));

    // Win probability estimates based on target (assuming ~3% house edge)
    const winProb = Math.max(0.1, 0.97 / cashoutTarget);
    const ev = winProb * (cashoutTarget - 1) - (1 - winProb);

    // Compute Gambler's Ruin probability for display
    // P(reach target) = (1 - r^i) / (1 - r^N) where r = q/p, i = units from floor, N = total units
    const p = winProb;
    const q = 1 - p;
    const r = q / p;
    const unitsFromFloor = Math.max(1, Math.round(distFromFloor / betAmount));
    const totalUnits = Math.max(2, Math.round(totalRange / betAmount));
    let goalProbability;
    if (Math.abs(r - 1) < 0.001) {
      goalProbability = unitsFromFloor / totalUnits;
    } else {
      const rI = Math.pow(r, Math.min(unitsFromFloor, 100));
      const rN = Math.pow(r, Math.min(totalUnits, 100));
      goalProbability = Math.max(0, Math.min(1, (1 - rI) / (1 - rN)));
    }

    return {
      shouldBet: true,
      betAmount,
      cashoutTarget,
      panel2: { target: p2Target, amount: p2Amount, winProbability: 0.97 / p2Target, ev: (0.97 / p2Target) * (p2Target - 1) - (1 - 0.97 / p2Target) },
      reason,
      winProbability: winProb,
      ev,
      kellyPct: betFraction,
      volatility: zone === "CRITICAL" ? "Extreme" : zone === "DANGER" ? "High" : zone === "NEUTRAL" ? "Medium" : "Low",
      stats: window.AviatorStrategy.getStats(),
      goalSeeker: { zone, position, boldFraction, goalProbability, distFromFloor, distToTarget },
    };
  }

  // ===== STRATEGY 9: SNIPER (Observe-Per-Bet Adaptive Lottery) =====
  // Lifecycle: INITIAL_OBSERVE(50) → READY → bet → OBSERVE(50) → READY → bet → ... → DONE
  // Each individual bet is preceded by 50 rounds of fresh observation and re-analysis.
  // Total window size (N bets) decided once at initial analysis. Target/amount recalculated per bet.

  const SNIPER_OBSERVE_ROUNDS = 50;

  function sniperAnalyzeData(history, currentBR, maxRisk, remainingBets) {
    if (!history || history.length < 20) return null;

    const tiers = [
      { target: 10, label: "10x" },
      { target: 15, label: "15x" },
      { target: 20, label: "20x" },
      { target: 30, label: "30x" },
      { target: 50, label: "50x" },
      { target: 100, label: "100x" },
    ];

    const n = history.length;
    const scored = [];

    for (const tier of tiers) {
      const hits = history.filter(v => v >= tier.target).length;
      const observedRate = hits / n;
      const theoreticalRate = 0.97 / tier.target;
      const edge = observedRate - theoreticalRate;

      const effectiveRate = Math.max(observedRate, theoreticalRate * 0.5);
      const pHitSingle = effectiveRate;
      const avgNetIfHit = tier.target - 1; // net multiplier on a single winning bet

      let score = 0;
      if (edge > 0) score += edge * 100;
      score += pHitSingle * 10;
      score += (avgNetIfHit / tier.target) * 2;
      if (hits >= 2) score += 1;

      scored.push({
        target: tier.target,
        label: tier.label,
        observedRate,
        theoreticalRate,
        edge,
        hits,
        pHitSingle,
        avgNetIfHit,
        score,
      });
    }

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    // Bet sizing: distribute remaining risk budget across remaining bets
    const remainingBudget = currentBR * maxRisk;
    const betThisRound = Math.max(1, Math.floor(remainingBudget / Math.max(1, remainingBets)));

    return {
      target: best.target,
      betThisRound,
      pHitSingle: best.pHitSingle,
      observedRate: best.observedRate,
      edge: best.edge,
      hits: best.hits,
      scored: scored.slice(0, 3),
    };
  }

  function sniper(session) {
    const state = session.strategyState || {};
    const currentBR = session.currentBankroll || 1000;
    const stats = window.AviatorStrategy.getStats();
    const history = window.AviatorStrategy.getHistory ? window.AviatorStrategy.getHistory() : [];

    const maxRiskPerWindow = state.sniperMaxRisk || 0.05;
    const observeRounds = state.sniperObserveRounds || SNIPER_OBSERVE_ROUNDS;
    const windowConfidence = state.sniperConfidence || 0.5;

    // Phase: INITIAL_OBSERVE | OBSERVE | READY | DONE
    const phase = state.sniperPhase || "INITIAL_OBSERVE";
    const observeCount = state.sniperObserveCount || 0;
    const betsPlaced = state.sniperBetsPlaced || 0;
    const totalBets = state.sniperTotalBets || 0;
    const windowHits = state.sniperWindowHits || 0;
    const computedTarget = state.sniperComputedTarget || 0;
    const computedBet = state.sniperComputedBet || 0;

    // --- INITIAL_OBSERVE: First-time cold start, also determines window size ---
    if (phase === "INITIAL_OBSERVE") {
      const remaining = observeRounds - observeCount;

      if (history.length >= observeRounds && observeCount >= observeRounds) {
        // Initial analysis: determine window size (total bets) + first target/bet
        const analysis = sniperAnalyzeData(history.slice(-observeRounds), currentBR, maxRiskPerWindow, 1);
        if (analysis) {
          const pHit = Math.max(0.01, analysis.pHitSingle);
          const windowForConf = Math.ceil(Math.log(1 - windowConfidence) / Math.log(1 - pHit));
          const windowSize = Math.min(windowForConf, Math.floor(analysis.target * 0.7));
          const finalWindowSize = Math.max(3, windowSize);

          // Recalculate bet with proper remaining bets
          const betPerRound = Math.max(1, Math.floor((currentBR * maxRiskPerWindow) / finalWindowSize));

          state.sniperPhase = "READY";
          state.sniperTotalBets = finalWindowSize;
          state.sniperBetsPlaced = 0;
          state.sniperWindowHits = 0;
          state.sniperComputedTarget = analysis.target;
          state.sniperComputedBet = betPerRound;
          state.sniperObserveCount = 0;
          session.strategyState = state;

          const pWindow = 1 - Math.pow(1 - pHit, finalWindowSize);
          console.log(`[AviatorBot][SNIPER] Initial analysis: ${analysis.target}x, window=${finalWindowSize} bets @ ${(windowConfidence * 100).toFixed(0)}% conf, ₹${betPerRound}/bet, P(hit)=${(pWindow * 100).toFixed(0)}%`);
          console.log(`[AviatorBot][SNIPER] Top picks:`, analysis.scored);

          return {
            shouldBet: false,
            betAmount: 0,
            cashoutTarget: analysis.target,
            panel2: null,
            reason: `Sniper LOCKED — ${analysis.target}x, ${finalWindowSize} bets @ ${(pWindow * 100).toFixed(0)}% hit chance, ₹${betPerRound}/bet (edge: ${analysis.edge > 0 ? "+" : ""}${(analysis.edge * 100).toFixed(1)}%)`,
            winProbability: pWindow,
            ev: 0,
            kellyPct: 0,
            volatility: "Low",
            stats,
            sniper: { phase: "LOCKED", totalBets: finalWindowSize, ...analysis },
          };
        }
      }

      return {
        shouldBet: false,
        betAmount: 0,
        cashoutTarget: 0,
        panel2: null,
        reason: `Sniper OBSERVING (${observeCount}/${observeRounds}) — initial data collection...`,
        winProbability: 0,
        ev: 0,
        kellyPct: 0,
        volatility: "Low",
        stats,
        sniper: { phase: "INITIAL_OBSERVE", observeCount, observeRounds, remaining },
      };
    }

    // --- OBSERVE: Between bets within a window, collecting fresh data ---
    if (phase === "OBSERVE") {
      const remaining = observeRounds - observeCount;
      const dynamicTarget = state.sniperDynamicTarget !== false; // default true

      if (history.length >= observeRounds && observeCount >= observeRounds) {
        const remainingBets = totalBets - betsPlaced;
        const betThisRound = Math.max(1, Math.floor((currentBR * maxRiskPerWindow) / Math.max(1, remainingBets)));

        let newTarget = computedTarget; // keep existing target by default
        let edgeStr = "";

        if (dynamicTarget) {
          // Re-analyze: recalculate target based on fresh data
          const analysis = sniperAnalyzeData(history.slice(-observeRounds), currentBR, maxRiskPerWindow, remainingBets);
          if (analysis) {
            newTarget = analysis.target;
            edgeStr = ` (edge: ${analysis.edge > 0 ? "+" : ""}${(analysis.edge * 100).toFixed(1)}%)`;
            console.log(`[AviatorBot][SNIPER] Re-analysis bet ${betsPlaced + 1}/${totalBets}: ${analysis.target}x, ₹${betThisRound}${edgeStr}`);
          }
        } else {
          console.log(`[AviatorBot][SNIPER] Fixed target bet ${betsPlaced + 1}/${totalBets}: ${newTarget}x, ₹${betThisRound} (dynamic OFF)`);
        }

        state.sniperPhase = "READY";
        state.sniperComputedTarget = newTarget;
        state.sniperComputedBet = betThisRound;
        state.sniperObserveCount = 0;
        session.strategyState = state;

        return {
          shouldBet: false,
          betAmount: 0,
          cashoutTarget: newTarget,
          panel2: null,
          reason: `Sniper READY bet ${betsPlaced + 1}/${totalBets} — ${newTarget}x @ ₹${betThisRound}${edgeStr}${dynamicTarget ? "" : " [fixed]"}`,
          winProbability: Math.max(0.01, 0.97 / newTarget),
          ev: 0,
          kellyPct: 0,
          volatility: "Low",
          stats,
          sniper: { phase: "READY", betsPlaced, totalBets, target: newTarget, betThisRound, dynamicTarget },
        };
      }

      return {
        shouldBet: false,
        betAmount: 0,
        cashoutTarget: computedTarget,
        panel2: null,
        reason: `Sniper OBSERVING (${observeCount}/${observeRounds}) — bet ${betsPlaced + 1}/${totalBets} pending...`,
        winProbability: 0,
        ev: 0,
        kellyPct: 0,
        volatility: "Low",
        stats,
        sniper: { phase: "OBSERVE", observeCount, observeRounds, remaining, betsPlaced, totalBets },
      };
    }

    // --- DONE: Window complete (hit or all bets exhausted) ---
    if (phase === "DONE") {
      return {
        shouldBet: false,
        betAmount: 0,
        cashoutTarget: computedTarget,
        panel2: null,
        reason: windowHits > 0
          ? `Sniper WIN — hit @ ${computedTarget}x on bet ${betsPlaced}/${totalBets}! Restarting...`
          : `Sniper MISS — 0 hits in ${totalBets} bets. Restarting...`,
        winProbability: 0,
        ev: 0,
        kellyPct: 0,
        volatility: "Low",
        stats,
        sniper: { phase: "DONE", windowHits, betsPlaced, totalBets, computedTarget },
      };
    }

    // --- READY: Check trigger condition, then fire ---
    if (phase === "READY") {
      const trigger = state.sniperTrigger || "immediate";
      let triggerMet = true;
      let triggerReason = "";

      if (trigger === "dry-spell") {
        const last5 = history.slice(-5);
        if (last5.length < 5) {
          triggerMet = false;
          triggerReason = "waiting for 5 rounds of history";
        } else {
          const allBelow2 = last5.every(r => (r.multiplier || r) < 2.0);
          triggerMet = allBelow2;
          triggerReason = allBelow2 ? "" : `last 5 not all <2x (${last5.map(r => (r.multiplier || r).toFixed(2)).join(",")})`;
        }
      } else if (trigger === "overdue") {
        const last20 = history.slice(-20);
        const targetSeen = last20.some(r => (r.multiplier || r) >= computedTarget);
        triggerMet = !targetSeen;
        triggerReason = targetSeen ? `${computedTarget}x seen in last 20 rounds` : "";
      }

      if (!triggerMet) {
        return {
          shouldBet: false,
          betAmount: 0,
          cashoutTarget: computedTarget,
          panel2: null,
          reason: `Sniper WAITING for trigger [${trigger}]: ${triggerReason}`,
          winProbability: Math.max(0.01, 0.97 / computedTarget),
          ev: 0,
          kellyPct: 0,
          volatility: "Low",
          stats,
          sniper: { phase: "READY", trigger, betsPlaced, totalBets, computedTarget, computedBet, triggerReason },
        };
      }

      const winProb = Math.max(0.01, 0.97 / computedTarget);
      const ev = winProb * (computedTarget - 1) - (1 - winProb);
      const remainingBets = totalBets - betsPlaced;
      const cumProb = 1 - Math.pow(1 - winProb, remainingBets);

      const p2Target = Math.max(2.0, Math.round(computedTarget * 0.5 * 10) / 10);
      const p2Amount = Math.max(1, Math.round(computedBet * 0.3));

      return {
        shouldBet: true,
        betAmount: computedBet,
        cashoutTarget: computedTarget,
        panel2: { target: p2Target, amount: p2Amount, winProbability: 0.97 / p2Target, ev: (0.97 / p2Target) * (p2Target - 1) - (1 - 0.97 / p2Target) },
        reason: `Sniper FIRE bet ${betsPlaced + 1}/${totalBets} @ ${computedTarget}x ₹${computedBet} (P(win window): ${(cumProb * 100).toFixed(0)}%) [trigger: ${trigger}]`,
        winProbability: winProb,
        ev,
        kellyPct: computedBet / currentBR,
        volatility: "High",
        stats,
        sniper: { phase: "FIRING", betsPlaced: betsPlaced + 1, totalBets, computedTarget, computedBet, cumProb },
      };
    }

    // Fallback: reset to initial observe
    state.sniperPhase = "INITIAL_OBSERVE";
    state.sniperObserveCount = 0;
    session.strategyState = state;
    return {
      shouldBet: false, betAmount: 0, cashoutTarget: 0, panel2: null,
      reason: "Sniper resetting...", winProbability: 0, ev: 0, kellyPct: 0,
      volatility: "Low", stats, sniper: { phase: "RESET" },
    };
  }

  // ===== STATE UPDATERS (called after each round with win/loss result) =====

  function updateStrategyState(session, strategyId, won, betAmount, target) {
    const state = session.strategyState || {};

    switch (strategyId) {
      case "anti-martingale": {
        if (won) {
          state.winStreak = (state.winStreak || 0) + 1;
          if (state.winStreak >= 3) state.winStreak = 0; // cap and reset
        } else {
          state.winStreak = 0;
        }
        break;
      }

      case "1-3-2-6": {
        if (won) {
          state.sequenceStep = ((state.sequenceStep || 0) + 1) % 4;
          if (state.sequenceStep === 0) state.sequenceStep = 0; // completed cycle
        } else {
          state.sequenceStep = 0; // reset on loss
        }
        break;
      }

      case "d-alembert": {
        if (won) {
          state.currentUnits = Math.max(1, (state.currentUnits || 1) - 1);
        } else {
          state.currentUnits = (state.currentUnits || 1) + 1;
        }
        break;
      }

      case "oscars-grind": {
        const baseUnit = Math.max(1, Math.round(session.currentBankroll * 0.01));
        const profit = won ? Math.round(betAmount * (target - 1)) : -betAmount;
        state.cycleProfit = (state.cycleProfit || 0) + profit;

        if (state.cycleProfit >= baseUnit) {
          // Cycle complete — reset
          state.currentUnits = 1;
          state.cycleProfit = 0;
        } else if (won) {
          // Only increase after win if cycle is still negative
          if (state.cycleProfit < 0) {
            state.currentUnits = (state.currentUnits || 1) + 1;
          }
        }
        // On loss: keep same units (don't increase)
        if (!won) {
          state.currentUnits = state.currentUnits || 1;
        }
        break;
      }

      case "goal-seeker":
        // Stateless — all decisions derived from bankroll position
        break;

      case "sniper": {
        const phase = state.sniperPhase || "INITIAL_OBSERVE";

        if (phase === "INITIAL_OBSERVE" || phase === "OBSERVE") {
          state.sniperObserveCount = (state.sniperObserveCount || 0) + 1;
        } else if (phase === "READY") {
          if (betAmount <= 0) {
            // Trigger wasn't met — no bet placed, stay in READY
            break;
          }
          state.sniperBetsPlaced = (state.sniperBetsPlaced || 0) + 1;

          if (won) {
            state.sniperWindowHits = (state.sniperWindowHits || 0) + 1;
            state.sniperPhase = "DONE";
          } else {
            if (state.sniperBetsPlaced >= (state.sniperTotalBets || 10)) {
              state.sniperPhase = "DONE";
            } else {
              state.sniperPhase = "OBSERVE";
              state.sniperObserveCount = 0;
            }
          }
        } else if (phase === "DONE") {
          // Reset to initial observation for a new window
          state.sniperPhase = "INITIAL_OBSERVE";
          state.sniperObserveCount = 0;
          state.sniperBetsPlaced = 0;
          state.sniperTotalBets = 0;
          state.sniperWindowHits = 0;
          state.sniperComputedTarget = 0;
          state.sniperComputedBet = 0;
        }
        break;
      }

      default:
        break;
    }

    return state;
  }

  // ===== AUTO-STRATEGY SELECTOR =====
  // Evaluates every 25 rounds. Only cycles among the 7 "traditional" strategies.
  // Never switches to/from Goal Seeker or Sniper (those are intentional user picks).
  // Requires minimum 15 rounds on current strategy before considering a switch.
  // Uses a composite scoring system instead of single-threshold jumps.

  const AUTO_EVAL_INTERVAL = 25;
  const MIN_ROUNDS_BEFORE_SWITCH = 15;
  const EXCLUDED_FROM_AUTO = ["goal-seeker", "sniper"];

  function autoSelectStrategy(session) {
    const current = session.activeStrategy || "quant-kelly";

    // Never auto-switch if user intentionally selected Goal Seeker or Sniper
    if (EXCLUDED_FROM_AUTO.includes(current)) {
      return { chosen: current, reason: null, metrics: null };
    }

    // Require minimum time on current strategy
    const roundsOnCurrent = session.strategyState._roundsOnCurrent || 0;
    if (roundsOnCurrent < MIN_ROUNDS_BEFORE_SWITCH) {
      return { chosen: current, reason: null, metrics: null };
    }

    const results = session.results || [];
    const last50 = results.slice(-50);

    if (last50.length < 15) return { chosen: current, reason: null, metrics: null };

    // Performance metrics over last 50 rounds
    const wins = last50.filter(r => r.win || r.panel1Win).length;
    const winRate = wins / last50.length;
    const totalProfit = last50.reduce((sum, r) => sum + (r.profit || 0), 0);
    const profitPct = totalProfit / (session.startingBankroll || 1000);

    // Drawdown from peak in this window
    let peak = 0, maxDD = 0, running = 0;
    for (const r of last50) {
      running += (r.profit || 0);
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDD) maxDD = dd;
    }
    const drawdownPct = maxDD / (session.startingBankroll || 1000);

    // Crash volatility
    const stats = window.AviatorStrategy.getStats();
    const volatility = stats ? stats.stdDev : 2.0;

    // Trend: compare last 25 vs previous 25
    const recent25 = last50.slice(-25);
    const prev25 = last50.slice(0, 25);
    const recentWinRate = recent25.filter(r => r.win || r.panel1Win).length / Math.max(1, recent25.length);
    const prevWinRate = prev25.length > 0 ? prev25.filter(r => r.win || r.panel1Win).length / prev25.length : recentWinRate;
    const trend = recentWinRate - prevWinRate; // positive = improving

    // Composite score for each candidate strategy
    const candidates = [
      { id: "quant-kelly", score: 0 },
      { id: "flat-conservative", score: 0 },
      { id: "flat-balanced", score: 0 },
      { id: "anti-martingale", score: 0 },
      { id: "1-3-2-6", score: 0 },
      { id: "d-alembert", score: 0 },
      { id: "oscars-grind", score: 0 },
    ];

    for (const c of candidates) {
      // Bonus for being the current strategy (stability preference)
      if (c.id === current) c.score += 2;

      switch (c.id) {
        case "quant-kelly":
          // Thrives in: low volatility, decent win rate, stable conditions
          if (volatility < 2.0) c.score += 3;
          if (winRate >= 0.45 && winRate <= 0.60) c.score += 2;
          if (Math.abs(trend) < 0.05) c.score += 1; // stable
          break;

        case "flat-conservative":
          // Best when: high volatility, recent losses, need to survive
          if (volatility > 3.5) c.score += 3;
          if (drawdownPct > 0.08) c.score += 2;
          if (winRate < 0.40) c.score += 1;
          break;

        case "flat-balanced":
          // Good default: moderate everything
          if (volatility >= 1.5 && volatility <= 3.5) c.score += 2;
          if (winRate >= 0.40 && winRate <= 0.55) c.score += 2;
          if (profitPct >= -0.02 && profitPct <= 0.03) c.score += 1; // near break-even
          break;

        case "anti-martingale":
          // Rides hot streaks: high win rate + positive trend
          if (winRate > 0.55) c.score += 2;
          if (trend > 0.08) c.score += 3; // strong improving trend
          if (profitPct > 0) c.score += 1;
          break;

        case "1-3-2-6":
          // Structures wins: moderate-high win rate, already in profit
          if (winRate > 0.50) c.score += 2;
          if (profitPct > 0.03) c.score += 3;
          if (volatility < 3.0) c.score += 1;
          break;

        case "d-alembert":
          // Gentle recovery: low win rate, moderate drawdown
          if (winRate < 0.42) c.score += 2;
          if (drawdownPct > 0.05 && drawdownPct <= 0.12) c.score += 3;
          if (trend < -0.05) c.score += 1; // worsening, needs gentle approach
          break;

        case "oscars-grind":
          // Capital preservation: heavy drawdown, need to survive
          if (drawdownPct > 0.12) c.score += 4;
          if (winRate < 0.35) c.score += 2;
          if (profitPct < -0.05) c.score += 2;
          break;
      }
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    // Only switch if the best is meaningfully better than current (score gap ≥ 2)
    const currentScore = candidates.find(c => c.id === current)?.score || 0;
    const scoreDiff = best.score - currentScore;

    if (best.id === current || scoreDiff < 2) {
      return { chosen: current, reason: null, metrics: { winRate, profitPct, drawdownPct, volatility, trend } };
    }

    const reason = `Score: ${best.id}(${best.score}) > ${current}(${currentScore}) | WR:${(winRate * 100).toFixed(0)}% DD:${(drawdownPct * 100).toFixed(1)}% Vol:${volatility.toFixed(1)} Trend:${trend > 0 ? "+" : ""}${(trend * 100).toFixed(0)}%`;

    return { chosen: best.id, reason, metrics: { winRate, profitPct, drawdownPct, volatility, trend, scores: candidates.slice(0, 3).map(c => `${c.id}:${c.score}`) } };
  }

  // ===== MAIN DISPATCHER =====

  function getDecision(session) {
    let strategyId = session.activeStrategy || "quant-kelly";

    // Track rounds on current strategy
    if (!session.strategyState) session.strategyState = {};
    session.strategyState._roundsOnCurrent = (session.strategyState._roundsOnCurrent || 0) + 1;

    // Auto mode: evaluate every 25 rounds, skip for Goal Seeker / Sniper
    if (session.autoStrategy && session.roundsPlayed > 0
        && session.roundsPlayed % AUTO_EVAL_INTERVAL === 0
        && !EXCLUDED_FROM_AUTO.includes(strategyId)) {
      const { chosen, reason, metrics } = autoSelectStrategy(session);
      if (chosen !== strategyId && reason) {
        console.log(`[AviatorBot][AUTO_SWITCH] ${reason}`);
        console.log(`[AviatorBot][AUTO_SWITCH] Metrics: ${JSON.stringify(metrics)}`);
        strategyId = chosen;
        session.strategyState._roundsOnCurrent = 0; // reset counter on switch
        window.dispatchEvent(new CustomEvent("aviator-bot-event", {
          detail: { type: "strategySwitch", data: { newStrategy: chosen, reason } },
        }));
      }
    }

    switch (strategyId) {
      case "quant-kelly": return quantKelly(session);
      case "flat-conservative": return flatConservative(session);
      case "flat-balanced": return flatBalanced(session);
      case "anti-martingale": return antiMartingale(session);
      case "1-3-2-6": return system1326(session);
      case "d-alembert": return dAlembert(session);
      case "oscars-grind": return oscarsGrind(session);
      case "goal-seeker": return goalSeeker(session);
      case "sniper": return sniper(session);
      default: return quantKelly(session);
    }
  }

  const STRATEGY_LIST = [
    { id: "quant-kelly", name: "Quant / Kelly", desc: "Adaptive sizing + dynamic target" },
    { id: "goal-seeker", name: "Goal Seeker (Dubins-Savage)", desc: "Distance-to-goal dynamic aggression" },
    { id: "flat-conservative", name: "Flat Conservative", desc: "1% bet, always 1.5x" },
    { id: "flat-balanced", name: "Flat Balanced", desc: "1% bet, always 2.0x" },
    { id: "anti-martingale", name: "Anti-Martingale (Paroli)", desc: "Double on win, reset on loss" },
    { id: "1-3-2-6", name: "1-3-2-6 System", desc: "1→3→2→6 units on wins" },
    { id: "d-alembert", name: "D'Alembert", desc: "+1 unit on loss, -1 on win" },
    { id: "oscars-grind", name: "Oscar's Grind", desc: "+1 on win if cycle negative" },
    { id: "sniper", name: "Sniper (Adaptive)", desc: "Observe → analyze → fire window" },
  ];

  // ===== DAILY AUTOPILOT =====
  // Phases: OBSERVE → ACTIVE → WATCHING (target reached, keep observing)
  // Includes ALL strategies, auto-configures params, smart quit logic

  const AUTOPILOT_OBSERVE_ROUNDS = 30;
  const AUTOPILOT_EVAL_INTERVAL = 20;
  const AUTOPILOT_DEFAULT_TARGET = 0.10; // 10% daily

  function assessTiming(stats, history) {
    if (!stats || !history || history.length < 20) return { favorable: false, reason: "Insufficient data", score: 0 };

    const last20 = history.slice(-20);
    const mean = last20.reduce((s, v) => s + v, 0) / last20.length;
    const above15 = last20.filter(v => v >= 1.5).length / last20.length;
    const above2 = last20.filter(v => v >= 2.0).length / last20.length;
    const stdDev = stats.stdDev || 0;

    let score = 0;
    let reasons = [];

    // Favorable: decent hit rates (market is "warm")
    if (above15 >= 0.55) { score += 3; reasons.push("1.5x rate high"); }
    else if (above15 >= 0.45) { score += 1; reasons.push("1.5x rate OK"); }
    else { score -= 2; reasons.push("1.5x rate low"); }

    if (above2 >= 0.40) { score += 2; reasons.push("2x rate strong"); }
    else if (above2 < 0.25) { score -= 2; reasons.push("2x rate weak"); }

    // Favorable: moderate volatility (not chaotic, not dead)
    if (stdDev >= 1.0 && stdDev <= 3.0) { score += 2; reasons.push("vol stable"); }
    else if (stdDev > 5.0) { score -= 3; reasons.push("vol extreme"); }
    else if (stdDev > 3.0) { score -= 1; reasons.push("vol high"); }

    // Favorable: mean is healthy
    if (mean >= 1.8 && mean <= 3.5) { score += 1; reasons.push("mean healthy"); }
    else if (mean < 1.4) { score -= 2; reasons.push("mean crushed"); }

    // Look for recent momentum (last 10 vs prev 10)
    const recent10 = last20.slice(-10);
    const prev10 = last20.slice(0, 10);
    const recentMean = recent10.reduce((s, v) => s + v, 0) / 10;
    const prevMean = prev10.reduce((s, v) => s + v, 0) / 10;
    if (recentMean > prevMean * 1.1) { score += 1; reasons.push("momentum up"); }
    else if (recentMean < prevMean * 0.8) { score -= 1; reasons.push("momentum down"); }

    const favorable = score >= 3;
    return { favorable, score, reason: reasons.join(", ") };
  }

  function autopilotPickStrategy(session, stats, history) {
    const currentBR = session.currentBankroll || 1000;
    const startBR = session.startingBankroll || 1000;
    const profitPct = (currentBR - startBR) / startBR;
    const peak = session.peakBankroll || startBR;
    const drawdownFromPeak = (peak - currentBR) / peak;

    const results = session.results || [];
    const last30 = results.slice(-30);
    const winRate = last30.length > 0 ? last30.filter(r => r.win || r.panel1Win).length / last30.length : 0.5;
    const volatility = stats ? stats.stdDev : 2.0;

    const above2Rate = history.length >= 20
      ? history.slice(-20).filter(v => v >= 2.0).length / 20
      : 0.4;

    // Determine best strategy based on current situation
    // Priority: survival first, then profit maximization

    // CRISIS: Deep in drawdown — ultra-safe
    if (drawdownFromPeak > 0.06) {
      return { strategy: "oscars-grind", reason: "Crisis: deep drawdown, capital preservation" };
    }

    // RECOVERY: Moderate drawdown
    if (drawdownFromPeak > 0.03) {
      if (winRate > 0.5) return { strategy: "d-alembert", reason: "Recovery: moderate DD + decent WR, gentle climb" };
      return { strategy: "flat-conservative", reason: "Recovery: moderate DD + low WR, survive" };
    }

    // CLOSE TO TARGET: > 7% profit — lock it in
    if (profitPct > 0.07) {
      return { strategy: "goal-seeker", reason: "Near target: using Goal Seeker to lock in gains" };
    }

    // IN PROFIT: 3-7% — ride momentum but safe
    if (profitPct > 0.03) {
      if (winRate > 0.55 && volatility < 3.0) {
        return { strategy: "anti-martingale", reason: "In profit + hot streak: ride it with Anti-Martingale" };
      }
      if (winRate > 0.5) {
        return { strategy: "1-3-2-6", reason: "In profit + good WR: structured wins with 1-3-2-6" };
      }
      return { strategy: "flat-balanced", reason: "In profit: steady 2x play" };
    }

    // NEUTRAL: Near break-even
    if (profitPct >= -0.01) {
      if (volatility < 2.0 && above2Rate > 0.4) {
        return { strategy: "quant-kelly", reason: "Neutral + stable + good rates: Kelly edge-seeking" };
      }
      if (above2Rate > 0.35 && history.length >= 50) {
        // Sniper opportunity: check if high multipliers are appearing
        const highHits = history.slice(-50).filter(v => v >= 10).length;
        if (highHits >= 4) {
          return { strategy: "sniper", reason: `Neutral + high multiplier activity (${highHits} hits of 10x+ in 50): Sniper` };
        }
      }
      return { strategy: "quant-kelly", reason: "Neutral: default Kelly" };
    }

    // SLIGHT LOSS: -1% to -3%
    if (profitPct >= -0.03) {
      if (winRate < 0.4) return { strategy: "flat-conservative", reason: "Slight loss + low WR: survive with flat 1.5x" };
      return { strategy: "d-alembert", reason: "Slight loss: gentle recovery with D'Alembert" };
    }

    // Fallback: we're losing more than 3% — safe mode
    return { strategy: "flat-conservative", reason: "Losing > 3%: flat conservative survival" };
  }

  function autopilotShouldQuit(session, stats, history) {
    const currentBR = session.currentBankroll || 1000;
    const startBR = session.startingBankroll || 1000;
    const profitPct = (currentBR - startBR) / startBR;
    const results = session.results || [];

    // Smart quit reasons (beyond hard stop-loss):

    // 1. Losing velocity: lost > 3% in last 15 rounds
    if (results.length >= 15) {
      const last15 = results.slice(-15);
      const windowProfit = last15.reduce((s, r) => s + (r.profit || 0), 0);
      const windowPct = windowProfit / startBR;
      if (windowPct < -0.03) {
        return { quit: true, reason: "Smart quit: losing 3%+ in last 15 rounds — bad timing" };
      }
    }

    // 2. Win rate collapsed over last 20 rounds
    if (results.length >= 20) {
      const last20 = results.slice(-20);
      const wins = last20.filter(r => r.win || r.panel1Win).length;
      if (wins / 20 < 0.25) {
        return { quit: true, reason: "Smart quit: win rate below 25% in last 20 rounds" };
      }
    }

    // 3. Volatility spiked to extreme and we're in loss
    if (stats && stats.stdDev > 6.0 && profitPct < 0) {
      return { quit: true, reason: "Smart quit: extreme volatility while in loss — retreat" };
    }

    // 4. Timing unfavorable for too long (30+ rounds of bad conditions)
    const ap = session.strategyState?._autopilot || {};
    if (ap.unfavorableStreak >= 30 && profitPct < 0.02) {
      return { quit: true, reason: "Smart quit: 30+ rounds of unfavorable timing — session is cold" };
    }

    return { quit: false, reason: null };
  }

  function autopilotAutoConfigStrategy(strategyId, session) {
    const state = session.strategyState || {};
    const currentBR = session.currentBankroll || 1000;
    const startBR = session.startingBankroll || 1000;
    const targetPct = state._autopilot?.dailyTarget || AUTOPILOT_DEFAULT_TARGET;

    switch (strategyId) {
      case "goal-seeker":
        // Auto-set drawdown/takeprofit for goal seeker to use session boundaries
        session.drawdownPercent = session.drawdownPercent || 0.05;
        session.takeProfitPercent = 1 + targetPct;
        break;

      case "sniper":
        // Auto-configure sniper with balanced defaults
        state.sniperObserveRounds = 50;
        state.sniperMaxRisk = 0.04; // slightly less than default since autopilot manages risk
        state.sniperConfidence = 0.5;
        state.sniperDynamicTarget = true;
        state.sniperTrigger = "dry-spell"; // patience in autopilot mode
        state.sniperPhase = "INITIAL_OBSERVE";
        state.sniperObserveCount = 0;
        state.sniperBetsPlaced = 0;
        state.sniperTotalBets = 0;
        state.sniperWindowHits = 0;
        break;

      case "anti-martingale":
        state.currentUnits = 1;
        state.streakCount = 0;
        break;

      case "1-3-2-6":
        state.sequenceStep = 0;
        break;

      case "d-alembert":
        state.currentUnits = 1;
        break;

      case "oscars-grind":
        state.currentUnits = 1;
        state.cycleProfit = 0;
        break;
    }

    session.strategyState = state;
  }

  function dailyAutopilot(session) {
    const state = session.strategyState || {};
    if (!state._autopilot) {
      state._autopilot = {
        phase: "OBSERVE",
        observeCount: 0,
        dailyTarget: AUTOPILOT_DEFAULT_TARGET,
        roundsActive: 0,
        strategySwitches: 0,
        unfavorableStreak: 0,
        lastPickReason: "",
      };
      session.strategyState = state;
    }

    const ap = state._autopilot;
    const stats = window.AviatorStrategy.getStats();
    const history = window.AviatorStrategy.getHistory ? window.AviatorStrategy.getHistory() : [];
    const currentBR = session.currentBankroll || 1000;
    const startBR = session.startingBankroll || 1000;
    const profitPct = (currentBR - startBR) / startBR;

    // Check if daily target already reached → WATCHING phase
    if (profitPct >= ap.dailyTarget) {
      ap.phase = "WATCHING";
      session.strategyState = state;
      return {
        shouldBet: false,
        betAmount: 0,
        cashoutTarget: 0,
        panel2: null,
        reason: `AUTOPILOT TARGET REACHED (+${(profitPct * 100).toFixed(1)}%) — watching game, no more bets today`,
        winProbability: 0,
        ev: 0,
        kellyPct: 0,
        volatility: "Low",
        stats,
        autopilot: { phase: "WATCHING", profitPct, dailyTarget: ap.dailyTarget },
      };
    }

    // WATCHING phase: target was reached, keep observing only
    if (ap.phase === "WATCHING") {
      return {
        shouldBet: false,
        betAmount: 0,
        cashoutTarget: 0,
        panel2: null,
        reason: `AUTOPILOT WATCHING — target was ${(ap.dailyTarget * 100).toFixed(0)}%, current ${(profitPct * 100).toFixed(1)}%. No bets.`,
        winProbability: 0,
        ev: 0,
        kellyPct: 0,
        volatility: "Low",
        stats,
        autopilot: { phase: "WATCHING", profitPct },
      };
    }

    // OBSERVE phase: collect data before entering market
    if (ap.phase === "OBSERVE") {
      ap.observeCount++;

      if (ap.observeCount >= AUTOPILOT_OBSERVE_ROUNDS && history.length >= 20) {
        const timing = assessTiming(stats, history);
        if (timing.favorable) {
          ap.phase = "ACTIVE";
          ap.unfavorableStreak = 0;
          console.log(`[AviatorBot][AUTOPILOT] Timing favorable (score: ${timing.score}): ${timing.reason}. Entering ACTIVE.`);
        } else {
          // Stay in observe, reset counter (check again in 10 rounds)
          ap.observeCount = AUTOPILOT_OBSERVE_ROUNDS - 10;
          ap.unfavorableStreak = (ap.unfavorableStreak || 0) + 10;
        }

        session.strategyState = state;
        return {
          shouldBet: false,
          betAmount: 0,
          cashoutTarget: 0,
          panel2: null,
          reason: `AUTOPILOT OBSERVING (${ap.observeCount}/${AUTOPILOT_OBSERVE_ROUNDS}) — timing: ${timing.reason} (score: ${timing.score})`,
          winProbability: 0,
          ev: 0,
          kellyPct: 0,
          volatility: "Low",
          stats,
          autopilot: { phase: "OBSERVE", timing, observeCount: ap.observeCount },
        };
      }

      session.strategyState = state;
      return {
        shouldBet: false,
        betAmount: 0,
        cashoutTarget: 0,
        panel2: null,
        reason: `AUTOPILOT OBSERVING (${ap.observeCount}/${AUTOPILOT_OBSERVE_ROUNDS}) — collecting initial data...`,
        winProbability: 0,
        ev: 0,
        kellyPct: 0,
        volatility: "Low",
        stats,
        autopilot: { phase: "OBSERVE", observeCount: ap.observeCount },
      };
    }

    // ACTIVE phase: pick strategy, check timing, delegate

    // Smart quit check
    const quitCheck = autopilotShouldQuit(session, stats, history);
    if (quitCheck.quit) {
      ap.phase = "QUIT";
      session.strategyState = state;
      return {
        shouldBet: false,
        betAmount: 0,
        cashoutTarget: 0,
        panel2: null,
        reason: `AUTOPILOT QUIT: ${quitCheck.reason}`,
        winProbability: 0,
        ev: 0,
        kellyPct: 0,
        volatility: "Low",
        stats,
        autopilot: { phase: "QUIT", reason: quitCheck.reason },
      };
    }

    // Re-assess timing every 20 rounds
    ap.roundsActive = (ap.roundsActive || 0) + 1;
    if (ap.roundsActive % AUTOPILOT_EVAL_INTERVAL === 0 && history.length >= 20) {
      const timing = assessTiming(stats, history);
      if (!timing.favorable) {
        // Pause: go back to short observation
        ap.phase = "OBSERVE";
        ap.observeCount = AUTOPILOT_OBSERVE_ROUNDS - 10; // re-check in 10 rounds
        ap.unfavorableStreak = (ap.unfavorableStreak || 0) + 1;
        session.strategyState = state;
        console.log(`[AviatorBot][AUTOPILOT] Timing turned unfavorable (score: ${timing.score}). Pausing to re-observe.`);
        return {
          shouldBet: false,
          betAmount: 0,
          cashoutTarget: 0,
          panel2: null,
          reason: `AUTOPILOT PAUSING — timing unfavorable: ${timing.reason}. Re-observing...`,
          winProbability: 0,
          ev: 0,
          kellyPct: 0,
          volatility: "Low",
          stats,
          autopilot: { phase: "PAUSING", timing },
        };
      }
      ap.unfavorableStreak = 0;
    }

    // Pick (or re-pick) strategy every 20 active rounds
    const roundsSinceSwitch = state._roundsOnCurrent || 0;
    if (roundsSinceSwitch === 0 || (roundsSinceSwitch >= 15 && ap.roundsActive % AUTOPILOT_EVAL_INTERVAL === 0)) {
      const pick = autopilotPickStrategy(session, stats, history);
      const currentStrat = session.activeStrategy;

      if (pick.strategy !== currentStrat) {
        console.log(`[AviatorBot][AUTOPILOT] Switching: ${currentStrat} → ${pick.strategy} | ${pick.reason}`);
        session.activeStrategy = pick.strategy;
        state._roundsOnCurrent = 0;
        ap.strategySwitches++;
        ap.lastPickReason = pick.reason;

        // Auto-configure the new strategy's parameters
        autopilotAutoConfigStrategy(pick.strategy, session);

        window.dispatchEvent(new CustomEvent("aviator-bot-event", {
          detail: { type: "strategySwitch", data: { newStrategy: pick.strategy, reason: `[AUTOPILOT] ${pick.reason}` } },
        }));
      }
    }

    // Delegate to the active strategy's decision function
    const activeStrat = session.activeStrategy || "quant-kelly";
    let decision;
    switch (activeStrat) {
      case "quant-kelly": decision = quantKelly(session); break;
      case "flat-conservative": decision = flatConservative(session); break;
      case "flat-balanced": decision = flatBalanced(session); break;
      case "anti-martingale": decision = antiMartingale(session); break;
      case "1-3-2-6": decision = system1326(session); break;
      case "d-alembert": decision = dAlembert(session); break;
      case "oscars-grind": decision = oscarsGrind(session); break;
      case "goal-seeker": decision = goalSeeker(session); break;
      case "sniper": decision = sniper(session); break;
      default: decision = quantKelly(session); break;
    }

    // Annotate decision with autopilot context
    decision.reason = `[AP:${activeStrat}] ${decision.reason}`;
    decision.autopilot = {
      phase: "ACTIVE",
      activeStrategy: activeStrat,
      profitPct,
      targetPct: ap.dailyTarget,
      roundsActive: ap.roundsActive,
      switches: ap.strategySwitches,
      lastReason: ap.lastPickReason,
    };

    session.strategyState = state;
    return decision;
  }

  return {
    getDecision,
    updateStrategyState,
    dailyAutopilot,
    assessTiming,
    autopilotShouldQuit,
    STRATEGY_LIST,
  };
})();
