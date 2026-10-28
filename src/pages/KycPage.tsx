import { useRef, useState } from 'react'
import { useAuth } from '../store/auth'
import { useStore } from '../store/useStore'
import { useToast } from '../components/Toast'
import { ShieldCheck, Upload, FileCheck2, Clock, CheckCircle2, XCircle, IdCard, AlertCircle } from 'lucide-react'

export function KycPage() {
  const { user } = useAuth()
  const { submitKyc } = useStore()
  const { push } = useToast()
  const [front, setFront] = useState<string | null>(null)
  const [back, setBack] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File | undefined, setter: (v: string) => void) {
    if (!file) return
    if (file.size > 5_000_000) { push('error', 'File too large. Max 5MB.'); return }
    const reader = new FileReader()
    reader.onload = () => setter(reader.result as string)
    reader.readAsDataURL(file)
  }

  function submit() {
    if (!front || !back) { push('error', 'Upload both the front and back of your ID.'); return }
    setSubmitting(true)
    setTimeout(() => {
      const res = submitKyc(front, back)
      setSubmitting(false)
      if (res.ok) push('success', 'KYC documents submitted. Review takes 1–2 business days.')
    }, 1200)
  }

  const status = user?.kycStatus ?? 'unverified'

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={`rounded-2xl border p-6 ${status === 'approved' ? 'border-bull/30 bg-bull/5' : status === 'pending' ? 'border-gold-500/30 bg-gold-500/5' : status === 'rejected' ? 'border-bear/30 bg-bear/5' : 'border-ink-600 bg-ink-850'}`}>
        <div className="flex items-center gap-4">
          {status === 'approved' ? <CheckCircle2 className="h-10 w-10 text-bull" /> : status === 'pending' ? <Clock className="h-10 w-10 text-gold-400" /> : status === 'rejected' ? <XCircle className="h-10 w-10 text-bear" /> : <ShieldCheck className="h-10 w-10 text-ocean-400" />}
          <div>
            <h3 className="text-lg font-bold text-white">
              {status === 'approved' ? 'Identity verified' : status === 'pending' ? 'Verification in progress' : status === 'rejected' ? 'Verification rejected' : 'Verify your identity'}
            </h3>
            <p className="text-sm text-slate-400">
              {status === 'approved' ? 'Your account is fully verified. You have access to all features.' : status === 'pending' ? 'Your documents are under review. This usually takes 1–2 business days.' : status === 'rejected' ? 'Your documents could not be verified. Please re-upload clear photos.' : 'Upload a government-issued ID to unlock deposits, withdrawals, and higher limits.'}
            </p>
          </div>
        </div>
      </div>

      {status !== 'approved' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="flex items-center gap-2 font-bold text-white"><IdCard className="h-5 w-5 text-gold-400" /> ID Front</h3>
            <p className="mt-1 text-sm text-slate-400">Upload a clear photo of the front of your ID.</p>
            <input ref={frontRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0], setFront)} />
            <div onClick={() => frontRef.current?.click()} className="mt-4 flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-ink-600 bg-ink-900 p-6 transition hover:border-gold-500/50">
              {front ? (
                <div className="w-full"><img src={front} alt="ID front" className="mx-auto max-h-48 rounded-lg" /><p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-bull"><FileCheck2 className="h-4 w-4" /> Uploaded — click to replace</p></div>
              ) : (
                <><Upload className="h-8 w-8 text-slate-500" /><p className="text-sm text-slate-500">Click to upload front of ID</p><p className="text-xs text-slate-600">JPG, PNG · Max 5MB</p></>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="flex items-center gap-2 font-bold text-white"><IdCard className="h-5 w-5 text-gold-400" /> ID Back</h3>
            <p className="mt-1 text-sm text-slate-400">Upload a clear photo of the back of your ID.</p>
            <input ref={backRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0], setBack)} />
            <div onClick={() => backRef.current?.click()} className="mt-4 flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-ink-600 bg-ink-900 p-6 transition hover:border-gold-500/50">
              {back ? (
                <div className="w-full"><img src={back} alt="ID back" className="mx-auto max-h-48 rounded-lg" /><p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-bull"><FileCheck2 className="h-4 w-4" /> Uploaded — click to replace</p></div>
              ) : (
                <><Upload className="h-8 w-8 text-slate-500" /><p className="text-sm text-slate-500">Click to upload back of ID</p><p className="text-xs text-slate-600">JPG, PNG · Max 5MB</p></>
              )}
            </div>
          </div>
        </div>
      )}

      {status !== 'approved' && (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-ocean-500/20 bg-ocean-500/5 p-4 text-sm text-slate-400">
            <AlertCircle className="h-5 w-5 shrink-0 text-ocean-400" />
            <p>Make sure your photos are well-lit, in focus, and show all four corners of the document. Glare and blur are the most common reasons for rejection.</p>
          </div>
          <button onClick={submit} disabled={submitting || (!front || !back)} className="btn-gold py-3 px-8">
            {submitting ? 'Submitting…' : 'Submit for verification'}
          </button>
        </>
      )}
    </div>
  )
}
