"use client"

import { Menu } from "lucide-react"

interface DashboardHeaderProps {
  language: "en" | "zh"
  onLanguageChange: (language: "en" | "zh") => void
}

export function DashboardHeader({ language, onLanguageChange }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="font-bold text-lg text-foreground tracking-tight">
                  {language === "zh" ? "交易行为实验室" : "Trading Behavior Lab"}
                </span>
                <span className="text-[10px] text-muted-foreground -mt-1 uppercase tracking-widest">
                  {language === "zh" ? "钱包交易行为分析" : "Wallet Behavior Analysis"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl border border-border/50 bg-secondary/40 p-1">
              <button
                type="button"
                onClick={() => onLanguageChange("zh")}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${language === "zh" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                中文
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange("en")}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                英文
              </button>
            </div>
            <button 
              type="button"
              className="sm:hidden text-muted-foreground hover:text-foreground"
              aria-label={language === "zh" ? "菜单" : "Menu"}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
