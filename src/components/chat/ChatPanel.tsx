import { useEffect, useRef, useState } from 'react'
import { Bot, Send } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import { useAppStore } from '../../stores/appStore'
import { MessageBubble } from './MessageBubble'

export function ChatPanel() {
  const { chats, activeChatId, createChat, setActiveChat, addMessage } = useChatStore()
  const { selectedModel } = useAppStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [message, setMessage] = useState('')

  const activeChat = chats.find(c => c.id === activeChatId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages.length])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [message])

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed) return

    let chatId = activeChatId
    if (!chatId) {
      chatId = createChat(selectedModel)
      setActiveChat(chatId)
    }
    addMessage(chatId, 'user', trimmed)
    setMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Mock response
    setTimeout(() => {
      addMessage(chatId!, 'assistant', `This is a mock response. Ollama integration coming soon!\n\nYou said: "${trimmed}"`)
    }, 800)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden min-w-0">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto">
        {!activeChat || activeChat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Bot size={26} className="text-slate-500" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white mb-1">Local AI Chat</h2>
              <p className="text-sm text-slate-500 max-w-sm">
                Start a conversation with your local AI model
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-6 flex flex-col gap-4">
            {activeChat.messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat input - inside the card at the bottom */}
      <div className="p-4 pt-0">
        <div className="flex items-end gap-3 bg-slate-800 rounded-2xl border border-slate-700 p-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none resize-none px-1 py-1 max-h-[120px]"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
