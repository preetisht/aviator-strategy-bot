const DEFAULT_SESSION = {
  startingBankroll: 0,
  currentBankroll: 0,
  peakBankroll: 0,
  roundsPlayed: 0,
  maxRounds: 100,
  botStatus: "STOPPED",
  consecutiveLosses: 0,
  consecutiveWins: 0,
  simulationMode: true,
  drawdownPercent: 0.05,
  takeProfitPercent: 1.10,
  betMode: "aggressive",
  activeStrategy: "quant-kelly",
  autoStrategy: false,
  autopilot: false,
  strategyState: {},
  results: [],
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("session", (data) => {
    if (!data.session) {
      chrome.storage.local.set({ session: DEFAULT_SESSION });
    }
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const panel = document.getElementById("aviator-bot-panel");
      if (panel) {
        panel.style.display = panel.style.display === "none" ? "flex" : "none";
      } else {
        console.warn("[AviatorBot] Panel not found on this page.");
      }
    },
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSession") {
    chrome.storage.local.get("session", (data) => {
      sendResponse(data.session || DEFAULT_SESSION);
    });
    return true;
  }

  if (request.action === "saveSession") {
    chrome.storage.local.set({ session: request.session }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (request.action === "resetSession") {
    const newSession = { ...DEFAULT_SESSION, ...request.overrides };
    chrome.storage.local.set({ session: newSession }, () => {
      sendResponse(newSession);
    });
    return true;
  }

  if (request.action === "appendLog") {
    chrome.storage.local.get("roundLogs", (data) => {
      const logs = data.roundLogs || [];
      logs.push(request.entry);
      // Keep last 5000 entries max
      if (logs.length > 5000) logs.splice(0, logs.length - 5000);
      chrome.storage.local.set({ roundLogs: logs }, () => {
        sendResponse({ ok: true, count: logs.length });
      });
    });
    return true;
  }

  if (request.action === "getLogs") {
    chrome.storage.local.get("roundLogs", (data) => {
      sendResponse(data.roundLogs || []);
    });
    return true;
  }

  if (request.action === "clearLogs") {
    chrome.storage.local.set({ roundLogs: [] }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
