// Stats module — computes session statistics
// Exposed as window.AviatorStats

window.AviatorStats = (() => {
  function compute(session) {
    const results = session.results || [];
    const totalRounds = session.roundsPlayed || 0;
    const wins = results.filter((r) => r.win).length;
    const losses = results.filter((r) => !r.win).length;
    const winRate = results.length > 0 ? (wins / results.length * 100).toFixed(1) : "0.0";
    const profitLoss = session.currentBankroll - session.startingBankroll;
    const profitPercent = session.startingBankroll > 0
      ? ((profitLoss / session.startingBankroll) * 100).toFixed(1)
      : "0.0";

    return {
      totalRounds,
      wins,
      losses,
      winRate,
      profitLoss,
      profitPercent,
      consecutiveLosses: session.consecutiveLosses,
      consecutiveWins: session.consecutiveWins,
    };
  }

  return { compute };
})();
