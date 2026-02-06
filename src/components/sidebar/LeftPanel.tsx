import { MessageSquare, FolderOpen, Plus, Trash2, Cpu } from 'lucide-react'
import { FilesPanel } from '../files/FilesPanel'
import { useChatStore } from '../../stores/chatStore'
import { useAppStore } from '../../stores/appStore'
import { cancelChat } from '../../lib/ollama'

function ChatsTab() {
  const { chats, activeChatId, createChat, deleteChat, setActiveChat } = useChatStore()
  const { selectedModel } = useAppStore()

  const handleNewChat = () => {
    const id = createChat(selectedModel)
    setActiveChat(id)
  }

  return (
    <div className="flex flex-col h-full">
      {/* New chat button */}
      <div className="shrink-0" style={{ padding: '16px 16px 12px 16px' }}>
        <button
          onClick={handleNewChat}
          className="flex items-center justify-center w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors text-sm font-medium"
          style={{ gap: 8, padding: '11px 16px' }}
        >
          <Plus size={15} />
          New Chat
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ padding: '0 12px 12px 12px' }}>
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ gap: 16 }}>
            <div
              className="rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center"
              style={{ width: 48, height: 48 }}
            >
              <MessageSquare size={20} className="text-slate-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">No chats yet</p>
              <p className="text-xs text-slate-500" style={{ marginTop: 4 }}>Start a new conversation</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 4 }}>
            {chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`group w-full text-left rounded-xl transition-colors flex items-center ${
                  chat.id === activeChatId
                    ? 'bg-white/[0.06] ring-1 ring-white/[0.08]'
                    : 'hover:bg-white/[0.04]'
                }`}
                style={{ padding: '12px 14px', gap: 12 }}
              >
                <div
                  className={`rounded-lg flex items-center justify-center shrink-0 ${
                    chat.id === activeChatId ? 'bg-indigo-500/20' : 'bg-white/[0.04]'
                  }`}
                  style={{ width: 34, height: 34 }}
                >
                  <MessageSquare size={14} className={chat.id === activeChatId ? 'text-indigo-400' : 'text-slate-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{chat.title}</p>
                  <div className="flex items-center" style={{ gap: 4, marginTop: 2 }}>
                    <Cpu size={10} className="text-slate-500" />
                    <p className="text-[11px] text-slate-500 truncate">{chat.model}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    cancelChat().catch(() => {})
                    deleteChat(chat.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md hover:bg-white/[0.06] transition-all text-slate-500 hover:text-red-400 shrink-0"
                  style={{ width: 28, height: 28 }}
                >
                  <Trash2 size={12} />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function LeftPanel() {
  const { sidebarTab: activeTab, setSidebarTab: setActiveTab } = useAppStore()

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden ring-1 ring-white/[0.08]"
      style={{ background: '#141c2d' }}
    >
      {/* Tab bar */}
      <div className="flex shrink-0" style={{ padding: '10px 10px 0 10px', gap: 4 }}>
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 flex items-center justify-center text-xs font-semibold uppercase tracking-widest transition-colors rounded-lg ${
            activeTab === 'chats'
              ? 'text-white bg-indigo-500/15 ring-1 ring-indigo-500/25'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
          }`}
          style={{ gap: 7, padding: '10px 8px' }}
        >
          <MessageSquare size={13} className={activeTab === 'chats' ? 'text-indigo-400' : ''} />
          Chats
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 flex items-center justify-center text-xs font-semibold uppercase tracking-widest transition-colors rounded-lg ${
            activeTab === 'files'
              ? 'text-white bg-indigo-500/15 ring-1 ring-indigo-500/25'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
          }`}
          style={{ gap: 7, padding: '10px 8px' }}
        >
          <FolderOpen size={13} className={activeTab === 'files' ? 'text-indigo-400' : ''} />
          Files
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'chats' ? <ChatsTab /> : <FilesContent />}
      </div>
    </div>
  )
}

function FilesContent() {
  return <FilesPanel embedded />
}
