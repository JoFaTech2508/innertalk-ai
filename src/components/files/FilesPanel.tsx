import { FolderOpen, Plus, X, Loader2, RefreshCw } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { listen } from '@tauri-apps/api/event'
import { useAppStore } from '../../stores/appStore'
import { readFolderFiles, watchFolder, unwatchFolder } from '../../lib/ollama'

interface FilesPanelProps {
  embedded?: boolean
}

export function FilesPanel({ embedded }: FilesPanelProps) {
  const { contextFolders, addContextFolder, removeContextFolder, updateContextFolder } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)

  const handleAddFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false })
      if (!selected) return

      const folderPath = typeof selected === 'string' ? selected : selected[0]
      if (!folderPath) return

      if (contextFolders.some(f => f.path === folderPath)) return

      setLoading(true)
      const files = await readFolderFiles(folderPath)
      const folderName = folderPath.split('/').pop() || folderPath

      addContextFolder({
        id: Math.random().toString(36).substring(2),
        name: folderName,
        path: folderPath,
        files,
      })
    } catch (e) {
      console.error('Folder dialog error:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async (folder: { id: string; path: string }) => {
    setRefreshingId(folder.id)
    try {
      const files = await readFolderFiles(folder.path)
      updateContextFolder(folder.id, files)
    } catch (e) {
      console.error('Folder refresh error:', e)
    } finally {
      setRefreshingId(null)
    }
  }

  // Watch folders for file changes
  const foldersRef = useRef(contextFolders)
  foldersRef.current = contextFolders

  useEffect(() => {
    // Start watching all current folders
    for (const folder of contextFolders) {
      watchFolder(folder.path).catch(() => {})
    }

    // Listen for change events from the native watcher
    const unlisten = listen<string>('folder-changed', async (event) => {
      const changedPath = event.payload
      const folder = foldersRef.current.find(f => f.path === changedPath)
      if (folder) {
        try {
          const files = await readFolderFiles(folder.path)
          useAppStore.getState().updateContextFolder(folder.id, files)
        } catch { /* ignore */ }
      }
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [contextFolders.length])

  const content = (
    <>
      {/* Header */}
      <div className="shrink-0" style={{ padding: '16px 16px 12px 16px' }}>
        <button
          onClick={handleAddFolder}
          disabled={loading}
          className="flex items-center justify-center w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors text-sm font-medium disabled:opacity-50"
          style={{ gap: 8, padding: '11px 16px' }}
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Plus size={15} />
          )}
          {loading ? 'Reading files...' : 'Add Folder'}
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ padding: '0 12px 12px 12px' }}>
        {contextFolders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ gap: 16 }}>
            <div
              className="rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center"
              style={{ width: 48, height: 48 }}
            >
              <FolderOpen size={20} className="text-slate-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">No folders added</p>
              <p className="text-xs text-slate-500" style={{ marginTop: 4 }}>
                Add folders to give the AI context about your project
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 6 }}>
            {contextFolders.map(folder => {
              const isRefreshing = refreshingId === folder.id
              return (
                <div
                  key={folder.id}
                  className="group flex items-center rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] hover:bg-white/[0.06] transition-colors"
                  style={{ gap: 12, padding: '12px 14px' }}
                >
                  <div
                    className="rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0"
                    style={{ width: 34, height: 34 }}
                  >
                    <FolderOpen size={14} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{folder.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {folder.files.length} file{folder.files.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all" style={{ gap: 2 }}>
                    <button
                      onClick={() => handleRefresh(folder)}
                      disabled={isRefreshing}
                      className="flex items-center justify-center rounded-md hover:bg-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors"
                      style={{ width: 28, height: 28 }}
                      title="Refresh files"
                    >
                      <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <button
                      onClick={() => {
                        unwatchFolder(folder.path).catch(() => {})
                        removeContextFolder(folder.id)
                      }}
                      className="flex items-center justify-center rounded-md hover:bg-white/[0.06] text-slate-500 hover:text-red-400 transition-colors"
                      style={{ width: 28, height: 28 }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )

  if (embedded) {
    return <div className="h-full flex flex-col">{content}</div>
  }

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden ring-1 ring-white/[0.08]"
      style={{ background: '#141c2d' }}
    >
      {content}
    </div>
  )
}
