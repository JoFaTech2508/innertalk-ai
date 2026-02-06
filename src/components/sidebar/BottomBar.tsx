import { useState } from 'react'
import { Upload, ChevronDown, Check } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'

export function BottomBar() {
  const [showModelPicker, setShowModelPicker] = useState(false)
  const { selectedModel, setSelectedModel, availableModels } = useAppStore()

  return (
    <div className="flex items-center gap-3 bg-slate-900 rounded-2xl border border-slate-800 px-4 py-3">
      {/* Upload button */}
      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors">
        <Upload size={14} />
        Upload
      </button>

      {/* Model selector */}
      <div className="relative flex-1">
        <button
          onClick={() => setShowModelPicker(!showModelPicker)}
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate flex-1 text-left">{selectedModel}</span>
          <ChevronDown size={14} className="text-slate-500 shrink-0" />
        </button>

        {showModelPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowModelPicker(false)} />
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-20">
              {availableModels.map(model => (
                <button
                  key={model}
                  onClick={() => {
                    setSelectedModel(model)
                    setShowModelPicker(false)
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                    model === selectedModel
                      ? 'text-indigo-400 bg-slate-700/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {model}
                  {model === selectedModel && <Check size={14} />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
