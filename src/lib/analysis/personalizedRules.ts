import type { PersonalizedRule, TradeReplay } from "@/src/data/mockWalletAnalysis"

export function buildPersonalizedRules(trades: TradeReplay[]): PersonalizedRule[] {
  const hasBigContinuation = trades.some((trade) => trade.maxUpsidePct >= 300)
  const hasSlowLoser = trades.some((trade) => trade.realizedPnlPct < 0 && trade.holdDurationMin > 60)

  return [
    {
      id: "1",
      title: "Stage Out Winners",
      description: "Sell 30% at +80%, 30% at +150%, 30% at +300%, and keep a 10% moonbag.",
      reason: "Your historical winners kept running after full exits, so partial exits preserve upside while reducing emotional pressure.",
      category: "exit",
      priority: "critical",
      evidence: hasBigContinuation ? "Your replay includes +300% continuation paths after entry." : "Your winners still benefit from fixed partial exits.",
    },
    {
      id: "2",
      title: "Trail After +100%",
      description: "Once a trade doubles, stop using gut exits and trail from the peak.",
      reason: "You repeatedly turned large unrealized profit into weaker realized outcomes.",
      category: "risk",
      priority: "critical",
      evidence: "Large unrealized gains need a mechanical lock before emotion gets involved.",
    },
    {
      id: "3",
      title: "20-Minute Momentum Check",
      description: "If a trade has not reached +30% within 20 minutes, exit or reduce hard.",
      reason: "Your weak early-momentum trades tend to become the longest-held losers.",
      category: "timing",
      priority: hasSlowLoser ? "important" : "suggested",
      evidence: hasSlowLoser ? "At least one loser stayed open long after weak early momentum." : "This prevents dead entries from becoming thesis trades.",
    },
    {
      id: "4",
      title: "Do Not Fully Exit Before TP1",
      description: "Green trades below +80% should be reduced only when momentum breaks.",
      reason: "Your small winners often had enough path strength to reach the first profit-taking level.",
      category: "exit",
      priority: "suggested",
      evidence: "Several winning paths had room to reach TP1 before trend failure.",
    },
  ]
}

export const generatePersonalizedRules = buildPersonalizedRules
