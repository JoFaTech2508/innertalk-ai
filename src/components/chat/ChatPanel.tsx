import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { Bot, User, Send, Paperclip, Loader2, X, FileText, Square, Copy, Check } from 'lucide-react'
import Markdown from 'react-markdown'
import { open } from '@tauri-apps/plugin-dialog'
import { useChatStore } from '../../stores/chatStore'
import { useAppStore } from '../../stores/appStore'
import { chat as ollamaChat, cancelChat, readFileContent } from '../../lib/ollama'
import type { Message, Attachment } from '../../stores/chatStore'

function CodeBlock({ language, children }: { language?: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  const handleCopy = useCallback(() => {
    const text = preRef.current?.textContent || ''
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [])

  return (
    <div className="code-block-wrapper relative group rounded-[10px] overflow-hidden ring-1 ring-white/[0.06]" style={{ margin: '12px 0' }}>
      {language && (
        <div
          className="flex items-center justify-between text-xs text-slate-400"
          style={{ background: '#0a0f1a', padding: '6px 14px' }}
        >
          <span className="font-medium capitalize">{language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center text-slate-500 hover:text-slate-200 transition-colors"
            style={{ gap: 4 }}
          >
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
      )}
      <pre ref={preRef} style={{ margin: 0, borderRadius: 0, border: 'none' }}>{children}</pre>
      {!language && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 flex items-center justify-center rounded-md bg-white/[0.06] text-slate-500 hover:text-slate-200 hover:bg-white/[0.12] transition-all opacity-0 group-hover:opacity-100"
          style={{ width: 28, height: 28 }}
          title="Copy"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      )}
    </div>
  )
}

const markdownComponents = {
  pre: ({ children }: { children?: ReactNode }) => {
    // Extract language from the code child's className (e.g. "language-python")
    let language: string | undefined
    if (children && typeof children === 'object' && 'props' in (children as any)) {
      const codeProps = (children as any).props
      const className = codeProps?.className || ''
      const match = className.match(/language-(\w+)/)
      if (match) language = match[1]
    }
    return <CodeBlock language={language}>{children}</CodeBlock>
  },
}

function ChatMessage({ message, isStreaming }: { message: Message; isStreaming?: boolean }) {
  const isUser = message.role === 'user'

  return (
    <div
      className="flex"
      style={{ gap: 12, padding: '16px 20px', background: isUser ? 'rgba(255,255,255,0.02)' : 'transparent' }}
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
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap" style={{ gap: 6, marginBottom: 8 }}>
            {message.attachments.map((att, i) => (
              <span
                key={i}
                className="flex items-center text-xs text-indigo-300 bg-indigo-500/10 rounded-lg ring-1 ring-indigo-500/20"
                style={{ padding: '4px 10px', gap: 6 }}
              >
                <FileText size={12} />
                {att.name}
              </span>
            ))}
          </div>
        )}
        {message.content ? (
          <div className="chat-markdown text-[15px] text-slate-200">
            <Markdown components={markdownComponents}>{message.content}</Markdown>
          </div>
        ) : isStreaming ? (
          <div className="flex items-center" style={{ gap: 6, padding: '4px 0' }}>
            <Loader2 size={14} className="text-slate-400 animate-spin" />
            <span className="text-sm text-slate-400">Thinking...</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ChatPanel() {
  const { chats, activeChatId, createChat, setActiveChat, addMessage, updateLastMessage } = useChatStore()
  const { selectedModel, setSidebarTab, ollamaStatus } = useAppStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [message, setMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingChatId, setStreamingChatId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const userScrolledUp = useRef(false)

  const activeChat = chats.find(c => c.id === activeChatId)

  const handleAttach = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          { name: 'Text files', extensions: ['txt', 'md', 'json', 'csv', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'log'] },
          { name: 'Code', extensions: ['js', 'ts', 'tsx', 'jsx', 'py', 'rs', 'go', 'java', 'c', 'cpp', 'h', 'css', 'html', 'sql', 'sh'] },
          { name: 'All files', extensions: ['*'] },
        ],
      })
      if (!selected) return
      const paths = Array.isArray(selected) ? selected : [selected]
      for (const filePath of paths) {
        const name = filePath.split('/').pop() || filePath
        if (attachments.some(a => a.path === filePath)) continue
        try {
          const content = await readFileContent(filePath)
          setAttachments(prev => [...prev, { name, path: filePath, content }])
        } catch (e) {
          console.error('Failed to read file:', e)
        }
      }
    } catch (e) {
      console.error('File dialog error:', e)
    }
  }

  const removeAttachment = (path: string) => {
    setAttachments(prev => prev.filter(a => a.path !== path))
  }

  // Smart auto-scroll: only scroll down if user hasn't scrolled up
  useEffect(() => {
    if (!userScrolledUp.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeChat?.messages.length, activeChat?.messages.at(-1)?.content])

  // Reset scroll tracking when switching chats
  useEffect(() => {
    userScrolledUp.current = false
  }, [activeChatId])

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    userScrolledUp.current = distanceFromBottom > 100
  }, [])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [message])

  const handleSend = async () => {
    const trimmed = message.trim()
    if ((!trimmed && attachments.length === 0)) return
    // Block if streaming in another chat
    if (isStreaming && streamingChatId && streamingChatId !== activeChatId) return
    if (isStreaming) return
    const displayText = trimmed || `Analyze the attached file${attachments.length > 1 ? 's' : ''}`

    if (ollamaStatus !== 'connected') {
      let chatId = activeChatId
      if (!chatId) {
        chatId = createChat(selectedModel || 'unknown')
        setActiveChat(chatId)
      }
      setSidebarTab('chats')
      addMessage(chatId, 'user', displayText)
      setMessage('')
      addMessage(chatId, 'assistant', 'Ollama is not running. Please start Ollama to chat with AI models.')
      return
    }

    if (!selectedModel) {
      return
    }

    let chatId = activeChatId
    if (!chatId) {
      chatId = createChat(selectedModel)
      setActiveChat(chatId)
    }
    setSidebarTab('chats')
    const currentAttachments = attachments.length > 0 ? [...attachments] : undefined
    addMessage(chatId, 'user', displayText, currentAttachments)
    setMessage('')
    setAttachments([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    // Build messages array for Ollama (before adding empty assistant msg)
    const currentChat = useChatStore.getState().chats.find(c => c.id === chatId)
    const ollamaMessages: { role: string; content: string }[] = []

    // Add context folder files as a system-level context (auto-synced by FilesPanel)
    const folders = useAppStore.getState().contextFolders
    if (folders.length > 0) {
      const folderContext = folders
        .flatMap(f => f.files.map(file => `--- ${file.name} ---\n${file.content}`))
        .join('\n\n')
      ollamaMessages.push({
        role: 'system',
        content: `The user has provided these project files as context:\n\n${folderContext}`,
      })
    }

    // Add chat messages
    for (const m of currentChat?.messages ?? []) {
      let content = m.content
      if (m.attachments?.length) {
        const fileContext = m.attachments.map(a => `--- File: ${a.name} ---\n${a.content}`).join('\n\n')
        content = `${fileContext}\n\n${content}`
      }
      ollamaMessages.push({ role: m.role, content })
    }

    // Add empty assistant message as placeholder for streaming
    addMessage(chatId, 'assistant', '')
    setIsStreaming(true)
    setStreamingChatId(chatId)

    let accumulated = ''

    try {
      await ollamaChat(
        selectedModel,
        ollamaMessages,
        (token) => {
          accumulated += token
          updateLastMessage(chatId!, accumulated)
        },
        () => {
          setIsStreaming(false); setStreamingChatId(null)
        },
        (error) => {
          updateLastMessage(chatId!, `Error: ${error}`)
          setIsStreaming(false); setStreamingChatId(null)
        },
      )
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to connect to Ollama'
      updateLastMessage(chatId!, `Error: ${errorMsg}`)
      setIsStreaming(false)
      setStreamingChatId(null)
    }
  }

  const handleCancel = async () => {
    try {
      await cancelChat()
    } catch (e) {
      console.error('Cancel error:', e)
    }
    setIsStreaming(false)
    setStreamingChatId(null)
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
      {/* Streaming in another chat banner */}
      {isStreaming && streamingChatId && streamingChatId !== activeChatId && (
        <div
          className="flex items-center shrink-0 text-xs text-amber-300 bg-amber-500/10 border-b border-amber-500/20"
          style={{ padding: '8px 20px', gap: 8 }}
        >
          <Loader2 size={12} className="animate-spin" />
          A response is being generated in another chat. Please wait for it to finish.
        </div>
      )}

      {/* Messages */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto min-h-0">
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
            {activeChat.messages.map((msg, i) => {
              const isLastMsg = i === activeChat.messages.length - 1
              return (
                <div key={msg.id}>
                  {i > 0 && <div className="border-t border-white/[0.04]" style={{ margin: '0 20px' }} />}
                  <ChatMessage
                    message={msg}
                    isStreaming={isLastMsg && isStreaming && msg.role === 'assistant'}
                  />
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0" style={{ padding: '12px 16px 16px 16px' }}>
        {attachments.length > 0 && (
          <div className="flex flex-wrap" style={{ gap: 6, marginBottom: 8, paddingLeft: 4 }}>
            {attachments.map(att => (
              <span
                key={att.path}
                className="flex items-center text-xs text-indigo-300 bg-indigo-500/10 rounded-lg ring-1 ring-indigo-500/20"
                style={{ padding: '4px 8px', gap: 6 }}
              >
                <FileText size={12} />
                {att.name}
                <button
                  onClick={() => removeAttachment(att.path)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div
          className="flex items-center rounded-xl ring-1 ring-white/[0.08]"
          style={{ background: '#0f1623', padding: '12px 12px 12px 12px', gap: 8 }}
        >
          <button
            onClick={handleAttach}
            disabled={isStreaming}
            className="flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-colors shrink-0 disabled:opacity-50"
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
            placeholder={isStreaming ? 'Waiting for response...' : 'Type a message...'}
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent text-[15px] text-white placeholder-slate-500 outline-none resize-none disabled:opacity-50"
            style={{ lineHeight: '24px', maxHeight: 120 }}
          />
          {isStreaming ? (
            <button
              onClick={handleCancel}
              className="flex items-center justify-center rounded-lg bg-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.12] transition-colors shrink-0"
              style={{ width: 40, height: 40 }}
              title="Stop generating"
            >
              <Square size={12} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!message.trim() && attachments.length === 0}
              className="flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
              style={{ width: 40, height: 40 }}
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
