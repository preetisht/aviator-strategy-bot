// Aviator Quant Bot — reads crash multipliers, runs adaptive strategy
// Supports both simulation mode and REAL betting with human-like interaction
// Depends on: window.AviatorStrategy, window.AviatorStats, window.AviatorLicense

(() => {
  // Initialize license on load
  if (window.AviatorLicense) {
    window.AviatorLicense.initialize().then((result) => {
      console.log(`[AviatorBot][LICENSE] Init: tier=${result.tier || "free"}, valid=${result.valid}`);
    });
  }

  let session = null;
  let botRunning = false;
  let skippedInARow = 0;
  const MAX_SKIP_BEFORE_FORCE = 3;

  const MULTIPLIER_SELECTORS = [
    ".payouts-block .payout",
    ".crash-result",
    '[data-testid="crash-result"]',
    ".bubble-multiplier",
    ".multiplier",
    ".coefficient",
  ];

  const HISTORY_SELECTORS = [
    ".payouts-block",
    ".recent-results",
    ".rounds-history",
    '[class*="history"]',
    '[class*="payout"]',
  ];

  function log(msg) {
    const now = new Date();
    const ts = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    console.log(`[AviatorBot][${ts}] ${msg}`);
  }

  function logRound(result, decision, session) {
    const now = new Date();
    const ts = now.toISOString();
    const strategy = session.activeStrategy || "quant-kelly";
    const p1 = result.panel1Win !== undefined ? (result.panel1Win ? "WIN" : "LOSS") : (result.win ? "WIN" : "LOSS");
    const p2 = result.panel2Target ? (result.panel2Win ? "WIN" : "LOSS") : "N/A";
    const data = {
      timestamp: ts,
      round: result.round,
      strategy,
      crash: result.crashPoint || 0,
      p1_target: decision.cashoutTarget,
      p1_bet: decision.betAmount,
      p1_result: p1,
      p2_target: decision.panel2?.target || 0,
      p2_bet: decision.panel2?.amount || 0,
      p2_result: p2,
      profit: result.profit,
      bankroll: result.bankrollAfter || session.currentBankroll,
      ev: decision.ev || 0,
      win_prob: decision.winProbability || 0,
      kelly_pct: decision.kellyPct || 0,
      volatility: decision.volatility || "unknown",
      consec_losses: session.consecutiveLosses,
      consec_wins: session.consecutiveWins,
    };
    console.log(`[AviatorBot][ROUND_DATA] ${JSON.stringify(data)}`);

    // Persist to storage for later export
    if (isExtensionValid()) {
      try {
        chrome.runtime.sendMessage({ action: "appendLog", entry: data });
      } catch (e) { /* ignore if context lost */ }
    }

    // Session summary every 10 rounds
    if (session.roundsPlayed % 10 === 0 && session.roundsPlayed > 0) {
      logSessionSummary(session);
    }
  }

  function logSessionSummary(session) {
    const results = session.results || [];
    const wins = results.filter(r => r.win || r.panel1Win).length;
    const p2Wins = results.filter(r => r.panel2Win).length;
    const totalProfit = session.currentBankroll - session.startingBankroll;
    const totalBet = results.reduce((sum, r) => sum + (r.betAmount || 0), 0);
    const roi = totalBet > 0 ? ((totalProfit / totalBet) * 100).toFixed(2) : "0.00";
    const maxDrawdown = calculateMaxDrawdown(results, session.startingBankroll);

    const summary = {
      timestamp: new Date().toISOString(),
      strategy: session.activeStrategy || "quant-kelly",
      rounds_played: session.roundsPlayed,
      starting_bankroll: session.startingBankroll,
      current_bankroll: session.currentBankroll,
      peak_bankroll: session.peakBankroll || session.startingBankroll,
      total_profit: totalProfit,
      total_wagered: totalBet,
      roi_pct: parseFloat(roi),
      win_rate_p1: results.length > 0 ? parseFloat(((wins / results.length) * 100).toFixed(1)) : 0,
      win_rate_p2: results.length > 0 ? parseFloat(((p2Wins / results.length) * 100).toFixed(1)) : 0,
      max_drawdown: maxDrawdown,
      avg_profit_per_round: results.length > 0 ? parseFloat((totalProfit / results.length).toFixed(2)) : 0,
      consec_losses: session.consecutiveLosses,
      consec_wins: session.consecutiveWins,
    };
    console.log(`[AviatorBot][SESSION_SUMMARY] ${JSON.stringify(summary)}`);
  }

  function calculateMaxDrawdown(results, startingBankroll) {
    let peak = startingBankroll;
    let maxDD = 0;
    let current = startingBankroll;
    for (const r of results) {
      current = r.bankrollAfter || (current + (r.profit || 0));
      if (current > peak) peak = current;
      const dd = peak - current;
      if (dd > maxDD) maxDD = dd;
    }
    return maxDD;
  }

  // ===== HUMAN-LIKE HELPERS =====

  function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function humanDelay(min = 200, max = 600) {
    await sleep(randomDelay(min, max));
  }

  function simulateClick(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 4;
    const y = rect.top + rect.height / 2 + (Math.random() - 0.5) * 4;

    element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: x, clientY: y }));
    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: x, clientY: y }));
    element.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: x, clientY: y }));
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: x, clientY: y }));
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: x, clientY: y }));
  }

  async function humanType(input, value) {
    const strValue = String(value);
    log(`REAL BET: Typing "${strValue}" into input (current: "${input.value}")`);

    // Focus and select all
    input.focus();
    input.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
    await humanDelay(80, 150);

    // Select all text
    input.select();
    input.setSelectionRange(0, input.value.length);
    await humanDelay(50, 100);

    // Delete selected text via Ctrl+A then Delete
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "a", ctrlKey: true, bubbles: true }));
    await sleep(50);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete", bubbles: true }));
    await sleep(50);

    // Use native setter
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;

    // Set the full value at once and fire input event
    nativeSetter.call(input, strValue);
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    await humanDelay(50, 100);

    // Also try triggering Vue's internal handler via compositionend
    input.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    input.dispatchEvent(new CompositionEvent("compositionend", { data: strValue, bubbles: true }));
    await humanDelay(30, 80);

    // Fire change and blur
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
    await humanDelay(50, 100);

    // If value still didn't stick, try clicking minus to zero then typing fresh
    if (input.value !== strValue) {
      log(`REAL BET: Native setter didn't stick, trying direct assignment`);
      // Direct property override as last resort
      Object.defineProperty(input, 'value', {
        get() { return strValue; },
        set(v) { nativeSetter.call(input, v); },
        configurable: true,
      });
      nativeSetter.call(input, strValue);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    log(`REAL BET: Input value after typing = "${input.value}"`);
  }

  // ===== REAL BETTING — DOM FINDERS =====

  // panelIndex: 0 = first (left) panel, 1 = second (right) panel
  function findBetInput(panelIndex = 0) {
    const spinners = document.querySelectorAll('.spinner.big');
    if (spinners.length > panelIndex) {
      const input = spinners[panelIndex].querySelector('.input input[type="text"]') ||
                    spinners[panelIndex].querySelector('input.font-weight-bold') ||
                    spinners[panelIndex].querySelector('input[type="text"]');
      if (input) return input;
    }
    // Fallback for panel 0 only
    if (panelIndex === 0) {
      return document.querySelector('.spinner.big .input input[type="text"]');
    }
    return null;
  }

  function findBetButton(panelIndex = 0) {
    // The bet "button" is a <span> containing <label class="label"> with text "Bet"
    // Structure: <span data-v-60ac87cb class="d-flex..."> > <label class="label"> Bet </label> ...
    const betButtons = [];
    const labels = document.querySelectorAll('label.label, label.text-uppercase');
    for (const label of labels) {
      const text = label.textContent.trim().toLowerCase();
      if (text === 'bet') {
        // Walk up to the clickable parent span (the one with d-flex class)
        const btn = label.closest('button');
        if (btn) {
          betButtons.push(btn);
        } else {
          // The clickable is the parent span wrapping both labels
          const parentSpan = label.parentElement;
          if (parentSpan && parentSpan.tagName === 'SPAN') {
            betButtons.push(parentSpan);
          } else {
            // Try grandparent
            const grandParent = parentSpan?.parentElement;
            if (grandParent) betButtons.push(grandParent);
            else betButtons.push(label);
          }
        }
      }
    }
    // Deduplicate (same parent span might be found multiple times)
    const unique = [...new Set(betButtons)];
    if (unique.length > panelIndex) return unique[panelIndex];
    if (unique.length > 0 && panelIndex === 0) return unique[0];
    return null;
  }

  function findCashoutButton(panelIndex = 0) {
    const cashoutButtons = [];
    const labels = document.querySelectorAll('label.label, label.text-uppercase, label');
    for (const label of labels) {
      const text = label.textContent.trim().toLowerCase();
      if (text.includes('cash') && text.includes('out')) {
        const btn = label.closest('button');
        if (btn) {
          cashoutButtons.push(btn);
        } else {
          const parentSpan = label.parentElement;
          if (parentSpan && parentSpan.tagName === 'SPAN') {
            cashoutButtons.push(parentSpan);
          } else {
            const grandParent = parentSpan?.parentElement;
            if (grandParent) cashoutButtons.push(grandParent);
            else cashoutButtons.push(label);
          }
        }
      }
    }
    const unique = [...new Set(cashoutButtons)];
    if (unique.length > panelIndex) return unique[panelIndex];
    if (unique.length > 0 && panelIndex === 0) return unique[0];
    return null;
  }

  function getBetButtonState(panelIndex = 0) {
    // Check the state of a specific panel's button
    const betButtons = [];
    const labels = document.querySelectorAll('label.label, label');
    const seen = new Set();

    for (const label of labels) {
      const text = label.textContent.trim().toLowerCase();
      const btn = label.closest('button') || label.closest('[data-v-60ac87cb]');
      if (!btn || seen.has(btn)) continue;
      seen.add(btn);

      if (text.includes('cash') && text.includes('out')) {
        betButtons.push({ el: btn, state: "cashout" });
      } else if (text === 'cancel') {
        betButtons.push({ el: btn, state: "cancel" });
      } else if (text === 'bet') {
        betButtons.push({ el: btn, state: "bet" });
      }
    }

    if (betButtons.length > panelIndex) return betButtons[panelIndex].state;
    if (betButtons.length > 0 && panelIndex === 0) return betButtons[0].state;
    return "unknown";
  }

  function getCurrentMultiplier() {
    // The live multiplier during flight is inside: .dom-game .bet-wrapper .bet-text
    const liveEl = document.querySelector('.dom-game .bet-wrapper .bet-text');
    if (liveEl) {
      const val = parseMultiplier(liveEl.textContent);
      if (val && val >= 1.0) return val;
    }
    // Fallback: try .bet-text alone
    const betText = document.querySelector('.bet-text');
    if (betText) {
      const val = parseMultiplier(betText.textContent);
      if (val && val >= 1.0) return val;
    }
    return null;
  }

  function isPlaneFlying() {
    // Check if the live multiplier element has "color-normal" class (flying state)
    const liveEl = document.querySelector('.dom-game .bet-wrapper .bet-text');
    if (liveEl) {
      return liveEl.classList.contains('color-normal');
    }
    return false;
  }

  // ===== REAL BETTING — STATE MACHINE =====

  let realBetState = "IDLE"; // IDLE, WAITING_FOR_BET_PHASE, PLACING_BET, BET_PLACED, MONITORING_CASHOUT, ROUND_COMPLETE
  let currentDecision = null;
  let betPlacedTime = 0;
  let cashoutPollingId = null;
  let realBetActive = false;

  async function startRealBetting(decision) {
    if (realBetActive) {
      log("Real bet already in progress, skipping");
      return;
    }

    realBetActive = true;
    currentDecision = decision;
    realBetState = "WAITING_FOR_BET_PHASE";

    const hasPanel2 = decision.panel2 && decision.panel2.amount > 0;
    log(`REAL BET: Starting — P1: ₹${decision.betAmount} @ ${decision.cashoutTarget}x` +
        (hasPanel2 ? ` | P2: ₹${decision.panel2.amount} @ ${decision.panel2.target}x` : ""));
    notifyPanel("log", { message: `P1: ₹${decision.betAmount}@${decision.cashoutTarget}x` +
        (hasPanel2 ? ` P2: ₹${decision.panel2.amount}@${decision.panel2.target}x` : "") });

    try {
      // Step 1: Wait for betting phase
      log("REAL BET: Looking for BET phase...");
      const betReady = await waitForBetPhase(15000);
      if (!betReady || !botRunning) {
        log("REAL BET: Betting phase not detected within 15s");
        realBetActive = false;
        realBetState = "IDLE";
        return false;
      }

      log("REAL BET: Betting phase detected!");
      realBetState = "PLACING_BET";
      await humanDelay(500, 1000);

      // Step 2: Place Panel 1 bet (safe)
      const input1 = findBetInput(0);
      if (!input1) {
        log("REAL BET: ERROR — Panel 1 input not found");
        realBetActive = false;
        realBetState = "IDLE";
        return false;
      }

      await humanType(input1, decision.betAmount.toFixed(2));
      log(`REAL BET: P1 amount set = ₹${decision.betAmount}`);
      await humanDelay(200, 500);

      const betBtn1 = findBetButton(0);
      if (!betBtn1) {
        log("REAL BET: ERROR — Panel 1 BET button not found");
        realBetActive = false;
        realBetState = "IDLE";
        return false;
      }

      simulateClick(betBtn1);
      log("REAL BET: P1 BET clicked!");
      await humanDelay(300, 600);

      // Step 3: Place Panel 2 bet (hunter) if active
      log(`REAL BET: hasPanel2=${hasPanel2}, panel2=${JSON.stringify(decision.panel2)}`);
      if (hasPanel2) {
        const input2 = findBetInput(1);
        if (input2) {
          await humanType(input2, decision.panel2.amount.toFixed(2));
          log(`REAL BET: P2 amount set = ₹${decision.panel2.amount}`);
          await humanDelay(200, 500);

          // After P1 clicked, P2's bet button is now the only one showing "Bet" (index 0)
          const betBtn2 = findBetButton(0);
          if (betBtn2) {
            log(`REAL BET: P2 button found (tag: ${betBtn2.tagName}, class: "${betBtn2.className?.substring(0, 40)}")`);
            simulateClick(betBtn2);
            log("REAL BET: P2 BET clicked!");
          } else {
            log("REAL BET: WARNING — Panel 2 BET button not found, continuing with P1 only");
          }
        } else {
          log("REAL BET: WARNING — Panel 2 input not found, continuing with P1 only");
        }
      }

      betPlacedTime = Date.now();
      realBetState = "BET_PLACED";
      notifyPanel("log", { message: "Bets placed — waiting for flight..." });

      await humanDelay(500, 1000);

      // Step 4: Monitor for cashout — need to cash out P1 at its target, P2 at its target
      realBetState = "MONITORING_CASHOUT";
      const result = await monitorDualCashout(decision);

      realBetState = "ROUND_COMPLETE";
      realBetActive = false;
      return result;

    } catch (err) {
      log(`REAL BET ERROR: ${err.message}`);
      notifyPanel("log", { message: `ERROR: ${err.message}` });
      realBetActive = false;
      realBetState = "IDLE";
      return false;
    }
  }

  async function waitForBetPhase(timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (!botRunning) return false;
      const state = getBetButtonState();
      if (state === "bet") return true;
      await sleep(200);
    }
    return false;
  }

  async function monitorDualCashout(decision) {
    const target1 = decision.cashoutTarget;
    const target2 = decision.panel2 ? decision.panel2.target : 0;
    let panel1CashedOut = false;
    let panel2CashedOut = false;
    const hasPanel2 = target2 > 0;

    // Wait for CASH OUT to appear on panel 1 (plane started flying)
    const startWait = Date.now();
    let cashoutAppeared = false;

    while (Date.now() - startWait < 30000) {
      if (!botRunning) return { panel1Win: false, panel2Win: false };
      const state = getBetButtonState(0);

      if (state === "cashout") {
        cashoutAppeared = true;
        break;
      }

      if (state === "bet" && Date.now() - betPlacedTime > 5000) {
        log("REAL BET: P1 button returned to BET — round ended during wait");
        return { panel1Win: false, panel2Win: false };
      }

      await sleep(100);
    }

    if (!cashoutAppeared) {
      log("REAL BET: CASH OUT never appeared (timeout)");
      return { panel1Win: false, panel2Win: false };
    }

    log(`REAL BET: Flying! P1 target: ${target1}x` + (hasPanel2 ? ` | P2 target: ${target2}x` : ""));
    notifyPanel("log", { message: `Flying! P1@${target1}x` + (hasPanel2 ? ` P2@${target2}x` : "") });

    let pollCount = 0;
    while (botRunning) {
      const currentMult = getCurrentMultiplier();
      const flying = isPlaneFlying();

      pollCount++;
      if (pollCount % 20 === 0 || pollCount <= 3) {
        log(`REAL BET: Poll #${pollCount} — mult=${currentMult?.toFixed(2) || "null"} flying=${flying} p1Out=${panel1CashedOut} p2Out=${panel2CashedOut}`);
      }

      // Check if round ended (plane crashed)
      if (!flying && pollCount > 10) {
        log(`REAL BET: Round ended (crashed). P1: ${panel1CashedOut ? "WIN" : "LOSS"}, P2: ${panel2CashedOut ? "WIN" : hasPanel2 ? "LOSS" : "N/A"}`);
        return { panel1Win: panel1CashedOut, panel2Win: panel2CashedOut };
      }

      // Also check if panel 1 button reverted to "bet" (round ended)
      if (!panel1CashedOut && getBetButtonState(0) !== "cashout" && pollCount > 10) {
        log("REAL BET: P1 button no longer cashout — round ended");
        return { panel1Win: panel1CashedOut, panel2Win: panel2CashedOut };
      }

      // Cash out Panel 1 at its target
      if (!panel1CashedOut && currentMult && currentMult >= target1) {
        await sleep(randomDelay(50, 120));
        if (!isPlaneFlying()) { return { panel1Win: false, panel2Win: false }; }

        const cashoutBtn1 = findCashoutButton(0);
        if (cashoutBtn1) {
          simulateClick(cashoutBtn1);
          panel1CashedOut = true;
          log(`REAL BET: P1 CASHED OUT at ${currentMult.toFixed(2)}x`);
          notifyPanel("log", { message: `P1 cashed out at ${currentMult.toFixed(2)}x!` });
        }
      }

      // Cash out Panel 2 at its higher target
      if (hasPanel2 && !panel2CashedOut && currentMult && currentMult >= target2) {
        await sleep(randomDelay(50, 120));
        if (!isPlaneFlying()) {
          return { panel1Win: panel1CashedOut, panel2Win: false };
        }

        // After P1 cashes out, P2's cashout button is the only one left (index 0)
        const p2CashoutIndex = panel1CashedOut ? 0 : 1;
        const cashoutBtn2 = findCashoutButton(p2CashoutIndex);
        if (cashoutBtn2) {
          simulateClick(cashoutBtn2);
          panel2CashedOut = true;
          log(`REAL BET: P2 CASHED OUT at ${currentMult.toFixed(2)}x`);
          notifyPanel("log", { message: `P2 cashed out at ${currentMult.toFixed(2)}x!` });
        } else {
          log(`REAL BET: P2 cashout button not found at index ${p2CashoutIndex}`);
        }
      }

      // If both cashed out, we're done
      if (panel1CashedOut && (!hasPanel2 || panel2CashedOut)) {
        return { panel1Win: true, panel2Win: panel2CashedOut };
      }

      await sleep(50);
    }

    return { panel1Win: panel1CashedOut, panel2Win: panel2CashedOut };
  }

  // ===== MULTIPLIER READING =====

  function findMultiplierElement() {
    for (const sel of MULTIPLIER_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    const allElements = document.querySelectorAll("*");
    for (const el of allElements) {
      if (el.children.length > 2) continue;
      const text = el.textContent?.trim();
      if (!text) continue;
      if (/^\d+\.\d{2}x$/i.test(text)) {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        if (fontSize >= 24) return el;
      }
    }
    return null;
  }

  function parseMultiplier(text) {
    const match = text?.match(/(\d+\.\d+)x/i);
    return match ? parseFloat(match[1]) : null;
  }

  function isCrashedState(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    const color = style.color;
    if (color.includes("rgb(255") || color.includes("rgb(231") || color.includes("rgb(220")) {
      return true;
    }
    const parent = el.closest('[class*="game"]') || el.parentElement?.parentElement;
    if (parent?.textContent?.toLowerCase().includes("flew away")) {
      return true;
    }
    return false;
  }

  // ===== HISTORY BAR WATCHING =====

  let lastHistoryFingerprint = "";
  let lastCrashTime = 0;
  const MIN_INTERVAL_MS = 3000;

  function checkHistoryBar() {
    for (const sel of HISTORY_SELECTORS) {
      const container = document.querySelector(sel);
      if (!container) continue;

      const items = container.querySelectorAll("*");
      const multipliers = [];
      for (const item of items) {
        if (item.children.length > 1) continue;
        const val = parseMultiplier(item.textContent);
        if (val !== null && val >= 1.0 && val < 1000) {
          multipliers.push(val);
        }
      }

      if (multipliers.length === 0) continue;

      const fingerprint = multipliers.slice(0, 3).join(",");
      if (fingerprint !== lastHistoryFingerprint) {
        const now = Date.now();
        if (now - lastCrashTime < MIN_INTERVAL_MS) return;

        lastHistoryFingerprint = fingerprint;
        lastCrashTime = now;
        const crashValue = multipliers[0];
        onNewCrashDetected(crashValue);
      }
      return;
    }
  }

  let wasFlying = false;

  function checkMultiplierElement() {
    const el = findMultiplierElement();
    if (!el) return;

    const text = el.textContent?.trim();
    const multiplier = parseMultiplier(text);
    if (!multiplier) return;

    const crashed = isCrashedState(el);

    if (!crashed && multiplier > 1.0) {
      wasFlying = true;
    } else if (crashed && wasFlying) {
      const now = Date.now();
      if (now - lastCrashTime >= MIN_INTERVAL_MS) {
        lastCrashTime = now;
        wasFlying = false;
        onNewCrashDetected(multiplier);
      }
    }
  }

  // ===== CORE: New crash detected =====

  function onNewCrashDetected(crashValue) {
    log(`Crash: ${crashValue.toFixed(2)}x`);
    notifyPanel("gameDetected", {});

    window.AviatorStrategy.addToHistory(crashValue);

    const stats = window.AviatorStrategy.getStats();
    const historyData = window.AviatorStrategy.getHistory();
    notifyPanel("liveStats", { stats, historyLast20: historyData.slice(-20) });

    if (!botRunning || !session || session.botStatus !== "RUNNING") return;
    if (realBetActive) return; // Don't trigger new round while bet is in progress

    // Check stop conditions
    const stopCheck = window.AviatorStrategy.checkStopConditions(session);
    if (stopCheck.stop) {
      session.botStatus = "STOPPED";
      botRunning = false;
      log(`STOPPED: ${stopCheck.alert}`);
      notifyPanel("alert", { message: stopCheck.alert });
      notifyPanel("status", { status: "STOPPED" });
      saveSession();
      return;
    }

    // Run the strategy decision engine (autopilot overrides normal flow)
    const decision = session.autopilot
      ? window.AviatorStrategies.dailyAutopilot(session)
      : window.AviatorStrategies.getDecision(session);
    notifyPanel("decision", decision);

    // Autopilot QUIT signal — stop the bot
    if (decision.autopilot && decision.autopilot.phase === "QUIT") {
      session.botStatus = "STOPPED";
      botRunning = false;
      log(`AUTOPILOT QUIT: ${decision.reason}`);
      notifyPanel("alert", { message: decision.reason });
      notifyPanel("status", { status: "STOPPED" });
      saveSession();
      return;
    }

    if (!decision.shouldBet) {
      // Autopilot or Sniper: intentional skip — handle phases, never force
      if (session.autopilot || session.activeStrategy === "sniper") {
        log(`${session.autopilot ? "AUTOPILOT" : "SNIPER"}: ${decision.reason}`);
        notifyPanel("log", { message: decision.reason });

        if (session.activeStrategy === "sniper") {
          session.strategyState = window.AviatorStrategies.updateStrategyState(session, "sniper", false, 0, 0);
        }
        session.roundsPlayed++;
        notifyPanel("update", { session });
        saveSession();
        return;
      }

      skippedInARow++;
      log(`SKIP (${skippedInARow}): ${decision.reason}`);
      notifyPanel("log", { message: `Skip: ${decision.reason}` });

      if (skippedInARow >= MAX_SKIP_BEFORE_FORCE && session.currentBankroll > 0) {
        const forcedBet = Math.max(1, Math.round(session.currentBankroll * 0.01));
        const forceTarget = (session.betMode === "aggressive") ? 1.2 : 1.5;
        const forceP2Target = forceTarget < 2.0 ? 2.0 : 3.0;
        const forceP2Amount = Math.max(1, Math.round(forcedBet * 0.5));
        log(`FORCED BET: P1 ₹${forcedBet}@${forceTarget}x | P2 ₹${forceP2Amount}@${forceP2Target}x (${skippedInARow} skips)`);
        skippedInARow = 0;

        const forceDecision = {
          shouldBet: true, betAmount: forcedBet, cashoutTarget: forceTarget,
          winProbability: decision.winProbability || 0.5, ev: 0, kellyPct: 0.01,
          volatility: decision.volatility || "Low", reason: "forced (data collection)",
          panel2: { target: forceP2Target, amount: forceP2Amount, winProbability: 0.3, ev: 0 },
        };

        if (session.simulationMode) {
          executeRound(crashValue, forceDecision);
        } else {
          triggerRealBet(forceDecision);
        }
      } else {
        session.roundsPlayed++;
        notifyPanel("update", { session });
        saveSession();
      }
      return;
    }

    skippedInARow = 0;

    if (session.simulationMode) {
      log("Mode: SIMULATION — math only");
      executeRound(crashValue, decision);
    } else {
      log("Mode: REAL — placing actual bet");
      triggerRealBet(decision);
    }
  }

  async function triggerRealBet(decision) {
    const result = await startRealBetting(decision);
    if (!result) {
      // startRealBetting returned false (error/timeout before bets placed)
      return;
    }

    const { panel1Win, panel2Win } = result;
    const hasPanel2 = decision.panel2 && decision.panel2.amount > 0;

    let profit = 0;

    // Panel 1 P/L
    if (panel1Win) {
      profit += Math.round(decision.betAmount * (decision.cashoutTarget - 1));
    } else {
      profit -= decision.betAmount;
    }

    // Panel 2 P/L
    if (hasPanel2) {
      if (panel2Win) {
        profit += Math.round(decision.panel2.amount * (decision.panel2.target - 1));
      } else {
        profit -= decision.panel2.amount;
      }
    }

    const anyWin = panel1Win || panel2Win;
    const bothLost = !panel1Win && (!hasPanel2 || !panel2Win);

    session.currentBankroll += profit;
    session.peakBankroll = Math.max(session.peakBankroll || session.startingBankroll, session.currentBankroll);
    session.roundsPlayed++;
    session.consecutiveWins = anyWin ? (session.consecutiveWins || 0) + 1 : 0;
    session.consecutiveLosses = bothLost ? (session.consecutiveLosses || 0) + 1 : 0;

    const totalBet = decision.betAmount + (hasPanel2 ? decision.panel2.amount : 0);
    const roundResult = {
      round: session.roundsPlayed,
      crashPoint: 0,
      betAmount: totalBet,
      cashoutTarget: decision.cashoutTarget,
      panel2Target: hasPanel2 ? decision.panel2.target : 0,
      win: anyWin,
      panel1Win,
      panel2Win,
      profit,
      bankrollAfter: session.currentBankroll,
      ev: decision.ev,
      winProbability: decision.winProbability,
      timestamp: new Date().toISOString(),
    };
    session.results = [...(session.results || []).slice(-99), roundResult];

    // Update strategy-specific state
    session.strategyState = window.AviatorStrategies.updateStrategyState(
      session, session.activeStrategy || "quant-kelly", anyWin, decision.betAmount, decision.cashoutTarget
    );

    const p1Label = panel1Win ? "WIN" : "LOSS";
    const p2Label = hasPanel2 ? (panel2Win ? "WIN" : "LOSS") : "—";
    const label = anyWin ? "WIN" : "LOSS";
    log(`REAL RESULT: P1:${p1Label} P2:${p2Label} | P/L: ${profit >= 0 ? "+" : ""}₹${profit} | Bankroll: ₹${session.currentBankroll}`);
    logRound(roundResult, decision, session);
    notifyPanel("roundResult", { result: roundResult, label, decision });
    notifyPanel("update", { session });
    saveSession();
  }

  function executeRound(crashValue, decision) {
    const { updatedSession, result, win } = window.AviatorStrategy.evaluateRound(session, crashValue, decision);
    session = updatedSession;

    // Update strategy-specific state
    session.strategyState = window.AviatorStrategies.updateStrategyState(
      session, session.activeStrategy || "quant-kelly", win, decision.betAmount, decision.cashoutTarget
    );

    const label = win ? "WIN" : "LOSS";
    const p1 = result.panel1Win !== undefined ? (result.panel1Win ? "P1✓" : "P1✗") : "";
    const p2 = result.panel2Target ? (result.panel2Win ? " P2✓" : " P2✗") : "";
    log(`Round ${result.round}: Crash ${crashValue.toFixed(2)}x | ${p1}${p2} | Bet ₹${result.betAmount} | P/L: ${result.profit >= 0 ? "+" : ""}₹${result.profit} | Bankroll: ₹${session.currentBankroll}`);
    logRound(result, decision, session);

    notifyPanel("roundResult", { result, label, decision });
    notifyPanel("update", { session });
    saveSession();
  }

  // ===== OBSERVATION LOOP =====

  function startObserving() {
    const observer = new MutationObserver(() => {
      checkMultiplierElement();
      checkHistoryBar();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    setInterval(() => {
      checkMultiplierElement();
      checkHistoryBar();
    }, 500);

    log("Observing game — MutationObserver + polling active");
  }

  // ===== SIMULATION MODE =====

  let simRunning = false;

  async function simulationLoop() {
    simRunning = true;
    log("Simulation mode started");

    while (simRunning && botRunning && session.botStatus === "RUNNING") {
      const crashAt = window.AviatorStrategy.generateFakeCrashPoint();
      window.AviatorStrategy.addToHistory(crashAt);

      const stats = window.AviatorStrategy.getStats();
      const historyData = window.AviatorStrategy.getHistory();
      notifyPanel("liveStats", { stats, historyLast20: historyData.slice(-20) });

      const stopCheck = window.AviatorStrategy.checkStopConditions(session);
      if (stopCheck.stop) {
        session.botStatus = "STOPPED";
        botRunning = false;
        log(`STOPPED: ${stopCheck.alert}`);
        notifyPanel("alert", { message: stopCheck.alert });
        notifyPanel("status", { status: "STOPPED" });
        saveSession();
        break;
      }

      const decision = session.autopilot
        ? window.AviatorStrategies.dailyAutopilot(session)
        : window.AviatorStrategies.getDecision(session);
      notifyPanel("decision", decision);

      // Autopilot QUIT signal
      if (decision.autopilot && decision.autopilot.phase === "QUIT") {
        session.botStatus = "STOPPED";
        botRunning = false;
        log(`AUTOPILOT QUIT: ${decision.reason}`);
        notifyPanel("alert", { message: decision.reason });
        notifyPanel("status", { status: "STOPPED" });
        saveSession();
        break;
      }

      if (!decision.shouldBet) {
        // Autopilot or Sniper: intentional skip — handle phases, never force
        if (session.autopilot || session.activeStrategy === "sniper") {
          log(`SIM ${session.autopilot ? "AUTOPILOT" : "SNIPER"}: ${decision.reason}`);
          notifyPanel("log", { message: decision.reason });
          if (session.activeStrategy === "sniper") {
            session.strategyState = window.AviatorStrategies.updateStrategyState(session, "sniper", false, 0, 0);
          }
          session.roundsPlayed++;
          notifyPanel("update", { session });
          saveSession();
          await sleep(1500 + Math.random() * 1000);
          continue;
        }

        skippedInARow++;
        log(`SIM SKIP (${skippedInARow}): ${decision.reason}`);
        notifyPanel("log", { message: `Skip: ${decision.reason}` });

        if (skippedInARow >= MAX_SKIP_BEFORE_FORCE && session.currentBankroll > 0) {
          const forcedBet = Math.max(1, Math.round(session.currentBankroll * 0.01));
          const forceP2Amount = Math.max(1, Math.round(forcedBet * 0.5));
          const forceDecision = {
            shouldBet: true, betAmount: forcedBet, cashoutTarget: 1.5,
            winProbability: 0.5, ev: 0, kellyPct: 0.01,
            volatility: decision.volatility || "Low", reason: "forced",
            panel2: { target: 2.5, amount: forceP2Amount, winProbability: 0.3, ev: 0 },
          };
          executeRound(crashAt, forceDecision);
          skippedInARow = 0;
        } else {
          session.roundsPlayed++;
          notifyPanel("update", { session });
          saveSession();
        }

        await sleep(3000 + Math.random() * 2000);
        continue;
      }

      skippedInARow = 0;

      log(`SIM: Betting ₹${decision.betAmount} @ ${decision.cashoutTarget}x`);
      notifyPanel("log", { message: `Bet ₹${decision.betAmount} @ ${decision.cashoutTarget}x (EV: ${decision.ev.toFixed(3)})` });
      await sleep(2000 + Math.random() * 1000);
      if (!botRunning) break;

      const flyDuration = 2000 + crashAt * 400;
      await sleep(Math.min(flyDuration, 6000));
      if (!botRunning) break;

      executeRound(crashAt, decision);
      await sleep(3000 + Math.random() * 2000);
    }

    simRunning = false;
    log("Simulation loop ended");
  }

  // ===== SESSION =====

  function isExtensionValid() {
    try {
      return !!chrome.runtime?.id;
    } catch (e) {
      return false;
    }
  }

  async function loadSession() {
    return new Promise((resolve) => {
      if (!isExtensionValid()) {
        log("Extension context invalidated — reload the page");
        resolve(null);
        return;
      }
      try {
        chrome.runtime.sendMessage({ action: "getSession" }, (data) => {
          if (chrome.runtime.lastError) {
            log("Extension context lost: " + chrome.runtime.lastError.message);
            resolve(null);
            return;
          }
          session = data;
          if (session && session.botStatus === "RUNNING") {
            session.botStatus = "PAUSED";
          }
          resolve(session);
        });
      } catch (e) {
        log("Extension context invalidated — reload the page");
        resolve(null);
      }
    });
  }

  function saveSession() {
    if (!isExtensionValid()) return;
    try {
      chrome.runtime.sendMessage({ action: "saveSession", session });
    } catch (e) {
      log("Cannot save — extension context invalidated. Reload the page.");
      botRunning = false;
    }
  }

  // ===== PANEL COMMUNICATION =====

  function notifyPanel(type, data) {
    window.dispatchEvent(new CustomEvent("aviator-bot-event", {
      detail: { type, data },
    }));
  }

  window.addEventListener("aviator-bot-command", (e) => {
    const { command, payload } = e.detail;
    handleCommand(command, payload);
  });

  // Listen for auto-strategy switch events from strategies.js
  window.addEventListener("aviator-bot-event", (e) => {
    const { type, data } = e.detail;
    if (type === "strategySwitch" && data.newStrategy && session) {
      log(`AUTO-SWITCH: ${data.reason}`);
      session.activeStrategy = data.newStrategy;
      session.strategyState = {};
      notifyPanel("log", { message: `Auto: → ${data.newStrategy}` });
      notifyPanel("update", { session });
      saveSession();
    }
  });

  function handleCommand(command, payload) {
    switch (command) {
      case "start":
        if (!session || session.startingBankroll <= 0) {
          notifyPanel("alert", { message: "Set a starting bankroll first!" });
          return;
        }

        // License gate: validate before starting
        if (window.AviatorLicense) {
          const license = window.AviatorLicense;
          if (!session.simulationMode && !license.isRealBettingAllowed()) {
            notifyPanel("alert", { message: "Real betting requires Basic or Pro subscription. Upgrade at aviator-bot.pages.dev" });
            return;
          }
          if (session.autopilot && !license.isAutopilotAllowed()) {
            notifyPanel("alert", { message: "Autopilot requires Pro subscription." });
            return;
          }
          if (!license.isStrategyAllowed(session.activeStrategy)) {
            notifyPanel("alert", { message: `Strategy "${session.activeStrategy}" requires a higher tier. Current: ${license.getTier()}` });
            return;
          }
          // Enforce max rounds
          const maxAllowed = license.getMaxRounds();
          if (maxAllowed !== Infinity && session.maxRounds > maxAllowed) {
            session.maxRounds = maxAllowed;
            notifyPanel("log", { message: `Max rounds capped to ${maxAllowed} for ${license.getTier()} tier` });
          }
        }

        session.botStatus = "RUNNING";
        session.peakBankroll = session.peakBankroll || session.currentBankroll;
        botRunning = true;
        skippedInARow = 0;
        log("Bot STARTED");
        notifyPanel("status", { status: "RUNNING" });
        notifyPanel("update", { session });
        saveSession();

        if (session.simulationMode) {
          if (!simRunning) simulationLoop();
        } else {
          // Stop any running simulation loop
          simRunning = false;
          log("REAL MODE: Bot will place actual bets. Watching game...");
          notifyPanel("log", { message: "REAL MODE ACTIVE — placing actual bets" });
        }
        break;

      case "pause":
        session.botStatus = "PAUSED";
        botRunning = false;
        log("Bot PAUSED");
        notifyPanel("status", { status: "PAUSED" });
        saveSession();
        break;

      case "stop":
        session.botStatus = "STOPPED";
        botRunning = false;
        log("Bot STOPPED");
        notifyPanel("status", { status: "STOPPED" });
        saveSession();
        break;

      case "updateConfig":
        if (payload.startingBankroll !== undefined) {
          session.startingBankroll = payload.startingBankroll;
          if (session.roundsPlayed === 0) {
            session.currentBankroll = payload.startingBankroll;
            session.peakBankroll = payload.startingBankroll;
          }
        }
        if (payload.maxRounds !== undefined) session.maxRounds = payload.maxRounds;
        if (payload.drawdownPercent !== undefined) session.drawdownPercent = payload.drawdownPercent;
        if (payload.takeProfitPercent !== undefined) session.takeProfitPercent = payload.takeProfitPercent;
        if (payload.simulationMode !== undefined) session.simulationMode = payload.simulationMode;
        if (payload.betMode !== undefined) session.betMode = payload.betMode;
        if (payload.activeStrategy !== undefined) {
          if (payload.activeStrategy !== session.activeStrategy) {
            // Preserve sniper config across strategy switches
            const sniperCfg = {
              sniperObserveRounds: (session.strategyState || {}).sniperObserveRounds,
              sniperMaxRisk: (session.strategyState || {}).sniperMaxRisk,
              sniperConfidence: (session.strategyState || {}).sniperConfidence,
              sniperDynamicTarget: (session.strategyState || {}).sniperDynamicTarget,
              sniperTrigger: (session.strategyState || {}).sniperTrigger,
            };
            session.strategyState = {};
            if (payload.activeStrategy === "sniper") {
              // Start fresh in observe phase with preserved config
              Object.assign(session.strategyState, sniperCfg, { sniperPhase: "INITIAL_OBSERVE", sniperObserveCount: 0 });
            }
          }
          session.activeStrategy = payload.activeStrategy;
        }
        if (payload.autoStrategy !== undefined) session.autoStrategy = payload.autoStrategy;
        if (payload.autopilot !== undefined) {
          session.autopilot = payload.autopilot;
          if (payload.autopilot) {
            // Initialize autopilot state if enabling for the first time
            session.strategyState = session.strategyState || {};
            if (!session.strategyState._autopilot) {
              session.strategyState._autopilot = {
                phase: "OBSERVE",
                observeCount: 0,
                dailyTarget: payload.autopilotTarget || 0.10,
                roundsActive: 0,
                strategySwitches: 0,
                unfavorableStreak: 0,
                lastPickReason: "",
              };
            } else {
              session.strategyState._autopilot.dailyTarget = payload.autopilotTarget || 0.10;
            }
            // Autopilot overrides auto-switch
            session.autoStrategy = false;
          }
        }
        if (payload.autopilotTarget !== undefined && session.strategyState?._autopilot) {
          session.strategyState._autopilot.dailyTarget = payload.autopilotTarget;
          // Also update take-profit to match
          session.takeProfitPercent = 1 + payload.autopilotTarget;
        }
        if (payload.sniperConfig) {
          session.strategyState = session.strategyState || {};
          session.strategyState.sniperObserveRounds = payload.sniperConfig.observeRounds || 50;
          session.strategyState.sniperMaxRisk = payload.sniperConfig.maxRisk || 0.05;
          session.strategyState.sniperConfidence = payload.sniperConfig.confidence || 0.5;
          session.strategyState.sniperDynamicTarget = payload.sniperConfig.dynamicTarget !== false;
          session.strategyState.sniperTrigger = payload.sniperConfig.trigger || "immediate";
        }
        notifyPanel("update", { session });
        saveSession();
        break;

      case "reset":
        botRunning = false;
        skippedInARow = 0;
        realBetActive = false;
        realBetState = "IDLE";
        session = {
          startingBankroll: payload?.startingBankroll || 0,
          currentBankroll: payload?.startingBankroll || 0,
          peakBankroll: payload?.startingBankroll || 0,
          roundsPlayed: 0,
          maxRounds: session.maxRounds,
          botStatus: "STOPPED",
          consecutiveLosses: 0,
          consecutiveWins: 0,
          simulationMode: session.simulationMode,
          drawdownPercent: session.drawdownPercent,
          takeProfitPercent: session.takeProfitPercent,
          results: [],
        };
        log("Session RESET");
        notifyPanel("update", { session });
        saveSession();
        break;
    }
  }

  // ===== INIT =====

  async function init() {
    await loadSession();
    log("Quant engine initialized. Starting game observation...");
    notifyPanel("init", { session, gameDetected: false });
    startObserving();
  }

  setTimeout(init, 2000);
})();
