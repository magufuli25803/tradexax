import { useAuth } from '../store/auth'
import { useStore } from '../store/useStore'
import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine, Wallet as WalletIcon, TrendingUp } from 'lucide-react'

export function WalletPage() {
  const { user } = useAuth()
  const { transactions } = useStore()

  const deposits = transactions.filter((t) => t.type === 'deposit')
  const withdrawals = transactions.filter((t) => t.type === 'withdrawal')
  const trades = transactions.filter((t) => t.type === 'trade')
  const bonuses = transactions.filter((t) => t.type === 'bonus')

  const totalDeposited = deposits.filter((d) => d.status === 'completed').reduce((s, d) => s + d.amount, 0)
  const totalWithdrawn = withdrawals.filter((w) => w.status === 'completed').reduce((s, w) => s + w.amount, 0)
  const totalPnL = trades.reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-400">Total balance</p>
            <p className="mt-1 font-mono text-4xl font-bold text-white">${(user?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/deposit" className="btn-gold"><ArrowDownToLine className="h-4 w-4" /> Deposit</Link>
            <Link to="/withdraw" className="btn-ghost"><ArrowUpFromLine className="h-4 w-4" /> Withdraw</Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-2"><ArrowDownToLine className="h-4 w-4 text-bull" /><p className="text-sm text-slate-400">Total deposited</p></div>
          <p className="mt-2 font-mono text-xl font-bold text-white">${totalDeposited.toFixed(2)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2"><ArrowUpFromLine className="h-4 w-4 text-bear" /><p className="text-sm text-slate-400">Total withdrawn</p></div>
          <p className="mt-2 font-mono text-xl font-bold text-white">${totalWithdrawn.toFixed(2)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-gold-400" /><p className="text-sm text-slate-400">Realized P&L</p></div>
          <p className={`mt-2 font-mono text-xl font-bold ${totalPnL >= 0 ? 'text-bull' : 'text-bear'}`}>{totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-ink-700 px-5 py-4 flex items-center gap-2">
          <WalletIcon className="h-5 w-5 text-ocean-400" />
          <h3 className="font-bold text-white">Transaction history</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No transactions yet.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="border-b border-ink-700/40 hover:bg-ink-800/40">
                    <td className="px-5 py-3 text-slate-400">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={`chip ${t.type === 'deposit' ? 'border-bull/30 text-bull' : t.type === 'withdrawal' ? 'border-bear/30 text-bear' : t.type === 'bonus' ? 'border-gold-500/30 text-gold-300' : 'border-ocean-500/30 text-ocean-300'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{t.method || '—'}</td>
                    <td className={`px-5 py-3 text-right font-mono font-semibold ${t.amount >= 0 ? 'text-bull' : 'text-bear'}`}>{t.amount >= 0 ? '+' : ''}${t.amount.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-500 max-w-xs truncate">{t.note || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'border-gold-500/30 text-gold-300 bg-gold-500/10',
    approved: 'border-ocean-500/30 text-ocean-300 bg-ocean-500/10',
    completed: 'border-bull/30 text-bull bg-bull/10',
    rejected: 'border-bear/30 text-bear bg-bear/10',
  }
  return <span className={`chip ${map[status] || ''}`}>{status}</span>
}
