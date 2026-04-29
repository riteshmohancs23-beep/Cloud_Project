import { useState } from 'react'
import { ArrowLeft, CheckCircle2, Circle, Loader2, BarChart3, FlaskConical, GitBranch, Sparkles, Send } from 'lucide-react'
import { api } from '../lib/api'
import { cn } from '../lib/cn'
import AnalyticsDashboard from './AnalyticsDashboard'
import ModelPlayground from './ModelPlayground'

const STEPS = ['UPLOADED', 'PROFILED', 'CLEANED', 'ANALYZED', 'TRAINED']
const STEP_META = [
  { key: 'profile', label: 'Profile Dataset',  desc: 'Row/col counts, missing values, per-column stats',    status: 'UPLOADED',  next: 'PROFILED', color: 'hsl(var(--primary))'   },
  { key: 'clean',   label: 'Clean Dataset',    desc: 'Median fill, dedup, IsolationForest outlier removal', status: 'PROFILED',  next: 'CLEANED',  color: 'hsl(var(--secondary))' },
  { key: 'analyze', label: 'Analyze Dataset',  desc: 'Correlation matrix, skewness, numeric summaries',     status: 'CLEANED',   next: 'ANALYZED', color: 'hsl(var(--primary))'   },
  { key: 'train',   label: 'Train ML Model',   desc: 'Select target, task type, and model algorithm',       status: 'ANALYZED',  next: 'TRAINED',  color: 'hsl(142 71% 45%)'      },
]

const TABS = [
  { id: 'pipeline',   label: 'Pipeline',   icon: GitBranch  },
  { id: 'analytics',  label: 'Analytics',  icon: BarChart3  },
  { id: 'playground', label: 'Playground', icon: FlaskConical },
]

function Progress({ stepIdx }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-3 h-3 rounded-full border-2 transition-all',
              i <= stepIdx ? 'border-transparent' : 'border-slate-600 bg-transparent'
            )} style={i <= stepIdx ? { background: STEP_META[Math.min(i, 3)]?.color || '#fff', borderColor: 'transparent' } : {}} />
            <p className="text-xs mt-1.5 whitespace-nowrap"
              style={{ color: i <= stepIdx ? STEP_META[Math.min(i, 3)]?.color : 'hsl(220 15% 35%)' }}>
              {s}
            </p>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-px mx-1 mb-5 transition-all"
              style={{ background: i < stepIdx ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))' }} />
          )}
        </div>
      ))}
    </div>
  )
}

function StepCard({ meta, done, active, loading, onRun, children, extra }) {
  return (
    <div className={cn(
      'glass rounded-xl p-5 transition-all',
      done  && 'border-opacity-60',
      active && 'glow-border'
    )} style={{ borderColor: done ? `${meta.color}40` : active ? `${meta.color}60` : 'hsl(var(--border))' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {done
            ? <CheckCircle2 size={18} style={{ color: meta.color }} />
            : loading
              ? <Loader2 size={18} className="animate-spin" style={{ color: meta.color }} />
              : <Circle size={18} style={{ color: active ? meta.color : 'hsl(220 15% 35%)' }} />
          }
          <div>
            <p className="text-white font-semibold text-sm">{meta.label}</p>
            <p className="text-slate-500 text-xs mt-0.5">{meta.desc}</p>
          </div>
        </div>
        {done ? (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ color: meta.color, background: `color-mix(in srgb, ${meta.color} 12%, transparent)` }}>
            ✓ Done
          </span>
        ) : (
          <button onClick={onRun} disabled={!active || loading}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: active ? meta.color : 'hsl(var(--border))', color: active ? '#0B0A14' : 'hsl(220 15% 35%)' }}>
            {loading ? 'Running…' : 'Run Stage'}
          </button>
        )}
      </div>
      {extra}
      {children}
    </div>
  )
}

