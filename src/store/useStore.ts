import { useCallback } from 'react'
import { useAuth } from './auth'
import { loadDB, saveDB, uid } from './db'
import type { Position, Transaction, Notification, OrderSide } from '../types'
import { getPrice } from './priceFeed'

export function useStore() {
  const { user, refresh } = useAuth()
  const db = loadDB()

  const persist = useCallback((patch: Partial<ReturnType<typeof loadDB>>) => {
    const next = { ...loadDB(), ...patch }
    saveDB(next)
    refresh()
  }, [refresh])

  const openPosition = useCallback((params: { symbol: string; side: OrderSide; size: number; leverage: number; stopLoss?: number; takeProfit?: number }) => {
    if (!user) return { ok: false as const, error: 'Not signed in.' }
    const price = getPrice(params.symbol)
    const liqOffset = price * (1 / params.leverage) * 0.92
    const pos: Position = {
      id: uid(), userId: user.id, symbol: params.symbol, side: params.side,
      size: params.size, leverage: params.leverage, entryPrice: price, markPrice: price,
      stopLoss: params.stopLoss, takeProfit: params.takeProfit,
      liquidationPrice: params.side === 'buy' ? price - liqOffset : price + liqOffset,
      openedAt: Date.now(), pnl: 0, status: 'open',
    }
    persist({ positions: [...db.positions, pos] })
    return { ok: true as const, position: pos }
  }, [user, db.positions, persist])

  const closePosition = useCallback((id: string) => {
    if (!user) return { ok: false as const, error: 'Not signed in.' }
    const pos = db.positions.find((p) => p.id === id && p.userId === user.id)
    if (!pos || pos.status !== 'open') return { ok: false as const, error: 'Position not found.' }
    const price = getPrice(pos.symbol)
    const pnl = computePnL(pos, price)
    const positions = db.positions.map((p) =>
      p.id === id ? { ...p, status: 'closed' as const, closedAt: Date.now(), markPrice: price, pnl } : p,
    )
    const users = db.users.map((u) => (u.id === user.id ? { ...u, balance: u.balance + pnl } : u))
    const tx: Transaction = {
      id: uid(), userId: user.id, type: 'trade', amount: pnl, status: 'completed',
      createdAt: Date.now(), note: `Closed ${pos.side} ${pos.symbol} ${pos.leverage}x — P&L ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USD`,
    }
    persist({ positions, users, transactions: [tx, ...db.transactions] })
    return { ok: true as const, pnl }
  }, [user, db.positions, db.users, db.transactions, persist])

  const requestDeposit = useCallback((params: { amount: number; method: string; address: string }) => {
    if (!user) return { ok: false as const, error: 'Not signed in.' }
    const tx: Transaction = {
      id: uid(), userId: user.id, type: 'deposit', amount: params.amount,
      status: 'pending', method: params.method, address: params.address, createdAt: Date.now(),
    }
    const notif: Notification = {
      id: uid(), userId: user.id, title: 'Deposit submitted',
      body: `Your ${params.method} deposit of $${params.amount.toFixed(2)} is pending confirmation.`,
      read: false, createdAt: Date.now(), kind: 'deposit',
    }
    persist({ transactions: [tx, ...db.transactions], notifications: [notif, ...db.notifications] })
    return { ok: true as const }
  }, [user, db.notifications, db.transactions, persist])

  const requestWithdrawal = useCallback((params: { amount: number; method: string; address: string }) => {
    if (!user) return { ok: false as const, error: 'Not signed in.' }
    if (params.amount > user.balance) return { ok: false as const, error: 'Insufficient balance.' }
    const tx: Transaction = {
      id: uid(), userId: user.id, type: 'withdrawal', amount: params.amount,
      status: 'pending', method: params.method, address: params.address, createdAt: Date.now(),
    }
    const users = db.users.map((u) => (u.id === user.id ? { ...u, balance: u.balance - params.amount } : u))
    const notif: Notification = {
      id: uid(), userId: user.id, title: 'Withdrawal requested',
      body: `Your withdrawal of $${params.amount.toFixed(2)} via ${params.method} is pending review.`,
      read: false, createdAt: Date.now(), kind: 'withdrawal',
    }
    persist({ transactions: [tx, ...db.transactions], users, notifications: [notif, ...db.notifications] })
    return { ok: true as const }
  }, [user, db.notifications, db.transactions, db.users, persist])

  const adminApproveDeposit = useCallback((txId: string, approve: boolean) => {
    const tx = db.transactions.find((t) => t.id === txId)
    if (!tx) return
    let users = db.users
    if (approve) users = db.users.map((u) => (u.id === tx.userId ? { ...u, balance: u.balance + tx.amount } : u))
    const transactions = db.transactions.map((t) =>
      t.id === txId ? { ...t, status: approve ? ('completed' as const) : ('rejected' as const) } : t,
    )
    const notif: Notification = {
      id: uid(), userId: tx.userId, title: approve ? 'Deposit confirmed' : 'Deposit rejected',
      body: approve ? `Your deposit of $${tx.amount.toFixed(2)} has been credited to your account.`
        : `Your deposit of $${tx.amount.toFixed(2)} could not be confirmed and was rejected.`,
      read: false, createdAt: Date.now(), kind: 'deposit',
    }
    persist({ transactions, users, notifications: [notif, ...db.notifications] })
  }, [db.transactions, db.users, db.notifications, persist])

  const adminApproveWithdrawal = useCallback((txId: string, approve: boolean) => {
    const tx = db.transactions.find((t) => t.id === txId)
    if (!tx) return
    let users = db.users
    if (!approve) users = db.users.map((u) => (u.id === tx.userId ? { ...u, balance: u.balance + tx.amount } : u))
    const transactions = db.transactions.map((t) =>
      t.id === txId ? { ...t, status: approve ? ('completed' as const) : ('rejected' as const) } : t,
    )
    const notif: Notification = {
      id: uid(), userId: tx.userId, title: approve ? 'Withdrawal processed' : 'Withdrawal rejected',
      body: approve ? `Your withdrawal of $${tx.amount.toFixed(2)} has been sent to your address.`
        : `Your withdrawal of $${tx.amount.toFixed(2)} was rejected and the funds returned to your balance.`,
      read: false, createdAt: Date.now(), kind: 'withdrawal',
    }
    persist({ transactions, users, notifications: [notif, ...db.notifications] })
  }, [db.transactions, db.users, db.notifications, persist])

  const adminCreditUser = useCallback((userId: string, amount: number, note: string) => {
    const users = db.users.map((u) => (u.id === userId ? { ...u, balance: u.balance + amount } : u))
    const tx: Transaction = {
      id: uid(), userId, type: 'bonus', amount, status: 'completed',
      createdAt: Date.now(), note: note || `Admin credit of $${amount.toFixed(2)}`,
    }
    const notif: Notification = {
      id: uid(), userId, title: 'Account credited',
      body: `Your account has been credited with $${amount.toFixed(2)}.`,
      read: false, createdAt: Date.now(), kind: 'system',
    }
    persist({ users, transactions: [tx, ...db.transactions], notifications: [notif, ...db.notifications] })
  }, [db.users, db.transactions, db.notifications, persist])

  const submitKyc = useCallback((frontData: string, backData: string) => {
    if (!user) return { ok: false as const }
    const kyc = db.kyc.filter((k) => k.userId !== user.id)
    kyc.push({ userId: user.id, frontData, backData, submittedAt: Date.now() })
    const users = db.users.map((u) => (u.id === user.id ? { ...u, kycStatus: 'pending' as const } : u))
    const notif: Notification = {
      id: uid(), userId: user.id, title: 'KYC submitted',
      body: 'Your identity documents are under review. This usually takes 1–2 business days.',
      read: false, createdAt: Date.now(), kind: 'kyc',
    }
    persist({ kyc, users, notifications: [notif, ...db.notifications] })
    return { ok: true as const }
  }, [user, db.kyc, db.users, db.notifications, persist])

  const markNotificationsRead = useCallback((ids: string[]) => {
    if (!user) return
    const notifications = db.notifications.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
    persist({ notifications })
  }, [user, db.notifications, persist])

  return {
    positions: db.positions.filter((p) => (user ? p.userId === user.id : false)),
    transactions: db.transactions.filter((t) => (user ? t.userId === user.id : false)),
    notifications: db.notifications.filter((n) => (user ? n.userId === user.id : false)),
    allTransactions: db.transactions,
    allPositions: db.positions,
    openPosition, closePosition, requestDeposit, requestWithdrawal,
    adminApproveDeposit, adminApproveWithdrawal, adminCreditUser, submitKyc, markNotificationsRead,
  }
}

export function computePnL(pos: Position, mark: number): number {
  const dir = pos.side === 'buy' ? 1 : -1
  const pct = (mark - pos.entryPrice) / pos.entryPrice
  return pos.size * pos.leverage * pct * dir
}
