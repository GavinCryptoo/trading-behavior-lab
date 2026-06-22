export interface PricePathPoint {
  minute: number
  price: number
  pnlPct: number
}

export type DataSource = "mock" | "bitget" | "okx"
export type DataCoverage = "full" | "partial" | "mock_fallback" | "unsupported"
export type AnalysisMode = "token_replay" | "wallet_behavior"
export type RiskLevel = "low" | "medium" | "high" | "unknown"

export interface DataCoverageStatus {
  tokenInfo: boolean
  kline: boolean
  walletTransactions: boolean
  security: boolean
  holders: boolean
  smartMoneyMarkers: boolean
}

export interface BitgetMarketContext {
  tokenPrice?: number
  marketCap?: number
  liquidity?: number
  volume24h?: number
  buyPressure?: number
  sellPressure?: number
  entryMarketState: string
  exitMarketState: string
  momentumState: string
  liquidityState: string
  volatilityState: string
}

export interface SmartMoneyContrast {
  userAction: string
  smartMoneyAction: string
  kolAction: string
  alignmentScore: number
  diagnosis: string
  evidence: string[]
}

export interface SecurityRiskSummary {
  riskLevel: RiskLevel
  riskFlags: string[]
  plainEnglishSummary: string
}

export interface HolderRiskSummary {
  topHolderConcentrationLevel: RiskLevel
  smartMoneyHolderPresence: boolean
  cexHolderPresence: boolean
  suspiciousConcentration: boolean
  diagnosis: string
}

export interface BitgetMeta {
  chain: string
  walletAddress: string
  tokenAddress?: string
  tokenInfo?: Record<string, unknown>
  securitySummary?: SecurityRiskSummary
  holderSummary?: HolderRiskSummary
  tradingDynamics?: Record<string, unknown>
  marketContext?: BitgetMarketContext
  smartMoneySummary?: SmartMoneyContrast
  kolSummary?: Record<string, unknown>
  quotePreview?: Record<string, unknown>
  dataCoverageStatus?: DataCoverageStatus
  warnings: string[]
}

export interface WalletSummary {
  totalTrades: number
  winRate: number
  realizedPnlUsd: number
  realizedPnlPct: number
  profitCaptureRate: number
  avgHoldTime: string
  maxMissedUpside: number
  avgWinnerHold: string
  avgLoserHold: string
  averageMaxDrawdown: number
  winnerAvgDrawdown: number
  loserAvgDrawdown: number
  avgWinnerPnlPct: number
  avgLoserPnlPct: number
  lossHoldingBias: string
  grade: string
}

export interface TradingPersonality {
  type: string
  chineseType: string
  explanation: string
  chineseExplanation: string
  coreDiagnosis: string
  evidence: string[]
  traits: string[]
  emoji: string
}

export interface TradeReplay {
  id: string
  tokenSymbol: string
  tokenAddress: string
  token: {
    symbol: string
    name: string
    image?: string
  }
  buyTime: string
  sellTime: string
  holdDurationMin: number
  buyPrice: number
  sellPrice: number
  positionSizeUsd: number
  realizedPnlUsd: number
  realizedPnlPct: number
  maxUpsidePct: number
  maxDrawdownPct: number
  postBuyHighPct: number
  postBuyLowPct: number
  profitCaptureRate: number
  profitGivebackPct?: number
  exitAftermath: string
  entryScore: number
  exitScore: number
  mistakeTags: string[]
  diagnosis: string
  chineseDiagnosis: string
  suggestedFix: string
  pricePath: PricePathPoint[]
  overheatedAtEntry?: boolean
  smartMoneyAtEntry?: string
  smartMoneyAtExit?: string
  kolAtEntry?: string
  kolAtExit?: string
  holderRiskAtEntry?: string
  securityRisk?: RiskLevel
  buyPressureAtEntry?: number
  sellPressureAtExit?: number
  marketContextDiagnosis?: string
}

export interface TradingLeak {
  id: string
  title: string
  chineseTitle: string
  description: string
  evidence: string
  recommendation: string
  impact: string
  frequency: number
  severity: "high" | "medium" | "low"
}

