import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Tab = 'chat' | 'files' | 'settings'
export type SidebarTab = 'chats' | 'files'
export type OllamaStatus = 'checking' | 'connected' | 'disconnected'

export interface ContextFile {
  name: string
  path: string
  content: string
}

export interface ContextFolder {
  id: string
  name: string
  path: string
  files: ContextFile[]
}

interface AppState {
  activeTab: Tab
  sidebarTab: SidebarTab
  selectedModel: string
  availableModels: string[]
  sidebarCollapsed: boolean
  ollamaStatus: OllamaStatus
  systemRam: number
  contextFolders: ContextFolder[]
  setActiveTab: (tab: Tab) => void
  setSidebarTab: (tab: SidebarTab) => void
  setSelectedModel: (model: string) => void
  setAvailableModels: (models: string[]) => void
  toggleSidebar: () => void
  setOllamaStatus: (status: OllamaStatus) => void
  setSystemRam: (ram: number) => void
  addContextFolder: (folder: ContextFolder) => void
  removeContextFolder: (id: string) => void
  updateContextFolder: (id: string, files: ContextFile[]) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'chat',
      sidebarTab: 'chats',
      selectedModel: '',
      availableModels: [],
      sidebarCollapsed: false,
      ollamaStatus: 'checking',
      systemRam: 0,
      contextFolders: [],

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSidebarTab: (tab) => set({ sidebarTab: tab }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setAvailableModels: (models) => set({ availableModels: models }),
      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setOllamaStatus: (status) => set({ ollamaStatus: status }),
      setSystemRam: (ram) => set({ systemRam: ram }),
      addContextFolder: (folder) => set(state => ({ contextFolders: [...state.contextFolders, folder] })),
      removeContextFolder: (id) => set(state => ({ contextFolders: state.contextFolders.filter(f => f.id !== id) })),
      updateContextFolder: (id, files) => set(state => ({
        contextFolders: state.contextFolders.map(f => f.id === id ? { ...f, files } : f),
      })),
    }),
    {
      name: 'local-ai-settings',
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
)
