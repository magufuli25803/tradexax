import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { Logo } from './Logo'
import { NotificationBell } from './NotificationBell'
import { LiveChat } from './LiveChat'
import { PriceTicker } from './PriceTicker'
import { LayoutDashboard, Wallet, ArrowDownToLine, ArrowUpFromLine, ShieldCheck, LogOut, Menu, X, Settings } from 'lucide-react'

export function DashboardLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) { navigate('/login'); return null }

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/wallet', label: 'Wallet', icon: Wallet },
    { to: '/deposit', label: 'Deposit', icon: ArrowDownToLine },
    { to: '/withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
    { to: '/kyc', label: 'Verification', icon: ShieldCheck },
  ]

  function handleSignOut() { signOut(); navigate('/') }

  return (
    <div className="min-h-screen">
      <PriceTicker />
      <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((n) => (
                <NavLink key={n.to} to={n.to} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-ink-700 text-white' : 'text-slate-400 hover:text-white hover:bg-ink-800'}`}>
                  <n.icon className="h-4 w-4" />{n.label}
                </NavLink>
              ))}
              {user.isAdmin && (
                <NavLink to="/admin" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-gold-500/20 text-gold-300' : 'text-gold-400 hover:text-gold-300 hover:bg-ink-800'}`}>
                  <Settings className="h-4 w-4" />Admin
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-500">Balance</p>
              <p className="font-mono text-sm font-bold text-gold-400">${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <NotificationBell />
            <div className="hidden md:flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ocean-600 text-xs font-bold text-white">{user.fullName.slice(0, 1).toUpperCase()}</div>
              <span className="text-sm text-slate-300">{user.fullName.split(' ')[0]}</span>
            </div>
            <button onClick={handleSignOut} className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-slate-300 hover:text-white" title="Sign out"><LogOut className="h-4 w-4" /></button>
            <button onClick={() => setMobileOpen((o) => !o)} className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-slate-300">{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="lg:hidden border-t border-ink-700 bg-ink-900 px-4 py-3">
            {navItems.map((n) => (
              <NavLink key={n.to} to={n.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-ink-700 text-white' : 'text-slate-400'}`}>
                <n.icon className="h-4 w-4" />{n.label}
              </NavLink>
            ))}
            {user.isAdmin && <NavLink to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gold-400"><Settings className="h-4 w-4" />Admin</NavLink>}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6"><Outlet /></main>
      <LiveChat />
    </div>
  )
}
