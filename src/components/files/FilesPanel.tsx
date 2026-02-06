import { FolderOpen, File, Plus, X } from 'lucide-react'
import { useState } from 'react'

interface FileItem {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
}

const mockFiles: FileItem[] = []

export function FilesPanel() {
  const [files, setFiles] = useState<FileItem[]>(mockFiles)

  const handleAddFolder = () => {
    // Will be replaced with Tauri file dialog
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
    <div className="flex-1 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <FolderOpen size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-white">Files</h2>
        </div>
        <button
          onClick={handleAddFolder}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-3">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
            <div className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center">
              <FolderOpen size={18} className="text-slate-500" />
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-400">No files added</p>
              <p className="text-xs text-slate-600 mt-1">Add folders for the AI to read</p>
            </div>
            <button
              onClick={handleAddFolder}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              <Plus size={14} />
              Add Folder
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {files.map(file => (
              <div
                key={file.id}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                {file.type === 'folder' ? (
                  <FolderOpen size={16} className="text-indigo-400 shrink-0" />
                ) : (
                  <File size={16} className="text-slate-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{file.name}</p>
                  <p className="text-xs text-slate-600 truncate">{file.path}</p>
                </div>
                <button
                  onClick={() => handleRemove(file.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-700 transition-all text-slate-500 hover:text-red-400"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
