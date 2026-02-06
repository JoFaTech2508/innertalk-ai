import { MessageSquare, FolderOpen, Settings, Plus, Trash2, PanelLeftClose, PanelLeft } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import type { Tab } from '../../stores/appStore'
import { useChatStore } from '../../stores/chatStore'

const tabs: { id: Tab; label: string; icon: typeof MessageSquare }[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'files', label: 'Files', icon: FolderOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { activeTab, setActiveTab, selectedModel, sidebarCollapsed, toggleSidebar } = useAppStore()
  const { chats, activeChatId, setActiveChat, createChat, deleteChat } = useChatStore()

  const handleNewChat = () => {
    const id = createChat(selectedModel)
    setActiveChat(id)
    setActiveTab('chat')
  }

  if (sidebarCollapsed) {
    return (
      <div className="flex flex-col items-center w-12 bg-bg-secondary border-r border-border py-3 gap-2">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          <PanelLeft size={18} />
        </button>
        <div className="w-6 h-px bg-border my-1" />
        {tabs.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === id
                ? 'bg-bg-active text-text-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            <Icon size={18} />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col w-64 bg-bg-secondary border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h1 className="text-sm font-semibold text-text-primary">Local AI Chat</h1>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 p-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1 justify-center ${
              activeTab === id
                ? 'bg-bg-active text-text-primary'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content based on tab */}
      {activeTab === 'chat' && (
        <>
          {/* New Chat Button */}
          <div className="px-2 pb-2">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors border border-border-light border-dashed"
            >
              <Plus size={16} />
              New Chat
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-2">
            {chats.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-8">
                No chats yet. Start a new one!
              </p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {chats.map(chat => (
                  <div
                    key={chat.id}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      activeChatId === chat.id
                        ? 'bg-bg-active text-text-primary'
                        : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                    }`}
                    onClick={() => setActiveChat(chat.id)}
                  >
                    <MessageSquare size={14} className="shrink-0" />
                    <span className="text-sm truncate flex-1">{chat.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteChat(chat.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-bg-primary transition-all text-text-muted hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'files' && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-text-muted">Files tab coming soon</p>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-text-muted">Settings tab coming soon</p>
        </div>
      )}
    </div>
  )
}
