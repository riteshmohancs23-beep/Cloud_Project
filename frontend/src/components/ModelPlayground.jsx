import { useEffect, useRef, useState, useCallback } from 'react'
import { ArrowLeft, Cpu, Target, Zap } from 'lucide-react'
import { api } from '../lib/api'
import { cn } from '../lib/cn'
import { buildRadarChart } from '../lib/charts3d'

const METRIC_COLOR = {
  accuracy:  'hsl(142 71% 45%)',
  precision: 'hsl(var(--primary))',
  recall:    'hsl(var(--secondary))',
  f1:        'hsl(var(--primary))',
  mae:       'hsl(var(--secondary))',
  mse:       'hsl(var(--secondary))',
  r2:        'hsl(142 71% 45%)',
}

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target == null) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setVal(target * p)
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return val
}

// ── Tilt hook ─────────────────────────────────────────────────────────────────
function useTilt(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--rx', `${-(e.clientY - r.top  - r.height / 2) / r.height * 12}deg`)
      el.style.setProperty('--ry', `${ (e.clientX - r.left - r.width  / 2) / r.width  * 12}deg`)
    }
    const onLeave = () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg') }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave) }
  }, [])
}

// ── Metric card with count-up + tilt ─────────────────────────────────────────
function MetricCard({ label, value }) {
  const ref = useRef()
  useTilt(ref)
  const raw = value != null ? Number(value) : null
  const animated = useCountUp(raw)

  if (raw == null) return null

  const isRaw = label === 'mae' || label === 'mse'
  const isR2  = label === 'r2'
  const display = isRaw
    ? animated.toFixed(4)
    : isR2
      ? animated.toFixed(3)
      : `${(animated * 100).toFixed(1)}%`

  return (
    <div ref={ref} className="tilt-card glass p-5 text-center">
      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--muted))' }}>{label}</p>
      <p className="text-2xl font-display font-bold" style={{ color: METRIC_COLOR[label] || 'white' }}>{display}</p>
    </div>
  )
}

