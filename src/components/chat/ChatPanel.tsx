import { useEffect, useRef, useState } from 'react'
import { Bot, User, Send, Paperclip } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import { useAppStore } from '../../stores/appStore'
import type { Message } from '../../stores/chatStore'

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div
      className="flex"
      style={{ gap: 16, padding: '20px 28px', background: isUser ? 'rgba(255,255,255,0.02)' : 'transparent' }}
    >
      <div
        className={`rounded-xl flex items-center justify-center shrink-0 ${
          isUser ? 'bg-indigo-600' : 'bg-white/[0.08]'
        }`}
        style={{ width: 36, height: 36 }}
      >
        {isUser ? (
          <User size={16} className="text-white" />
        ) : (
          <Bot size={16} className="text-slate-300" />
        )}
      </div>
      <div className="flex-1 min-w-0" style={{ paddingTop: 2 }}>
        <p
          className={`text-xs font-semibold tracking-wide uppercase ${
            isUser ? 'text-indigo-400' : 'text-emerald-400'
          }`}
          style={{ marginBottom: 6 }}
        >
          {isUser ? 'You' : 'AI Assistant'}
        </p>
        <p className="text-[15px] leading-7 text-slate-200 whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  )
}

export function ChatPanel() {
  const { chats, activeChatId, createChat, setActiveChat, addMessage } = useChatStore()
  const { selectedModel, setSidebarTab } = useAppStore()
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
    setSidebarTab('chats')
    addMessage(chatId, 'user', trimmed)
    setMessage('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    setTimeout(() => {
      addMessage(chatId!, 'assistant', `This is a mock response. Ollama integration coming soon! You said: "${trimmed}"`)
    }, 800)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden ring-1 ring-white/[0.08]"
      style={{ background: '#141c2d' }}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!activeChat || activeChat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ gap: 24 }}>
            <div
              className="rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center"
              style={{ width: 60, height: 60 }}
            >
              <Bot size={28} className="text-slate-500" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white" style={{ marginBottom: 8 }}>Start a Conversation</h2>
              <p className="text-sm text-slate-400 leading-relaxed" style={{ maxWidth: 380 }}>
                Type a message below to chat with your local AI model. Everything runs privately on your machine.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {activeChat.messages.map((msg, i) => (
              <div key={msg.id}>
                {i > 0 && <div className="border-t border-white/[0.04]" style={{ margin: '0 28px' }} />}
                <ChatMessage message={msg} />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0" style={{ padding: '16px 20px 20px 20px' }}>
        <div
          className="flex items-center rounded-xl ring-1 ring-white/[0.08]"
          style={{ background: '#0f1623', padding: '12px 12px 12px 12px', gap: 8 }}
        >
          <button
            className="flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-colors shrink-0"
            style={{ width: 36, height: 36 }}
            title="Attach file"
          >
            <Paperclip size={16} />
          </button>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-[15px] text-white placeholder-slate-500 outline-none resize-none"
            style={{ lineHeight: '24px', maxHeight: 120 }}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
            style={{ width: 40, height: 40 }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
