import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { loadDB, saveDB, uid, refCode } from './db'

interface Settings { maintenanceMode: boolean; depositBonusPct: number; depositBonusMin: number }

interface AuthContextValue {
  user: User | null
  users: User[]
  settings: Settings
  loading: boolean
  signUp: (d: { email: string; password: string; fullName: string; country: string; referralCode?: string }) => Promise<{ ok: boolean; error?: string }>
  verifyEmail: (code: string) => Promise<{ ok: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string; needs2fa?: boolean }>
  confirm2fa: (code: string) => { ok: boolean; error?: string }
  signOut: () => void
  refresh: () => void
  updateUser: (patch: Partial<User>) => void
  adminUpdateUser: (id: string, patch: Partial<User>) => void
  setSettings: (patch: Partial<Settings>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState(loadDB())
  const [loading, setLoading] = useState(true)
  const [pending2fa, setPending2fa] = useState<string | null>(null)

  useEffect(() => { setLoading(false) }, [])

  const persist = useCallback((patch: Partial<typeof db>) => {
    setDb((prev) => {
      const next = { ...prev, ...patch }
      saveDB(next)
      return next
    })
  }, [])

  const user = useMemo(() => {
    if (!db.session?.userId) return null
    return db.users.find((u) => u.id === db.session!.userId) ?? null
  }, [db.session, db.users])

  const refresh = useCallback(() => setDb(loadDB()), [])

  const signUp: AuthContextValue['signUp'] = useCallback(async ({ email, password, fullName, country, referralCode }) => {
    const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())
    if (exists) return { ok: false, error: 'An account with this email already exists.' }
    const newUser: User = {
      id: uid(), email, password, fullName, country, createdAt: Date.now(),
      verified: false, twoFactorEnabled: false, kycStatus: 'unverified',
      balance: 25000, locked: false, referralCode: refCode(fullName),
      referralCount: 0, referralEarnings: 0,
    }
    let bonus = 0
    if (referralCode) {
      const ref = db.users.find((u) => u.referralCode.toLowerCase() === referralCode!.toLowerCase())
      if (ref) { bonus = 100; ref.referralCount += 1 }
    }
    newUser.balance += bonus
    persist({ users: [...db.users, newUser], session: { userId: newUser.id } })
    return { ok: true }
  }, [db.users, persist])

  const verifyEmail: AuthContextValue['verifyEmail'] = useCallback(async (code) => {
    if (code.trim().length < 4) return { ok: false, error: 'Enter the 6-digit code we sent to your email.' }
    if (!user) return { ok: false, error: 'No active session.' }
    const users = db.users.map((u) => (u.id === user.id ? { ...u, verified: true } : u))
    persist({ users })
    return { ok: true }
  }, [user, db.users, persist])

  const signIn: AuthContextValue['signIn'] = useCallback(async (email, password) => {
    const found = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!found || found.password !== password) return { ok: false, error: 'Invalid email or password.' }
    if (found.locked) return { ok: false, error: 'Your account is under maintenance. Please try again later.' }
    if (found.twoFactorEnabled) { setPending2fa(found.id); return { ok: false, needs2fa: true } }
    persist({ session: { userId: found.id } })
    return { ok: true }
  }, [db.users, persist])

  const confirm2fa: AuthContextValue['confirm2fa'] = useCallback((code) => {
    if (!pending2fa) return { ok: false, error: 'No pending 2FA challenge.' }
    if (code.trim().length < 4) return { ok: false, error: 'Enter your 6-digit authenticator code.' }
    persist({ session: { userId: pending2fa } })
    setPending2fa(null)
    return { ok: true }
  }, [pending2fa, persist])

  const signOut = useCallback(() => { persist({ session: null }); setPending2fa(null) }, [persist])

  const updateUser: AuthContextValue['updateUser'] = useCallback((patch) => {
    if (!user) return
    const users = db.users.map((u) => (u.id === user.id ? { ...u, ...patch } : u))
    persist({ users })
  }, [user, db.users, persist])

  const adminUpdateUser: AuthContextValue['adminUpdateUser'] = useCallback((id, patch) => {
    const users = db.users.map((u) => (u.id === id ? { ...u, ...patch } : u))
    persist({ users })
  }, [db.users, persist])

  const setSettings: AuthContextValue['setSettings'] = useCallback((patch) => {
    persist({ settings: { ...db.settings, ...patch } })
  }, [db.settings, persist])

  const value: AuthContextValue = {
    user, users: db.users, settings: db.settings, loading,
    signUp, verifyEmail, signIn, confirm2fa, signOut, refresh,
    updateUser, adminUpdateUser, setSettings,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
