import { useState, useRef, useEffect } from 'react'
import { Send, ChevronDown } from 'lucide-react'
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
    <div className="border-t border-border bg-bg-secondary p-4">
      <div className="max-w-3xl mx-auto">
        {/* Input Area */}
        <div className="flex items-end gap-2 bg-bg-tertiary rounded-2xl border border-border p-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={disabled}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none resize-none px-2 py-1.5 max-h-[150px]"
          />
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || disabled}
            className="p-2 rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={16} />
          </button>
        </div>

        {/* Model Selector */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="relative">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {selectedModel}
              <ChevronDown size={12} />
            </button>

            {showModelPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowModelPicker(false)} />
                <div className="absolute bottom-full left-0 mb-2 bg-bg-tertiary border border-border rounded-lg shadow-xl py-1 min-w-[160px] z-20">
                  {availableModels.map(model => (
                    <button
                      key={model}
                      onClick={() => {
                        setSelectedModel(model)
                        setShowModelPicker(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        model === selectedModel
                          ? 'text-accent bg-bg-active'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <span className="text-xs text-text-muted">
            Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  )
}
