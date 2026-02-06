import { useEffect, useRef } from 'react'
import { MessageSquarePlus, Bot } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import { useAppStore } from '../../stores/appStore'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'

export function ChatView() {
  const { chats, activeChatId, createChat, setActiveChat, addMessage } = useChatStore()
  const { selectedModel } = useAppStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeChat = chats.find(c => c.id === activeChatId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages.length])

  const handleSend = (content: string) => {
    let chatId = activeChatId
    if (!chatId) {
      chatId = createChat(selectedModel)
      setActiveChat(chatId)
    }
    addMessage(chatId, 'user', content)

    // Mock assistant response (will be replaced with Ollama integration)
    setTimeout(() => {
      addMessage(chatId!, 'assistant', `This is a mock response. Ollama integration coming soon!\n\nYou said: "${content}"`)
    }, 800)
  }

  // Empty state - no active chat
  if (!activeChat) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-bg-tertiary border border-border flex items-center justify-center">
            <Bot size={32} className="text-text-muted" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-medium text-text-primary mb-1">Local AI Chat</h2>
            <p className="text-sm text-text-muted max-w-sm">
              Start a conversation with your local AI model. Everything runs on your machine.
            </p>
          </div>
          <button
            onClick={() => {
              const id = createChat(selectedModel)
              setActiveChat(id)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover transition-colors"
          >
            <MessageSquarePlus size={16} />
            Start a new chat
          </button>
        </div>
        <ChatInput onSend={handleSend} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {activeChat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-12 h-12 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center">
              <Bot size={24} className="text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-4 flex flex-col gap-4">
            {activeChat.messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  )
}
