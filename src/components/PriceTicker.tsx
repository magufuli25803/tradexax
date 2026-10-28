import { useEffect, useState } from 'react'
import { snapshot, tickAll, SYMBOLS } from '../store/priceFeed'
import type { TickerPrice } from '../types'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function PriceTicker() {
  const [prices, setPrices] = useState<TickerPrice[]>(snapshot)

  useEffect(() => {
    setPrices(snapshot())
    const id = setInterval(() => setPrices(tickAll()), 1500)
    return () => clearInterval(id)
  }, [])

  const display = SYMBOLS.slice(0, 4).map((s) => prices.find((p) => p.symbol === s.symbol)!).filter(Boolean)

  return (
    <div className="border-y border-ink-700/60 bg-ink-900/80 backdrop-blur-sm overflow-hidden">
      <div className="flex animate-ticker whitespace-nowrap py-2.5">
        {[...display, ...display, ...display].map((p, i) => {
          const up = p.changePct >= 0
          return (
            <div key={i} className="flex items-center gap-2 px-6 text-sm">
              <span className="font-semibold text-white">{p.symbol.split('/')[0]}</span>
              <span className="font-mono text-slate-300">${p.price.toLocaleString(undefined, { maximumFractionDigits: p.price < 1 ? 4 : 2 })}</span>
              <span className={`flex items-center gap-0.5 font-medium ${up ? 'text-bull' : 'text-bear'}`}>
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {up ? '+' : ''}{p.changePct.toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
