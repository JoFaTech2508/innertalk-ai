import { FolderOpen, File, Plus, X } from 'lucide-react'
import { useState } from 'react'

interface FileItem {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
}

interface FilesPanelProps {
  embedded?: boolean
}

export function FilesPanel({ embedded }: FilesPanelProps) {
  const [files, setFiles] = useState<FileItem[]>([])

  const handleAddFolder = () => {
    const newFolder: FileItem = {
      id: Math.random().toString(36).substring(2),
      name: 'Example Folder',
      path: '/example/path',
      type: 'folder',
    }
    setFiles([...files, newFolder])
  }

  const handleRemove = (id: string) => {
    setFiles(files.filter(f => f.id !== id))
  }

  const content = (
    <>
      {/* Header */}
      <div className="shrink-0" style={{ padding: '16px 16px 12px 16px' }}>
        <button
          onClick={handleAddFolder}
          className="flex items-center justify-center w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors text-sm font-medium"
          style={{ gap: 8, padding: '11px 16px' }}
        >
          <Plus size={15} />
          Add Folder
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ padding: '0 12px 12px 12px' }}>
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ gap: 16 }}>
            <div
              className="rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center"
              style={{ width: 48, height: 48 }}
            >
              <FolderOpen size={20} className="text-slate-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">No files added</p>
              <p className="text-xs text-slate-500" style={{ marginTop: 4 }}>Add folders for the AI to read</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 6 }}>
            {files.map(file => (
              <div
                key={file.id}
                className="group flex items-center rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] hover:bg-white/[0.06] transition-colors"
                style={{ gap: 12, padding: '12px 14px' }}
              >
                <div
                  className="rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0"
                  style={{ width: 34, height: 34 }}
                >
                  {file.type === 'folder' ? (
                    <FolderOpen size={14} className="text-indigo-400" />
                  ) : (
                    <File size={14} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500 truncate">{file.path}</p>
                </div>
                <button
                  onClick={() => handleRemove(file.id)}
                  className="opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md hover:bg-white/[0.06] transition-all text-slate-500 hover:text-red-400"
                  style={{ width: 28, height: 28 }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
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
