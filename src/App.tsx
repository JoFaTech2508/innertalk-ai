import { useState } from 'react'
import { Settings, ChevronDown, Check, Cpu } from 'lucide-react'
import { LeftPanel } from './components/sidebar/LeftPanel'
import { ChatPanel } from './components/chat/ChatPanel'
import { SettingsModal } from './components/settings/SettingsModal'
import { useAppStore } from './stores/appStore'

function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const { selectedModel, setSelectedModel, availableModels } = useAppStore()

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: '#0b1120', padding: '12px 20px 20px 20px' }}>
      {/* Top bar */}
      <div className="flex items-center justify-end shrink-0" style={{ height: 50 }}>
        {/* Right side: model selector + settings */}
        <div className="flex items-center" style={{ gap: 8 }}>
          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center rounded-xl text-sm hover:bg-white/[0.06] transition-colors"
              style={{ gap: 10, padding: '10px 16px' }}
            >
              <span
                className="rounded-full bg-emerald-500"
                style={{ width: 8, height: 8 }}
              />
              <span className="text-slate-200 font-medium">{selectedModel}</span>
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
                </div>
              </>
            )}
          </div>

          {/* Settings button */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            style={{ width: 42, height: 42 }}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Main content */}
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
