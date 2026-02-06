import { User, Bot } from 'lucide-react'
import type { Message } from '../../stores/chatStore'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
          isUser ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'
        }`}
      >
        {isUser ? (
          <User size={14} className="text-white" />
        ) : (
          <Bot size={14} className="text-slate-400" />
        )}
      </div>

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-md'
            : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-md'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}
