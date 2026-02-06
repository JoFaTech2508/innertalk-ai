import { User, Bot } from 'lucide-react'
import type { Message } from '../../stores/chatStore'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
          isUser ? 'bg-accent' : 'bg-bg-tertiary border border-border'
        }`}
      >
        {isUser ? (
          <User size={16} className="text-white" />
        ) : (
          <Bot size={16} className="text-text-secondary" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-user-bubble text-white rounded-tr-sm'
            : 'bg-assistant-bubble text-text-primary border border-border rounded-tl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}
