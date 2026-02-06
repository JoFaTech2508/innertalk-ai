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
      <div className="flex flex-col items-center w-14 bg-slate-950 border-r border-slate-800 py-4 gap-2">
        <button
          onClick={toggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <PanelLeft size={16} />
        </button>
        <div className="w-6 h-px bg-slate-800 my-1" />
        {tabs.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              activeTab === id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col w-72 bg-slate-950 border-r border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <h1 className="text-base font-semibold text-white">Local AI Chat</h1>
        <button
          onClick={toggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 px-3 pb-3">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors flex-1 justify-center ${
              activeTab === id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
          <div className="px-3 pb-3">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-colors"
            >
              <Plus size={16} />
              New Chat
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-3">
            {chats.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-slate-900 flex items-center justify-center">
                  <MessageSquare size={18} className="text-slate-500" />
                </div>
                <p className="text-xs text-slate-500">No chats yet</p>
                <p className="text-xs text-slate-600 mt-1">Start a new conversation</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {chats.map(chat => (
                  <div
                    key={chat.id}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      activeChatId === chat.id
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
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
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-slate-700 transition-all text-slate-500 hover:text-red-400"
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
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-slate-900 flex items-center justify-center">
            <FolderOpen size={18} className="text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-400">Files</p>
          <p className="text-xs text-slate-600 mt-1">Coming soon</p>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-slate-900 flex items-center justify-center">
            <Settings size={18} className="text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-400">Settings</p>
          <p className="text-xs text-slate-600 mt-1">Coming soon</p>
        </div>
      )}
    </div>
  )
}
