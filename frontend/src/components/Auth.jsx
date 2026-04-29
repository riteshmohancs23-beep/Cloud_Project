import { useState } from 'react'
import { Github, Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react'
import { api } from '../lib/api'

function SocialBtn({ icon: Icon, label }) {
  return (
    <button type="button"
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all hover:scale-[1.02]"
      style={{ background: 'hsl(var(--surface-2))', border: '1px solid hsl(var(--border))' }}>
      <Icon size={15} />
      {label}
    </button>
  )
}

export default function Auth({ onAuth }) {
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        await api.register(email, password)
        await api.login(email, password)
      } else {
        await api.login(email, password)
      }
      onAuth()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg-deep)' }}>
      {/* Ambient blobs */}
      <div className="ambient-cyan w-[500px] h-[500px] -top-32 -left-32" />
      <div className="ambient-rose w-[400px] h-[400px] -bottom-32 -right-32" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo mark */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', boxShadow: '0 0 20px hsl(var(--primary) / 0.4)' }}>
            <Zap size={18} color="#050d1a" />
          </div>
          <span className="font-display font-black text-xl text-white">DataFlow <span className="gradient-text">Nexus</span></span>
        </div>

        <div className="glass p-8 glow-border" style={{ borderColor: 'hsl(var(--primary) / 0.2)' }}>
          <h2 className="font-display text-2xl font-bold text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-slate-500 text-sm mb-7">
            {mode === 'login' ? 'Sign in to your Nexus Console' : 'Start your data journey'}
          </p>

          {/* Social buttons */}
          <div className="flex gap-3 mb-6">
            <SocialBtn icon={Github} label="GitHub" />
            <SocialBtn icon={Mail}   label="Google" />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
            <span className="text-slate-600 text-xs">or continue with email</span>
            <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)} required
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                style={{ background: 'hsl(var(--surface-2))', border: '1px solid hsl(var(--border))' }}
                onFocus={e => e.target.style.borderColor = 'hsl(var(--primary) / 0.6)'}
                onBlur={e  => e.target.style.borderColor = 'hsl(var(--border))'}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPw ? 'text' : 'password'} placeholder="Password (min 8 chars)"
                value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                style={{ background: 'hsl(var(--surface-2))', border: '1px solid hsl(var(--border))' }}
                onFocus={e => e.target.style.borderColor = 'hsl(var(--primary) / 0.6)'}
                onBlur={e  => e.target.style.borderColor = 'hsl(var(--border))'}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg"
                style={{ color: 'hsl(var(--secondary))', background: 'hsl(var(--secondary) / 0.08)', border: '1px solid hsl(var(--secondary) / 0.2)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', color: '#050d1a' }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <p className="text-slate-500 text-sm mt-5 text-center">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="font-semibold hover:underline transition-colors"
              style={{ color: 'hsl(var(--primary))' }}>
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
