export type ID = string

export interface User {
  id: ID
  email: string
  password: string
  fullName: string
  country: string
  createdAt: number
  verified: boolean
  twoFactorEnabled: boolean
  twoFactorSecret?: string
  kycStatus: 'unverified' | 'pending' | 'approved' | 'rejected'
  balance: number
  locked: boolean
  referralCode: string
  referralCount: number
  referralEarnings: number
  isAdmin?: boolean
}

export type OrderSide = 'buy' | 'sell'
export type OrderStatus = 'open' | 'closed'

export interface Position {
  id: ID
  userId: ID
  symbol: string
  side: OrderSide
  size: number
  leverage: number
  entryPrice: number
  markPrice: number
  stopLoss?: number
  takeProfit?: number
  liquidationPrice: number
  openedAt: number
  closedAt?: number
  pnl: number
  status: OrderStatus
}

export type TxType = 'deposit' | 'withdrawal' | 'trade' | 'bonus' | 'referral'
export type TxStatus = 'pending' | 'approved' | 'rejected' | 'completed'

export interface Transaction {
  id: ID
  userId: ID
  type: TxType
  amount: number
  status: TxStatus
  method?: string
  address?: string
  createdAt: number
  note?: string
}

export interface Notification {
  id: ID
  userId: ID
  title: string
  body: string
  read: boolean
  createdAt: number
  kind: 'price' | 'system' | 'deposit' | 'withdrawal' | 'kyc'
}

export interface KycDoc {
  userId: ID
  frontData?: string
  backData?: string
  submittedAt?: number
}

export interface Settings {
  maintenanceMode: boolean
  depositBonusPct: number
  depositBonusMin: number
}

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TickerPrice {
  symbol: string
  name: string
  price: number
  change24h: number
  changePct: number
}
