import type { TradeReplay, TradingPersonality } from "@/src/data/mockWalletAnalysis"
import { getAverageProfitCapture } from "./profitCapture"

export function analyzeTradingPersonality(trades: TradeReplay[]): TradingPersonality {
  if (!trades.length) {
    return {
      type: "Insufficient Data",
      chineseType: "数据不足",
      explanation: "There are not enough complete replayable trades to classify behavior reliably.",
      chineseExplanation: "当前没有足够完整的可复盘交易，暂时不能可靠判断交易人格。",
      coreDiagnosis: "Data coverage is incomplete. Use token replay mode with a wallet-specific buy/sell pair for stronger analysis.",
      evidence: ["No complete buy/sell pair with usable price path was available."],
      traits: ["Partial Coverage"],
      emoji: "Data",
    }
  }

  const winners = trades.filter((trade) => trade.realizedPnlPct > 0)
  const losers = trades.filter((trade) => trade.realizedPnlPct < 0)
  const continuedHigher = winners.filter((trade) => trade.maxUpsidePct > trade.realizedPnlPct).length
  const continuationRate = winners.length ? Math.round((continuedHigher / winners.length) * 100) : 0
  const avgCapture = getAverageProfitCapture(trades)
  const maxMissedUpside = Math.max(...trades.map((trade) => Math.max(0, trade.maxUpsidePct - trade.realizedPnlPct)))
  const avgWinnerHold = winners.length
    ? Math.round(winners.reduce((sum, trade) => sum + trade.holdDurationMin, 0) / winners.length)
    : 0
  const avgLoserHold = losers.length
    ? Math.round((losers.reduce((sum, trade) => sum + trade.holdDurationMin, 0) / losers.length / 60) * 10) / 10
    : 0

  return {
    type: avgCapture >= 60 ? "Discipline Trader" : avgCapture < 35 ? "Profit Leaker" : "Paper Hand Sniper",
    chineseType: avgCapture >= 60 ? "纪律型交易者" : avgCapture < 35 ? "利润漏斗型交易者" : "买点不错但卖太早",
    explanation: "You often find tokens with upside, but you fail to protect profits after large unrealized gains. Your biggest problem is not discovery, but profit capture.",
    chineseExplanation: "你经常能抓到有上涨空间的币，但在出现较大浮盈后没有及时保护利润。你的核心问题不是发现机会，而是利润捕获能力不足。",
    coreDiagnosis: "You are not bad at finding entries. Your main leak is exit discipline after the trade goes heavily green.",
    evidence: [
      `${continuationRate}% of winning trades continued higher after your exit`,
      `Average profit capture rate: ${avgCapture}%`,
      `Max missed upside: +${maxMissedUpside}%`,
      `Avg winner hold: ${avgWinnerHold}m`,
      `Avg loser hold: ${avgLoserHold}h`,
    ],
    traits: ["Early Exits", "Weak Profit Lock", "Good Token Radar", "Loser Patience"],
    emoji: "Mirror",
  }
}

export const classifyTradingPersonality = analyzeTradingPersonality