export interface PersonalizedRule {
  id: string
  title: string
  description: string
  reason: string
  category: "entry" | "exit" | "risk" | "timing"
  priority: "critical" | "important" | "suggested"
  evidence: string
}

export interface SimulatedTradeResult {
  tradeId: string
  token: string
  resultPct: number
  resultUsd: number
  exitMinute: number
  exitReason: string
}

export interface WhatIfStrategyResult {
  id: "actual" | "stagedTakeProfit" | "trailingStop" | "timeStop" | "capitalProtection"
  name: string
  strategy: string
  description: string
  reason: string
  resultUsd: number
  resultPct: number
  improvementUsd: number
  improvementPct: number
  trades: SimulatedTradeResult[]
}

export interface WhatIfSimulation {
  actualResult: WhatIfStrategyResult
  actualResultPct: number
  strategies: WhatIfStrategyResult[]
  bestStrategy: string
  bestAlternativeStrategy: string
  improvementPotential: number
  improvementPotentialPct: number
  suggestedPersonalStrategy: string
  conclusion: string
  aiInsight: string
}

export interface DegenReportCard {
  grade: string
  personality: string
  chinesePersonality: string
  biggestLeak: string
  suggestedFix: string
  mirrorRoast: string
  bestTrade: {
    token: string
    pnlUsd: number
  }
}

export interface WalletAnalysis {
  walletAddress: string
  chain: string
  period: string
  mode?: AnalysisMode
  dataSource: DataSource
  dataCoverage: DataCoverage
  bitgetMeta?: BitgetMeta
  summary: WalletSummary
  personality: TradingPersonality
  trades: TradeReplay[]
  leaks: TradingLeak[]
  rules: PersonalizedRule[]
  whatIf: WhatIfSimulation
  reportCard: DegenReportCard
}

function pricePath(buyPrice: number, points: Array<{ minute: number; pnlPct: number }>): PricePathPoint[] {
  return points.map((point) => ({
    ...point,
    price: Number((buyPrice * (1 + point.pnlPct / 100)).toPrecision(8)),
  }))
}

