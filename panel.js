// Panel UI — quant dashboard for Aviator Bot
(() => {
  if (document.getElementById("aviator-bot-panel")) return;

  let panelVisible = false;

  console.log("[AviatorBot] Panel script loading...");

  const panelHTML = `
<div id="aviator-bot-panel">
  <div class="ab-header" id="ab-drag-handle">
    <span class="ab-header-title">Aviator Quant Bot</span>
    <div class="ab-header-btns">
      <button id="ab-collapse-btn" title="Collapse">−</button>
    </div>
  </div>
  <div class="ab-body">
    <div id="ab-game-status" class="ab-game-status not-detected">Game not detected</div>

    <div class="ab-alert" id="ab-alert"></div>

    <div class="ab-section">
      <div class="ab-section-title">STATUS</div>
      <span class="ab-status stopped" id="ab-bot-status">STOPPED</span>
      <span class="ab-sim-badge" id="ab-sim-badge" style="display:none">SIMULATION</span>
      <span class="ab-collecting" id="ab-collecting" style="display:none">Collecting data...</span>
      <div class="ab-active-strategy" id="ab-active-strategy">Strategy: Quant/Kelly</div>
    </div>

    <div class="ab-section">
      <div class="ab-section-title">DECISION ENGINE</div>
      <div class="ab-stats-grid ab-grid-3">
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-ev">—</div>
          <div class="ab-stat-label">EV</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-win-prob">—</div>
          <div class="ab-stat-label">Win Prob</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-volatility">—</div>
          <div class="ab-stat-label">Volatility</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-kelly-pct">—</div>
          <div class="ab-stat-label">Kelly %</div>
        </div>
        <div class="ab-stat ab-stat-safe">
          <div class="ab-stat-value" id="ab-bet-p1">—</div>
          <div class="ab-stat-label">P1 Safe</div>
        </div>
        <div class="ab-stat ab-stat-hunter">
          <div class="ab-stat-value" id="ab-bet-p2">—</div>
          <div class="ab-stat-label">P2 Hunter</div>
        </div>
      </div>
      <div class="ab-decision-reason" id="ab-decision-reason">Waiting...</div>
    </div>

    <div class="ab-section">
      <div class="ab-section-title">ROLLING STATS (Last 50)</div>
      <div class="ab-stats-grid ab-grid-3">
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-mean-crash">—</div>
          <div class="ab-stat-label">Mean</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-std-dev">—</div>
          <div class="ab-stat-label">StdDev</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-above-1_5">—</div>
          <div class="ab-stat-label">>1.5x</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-above-2">—</div>
          <div class="ab-stat-label">>2x</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-above-3">—</div>
          <div class="ab-stat-label">>3x</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-data-points">0</div>
          <div class="ab-stat-label">Samples</div>
        </div>
      </div>
      <div class="ab-sparkline" id="ab-sparkline"></div>
    </div>

    <div class="ab-section">
      <div class="ab-section-title">BANKROLL</div>
      <div class="ab-stats-grid">
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-starting-br">₹0</div>
          <div class="ab-stat-label">Starting</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-current-br">₹0</div>
          <div class="ab-stat-label">Current</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-profit">₹0</div>
          <div class="ab-stat-label">P/L</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-peak-br">₹0</div>
          <div class="ab-stat-label">Peak</div>
        </div>
      </div>
    </div>

    <div class="ab-section">
      <div class="ab-section-title">SESSION</div>
      <div class="ab-stats-grid ab-grid-3">
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-rounds">0</div>
          <div class="ab-stat-label">Rounds</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-winrate">0%</div>
          <div class="ab-stat-label">Win Rate</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-skipped">0</div>
          <div class="ab-stat-label">Skipped</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-consec-loss">0</div>
          <div class="ab-stat-label">C.Losses</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-consec-win">0</div>
          <div class="ab-stat-label">C.Wins</div>
        </div>
        <div class="ab-stat">
          <div class="ab-stat-value" id="ab-profit-pct">0%</div>
          <div class="ab-stat-label">P/L %</div>
        </div>
      </div>
    </div>

    <div class="ab-section">
      <div class="ab-section-title">CONTROLS</div>
      <div class="ab-controls">
        <button class="ab-btn ab-btn-start" id="ab-start-btn">START</button>
        <button class="ab-btn ab-btn-pause" id="ab-pause-btn">PAUSE</button>
        <button class="ab-btn ab-btn-stop" id="ab-stop-btn">STOP</button>
        <button class="ab-btn ab-btn-reset" id="ab-reset-btn">RESET</button>
      </div>
    </div>

    <div class="ab-section">
      <div class="ab-section-title">STRATEGY</div>
      <div class="ab-strategy-list" id="ab-strategy-list">
        <label class="ab-radio" title="Uses Kelly Criterion to size bets based on detected edge. Dynamically picks cashout target (1.1x–2.0x) from rolling 50-round history. Skips rounds when no positive expected value is found. Dual-panel split: 70% safe + 30% hunter."><input type="radio" name="ab-strategy" value="quant-kelly" checked> <strong>Quant/Kelly</strong> — Adaptive sizing + dynamic target</label>
        <label class="ab-radio" title="Dubins-Savage Bold Play + Browne's Goal-Reaching framework. Dynamically adjusts aggression based on where you stand between stop-loss floor and profit-target ceiling. Near ruin = BOLD (big bets, high targets). Near target = LOCK-IN (tiny bets, low targets). Maximizes probability of reaching your profit goal before hitting stop-loss. Uses Gambler's Ruin formula for real-time goal probability."><input type="radio" name="ab-strategy" value="goal-seeker"> <strong>Goal Seeker</strong> — Distance-to-goal dynamic aggression</label>
        <label class="ab-radio" title="Simple and disciplined. Always bets exactly 1% of current bankroll. Always cashes out at 1.5x (64.7% win rate). Never changes. Maximum bankroll survival — best for long sessions with minimal drawdown."><input type="radio" name="ab-strategy" value="flat-conservative"> <strong>Flat Conservative</strong> — 1% bet, always 1.5x</label>
        <label class="ab-radio" title="Fixed 1% of bankroll per round. Cashout at 2.0x gives 48.5% win rate but double the payout per win vs 1.5x. Balanced risk/reward — wins less often but profits more per win."><input type="radio" name="ab-strategy" value="flat-balanced"> <strong>Flat Balanced</strong> — 1% bet, always 2.0x</label>
        <label class="ab-radio" title="Positive progression: doubles bet after each win (1x→2x→4x). Resets to base after any loss or 3 consecutive wins. Capitalizes on hot streaks safely. Never increases bet after losses. Zero bankruptcy risk from bad streaks."><input type="radio" name="ab-strategy" value="anti-martingale"> <strong>Anti-Martingale</strong> — Double on win, reset on loss</label>
        <label class="ab-radio" title="Structured 4-step sequence: bet 1 unit, then 3, then 2, then 6 on consecutive wins. Reset to step 1 on any loss. Profits from 4-win streaks (pays 12 units on a 4-bet investment of 12). Self-limiting and disciplined."><input type="radio" name="ab-strategy" value="1-3-2-6"> <strong>1-3-2-6</strong> — 1→3→2→6 units on wins</label>
        <label class="ab-radio" title="Gentle negative progression: increase bet by 1 unit after loss, decrease by 1 after win. Never goes below 1 unit. Much safer than Martingale — linear growth instead of exponential. Slow recovery, very high bankroll survival."><input type="radio" name="ab-strategy" value="d-alembert"> <strong>D'Alembert</strong> — +1 unit on loss, -1 on win</label>
        <label class="ab-radio" title="Ultra-conservative cycle system. Only increases bet by 1 unit after a win AND only if the current cycle is in the negative. Resets entire cycle once you reach +1 unit profit. Designed for patient capital preservation with tiny consistent gains."><input type="radio" name="ab-strategy" value="oscars-grind"> <strong>Oscar's Grind</strong> — +1 on win if cycle negative</label>
        <label class="ab-radio" title="Adaptive lottery: FIRST observes 50 rounds of crash data without betting. THEN analyzes which multiplier tier (10x/15x/20x/30x/50x/100x) is currently 'hot' (appearing more than expected). Auto-picks the best target, calculates optimal window size (~50% hit probability), and sizes bet to risk max 5% of bankroll per window. On window end (hit or miss), goes back to observing for next window. Fully autonomous — no manual config needed."><input type="radio" name="ab-strategy" value="sniper"> <strong>Sniper</strong> — Adaptive: observe → analyze → fire window</label>
      </div>
      <div class="ab-sniper-config" id="ab-sniper-config" style="display:none; margin-top:6px;">
        <div style="font-size:10px; color:#80cbc4; margin-bottom:4px;">Observe-per-bet: watches 50 rounds before each individual bet.</div>
        <div class="ab-inputs" style="gap:4px;">
          <div class="ab-input-group">
            <label>Observation Rounds (per bet)</label>
            <input type="number" id="ab-sniper-observe" value="50" min="20" max="200" step="5">
          </div>
          <div class="ab-input-group">
            <label>Max Risk per Window (%)</label>
            <input type="number" id="ab-sniper-risk" value="5" min="1" max="20" step="1">
          </div>
        </div>
        <div class="ab-input-group" style="margin-top:6px;">
          <label title="Controls the window size. Conservative = more bets (bigger window, higher hit chance, less profit per window). Aggressive = fewer bets (cheaper window, lower hit chance, bigger payout ratio).">Window Confidence</label>
          <select id="ab-sniper-confidence">
            <option value="0.7">Conservative (70% — large window)</option>
            <option value="0.5" selected>Balanced (50% — coin flip)</option>
            <option value="0.3">Aggressive (30% — small window)</option>
          </select>
        </div>
        <div class="ab-toggle" style="margin-top:4px;">
          <input type="checkbox" id="ab-sniper-dynamic-target" checked>
          <label for="ab-sniper-dynamic-target">Dynamic target (recalculate between bets)</label>
        </div>
        <div class="ab-radio-group" style="margin-top:6px;">
          <div class="ab-radio-title" style="font-size:10px; color:#b0bec5;">Fire Trigger (when to pull the trigger after observation)</div>
          <label class="ab-radio" title="Bet immediately on the next round after observation completes. No additional waiting."><input type="radio" name="ab-sniper-trigger" value="immediate" checked> Immediate (fire right after analysis)</label>
          <label class="ab-radio" title="Wait until the last 5 consecutive rounds ALL crashed below 2x. Based on gambler's intuition that a big one is 'due' after a dry spell. Does NOT improve odds mathematically."><input type="radio" name="ab-sniper-trigger" value="dry-spell"> Dry Spell (5 consecutive rounds below 2x)</label>
          <label class="ab-radio" title="Wait until the target multiplier has NOT appeared in the last 20 rounds. Feels like it's 'overdue'. Does NOT improve odds mathematically, but adds patience."><input type="radio" name="ab-sniper-trigger" value="overdue"> Overdue (target not seen in last 20 rounds)</label>
        </div>
        <div class="ab-sniper-math" id="ab-sniper-math" style="font-size:10px; color:#aaa; margin-top:4px;">
          Window = N bets sized so P(at least 1 hit) = your confidence. Higher confidence = more bets = safer but thinner margin.
        </div>
      </div>
    </div>

    <div class="ab-section">
      <div class="ab-section-title">CONFIGURATION</div>
      <div class="ab-inputs">
        <div class="ab-input-group">
          <label>Starting Bankroll (₹)</label>
          <input type="number" id="ab-input-bankroll" value="1000" min="10">
        </div>
        <div class="ab-input-group">
          <label>Max Rounds</label>
          <input type="number" id="ab-input-maxrounds" value="100" min="1">
        </div>
        <div class="ab-input-group">
          <label>Drawdown Stop (%)</label>
          <input type="number" id="ab-input-drawdown" value="5" min="2" max="50" step="1">
        </div>
        <div class="ab-input-group">
          <label>Take-Profit (%)</label>
          <input type="number" id="ab-input-takeprofit" value="110" min="102" max="500" step="1">
        </div>
      </div>
      <div class="ab-toggle">
        <input type="checkbox" id="ab-toggle-sim" checked>
        <label for="ab-toggle-sim">Simulation Mode (no real bets)</label>
      </div>
      <div class="ab-toggle">
        <input type="checkbox" id="ab-toggle-auto-strategy">
        <label for="ab-toggle-auto-strategy">Auto-switch strategy (every 25 rounds, scored)</label>
      </div>
      <div class="ab-toggle" style="margin-top:4px;">
        <input type="checkbox" id="ab-toggle-autopilot">
        <label for="ab-toggle-autopilot" title="Full autopilot: observes timing, picks strategy, auto-configures everything, targets 10% daily profit, smart-quits when conditions turn bad. Overrides manual strategy selection.">Daily Autopilot (10% target, all strategies, smart timing)</label>
      </div>
      <div class="ab-autopilot-config" id="ab-autopilot-config" style="display:none; margin-top:6px; padding:6px; background:#1a1a2e; border-radius:6px;">
        <div style="font-size:10px; color:#80cbc4; margin-bottom:4px;">Autopilot observes → picks best strategy → bets when timing is right → stops at target.</div>
        <div class="ab-input-group" style="margin-bottom:4px;">
          <label>Daily Target (%)</label>
          <input type="number" id="ab-autopilot-target" value="10" min="2" max="50" step="1">
        </div>
        <div id="ab-autopilot-status" style="font-size:10px; color:#aaa; padding:4px 0;">
          Phase: IDLE | Strategy: — | P/L: —
        </div>
      </div>
      <div class="ab-radio-group">
        <div class="ab-radio-title">Bet Strategy</div>
        <label class="ab-radio"><input type="radio" name="ab-betmode" value="aggressive" checked> Aggressive (step down to find edge)</label>
        <label class="ab-radio"><input type="radio" name="ab-betmode" value="conservative"> Conservative (skip if no edge)</label>
      </div>
    </div>

    <div class="ab-section">
      <div class="ab-section-title">ROUND LOG</div>
      <div class="ab-log" id="ab-log"></div>
      <div class="ab-log-actions">
        <button class="ab-btn ab-btn-export" id="ab-export-json">Export JSON</button>
        <button class="ab-btn ab-btn-export" id="ab-export-csv">Export CSV</button>
        <button class="ab-btn ab-btn-reset" id="ab-clear-logs">Clear Logs</button>
      </div>
    </div>
  </div>
</div>
`;

  // Inject panel
  const wrapper = document.createElement("div");
  wrapper.innerHTML = panelHTML;
  document.body.appendChild(wrapper.firstElementChild);

  // --- DOM References ---
  const panel = document.getElementById("aviator-bot-panel");
  const gameStatusEl = document.getElementById("ab-game-status");
  const alertEl = document.getElementById("ab-alert");
  const statusEl = document.getElementById("ab-bot-status");
  const simBadge = document.getElementById("ab-sim-badge");
  const collectingEl = document.getElementById("ab-collecting");

  // Decision engine
  const evEl = document.getElementById("ab-ev");
  const winProbEl = document.getElementById("ab-win-prob");
  const kellyPctEl = document.getElementById("ab-kelly-pct");
  const volatilityEl = document.getElementById("ab-volatility");
  const betP1El = document.getElementById("ab-bet-p1");
  const betP2El = document.getElementById("ab-bet-p2");
  const decisionReasonEl = document.getElementById("ab-decision-reason");

  // Rolling stats
  const meanCrashEl = document.getElementById("ab-mean-crash");
  const stdDevEl = document.getElementById("ab-std-dev");
  const above1_5El = document.getElementById("ab-above-1_5");
  const above2El = document.getElementById("ab-above-2");
  const above3El = document.getElementById("ab-above-3");
  const dataPointsEl = document.getElementById("ab-data-points");
  const sparklineEl = document.getElementById("ab-sparkline");

  // Bankroll
  const startingBrEl = document.getElementById("ab-starting-br");
  const currentBrEl = document.getElementById("ab-current-br");
  const profitEl = document.getElementById("ab-profit");
  const peakBrEl = document.getElementById("ab-peak-br");

  // Session
  const roundsEl = document.getElementById("ab-rounds");
  const winrateEl = document.getElementById("ab-winrate");
  const skippedEl = document.getElementById("ab-skipped");
  const consecLossEl = document.getElementById("ab-consec-loss");
  const consecWinEl = document.getElementById("ab-consec-win");
  const profitPctEl = document.getElementById("ab-profit-pct");

  const logEl = document.getElementById("ab-log");

  const startBtn = document.getElementById("ab-start-btn");
  const pauseBtn = document.getElementById("ab-pause-btn");
  const stopBtn = document.getElementById("ab-stop-btn");
  const resetBtn = document.getElementById("ab-reset-btn");
  const collapseBtn = document.getElementById("ab-collapse-btn");

  const inputBankroll = document.getElementById("ab-input-bankroll");
  const inputMaxRounds = document.getElementById("ab-input-maxrounds");
  const inputDrawdown = document.getElementById("ab-input-drawdown");
  const inputTakeProfit = document.getElementById("ab-input-takeprofit");
  const toggleSim = document.getElementById("ab-toggle-sim");
  const betModeRadios = document.querySelectorAll('input[name="ab-betmode"]');
  const strategyRadios = document.querySelectorAll('input[name="ab-strategy"]');
  const toggleAutoStrategy = document.getElementById("ab-toggle-auto-strategy");
  const toggleAutopilot = document.getElementById("ab-toggle-autopilot");
  const autopilotConfigEl = document.getElementById("ab-autopilot-config");
  const autopilotTargetInput = document.getElementById("ab-autopilot-target");
  const autopilotStatusEl = document.getElementById("ab-autopilot-status");

  // Sniper config
  const sniperConfigEl = document.getElementById("ab-sniper-config");
  const sniperObserveInput = document.getElementById("ab-sniper-observe");
  const sniperRiskInput = document.getElementById("ab-sniper-risk");
  const sniperConfidenceSelect = document.getElementById("ab-sniper-confidence");
  const sniperDynamicTarget = document.getElementById("ab-sniper-dynamic-target");
  const sniperTriggerRadios = document.querySelectorAll('input[name="ab-sniper-trigger"]');
  const sniperMathEl = document.getElementById("ab-sniper-math");

  // --- Draggable ---
  let isDragging = false;
  let dragOffsetX = 0, dragOffsetY = 0;

  const dragHandle = document.getElementById("ab-drag-handle");
  dragHandle.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragOffsetX = e.clientX - panel.offsetLeft;
    dragOffsetY = e.clientY - panel.offsetTop;
    panel.style.transition = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    panel.style.left = (e.clientX - dragOffsetX) + "px";
    panel.style.top = (e.clientY - dragOffsetY) + "px";
    panel.style.right = "auto";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    panel.style.transition = "";
  });

  // --- Collapse ---
  let collapsed = false;
  collapseBtn.addEventListener("click", () => {
    collapsed = !collapsed;
    panel.classList.toggle("collapsed", collapsed);
    collapseBtn.textContent = collapsed ? "+" : "−";
  });

  // --- Controls ---
  startBtn.addEventListener("click", () => {
    applyConfig();
    sendCommand("start");
  });
  pauseBtn.addEventListener("click", () => sendCommand("pause"));
  stopBtn.addEventListener("click", () => sendCommand("stop"));
  resetBtn.addEventListener("click", () => {
    if (confirm("Reset session? All stats will be cleared.")) {
      sendCommand("reset", { startingBankroll: parseInt(inputBankroll.value) || 1000 });
    }
  });

  // Config inputs
  [inputBankroll, inputMaxRounds, inputDrawdown, inputTakeProfit].forEach((input) => {
    input.addEventListener("change", applyConfig);
  });
  [sniperObserveInput, sniperRiskInput, sniperConfidenceSelect].forEach((input) => {
    input.addEventListener("change", applyConfig);
  });
  sniperDynamicTarget.addEventListener("change", applyConfig);
  sniperTriggerRadios.forEach(r => r.addEventListener("change", applyConfig));
  toggleSim.addEventListener("change", applyConfig);
  toggleAutoStrategy.addEventListener("change", applyConfig);
  toggleAutopilot.addEventListener("change", () => {
    autopilotConfigEl.style.display = toggleAutopilot.checked ? "block" : "none";
    // Autopilot overrides auto-switch
    if (toggleAutopilot.checked) {
      toggleAutoStrategy.checked = false;
      toggleAutoStrategy.disabled = true;
    } else {
      toggleAutoStrategy.disabled = false;
    }
    applyConfig();
  });
  autopilotTargetInput.addEventListener("change", applyConfig);
  betModeRadios.forEach(r => r.addEventListener("change", applyConfig));
  strategyRadios.forEach(r => r.addEventListener("change", () => {
    applyConfig();
    toggleSniperConfig();
  }));

  function applyConfig() {
    const selectedMode = document.querySelector('input[name="ab-betmode"]:checked');
    const selectedStrategy = document.querySelector('input[name="ab-strategy"]:checked');
    sendCommand("updateConfig", {
      startingBankroll: parseInt(inputBankroll.value) || 1000,
      maxRounds: parseInt(inputMaxRounds.value) || 100,
      drawdownPercent: (parseInt(inputDrawdown.value) || 5) / 100,
      takeProfitPercent: (parseInt(inputTakeProfit.value) || 110) / 100,
      simulationMode: toggleSim.checked,
      betMode: selectedMode ? selectedMode.value : "aggressive",
      activeStrategy: selectedStrategy ? selectedStrategy.value : "quant-kelly",
      autoStrategy: toggleAutoStrategy.checked,
      autopilot: toggleAutopilot.checked,
      autopilotTarget: (parseInt(autopilotTargetInput.value) || 10) / 100,
      sniperConfig: {
        observeRounds: parseInt(sniperObserveInput.value) || 50,
        maxRisk: (parseInt(sniperRiskInput.value) || 5) / 100,
        confidence: parseFloat(sniperConfidenceSelect.value) || 0.5,
        dynamicTarget: sniperDynamicTarget.checked,
        trigger: (document.querySelector('input[name="ab-sniper-trigger"]:checked') || {}).value || "immediate",
      },
    });
  }

  function toggleSniperConfig() {
    const selectedStrategy = document.querySelector('input[name="ab-strategy"]:checked');
    const isSniper = selectedStrategy && selectedStrategy.value === "sniper";
    sniperConfigEl.style.display = isSniper ? "block" : "none";
  }

  function sendCommand(command, payload) {
    window.dispatchEvent(new CustomEvent("aviator-bot-command", {
      detail: { command, payload },
    }));
  }

  // --- Skipped rounds counter ---
  let totalSkipped = 0;

  // --- Event Listener from content.js ---
  window.addEventListener("aviator-bot-event", (e) => {
    const { type, data } = e.detail;

    switch (type) {
      case "init":
        updateUI(data.session);
        updateGameStatus(data.gameDetected);
        break;
      case "update":
        updateUI(data.session);
        break;
      case "status":
        setStatus(data.status);
        break;
      case "decision":
        updateDecision(data);
        break;
      case "liveStats":
        updateLiveStats(data.stats, data.historyLast20);
        break;
      case "roundResult":
        addLogEntry(data.result, data.label, data.decision);
        break;
      case "alert":
        showAlert(data.message);
        break;
      case "gameDetected":
        updateGameStatus(true);
        break;
      case "log":
        totalSkipped++;
        skippedEl.textContent = totalSkipped;
        addTextLog(data.message);
        break;
    }
  });

  // --- UI Update Functions ---

  function updateDecision(decision) {
    if (!decision) return;

    evEl.textContent = decision.ev ? decision.ev.toFixed(3) : "—";
    evEl.className = "ab-stat-value " + (decision.ev > 0 ? "profit" : decision.ev < 0 ? "loss" : "");

    winProbEl.textContent = decision.winProbability ? `${(decision.winProbability * 100).toFixed(0)}%` : "—";
    kellyPctEl.textContent = decision.kellyPct ? `${(decision.kellyPct * 100).toFixed(1)}%` : "—";

    volatilityEl.textContent = decision.volatility || "—";
    volatilityEl.className = "ab-stat-value " + getVolColor(decision.volatility);

    // Panel 1 (safe)
    if (decision.betAmount && decision.cashoutTarget) {
      betP1El.textContent = `₹${decision.betAmount}@${decision.cashoutTarget}x`;
    } else {
      betP1El.textContent = "—";
    }

    // Panel 2 (hunter)
    if (decision.panel2 && decision.panel2.amount > 0) {
      betP2El.textContent = `₹${decision.panel2.amount}@${decision.panel2.target}x`;
    } else {
      betP2El.textContent = "—";
    }

    decisionReasonEl.textContent = decision.shouldBet ? `BET: ${decision.reason}` : `SKIP: ${decision.reason}`;
    decisionReasonEl.className = "ab-decision-reason " + (decision.shouldBet ? "betting" : "skipping");

    collectingEl.style.display = (decision.reason && decision.reason.includes("Collecting")) ? "inline-block" : "none";
  }

  function updateLiveStats(stats, historyLast20) {
    if (!stats) {
      meanCrashEl.textContent = "—";
      stdDevEl.textContent = "—";
      above1_5El.textContent = "—";
      above2El.textContent = "—";
      above3El.textContent = "—";
      return;
    }

    meanCrashEl.textContent = `${stats.mean.toFixed(2)}x`;
    stdDevEl.textContent = stats.stdDev.toFixed(2);
    above1_5El.textContent = `${(stats.above1_5 * 100).toFixed(0)}%`;
    above2El.textContent = `${(stats.above2 * 100).toFixed(0)}%`;
    above3El.textContent = `${(stats.above3 * 100).toFixed(0)}%`;
    dataPointsEl.textContent = stats.count;

    renderSparkline(historyLast20);
  }

  function renderSparkline(data) {
    if (!data || data.length < 2) {
      sparklineEl.innerHTML = "";
      return;
    }

    const width = 280;
    const height = 30;
    const max = Math.min(Math.max(...data), 10);
    const min = 1.0;

    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((Math.min(val, 10) - min) / (max - min)) * height;
      return `${x},${y}`;
    });

    const colors = data.map(v => v >= 2 ? "#4caf50" : v >= 1.5 ? "#ff9800" : "#f44336");

    let dots = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((Math.min(val, 10) - min) / (max - min)) * height;
      return `<circle cx="${x}" cy="${y}" r="2.5" fill="${colors[i]}"/>`;
    }).join("");

    sparklineEl.innerHTML = `
      <svg width="${width}" height="${height}" style="display:block">
        <polyline points="${points.join(" ")}" fill="none" stroke="#555" stroke-width="1"/>
        ${dots}
      </svg>
    `;
  }

  function getVolColor(level) {
    if (level === "Low") return "profit";
    if (level === "Medium") return "";
    if (level === "High") return "loss";
    if (level === "Extreme") return "loss";
    return "";
  }

  function updateUI(session) {
    if (!session) return;

    startingBrEl.textContent = `₹${session.startingBankroll.toLocaleString()}`;
    currentBrEl.textContent = `₹${session.currentBankroll.toLocaleString()}`;
    peakBrEl.textContent = `₹${(session.peakBankroll || session.startingBankroll).toLocaleString()}`;

    const profit = session.currentBankroll - session.startingBankroll;
    profitEl.textContent = `${profit >= 0 ? "+" : ""}₹${profit.toLocaleString()}`;
    profitEl.className = "ab-stat-value " + (profit >= 0 ? "profit" : "loss");

    const pct = session.startingBankroll > 0
      ? ((profit / session.startingBankroll) * 100).toFixed(1)
      : "0.0";
    profitPctEl.textContent = `${profit >= 0 ? "+" : ""}${pct}%`;
    profitPctEl.className = "ab-stat-value " + (profit >= 0 ? "profit" : "loss");

    roundsEl.textContent = `${session.roundsPlayed}/${session.maxRounds}`;

    const results = session.results || [];
    const wins = results.filter(r => r.win).length;
    const winRate = results.length > 0 ? ((wins / results.length) * 100).toFixed(1) : "0.0";
    winrateEl.textContent = `${winRate}%`;
    consecLossEl.textContent = session.consecutiveLosses || 0;
    consecWinEl.textContent = session.consecutiveWins || 0;

    setStatus(session.botStatus);
    simBadge.style.display = session.simulationMode ? "inline-block" : "none";

    // Show active strategy name
    const activeStratEl = document.getElementById("ab-active-strategy");
    if (activeStratEl) {
      const names = {
        "quant-kelly": "Quant/Kelly",
        "goal-seeker": "Goal Seeker (Dubins-Savage)",
        "flat-conservative": "Flat Conservative",
        "flat-balanced": "Flat Balanced",
        "anti-martingale": "Anti-Martingale",
        "1-3-2-6": "1-3-2-6",
        "d-alembert": "D'Alembert",
        "oscars-grind": "Oscar's Grind",
        "sniper": "Sniper (Adaptive)",
      };
      activeStratEl.textContent = "Strategy: " + (names[session.activeStrategy] || "Quant/Kelly");
    }

    // Sync inputs
    inputBankroll.value = session.startingBankroll;
    inputMaxRounds.value = session.maxRounds;
    inputDrawdown.value = Math.round((session.drawdownPercent || 0.05) * 100);
    inputTakeProfit.value = Math.round((session.takeProfitPercent || 1.10) * 100);
    toggleSim.checked = session.simulationMode;
    const mode = session.betMode || "aggressive";
    const modeRadio = document.querySelector(`input[name="ab-betmode"][value="${mode}"]`);
    if (modeRadio) modeRadio.checked = true;
    const strat = session.activeStrategy || "quant-kelly";
    const stratRadio = document.querySelector(`input[name="ab-strategy"][value="${strat}"]`);
    if (stratRadio) stratRadio.checked = true;
    toggleAutoStrategy.checked = session.autoStrategy || false;
    toggleAutopilot.checked = session.autopilot || false;
    autopilotConfigEl.style.display = session.autopilot ? "block" : "none";
    if (session.autopilot) {
      toggleAutoStrategy.checked = false;
      toggleAutoStrategy.disabled = true;
    } else {
      toggleAutoStrategy.disabled = false;
    }

    // Update autopilot status display
    const ap = (session.strategyState || {})._autopilot;
    if (ap) {
      const profitPct = session.startingBankroll > 0
        ? ((session.currentBankroll - session.startingBankroll) / session.startingBankroll * 100).toFixed(1)
        : "0.0";
      const phaseColors = { OBSERVE: "#ffa726", ACTIVE: "#66bb6a", WATCHING: "#42a5f5", QUIT: "#ef5350", PAUSING: "#ffa726" };
      const color = phaseColors[ap.phase] || "#aaa";
      autopilotStatusEl.innerHTML = `Phase: <span style="color:${color}; font-weight:bold;">${ap.phase}</span> | Strategy: <strong>${session.activeStrategy || "—"}</strong> | P/L: <span style="color:${parseFloat(profitPct) >= 0 ? "#66bb6a" : "#ef5350"}">${profitPct}%</span> / ${(ap.dailyTarget * 100).toFixed(0)}% target | Switches: ${ap.strategySwitches || 0}`;
    }
  }

  function setStatus(status) {
    statusEl.textContent = status;
    statusEl.className = "ab-status " + status.toLowerCase();
  }

  function updateGameStatus(detected) {
    if (detected) {
      gameStatusEl.textContent = "✓ Game detected";
      gameStatusEl.className = "ab-game-status detected";
    } else {
      gameStatusEl.textContent = "✗ Game not detected";
      gameStatusEl.className = "ab-game-status not-detected";
    }
  }

  function addLogEntry(result, label, decision) {
    const isWin = label.includes("WIN");
    const profitStr = result.profit >= 0 ? `+₹${result.profit}` : `-₹${Math.abs(result.profit)}`;
    const p1 = result.panel1Win !== undefined ? (result.panel1Win ? "✓" : "✗") : "";
    const p2 = result.panel2Target ? (result.panel2Win ? "✓" : "✗") : "";
    const panelInfo = p1 ? `P1${p1}` + (p2 ? ` P2${p2}` : "") : "";
    const entry = document.createElement("div");
    entry.className = "ab-log-entry";
    entry.innerHTML = `
      <span class="${isWin ? "win" : "loss"}">#${result.round} ${panelInfo || label}</span>
      <span class="crash">${result.crashPoint ? result.crashPoint.toFixed(2) + "x" : ""}</span>
      <span class="${result.profit >= 0 ? "profit" : "loss-amount"}">${profitStr}</span>
    `;
    logEl.prepend(entry);

    while (logEl.children.length > 15) {
      logEl.removeChild(logEl.lastChild);
    }
  }

  function addTextLog(message) {
    const entry = document.createElement("div");
    entry.className = "ab-log-entry";
    entry.innerHTML = `<span style="color:#888">${message}</span>`;
    logEl.prepend(entry);
    while (logEl.children.length > 15) {
      logEl.removeChild(logEl.lastChild);
    }
  }

  function showAlert(message) {
    alertEl.textContent = message;
    alertEl.classList.add("visible");
    setTimeout(() => alertEl.classList.remove("visible"), 10000);
  }

  function togglePanel() {
    panelVisible = !panelVisible;
    panel.style.display = panelVisible ? "flex" : "none";
  }

  panel.style.display = "none";

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "togglePanel") {
      togglePanel();
    }
  });

  // --- Log Export ---
  document.getElementById("ab-export-json").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "getLogs" }, (logs) => {
      if (!logs || logs.length === 0) {
        alert("No logs to export yet.");
        return;
      }
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
      downloadBlob(blob, `aviator-bot-logs-${Date.now()}.json`);
    });
  });

  document.getElementById("ab-export-csv").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "getLogs" }, (logs) => {
      if (!logs || logs.length === 0) {
        alert("No logs to export yet.");
        return;
      }
      const headers = Object.keys(logs[0]);
      const csv = [headers.join(",")];
      for (const row of logs) {
        csv.push(headers.map(h => JSON.stringify(row[h] ?? "")).join(","));
      }
      const blob = new Blob([csv.join("\n")], { type: "text/csv" });
      downloadBlob(blob, `aviator-bot-logs-${Date.now()}.csv`);
    });
  });

  document.getElementById("ab-clear-logs").addEventListener("click", () => {
    if (confirm("Clear all saved logs? This cannot be undone.")) {
      chrome.runtime.sendMessage({ action: "clearLogs" }, () => {
        alert("Logs cleared.");
      });
    }
  });

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  console.log("[AviatorBot] Quant panel injected. Click extension icon to show.");
})();
