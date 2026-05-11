import type {
  PricePathPoint,
  SimulatedTradeResult,
  TradeReplay,
  WhatIfSimulation,
  WhatIfStrategyResult,
} from "@/src/data/mockWalletAnalysis"

export type WhatIfStrategyId = "stagedTakeProfit" | "trailingStop" | "timeStop" | "capitalProtection"

const strategyMeta: Record<WhatIfStrategyId, { strategy: string; description: string }> = {
  stagedTakeProfit: {
    strategy: "Strategy A: Staged Take Profit",
    description: "TP1 +80% sell 30%, TP2 +150% sell 30%, TP3 +300% sell 30%, 10% moonbag, SL -30%",
  },
  trailingStop: {
    strategy: "Strategy B: Trailing Stop",
    description: "Activate above +100%, sell after 35% pullback from peak, SL -30%",
  },
  timeStop: {
    strategy: "Strategy C: Time Stop",
    description: "Exit if no +30% in 20m, SL -30%, sell at least 50% at +100%",
  },
  capitalProtection: {
    strategy: "Strategy D: Capital Protection",
    description: "Protect breakeven above +50%, +20% above +100%, +80% above +200%",
  },
}

const strategyReasons: Record<WhatIfStrategyId, string> = {
  stagedTakeProfit: "This fits wallets that find runners but exit too much too early.",
  trailingStop: "This works best when entries are strong and the main leak is trend exit discipline.",
  timeStop: "This reduces dead entries before they become long-held losers.",
  capitalProtection: "This prevents large unrealized profit from round-tripping into small wins or losses.",
}

function sortedPath(trade: TradeReplay): PricePathPoint[] {
  return [...trade.pricePath].sort((a, b) => a.minute - b.minute)
}

function toUsd(trade: TradeReplay, resultPct: number) {
  return Math.round((trade.positionSizeUsd * resultPct) / 100)
}

function lastPoint(path: PricePathPoint[]) {
  return path[path.length - 1] ?? { minute: 0, pnlPct: 0 }
}

export function simulateStagedTakeProfit(trade: TradeReplay): SimulatedTradeResult {
  const path = sortedPath(trade)
  const stages = [
    { trigger: 80, size: 0.3 },
    { trigger: 150, size: 0.3 },
    { trigger: 300, size: 0.3 },
  ]
  let remaining = 1
  let weightedPct = 0
  let nextStage = 0

  for (const point of path) {
    if (point.pnlPct <= -30) {
      weightedPct += remaining * -30
      return {
        tradeId: trade.id,
        token: trade.token.symbol,
        resultPct: Math.round(weightedPct * 10) / 10,
        resultUsd: toUsd(trade, weightedPct),
        exitMinute: point.minute,
        exitReason: "Stop loss hit at -30%",
      }
    }

    while (stages[nextStage] && point.pnlPct >= stages[nextStage].trigger) {
      weightedPct += stages[nextStage].size * stages[nextStage].trigger
      remaining -= stages[nextStage].size
      nextStage += 1
    }
  }

  const end = lastPoint(path)
  weightedPct += Math.max(0, remaining) * end.pnlPct

  return {
    tradeId: trade.id,
    token: trade.token.symbol,
    resultPct: Math.round(weightedPct * 10) / 10,
    resultUsd: toUsd(trade, weightedPct),
    exitMinute: end.minute,
    exitReason: nextStage ? "Staged exits plus moonbag close" : "No take-profit trigger reached",
  }
}

export function simulateTrailingStop(trade: TradeReplay): SimulatedTradeResult {
  const path = sortedPath(trade)
  let activated = false
  let high = 0

  for (const point of path) {
    if (!activated && point.pnlPct <= -30) {
      return {
        tradeId: trade.id,
        token: trade.token.symbol,
        resultPct: -30,
        resultUsd: toUsd(trade, -30),
        exitMinute: point.minute,
        exitReason: "Stop loss hit before trailing activated",
      }
    }

    if (point.pnlPct >= 100) activated = true
    if (activated) {
      high = Math.max(high, point.pnlPct)
      if (point.pnlPct <= high - 35) {
        return {
          tradeId: trade.id,
          token: trade.token.symbol,
          resultPct: point.pnlPct,
          resultUsd: toUsd(trade, point.pnlPct),
          exitMinute: point.minute,
          exitReason: `35% pullback from +${high}% peak`,
        }
      }
    }
  }

  const end = lastPoint(path)
  return {
    tradeId: trade.id,
    token: trade.token.symbol,
    resultPct: end.pnlPct,
    resultUsd: toUsd(trade, end.pnlPct),
    exitMinute: end.minute,
    exitReason: activated ? "Trailing never triggered before path end" : "No +100% activation",
  }
}

