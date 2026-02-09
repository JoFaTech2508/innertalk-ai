import { X, Trash2, HardDrive, Download, Search, Cpu, Zap, MemoryStick, Loader2, TriangleAlert, RefreshCw, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import { pullModel, deleteModel, listModels, getStorageInfo, restartOllama, checkOllama } from '../../lib/ollama'

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

export function SettingsModal({ onClose }: SettingsModalProps) {
  const {
    availableModels, setAvailableModels, systemRam, ollamaStatus,
    pullingModel, pullPercent, pullError,
    setPullingModel, setPullPercent, setPullError,
  } = useAppStore()
  const [modelSearch, setModelSearch] = useState('')
  const [deletingModel, setDeletingModel] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showAllModels, setShowAllModels] = useState(false)
  const [storageSize, setStorageSize] = useState(0)
  const [restarting, setRestarting] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const handleRestart = async () => {
    setRestarting(true)
    try {
      await restartOllama()
      // Wait for Ollama to be ready
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500))
        const ok = await checkOllama()
        if (ok) {
          useAppStore.getState().setOllamaStatus('connected')
          const models = await listModels()
          setAvailableModels(models.map(m => m.name))
          break
        }
      }
    } catch (e) {
      console.error('Restart failed:', e)
    } finally {
      setRestarting(false)
    }
  }

  const refreshStorage = async () => {
    try {
      const info = await getStorageInfo()
      setStorageSize(info.sizeBytes)
    } catch { /* ignore */ }
  }

  useEffect(() => { refreshStorage() }, [availableModels])

  const ramGB = systemRam || 16 // fallback to 16 if not detected yet

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const filteredModels = MODEL_CATALOG
    .filter(m => !availableModels.some(a => a.startsWith(m.name.split(':')[0])))
    .filter(m =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.description.toLowerCase().includes(modelSearch.toLowerCase())
    )

  const groupedModels = (['small', 'medium', 'large'] as const).map(cat => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    models: filteredModels.filter(m => m.category === cat),
  })).filter(g => g.models.length > 0)

  const handlePull = async (modelName: string) => {
    if (pullingModel) return
    setPullingModel(modelName)
    setPullPercent(0)
    setPullError(null)

    try {
      await pullModel(
        modelName,
        (_status, completed, total) => {
          if (completed && total && total > 0) {
            setPullPercent(Math.round((completed / total) * 100))
          }
        },
        async () => {
          setPullingModel(null)
          setPullPercent(0)
          try {
            const models = await listModels()
            setAvailableModels(models.map(m => m.name))
          } catch { /* ignore */ }
          refreshStorage()
        },
        (error) => {
          setPullingModel(null)
          setPullPercent(0)
          setPullError(error)
        },
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Download failed. Check your internet connection.'
      setPullingModel(null)
      setPullPercent(0)
      setPullError(msg)
    }
  }

  const handleDelete = async (modelName: string) => {
    setDeletingModel(modelName)
    try {
      await deleteModel(modelName)
      // Refresh model list
      try {
        const models = await listModels()
        setAvailableModels(models.map(m => m.name))
      } catch { /* ignore */ }
    } catch (e) {
      console.error('Delete failed:', e)
    } finally {
      setDeletingModel(null)
    }
  }

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

          {/* System info */}
          <div
            className="rounded-xl ring-1 ring-white/[0.06] flex flex-col"
            style={{ padding: '14px 18px', gap: 10, marginBottom: 28, background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="flex items-center flex-wrap" style={{ gap: 10 }}>
              <MemoryStick size={15} className="text-slate-500" />
              <span className="text-xs text-slate-400">RAM</span>
              <span className="text-xs font-semibold text-white">{ramGB} GB</span>
              <span className="text-[10px] text-slate-500">&middot;</span>
              <span className="text-xs text-slate-500">Up to ~{ramGB <= 8 ? '4B' : ramGB <= 16 ? '10B' : ramGB <= 32 ? '20B' : '70B'} recommended</span>
              <span className="text-[10px] text-slate-500">&middot;</span>
              <span className={`text-xs font-medium ${ollamaStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>
                {restarting ? 'Restarting...' : ollamaStatus === 'connected' ? 'Ollama running' : 'Ollama offline'}
              </span>
            </div>
            {storageSize > 0 && (
              <div className="flex items-center" style={{ gap: 10 }}>
                <HardDrive size={15} className="text-slate-500" />
                <span className="text-xs text-slate-400">Storage used</span>
                <span className="text-xs font-semibold text-white">{formatSize(storageSize)}</span>
              </div>
            )}
          </div>

          {/* Restart Ollama & Clear Data */}
          <div className="flex items-center justify-start" style={{ marginTop: -18, marginBottom: 24, gap: 8 }}>
            <button
              onClick={handleRestart}
              disabled={restarting}
              className="flex items-center rounded-lg bg-red-500/[0.12] text-red-300 hover:bg-red-500/[0.20] hover:text-red-200 transition-colors disabled:opacity-50"
              style={{ gap: 6, padding: '7px 14px', fontSize: 12 }}
            >
              <RefreshCw size={12} className={restarting ? 'animate-spin' : ''} />
              {restarting ? 'Restarting...' : 'Restart Ollama'}
            </button>
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center rounded-lg bg-white/[0.04] text-slate-400 hover:bg-red-500/[0.12] hover:text-red-300 transition-colors"
              style={{ gap: 6, padding: '7px 14px', fontSize: 12 }}
            >
              <Trash2 size={12} />
              Clear App Data
            </button>
          </div>

          {/* Clear data confirmation */}
          {confirmClear && (
            <div
              className="flex items-start rounded-xl ring-1 ring-red-500/20"
              style={{ padding: '14px 16px', gap: 12, marginBottom: 20, background: 'rgba(239,68,68,0.06)' }}
            >
              <AlertCircle size={16} className="text-red-400 shrink-0" style={{ marginTop: 1 }} />
              <div className="flex-1">
                <p className="text-xs text-red-300 font-medium" style={{ marginBottom: 8 }}>
                  This will delete all chats, settings, and context folders. Models will NOT be deleted.
                </p>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <button
                    onClick={async () => {
                      const { invoke } = await import('@tauri-apps/api/core')
                      await invoke('save_store', { key: 'local-ai-chats', value: '{}' }).catch(() => {})
                      await invoke('save_store', { key: 'local-ai-settings', value: '{}' }).catch(() => {})
                      window.location.reload()
                    }}
                    className="flex items-center rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold hover:bg-red-500/30 transition-colors"
                    style={{ padding: '6px 12px', gap: 4 }}
                  >
                    <Trash2 size={11} />
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                    style={{ padding: '6px 8px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error banner */}
          {pullError && (
            <div
              className="flex items-center rounded-xl ring-1 ring-red-500/20"
              style={{ padding: '12px 16px', gap: 12, marginBottom: 20, background: 'rgba(239,68,68,0.06)' }}
            >
              <TriangleAlert size={15} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-300 flex-1">{pullError}</p>
              <button
                onClick={() => setPullError(null)}
                className="text-red-400/60 hover:text-red-300 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          )}

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
            {availableModels.length === 0 ? (
              <div
                className="flex items-center justify-center rounded-xl ring-1 ring-white/[0.06]"
                style={{ padding: '24px 18px', background: 'rgba(255,255,255,0.02)' }}
              >
                <p className="text-sm text-slate-500">
                  {ollamaStatus === 'connected' ? 'No models downloaded yet. Pull one below.' : 'Start Ollama to manage models.'}
                </p>
              </div>
            ) : (
              availableModels.map(model => {
                const info = MODEL_CATALOG.find(m => m.name === model || model.startsWith(m.name.split(':')[0]))
                const isDeleting = deletingModel === model
                return (
                  <div
                    key={model}
                    className={`flex items-center justify-between rounded-xl ring-1 ${isDeleting ? 'ring-red-500/20' : 'ring-white/[0.06]'}`}
                    style={{ padding: '16px 18px', background: isDeleting ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)' }}
                  >
                    <div className="flex items-center" style={{ gap: 14 }}>
                      <div
                        className={`rounded-lg flex items-center justify-center ${isDeleting ? 'bg-red-500/20' : 'bg-indigo-500/20'}`}
                        style={{ width: 36, height: 36 }}
                      >
                        {isDeleting ? (
                          <Loader2 size={16} className="text-red-400 animate-spin" />
                        ) : (
                          <Cpu size={16} className="text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDeleting ? 'text-red-300' : 'text-white'}`}>{model}</p>
                        <p className="text-xs text-slate-500" style={{ marginTop: 3 }}>
                          {isDeleting ? 'Removing model...' : (
                            <>
                              {info && <>{info.params} params &middot; </>}
                              {info?.size ?? 'Local model'}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    {!isDeleting && (confirmDelete === model ? (
                      <div className="flex items-center shrink-0" style={{ gap: 6 }}>
                        <button
                          onClick={() => { setConfirmDelete(null); handleDelete(model) }}
                          className="flex items-center rounded-lg bg-red-500/15 text-red-300 text-xs font-semibold hover:bg-red-500/25 hover:text-red-200 transition-colors"
                          style={{ padding: '6px 12px', gap: 4 }}
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs text-slate-400 hover:text-white transition-colors"
                          style={{ padding: '6px 8px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(model)}
                        className="flex items-center justify-center rounded-xl text-slate-500 hover:text-red-400 hover:bg-white/[0.06] transition-colors"
                        style={{ width: 36, height: 36 }}
                      >
                        <Trash2 size={15} />
                      </button>
                    ))}
                  </div>
                )
              })
            )}
          </div>

          {/* Download New Models Section */}
          <div className="flex items-center" style={{ gap: 10, marginBottom: 16 }}>
            <Download size={16} className="text-slate-500" />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Download Models</h3>
          </div>

          {/* Show all toggle */}
          <button
            onClick={() => setShowAllModels(!showAllModels)}
            className={`flex items-center w-full text-left rounded-xl ring-1 transition-colors ${showAllModels ? 'ring-amber-500/20' : 'ring-white/[0.06]'}`}
            style={{
              padding: '14px 16px',
              gap: 14,
              marginBottom: 20,
              background: showAllModels ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
            }}
          >
            <div
              className={`relative rounded-full shrink-0 transition-colors ${showAllModels ? 'bg-amber-500' : 'bg-white/[0.10]'}`}
              style={{ width: 44, height: 24 }}
            >
              <div
                className="absolute rounded-full bg-white transition-all"
                style={{ width: 18, height: 18, top: 3, left: showAllModels ? 23 : 3 }}
              />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-medium ${showAllModels ? 'text-amber-300' : 'text-slate-400'}`}>
                Include larger models
              </p>
              <p className="text-xs text-slate-500" style={{ marginTop: 2 }}>
                {showAllModels ? 'Larger models may run slower on your system' : 'Showing recommended models for your system'}
              </p>
            </div>
          </button>

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
              onKeyDown={e => {
                if (e.key === 'Enter' && modelSearch.trim() && !pullingModel && filteredModels.length === 0) {
                  handlePull(modelSearch.trim())
                }
              }}
              placeholder="Search or type any model name..."
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
                    const canRun = ramGB >= model.maxRam
                    const isRecommended = canRun && model.maxRam <= ramGB
                    const isOversized = !canRun
                    const isPulling = pullingModel === model.name
                    const canPull = ollamaStatus === 'connected' && (canRun || showAllModels)
                    return (
                      <div
                        key={model.name}
                        className={`flex items-center justify-between rounded-xl ring-1 ring-white/[0.06] ${
                          isOversized && !showAllModels ? 'opacity-40' : ''
                        }`}
                        style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.02)' }}
                      >
                        <div className="flex items-center" style={{ gap: 14 }}>
                          <div
                            className={`rounded-lg flex items-center justify-center ${
                              isRecommended ? 'bg-emerald-500/15' : isOversized && showAllModels ? 'bg-amber-500/10' : 'bg-white/[0.04]'
                            }`}
                            style={{ width: 36, height: 36 }}
                          >
                            {isOversized && showAllModels ? (
                              <TriangleAlert size={16} className="text-amber-400" />
                            ) : (
                              <Cpu size={16} className={isRecommended ? 'text-emerald-400' : 'text-slate-500'} />
                            )}
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
                              {isOversized && showAllModels && (
                                <span
                                  className="flex items-center text-[10px] font-semibold text-amber-400 bg-amber-500/10 rounded-full"
                                  style={{ padding: '1px 7px', gap: 3 }}
                                >
                                  Needs {model.maxRam}GB+
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500" style={{ marginTop: 3 }}>
                              {model.description} &middot; {model.params} &middot; {model.size}
                            </p>
                          </div>
                        </div>
                        {isPulling ? (
                          <div className="flex items-center shrink-0" style={{ gap: 10, minWidth: 140 }}>
                            <Loader2 size={16} className="text-indigo-400 animate-spin shrink-0" />
                            <div className="flex-1 flex flex-col" style={{ gap: 4 }}>
                              <div className="rounded-full overflow-hidden" style={{ width: 100, height: 6, background: 'rgba(255,255,255,0.08)' }}>
                                <div
                                  className="h-full bg-indigo-500 rounded-full transition-all"
                                  style={{ width: `${pullPercent}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-sm text-indigo-400 font-semibold tabular-nums shrink-0">{pullPercent}%</span>
                          </div>
                        ) : (
                          <button
                            className={`flex items-center rounded-lg transition-colors text-xs font-semibold shrink-0 ${
                              canPull
                                ? isOversized ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                                : 'bg-white/[0.04] text-slate-500 cursor-not-allowed'
                            }`}
                            style={{ padding: '8px 14px', gap: 6 }}
                            disabled={!canPull || !!pullingModel}
                            onClick={() => handlePull(model.name)}
                          >
                            <Download size={12} />
                            Pull
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {groupedModels.length === 0 && modelSearch && (
              <div
                className="flex items-center justify-between rounded-xl ring-1 ring-white/[0.06]"
                style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center" style={{ gap: 14 }}>
                  <div
                    className="rounded-lg bg-white/[0.04] flex items-center justify-center"
                    style={{ width: 36, height: 36 }}
                  >
                    <Cpu size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{modelSearch.trim()}</p>
                    <p className="text-xs text-slate-500" style={{ marginTop: 3 }}>Not in catalog &middot; Pull from Ollama library</p>
                  </div>
                </div>
                {pullingModel === modelSearch.trim() ? (
                  <div className="flex items-center shrink-0" style={{ gap: 10, minWidth: 140 }}>
                    <Loader2 size={16} className="text-indigo-400 animate-spin shrink-0" />
                    <div className="flex-1 flex flex-col" style={{ gap: 4 }}>
                      <div className="rounded-full overflow-hidden" style={{ width: 100, height: 6, background: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${pullPercent}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-indigo-400 font-semibold tabular-nums shrink-0">{pullPercent}%</span>
                  </div>
                ) : (
                  <button
                    className="flex items-center rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    style={{ padding: '8px 14px', gap: 6 }}
                    disabled={!!pullingModel || ollamaStatus !== 'connected'}
                    onClick={() => handlePull(modelSearch.trim())}
                  >
                    <Download size={12} />
                    Pull
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