export const mockTrades: TradeReplay[] = [
  {
    id: "1",
    tokenSymbol: "BONK",
    tokenAddress: "So111MirrorBONK9nPq1111111111111111111111",
    token: { symbol: "BONK", name: "Bonk Inu" },
    buyTime: "2026-05-06 14:12 UTC",
    sellTime: "2026-05-06 14:42 UTC",
    holdDurationMin: 30,
    buyPrice: 0.00000142,
    sellPrice: 0.00000298,
    positionSizeUsd: 1418,
    realizedPnlUsd: 1560,
    realizedPnlPct: 110,
    maxUpsidePct: 340,
    maxDrawdownPct: 28,
    postBuyHighPct: 340,
    postBuyLowPct: -28,
    profitCaptureRate: 32.4,
    exitAftermath: "Sold at +110%, then price expanded to +340% before fading.",
    entryScore: 82,
    exitScore: 43,
    mistakeTags: ["Sold Too Early", "卖飞", "No Staged TP", "EARLY_EXIT", "SOLD_BEFORE_MOMENTUM_EXPANSION"],
    diagnosis: "Good entry, weak exit. You caught a strong token early enough, but only captured 32.4% of the available upside.",
    chineseDiagnosis: "买点不错，卖点偏弱。你抓到了一个不错的入场点，但只吃到了最高利润的 32.4%。",
    suggestedFix: "Use staged take-profit once unrealized PnL exceeds +80%, then trail the remaining bag.",
    smartMoneyAtEntry: "net buying",
    smartMoneyAtExit: "continued buying",
    kolAtEntry: "watching",
    kolAtExit: "momentum posts increased",
    holderRiskAtEntry: "medium",
    securityRisk: "medium",
    buyPressureAtEntry: 68,
    sellPressureAtExit: 39,
    marketContextDiagnosis: "Momentum was still expanding when the wallet fully exited.",
    pricePath: pricePath(0.00000142, [
      { minute: 0, pnlPct: 0 },
      { minute: 1, pnlPct: 18 },
      { minute: 5, pnlPct: 65 },
      { minute: 15, pnlPct: 140 },
      { minute: 30, pnlPct: 110 },
      { minute: 45, pnlPct: 220 },
      { minute: 60, pnlPct: 340 },
      { minute: 90, pnlPct: 82 },
      { minute: 120, pnlPct: -12 },
    ]),
  },
  {
    id: "2",
    tokenSymbol: "WIF",
    tokenAddress: "So111MirrorWIF9nPq22222222222222222222222",
    token: { symbol: "WIF", name: "dogwifhat" },
    buyTime: "2026-05-04 09:05 UTC",
    sellTime: "2026-05-04 10:10 UTC",
    holdDurationMin: 65,
    buyPrice: 0.0024,
    sellPrice: 0.00528,
    positionSizeUsd: 1015,
    realizedPnlUsd: 1218,
    realizedPnlPct: 120,
    maxUpsidePct: 410,
    maxDrawdownPct: 12,
    postBuyHighPct: 410,
    postBuyLowPct: -12,
    profitCaptureRate: 29.3,
    exitAftermath: "Sold before the strongest continuation candle; later reached +410%.",
    entryScore: 91,
    exitScore: 46,
    mistakeTags: ["Missed Peak", "Weak Profit Lock", "EARLY_EXIT", "NO_CLEAR_EXIT_RULE"],
    diagnosis: "Strong entry, weak profit protection. You had a clean runner but exited before the largest expansion phase.",
    chineseDiagnosis: "入场很强，但利润保护偏弱。你抓到了趋势，却在最大加速段前离场。",
    suggestedFix: "After taking principal out, keep 10% open until a trailing stop confirms trend failure.",
    smartMoneyAtEntry: "aligned accumulation",
    smartMoneyAtExit: "continued buying",
    kolAtEntry: "bullish mentions rising",
    kolAtExit: "still bullish",
    holderRiskAtEntry: "low",
    securityRisk: "low",
    buyPressureAtEntry: 74,
    sellPressureAtExit: 31,
    marketContextDiagnosis: "The sell happened before momentum exhaustion and before buy pressure cooled.",
    pricePath: pricePath(0.0024, [
      { minute: 0, pnlPct: 0 },
      { minute: 1, pnlPct: 14 },
      { minute: 5, pnlPct: 62 },
      { minute: 15, pnlPct: 120 },
      { minute: 20, pnlPct: 188 },
      { minute: 50, pnlPct: 120 },
      { minute: 80, pnlPct: 410 },
      { minute: 120, pnlPct: 295 },
      { minute: 180, pnlPct: 142 },
    ]),
  },
  {
    id: "3",
    tokenSymbol: "MYRO",
    tokenAddress: "So111MirrorMYRO9nPq333333333333333333333",
    token: { symbol: "MYRO", name: "Myro" },
    buyTime: "2026-05-03 22:30 UTC",
    sellTime: "2026-05-04 01:00 UTC",
    holdDurationMin: 150,
    buyPrice: 0.0056,
    sellPrice: 0.0042,
    positionSizeUsd: 3360,
    realizedPnlUsd: -840,
    realizedPnlPct: -25,
    maxUpsidePct: 18,
    maxDrawdownPct: 42,
    postBuyHighPct: 18,
    postBuyLowPct: -42,
    profitCaptureRate: 0,
    profitGivebackPct: 43,
    exitAftermath: "Never gained momentum, then continued toward -42% after the exit window.",
    entryScore: 34,
    exitScore: 28,
    mistakeTags: ["Bad Entry", "Late Stop", "亏损死拿", "FOMO_ENTRY", "HELD_THROUGH_DRAWDOWN", "BOUGHT_INTO_HOLDER_CONCENTRATION"],
    diagnosis: "Weak entry with no follow-through. The trade never reached +30% within the first 20 minutes, then drifted into a preventable loss.",
    chineseDiagnosis: "入场偏弱，后续没有跟进。20 分钟内没有达到 +30%，却继续持有到可避免的亏损。",
    suggestedFix: "Use a 20-minute time stop for low-momentum entries and hard stop the trade at -30%.",
    overheatedAtEntry: true,
    smartMoneyAtEntry: "distribution",
    smartMoneyAtExit: "mostly exited",
    kolAtEntry: "late hype",
    kolAtExit: "quiet",
    holderRiskAtEntry: "high",
    securityRisk: "medium",
    buyPressureAtEntry: 44,
    sellPressureAtExit: 67,
    marketContextDiagnosis: "The wallet bought into weak follow-through while holder concentration and sell pressure were elevated.",
    pricePath: pricePath(0.0056, [
      { minute: 0, pnlPct: 0 },
      { minute: 1, pnlPct: -9 },
      { minute: 5, pnlPct: 8 },
      { minute: 15, pnlPct: 14 },
      { minute: 20, pnlPct: 12 },
      { minute: 40, pnlPct: -14 },
      { minute: 90, pnlPct: -25 },
      { minute: 150, pnlPct: -25 },
      { minute: 210, pnlPct: -42 },
    ]),
  },
  {
    id: "4",
    tokenSymbol: "POPCAT",
    tokenAddress: "So111MirrorPOPCAT9nPq4444444444444444444",
    token: { symbol: "POPCAT", name: "Popcat" },
    buyTime: "2026-05-01 16:10 UTC",
    sellTime: "2026-05-01 16:32 UTC",
    holdDurationMin: 22,
    buyPrice: 0.00089,
    sellPrice: 0.0012,
    positionSizeUsd: 1514,
    realizedPnlUsd: 530,
    realizedPnlPct: 35,
    maxUpsidePct: 89,
    maxDrawdownPct: 8,
    postBuyHighPct: 89,
    postBuyLowPct: -8,
    profitCaptureRate: 39.3,
    exitAftermath: "Sold as a scalp, then price pushed to +89% before cooling.",
    entryScore: 76,
    exitScore: 52,
    mistakeTags: ["Tiny Win Bias", "EARLY_EXIT", "NO_CLEAR_EXIT_RULE"],
    diagnosis: "Entry was fine, but you treated a clean trend as a scalp. The chart gave enough room for a staged TP1.",
    chineseDiagnosis: "买点可以，但你把一段干净趋势当成短线 scalp 处理，错过了 TP1 空间。",
    suggestedFix: "Do not fully exit a green trade before +80% unless momentum breaks or the stop is hit.",
    smartMoneyAtEntry: "neutral to buying",
    smartMoneyAtExit: "still holding",
    kolAtEntry: "low signal",
    kolAtExit: "mentions rising",
    holderRiskAtEntry: "medium",
    securityRisk: "unknown",
    buyPressureAtEntry: 61,
    sellPressureAtExit: 42,
    marketContextDiagnosis: "Exit discipline was weaker than the market context; momentum had not clearly failed.",
    pricePath: pricePath(0.00089, [
      { minute: 0, pnlPct: 0 },
      { minute: 1, pnlPct: 7 },
      { minute: 5, pnlPct: 22 },
      { minute: 10, pnlPct: 35 },
      { minute: 22, pnlPct: 35 },
      { minute: 36, pnlPct: 72 },
      { minute: 55, pnlPct: 89 },
      { minute: 90, pnlPct: 44 },
    ]),
  },
]

