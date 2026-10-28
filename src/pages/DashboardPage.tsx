import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useStore, computePnL } from '../store/useStore'
import { CandlestickChart } from '../components/CandlestickChart'
import { SYMBOLS, getPrice } from '../store/priceFeed'
import { useToast } from '../components/Toast'
import { Wallet, TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine, X, ShieldCheck, Copy, Users, Gift } from 'lucide-react'
import type { OrderSide, Position } from '../types'

export function DashboardPage() {
  const { user } = useAuth()
  const store = useStore()
  const { push } = useToast()
  const [symbol, setSymbol] = useState('BTC/USDT')
  const [side, setSide] = useState<OrderSide>('buy')
  const [size, setSize] = useState('100')
  const [leverage, setLeverage] = useState(10)
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1500)
    return () => clearInterval(id)
  }, [])

  const openPositions = store.positions.filter((p) => p.status === 'open')
  const closedPositions = store.positions.filter((p) => p.status === 'closed')

  const livePnL = useMemo(() => {
    return openPositions.reduce((sum, p) => sum + computePnL(p, getPrice(p.symbol)), 0)
  }, [openPositions])

  const totalEquity = (user?.balance ?? 0) + livePnL

  const currentPrice = getPrice(symbol)

  function submitOrder() {
    const amount = parseFloat(size)
    if (!amount || amount <= 0) {
      push('error', 'Enter a valid order size.')
      return
    }
    if (amount > totalEquity) {
      push('error', 'Insufficient balance for this order size.')
      return
    }
    const res = store.openPosition({
      symbol,
      side,
      size: amount,
      leverage,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
    })
    if (res.ok) {
      push('success', `${side === 'buy' ? 'Long' : 'Short'} ${symbol} ${leverage}x opened at $${currentPrice.toFixed(2)}`)
      setStopLoss('')
      setTakeProfit('')
    } else {
      push('error', res.error || 'Order failed.')
    }
  }

  function closePos(id: string) {
    const res = store.closePosition(id)
    if (res.ok) {
      const pnl = res.pnl ?? 0
      push(pnl >= 0 ? 'success' : 'info', `Position closed. P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`)
    } else {
      push('error', res.error || 'Could not close position.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Maintenance banner */}
      {user?.locked && (
        <div className="rounded-xl border border-gold-500/40 bg-gold-500/10 px-4 py-3 text-sm text-gold-300">
          Your account is in maintenance mode. Trading is temporarily disabled.
        </div>
      )}

      {/* Balance cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Available balance</p>
            <Wallet className="h-5 w-5 text-gold-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">${(user?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <div className="mt-3 flex gap-2">
            <Link to="/deposit" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-bull/15 py-1.5 text-xs font-semibold text-bull hover:bg-bull/25">
              <ArrowDownToLine className="h-3.5 w-3.5" /> Deposit
            </Link>
            <Link to="/withdraw" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-bear/15 py-1.5 text-xs font-semibold text-bear hover:bg-bear/25">
              <ArrowUpFromLine className="h-3.5 w-3.5" /> Withdraw
            </Link>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Open P&L</p>
            {livePnL >= 0 ? <TrendingUp className="h-5 w-5 text-bull" /> : <TrendingDown className="h-5 w-5 text-bear" />}
          </div>
          <p className={`mt-2 font-mono text-2xl font-bold ${livePnL >= 0 ? 'text-bull' : 'text-bear'}`}>
            {livePnL >= 0 ? '+' : ''}${livePnL.toFixed(2)}
          </p>
          <p className="mt-3 text-xs text-slate-500">{openPositions.length} open position{openPositions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Total equity</p>
            <ShieldCheck className="h-5 w-5 text-ocean-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="mt-3 text-xs text-slate-500">Balance + open P&L</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Referral earnings</p>
            <Users className="h-5 w-5 text-gold-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">${(user?.referralEarnings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="mt-3 text-xs text-slate-500">{user?.referralCount ?? 0} referrals</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {SYMBOLS.slice(0, 6).map((s) => (
              <button
                key={s.symbol}
                onClick={() => setSymbol(s.symbol)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  symbol === s.symbol ? 'bg-ink-700 text-white' : 'text-slate-400 hover:text-white hover:bg-ink-800'
                }`}
              >
                {s.symbol.split('/')[0]}
              </button>
            ))}
          </div>
          <CandlestickChart symbol={symbol} />
        </div>

        {/* Order panel */}
        <div className="card p-5">
          <div className="flex rounded-lg border border-ink-600 bg-ink-900 p-1">
            <button
              onClick={() => setSide('buy')}
              className={`flex-1 rounded-md py-2 text-sm font-bold transition ${side === 'buy' ? 'bg-bull text-white' : 'text-slate-400'}`}
            >
              Buy / Long
            </button>
            <button
              onClick={() => setSide('sell')}
              className={`flex-1 rounded-md py-2 text-sm font-bold transition ${side === 'sell' ? 'bg-bear text-white' : 'text-slate-400'}`}
            >
              Sell / Short
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="label">Order size (USD)</label>
              <input className="input" type="number" min="1" value={size} onChange={(e) => setSize(e.target.value)} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label mb-0">Leverage</label>
                <span className="font-mono text-sm font-bold text-gold-400">{leverage}x</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={leverage}
                onChange={(e) => setLeverage(parseInt(e.target.value))}
                className="mt-2 w-full accent-gold-500"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                <span>1x</span><span>25x</span><span>50x</span><span>75x</span><span>100x</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Stop loss</label>
                <input className="input" type="number" placeholder="0.00" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
              </div>
              <div>
                <label className="label">Take profit</label>
                <input className="input" type="number" placeholder="0.00" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} />
              </div>
            </div>
            <div className="rounded-lg bg-ink-800 p-3 text-xs space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">Entry price</span><span className="font-mono text-white">${currentPrice.toFixed(currentPrice < 1 ? 4 : 2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Position value</span><span className="font-mono text-white">${(parseFloat(size || '0') * leverage).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Margin</span><span className="font-mono text-white">${(parseFloat(size || '0')).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Est. liquidation</span><span className="font-mono text-bear">${side === 'buy' ? (currentPrice * (1 - 1 / leverage * 0.92)).toFixed(2) : (currentPrice * (1 + 1 / leverage * 0.92)).toFixed(2)}</span></div>
            </div>
            <button
              onClick={submitOrder}
              disabled={user?.locked}
              className={`w-full rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-50 ${side === 'buy' ? 'bg-bull hover:bg-bull/90' : 'bg-bear hover:bg-bear/90'}`}
            >
              {side === 'buy' ? 'Open Long' : 'Open Short'} {symbol.split('/')[0]} {leverage}x
            </button>
          </div>
        </div>
      </div>

      {/* Open positions */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-700 px-5 py-4">
          <h3 className="font-bold text-white">Open positions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Symbol</th>
                <th className="px-5 py-3 font-medium">Side</th>
                <th className="px-5 py-3 font-medium text-right">Size</th>
                <th className="px-5 py-3 font-medium text-right">Lev</th>
                <th className="px-5 py-3 font-medium text-right">Entry</th>
                <th className="px-5 py-3 font-medium text-right">Mark</th>
                <th className="px-5 py-3 font-medium text-right">Liq.</th>
                <th className="px-5 py-3 font-medium text-right">P&L</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {openPositions.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-500">No open positions. Place an order to get started.</td></tr>
              ) : (
                openPositions.map((p) => {
                  const mark = getPrice(p.symbol)
                  const pnl = computePnL(p, mark)
                  return <PositionRow key={p.id} pos={p} mark={mark} pnl={pnl} onClose={() => closePos(p.id)} />
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade history */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-700 px-5 py-4">
          <h3 className="font-bold text-white">Trade history</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Symbol</th>
                <th className="px-5 py-3 font-medium">Side</th>
                <th className="px-5 py-3 font-medium text-right">Size</th>
                <th className="px-5 py-3 font-medium text-right">Lev</th>
                <th className="px-5 py-3 font-medium text-right">Entry</th>
                <th className="px-5 py-3 font-medium text-right">Exit</th>
                <th className="px-5 py-3 font-medium text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {closedPositions.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-500">No closed trades yet.</td></tr>
              ) : (
                closedPositions.slice(0, 20).map((p) => (
                  <tr key={p.id} className="border-b border-ink-700/40 hover:bg-ink-800/40">
                    <td className="px-5 py-3 text-slate-400">{new Date(p.closedAt ?? p.openedAt).toLocaleString()}</td>
                    <td className="px-5 py-3 font-medium text-white">{p.symbol}</td>
                    <td className={`px-5 py-3 font-medium ${p.side === 'buy' ? 'text-bull' : 'text-bear'}`}>{p.side === 'buy' ? 'Long' : 'Short'}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-300">${p.size.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-300">{p.leverage}x</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-300">${p.entryPrice.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-300">${(p.markPrice ?? 0).toFixed(2)}</td>
                    <td className={`px-5 py-3 text-right font-mono font-semibold ${p.pnl >= 0 ? 'text-bull' : 'text-bear'}`}>{p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referral card */}
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <Gift className="h-6 w-6 text-gold-400" />
          <h3 className="font-bold text-white">Your referral link</h3>
        </div>
        <p className="mt-2 text-sm text-slate-400">Earn 10% commission on every trade made by users you refer.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="flex-1 rounded-lg border border-ink-600 bg-ink-900 px-4 py-2.5 font-mono text-sm text-gold-300">
            https://vaultex.io/r/{user?.referralCode}
          </div>
          <button
            onClick={() => { navigator.clipboard?.writeText(`https://vaultex.io/r/${user?.referralCode}`); push('info', 'Referral link copied.') }}
            className="btn-gold"
          >
            <Copy className="h-4 w-4" /> Copy link
          </button>
        </div>
      </div>
    </div>
  )
}

function PositionRow({ pos, mark, pnl, onClose }: { pos: Position; mark: number; pnl: number; onClose: () => void }) {
  return (
    <tr className="border-b border-ink-700/40 hover:bg-ink-800/40">
      <td className="px-5 py-3 font-medium text-white">{pos.symbol}</td>
      <td className={`px-5 py-3 font-medium ${pos.side === 'buy' ? 'text-bull' : 'text-bear'}`}>{pos.side === 'buy' ? 'Long' : 'Short'}</td>
      <td className="px-5 py-3 text-right font-mono text-slate-300">${pos.size.toFixed(2)}</td>
      <td className="px-5 py-3 text-right font-mono text-slate-300">{pos.leverage}x</td>
      <td className="px-5 py-3 text-right font-mono text-slate-300">${pos.entryPrice.toFixed(2)}</td>
      <td className="px-5 py-3 text-right font-mono text-white">${mark.toFixed(2)}</td>
      <td className="px-5 py-3 text-right font-mono text-bear">${pos.liquidationPrice.toFixed(2)}</td>
      <td className={`px-5 py-3 text-right font-mono font-semibold ${pnl >= 0 ? 'text-bull' : 'text-bear'}`}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</td>
      <td className="px-5 py-3 text-right">
        <button onClick={onClose} className="inline-flex items-center gap-1 rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-ink-500">
          <X className="h-3.5 w-3.5" /> Close
        </button>
      </td>
    </tr>
  )
}