function ResultCard({ data }) {
  if (!data) return null
  return (
    <div className="mt-4 rounded-xl border border-white/5 overflow-hidden">
      <pre className="p-4 text-xs text-slate-400 overflow-auto max-h-52"
        style={{ background: 'hsl(260 18% 8%)' }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

function AiSidebar({ dataset, results }) {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I can summarize your pipeline results. Ask me anything about your dataset.' }
  ])
  const [thinking, setThinking] = useState(false)

  const send = async () => {
    if (!prompt.trim()) return
    const userMsg = prompt.trim()
    setPrompt('')
    setMessages(m => [...m, { role: 'user', text: userMsg }])
    setThinking(true)

    // Simulate LLM insight generation from available results
    await new Promise(r => setTimeout(r, 900))
    const context = Object.keys(results).length
      ? `Based on your pipeline: ${Object.keys(results).join(', ')} completed.`
      : 'No pipeline stages completed yet.'
    setMessages(m => [...m, {
      role: 'assistant',
      text: `${context} ${userMsg.toLowerCase().includes('clean') ? 'The cleaning stage removes nulls via median imputation and drops outliers using IsolationForest at 5% contamination.' : userMsg.toLowerCase().includes('model') ? 'The ML engine LabelEncodes all categorical columns, splits 80/20, and computes accuracy/F1 for classification or MAE/R² for regression.' : 'I can help explain profiling stats, cleaning decisions, analytics results, or model metrics. What would you like to know?'}`
    }])
    setThinking(false)
  }

  return (
    <div className="glass rounded-2xl flex flex-col h-full min-h-[420px]">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
          <Sparkles size={14} style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <p className="text-white font-semibold text-sm">AI Assistant</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={cn('text-xs leading-relaxed px-3 py-2 rounded-xl max-w-[90%]',
            m.role === 'user'
              ? 'self-end text-white'
              : 'self-start text-slate-300'
          )} style={{
            background: m.role === 'user'
              ? 'hsl(var(--primary) / 0.2)'
              : 'hsl(var(--surface) / 0.8)',
            border: `1px solid ${m.role === 'user' ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border))'}`,
          }}>
            {m.text}
          </div>
        ))}
        {thinking && (
          <div className="self-start flex gap-1 px-3 py-2">
            {[0,1,2].map(i => (
              <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ background: 'hsl(var(--primary))', animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/5 flex gap-2">
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about your pipeline…"
          className="flex-1 px-3 py-2 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
          style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))' }}
        />
        <button onClick={send} disabled={!prompt.trim() || thinking}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-30"
          style={{ background: 'hsl(var(--primary))' }}>
          <Send size={13} color="#fff" />
        </button>
      </div>
    </div>
  )
}

export default function Pipeline({ dataset, onBack }) {
  const [ds, setDs]         = useState(dataset)
  const [loading, setLoading] = useState('')
  const [error, setError]   = useState('')
  const [results, setResults] = useState({})
  const [tab, setTab]       = useState('pipeline')
  const [targetCol, setTargetCol] = useState('')
  const [taskType, setTaskType]   = useState('classification')
  const [modelType, setModelType] = useState('random_forest')
  const [usePca, setUsePca]       = useState(false)
  const [nComponents, setNComponents] = useState(2)

  const stepIdx = STEPS.indexOf(ds.status)

  const run = async (key) => {
    setError(''); setLoading(key)
    try {
      let result
      if (key === 'profile') result = await api.profile(ds.id)
      if (key === 'clean')   result = await api.clean(ds.id)
      if (key === 'analyze') result = await api.analyze(ds.id)
      if (key === 'train')   result = await api.train(ds.id, targetCol, taskType, modelType, usePca, nComponents)
      setResults(r => ({ ...r, [key]: result }))
      setDs(await api.getDataset(ds.id))
    } catch (e) { setError(e.message) }
    finally { setLoading('') }
  }

  // Render sub-views for Analytics / Playground tabs
  if (tab === 'analytics')  return <AnalyticsDashboard dataset={ds} onBack={() => setTab('pipeline')} />
  if (tab === 'playground') return <ModelPlayground    dataset={ds} onBack={() => setTab('pipeline')} />

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: 'var(--bg-deep)' }}>
      {/* Ambient blobs */}
      <div className="ambient-cyan w-[500px] h-[500px] -top-40 -right-40" />
      <div className="ambient-rose w-[400px] h-[400px] -bottom-40 -left-40" />
      <div className="max-w-6xl mx-auto relative">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack}
            className="glass flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-white transition-all rounded-xl">
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h2 className="font-display text-xl font-bold text-white">{ds.filename}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted))' }}>Pipeline Orchestrator</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-xl w-fit glass">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              disabled={id !== 'pipeline' && ds.status !== 'TRAINED'}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                tab === id ? 'text-white' : 'text-slate-500 hover:text-slate-300',
                id !== 'pipeline' && ds.status !== 'TRAINED' && 'opacity-40 cursor-not-allowed'
              )}
              style={tab === id ? { background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary) / 0.3)' } : {}}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main pipeline column */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Progress stepIdx={stepIdx} />

            {error && (
              <p className="text-red-400 text-sm p-3 rounded-xl border border-red-800/50 bg-red-900/10">{error}</p>
            )}

            {STEP_META.map((meta, i) => {
              const done   = stepIdx > i
              const active = ds.status === meta.status
              return (
                <StepCard key={meta.key} meta={meta} done={done} active={active}
                  loading={loading === meta.key} onRun={() => run(meta.key)}
                  extra={meta.key === 'train' && active && !results.train ? (
                    <div className="flex flex-col gap-3 mt-4">
                      <input placeholder="Target column name" value={targetCol}
                        onChange={e => setTargetCol(e.target.value)}
                        className="px-3 py-2 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none"
                        style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))' }} />
                      <div className="flex gap-3">
                        {[
                          { val: taskType,  set: setTaskType,  opts: [['classification','Classification'],['regression','Regression']] },
                          { val: modelType, set: setModelType, opts: [['random_forest','Random Forest'],['logistic_regression','Logistic Regression'],['linear_regression','Linear Regression']] },
                        ].map(({ val, set, opts }, j) => (
                          <select key={j} value={val} onChange={e => set(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
                            style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))' }}>
                            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'hsl(var(--surface) / 0.5)', border: '1px dashed hsl(var(--border))' }}>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={usePca} onChange={e => setUsePca(e.target.checked)} className="rounded border-slate-700 bg-slate-900 text-primary focus:ring-primary/20" />
                          <span className="text-xs text-slate-300 font-medium">Feature Reduction (Main Features)</span>
                        </label>
                        {usePca && (
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500">Components</span>
                            <input 
                              type="number" 
                              min="1" 
                              max="100" 
                              value={nComponents} 
                              onChange={e => setNComponents(parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 rounded-md text-xs text-white text-center focus:outline-none"
                              style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}>
                  <ResultCard data={results[meta.key]} />
                </StepCard>
              )
            })}

            {/* Unlock cards after TRAINED */}
            {ds.status === 'TRAINED' && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                {[
                  { id: 'analytics',  icon: BarChart3,   label: 'Analytics Dashboard', desc: 'Correlations, distributions, cleaning log', color: 'hsl(var(--primary))'   },
                  { id: 'playground', icon: FlaskConical, label: 'Model Playground',    desc: 'Live predictions from your trained model',  color: 'hsl(var(--secondary))' },
                ].map(({ id, icon: Icon, label, desc, color }) => (
                  <button key={id} onClick={() => setTab(id)}
                    className="glass p-5 rounded-xl text-left transition-all hover:scale-[1.02]"
                    style={{ borderColor: `color-mix(in srgb, ${color} 30%, transparent)` }}>
                    <Icon size={20} className="mb-2" style={{ color }} />
                    <p className="text-white font-semibold text-sm">{label}</p>
                    <p className="text-slate-500 text-xs mt-1">{desc}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Assistant sidebar */}
          <div className="lg:col-span-1">
            <AiSidebar dataset={ds} results={results} />
          </div>
        </div>
      </div>
    </div>
  )
}
