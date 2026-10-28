import type { Candle, TickerPrice } from '../types'

export const SYMBOLS: { symbol: string; name: string; base: number }[] = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', base: 67250 },
  { symbol: 'ETH/USDT', name: 'Ethereum', base: 3480 },
  { symbol: 'USDT/USD', name: 'Tether', base: 1.0 },
  { symbol: 'XRP/USDT', name: 'Ripple', base: 0.612 },
  { symbol: 'SOL/USDT', name: 'Solana', base: 168 },
  { symbol: 'BNB/USDT', name: 'BNB', base: 595 },
  { symbol: 'ADA/USDT', name: 'Cardano', base: 0.45 },
  { symbol: 'DOGE/USDT', name: 'Dogecoin', base: 0.158 },
]

const priceState: Record<string, number> = {}
SYMBOLS.forEach((s) => (priceState[s.symbol] = s.base))

function nextPrice(symbol: string): number {
  const cur = priceState[symbol] ?? SYMBOLS.find((s) => s.symbol === symbol)!.base
  const vol = cur * 0.0015
  const drift = (Math.random() - 0.5) * 2 * vol
  const next = Math.max(0.0001, cur + drift)
  priceState[symbol] = next
  return next
}

export function getPrice(symbol: string): number {
  return priceState[symbol] ?? SYMBOLS.find((s) => s.symbol === symbol)!.base
}

export function tickAll(): TickerPrice[] {
  return SYMBOLS.map((s) => {
    const price = nextPrice(s.symbol)
    const change24h = price - s.base
    return { symbol: s.symbol, name: s.name, price, change24h, changePct: (change24h / s.base) * 100 }
  })
}

export function snapshot(): TickerPrice[] {
  return SYMBOLS.map((s) => {
    const price = priceState[s.symbol]
    const change24h = price - s.base
    return { symbol: s.symbol, name: s.name, price, change24h, changePct: (change24h / s.base) * 100 }
  })
}

const TF_MS: Record<string, number> = { '1m': 60_000, '5m': 300_000, '1h': 3_600_000 }

export function generateHistory(symbol: string, tf: keyof typeof TF_MS = '1m', count = 60): Candle[] {
  const interval = TF_MS[tf]
  const now = Date.now()
  const start = now - count * interval
  let price = priceState[symbol] ?? SYMBOLS.find((s) => s.symbol === symbol)!.base
  const candles: Candle[] = []
  for (let i = 0; i < count; i++) {
    const time = start + i * interval
    const open = price
    let high = open, low = open, close = open
    for (let m = 0; m < 4; m++) {
      const step = (Math.random() - 0.5) * 2 * open * 0.004
      close += step
      high = Math.max(high, close)
      low = Math.min(low, close)
    }
    const volume = (Math.abs(close - open) / open) * 1000 + Math.random() * 500
    candles.push({ time, open, high, low, close, volume })
    price = close
  }
  priceState[symbol] = price
  return candles
}

export function nextCandle(prev: Candle, tf: keyof typeof TF_MS = '1m'): Candle {
  const interval = TF_MS[tf]
  const open = prev.close
  let high = open, low = open, close = open
  for (let m = 0; m < 4; m++) {
    const step = (Math.random() - 0.5) * 2 * open * 0.004
    close += step
    high = Math.max(high, close)
    low = Math.min(low, close)
  }
  const volume = (Math.abs(close - open) / open) * 1000 + Math.random() * 500
  return { time: prev.time + interval, open, high, low, close, volume }
}
