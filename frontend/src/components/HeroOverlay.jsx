import { useEffect, useRef } from 'react'
import { ScanSearch, Sparkles, BarChart3, BrainCircuit, Zap, ShieldCheck, Eye, Rocket, Activity } from 'lucide-react'
import PipelineLabels from './PipelineLabels'
import VortexScene from './VortexScene'
import { cn } from '../lib/cn'

const FEATURES = [
  { icon: ScanSearch,   label: 'Profile',  desc: 'Row/column stats, missing values, type inference',       color: 'hsl(var(--primary))'   },
  { icon: Sparkles,     label: 'Clean',    desc: 'Median imputation, dedup, IsolationForest outliers',     color: 'hsl(var(--secondary))' },
  { icon: BarChart3,    label: 'Analyze',  desc: 'Correlation matrix, skewness, numeric summaries',        color: 'hsl(var(--primary))'   },
  { icon: BrainCircuit, label: 'Train',    desc: 'Logistic/Linear Regression, Random Forest, live predict', color: 'hsl(var(--secondary))' },
]

const STATS = [
  { value: '5-Stage', label: 'Pipeline' },
  { value: '3',       label: 'ML Models' },
  { value: '100%',    label: 'Traceable' },
  { value: 'Live',    label: 'Predictions' },
]

const MISSION_PILLARS = [
  { icon: Eye,         title: 'Vision',    desc: 'See your data clearly — every column, every gap, every pattern.' },
  { icon: Zap,         title: 'Speed',     desc: 'From raw CSV to trained model in under 60 seconds.' },
  { icon: ShieldCheck, title: 'Integrity', desc: 'Every cleaning step is logged. Every decision is traceable.' },
  { icon: Rocket,      title: 'Future',    desc: 'Built for v3 — streaming pipelines, AutoML, and cloud storage.' },
]

function useTilt(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--rx', `${-(e.clientY - r.top  - r.height / 2) / r.height * 10}deg`)
      el.style.setProperty('--ry', `${ (e.clientX - r.left - r.width  / 2) / r.width  * 10}deg`)
    }
    const onLeave = () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg') }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave) }
  }, [])
}

function FeatureCard({ icon: Icon, label, desc, color }) {
  const ref = useRef()
  useTilt(ref)
  return (
    <div ref={ref} className="tilt-card glass p-5 flex flex-col gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 28%, transparent)` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <p className="font-display font-bold text-white text-sm">{label}</p>
      <p className="text-xs leading-relaxed" style={{ color: 'hsl(220 15% 55%)' }}>{desc}</p>
    </div>
  )
}

export function AboutPage({ onBack }) {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      <div className="absolute inset-0 pointer-events-none"><VortexScene /></div>
      {/* Ambient blobs */}
      <div className="ambient-cyan w-[600px] h-[600px] top-0 left-0" />
      <div className="ambient-rose w-[500px] h-[500px] bottom-0 right-0" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        <button onClick={onBack}
          className="absolute top-6 left-6 glass px-4 py-2 text-sm text-slate-400 hover:text-white transition-all rounded-xl">
          ← Back
        </button>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass glow-border mb-8"
          style={{ borderColor: 'hsl(var(--primary) / 0.3)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'hsl(var(--primary))' }} />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'hsl(var(--primary))' }}>
            Our Mission
          </span>
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-black text-center mb-6 leading-tight">
          <span className="text-white">Built for </span>
          <span className="gradient-text">Data Engineers</span>
        </h1>
        <p className="text-center max-w-xl text-slate-400 text-lg mb-16 leading-relaxed">
          DataFlow Nexus turns messy raw files into production-ready ML models — no notebooks, no boilerplate.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl w-full">
          {MISSION_PILLARS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="tilt-card glass p-6 flex flex-col gap-3 animate-fade-up"
              style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.25)' }}>
                <Icon size={18} style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <p className="font-display font-bold text-white">{title}</p>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function HeroOverlay({ onGetStarted, onAbout }) {
  const badgeRef = useRef()

  useEffect(() => {
    let t = 0
    const id = setInterval(() => {
      t += 0.04
      if (badgeRef.current) badgeRef.current.style.transform = `translateY(${Math.sin(t) * 6}px)`
    }, 16)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
      <div className="text-center px-4 pointer-events-auto w-full max-w-5xl mx-auto">

        {/* Floating badge */}
        <div ref={badgeRef} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 glass glow-border"
          style={{ borderColor: 'hsl(var(--secondary) / 0.3)' }}>
          <Activity size={11} style={{ color: 'hsl(var(--secondary))' }} />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'hsl(var(--secondary))' }}>
            v2.0 Live — DataFlow Nexus
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-black mb-5 leading-none tracking-tight">
          <span className="block text-white text-5xl md:text-7xl lg:text-8xl">THE ART OF</span>
          <span className="block gradient-text text-6xl md:text-8xl lg:text-9xl">PURE DATA.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg max-w-md mx-auto mb-10 leading-relaxed text-slate-400">
          Upload raw data. Profile, clean, analyze, and train ML models —
          <span style={{ color: 'hsl(var(--primary))' }}> all in one pipeline.</span>
        </p>

        {/* CTAs */}
        <div className="flex gap-4 justify-center flex-wrap mb-12">
          <button onClick={onGetStarted}
            className="relative px-8 py-3.5 rounded-xl font-bold text-sm overflow-hidden transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', color: '#050d1a' }}>
            Get Started →
          </button>
          <button onClick={onAbout}
            className="glass px-8 py-3.5 rounded-xl font-semibold text-sm text-slate-300 hover:text-white transition-all hover:scale-105">
            About
          </button>
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-8 mb-12">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-display font-black text-2xl md:text-3xl" style={{ color: 'hsl(var(--primary))' }}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-widest">{label}</p>
            </div>
          ))}
        </div>

        {/* 4-column feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          {FEATURES.map(f => <FeatureCard key={f.label} {...f} />)}
        </div>
      </div>

      <PipelineLabels />
    </div>
  )
}
