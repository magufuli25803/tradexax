import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useToast } from '../components/Toast'
import { Logo } from '../components/Logo'
import { QrCode } from '../components/QrCode'
import { ArrowRight, ShieldCheck, KeyRound, Copy } from 'lucide-react'

export function TwoFactorSetupPage() {
  const { user, updateUser } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const secret = user?.twoFactorSecret || 'VX' + (user?.id.slice(0, 8).toUpperCase() || 'DEMO1234')
  const otpauth = `otpauth://totp/VaultEx:${user?.email || 'user'}?secret=${secret}&issuer=VaultEx`
  const [code, setCode] = useState('')
  const [enabled, setEnabled] = useState(user?.twoFactorEnabled ?? false)

  function enable() {
    if (code.length < 6) {
      push('error', 'Enter the 6-digit code from your authenticator app.')
      return
    }
    updateUser({ twoFactorEnabled: true, twoFactorSecret: secret })
    setEnabled(true)
    push('success', 'Two-factor authentication is now active.')
  }

  function disable() {
    updateUser({ twoFactorEnabled: false })
    setEnabled(false)
    push('info', 'Two-factor authentication disabled.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Link to="/"><Logo size="lg" /></Link>
        </div>
        <div className="card p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Two-factor authentication</h1>
              <p className="text-sm text-slate-400">Add an extra layer of security to your account.</p>
            </div>
          </div>

          {enabled ? (
            <div className="mt-6 rounded-xl border border-bull/30 bg-bull/5 p-6 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-bull" />
              <p className="mt-3 font-semibold text-white">2FA is active</p>
              <p className="mt-1 text-sm text-slate-400">Your account is protected with an authenticator app.</p>
              <button onClick={disable} className="btn-ghost mt-5">Disable 2FA</button>
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-col items-center gap-5 rounded-xl border border-ink-600 bg-ink-900 p-6 sm:flex-row">
                <div className="rounded-xl bg-white p-2">
                  <QrCode value={otpauth} size={140} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">1. Scan this QR code</p>
                  <p className="mt-1 text-xs text-slate-400">Use Google Authenticator, Authy, or any TOTP app.</p>
                  <p className="mt-4 text-sm font-medium text-white">2. Or enter this key manually</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <code className="flex-1 truncate rounded-lg bg-ink-800 px-3 py-2 font-mono text-xs text-gold-300">{secret}</code>
                    <button onClick={() => { navigator.clipboard?.writeText(secret); push('info', 'Secret copied to clipboard.') }} className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-slate-400 hover:text-white">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <label className="label">3. Enter the 6-digit code from your app</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input className="input pl-10 font-mono tracking-[0.3em]" placeholder="000000" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <button onClick={enable} className="btn-gold">Enable 2FA <ArrowRight className="h-4 w-4" /></button>
                </div>
                <button onClick={() => setCode('123456')} className="mt-2 text-xs text-ocean-400 hover:text-ocean-300">Autofill demo code</button>
              </div>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-slate-400">
          <Link to="/dashboard" className="font-semibold text-slate-300 hover:text-white">Back to dashboard</Link>
        </p>
      </div>
    </div>
  )
}
