import { X, Download, Trash2, HardDrive } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { availableModels } = useAppStore()

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Models section */}
          <div className="flex items-center gap-2.5 mb-4">
            <HardDrive size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Downloaded Models</h3>
          </div>

          <div className="flex flex-col gap-2 mb-6">
            {availableModels.map(model => (
              <div
                key={model}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800 border border-slate-700"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">{model}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Local model</p>
                </div>
                <button className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Download new model */}
          <button className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-indigo-400 border border-slate-700 border-dashed hover:bg-slate-800 transition-colors justify-center">
            <Download size={16} />
            Download New Model
          </button>
        </div>
      </div>
    </div>
  )
}
