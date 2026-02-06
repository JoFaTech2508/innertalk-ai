import { Sidebar } from './components/sidebar/Sidebar'
import { ChatView } from './components/chat/ChatView'
import { useAppStore } from './stores/appStore'

function App() {
  const { activeTab } = useAppStore()

  return (
    <div className="flex h-screen bg-bg-primary">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {activeTab === 'chat' && <ChatView />}
        {activeTab === 'files' && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-text-muted">Files — coming soon</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-text-muted">Settings — coming soon</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
