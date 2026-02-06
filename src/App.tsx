import { useState, useEffect, useCallback } from 'react'
import { Settings, ChevronDown, Check, Cpu, AlertCircle } from 'lucide-react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { LeftPanel } from './components/sidebar/LeftPanel'
import { ChatPanel } from './components/chat/ChatPanel'
import { SettingsModal } from './components/settings/SettingsModal'
import { useAppStore } from './stores/appStore'
import { checkOllama, listModels, getSystemRam, waitForOllama } from './lib/ollama'

function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const {
    selectedModel, setSelectedModel,
    availableModels, setAvailableModels,
    ollamaStatus, setOllamaStatus,
    setSystemRam,
  } = useAppStore()

  useEffect(() => {
    async function init() {
      try {
        const ram = await getSystemRam()
        setSystemRam(ram)
      } catch (e) {
        console.error('Failed to get system RAM:', e)
      }

      try {
        const running = await waitForOllama()
        if (running) {
          setOllamaStatus('connected')
          try {
            const models = await listModels()
            const names = models.map(m => m.name)
            setAvailableModels(names)
            if (names.length > 0 && !selectedModel) {
              setSelectedModel(names[0])
            }
          } catch (e) {
            console.error('Failed to fetch models:', e)
          }
        } else {
          setOllamaStatus('disconnected')
        }
      } catch {
        setOllamaStatus('disconnected')
      }
    }

    init()
  }, [])

  const statusColor =
    ollamaStatus === 'connected' ? 'bg-emerald-500'
    : ollamaStatus === 'checking' ? 'bg-amber-500 animate-pulse'
    : 'bg-red-500'

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: '#0b1120', padding: '0px 20px 20px 20px' }}>
      <div
        onMouseDown={(e) => { if (!(e.target as HTMLElement).closest('button')) getCurrentWindow().startDragging() }}
        className="flex items-center justify-end shrink-0"
        style={{ height: 48, paddingLeft: 70 }}
      >
        <div className="flex items-center" style={{ gap: 6 }}>
          <div className="relative">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center rounded-lg text-sm hover:bg-white/[0.06] transition-colors"
              style={{ gap: 8, padding: '6px 12px' }}
            >
              <span
                className={`rounded-full ${statusColor}`}
                style={{ width: 8, height: 8 }}
              />
              <span className="text-slate-200 font-medium">
                {selectedModel || (ollamaStatus === 'checking' ? 'Connecting...' : ollamaStatus === 'disconnected' ? 'Offline' : 'No model')}
              </span>
              <ChevronDown
                size={14}
                className={`text-slate-500 transition-transform ${showModelPicker ? 'rotate-180' : ''}`}
              />
            </button>

            {showModelPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowModelPicker(false)} />
                <div
                  className="absolute top-full right-0 rounded-xl shadow-2xl shadow-black/50 z-20 ring-1 ring-white/[0.08]"
                  style={{ background: '#1a2235', marginTop: 8, minWidth: 240, padding: 6 }}
                >
                  <div style={{ padding: '8px 12px 12px 12px' }}>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Select Model</p>
                  </div>

                  {ollamaStatus === 'disconnected' ? (
                    <div className="flex items-center" style={{ padding: '12px 12px 16px 12px', gap: 10 }}>
                      <AlertCircle size={14} className="text-red-400 shrink-0" />
                      <p className="text-xs text-slate-400">
                        Ollama is not running. Start Ollama to see available models.
                      </p>
                    </div>
                  ) : availableModels.length === 0 ? (
                    <div style={{ padding: '12px 12px 16px 12px' }}>
                      <p className="text-xs text-slate-400">
                        No models downloaded. Pull a model from Settings.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col" style={{ gap: 2 }}>
                      {availableModels.map(model => (
                        <button
                          key={model}
                          onClick={() => {
                            setSelectedModel(model)
                            setShowModelPicker(false)
                          }}
                          className={`w-full text-left text-sm rounded-lg flex items-center justify-between transition-colors ${
                            model === selectedModel
                              ? 'text-white bg-indigo-600/20'
                              : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                          }`}
                          style={{ padding: '10px 12px' }}
                        >
                          <div className="flex items-center" style={{ gap: 10 }}>
                            <Cpu size={14} className={model === selectedModel ? 'text-indigo-400' : 'text-slate-500'} />
                            <span className="font-medium">{model}</span>
                          </div>
                          {model === selectedModel && <Check size={14} className="text-indigo-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            style={{ width: 38, height: 38 }}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0" style={{ gap: 20 }}>
        <div className="shrink-0 overflow-hidden" style={{ width: 300, minWidth: 220 }}>
          <LeftPanel />
        </div>
        <div className="flex-1 overflow-hidden min-w-0">
          <ChatPanel />
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}

export default App
