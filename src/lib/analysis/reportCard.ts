import type { DegenReportCard, WalletAnalysis } from "@/src/data/mockWalletAnalysis"

export function generateReportCard(walletAnalysis: WalletAnalysis): DegenReportCard {
  const bestTrade = walletAnalysis.trades.reduce((best, trade) => trade.realizedPnlUsd > best.realizedPnlUsd ? trade : best, walletAnalysis.trades[0])

  return {
    grade: walletAnalysis.summary.grade,
    personality: walletAnalysis.personality.type,
    chinesePersonality: walletAnalysis.personality.chineseType,
    biggestLeak: walletAnalysis.leaks[0]?.title ?? "Profit Protection Failure",
    suggestedFix: walletAnalysis.rules[0]?.title ?? "Use staged take-profit",
    mirrorRoast: "You find alpha, then donate it back to the chart. 你不是没抓到机会，你是抓到了又亲手放生。",
    bestTrade: {
      token: bestTrade?.tokenSymbol ?? "N/A",
      pnlUsd: bestTrade?.realizedPnlUsd ?? 0,
    },
  }
}