// ── Radar canvas — deferred init via ResizeObserver ───────────────────────────
function RadarCanvas({ metrics }) {
  const wrapRef = useRef()
  const canvasRef = useRef()
  const cleanupRef = useRef()

  const init = useCallback(() => {
    if (!canvasRef.current || !metrics) return
    const w = canvasRef.current.offsetWidth
    const h = canvasRef.current.offsetHeight
    if (w < 10 || h < 10) return                 // not laid out yet
    if (cleanupRef.current) return               // already initialised
    const fn = buildRadarChart(canvasRef.current, metrics)
    if (fn) cleanupRef.current = fn
  }, [metrics])

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(init)
    ro.observe(wrapRef.current)
    init()                                        // try immediately too
    return () => { ro.disconnect(); cleanupRef.current?.() }
  }, [init])

  const validMetrics = metrics && Object.values(metrics).some(v => v != null)
  if (!validMetrics) return null

  return (
    <div ref={wrapRef} className="glass overflow-hidden" style={{ height: 260 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ModelPlayground({ dataset, onBack }) {
  const [modelInfo, setModelInfo]     = useState(null)
  const [inputs, setInputs]           = useState({})
  const [prediction, setPrediction]   = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [columns, setColumns]         = useState([])
  const [sampleData, setSampleData]   = useState([])

  useEffect(() => {
    Promise.all([
      api.getModelInfo(dataset.id), 
      api.getAnalytics(dataset.id),
      api.getSampleData(dataset.id)
    ])
      .then(([info, analytics, samples]) => {
        setModelInfo(info)
        setSampleData(samples)

        // Use selected_features if provided by backend, otherwise fallback to old logic
        let cols = info.selected_features

        if (!cols || !cols.length) {
          const nd  = Object.keys(analytics.cleaned_stats?.numeric_distributions || {})
          const vc  = Object.keys(analytics.value_counts || {})
          cols  = [...nd, ...vc].filter(c => c !== info.target_column)

          // Fallback: raw column_details
          if (!cols.length) {
            cols = Object.keys(analytics.raw_stats?.column_details || {})
                         .filter(c => c !== info.target_column)
          }
        }

        setColumns(cols)
        setInputs(Object.fromEntries(cols.map(c => [c, ''])))
      })
      .catch(e => setError(e.message))
  }, [dataset.id])

  const handlePredict = async () => {
    setError(''); setLoading(true); setPrediction(null)
    try {
      const r = await api.predict(dataset.id, inputs)
      setPrediction(r.prediction)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const metrics   = modelInfo?.metrics || {}
  const allFilled = columns.length > 0 && columns.every(c => inputs[c] !== '')

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: 'var(--bg-deep)' }}>
      <div className="ambient-cyan w-[500px] h-[500px] -top-40 -right-40" />
      <div className="ambient-rose w-[400px] h-[400px] -bottom-40 -left-40" />

      <div className="max-w-4xl mx-auto relative">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack}
            className="glass flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-white transition-all rounded-xl">
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h2 className="font-display text-xl font-bold text-white">Model Playground</h2>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted))' }}>{dataset.filename}</p>
          </div>
        </div>

        {error && (
          <p className="text-sm mb-4 p-3 rounded-xl"
            style={{ color: 'hsl(var(--secondary))', background: 'hsl(var(--secondary) / 0.08)', border: '1px solid hsl(var(--secondary) / 0.2)' }}>
            {error}
          </p>
        )}
        {!modelInfo && !error && (
          <p className="text-sm animate-pulse" style={{ color: 'hsl(var(--muted))' }}>Loading model info…</p>
        )}

        {modelInfo && (
          <>
            {/* Model info card */}
            <div className="glass p-5 mb-6">
              <div className="flex flex-wrap gap-6 text-sm">
                {[
                  { icon: Cpu,    label: 'Model',         value: modelInfo.model_type.replace(/_/g, ' '), color: 'hsl(var(--secondary))' },
                  { icon: Zap,    label: 'Task',          value: modelInfo.task_type,                     color: 'hsl(var(--primary))'   },
                  { icon: Target, label: 'Target Column', value: modelInfo.target_column,                 color: 'hsl(142 71% 45%)'      },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon size={14} style={{ color }} />
                    <div>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>{label}</p>
                      <p className="text-white font-medium capitalize">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics + Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(metrics).map(([k, v]) => <MetricCard key={k} label={k} value={v} />)}
              </div>
              <RadarCanvas metrics={metrics} />
            </div>

            {/* Sample Data Panel */}
            {sampleData.length > 0 && (
              <div className="glass p-6 mb-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white text-sm font-semibold">Quick Sample Inputs</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Click a row to load data</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5">
                        {columns.slice(0, 5).map(c => (
                          <th key={c} className="pb-2 font-medium text-slate-500 px-2">{c}</th>
                        ))}
                        <th className="pb-2 font-medium text-slate-500 px-2">...</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleData.map((row, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => setInputs(Object.fromEntries(columns.map(c => [c, row[c] ?? ''])))}
                          className="hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                        >
                          {columns.slice(0, 5).map(c => (
                            <td key={c} className="py-2 px-2 text-slate-300 truncate max-w-[100px]">{String(row[c])}</td>
                          ))}
                          <td className="py-2 px-2 text-slate-500">→</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Feature input form */}
            <div className="glass p-6 mb-6">
              <p className="text-white text-sm font-semibold mb-5">Enter Feature Values</p>

              {columns.length === 0 && (
                <p className="text-sm" style={{ color: 'hsl(var(--muted))' }}>
                  Loading feature columns…
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {columns.map(col => (
                  <div key={col}>
                    <label className="text-xs mb-1.5 block" style={{ color: 'hsl(var(--muted))' }}>{col}</label>
                    <input
                      value={inputs[col] || ''}
                      onChange={e => setInputs(i => ({ ...i, [col]: e.target.value }))}
                      placeholder={`Enter ${col}`}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                      style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))' }}
                      onFocus={e => e.target.style.borderColor = 'hsl(var(--primary) / 0.6)'}
                      onBlur={e  => e.target.style.borderColor = 'hsl(var(--border))'}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handlePredict}
                disabled={loading || !allFilled}
                className={cn(
                  'mt-6 w-full py-3 rounded-xl font-bold text-sm transition-all',
                  allFilled && !loading ? 'hover:opacity-90 hover:scale-[1.01]' : 'opacity-40 cursor-not-allowed'
                )}
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', color: '#050d1a' }}>
                {loading ? 'Predicting…' : 'Run Prediction →'}
              </button>
            </div>

            {/* Prediction result */}
            {prediction !== null && (
              <div className="glass p-8 text-center glow-border animate-fade-up"
                style={{ borderColor: 'hsl(142 71% 45% / 0.5)' }}>
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'hsl(var(--muted))' }}>
                  Predicted {modelInfo.target_column}
                </p>
                <p className="font-display text-5xl font-black" style={{ color: 'hsl(142 71% 45%)' }}>
                  {prediction}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
