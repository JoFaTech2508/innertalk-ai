import { FolderOpen, File, Plus, X, Upload } from 'lucide-react'
import { useState } from 'react'

interface FileItem {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
}

export function FilesPanel() {
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

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden ring-1 ring-white/[0.08]"
      style={{ background: '#141c2d' }}
    >
      {/* Header */}
      <div style={{ padding: '18px 20px' }} className="flex items-center justify-between border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <FolderOpen size={16} className="text-slate-500" />
          <h2 className="text-xs font-semibold text-slate-400 tracking-widest uppercase">Files</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Upload file"
            style={{ width: 34, height: 34 }}
          >
            <Upload size={15} />
          </button>
          <button
            onClick={handleAddFolder}
            className="flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            title="Add folder"
            style={{ width: 34, height: 34 }}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ padding: 16 }}>
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ gap: 20 }}>
            <div
              className="rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center"
              style={{ width: 56, height: 56 }}
            >
              <FolderOpen size={24} className="text-slate-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">No files added</p>
              <p className="text-xs text-slate-500" style={{ marginTop: 6 }}>Add folders for the AI to read</p>
            </div>
            <button
              onClick={handleAddFolder}
              className="flex items-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-lg"
              style={{ gap: 8, padding: '10px 20px' }}
            >
              <Plus size={15} />
              Add Folder
            </button>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 8 }}>
            {files.map(file => (
              <div
                key={file.id}
                className="group flex items-center rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] hover:bg-white/[0.06] transition-colors"
                style={{ gap: 12, padding: '12px 14px' }}
              >
                <div
                  className="rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0"
                  style={{ width: 36, height: 36 }}
                >
                  {file.type === 'folder' ? (
                    <FolderOpen size={15} className="text-indigo-400" />
                  ) : (
                    <File size={15} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500 truncate">{file.path}</p>
                </div>
                <button
                  onClick={() => handleRemove(file.id)}
                  className="opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md hover:bg-white/[0.06] transition-all text-slate-500 hover:text-red-400"
                  style={{ width: 30, height: 30 }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
