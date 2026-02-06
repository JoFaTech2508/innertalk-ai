import { create } from 'zustand'

export type Tab = 'chat' | 'files' | 'settings'
export type SidebarTab = 'chats' | 'files'
export type OllamaStatus = 'checking' | 'connected' | 'disconnected'

interface AppState {
  activeTab: Tab
  sidebarTab: SidebarTab
  selectedModel: string
  availableModels: string[]
  sidebarCollapsed: boolean
  ollamaStatus: OllamaStatus
  systemRam: number
  setActiveTab: (tab: Tab) => void
  setSidebarTab: (tab: SidebarTab) => void
  setSelectedModel: (model: string) => void
  setAvailableModels: (models: string[]) => void
  toggleSidebar: () => void
  setOllamaStatus: (status: OllamaStatus) => void
  setSystemRam: (ram: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'chat',
  sidebarTab: 'chats',
  selectedModel: '',
  availableModels: [],
  sidebarCollapsed: false,
  ollamaStatus: 'checking',
  systemRam: 0,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setAvailableModels: (models) => set({ availableModels: models }),
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setOllamaStatus: (status) => set({ ollamaStatus: status }),
  setSystemRam: (ram) => set({ systemRam: ram }),
}))
