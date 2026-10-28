import { useState } from 'react'
import { useAuth } from '../store/auth'
import { useStore } from '../store/useStore'
import { useToast } from '../components/Toast'
import { loadDB } from '../store/db'
import { Logo } from '../components/Logo'
import { Users, ArrowDownToLine, ArrowUpFromLine, Settings, Check, X, DollarSign, Lock, Unlock, Search, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react'

type Tab = 'users' | 'deposits' | 'withdrawals' | 'settings'

export function AdminPage() {
  const { user, users, settings, adminUpdateUser, setSettings } = useAuth()
  const { adminApproveDeposit, adminApproveWithdrawal, adminCreditUser } = useStore()
  const { push } = useToast()
  const [tab, setTab] = useState<Tab>('users')
  const [search, setSearch] = useState('')
  const [creditUser, setCreditUser] = useState<string | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditNote, setCreditNote] = useState('')

  const db = loadDB()
  const allTx = db.transactions

  const filteredUsers = users.filter((u) =>
    !u.isAdmin && (u.email.toLowerCase().includes(search.toLowerCase()) || u.fullName.toLowerCase().includes(search.toLowerCase()))
  )

  const pendingDeposits = allTx.filter((t) => t.type === 'deposit' && t.status === 'pending')
  const pendingWithdrawals = allTx.filter((t) => t.type === 'withdrawal' && t.status === 'pending')

  function doCredit() {
    if (!creditUser) return
    const amt = parseFloat(creditAmount)
    if (!amt) { push('error', 'Enter a valid amount.'); return }
    adminCreditUser(creditUser, amt, creditNote)
    push('success', `Credited $${amt.toFixed(2)} to user account.`)
    setCreditUser(null); setCreditAmount(''); setCreditNote('')
  }

  function toggleLock(userId: string, locked: boolean) {
    adminUpdateUser(userId, { locked: !locked })
    push('info', `Account ${!locked ? 'locked' : 'unlocked'} successfully.`)
  }

  function toggleMaintenance() {
    const next = !settings.maintenanceMode
    setSettings({ maintenanceMode: next })
    if (next) {
      users.filter((u) => !u.isAdmin).forEach((u) => adminUpdateUser(u.id, { locked: true }))
    } else {
      users.filter((u) => !u.isAdmin).forEach((u) => adminUpdateUser(u.id, { locked: false }))
    }
    push(next ? 'error' : 'success', `Maintenance mode ${next ? 'enabled — all user accounts locked' : 'disabled — accounts unlocked'}`)
  }

  const tabs: { id: Tab; label: string; icon: typeof Users; badge?: number }[] = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'deposits', label: 'Deposits', icon: ArrowDownToLine, badge: pendingDeposits.length },
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine, badge: pendingWithdrawals.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="rounded-lg bg-gold-500/20 px-3 py-1 text-xs font-bold text-gold-300">ADMIN PANEL</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-slate-400">{user?.email}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-ink-950 text-sm font-bold">A</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="card p-5">
            <div className="flex items-center justify-between"><p className="text-sm text-slate-400">Total users</p><Users className="h-5 w-5 text-ocean-400" /></div>
            <p className="mt-2 font-mono text-2xl font-bold text-white">{users.filter((u) => !u.isAdmin).length}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between"><p className="text-sm text-slate-400">Pending deposits</p><ArrowDownToLine className="h-5 w-5 text-bull" /></div>
            <p className="mt-2 font-mono text-2xl font-bold text-white">{pendingDeposits.length}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between"><p className="text-sm text-slate-400">Pending withdrawals</p><ArrowUpFromLine className="h-5 w-5 text-bear" /></div>
            <p className="mt-2 font-mono text-2xl font-bold text-white">{pendingWithdrawals.length}</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between"><p className="text-sm text-slate-400">Total balances</p><DollarSign className="h-5 w-5 text-gold-400" /></div>
            <p className="mt-2 font-mono text-2xl font-bold text-white">${users.filter((u) => !u.isAdmin).reduce((s, u) => s + u.balance, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-xl border border-ink-600 bg-ink-900 p-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${tab === t.id ? 'bg-ink-700 text-white' : 'text-slate-400 hover:text-white'}`}>
              <t.icon className="h-4 w-4" />{t.label}
              {t.badge ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-bear px-1.5 text-[10px] font-bold text-white">{t.badge}</span> : null}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'users' && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
                <h3 className="font-bold text-white">User management</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input className="input pl-10 w-64" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3 font-medium">User</th>
                      <th className="px-5 py-3 font-medium">Country</th>
                      <th className="px-5 py-3 font-medium">KYC</th>
                      <th className="px-5 py-3 font-medium text-right">Balance</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No users found.</td></tr>
                    ) : filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-ink-700/40 hover:bg-ink-800/40">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean-600 text-xs font-bold text-white">{u.fullName.slice(0, 1).toUpperCase()}</div>
                            <div><p className="font-medium text-white">{u.fullName}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-400">{u.country}</td>
                        <td className="px-5 py-3"><KycBadge status={u.kycStatus} /></td>
                        <td className="px-5 py-3 text-right font-mono font-semibold text-gold-400">${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-5 py-3">{u.locked ? <span className="chip border-bear/30 text-bear"><Lock className="h-3 w-3" /> Locked</span> : <span className="chip border-bull/30 text-bull"><Unlock className="h-3 w-3" /> Active</span>}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setCreditUser(u.id)} className="inline-flex items-center gap-1 rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-xs font-medium text-gold-400 hover:border-gold-500/50"><DollarSign className="h-3.5 w-3.5" /> Credit</button>
                            <button onClick={() => toggleLock(u.id, u.locked)} className="inline-flex items-center gap-1 rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white">{u.locked ? <><Unlock className="h-3.5 w-3.5" /> Unlock</> : <><Lock className="h-3.5 w-3.5" /> Lock</>}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'deposits' && (
            <TxTable title="Deposit requests" txs={allTx.filter((t) => t.type === 'deposit')} onApprove={(id) => { adminApproveDeposit(id, true); push('success', 'Deposit approved and credited.') }} onReject={(id) => { adminApproveDeposit(id, false); push('info', 'Deposit rejected.') }} />
          )}

          {tab === 'withdrawals' && (
            <TxTable title="Withdrawal requests" txs={allTx.filter((t) => t.type === 'withdrawal')} onApprove={(id) => { adminApproveWithdrawal(id, true); push('success', 'Withdrawal approved and processed.') }} onReject={(id) => { adminApproveWithdrawal(id, false); push('info', 'Withdrawal rejected. Funds returned.') }} />
          )}

          {tab === 'settings' && (
            <div className="card p-6">
              <h3 className="font-bold text-white">Platform settings</h3>
              <div className="mt-6 rounded-xl border border-ink-600 bg-ink-900 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings.maintenanceMode ? <AlertTriangle className="h-6 w-6 text-bear" /> : <ShieldCheck className="h-6 w-6 text-bull" />}
                    <div>
                      <p className="font-semibold text-white">Maintenance mode</p>
                      <p className="text-sm text-slate-400">When enabled, all user accounts are locked and trading is disabled.</p>
                    </div>
                  </div>
                  <button onClick={toggleMaintenance} className={`relative h-7 w-14 rounded-full transition ${settings.maintenanceMode ? 'bg-bear' : 'bg-ink-600'}`}>
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${settings.maintenanceMode ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-ink-600 bg-ink-900 p-5">
                  <p className="text-sm text-slate-400">Deposit bonus percentage</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-gold-400">{settings.depositBonusPct}%</p>
                </div>
                <div className="rounded-xl border border-ink-600 bg-ink-900 p-5">
                  <p className="text-sm text-slate-400">Minimum deposit for bonus</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-white">${settings.depositBonusMin}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Credit modal */}
      {creditUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setCreditUser(null)}>
          <div className="w-full max-w-md card p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="flex items-center gap-2 font-bold text-white"><DollarSign className="h-5 w-5 text-gold-400" /> Credit user account</h3>
            <p className="mt-1 text-sm text-slate-400">Add or remove funds from this user's balance.</p>
            <div className="mt-4 space-y-4">
              <div><label className="label">Amount (use negative to deduct)</label><input className="input" type="number" placeholder="500.00" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} /></div>
              <div><label className="label">Note (optional)</label><input className="input" placeholder="Promotional credit" value={creditNote} onChange={(e) => setCreditNote(e.target.value)} /></div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setCreditUser(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={doCredit} className="btn-gold flex-1">Confirm credit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KycBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: 'border-bull/30 text-bull bg-bull/10',
    pending: 'border-gold-500/30 text-gold-300 bg-gold-500/10',
    rejected: 'border-bear/30 text-bear bg-bear/10',
    unverified: 'border-ink-600 text-slate-500 bg-ink-800',
  }
  return <span className={`chip ${map[status] || ''}`}>{status}</span>
}

function TxTable({ title, txs, onApprove, onReject }: { title: string; txs: import('../types').Transaction[]; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-ink-700 px-5 py-4"><h3 className="font-bold text-white">{title}</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-700 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Method</th>
              <th className="px-5 py-3 font-medium text-right">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {txs.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No requests.</td></tr>
            ) : txs.map((t) => {
              const db = loadDB()
              const u = db.users.find((x) => x.id === t.userId)
              return (
                <tr key={t.id} className="border-b border-ink-700/40 hover:bg-ink-800/40">
                  <td className="px-5 py-3 text-slate-400">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3"><p className="font-medium text-white">{u?.fullName || 'Unknown'}</p><p className="text-xs text-slate-500">{u?.email}</p></td>
                  <td className="px-5 py-3 text-slate-400">{t.method}</td>
                  <td className="px-5 py-3 text-right font-mono font-semibold text-white">${t.amount.toFixed(2)}</td>
                  <td className="px-5 py-3"><TxStatus status={t.status} /></td>
                  <td className="px-5 py-3 text-right">
                    {t.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => onApprove(t.id)} className="inline-flex items-center gap-1 rounded-lg bg-bull/15 px-3 py-1.5 text-xs font-semibold text-bull hover:bg-bull/25"><Check className="h-3.5 w-3.5" /> Approve</button>
                        <button onClick={() => onReject(t.id)} className="inline-flex items-center gap-1 rounded-lg bg-bear/15 px-3 py-1.5 text-xs font-semibold text-bear hover:bg-bear/25"><X className="h-3.5 w-3.5" /> Reject</button>
                      </div>
                    ) : <span className="text-xs text-slate-500">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TxStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'border-gold-500/30 text-gold-300 bg-gold-500/10',
    completed: 'border-bull/30 text-bull bg-bull/10',
    rejected: 'border-bear/30 text-bear bg-bear/10',
  }
  return <span className={`chip ${map[status] || ''}`}>{status}</span>
}
