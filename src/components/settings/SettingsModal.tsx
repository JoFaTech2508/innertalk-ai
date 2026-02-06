import { X, Trash2, HardDrive, Download, Search, Cpu } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '../../stores/appStore'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { availableModels } = useAppStore()
  const [modelSearch, setModelSearch] = useState('')
  const [showDownload, setShowDownload] = useState(false)

  const suggestedModels = [
    { name: 'gemma2', size: '5.4 GB', description: 'Google Gemma 2' },
    { name: 'llama3.1', size: '4.7 GB', description: 'Meta Llama 3.1' },
    { name: 'deepseek-r1', size: '4.7 GB', description: 'DeepSeek R1' },
    { name: 'qwen2.5', size: '4.4 GB', description: 'Alibaba Qwen 2.5' },
  ].filter(m => !availableModels.includes(m.name) && m.name.toLowerCase().includes(modelSearch.toLowerCase()))

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" style={{ padding: 40 }} onClick={onClose}>
      <div
        className="rounded-2xl w-full shadow-2xl shadow-black/50 overflow-hidden ring-1 ring-white/[0.08] flex flex-col"
        style={{ background: '#141c2d', maxWidth: 560, maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 border-b border-white/[0.06]" style={{ padding: '24px 28px' }}>
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            style={{ width: 36, height: 36 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '28px' }}>

          {/* Downloaded Models Section */}
          <div className="flex items-center" style={{ gap: 10, marginBottom: 20 }}>
            <HardDrive size={16} className="text-slate-500" />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Your Models</h3>
            <span
              className="text-[10px] font-semibold text-slate-500 bg-white/[0.06] rounded-full"
              style={{ padding: '2px 8px' }}
            >
              {availableModels.length}
            </span>
          </div>

          <div className="flex flex-col" style={{ gap: 10, marginBottom: 32 }}>
            {availableModels.map(model => (
              <div
                key={model}
                className="flex items-center justify-between rounded-xl ring-1 ring-white/[0.06]"
                style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center" style={{ gap: 14 }}>
                  <div
                    className="rounded-lg bg-indigo-500/20 flex items-center justify-center"
                    style={{ width: 36, height: 36 }}
                  >
                    <Cpu size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{model}</p>
                    <p className="text-xs text-slate-500" style={{ marginTop: 3 }}>Local model</p>
                  </div>
                </div>
                <button
                  className="flex items-center justify-center rounded-xl text-slate-500 hover:text-red-400 hover:bg-white/[0.06] transition-colors"
                  style={{ width: 36, height: 36 }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Download New Models Section */}
          <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
            <div className="flex items-center" style={{ gap: 10 }}>
              <Download size={16} className="text-slate-500" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Download Models</h3>
            </div>
          </div>

          {/* Search input */}
          <div
            className="flex items-center rounded-xl ring-1 ring-white/[0.08]"
            style={{ background: '#0f1623', padding: '12px 16px', gap: 12, marginBottom: 16 }}
          >
            <Search size={15} className="text-slate-500 shrink-0" />
            <input
              type="text"
              value={modelSearch}
              onChange={e => setModelSearch(e.target.value)}
              placeholder="Search models..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* Suggested models */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            {suggestedModels.map(model => (
              <div
                key={model.name}
                className="flex items-center justify-between rounded-xl ring-1 ring-white/[0.06]"
                style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center" style={{ gap: 14 }}>
                  <div
                    className="rounded-lg bg-emerald-500/15 flex items-center justify-center"
                    style={{ width: 36, height: 36 }}
                  >
                    <Cpu size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{model.name}</p>
                    <p className="text-xs text-slate-500" style={{ marginTop: 3 }}>{model.description} &middot; {model.size}</p>
                  </div>
                </div>
                <button
                  className="flex items-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors text-xs font-semibold"
                  style={{ padding: '8px 14px', gap: 6 }}
                >
                  <Download size={12} />
                  Pull
                </button>
              </div>
            ))}
            {suggestedModels.length === 0 && modelSearch && (
              <div className="text-center" style={{ padding: '24px 0' }}>
                <p className="text-sm text-slate-400">No models found for "{modelSearch}"</p>
                <p className="text-xs text-slate-500" style={{ marginTop: 6 }}>Try a different search term</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
