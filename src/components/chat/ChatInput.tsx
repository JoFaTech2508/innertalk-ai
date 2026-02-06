import { useState, useRef, useEffect } from 'react'
import { Send, ChevronDown, Check } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [showModelPicker, setShowModelPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { selectedModel, setSelectedModel, availableModels } = useAppStore()

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
  }, [message])

  const handleSubmit = () => {
    const trimmed = message.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-slate-800 bg-slate-950 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-3 bg-slate-900 rounded-2xl border border-slate-800 p-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={disabled}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none resize-none px-1 py-1 max-h-[150px]"
          />
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || disabled}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2.5 px-1">
          <div className="relative">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {selectedModel}
              <ChevronDown size={12} />
            </button>

            {showModelPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowModelPicker(false)} />
                <div className="absolute bottom-full left-0 mb-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 min-w-[180px] z-20">
                  {availableModels.map(model => (
                    <button
                      key={model}
                      onClick={() => {
                        setSelectedModel(model)
                        setShowModelPicker(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        model === selectedModel
                          ? 'text-indigo-400 bg-slate-800'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {model}
                      {model === selectedModel && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <span className="text-xs text-slate-600">
            Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  )
}
