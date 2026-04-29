import { Upload, ScanSearch, Sparkles, BarChart3, BrainCircuit } from 'lucide-react'

const STAGES = [
  { label: 'Upload',  color: 'hsl(var(--primary))',   icon: Upload       },
  { label: 'Profile', color: 'hsl(var(--secondary))', icon: ScanSearch   },
  { label: 'Clean',   color: 'hsl(var(--primary))',   icon: Sparkles     },
  { label: 'Analyze', color: 'hsl(var(--secondary))', icon: BarChart3    },
  { label: 'Train',   color: 'hsl(142 71% 45%)',      icon: BrainCircuit },
]

export default function PipelineLabels() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center flex-wrap justify-center">
      {STAGES.map(({ label, color, icon: Icon }, i) => (
        <div key={label} className="flex items-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold glass transition-all hover:scale-105 cursor-default"
            style={{ color, borderColor: `color-mix(in srgb, ${color} 35%, transparent)`, background: `color-mix(in srgb, ${color} 10%, transparent)` }}>
            <Icon size={11} />
            <span>{label}</span>
          </div>
          {i < STAGES.length - 1 && (
            <div className="w-5 h-px mx-1" style={{ background: 'hsl(var(--border))' }} />
          )}
        </div>
      ))}
    </div>
  )
}
