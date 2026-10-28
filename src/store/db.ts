import type { User, Position, Transaction, Notification, KycDoc, Settings } from '../types'

const PREFIX = 'vaultex::'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch { return fallback }
}

function write<T>(key: string, value: T): void {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)) } catch { /* ignore */ }
}

export interface DBShape {
  users: User[]
  positions: Position[]
  transactions: Transaction[]
  notifications: Notification[]
  kyc: KycDoc[]
  settings: Settings
  session: { userId: string | null } | null
}

export const DEFAULT_SETTINGS: Settings = {
  maintenanceMode: false,
  depositBonusPct: 20,
  depositBonusMin: 500,
}

export function loadDB(): DBShape {
  const base: DBShape = {
    users: read<User[]>('users', []),
    positions: read<Position[]>('positions', []),
    transactions: read<Transaction[]>('transactions', []),
    notifications: read<Notification[]>('notifications', []),
    kyc: read<KycDoc[]>('kyc', []),
    settings: { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>('settings', {}) },
    session: read<{ userId: string | null } | null>('session', null),
  }
  if (!base.users.some((u) => u.isAdmin)) {
    base.users.push({
      id: 'admin-0001', email: 'admin@vaultex.io', password: 'Admin!2024',
      fullName: 'Platform Admin', country: 'United States', createdAt: Date.now(),
      verified: true, twoFactorEnabled: true, kycStatus: 'approved', balance: 0,
      locked: false, referralCode: 'ADMIN', referralCount: 0, referralEarnings: 0, isAdmin: true,
    })
    write('users', base.users)
  }
  return base
}

export function saveDB(db: Partial<DBShape>): void {
  if (db.users !== undefined) write('users', db.users)
  if (db.positions !== undefined) write('positions', db.positions)
  if (db.transactions !== undefined) write('transactions', db.transactions)
  if (db.notifications !== undefined) write('notifications', db.notifications)
  if (db.kyc !== undefined) write('kyc', db.kyc)
  if (db.settings !== undefined) write('settings', db.settings)
  if (db.session !== undefined) write('session', db.session)
}

export const uid = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export const refCode = (name: string): string =>
  (name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'USER') + Math.floor(1000 + Math.random() * 9000)
