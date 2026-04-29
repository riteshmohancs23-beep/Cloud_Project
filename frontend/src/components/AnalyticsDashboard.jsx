import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, TrendingUp, Layers, BarChart2, Grid3x3, AlertTriangle, Info } from 'lucide-react'
import { api } from '../lib/api'
import { cn } from '../lib/cn'
import { buildCorrelationTerrain } from '../lib/charts3d'

// ── Primitives ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="glass p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-xs">{label}</p>
        {Icon && <Icon size={14} style={{ color }} />}
      </div>
      <p className="text-2xl font-display font-bold" style={{ color: color || 'white' }}>{value ?? '—'}</p>
      {sub && <p className="text-slate-500 text-xs">{sub}</p>}
    </div>
  )
}

function HBar({ title, data, color = 'hsl(var(--secondary))', formatVal = v => Number(v).toFixed(2) }) {
  if (!data || !Object.keys(data).length) return null
  const entries = Object.entries(data)
  const max = Math.max(...entries.map(([, v]) => Math.abs(v)), 0.001)
  return (
    <div className="glass p-5">
      {title && <p className="text-slate-300 text-sm font-semibold mb-4">{title}</p>}
      <div className="flex flex-col gap-2.5">
        {entries.map(([col, val]) => (
          <div key={col} className="flex items-center gap-3">
            <p className="text-slate-400 text-xs w-32 truncate shrink-0">{col}</p>
            <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.abs(val) / max * 100}%`, background: color }} />
            </div>
            <p className="text-slate-300 text-xs w-16 text-right">{formatVal(val)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CompareBar({ label, rawVal, cleanVal, maxVal, rawColor, cleanColor }) {
  const rawPct   = maxVal ? rawVal  / maxVal * 100 : 0
  const cleanPct = maxVal ? cleanVal / maxVal * 100 : 0
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span className="truncate max-w-[140px]">{label}</span>
        <span>
          <span style={{ color: rawColor }}>{rawVal}</span>
          <span className="text-slate-600 mx-1">→</span>
          <span style={{ color: cleanColor }}>{cleanVal}</span>
        </span>
      </div>
      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
        <div className="absolute h-2.5 rounded-full opacity-40" style={{ width: `${rawPct}%`, background: rawColor }} />
        <div className="absolute h-2.5 rounded-full" style={{ width: `${cleanPct}%`, background: cleanColor }} />
      </div>
    </div>
  )
}

function Histogram({ col, bins, counts, color = 'hsl(var(--secondary))' }) {
  if (!bins?.length) return null
  const max = Math.max(...counts, 1)
  return (
    <div className="glass p-4">
      <p className="text-slate-300 text-xs font-semibold mb-3">{col}</p>
      <div className="flex items-end gap-0.5 h-20">
        {counts.map((c, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="w-full rounded-t-sm" title={`${bins[i]?.toFixed(2)}: ${c}`}
              style={{ height: `${c / max * 100}%`, background: color, opacity: 0.85 }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-slate-600 text-xs mt-1">
        <span>{bins[0]?.toFixed(1)}</span>
        <span>{bins[Math.floor(bins.length / 2)]?.toFixed(1)}</span>
        <span>{bins[bins.length - 1]?.toFixed(1)}</span>
      </div>
    </div>
  )
}

function ValueCountsChart({ col, labels, values }) {
  const max = Math.max(...values, 1)
  return (
    <div className="glass p-4">
      <p className="text-slate-300 text-xs font-semibold mb-3">{col} — top values</p>
      <div className="flex flex-col gap-1.5">
        {labels.map((lbl, i) => (
          <div key={lbl} className="flex items-center gap-2">
            <p className="text-slate-400 text-xs w-28 truncate shrink-0">{lbl}</p>
            <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
              <div className="h-1.5 rounded-full" style={{ width: `${values[i] / max * 100}%`, background: 'hsl(var(--primary))' }} />
            </div>
            <p className="text-slate-400 text-xs w-10 text-right">{values[i]}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CorrelationMatrix({ matrix }) {
  if (!matrix || !Object.keys(matrix).length) return null
  const cols = Object.keys(matrix)
  return (
    <div className="glass p-5 overflow-auto">
      <p className="text-slate-300 text-sm font-semibold mb-4">Correlation Matrix</p>
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-slate-500 w-24" />
            {cols.map(c => <th key={c} className="p-2 text-slate-400 font-medium">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {cols.map(row => (
            <tr key={row}>
              <td className="p-2 text-slate-400 font-medium pr-4">{row}</td>
              {cols.map(col => {
                const val = matrix[row]?.[col] ?? 0
                const abs = Math.abs(val)
                const bg  = val > 0
                  ? `hsl(var(--secondary) / ${abs * 0.75})`
                  : `hsl(38 92% 60% / ${abs * 0.75})`
                return (
                  <td key={col} className="p-2 text-center text-white" style={{ background: bg }}>
                    {Number(val).toFixed(2)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-6 mt-3 text-xs text-slate-500">
        <span><span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: 'hsl(var(--secondary) / 0.75)' }} />Positive</span>
        <span><span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: 'hsl(38 92% 60% / 0.75)' }} />Negative</span>
      </div>
    </div>
  )
}

function ColumnTable({ columns }) {
  if (!columns) return null
  return (
    <div className="glass overflow-auto">
      <table className="text-xs w-full">
        <thead>
          <tr className="text-slate-500 border-b border-white/5">
            {['Column','Type','Missing %','Unique','Mean','Min','Max'].map(h => (
              <th key={h} className="px-4 py-3 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(columns).map(([col, d]) => (
            <tr key={col} className="border-b border-white/5 hover:bg-white/5">
              <td className="px-4 py-2 text-white font-medium">{col}</td>
              <td className="px-4 py-2 text-slate-400">{d.dtype}</td>
              <td className="px-4 py-2 font-semibold" style={{ color: d.missing_pct > 0 ? 'hsl(38 92% 60%)' : 'hsl(142 71% 45%)' }}>
                {d.missing_pct}%
              </td>
              <td className="px-4 py-2 text-slate-400">{d.unique_count}</td>
              <td className="px-4 py-2 text-slate-400">{d.mean  != null ? Number(d.mean).toFixed(2) : '—'}</td>
              <td className="px-4 py-2 text-slate-400">{d.min   != null ? Number(d.min).toFixed(2)  : '—'}</td>
              <td className="px-4 py-2 text-slate-400">{d.max   != null ? Number(d.max).toFixed(2)  : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── 3D Terrain canvas ─────────────────────────────────────────────────────────

function TerrainCanvas({ matrix }) {
  const wrapRef = useRef()
  const canvasRef = useRef()
  const cleanupRef = useRef()

  useEffect(() => {
    if (!matrix || !Object.keys(matrix).length) return
    if (!wrapRef.current) return
    const ro = new ResizeObserver(() => {
      if (cleanupRef.current) return
      const w = canvasRef.current?.offsetWidth
      const h = canvasRef.current?.offsetHeight
      if (!w || !h) return
      const fn = buildCorrelationTerrain(canvasRef.current, matrix)
      if (fn) cleanupRef.current = fn
    })
    ro.observe(wrapRef.current)
    return () => { ro.disconnect(); cleanupRef.current?.() }
  }, [matrix])

  if (!matrix || !Object.keys(matrix).length) return (
    <div className="glass p-8 text-center">
      <Grid3x3 size={32} className="mx-auto mb-3 text-slate-700" />
      <p className="text-slate-400 text-sm">No numeric columns for 3D terrain</p>
    </div>
  )

  return (
    <div ref={wrapRef} className="glass overflow-hidden" style={{ height: 320 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}

// ── Section title ─────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return <p className="text-white font-semibold text-sm mb-4 mt-8 pb-2 border-b border-white/5">{children}</p>
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',     label: 'Overview',          icon: Info       },
  { id: 'missing',      label: 'Missing & Outliers', icon: AlertTriangle },
  { id: 'distributions',label: 'Distributions',     icon: BarChart2  },
  { id: 'correlations', label: 'Correlations',       icon: TrendingUp },
]

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AnalyticsDashboard({ dataset, onBack }) {
  const [data, setData]   = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab]     = useState('overview')

  useEffect(() => {
    api.getAnalytics(dataset.id).then(setData).catch(e => setError(e.message))
  }, [dataset.id])

  const raw     = data?.raw_stats
  const cleaned = data?.cleaned_stats
  const outliers = data?.outlier_details
  const vc      = data?.value_counts || {}
  const a       = data?.analytics

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: 'var(--bg-deep)' }}>
      {/* Ambient blobs */}
      <div className="ambient-cyan w-[600px] h-[600px] -top-40 -right-40" />
      <div className="ambient-rose w-[400px] h-[400px] -bottom-40 -left-40" />

      <div className="max-w-5xl mx-auto relative">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack}
            className="glass flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-white transition-all rounded-xl">
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h2 className="font-display text-xl font-bold text-white">Analytics Dashboard</h2>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted))' }}>{dataset.filename}</p>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4 p-3 rounded-xl border border-red-800/50 bg-red-900/10">{error}</p>}
        {!data && !error && <p className="text-slate-500 text-sm animate-pulse">Loading analytics…</p>}

        {data && (
          <>
            {/* KPI grid */}
            {raw && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <KpiCard label="Total Rows"    value={raw.row_count}          color="hsl(var(--secondary))" icon={Layers}   />
                <KpiCard label="Columns"       value={raw.col_count}          color="hsl(var(--primary))"   icon={Grid3x3}  />
                <KpiCard label="Missing Cells" value={`${raw.missing_cells_pct}%`} color={raw.missing_cells_pct > 5 ? 'hsl(var(--secondary))' : 'hsl(142 71% 45%)'} icon={AlertTriangle} />
                <KpiCard label="Duplicates"    value={raw.duplicate_rows}     color={raw.duplicate_rows > 0 ? 'hsl(var(--secondary))' : 'hsl(142 71% 45%)'} icon={TrendingUp} />
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-8 p-1 rounded-xl w-fit glass">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    tab === id ? '' : 'text-slate-500 hover:text-slate-300'
                  )}
                  style={tab === id ? { background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' } : {}}>
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>

            {/* ── Overview ── */}
            {tab === 'overview' && raw && (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <KpiCard label="Numeric Cols"     value={raw.numeric_cols}     color="hsl(var(--secondary))" />
                  <KpiCard label="Categorical Cols" value={raw.categorical_cols} color="hsl(var(--primary))"   />
                  <KpiCard label="Datetime Cols"    value={raw.datetime_cols}    color="hsl(38 92% 60%)"       />
                </div>
                {cleaned && (
                  <>
                    <SectionTitle>After Cleaning</SectionTitle>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <KpiCard label="Rows Remaining"     value={cleaned.row_count}          color="hsl(142 71% 45%)" sub={`was ${raw.row_count}`} />
                      <KpiCard label="Nulls Filled"       value={cleaned.nulls_filled}       color="hsl(var(--secondary))" />
                      <KpiCard label="Duplicates Removed" value={cleaned.duplicates_removed} color="hsl(38 92% 60%)" />
                      <KpiCard label="Outliers Removed"   value={cleaned.outliers_removed}   color="hsl(var(--primary))" />
                    </div>
                    {cleaned.cleaning_log?.length > 0 && (
                      <div className="glass p-5 mb-6">
                        <p className="text-slate-300 text-sm font-semibold mb-3">Cleaning Log</p>
                        <ul className="flex flex-col gap-1.5">
                          {cleaned.cleaning_log.map((entry, i) => (
                            <li key={i} className="text-slate-400 text-xs flex gap-2">
                              <span style={{ color: 'hsl(var(--secondary))' }}>✓</span>{entry}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                <SectionTitle>Column Details (Raw)</SectionTitle>
                <ColumnTable columns={raw.column_details} />
              </>
            )}

            {/* ── Missing & Outliers ── */}
            {tab === 'missing' && cleaned && (
              <>
                <SectionTitle>Missing Values — Raw vs Cleaned</SectionTitle>
                <div className="glass p-5 mb-6">
                  <div className="flex gap-4 text-xs mb-4">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm opacity-40" style={{ background: 'hsl(38 92% 60%)' }} />Raw</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: 'hsl(142 71% 45%)' }} />Cleaned</span>
                  </div>
                  {Object.entries(cleaned.missing_comparison).map(([col, d]) => (
                    <CompareBar key={col} label={col}
                      rawVal={d.raw_missing} cleanVal={d.clean_missing}
                      maxVal={Math.max(d.raw_missing, 1)}
                      rawColor="hsl(38 92% 60%)" cleanColor="hsl(142 71% 45%)" />
                  ))}
                  {Object.values(cleaned.missing_comparison).every(d => d.raw_missing === 0) && (
                    <p className="text-slate-500 text-xs">No missing values found in raw dataset.</p>
                  )}
                </div>

                <SectionTitle>Outlier Analysis</SectionTitle>
                {outliers && (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <KpiCard label="Total Outliers Removed" value={outliers.total_outliers_removed} color="hsl(var(--primary))"
                        sub="IsolationForest (5% contamination)" />
                      <KpiCard label="Rows After Cleaning" value={cleaned.row_count} color="hsl(142 71% 45%)"
                        sub={`from ${raw?.row_count} raw rows`} />
                    </div>
                    {Object.keys(outliers.per_column_estimate).length > 0
                      ? <HBar title="Estimated Outlier Influence per Column" data={outliers.per_column_estimate} color="hsl(var(--primary))" formatVal={v => `~${v}`} />
                      : <div className="glass p-4"><p className="text-slate-400 text-sm">No numeric columns — outlier detection was skipped.</p></div>
                    }
                  </>
                )}
                <SectionTitle>Missing % per Column</SectionTitle>
                <HBar data={Object.fromEntries(Object.entries(cleaned.missing_comparison).map(([col, d]) => [col, d.raw_missing_pct]))}
                  color="hsl(38 92% 60%)" formatVal={v => `${Number(v).toFixed(1)}%`} />
              </>
            )}

            {/* ── Distributions ── */}
            {tab === 'distributions' && cleaned && (
              <>
                {Object.keys(cleaned.numeric_distributions || {}).length > 0 && (
                  <>
                    <SectionTitle>Numeric Distributions (Cleaned)</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {Object.entries(cleaned.numeric_distributions).map(([col, d]) => (
                        <Histogram key={col} col={col} bins={d.bins} counts={d.counts} />
                      ))}
                    </div>
                  </>
                )}
                {Object.keys(vc).length > 0 && (
                  <>
                    <SectionTitle>Categorical Value Counts (Cleaned)</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(vc).map(([col, d]) => (
                        <ValueCountsChart key={col} col={col} labels={d.labels} values={d.values} />
                      ))}
                    </div>
                  </>
                )}
                {a?.skewness && Object.keys(a.skewness).length > 0 && (
                  <>
                    <SectionTitle>Skewness (Cleaned)</SectionTitle>
                    <HBar data={a.skewness} color="hsl(38 92% 60%)" />
                  </>
                )}
                {!Object.keys(cleaned.numeric_distributions || {}).length && !Object.keys(vc).length && (
                  <p className="text-slate-500 text-sm">No distribution data available.</p>
                )}
              </>
            )}

            {/* ── Correlations ── */}
            {tab === 'correlations' && (
              <>
                <SectionTitle>3D Correlation Terrain</SectionTitle>
                <TerrainCanvas matrix={a?.correlation_matrix} />

                {a?.correlation_matrix && Object.keys(a.correlation_matrix).length > 0 && (
                  <>
                    <SectionTitle>Correlation Matrix Table</SectionTitle>
                    <CorrelationMatrix matrix={a.correlation_matrix} />
                  </>
                )}

                {a?.high_cardinality_cols?.length > 0 && (
                  <div className="mt-4 glass p-4 border-amber-700/40">
                    <p className="text-amber-400 text-sm font-semibold mb-1 flex items-center gap-2">
                      <AlertTriangle size={14} /> High Cardinality Columns
                    </p>
                    <p className="text-slate-400 text-xs">{a.high_cardinality_cols.join(', ')}</p>
                    <p className="text-slate-500 text-xs mt-1">&gt;50 unique values — may not be useful as categorical features.</p>
                  </div>
                )}

                {a?.numeric_summary && Object.keys(a.numeric_summary).length > 0 && (
                  <>
                    <SectionTitle>Numeric Summary (Cleaned)</SectionTitle>
                    <div className="glass overflow-auto">
                      <table className="text-xs w-full">
                        <thead>
                          <tr className="text-slate-500 border-b border-white/5">
                            <th className="px-4 py-3 text-left">Column</th>
                            {['count','mean','std','min','25%','50%','75%','max'].map(h => (
                              <th key={h} className="px-4 py-3 text-right">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(a.numeric_summary).map(([col, stats]) => (
                            <tr key={col} className="border-b border-white/5 hover:bg-white/5">
                              <td className="px-4 py-2 text-white font-medium">{col}</td>
                              {['count','mean','std','min','25%','50%','75%','max'].map(k => (
                                <td key={k} className="px-4 py-2 text-slate-400 text-right">
                                  {stats[k] != null ? Number(stats[k]).toFixed(2) : '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
