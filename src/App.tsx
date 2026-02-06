import { Sidebar } from './components/sidebar/Sidebar'
import { ChatView } from './components/chat/ChatView'
import { useAppStore } from './stores/appStore'
import { FolderOpen, Settings } from 'lucide-react'

function App() {
  const { activeTab } = useAppStore()

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {activeTab === 'chat' && <ChatView />}
        {activeTab === 'files' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <FolderOpen size={22} className="text-slate-500" />
            </div>
            <p className="text-sm text-slate-400 font-medium">Files</p>
            <p className="text-xs text-slate-600">Coming soon</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Settings size={22} className="text-slate-500" />
            </div>
            <p className="text-sm text-slate-400 font-medium">Settings</p>
            <p className="text-xs text-slate-600">Coming soon</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