export const mockWalletAnalysis: WalletAnalysis = {
  walletAddress: "7xKXq9fQm2Mirror3nPq",
  chain: "Solana",
  period: "7D",
  mode: "token_replay",
  dataSource: "mock",
  dataCoverage: "mock_fallback",
  bitgetMeta: {
    chain: "Solana",
    walletAddress: "7xKXq9fQm2Mirror3nPq",
    tokenAddress: "So111MirrorBONK9nPq1111111111111111111111",
    tokenInfo: {
      symbol: "BONK",
      name: "Bonk Inu",
      priceUsd: 0.0000021,
      marketCapUsd: 1420000000,
      liquidityUsd: 38000000,
      volume24hUsd: 92000000,
    },
    securitySummary: {
      riskLevel: "medium",
      riskFlags: ["demo_security_context", "holder concentration should be checked before sizing"],
      plainEnglishSummary: "Demo fallback security context. Real Bitget mode should replace this with Wallet Skill token security output.",
    },
    holderSummary: {
      topHolderConcentrationLevel: "medium",
      smartMoneyHolderPresence: true,
      cexHolderPresence: true,
      suspiciousConcentration: false,
      diagnosis: "Demo fallback holder context shows moderate concentration, so behavior scoring should consider position sizing risk.",
    },
    tradingDynamics: {
      buyPressure: 66,
      sellPressure: 41,
      momentum: "expanding",
      volatility: "high",
    },
    marketContext: {
      tokenPrice: 0.0000021,
      marketCap: 1420000000,
      liquidity: 38000000,
      volume24h: 92000000,
      buyPressure: 66,
      sellPressure: 41,
      entryMarketState: "momentum expansion",
      exitMarketState: "trend still active",
      momentumState: "positive",
      liquidityState: "deep enough for demo sizing",
      volatilityState: "high",
    },
    smartMoneySummary: {
      userAction: "sold full position",
      smartMoneyAction: "continued buying",
      kolAction: "momentum discussion increased",
      alignmentScore: 42,
      diagnosis: "The demo wallet exited while smart money and KOL momentum had not cooled, creating a missed-upside pattern.",
      evidence: ["Smart money marker remained net-buying after exit", "KOL activity increased during the next expansion leg"],
    },
    kolSummary: {
      action: "momentum discussion increased",
    },
    quotePreview: {
      supported: false,
      message: "Quote preview is disabled in mock mode.",
    },
    dataCoverageStatus: {
      tokenInfo: true,
      kline: true,
      walletTransactions: true,
      security: true,
      holders: true,
      smartMoneyMarkers: true,
    },
    warnings: ["Demo fallback data. No live Bitget Wallet Skill request was made."],
  },
  summary: {
    totalTrades: 42,
    winRate: 35.7,
    realizedPnlUsd: 2468,
    realizedPnlPct: 34,
    profitCaptureRate: 34,
    avgHoldTime: "67m",
    maxMissedUpside: 290,
    avgWinnerHold: "39m",
    avgLoserHold: "2.5h",
    averageMaxDrawdown: 22.5,
    winnerAvgDrawdown: 16,
    loserAvgDrawdown: 42,
    avgWinnerPnlPct: 88,
    avgLoserPnlPct: -25,
    lossHoldingBias: "Losers held 3.8x longer than winners",
    grade: "C+",
  },
  personality: {
    type: "Profit Leaker",
    chineseType: "利润漏斗型交易者",
    explanation: "You often find tokens with upside, but you fail to protect profits after large unrealized gains. Your biggest problem is not discovery, but profit capture.",
    chineseExplanation: "你经常能抓到有上涨空间的币，但在出现较大浮盈后没有及时保护利润。你的核心问题不是发现机会，而是利润捕获能力不足。",
    coreDiagnosis: "You are not bad at finding entries. Your main leak is exit discipline.",
    evidence: [
      "100% of winning replay trades continued higher after your exit",
      "Average profit capture rate: 34%",
      "Max missed upside: +290%",
      "Avg winner hold: 39m",
      "Avg loser hold: 2.5h",
    ],
    traits: ["Early Exits", "Weak Profit Lock", "Good Token Radar", "Loser Patience"],
    emoji: "Mirror",
  },
  trades: mockTrades,
  leaks: [],
  rules: [],
  whatIf: {
    actualResult: {
      id: "actual",
      name: "Actual Result",
      strategy: "Actual Result",
      description: "Your realized exits from the replay sample.",
      reason: "Baseline based on mock wallet trades.",
      resultUsd: 2468,
      resultPct: 34,
      improvementUsd: 0,
      improvementPct: 0,
      trades: [],
    },
    actualResultPct: 34,
    strategies: [],
    bestStrategy: "",
    bestAlternativeStrategy: "",
    improvementPotential: 0,
    improvementPotentialPct: 0,
    suggestedPersonalStrategy: "",
    conclusion: "",
    aiInsight: "",
  },
  reportCard: {
    grade: "C+",
    personality: "Profit Leaker",
    chinesePersonality: "利润漏斗型",
    biggestLeak: "Selling winners too early",
    suggestedFix: "Use staged take-profit plus trailing stop after +100% unrealized PnL.",
    mirrorRoast: "You find alpha, then donate it back to the chart. 你不是没抓到机会，你是抓到了又亲手放生。",
    bestTrade: { token: "BONK", pnlUsd: 1560 },
  },
}
