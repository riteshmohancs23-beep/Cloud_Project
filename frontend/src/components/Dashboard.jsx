import { useState, useEffect, useRef } from 'react'
import { Upload, Database, Cpu, Activity, ChevronRight, LogOut, UploadCloud, Zap, Circle } from 'lucide-react'
import { api } from '../lib/api'
import { cn } from '../lib/cn'
import Pipeline from './Pipeline'

const STATUS_META = {
  UPLOADED: { color: 'hsl(var(--primary))',   bg: 'hsl(var(--primary) / 0.1)',   label: 'Uploaded'  },
  PROFILED: { color: 'hsl(270 60% 65%)',       bg: 'hsl(270 60% 65% / 0.1)',      label: 'Profiled'  },
  CLEANED:  { color: 'hsl(var(--primary))',    bg: 'hsl(var(--primary) / 0.1)',   label: 'Cleaned'   },
  ANALYZED: { color: 'hsl(var(--secondary))',  bg: 'hsl(var(--secondary) / 0.1)', label: 'Analyzed'  },
  TRAINED:  { color: 'hsl(142 71% 45%)',       bg: 'hsl(142 71% 45% / 0.1)',      label: 'Trained'   },
}

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

function StatCard({ icon: Icon, label, value, color }) {
  const ref = useRef()
  useTilt(ref)
  return (
    <div ref={ref} className="tilt-card glass p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-white">{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted))' }}>{label}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.UPLOADED
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ color: m.color, background: m.bg, border: `1px solid color-mix(in srgb, ${m.color} 30%, transparent)` }}>
      {m.label}
    </span>
  )
}

function DatasetCard({ ds, onClick }) {
  return (
    <div onClick={onClick}
      className="glass p-4 flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.01] group"
      style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
        <Database size={16} style={{ color: 'hsl(var(--primary))' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{ds.filename}</p>
        <p className="text-xs mt-0.5 uppercase tracking-wide" style={{ color: 'hsl(var(--muted))' }}>{ds.file_type}</p>
      </div>
      <StatusBadge status={ds.status} />
      <ChevronRight size={15} className="text-slate-600 group-hover:text-slate-300 transition-colors shrink-0" />
    </div>
  )
}

export default function Dashboard({ onLogout }) {
  const [datasets, setDatasets] = useState([])
  const [selected, setSelected] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging]   = useState(false)
  const [error, setError]         = useState('')
  const fileRef = useRef()

  const load = async () => {
    try { const res = await api.listDatasets(); setDatasets(res.datasets) }
    catch (e) { setError(e.message) }
  }

  useEffect(() => { load() }, [])

  const doUpload = async (file) => {
    if (!file) return
    setUploading(true); setError('')
    try { const ds = await api.uploadDataset(file); await load(); setSelected(ds) }
    catch (e) { setError(e.message) }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const onDrop = (e) => { e.preventDefault(); setDragging(false); doUpload(e.dataTransfer.files[0]) }

  const trained = datasets.filter(d => d.status === 'TRAINED').length
  const active  = datasets.filter(d => d.status !== 'TRAINED').length

  if (selected) return <Pipeline dataset={selected} onBack={() => { setSelected(null); load() }} />

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: 'var(--bg-deep)' }}>
      {/* Ambient blobs */}
      <div className="ambient-cyan w-[600px] h-[600px] -top-40 -left-40" />
      <div className="ambient-rose w-[500px] h-[500px] -bottom-40 -right-40" />

      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', boxShadow: '0 0 16px hsl(var(--primary) / 0.35)' }}>
              <Zap size={17} color="#050d1a" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-black tracking-tight">
                <span className="text-white">DataFlow </span>
                <span className="gradient-text">Nexus</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Circle size={6} className="fill-current" style={{ color: 'hsl(142 71% 45%)' }} />
                <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>System Online · Nexus Console</p>
              </div>
            </div>
          </div>
          <button onClick={() => { api.logout(); onLogout() }}
            className="glass flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white transition-all rounded-xl">
            <LogOut size={14} /> Logout
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Database}  label="Total Datasets"    value={datasets.length} color="hsl(var(--primary))"   />
          <StatCard icon={Activity}  label="Active Pipelines"  value={active}          color="hsl(var(--secondary))" />
          <StatCard icon={Cpu}       label="Models Deployed"   value={trained}         color="hsl(142 71% 45%)"      />
          <StatCard icon={Upload}    label="Formats Supported" value="3"               color="hsl(var(--primary))"   />
        </div>

        {/* Upload zone */}
        <div
          onClick={() => fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'glass rounded-2xl p-10 text-center cursor-pointer mb-8 transition-all hover:scale-[1.005]',
            dragging && 'scale-[1.01]'
          )}
          style={{
            borderStyle: 'dashed',
            borderColor: dragging || uploading
              ? 'hsl(var(--primary) / 0.6)'
              : 'hsl(var(--primary) / 0.2)',
            boxShadow: dragging ? '0 0 40px hsl(var(--primary) / 0.12)' : 'none',
          }}>
          <UploadCloud size={36} className="mx-auto mb-3"
            style={{ color: dragging ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }} />
          <p className="text-white font-semibold text-lg">
            {uploading ? 'Uploading…' : dragging ? 'Drop to upload' : 'Upload Dataset'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted))' }}>CSV · XLSX · Parquet — drag or click</p>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.parquet" className="hidden"
            onChange={e => doUpload(e.target.files[0])} />
        </div>

        {error && (
          <div className="glass mb-5 p-3 rounded-xl text-sm"
            style={{ borderColor: 'hsl(var(--secondary) / 0.3)', color: 'hsl(var(--secondary))' }}>
            {error}
          </div>
        )}

        {/* Repository list */}
        {datasets.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Database size={40} className="mx-auto mb-4" style={{ color: 'hsl(var(--border))' }} />
            <p className="text-slate-400 font-medium">No datasets yet</p>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted))' }}>Upload a file above to get started</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
              <p className="text-white font-semibold text-sm font-display">Active Repository</p>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                {datasets.length} datasets
              </span>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {datasets.map(ds => (
                <DatasetCard key={ds.id} ds={ds} onClick={() => setSelected(ds)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