export function simulateTimeStop(trade: TradeReplay): SimulatedTradeResult {
  const path = sortedPath(trade)
  let highSoFar = 0
  let soldHalfAtHundred = false
  let remaining = 1
  let weightedPct = 0

  for (const point of path) {
    highSoFar = Math.max(highSoFar, point.pnlPct)

    if (point.pnlPct <= -30) {
      weightedPct += remaining * -30
      return {
        tradeId: trade.id,
        token: trade.token.symbol,
        resultPct: Math.round(weightedPct * 10) / 10,
        resultUsd: toUsd(trade, weightedPct),
        exitMinute: point.minute,
        exitReason: "Stop loss hit at -30%",
      }
    }

    if (point.minute >= 20 && highSoFar < 30) {
      weightedPct += remaining * point.pnlPct
      return {
        tradeId: trade.id,
        token: trade.token.symbol,
        resultPct: Math.round(weightedPct * 10) / 10,
        resultUsd: toUsd(trade, weightedPct),
        exitMinute: point.minute,
        exitReason: "No +30% move within 20 minutes",
      }
    }

    if (!soldHalfAtHundred && point.pnlPct >= 100) {
      weightedPct += 0.5 * point.pnlPct
      remaining = 0.5
      soldHalfAtHundred = true
    }
  }

  const end = lastPoint(path)
  weightedPct += remaining * end.pnlPct

  return {
    tradeId: trade.id,
    token: trade.token.symbol,
    resultPct: Math.round(weightedPct * 10) / 10,
    resultUsd: toUsd(trade, weightedPct),
    exitMinute: end.minute,
    exitReason: soldHalfAtHundred ? "Sold 50% at +100%, closed rest at path end" : "Held until path end",
  }
}

export function simulateCapitalProtection(trade: TradeReplay): SimulatedTradeResult {
  const path = sortedPath(trade)
  let floor = -30

  for (const point of path) {
    if (point.pnlPct >= 200) floor = Math.max(floor, 80)
    else if (point.pnlPct >= 100) floor = Math.max(floor, 20)
    else if (point.pnlPct >= 50) floor = Math.max(floor, 0)

    if (point.pnlPct <= floor) {
      return {
        tradeId: trade.id,
        token: trade.token.symbol,
        resultPct: floor,
        resultUsd: toUsd(trade, floor),
        exitMinute: point.minute,
        exitReason: floor >= 0 ? `Protected profit floor at +${floor}%` : "Stop loss hit at -30%",
      }
    }
  }

  const end = lastPoint(path)
  return {
    tradeId: trade.id,
    token: trade.token.symbol,
    resultPct: end.pnlPct,
    resultUsd: toUsd(trade, end.pnlPct),
    exitMinute: end.minute,
    exitReason: "Protection floor never triggered before path end",
  }
}

export function simulateTradeWithStrategy(trade: TradeReplay, strategyId: WhatIfStrategyId): SimulatedTradeResult {
  if (strategyId === "stagedTakeProfit") return simulateStagedTakeProfit(trade)
  if (strategyId === "trailingStop") return simulateTrailingStop(trade)
  if (strategyId === "timeStop") return simulateTimeStop(trade)
  return simulateCapitalProtection(trade)
}

function buildStrategyResult(trades: TradeReplay[], strategyId: WhatIfStrategyId, actualUsd: number, totalCapital: number): WhatIfStrategyResult {
  const simulatedTrades = trades.map((trade) => simulateTradeWithStrategy(trade, strategyId))
  const resultUsd = simulatedTrades.reduce((sum, result) => sum + result.resultUsd, 0)
  const resultPct = totalCapital ? Math.round((resultUsd / totalCapital) * 100) : 0
  const improvementUsd = resultUsd - actualUsd
  const improvementPct = actualUsd ? Math.round((improvementUsd / Math.abs(actualUsd)) * 100) : 0

  return {
    id: strategyId,
    name: strategyMeta[strategyId].strategy,
    ...strategyMeta[strategyId],
    reason: strategyReasons[strategyId],
    resultUsd,
    resultPct,
    improvementUsd,
    improvementPct,
    trades: simulatedTrades,
  }
}

export function buildWhatIfSimulation(trades: TradeReplay[]): WhatIfSimulation {
  const totalCapital = trades.reduce((sum, trade) => sum + trade.positionSizeUsd, 0)
  const actualUsd = trades.reduce((sum, trade) => sum + trade.realizedPnlUsd, 0)
  const actualPct = totalCapital ? Math.round((actualUsd / totalCapital) * 100) : 0
  const actualResult: WhatIfStrategyResult = {
    id: "actual",
    name: "Actual Result",
    strategy: "Actual Result",
    description: "Your realized exits from the replay sample.",
    reason: "Baseline from the user's actual sell decisions.",
    resultUsd: actualUsd,
    resultPct: actualPct,
    improvementUsd: 0,
    improvementPct: 0,
    trades: trades.map((trade) => ({
      tradeId: trade.id,
      token: trade.token.symbol,
      resultPct: trade.realizedPnlPct,
      resultUsd: trade.realizedPnlUsd,
      exitMinute: trade.holdDurationMin,
      exitReason: "Your actual sell",
    })),
  }

  const strategies = (["stagedTakeProfit", "trailingStop", "timeStop", "capitalProtection"] as WhatIfStrategyId[])
    .map((strategyId) => buildStrategyResult(trades, strategyId, actualUsd, totalCapital))
  const best = strategies.reduce((bestStrategy, current) => current.resultUsd > bestStrategy.resultUsd ? current : bestStrategy, strategies[0])

  return {
    actualResult,
    actualResultPct: actualPct,
    strategies,
    bestStrategy: best.strategy,
    bestAlternativeStrategy: best.strategy,
    improvementPotential: best.improvementUsd,
    improvementPotentialPct: best.improvementPct,
    suggestedPersonalStrategy: best.strategy,
    conclusion: `Your wallet would have performed best with ${best.strategy}. Your main weakness is not entry selection, but failing to protect large unrealized gains.`,
    aiInsight: `${best.strategy} would have added $${Math.max(0, best.improvementUsd).toLocaleString()} in this replay sample because your biggest winners needed mechanical profit protection instead of full manual exits.`,
  }
}
