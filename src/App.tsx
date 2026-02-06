import { useState } from 'react'
import { Settings } from 'lucide-react'
import { FilesPanel } from './components/files/FilesPanel'
import { ChatPanel } from './components/chat/ChatPanel'
import { BottomBar } from './components/sidebar/BottomBar'
import { SettingsModal } from './components/settings/SettingsModal'

function App() {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-slate-950 p-4 gap-4">
      {/* Top row: settings gear */}
      <div className="flex items-center">
        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Main content: sidebar + chat */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Left sidebar */}
        <div className="flex flex-col gap-4 w-[320px] shrink-0">
          <FilesPanel />
          <BottomBar />
        </div>

        {/* Right: Chat area */}
        <ChatPanel />
      </div>

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}

export default App
