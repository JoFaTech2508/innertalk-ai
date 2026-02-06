import { X, Trash2, HardDrive, Download, Search, Cpu, Zap, MemoryStick } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '../../stores/appStore'

interface SettingsModalProps {
  onClose: () => void
}

interface ModelInfo {
  name: string
  params: string
  size: string
  description: string
  category: 'small' | 'medium' | 'large'
  maxRam: number // minimum RAM in GB to run comfortably
}

const MODEL_CATALOG: ModelInfo[] = [
  // Small (1-4B)
  { name: 'gemma2:2b', params: '2B', size: '1.6 GB', description: 'Google Gemma 2', category: 'small', maxRam: 8 },
  { name: 'llama3.2:3b', params: '3B', size: '2.0 GB', description: 'Meta Llama 3.2', category: 'small', maxRam: 8 },
  { name: 'phi3:mini', params: '3.8B', size: '2.3 GB', description: 'Microsoft Phi-3 Mini', category: 'small', maxRam: 8 },
  // Medium (7-10B)
  { name: 'mistral', params: '7B', size: '4.1 GB', description: 'Mistral 7B', category: 'medium', maxRam: 16 },
  { name: 'llama3.1:8b', params: '8B', size: '4.7 GB', description: 'Meta Llama 3.1', category: 'medium', maxRam: 16 },
  { name: 'gemma2:9b', params: '9B', size: '5.4 GB', description: 'Google Gemma 2', category: 'medium', maxRam: 16 },
  { name: 'qwen2.5:7b', params: '7B', size: '4.4 GB', description: 'Alibaba Qwen 2.5', category: 'medium', maxRam: 16 },
  { name: 'deepseek-r1:8b', params: '8B', size: '4.9 GB', description: 'DeepSeek R1', category: 'medium', maxRam: 16 },
  // Large (14B+)
  { name: 'qwen2.5:14b', params: '14B', size: '9.0 GB', description: 'Alibaba Qwen 2.5', category: 'large', maxRam: 32 },
  { name: 'deepseek-r1:14b', params: '14B', size: '9.0 GB', description: 'DeepSeek R1', category: 'large', maxRam: 32 },
  { name: 'llama3.1:70b', params: '70B', size: '40 GB', description: 'Meta Llama 3.1', category: 'large', maxRam: 64 },
]

const CATEGORY_LABELS = {
  small: 'Small (1-4B)',
  medium: 'Medium (7-10B)',
  large: 'Large (14B+)',
}

// TODO: Replace with Tauri system info API
const SYSTEM_RAM_GB = 16

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { availableModels } = useAppStore()
  const [modelSearch, setModelSearch] = useState('')

  const filteredModels = MODEL_CATALOG
    .filter(m => !availableModels.includes(m.name))
    .filter(m =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.description.toLowerCase().includes(modelSearch.toLowerCase())
    )

  const groupedModels = (['small', 'medium', 'large'] as const).map(cat => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    models: filteredModels.filter(m => m.category === cat),
  })).filter(g => g.models.length > 0)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" style={{ padding: 40 }} onClick={onClose}>
      <div
        className="rounded-2xl w-full shadow-2xl shadow-black/50 overflow-hidden ring-1 ring-white/[0.08] flex flex-col"
        style={{ background: '#141c2d', maxWidth: 580, maxHeight: '85vh' }}
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

          {/* System info bar */}
          <div
            className="flex items-center rounded-xl ring-1 ring-white/[0.06]"
            style={{ padding: '14px 18px', gap: 10, marginBottom: 28, background: 'rgba(255,255,255,0.02)' }}
          >
            <MemoryStick size={15} className="text-slate-500" />
            <span className="text-xs text-slate-400">System RAM</span>
            <span className="text-xs font-semibold text-white">{SYSTEM_RAM_GB} GB</span>
            <span className="text-[10px] text-slate-500">&middot;</span>
            <span className="text-xs text-slate-500">Models up to ~{SYSTEM_RAM_GB <= 8 ? '4B' : SYSTEM_RAM_GB <= 16 ? '10B' : SYSTEM_RAM_GB <= 32 ? '20B' : '70B'} recommended</span>
          </div>

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
            {availableModels.map(model => {
              const info = MODEL_CATALOG.find(m => m.name === model)
              return (
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
                      <div className="flex items-center" style={{ gap: 6, marginTop: 3 }}>
                        {info && <span className="text-xs text-slate-500">{info.params} params</span>}
                        {info && <span className="text-[10px] text-slate-600">&middot;</span>}
                        <span className="text-xs text-slate-500">{info?.size ?? 'Local model'}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="flex items-center justify-center rounded-xl text-slate-500 hover:text-red-400 hover:bg-white/[0.06] transition-colors"
                    style={{ width: 36, height: 36 }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Download New Models Section */}
          <div className="flex items-center" style={{ gap: 10, marginBottom: 20 }}>
            <Download size={16} className="text-slate-500" />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Download Models</h3>
          </div>

          {/* Search input */}
          <div
            className="flex items-center rounded-xl ring-1 ring-white/[0.08]"
            style={{ background: '#0f1623', padding: '12px 16px', gap: 12, marginBottom: 20 }}
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

          {/* Grouped model list */}
          <div className="flex flex-col" style={{ gap: 24 }}>
            {groupedModels.map(group => (
              <div key={group.category}>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest" style={{ marginBottom: 10 }}>
                  {group.label}
                </p>
                <div className="flex flex-col" style={{ gap: 8 }}>
                  {group.models.map(model => {
                    const canRun = SYSTEM_RAM_GB >= model.maxRam
                    const isRecommended = canRun && model.maxRam <= SYSTEM_RAM_GB
                    return (
                      <div
                        key={model.name}
                        className={`flex items-center justify-between rounded-xl ring-1 ring-white/[0.06] ${
                          !canRun ? 'opacity-40' : ''
                        }`}
                        style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.02)' }}
                      >
                        <div className="flex items-center" style={{ gap: 14 }}>
                          <div
                            className={`rounded-lg flex items-center justify-center ${
                              isRecommended ? 'bg-emerald-500/15' : 'bg-white/[0.04]'
                            }`}
                            style={{ width: 36, height: 36 }}
                          >
                            <Cpu size={16} className={isRecommended ? 'text-emerald-400' : 'text-slate-500'} />
                          </div>
                          <div>
                            <div className="flex items-center" style={{ gap: 8 }}>
                              <p className="text-sm font-medium text-white">{model.name}</p>
                              {isRecommended && (
                                <span
                                  className="flex items-center text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded-full"
                                  style={{ padding: '1px 7px', gap: 3 }}
                                >
                                  <Zap size={8} />
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500" style={{ marginTop: 3 }}>
                              {model.description} &middot; {model.params} &middot; {model.size}
                            </p>
                          </div>
                        </div>
                        <button
                          className={`flex items-center rounded-lg transition-colors text-xs font-semibold shrink-0 ${
                            canRun
                              ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                              : 'bg-white/[0.04] text-slate-500 cursor-not-allowed'
                          }`}
                          style={{ padding: '8px 14px', gap: 6 }}
                          disabled={!canRun}
                        >
                          <Download size={12} />
                          Pull
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {groupedModels.length === 0 && modelSearch && (
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
